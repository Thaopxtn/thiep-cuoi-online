import { NextRequest, NextResponse } from "next/server";
import { getUsersWithStatsFromDb } from "@/lib/serverDb";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/users
 * Lấy danh sách toàn bộ tài khoản người dùng đăng ký và số thiệp đã tạo
 */
export async function GET(request: NextRequest) {
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
