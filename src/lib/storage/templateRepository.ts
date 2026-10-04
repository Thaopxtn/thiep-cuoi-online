import { TemplateItem } from "@/data/templates/types";
import { normalizeTemplate } from "@/data/templates";
import {
  STORE_TEMPLATES,
  idbDelete,
  idbDeleteMany,
  idbGetAll,
  idbPut,
  idbPutMany,
} from "./idb";

export const TEMPLATES_EVENT_CHANGE = "zenlove_templates_updated";
const LEGACY_STORAGE_KEY = "zenlove_custom_templates_v1";
const BROADCAST_CHANNEL_NAME = "zenlove_templates_channel";

let memoryCache: TemplateItem[] = [];
let isHydrated = false;
let hydratePromise: Promise<TemplateItem[]> | null = null;
let broadcastChannel: BroadcastChannel | null = null;

function getBroadcast(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof window.BroadcastChannel === "undefined") {
    return null;
  }
  if (!broadcastChannel) {
    try {
      broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      broadcastChannel.onmessage = (event) => {
        if (event.data?.type === "REFRESH") {
          // Re-hydrate quietly from storage
          hydrate(true);
        }
      };
    } catch {
      broadcastChannel = null;
    }
  }
  return broadcastChannel;
}

function notifySubscribers(detail: { action: string; [k: string]: any }) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TEMPLATES_EVENT_CHANGE, { detail }));
  try {
    getBroadcast()?.postMessage({ type: "REFRESH", detail });
  } catch {
    // ignore
  }
}

/**
 * Hydrate the in-memory cache from IndexedDB.
 * Migrates data from localStorage if IndexedDB is empty.
 */
export async function hydrate(forceRefresh = false): Promise<TemplateItem[]> {
  if (typeof window === "undefined") {
    return [];
  }

  if (isHydrated && !forceRefresh) {
    return memoryCache;
  }

  if (hydratePromise && !forceRefresh) {
    return hydratePromise;
  }

  hydratePromise = (async () => {
    try {
      let items: TemplateItem[] = [];
      try {
        items = await idbGetAll<TemplateItem>(STORE_TEMPLATES);
      } catch (e) {
        console.warn("IndexedDB read failed, fallback to localStorage:", e);
      }

      // Check migration from legacy localStorage if IDB has 0 items
      if (items.length === 0) {
        try {
          const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const normalized = parsed.map((item) =>
                normalizeTemplate(item, "custom")
              );
              try {
                await idbPutMany(STORE_TEMPLATES, normalized);
                items = normalized;
                console.info(
                  `ZenLove: Đã chuyển tự động ${normalized.length} mẫu từ localStorage sang IndexedDB thành công!`
                );
              } catch (idbErr) {
                console.warn("Could not write migration to IDB, using legacy list:", idbErr);
                items = normalized;
              }
            }
          }
        } catch (migErr) {
          console.warn("Lỗi khi đọc bản lưu trữ cũ localStorage:", migErr);
        }
      }

      // Sort by updatedAt or createdAt desc
      items.sort((a, b) => {
        const tA = new Date(a.meta?.updatedAt || a.meta?.createdAt || 0).getTime();
        const tB = new Date(b.meta?.updatedAt || b.meta?.createdAt || 0).getTime();
        return tB - tA;
      });

      memoryCache = items;
      isHydrated = true;
      return memoryCache;
    } finally {
      hydratePromise = null;
    }
  })();

  return hydratePromise;
}

/**
 * Synchronous snapshot of custom templates (requires hydrate() called on app mount).
 * If not yet hydrated in client browser, falls back to legacy localStorage synchronously.
 */
export function listCustomSync(): TemplateItem[] {
  if (typeof window === "undefined") return [];

  if (isHydrated) {
    return memoryCache;
  }

  // Pre-hydration synchronous fallback: check legacy localStorage
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((t) => normalizeTemplate(t, "custom"));
      }
    }
  } catch {
    // ignore
  }

  // Kick off async hydration for subsequent calls
  hydrate();
  return memoryCache;
}

export function isRepositoryReady(): boolean {
  return isHydrated;
}

/**
 * Save or update a single template
 */
export async function saveTemplate(
  template: TemplateItem
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") {
    return { success: false, error: "Môi trường không hỗ trợ lưu trữ" };
  }

  await hydrate();

  const normalized = normalizeTemplate(template, template.meta?.origin || "custom");

  // Optimistic update of cache
  const existingIdx = memoryCache.findIndex((t) => t.id === normalized.id);
  if (existingIdx >= 0) {
    memoryCache[existingIdx] = normalized;
  } else {
    memoryCache.unshift(normalized);
  }

  try {
    await idbPut(STORE_TEMPLATES, normalized);
    // Also update localStorage as a small backup if possible
    try {
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(memoryCache.slice(0, 15)));
    } catch {
      // localStorage may fail due to size, which is fine since IDB succeeded
    }

    notifySubscribers({ action: "save", template: normalized });
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi khi lưu vào IndexedDB:", error);
    return { success: false, error: error?.message || "Không thể lưu template" };
  }
}

