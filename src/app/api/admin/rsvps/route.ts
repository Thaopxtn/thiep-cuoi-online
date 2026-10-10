import { NextRequest, NextResponse } from "next/server";
import { getCardsFromDb, getAllRsvpsFromDb, deleteRsvpFromDb } from "@/lib/serverDb";
import { INITIAL_CARDS } from "@/data/initialCards";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/rsvps
 * Lấy danh sách toàn bộ phản hồi RSVP của tất cả đám cưới
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cardIdFilter = searchParams.get("cardId");

    let cards = await getCardsFromDb();
    if (!cards || cards.length === 0) {
      cards = INITIAL_CARDS;
    }

    const cardMap = new Map<string, { name: string; slug: string }>();
    cards.forEach((c) => {
      cardMap.set(c.id, { name: c.name, slug: c.slug });
    });

    let rsvps = await getAllRsvpsFromDb();
    if (!rsvps || rsvps.length === 0) {
      rsvps = cards.flatMap((c) =>
        (c.rsvps || []).map((r) => ({
          ...r,
          cardId: c.id,
        }))
      );
    }

    let enrichedRsvps = rsvps.map((r) => {
      const cardInfo = cardMap.get(r.cardId) || { name: "Thiệp chưa đặt tên", slug: "" };
      return {
        ...r,
        cardName: cardInfo.name,
        cardSlug: cardInfo.slug,
      };
    });

    if (cardIdFilter) {
      enrichedRsvps = enrichedRsvps.filter((r) => r.cardId === cardIdFilter);
    }

    return NextResponse.json({
      success: true,
      total: enrichedRsvps.length,
      rsvps: enrichedRsvps,
    });
  } catch (error: any) {
    console.error("Lỗi GET /api/admin/rsvps:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi tải danh sách RSVP" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/rsvps
 * Xóa một bản ghi RSVP
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Thiếu ID phản hồi RSVP cần xóa" },
        { status: 400 }
      );
    }

    const deleted = await deleteRsvpFromDb(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Không thể xóa RSVP trên cơ sở dữ liệu" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Đã xóa phản hồi RSVP thành công!",
    });
  } catch (error: any) {
    console.error("Lỗi DELETE /api/admin/rsvps:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi khi xóa RSVP" },
      { status: 500 }
    );
  }
}
