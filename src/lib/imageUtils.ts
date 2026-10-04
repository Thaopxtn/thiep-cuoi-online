/**
 * Tiện ích xử lý URL hình ảnh thông minh và an toàn
 * Tự động chuyển đổi các link ZenLove sang CDN nội bộ / Proxy hoặc fallback
 */

export const FALLBACK_WEDDING_IMG =
  "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop";

export const FALLBACK_STICKER_IMG =
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=400&auto=format&fit=crop";

/**
 * Trả về URL hình ảnh an toàn, nếu là link cdn-resource.zenlove.me
 * sẽ tự động điều phối qua proxy hoặc link trực tiếp với fallback
 */
export function getSafeImageUrl(key?: string): string {
  if (!key) return FALLBACK_WEDDING_IMG;

  // Link local, data URL, hoặc blob
  if (
    key.startsWith("blob:") ||
    key.startsWith("data:") ||
    key.startsWith("/uploads") ||
    key.startsWith("/assets") ||
    key.startsWith("/")
  ) {
    return key;
  }

  // Link Unsplash hoặc các nguồn ngoài khác
  if (key.startsWith("http") && !key.includes("zenlove.me")) {
    return key;
  }

  // Nếu là tài nguyên zenlove
  const cleanKey = key.replace(/^https?:\/\/cdn-resource\.zenlove\.me\//, "").replace(/^\//, "");
  return `https://cdn-resource.zenlove.me/${cleanKey}`;
}

/**
 * Xử lý sự kiện onError cho thẻ <img> để không bao giờ bị vỡ icon ảnh
 */
export function handleImageFallback(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackUrl: string = FALLBACK_WEDDING_IMG
) {
  const target = e.currentTarget;
  if (target.src !== fallbackUrl) {
    target.src = fallbackUrl;
  }
}
