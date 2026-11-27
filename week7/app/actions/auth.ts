"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  SESSION_COOKIE_NAME,
  createDatabaseSession,
  revokeSessionByToken,
  revokeAllUserSessions,
  setSessionCookie,
  clearSessionCookie,
  getSessionUser,
  getAuthContext,
  _getTestSessionCookie,
  type SessionData,
} from "@/lib/auth/session";
import {
  registerSchema,
  loginSchema,
  type RegisterInput,
  type LoginInput,
} from "@/lib/validation";
import type { ActionResult } from "./analysis";

/**
 * Server Action: Pendaftaran akun pengguna baru CyberShield.
 * Kata sandi di-hash menggunakan algoritma Scrypt dengan salt 16-byte CSPRNG.
 * Sesi server-side dibuat di basis data PostgreSQL dengan token hash SHA-256.
 */
export async function registerAction(
  rawInput: RegisterInput
): Promise<ActionResult<{ user: { id: string; email: string; name: string; role: string } }>> {
  const validation = registerSchema.safeParse(rawInput);
  if (!validation.success) {
    return {
      success: false,
      message: "Validasi pendaftaran gagal. Periksa kembali formulir Anda.",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = validation.data;

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return {
        success: false,
        message: "Email sudah terdaftar. Silakan gunakan email lain atau login.",
        errors: {
          email: ["Email sudah terdaftar dalam sistem."],
        },
      };
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "user",
      },
    });

    // Buat sesi server-side di basis data PostgreSQL
    const { rawToken } = await createDatabaseSession(user.id);
    await setSessionCookie(rawToken);

    return {
      success: true,
      message: "Pendaftaran akun CyberShield berhasil.",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    };
  } catch (error) {
    console.error("Gagal registrasi pengguna:", error);
    return {
      success: false,
      message: "Terjadi kesalahan pada server saat memproses pendaftaran.",
    };
  }
}

/**
 * Server Action: Autentikasi pengguna (Login).
 * Memverifikasi hash kata sandi Scrypt dengan perbandingan timing-safe.
 * Membuat sesi berstatus aktif di PostgreSQL dan mengirimkan token mentah hanya via HttpOnly cookie.
 */
export async function loginAction(
  rawInput: LoginInput
): Promise<ActionResult<{ user: { id: string; email: string; name: string; role: string } }>> {
  const validation = loginSchema.safeParse(rawInput);
  if (!validation.success) {
    return {
      success: false,
      message: "Format email atau kata sandi tidak valid.",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validation.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        success: false,
        message: "Email atau kata sandi tidak cocok.",
      };
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return {
        success: false,
        message: "Email atau kata sandi tidak cocok.",
      };
    }

    // Buat sesi server-side di PostgreSQL
    const { rawToken } = await createDatabaseSession(user.id);
    await setSessionCookie(rawToken);

    return {
      success: true,
      message: `Selamat datang kembali, ${user.name}!`,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    };
  } catch (error) {
    console.error("Gagal proses login:", error);
    return {
      success: false,
      message: "Terjadi kesalahan internal saat memproses autentikasi.",
    };
  }
}

/**
 * Server Action: Mengakhiri sesi pengguna (Logout).
 * Hanya membaca token sesi dari HttpOnly cookie browser (tanpa parameter publik).
 * Mencabut status sesi di PostgreSQL (revokedAt) dan menghapus cookie dari browser.
 */
export async function logoutAction(): Promise<ActionResult> {
  try {
    let token: string | undefined;
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    } catch {
      // Di luar konteks HTTP request store (misal Vitest)
      const testToken = _getTestSessionCookie();
      if (testToken) {
        token = testToken;
      }
    }

    if (token) {
      await revokeSessionByToken(token);
    }

    await clearSessionCookie();
    return {
      success: true,
      message: "Sesi berhasil diakhiri (Logout sukses).",
    };
  } catch (error) {
    console.error("Gagal proses logout:", error);
    return {
      success: false,
      message: "Gagal menghapus sesi.",
    };
  }
}

/**
 * Server Action: Administrator mencabut seluruh sesi aktif milik pengguna target.
 * Wajib memperoleh identitas murni dari validasi sesi database (tanpa parameter callerAuth).
 */
export async function revokeUserSessionsAction(
  targetUserId: string
): Promise<ActionResult<{ revokedCount: number }>> {
  try {
    const auth = await getAuthContext();
    if (auth.role !== "admin") {
      return {
        success: false,
        message: "Akses ditolak (403 Forbidden): Hanya administrator yang dapat mencabut sesi pengguna.",
      };
    }

    const count = await revokeAllUserSessions(targetUserId);
    return {
      success: true,
      message: `Berhasil mencabut ${count} sesi aktif pengguna.`,
      data: { revokedCount: count },
    };
  } catch (error) {
    console.error("Gagal mencabut sesi pengguna oleh admin:", error);
    return {
      success: false,
      message: "Terjadi kesalahan pada server saat mencabut sesi pengguna.",
    };
  }
}

/**
 * Server Action: Mengambil informasi sesi aktif dari cookie melalui verifikasi basis data.
 */
export async function getCurrentUserAction(): Promise<ActionResult<SessionData | null>> {
  try {
    const session = await getSessionUser();
    return {
      success: true,
      message: session ? "Sesi aktif ditemukan." : "Tidak ada sesi aktif (Guest).",
      data: session,
    };
  } catch (error) {
    console.error("Gagal memeriksa sesi pengguna:", error);
    return {
      success: false,
      message: "Gagal memuat status autentikasi.",
      data: null,
    };
  }
}
