/**
 * Dịch vụ Quản trị Khách mời & Phân bàn tiệc (Wedding Guest CRM & Seating Service)
 * Hỗ trợ: Quản lý khách mời, phân nhóm, gán bàn tiệc, theo dõi tiến độ gửi,
 * tạo liên kết Zalo 1-chạm cá nhân hóa và xuất dữ liệu Excel/CSV.
 */

import { WeddingCard, WeddingRsvp } from "@/data/initialCards";
import { apiFetch, getAuthAccessToken, getAuthRefreshToken, getStoredUser } from "./apiClient";
import { formatGuestLink } from "./guestInvitationHelper";
import { getSiteUrl } from "./siteConfig";

export type GuestGroup =
  | "groom_side"   // Nhà Trai
  | "bride_side"   // Nhà Gái
  | "friends"      // Bạn Bè
  | "colleagues"   // Đồng Nghiệp
  | "vip"          // Khách Quý VIP
  | "other";       // Khác

export type GuestInviteStatus =
  | "not_sent"   // Chưa gửi
  | "sent"       // Đã gửi
  | "viewed"     // Đã xem thiệp
  | "confirmed"  // Đã xác nhận tham dự
  | "declined";  // Báo bận không đến

export interface GuestItem {
  id: string;
  cardId: string;
  name: string;
  phone?: string;
  email?: string;
  group: GuestGroup;
  tableNumber?: string; // Ví dụ: "Bàn 1", "Bàn VIP", "Bàn 6 - Bạn cấp 3"
  estimatedGuests: number; // Dự kiến số người đi cùng
  status: GuestInviteStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  checkedIn?: boolean;
  checkedInAt?: string;
  rsvpId?: string;
  deletedAt?: string;
  source?: "crm" | "rsvp";
  responseStatus?: "confirmed" | "declined";
  responseGuests?: number;
}

export interface GuestGroupStat {
  group: GuestGroup;
  label: string;
  count: number;
  confirmedCount: number;
}

export interface GuestSummaryStats {
  total: number;
  notSent: number;
  sent: number;
  confirmed: number;
  declined: number;
  totalSeats: number;
  assignedTablesCount: number;
}

const STORAGE_PREFIX = "zenlove_guest_crm_";

export const GUEST_GROUPS: { id: GuestGroup; label: string; badgeColor: string }[] = [
  { id: "groom_side", label: "Họ Nhà Trai", badgeColor: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "bride_side", label: "Họ Nhà Gái", badgeColor: "bg-pink-50 text-pink-700 border-pink-200" },
  { id: "friends", label: "Bạn Bè", badgeColor: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "colleagues", label: "Đồng Nghiệp", badgeColor: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "vip", label: "Khách Quý VIP", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "other", label: "Khác", badgeColor: "bg-gray-50 text-gray-700 border-gray-200" },
];

/**
 * Lấy danh sách khách mời của một thiệp cưới
 */
export function getGuestsByCardId(cardId: string): GuestItem[] {
  if (typeof window === "undefined" || !cardId) return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${cardId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((guest) => !guest.deletedAt) : [];
    }
  } catch (err) {
    console.error("Lỗi khi đọc danh sách khách mời:", err);
  }
  return [];
}

/**
 * Lưu danh sách khách mời vào LocalStorage
 */
export function saveGuestsByCardId(cardId: string, guests: GuestItem[]): boolean {
  if (typeof window === "undefined" || !cardId) return false;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${cardId}`, JSON.stringify(guests));
    return true;
  } catch (err) {
    console.error("Lỗi khi lưu danh sách khách mời:", err);
    return false;
  }
}

/**
 * Thêm một khách mời mới
 */
export function addGuest(
  cardId: string,
  data: Omit<GuestItem, "id" | "cardId" | "createdAt" | "updatedAt">
): GuestItem {
  const current = getGuestsByCardId(cardId);
  const now = new Date().toISOString();
  const newGuest: GuestItem = {
    ...data,
    id: `gst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    cardId,
    createdAt: now,
    updatedAt: now,
  };

  const updated = [newGuest, ...current];
  if (typeof window !== "undefined" && !saveGuestsByCardId(cardId, updated)) throw new Error("Không thể lưu danh sách khách mời trên thiết bị");
  return newGuest;
}

/**
 * Cập nhật thông tin khách mời
 */
