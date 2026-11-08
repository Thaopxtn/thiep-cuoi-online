import { NextRequest, NextResponse } from "next/server";
import { getCardByIdOrSlugFromDb } from "./serverDb";
import { isCardOwner, verifyAdminAuth, verifyUserAuth } from "./serverAuth";
import type { GuestItem } from "./guestManagementService";

export async function authorizeGuestManagement(request: NextRequest, id: string) {
  const [user, admin] = await Promise.all([verifyUserAuth(request), verifyAdminAuth(request)]);
  if (!user.authenticated && !admin.authenticated) return { error: NextResponse.json({ success: false, message: "Vui lòng đăng nhập để quản lý khách mời" }, { status: 401 }) };
  const card = await getCardByIdOrSlugFromDb(id);
  if (!card) return { error: NextResponse.json({ success: false, message: "Không tìm thấy thiệp cưới" }, { status: 404 }) };
  if (!admin.authenticated && !isCardOwner(card, user.userId)) return { error: NextResponse.json({ success: false, message: "Bạn không có quyền quản lý khách mời của thiệp này" }, { status: 403 }) };
  return { card };
}

const groups = ["groom_side", "bride_side", "friends", "colleagues", "vip", "other"];
const statuses = ["not_sent", "sent", "viewed", "confirmed", "declined"];
const fields = ["name", "phone", "email", "group", "tableNumber", "estimatedGuests", "status", "notes", "checkedIn", "rsvpId"];

export function parseGuestFields(value: unknown, partial = false): Partial<GuestItem> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  for (const field of fields) if (Object.prototype.hasOwnProperty.call(input, field)) output[field] = input[field];
  if (!partial && ["name", "group", "estimatedGuests", "status"].some((field) => !(field in output))) return null;
  if (!Object.keys(output).length) return null;
  if (("name" in output && (typeof output.name !== "string" || !output.name.trim() || output.name.length > 200)) ||
      ("group" in output && !groups.includes(String(output.group))) ||
      ("status" in output && !statuses.includes(String(output.status))) ||
      ("estimatedGuests" in output && (!Number.isInteger(output.estimatedGuests) || Number(output.estimatedGuests) < 0 || Number(output.estimatedGuests) > 1000)) ||
      ("checkedIn" in output && typeof output.checkedIn !== "boolean")) return null;
  for (const [field, max] of [["phone", 100], ["email", 254], ["tableNumber", 100], ["notes", 4000], ["rsvpId", 200]] as const) {
    if (field in output && (typeof output[field] !== "string" || String(output[field]).length > max)) return null;
  }
  if (typeof output.name === "string") output.name = output.name.trim();
  return output as Partial<GuestItem>;
}
