import { NextRequest, NextResponse } from "next/server";
import { getCardByIdOrSlugFromDb, createRsvpInDb, getRsvpsFromDb } from "@/lib/serverDb";
import { INITIAL_CARDS, WeddingCard } from "@/data/initialCards";
import { recordActivity } from "@/lib/activityService";
import { verifyUserAuth, verifyAdminAuth, isCardOwner } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

interface Params {
  params: { slug: string };
}

/**
 * Tìm kiếm thiệp cưới đã xuất bản hợp lệ theo slug hoặc id
 * Không tự động tạo thiệp ảo (ghost cards)
 */
async function findPublishedCard(slug: string): Promise<WeddingCard | null> {
  const card = await getCardByIdOrSlugFromDb(slug);
  if (card) return card;

  // Kiểm tra mẫu thiệp có sẵn trong INITIAL_CARDS
  const localFound = INITIAL_CARDS.find((c) => c.slug === slug || c.id === slug);
  if (localFound) return localFound;

  return null;
}

/**
 * GET /api/show/[slug]/rsvp
 * Lấy danh sách phản hồi tham dự của thiệp
 * - Nếu là chủ thiệp hoặc Admin: Trả về đầy đủ số điện thoại và ghi chú khách mời
 * - Nếu là khách mời công khai: Ẩn số điện thoại và ghi chú riêng tư để bảo vệ quyền riêng tư
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { slug } = params;
  try {
    const card = await findPublishedCard(slug);
    if (!card) {
      return NextResponse.json(
        { success: false, message: "Thiệp cưới không tồn tại" },
        { status: 404 }
      );
    }

    if (card.status !== "published") {
      return NextResponse.json(
        { success: false, message: "Thiệp cưới chưa được xuất bản" },
        { status: 403 }
      );
    }

    const rsvps = await getRsvpsFromDb(card.id);

    // Kiểm tra xem người gọi có phải chủ sở hữu hoặc Quản trị viên hay không
    const userAuth = await verifyUserAuth(request);
    const adminAuth = await verifyAdminAuth(request);
    const isOwner = userAuth.authenticated && userAuth.userId && isCardOwner(card, userAuth.userId);
    const canViewPrivateDetails = Boolean(isOwner || adminAuth.authenticated);

    // Phân tách dữ liệu: Khách công cộng chỉ xem được danh sách tên và số lượng người tham dự
    const sanitizedRsvps = rsvps.map((r) => ({
      id: r.id,
      name: r.name,
      attending: r.attending,
      guests: r.guests || 1,
      createdAt: r.createdAt,
      // Chỉ chủ thiệp mới được xem số điện thoại và lời nhắn riêng tư
      phone: canViewPrivateDetails ? r.phone : undefined,
      note: canViewPrivateDetails ? r.note : undefined,
    }));

    return NextResponse.json({
      success: true,
      count: sanitizedRsvps.length,
      rsvps: sanitizedRsvps,
      isOwner: canViewPrivateDetails,
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
 * Khách gửi phản hồi xác nhận tham dự với validation chặt chẽ
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { slug } = params;
  try {
    const body = await request.json();
    const { name, phone, attending, guests, note, b_field_trap } = body;

    // 1. Honeypot chống bot tự động spam
    if (b_field_trap) {
      return NextResponse.json({
        success: true,
        message: "Cảm ơn bạn đã phản hồi xác nhận tham dự!",
      });
    }

    // 2. Validation dữ liệu đầu vào
    const cleanName = String(name || "").trim();
    const cleanPhone = String(phone || "").trim().replace(/[\s.-]/g, "");

    if (!cleanName || cleanName.length < 2 || cleanName.length > 100) {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập họ và tên hợp lệ (từ 2 đến 100 ký tự)" },
        { status: 400 }
      );
    }

    // Kiểm tra định dạng số điện thoại Việt Nam chuẩn (10 chữ số, đầu số 03, 05, 07, 08, 09 hoặc +84)
    const phoneRegex = /^(?:\+84|0)[35789]\d{8}$/;
    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { success: false, message: "Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam hợp lệ (ví dụ: 0912345678)." },
        { status: 400 }
      );
    }

    const numGuests = Math.min(Math.max(parseInt(String(guests), 10) || 1, 1), 10);
    const cleanNote = note ? String(note).trim().slice(0, 500) : "";

    // 3. Tìm thiệp thực tế (không tự sinh thiệp ma)
    const card = await findPublishedCard(slug);
    if (!card) {
      return NextResponse.json(
        { success: false, message: "Thiệp cưới không tồn tại hoặc đường link không hợp lệ" },
        { status: 404 }
      );
    }

    if (card.status !== "published") {
      return NextResponse.json(
        { success: false, message: "Thiệp cưới đang ở trạng thái bản nháp và chưa mở nhận phản hồi" },
        { status: 400 }
      );
    }

    // 4. Lưu phản hồi vào cơ sở dữ liệu
    const savedRsvp = await createRsvpInDb({
      cardId: card.id,
      name: cleanName,
      phone: cleanPhone,
      attending: attending !== false,
      guests: numGuests,
      note: cleanNote,
    });

    if (!savedRsvp) {
      return NextResponse.json(
        { success: false, message: "Không thể lưu phản hồi RSVP vào hệ thống" },
        { status: 500 }
      );
    }

    // Ghi nhận sự kiện hoạt động của khách mời
    try {
      recordActivity({
        type: "rsvp_submit",
        title: savedRsvp.attending !== false ? "Khách gửi xác nhận tham dự" : "Khách thông báo vắng mặt",
        actorName: savedRsvp.name,
        actorType: "guest",
        targetName: card.name,
        targetId: card.id,
        targetSlug: card.slug,
        details:
          savedRsvp.attending !== false
            ? `Số lượng: ${savedRsvp.guests || 1} người${savedRsvp.note ? ` • Ghi chú: "${savedRsvp.note}"` : ""}`
            : `Không thể tham gia${savedRsvp.note ? ` • Lý do: "${savedRsvp.note}"` : ""}`,
        metadata: {
          attending: savedRsvp.attending,
          guests: savedRsvp.guests,
          cardId: card.id,
        },
      });
    } catch (e) {
      console.warn("Không thể ghi log activity RSVP:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Cảm ơn bạn đã phản hồi xác nhận tham dự!",
      rsvp: {
        id: savedRsvp.id,
        name: savedRsvp.name,
        attending: savedRsvp.attending,
        guests: savedRsvp.guests,
        createdAt: savedRsvp.createdAt,
      },
    });
  } catch (error: any) {
    console.error(`POST /api/show/${slug}/rsvp error:`, error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi gửi phản hồi RSVP" },
      { status: 500 }
    );
  }
}
