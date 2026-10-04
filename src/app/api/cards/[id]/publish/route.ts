import { NextRequest, NextResponse } from "next/server";
import { getCardByIdOrSlugFromDb, upsertCardToDb } from "@/lib/serverDb";

interface Params {
  params: { id: string };
}

/**
 * POST /api/cards/[id]/publish
 * Xuất bản thiệp cưới và tạo link xem thiệp trực tiếp
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = params;
  try {
    const existing = await getCardByIdOrSlugFromDb(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: `Không tìm thấy thiệp cưới với ID: ${id}` },
        { status: 404 }
      );
    }

    const host = request.headers.get("host") || "localhost:3005";
    const protocol = host.includes("localhost") ? "http" : "https";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;

    const updated = await upsertCardToDb({
      ...existing,
      status: "published",
    });

    const publicUrl = `${siteUrl}/show/${existing.slug}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      publicUrl
    )}`;

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
