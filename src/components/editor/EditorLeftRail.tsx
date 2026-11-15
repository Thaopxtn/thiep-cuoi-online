"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import {
  Type, Image as ImageIcon, Palette, Wrench, Music, LayoutGrid, FileText,
  Sparkles, Layers, SlidersHorizontal, HelpCircle, MoreHorizontal, Shapes, X,
  type LucideIcon,
} from "lucide-react";

export type EditorToolTab =
  | "autofill" | "layers" | "text" | "image" | "background" | "stock"
  | "tools" | "music" | "widgets" | "templates" | "effects" | "presets" | "support";

interface EditorLeftRailProps {
  activeTab: EditorToolTab;
  onSelectTab: (tab: EditorToolTab) => void;
  isDrawerOpen: boolean;
  onToggleDrawer: () => void;
}

interface StudioTool {
  id: EditorToolTab;
  label: string;
  icon: LucideIcon;
  description: string;
}

const STUDIO_TOOLS: StudioTool[] = [
  { id: "autofill", label: "Thông tin", icon: FileText, description: "Thông tin cô dâu, chú rể và ngày cưới" },
  { id: "widgets", label: "Khối mẫu", icon: LayoutGrid, description: "Khối nội dung và tiện ích cưới" },
  { id: "layers", label: "Lớp", icon: Layers, description: "Quản lý thứ tự và khóa đối tượng" },
  { id: "text", label: "Chữ", icon: Type, description: "Thêm và chỉnh sửa văn bản" },
  { id: "image", label: "Ảnh & Album", icon: ImageIcon, description: "Ảnh thiết kế và album ảnh cưới" },
  { id: "background", label: "Nền", icon: Palette, description: "Màu và ảnh nền thiệp" },
  { id: "stock", label: "Thành phần", icon: Shapes, description: "Họa tiết, hình và khung ảnh" },
  { id: "tools", label: "Công cụ", icon: Wrench, description: "Tách nền, xuất và nhập bản thiết kế" },
  { id: "music", label: "Nhạc", icon: Music, description: "Nhạc nền thiệp cưới" },
  { id: "templates", label: "Mẫu thiệp", icon: FileText, description: "Thay đổi mẫu thiết kế" },
  { id: "effects", label: "Hiệu ứng", icon: Sparkles, description: "Hiệu ứng chuyển động và phong bì" },
  { id: "presets", label: "Màu sắc", icon: SlidersHorizontal, description: "Bảng màu phong cách" },
  { id: "support", label: "Hỗ trợ", icon: HelpCircle, description: "Hỗ trợ và hướng dẫn sử dụng" },
];

const MOBILE_PRIMARY: EditorToolTab[] = ["autofill", "image", "templates", "effects"];
const mobilePrimaryTools = MOBILE_PRIMARY.map((id) => STUDIO_TOOLS.find((tool) => tool.id === id)!);
const mobileMoreTools = STUDIO_TOOLS.filter((tool) => !MOBILE_PRIMARY.includes(tool.id));

