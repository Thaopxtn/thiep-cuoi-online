import { NextRequest, NextResponse } from "next/server";
import {
  getCardByIdOrSlugFromDb,
  upsertCardToDb,
  deleteCardFromDb,
} from "@/lib/serverDb";

export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

/**
 * GET /api/cards/[id]
 * Lấy chi tiết thiệp theo ID hoặc Slug
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
 * Cập nhật thông tin thiệp hoặc lưu bản thiết kế nodes mới
 */
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = params;
  try {
    const body = await request.json();

    // Multi-tenancy check: Bảo vệ quyền sở hữu thiệp
    const existing = await getCardByIdOrSlugFromDb(id);
    if (existing && existing.userId) {
      const requesterUserId = body.userId || request.headers.get("x-user-id");
      if (requesterUserId && requesterUserId !== existing.userId) {
        return NextResponse.json(
          { success: false, message: "Bạn không có quyền chỉnh sửa thiệp cưới này" },
          { status: 403 }
        );
      }
    }

    const updated = await upsertCardToDb({
      ...body,
      id,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Không thể cập nhật thiệp lên cơ sở dữ liệu" },
        { status: 500 }
      );
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
 * Xóa thiệp cưới và toàn bộ RSVP/Wishes liên quan
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = params;
  try {
    // Multi-tenancy check: Bảo vệ quyền xóa thiệp
    const existing = await getCardByIdOrSlugFromDb(id);
    if (existing && existing.userId) {
      const requesterUserId =
        request.nextUrl.searchParams.get("userId") || request.headers.get("x-user-id");
      if (requesterUserId && requesterUserId !== existing.userId) {
        return NextResponse.json(
          { success: false, message: "Bạn không có quyền xóa thiệp cưới này" },
          { status: 403 }
        );
      }
    }

    const ok = await deleteCardFromDb(id);
    if (!ok) {
      return NextResponse.json(
        { success: false, message: "Không thể xóa thiệp cưới từ cơ sở dữ liệu" },
        { status: 500 }
      );
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

