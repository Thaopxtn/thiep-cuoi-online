/**
 * Backend Database Service for Supabase Cloud (0đ Egress/Hosting)
 * Chạy trên Server-side (Next.js API Routes & Server Components)
 * Sử dụng Service Role Key để toàn quyền đọc/ghi không bị chặn bởi RLS
 */

// @ts-ignore
import lzutf8 from "lzutf8";
import { WeddingCard, WeddingRsvp, WeddingWish } from "@/data/initialCards";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

export const isDbConfigured = Boolean(
  SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes("your-project")
);

const getDbHeaders = (token?: string) => ({
  "Content-Type": "application/json",
  ...(token ? {
    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "",
    Authorization: `Bearer ${token}`
  } : {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`
  }),
  Prefer: "return=representation",
});

const old_getDbHeaders = () => ({
  "Content-Type": "application/json",
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  Prefer: "return=representation",
});

/**
 * Nén nodes thành chuỗi LZUTF8 Base64
 */
export function compressNodes(nodes: Record<string, any>): string {
  try {
    const jsonStr = JSON.stringify(nodes);
    return lzutf8.compress(jsonStr, { outputEncoding: "Base64" });
  } catch (err) {
    console.error("Lỗi khi nén nodes thiệp:", err);
    return "";
  }
}

/**
 * Giải nén chuỗi Base64 LZUTF8 thành cây nodes
 */
export function decompressNodes(compressed: string): Record<string, any> | null {
  try {
    const jsonStr = lzutf8.decompress(compressed, { inputEncoding: "Base64" });
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("Lỗi khi giải nén nodes thiệp:", err);
    return null;
  }
}

/**
 * Format dữ liệu từ DB thành WeddingCard
 */
function mapDbToCard(row: any): WeddingCard {
  let nodes: Record<string, any> | undefined = undefined;
  if (row.pageData) {
    nodes = decompressNodes(row.pageData) || undefined;
  }

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    templateId: row.templateId || row.id,
    templateName: row.templateName || "Hồng Phong",
    status: (row.status as "published" | "draft") || "draft",
    updatedAt: row.updatedAt
      ? new Date(row.updatedAt).toLocaleDateString("vi-VN")
      : new Date().toLocaleDateString("vi-VN"),
    views: Number(row.views || 0),
    coverImage: row.coverImage || "",
    story: row.story || "",
    weddingDate: row.weddingDate ? String(row.weddingDate) : "2026-11-18",
    weddingTime: row.weddingTime ? String(row.weddingTime).substring(0, 5) : "11:00",
    lunarDate: row.lunarDate || "",
    groom: row.groom || { name: "Chú Rể", title: "Chú Rể", phone: "" },
    bride: row.bride || { name: "Cô Dâu", title: "Cô Dâu", phone: "" },
    events: Array.isArray(row.events) ? row.events : [],
    album: Array.isArray(row.albumImages)
      ? row.albumImages
      : Array.isArray(row.album)
      ? row.album
      : [],
    musicTitle: row.musicTitle || "Thiên đường với người thương",
    musicUrl: row.musicUrl || "",
    rsvps: Array.isArray(row.rsvps) ? row.rsvps : [],
    wishes: Array.isArray(row.wishes) ? row.wishes : [],
    nodes,
    userId: row.groom?.userId || row.userId || undefined,
    showGiftBox:
      row.showGiftBox !== undefined
        ? Boolean(row.showGiftBox)
        : (row.groom?.showGiftBox !== undefined ? Boolean(row.groom.showGiftBox) : true),
    showWishes:
      row.showWishes !== undefined
        ? Boolean(row.showWishes)
        : (row.groom?.showWishes !== undefined ? Boolean(row.groom.showWishes) : true),
    showRsvp:
      row.showRsvp !== undefined
        ? Boolean(row.showRsvp)
        : (row.groom?.showRsvp !== undefined ? Boolean(row.groom.showRsvp) : true),
  };
}

/**
 * Lấy tất cả thiệp từ Supabase (hỗ trợ lọc theo userId)
 */
export async function getCardsFromDb(userId?: string, token?: string): Promise<WeddingCard[]> {
  if (!isDbConfigured) return [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/cards?select=*,rsvps(*),wishes(*)&order=updatedAt.desc`,
      {
        headers: getDbHeaders(token),
        cache: "no-store",
      }
    );
    if (!res.ok) {
      console.error("Lỗi getCardsFromDb HTTP:", res.status, await res.text());
      return [];
    }
    const data = await res.json();
    const mapped = data.map(mapDbToCard);
    if (userId) {
      return mapped.filter((c: WeddingCard) => c.userId === userId);
    }
    return mapped;
  } catch (err) {
    console.error("Lỗi getCardsFromDb:", err);
    return [];
  }
}

/**
 * Lấy thiệp theo ID hoặc Slug
 */
export async function getCardByIdOrSlugFromDb(idOrSlug: string): Promise<WeddingCard | null> {
  if (!isDbConfigured) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/cards?or=(id.eq.${idOrSlug},slug.eq.${idOrSlug})&select=*,rsvps(*),wishes(*)`,
      {
        headers: getDbHeaders(),
        cache: "no-store",
      }
    );
    if (!res.ok) {
      console.error("Lỗi getCardByIdOrSlugFromDb HTTP:", res.status, await res.text());
      return null;
    }
    const cards = await res.json();
    return cards.length > 0 ? mapDbToCard(cards[0]) : null;
  } catch (err) {
    console.error("Lỗi getCardByIdOrSlugFromDb:", err);
    return null;
  }
}

/**
 * Lưu hoặc cập nhật thiệp cưới (Upsert)
 */
export async function upsertCardToDb(card: Partial<WeddingCard> & { id: string; name: string }, token?: string): Promise<WeddingCard | null> {
  if (!isDbConfigured) return null;
  try {
    const slug =
      card.slug ||
      card.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "") + `-${Date.now().toString(36)}`;

    let pageData: string | undefined = undefined;
    if (card.nodes) {
      pageData = compressNodes(card.nodes);
    }

    const payload: Record<string, any> = {
      user_id: card.userId,
      id: card.id,
      slug,
      name: card.name,
      templateId: card.templateId || card.id,
      templateName: card.templateName || "Hồng Phong",
      status: card.status || "draft",
      updatedAt: new Date().toISOString(),
      views: card.views !== undefined ? card.views : 0,
      coverImage: card.coverImage || "",
      story: card.story || "",
      weddingDate: card.weddingDate || "2026-11-18",
      weddingTime: card.weddingTime || "11:00",
      lunarDate: card.lunarDate || "",
      groom: {
        ...(card.groom || {}),
        userId: card.userId || (card.groom as any)?.userId,
        accountName: card.groom?.accountName || card.groom?.name,
        showGiftBox: card.showGiftBox,
        showWishes: card.showWishes,
        showRsvp: card.showRsvp,
      },
      bride: {
        ...(card.bride || {}),
        accountName: card.bride?.accountName || card.bride?.name,
      },
      events: card.events || [],
      albumImages: card.album || [],
      musicUrl: card.musicUrl || "",
      musicTitle: card.musicTitle || "",
    };

    if (pageData) {
      payload.pageData = pageData;
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/cards`, {
      method: "POST",
      headers: {
        ...getDbHeaders(),
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error("Lỗi upsertCardToDb HTTP:", res.status, await res.text());
      return null;
    }

    const result = await res.json();
    return result && result.length > 0 ? mapDbToCard(result[0]) : null;
  } catch (err) {
    console.error("Lỗi upsertCardToDb:", err);
    return null;
  }
}

/**
 * Xóa thiệp cưới theo ID
 */
export async function deleteCardFromDb(id: string, token?: string): Promise<boolean> {
  if (!isDbConfigured) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/cards?id=eq.${id}`, {
      method: "DELETE",
      headers: getDbHeaders(token),
    });
    return res.ok;
  } catch (err) {
    console.error("Lỗi deleteCardFromDb:", err);
    return false;
  }
}

/**
 * Tăng lượt xem thiệp
 */
export async function incrementCardViewsInDb(idOrSlug: string): Promise<boolean> {
  if (!isDbConfigured) return false;
  try {
    const card = await getCardByIdOrSlugFromDb(idOrSlug);
    if (!card) return false;

    const nextViews = (card.views || 0) + 1;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/cards?id=eq.${card.id}`, {
      method: "PATCH",
      headers: getDbHeaders(),
      body: JSON.stringify({ views: nextViews }),
    });
    return res.ok;
  } catch (err) {
    console.error("Lỗi incrementCardViewsInDb:", err);
    return false;
  }
}

