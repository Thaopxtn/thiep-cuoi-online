/**
 * Tiện ích xử lý URL hình ảnh thông minh và an toàn
 * Tự động chuyển đổi các link ZenLove sang CDN nội bộ / Proxy hoặc fallback
 */

export const FALLBACK_WEDDING_IMG =
  "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop";

export const FALLBACK_STICKER_IMG =
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=400&auto=format&fit=crop";

export const TRANSPARENT_PIXEL =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/>";

/**
 * Kiểm tra xem một key/URL có phải là họa tiết trang trí, sticker, nắp phong bì, hoa văn hay không
 */
export function isDecorativeAsset(key?: string): boolean {
  if (!key || typeof key !== "string") return false;
  const k = key.toLowerCase();
  return (
    k.includes("/templates/") ||
    k.includes("resources/") ||
    k.includes("flower") ||
    k.includes("envelope") ||
    k.includes("castle") ||
    k.includes("heart") ||
    k.includes("sticker") ||
    k.includes("decoration") ||
    k.includes("bg") ||
    k.includes("background")
  );
}

export const DEFAULT_WEDDING_BACKGROUND =
  "https://cdn-resource.zenlove.me/resources/background/mldw1mdn28infjta.png";

export const DEFAULT_WEDDING_BACKGROUND_RED =
  "https://cdn-resource.zenlove.me/resources/background/mj63stx45kzeibis.webp";

export const DEFAULT_WEDDING_BACKGROUND_SILK =
  "https://cdn-resource.zenlove.me/resources/background/miwpfurobs21mzu3.webp";

/**
 * Trả về URL hình ảnh an toàn:
 * - Bỏ qua các giá trị "none", "null", rỗng
 * - Giữ nguyên blob:, data:, /uploads, /assets
 * - Giữ nguyên các link http/https bên ngoài (Unsplash, ZenLove CDN đầy đủ, v.v.)
 * - Chuyển đổi các relative path của ZenLove (/templates/..., /resources/..., uploads/...) sang https://cdn-resource.zenlove.me/...
 */
export function getSafeImageUrl(key?: string, fallbackUrl: string = FALLBACK_WEDDING_IMG): string {
  if (!key || typeof key !== "string") return fallbackUrl;

  const clean = key.trim();
  if (!clean || clean.toLowerCase() === "none" || clean.toLowerCase() === "null") {
    return fallbackUrl;
  }

  // Link local preview, data URL, blob
  if (clean.startsWith("blob:") || clean.startsWith("data:")) {
    return clean;
  }

  // Link local public files: /uploads, /assets
  if (clean.startsWith("/uploads") || clean.startsWith("/assets")) {
    return clean;
  }

  // Sửa lỗi các URL/relative path mldw1mdn28infjta bị thiếu thư mục background/
  let path = clean;
  if (path.includes("resources/mldw1mdn28infjta") && !path.includes("resources/background/mldw1mdn28infjta")) {
    path = path.replace("resources/mldw1mdn28infjta", "resources/background/mldw1mdn28infjta");
    if (!path.endsWith(".png")) path += ".png";
  }

  // Link ngoài hoặc đã có domain (http://, https://)
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // Relative path từ CDN ZenLove (/templates/..., /resources/..., uploads/...)
  if (path.startsWith("/")) {
    return `https://cdn-resource.zenlove.me${path}`;
  }
  return `https://cdn-resource.zenlove.me/${path}`;
}

/**
 * Xử lý sự kiện onError cho thẻ <img>:
 * - Nếu ảnh từ ZenLove CDN bị lỗi mạng hoặc chặn hotlink, tự động thử lại qua Proxy nội bộ /api/proxy-image
 * - Nếu proxy vẫn lỗi hoặc là ảnh khác:
 *   + Ảnh trang trí/họa tiết/phong bì: fallback về TRANSPARENT_PIXEL
 *   + Ảnh cưới/chân dung: fallback về FALLBACK_WEDDING_IMG
 */
export function handleImageFallback(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackUrl?: string,
  isDecorative?: boolean
) {
  const target = e.currentTarget;
  const currentSrc = target.getAttribute("src") || target.currentSrc || "";

  // 1. Nếu ảnh từ ZenLove CDN và chưa qua proxy, thử chuyển sang proxy nội bộ
  if (
    currentSrc.includes("cdn-resource.zenlove.me") &&
    !currentSrc.includes("/api/proxy-image")
  ) {
    target.src = `/api/proxy-image?url=${encodeURIComponent(currentSrc)}`;
    return;
  }

  // 2. Nếu đã qua proxy mà vẫn lỗi hoặc ảnh không tải được
  const isDeco =
    isDecorative ??
    (isDecorativeAsset(currentSrc) ||
      isDecorativeAsset(target.alt || ""));
  const finalFallback =
    fallbackUrl !== undefined
      ? fallbackUrl
      : isDeco
      ? TRANSPARENT_PIXEL
      : FALLBACK_WEDDING_IMG;

  if (target.src !== finalFallback) {
    target.src = finalFallback;
  }
}
