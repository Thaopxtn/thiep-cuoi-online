"use client";

import hongPhongNodes from "@/data/templates/hong-phong-nodes.json";
import { convertFormTemplateToCanvasNodes } from "./templateFormAdapter";
import { findZenloveTemplate } from "@/data/zenloveTemplates";
import { generateBrandedWeddingSlug } from "@/lib/brandedSlug";
import { extractWeddingDetailsFromTemplate } from "./templateExtractor";

import {
  type WeddingEvent,
  type WeddingRsvp,
  type WeddingWish,
  type WeddingCard,
  INITIAL_CARDS,
} from "@/data/initialCards";
import { apiFetch } from "@/lib/apiClient";
export type { WeddingEvent, WeddingRsvp, WeddingWish, WeddingCard };
export { INITIAL_CARDS };
let cardCacheRevision = 0;
let cardListRequestId = 0;
const latestCardListRequests = new Map<string, number>();

export function getCurrentAuth(): { id?: string, token?: string } {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem("zenlove_auth_user");
    if (raw) {
      const u = JSON.parse(raw);
      return { id: u?.id, token: u?.accessToken };
    }
  } catch {}
  return {};
}

export function getCurrentUserId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem("zenlove_auth_user");
    if (raw) {
      const u = JSON.parse(raw);
      return u?.id;
    }
  } catch {}
  return undefined;
}

export function getCardsStorageKey(userId?: string): string {
  const uid = userId || getCurrentUserId();
  return uid ? `zenlove_cards_${uid}` : "zenlove_guest_cards_v1";
}

export async function fetchCardsFromServer(userId?: string): Promise<WeddingCard[]> {
  const uid = userId || getCurrentUserId();
  const storageKey = getCardsStorageKey(uid);
  const cacheRevision = cardCacheRevision;
  const requestId = ++cardListRequestId;
  latestCardListRequests.set(storageKey, requestId);
  try {
    const url = uid ? `/api/cards?userId=${encodeURIComponent(uid)}` : "/api/cards";
    const res = await apiFetch(url);
    if (!res.ok) return getAllCards(uid);
    const data = await res.json();
    if (data.success && Array.isArray(data.cards)) {
      // An older listing must not resurrect a deleted card or erase a newly acknowledged RSVP.
      if (cacheRevision !== cardCacheRevision || latestCardListRequests.get(storageKey) !== requestId) return getAllCards(uid);
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, JSON.stringify(data.cards));
      }
      return data.cards;
    }
  } catch (err) {
    console.warn("fetchCardsFromServer fallback to local:", err);
  }
  return getAllCards(uid);
}

