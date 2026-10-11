import { NextRequest, NextResponse } from "next/server";
import { getUsersWithStatsFromDb } from "@/lib/serverDb";
import { verifyAdminAuth } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/users
 * Lấy danh sách toàn bộ tài khoản người dùng đăng ký và số thiệp đã tạo (Yêu cầu quyền Admin)
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, message: auth.error || "Không có quyền xem danh sách người dùng hệ thống" },
      { status: 401 }
    );
  }

  try {
    const users = await getUsersWithStatsFromDb();

    return NextResponse.json({
      success: true,
      total: users.length,
      users,
    });
  } catch (error: any) {
    console.error("Lỗi GET /api/admin/users:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi tải danh sách người dùng" },
      { status: 500 }
    );
  }
}
