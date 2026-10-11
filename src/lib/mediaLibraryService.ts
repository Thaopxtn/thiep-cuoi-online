"use client";

import { useState, useEffect, useCallback } from "react";

export const MEDIA_LIBRARY_STORAGE_KEY = "zenlove_uploaded_media_library_v1";
export const MEDIA_LIBRARY_EVENT = "zenlove_media_library_updated";

import { getCurrentAuth } from "./weddingCardService";

export const DEFAULT_DEMO_IMAGES: string[] = [];

/**
 * Kiểm tra xem một URL ảnh có phải là ảnh mẫu / stock / asset có sẵn của template hay không
 * Trả về true nếu là ảnh có sẵn (không phải do người dùng tự tải lên từ thiết bị)
 */
export function isTemplateStockOrPresetImage(url?: string): boolean {
  if (!url || typeof url !== "string") return true;
  const clean = url.trim().toLowerCase();
  if (!clean) return true;

  // Ảnh do người dùng upload trực tiếp: data URL base64, blob URL, hoặc đường dẫn upload cá nhân
  if (clean.startsWith("data:image/") || clean.startsWith("blob:")) {
    return false;
  }
  if (clean.includes("/wedding-cards/") || clean.includes("/uploads/user/")) {
    return false;
  }

  // Toàn bộ ảnh mẫu / asset có sẵn của template ZenLove và kho stock/unsplash:
  if (
    clean.includes("/templates/") ||
    clean.startsWith("templates/") ||
    clean.includes("cdn-resource.zenlove.me/templates") ||
    clean.includes("cdn-resource.zenlove.me/uploads/") ||
    clean.includes("cdn-resource.zenlove.me/mp3/") ||
    clean.includes("resources/background") ||
    clean.includes("resources/heartelements") ||
    clean.includes("envelope-") ||
    clean.includes("castle-") ||
    clean.includes("flower2-") ||
    clean.includes("wax-seal") ||
    clean.includes("images.unsplash.com") ||
    clean.includes("vietqr.co") ||
    clean.includes("img.vietqr.io")
  ) {
    return true;
  }

  return false;
}

export async function uploadFileToServer(formData: FormData): Promise<Response> {
  const { token } = getCurrentAuth();
  return fetch("/api/upload", {
    method: "POST",
    headers: {
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    },
    body: formData,
  });
}

/**
 * Lấy danh sách ảnh đã tải lên từ localStorage (CHỈ chứa ảnh người dùng tải lên, loại bỏ 100% ảnh mẫu có sẵn)
 */
export function getSavedUploadedImages(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MEDIA_LIBRARY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Chỉ giữ lại DUY NHẤT các ảnh do người dùng tải lên
      const userOnly = parsed.filter(
        (url) =>
          typeof url === "string" &&
          url.trim().length > 0 &&
          !isTemplateStockOrPresetImage(url)
      );

      // Nếu có ảnh mẫu bị dọn sạch, cập nhật lại ngay vào localStorage
      if (userOnly.length !== parsed.length) {
        localStorage.setItem(MEDIA_LIBRARY_STORAGE_KEY, JSON.stringify(userOnly));
      }
      return userOnly;
    }
  } catch (err) {
    console.warn("Lỗi đọc thư viện ảnh từ localStorage:", err);
  }
  return [];
}

/**
 * Lưu danh sách ảnh vào localStorage với cơ chế chống tràn QuotaExceededError
 * Chỉ lưu các ảnh do người dùng tải lên
 */
