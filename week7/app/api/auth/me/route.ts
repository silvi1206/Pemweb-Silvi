import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Tidak ada sesi aktif (Guest).",
          data: null,
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Sesi aktif ditemukan.",
        data: session,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Auth Me Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
