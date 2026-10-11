import { NextRequest, NextResponse } from "next/server";
import {
  getCardByIdOrSlugFromDb,
  upsertCardToDb,
  deleteCardFromDb,
} from "@/lib/serverDb";
import { recordActivity } from "@/lib/activityService";
import { verifyUserAuth, verifyAdminAuth, isCardOwner } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

/**
 * GET /api/cards/[id]
 * Lấy chi tiết thiệp theo ID hoặc Slug
 * - Nếu thiệp ở trạng thái 'draft': Chỉ chủ sở hữu hoặc Quản trị viên mới được xem
 * - Nếu thiệp ở trạng thái 'published': Khách và công chúng đều xem được
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = params;
  try {
    const card = await getCardByIdOrSlugFromDb(id);
    if (!card) {
      return NextResponse.json(
        { success: false, message: `Không tìm thấy thiệp cưới với ID: ${id}` },
        { status: 404 }
      );
    }

    // Bảo vệ bản nháp (Draft) không để lộ công khai
    if (card.status === "draft") {
      const userAuth = await verifyUserAuth(request);
      const adminAuth = await verifyAdminAuth(request);

      const isOwner = userAuth.authenticated && userAuth.userId && isCardOwner(card, userAuth.userId);
      if (!isOwner && !adminAuth.authenticated) {
        return NextResponse.json(
          { success: false, message: "Thiệp cưới đang ở trạng thái bản nháp. Vui lòng đăng nhập với tài khoản chủ sở hữu để xem." },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      card,
    });
  } catch (error: any) {
    console.error(`GET /api/cards/${id} error:`, error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi tải chi tiết thiệp" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cards/[id]
 * Cập nhật thông tin thiệp hoặc lưu bản thiết kế nodes mới (Bảo vệ quyền sở hữu BOLA/IDOR)
 */
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = params;
  try {
    const userAuth = await verifyUserAuth(request);
    const adminAuth = await verifyAdminAuth(request);

    // 1. Bắt buộc đăng nhập tài khoản hoặc quyền Admin
    if (!userAuth.authenticated && !adminAuth.authenticated) {
      return NextResponse.json(
        { success: false, message: "Vui lòng đăng nhập để cập nhật hoặc lưu thiệp cưới." },
        { status: 401 }
      );
    }

    const existing = await getCardByIdOrSlugFromDb(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: `Không tìm thấy thiệp cưới với ID: ${id}` },
        { status: 404 }
      );
    }

    // 2. Multi-tenancy check: Xác thực quyền sở hữu thiệp
    const isOwner = userAuth.authenticated && userAuth.userId && isCardOwner(existing, userAuth.userId);
    if (!isOwner && !adminAuth.authenticated) {
      return NextResponse.json(
        { success: false, message: "Bạn không có quyền chỉnh sửa thiệp cưới của người dùng khác" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const token = request.headers.get("authorization")?.split(" ")[1];

    // Chặn người dùng tự thay đổi quyền sở hữu (userId) của thiệp
    const preservedUserId = existing.userId || (userAuth.authenticated ? userAuth.userId : body.userId);

    const updated = await upsertCardToDb(
      {
        ...body,
        userId: preservedUserId,
        id, // Đảm bảo ID không bị ghi đè
      },
      token
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Không thể cập nhật thiệp lên cơ sở dữ liệu" },
        { status: 500 }
      );
    }

    try {
      recordActivity({
        type: updated.status === "published" ? "card_publish" : "card_update",
        title: updated.status === "published" ? "Xuất bản thiệp cưới" : "Cập nhật thiết kế thiệp",
        actorName: updated.groom?.name || updated.bride?.name || "Người dùng",
        actorType: "user",
        targetName: updated.name,
        targetId: updated.id,
        targetSlug: updated.slug,
        details: `Cập nhật nội dung & thiết kế • Trạng thái: ${updated.status}`,
        metadata: {
          cardId: updated.id,
          status: updated.status,
          userId: updated.userId,
        },
      });
    } catch (e) {
      console.warn("Không thể ghi log activity Card Update:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Cập nhật thiệp cưới thành công",
      card: updated,
    });
  } catch (error: any) {
    console.error(`PUT /api/cards/${id} error:`, error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi cập nhật thiệp" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cards/[id]
 * Xóa thiệp cưới (Bảo vệ quyền sở hữu BOLA/IDOR)
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = params;
  try {
    const userAuth = await verifyUserAuth(request);
    const adminAuth = await verifyAdminAuth(request);

    // 1. Bắt buộc đăng nhập hoặc quyền Admin
    if (!userAuth.authenticated && !adminAuth.authenticated) {
      return NextResponse.json(
        { success: false, message: "Vui lòng đăng nhập để thực hiện xóa thiệp cưới." },
        { status: 401 }
      );
    }

    const existing = await getCardByIdOrSlugFromDb(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: `Không tìm thấy thiệp cưới với ID: ${id}` },
        { status: 404 }
      );
    }

    // 2. Xác thực quyền sở hữu
    const isOwner = userAuth.authenticated && userAuth.userId && isCardOwner(existing, userAuth.userId);
    if (!isOwner && !adminAuth.authenticated) {
      return NextResponse.json(
        { success: false, message: "Bạn không có quyền xóa thiệp cưới của người dùng khác" },
        { status: 403 }
      );
    }

    const token = request.headers.get("authorization")?.split(" ")[1];
    const ok = await deleteCardFromDb(id, token);
    if (!ok) {
      return NextResponse.json(
        { success: false, message: "Không thể xóa thiệp cưới từ cơ sở dữ liệu" },
        { status: 500 }
      );
    }

    try {
      recordActivity({
        type: "card_delete",
        title: "Xóa thiệp cưới",
        actorName: existing?.groom?.name || existing?.bride?.name || "Người dùng",
        actorType: "user",
        targetName: existing?.name || `Thiệp ${id}`,
        targetId: id,
        targetSlug: existing?.slug,
        details: `Đã xóa thiệp khỏi hệ thống`,
      });
    } catch (e) {
      console.warn("Không thể ghi log activity Card Delete:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Đã xóa thiệp cưới thành công",
      deletedId: id,
    });
  } catch (error: any) {
    console.error(`DELETE /api/cards/${id} error:`, error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi xóa thiệp" },
      { status: 500 }
    );
  }
}
