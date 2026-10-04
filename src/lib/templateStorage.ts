import { TemplateItem, TEMPLATES_DATA, normalizeTemplate } from "@/data/templates";
import {
  TEMPLATES_EVENT_CHANGE,
  deleteTemplate,
  deleteTemplatesBatch,
  duplicateTemplateItem,
  estimateStorageQuota,
  hydrate,
  listCustomSync,
  saveTemplate,
  saveTemplatesBatch,
} from "./storage/templateRepository";

export { TEMPLATES_EVENT_CHANGE };
export const TEMPLATES_STORAGE_KEY = "zenlove_custom_templates_v1";
export const AUTOSAVE_DRAFT_KEY = "zenlove_builder_draft_v1";

export interface StorageUsageInfo {
  usedBytes: number;
  usedKB: number;
  usedMB: number;
  estimatedMaxMB: number;
  percentUsed: number;
  isNearQuota: boolean;
  isCritical: boolean;
}

export function hydrateStorage() {
  return hydrate();
}

/**
 * Storage usage summary
 */
export function getStorageUsage(): StorageUsageInfo {
  if (typeof window === "undefined") {
    return {
      usedBytes: 0,
      usedKB: 0,
      usedMB: 0,
      estimatedMaxMB: 500,
      percentUsed: 0,
      isNearQuota: false,
      isCritical: false,
    };
  }

  // Quick synchronous estimate from custom templates memory
  const custom = listCustomSync();
  const approxBytes = JSON.stringify(custom).length * 2;
  const usedKB = approxBytes / 1024;
  const usedMB = usedKB / 1024;
  const estimatedMaxMB = 500; // IndexedDB typical quota is hundreds of MBs
  const percentUsed = Math.min(Math.round((usedMB / estimatedMaxMB) * 100), 100);

  return {
    usedBytes: approxBytes,
    usedKB: Math.round(usedKB * 100) / 100,
    usedMB: Math.round(usedMB * 1000) / 1000,
    estimatedMaxMB,
    percentUsed,
    isNearQuota: percentUsed >= 80,
    isCritical: percentUsed >= 95,
  };
}

export async function getStorageUsageAsync(): Promise<StorageUsageInfo> {
  const est = await estimateStorageQuota();
  return {
    usedBytes: est.usedBytes,
    usedKB: Math.round((est.usedBytes / 1024) * 100) / 100,
    usedMB: est.usedMB,
    estimatedMaxMB: est.quotaMB,
    percentUsed: est.percentUsed,
    isNearQuota: est.isNearQuota,
    isCritical: est.percentUsed >= 95,
  };
}

export function checkStorageQuota(): { ok: boolean; message?: string } {
  const usage = getStorageUsage();
  if (usage.isCritical) {
    return {
      ok: false,
      message: `⚠️ Bộ nhớ trình duyệt gần đầy (${usage.percentUsed}% đã sử dụng). Hãy sao lưu và xóa bớt mẫu không dùng!`,
    };
  }
  return { ok: true };
}

// --- Auto-save Draft helpers ---
export function saveDraft(template: TemplateItem): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AUTOSAVE_DRAFT_KEY, JSON.stringify(template));
  } catch (e) {
    console.warn("Không thể auto-save draft:", e);
  }
}

export function loadDraft(): TemplateItem | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTOSAVE_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TemplateItem;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTOSAVE_DRAFT_KEY);
}

export interface TemplatePackage {
  schemaVersion: "1.0" | "1.1";
  exportedAt: string;
  source: "ZenLove Template Studio";
  type: "single" | "collection";
  templates: TemplateItem[];
}

/**
 * Get all custom templates (synchronous read from memory cache)
 */
export function getCustomTemplates(): TemplateItem[] {
  return listCustomSync();
}

/**
 * Get merged templates: Custom templates + System presets
 */
export function getAllTemplates(): TemplateItem[] {
  const custom = getCustomTemplates();
  const customIds = new Set(custom.map((t) => t.id));
  const presets = TEMPLATES_DATA.filter((t) => !customIds.has(t.id));
  return [...custom, ...presets];
}

/**
 * Get a template by ID or slug, searching custom first then presets
 */
export function getStoredTemplateById(id: string): TemplateItem | undefined {
  const custom = getCustomTemplates();
  const foundCustom = custom.find((t) => t.id === id || t.slug === id);
  if (foundCustom) return foundCustom;
  return TEMPLATES_DATA.find((t) => t.id === id || t.slug === id) || TEMPLATES_DATA[0];
}

/**
 * Save or update a custom template
 */
export function saveCustomTemplate(
  template: TemplateItem
): { success: boolean; error?: string } {
  // Fire async IndexedDB write
  saveTemplate(template);
  return { success: true };
}

/**
 * Async version of save
 */
export async function saveCustomTemplateAsync(
  template: TemplateItem
): Promise<{ success: boolean; error?: string }> {
  return saveTemplate(template);
}

/**
 * Delete a custom template
 */
export function deleteCustomTemplate(
  id: string
): { success: boolean; error?: string } {
  deleteTemplate(id);
  return { success: true };
}

/**
 * Delete multiple custom templates
 */
export async function deleteCustomTemplates(
  ids: string[]
): Promise<{ success: boolean; count: number; error?: string }> {
  return deleteTemplatesBatch(ids);
}

/**
 * Duplicate a template
 */
