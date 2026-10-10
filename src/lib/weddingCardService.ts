"use client";

import hongPhongNodes from "@/data/templates/hong-phong-nodes.json";
import { convertFormTemplateToCanvasNodes } from "./templateFormAdapter";

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

  const cleanSlug = templateIdOrSlug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const newCardId = `card_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const newSlug = `${cleanSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newCard: WeddingCard = {
    id: newCardId,
    slug: newSlug,
    name: `Thiệp Cưới ${templateName} - ${customGroom || "Đức Mạnh"} & ${customBride || "Thùy Dung"}`,
    templateId: templateIdOrSlug,
    templateName,
    status: "published",
    updatedAt: new Date().toLocaleDateString("vi-VN"),
    views: 1,
    coverImage: coverImage || "https://cdn-resource.zenlove.me/uploads/862861ad-96f7-4738-b17f-56ad4f5c1e28/QkFhLVRoQW4tVGlhbl8xNzg5OTE0NzgyOTM4X3hodWtzYWpiZzE.jpg",
    story: "Hẹn nhau trong ngày hạnh phúc. Một ngày đặc biệt, một lời hẹn trăm năm và thật nhiều yêu thương.",
    weddingDate: "2026-11-18",
    weddingTime: "11:00",
    lunarDate: "Ngày 10 tháng 10 năm Bính Ngọ",
    groom: {
      name: customGroom || "Đức Mạnh",
      title: "Chú Rể",
      phone: "0912.345.678",
      parents: "Ông Nguyễn Văn Hùng & Bà Trần Thị Lan",
      bankName: "MB BANK",
      accountNumber: "240220038888",
    },
    bride: {
      name: customBride || "Thùy Dung",
      title: "Cô Dâu",
      phone: "0987.654.321",
      parents: "Ông Lê Văn Thành & Bà Vũ Thị Mai",
      bankName: "TECHCOMBANK",
      accountNumber: "190365824988",
    },
    events: [
      {
        id: "evt-1",
        title: "Lễ Vu Quy (Nhà Gái)",
        time: "08:30 • 18/11/2026",
        venue: "Tư gia Nhà Gái",
        address: "Số 45 Tràng Tiền, Hoàn Kiếm, Hà Nội",
        mapUrl: "https://maps.google.com/?q=Trang+Tien+Hanoi",
      },
      {
        id: "evt-2",
        title: "Lễ Thành Hôn (Nhà Trai)",
        time: "10:00 • 18/11/2026",
        venue: "Tư gia Nhà Trai",
        address: "Số 88 Hoàng Hoa Thám, Ba Đình, Hà Nội",
        mapUrl: "https://maps.google.com/?q=Hoang+Hoa+Tham+Hanoi",
      },
      {
        id: "evt-3",
        title: "Tiệc Cưới Chung Vui",
        time: "11:30 • 18/11/2026",
        venue: "Trung tâm Tiệc cưới Trống Đồng Palace",
        address: "72 Quán Sứ, Hoàn Kiếm, Hà Nội",
        mapUrl: "https://maps.google.com/?q=Trong+Dong+Palace",
      },
    ],
    album: [coverImage].filter(Boolean),
    musicTitle: "Beautiful In White",
    musicUrl: "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3",
    rsvps: [],
    wishes: [],
    nodes: parsedNodes,
  };

  saveCard(newCard);
  return newCard;
}


