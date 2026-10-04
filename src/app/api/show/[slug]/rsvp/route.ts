import { NextRequest, NextResponse } from "next/server";
import { getCardByIdOrSlugFromDb, createRsvpInDb, getRsvpsFromDb } from "@/lib/serverDb";

export const dynamic = "force-dynamic";

interface Params {
  params: { slug: string };
}

/**
 * GET /api/show/[slug]/rsvp
 * Lấy danh sách phản hồi tham dự của thiệp
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { slug } = params;
  try {
    const card = await getCardByIdOrSlugFromDb(slug);
    if (!card) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy thiệp" },
        { status: 404 }
      );
    }

    const rsvps = await getRsvpsFromDb(card.id);
    return NextResponse.json({
      success: true,
      count: rsvps.length,
      rsvps,
    });
  } catch (error: any) {
    console.error(`GET /api/show/${slug}/rsvp error:`, error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi lấy danh sách RSVP" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/show/[slug]/rsvp
 * Khách gửi phản hồi xác nhận tham dự
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { slug } = params;
  try {
    const body = await request.json();
    const { name, phone, attending, guests, note } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập họ tên và số điện thoại" },
        { status: 400 }
      );
    }

    const card = await getCardByIdOrSlugFromDb(slug);
    if (!card) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy thiệp cưới tương ứng" },
        { status: 404 }
      );
    }

    const savedRsvp = await createRsvpInDb({
      cardId: card.id,
      name: name.trim(),
      phone: phone.trim(),
      attending: attending !== false,
      guests: Number(guests) || 1,
      note: note ? String(note).trim() : "",
    });

    if (!savedRsvp) {
      return NextResponse.json(
        { success: false, message: "Không thể lưu phản hồi RSVP vào hệ thống" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Cảm ơn bạn đã phản hồi xác nhận tham dự!",
      rsvp: savedRsvp,
    });
  } catch (error: any) {
    console.error(`POST /api/show/${slug}/rsvp error:`, error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi gửi phản hồi RSVP" },
      { status: 500 }
    );
  }
}
