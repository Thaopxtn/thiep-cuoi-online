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

const getDbHeaders = () => ({
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
  };
}

/**
 * Lấy tất cả thiệp từ Supabase
 */
export async function getCardsFromDb(): Promise<WeddingCard[]> {
  if (!isDbConfigured) return [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/cards?select=*,rsvps(*),wishes(*)&order=updatedAt.desc`,
      {
        headers: getDbHeaders(),
        cache: "no-store",
      }
    );
    if (!res.ok) {
      console.error("Lỗi getCardsFromDb HTTP:", res.status, await res.text());
      return [];
    }
    const data = await res.json();
    return data.map(mapDbToCard);
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
export async function upsertCardToDb(card: Partial<WeddingCard> & { id: string; name: string }): Promise<WeddingCard | null> {
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
      groom: card.groom || {},
      bride: card.bride || {},
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
export async function deleteCardFromDb(id: string): Promise<boolean> {
  if (!isDbConfigured) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/cards?id=eq.${id}`, {
      method: "DELETE",
      headers: getDbHeaders(),
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
