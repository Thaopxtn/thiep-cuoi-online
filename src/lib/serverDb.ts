/**
 * Backend Database Service for Supabase Cloud (0đ Egress/Hosting)
 * Chạy trên Server-side (Next.js API Routes & Server Components)
 * Sử dụng Service Role Key để toàn quyền đọc/ghi không bị chặn bởi RLS
 */

// @ts-ignore
import lzutf8 from "lzutf8";
import fs from "fs";
import path from "path";
import { WeddingCard, WeddingRsvp, WeddingWish } from "@/data/initialCards";
import { fetchWithDeadline as fetchWithTimeout } from "./serverFetch";

const LOCAL_CARDS_FILE = path.join(process.cwd(), "src", "data", "cards-local-db.json");

let localCardsCache: WeddingCard[] | null = null;
let lastMtimeMs = 0;

function readLocalCards(): WeddingCard[] {
  try {
    if (fs.existsSync(LOCAL_CARDS_FILE)) {
      const stat = fs.statSync(LOCAL_CARDS_FILE);
      if (localCardsCache && stat.mtimeMs === lastMtimeMs) {
        return localCardsCache;
      }
      const raw = fs.readFileSync(LOCAL_CARDS_FILE, "utf8");
      localCardsCache = JSON.parse(raw);
      lastMtimeMs = stat.mtimeMs;
      return localCardsCache || [];
    }
  } catch {}
  return localCardsCache || [];
}


export class DatabaseUnavailableError extends Error {
  readonly status = 503;
  constructor(message = "Không thể kết nối cơ sở dữ liệu") {
    super(message);
    this.name = "DatabaseUnavailableError";
  }
}

export type DatabaseReadOptions = { strict?: boolean };

function writeLocalCard(card: Partial<WeddingCard> & { id: string }): boolean {
  try {
    // Do not change the in-memory view until the file write has succeeded.
    const cards = [...readLocalCards()];
    const idx = cards.findIndex((c) => c.id === card.id || (card.slug && c.slug === card.slug));
    if (idx >= 0) {
      cards[idx] = { ...cards[idx], ...card };
    } else {
      cards.unshift(card as WeddingCard);
    }
    const dir = path.dirname(LOCAL_CARDS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_CARDS_FILE, JSON.stringify(cards), "utf8");
    localCardsCache = cards;
    try {
      const stat = fs.statSync(LOCAL_CARDS_FILE);
      lastMtimeMs = stat.mtimeMs;
    } catch {}
    return true;
  } catch (err) {
    console.warn("Lỗi ghi cards-local-db.json:", err);
    return false;
  }
}

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
  } else if (row.nodes) {
    nodes = row.nodes;
  }

  const groomMeta = row.groom || {};

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
    musicTitle: row.musicTitle ?? "Thiên đường với người thương",
    musicUrl: row.musicUrl || "",
    rsvps: Array.isArray(row.rsvps) ? row.rsvps : [],
    wishes: Array.isArray(row.wishes) ? row.wishes : [],
    nodes,
    userId: row.user_id || row.userId || groomMeta.userId || undefined,
    showGiftBox:
      row.showGiftBox !== undefined
        ? Boolean(row.showGiftBox)
        : (groomMeta.showGiftBox !== undefined ? Boolean(groomMeta.showGiftBox) : true),
    showWishes:
      row.showWishes !== undefined
        ? Boolean(row.showWishes)
        : (groomMeta.showWishes !== undefined ? Boolean(groomMeta.showWishes) : true),
    showRsvp:
      row.showRsvp !== undefined
        ? Boolean(row.showRsvp)
        : (groomMeta.showRsvp !== undefined ? Boolean(groomMeta.showRsvp) : true),
    showEvents:
      row.showEvents !== undefined
        ? Boolean(row.showEvents)
        : (groomMeta.showEvents !== undefined ? Boolean(groomMeta.showEvents) : true),
    showCalendar:
      row.showCalendar !== undefined
        ? Boolean(row.showCalendar)
        : (groomMeta.showCalendar !== undefined ? Boolean(groomMeta.showCalendar) : true),
    showLoveStory:
      row.showLoveStory !== undefined
        ? Boolean(row.showLoveStory)
        : (groomMeta.showLoveStory !== undefined ? Boolean(groomMeta.showLoveStory) : true),
    showAlbum:
      row.showAlbum !== undefined
        ? Boolean(row.showAlbum)
        : (groomMeta.showAlbum !== undefined ? Boolean(groomMeta.showAlbum) : true),
    envelopeTheme: row.envelopeTheme || groomMeta.envelopeTheme || "traditional",
    ambientEffect: row.ambientEffect || groomMeta.ambientEffect,
    effectConfig: row.effectConfig || groomMeta.effectConfig,
    cinematicFx: row.cinematicFx || groomMeta.cinematicFx,
    loveStory: Array.isArray(row.loveStory)
      ? row.loveStory
      : Array.isArray(groomMeta.loveStory)
      ? groomMeta.loveStory
      : undefined,
    fixedModuleStyles: row.fixedModuleStyles || groomMeta.fixedModuleStyles,
    rsvpTitle: row.rsvpTitle !== undefined ? row.rsvpTitle : groomMeta.rsvpTitle,
    rsvpMessage: row.rsvpMessage !== undefined ? row.rsvpMessage : groomMeta.rsvpMessage,
    wishesTitle: row.wishesTitle !== undefined ? row.wishesTitle : groomMeta.wishesTitle,
    wishesDescription: row.wishesDescription !== undefined ? row.wishesDescription : groomMeta.wishesDescription,
    isVip: Boolean(groomMeta.isVip ?? row.isVip ?? false),
    plan: groomMeta.plan || row.plan || ((groomMeta.isVip ?? row.isVip) ? "vip" : "free"),
    vipUnlockedAt: groomMeta.vipUnlockedAt || row.vipUnlockedAt,
    showWatermark:
      groomMeta.showWatermark !== undefined
        ? Boolean(groomMeta.showWatermark)
        : (row.showWatermark !== undefined
          ? Boolean(row.showWatermark)
          : !Boolean(groomMeta.isVip ?? row.isVip)),
  };
}

