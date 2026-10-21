import { describe, it, expect } from "vitest";
import {
  MODULE_CATEGORIES,
  MODULE_PRESETS,
  getPresetsByCategory,
  getCategoryFolder,
} from "../modulePresetsCatalog";
import {
  generateCeremonyHtml,
  generateDressCodeHtml,
  generateTimelineHtml,
  generateFamilyInfoHtml,
  getModuleRenderHtml,
} from "../moduleHelpers";
import fs from "fs";
import path from "path";

describe("Handcrafted Layout Blocks (Khối mẫu thiết kế thủ công)", () => {
  it("1. Danh mục MODULE_CATEGORIES có đầy đủ 9 thư mục chủ đề bao gồm 'lovestory'", () => {
    expect(MODULE_CATEGORIES.length).toBeGreaterThanOrEqual(9);

    const categoryIds = MODULE_CATEGORIES.map((c) => c.id);
    expect(categoryIds).toContain("ceremony");
    expect(categoryIds).toContain("calendar");
    expect(categoryIds).toContain("family");
    expect(categoryIds).toContain("banking");
    expect(categoryIds).toContain("rsvp");
    expect(categoryIds).toContain("dresscode");
    expect(categoryIds).toContain("lovestory");
    expect(categoryIds).toContain("intro");
    expect(categoryIds).toContain("map");

    const loveStoryFolder = getCategoryFolder("lovestory");
    expect(loveStoryFolder).toBeDefined();
    expect(loveStoryFolder?.name).toBe("Chuyện tình yêu");
    expect(loveStoryFolder?.icon).toBe("💍");
  });

  it("2. MODULE_PRESETS chứa đầy đủ các khối mẫu thủ công học hỏi từ các thiết kế thực tế", () => {
    const presetIds = MODULE_PRESETS.map((p) => p.id);

    // Hôn lễ & Tiệc cưới
    expect(presetIds).toContain("ceremony_style_handcrafted_velvet");
    expect(presetIds).toContain("ceremony_style_banquet_reception");
    expect(presetIds).toContain("ceremony_style_artisan_parchment");

    // Lịch cưới nghệ thuật
    expect(presetIds).toContain("calendar_style_handcrafted_grid");

    // Thông tin hai họ
    expect(presetIds).toContain("family_style_handcrafted_linebox");

    // Hộp mừng cưới Song Hỷ
    expect(presetIds).toContain("banking_style_red_envelope_pair");

    // Quy định trang phục
    expect(presetIds).toContain("dresscode_style_handcrafted_chic");

    // Chuyện tình yêu (Love Story)
    expect(presetIds).toContain("lovestory_style_timeline");
    expect(presetIds).toContain("lovestory_style_milestones");
    expect(presetIds).toContain("lovestory_style_journal");

    // Lời ngỏ & Cảm ơn
    expect(presetIds).toContain("intro_style_wax_envelope_hero");
    expect(presetIds).toContain("intro_style_thankyou_handwritten");

    // Kiểm tra số lượng presets mỗi thư mục >= 2
    for (const folder of MODULE_CATEGORIES) {
      const presetsInFolder = getPresetsByCategory(folder.id);
      expect(presetsInFolder.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("3. Khối Thẻ Lễ Thành Hôn Nền Nhung Đỏ (handcrafted_velvet) tái hiện chuẩn xác bố cục thủ công", () => {
    const html = generateCeremonyHtml({
      styleVariant: "handcrafted_velvet",
      ceremonyName: "LỄ THÀNH HÔN",
      time: "11:30",
      date: "2026-12-29",
      lunarDate: "(Tức ngày 11 tháng 11 năm Bính Ngọ)",
      location: "TẠI TƯ GIA NHÀ TRAI",
    });

    // 1. Tiêu đề khối
    expect(html).toContain("THÔNG TIN LỄ CƯỚI");
    // 2. Hai cột Nhà Trai & Nhà Gái với vạch ngăn cách
    expect(html).toContain("NHÀ TRAI");
    expect(html).toContain("NHÀ GÁI");
    // 3. Lời báo tin
    expect(html).toContain("TRÂN TRỌNG BÁO TIN");
    expect(html).toContain("Đức Mạnh");
    expect(html).toContain("Lệ Quyên");
    // 4. Cụm ngày giờ nghệ thuật đa thành phần (Artisanal Date Grid)
    expect(html).toContain("VÀO LÚC 11:30");
    expect(html).toContain("CHỦ NHẬT");
    expect(html).toContain("29");
    expect(html).toContain("THÁNG 12");
    expect(html).toContain("NĂM 2026");
    expect(html).toContain("Tức ngày 11 tháng 11 năm Bính Ngọ");
  });

  it("4. Khối Thẻ Tiệc Cưới & Đếm Ngược (banquet_reception) hiển thị chuẩn giờ đón khách & khai tiệc", () => {
    const html = generateCeremonyHtml({
      styleVariant: "banquet_reception",
      ceremonyName: "TIỆC MỪNG HÔN LỄ",
      time: "17:30",
      date: "2026-12-29",
      lunarDate: "(Tức ngày 11 tháng 11 năm Bính Ngọ)",
      location: "TRUNG TÂM TIỆC CƯỚI TRỐNG ĐỒNG PALACE - SẢNH DIAMOND",
    });

    expect(html).toContain("THÔNG TIN TIỆC CƯỚI");
    expect(html).toContain("ĐÓN KHÁCH: 16:30");
    expect(html).toContain("KHAI TIỆC: 17:30");
    expect(html).toContain("TRỐNG ĐỒNG PALACE");
  });

  it("5. Khối Quy Định Trang Phục Dạ Tiệc (handcrafted_chic) hiển thị đầy đủ bảng 4 màu & hướng dẫn Nam Nữ", () => {
    const html = generateDressCodeHtml(
      [
        { color: "#D4AF37", label: "Champagne" },
        { color: "#511419", label: "Burgundy" },
        { color: "#D7CCB8", label: "Nude Be" },
        { color: "#F5EBE6", label: "Trắng Ngà" },
      ],
      "QUY ĐỊNH TRANG PHỤC: Để những bức hình kỷ niệm thêm phần trang nhã..."
    );

    expect(html).toContain("QUY ĐỊNH TRANG PHỤC (DRESS CODE)");
    expect(html).toContain("Champagne");
    expect(html).toContain("Burgundy");
    expect(html).toContain("Nude Be");
    expect(html).toContain("Trắng Ngà");
    expect(html).toContain("Nam:");
    expect(html).toContain("Nữ:");
    expect(html).toContain("không mặc màu trắng");
  });

  it("6. Khối Chuyện Tình Yêu (Love Story Timeline) hiển thị các mốc kỷ niệm với layout đẹp", () => {
    const html = generateTimelineHtml([
      { id: "1", time: "15.08.2023", title: "Lần đầu gặp gỡ chạm ánh mắt" },
      { id: "2", time: "20.10.2023", title: "Lời hẹn ước chính thức" },
      { id: "3", time: "14.02.2026", title: "Khoảnh khắc cầu hôn ngọt ngào" },
      { id: "4", time: "20.11.2026", title: "Ngày chung đôi trăm năm" },
    ]);

    expect(html).toContain("CHUYỆN TÌNH YÊU (LOVE STORY)");
    expect(html).toContain("Lần đầu gặp gỡ chạm ánh mắt");
    expect(html).toContain("Lời hẹn ước chính thức");
    expect(html).toContain("Khoảnh khắc cầu hôn ngọt ngào");
    expect(html).toContain("Ngày chung đôi trăm năm");
  });

  it("7. Khối Thông Tin Hai Họ vạch ngăn LineBox (handcrafted_linebox) hiển thị đúng cấu trúc đối xứng", () => {
    const html = generateFamilyInfoHtml({
      styleVariant: "handcrafted_linebox",
      groomFather: "Lê Văn Thắng",
      groomMother: "Ngô Thị Ân",
      groomName: "Lê Đức Mạnh",
      brideFather: "Trần Đức Tuấn",
      brideMother: "Trần Thị Nga",
      brideName: "Trần Lệ Quyên",
    });

    expect(html).toContain("ĐẠI DIỆN HAI DÒNG HỌ");
    expect(html).toContain("NHÀ TRAI");
    expect(html).toContain("NHÀ GÁI");
    expect(html).toContain("Lê Văn Thắng");
    expect(html).toContain("Trần Đức Tuấn");
  });

  it("8. PresetVisualPreviewMockup và EditorLeftDrawer tích hợp đầy đủ Mockup đồ họa và Thư viện Khối Mẫu", () => {
    const mockupPath = path.resolve("src/components/editor/PresetVisualPreviewMockup.tsx");
    const mockupContent = fs.readFileSync(mockupPath, "utf8");

    expect(mockupContent).toContain("renderLoveStoryMockup");
    expect(mockupContent).toContain("ceremony_style_handcrafted_velvet");
    expect(mockupContent).toContain("calendar_style_handcrafted_grid");
    expect(mockupContent).toContain("banking_style_red_envelope_pair");
    expect(mockupContent).toContain("family_style_handcrafted_linebox");

    const drawerPath = path.resolve("src/components/editor/EditorLeftDrawer.tsx");
    const drawerContent = fs.readFileSync(drawerPath, "utf8");

    // Đã tích hợp ModulePresetsFolderBrowser trực tiếp vào tab Khối Mẫu
    expect(drawerContent).toContain("ModulePresetsFolderBrowser");
    expect(drawerContent).toContain("Kho Khối Mẫu Thủ Công");
    expect(drawerContent).toContain("widgetsSubTab");
  });

  it("9. Tất cả 100% khối mẫu (MODULE_PRESETS) đều được gắn hiệu ứng riêng (blockEffect)", () => {
    expect(MODULE_PRESETS.length).toBeGreaterThan(50);

    for (const preset of MODULE_PRESETS) {
      expect(preset.blockEffect).toBeDefined();
      expect(typeof preset.blockEffect?.entranceEffect).toBe("string");
      expect(preset.blockEffect?.entranceEffect.length).toBeGreaterThan(0);
      expect(typeof preset.blockEffect?.continuousEffect).toBe("string");
      expect(typeof preset.blockEffect?.badgeLabel).toBe("string");
      expect(preset.blockEffect?.badgeLabel.length).toBeGreaterThan(0);
    }
  });

  it("10. Tất cả 100% khối mẫu đều có defaultProps.transition và defaultProps.continuousAnimation đồng bộ", () => {
    for (const preset of MODULE_PRESETS) {
      const trans = preset.defaultProps.transition;
      expect(trans).toBeDefined();
      expect(trans.effectEnabled).toBe(true);
      expect(trans.effectType).toBe(preset.blockEffect?.entranceEffect);
      expect(trans.effectDuration).toBeGreaterThan(0);

      const cont = preset.defaultProps.continuousAnimation;
      expect(cont).toBeDefined();
      expect(cont.type).toBe(preset.blockEffect?.continuousEffect);
      expect(cont.duration).toBeGreaterThan(0);
    }
  });

  it("11. Các khối mẫu thủ công tiêu biểu có hiệu ứng chuyển động chuyên biệt phù hợp với chủ đề", () => {
    const velvet = MODULE_PRESETS.find((p) => p.id === "ceremony_style_handcrafted_velvet");
    expect(velvet?.blockEffect?.entranceEffect).toBe("doorOpen");
    expect(velvet?.blockEffect?.continuousEffect).toBe("float");
    expect(velvet?.blockEffect?.badgeLabel).toContain("Mở cánh 3D");

    const banquet = MODULE_PRESETS.find((p) => p.id === "ceremony_style_banquet_reception");
    expect(banquet?.blockEffect?.entranceEffect).toBe("flipInY");
    expect(banquet?.blockEffect?.continuousEffect).toBe("pulse");

    const calendarGrid = MODULE_PRESETS.find((p) => p.id === "calendar_style_handcrafted_grid");
    expect(calendarGrid?.blockEffect?.entranceEffect).toBe("zoomIn");
    expect(calendarGrid?.blockEffect?.continuousEffect).toBe("pulse");
    expect(calendarGrid?.blockEffect?.badgeLabel).toContain("Nhịp đếm ngược");

    const redEnvelope = MODULE_PRESETS.find((p) => p.id === "banking_style_red_envelope_pair");
    expect(redEnvelope?.blockEffect?.entranceEffect).toBe("doorOpen");
    expect(redEnvelope?.blockEffect?.continuousEffect).toBe("shake");
    expect(redEnvelope?.blockEffect?.badgeLabel).toContain("Mở nắp phong bì");

    const dresscodeChic = MODULE_PRESETS.find((p) => p.id === "dresscode_style_handcrafted_chic");
    expect(dresscodeChic?.blockEffect?.entranceEffect).toBe("fadeInDown");
    expect(dresscodeChic?.blockEffect?.continuousEffect).toBe("wobble");
    expect(dresscodeChic?.blockEffect?.badgeLabel).toContain("Lắc lư đón gió");

    const loveStory = MODULE_PRESETS.find((p) => p.id === "lovestory_style_timeline");
    expect(loveStory?.blockEffect?.entranceEffect).toBe("floatIn");
    expect(loveStory?.blockEffect?.continuousEffect).toBe("float");

    const waxSeal = MODULE_PRESETS.find((p) => p.id === "intro_style_wax_envelope_hero");
    expect(waxSeal?.blockEffect?.entranceEffect).toBe("doorOpen");
    expect(waxSeal?.blockEffect?.continuousEffect).toBe("float");

    const thankyou = MODULE_PRESETS.find((p) => p.id === "intro_style_thankyou_handwritten");
    expect(thankyou?.blockEffect?.entranceEffect).toBe("blurReveal");
    expect(thankyou?.blockEffect?.continuousEffect).toBe("pulse");
  });

  it("12. Giao diện người dùng tích hợp đầy đủ hiển thị hiệu ứng khối riêng trong ModulePresetsFolderBrowser và PresetVisualPreviewMockup", () => {
    const browserPath = path.resolve("src/components/editor/ModulePresetsFolderBrowser.tsx");
    const browserContent = fs.readFileSync(browserPath, "utf8");
    expect(browserContent).toContain("preset.blockEffect");
    expect(browserContent).toContain("Hiệu ứng riêng:");

    const mockupPath = path.resolve("src/components/editor/PresetVisualPreviewMockup.tsx");
    const mockupContent = fs.readFileSync(mockupPath, "utf8");
    expect(mockupContent).toContain("preset.blockEffect");
    expect(mockupContent).toContain("hoverAnimClass");

    const inspectorPath = path.resolve("src/components/editor/EditorRightInspector.tsx");
    const inspectorContent = fs.readFileSync(inspectorPath, "utf8");
    expect(inspectorContent).toContain("Hiệu ứng của khối");
    expect(inspectorContent).toContain("Xem trước hiệu ứng");
  });
});
