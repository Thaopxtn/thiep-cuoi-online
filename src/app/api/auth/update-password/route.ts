import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/update-password
 * Cập nhật mật khẩu hoặc thông tin cá nhân của người dùng trên Supabase
 */
export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";

  try {
    const body = await request.json();
    const { userId, newPassword, name } = body;
    const token = request.headers.get("authorization")?.split(" ")[1];

    if (!userId || !token) {
      return NextResponse.json(
        { success: false, message: "Yêu cầu đăng nhập hoặc thiếu ID" },
        { status: 401 }
      );
    }

    if (newPassword && newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "Mật khẩu mới phải có tối thiểu 6 ký tự" },
        { status: 400 }
      );
    }

    // Xác thực JWT token của người dùng (chống giả mạo userId)
    if (supabaseUrl) {
      const authRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!authRes.ok) {
        return NextResponse.json({ success: false, message: "Phiên đăng nhập không hợp lệ" }, { status: 401 });
      }
      const authData = await authRes.json();
      if (authData.id !== userId) {
        return NextResponse.json({ success: false, message: "Bạn không có quyền sửa thông tin tài khoản này" }, { status: 403 });
      }
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
      const errorMsg = data.message || data.error_description || "Không thể cập nhật thông tin";
      return NextResponse.json(
        { success: false, message: errorMsg },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: newPassword ? "Cập nhật mật khẩu thành công!" : "Cập nhật hồ sơ thành công!",
      user: {
        id: data.id,
        email: data.email,
        name: data.user_metadata?.full_name || name,
      },
    });
  } catch (error: any) {
    console.error("Lỗi /api/auth/update-password:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi xử lý hệ thống" },
      { status: 500 }
    );
  }
}
