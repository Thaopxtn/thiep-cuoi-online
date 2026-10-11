import { NextRequest, NextResponse } from "next/server";
import { revokeAdminSessionToken } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/logout
 * Hủy phiên làm việc của Quản trị viên và xóa cookie admin_session
 */
export async function POST(request: NextRequest) {
  const token =
    request.cookies.get("admin_session")?.value ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    request.headers.get("x-admin-token") ||
    "";

  if (token) {
    revokeAdminSessionToken(token);
  }

  const response = NextResponse.json({
    success: true,
    message: "Đã đăng xuất phiên Quản trị viên",
  });

  response.cookies.set("admin_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