/**
 * Lấy tất cả thiệp từ Supabase (hỗ trợ lọc theo userId)
 */
export async function getCardsFromDb(userId?: string, token?: string, options: DatabaseReadOptions = {}): Promise<WeddingCard[]> {
  const localCards = readLocalCards();
  if (!isDbConfigured) {
    if (options.strict) throw new DatabaseUnavailableError("Cơ sở dữ liệu chưa được cấu hình");
    if (userId) return localCards.filter((c: WeddingCard) => c.userId === userId);
    return localCards;
  }
  try {
    const query = userId
      ? `${SUPABASE_URL}/rest/v1/cards?user_id=eq.${encodeURIComponent(userId)}&select=*,rsvps(*),wishes(*)&order=updatedAt.desc`
      : `${SUPABASE_URL}/rest/v1/cards?select=*,rsvps(*),wishes(*)&order=updatedAt.desc`;
    const res = await fetchWithTimeout(query, {
      headers: getDbHeaders(token),
      cache: "no-store",
    });
    if (!res.ok) {
      throw new DatabaseUnavailableError("Không thể tải danh sách thiệp từ cơ sở dữ liệu");
    }
    const data = await res.json();
    if (!Array.isArray(data)) throw new DatabaseUnavailableError("Dữ liệu danh sách thiệp không hợp lệ");
    const mapped = data.map(mapDbToCard);

    // Nếu có userId: lọc nghiêm ngặt theo đúng userId của tài khoản (Tuyệt đối không gộp thiệp lạ không chủ)
    if (userId) {
      return mapped.filter((c: WeddingCard) => c.userId === userId);
    }
    return mapped;
  } catch (err) {
    if (options.strict) throw err instanceof DatabaseUnavailableError ? err : new DatabaseUnavailableError();
    console.error("Lỗi getCardsFromDb:", err);
    return [];
  }
}

/**
 * Lấy thiệp theo ID hoặc Slug
 */
