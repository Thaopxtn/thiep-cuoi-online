import { NextRequest, NextResponse } from "next/server";
import { getCardByIdOrSlugFromDb, createRsvpInDb, getRsvpsFromDb, upsertCardToDb } from "@/lib/serverDb";
import { INITIAL_CARDS, WeddingCard } from "@/data/initialCards";

export const dynamic = "force-dynamic";

interface Params {
  params: { slug: string };
}

/**
 * Lấy hoặc tự động tạo bản ghi thiệp trong DB nếu chưa có (tránh 404 cho khách)
 */
async function ensureCardForSlug(slug: string): Promise<WeddingCard | null> {
  let card = await getCardByIdOrSlugFromDb(slug);
  if (card) return card;

  // 1. Kiểm tra INITIAL_CARDS
  const localFound = INITIAL_CARDS.find((c) => c.slug === slug || c.id === slug);
  if (localFound) {
    const upserted = await upsertCardToDb(localFound);
    return upserted || localFound;
  }

  // 2. Tạo bản ghi thiệp dự phòng để đảm bảo foreign key và luôn lưu được RSVP
  const fallbackCard: WeddingCard = {
    id: slug,
    slug: slug,
    name: `Thiệp Cưới (${slug})`,
    templateId: slug,
    templateName: "Thiệp Cưới Online",
    status: "published",
    updatedAt: new Date().toLocaleDateString("vi-VN"),
    views: 1,
    coverImage: "",
    story: "",
    weddingDate: "2026-11-20",
    weddingTime: "11:00",
    lunarDate: "",
    groom: { name: "Chú Rể", title: "Chú Rể", phone: "" },
    bride: { name: "Cô Dâu", title: "Cô Dâu", phone: "" },
    events: [],
    album: [],
    musicTitle: "",
    musicUrl: "",
    rsvps: [],
    wishes: [],
  };

  try {
    const upserted = await upsertCardToDb(fallbackCard);
    return upserted || fallbackCard;
  } catch {
    return fallbackCard;
  }
}

/**
 * GET /api/show/[slug]/rsvp
 * Lấy danh sách phản hồi tham dự của thiệp
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { slug } = params;
  try {
    const card = await ensureCardForSlug(slug);
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
    const { name, phone, attending, guests, note, b_field_trap } = body;

    // Honeypot chống bot tự động spam
    if (b_field_trap) {
      return NextResponse.json({
        success: true,
        message: "Cảm ơn bạn đã phản hồi xác nhận tham dự!",
      });
    }

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập họ tên và số điện thoại" },
        { status: 400 }
      );
    }

    const card = await ensureCardForSlug(slug);
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
