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
      label: "Tự động điền",
      icon: <Wand2 className="w-4 h-4" />,
      isSpecial: true,
    },
    {
      id: "layers",
      label: "Thành phần",
      icon: <Layers className="w-4 h-4" />,
    },
    { id: "text", label: "Văn bản", icon: <Type className="w-4 h-4" /> },
    { id: "image", label: "Hình ảnh", icon: <ImageIcon className="w-4 h-4" /> },
    { id: "background", label: "Nền", icon: <Palette className="w-4 h-4" /> },
    { id: "stock", label: "Stock", icon: <Camera className="w-4 h-4" /> },
    { id: "tools", label: "Công cụ", icon: <Wrench className="w-4 h-4" /> },
    { id: "music", label: "Nhạc nền", icon: <Music className="w-4 h-4" /> },
    { id: "widgets", label: "Tiện ích", icon: <LayoutGrid className="w-4 h-4" /> },
    { id: "templates", label: "Mẫu", icon: <FileText className="w-4 h-4" /> },
    { id: "effects", label: "Hiệu ứng", icon: <Sparkles className="w-4 h-4" /> },
    { id: "presets", label: "Bộ màu", icon: <SlidersHorizontal className="w-4 h-4" /> },
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
    <aside className="w-[62px] bg-white border-r border-gray-200 flex flex-col justify-between items-center py-3 z-40 select-none shrink-0 shadow-xs">
      {/* Tool Navigation Items */}
      <div className="flex flex-col items-center gap-1.5 w-full px-1">
        {railItems.map((item) => {
          const isActive = activeTab === item.id && isDrawerOpen;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleClick(item.id)}
              className={`w-full py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all text-center relative ${
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
              <span className="text-[10px] leading-none tracking-tight">
                {item.label}
              </span>
              {item.isSpecial && !isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#e54153] absolute top-1.5 right-1.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom: Support Button */}
      <div className="w-full px-1 pt-2 border-t border-gray-100 flex flex-col items-center">
        <button
          type="button"
          onClick={() => handleClick("support")}
          className={`w-full py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
            activeTab === "support" && isDrawerOpen
              ? "bg-rose-50 text-zen-primary font-bold"
              : "text-gray-400 hover:text-gray-800 hover:bg-gray-100"
          }`}
          title="Hỗ trợ & Trợ giúp"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="text-[10px] leading-none">Hỗ trợ</span>
        </button>
      </div>
    </aside>
  );
}
