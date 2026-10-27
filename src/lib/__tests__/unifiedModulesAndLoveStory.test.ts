import { describe, it, expect } from "vitest";
import { UNIFIED_WEDDING_MODULES, getModulesForTheme } from "@/lib/unifiedModulesRegistry";
import { DEFAULT_LOVE_STORY } from "@/lib/loveStoryConstants";
import { INITIAL_CARDS, WeddingCard } from "@/data/initialCards";

describe("Unified Modules Registry - Love Story & Wedding Album Integration", () => {
  it("UNIFIED_WEDDING_MODULES chứa khối Chuyện Tình Yêu (loveStory) và Album ảnh cưới (album)", () => {
    const loveStoryMod = UNIFIED_WEDDING_MODULES.find((m) => m.id === "loveStory");
    expect(loveStoryMod).toBeDefined();
    expect(loveStoryMod?.isFixed).toBe(true);
    expect(loveStoryMod?.fixedModuleId).toBe("loveStory");

    const albumMod = UNIFIED_WEDDING_MODULES.find((m) => m.id === "album");
    expect(albumMod).toBeDefined();
    expect(albumMod?.isFixed).toBe(true);
    expect(albumMod?.fixedModuleId).toBe("album");
  });

  it("Khối loveStory và album chứa đầy đủ các kiểu dáng hiển thị đặc trưng", () => {
    const loveStoryMod = UNIFIED_WEDDING_MODULES.find((m) => m.id === "loveStory")!;
    expect(loveStoryMod.styles.length).toBeGreaterThanOrEqual(3);
    const styleIds = loveStoryMod.styles.map((s) => s.id);
    expect(styleIds).toContain("vertical-timeline");
    expect(styleIds).toContain("milestone-cards");
    expect(styleIds).toContain("romantic-journal");

    const albumMod = UNIFIED_WEDDING_MODULES.find((m) => m.id === "album")!;
    expect(albumMod.styles.length).toBeGreaterThanOrEqual(3);
    const albumStyleIds = albumMod.styles.map((s) => s.id);
    expect(albumStyleIds).toContain("grid-modern");
    expect(albumStyleIds).toContain("polaroid-scrapbook");
  });

  it("Công tắc isActive của album và loveStory phản ánh chính xác cờ showAlbum và showLoveStory", () => {
    const loveStoryMod = UNIFIED_WEDDING_MODULES.find((m) => m.id === "loveStory")!;
    const albumMod = UNIFIED_WEDDING_MODULES.find((m) => m.id === "album")!;

    const sampleCard: WeddingCard = {
      ...INITIAL_CARDS[0],
      showAlbum: true,
      showLoveStory: true,
      album: ["https://example.com/photo1.jpg"],
    };

    expect(loveStoryMod.isActive(sampleCard, {})).toBe(true);
    expect(albumMod.isActive(sampleCard, {})).toBe(true);

    // Khi tắt cờ showAlbum nhưng vẫn còn ảnh trong mảng album
    const cardWithAlbumDisabled: WeddingCard = {
      ...sampleCard,
      showAlbum: false,
    };
    expect(albumMod.isActive(cardWithAlbumDisabled, {})).toBe(false);

    // Khi tắt cờ showLoveStory
    const cardWithLoveStoryDisabled: WeddingCard = {
      ...sampleCard,
      showLoveStory: false,
    };
    expect(loveStoryMod.isActive(cardWithLoveStoryDisabled, {})).toBe(false);
  });

  it("DEFAULT_LOVE_STORY cung cấp 4 mốc thời gian kinh điển cho thiệp cưới", () => {
    expect(DEFAULT_LOVE_STORY.length).toBe(4);
    expect(DEFAULT_LOVE_STORY[0].title).toBe("Lần Đầu Gặp Gỡ");
    expect(DEFAULT_LOVE_STORY[1].title).toBe("Lời Hẹn Ước Đầu Tiên");
    expect(DEFAULT_LOVE_STORY[2].title).toBe("Khoảnh Khắc Cầu Hôn");
    expect(DEFAULT_LOVE_STORY[3].title).toBe("Ngày Chung Đôi");
  });

  it("getModulesForTheme trả về đầy đủ khối Chuyện Tình Yêu và Album khi chọn chủ đề cưới", () => {
    const weddingModules = getModulesForTheme("wedding");
    const moduleIds = weddingModules.map((m) => m.id);
    expect(moduleIds).toContain("loveStory");
    expect(moduleIds).toContain("album");
    expect(moduleIds).toContain("calendar");
    expect(moduleIds).toContain("events");
    expect(moduleIds).toContain("rsvp");
    expect(moduleIds).toContain("giftBox");
    expect(moduleIds).toContain("wishes");
  });
});
