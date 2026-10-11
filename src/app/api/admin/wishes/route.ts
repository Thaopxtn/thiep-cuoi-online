import { NextRequest, NextResponse } from "next/server";
import { getCardsFromDb, getAllWishesFromDb, deleteWishFromDb } from "@/lib/serverDb";
import { INITIAL_CARDS } from "@/data/initialCards";
import { verifyAdminAuth } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/wishes
 * Lấy toàn bộ lời chúc mừng từ Sổ lưu bút của tất cả đám cưới (Yêu cầu quyền Admin)
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, message: auth.error || "Không có quyền xem toàn bộ sổ lưu bút quản trị" },
      { status: 401 }
    );
  }

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

    let wishes = await getAllWishesFromDb();
    if (!wishes || wishes.length === 0) {
      wishes = cards.flatMap((c) =>
        (c.wishes || []).map((w) => ({
          ...w,
          cardId: c.id,
        }))
      );
    }

    let enrichedWishes = wishes.map((w) => {
      const cardInfo = cardMap.get(w.cardId) || { name: "Thiệp chưa đặt tên", slug: "" };
      return {
        ...w,
        cardName: cardInfo.name,
        cardSlug: cardInfo.slug,
      };
    });

    if (cardIdFilter) {
      enrichedWishes = enrichedWishes.filter((w) => w.cardId === cardIdFilter);
    }

    return NextResponse.json({
      success: true,
      total: enrichedWishes.length,
      wishes: enrichedWishes,
    });
  } catch (error: any) {
    console.error("Lỗi GET /api/admin/wishes:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi tải danh sách lời chúc" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/wishes
 * Xóa một lời chúc khỏi hệ thống (Yêu cầu quyền Admin)
 */
export async function DELETE(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, message: auth.error || "Không có quyền xóa lời chúc" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Thiếu ID lời chúc cần xóa" },
        { status: 400 }
      );
    }

    const deleted = await deleteWishFromDb(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Không thể xóa lời chúc trên cơ sở dữ liệu" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Đã xóa lời chúc thành công!",
    });
  } catch (error: any) {
    console.error("Lỗi DELETE /api/admin/wishes:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi khi xóa lời chúc" },
      { status: 500 }
    );
  }
}
