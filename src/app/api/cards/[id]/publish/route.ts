import { NextRequest, NextResponse } from "next/server";
import { getCardByIdOrSlugFromDb, upsertCardToDb } from "@/lib/serverDb";
import { verifyUserAuth, verifyAdminAuth, isCardOwner } from "@/lib/serverAuth";
import { getSafeSiteUrl } from "@/lib/securityUtils";
import { recordActivity } from "@/lib/activityService";

export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

/**
 * POST /api/cards/[id]/publish
 * Xuất bản thiệp cưới và tạo link xem thiệp trực tiếp
 * Yêu cầu: Xác thực quyền sở hữu thiệp của người dùng & ngăn chặn Host Header Injection
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = params;
  try {
    const userAuth = await verifyUserAuth(request);
    const adminAuth = await verifyAdminAuth(request);

    // 1. Kiểm tra xác thực
    if (!userAuth.authenticated && !adminAuth.authenticated) {
      return NextResponse.json(
        { success: false, message: "Vui lòng đăng nhập để xuất bản thiệp cưới." },
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

    // 2. Multi-tenancy check: Xác thực quyền sở hữu trước khi cho phép xuất bản
    const isOwner = userAuth.authenticated && userAuth.userId && isCardOwner(existing, userAuth.userId);
    if (!isOwner && !adminAuth.authenticated) {
      return NextResponse.json(
        { success: false, message: "Bạn không có quyền xuất bản thiệp cưới của người dùng khác" },
        { status: 403 }
      );
    }

    // 3. Xây dựng domain production an toàn chống Host Header Injection
    const safeSiteUrl = getSafeSiteUrl(request.headers.get("host"));

    const token = request.headers.get("authorization")?.split(" ")[1];
    const updated = await upsertCardToDb(
      {
        ...existing,
        status: "published",
      },
      token
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Không thể lưu trạng thái xuất bản thiệp vào cơ sở dữ liệu" },
        { status: 500 }
      );
    }

    const publicUrl = `${safeSiteUrl}/show/${existing.slug}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      publicUrl
    )}`;

    try {
      recordActivity({
        type: "card_publish",
        title: "Xuất bản thiệp cưới trực tuyến",
        actorName: existing.groom?.name || existing.bride?.name || "Người dùng",
        actorType: "user",
        targetName: existing.name,
        targetId: existing.id,
        targetSlug: existing.slug,
        details: `Thiệp đã sẵn sàng chia sẻ tới khách mời tại: ${publicUrl}`,
        metadata: {
          cardId: existing.id,
          slug: existing.slug,
          userId: existing.userId,
        },
      });
    } catch (e) {
      console.warn("Không thể ghi log activity Card Publish:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Xuất bản thiệp cưới thành công!",
      publicUrl,
      qrCodeUrl,
      card: updated,
    });
  } catch (error: any) {
    console.error(`POST /api/cards/${id}/publish error:`, error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi xuất bản thiệp" },
      { status: 500 }
    );
  }
}
