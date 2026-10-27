/**
 * Dịch vụ Quản lý Sổ Mừng Cưới (Wedding Gift Ledger Service)
 * Hỗ trợ ghi nhận tiền mừng, phân loại phương thức (chuyển khoản / tiền mặt),
 * thống kê tổng số tiền và xuất báo cáo Excel cho cô dâu chú rể.
 */

export type GiftPaymentMethod = "transfer" | "cash" | "other";

export interface GiftEntry {
  id: string;
  cardId: string;
  senderName: string;
  amount: number;
  method: GiftPaymentMethod;
  relation?: "groom_side" | "bride_side" | "friends" | "colleagues" | "other";
  wishes?: string;
  createdAt: string;
}

export interface GiftStats {
  totalAmount: number;
  totalCount: number;
  transferAmount: number;
  transferCount: number;
  cashAmount: number;
  cashCount: number;
}

const STORAGE_PREFIX = "zenlove_gift_ledger_";

/**
 * Lấy danh sách phong bì mừng cưới theo cardId
 */
export function getGiftEntries(cardId: string): GiftEntry[] {
  if (typeof window === "undefined" || !cardId) return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${cardId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Lỗi đọc sổ mừng cưới:", err);
  }
  return [];
}

/**
 * Thêm một bản ghi tiền mừng mới vào sổ
 */
export function addGiftEntry(
  cardId: string,
  entry: Omit<GiftEntry, "id" | "cardId" | "createdAt">
): GiftEntry {
  const current = getGiftEntries(cardId);
  const newEntry: GiftEntry = {
    ...entry,
    id: `gift_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    cardId,
    createdAt: new Date().toISOString(),
  };

  const updated = [newEntry, ...current];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${cardId}`, JSON.stringify(updated));
    } catch (err) {
      console.error("Lỗi lưu sổ mừng cưới:", err);
    }
  }
  return newEntry;
}

/**
 * Xóa một bản ghi mừng cưới
 */
