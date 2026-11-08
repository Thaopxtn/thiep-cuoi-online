import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { authorizeGuestManagement, parseGuestFields } from "@/lib/serverGuestAuthorization";
import { importGuestRecords, listGuestRecords } from "@/lib/serverGuestRepository";
import type { GuestItem } from "@/lib/guestManagementService";

export const dynamic = "force-dynamic";
type Params = { params: { id: string } };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const auth = await authorizeGuestManagement(request, params.id);
    if (auth.error) return auth.error;
    const guests = await listGuestRecords(auth.card.id);
    return NextResponse.json({ success: true, guests, rsvps: auth.card.rsvps || [] });
  } catch {
    return NextResponse.json({ success: false, message: "Không thể tải danh sách khách mời. Vui lòng thử lại." }, { status: 503 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const auth = await authorizeGuestManagement(request, params.id);
    if (auth.error) return auth.error;
    const body = await request.json().catch(() => null);
    if (!Array.isArray(body?.guests) || body.guests.length < 1 || body.guests.length > 200) return NextResponse.json({ success: false, message: "Danh sách nhập cần có từ 1 đến 200 khách mời" }, { status: 400 });
    const now = new Date().toISOString();
    const records: GuestItem[] = [];
    for (const input of body.guests) {
      const fields = parseGuestFields(input);
      const id = input?.id ?? `gst_${crypto.randomUUID()}`;
      if (!fields || typeof id !== "string" || !/^[a-zA-Z0-9_:-]{1,200}$/.test(id) ||
          (input.cardId && input.cardId !== auth.card.id) ||
          (fields.rsvpId && !auth.card.rsvps?.some((row) => row.id === fields.rsvpId))) {
        return NextResponse.json({ success: false, message: "Thông tin khách mời nhập vào không hợp lệ" }, { status: 400 });
      }
      const createdAt = input.createdAt ? new Date(input.createdAt) : new Date(now);
      const updatedAt = input.updatedAt ? new Date(input.updatedAt) : new Date(now);
      if (!Number.isFinite(createdAt.getTime()) || !Number.isFinite(updatedAt.getTime())) return NextResponse.json({ success: false, message: "Thời gian tạo khách mời không hợp lệ" }, { status: 400 });
      let checkedInAt: string | undefined;
      if (fields.checkedIn && input.checkedInAt) {
        const checked = new Date(input.checkedInAt);
        if (!Number.isFinite(checked.getTime())) return NextResponse.json({ success: false, message: "Thời gian điểm danh không hợp lệ" }, { status: 400 });
        checkedInAt = checked.toISOString();
      }
      records.push({ ...fields, id, cardId: auth.card.id, createdAt: createdAt.toISOString(), updatedAt: updatedAt.toISOString(), ...(checkedInAt ? { checkedInAt } : {}) } as GuestItem);
    }
    await importGuestRecords(auth.card.id, records);
    return NextResponse.json({ success: true, guests: await listGuestRecords(auth.card.id), rsvps: auth.card.rsvps || [] });
  } catch {
    return NextResponse.json({ success: false, message: "Không thể lưu khách mời. Dữ liệu trên thiết bị vẫn được giữ lại." }, { status: 503 });
  }
}
