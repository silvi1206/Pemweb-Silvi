import { NextResponse } from "next/server";
import { logoutAction } from "@/app/actions/auth";
import { validateCsrf } from "@/lib/auth/csrf";

export async function POST(request: Request) {
  try {
    const csrf = await validateCsrf(request);
    if (!csrf.valid) {
      return NextResponse.json(
        { success: false, message: `Akses ditolak (403 Forbidden): ${csrf.reason}` },
        { status: 403 }
      );
    }

    const result = await logoutAction();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("API Auth Logout Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
