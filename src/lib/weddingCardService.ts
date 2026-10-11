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
export type { WeddingEvent, WeddingRsvp, WeddingWish, WeddingCard };
export { INITIAL_CARDS };

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
  try {
    const url = uid ? `/api/cards?userId=${encodeURIComponent(uid)}` : "/api/cards";
    const res = await fetch(url, {
      headers: {
        ...(uid ? { "x-user-id": uid } : {}),
        ...(getCurrentAuth().token ? { "Authorization": `Bearer ${getCurrentAuth().token}` } : {})
      },
    });
    if (!res.ok) return getAllCards(uid);
    const data = await res.json();
    if (data.success && Array.isArray(data.cards)) {
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
      return uid ? [] : INITIAL_CARDS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
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
  return cards.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
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

  // 2. Luôn luôn đồng bộ lên Supabase Server API độc lập, không bị chặn bởi lỗi LocalStorage
  try {
    fetch(`/api/cards/${card.id}`, {
      method: "PUT",
      headers: {
          "Content-Type": "application/json",
          ...(currentUid ? { "x-user-id": currentUid } : {}),
          ...(getCurrentAuth().token ? { "Authorization": `Bearer ${getCurrentAuth().token}` } : {})
        },
      body: JSON.stringify(updatedCard),
    }).catch((err) => console.warn("Lưu lên Server API thất bại:", err));
  } catch (err) {
    console.warn("fetch saveCard error:", err);
  }
}

/**
 * Phiên bản bất đồng bộ của saveCard - đợi Server DB xác nhận lưu thành công
 */
export async function saveCardAsync(card: WeddingCard): Promise<{ success: boolean; message?: string }> {
  const currentUid = card.userId || getCurrentUserId();
  const cardWithUid = {
    ...card,
    userId: currentUid,
  };

  // Lưu local trước
  saveCard(cardWithUid);

  try {
    const res = await fetch(`/api/cards/${card.id}`, {
      method: "PUT",
      headers: {
          "Content-Type": "application/json",
          ...(currentUid ? { "x-user-id": currentUid } : {}),
          ...(getCurrentAuth().token ? { "Authorization": `Bearer ${getCurrentAuth().token}` } : {})
        },
      body: JSON.stringify(cardWithUid),
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, message: data.message || "Đã lưu lên máy chủ thành công" };
    }
    return { success: false, message: `Máy chủ trả về HTTP ${res.status}` };
  } catch (err: any) {
    return { success: false, message: err?.message || "Lỗi kết nối máy chủ" };
  }
}

export function deleteCard(cardId: string): void {
  if (typeof window === "undefined") return;
  try {
    const storageKey = getCardsStorageKey();
    const cards = getAllCards().filter((c) => c.id !== cardId);
    localStorage.setItem(storageKey, JSON.stringify(cards));

    // Đồng bộ xóa lên Supabase Server API
    const currentUid = getCurrentUserId();
    fetch(`/api/cards/${cardId}`, {
      method: "DELETE",
      headers: {
          ...(currentUid ? { "x-user-id": currentUid } : {}),
          ...(getCurrentAuth().token ? { "Authorization": `Bearer ${getCurrentAuth().token}` } : {})
        },
    }).catch((err) => console.warn("Xóa trên Server API thất bại:", err));
  } catch (e) {
    console.error("Failed to delete card:", e);
  }
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

export function addRsvp(cardId: string, rsvp: Omit<WeddingRsvp, "id" | "cardId" | "createdAt">): WeddingRsvp {
  const newRsvp: WeddingRsvp = {
    ...rsvp,
    id: `rsvp_${Date.now()}`,
    cardId,
    createdAt: new Date().toLocaleString("vi-VN"),
  };

  if (typeof window !== "undefined") {
    try {
      const storageKey = getCardsStorageKey();
      const cards = getAllCards();
      const card = cards.find((c) => c.id === cardId || c.slug === cardId);
      if (card) {
        card.rsvps = [newRsvp, ...(card.rsvps || [])];
        const existingIndex = cards.findIndex((c) => c.id === card.id);
        cards[existingIndex] = card;
        localStorage.setItem(storageKey, JSON.stringify(cards));
      }

      // Đồng bộ lên Supabase Server API
      fetch(`/api/show/${cardId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rsvp),
      }).catch((err) => console.warn("Gửi RSVP lên server thất bại:", err));
    } catch (e) {}
  }
  return newRsvp;
}

export function deleteRsvp(cardId: string, rsvpId: string): void {
  if (typeof window === "undefined") return;
  try {
    const storageKey = getCardsStorageKey();
    const cards = getAllCards();
    const card = cards.find((c) => c.id === cardId || c.slug === cardId);
    if (card && card.rsvps) {
      card.rsvps = card.rsvps.filter((r) => r.id !== rsvpId);
      const existingIndex = cards.findIndex((c) => c.id === card.id);
      cards[existingIndex] = card;
      localStorage.setItem(storageKey, JSON.stringify(cards));
      saveCard(card);
    }
  } catch (e) {
    console.error("deleteRsvp error:", e);
  }
}

export function updateRsvpStatus(
  cardId: string,
  rsvpId: string,
  attending: boolean,
  guests?: number
): void {
  if (typeof window === "undefined") return;
  try {
    const storageKey = getCardsStorageKey();
    const cards = getAllCards();
    const card = cards.find((c) => c.id === cardId || c.slug === cardId);
    if (card && card.rsvps) {
      card.rsvps = card.rsvps.map((r) => {
        if (r.id === rsvpId) {
          return {
            ...r,
            attending,
            guests: attending ? (guests ?? r.guests ?? 1) : 0,
          };
        }
        return r;
      });
      const existingIndex = cards.findIndex((c) => c.id === card.id);
      cards[existingIndex] = card;
      localStorage.setItem(storageKey, JSON.stringify(cards));
      saveCard(card);
    }
  } catch (e) {
    console.error("updateRsvpStatus error:", e);
  }
}

export function addWish(cardId: string, name: string, content: string): WeddingWish {
  const newWish: WeddingWish = {
    id: `wish_${Date.now()}`,
    cardId,
    name,
    content,
    createdAt: new Date().toLocaleString("vi-VN"),
  };

  if (typeof window !== "undefined") {
    try {
      const storageKey = getCardsStorageKey();
      const cards = getAllCards();
      const card = cards.find((c) => c.id === cardId || c.slug === cardId);
      if (card) {
        card.wishes = [newWish, ...(card.wishes || [])];
        const existingIndex = cards.findIndex((c) => c.id === card.id);
        cards[existingIndex] = card;
        localStorage.setItem(storageKey, JSON.stringify(cards));
      }

      // Đồng bộ lên Supabase Server API
      fetch(`/api/show/${cardId}/wishes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, content }),
      }).catch((err) => console.warn("Gửi lời chúc lên server thất bại:", err));
    } catch (e) {}
  }
  return newWish;
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

  // 1. Thử gọi API server clone
  try {
    const res = await fetch("/api/cards/clone", {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
          ...(currentUid ? { "x-user-id": currentUid } : {}),
          ...(getCurrentAuth().token ? { "Authorization": `Bearer ${getCurrentAuth().token}` } : {})
        },
      body: JSON.stringify({
        templateId: templateIdOrSlug,
        templateSlug: templateIdOrSlug,
        customGroom,
        customBride,
        userId: currentUid,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.card) {
        saveCard(data.card);
        return data.card;
      }
    }
  } catch (err) {
    console.warn("Lỗi gọi server clone, chuyển sang client fallback:", err);
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
        parsedNodes = tplData.data.parsedNodes;
        if (parsedNodes && !parsedNodes.ROOT) {
          parsedNodes = convertFormTemplateToCanvasNodes(parsedNodes, tplData.data);
        }
        coverImage = tplData.data.imageUrl || "";
        templateName = tplData.data.name || templateName;
      }
    }
  } catch {}

  const meta = findZenloveTemplate(templateIdOrSlug);
  const templateCode = meta?.code || (meta?.orderNumber ? `mau${String(meta.orderNumber).padStart(2, "0")}` : "mau01");

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


