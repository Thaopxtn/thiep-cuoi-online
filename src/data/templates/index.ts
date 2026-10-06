import { TemplateModule } from "@/components/modules/types";
import {
  TemplateFeature,
  TemplateItem,
  TemplateMeta,
} from "./types";
import { RECIPES, inferLegacyRecipe } from "./recipes";
import { WEDDING_PRESETS } from "./presets/wedding";
import { GRADUATION_PRESETS } from "./presets/graduation";
import { BIRTHDAY_PRESETS } from "./presets/birthday";
import { ANNIVERSARY_PRESETS } from "./presets/anniversary";
import { EVENT_PRESETS } from "./presets/event";

import { ZENLOVE_PRESET_TEMPLATES } from "@/data/zenlovePresets";

export * from "./types";
export * from "./recipes";

// Chỉ dùng các mẫu thiệp cưới clone thực sự từ trang chủ ZenLove
const rawPresets: TemplateItem[] = [
  ...ZENLOVE_PRESET_TEMPLATES,
];

const presetMap = new Map<string, TemplateItem>();
for (const item of rawPresets) {
  if (!presetMap.has(item.id)) {
    presetMap.set(item.id, item);
  }
}

export const SYSTEM_PRESETS: TemplateItem[] = Array.from(presetMap.values());
export const TEMPLATES_DATA: TemplateItem[] = SYSTEM_PRESETS;

export function getTemplateById(id: string): TemplateItem | undefined {
  return (
    TEMPLATES_DATA.find((t) => t.id === id || t.slug === id) || TEMPLATES_DATA[0]
  );
}

/**
 * Generate full modules for a template item.
 * If the template has explicit `modules`, returns them directly.
 * Otherwise runs its configured `recipe` or infers via legacy matchers.
 */
export function generateDefaultModules(template: TemplateItem): TemplateModule[] {
  if (template.modules && template.modules.length > 0) {
    return template.modules;
  }

  const recipeId = template.recipe || inferLegacyRecipe(template);
  const recipeFn = RECIPES[recipeId] || RECIPES["standard-envelope"];
  return recipeFn(template.defaultData, template);
}

/**
 * Infer features from module list
 */
export function deriveFeatures(modules: TemplateModule[]): TemplateFeature[] {
  const features = new Set<TemplateFeature>();

  for (const m of modules) {
    if (!m.enabled) continue;
    switch (m.type) {
      case "hero-sky-countdown":
        features.add("countdown");
        break;
      case "calendar":
      case "wedding-schedule-cards":
        features.add("calendar");
        break;
      case "photo-gallery-grid":
      case "polaroid-tape":
      case "photo-grid":
        features.add("album");
        break;
      case "venue-map":
        features.add("map");
        break;
      case "rsvp":
      case "red-velvet-rsvp":
        features.add("rsvp");
        break;
      case "gift-bank":
      case "red-envelope-gift-card":
        features.add("gift");
        break;
      case "wishes-stream":
        features.add("wishes");
        break;
      case "hero-envelope":
      case "hero-red-wax-envelope":
      case "hero-traditional-red":
        features.add("envelope");
        break;
    }
  }

  return Array.from(features);
}

/**
 * Normalize and fill missing fields for custom or imported templates
 */
export function normalizeTemplate(
  raw: Partial<TemplateItem>,
  origin: TemplateMeta["origin"] = "custom"
): TemplateItem {
  const now = new Date().toISOString();
  const id =
    raw.id || `custom-tpl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const title = (raw.title || "Mẫu thiệp mới").trim();
  const category = raw.category || "wedding";
  const categoryName =
    raw.categoryName ||
    (category === "wedding"
      ? "Thiệp cưới"
      : category === "graduation"
      ? "Thiệp tốt nghiệp"
      : category === "birthday"
      ? "Thiệp sinh nhật"
      : category === "anniversary"
      ? "Kỷ niệm"
      : category === "event"
      ? "Sự kiện"
      : "Thiệp chúc mừng");

  const modules = Array.isArray(raw.modules) ? raw.modules : undefined;
  const inferredFeatures = modules ? deriveFeatures(modules) : [];

  const meta: TemplateMeta = {
    createdAt: raw.meta?.createdAt || now,
    updatedAt: now,
    version: (raw.meta?.version || 0) + 1,
    author: raw.meta?.author || (origin === "preset" ? "ZenLove Studio" : "Bạn"),
    styleTags:
      raw.meta?.styleTags && raw.meta.styleTags.length > 0
        ? raw.meta.styleTags
        : ["modern"],
    colorFamily: raw.meta?.colorFamily || "red",
    palette: raw.meta?.palette || {
      primary: "#E11D48",
      secondary: "#FB7185",
      accent: "#FFF1F2",
      background: "#FFFFFF",
    },
    features:
      raw.meta?.features && raw.meta.features.length > 0
        ? raw.meta.features
        : inferredFeatures.length > 0
        ? inferredFeatures
        : ["map", "rsvp", "gift", "wishes"],
    origin: raw.meta?.origin || origin,
    sourceId: raw.meta?.sourceId,
  };

  return {
    id,
    title,
    slug: raw.slug || slugify(title),
    category,
    categoryName,
    image: raw.image || "/assets/templates/t1.webp",
    scrollPercent: raw.scrollPercent || "80%",
    scrollDuration: raw.scrollDuration || "8s",
    tag: raw.tag || "MỚI",
    likes: typeof raw.likes === "number" ? raw.likes : 0,
    views: typeof raw.views === "number" ? raw.views : 1,
    description: raw.description || "Mẫu thiệp điện tử được thiết kế tinh tế từ ZenLove",
    type: raw.type || (category === "graduation" ? "graduation" : "wedding"),
    recipe: raw.recipe,
    meta,
    modules,
    defaultData: {
      eventTitle: raw.defaultData?.eventTitle || "THƯ MỜI",
      person1: raw.defaultData?.person1 || "Chủ tiệc 1",
      person2: raw.defaultData?.person2 || "",
      date: raw.defaultData?.date || "20.10.2026",
      time: raw.defaultData?.time || "10:00",
      venue: raw.defaultData?.venue || "Trung Tâm Hội Nghị Tiệc Cưới",
      address: raw.defaultData?.address || "Hà Nội, Việt Nam",
      mapUrl: raw.defaultData?.mapUrl || "https://maps.google.com",
      quote:
        raw.defaultData?.quote ||
        "Hạnh phúc là khi tìm thấy một nửa yêu thương trọn vẹn.",
      invitationBody:
        raw.defaultData?.invitationBody ||
        "Trân trọng kính mời quý khách đến chung vui cùng chúng tôi!",
      signature: raw.defaultData?.signature || "",
      mainPhoto:
        raw.defaultData?.mainPhoto ||
        "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=800&auto=format&fit=crop",
      albumPhotos: Array.isArray(raw.defaultData?.albumPhotos)
        ? raw.defaultData.albumPhotos
        : [],
      musicTitle: raw.defaultData?.musicTitle || "Beautiful In White",
      musicUrl:
        raw.defaultData?.musicUrl ||
        "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3",
      bankInfo: {
        bankName: raw.defaultData?.bankInfo?.bankName || "MBBank",
        accountNumber: raw.defaultData?.bankInfo?.accountNumber || "123456789",
        accountHolder: raw.defaultData?.bankInfo?.accountHolder || "CHỦ TÀI KHOẢN",
        qrImage: raw.defaultData?.bankInfo?.qrImage || "",
      },
      initialWishes: Array.isArray(raw.defaultData?.initialWishes)
        ? raw.defaultData.initialWishes
        : [],
    },
  };
}

function slugify(text: string): string {
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