export function deleteGiftEntry(cardId: string, entryId: string): boolean {
  const current = getGiftEntries(cardId);
  const updated = current.filter((g) => g.id !== entryId);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${cardId}`, JSON.stringify(updated));
      return true;
    } catch (err) {
      console.error("Lỗi xóa bản ghi mừng cưới:", err);
    }
  }
  return false;
}

/**
 * Tính toán thống kê tài chính sổ mừng cưới
 */
export function calculateGiftStats(entries: GiftEntry[]): GiftStats {
  return entries.reduce(
    (acc, item) => {
      acc.totalAmount += item.amount || 0;
      acc.totalCount += 1;

      if (item.method === "transfer") {
        acc.transferAmount += item.amount || 0;
        acc.transferCount += 1;
      } else if (item.method === "cash") {
        acc.cashAmount += item.amount || 0;
        acc.cashCount += 1;
      }
      return acc;
    },
    {
      totalAmount: 0,
      totalCount: 0,
      transferAmount: 0,
      transferCount: 0,
      cashAmount: 0,
      cashCount: 0,
    }
  );
}

/**
 * Định dạng số tiền VND chuẩn Việt Nam (vd: 1.000.000 ₫)
 */
export function formatVndCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

/**
 * Xuất dữ liệu sổ mừng cưới ra file CSV mã hóa UTF-8 BOM
 */
export function exportGiftLedgerToCsv(entries: GiftEntry[], cardName?: string): string {
  const relationNames: Record<string, string> = {
    groom_side: "Họ Nhà Trai",
    bride_side: "Họ Nhà Gái",
    friends: "Bạn Bè",
    colleagues: "Đồng Nghiệp",
    other: "Khác",
  };

  const methodNames: Record<GiftPaymentMethod, string> = {
    transfer: "Chuyển khoản (VietQR)",
    cash: "Tiền mặt / Phong bì",
    other: "Khác",
  };

  const headers = "STT,Người mừng,Số tiền (VNĐ),Phương thức,Quan hệ,Lời chúc,Thời gian\n";

  const rows = entries
    .map((e, idx) => {
      const rel = e.relation ? relationNames[e.relation] || e.relation : "Chưa phân loại";
      const meth = methodNames[e.method] || e.method;
      const cleanWishes = (e.wishes || "").replace(/"/g, '""');
      const timeStr = new Date(e.createdAt).toLocaleString("vi-VN");
      return `"${idx + 1}","${e.senderName}","${e.amount}","${meth}","${rel}","${cleanWishes}","${timeStr}"`;
    })
    .join("\n");

  return "\uFEFF" + headers + rows;
}

/* ==========================================================================
   DỰ TOÁN CHI PHÍ & QUẢN TRỊ NGÂN SÁCH ĐÁM CƯỚI (WEDDING BUDGET PLANNER)
   ========================================================================== */

export type BudgetCategory =
  | "venue"       // Tiệc cưới & Nhà hàng
  | "decor"       // Trang trí hoa tươi & rạp cưới
  | "outfit"      // Váy cưới & Vest chú rể
  | "media"       // Quay phim & Chụp ảnh cưới
  | "jewelry"     // Nhẫn cưới & Trang sức
  | "invitation"  // In ấn thiệp & quà cảm ơn
  | "other";      // Chi phí khác

export interface BudgetItem {
  id: string;
  cardId: string;
  category: BudgetCategory;
  title: string;
  estimatedCost: number;
  actualCost: number;
  isPaid: boolean;
  notes?: string;
  createdAt: string;
}

export interface BudgetStats {
  totalEstimated: number;
  totalActual: number;
  totalPaid: number;
  totalRemaining: number;
}

const BUDGET_STORAGE_PREFIX = "zenlove_budget_planner_";

export const BUDGET_CATEGORIES: { id: BudgetCategory; label: string; icon: string }[] = [
  { id: "venue", label: "Tiệc cưới & Nhà hàng", icon: "🍽️" },
  { id: "decor", label: "Trang trí & Hoa tươi", icon: "💐" },
  { id: "outfit", label: "Váy cưới & Trang phục", icon: "👗" },
  { id: "media", label: "Quay phim & Chụp ảnh", icon: "📸" },
  { id: "jewelry", label: "Nhẫn cưới & Trang sức", icon: "💍" },
  { id: "invitation", label: "Thiệp cưới & Quà tặng", icon: "💌" },
  { id: "other", label: "Chi phí dự phòng / Khác", icon: "🏷️" },
];

export function getBudgetItems(cardId: string): BudgetItem[] {
  if (typeof window === "undefined" || !cardId) return [];
  try {
    const raw = localStorage.getItem(`${BUDGET_STORAGE_PREFIX}${cardId}`);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error("Lỗi đọc danh sách ngân sách:", err);
  }
  return [];
}

export function saveBudgetItems(cardId: string, items: BudgetItem[]): boolean {
  if (typeof window === "undefined" || !cardId) return false;
  try {
    localStorage.setItem(`${BUDGET_STORAGE_PREFIX}${cardId}`, JSON.stringify(items));
    return true;
  } catch (err) {
    console.error("Lỗi lưu ngân sách:", err);
    return false;
  }
}

export function addBudgetItem(
  cardId: string,
  item: Omit<BudgetItem, "id" | "cardId" | "createdAt">
): BudgetItem {
  const current = getBudgetItems(cardId);
  const newItem: BudgetItem = {
    ...item,
    id: `bdg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    cardId,
    createdAt: new Date().toISOString(),
  };

  const updated = [newItem, ...current];
  saveBudgetItems(cardId, updated);
  return newItem;
}

export function updateBudgetItem(
  cardId: string,
  itemId: string,
  updates: Partial<Omit<BudgetItem, "id" | "cardId" | "createdAt">>
): boolean {
  const current = getBudgetItems(cardId);
  let updatedItem = false;
  const updated = current.map((item) => {
    if (item.id === itemId) {
      updatedItem = true;
      return { ...item, ...updates };
    }
    return item;
  });

  if (updatedItem) {
    saveBudgetItems(cardId, updated);
  }
  return updatedItem;
}

export function deleteBudgetItem(cardId: string, itemId: string): boolean {
  const current = getBudgetItems(cardId);
  const updated = current.filter((item) => item.id !== itemId);
  if (updated.length !== current.length) {
    saveBudgetItems(cardId, updated);
    return true;
  }
  return false;
}

export function calculateBudgetStats(items: BudgetItem[]): BudgetStats {
  return items.reduce(
    (acc, item) => {
      acc.totalEstimated += item.estimatedCost || 0;
      acc.totalActual += item.actualCost || 0;
      if (item.isPaid) {
        acc.totalPaid += item.actualCost || item.estimatedCost || 0;
      }
      return acc;
    },
    {
      totalEstimated: 0,
      totalActual: 0,
      totalPaid: 0,
      totalRemaining: 0,
    }
  );
}

