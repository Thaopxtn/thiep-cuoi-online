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

  it("1. EditorFloatingToolbar phải cung cấp thanh công cụ nổi ngữ cảnh nhanh chuẩn Canva", () => {
    expect(fs.existsSync(floatingToolbarFile)).toBe(true);
    const content = fs.readFileSync(floatingToolbarFile, "utf8");

    // Kiểm tra các công cụ cho chữ: Font, Size, Color, Bold, Italic, Align
    expect(content).toContain("QUICK_FONTS");
    expect(content).toContain("QUICK_COLORS");
    expect(content).toContain("handleChangeFontSize");
    expect(content).toContain("handleToggleBold");
    expect(content).toContain("handleToggleItalic");
    expect(content).toContain("handleCenterHorizontal");

    // Kiểm tra công cụ cho ảnh: Lật, Bo góc, Tách nền AI
    expect(content).toContain("flipX");
    expect(content).toContain("borderRadius");
    expect(content).toContain("onRemoveBackground");

    // Kiểm tra công cụ quản lý lớp & nhân bản & xóa
    expect(content).toContain("onDuplicate");
    expect(content).toContain("onDelete");
    expect(content).toContain("handleLayerChange");
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

  it("4. EditorCanvas phải tích hợp floating toolbar, context menu, bottom bar và double-click inline edit", () => {
    expect(fs.existsSync(canvasFile)).toBe(true);
    const content = fs.readFileSync(canvasFile, "utf8");

    expect(content).toContain("<EditorFloatingToolbar");
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
});