/**
 * Save or import multiple templates
 */
export async function saveTemplatesBatch(
  templates: TemplateItem[],
  options: { overwrite?: boolean } = {}
): Promise<{ count: number; error?: string }> {
  if (typeof window === "undefined") {
    return { count: 0, error: "Môi trường không hỗ trợ" };
  }

  await hydrate();

  const existingMap = new Map(memoryCache.map((t) => [t.id, t]));
  const toSave: TemplateItem[] = [];

  for (const raw of templates) {
    let t = normalizeTemplate(raw, raw.meta?.origin || "imported");
    if (existingMap.has(t.id) && !options.overwrite) {
      t = {
        ...t,
        id: `custom-tpl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: `${t.title} (Nhập mới)`,
        slug: `${t.slug}-imported`,
      };
    }
    existingMap.set(t.id, t);
    toSave.push(t);
  }

  memoryCache = Array.from(existingMap.values()).sort((a, b) => {
    const tA = new Date(a.meta?.updatedAt || a.meta?.createdAt || 0).getTime();
    const tB = new Date(b.meta?.updatedAt || b.meta?.createdAt || 0).getTime();
    return tB - tA;
  });

  try {
    await idbPutMany(STORE_TEMPLATES, toSave);
    notifySubscribers({ action: "batch_save", count: toSave.length });
    return { count: toSave.length };
  } catch (error: any) {
    console.error("Lỗi khi lưu hàng loạt:", error);
    return { count: 0, error: error?.message || "Không thể lưu danh sách mẫu" };
  }
}

/**
 * Delete a template by ID
 */
export async function deleteTemplate(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") {
    return { success: false, error: "Môi trường không hỗ trợ" };
  }

  await hydrate();
  memoryCache = memoryCache.filter((t) => t.id !== id);

  try {
    await idbDelete(STORE_TEMPLATES, id);
    try {
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(memoryCache.slice(0, 15)));
    } catch {
      // ignore
    }

    notifySubscribers({ action: "delete", id });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Không thể xóa template" };
  }
}

/**
 * Delete multiple templates by ID
 */
export async function deleteTemplatesBatch(
  ids: string[]
): Promise<{ success: boolean; count: number; error?: string }> {
  if (typeof window === "undefined" || ids.length === 0) {
    return { success: true, count: 0 };
  }

  await hydrate();
  const idSet = new Set(ids);
  memoryCache = memoryCache.filter((t) => !idSet.has(t.id));

  try {
    await idbDeleteMany(STORE_TEMPLATES, ids);
    notifySubscribers({ action: "batch_delete", ids });
    return { success: true, count: ids.length };
  } catch (error: any) {
    return {
      success: false,
      count: 0,
      error: error?.message || "Không thể xóa các mẫu đã chọn",
    };
  }
}

/**
 * Duplicate a template
 */
export async function duplicateTemplateItem(
  source: TemplateItem,
  newTitle?: string
): Promise<TemplateItem> {
  const newId = `custom-tpl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const title = newTitle || `${source.title} (Bản sao)`;

  const cloned: TemplateItem = {
    ...JSON.parse(JSON.stringify(source)),
    id: newId,
    title,
    tag: "MỚI",
    likes: 0,
    views: 1,
    meta: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      author: "Bạn",
      styleTags: source.meta?.styleTags || ["modern"],
      colorFamily: source.meta?.colorFamily || "red",
      palette: source.meta?.palette || {
        primary: "#E11D48",
        secondary: "#FB7185",
        accent: "#FFF1F2",
        background: "#FFFFFF",
      },
      features: source.meta?.features || ["map", "rsvp", "gift", "wishes"],
      origin: "duplicated",
      sourceId: source.id,
    },
  };

  await saveTemplate(cloned);
  return cloned;
}

/**
 * Query actual browser storage quota and usage
 */
export async function estimateStorageQuota(): Promise<{
  usedBytes: number;
  quotaBytes: number;
  percentUsed: number;
  usedMB: number;
  quotaMB: number;
  isNearQuota: boolean;
}> {
  if (
    typeof navigator === "undefined" ||
    !navigator.storage ||
    !navigator.storage.estimate
  ) {
    return {
      usedBytes: 0,
      quotaBytes: 500 * 1024 * 1024,
      percentUsed: 0,
      usedMB: 0,
      quotaMB: 500,
      isNearQuota: false,
    };
  }

  try {
    const est = await navigator.storage.estimate();
    const used = est.usage || 0;
    const quota = est.quota || 500 * 1024 * 1024;
    const percent = Math.min(Math.round((used / quota) * 100), 100);

    return {
      usedBytes: used,
      quotaBytes: quota,
      percentUsed: percent,
      usedMB: Math.round((used / (1024 * 1024)) * 10) / 10,
      quotaMB: Math.round((quota / (1024 * 1024)) * 10) / 10,
      isNearQuota: percent >= 80,
    };
  } catch {
    return {
      usedBytes: 0,
      quotaBytes: 500 * 1024 * 1024,
      percentUsed: 0,
      usedMB: 0,
      quotaMB: 500,
      isNearQuota: false,
    };
  }
}