export async function getCardByIdOrSlugFromDb(idOrSlug: string): Promise<WeddingCard | null> {
  const localCards = readLocalCards();
  const localFound = localCards.find((c) => c.id === idOrSlug || c.slug === idOrSlug);

  if (!isDbConfigured) return localFound || null;
  try {
    const encoded = encodeURIComponent(idOrSlug);
    const res = await fetchWithTimeout(
      `${SUPABASE_URL}/rest/v1/cards?or=(id.eq.${encoded},slug.eq.${encoded})&select=*,rsvps(*),wishes(*)`,
      {
        headers: getDbHeaders(),
        cache: "no-store",
      }
    );
    if (!res.ok) throw new DatabaseUnavailableError("Không thể tải thiệp từ cơ sở dữ liệu");
    const cards = await res.json();
    if (!Array.isArray(cards)) throw new DatabaseUnavailableError("Dữ liệu thiệp không hợp lệ");
    // A confirmed empty result must not resurrect a deleted card from the offline cache.
    const found = cards.find((row: any) => row.id === idOrSlug) || cards.find((row: any) => row.slug === idOrSlug);
    return found ? mapDbToCard(found) : null;
  } catch (err) {
    // Authorization must never use stale cached ownership when the database is unavailable.
    throw err instanceof DatabaseUnavailableError ? err : new DatabaseUnavailableError();
  }
}

/**
 * Lưu hoặc cập nhật thiệp cưới (Upsert)
 */
export async function upsertCardToDb(
  card: Partial<WeddingCard> & { id: string; name: string },
  token?: string,
  options: { createOnly?: boolean } = {}
): Promise<WeddingCard | null> {
  // Chỉ ghi local cache khi chế độ offline không cấu hình database
  if (!isDbConfigured) {
    if (process.env.NODE_ENV === "production") return null;
    if (options.createOnly && readLocalCards().some((item) => item.id === card.id || (card.slug && item.slug === card.slug))) {
      return null;
    }
    return writeLocalCard(card) ? card as WeddingCard : null;
  }
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
        accountName: card.groom?.accountName ?? card.groom?.name,
        showGiftBox: card.showGiftBox,
        showWishes: card.showWishes,
        showRsvp: card.showRsvp,
        showEvents: card.showEvents,
        showCalendar: card.showCalendar,
        showLoveStory: card.showLoveStory,
        showAlbum: card.showAlbum,
        envelopeTheme: card.envelopeTheme,
        ambientEffect: card.ambientEffect,
        effectConfig: card.effectConfig,
        cinematicFx: card.cinematicFx,
        loveStory: card.loveStory,
        fixedModuleStyles: card.fixedModuleStyles,
        rsvpTitle: card.rsvpTitle,
        rsvpMessage: card.rsvpMessage,
        wishesTitle: card.wishesTitle,
        wishesDescription: card.wishesDescription,
        isVip: card.isVip,
        plan: card.plan,
        vipUnlockedAt: card.vipUnlockedAt,
        showWatermark: card.showWatermark,
      },
      bride: {
        ...(card.bride || {}),
        accountName: card.bride?.accountName ?? card.bride?.name,
      },
      events: card.events || [],
      albumImages: card.album || [],
      musicUrl: card.musicUrl || "",
      musicTitle: card.musicTitle || "",
    };

    if (pageData) {
      payload.pageData = pageData;
    }

    if (!options.createOnly) return saveCardContentToDb(card.id, payload);

    let res = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/cards`, {
      method: "POST",
      headers: {
        ...getDbHeaders(),
        Prefer: options.createOnly ? "return=representation" : "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      // Graceful fallback nếu Supabase schema cache chưa nhận diện cột user_id (PGRST204)
      if (payload.user_id && (errText.includes("user_id") || errText.includes("PGRST204"))) {
        console.warn("Cột user_id chưa có trong schema cache Supabase, thử lại lưu qua groom metadata...");
        delete payload.user_id;
        res = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/cards`, {
          method: "POST",
          headers: {
            ...getDbHeaders(),
            Prefer: options.createOnly ? "return=representation" : "resolution=merge-duplicates,return=representation",
          },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        console.error("Lỗi upsertCardToDb HTTP:", res.status, errText);
        return null;
      }
    }

    const result = await res.json();
    if (Array.isArray(result) && result.length === 1 && result[0].id === card.id) {
      const saved = mapDbToCard(result[0]);
      return saved;
    }
    return null;
  } catch (err) {
    console.error("Lỗi upsertCardToDb:", err);
    return null;
  }
}

