import { NextRequest, NextResponse } from "next/server";
import { WeddingCard, WeddingRsvp } from "@/data/initialCards";
import { getCardByIdOrSlugFromDb, updateCardRsvpInDb, deleteCardRsvpFromDb } from "@/lib/serverDb";
import { verifyUserAuth, verifyAdminAuth, isCardOwner } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";
type Params = { params: { id: string; rsvpId: string } };

async function authorize(request: NextRequest, id: string, rsvpId: string): Promise<
  { error: NextResponse } | { card: WeddingCard; token?: string }
> {
  const [user, admin] = await Promise.all([verifyUserAuth(request), verifyAdminAuth(request)]);
  if (!user.authenticated && !admin.authenticated) {
    return { error: NextResponse.json({ success: false, message: "Vui lòng đăng nhập để quản lý khách mời" }, { status: 401 }) };
  }
  const card = await getCardByIdOrSlugFromDb(id);
  if (!card) return { error: NextResponse.json({ success: false, message: "Không tìm thấy thiệp cưới" }, { status: 404 }) };
  if (!admin.authenticated && !(user.userId && isCardOwner(card, user.userId))) {
    return { error: NextResponse.json({ success: false, message: "Bạn không có quyền quản lý khách mời của thiệp này" }, { status: 403 }) };
  }
  if (!card.rsvps?.some((r) => r.id === rsvpId)) {
    return { error: NextResponse.json({ success: false, message: "Không tìm thấy khách mời trong thiệp này" }, { status: 404 }) };
  }
  return { card, token: request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") };
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const auth = await authorize(request, params.id, params.rsvpId);
    if ("error" in auth) return auth.error;
    const body = await request.json().catch(() => null);
    const allowed = ["attending", "guests", "checkedIn", "tableNumber"];
    if (!body || Array.isArray(body) || typeof body !== "object" ||
        Object.keys(body).length === 0 || Object.keys(body).some((key) => !allowed.includes(key)) ||
        ("attending" in body && typeof body.attending !== "boolean") ||
        ("checkedIn" in body && typeof body.checkedIn !== "boolean") ||
        ("guests" in body && (!Number.isInteger(body.guests) || body.guests < 0 || body.guests > 10)) ||
        ("tableNumber" in body && !((typeof body.tableNumber === "string" && body.tableNumber.length <= 100) ||
          (typeof body.tableNumber === "number" && Number.isFinite(body.tableNumber) && body.tableNumber >= 0)))) {
      return NextResponse.json({ success: false, message: "Thông tin cập nhật khách mời không hợp lệ" }, { status: 400 });
    }
    const current = auth.card.rsvps.find((r) => r.id === params.rsvpId)!;
    const updates: Partial<WeddingRsvp> = { ...body };
    const attending = body.attending ?? current.attending;
    if ("attending" in body || "guests" in body) updates.guests = attending ? Math.max(1, body.guests ?? current.guests ?? 1) : 0;
    if ("checkedIn" in body) updates.checkedInAt = body.checkedIn ? new Date().toISOString() : undefined;
    const rsvp = await updateCardRsvpInDb(auth.card.id, params.rsvpId, updates, auth.token);
    if (!rsvp) return NextResponse.json({ success: false, message: "Không thể lưu thay đổi khách mời" }, { status: 500 });
    return NextResponse.json({ success: true, rsvp });
  } catch {
    return NextResponse.json({ success: false, message: "Không thể cập nhật khách mời" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const auth = await authorize(request, params.id, params.rsvpId);
    if ("error" in auth) return auth.error;
    const deleted = await deleteCardRsvpFromDb(auth.card.id, params.rsvpId, auth.token);
    if (!deleted) return NextResponse.json({ success: false, message: "Không thể xóa khách mời" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: "Không thể xóa khách mời" }, { status: 500 });
  }
}
