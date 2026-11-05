import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAnalysisSchema } from "@/lib/validation";

export async function GET() {
  try {
    const analyses = await prisma.analysis.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: analyses,
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

export async function POST(request: Request) {
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
    const { url, riskScore, isSafe, recommendation, sha256, hmac } =
      validationResult.data;

    const analysis = await prisma.analysis.create({
      data: {
        url,
        riskScore: Math.round(riskScore),
        isSafe,
        recommendation,
        sha256,
        hmac,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: analysis,
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
