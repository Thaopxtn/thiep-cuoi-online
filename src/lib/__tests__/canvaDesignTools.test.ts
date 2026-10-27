import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Bộ công cụ thiết kế giống Canva & Tối ưu trải nghiệm người dùng (Canva-like UX Tools)", () => {
  const floatingToolbarFile = path.resolve("src/components/editor/EditorFloatingToolbar.tsx");
  const contextMenuFile = path.resolve("src/components/editor/EditorContextMenu.tsx");
  const bottomBarFile = path.resolve("src/components/editor/EditorBottomBar.tsx");
  const canvasFile = path.resolve("src/components/editor/EditorCanvas.tsx");
  const pageFile = path.resolve("src/app/design-template/[id]/page.tsx");
  const shortcutsFile = path.resolve("src/components/editor/EditorShortcutsModal.tsx");

  const topContextualBarFile = path.resolve("src/components/editor/EditorTopContextualBar.tsx");

  it("1. EditorTopContextualBar phải cung cấp thanh công cụ định dạng chữ trên cùng và ngoài khung nội dung", () => {
    expect(fs.existsSync(topContextualBarFile)).toBe(true);
    const content = fs.readFileSync(topContextualBarFile, "utf8");

    // Kiểm tra các công cụ cho chữ: Font, Size, Color, Bold, Italic, Align
    expect(content).toContain("QUICK_FONTS");
    expect(content).toContain("QUICK_COLORS");
    expect(content).toContain("handleChangeFontSize");
    expect(content).toContain("handleToggleBold");
    expect(content).toContain("handleToggleItalic");
    expect(content).toContain("handleToggleUnderline");
    expect(content).toContain("handleCycleAlign");

    // Kiểm tra công cụ quản lý lớp & nhân bản & khóa
    expect(content).toContain("onDuplicate");
    expect(content).toContain("onDelete");
    expect(content).toContain("isElementLocked");
  });

  it("2. EditorContextMenu phải cung cấp menu chuột phải trực quan chuẩn Canva", () => {
    expect(fs.existsSync(contextMenuFile)).toBe(true);
    const content = fs.readFileSync(contextMenuFile, "utf8");

    expect(content).toContain("handleCenterHorizontal");
    expect(content).toContain("handleCenterVertical");
    expect(content).toContain("handleResetRotation");
    expect(content).toContain("handleLayer");
    expect(content).toContain("onDuplicate");
    expect(content).toContain("onDelete");
    expect(content).toContain("locked");
  });

  it("3. EditorBottomBar phải tích hợp thanh điều khiển zoom, fit-to-screen, bật tắt lưới và bắt dính", () => {
    expect(fs.existsSync(bottomBarFile)).toBe(true);
    const content = fs.readFileSync(bottomBarFile, "utf8");

    expect(content).toContain("onFitToScreen");
    expect(content).toContain("onToggleGrid");
    expect(content).toContain("onToggleSnapping");
    expect(content).toContain("ZOOM_PRESETS");
    expect(content).toContain("onOpenPreview");
    expect(content).toContain("onOpenShortcuts");
  });

  it("4. EditorCanvas phải tích hợp top contextual bar bên ngoài khung, context menu, bottom bar và double-click inline edit", () => {
    expect(fs.existsSync(canvasFile)).toBe(true);
    const content = fs.readFileSync(canvasFile, "utf8");

    expect(content).toContain("<EditorTopContextualBar");
    expect(content).toContain("<EditorContextMenu");
    expect(content).toContain("<EditorBottomBar");
    expect(content).toContain("onContextMenu");
    expect(content).toContain("onDoubleClick");
    expect(content).toContain("inlineEditNode");
    expect(content).toContain("isGridVisible");
  });

  it("5. DesignTemplate page & Shortcuts Modal phải hỗ trợ đầy đủ phím tắt Canva", () => {
    expect(fs.existsSync(pageFile)).toBe(true);
    const pageContent = fs.readFileSync(pageFile, "utf8");
    expect(pageContent).toContain('e.key.toLowerCase() === "l"'); // Lock
    expect(pageContent).toContain('e.key === "]"'); // Layer up
    expect(pageContent).toContain('e.key === "["'); // Layer down
    expect(pageContent).toContain("handleFitToScreen");

    expect(fs.existsSync(shortcutsFile)).toBe(true);
    const scContent = fs.readFileSync(shortcutsFile, "utf8");
    expect(scContent).toContain("Ctrl + L");
    expect(scContent).toContain("[ hoặc ]");
    expect(scContent).toContain("Chuột phải");
    expect(scContent).toContain("Nhấp đúp chuột");
  });

  it("6. handleAddModulePreset & handleAddWidget phải tự động chèn dưới vị trí chọn và đẩy các bố cục phía sau xuống", () => {
    expect(fs.existsSync(pageFile)).toBe(true);
    const pageContent = fs.readFileSync(pageFile, "utf8");

    // Kiểm tra thuật toán tính toán vị trí chèn dựa trên selectedNode
    expect(pageContent).toContain("shiftThresholdY");
    expect(pageContent).toContain("shiftAmount");
    expect(pageContent).toContain("selTop + selHeight + gap");
    expect(pageContent).toContain("top >= shiftThresholdY");
    expect(pageContent).toContain("currentCanvasHeight + shiftAmount");
  });

  it("7. Thư viện Khối Mẫu dạng Thư Mục (Folder Explorer): Mỗi thư mục chứa nhiều kiểu dáng khối mẫu khác nhau", async () => {
    const { MODULE_CATEGORIES, MODULE_PRESETS, getPresetsByCategory, getCategoryFolder } = await import("../modulePresetsCatalog");

    // Kiểm tra danh sách thư mục danh mục
    expect(MODULE_CATEGORIES.length).toBeGreaterThanOrEqual(7);
    
    // Mỗi thư mục phải có đầy đủ thông tin: id, name, folderTitle, description, icon, badgeColor, accentBg
    for (const folder of MODULE_CATEGORIES) {
      expect(folder.id).toBeTruthy();
      expect(folder.name).toBeTruthy();
      expect(folder.folderTitle).toBeTruthy();
      expect(folder.description).toBeTruthy();
      expect(folder.icon).toBeTruthy();
      expect(folder.badgeColor).toBeTruthy();

      // Mỗi thư mục phải chứa ít nhất 2 kiểu dáng thiết kế khác nhau (tùy chọn)
      const presetsInFolder = getPresetsByCategory(folder.id);
      expect(presetsInFolder.length).toBeGreaterThanOrEqual(2);

      // Kiểm tra helper getCategoryFolder
      const fetchedFolder = getCategoryFolder(folder.id);
      expect(fetchedFolder?.id).toBe(folder.id);
    }

    // Tổng số lượng mẫu preset phong phú
    expect(MODULE_PRESETS.length).toBeGreaterThanOrEqual(20);
  });

  it("8. Component ModulePresetsFolderBrowser hỗ trợ xem danh sách thư mục, duyệt chi tiết thư mục và tìm kiếm đa thư mục", () => {
    const folderBrowserFile = path.resolve("src/components/editor/ModulePresetsFolderBrowser.tsx");
    expect(fs.existsSync(folderBrowserFile)).toBe(true);

    const content = fs.readFileSync(folderBrowserFile, "utf8");
    // Kiểm tra state duyệt thư mục
    expect(content).toContain("selectedFolderId");
    // Kiểm tra nút trở lại danh sách thư mục
    expect(content).toContain("Trở lại tất cả thư mục");
    // Kiểm tra tìm kiếm đa thư mục
    expect(content).toContain("searchQuery");
    // Kiểm tra nút chèn khối mẫu
    expect(content).toContain("onAddModulePreset");
    // Kiểm tra hiển thị cấu trúc thư mục
    expect(content).toContain("phong cách trong thư mục");
    expect(content).toContain("Chọn thư mục loại khối mẫu");
    // Kiểm tra tích hợp ảnh demo trực quan thay vì chỉ dùng chữ mô tả
    expect(content).toContain("PresetVisualPreviewMockup");
  });

  it("9. Component PresetVisualPreviewMockup hỗ trợ hiển thị ảnh demo trực quan cho tất cả danh mục khối mẫu", () => {
    const mockupFile = path.resolve("src/components/editor/PresetVisualPreviewMockup.tsx");
    expect(fs.existsSync(mockupFile)).toBe(true);

    const content = fs.readFileSync(mockupFile, "utf8");
    // Hỗ trợ hiển thị ảnh URL nếu có
    expect(content).toContain("preset.previewImage");
    // Đầy đủ mockup đồ họa trực quan cho 8 danh mục
    expect(content).toContain("renderMapMockup");
    expect(content).toContain("renderCalendarMockup");
    expect(content).toContain("renderCeremonyMockup");
    expect(content).toContain("renderFamilyMockup");
    expect(content).toContain("renderBankingMockup");
    expect(content).toContain("renderRsvpMockup");
    expect(content).toContain("renderDresscodeMockup");
    expect(content).toContain("renderIntroMockup");
  });

  it("10. Giao diện Mobile tối ưu toàn diện: Bottom Rail, Bottom Sheet Drawer, Auto-Fit Zoom và Touch Gestures", () => {
    // 1. Header có menu di động MoreVertical và gom nhóm nút phụ
    const headerFile = path.resolve("src/components/editor/EditorHeader.tsx");
    const headerContent = fs.readFileSync(headerFile, "utf8");
    expect(headerContent).toContain("MoreVertical");
    expect(headerContent).toContain("isMobileMenuOpen");

    // 2. Left Rail hỗ trợ thanh điều hướng đáy di động (Bottom Navigation Bar)
    const railFile = path.resolve("src/components/editor/EditorLeftRail.tsx");
    const railContent = fs.readFileSync(railFile, "utf8");
    expect(railContent).toContain("flex-row");
    expect(railContent).toContain("overflow-x-auto");
    expect(railContent).toContain("touch-manipulation");

    // 3. Left Drawer hỗ trợ dạng Bottom Sheet lướt từ đáy màn hình di động
    const drawerFile = path.resolve("src/components/editor/EditorLeftDrawer.tsx");
    const drawerContent = fs.readFileSync(drawerFile, "utf8");
    expect(drawerContent).toContain("fixed inset-x-0 bottom-0");
    expect(drawerContent).toContain("rounded-t-3xl");

    // 4. Canvas hỗ trợ cử chỉ cảm ứng (Touch) và tránh đè lên thanh điều hướng đáy
    const canvasFile = path.resolve("src/components/editor/EditorCanvas.tsx");
    const canvasContent = fs.readFileSync(canvasFile, "utf8");
    expect(canvasContent).toContain("onTouchStart");
    expect(canvasContent).toContain("bottom-16 sm:bottom-5");
    expect(canvasContent).toContain("touch-pan-y");

    // 5. Thanh công cụ đáy EditorBottomBar cách lề đáy tránh đè thanh điều hướng
    const bottomBarFile = path.resolve("src/components/editor/EditorBottomBar.tsx");
    const bottomBarContent = fs.readFileSync(bottomBarFile, "utf8");
    expect(bottomBarContent).toContain("bottom-16 sm:bottom-4");

    // 6. Trang thiết kế tự động tính toán tỷ lệ Zoom tối ưu cho chiều rộng điện thoại
    const pageFile = path.resolve("src/app/design-template/[id]/page.tsx");
    const pageContent = fs.readFileSync(pageFile, "utf8");
    expect(pageContent).toContain("window.innerWidth < 768");
    expect(pageContent).toContain("(window.innerWidth - 24) / 500");
  });

  it("11. Module Presets Catalog & Canvas: Tất cả các mẫu khối Hộp mừng cưới (Banking) đều có styleVariant khớp 100% với Mockup xem trước", () => {
    // 1. Kiểm tra catalog presets
    const catalogFile = path.resolve("src/lib/modulePresetsCatalog.ts");
    const catalogContent = fs.readFileSync(catalogFile, "utf8");

    expect(catalogContent).toContain('styleVariant: "dual_accounts"');
    expect(catalogContent).toContain('styleVariant: "single_clean"');
    expect(catalogContent).toContain('styleVariant: "vip_gold_card"');
    expect(catalogContent).toContain('styleVariant: "message_envelope"');
    expect(catalogContent).toContain('styleVariant: "minimal"');
    expect(catalogContent).toContain('styleVariant: "dual_vertical"');

    // 2. Kiểm tra EditorCanvas.tsx có đủ các nhánh render tương ứng
    const canvasFile = path.resolve("src/components/editor/EditorCanvas.tsx");
    const canvasContent = fs.readFileSync(canvasFile, "utf8");
    expect(canvasContent).toContain('variant === "dual_accounts"');
    expect(canvasContent).toContain('variant === "vip_gold_card"');
    expect(canvasContent).toContain('variant === "single_clean"');
    expect(canvasContent).toContain('variant === "message_envelope"');
    expect(canvasContent).toContain('variant === "dual_vertical"');

    // 3. Kiểm tra CardNodeRenderer.tsx cũng có đủ các nhánh render tương ứng
    const rendererFile = path.resolve("src/components/CardNodeRenderer.tsx");
    const rendererContent = fs.readFileSync(rendererFile, "utf8");
    expect(rendererContent).toContain('variant === "dual_accounts"');
    expect(rendererContent).toContain('variant === "vip_gold_card"');
    expect(rendererContent).toContain('variant === "single_clean"');
    expect(rendererContent).toContain('variant === "message_envelope"');
    expect(rendererContent).toContain('variant === "dual_vertical"');
  });

  it("12. Tính năng Chọn Nhiều Đối Tượng (Multi-Selection): Shift/Ctrl click, Quét vùng (Marquee), Khung nhóm và Căn lề hàng loạt", () => {
    const canvasContent = fs.readFileSync(canvasFile, "utf8");
    const pageContent = fs.readFileSync(pageFile, "utf8");

    // 1. Kiểm tra state và handler chọn nhiều trong trang chính
    expect(pageContent).toContain("selectedElements");
    expect(pageContent).toContain("handleSelectElements");
    expect(pageContent).toContain("handleToggleSelectElement");
    expect(pageContent).toContain("handleDuplicateMultiple");
    expect(pageContent).toContain("handleDeleteMultiple");
    expect(pageContent).toContain("handleAlignMultiple");

    // 2. Kiểm tra EditorCanvas hỗ trợ quét vùng (Marquee / Rubberband Selection)
    expect(canvasContent).toContain("handleMouseDownCanvasBg");
    expect(canvasContent).toContain("marqueeBox");
    expect(canvasContent).toContain("Chọn vùng");

    // 3. Kiểm tra EditorCanvas có khung nhóm tập thể và kéo nhóm (Group Bounding Box & Group Drag)
    expect(canvasContent).toContain("multiSelectedNodes");
    expect(canvasContent).toContain("handleMouseDownGroup");
    expect(canvasContent).toContain("onAlignMultipleElements");
    expect(canvasContent).toContain("onDuplicateMultipleElements");
    expect(canvasContent).toContain("onDeleteMultipleElements");
  });

  it("13. Tính năng Co Dãn Bảng Vẽ & Dời Bố Cục (Canvas Stretcher & Splitter): Đẩy xuống, kéo lên và chèn khoảng trống", () => {
    const pageContent = fs.readFileSync(pageFile, "utf8");
    const canvasContent = fs.readFileSync(canvasFile, "utf8");

    // 1. Logic dời phần tử và mở rộng canvas trong page.tsx
    expect(pageContent).toContain("handleShiftElementsBelow");
    expect(pageContent).toContain("handleAddSpacer");
    expect(pageContent).toContain("top >= thresholdY");
    expect(pageContent).toContain("top + deltaY");

    // 2. Thước dời bố cục trên EditorCanvas với nút +50px, +100px, -50px, -100px, Kéo dời
    expect(canvasContent).toContain("Dời bố cục phía dưới");
    expect(canvasContent).toContain("+50px");
    expect(canvasContent).toContain("+100px");
    expect(canvasContent).toContain("-50px");
    expect(canvasContent).toContain("-100px");
    expect(canvasContent).toContain("+Khoảng trống");
    expect(canvasContent).toContain("handleStartStretchDrag");
  });

  it("14. Danh mục Khung Ảnh Nghệ Thuật (Frames Catalog) & PhotoBoxFrameRenderer", async () => {
    const { WEDDING_FRAMES, getFrameById } = await import("../framesCatalog");
    expect(WEDDING_FRAMES.length).toBeGreaterThanOrEqual(8);

    // Kiểm tra các kiểu khung đặc trưng
    const frameTypes = WEDDING_FRAMES.map((f) => f.frameType);
    expect(frameTypes).toContain("arch");
    expect(frameTypes).toContain("polaroid");
    expect(frameTypes).toContain("circle_wreath");
    expect(frameTypes).toContain("octagon");
    expect(frameTypes).toContain("stamp");
    expect(frameTypes).toContain("film");
    expect(frameTypes).toContain("heart");
    expect(frameTypes).toContain("cameo_oval");

    expect(getFrameById("frame_arch_royal")?.frameType).toBe("arch");
    expect(getFrameById("frame_polaroid_vintage")?.frameType).toBe("polaroid");

    // Kiểm tra PhotoBoxFrameRenderer tồn tại và hỗ trợ các kiểu khung
    const frameRendererFile = path.resolve("src/components/PhotoBoxFrameRenderer.tsx");
    expect(fs.existsSync(frameRendererFile)).toBe(true);
    const rendererContent = fs.readFileSync(frameRendererFile, "utf8");
    expect(rendererContent).toContain('frameType === "polaroid"');
    expect(rendererContent).toContain('frameType === "film"');
    expect(rendererContent).toContain('frameType === "stamp"');
    expect(rendererContent).toContain('frameType === "octagon"');
    expect(rendererContent).toContain('frameType === "arch"');
    expect(rendererContent).toContain('frameType === "circle_wreath"');
    expect(rendererContent).toContain('frameType === "cameo_oval"');
    expect(rendererContent).toContain('frameType === "heart"');
  });

  it("15. Danh mục Họa Tiết Trang Trí (Stickers) & Kéo Thả HTML5 (Canva-style Drag & Drop)", async () => {
    const { WEDDING_STICKERS, STICKER_CATEGORIES, getStickersByCategory } = await import("../stickersCatalog");
    expect(STICKER_CATEGORIES.length).toBeGreaterThanOrEqual(5);
    expect(WEDDING_STICKERS.length).toBeGreaterThanOrEqual(30);

    const flowers = getStickersByCategory("flowers");
    expect(flowers.length).toBeGreaterThanOrEqual(4);

    // Drawer hỗ trợ kéo thả draggable với payload application/zenlove-element
    const drawerFile = path.resolve("src/components/editor/EditorLeftDrawer.tsx");
    const drawerContent = fs.readFileSync(drawerFile, "utf8");
    expect(drawerContent).toContain("draggable");
    expect(drawerContent).toContain("application/zenlove-element");
    expect(drawerContent).toContain("Thành phần");

    // Canvas hỗ trợ onDragOver và onDrop nhận tọa độ chuẩn xác
    const canvasContent = fs.readFileSync(canvasFile, "utf8");
    expect(canvasContent).toContain("handleDragOver");
    expect(canvasContent).toContain("handleDrop");
    expect(canvasContent).toContain("Thả vào đây để chèn vào thiệp cưới");
  });
});