/**
 * Thêm phản hồi RSVP
 */
export async function createRsvpInDb(rsvp: {
  cardId: string;
  name: string;
  phone: string;
  attending?: boolean;
  guests?: number;
  note?: string;
}): Promise<WeddingRsvp | null> {
  if (!isDbConfigured) return null;
  try {
    const payload = {
      id: `rsvp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      cardId: rsvp.cardId,
      name: rsvp.name,
      phone: rsvp.phone,
      attending: rsvp.attending !== false,
      guests: rsvp.guests || 1,
      note: rsvp.note || "",
      createdAt: new Date().toISOString(),
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/rsvps`, {
      method: "POST",
      headers: getDbHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error("Lỗi createRsvpInDb HTTP:", res.status, await res.text());
      return null;
    }

    const inserted = await res.json();
    return inserted && inserted.length > 0 ? inserted[0] : payload;
  } catch (err) {
    console.error("Lỗi createRsvpInDb:", err);
    return null;
  }
}

/**
 * Lấy danh sách RSVP của thiệp
 */
export async function getRsvpsFromDb(cardId: string): Promise<WeddingRsvp[]> {
  if (!isDbConfigured) return [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/rsvps?cardId=eq.${cardId}&order=createdAt.desc`,
      {
        headers: getDbHeaders(),
        cache: "no-store",
      }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("Lỗi getRsvpsFromDb:", err);
    return [];
  }
}

/**
 * Thêm lời chúc vào Sổ lưu bút
 */
export async function createWishInDb(wish: {
  cardId: string;
  name: string;
  content: string;
}): Promise<WeddingWish | null> {
  if (!isDbConfigured) return null;
  try {
    const payload = {
      id: `wish_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      cardId: wish.cardId,
      name: wish.name,
      content: wish.content,
      createdAt: new Date().toISOString(),
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/wishes`, {
      method: "POST",
      headers: getDbHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error("Lỗi createWishInDb HTTP:", res.status, await res.text());
      return null;
    }

    const inserted = await res.json();
    return inserted && inserted.length > 0 ? inserted[0] : payload;
  } catch (err) {
    console.error("Lỗi createWishInDb:", err);
    return null;
  }
}

/**
 * Lấy danh sách lời chúc của thiệp
 */
export async function getWishesFromDb(cardId: string): Promise<WeddingWish[]> {
  if (!isDbConfigured) return [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/wishes?cardId=eq.${cardId}&order=createdAt.desc`,
      {
        headers: getDbHeaders(),
        cache: "no-store",
      }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("Lỗi getWishesFromDb:", err);
    return [];
  }
}

/**
 * Lấy danh sách tất cả RSVPs toàn hệ thống (Dành cho Admin)
 */
export async function getAllRsvpsFromDb(): Promise<WeddingRsvp[]> {
  if (!isDbConfigured) return [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/rsvps?order=createdAt.desc`,
      {
        headers: getDbHeaders(),
        cache: "no-store",
      }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("Lỗi getAllRsvpsFromDb:", err);
    return [];
  }
}

/**
 * Lấy danh sách tất cả lời chúc toàn hệ thống (Dành cho Admin)
 */
export async function getAllWishesFromDb(): Promise<WeddingWish[]> {
  if (!isDbConfigured) return [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/wishes?order=createdAt.desc`,
      {
        headers: getDbHeaders(),
        cache: "no-store",
      }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("Lỗi getAllWishesFromDb:", err);
    return [];
  }
}

/**
 * Xóa một phản hồi RSVP (Dành cho Admin)
 */
export async function deleteRsvpFromDb(id: string): Promise<boolean> {
  if (!isDbConfigured) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rsvps?id=eq.${id}`, {
      method: "DELETE",
      headers: getDbHeaders(),
    });
    return res.ok;
  } catch (err) {
    console.error("Lỗi deleteRsvpFromDb:", err);
    return false;
  }
}

/**
 * Xóa một lời chúc (Dành cho Admin)
 */
export async function deleteWishFromDb(id: string): Promise<boolean> {
  if (!isDbConfigured) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/wishes?id=eq.${id}`, {
      method: "DELETE",
      headers: getDbHeaders(),
    });
    return res.ok;
  } catch (err) {
    console.error("Lỗi deleteWishFromDb:", err);
    return false;
  }
}

