import { NextRequest, NextResponse } from "next/server";
import { getCardByIdOrSlugFromDb, createWishInDb, getWishesFromDb, upsertCardToDb } from "@/lib/serverDb";
import { INITIAL_CARDS, WeddingCard } from "@/data/initialCards";

export const dynamic = "force-dynamic";

interface Params {
  params: { slug: string };
}

/**
 * Lấy hoặc tự động tạo bản ghi thiệp trong DB nếu chưa có (tránh 404 cho khách khi gửi lời chúc)
 */
async function ensureCardForSlug(slug: string): Promise<WeddingCard | null> {
  let card = await getCardByIdOrSlugFromDb(slug);
  if (card) return card;

  // 1. Kiểm tra INITIAL_CARDS
  const localFound = INITIAL_CARDS.find((c) => c.slug === slug || c.id === slug);
  if (localFound) {
    const upserted = await upsertCardToDb(localFound);
    return upserted || localFound;
  }

  // 2. Tạo bản ghi thiệp dự phòng
  const fallbackCard: WeddingCard = {
    id: slug,
    slug: slug,
    name: `Thiệp Cưới (${slug})`,
    templateId: slug,
    templateName: "Thiệp Cưới Online",
    status: "published",
    updatedAt: new Date().toLocaleDateString("vi-VN"),
    views: 1,
    coverImage: "",
    story: "",
    weddingDate: "2026-11-20",
    weddingTime: "11:00",
    lunarDate: "",
    groom: { name: "Chú Rể", title: "Chú Rể", phone: "" },
    bride: { name: "Cô Dâu", title: "Cô Dâu", phone: "" },
    events: [],
    album: [],
    musicTitle: "",
    musicUrl: "",
    rsvps: [],
    wishes: [],
  };

  try {
    const upserted = await upsertCardToDb(fallbackCard);
    return upserted || fallbackCard;
  } catch {
    return fallbackCard;
  }
}

/**
 * GET /api/show/[slug]/wishes
 * Lấy danh sách lời chúc mừng của thiệp
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { slug } = params;
  try {
    const card = await ensureCardForSlug(slug);
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
    const { name, content, w_field_trap } = body;

    // Honeypot chống bot tự động spam
    if (w_field_trap) {
      return NextResponse.json({
        success: true,
        message: "Cảm ơn bạn đã gửi lời chúc mừng!",
      });
    }

    if (!name || !content) {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập tên và nội dung lời chúc" },
        { status: 400 }
      );
    }

    const card = await ensureCardForSlug(slug);
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