export async function fetchCardFromServer(slugOrId: string): Promise<WeddingCard | null> {
  try {
    const res = await fetch(`/api/show/${slugOrId}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success && data.card) {
      return data.card;
    }
  } catch (err) {
    console.warn("fetchCardFromServer fallback:", err);
  }
  return null;
}

export function getAllCards(userId?: string): WeddingCard[] {
  if (typeof window === "undefined") return [];
  const uid = userId || getCurrentUserId();
  const storageKey = getCardsStorageKey(uid);
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      // Khách vãng lai chưa đăng nhập: trả về thiệp mẫu
      // Đã đăng nhập: trả về mảng rỗng để không bị lẫn thiệp của tài khoản khác
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const INITIAL_CARD_IDS = new Set(INITIAL_CARDS.map((c) => c.id));
    return parsed.filter(
      (c: WeddingCard) =>
        !INITIAL_CARD_IDS.has(c.id) &&
        (uid ? (c.userId === uid || c.groom?.userId === uid) : true)
    );
  } catch (e) {
    return [];
  }
}

export function getCardByIdOrSlug(idOrSlug: string): WeddingCard | undefined {
  if (typeof window !== "undefined") {
    try {
      const byDirectId = localStorage.getItem(`card_${idOrSlug}`);
      if (byDirectId) return JSON.parse(byDirectId);
      const byDirectSlug = localStorage.getItem(`card_slug_${idOrSlug}`);
      if (byDirectSlug) return JSON.parse(byDirectSlug);
    } catch {}
  }
  const cards = getAllCards();
  const found = cards.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
  if (found) return found;
  return INITIAL_CARDS.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
}

// Tự động dọn dẹp các cache thiệp cũ không hoạt động khi LocalStorage bị đầy
function pruneOldLocalStorageCache(keepCardId?: string) {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("card_") || key.startsWith("card_slug_"))) {
        if (!keepCardId || !key.includes(keepCardId)) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.slice(0, Math.ceil(keysToRemove.length / 2)).forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {}
    });
  } catch {}
}

export function saveCard(card: WeddingCard): void {
  if (typeof window === "undefined") return;
  cardCacheRevision += 1;
  const currentUid = card.userId || getCurrentUserId();
  const updatedCard: WeddingCard = {
    ...card,
    userId: currentUid,
    updatedAt: new Date().toLocaleDateString("vi-VN"),
  };

  const storageKey = getCardsStorageKey(currentUid);

  // 1. Thử lưu vào localStorage (bọc cẩn thận phòng QuotaExceededError khi nodes canvas lớn)
  try {
    const cards = getAllCards(currentUid);
    const existingIndex = cards.findIndex((c) => c.id === card.id || c.slug === card.slug);
    
    // Lưu tóm tắt metadata trong danh sách thẻ (không chứa nodes nặng) để tiết kiệm 95% bộ nhớ
    const summaryCard: WeddingCard = {
      ...updatedCard,
      nodes: undefined,
    };

    let nextCards: WeddingCard[];
    if (existingIndex >= 0) {
      nextCards = [...cards];
      nextCards[existingIndex] = summaryCard;
    } else {
      nextCards = [summaryCard, ...cards];
    }
    localStorage.setItem(storageKey, JSON.stringify(nextCards));

    // Lưu thẻ đầy đủ kèm nodes vào direct key
    try {
      localStorage.setItem(`card_${card.id}`, JSON.stringify(updatedCard));
      if (card.slug) {
        localStorage.setItem(`card_slug_${card.slug}`, JSON.stringify(updatedCard));
      }
    } catch (quotaErr) {
      // Nếu đầy bộ nhớ, dọn dẹp cache cũ rồi thử lại
      pruneOldLocalStorageCache(card.id);
      try {
        localStorage.setItem(`card_${card.id}`, JSON.stringify(updatedCard));
      } catch {}
    }
  } catch (e) {
    pruneOldLocalStorageCache(card.id);
    console.warn("LocalStorage write fallback:", e);
  }


}

/**
 * Phiên bản bất đồng bộ của saveCard - đợi Server DB xác nhận lưu thành công
 */

/**
 * Lấy thiệp cưới phục vụ cho Editor (gửi Bearer token để lấy đầy đủ private DTO kể cả bản nháp)
 */
export async function fetchCardForEditor(id: string): Promise<{
  success: boolean;
  card?: WeddingCard;
  isOwner?: boolean;
  status?: number;
  message?: string;
}> {
  try {
    const res = await apiFetch(`/api/cards/${id}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.card) {
        return { success: true, card: data.card, isOwner: data.isOwner };
      }
    }
    const errData = await res.json().catch(() => ({}));
    return {
      success: false,
      status: res.status,
      message: errData.message || `Máy chủ trả về HTTP ${res.status}`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Lỗi kết nối khi tải thiệp từ máy chủ",
    };
  }
}

type CardSaveResult = { success: boolean; message?: string };
const pendingCardSaves = new Map<string, Promise<CardSaveResult>>();

