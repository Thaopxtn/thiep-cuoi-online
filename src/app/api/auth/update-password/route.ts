import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/update-password
 * Cập nhật mật khẩu hoặc thông tin cá nhân của người dùng trên Supabase
 */
export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://yeqosgjxjeiitevaquoz.supabase.co";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";

  try {
    const body = await request.json();
    const { userId, newPassword, name } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Thiếu ID người dùng" },
        { status: 400 }
      );
    }

    if (newPassword && newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "Mật khẩu mới phải có tối thiểu 6 ký tự" },
        { status: 400 }
      );
    }

    const payload: Record<string, any> = {};
    if (newPassword) {
      payload.password = newPassword;
    }
    if (name) {
      payload.user_metadata = { full_name: name };
    }

    // Cập nhật thông qua Supabase Admin API
    const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      const errorMsg = data.message || data.error_description || "Không thể cập nhật mật khẩu";
      return NextResponse.json(
        { success: false, message: errorMsg },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Cập nhật mật khẩu thành công!",
      user: {
        id: data.id,
        email: data.email,
        name: data.user_metadata?.full_name || name,
      },
    });
  } catch (error: any) {
    console.error("Lỗi /api/auth/update-password:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi xử lý đổi mật khẩu" },
      { status: 500 }
    );
  }
}
