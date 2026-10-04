import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/register
 * Đăng ký tài khoản mới bằng Email và Mật khẩu qua Supabase Auth
 */
export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://yeqosgjxjeiitevaquoz.supabase.co";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";

  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Vui lòng cung cấp email và mật khẩu" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Mật khẩu phải có ít nhất 6 ký tự" },
        { status: 400 }
      );
    }

    // Đăng ký qua Supabase
    const res = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
        data: {
          full_name: (name || "Người dùng").trim(),
        },
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      const errorMsg = data.error_description || data.msg || data.message || "Không thể đăng ký tài khoản";
      return NextResponse.json(
        { success: false, message: errorMsg },
        { status: 400 }
      );
    }

    const user = data.user || data;
    const userProfile = {
      id: user.id,
      name: (name || "Người dùng").trim(),
      email: user.email,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop",
      provider: "email",
      accessToken: data.access_token || "",
      createdAt: user.created_at || new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: "Đăng ký tài khoản thành công!",
      user: userProfile,
      session: data.access_token
        ? {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Lỗi /api/auth/register:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi xử lý đăng ký" },
      { status: 500 }
    );
  }
}
