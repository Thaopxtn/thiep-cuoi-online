import { NextRequest, NextResponse } from "next/server";
import { getCardByIdOrSlugFromDb } from "@/lib/serverDb";
import { INITIAL_CARDS } from "@/lib/weddingCardService";

interface Params {
  params: { slug: string };
}

/**
 * GET /api/show/[slug]
 * Trả về dữ liệu thiệp cưới cho khách xem
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { slug } = params;
  try {
    const card = await getCardByIdOrSlugFromDb(slug);
    if (card) {
      return NextResponse.json({
        success: true,
        source: "database",
        card,
      });
    }

    // Fallback: Tìm trong danh sách mẫu có sẵn
    const fallback = INITIAL_CARDS.find((c) => c.slug === slug || c.id === slug) || INITIAL_CARDS[0];
    return NextResponse.json({
      success: true,
      source: "fallback",
      card: fallback,
    });
  } catch (error: any) {
    console.error(`GET /api/show/${slug} error:`, error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi tải thông tin thiệp" },
      { status: 500 }
    );
  }
}
