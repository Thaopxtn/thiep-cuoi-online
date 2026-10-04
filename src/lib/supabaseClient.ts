/**
 * Supabase Zero-Cost Database Client
 * Tích hợp trực tiếp qua REST API (không cần cài thêm dependency nặng)
 * Tự động chuyển đổi giữa Supabase Cloud (0đ) và Bộ nhớ cục bộ nếu chưa cấu hình
 */

import { WeddingCard, WeddingRsvp, WeddingWish } from "./weddingCardService";
// @ts-ignore
import lzutf8 from "lzutf8";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  "";

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes("your-project")
);

const getHeaders = () => ({
  "Content-Type": "application/json",
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  Prefer: "return=representation",
});

/**
 * Nén dữ liệu cây thiệp (nodes) bằng LZUTF8 thành chuỗi Base64 siêu nhẹ
 */
export function compressTemplateNodes(nodes: Record<string, any>): string {
  try {
    const jsonStr = JSON.stringify(nodes);
    return lzutf8.compress(jsonStr, { outputEncoding: "Base64" });
  } catch (err) {
    console.error("Lỗi khi nén nodes thiệp:", err);
    return "";
  }
}

/**
 * Giải nén chuỗi Base64 LZUTF8 thành object cây thiệp
 */
export function decompressTemplateNodes(compressed: string): Record<string, any> | null {
  try {
    const jsonStr = lzutf8.decompress(compressed, { inputEncoding: "Base64" });
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("Lỗi khi giải nén nodes thiệp:", err);
    return null;
  }
}

// ================= SUPABASE DATABASE CALLS =================

/**
 * Lấy tất cả thiệp từ Supabase
 */
export async function fetchCardsFromSupabase(): Promise<WeddingCard[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/cards?select=*,rsvps(*),wishes(*)`, {
      headers: getHeaders(),
      next: { revalidate: 10 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("Lỗi tải thiệp từ Supabase:", err);
    return null;
  }
}

/**
 * Lấy thiệp theo ID hoặc Slug từ Supabase
 */
export async function fetchCardBySlugFromSupabase(slug: string): Promise<WeddingCard | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/cards?or=(slug.eq.${slug},id.eq.${slug})&select=*,rsvps(*),wishes(*)`,
      {
        headers: getHeaders(),
        next: { revalidate: 5 },
      }
    );
    if (!res.ok) return null;
    const cards = await res.json();
    return cards.length > 0 ? cards[0] : null;
  } catch (err) {
    console.warn("Lỗi tải thiệp theo slug từ Supabase:", err);
    return null;
  }
}

/**
 * Lưu hoặc cập nhật thiệp lên Supabase
 */
export async function upsertCardToSupabase(card: WeddingCard): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/cards`, {
      method: "POST",
      headers: {
        ...getHeaders(),
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(card),
    });
    return res.ok;
  } catch (err) {
    console.error("Lỗi upsert thiệp lên Supabase:", err);
    return false;
  }
}

/**
 * Thêm phản hồi RSVP lên Supabase
 */
export async function insertRsvpToSupabase(rsvp: WeddingRsvp): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rsvps`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(rsvp),
    });
    return res.ok;
  } catch (err) {
    console.error("Lỗi thêm RSVP lên Supabase:", err);
    return false;
  }
}

/**
 * Thêm lời chúc vào Sổ lưu bút lên Supabase
 */
export async function insertWishToSupabase(wish: WeddingWish): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/wishes`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(wish),
    });
    return res.ok;
  } catch (err) {
    console.error("Lỗi thêm lời chúc lên Supabase:", err);
    return false;
  }
}
