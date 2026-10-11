/**
 * Dịch vụ Hợp nhất Quản lý và Tra cứu Template ZenLove
 * Kết nối dữ liệu 207+ mẫu hiện đại ZENLOVE_TEMPLATES và các mẫu hệ thống
 */

import { ZENLOVE_TEMPLATES, ZenLoveTemplate } from "@/data/zenloveTemplates";
import { SYSTEM_PRESETS, TemplateItem } from "@/data/templates";

export type ColorTone = "all" | "red" | "pink" | "green" | "gold" | "white" | "purple";

export interface ColorToneOption {
  id: ColorTone;
  label: string;
  colorHex: string;
  badgeClass: string;
}

export const COLOR_TONE_OPTIONS: ColorToneOption[] = [
  { id: "all", label: "Tất cả màu", colorHex: "#64748b", badgeClass: "bg-slate-100 text-slate-700" },
  { id: "red", label: "Đỏ truyền thống", colorHex: "#dc2626", badgeClass: "bg-red-50 text-red-600 border-red-200" },
  { id: "pink", label: "Hồng pastel", colorHex: "#ec4899", badgeClass: "bg-pink-50 text-pink-600 border-pink-200" },
  { id: "green", label: "Xanh thiên nhiên", colorHex: "#16a34a", badgeClass: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  { id: "gold", label: "Vàng hoàng gia", colorHex: "#d97706", badgeClass: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "white", label: "Trắng tối giản", colorHex: "#6b7280", badgeClass: "bg-gray-50 text-gray-700 border-gray-200" },
  { id: "purple", label: "Tím thủy chung", colorHex: "#9333ea", badgeClass: "bg-purple-50 text-purple-700 border-purple-200" },
];

export interface UnifiedTemplate {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  imageUrl: string;
  templateType: string;
  targetPageType: "CANVAS" | "FORM";
  likeCount: number;
  viewCount: number;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  musicName?: string;
  musicUrl?: string;
  orderNumber?: number;
  code?: string;
  displayCode?: string;
  colorTone: ColorTone;
  isZenloveCatalog: boolean;
}

/**
 * Tự động phân tích và gắn nhãn Tone màu dựa trên tên và mô tả của mẫu
 */
export function detectColorTone(name: string, description: string = "", category: string = ""): ColorTone {
  const text = `${name} ${description} ${category}`.toLowerCase();

  if (
    text.includes("đỏ") ||
    text.includes("red") ||
    text.includes("hỷ") ||
    text.includes("truyền thống") ||
    text.includes("ruby") ||
    text.includes("hồng phong")
  ) {
    return "red";
  }

  if (
    text.includes("hồng") ||
    text.includes("pink") ||
    text.includes("pastel") ||
    text.includes("lãng mạn") ||
    text.includes("ngọt ngào")
  ) {
    return "pink";
  }

  if (
    text.includes("xanh") ||
    text.includes("green") ||
    text.includes("rustic") ||
    text.includes("lá") ||
    text.includes("sen") ||
    text.includes("botanical") ||
    text.includes("đồng xanh")
  ) {
    return "green";
  }

  if (
    text.includes("vàng") ||
    text.includes("gold") ||
    text.includes("hoàng gia") ||
    text.includes("luxury") ||
    text.includes("sang trọng") ||
    text.includes("quý phái") ||
    text.includes("nắng")
  ) {
    return "gold";
  }

  if (
    text.includes("tím") ||
    text.includes("purple") ||
    text.includes("thủy chung")
  ) {
    return "purple";
  }

  if (
    text.includes("trắng") ||
    text.includes("white") ||
    text.includes("tối giản") ||
    text.includes("minimal") ||
    text.includes("thuần khiết")
  ) {
    return "white";
  }

  // Mặc định phân loại tự nhiên
  return "white";
}

/**
 * Chuyển đổi ZenLoveTemplate sang UnifiedTemplate
 */
export function adaptZenLoveTemplate(tpl: ZenLoveTemplate): UnifiedTemplate {
  return {
    id: tpl.id,
    name: tpl.name,
    slug: tpl.slug || tpl.id,
    description: tpl.description || "",
    categoryId: tpl.categoryId || "thiep-cuoi",
    categoryName: tpl.categoryName || "Thiệp cưới",
    categorySlug: tpl.categorySlug || "thiep-cuoi",
    imageUrl: tpl.imageUrl,
    templateType: tpl.templateType || "free",
    targetPageType: tpl.targetPageType || "CANVAS",
    likeCount: tpl.likeCount || 0,
    viewCount: tpl.viewCount || 0,
    usageCount: tpl.usageCount || 0,
    createdAt: tpl.createdAt || new Date().toISOString(),
    updatedAt: tpl.updatedAt || new Date().toISOString(),
    musicName: tpl.musicName || "Thiên đường với người thương",
    musicUrl: tpl.musicUrl || "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3",
    orderNumber: tpl.orderNumber,
    code: tpl.code,
    displayCode: tpl.displayCode,
    colorTone: detectColorTone(tpl.name, tpl.description, tpl.categoryName),
    isZenloveCatalog: true,
  };
}

/**
 * Chuyển đổi TemplateItem (legacy preset) sang UnifiedTemplate
 */
export function adaptPresetTemplate(tpl: TemplateItem): UnifiedTemplate {
  const isPrem = tpl.tag?.toUpperCase() === "PREMIUM" || tpl.tag?.toUpperCase() === "HOT";
  return {
    id: tpl.id,
    name: tpl.title,
    slug: tpl.slug || tpl.id,
    description: tpl.description || "",
    categoryId: tpl.category || "wedding",
    categoryName: tpl.categoryName || "Thiệp cưới",
    categorySlug: tpl.category === "wedding" ? "thiep-cuoi" : tpl.category || "thiep-cuoi",
    imageUrl: tpl.image || "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600",
    templateType: isPrem ? "premium" : "free",
    targetPageType: "CANVAS",
    likeCount: tpl.likes || 45,
    viewCount: tpl.views || 1200,
    usageCount: 88,
    createdAt: tpl.meta?.createdAt || new Date().toISOString(),
    updatedAt: tpl.meta?.updatedAt || new Date().toISOString(),
    musicName: tpl.defaultData?.musicTitle || "Beautiful In White",
    musicUrl: tpl.defaultData?.musicUrl || "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3",
    colorTone: detectColorTone(tpl.title, tpl.description, tpl.categoryName),
    isZenloveCatalog: false,
  };
}

/**
 * Tra cứu mẫu từ bất kỳ nguồn nào theo slug, id, mã thứ tự (e.g. mau-01) hoặc số thứ tự (e.g. 1, 01)
 */
export function getTemplateBySlugOrId(slugOrId: string): UnifiedTemplate | null {
  if (!slugOrId) return null;
  const clean = slugOrId.trim().toLowerCase();

  // 1. Tìm trong ZENLOVE_TEMPLATES (207 mẫu hiện đại) - hỗ trợ cả id, slug, code (mau-01), displayCode (Mẫu 01), orderNumber (1, 01)
  const zenloveFound = ZENLOVE_TEMPLATES.find((t) => {
    if (t.id.toLowerCase() === clean) return true;
    if (t.slug.toLowerCase() === clean) return true;
    if (t.code && t.code.toLowerCase() === clean) return true;
    if (t.displayCode && t.displayCode.toLowerCase() === clean) return true;
    if (t.orderNumber !== undefined) {
      if (String(t.orderNumber) === clean) return true;
      if (!isNaN(Number(clean)) && Number(clean) === t.orderNumber) return true;
      const padded = String(t.orderNumber).padStart(2, "0");
      if (padded === clean) return true;
      if (`mau-${t.orderNumber}` === clean || `mau-${padded}` === clean) return true;
      if (`mau${t.orderNumber}` === clean || `mau${padded}` === clean) return true;
      if (`mẫu ${t.orderNumber}` === clean || `mẫu ${padded}` === clean) return true;
      if (`mau ${t.orderNumber}` === clean || `mau ${padded}` === clean) return true;
    }
    return false;
  });

  if (zenloveFound) {
    return adaptZenLoveTemplate(zenloveFound);
  }

  // 2. Tìm trong SYSTEM_PRESETS
  const presetFound = SYSTEM_PRESETS.find(
    (t) => t.id.toLowerCase() === clean || (t.slug && t.slug.toLowerCase() === clean)
  );
  if (presetFound) {
    return adaptPresetTemplate(presetFound);
  }

  return null;
}

/**
 * Lấy danh sách các mẫu gợi ý tương tự (Related Templates)
 */
export function getRelatedTemplates(
  current: UnifiedTemplate,
  count: number = 6
): UnifiedTemplate[] {
  // Lọc các mẫu cùng danh mục hoặc cùng tone màu, loại trừ mẫu hiện tại
  const pool = ZENLOVE_TEMPLATES.filter((t) => t.id !== current.id && t.slug !== current.slug);
  
  // Ưu tiên cùng danh mục
  const sameCat = pool.filter((t) => t.categorySlug === current.categorySlug);
  const candidates = sameCat.length >= count ? sameCat : pool;

  return candidates.slice(0, count).map(adaptZenLoveTemplate);
}

/**
 * Chuyển đổi UnifiedTemplate sang TemplateItem tương thích với TemplateDetailClient
 */
export function unifiedToTemplateItem(u: UnifiedTemplate): TemplateItem {
  const colorFamilyMap: Record<ColorTone, "red" | "gold" | "pink" | "pastel" | "green" | "blue" | "neutral"> = {
    red: "red",
    pink: "pink",
    green: "green",
    gold: "gold",
    white: "neutral",
    purple: "pastel",
    all: "neutral",
  };

  const styleTagMap: Record<ColorTone, "classic" | "modern" | "minimal" | "traditional" | "rustic" | "luxury" | "playful" | "cute"> = {
    red: "traditional",
    pink: "cute",
    green: "rustic",
    gold: "luxury",
    white: "minimal",
    purple: "modern",
    all: "modern",
  };

  const paletteMap = {
    red: { primary: "#dc2626", secondary: "#f87171", accent: "#b91c1c", background: "#fef2f2" },
    pink: { primary: "#ec4899", secondary: "#f472b6", accent: "#be185d", background: "#fdf2f8" },
    green: { primary: "#16a34a", secondary: "#4ade80", accent: "#15803d", background: "#f0fdf4" },
    gold: { primary: "#d97706", secondary: "#fbbf24", accent: "#b45309", background: "#fffbeb" },
    white: { primary: "#475569", secondary: "#94a3b8", accent: "#334155", background: "#f8fafc" },
    purple: { primary: "#9333ea", secondary: "#c084fc", accent: "#7e22ce", background: "#faf5ff" },
    all: { primary: "#475569", secondary: "#94a3b8", accent: "#334155", background: "#f8fafc" },
  };

  const colorFamily = colorFamilyMap[u.colorTone] || "neutral";
  const styleTag = styleTagMap[u.colorTone] || "modern";
  const palette = paletteMap[u.colorTone] || paletteMap.all;

  const validCategories = ["wedding", "graduation", "birthday", "event", "anniversary"] as const;
  const category = (validCategories.find((c) => c === u.categorySlug) || "wedding");

  return {
    id: u.id,
    title: u.name,
    slug: u.slug,
    description: u.description,
    category,
    categoryName: u.categoryName,
    image: u.imageUrl,
    scrollPercent: "100%",
    scrollDuration: "12s",
    tag: u.templateType === "premium" ? "PREMIUM" : u.templateType === "hot" ? "HOT" : "FREE",
    likes: u.likeCount,
    views: u.viewCount,
    type: "wedding",
    recipe: u.colorTone === "red" ? "traditional-red" : u.colorTone === "gold" ? "luxury-gold" : "standard-envelope",
    meta: {
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      version: 1,
      author: "ZenLove",
      styleTags: [styleTag],
      colorFamily,
      palette,
      features: ["countdown", "calendar", "album", "map", "rsvp", "gift", "wishes", "music", "envelope"],
      origin: "preset",
    },
    defaultData: {
      eventTitle: u.name,
      person1: "Chú Rể & Cô Dâu",
      date: "2026-12-25",
      time: "11:00",
      venue: "Trung tâm Tiệc cưới & Sự kiện ZenLove",
      address: "123 Đường Hạnh Phúc, TP. Hồ Chí Minh",
      mapUrl: "https://maps.google.com",
      quote: "Tình yêu không phải là nhìn nhau, mà là cùng nhìn về một hướng.",
      invitationBody: "Trân trọng kính mời quý khách tới tham dự lễ thành hôn cùng chung vui với gia đình chúng tôi.",
      mainPhoto: u.imageUrl,
      albumPhotos: [u.imageUrl],
      musicTitle: u.musicName || "Thiên đường với người thương",
      musicUrl: u.musicUrl || "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3",
      bankInfo: {
        bankName: "Ngân hàng Thương mại",
        accountNumber: "8888888888",
        accountHolder: "ZENLOVE",
      },
      initialWishes: [
        {
          id: "w-1",
          name: "Gia đình ZenLove",
          message: "Chúc hai bạn trăm năm hạnh phúc, đầu bạc răng long!",
          time: "Vừa xong",
        },
      ],
    },
  };
}