/**
 * Cập nhật trạng thái thiệp cưới (Dành cho Admin)
 */
export async function updateCardStatusInDb(id: string, status: "draft" | "published"): Promise<boolean> {
  if (!isDbConfigured) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/cards?id=eq.${id}`, {
      method: "PATCH",
      headers: getDbHeaders(),
      body: JSON.stringify({ status, updatedAt: new Date().toISOString() }),
    });
    return res.ok;
  } catch (err) {
    console.error("Lỗi updateCardStatusInDb:", err);
    return false;
  }
}

export interface AdminUserStats {
  id: string;
  email: string;
  name: string;
  avatar: string;
  provider: string;
  createdAt: string;
  cardsCount: number;
  publishedCardsCount: number;
  totalViews: number;
  cards: { id: string; name: string; slug: string; status: string; views: number }[];
}

/**
 * Lấy danh sách toàn bộ người dùng và số thiệp đã tạo (Dành cho Admin)
 */
export async function getUsersWithStatsFromDb(): Promise<AdminUserStats[]> {
  if (!isDbConfigured) return [];
  try {
    // 1. Lấy danh sách tài khoản từ Supabase Auth Admin API
    let authUsers: any[] = [];
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        headers: getDbHeaders(),
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json?.users)) {
          authUsers = json.users;
        }
      }
    } catch (e) {
      console.warn("Lỗi fetch auth users:", e);
    }

    // 2. Lấy toàn bộ thiệp cưới
    const cards = await getCardsFromDb();

    // 3. Gom nhóm thiệp theo userId
    const userCardsMap = new Map<string, WeddingCard[]>();
    cards.forEach((c) => {
      const uid = c.userId;
      if (uid) {
        if (!userCardsMap.has(uid)) userCardsMap.set(uid, []);
        userCardsMap.get(uid)!.push(c);
      }
    });

    const resultUsers: AdminUserStats[] = [];
    const processedUserIds = new Set<string>();

    authUsers.forEach((u) => {
      processedUserIds.add(u.id);
      const myCards = userCardsMap.get(u.id) || [];
      const totalViews = myCards.reduce((acc, c) => acc + (c.views || 0), 0);
      const published = myCards.filter((c) => c.status === "published").length;
      resultUsers.push({
        id: u.id,
        email: u.email || "Chưa có email",
        name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "Người dùng ZenLove",
        avatar: u.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop",
        provider: u.app_metadata?.provider || (u.email ? "email" : "google"),
        createdAt: u.created_at || new Date().toISOString(),
        cardsCount: myCards.length,
        publishedCardsCount: published,
        totalViews,
        cards: myCards.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          status: c.status,
          views: c.views,
        })),
      });
    });

    // Nếu có thiệp cưới có userId nhưng chưa nằm trong authUsers
    userCardsMap.forEach((myCards: WeddingCard[], uid: string) => {
      if (!processedUserIds.has(uid)) {
        const totalViews = myCards.reduce((acc: number, c: WeddingCard) => acc + (c.views || 0), 0);
        const published = myCards.filter((c: WeddingCard) => c.status === "published").length;
        resultUsers.push({
          id: uid,
          email: `${uid.slice(0, 8)}@zenlove.user`,
          name: myCards[0]?.groom?.name ? `Tài khoản ${myCards[0].groom.name}` : `Người dùng ${uid.slice(0, 6)}`,
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop",
          provider: "guest",
          createdAt: myCards[0]?.updatedAt || new Date().toISOString(),
          cardsCount: myCards.length,
          publishedCardsCount: published,
          totalViews,
          cards: myCards.map((c: WeddingCard) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            status: c.status,
            views: c.views,
          })),
        });
      }
    });

    return resultUsers;
  } catch (err) {
    console.error("Lỗi getUsersWithStatsFromDb:", err);
    return [];
  }
}