export function saveUploadedImages(images: string[]): void {
  if (typeof window === "undefined") return;

  // Loại bỏ trùng lặp và chỉ lưu các ảnh do người dùng tải lên
  const unique = Array.from(
    new Set(
      images.filter(
        (url) =>
          typeof url === "string" &&
          url.trim().length > 0 &&
          !isTemplateStockOrPresetImage(url)
      )
    )
  );

  const attemptSave = (items: string[]) => {
    localStorage.setItem(MEDIA_LIBRARY_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(
      new CustomEvent(MEDIA_LIBRARY_EVENT, { detail: items })
    );
  };

  try {
    // Ưu tiên lưu tối đa 60 ảnh mới nhất của người dùng
    attemptSave(unique.slice(0, 60));
  } catch (quotaErr) {
    console.warn("LocalStorage đầy dung lượng, đang tối ưu hóa media library:", quotaErr);
    try {
      const sanitized = unique.filter((u) => !u.startsWith("data:") || u.length < 50000);
      attemptSave(sanitized.slice(0, 30));
    } catch (secondErr) {
      try {
        attemptSave(unique.slice(0, 10));
      } catch (finalErr) {
        console.error("Không thể lưu media library vào localStorage:", finalErr);
      }
    }
  }
}

/**
 * Thêm 1 ảnh mới vào đầu thư viện (chỉ chấp nhận ảnh người dùng tải lên)
 */
export function addUploadedImageToLibrary(url: string): string[] {
  if (!url || typeof url !== "string" || !url.trim() || isTemplateStockOrPresetImage(url)) {
    return getSavedUploadedImages();
  }
  const cleanUrl = url.trim();
  const current = getSavedUploadedImages();
  const next = [cleanUrl, ...current.filter((item) => item !== cleanUrl)];
  saveUploadedImages(next);
  return next;
}

/**
 * Thêm nhiều ảnh cùng lúc vào thư viện (tự động loại bỏ mọi ảnh mẫu có sẵn)
 */
export function addUploadedImagesToLibrary(urls: string[]): string[] {
  if (!urls || urls.length === 0) return getSavedUploadedImages();
  const valid = urls
    .filter(
      (u) =>
        typeof u === "string" &&
        u.trim().length > 0 &&
        !isTemplateStockOrPresetImage(u)
    )
    .map((u) => u.trim());
  if (valid.length === 0) return getSavedUploadedImages();

  const current = getSavedUploadedImages();
  const next = [...valid, ...current.filter((item) => !valid.includes(item))];
  saveUploadedImages(next);
  return next;
}

/**
 * Xóa 1 ảnh khỏi thư viện
 */
export function removeUploadedImageFromLibrary(url: string): string[] {
  const { token } = getCurrentAuth();
  if (token && url.includes('/wedding-cards/')) {
    const parts = url.split('/');
    const fileName = parts[parts.length - 1];
    fetch(`/api/upload?fileName=${encodeURIComponent(fileName)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    }).catch(console.warn);
  }

  const current = getSavedUploadedImages();
  const next = current.filter((item) => item !== url);
  saveUploadedImages(next);
  return next;
}

/**
 * Xóa toàn bộ ảnh người dùng đã tải lên (làm rỗng thư viện ảnh)
 */
export function clearUploadedImagesLibrary(): string[] {
  saveUploadedImages([]);
  return [];
}

/**
 * Trích xuất toàn bộ URL hình ảnh đang được sử dụng trong các nodes Canvas
 */
export function extractImagesFromNodes(nodes: Record<string, any>): string[] {
  if (!nodes || typeof nodes !== "object") return [];
  const found: string[] = [];

  // 1. Background image
  const rootBg = nodes["ROOT"]?.props?.backgroundImage;
  if (rootBg && typeof rootBg === "string" && rootBg.trim()) {
    found.push(rootBg.trim());
  }

  // 2. PhotoBox & widget images
  Object.values(nodes).forEach((node: any) => {
    if (!node || !node.props) return;

    // Single image props
    if (typeof node.props.imgKey === "string" && node.props.imgKey.trim()) {
      found.push(node.props.imgKey.trim());
    }
    if (typeof node.props.src === "string" && node.props.src.trim()) {
      found.push(node.props.src.trim());
    }
    if (typeof node.props.previewKey === "string" && node.props.previewKey.trim()) {
      found.push(node.props.previewKey.trim());
    }

    // Carousel / album list props
    if (Array.isArray(node.props.imgList)) {
      node.props.imgList.forEach((item: any) => {
        if (typeof item === "string" && item.trim()) {
          found.push(item.trim());
        } else if (item && typeof item === "object") {
          if (typeof item.imageKey === "string" && item.imageKey.trim()) {
            found.push(item.imageKey.trim());
          }
          if (typeof item.src === "string" && item.src.trim()) {
            found.push(item.src.trim());
          }
        }
      });
    }
  });

  return Array.from(new Set(found));
}

/**
 * Chuẩn hóa URL ảnh để so sánh trùng khớp (loại bỏ query params, domain CDN, v.v.)
 */
export function normalizeImageComparisonUrl(url?: string): string {
  if (!url || typeof url !== "string") return "";
  let clean = url.trim().split("?")[0].toLowerCase();
  clean = clean.replace(/^https?:\/\/cdn-resource\.zenlove\.me\/?/, "");
  clean = clean.replace(/^\/+/, "");
  return clean;
}

/**
 * Kiểm tra xem 2 URL có đại diện cho cùng một hình ảnh hay không
 */
export function isSameImageUrl(url1?: string, url2?: string): boolean {
  if (!url1 || !url2) return false;
  if (url1 === url2) return true;
  const n1 = normalizeImageComparisonUrl(url1);
  const n2 = normalizeImageComparisonUrl(url2);
  return Boolean(n1 && n2 && n1 === n2);
}

/**
 * Đếm số lần 1 URL ảnh được sử dụng trên toàn bộ các phần tử Canvas của thiệp
 */
export function countImageUsageInNodes(targetUrl: string, nodes: Record<string, any>): number {
  if (!targetUrl || !nodes || typeof nodes !== "object") return 0;
  let count = 0;

  // 1. Kiểm tra hình nền ROOT
  const bg = nodes["ROOT"]?.props?.backgroundImage;
  if (bg && isSameImageUrl(bg, targetUrl)) {
    count++;
  }

  // 2. Kiểm tra từng node Canvas
  Object.values(nodes).forEach((node: any) => {
    if (!node || !node.props) return;

    let matchedNode = false;
    if (node.props.imgKey && isSameImageUrl(node.props.imgKey, targetUrl)) {
      matchedNode = true;
    } else if (node.props.src && isSameImageUrl(node.props.src, targetUrl)) {
      matchedNode = true;
    } else if (node.props.previewKey && isSameImageUrl(node.props.previewKey, targetUrl)) {
      matchedNode = true;
    }

    if (matchedNode) {
      count++;
      return;
    }

    // Kiểm tra danh sách ảnh dạng imgList (Carousel, Gallery)
    if (Array.isArray(node.props.imgList)) {
      node.props.imgList.forEach((item: any) => {
        const itemUrl = typeof item === "string" ? item : item?.imageKey || item?.src;
        if (itemUrl && isSameImageUrl(itemUrl, targetUrl)) {
          count++;
        }
      });
    }
  });

  return count;
}

/**
 * React Hook đồng bộ trạng thái Media Library theo thời gian thực
 */

export async function syncMediaLibraryWithServer() {
  const { token } = getCurrentAuth();
  if (!token) return;
  try {
    const res = await fetch("/api/upload/list", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.urls)) {
        const current = getSavedUploadedImages();
        const merged = Array.from(new Set([...data.urls, ...current]));
        localStorage.setItem(MEDIA_LIBRARY_STORAGE_KEY, JSON.stringify(merged));
        window.dispatchEvent(
          new CustomEvent(MEDIA_LIBRARY_EVENT, { detail: merged })
        );
      }
    }
  } catch (err) {
    console.warn("Failed to sync media library", err);
  }
}

export function useUploadedMediaLibrary() {
  const [images, setImages] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setImages(getSavedUploadedImages());
    setIsLoaded(true);
    syncMediaLibraryWithServer();

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<string[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setImages(customEvent.detail);
      } else {
        setImages(getSavedUploadedImages());
      }
    };

    window.addEventListener(MEDIA_LIBRARY_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(MEDIA_LIBRARY_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const addImage = useCallback((url: string) => addUploadedImageToLibrary(url), []);
  const addImages = useCallback((urls: string[]) => addUploadedImagesToLibrary(urls), []);
  const removeImage = useCallback((url: string) => removeUploadedImageFromLibrary(url), []);
  const clearLibrary = useCallback(() => clearUploadedImagesLibrary(), []);

  return {
    images,
    isLoaded,
    addImage,
    addImages,
    removeImage,
    clearLibrary,
  };
}
