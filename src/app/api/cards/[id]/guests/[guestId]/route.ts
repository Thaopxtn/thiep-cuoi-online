import { NextRequest, NextResponse } from "next/server";
import { authorizeGuestManagement, parseGuestFields } from "@/lib/serverGuestAuthorization";
import { deleteGuestRecord, listGuestRecords, updateGuestRecord } from "@/lib/serverGuestRepository";

export const dynamic = "force-dynamic";
type Params = { params: { id: string; guestId: string } };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const auth = await authorizeGuestManagement(request, params.id);
    if (auth.error) return auth.error;
    const input = await request.json().catch(() => null);
    const updates = parseGuestFields(input, true);
    if (!updates || Object.keys(input).some((key) => !(key in updates)) ||
        (updates.rsvpId && !auth.card.rsvps?.some((row) => row.id === updates.rsvpId))) return NextResponse.json({ success: false, message: "Thông tin cập nhật khách mời không hợp lệ" }, { status: 400 });
    if ("checkedIn" in updates) updates.checkedInAt = updates.checkedIn ? new Date().toISOString() : undefined;
    const payload = { ...updates, ...("checkedIn" in updates && !updates.checkedIn ? { checkedInAt: null } : {}) };
    const saved = await updateGuestRecord(auth.card.id, params.guestId, payload as typeof updates);
    if (!saved) return NextResponse.json({ success: false, message: "Không tìm thấy khách mời để cập nhật" }, { status: 404 });
    return NextResponse.json({ success: true, guests: await listGuestRecords(auth.card.id), rsvps: auth.card.rsvps || [] });
  } catch {
    return NextResponse.json({ success: false, message: "Không thể lưu thay đổi khách mời" }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const auth = await authorizeGuestManagement(request, params.id);
    if (auth.error) return auth.error;
    if (!await deleteGuestRecord(auth.card.id, params.guestId)) return NextResponse.json({ success: false, message: "Không tìm thấy khách mời để xóa" }, { status: 404 });
    return NextResponse.json({ success: true, guests: await listGuestRecords(auth.card.id), rsvps: auth.card.rsvps || [] });
  } catch {
    return NextResponse.json({ success: false, message: "Không thể xóa khách mời" }, { status: 503 });
  }
}
