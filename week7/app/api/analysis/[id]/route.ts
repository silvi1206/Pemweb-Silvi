import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uuidSchema, updateAnalysisSchema } from "@/lib/validation";
import { encryptNote, decryptNote } from "@/lib/crypto/aead";
import { hasPermission } from "@/lib/auth/rbac";
import { getAuthContext } from "@/lib/auth/session";
import { validateCsrf } from "@/lib/auth/csrf";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/analysis/[id]
export async function GET(_request: Request, { params }: RouteContext) {
  const auth = await getAuthContext();

  try {
    const { id } = await params;
    const validation = uuidSchema.safeParse(id);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: "ID analisis tidak valid." },
        { status: 400 }
      );
    }

    const analysis = await prisma.analysis.findUnique({
      where: { id },
      include: {
        indicators: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!analysis) {
      return NextResponse.json(
        { success: false, message: "Data analisis tidak ditemukan." },
        { status: 404 }
      );
    }

    // Penegakan kepemilikan data & isolasi data warisan (IDOR Protection)
    if (auth.role === "admin") {
      // Admin diizinkan mengakses seluruh data
    } else if (auth.role === "user") {
      if (analysis.userId !== auth.userId) {
        return NextResponse.json(
          {
            success: false,
            message: "Akses ditolak (403 Forbidden): Anda tidak memiliki izin mengakses data analisis ini.",
          },
          { status: 403 }
        );
      }
    } else if (auth.role === "guest") {
      if (analysis.userId !== null) {
        return NextResponse.json(
          {
            success: false,
            message: "Akses ditolak (403 Forbidden): Tamu tidak diizinkan mengakses data analisis privat pengguna terdaftar.",
          },
          { status: 403 }
        );
      }
    }

    let decryptedNotes: string | null = null;
    if (analysis.encryptedNotes && auth.role !== "guest") {
      try {
        decryptedNotes = await decryptNote(analysis.encryptedNotes, analysis.id);
      } catch {
        return NextResponse.json(
          {
            success: false,
            message: "Integritas data catatan terenkripsi tidak valid atau kunci salah.",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...analysis,
          encryptedNotes: decryptedNotes,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching analysis by ID:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server saat mengambil data analisis.",
      },
      { status: 500 }
    );
  }
}

// PATCH /api/analysis/[id]
export async function PATCH(request: Request, { params }: RouteContext) {
  const csrf = await validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json(
      { success: false, message: `Akses ditolak (403 Forbidden): ${csrf.reason}` },
      { status: 403 }
    );
  }

  const auth = await getAuthContext();

  if (!hasPermission(auth.role, "analysis:update")) {
    return NextResponse.json(
      {
        success: false,
        message: `Akses ditolak (403 Forbidden): Peran "${auth.role}" tidak memiliki izin memperbarui data analisis.`,
      },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const idValidation = uuidSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        { success: false, message: "ID analisis tidak valid." },
        { status: 400 }
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

    const validationResult = updateAnalysisSchema.safeParse(body);
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

    const existing = await prisma.analysis.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Data analisis tidak ditemukan." },
        { status: 404 }
      );
    }

    const updateData: {
      recommendation?: string;
      riskScore?: number;
      isSafe?: boolean;
      encryptedNotes?: string | null;
    } = {};

    if (validationResult.data.recommendation !== undefined) {
      updateData.recommendation = validationResult.data.recommendation;
    }
    if (validationResult.data.riskScore !== undefined) {
      updateData.riskScore = Math.round(validationResult.data.riskScore);
    }
    if (validationResult.data.isSafe !== undefined) {
      updateData.isSafe = validationResult.data.isSafe;
    }
    if (validationResult.data.encryptedNotes !== undefined) {
      if (validationResult.data.encryptedNotes && validationResult.data.encryptedNotes.trim()) {
        updateData.encryptedNotes = await encryptNote(
          validationResult.data.encryptedNotes.trim(),
          id
        );
      } else {
        updateData.encryptedNotes = null;
      }
    }

    const updatedAnalysis = await prisma.analysis.update({
      where: { id },
      data: updateData,
      include: {
        indicators: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...updatedAnalysis,
          encryptedNotes: validationResult.data.encryptedNotes ?? null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating analysis record:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server saat memperbarui data analisis.",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/analysis/[id]
export async function DELETE(request: Request, { params }: RouteContext) {
  const csrf = await validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json(
      { success: false, message: `Akses ditolak (403 Forbidden): ${csrf.reason}` },
      { status: 403 }
    );
  }

  const auth = await getAuthContext();

  if (!hasPermission(auth.role, "analysis:delete")) {
    return NextResponse.json(
      {
        success: false,
        message: `Akses ditolak (403 Forbidden): Peran "${auth.role}" tidak memiliki izin menghapus data analisis.`,
      },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;

    const idValidation = uuidSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        { success: false, message: "ID analisis tidak valid." },
        { status: 400 }
      );
    }

    const existing = await prisma.analysis.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Data analisis tidak ditemukan." },
        { status: 404 }
      );
    }

    await prisma.analysis.delete({ where: { id } });

    return NextResponse.json(
      { success: true, message: "Data analisis berhasil dihapus." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting analysis record:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server saat menghapus data analisis.",
      },
      { status: 500 }
    );
  }
}
