import { NextResponse } from "next/server";
import { registerAction } from "@/app/actions/auth";
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

    const body = await request.json();
    const result = await registerAction(body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("API Auth Register Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
