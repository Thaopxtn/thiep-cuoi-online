import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/login
 * Đăng nhập thủ công bằng Email và Mật khẩu qua Supabase Auth
 */
export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://yeqosgjxjeiitevaquoz.supabase.co";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "";

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập đầy đủ email và mật khẩu" },
        { status: 400 }
      );
    }

    const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password: password,
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      const errorMsg = data.error_description || data.msg || data.message || "Email hoặc mật khẩu không chính xác";
      return NextResponse.json(
        { success: false, message: errorMsg },
        { status: 400 }
      );
    }

    const user = data.user;
    const userProfile = {
      id: user.id,
      name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Người dùng",
      email: user.email,
      avatar: user.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop",
      provider: "email",
      accessToken: data.access_token,
      createdAt: user.created_at || new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: "Đăng nhập thành công!",
      user: userProfile,
      session: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      },
    });
  } catch (error: any) {
    console.error("Lỗi /api/auth/login:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi xử lý đăng nhập" },
      { status: 500 }
    );
  }
}