export async function saveCardAsync(card: WeddingCard): Promise<CardSaveResult> {
  const currentUid = card.userId || getCurrentUserId();
  // Capture the complete snapshot now; requests for one card must reach the server in order.
  let body: string;
  try {
    body = JSON.stringify({ ...card, userId: currentUid });
  } catch {
    return { success: false, message: "Dữ liệu thiệp không hợp lệ" };
  }
  const previous = pendingCardSaves.get(card.id);
  const operation: Promise<CardSaveResult> = (previous || Promise.resolve()).then(async () => {
    try {
    const res = await apiFetch(`/api/cards/${card.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success === false) return { success: false, message: data.message || "Không thể lưu thiệp" };
      // A completed older request must not replace a newer local edit waiting in the queue.
      if (pendingCardSaves.get(card.id) === operation) saveCard(data.card || JSON.parse(body));
      return { success: true, message: data.message || "Đã lưu lên máy chủ thành công" };
    }
    const errData = await res.json().catch(() => ({}));
    return { success: false, message: errData.message || `Máy chủ trả về HTTP ${res.status}` };
  } catch (err: any) {
    return { success: false, message: err?.message || "Lỗi kết nối máy chủ" };
  }
  });
  pendingCardSaves.set(card.id, operation);
  try {
    return await operation;
  } finally {
    if (pendingCardSaves.get(card.id) === operation) pendingCardSaves.delete(card.id);
  }
}

type InteractionMutationOptions = { localOnly?: boolean };

function isAnonymousDemo(cardId: string, options: InteractionMutationOptions): boolean {
  if (!options.localOnly) return false;
  const auth = getCurrentAuth();
  const card = getCardByIdOrSlug(cardId);
  if (!card || auth.id || auth.token || card.userId || card.groom?.userId) {
    throw new Error("Chỉ dữ liệu xem thử chưa đăng nhập mới được lưu riêng trên thiết bị");
  }
  return true;
}

// Update matching cached records only. Public interactions must not adopt a card into
// the current user's account or replace a private editor snapshot with a public DTO.
function updateCardCaches(cardId: string, update: (card: WeddingCard) => WeddingCard | null): void {
  cardCacheRevision += 1;
  if (typeof window === "undefined") return;
  let keys: Array<string | null>;
  try {
    keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index));
  } catch {
    return;
  }
  for (const key of keys) {
    if (!key || !(key.startsWith("card_") || key.startsWith("zenlove_cards_") || key === "zenlove_guest_cards_v1")) continue;
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      if (Array.isArray(value)) {
        if (!value.some((card) => card.id === cardId || card.slug === cardId)) continue;
        const next = value.flatMap((card) => {
          if (card.id !== cardId && card.slug !== cardId) return [card];
          const updated = update(card);
          return updated ? [updated] : [];
        });
        localStorage.setItem(key, JSON.stringify(next));
      } else if (value && (value.id === cardId || value.slug === cardId)) {
        const updated = update(value);
        if (updated) localStorage.setItem(key, JSON.stringify(updated));
        else localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn("Không thể cập nhật bộ nhớ đệm sau khi máy chủ xác nhận:", error);
    }
  }
}

export async function deleteCard(cardId: string, options: InteractionMutationOptions = {}): Promise<void> {
  if (!isAnonymousDemo(cardId, options)) {
    await pendingCardSaves.get(cardId);
    const res = await apiFetch(`/api/cards/${encodeURIComponent(cardId)}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success !== true) throw new Error(data.message || `Không thể xóa thiệp (HTTP ${res.status})`);
  }
  updateCardCaches(cardId, () => null);
}

export function incrementCardViews(idOrSlug: string): void {
  if (typeof window === "undefined") return;
  try {
    const storageKey = getCardsStorageKey();
    const cards = getAllCards();
    const card = cards.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
    if (card) {
      card.views = (card.views || 0) + 1;
      const existingIndex = cards.findIndex((c) => c.id === card.id);
      cards[existingIndex] = card;
      localStorage.setItem(storageKey, JSON.stringify(cards));
    }

    // Ghi nhận lên Server
    fetch(`/api/show/${idOrSlug}/view`, {
      method: "POST",
    }).catch(() => {});
  } catch (e) {}
}

export async function addRsvp(
  cardId: string,
  rsvp: Omit<WeddingRsvp, "id" | "cardId" | "createdAt">,
  options: InteractionMutationOptions & { asOwner?: boolean } = {}
): Promise<WeddingRsvp> {
  let saved: WeddingRsvp;
  if (isAnonymousDemo(cardId, options)) {
    saved = { ...rsvp, id: `rsvp_demo_${crypto.randomUUID()}`, cardId, createdAt: new Date().toISOString() };
  } else {
    const url = options.asOwner
      ? `/api/cards/${encodeURIComponent(cardId)}/rsvps`
      : `/api/show/${encodeURIComponent(cardId)}/rsvp`;
    const res = await apiFetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rsvp) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success !== true || !data.rsvp?.id || !data.rsvp?.createdAt) {
      throw new Error(data.message || `Không thể lưu phản hồi RSVP (HTTP ${res.status})`);
    }
    saved = { ...rsvp, cardId, ...data.rsvp };
  }
  updateCardCaches(cardId, (card) => ({ ...card, rsvps: [saved, ...(card.rsvps || []).filter((item) => item.id !== saved.id)] }));
  return saved;
}

