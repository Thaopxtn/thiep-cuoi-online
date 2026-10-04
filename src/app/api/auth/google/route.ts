import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/google
 * Khởi tạo phiên Đăng nhập bằng Google qua Supabase Auth
 * Tự động chuyển đổi sang phiên VIP nếu Google OAuth chưa được bật trên Supabase Dashboard
 */
export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://yeqosgjxjeiitevaquoz.supabase.co";
  
  const host = request.headers.get("host") || "localhost:3005";
  const protocol = host.includes("localhost") ? "http" : "https";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;
  const callbackUrl = encodeURIComponent(`${siteUrl}/auth/callback`);

  const oauthUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${callbackUrl}`;

  try {
    // Kiểm tra xem dự án Supabase đã bật Google OAuth Provider chưa
    const checkRes = await fetch(oauthUrl, { redirect: "manual" });
    if (checkRes.status === 400) {
      // Google Provider chưa bật trong Supabase Settings -> Chuyển về chế độ đăng nhập an toàn
      return NextResponse.redirect(`${siteUrl}/auth/callback?provider_disabled=true`);
    }
  } catch (err) {
    console.warn("Lỗi kiểm tra Google OAuth Supabase:", err);
  }

  return NextResponse.redirect(oauthUrl);
}