export function duplicateTemplate(
  sourceTemplate: TemplateItem,
  newTitle?: string
): TemplateItem {
  const newId = `custom-tpl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const title = newTitle || `${sourceTemplate.title} (Bản sao)`;

  const cloned: TemplateItem = {
    ...JSON.parse(JSON.stringify(sourceTemplate)),
    id: newId,
    title,
    slug: slugify(title),
    tag: "MỚI",
    likes: 0,
    views: 1,
    description:
      sourceTemplate.description ||
      `Mẫu thiệp nhân bản từ ${sourceTemplate.title}`,
  };

  saveTemplate(cloned);
  return cloned;
}

/**
 * Duplicate multiple templates
 */
export async function duplicateTemplates(
  templates: TemplateItem[]
): Promise<TemplateItem[]> {
  const duplicated: TemplateItem[] = [];
  for (const t of templates) {
    const d = await duplicateTemplateItem(t);
    duplicated.push(d);
  }
  return duplicated;
}

/**
 * Validate imported template JSON
 */
export function validateTemplateJson(raw: any): {
  valid: boolean;
  error?: string;
  isBatch?: boolean;
  templates?: TemplateItem[];
} {
  if (!raw || typeof raw !== "object") {
    return {
      valid: false,
      error: "Dữ liệu JSON không hợp lệ (không phải là đối tượng).",
    };
  }

  let templateList: any[] = [];
  let isBatch = false;

  if (Array.isArray(raw)) {
    templateList = raw;
    isBatch = true;
  } else if (raw.type === "collection" && Array.isArray(raw.templates)) {
    templateList = raw.templates;
    isBatch = true;
  } else if (
    raw.type === "single" &&
    Array.isArray(raw.templates) &&
    raw.templates.length > 0
  ) {
    templateList = raw.templates;
  } else {
    templateList = [raw];
  }

  if (templateList.length === 0) {
    return {
      valid: false,
      error: "Không tìm thấy dữ liệu mẫu thiệp trong tệp JSON.",
    };
  }

  const validTemplates: TemplateItem[] = [];

  for (let i = 0; i < templateList.length; i++) {
    const item = templateList[i];
    if (!item.title || typeof item.title !== "string") {
      return { valid: false, error: `Mẫu thứ ${i + 1} thiếu tiêu đề (title).` };
    }

    const safe = normalizeTemplate(item, "imported");
    validTemplates.push(safe);
  }

  return {
    valid: true,
    isBatch,
    templates: validTemplates,
  };
}

/**
 * Export single template as downloadable JSON file
 */
export function exportTemplateAsJson(template: TemplateItem) {
  const pkg: TemplatePackage = {
    schemaVersion: "1.1",
    exportedAt: new Date().toISOString(),
    source: "ZenLove Template Studio",
    type: "single",
    templates: [template],
  };

  const filename = `zenlove-template-${template.slug || template.id}-${formatDateForFilename(new Date())}.json`;
  triggerDownload(JSON.stringify(pkg, null, 2), filename);
}

/**
 * Export a custom list of templates as a collection JSON file
 */
export function exportTemplatesAsJson(
  templates: TemplateItem[],
  customFilename?: string
) {
  const pkg: TemplatePackage = {
    schemaVersion: "1.1",
    exportedAt: new Date().toISOString(),
    source: "ZenLove Template Studio",
    type: templates.length === 1 ? "single" : "collection",
    templates,
  };

  const filename =
    customFilename ||
    `zenlove-templates-${templates.length}-items-${formatDateForFilename(new Date())}.json`;
  triggerDownload(JSON.stringify(pkg, null, 2), filename);
}

/**
 * Export all custom templates as a backup JSON file
 */
export function exportAllCustomTemplates() {
  const custom = getCustomTemplates();
  const pkg: TemplatePackage = {
    schemaVersion: "1.1",
    exportedAt: new Date().toISOString(),
    source: "ZenLove Template Studio",
    type: "collection",
    templates: custom,
  };

  const filename = `zenlove-all-templates-backup-${formatDateForFilename(new Date())}.json`;
  triggerDownload(JSON.stringify(pkg, null, 2), filename);
}

/**
 * Copy template JSON to clipboard
 */
export async function copyTemplateToClipboard(
  template: TemplateItem
): Promise<boolean> {
  const pkg: TemplatePackage = {
    schemaVersion: "1.1",
    exportedAt: new Date().toISOString(),
    source: "ZenLove Template Studio",
    type: "single",
    templates: [template],
  };

  const text = JSON.stringify(pkg, null, 2);
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      textArea.remove();
      return successful;
    }
  } catch (err) {
    console.error("Lỗi khi sao chép JSON:", err);
    return false;
  }
}

/**
 * Import templates from validated array
 */
export function saveImportedTemplates(
  templates: TemplateItem[],
  options: { overwrite?: boolean } = {}
): { count: number; error?: string } {
  saveTemplatesBatch(templates, options);
  return { count: templates.length };
}

// Helpers
function triggerDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatDateForFilename(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}${mm}${dd}-${hh}${min}`;
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function getCategoryName(category: string): string {
  switch (category) {
    case "wedding":
      return "Thiệp cưới";
    case "graduation":
      return "Thiệp tốt nghiệp";
    case "birthday":
      return "Thiệp sinh nhật";
    case "event":
      return "Sự kiện";
    case "anniversary":
      return "Kỷ niệm";
    default:
      return "Thiệp chúc mừng";
  }
}
