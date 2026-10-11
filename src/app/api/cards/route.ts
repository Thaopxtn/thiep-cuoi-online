import { NextRequest, NextResponse } from "next/server";
import { getCardsFromDb, upsertCardToDb } from "@/lib/serverDb";
import { INITIAL_CARDS } from "@/data/initialCards";
import { recordActivity } from "@/lib/activityService";
import { verifyUserAuth, verifyAdminAuth } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

/**
 * GET /api/cards
 * Lấy danh sách thiệp cưới của người dùng đã xác thực
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");
    const token = request.headers.get("authorization")?.split(" ")[1];

    const userAuth = await verifyUserAuth(request);
    const adminAuth = await verifyAdminAuth(request);

    // 1. Nếu là Quản trị viên: Có thể xem theo userId hoặc toàn bộ
    if (adminAuth.authenticated) {
      const cards = await getCardsFromDb(requestedUserId || undefined, token);
      return NextResponse.json({
        success: true,
        source: "database_admin",
        count: cards.length,
        cards,
      });
    }

    // 2. Nếu người dùng đã đăng nhập: CHỈ trả về đúng thiệp của tài khoản đã xác thực
    if (userAuth.authenticated && userAuth.userId) {
      const cards = await getCardsFromDb(userAuth.userId, token);
      return NextResponse.json({
        success: true,
        source: "database",
        count: cards.length,
        cards: cards || [],
      });
    }

    // 3. Nếu là khách chưa đăng nhập yêu cầu xem thiệp theo userId -> Chặn BOLA/IDOR
    if (requestedUserId) {
      return NextResponse.json(
        { success: false, message: "Vui lòng đăng nhập để xem danh sách thiệp của tài khoản" },
        { status: 401 }
      );
    }

    // 4. Nếu khách vãng lai xem trang chủ hoặc kho template: Trả về danh sách mẫu công khai mặc định
    return NextResponse.json({
      success: true,
      source: "showcase",
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
 * Tạo một thiệp cưới mới (Bắt buộc xác thực danh tính người dùng)
 */
export async function POST(request: NextRequest) {
  try {
    const userAuth = await verifyUserAuth(request);
    const adminAuth = await verifyAdminAuth(request);

    if (!userAuth.authenticated && !adminAuth.authenticated) {
      return NextResponse.json(
        { success: false, message: "Vui lòng đăng nhập để tạo hoặc lưu thiệp cưới." },
        { status: 401 }
      );
    }

    const body = await request.json();
    if (!body.name) {
      return NextResponse.json(
        { success: false, message: "Thiếu tên thiệp cưới" },
        { status: 400 }
      );
    }

    // Gán userId từ danh tính đã xác minh trên server (chống giả mạo userId)
    const effectiveUserId = adminAuth.authenticated && body.userId ? body.userId : userAuth.userId;
    const token = request.headers.get("authorization")?.split(" ")[1];

    const cardId = body.id || `card_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const savedCard = await upsertCardToDb(
      {
        ...body,
        userId: effectiveUserId,
        id: cardId,
      },
      token
    );

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
          userId: effectiveUserId,
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
