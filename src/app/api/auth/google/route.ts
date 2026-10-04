import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/google
 * Khởi tạo phiên Đăng nhập bằng Google qua Supabase Auth
 */
export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://yeqosgjxjeiitevaquoz.supabase.co";
  
  const host = request.headers.get("host") || "localhost:3005";
  const protocol = host.includes("localhost") ? "http" : "https";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;
  const callbackUrl = encodeURIComponent(`${siteUrl}/auth/callback`);

  const oauthUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${callbackUrl}`;
  return NextResponse.redirect(oauthUrl);
}
