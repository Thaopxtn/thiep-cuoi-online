import { NextRequest, NextResponse } from "next/server";
import { getCardByIdOrSlugFromDb, createWishInDb, getWishesFromDb, isDbConfigured } from "@/lib/serverDb";
import { INITIAL_CARDS, WeddingCard } from "@/data/initialCards";
import { recordActivity } from "@/lib/activityService";

export const dynamic = "force-dynamic";

interface Params {
  params: { slug: string };
}

/**
 * Tìm kiếm thiệp cưới hợp lệ theo slug hoặc id
 * Không tự tạo thiệp ma (ghost cards)
 */
async function findPublishedCard(slug: string): Promise<WeddingCard | null> {
  const card = await getCardByIdOrSlugFromDb(slug);
  if (card) return card;

  // Chỉ dùng dữ liệu mẫu khi chạy offline; production phải có bản ghi thật trong DB.
  if (isDbConfigured) return null;

  const localFound = INITIAL_CARDS.find((c) => c.slug === slug || c.id === slug);
  if (localFound) return localFound;

  return null;
}

/**
 * GET /api/show/[slug]/wishes
 * Lấy danh sách lời chúc mừng của thiệp
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { slug } = params;
  try {
    const card = await findPublishedCard(slug);
    if (!card) {
      return NextResponse.json(
        { success: false, message: "Thiệp cưới không tồn tại" },
        { status: 404 }
      );
    }

    if (card.status !== "published") {
      return NextResponse.json(
        { success: false, message: "Thiệp cưới chưa được xuất bản" },
        { status: 403 }
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

    // 1. Honeypot chống bot tự động spam
    if (w_field_trap) {
      return NextResponse.json({
        success: true,
        message: "Cảm ơn bạn đã gửi lời chúc mừng!",
      });
    }

    // 2. Validation dữ liệu đầu vào
    const cleanName = String(name || "").trim();
    const cleanContent = String(content || "").trim();

    if (!cleanName || cleanName.length < 2 || cleanName.length > 100) {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập tên người gửi hợp lệ (2 - 100 ký tự)" },
        { status: 400 }
      );
    }

    if (!cleanContent || cleanContent.length < 2 || cleanContent.length > 1000) {
      return NextResponse.json(
        { success: false, message: "Nội dung lời chúc cần có độ dài từ 2 đến 1000 ký tự" },
        { status: 400 }
      );
    }

    // 3. Tìm thiệp thực tế trong hệ thống
    const card = await findPublishedCard(slug);
    if (!card) {
      return NextResponse.json(
        { success: false, message: "Thiệp cưới không tồn tại hoặc đường link không hợp lệ" },
        { status: 404 }
      );
    }

    if (card.status !== "published") {
      return NextResponse.json(
        { success: false, message: "Thiệp cưới đang ở trạng thái bản nháp và chưa nhận lời chúc" },
        { status: 400 }
      );
    }

    // 4. Lưu lời chúc vào cơ sở dữ liệu
    const savedWish = await createWishInDb({
      cardId: card.id,
      name: cleanName,
      content: cleanContent,
    });

    if (!savedWish) {
      return NextResponse.json(
        { success: false, message: "Không thể lưu lời chúc vào hệ thống" },
        { status: 500 }
      );
    }

    // Ghi nhận sự kiện hoạt động
    try {
      recordActivity({
        type: "wish_submit",
        title: "Khách gửi lời chúc phúc",
        actorName: savedWish.name,
        actorType: "guest",
        targetName: card.name,
        targetId: card.id,
        targetSlug: card.slug,
        details: `"${savedWish.content.slice(0, 100)}${savedWish.content.length > 100 ? "..." : ""}"`,
        metadata: {
          cardId: card.id,
        },
      });
    } catch (e) {
      console.warn("Không thể ghi log activity Wish:", e);
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
