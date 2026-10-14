"use client";

import React from "react";
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
      label: "Tự điền",
      icon: <Wand2 className="w-4 h-4" />,
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
    { id: "image", label: "Ảnh", icon: <ImageIcon className="w-4 h-4" /> },
    { id: "background", label: "Nền", icon: <Palette className="w-4 h-4" /> },
    { id: "stock", label: "Sticker", icon: <Camera className="w-4 h-4" /> },
    { id: "tools", label: "Công cụ", icon: <Wrench className="w-4 h-4" /> },
    { id: "music", label: "Nhạc", icon: <Music className="w-4 h-4" /> },
    { id: "templates", label: "Mẫu thiệp", icon: <FileText className="w-4 h-4" /> },
    { id: "effects", label: "Hiệu ứng", icon: <Sparkles className="w-4 h-4" /> },
    { id: "presets", label: "Màu sắc", icon: <SlidersHorizontal className="w-4 h-4" /> },
  ];

  const handleClick = (id: EditorToolTab) => {
    if (activeTab === id && isDrawerOpen) {
      onToggleDrawer();
    } else {
      onSelectTab(id);
      if (!isDrawerOpen) onToggleDrawer();
    }
  };

  return (
    <aside className="w-full md:w-[62px] bg-white border-t md:border-t-0 md:border-r border-gray-200 flex md:flex-col flex-row justify-between items-center px-1.5 py-1 md:py-3 z-40 select-none shrink-0 shadow-xs overflow-x-auto md:overflow-x-hidden scrollbar-none touch-manipulation">
      {/* Tool Navigation Items */}
      <div className="flex md:flex-col flex-row items-center gap-1 md:gap-1.5 w-auto md:w-full px-0.5">
        {railItems.map((item) => {
          const isActive = activeTab === item.id && isDrawerOpen;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleClick(item.id)}
              className={`min-w-[56px] md:w-full py-1.5 md:py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 md:gap-1 transition-all text-center relative shrink-0 cursor-pointer active:scale-95 ${
                isActive
                  ? "bg-rose-50 text-zen-primary font-bold shadow-2xs"
                  : item.isSpecial
                  ? "text-[#e54153] hover:bg-rose-50/60 font-semibold"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/70"
              }`}
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

      {/* Bottom/Right: Support Button */}
      <div className="md:w-full px-1 md:pt-2 md:border-t md:border-gray-100 flex md:flex-col flex-row items-center shrink-0">
        <button
          type="button"
          onClick={() => handleClick("support")}
          className={`min-w-[52px] md:w-full py-1.5 md:py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 md:gap-1 transition-all cursor-pointer ${
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
  );
}
