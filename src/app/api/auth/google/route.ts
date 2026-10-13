import { NextRequest, NextResponse } from "next/server";
import { resolveOAuthRedirectOrigin } from "@/lib/securityUtils";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/google
 * Khởi tạo phiên Đăng nhập bằng Google qua Supabase Auth
 * Tự động chuyển đổi sang phiên an toàn nếu Google OAuth chưa được bật trên Supabase Dashboard
 * Đảm bảo redirect chính xác về tên miền thực tế của người dùng, không bao giờ nhảy nhầm về localhost trên production.
 */
export async function GET(request: NextRequest) {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "https://yeqosgjxjeiitevaquoz.supabase.co";

  const searchParams = request.nextUrl.searchParams;
  const originParam = searchParams.get("origin");

  // Trích xuất host và protocol thực tế từ proxy headers hoặc host header
  const forwardedHost = request.headers.get("x-forwarded-host");
  const hostHeader = forwardedHost || request.headers.get("host") || request.nextUrl.host;
  const forwardedProto =
    request.headers.get("x-forwarded-proto") ||
    (request.nextUrl.protocol ? request.nextUrl.protocol.replace(":", "") : "https");

  const siteUrl = resolveOAuthRedirectOrigin({
    requestHost: hostHeader,
    requestProto: forwardedProto,
    originParam,
    configuredSiteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  });

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
