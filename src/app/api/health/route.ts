import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/health
 * Lightweight liveness probe for Docker, Kubernetes, and uptime monitoring services.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "zenlove-wedding",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}