function getCardForRsvpMutation(cardId: string): WeddingCard {
  const summary = getAllCards().find((c) => c.id === cardId || c.slug === cardId);
  const full = getCardByIdOrSlug(cardId);
  if (!summary && !full) throw new Error("Không tìm thấy thiệp cưới");
  return { ...full, ...summary, nodes: full?.nodes || summary?.nodes } as WeddingCard;
}

async function persistRsvpMutation(
  card: WeddingCard,
  rsvpId: string,
  updates?: Partial<WeddingRsvp>
): Promise<WeddingRsvp | null> {
  const auth = getCurrentAuth();
  // Only anonymous demo data may remain on this device. Real accounts must use the owner API.
  if (!auth.id && !auth.token && !card.userId) return updates ? {
    ...card.rsvps.find((r) => r.id === rsvpId)!, ...updates,
  } : null;
  const res = await apiFetch(`/api/cards/${encodeURIComponent(card.id)}/rsvps/${encodeURIComponent(rsvpId)}`, {
    method: updates ? "PATCH" : "DELETE",
    headers: { "Content-Type": "application/json" },
    ...(updates ? { body: JSON.stringify(updates) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success !== true || (updates && !data.rsvp)) {
    throw new Error(data.message || `Không thể cập nhật khách mời (HTTP ${res.status})`);
  }
  return data.rsvp || null;
}

export async function deleteRsvp(cardId: string, rsvpId: string): Promise<void> {
  const card = getCardForRsvpMutation(cardId);
  if (!card.rsvps?.some((r) => r.id === rsvpId)) throw new Error("Không tìm thấy khách mời");
  await persistRsvpMutation(card, rsvpId);
  const latest = getCardForRsvpMutation(cardId);
  saveCard({ ...latest, rsvps: latest.rsvps.filter((r) => r.id !== rsvpId) });
}

export async function updateRsvpStatus(
  cardId: string,
  rsvpId: string,
  attending: boolean,
  guests?: number
): Promise<void> {
  const card = getCardForRsvpMutation(cardId);
  const current = card.rsvps?.find((r) => r.id === rsvpId);
  if (!current) throw new Error("Không tìm thấy khách mời");
  const updated = await persistRsvpMutation(card, rsvpId, {
    attending, guests: attending ? (guests ?? current.guests ?? 1) : 0,
  });
  const latest = getCardForRsvpMutation(cardId);
  saveCard({ ...latest, rsvps: latest.rsvps.map((r) => r.id === rsvpId ? updated! : r) });
}
export async function toggleRsvpCheckIn(
  cardId: string,
  rsvpId: string,
  tableNumber?: string | number
): Promise<boolean> {
  const card = getCardForRsvpMutation(cardId);
  const current = card.rsvps?.find((r) => r.id === rsvpId);
  if (!current) throw new Error("Không tìm thấy khách mời");
  const checkedIn = !current.checkedIn;
  const updated = await persistRsvpMutation(card, rsvpId, {
    checkedIn,
    ...(!getCurrentAuth().id && !getCurrentAuth().token && !card.userId ? { checkedInAt: checkedIn ? new Date().toISOString() : undefined } : {}),
    ...(tableNumber !== undefined ? { tableNumber } : {}),
  });
  const latest = getCardForRsvpMutation(cardId);
  saveCard({ ...latest, rsvps: latest.rsvps.map((r) => r.id === rsvpId ? updated! : r) });
  return Boolean(updated?.checkedIn);
}

export async function addWish(cardId: string, name: string, content: string, options: InteractionMutationOptions = {}): Promise<WeddingWish> {
  let saved: WeddingWish;
  if (isAnonymousDemo(cardId, options)) {
    saved = { id: `wish_demo_${crypto.randomUUID()}`, cardId, name, content, createdAt: new Date().toISOString() };
  } else {
    const res = await apiFetch(`/api/show/${encodeURIComponent(cardId)}/wishes`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, content }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success !== true || !data.wish?.id || !data.wish?.createdAt) {
      throw new Error(data.message || `Không thể lưu lời chúc (HTTP ${res.status})`);
    }
    saved = { cardId, name, content, ...data.wish };
  }
  updateCardCaches(cardId, (card) => ({ ...card, wishes: [saved, ...(card.wishes || []).filter((item) => item.id !== saved.id)] }));
  return saved;
}

export function toggleWishLike(cardId: string, wishId: string): number {
  if (typeof window === "undefined") return 1;
  try {
    const storageKey = getCardsStorageKey();
    const cards = getAllCards();
    const card = cards.find((c) => c.id === cardId || c.slug === cardId);
    if (card && card.wishes) {
      const wish = card.wishes.find((w) => w.id === wishId);
      if (wish) {
        wish.likes = (wish.likes || 0) + 1;
        const existingIndex = cards.findIndex((c) => c.id === card.id);
        cards[existingIndex] = card;
        localStorage.setItem(storageKey, JSON.stringify(cards));
        return wish.likes;
      }
    }
  } catch (e) {
    console.error("toggleWishLike error:", e);
  }
  return 1;
}


/**
 * Clone trực tiếp bất kỳ mẫu nào từ ZenLove về thành thiệp cưới mới của người dùng
 */
export async function cloneTemplateToNewCard(
  templateIdOrSlug: string,
  customGroom?: string,
  customBride?: string,
  userId?: string
): Promise<WeddingCard> {
  const currentUid = userId || getCurrentUserId();
  if (!currentUid) {
    throw new Error("Vui lòng đăng nhập để bắt đầu tạo thiệp cưới mới.");
  }

  // 1. Gọi API server clone với Bearer Token
  try {
    const res = await apiFetch("/api/cards/clone", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(currentUid ? { "x-user-id": currentUid } : {}),
      },
      body: JSON.stringify({
        templateId: templateIdOrSlug,
        templateSlug: templateIdOrSlug,
        customGroom,
        customBride,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.card) {
        saveCard(data.card);
        return data.card;
      }
    }

    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || "Không thể khởi tạo mẫu thiệp cưới trên máy chủ.");
  } catch (err: any) {
    console.error("Lỗi clone thiệp:", err);
    throw err;
  }

  // 2. Client-side fallback: Tải dữ liệu nodes từ API zenlove-template
  let parsedNodes: Record<string, any> | undefined = undefined;
  let coverImage = "";
  let templateName = "Hồng Phong";

  try {
    const tplRes = await fetch(`/api/zenlove-template/${templateIdOrSlug}`);
    if (tplRes.ok) {
      const tplData = await tplRes.json();
      if (tplData.success && tplData.data) {
        const incomingNodes = tplData.data.parsedNodes;
        if (incomingNodes) {
          if (!incomingNodes.ROOT) {
            parsedNodes = convertFormTemplateToCanvasNodes(incomingNodes, tplData.data);
          } else {
            parsedNodes = incomingNodes;
          }
        }
        coverImage = tplData.data.imageUrl || "";
        templateName = tplData.data.name || templateName;
      }
    }
  } catch {}

  const meta = findZenloveTemplate(templateIdOrSlug);
  const templateCode = meta?.code || (meta?.orderNumber ? `mau${String(meta?.orderNumber).padStart(2, "0")}` : "mau01");

  // Trích xuất thông tin thực tế từ template nodes và metadata
  const extracted = extractWeddingDetailsFromTemplate(parsedNodes, meta);

  const groomName = customGroom || extracted.groomName || "Tiến Đạt";
  const brideName = customBride || extracted.brideName || "Ngọc Nhi";
  const weddingDate = extracted.weddingDate || "2026-11-18";
  const weddingTime = extracted.weddingTime || "11:00";
  const lunarDate = extracted.lunarDate || "Ngày 10 tháng 10 năm Bính Ngọ";
  const venueAddress = extracted.venueAddress || "125 Đường Nguyễn Thị Minh Khai, P. Bến Thành, TP HCM";
  const venueName = extracted.venueName || "Tư gia Nhà Trai";
  coverImage = meta?.imageUrl || extracted.coverImage || coverImage || "https://cdn-resource.zenlove.me/uploads/862861ad-96f7-4738-b17f-56ad4f5c1e28/QkFhLVRoQW4tVGlhbl8xNzg5OTE0NzgyOTM4X3hodWtzYWpiZzE.jpg";
  const musicTitle = extracted.musicTitle || "Beautiful In White";
  const musicUrl = extracted.musicUrl || "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3";

  const newSlug = generateBrandedWeddingSlug({
    userName: (getCurrentAuth() as any).user?.name,
    groomName,
    brideName,
    websiteName: "zenlove",
    templateCode,
    includeUniqueSuffix: true,
  });
  const newCardId = `card_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const newCard: WeddingCard = {
    id: newCardId,
    slug: newSlug,
    name: `Thiệp Cưới ${templateName} - ${groomName} & ${brideName}`,
    templateId: templateIdOrSlug,
    templateName,
    status: "published",
    updatedAt: new Date().toLocaleDateString("vi-VN"),
    views: 1,
    coverImage,
    story:
      extracted.story ||
      "Hẹn nhau trong ngày hạnh phúc. Một ngày đặc biệt, một lời hẹn trăm năm và thật nhiều yêu thương.",
    weddingDate,
    weddingTime,
    lunarDate,
    groom: {
      name: groomName,
      title: "Chú Rể",
      phone: "0912.345.678",
      parents: extracted.parentsGroom || "Ông Nguyễn Văn Hùng & Bà Trần Thị Lan",
      bankName: "MB BANK",
      accountNumber: "240220038888",
    },
    bride: {
      name: brideName,
      title: "Cô Dâu",
      phone: "0987.654.321",
      parents: extracted.parentsBride || "Ông Lê Văn Thành & Bà Vũ Thị Mai",
      bankName: "TECHCOMBANK",
      accountNumber: "190365824988",
    },
    events: [
      {
        id: "evt-1",
        title: "Lễ Vu Quy (Nhà Gái)",
        time: `08:30 • ${weddingDate.split("-").reverse().join("/")}`,
        venue: "Tư gia Nhà Gái",
        address: venueAddress,
        mapUrl: `https://maps.google.com/?q=${encodeURIComponent(venueAddress)}`,
      },
      {
        id: "evt-2",
        title: "Lễ Thành Hôn (Nhà Trai)",
        time: `${weddingTime} • ${weddingDate.split("-").reverse().join("/")}`,
        venue: venueName,
        address: venueAddress,
        mapUrl: `https://maps.google.com/?q=${encodeURIComponent(venueAddress)}`,
      },
      {
        id: "evt-3",
        title: "Tiệc Cưới Chung Vui",
        time: `17:30 • ${weddingDate.split("-").reverse().join("/")}`,
        venue: "Trung tâm Tiệc cưới",
        address: venueAddress,
        mapUrl: `https://maps.google.com/?q=${encodeURIComponent(venueAddress)}`,
      },
    ],
    album: extracted.album.length > 0 ? extracted.album : [coverImage].filter(Boolean),
    musicTitle,
    musicUrl,
    rsvps: [],
    wishes: [],
    nodes: parsedNodes,
  };

  saveCard(newCard);
  return newCard;
}

/**
 * Chuẩn hóa và phân giải timestamp từ các định dạng ngày cưới (ISO YYYY-MM-DD, Việt Nam DD/MM/YYYY, v.v.)
 * Trả về milliseconds hoặc NaN nếu không thể parse
 */
export function parseWeddingTimestamp(dateStr?: string, timeStr?: string): number {
  if (!dateStr) return NaN;
  const cleanDate = dateStr.trim();
  const cleanTime = (timeStr || "11:00").trim().substring(0, 5);

  // 1. Nếu là định dạng Việt Nam DD/MM/YYYY hoặc DD-MM-YYYY
  const vnMatch = cleanDate.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (vnMatch) {
    const [, d, m, y] = vnMatch;
    const isoStr = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T${cleanTime}:00`;
    const parsed = new Date(isoStr).getTime();
    if (!isNaN(parsed)) return parsed;
  }

  // 2. Định dạng chuẩn ISO YYYY-MM-DD
  const direct = new Date(`${cleanDate}T${cleanTime}:00`).getTime();
  if (!isNaN(direct)) return direct;

  // 3. Fallback parse trực tiếp dateStr
  const fallback = new Date(cleanDate).getTime();
  return isNaN(fallback) ? NaN : fallback;
}


