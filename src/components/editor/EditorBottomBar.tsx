"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  Minus,
  Maximize2,
  Grid,
  Magnet,
  Eye,
  Keyboard,
  RotateCcw,
  Sparkles,
  Smartphone,
  ChevronUp,
  Sliders,
} from "lucide-react";

export interface BottomBarProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onSetZoom: (zoom: number) => void;
  onFitToScreen: () => void;
  isGridVisible: boolean;
  onToggleGrid: () => void;
  isSnappingEnabled: boolean;
  onToggleSnapping: () => void;
  onOpenPreview: () => void;
  onOpenShortcuts: () => void;
}

const ZOOM_PRESETS = [
  { label: "50%", value: 0.5 },
  { label: "75%", value: 0.75 },
  { label: "85% (Chuẩn)", value: 0.85 },
  { label: "100%", value: 1.0 },
  { label: "125%", value: 1.25 },
  { label: "150%", value: 1.5 },
];

export default function EditorBottomBar({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onSetZoom,
  onFitToScreen,
  isGridVisible,
  onToggleGrid,
  isSnappingEnabled,
  onToggleSnapping,
  onOpenPreview,
  onOpenShortcuts,
}: BottomBarProps) {
  const [isZoomMenuOpen, setIsZoomMenuOpen] = useState(false);
  const zoomMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (zoomMenuRef.current && !zoomMenuRef.current.contains(e.target as Node)) {
        setIsZoomMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handleOutside);
    return () => window.removeEventListener("mousedown", handleOutside);
  }, []);

  const zoomPercent = Math.round(zoomLevel * 100);

  return (
    <footer
      className="fixed bottom-4 right-4 z-40 flex items-center gap-2 select-none pointer-events-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ================= CANVA BOTTOM TOOLBAR PILL ================= */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/90 px-3 py-1.5 flex items-center gap-2.5 text-xs text-gray-700">
        {/* Toggle Lưới Blueprint Grid */}
        <button
          type="button"
          onClick={onToggleGrid}
          className={`p-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
            isGridVisible
              ? "bg-rose-50 text-[#e54153] font-bold"
              : "hover:bg-gray-100 text-gray-500 hover:text-gray-800"
          }`}
          title={isGridVisible ? "Lưới thiết kế: Đang BẬT" : "Lưới thiết kế: Đang TẮT"}
        >
          <Grid className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">Lưới</span>
        </button>

        {/* Toggle Nam châm Smart Snap */}
        <button
          type="button"
          onClick={onToggleSnapping}
          className={`p-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
            isSnappingEnabled
              ? "bg-rose-50 text-[#e54153] font-bold"
              : "hover:bg-gray-100 text-gray-500 hover:text-gray-800"
          }`}
          title={isSnappingEnabled ? "Bắt dính căn lề: Đang BẬT" : "Bắt dính căn lề: Đang TẮT"}
        >
          <Magnet className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">Bắt dính</span>
        </button>

        <div className="w-px h-4 bg-gray-200" />

        {/* Zoom Controls: [-] Slider [+] */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onZoomOut}
            className="w-6 h-6 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 flex items-center justify-center transition-colors cursor-pointer"
            title="Thu nhỏ canvas (-)"
          >
            <Minus className="w-3 h-3 stroke-[2.5]" />
          </button>

          {/* Zoom Slider */}
          <input
            type="range"
            min="40"
            max="150"
            step="5"
            value={zoomPercent}
            onChange={(e) => onSetZoom(parseInt(e.target.value) / 100)}
            className="w-16 sm:w-20 accent-[#e54153] cursor-pointer h-1 bg-gray-200 rounded-lg appearance-none"
            title={`Phóng to/thu nhỏ: ${zoomPercent}%`}
          />

          <button
            type="button"
            onClick={onZoomIn}
            className="w-6 h-6 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 flex items-center justify-center transition-colors cursor-pointer"
            title="Phóng to canvas (+)"
          >
            <Plus className="w-3 h-3 stroke-[2.5]" />
          </button>

          {/* Zoom Dropdown Button */}
          <div className="relative" ref={zoomMenuRef}>
            <button
              type="button"
              onClick={() => setIsZoomMenuOpen(!isZoomMenuOpen)}
              className="px-2 py-1 rounded-lg hover:bg-gray-100 text-[11px] font-mono font-bold text-gray-800 flex items-center gap-1 transition-colors cursor-pointer"
              title="Chọn tỉ lệ thu phóng"
            >
              <span>{zoomPercent}%</span>
              <ChevronUp className="w-3 h-3 text-gray-400" />
            </button>

            {isZoomMenuOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-36 bg-white rounded-2xl shadow-2xl border border-gray-200 p-1.5 z-[100] animate-scale-up text-xs flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => {
                    onFitToScreen();
                    setIsZoomMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-rose-50 hover:text-[#e54153] font-semibold text-gray-700 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>Vừa màn hình</span>
                  <Maximize2 className="w-3 h-3" />
                </button>
                <div className="h-px bg-gray-100 my-0.5" />
                {ZOOM_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      onSetZoom(preset.value);
                      setIsZoomMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      zoomPercent === Math.round(preset.value * 100)
                        ? "bg-rose-50 text-[#e54153] font-bold"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="w-px h-4 bg-gray-200" />

        {/* Nút Vừa màn hình (Fit to Screen) */}
        <button
          type="button"
          onClick={onFitToScreen}
          className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer flex items-center gap-1"
          title="Tự động thu phóng vừa vặn toàn bộ chiều cao màn hình"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="hidden md:inline text-[11px] font-medium">Vừa khung</span>
        </button>

        {/* Nút Xem trước điện thoại (Live Preview) */}
        <button
          type="button"
          onClick={onOpenPreview}
          className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-rose-500 to-[#e54153] hover:from-rose-600 hover:to-[#c93243] text-white text-[11px] font-bold flex items-center gap-1.5 shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Xem trước giao diện trên điện thoại (Live Mobile Preview)"
        >
          <Smartphone className="w-3 h-3" />
          <span>Xem thử</span>
        </button>

        {/* Nút Phím tắt (Shortcuts) */}
        <button
          type="button"
          onClick={onOpenShortcuts}
          className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer hidden lg:flex"
          title="Bảng phím tắt trợ giúp"
        >
          <Keyboard className="w-3.5 h-3.5" />
        </button>
      </div>
    </footer>
  );
}
