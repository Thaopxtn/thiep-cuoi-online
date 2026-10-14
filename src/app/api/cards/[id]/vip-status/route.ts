import { NextRequest, NextResponse } from "next/server";
import { getCardByIdOrSlugFromDb } from "@/lib/serverDb";

export const dynamic = "force-dynamic";

/**
 * GET /api/cards/[id]/vip-status
 * Kiểm tra trạng thái gói VIP và watermark của thiệp cưới (hỗ trợ real-time polling)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cardIdOrSlug = params.id;
    if (!cardIdOrSlug) {
      return NextResponse.json({ success: false, message: "Thiếu ID thiệp cưới" }, { status: 400 });
    }

    const card = await getCardByIdOrSlugFromDb(cardIdOrSlug);
    if (!card) {
      return NextResponse.json({ success: false, message: "Không tìm thấy thiệp cưới" }, { status: 404 });
    }

    const isVip = Boolean(card.isVip || (card.groom as any)?.isVip);
    const plan = card.plan || (card.groom as any)?.plan || (isVip ? "vip" : "free");
    const vipUnlockedAt = card.vipUnlockedAt || (card.groom as any)?.vipUnlockedAt;
    const showWatermark = card.showWatermark !== undefined ? Boolean(card.showWatermark) : !isVip;

    return NextResponse.json({
      success: true,
      cardId: card.id,
      slug: card.slug,
      isVip,
      plan,
      vipUnlockedAt,
      showWatermark,
    });
  } catch (err: any) {
    console.error("Lỗi GET /api/cards/[id]/vip-status:", err);
    return NextResponse.json({ success: false, message: "Lỗi kiểm tra trạng thái VIP" }, { status: 500 });
  }
}
