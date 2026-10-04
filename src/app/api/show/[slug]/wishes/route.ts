import { NextRequest, NextResponse } from "next/server";
import { getCardByIdOrSlugFromDb, createWishInDb, getWishesFromDb } from "@/lib/serverDb";

export const dynamic = "force-dynamic";

interface Params {
  params: { slug: string };
}

/**
 * GET /api/show/[slug]/wishes
 * Lấy danh sách lời chúc mừng của thiệp
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { slug } = params;
  try {
    const card = await getCardByIdOrSlugFromDb(slug);
    if (!card) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy thiệp" },
        { status: 404 }
      );
    }

    const wishes = await getWishesFromDb(card.id);
    return NextResponse.json({
      success: true,
      count: wishes.length,
      wishes,
    });
  } catch (error: any) {
    console.error(`GET /api/show/${slug}/wishes error:`, error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi lấy danh sách lời chúc" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/show/[slug]/wishes
 * Khách gửi lời chúc vào Sổ lưu bút điện tử
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { slug } = params;
  try {
    const body = await request.json();
    const { name, content } = body;

    if (!name || !content) {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập tên và nội dung lời chúc" },
        { status: 400 }
      );
    }

    const card = await getCardByIdOrSlugFromDb(slug);
    if (!card) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy thiệp cưới tương ứng" },
        { status: 404 }
      );
    }

    const savedWish = await createWishInDb({
      cardId: card.id,
      name: name.trim(),
      content: content.trim(),
    });

    if (!savedWish) {
      return NextResponse.json(
        { success: false, message: "Không thể lưu lời chúc vào hệ thống" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Cảm ơn bạn đã gửi lời chúc yêu thương!",
      wish: savedWish,
    });
  } catch (error: any) {
    console.error(`POST /api/show/${slug}/wishes error:`, error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi gửi lời chúc" },
      { status: 500 }
    );
  }
}