/** Routes authorize the caller; the database atomically preserves owner, views and billing. */
export async function saveCardContentToDb(id: string, content: Record<string, unknown>): Promise<WeddingCard | null> {
  if (!isDbConfigured) return null;
  try {
    const response = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/rpc/save_card_content`, {
      method: "POST", headers: getDbHeaders(), body: JSON.stringify({ card_key: id, content }),
    });
    if (!response.ok) return null;
    const result = await response.json();
    const row = Array.isArray(result) && result.length === 1 ? result[0] : result;
    if (!row || row.id !== id) return null;
    const saved = mapDbToCard(row);
    return saved;
  } catch {
    return null;
  }
}

/**
 * Xóa thiệp cưới theo ID
 */
export async function deleteCardFromDb(id: string, _token?: string): Promise<boolean> {
  if (!isDbConfigured) return false;
  try {
    const res = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/cards?id=eq.${id}`, {
      method: "DELETE",
      headers: {
        // Ownership is verified by the API before invoking this server-only operation.
        ...getDbHeaders(),
        Prefer: "return=representation",
      },
    });
    if (!res.ok) return false;
    const deletedRows = await res.json().catch(() => []);
    // Xác minh thực tế có bản ghi bị xóa (tránh báo thành công giả khi ID không tồn tại)
    return Array.isArray(deletedRows) && deletedRows.length > 0;
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
    // Tăng trực tiếp trong DB để tránh mất lượt xem khi có nhiều request đồng thời.
    const res = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/rpc/increment_card_views`, {
      method: "POST",
      headers: getDbHeaders(),
      body: JSON.stringify({ card_key: idOrSlug }),
    });
    if (!res.ok) return false;
    const updatedCount = await res.json().catch(() => 0);
    return Number(updatedCount) > 0;
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
      guests: rsvp.attending === false ? 0 : Math.min(10, Math.max(1, rsvp.guests ?? 1)),
      note: rsvp.note || "",
      createdAt: new Date().toISOString(),
    };

    const res = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/rsvps`, {
      method: "POST",
      headers: getDbHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error("Lỗi createRsvpInDb HTTP:", res.status, await res.text());
      return null;
    }

    const inserted = await res.json();
    return Array.isArray(inserted) && inserted.length === 1 && inserted[0].id === payload.id && inserted[0].cardId === payload.cardId
      ? inserted[0] : null;
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
    const res = await fetchWithTimeout(
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
  id?: string;
  cardId: string;
  name: string;
  content: string;
}): Promise<WeddingWish | null> {
  if (!isDbConfigured) return null;
  try {
    const payload = {
      id: wish.id || `wish_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      cardId: wish.cardId,
      name: wish.name,
      content: wish.content,
      createdAt: new Date().toISOString(),
    };

    const res = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/wishes`, {
      method: "POST",
      headers: { ...getDbHeaders(), ...(wish.id ? { Prefer: "resolution=ignore-duplicates,return=representation" } : {}) },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error("Lỗi createWishInDb HTTP:", res.status, await res.text());
      return null;
    }

    const inserted = await res.json();
    if (Array.isArray(inserted) && inserted.length === 1 && inserted[0].id === payload.id && inserted[0].cardId === payload.cardId) return inserted[0];
    if (wish.id && Array.isArray(inserted) && inserted.length === 0) {
      // An idempotent retry is only acknowledged after reading the existing committed row.
      const existing = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/wishes?id=eq.${encodeURIComponent(wish.id)}&cardId=eq.${encodeURIComponent(wish.cardId)}`, {
        headers: getDbHeaders(), cache: "no-store",
      });
      if (!existing.ok) return null;
      const rows = await existing.json();
      if (Array.isArray(rows) && rows.length === 1 && rows[0].id === wish.id && rows[0].cardId === wish.cardId) return rows[0];
    }
    return null;
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
    const res = await fetchWithTimeout(
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
export async function getAllRsvpsFromDb(options: DatabaseReadOptions = {}): Promise<WeddingRsvp[]> {
  if (!isDbConfigured) {
    if (options.strict) throw new DatabaseUnavailableError("Cơ sở dữ liệu chưa được cấu hình");
    return [];
  }
  try {
    const res = await fetchWithTimeout(
      `${SUPABASE_URL}/rest/v1/rsvps?order=createdAt.desc`,
      {
        headers: getDbHeaders(),
        cache: "no-store",
      }
    );
    if (!res.ok) throw new DatabaseUnavailableError("Không thể tải RSVP từ cơ sở dữ liệu");
    const rows = await res.json();
    if (!Array.isArray(rows)) throw new DatabaseUnavailableError("Dữ liệu RSVP không hợp lệ");
    return rows;
  } catch (err) {
    if (options.strict) throw err instanceof DatabaseUnavailableError ? err : new DatabaseUnavailableError();
    console.error("Lỗi getAllRsvpsFromDb:", err);
    return [];
  }
}

/**
 * Lấy danh sách tất cả lời chúc toàn hệ thống (Dành cho Admin)
 */
export async function getAllWishesFromDb(options: DatabaseReadOptions = {}): Promise<WeddingWish[]> {
  if (!isDbConfigured) {
    if (options.strict) throw new DatabaseUnavailableError("Cơ sở dữ liệu chưa được cấu hình");
    return [];
  }
  try {
    const res = await fetchWithTimeout(
      `${SUPABASE_URL}/rest/v1/wishes?order=createdAt.desc`,
      {
        headers: getDbHeaders(),
        cache: "no-store",
      }
    );
    if (!res.ok) throw new DatabaseUnavailableError("Không thể tải lời chúc từ cơ sở dữ liệu");
    const rows = await res.json();
    if (!Array.isArray(rows)) throw new DatabaseUnavailableError("Dữ liệu lời chúc không hợp lệ");
    return rows;
  } catch (err) {
    if (options.strict) throw err instanceof DatabaseUnavailableError ? err : new DatabaseUnavailableError();
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
    const res = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/rsvps?id=eq.${id}`, {
      method: "DELETE",
      headers: getDbHeaders(),
    });
    return res.ok;
  } catch (err) {
    console.error("Lỗi deleteRsvpFromDb:", err);
    return false;
  }
}

/** Caller must authorize ownership of cardId before updating its RSVP. */
export async function updateCardRsvpInDb(
  cardId: string,
  rsvpId: string,
  updates: Partial<WeddingRsvp>,
  _accessToken?: string
): Promise<WeddingRsvp | null> {
  const editableFields = [
    "name", "phone", "attending", "guests", "note", "checkedIn", "checkedInAt", "tableNumber",
  ] as const;
  const payload: Record<string, unknown> = Object.fromEntries(editableFields
    .filter((key) => updates[key] !== undefined)
    .map((key) => [key, updates[key]]));
  if (updates.checkedIn === false) payload.checkedInAt = null;
  if (Object.keys(payload).length === 0) return null;

  if (!isDbConfigured) {
    if (process.env.NODE_ENV === "production") return null;
    const card = readLocalCards().find((item) => item.id === cardId);
    const existing = card?.rsvps?.find((item) => item.id === rsvpId);
    if (!card || !existing) return null;
    const updated = { ...existing, ...payload, id: rsvpId, cardId,
      ...(updates.checkedIn === false ? { checkedInAt: undefined } : {}),
    } as WeddingRsvp;
    return writeLocalCard({ ...card, rsvps: card.rsvps.map((item) => item.id === rsvpId ? updated : item) })
      ? updated : null;
  }

  try {
    const res = await fetchWithTimeout(
      `${SUPABASE_URL}/rest/v1/rsvps?id=eq.${encodeURIComponent(rsvpId)}&cardId=eq.${encodeURIComponent(cardId)}`,
      { method: "PATCH", headers: getDbHeaders(), body: JSON.stringify(payload) }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) && rows.length === 1 && rows[0].id === rsvpId && rows[0].cardId === cardId
      ? rows[0] : null;
  } catch (err) {
    console.error("Lỗi updateCardRsvpInDb:", err);
    return null;
  }
}

/** Caller must authorize ownership of cardId before deleting its RSVP. */
export async function deleteCardRsvpFromDb(
  cardId: string,
  rsvpId: string,
  _accessToken?: string
): Promise<boolean> {
  if (!isDbConfigured) {
    if (process.env.NODE_ENV === "production") return false;
    const card = readLocalCards().find((item) => item.id === cardId);
    if (!card?.rsvps?.some((item) => item.id === rsvpId)) return false;
    return writeLocalCard({ ...card, rsvps: card.rsvps.filter((item) => item.id !== rsvpId) });
  }
  try {
    const res = await fetchWithTimeout(
      `${SUPABASE_URL}/rest/v1/rsvps?id=eq.${encodeURIComponent(rsvpId)}&cardId=eq.${encodeURIComponent(cardId)}`,
      { method: "DELETE", headers: getDbHeaders() }
    );
    if (!res.ok) return false;
    const rows = await res.json();
    return Array.isArray(rows) && rows.length === 1 && rows[0].id === rsvpId && rows[0].cardId === cardId;
  } catch (err) {
    console.error("Lỗi deleteCardRsvpFromDb:", err);
    return false;
  }
}

/**
 * Xóa một lời chúc (Dành cho Admin)
 */
export async function deleteWishFromDb(id: string): Promise<boolean> {
  if (!isDbConfigured) return false;
  try {
    const res = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/wishes?id=eq.${id}`, {
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
  return Boolean(await saveCardContentToDb(id, { status }));
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
export async function getUsersWithStatsFromDb(options: DatabaseReadOptions & { cards?: WeddingCard[] } = {}): Promise<AdminUserStats[]> {
  if (!isDbConfigured) {
    if (options.strict) throw new DatabaseUnavailableError("Cơ sở dữ liệu chưa được cấu hình");
    return [];
  }
  try {
    // 1. Lấy danh sách tài khoản từ Supabase Auth Admin API
    let authUsers: any[] = [];
    try {
      const res = await fetchWithTimeout(`${SUPABASE_URL}/auth/v1/admin/users`, {
        headers: getDbHeaders(),
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json?.users)) {
          authUsers = json.users;
        } else if (options.strict) throw new DatabaseUnavailableError("Dữ liệu tài khoản không hợp lệ");
      } else if (options.strict) throw new DatabaseUnavailableError("Không thể tải tài khoản từ cơ sở dữ liệu");
    } catch (e) {
      if (options.strict) throw e;
      console.warn("Lỗi fetch auth users:", e);
    }

    // 2. Lấy toàn bộ thiệp cưới
    const cards = options.cards ?? await getCardsFromDb(undefined, undefined, options);

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
    if (options.strict) throw err instanceof DatabaseUnavailableError ? err : new DatabaseUnavailableError();
    console.error("Lỗi getUsersWithStatsFromDb:", err);
    return [];
  }
}

/**
 * Tự động kích hoạt VIP cho thiệp cưới khi nhận webhook thanh toán VietQR
 */
export async function activateCardVipInDb(
  idOrSlug: string,
  _paymentMeta?: any
): Promise<{ success: boolean; card?: WeddingCard }> {
  return setCardVipInDb(idOrSlug, true);
}

export async function setCardVipInDb(
  idOrSlug: string,
  enabled: boolean
): Promise<{ success: boolean; card?: WeddingCard }> {
  try {
    if (!isDbConfigured) {
      const card = await getCardByIdOrSlugFromDb(idOrSlug);
      if (!card) return { success: false };
      const entitlements = { isVip: enabled, plan: enabled ? "vip" : "free", showWatermark: !enabled,
        vipUnlockedAt: enabled ? card.vipUnlockedAt || new Date().toISOString() : undefined };
      const updatedCard = { ...card, ...entitlements, groom: { ...card.groom, ...entitlements } } as WeddingCard;
      if (process.env.NODE_ENV === "production" || !writeLocalCard(updatedCard)) {
        return { success: false };
      }
      return { success: true, card: updatedCard };
    }

    // Merge billing into the current row under the same lock used by content saves.
    const res = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/rpc/set_card_vip`, {
      method: "POST",
      headers: getDbHeaders(),
      body: JSON.stringify({ card_key: idOrSlug, enabled }),
    });
    if (!res.ok) return { success: false };

    const result = await res.json();
    const row = Array.isArray(result) && result.length === 1 ? result[0] : result;
    if (!row || (row.id !== idOrSlug && row.slug !== idOrSlug) ||
        row.groom?.isVip !== enabled || row.groom?.plan !== (enabled ? "vip" : "free") ||
        row.groom?.showWatermark !== !enabled) {
      return { success: false };
    }

    const saved = mapDbToCard(row);
    return { success: true, card: saved };
  } catch (err) {
    console.error("Lỗi activateCardVipInDb:", err);
    return { success: false };
  }
}



