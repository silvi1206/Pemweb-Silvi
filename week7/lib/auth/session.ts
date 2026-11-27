import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Role, AuthContext } from "./rbac";

export const SESSION_COOKIE_NAME = "cybershield_session";
export const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 hari

export interface SessionData {
  userId: string;
  email: string;
  name: string;
  role: Role;
  sessionId?: string;
  exp?: number;
  iat?: number;
}

// ==========================================
// 1. Server-Side Session Helpers (PostgreSQL)
// ==========================================

/**
 * Menghasilkan token sesi mentah (raw token) berukuran 32-byte acak dari CSPRNG (64 karakter heksadesimal).
 */
export function generateRawToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Menghasilkan hash SHA-256 dari token mentah untuk disimpan di PostgreSQL.
 * Token mentah tidak pernah disimpan di basis data.
 */
export function hashSessionToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Membuat entri sesi baru di database PostgreSQL.
 * Menyimpan hash SHA-256 token dan mengembalikan token mentah untuk disematkan ke cookie klien.
 */
export async function createDatabaseSession(
  userId: string,
  expiresInSeconds = SESSION_DURATION_SECONDS
): Promise<{ rawToken: string; session: { id: string; expiresAt: Date } }> {
  const rawToken = generateRawToken();
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
    select: {
      id: true,
      expiresAt: true,
    },
  });

  return { rawToken, session };
}

/**
 * Memvalidasi token sesi terhadap database PostgreSQL.
 * Memastikan token belum kedaluwarsa, belum dicabut (revoked), dan akun pengguna masih aktif.
 * Mengembalikan SessionData jika valid, atau null jika gagal (Fail-Closed).
 */
export async function validateSessionToken(rawToken: string): Promise<SessionData | null> {
  if (!rawToken || typeof rawToken !== "string") {
    return null;
  }

  // Validasi format: Token mentah wajib berupa 64-karakter heksadesimal (32-byte CSPRNG)
  if (!/^[0-9a-fA-F]{64}$/.test(rawToken)) {
    return null;
  }

  const tokenHash = hashSessionToken(rawToken);

  try {
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!session) {
      return null; // Session tidak ditemukan di database
    }

    if (session.revokedAt !== null) {
      return null; // Session telah dicabut (Revoked)
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      return null; // Session telah kedaluwarsa (Expired)
    }

    if (!session.user) {
      return null; // Pengguna telah dihapus dari sistem
    }

    return {
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role as Role,
      sessionId: session.id,
      exp: Math.floor(session.expiresAt.getTime() / 1000),
      iat: Math.floor(session.createdAt.getTime() / 1000),
    };
  } catch (error) {
    console.error("Gagal memvalidasi sesi basis data:", error);
    return null;
  }
}

/**
 * Mencabut sesi aktif berdasarkan token mentah (Logout).
 */
export async function revokeSessionByToken(rawToken: string): Promise<boolean> {
  if (!rawToken || !/^[0-9a-fA-F]{64}$/.test(rawToken)) {
    return false;
  }

  const tokenHash = hashSessionToken(rawToken);
  try {
    const res = await prisma.session.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
    return res.count > 0;
  } catch (error) {
    console.error("Gagal mencabut sesi via token:", error);
    return false;
  }
}

/**
 * Mencabut sesi aktif berdasarkan Session ID (Admin Revocation).
 */
