import { NextRequest, NextResponse } from "next/server";
import { getCardsFromDb } from "@/lib/serverDb";

export const dynamic = "force-dynamic";

/**
 * GET /api/cards/export-all
 * Xuất toàn bộ khách mời từ tất cả các thiệp cưới của tài khoản
 */
export async function GET() {
  try {
    const cards = await getCardsFromDb();
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
          String(stt++),
          `"${(card.name || "").replace(/"/g, '""')}"`,
          `"${(r.name || "").replace(/"/g, '""')}"`,
          `"${r.phone || ""}"`,
          r.attending ? "Có tham dự" : "Không thể đến",
          String(r.attending ? r.guests || 1 : 0),
          `"${(r.note || "").replace(/"/g, '""')}"`,
          `"${r.createdAt || ""}"`,
        ]);
      });
    });

    const csvContent = BOM + [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
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
      { success: false, message: error.message || "Lỗi xuất file" },
      { status: 500 }
    );
  }
}
