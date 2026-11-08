import { NextRequest, NextResponse } from "next/server";
import { createRsvpInDb, getCardByIdOrSlugFromDb } from "@/lib/serverDb";
import { isCardOwner, verifyAdminAuth, verifyUserAuth } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

// Owners may prepare their guest list before publishing; the public RSVP endpoint stays closed to drafts.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [user, admin] = await Promise.all([verifyUserAuth(request), verifyAdminAuth(request)]);
    if (!user.authenticated && !admin.authenticated) {
      return NextResponse.json({ success: false, message: "Vui lòng đăng nhập để thêm khách mời" }, { status: 401 });
    }
    const card = await getCardByIdOrSlugFromDb(params.id);
    if (!card) return NextResponse.json({ success: false, message: "Không tìm thấy thiệp cưới" }, { status: 404 });
    if (!admin.authenticated && !(user.userId && isCardOwner(card, user.userId))) {
      return NextResponse.json({ success: false, message: "Bạn không có quyền thêm khách mời vào thiệp này" }, { status: 403 });
    }
    const body = await request.json().catch(() => null);
    const allowed = ["name", "phone", "attending", "guests", "note"];
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((key) => !allowed.includes(key)) ||
        typeof body.name !== "string" || (body.phone !== undefined && typeof body.phone !== "string") ||
        (body.note !== undefined && typeof body.note !== "string") ||
        (body.attending !== undefined && typeof body.attending !== "boolean") ||
        (body.guests !== undefined && (!Number.isInteger(body.guests) || body.guests < 0 || body.guests > 10))) {
      return NextResponse.json({ success: false, message: "Thông tin khách mời không hợp lệ" }, { status: 400 });
    }
    const name = body.name.trim();
    const phone = (body.phone || "").trim().replace(/[\s.-]/g, "");
    const note = (body.note || "").trim();
    if (name.length < 2 || name.length > 100 || note.length > 500 || (phone && !/^(?:\+84|0)[35789]\d{8}$/.test(phone))) {
      return NextResponse.json({ success: false, message: "Họ tên cần từ 2 đến 100 ký tự, số điện thoại Việt Nam hợp lệ (nếu có), ghi chú tối đa 500 ký tự" }, { status: 400 });
    }
    const attending = body.attending !== false;
    const rsvp = await createRsvpInDb({
      cardId: card.id, name, phone, attending,
      guests: attending ? Math.max(1, body.guests ?? 1) : 0,
      note,
    });
    if (!rsvp) return NextResponse.json({ success: false, message: "Không thể lưu khách mời vào hệ thống" }, { status: 500 });
    return NextResponse.json({ success: true, rsvp }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: "Không thể thêm khách mời" }, { status: 500 });
  }
}
