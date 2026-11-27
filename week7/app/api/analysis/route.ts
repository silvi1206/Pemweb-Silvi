import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAnalysisSchema } from "@/lib/validation";
import { encryptNote, decryptNote } from "@/lib/crypto/aead";
import { hasPermission } from "@/lib/auth/rbac";
import { getAuthContext } from "@/lib/auth/session";
import { validateCsrf } from "@/lib/auth/csrf";

/**
 * GET /api/analysis
 * RBAC:
 * - Admin: Membaca seluruh data analisis (history:read_all).
 * - User: Hanya membaca data analisis miliknya sendiri.
 * - Guest: Hanya membaca data analisis publik (tanpa catatan privat).
 */
export async function GET() {
  const auth = await getAuthContext();

  try {
    let whereClause = {};
    if (auth.role === "admin") {
      whereClause = {};
    } else if (auth.role === "user") {
      whereClause = { userId: auth.userId };
    } else {
      whereClause = { userId: null };
    }

    const analyses = await prisma.analysis.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        indicators: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    const processed = await Promise.all(
      analyses.map(async (item) => {
        if (auth.role === "guest") {
          return {
            ...item,
            encryptedNotes: null,
          };
        }

        let note: string | null = null;
        if (item.encryptedNotes) {
          try {
            note = await decryptNote(item.encryptedNotes, item.id);
          } catch {
            note = "[Gagal Dekripsi: Format Tidak Valid / Belum Dimigrasi]";
          }
        }
        return {
          ...item,
          encryptedNotes: note,
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        data: processed,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching analysis records:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data analisis.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analysis
 * RBAC: Memeriksa izin 'analysis:create' (User & Admin diizinkan, Guest ditolak 403).
 */
export async function POST(request: Request) {
  const csrf = await validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json(
      { success: false, message: `Akses ditolak (403 Forbidden): ${csrf.reason}` },
      { status: 403 }
    );
  }

  const auth = await getAuthContext();

  if (!hasPermission(auth.role, "analysis:create")) {
    return NextResponse.json(
      {
        success: false,
        message: `Akses ditolak (403 Forbidden): Peran "${auth.role}" tidak memiliki izin membuat dan menyimpan analisis.`,
      },
      { status: 403 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Format JSON tidak valid pada request body.",
      },
      { status: 400 }
    );
  }

  const validationResult = createAnalysisSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Validasi gagal. Periksa kembali data yang dikirim.",
        errors: validationResult.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  try {
    const { url, riskScore, isSafe, recommendation, sha256, hmac, encryptedNotes, indicators } =
      validationResult.data;

    const recordId = crypto.randomUUID();
    let cipherNotes: string | null = null;
    if (encryptedNotes && encryptedNotes.trim()) {
      cipherNotes = await encryptNote(encryptedNotes.trim(), recordId);
    }

    const analysis = await prisma.analysis.create({
      data: {
        id: recordId,
        url,
        riskScore: Math.round(riskScore),
        isSafe,
        recommendation,
        sha256,
        hmac,
        encryptedNotes: cipherNotes,
        userId: auth.userId && auth.userId !== "test-admin-id" ? auth.userId : null,
        indicators: indicators && indicators.length > 0
          ? {
              create: indicators.map((ind) => ({
                type: ind.type,
                status: ind.status,
                isAlert: ind.isAlert,
                detail: ind.detail,
              })),
            }
          : undefined,
      },
      include: {
        indicators: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...analysis,
          encryptedNotes: encryptedNotes ?? null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating analysis record:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server saat menyimpan hasil analisis.",
      },
      { status: 500 }
    );
  }
}
