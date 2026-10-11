import { NextRequest, NextResponse } from "next/server";
import {
  generateAdminSessionToken,
  checkAdminRateLimit,
  recordAdminFailedAttempt,
  resetAdminRateLimit,
  getClientIp,
  verifyAdminAuth,
  CONFIGURED_ADMIN_PASSCODE,
} from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/verify
 * Kiểm tra xem session token hiện tại của Quản trị viên có còn hiệu lực hay không
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, authenticated: false, message: auth.error || "Chưa xác thực" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    authenticated: true,
    message: "Phiên quản trị viên hợp lệ",
  });
}

/**
 * POST /api/admin/verify
 * Xác thực mã PIN Quản trị viên và cấp HMAC-SHA256 session token
 */
export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);

  // 1. Kiểm tra Rate Limiting chống Brute-force
  const rateLimit = checkAdminRateLimit(clientIp);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        message: `Bạn đã thử sai quá nhiều lần. Vui lòng thử lại sau ${rateLimit.retryAfter || 900} giây.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfter || 900),
        },
      }
    );
  }

  try {
    const body = await request.json();
    const { passcode } = body;

    // 2. Kiểm tra cấu hình môi trường
    const isProd = process.env.NODE_ENV === "production";
    const configuredPasscode = CONFIGURED_ADMIN_PASSCODE;

    if (isProd && (!configuredPasscode || configuredPasscode === "zenlove8888")) {
      console.error("CẢNH BÁO: ADMIN_PASSCODE chưa được thiết lập an toàn trên môi trường Production!");
      return NextResponse.json(
        {
          success: false,
          message: "Hệ thống Quản trị viên chưa được cấu hình biến môi trường ADMIN_PASSCODE an toàn trên Production.",
        },
        { status: 503 }
      );
    }

    // 3. So khớp mã PIN (hỗ trợ so sánh an toàn)
    if (!passcode || String(passcode).trim() !== configuredPasscode.trim()) {
      recordAdminFailedAttempt(clientIp);
      return NextResponse.json(
        { success: false, message: "Mã PIN Quản trị viên không chính xác!" },
        { status: 401 }
      );
    }

    // 4. Đăng nhập thành công -> Reset rate limit và sinh Token HMAC có chữ ký
    resetAdminRateLimit(clientIp);
    const token = generateAdminSessionToken();

    return NextResponse.json({
      success: true,
      message: "Xác thực Quản trị viên thành công!",
      token,
      expiresIn: 86400 * 7, // 7 ngày
    });
  } catch (error: any) {
    console.error("Lỗi xác thực Admin:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi máy chủ khi xác thực" },
      { status: 500 }
    );
  }
}
