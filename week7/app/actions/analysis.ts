"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { encryptNote, decryptNote } from "@/lib/crypto/aead";
import { hasPermission } from "@/lib/auth/rbac";
import { getAuthContext } from "@/lib/auth/session";
import {
  createAnalysisSchema,
  updateAnalysisSchema,
  uuidSchema,
  type CreateAnalysisInput,
  type UpdateAnalysisInput,
} from "@/lib/validation";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Abaikan jika dipanggil di luar konteks Next.js request store (seperti lingkungan automated test)
  }
}

export interface ActionResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

/**
 * Server Action: Membuat record analisis baru beserta indikator-indikatornya.
 * Memeriksa izin 'analysis:create' (diizinkan untuk 'user' dan 'admin', ditolak untuk 'guest').
 */
export async function createAnalysisAction(
  rawInput: CreateAnalysisInput
): Promise<ActionResult> {
  const auth = await getAuthContext();

  if (!hasPermission(auth.role, "analysis:create")) {
    return {
      success: false,
      message: `Akses ditolak (403 Forbidden): Peran "${auth.role}" tidak memiliki izin membuat dan menyimpan analisis.`,
    };
  }

  const validation = createAnalysisSchema.safeParse(rawInput);
  if (!validation.success) {
    return {
      success: false,
      message: "Validasi data analisis gagal.",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  try {
    const { url, riskScore, isSafe, recommendation, sha256, hmac, encryptedNotes, indicators } =
      validation.data;

    // Tentukan ID record di awal agar AAD terikat secara deterministik
    const analysisId = crypto.randomUUID();
    let cipherNotes: string | null = null;
    if (encryptedNotes && encryptedNotes.trim()) {
      cipherNotes = await encryptNote(encryptedNotes.trim(), analysisId);
    }

    const analysis = await prisma.analysis.create({
      data: {
        id: analysisId,
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

    safeRevalidate("/history");
    safeRevalidate("/analyze");

    return {
      success: true,
      message: "Hasil analisis berhasil disimpan ke database.",
      data: {
        ...analysis,
        encryptedNotes: encryptedNotes ?? null,
      },
    };
  } catch (error) {
    console.error("Gagal menyimpan analisis via Server Action:", error);
    return {
      success: false,
      message: "Terjadi kesalahan internal server saat menyimpan data analisis.",
    };
  }
}

/**
 * Server Action: Mengambil daftar analisis URL.
 * Menegakkan isolasi data (RBAC):
 * - Admin: Melihat seluruh riwayat analisis (history:read_all).
 * - User: Hanya melihat riwayat analisis miliknya sendiri (userId matching).
 * - Guest: Hanya melihat analisis publik (userId is null) tanpa catatan terenkripsi.
 */
export async function getAnalysesAction(): Promise<ActionResult> {
  const auth = await getAuthContext();

  try {
    let whereClause = {};

    if (auth.role === "admin") {
      // Admin melihat semua riwayat
      whereClause = {};
    } else if (auth.role === "user") {
      // User hanya melihat data miliknya sendiri
      whereClause = { userId: auth.userId };
    } else {
      // Guest hanya melihat riwayat publik/anonim
      whereClause = { userId: null };
    }

    const records = await prisma.analysis.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        indicators: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    // Dekripsi catatan secara aman di sisi server sesuai peran
    const processedRecords = await Promise.all(
      records.map(async (record) => {
        // Guest tidak diberikan akses catatan privat
        if (auth.role === "guest") {
          return {
            ...record,
            encryptedNotes: null,
          };
        }

        let decryptedNotes: string | null = null;
        if (record.encryptedNotes) {
          try {
            decryptedNotes = await decryptNote(record.encryptedNotes, record.id);
          } catch {
            decryptedNotes = "[Gagal Dekripsi: Format Tidak Valid / Belum Dimigrasi]";
          }
        }
        return {
          ...record,
          encryptedNotes: decryptedNotes,
        };
      })
    );

    return {
      success: true,
      message: "Berhasil mengambil data riwayat analisis.",
      data: processedRecords,
    };
  } catch (error) {
    console.error("Gagal mengambil riwayat via Server Action:", error);
    return {
      success: false,
      message: "Gagal memuat data riwayat dari database.",
    };
  }
}

/**
 * Server Action: Mengambil detail sebuah analisis berdasarkan UUID.
 * Memverifikasi kepemilikan data (mencegah IDOR):
 * - Admin: Mengakses detail semua analisis.
 * - User: Hanya mengakses analisis miliknya sendiri (atau analisis publik).
 * - Guest: Hanya mengakses analisis publik tanpa catatan terenkripsi.
 */
export async function getAnalysisByIdAction(
  id: string
): Promise<ActionResult> {
  const auth = await getAuthContext();

  const idValidation = uuidSchema.safeParse(id);
  if (!idValidation.success) {
    return {
      success: false,
      message: "ID analisis tidak valid.",
    };
  }

  try {
    const analysis = await prisma.analysis.findUnique({
      where: { id },
      include: {
        indicators: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!analysis) {
      return {
        success: false,
        message: "Data analisis tidak ditemukan.",
      };
    }

    // Pengecekan otorisasi kepemilikan data & isolasi data warisan
    if (auth.role === "admin") {
      // Admin diizinkan mengakses seluruh data
    } else if (auth.role === "user") {
      // User biasa hanya diizinkan mengakses data miliknya sendiri (userId === auth.userId)
      // Data warisan (userId: null) maupun data pengguna lain ditolak secara tegas (403 Forbidden)
      if (analysis.userId !== auth.userId) {
        return {
          success: false,
          message: "Akses ditolak (403 Forbidden): Anda tidak memiliki izin mengakses data analisis ini.",
        };
      }
    } else {
      // Guest hanya boleh melihat data yang memang ditetapkan publik (userId: null)
      if (analysis.userId !== null) {
        return {
          success: false,
          message: "Akses ditolak (403 Forbidden): Tamu tidak diizinkan mengakses data analisis privat pengguna terdaftar.",
        };
      }
    }

    let decryptedNotes: string | null = null;
    if (analysis.encryptedNotes && auth.role !== "guest") {
      try {
        decryptedNotes = await decryptNote(analysis.encryptedNotes, analysis.id);
      } catch (err) {
        console.error("Gagal dekripsi catatan pada getAnalysisByIdAction:", err);
        return {
          success: false,
          message: "Gagal memuat catatan terenkripsi: Integritas data tidak valid atau kunci salah.",
        };
      }
    }

    return {
      success: true,
      message: "Data analisis berhasil ditemukan.",
      data: {
        ...analysis,
        encryptedNotes: decryptedNotes,
      },
    };
  } catch (error) {
    console.error("Gagal mengambil analisis by ID via Server Action:", error);
    return {
      success: false,
      message: "Terjadi kesalahan server saat mengambil detail analisis.",
    };
  }
}

/**
 * Server Action: Memperbarui record analisis (rekomendasi, riskScore, catatan).
 * Memeriksa izin 'analysis:update' (hanya diizinkan untuk 'admin').
 */
export async function updateAnalysisAction(
  id: string,
  rawInput: UpdateAnalysisInput
): Promise<ActionResult> {
  const auth = await getAuthContext();

  if (!hasPermission(auth.role, "analysis:update")) {
    return {
      success: false,
      message: `Akses ditolak (403 Forbidden): Peran "${auth.role}" tidak memiliki izin memperbarui data analisis.`,
    };
  }

  const idValidation = uuidSchema.safeParse(id);
  if (!idValidation.success) {
    return {
      success: false,
      message: "ID analisis tidak valid.",
    };
  }

  const validation = updateAnalysisSchema.safeParse(rawInput);
  if (!validation.success) {
    return {
      success: false,
      message: "Validasi pembaruan analisis gagal.",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  try {
    const existing = await prisma.analysis.findUnique({ where: { id } });
    if (!existing) {
      return {
        success: false,
        message: "Data analisis tidak ditemukan.",
      };
    }

    // Tangani enkripsi encryptedNotes jika field disertakan dalam pembaruan
    const updateData: {
      recommendation?: string;
      riskScore?: number;
      isSafe?: boolean;
      encryptedNotes?: string | null;
    } = {};

    if (validation.data.recommendation !== undefined) {
      updateData.recommendation = validation.data.recommendation;
    }
    if (validation.data.riskScore !== undefined) {
      updateData.riskScore = Math.round(validation.data.riskScore);
    }
    if (validation.data.isSafe !== undefined) {
      updateData.isSafe = validation.data.isSafe;
    }
    if (validation.data.encryptedNotes !== undefined) {
      if (validation.data.encryptedNotes && validation.data.encryptedNotes.trim()) {
        updateData.encryptedNotes = await encryptNote(
          validation.data.encryptedNotes.trim(),
          id
        );
      } else {
        updateData.encryptedNotes = null;
      }
    }

    const updated = await prisma.analysis.update({
      where: { id },
      data: updateData,
      include: {
        indicators: true,
      },
    });

    safeRevalidate("/history");
    safeRevalidate(`/history/${id}`);

    return {
      success: true,
      message: "Data analisis berhasil diperbarui.",
      data: {
        ...updated,
        encryptedNotes: validation.data.encryptedNotes ?? null,
      },
    };
  } catch (error) {
    console.error("Gagal memperbarui analisis via Server Action:", error);
    return {
      success: false,
      message: "Terjadi kesalahan server saat memperbarui analisis.",
    };
  }
}

/**
 * Server Action: Menghapus record analisis (otomatis cascade ke indikator).
 * Memeriksa izin 'analysis:delete' (hanya diizinkan untuk 'admin').
 */
export async function deleteAnalysisAction(
  id: string
): Promise<ActionResult> {
  const auth = await getAuthContext();

  if (!hasPermission(auth.role, "analysis:delete")) {
    return {
      success: false,
      message: `Akses ditolak (403 Forbidden): Peran "${auth.role}" tidak memiliki izin menghapus data analisis.`,
    };
  }

  const idValidation = uuidSchema.safeParse(id);
  if (!idValidation.success) {
    return {
      success: false,
      message: "ID analisis tidak valid.",
    };
  }

  try {
    const existing = await prisma.analysis.findUnique({ where: { id } });
    if (!existing) {
      return {
        success: false,
        message: "Data analisis tidak ditemukan.",
      };
    }

    // Modul 7 (Perbaikan Galat 2 & 3 - Issue #12, #13):
    // Keputusan produk: seluruh indikator keamanan terkait ikut terhapus bersama analisis induknya
    // secara atomik dalam satu transaksi (keduanya berhasil atau keduanya batal, mencegah P2003).
    await prisma.$transaction([
      prisma.analysisIndicator.deleteMany({ where: { analysisId: id } }),
      prisma.analysis.delete({ where: { id } }),
    ]);

    safeRevalidate("/history");

    return {
      success: true,
      message: "Data analisis dan seluruh indikator terkait berhasil dihapus.",
    };
  } catch (error) {
    console.error("Gagal menghapus analisis via Server Action:", error);
    return {
      success: false,
      message: "Terjadi kesalahan server saat menghapus data analisis.",
    };
  }
}

/**
 * Server Action Form Hapus Analisis (Modul 7 — Perbaikan Galat 2 & 3):
 * - Menghapus indikator berelasi dan analisis induk dalam satu prisma.$transaction([])
 * - Galat tak terduga (misalnya P2025 saat record sudah dihapus di tab lain) tidak ditelan:
 *   dicatat di terminal dan ditangkap oleh app/history/[id]/error.tsx
 * - redirect("/history") dipanggil di luar try/catch karena redirect() melempar NEXT_REDIRECT
 */
export async function hapusAnalysisFormAction(id: string): Promise<void> {
  await prisma.$transaction([
    prisma.analysisIndicator.deleteMany({ where: { analysisId: id } }),
    prisma.analysis.delete({ where: { id } }),
  ]);

  safeRevalidate("/history");
  redirect("/history");
}
