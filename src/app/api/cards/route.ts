import { NextRequest, NextResponse } from "next/server";
import { getCardsFromDb, upsertCardToDb } from "@/lib/serverDb";
import { INITIAL_CARDS } from "@/data/initialCards";
import { recordActivity } from "@/lib/activityService";

export const dynamic = "force-dynamic";

/**
 * GET /api/cards
 * Lấy danh sách toàn bộ thiệp cưới của người dùng từ Supabase Database
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const token = request.headers.get("authorization")?.split(" ")[1];
    
    const cards = await getCardsFromDb(userId || undefined, token);
    if (userId) {
      // Khi đã đăng nhập, chỉ trả về đúng danh sách thiệp của người dùng đó (kể cả rỗng)
      return NextResponse.json({
        success: true,
        source: "database",
        count: cards.length,
        cards: cards || [],
      });
    }

    if (cards && cards.length > 0) {
      return NextResponse.json({
        success: true,
        source: "database",
        count: cards.length,
        cards,
      });
    }

    // Nếu khách vãng lai và database chưa có thiệp, trả về danh sách mẫu mặc định
    return NextResponse.json({
      success: true,
      source: "fallback",
      count: INITIAL_CARDS.length,
      cards: INITIAL_CARDS,
    });
  } catch (error: any) {
    console.error("GET /api/cards error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi lấy danh sách thiệp" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cards
 * Tạo một thiệp cưới mới từ mẫu hoặc sao chép thiệp cũ
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json(
        { success: false, message: "Thiếu tên thiệp cưới" },
        { status: 400 }
      );
    }

    const userId = body.userId || request.headers.get("x-user-id") || undefined;
    const token = request.headers.get("authorization")?.split(" ")[1];

    // Yêu cầu bắt buộc đăng nhập để tạo hoặc lưu thiệp cưới mới
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Vui lòng đăng nhập để tạo hoặc lưu thiệp cưới." },
        { status: 401 }
      );
    }
    
    const cardId = body.id || `card_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const savedCard = await upsertCardToDb({
      ...body,
      userId,
      id: cardId,
    }, token);

    if (!savedCard) {
      return NextResponse.json(
        { success: false, message: "Không thể lưu thiệp lên cơ sở dữ liệu" },
        { status: 500 }
      );
    }

    try {
      recordActivity({
        type: savedCard.status === "published" ? "card_publish" : "card_create",
        title: savedCard.status === "published" ? "Xuất bản thiệp cưới" : "Tạo thiệp cưới mới",
        actorName: savedCard.groom?.name || savedCard.bride?.name || "Người dùng ZenLove",
        actorType: "user",
        targetName: savedCard.name,
        targetId: savedCard.id,
        targetSlug: savedCard.slug,
        details: `Mẫu "${savedCard.templateName || "Hồng Phong"}"`,
        metadata: {
          userId,
          status: savedCard.status,
        },
      });
    } catch (e) {
      console.warn("Không thể ghi log activity Card Create:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Tạo thiệp cưới thành công",
      card: savedCard,
    });
  } catch (error: any) {
    console.error("POST /api/cards error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi tạo thiệp cưới" },
      { status: 500 }
    );
  }
}
