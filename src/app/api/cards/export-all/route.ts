import { NextRequest, NextResponse } from "next/server";
import { getCardsFromDb } from "@/lib/serverDb";
import { verifyUserAuth, verifyAdminAuth } from "@/lib/serverAuth";
import { sanitizeCsvField } from "@/lib/securityUtils";

export const dynamic = "force-dynamic";

/**
 * GET /api/cards/export-all
 * Xuất toàn bộ khách mời từ tất cả các thiệp cưới thuộc tài khoản đã đăng nhập
 * Bảo vệ: Bắt buộc xác thực danh tính + Chống CSV Formula Injection
 */
export async function GET(request: NextRequest) {
  try {
    const userAuth = await verifyUserAuth(request);
    const adminAuth = await verifyAdminAuth(request);

    // 1. Bắt buộc đăng nhập tài khoản hoặc quyền Admin
    if (!userAuth.authenticated && !adminAuth.authenticated) {
      return NextResponse.json(
        { success: false, message: "Vui lòng đăng nhập để xuất danh sách khách mời tổng hợp." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    // Nếu là Admin, có thể truyền userId cụ thể để xuất; nếu là người dùng thông thường, chỉ xuất thiệp của chính họ
    const targetUserId = adminAuth.authenticated
      ? searchParams.get("userId") || undefined
      : userAuth.userId;

    const token = request.headers.get("authorization")?.split(" ")[1];
    const cards = await getCardsFromDb(targetUserId, token);

    const BOM = "\uFEFF";
    const headers = [
      "STT",
      "Thiệp cưới",
      "Họ và tên khách",
      "Số điện thoại",
      "Trạng thái",
      "Số người",
      "Lời nhắn",
      "Thời gian gửi",
    ];

    let stt = 1;
    const rows: string[][] = [];

    cards.forEach((card) => {
      (card.rsvps || []).forEach((r) => {
        rows.push([
          sanitizeCsvField(stt++),
          sanitizeCsvField(card.name || ""),
          sanitizeCsvField(r.name || ""),
          sanitizeCsvField(r.phone || ""),
          sanitizeCsvField(r.attending ? "Có tham dự" : "Không thể đến"),
          sanitizeCsvField(r.attending ? r.guests || 1 : 0),
          sanitizeCsvField(r.note || ""),
          sanitizeCsvField(r.createdAt || ""),
        ]);
      });
    });

    const csvContent =
      BOM +
      [headers.map(sanitizeCsvField).join(","), ...rows.map((row) => row.join(","))].join("\r\n");
    const fileName = `tong-hop-khach-moi-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("GET /api/cards/export-all error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi xuất file tổng hợp" },
      { status: 500 }
    );
  }
}
