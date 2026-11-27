import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/health
 * Lightweight HTTP healthcheck endpoint for container orchestration.
 * Does not query the database or reveal internal application details.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "healthy",
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}

export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
