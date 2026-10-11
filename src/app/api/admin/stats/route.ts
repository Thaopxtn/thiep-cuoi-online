import { NextRequest, NextResponse } from "next/server";
import { getCardsFromDb, getAllRsvpsFromDb, getAllWishesFromDb } from "@/lib/serverDb";
import { INITIAL_CARDS } from "@/data/initialCards";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const [cardsResult, rsvpsResult, wishesResult] = await Promise.all([
      getCardsFromDb().catch(() => []),
      getAllRsvpsFromDb().catch(() => []),
      getAllWishesFromDb().catch(() => []),
    ]);

    const cards = (cardsResult && cardsResult.length > 0) ? cardsResult : INITIAL_CARDS;
    const rsvps = (rsvpsResult && rsvpsResult.length > 0) ? rsvpsResult : cards.flatMap((c) => c.rsvps || []);
    const wishes = (wishesResult && wishesResult.length > 0) ? wishesResult : cards.flatMap((c) => c.wishes || []);

    const totalCards = cards.length;
    const publishedCards = cards.filter((c) => c.status === "published").length;
    const draftCards = totalCards - publishedCards;

    const totalViews = cards.reduce((acc, c) => acc + (c.views || 0), 0);

    const totalRsvps = rsvps.length;
    const attendingRsvps = rsvps.filter((r) => r.attending !== false).length;
    const decliningRsvps = totalRsvps - attendingRsvps;
    const attendingRate = totalRsvps > 0 ? Math.round((attendingRsvps / totalRsvps) * 100) : 100;

    const totalWishes = wishes.length;

    // Top 5 thiệp xem nhiều nhất
    const topViewedCards = [...cards]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        views: c.views || 0,
        status: c.status,
        weddingDate: c.weddingDate,
        coverImage: c.coverImage,
        rsvpsCount: Array.isArray(c.rsvps) ? c.rsvps.length : 0,
        wishesCount: Array.isArray(c.wishes) ? c.wishes.length : 0,
      }));

    // Top 5 thiệp cập nhật gần đây nhất
    const recentCards = [...cards].slice(0, 5).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      status: c.status,
      updatedAt: c.updatedAt,
      weddingDate: c.weddingDate,
      views: c.views || 0,
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalCards,
        publishedCards,
        draftCards,
        totalViews,
        totalRsvps,
        attendingRsvps,
        decliningRsvps,
        attendingRate,
        totalWishes,
        topViewedCards,
        recentCards,
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Lỗi GET /api/admin/stats:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi tải thống kê hệ thống" },
      { status: 500 }
    );
  }
}
