import { NextRequest, NextResponse } from "next/server";
import {
  getCardsFromDb,
  deleteCardFromDb,
  updateCardStatusInDb,
  activateCardVipInDb,
  setCardVipInDb,
} from "@/lib/serverDb";
import { INITIAL_CARDS } from "@/data/initialCards";
import { verifyAdminAuth } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/cards
 * Lấy toàn bộ danh sách thiệp cưới trong hệ thống kèm thông tin chi tiết (Yêu cầu quyền Admin)
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, message: auth.error || "Không có quyền truy cập dữ liệu Quản trị viên" },
      { status: 401 }
    );
  }

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
      userId: c.userId,
      isVip: Boolean(c.isVip || (c.groom as any)?.isVip),
      plan: c.plan || (c.groom as any)?.plan || "free",
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
 * Cập nhật trạng thái thiệp cưới (Draft <-> Published) hoặc Gói VIP (Yêu cầu quyền Admin)
 */
export async function PATCH(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, message: auth.error || "Không có quyền quản trị thiệp" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { id, status, isVip } = body;

    if (isVip !== undefined && typeof isVip !== "boolean") {
      return NextResponse.json({ success: false, message: "Trạng thái VIP không hợp lệ" }, { status: 400 });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Thiếu ID thiệp cưới" },
        { status: 400 }
      );
    }

    const messages: string[] = [];

    // 1. Cập nhật trạng thái Xuất bản / Bản nháp nếu có
    if (status) {
      if (status !== "published" && status !== "draft") {
        return NextResponse.json(
          { success: false, message: "Trạng thái thiệp không hợp lệ" },
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
      messages.push(`Đổi trạng thái thành "${status === "published" ? "Đã xuất bản" : "Bản nháp"}"`);
    }

    // 2. Cập nhật trạng thái VIP nếu có
    if (isVip !== undefined) {
      if (isVip) {
        const vipRes = await activateCardVipInDb(id);
        if (!vipRes.success) {
          return NextResponse.json(
            { success: false, message: "Không thể kích hoạt VIP cho thiệp" },
            { status: 500 }
          );
        }
        messages.push("Đã nâng cấp VIP thành công");
      } else {
        const result = await setCardVipInDb(id, false);
        if (!result.success) return NextResponse.json({ success: false, message: "Không thể lưu hạ cấp VIP" }, { status: 500 });
        messages.push("Đã chuyển về gói thường (Free)");
      }
    }

    return NextResponse.json({
      success: true,
      message: messages.join(". ") || "Cập nhật thiệp thành công!",
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
 * Xóa vĩnh viễn thiệp cưới khỏi hệ thống (Yêu cầu quyền Admin)
 */
export async function DELETE(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, message: auth.error || "Không có quyền xóa thiệp quản trị" },
      { status: 401 }
    );
  }

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