export async function revokeSessionById(sessionId: string): Promise<boolean> {
  try {
    const res = await prisma.session.updateMany({
      where: {
        id: sessionId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
    return res.count > 0;
  } catch (error) {
    console.error("Gagal mencabut sesi via ID:", error);
    return false;
  }
}

/**
 * Mencabut seluruh sesi aktif milik pengguna tertentu (Admin Force Logout / Security Invalidation).
 */
export async function revokeAllUserSessions(userId: string): Promise<number> {
  try {
    const res = await prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
    return res.count;
  } catch (error) {
    console.error("Gagal mencabut seluruh sesi pengguna:", error);
    return 0;
  }
}

// ==========================================
// 2. Cookie Management & Request Context
// ==========================================

// Helper internal khusus pengujian untuk menyuntikkan token sesi saat cookies() tidak tersedia (Vitest)
let internalTestToken: string | null = null;

/**
 * Helper internal khusus pengujian untuk menyimulasikan cookie sesi pada environment terisolasi.
 * Token ini TETAP divalidasi secara penuh terhadap basis data PostgreSQL (bukan bypass peran).
 * Fungsi ini BUKAN Server Action dan tidak dapat diakses oleh klien publik.
 */
export function _setTestSessionCookie(token: string | null): void {
  internalTestToken = token;
}

export function _getTestSessionCookie(): string | null {
  return internalTestToken;
}

/**
 * Mendapatkan data sesi pengguna aktif dari cookie HTTP melalui verifikasi database.
 * Tidak mempercayai payload cookie secara langsung.
 */
export async function getSessionUser(): Promise<SessionData | null> {
  let tokenValue: string | undefined;

  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (sessionCookie && sessionCookie.value) {
      tokenValue = sessionCookie.value;
    }
  } catch {
    // Di luar HTTP request store (misal CLI atau pengujian unit terisolasi)
    if (internalTestToken) {
      tokenValue = internalTestToken;
    }
  }

  if (tokenValue) {
    return await validateSessionToken(tokenValue);
  }

  return null;
}

/**
 * Mengambil konteks autentikasi dan peran (Guest, User, Admin) murni melalui validasi sesi database.
 * Fail-closed: Mengembalikan { role: "guest" } jika tidak ada sesi aktif yang valid di basis data.
 * Bebas dari parameter overrideAuth dan bebas dari bypass berbasis variabel lingkungan.
 */
export async function getAuthContext(): Promise<AuthContext> {
  const session = await getSessionUser();
  if (session) {
    return {
      userId: session.userId,
      role: session.role,
    };
  }

  // Default bagi pengunjung tanpa login / sesi tidak valid
  return {
    role: "guest",
  };
}

/**
 * Menyimpan token sesi mentah ke dalam HTTP-only secure cookie.
 */
export async function setSessionCookie(
  token: string,
  maxAge = SESSION_DURATION_SECONDS
): Promise<void> {
  internalTestToken = token;
  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });
  } catch {
    // Abaikan jika dipanggil di luar konteks Next.js request store (seperti lingkungan unit test)
  }
}

/**
 * Menghapus cookie sesi saat proses logout.
 */
export async function clearSessionCookie(): Promise<void> {
  internalTestToken = null;
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch {
    // Abaikan jika dipanggil di luar konteks Next.js request store
  }
}

// ==========================================
// 3. Cryptographic Token Utilities (Legacy/HMAC)
// ==========================================

function getSessionSecret(): Buffer {
  const secretStr =
    process.env.SESSION_SECRET ||
    process.env.HMAC_SECRET_KEY ||
    process.env.AEAD_ENCRYPTION_KEY_HEX ||
    "cybershield-secret-session-salt-fallback-2026";
  return createHash("sha256").update(secretStr).digest();
}

/**
 * Utilitas kriptografis: Membuat token sesi bertanda tangan HMAC-SHA-256 (Base64URL).
 */
export function createSessionToken(
  data: Omit<SessionData, "exp" | "iat">,
  expiresInSeconds = SESSION_DURATION_SECONDS
): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInSeconds;
  const payload: SessionData = { ...data, exp, iat };

  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const hmac = createHmac("sha256", getSessionSecret());
  hmac.update(payloadB64);
  const sigB64 = hmac.digest("base64url");

  return `${payloadB64}.${sigB64}`;
}

/**
 * Utilitas kriptografis: Memverifikasi integritas tanda tangan HMAC-SHA-256 token.
 */
export function verifySessionToken(token: string): SessionData | null {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [payloadB64, sigB64] = parts;

  const hmac = createHmac("sha256", getSessionSecret());
  hmac.update(payloadB64);
  const expectedSigB64 = hmac.digest("base64url");

  const sigBuf = Buffer.from(sigB64, "utf8");
  const expectedSigBuf = Buffer.from(expectedSigB64, "utf8");

  if (sigBuf.length !== expectedSigBuf.length) {
    return null;
  }

  if (!timingSafeEqual(sigBuf, expectedSigBuf)) {
    return null;
  }

  try {
    const jsonStr = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload = JSON.parse(jsonStr) as SessionData;

    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === "number" && payload.exp < now) {
      return null;
    }

    if (!payload.userId || !payload.role) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
