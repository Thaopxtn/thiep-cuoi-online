import { NextRequest, NextResponse } from "next/server";
import {
  generateAdminSessionToken,
  checkAdminRateLimit,
  recordAdminFailedAttempt,
  resetAdminRateLimit,
  getClientIp,
  verifyAdminAuth,
  getConfiguredAdminPasscode,
  isAdminAuthConfigured,
} from "@/lib/serverAuth";
import crypto from "crypto";

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
 * Hỗ trợ HttpOnly Cookie và Bearer Token
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
    // 2. Kiểm tra cấu hình an ninh hệ thống (Fail Closed nếu thiếu biến môi trường)
    if (!isAdminAuthConfigured()) {
      console.error("LỖI BẢO MẬT: ADMIN_PASSCODE hoặc ADMIN_SESSION_SECRET chưa được cấu hình!");
      return NextResponse.json(
        {
          success: false,
          message: "Hệ thống Quản trị viên chưa được cấu hình biến môi trường an toàn trên máy chủ.",
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { passcode } = body;

    const configuredPasscode = getConfiguredAdminPasscode();

    // 3. So khớp mã PIN bằng Timing-Safe Equal chống Timing Attack
    let isMatch = false;
    if (passcode && typeof passcode === "string") {
      try {
        const provBuf = Buffer.from(passcode.trim());
        const confBuf = Buffer.from(configuredPasscode);
        if (provBuf.length === confBuf.length) {
          isMatch = crypto.timingSafeEqual(provBuf, confBuf);
        }
      } catch {
        isMatch = false;
      }
    }

    if (!isMatch) {
      recordAdminFailedAttempt(clientIp);
      return NextResponse.json(
        { success: false, message: "Mã PIN Quản trị viên không chính xác!" },
        { status: 401 }
      );
    }

    // 4. Đăng nhập thành công -> Reset rate limit và sinh Token HMAC có chữ ký
    resetAdminRateLimit(clientIp);
    const token = generateAdminSessionToken();

    const response = NextResponse.json({
      success: true,
      message: "Xác thực Quản trị viên thành công!",
      token,
      expiresIn: 14400, // 4 giờ
    });

    // Thiết lập HttpOnly Cookie an toàn
    const isProd = process.env.NODE_ENV === "production";
    response.cookies.set("admin_session", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 14400,
    });

    return response;
  } catch (error: any) {
    console.error("Lỗi xác thực Admin:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi máy chủ khi xác thực" },
      { status: 500 }
    );
  }
}
