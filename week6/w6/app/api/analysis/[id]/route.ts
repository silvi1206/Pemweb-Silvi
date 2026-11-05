import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uuidSchema, updateAnalysisSchema } from "@/lib/validation";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/analysis/[id]
export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const validation = uuidSchema.safeParse(id);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: "ID analisis tidak valid." },
        { status: 400 }
      );
    }

    const analysis = await prisma.analysis.findUnique({ where: { id } });
    if (!analysis) {
      return NextResponse.json(
        { success: false, message: "Data analisis tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: analysis },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching analysis by ID:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server saat mengambil data analisis."
      },
      { status: 500 }
    );
  }
}

// PATCH /api/analysis/[id]
export async function PATCH(request: Request, { params }: RouteContext) {
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
          message: "Format JSON tidak valid pada request body."
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
          errors: validationResult.error.flatten().fieldErrors
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

    const updatedAnalysis = await prisma.analysis.update({
      where: { id },
      data: validationResult.data
    });

    return NextResponse.json(
      { success: true, data: updatedAnalysis },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating analysis record:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server saat memperbarui data analisis."
      },
      { status: 500 }
    );
  }
}

// DELETE /api/analysis/[id]
export async function DELETE(request: Request, { params }: RouteContext) {
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
        message: "Terjadi kesalahan pada server saat menghapus data analisis."
      },
      { status: 500 }
    );
  }
}
