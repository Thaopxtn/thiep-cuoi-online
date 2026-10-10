import { NextRequest, NextResponse } from "next/server";
import { getCardsFromDb, deleteCardFromDb, updateCardStatusInDb } from "@/lib/serverDb";
import { INITIAL_CARDS } from "@/data/initialCards";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/cards
 * Lấy toàn bộ danh sách thiệp cưới trong hệ thống kèm thông tin chi tiết
 */
export async function GET(request: NextRequest) {
  try {
    let cards = await getCardsFromDb();
    if (!cards || cards.length === 0) {
      cards = INITIAL_CARDS;
    }

    const formattedCards = cards.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      templateId: c.templateId,
      templateName: c.templateName || "Mẫu mặc định",
      status: c.status || "draft",
      views: c.views || 0,
      coverImage: c.coverImage,
      weddingDate: c.weddingDate,
      weddingTime: c.weddingTime,
      groomName: c.groom?.name || "Chú rể",
      brideName: c.bride?.name || "Cô dâu",
      groomPhone: c.groom?.phone || "",
      bridePhone: c.bride?.phone || "",
      rsvpsCount: Array.isArray(c.rsvps) ? c.rsvps.length : 0,
      wishesCount: Array.isArray(c.wishes) ? c.wishes.length : 0,
      updatedAt: c.updatedAt,
      musicTitle: c.musicTitle,
    }));

    return NextResponse.json({
      success: true,
      total: formattedCards.length,
      cards: formattedCards,
    });
  } catch (error: any) {
    console.error("Lỗi GET /api/admin/cards:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi tải danh sách thiệp" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/cards
 * Cập nhật trạng thái thiệp cưới (Draft <-> Published)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, message: "Thiếu ID hoặc trạng thái thiệp" },
        { status: 400 }
      );
    }

    const updated = await updateCardStatusInDb(id, status);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Không thể cập nhật trạng thái thiệp trên cơ sở dữ liệu" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Đã đổi trạng thái thiệp thành "${status === "published" ? "Đã xuất bản" : "Bản nháp"}"`,
    });
  } catch (error: any) {
    console.error("Lỗi PATCH /api/admin/cards:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi cập nhật thiệp" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/cards
 * Xóa vĩnh viễn thiệp cưới khỏi hệ thống
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Thiếu ID thiệp cưới cần xóa" },
        { status: 400 }
      );
    }

    const deleted = await deleteCardFromDb(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Không thể xóa thiệp trên cơ sở dữ liệu" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Đã xóa thiệp cưới thành công!",
    });
  } catch (error: any) {
    console.error("Lỗi DELETE /api/admin/cards:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi khi xóa thiệp cưới" },
      { status: 500 }
    );
  }
}
