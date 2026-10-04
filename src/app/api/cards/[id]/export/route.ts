import { NextRequest, NextResponse } from "next/server";
import { getCardByIdOrSlugFromDb, getRsvpsFromDb } from "@/lib/serverDb";

export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

/**
 * GET /api/cards/[id]/export
 * Xuất danh sách khách mời xác nhận tham dự thành file CSV chuẩn UTF-8 (Excel tương thích 100%)
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = params;
  try {
    const card = await getCardByIdOrSlugFromDb(id);
    if (!card) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy thiệp cưới" },
        { status: 404 }
      );
    }

    const rsvps = await getRsvpsFromDb(card.id);

    // Header UTF-8 Byte Order Mark (\uFEFF) giúp Excel mở file không bao giờ bị lỗi font tiếng Việt
    const BOM = "\uFEFF";
    const headers = ["STT", "Họ và tên", "Số điện thoại", "Trạng thái", "Số người", "Lời nhắn", "Thời gian gửi"];

    const rows = rsvps.map((r, index) => [
      String(index + 1),
      `"${(r.name || "").replace(/"/g, '""')}"`,
      `"${r.phone || ""}"`,
      r.attending ? "Có tham dự" : "Không thể đến",
      String(r.attending ? r.guests || 1 : 0),
      `"${(r.note || "").replace(/"/g, '""')}"`,
      `"${r.createdAt || ""}"`,
    ]);

    const csvContent = BOM + [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");

    const safeSlug = (card.slug || "thiep-cuoi").replace(/[^a-zA-Z0-9-_]/g, "_");
    const fileName = `danh-sach-khach-moi-${safeSlug}-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error(`GET /api/cards/${id}/export error:`, error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi xuất danh sách khách mời" },
      { status: 500 }
    );
  }
}
