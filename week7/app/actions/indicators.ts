"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/auth/rbac";
import { getAuthContext } from "@/lib/auth/session";
import {
  createIndicatorSchema,
  updateIndicatorSchema,
  uuidSchema,
  type CreateIndicatorInput,
  type UpdateIndicatorInput,
} from "@/lib/validation";
import type { ActionResult } from "./analysis";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Abaikan di luar Next request context (seperti saat unit test)
  }
}

/**
 * Server Action: Menambahkan indikator baru ke sebuah analisis (Entitas Kedua).
 * Memeriksa izin 'indicator:create' (hanya diizinkan untuk 'admin').
 */
export async function createIndicatorAction(
  rawInput: CreateIndicatorInput
): Promise<ActionResult> {
  const auth = await getAuthContext();

  if (!hasPermission(auth.role, "indicator:create")) {
    return {
      success: false,
      message: `Akses ditolak (403 Forbidden): Peran "${auth.role}" tidak memiliki izin membuat indikator keamanan.`,
    };
  }

  const validation = createIndicatorSchema.safeParse(rawInput);
  if (!validation.success) {
    return {
      success: false,
      message: "Validasi indikator gagal.",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  try {
    const { analysisId, type, status, isAlert, detail } = validation.data;

    const parentAnalysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
    });

    if (!parentAnalysis) {
      return {
        success: false,
        message: "Data analisis induk tidak ditemukan.",
      };
    }

    const indicator = await prisma.analysisIndicator.create({
      data: {
        analysisId,
        type,
        status,
        isAlert,
        detail,
      },
    });

    safeRevalidate(`/history/${analysisId}`);
    safeRevalidate("/history");

    return {
      success: true,
      message: "Indikator keamanan berhasil ditambahkan.",
      data: indicator,
    };
  } catch (error) {
    console.error("Gagal membuat indikator via Server Action:", error);
    return {
      success: false,
      message: "Terjadi kesalahan server saat menyimpan indikator.",
    };
  }
}

/**
 * Server Action: Mengambil detail indikator berdasarkan ID.
 * Memvalidasi sesi, permission, dan kepemilikan parent Analysis (IDOR Protection).
 */
export async function getIndicatorByIdAction(
  id: string
): Promise<ActionResult> {
  const auth = await getAuthContext();

  const idValidation = uuidSchema.safeParse(id);
  if (!idValidation.success) {
    return {
      success: false,
      message: "ID indikator tidak valid.",
    };
  }

  try {
    const indicator = await prisma.analysisIndicator.findUnique({
      where: { id },
      include: {
        analysis: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!indicator) {
      return {
        success: false,
        message: "Indikator tidak ditemukan.",
      };
    }

    // Validasi otorisasi & kepemilikan parent Analysis (Mencegah IDOR)
    if (auth.role === "admin") {
      // Admin diizinkan membaca seluruh indikator
    } else if (auth.role === "user") {
      // User hanya dapat membaca indikator jika parent analysis miliknya
      if (indicator.analysis.userId !== auth.userId) {
        return {
          success: false,
          message: "Akses ditolak (403 Forbidden): Anda tidak memiliki izin mengakses indikator milik pengguna lain.",
        };
      }
    } else {
      // Guest ditolak membaca indikator jika parent analysis privat (memiliki userId)
      if (indicator.analysis.userId !== null) {
        return {
          success: false,
          message: "Akses ditolak (403 Forbidden): Tamu tidak diizinkan mengakses indikator analisis privat.",
        };
      }
    }

    return {
      success: true,
      message: "Indikator berhasil ditemukan.",
      data: indicator,
    };
  } catch (error) {
    console.error("Gagal mengambil indikator via Server Action:", error);
    return {
      success: false,
      message: "Terjadi kesalahan server saat memuat indikator.",
    };
  }
}

/**
 * Server Action: Memperbarui data indikator keamanan (Entitas Kedua).
 * Memeriksa izin 'indicator:update' (hanya diizinkan untuk 'admin') dan memvalidasi keberadaan entitas.
 */
export async function updateIndicatorAction(
  id: string,
  rawInput: UpdateIndicatorInput
): Promise<ActionResult> {
  const auth = await getAuthContext();

  if (!hasPermission(auth.role, "indicator:update")) {
    return {
      success: false,
      message: `Akses ditolak (403 Forbidden): Peran "${auth.role}" tidak memiliki izin memperbarui indikator keamanan.`,
    };
  }

  const idValidation = uuidSchema.safeParse(id);
  if (!idValidation.success) {
    return {
      success: false,
      message: "ID indikator tidak valid.",
    };
  }

  const validation = updateIndicatorSchema.safeParse(rawInput);
  if (!validation.success) {
    return {
      success: false,
      message: "Validasi pembaruan indikator gagal.",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  try {
    const existing = await prisma.analysisIndicator.findUnique({
      where: { id },
      include: {
        analysis: {
          select: { id: true, userId: true },
        },
      },
    });

    if (!existing) {
      return {
        success: false,
        message: "Indikator tidak ditemukan.",
      };
    }

    // Pengecekan kepemilikan defensif
    if (auth.role !== "admin" && existing.analysis.userId !== auth.userId) {
      return {
        success: false,
        message: "Akses ditolak (403 Forbidden): Anda tidak memiliki wewenang memperbarui indikator ini.",
      };
    }

    const updated = await prisma.analysisIndicator.update({
      where: { id },
      data: validation.data,
    });

    safeRevalidate(`/history/${existing.analysisId}`);
    safeRevalidate("/history");

    return {
      success: true,
      message: "Indikator berhasil diperbarui.",
      data: updated,
    };
  } catch (error) {
    console.error("Gagal memperbarui indikator via Server Action:", error);
    return {
      success: false,
      message: "Terjadi kesalahan server saat memperbarui indikator.",
    };
  }
}

/**
 * Server Action: Menghapus indikator tertentu tanpa menghapus analisis induk.
 * Memeriksa izin 'indicator:delete' (hanya diizinkan untuk 'admin') dan memvalidasi keberadaan entitas.
 */
export async function deleteIndicatorAction(
  id: string
): Promise<ActionResult> {
  const auth = await getAuthContext();

  if (!hasPermission(auth.role, "indicator:delete")) {
    return {
      success: false,
      message: `Akses ditolak (403 Forbidden): Peran "${auth.role}" tidak memiliki izin menghapus indikator keamanan.`,
    };
  }

  const idValidation = uuidSchema.safeParse(id);
  if (!idValidation.success) {
    return {
      success: false,
      message: "ID indikator tidak valid.",
    };
  }

  try {
    const existing = await prisma.analysisIndicator.findUnique({
      where: { id },
      include: {
        analysis: {
          select: { id: true, userId: true },
        },
      },
    });

    if (!existing) {
      return {
        success: false,
        message: "Indikator tidak ditemukan.",
      };
    }

    // Pengecekan kepemilikan defensif
    if (auth.role !== "admin" && existing.analysis.userId !== auth.userId) {
      return {
        success: false,
        message: "Akses ditolak (403 Forbidden): Anda tidak memiliki wewenang menghapus indikator ini.",
      };
    }

    await prisma.analysisIndicator.delete({
      where: { id },
    });

    safeRevalidate(`/history/${existing.analysisId}`);
    safeRevalidate("/history");

    return {
      success: true,
      message: "Indikator berhasil dihapus.",
    };
  } catch (error) {
    console.error("Gagal menghapus indikator via Server Action:", error);
    return {
      success: false,
      message: "Terjadi kesalahan server saat menghapus indikator.",
    };
  }
}
