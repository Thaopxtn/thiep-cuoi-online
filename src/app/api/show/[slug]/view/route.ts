import { NextRequest, NextResponse } from "next/server";
import { incrementCardViewsInDb } from "@/lib/serverDb";

interface Params {
  params: { slug: string };
}

/**
 * POST /api/show/[slug]/view
 * Ghi nhận lượt xem thiệp cưới từ khách
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { slug } = params;
  try {
    const ok = await incrementCardViewsInDb(slug);
    return NextResponse.json({
      success: ok,
      message: ok ? "Đã tăng lượt xem thiệp" : "Không tìm thấy thiệp để tăng lượt xem",
    });
  } catch (error: any) {
    console.error(`POST /api/show/${slug}/view error:`, error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi ghi nhận lượt xem" },
      { status: 500 }
    );
  }
}
