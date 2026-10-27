/**
 * Dịch vụ Quản trị Khách mời & Phân bàn tiệc (Wedding Guest CRM & Seating Service)
 * Hỗ trợ: Quản lý khách mời, phân nhóm, gán bàn tiệc, theo dõi tiến độ gửi,
 * tạo liên kết Zalo 1-chạm cá nhân hóa và xuất dữ liệu Excel/CSV.
 */

import { WeddingCard } from "@/data/initialCards";

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
      return JSON.parse(raw);
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
  saveGuestsByCardId(cardId, updated);
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
    saveGuestsByCardId(cardId, updated);
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
    saveGuestsByCardId(cardId, updated);
    return true;
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
  defaultGroup: GuestGroup = "friends"
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
  saveGuestsByCardId(cardId, updated);
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
      if (g.status === "not_sent") acc.notSent += 1;
      else if (g.status === "sent") acc.sent += 1;
      else if (g.status === "confirmed") {
        acc.confirmed += 1;
        acc.totalSeats += g.estimatedGuests || 1;
      } else if (g.status === "declined") {
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
    origin || (typeof window !== "undefined" ? window.location.origin : "https://zenlove.me");
  
  // URL cá nhân hóa: bao gồm tên khách và số bàn tiệc nếu có
  const tableParam = guest.tableNumber ? `&table=${encodeURIComponent(guest.tableNumber)}` : "";
  const cardUrl = `${host}/show/${card.slug}?to=${encodeURIComponent(guest.name)}${tableParam}`;

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
    `"${g.estimatedGuests || 1}"`,
    `"${statusLabelMap[g.status] || "Chưa gửi"}"`,
    `"${(g.notes || "").replace(/"/g, '""')}"`,
  ]);

  // BOM UTF-8 để mở tiếng Việt trên Microsoft Excel không bị vỡ font
  return "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}
