"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Wand2,
  Type,
  Image as ImageIcon,
  Palette,
  Camera,
  Wrench,
  Music,
  LayoutGrid,
  FileText,
  Sparkles,
  Layers,
  SlidersHorizontal,
  HelpCircle,
  MoreHorizontal,
  Shapes,
  X,
} from "lucide-react";

export type EditorToolTab =
  | "autofill"
  | "layers"
  | "text"
  | "image"
  | "background"
  | "stock"
  | "tools"
  | "music"
  | "widgets"
  | "templates"
  | "effects"
  | "presets"
  | "support";

interface EditorLeftRailProps {
  activeTab: EditorToolTab;
  onSelectTab: (tab: EditorToolTab) => void;
  isDrawerOpen: boolean;
  onToggleDrawer: () => void;
}

export default function EditorLeftRail({
  activeTab,
  onSelectTab,
  isDrawerOpen,
  onToggleDrawer,
}: EditorLeftRailProps) {
  const railItems: Array<{ id: EditorToolTab; label: string; icon: React.ReactNode; isSpecial?: boolean }> = [
    {
      id: "autofill",
      label: "Thông tin",
      icon: <FileText className="w-4 h-4" />,
      isSpecial: true,
    },
    {
      id: "widgets",
      label: "Khối mẫu",
      icon: <LayoutGrid className="w-4 h-4" />,
      isSpecial: true,
    },
    {
      id: "layers",
      label: "Lớp",
      icon: <Layers className="w-4 h-4" />,
    },
    { id: "text", label: "Chữ", icon: <Type className="w-4 h-4" /> },
    { id: "image", label: "Ảnh & Album", icon: <ImageIcon className="w-4 h-4" /> },
    { id: "background", label: "Nền", icon: <Palette className="w-4 h-4" /> },
    { id: "stock", label: "Thành phần", icon: <Shapes className="w-4 h-4" /> },
    { id: "tools", label: "Công cụ", icon: <Wrench className="w-4 h-4" /> },
    { id: "music", label: "Nhạc", icon: <Music className="w-4 h-4" /> },
    { id: "templates", label: "Mẫu thiệp", icon: <FileText className="w-4 h-4" /> },
    { id: "effects", label: "Hiệu ứng", icon: <Sparkles className="w-4 h-4" /> },
    { id: "presets", label: "Màu sắc", icon: <SlidersHorizontal className="w-4 h-4" /> },
  ];

  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const mobileMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (mobileMoreRef.current && !mobileMoreRef.current.contains(e.target as Node)) {
        setIsMobileMoreOpen(false);
      }
    };
    if (isMobileMoreOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isMobileMoreOpen]);

  const handleClick = (id: EditorToolTab) => {
    setIsMobileMoreOpen(false);
    if (activeTab === id && isDrawerOpen) {
      onToggleDrawer();
    } else {
      onSelectTab(id);
      if (!isDrawerOpen) onToggleDrawer();
    }
  };

  // Các công cụ phụ hiển thị trong menu "Thêm..." trên Mobile
  const mobileMoreTools: Array<{ id: EditorToolTab; label: string; icon: React.ReactNode }> = [
    { id: "widgets", label: "Khối mẫu & Tiện ích", icon: <LayoutGrid className="w-4 h-4 text-rose-500" /> },
    { id: "text", label: "Thêm chữ nghệ thuật", icon: <Type className="w-4 h-4 text-indigo-500" /> },
    { id: "background", label: "Màu & Ảnh nền", icon: <Palette className="w-4 h-4 text-amber-500" /> },
    { id: "stock", label: "Sticker & Họa tiết", icon: <Camera className="w-4 h-4 text-emerald-500" /> },
    { id: "layers", label: "Quản lý Lớp (Layers)", icon: <Layers className="w-4 h-4 text-blue-500" /> },
    { id: "music", label: "Kho nhạc cưới", icon: <Music className="w-4 h-4 text-violet-500" /> },
    { id: "presets", label: "Bảng màu phong cách", icon: <SlidersHorizontal className="w-4 h-4 text-fuchsia-500" /> },
    { id: "tools", label: "Công cụ & Tách nền AI", icon: <Wrench className="w-4 h-4 text-teal-500" /> },
    { id: "support", label: "Hỗ trợ & Hướng dẫn", icon: <HelpCircle className="w-4 h-4 text-gray-500" /> },
  ];

  const isMoreActive = ["widgets", "text", "background", "stock", "layers", "music", "presets", "tools", "support"].includes(activeTab);

  return (
    <>
      {/* ================= 1. DESKTOP RAIL (>= md): Thanh dọc 62px tinh tế ================= */}
      <aside className="hidden md:flex w-[62px] bg-white/98 backdrop-blur-md border-r border-gray-200 flex-col justify-between items-center py-3 z-40 select-none shrink-0 shadow-xs">
        {/* Tool Navigation Items */}
        <div className="flex flex-col items-center gap-1.5 w-full px-1 flex-1 overflow-y-auto scrollbar-none py-0.5">
          {railItems.map((item) => {
            const isActive = activeTab === item.id && isDrawerOpen;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleClick(item.id)}
                className={`w-full py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all text-center relative shrink-0 cursor-pointer active:scale-95 ${
                  isActive
                    ? "bg-rose-50 text-zen-primary font-bold shadow-2xs"
                    : item.isSpecial
                    ? "text-[#e54153] hover:bg-rose-50/60 font-semibold"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/70"
                }`}
                title={item.label}
              >
                <div className={isActive ? "text-zen-primary" : item.isSpecial ? "text-[#e54153]" : "text-gray-500"}>
                  {item.icon}
                </div>
                <span className="text-[10px] leading-tight tracking-tight whitespace-nowrap">
                  {item.label}
                </span>
                {item.isSpecial && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e54153] absolute top-1 right-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Support Button */}
        <div className="w-full px-1 pt-2 border-t border-gray-100 flex flex-col items-center shrink-0">
          <button
            type="button"
            onClick={() => handleClick("support")}
            className={`w-full py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === "support" && isDrawerOpen
                ? "bg-rose-50 text-zen-primary font-bold"
                : "text-gray-400 hover:text-gray-800 hover:bg-gray-100"
            }`}
            title="Hỗ trợ & Trợ giúp"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="text-[10px] leading-none whitespace-nowrap">Hỗ trợ</span>
          </button>
        </div>
      </aside>

      {/* ================= 2. MOBILE BOTTOM BAR (< md): Thanh đáy 5 nút tối ưu cảm ứng ================= */}
      <aside className="md:hidden w-full bg-white/98 backdrop-blur-md border-t border-gray-200/90 flex flex-row items-center justify-around px-1 py-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] z-40 select-none shrink-0 shadow-lg touch-manipulation overflow-x-auto">
        {/* Nút 1: Thông tin (Chính) */}
        <button
          type="button"
          onClick={() => handleClick("autofill")}
          className={`flex-1 min-h-[46px] py-1 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 text-center transition-all cursor-pointer ${
            activeTab === "autofill" && isDrawerOpen
              ? "bg-rose-50 text-zen-primary font-bold shadow-2xs"
              : "text-gray-600 hover:bg-gray-50 font-medium"
          }`}
        >
          <FileText className="w-4.5 h-4.5 text-rose-500" />
          <span className="text-[10px] leading-tight font-medium">Thông tin</span>
        </button>

        {/* Nút 2: Ảnh & Album (Chính) */}
        <button
          type="button"
          onClick={() => handleClick("image")}
          className={`flex-1 min-h-[46px] py-1 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 text-center transition-all cursor-pointer ${
            activeTab === "image" && isDrawerOpen
              ? "bg-rose-50 text-zen-primary font-bold shadow-2xs"
              : "text-gray-600 hover:bg-gray-50 font-medium"
          }`}
        >
          <ImageIcon className="w-4.5 h-4.5 text-indigo-500" />
          <span className="text-[10px] leading-tight font-medium">Ảnh cưới</span>
        </button>

        {/* Nút 3: Mẫu thiệp (Chính) */}
        <button
          type="button"
          onClick={() => handleClick("templates")}
          className={`flex-1 min-h-[46px] py-1 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 text-center transition-all cursor-pointer ${
            activeTab === "templates" && isDrawerOpen
              ? "bg-rose-50 text-zen-primary font-bold shadow-2xs"
              : "text-gray-600 hover:bg-gray-50 font-medium"
          }`}
        >
          <LayoutGrid className="w-4.5 h-4.5 text-emerald-500" />
          <span className="text-[10px] leading-tight font-medium">Mẫu thiệp</span>
        </button>

        {/* Nút 4: Hiệu ứng & Nhạc (Chính) */}
        <button
          type="button"
          onClick={() => handleClick("effects")}
          className={`flex-1 min-h-[46px] py-1 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 text-center transition-all cursor-pointer ${
            activeTab === "effects" && isDrawerOpen
              ? "bg-rose-50 text-zen-primary font-bold shadow-2xs"
              : "text-gray-600 hover:bg-gray-50 font-medium"
          }`}
        >
          <Sparkles className="w-4.5 h-4.5 text-amber-500" />
          <span className="text-[10px] leading-tight font-medium">Hiệu ứng</span>
        </button>

        {/* Nút 5: Menu Thêm... (Chứa toàn bộ tính năng nâng cao) */}
        <div className="flex-1 relative" ref={mobileMoreRef}>
          <button
            type="button"
            onClick={() => setIsMobileMoreOpen(!isMobileMoreOpen)}
            className={`w-full min-h-[46px] py-1 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 text-center transition-all cursor-pointer ${
              (isMobileMoreOpen || (isMoreActive && isDrawerOpen))
                ? "bg-rose-50 text-zen-primary font-bold shadow-2xs"
                : "text-gray-600 hover:bg-gray-50 font-medium"
            }`}
          >
            <MoreHorizontal className="w-4.5 h-4.5 text-gray-500" />
            <span className="text-[10px] leading-tight font-medium">Thêm...</span>
          </button>

          {/* Menu Popup "Thêm..." trên Mobile */}
          {isMobileMoreOpen && (
            <div className="fixed inset-x-3 bottom-18 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200/90 p-3 max-h-[70vh] overflow-y-auto animate-slide-up">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-2">
                <span className="text-xs font-bold text-gray-800">Công cụ thiết kế khác</span>
                <button
                  type="button"
                  onClick={() => setIsMobileMoreOpen(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {mobileMoreTools.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleClick(t.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition-all ${
                      activeTab === t.id && isDrawerOpen
                        ? "bg-rose-50 border-rose-200 text-zen-primary font-bold"
                        : "bg-gray-50/70 border-gray-100 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {t.icon}
                    <span className="truncate">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