export default function EditorLeftRail({ activeTab, onSelectTab, isDrawerOpen, onToggleDrawer }: EditorLeftRailProps) {
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const mobileMoreRef = useRef<HTMLDivElement>(null);
  const mobileMoreButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMorePanelRef = useRef<HTMLDivElement>(null);
  const mobileMorePanelId = useId();

  useEffect(() => {
    if (!isMobileMoreOpen) return;
    mobileMorePanelRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const closeOutside = (event: PointerEvent | FocusEvent) => {
      if (event.target instanceof Node && !mobileMoreRef.current?.contains(event.target)) setIsMobileMoreOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("focusin", closeOutside);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("focusin", closeOutside);
    };
  }, [isMobileMoreOpen]);

  const closeMore = () => {
    setIsMobileMoreOpen(false);
    mobileMoreButtonRef.current?.focus();
  };

  const handleClick = (id: EditorToolTab) => {
    if (isMobileMoreOpen) closeMore();
    if (activeTab === id && isDrawerOpen) onToggleDrawer();
    else {
      onSelectTab(id);
      if (!isDrawerOpen) onToggleDrawer();
    }
  };

  const toolClass = (isActive: boolean) => `flex min-h-11 w-full shrink-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-center transition-colors ${isActive ? "bg-[var(--studio-accent-soft)] font-semibold text-[var(--studio-accent)]" : "text-[var(--studio-muted)] hover:bg-[var(--studio-surface-muted)] hover:text-[var(--studio-text)]"}`;

  return (
    <>
      <nav aria-label="Công cụ thiết kế" className="hidden w-[72px] shrink-0 select-none flex-col border-r border-[var(--studio-border)] bg-[var(--studio-surface)] px-1.5 py-2 md:flex">
        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain">
          {STUDIO_TOOLS.filter((tool) => tool.id !== "support").map((tool) => (
            <button key={tool.id} type="button" onClick={() => handleClick(tool.id)} aria-pressed={activeTab === tool.id && isDrawerOpen} aria-label={tool.label} title={`${tool.label} — ${tool.description}`} className={toolClass(activeTab === tool.id && isDrawerOpen)}>
              <tool.icon className="h-[18px] w-[18px]" aria-hidden="true" />
              <span className="text-[11px] leading-tight">{tool.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-2 shrink-0 border-t border-[var(--studio-border)] pt-2">
          <button type="button" onClick={() => handleClick("support")} aria-pressed={activeTab === "support" && isDrawerOpen} className={toolClass(activeTab === "support" && isDrawerOpen)} title="Hỗ trợ & Trợ giúp">
            <HelpCircle className="h-[18px] w-[18px]" aria-hidden="true" /><span className="text-[11px] leading-tight">Hỗ trợ</span>
          </button>
        </div>
      </nav>

      <nav aria-label="Công cụ thiết kế trên điện thoại" className="z-40 flex w-full shrink-0 touch-manipulation select-none flex-row items-center gap-0.5 overflow-x-auto border-t border-[var(--studio-border)] bg-[var(--studio-surface)] px-1 py-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden">
        {mobilePrimaryTools.map((tool) => (
          <button key={tool.id} type="button" onClick={() => handleClick(tool.id)} aria-pressed={activeTab === tool.id && isDrawerOpen} title={tool.description} className={`${toolClass(activeTab === tool.id && isDrawerOpen)} !w-auto min-w-0 flex-1`}>
            <tool.icon className="h-[18px] w-[18px]" aria-hidden="true" /><span className="text-[11px] leading-tight">{tool.id === "image" ? "Ảnh cưới" : tool.label}</span>
          </button>
        ))}
        <div className="relative min-w-0 flex-1" ref={mobileMoreRef} onKeyDown={(event) => {
          if (event.key === "Escape" && isMobileMoreOpen) {
            event.preventDefault();
            event.stopPropagation();
            closeMore();
          }
        }}>
          <button ref={mobileMoreButtonRef} type="button" onClick={() => setIsMobileMoreOpen((open) => !open)} aria-expanded={isMobileMoreOpen} aria-controls={mobileMorePanelId} className={toolClass(isMobileMoreOpen || (isDrawerOpen && mobileMoreTools.some((tool) => tool.id === activeTab)))}>
            <MoreHorizontal className="h-[18px] w-[18px]" aria-hidden="true" /><span className="text-[11px] leading-tight">Thêm...</span>
          </button>
          {isMobileMoreOpen && (
            <div id={mobileMorePanelId} ref={mobileMorePanelRef} role="region" aria-label="Công cụ thiết kế khác" className="fixed inset-x-2 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 max-h-[65dvh] overflow-y-auto rounded-xl border border-[var(--studio-border)] bg-[var(--studio-surface)] p-3 shadow-lg">
              <div className="mb-2 flex items-center justify-between border-b border-[var(--studio-border)] pb-2">
                <h2 className="text-sm font-semibold text-[var(--studio-text)]">Công cụ thiết kế khác</h2>
                <button type="button" onClick={closeMore} className="studio-icon-button" aria-label="Đóng công cụ thiết kế khác"><X className="h-4 w-4" aria-hidden="true" /></button>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {mobileMoreTools.map((tool) => (
                  <button key={tool.id} type="button" onClick={() => handleClick(tool.id)} aria-pressed={activeTab === tool.id && isDrawerOpen} title={tool.description} className={`studio-button min-w-0 justify-start gap-2 px-3 py-2 text-left text-xs ${activeTab === tool.id && isDrawerOpen ? "bg-[var(--studio-accent-soft)] text-[var(--studio-accent)]" : "text-[var(--studio-text)]"}`}>
                    <tool.icon className="h-4 w-4 shrink-0" aria-hidden="true" /><span>{tool.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
