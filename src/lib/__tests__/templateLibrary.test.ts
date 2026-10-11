import { describe, it, expect, beforeEach } from "vitest";
import {
  detectColorTone,
  getTemplateBySlugOrId,
  getRelatedTemplates,
  adaptZenLoveTemplate,
  adaptPresetTemplate,
  unifiedToTemplateItem,
  COLOR_TONE_OPTIONS,
} from "../templateUnifiedService";
import {
  getFavoriteIds,
  isFavorite,
  toggleFavorite,
  FAVORITES_STORAGE_KEY,
} from "../storage/favorites";
import { ZENLOVE_TEMPLATES } from "@/data/zenloveTemplates";
import { SYSTEM_PRESETS } from "@/data/templates";

describe("templateUnifiedService - Color Tone Detection", () => {
  it("nhận diện đúng các tone màu cơ bản", () => {
    expect(detectColorTone("Thiệp cưới Đỏ Hỷ")).toBe("red");
    expect(detectColorTone("Thiệp cưới Red Ruby Quý Phái")).toBe("red");
    expect(detectColorTone("Ngọt Ngào Hồng Pastel")).toBe("pink");
    expect(detectColorTone("Rustic Đồng Xanh Thiên Nhiên")).toBe("green");
    expect(detectColorTone("Hoàng Gia Luxury Vàng Ánh Kim")).toBe("gold");
    expect(detectColorTone("Tím Thủy Chung Son Sắt")).toBe("purple");
    expect(detectColorTone("Tối Giản Thuần Khiết Minimal Trắng")).toBe("white");
  });

  it("mặc định phân loại an toàn cho tên không chứa từ khóa đặc biệt", () => {
    expect(detectColorTone("Mẫu thiệp kỷ niệm ngày vui")).toBe("white");
  });

  it("danh sách COLOR_TONE_OPTIONS có đủ 7 tone màu với nhãn và mã màu", () => {
    expect(COLOR_TONE_OPTIONS).toHaveLength(7);
    const ids = COLOR_TONE_OPTIONS.map((o) => o.id);
    expect(ids).toContain("all");
    expect(ids).toContain("red");
    expect(ids).toContain("pink");
    expect(ids).toContain("green");
    expect(ids).toContain("gold");
    expect(ids).toContain("white");
    expect(ids).toContain("purple");
  });
});

describe("templateUnifiedService - Tra cứu và Hợp nhất Template", () => {
  it("tra cứu thành công mẫu ZenLove 207+ theo slug hoặc id", () => {
    const sample = ZENLOVE_TEMPLATES[0];
    const foundBySlug = getTemplateBySlugOrId(sample.slug);
    expect(foundBySlug).not.toBeNull();
    expect(foundBySlug?.name).toBe(sample.name);
    expect(foundBySlug?.isZenloveCatalog).toBe(true);

    const foundById = getTemplateBySlugOrId(sample.id);
    expect(foundById).not.toBeNull();
    expect(foundById?.id).toBe(sample.id);

    // Kiểm tra không phân biệt chữ hoa thường
    const foundUpper = getTemplateBySlugOrId(sample.slug.toUpperCase());
    expect(foundUpper).not.toBeNull();
    expect(foundUpper?.id).toBe(sample.id);
  });

  it("chuyển đổi và tra cứu mẫu preset hệ thống chính xác qua adaptPresetTemplate", () => {
    if (SYSTEM_PRESETS.length > 0) {
      const presetSample = SYSTEM_PRESETS[0];
      const adapted = adaptPresetTemplate(presetSample);
      expect(adapted).not.toBeNull();
      expect(adapted.name).toBe(presetSample.title);
      expect(adapted.isZenloveCatalog).toBe(false);
      expect(adapted.imageUrl).toBe(presetSample.image);
    }
  });

  it("trả về null khi tìm kiếm slug hoặc id không tồn tại", () => {
    expect(getTemplateBySlugOrId("slug-hoan-toan-khong-ton-tai-xyz-999")).toBeNull();
    expect(getTemplateBySlugOrId("")).toBeNull();
  });

  it("lấy danh sách mẫu liên quan không bao gồm chính mẫu hiện tại", () => {
    const sample = ZENLOVE_TEMPLATES[0];
    const unified = adaptZenLoveTemplate(sample);
    const related = getRelatedTemplates(unified, 4);

    expect(related.length).toBeLessThanOrEqual(4);
    expect(related.every((r) => r.id !== unified.id && r.slug !== unified.slug)).toBe(true);
  });

  it("unifiedToTemplateItem chuyển đổi đầy đủ cấu trúc tương thích với TemplateDetailClient", () => {
    const sample = ZENLOVE_TEMPLATES[0];
    const unified = adaptZenLoveTemplate(sample);
    const templateItem = unifiedToTemplateItem(unified);

    expect(templateItem.id).toBe(unified.id);
    expect(templateItem.title).toBe(unified.name);
    expect(templateItem.slug).toBe(unified.slug);
    expect(templateItem.defaultData).toBeDefined();
    expect(templateItem.defaultData.eventTitle).toBe(unified.name);
    expect(templateItem.defaultData.musicUrl).toBeDefined();
    expect(templateItem.defaultData.bankInfo).toBeDefined();
    expect(templateItem.meta).toBeDefined();
    expect(templateItem.meta?.palette).toBeDefined();
    expect(templateItem.meta?.features).toContain("rsvp");
    expect(templateItem.meta?.features).toContain("music");
  });
});

describe("storage/favorites - Quản lý Danh sách Yêu thích", () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    const mockStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      key: (index: number) => Object.keys(store)[index] || null,
      length: 0,
    };

    (globalThis as any).window = {
      localStorage: mockStorage,
      dispatchEvent: () => true,
    };
    (globalThis as any).localStorage = mockStorage;
    (globalThis as any).CustomEvent = class {
      type: string;
      detail: any;
      constructor(type: string, params: any) {
        this.type = type;
        this.detail = params?.detail;
      }
    };
  });

  it("mặc định danh sách yêu thích rỗng", () => {
    expect(getFavoriteIds()).toEqual([]);
    expect(isFavorite("tpl-1")).toBe(false);
  });

  it("thao tác toggleFavorite thêm và gỡ mẫu yêu thích chính xác", () => {
    const added = toggleFavorite("tpl-101");
    expect(added).toBe(true);
    expect(isFavorite("tpl-101")).toBe(true);
    expect(getFavoriteIds()).toContain("tpl-101");

    const removed = toggleFavorite("tpl-101");
    expect(removed).toBe(false);
    expect(isFavorite("tpl-101")).toBe(false);
    expect(getFavoriteIds()).not.toContain("tpl-101");
  });
});