export function updateGuest(
  cardId: string,
  guestId: string,
  updates: Partial<Omit<GuestItem, "id" | "cardId" | "createdAt">>
): GuestItem | null {
  const current = getGuestsByCardId(cardId);
  let updatedGuest: GuestItem | null = null;

  const updated = current.map((g) => {
    if (g.id === guestId) {
      updatedGuest = {
        ...g,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      return updatedGuest;
    }
    return g;
  });

  if (updatedGuest) {
    if (!saveGuestsByCardId(cardId, updated)) return null;
  }
  return updatedGuest;
}

/**
 * Xóa một khách mời khỏi danh sách
 */
export function deleteGuest(cardId: string, guestId: string): boolean {
  const current = getGuestsByCardId(cardId);
  const updated = current.filter((g) => g.id !== guestId);
  if (updated.length !== current.length) {
    return saveGuestsByCardId(cardId, updated);
  }
  return false;
}

/**
 * Phân tích và thêm khách mời hàng loạt từ danh sách nhập (Copy-Paste từ Excel/Word)
 * Hỗ trợ các định dạng dòng:
 * "Nguyễn Văn A"
 * "Nguyễn Văn A - 0912345678"
 * "Nguyễn Văn A - 0912345678 - Bàn 5"
 * "Nguyễn Văn A, Bạn Bè, 0912345678, Bàn 2"
 */
export function bulkImportGuests(
  cardId: string,
  rawText: string,
  defaultGroup: GuestGroup = "friends",
  persist = true
): GuestItem[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText
    .split(/[\r\n]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const phoneRegex = /(?:\+84|0)[35789]\d{8}\b/;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const tableRegex = /(?:bàn|mâm|table)\s*([a-zA-Z0-9\-_]+)/i;

  const now = new Date().toISOString();
  const newGuests: GuestItem[] = [];

  lines.forEach((line, idx) => {
    const parts = line.split(/[-|,]/).map((p) => p.trim());
    let name = parts[0] || `Khách ${idx + 1}`;
    let phone: string | undefined = undefined;
    let email: string | undefined = undefined;
    let tableNumber: string | undefined = undefined;
    let group: GuestGroup = defaultGroup;

    for (let i = 1; i < parts.length; i++) {
      const p = parts[i];
      if (phoneRegex.test(p)) {
        phone = p;
      } else if (emailRegex.test(p)) {
        email = p;
      } else if (tableRegex.test(p)) {
        tableNumber = p;
      } else {
        const lower = p.toLowerCase();
        if (lower.includes("trai") || lower.includes("chú rể")) group = "groom_side";
        else if (lower.includes("gái") || lower.includes("cô dâu")) group = "bride_side";
        else if (lower.includes("bạn")) group = "friends";
        else if (lower.includes("đồng nghiệp") || lower.includes("công ty")) group = "colleagues";
        else if (lower.includes("vip")) group = "vip";
        else if (!tableNumber && (p.startsWith("Bàn") || p.startsWith("bàn"))) {
          tableNumber = p;
        }
      }
    }

    newGuests.push({
      id: `gst_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      cardId,
      name,
      phone,
      email,
      group,
      tableNumber,
      estimatedGuests: 1,
      status: "not_sent",
      createdAt: now,
      updatedAt: now,
    });
  });

  const current = getGuestsByCardId(cardId);
  const updated = [...newGuests, ...current];
  if (persist && typeof window !== "undefined" && !saveGuestsByCardId(cardId, updated)) throw new Error("Không thể lưu danh sách khách mời trên thiết bị");
  return newGuests;
}

/**
 * Tính toán thống kê khách mời
 */
export function calculateGuestStats(guests: GuestItem[]): GuestSummaryStats {
  const tablesSet = new Set<string>();

  const stats = guests.reduce(
    (acc, g) => {
      acc.total += 1;
      const status = g.responseStatus ?? g.status;
      if (status === "not_sent") acc.notSent += 1;
      else if (status === "sent") acc.sent += 1;
      else if (status === "confirmed") {
        acc.confirmed += 1;
        acc.totalSeats += g.responseGuests ?? g.estimatedGuests ?? 1;
      } else if (status === "declined") {
        acc.declined += 1;
      }

      if (g.tableNumber && g.tableNumber.trim()) {
        tablesSet.add(g.tableNumber.trim().toLowerCase());
      }

      return acc;
    },
    {
      total: 0,
      notSent: 0,
      sent: 0,
      confirmed: 0,
      declined: 0,
      totalSeats: 0,
      assignedTablesCount: 0,
    }
  );

  stats.assignedTablesCount = tablesSet.size;
  return stats;
}

/** Merge views only; invitation metadata remains in CRM and responses remain in RSVP. */
export function mergeGuestsAndRsvps(crm: GuestItem[], rsvps: WeddingRsvp[]): GuestItem[] {
  const phoneKey = (phone?: string) => (phone || "").replace(/[^+\d]/g, "").replace(/^\+84/, "0");
  const crmPhoneCounts = new Map<string, number>();
  const rsvpPhoneCounts = new Map<string, number>();
  for (const guest of crm) {
    const key = phoneKey(guest.phone);
    if (key) crmPhoneCounts.set(key, (crmPhoneCounts.get(key) || 0) + 1);
  }
  for (const rsvp of rsvps) {
    const key = phoneKey(rsvp.phone);
    if (key) rsvpPhoneCounts.set(key, (rsvpPhoneCounts.get(key) || 0) + 1);
  }
  const used = new Set<string>();
  const result: GuestItem[] = [];
  for (const guest of crm) {
    const key = phoneKey(guest.phone);
    const rsvp = rsvps.find((item) => !used.has(item.id) && (
      guest.rsvpId ? item.id === guest.rsvpId : Boolean(key && crmPhoneCounts.get(key) === 1 && rsvpPhoneCounts.get(key) === 1 && phoneKey(item.phone) === key)
    ));
    if (rsvp) used.add(rsvp.id);
    // A deleted CRM record suppresses its linked response in this guest list;
    // the original RSVP is retained for the response history.
    if (guest.deletedAt) continue;
    result.push({ ...guest, source: "crm", ...(rsvp ? {
      rsvpId: rsvp.id,
      responseStatus: rsvp.attending ? "confirmed" : "declined",
      responseGuests: rsvp.guests,
      checkedIn: Boolean(rsvp.checkedIn),
      checkedInAt: rsvp.checkedInAt,
    } : {}) });
  }
  for (const rsvp of rsvps) {
    if (used.has(rsvp.id)) continue;
    result.push({
      id: `rsvp:${rsvp.id}`, cardId: rsvp.cardId, name: rsvp.name, phone: rsvp.phone,
      group: "other", tableNumber: rsvp.tableNumber == null ? "" : String(rsvp.tableNumber),
      estimatedGuests: rsvp.guests ?? 1, status: rsvp.attending ? "confirmed" : "declined",
      notes: rsvp.note, createdAt: rsvp.createdAt, updatedAt: rsvp.createdAt,
      checkedIn: Boolean(rsvp.checkedIn), checkedInAt: rsvp.checkedInAt,
      rsvpId: rsvp.id, source: "rsvp", responseStatus: rsvp.attending ? "confirmed" : "declined", responseGuests: rsvp.guests,
    });
  }
  return result;
}

export function usesGuestCloudSync(): boolean {
  return Boolean(getStoredUser()?.id || getAuthAccessToken() || getAuthRefreshToken());
}

function guestEndpoint(cardId: string, guestId?: string): string {
  return `/api/cards/${encodeURIComponent(cardId)}/guests${guestId ? `/${encodeURIComponent(guestId)}` : ""}`;
}

async function guestRequest(cardId: string, init?: RequestInit, guestId?: string): Promise<{ guests: GuestItem[]; rsvps: WeddingRsvp[] }> {
  const res = await apiFetch(guestEndpoint(cardId, guestId), init);
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success || !Array.isArray(body.guests) || !Array.isArray(body.rsvps)) {
    throw new Error(body?.message || "Không thể đồng bộ khách mời. Dữ liệu trên thiết bị vẫn được giữ lại.");
  }
  return body;
}

function rememberGuestRecords(cardId: string, records: GuestItem[]): void {
  // The server has already acknowledged the write; a full browser cache is optional.
  saveGuestsByCardId(cardId, records);
}

export async function fetchGuestsForCard(card: WeddingCard): Promise<GuestItem[]> {
  if (!usesGuestCloudSync()) return mergeGuestsAndRsvps(getGuestsByCardId(card.id), card.rsvps || []);
  const markerKey = `${STORAGE_PREFIX}migrated_${getStoredUser()?.id || "session"}_${card.id}`;
  let migrated = new Set<string>();
  try { migrated = new Set(JSON.parse(localStorage.getItem(markerKey) || "[]")); } catch {}
  const legacy = getGuestsByCardId(card.id).filter((guest) => guest.source !== "rsvp" && !migrated.has(guest.id));
  // Preserve legacy ids. Server imports ignore existing rows, including tombstones.
  for (let offset = 0; offset < legacy.length; offset += 200) {
    await guestRequest(card.id, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ guests: legacy.slice(offset, offset + 200) }) });
  }
  const data = await guestRequest(card.id);
  rememberGuestRecords(card.id, data.guests);
  try { localStorage.setItem(markerKey, JSON.stringify(Array.from(new Set([...Array.from(migrated), ...legacy.map((guest) => guest.id), ...data.guests.map((guest) => guest.id)])))); } catch {}
  return mergeGuestsAndRsvps(data.guests, data.rsvps);
}

type GuestDraft = Omit<GuestItem, "id" | "cardId" | "createdAt" | "updatedAt">;

function editableGuestData(data: GuestDraft): Record<string, unknown> {
  const fields = ["name", "phone", "email", "group", "tableNumber", "estimatedGuests", "status", "notes", "checkedIn", "rsvpId"] as const;
  return Object.fromEntries(fields.filter((field) => data[field] !== undefined).map((field) => [field, data[field]]));
}

export async function saveGuestAsync(card: WeddingCard, data: GuestDraft, current?: GuestItem, creationId?: string): Promise<GuestItem[]> {
  if (!usesGuestCloudSync()) {
    if (current?.source === "rsvp") {
      const now = new Date().toISOString();
      if (!saveGuestsByCardId(card.id, [{ ...data, id: current.id, cardId: card.id, createdAt: current.createdAt, updatedAt: now }, ...getGuestsByCardId(card.id)])) throw new Error("Không thể lưu khách mời trên thiết bị");
    } else if (current) {
      if (!updateGuest(card.id, current.id, data)) throw new Error("Không thể cập nhật khách mời trên thiết bị");
    } else addGuest(card.id, data);
    return mergeGuestsAndRsvps(getGuestsByCardId(card.id), card.rsvps || []);
  }
  const creating = !current || current.source === "rsvp";
  const now = new Date().toISOString();
  const fields = editableGuestData(data);
  // Send only the user's edits. An old snapshot must not overwrite unrelated
  // fields updated by another device or replay a check-in command.
  if (!creating) {
    for (const key of Object.keys(fields)) {
      if (fields[key] === current[key as keyof GuestItem]) delete fields[key];
    }
    if (Boolean(data.checkedIn) === Boolean(current.checkedIn)) delete fields.checkedIn;
    if (Object.keys(fields).length === 0) return fetchGuestsForCard(card);
  }
  const payload = creating ? { guests: [{ ...fields, id: current?.id || creationId || `gst_${crypto.randomUUID()}`, cardId: card.id, createdAt: current?.createdAt || now, updatedAt: now, ...(current?.rsvpId ? { rsvpId: current.rsvpId } : {}) }] } : fields;
  const result = await guestRequest(card.id, { method: creating ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }, creating ? undefined : current.id);
  rememberGuestRecords(card.id, result.guests);
  return mergeGuestsAndRsvps(result.guests, result.rsvps);
}

export async function importGuestsAsync(card: WeddingCard, text: string, group: GuestGroup): Promise<GuestItem[]> {
  const imported = bulkImportGuests(card.id, text, group, false);
  if (!usesGuestCloudSync()) {
    if (!saveGuestsByCardId(card.id, [...imported, ...getGuestsByCardId(card.id)])) throw new Error("Không thể lưu danh sách khách mời");
    return mergeGuestsAndRsvps(getGuestsByCardId(card.id), card.rsvps || []);
  }
  // Repeating an import after a lost response must reuse ids already committed by the server.
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify([card.id, text.trim(), group])));
  const batchId = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  imported.forEach((guest, index) => { guest.id = `gst_bulk_${batchId}_${index}`; });
  for (let offset = 0; offset < imported.length; offset += 200) {
    await guestRequest(card.id, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ guests: imported.slice(offset, offset + 200) }) });
  }
  return fetchGuestsForCard(card);
}

export async function deleteGuestAsync(card: WeddingCard, guest: GuestItem): Promise<GuestItem[]> {
  if (guest.source === "rsvp" && guest.rsvpId) {
    const res = await apiFetch(`/api/cards/${encodeURIComponent(card.id)}/rsvps/${encodeURIComponent(guest.rsvpId)}`, { method: "DELETE" });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.success) throw new Error(body?.message || "Không thể xóa phản hồi khách mời");
  } else if (usesGuestCloudSync()) {
    const data = await guestRequest(card.id, { method: "DELETE" }, guest.id);
    rememberGuestRecords(card.id, data.guests);
    return mergeGuestsAndRsvps(data.guests, data.rsvps);
  } else if (!deleteGuest(card.id, guest.id)) throw new Error("Không thể xóa khách mời trên thiết bị");
  return fetchGuestsForCard(card);
}

export async function checkInGuestAsync(card: WeddingCard, guest: GuestItem, checkedIn: boolean): Promise<GuestItem[]> {
  if (guest.rsvpId) {
    const res = await apiFetch(`/api/cards/${encodeURIComponent(card.id)}/rsvps/${encodeURIComponent(guest.rsvpId)}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ checkedIn }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.success) throw new Error(body?.message || "Không thể lưu điểm danh khách mời");
    return fetchGuestsForCard(card);
  }
  return saveGuestAsync(card, { ...guest, checkedIn }, guest);
}

/**
 * Định dạng URL và nội dung gửi Zalo 1-chạm
 */
export function getZaloSharePayload(
  guest: GuestItem,
  card: WeddingCard,
  origin = ""
): {
  cardUrl: string;
  zaloUrl: string;
  shareText: string;
} {
  const host =
    origin || (typeof window !== "undefined" ? window.location.origin : getSiteUrl());
  
  // URL cá nhân hóa: bao gồm tên khách và số bàn tiệc nếu có
  const cardUrl = formatGuestLink(`${host.replace(/\/+$/, "")}/show/${encodeURIComponent(card.slug)}`, guest.name, {
    cardId: card.id, guestId: guest.id, tableNumber: guest.tableNumber,
  });

  const groomName = card.groom?.name || "Chú Rể";
  const brideName = card.bride?.name || "Cô Dâu";
  const dateStr = card.weddingDate ? `vào ngày ${card.weddingDate}` : "trong ngày vui trọng đại";
  const venueStr = card.events?.[0]?.venue ? `tại ${card.events[0].venue}` : "";
  const tableNotice = guest.tableNumber ? `\n- Vị trí đón tiếp: ${guest.tableNumber}` : "";

  const shareText = [
    `💌 THIỆP CƯỚI TRÂN TRỌNG 💌`,
    `Thân gửi: ${guest.name}`,
    ``,
    `Chúng mình là ${groomName} & ${brideName}.`,
    `Trân trọng kính mời bạn và gia đình tới tham dự lễ thành hôn cùng chúng mình ${dateStr} ${venueStr}.${tableNotice}`,
    ``,
    `👉 Bấm mở thiệp cưới điện tử tại:`,
    `${cardUrl}`,
    ``,
    `Sự hiện diện của bạn là niềm vinh hạnh và hạnh phúc lớn nhất của chúng mình! ❤️`,
  ].join("\n");

  // Định dạng Zalo Share Link:
  // https://zalo.me/share?url=...
  const zaloUrl = `https://zalo.me/share?url=${encodeURIComponent(cardUrl)}&text=${encodeURIComponent(shareText)}`;

  return {
    cardUrl,
    zaloUrl,
    shareText,
  };
}

/**
 * Xuất danh sách khách mời thành file CSV Excel
 */
export function exportGuestsToCsv(guests: GuestItem[]): string {
  const headers = ["Họ Và Tên", "Số Điện Thoại", "Nhóm Quan Hệ", "Số Bàn Tiệc", "Số Lượng Khách", "Trạng Thái", "Ghi Chú"];
  
  const groupLabelMap: Record<GuestGroup, string> = {
    groom_side: "Nhà Trai",
    bride_side: "Nhà Gái",
    friends: "Bạn Bè",
    colleagues: "Đồng Nghiệp",
    vip: "VIP",
    other: "Khác",
  };

  const statusLabelMap: Record<GuestInviteStatus, string> = {
    not_sent: "Chưa gửi",
    sent: "Đã gửi",
    viewed: "Đã xem",
    confirmed: "Sẽ tham dự",
    declined: "Báo bận",
  };

  const rows = guests.map((g) => [
    `"${g.name.replace(/"/g, '""')}"`,
    `"${g.phone || ""}"`,
    `"${groupLabelMap[g.group] || "Khác"}"`,
    `"${g.tableNumber || ""}"`,
    `"${g.responseGuests ?? g.estimatedGuests ?? 1}"`,
    `"${statusLabelMap[g.status] || "Chưa gửi"}"`,
    `"${(g.notes || "").replace(/"/g, '""')}"`,
  ]);

  // BOM UTF-8 để mở tiếng Việt trên Microsoft Excel không bị vỡ font
  return "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}
