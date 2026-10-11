import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/refresh
 * Làm mới access_token khi phiên làm việc hết hạn
 */
export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "";

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json(
      { success: false, message: "Chưa cấu hình Supabase Auth trên máy chủ" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken || typeof refreshToken !== "string") {
      return NextResponse.json(
        { success: false, message: "Thiếu refresh_token" },
        { status: 400 }
      );
    }

    const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
      },
      body: JSON.stringify({
        refresh_token: refreshToken.trim(),
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return NextResponse.json(
        { success: false, message: data.error_description || data.message || "Refresh token không hợp lệ hoặc đã hết hạn" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    });
  } catch (error: any) {
    console.error("POST /api/auth/refresh error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi xử lý refresh token" },
      { status: 500 }
    );
  }
}
