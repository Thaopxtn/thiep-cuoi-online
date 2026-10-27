"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Copy,
  Trash2,
  Layers,
  Lock,
  Unlock,
  Sparkles,
  FlipHorizontal,
  ImageIcon,
  ChevronDown,
  Type,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Scissors,
  Search,
} from "lucide-react";
import { isElementLocked } from "@/lib/decorativeLockService";

export interface EditorTopContextualBarProps {
  selectedElement: {
    id: string;
    type: string;
    props: Record<string, any>;
  };
  onUpdateProps: (id: string, updatedProps: Record<string, any>) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onDeselect?: () => void;
  onOpenImageDrawer?: () => void;
  onRemoveBackground?: () => void;
  onOpenManualCutout?: () => void;
}

// Bảng màu thiết kế thiệp cưới kinh điển (Wedding Luxury Palettes)
export const QUICK_COLORS = [
  { label: "Đỏ Đô Hoàng Gia", value: "#780405" },
  { label: "Đỏ Ruby Lãng Mạn", value: "#e54153" },
  { label: "Vàng Gold Ánh Kim", value: "#d4af37" },
  { label: "Vàng Đồng Cổ Điển", value: "#c5a880" },
  { label: "Đen Than Sang Trọng", value: "#1c171a" },
  { label: "Nâu Tây Thanh Lịch", value: "#4a3b32" },
  { label: "Xanh Navy Quý Phái", value: "#1e3a8a" },
  { label: "Hồng Phấn Ngọt Ngào", value: "#f43f5e" },
  { label: "Trắng Tinh Khôi", value: "#ffffff" },
];

// Danh sách Font chữ Việt hóa nổi bật (Google Fonts & Web Fonts)
export const QUICK_FONTS = [
  { label: "Charmonman (Chữ ký hoàng gia)", value: "font-charmonman", name: "Charmonman" },
  { label: "Charm (Thư pháp thanh lịch)", value: "font-charm", name: "Charm" },
  { label: "Dancing Script (Thư pháp trẻ trung)", value: "font-dancing-script", name: "Dancing Script" },
  { label: "Great Vibes (Thư pháp uốn lượn)", value: "font-great-vibes", name: "Great Vibes" },
  { label: "Alex Brush (Chữ ký thanh thoát)", value: "font-alex-brush", name: "Alex Brush" },
  { label: "Playfair Display (Cổ điển sang trọng)", value: "font-playfair", name: "Playfair Display" },
  { label: "Lora (Serif tinh tế chuẩn mực)", value: "font-lora", name: "Lora" },
  { label: "Cormorant Garamond (Đẳng cấp châu Âu)", value: "font-cormorant", name: "Cormorant Garamond" },
  { label: "Cinzel (Hoàng gia La Mã)", value: "font-cinzel", name: "Cinzel" },
  { label: "Be Vietnam Pro (Chuẩn quốc dân)", value: "font-vietnam", name: "Be Vietnam Pro" },
  { label: "Montserrat (Hình khối hiện đại)", value: "font-montserrat", name: "Montserrat" },
  { label: "Plus Jakarta Sans (Mượt mà thời thượng)", value: "font-jakarta", name: "Plus Jakarta Sans" },
];

// Các cỡ chữ chuẩn Microsoft Word
export const STANDARD_FONT_SIZES = [
  10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 54, 60, 72, 84, 96, 120,
];

export default function EditorTopContextualBar({
  selectedElement,
  onUpdateProps,
  onDuplicate,
  onDelete,
  onDeselect,
  onOpenImageDrawer,
  onRemoveBackground,
  onOpenManualCutout,
}: EditorTopContextualBarProps) {
  const { id, type, props } = selectedElement;
  const isLocked = isElementLocked(id, { props, type });

  // Dropdown states
  const [isFontMenuOpen, setIsFontMenuOpen] = useState(false);
  const [isSizeMenuOpen, setIsSizeMenuOpen] = useState(false);
  const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);

  // Search font filter
  const [fontSearch, setFontSearch] = useState("");

  const fontRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (fontRef.current && !fontRef.current.contains(target)) {
        setIsFontMenuOpen(false);
      }
      if (sizeRef.current && !sizeRef.current.contains(target)) {
        setIsSizeMenuOpen(false);
      }
      if (colorRef.current && !colorRef.current.contains(target)) {
        setIsColorMenuOpen(false);
      }
      if (layerRef.current && !layerRef.current.contains(target)) {
        setIsLayerMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handleOutside);
    return () => window.removeEventListener("mousedown", handleOutside);
  }, []);

  const isText =
    type === "TextBox" ||
    type === "TimelineBox" ||
    type === "DressCodeBox" ||
    type === "CeremonyBox" ||
    type === "FamilyInfoBox" ||
    (typeof props.text === "string" && !props.imgKey);

  const isImage = type === "PhotoBox" || (!props.text && !!props.imgKey);

  // Text formatting states
  const isBold = props.fontWeight === "bold" || Number(props.fontWeight) >= 700;
  const isItalic = props.fontStyle === "italic";
  const isUnderline = props.textDecoration === "underline";
  const isStrikethrough = props.textDecoration === "line-through";

  const handleToggleBold = () => {
    onUpdateProps(id, { fontWeight: isBold ? "normal" : "bold" });
  };

  const handleToggleItalic = () => {
    onUpdateProps(id, { fontStyle: isItalic ? "normal" : "italic" });
  };

  const handleToggleUnderline = () => {
    onUpdateProps(id, { textDecoration: isUnderline ? "none" : "underline" });
  };

  const handleToggleStrikethrough = () => {
    onUpdateProps(id, { textDecoration: isStrikethrough ? "none" : "line-through" });
  };

  const handleChangeFontSize = (delta: number) => {
    const current = Number(props.fontSize) || 20;
    const next = Math.max(8, Math.min(160, current + delta));
    onUpdateProps(id, { fontSize: next });
  };

  const handleSetFontSize = (size: number) => {
    onUpdateProps(id, { fontSize: Math.max(8, Math.min(160, size)) });
    setIsSizeMenuOpen(false);
  };

  const handleSetAlign = (align: "left" | "center" | "right" | "justify") => {
    onUpdateProps(id, { textAlign: align });
  };

  const handleCycleAlign = () => {
    const current = props.textAlign || "left";
    const next = current === "left" ? "center" : current === "center" ? "right" : "left";
    onUpdateProps(id, { textAlign: next });
  };

  const currentZ = Number(props.zIndex) || 1;
  const handleLayerChange = (delta: number) => {
    onUpdateProps(id, { zIndex: Math.max(1, currentZ + delta) });
    setIsLayerMenuOpen(false);
  };

  // Preview label for current element
  const elementLabel =
    props.customName ||
    (isText
      ? props.text
        ? `"${props.text.replace(/<[^>]+>/g, "").trim().substring(0, 16)}..."`
        : "Văn bản"
      : isImage
      ? "Ảnh cưới"
      : type);

  // Current font item
  const currentFontItem = QUICK_FONTS.find((f) => f.value === props.fontFamily);
  const currentFontDisplayName =
    currentFontItem?.name ||
    props.fontFamily?.replace("font-", "").replace(/-/g, " ") ||
    "Font chữ";

  // Filtered fonts
  const filteredFonts = QUICK_FONTS.filter((f) =>
    f.label.toLowerCase().includes(fontSearch.toLowerCase())
  );

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="relative bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/90 flex items-center px-2.5 py-1.5 gap-1.5 z-50 select-none max-w-[calc(100vw-16px)] sm:max-w-none overflow-x-auto scrollbar-none touch-pan-x animate-fade-in transition-all text-xs"
    >
      {/* 1. Element Type Badge */}
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-bold shrink-0">
        {isText ? (
          <Type className="w-3.5 h-3.5 text-indigo-600" />
        ) : isImage ? (
          <ImageIcon className="w-3.5 h-3.5 text-rose-500" />
        ) : (
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
        )}
        <span className="truncate max-w-[110px] sm:max-w-[150px]">{elementLabel}</span>
      </div>

      <div className="w-px h-5 bg-gray-200 mx-0.5 shrink-0" />

      {/* 2. TEXT CONTROLS SUITE (MICROSOFT WORD STYLE) */}
      {isText && (
        <>
          {/* A. Font Family Dropdown (Word Combobox Style) */}
          <div className="relative shrink-0" ref={fontRef}>
            <button
              type="button"
              onClick={() => {
                setIsFontMenuOpen(!isFontMenuOpen);
                setIsSizeMenuOpen(false);
                setIsColorMenuOpen(false);
                setIsLayerMenuOpen(false);
              }}
              className={`flex items-center justify-between gap-1.5 px-2.5 py-1 rounded-lg border text-left transition-colors cursor-pointer w-[135px] sm:w-[150px] ${
                isFontMenuOpen
                  ? "bg-indigo-50/50 border-indigo-400 ring-2 ring-indigo-100 text-indigo-900"
                  : "bg-gray-50/80 hover:bg-gray-100/80 border-gray-200 text-gray-800"
              }`}
              title="Phông chữ (Font Family)"
            >
              <span className={`truncate text-xs font-medium ${props.fontFamily || ""}`}>
                {currentFontDisplayName}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
            </button>

            {/* Menu nổi bật hẳn ra bên ngoài ô (Floating Popover Menu) */}
            {isFontMenuOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 p-2 z-[9999] max-h-80 overflow-y-auto scrollbar-thin animate-scale-up">
                <div className="flex items-center gap-1.5 px-2 py-1 mb-1.5 rounded-lg bg-gray-50 border border-gray-200/80">
                  <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Tìm phông chữ..."
                    value={fontSearch}
                    onChange={(e) => setFontSearch(e.target.value)}
                    className="w-full text-xs bg-transparent focus:outline-none placeholder-gray-400"
                    autoFocus
                  />
                </div>

                <div className="text-[10px] font-bold text-gray-400 px-2 py-0.5 uppercase tracking-wider">
                  Phông Chữ Việt Hóa
                </div>

                <div className="space-y-0.5 mt-1">
                  {filteredFonts.map((font) => (
                    <button
                      key={font.value}
                      type="button"
                      onClick={() => {
                        onUpdateProps(id, { fontFamily: font.value });
                        setIsFontMenuOpen(false);
                        setFontSearch("");
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        props.fontFamily === font.value
                          ? "bg-indigo-50 text-indigo-700 font-bold"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <span className={`${font.value} text-sm`}>{font.label}</span>
                      {props.fontFamily === font.value && (
                        <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      )}
                    </button>
                  ))}
                  {filteredFonts.length === 0 && (
                    <div className="p-3 text-center text-xs text-gray-400">
                      Không tìm thấy phông chữ phù hợp
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* B. Font Size Controls (Word Size Box + Dropdown + Grow/Shrink Buttons) */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Cỡ chữ + Nút chọn cỡ nhanh */}
            <div className="relative shrink-0 flex items-center" ref={sizeRef}>
              <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50/80 overflow-hidden">
                <input
                  type="number"
                  value={props.fontSize || 20}
                  onChange={(e) => handleSetFontSize(Number(e.target.value))}
                  className="w-10 py-1 text-center text-xs font-semibold text-gray-800 bg-transparent focus:outline-none"
                  title="Nhập cỡ chữ"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsSizeMenuOpen(!isSizeMenuOpen);
                    setIsFontMenuOpen(false);
                    setIsColorMenuOpen(false);
                    setIsLayerMenuOpen(false);
                  }}
                  className="px-1 py-1 hover:bg-gray-200/70 border-l border-gray-200 text-gray-500 cursor-pointer h-full flex items-center justify-center"
                  title="Danh sách cỡ chữ chuẩn Word"
                >
                  <ChevronDown className="w-2.5 h-2.5" />
                </button>
              </div>

              {/* Menu chọn cỡ chữ chuẩn Word nổi hẳn ra bên ngoài */}
              {isSizeMenuOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-24 bg-white rounded-xl shadow-2xl border border-gray-200 p-1 z-[9999] max-h-60 overflow-y-auto scrollbar-thin animate-scale-up">
                  {STANDARD_FONT_SIZES.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => handleSetFontSize(sz)}
                      className={`w-full text-center py-1 rounded text-xs transition-colors cursor-pointer ${
                        Number(props.fontSize) === sz
                          ? "bg-indigo-50 text-indigo-700 font-bold"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Nút Tăng cỡ chữ (Word Grow Font: A^) */}
            <button
              type="button"
              onClick={() => handleChangeFontSize(2)}
              className="w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer border border-gray-200/60"
              title="Tăng cỡ chữ (Grow Font)"
            >
              <span className="text-[11px] font-bold">A</span>
              <span className="text-[9px] -mt-1 font-bold">▲</span>
            </button>

            {/* Nút Giảm cỡ chữ (Word Shrink Font: Av) */}
            <button
              type="button"
              onClick={() => handleChangeFontSize(-2)}
              className="w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer border border-gray-200/60"
              title="Giảm cỡ chữ (Shrink Font)"
            >
              <span className="text-[11px] font-bold">A</span>
              <span className="text-[9px] mt-1 font-bold">▼</span>
            </button>
          </div>

          <div className="w-px h-5 bg-gray-200 mx-0.5 shrink-0" />

          {/* C. Word Formatting Toggles: B, I, U, S */}
          <div className="flex items-center gap-0.5 shrink-0 bg-gray-50/80 p-0.5 rounded-lg border border-gray-200">
            <button
              type="button"
              onClick={handleToggleBold}
              className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                isBold
                  ? "bg-indigo-100 text-indigo-700 shadow-2xs font-bold border border-indigo-200"
                  : "text-gray-600 hover:bg-gray-200/70 hover:text-gray-900"
              }`}
              title="In đậm (Bold - Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleToggleItalic}
              className={`w-7 h-7 rounded flex items-center justify-center text-xs transition-all cursor-pointer ${
                isItalic
                  ? "bg-indigo-100 text-indigo-700 shadow-2xs font-bold border border-indigo-200"
                  : "text-gray-600 hover:bg-gray-200/70 hover:text-gray-900"
              }`}
              title="In nghiêng (Italic - Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleToggleUnderline}
              className={`w-7 h-7 rounded flex items-center justify-center text-xs transition-all cursor-pointer ${
                isUnderline
                  ? "bg-indigo-100 text-indigo-700 shadow-2xs font-bold border border-indigo-200"
                  : "text-gray-600 hover:bg-gray-200/70 hover:text-gray-900"
              }`}
              title="Gạch chân (Underline - Ctrl+U)"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleToggleStrikethrough}
              className={`w-7 h-7 rounded flex items-center justify-center text-xs transition-all cursor-pointer ${
                isStrikethrough
                  ? "bg-indigo-100 text-indigo-700 shadow-2xs font-bold border border-indigo-200"
                  : "text-gray-600 hover:bg-gray-200/70 hover:text-gray-900"
              }`}
              title="Gạch ngang chữ (Strikethrough)"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* D. Font Color (Word-style Font Color button with color stripe) */}
          <div className="relative shrink-0" ref={colorRef}>
            <button
              type="button"
              onClick={() => {
                setIsColorMenuOpen(!isColorMenuOpen);
                setIsFontMenuOpen(false);
                setIsSizeMenuOpen(false);
                setIsLayerMenuOpen(false);
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                isColorMenuOpen
                  ? "bg-indigo-50/50 border-indigo-400 ring-2 ring-indigo-100"
                  : "bg-gray-50/80 hover:bg-gray-100/80 border-gray-200"
              }`}
              title="Màu chữ (Font Color)"
            >
              <div className="flex flex-col items-center justify-center">
                <span className="text-xs font-black font-serif text-gray-800 leading-none">A</span>
                <span
                  className="w-4 h-1 rounded-full mt-0.5 border border-black/10 shadow-2xs"
                  style={{ backgroundColor: props.color || "#000000" }}
                />
              </div>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {/* Menu chọn màu Word nổi hẳn ra bên ngoài */}
            {isColorMenuOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 p-3 z-[9999] space-y-2.5 animate-scale-up">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Màu Thiệp Cưới Chủ Đạo
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {QUICK_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => {
                        onUpdateProps(id, { color: c.value });
                        setIsColorMenuOpen(false);
                      }}
                      className={`w-7 h-7 rounded-lg border border-gray-200 shadow-2xs hover:scale-110 transition-transform relative cursor-pointer ${
                        props.color === c.value ? "ring-2 ring-indigo-500 ring-offset-1" : ""
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-500 shrink-0">Tùy biến:</span>
                  <input
                    type="color"
                    value={props.color || "#000000"}
                    onChange={(e) => onUpdateProps(id, { color: e.target.value })}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                    title="Chọn màu tự do"
                  />
                  <input
                    type="text"
                    value={props.color || "#000000"}
                    onChange={(e) => onUpdateProps(id, { color: e.target.value })}
                    className="flex-1 text-[11px] font-mono py-0.5 px-2 rounded-lg border border-gray-200 uppercase focus:outline-none focus:border-indigo-500"
                    placeholder="#HEX"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-gray-200 mx-0.5 shrink-0" />

          {/* E. Text Alignment (Word-style separate Left, Center, Right buttons) */}
          <div className="flex items-center gap-0.5 shrink-0 bg-gray-50/80 p-0.5 rounded-lg border border-gray-200">
            <button
              type="button"
              onClick={() => handleSetAlign("left")}
              className={`w-7 h-7 rounded flex items-center justify-center transition-all cursor-pointer ${
                props.textAlign === "left" || !props.textAlign
                  ? "bg-indigo-100 text-indigo-700 shadow-2xs font-bold border border-indigo-200"
                  : "text-gray-600 hover:bg-gray-200/70 hover:text-gray-900"
              }`}
              title="Căn trái (Align Left)"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleSetAlign("center")}
              className={`w-7 h-7 rounded flex items-center justify-center transition-all cursor-pointer ${
                props.textAlign === "center"
                  ? "bg-indigo-100 text-indigo-700 shadow-2xs font-bold border border-indigo-200"
                  : "text-gray-600 hover:bg-gray-200/70 hover:text-gray-900"
              }`}
              title="Căn giữa (Align Center)"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleSetAlign("right")}
              className={`w-7 h-7 rounded flex items-center justify-center transition-all cursor-pointer ${
                props.textAlign === "right"
                  ? "bg-indigo-100 text-indigo-700 shadow-2xs font-bold border border-indigo-200"
                  : "text-gray-600 hover:bg-gray-200/70 hover:text-gray-900"
              }`}
              title="Căn phải (Align Right)"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>

            {/* Gold Foil Shimmer Toggle */}
            <button
              type="button"
              onClick={() => onUpdateProps(id, { goldFoil: !props.goldFoil })}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                props.goldFoil
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-amber-500 shadow-xs font-bold"
                  : "bg-amber-50/80 hover:bg-amber-100/80 text-amber-800 border-amber-300/80"
              }`}
              title="Kỹ xảo Dát vàng ánh kim lấp lánh (Gold Foil Shimmer)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-bold">Dát vàng</span>
            </button>
          </div>
        </>
      )}

      {/* 3. PHOTO CONTROLS (IF IMAGE SELECTED) */}
      {isImage && (
        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenImageDrawer && (
            <button
              type="button"
              onClick={onOpenImageDrawer}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-[#e54153] text-xs font-bold transition-colors cursor-pointer border border-rose-200/60"
              title="Chọn ảnh khác từ thư viện hoặc máy tính"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Đổi ảnh</span>
            </button>
          )}

          {onRemoveBackground && (
            <button
              type="button"
              onClick={onRemoveBackground}
              className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 text-gray-700 text-xs font-semibold transition-colors cursor-pointer border border-gray-200/60"
              title="Tách nền chân dung bằng AI"
            >
              <Scissors className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Tách nền</span>
            </button>
          )}

          {/* Lật ảnh ngang */}
          <button
            type="button"
            onClick={() => onUpdateProps(id, { flipX: !props.flipX })}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer border ${
              props.flipX
                ? "bg-rose-100 text-[#e54153] border-rose-300"
                : "text-gray-600 hover:bg-gray-100 border-gray-200/60"
            }`}
            title="Lật ảnh ngang (Flip Horizontal)"
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="w-px h-5 bg-gray-200 mx-0.5 shrink-0" />

      {/* 4. GENERAL OBJECT ACTIONS: Lock, Layer Z-Index, Duplicate, Delete, Close */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Khóa / Mở khóa vị trí */}
        <button
          type="button"
          onClick={() => onUpdateProps(id, { locked: !isLocked })}
          className={`px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold border ${
            isLocked
              ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200"
              : "hover:bg-gray-100 text-gray-600 hover:text-gray-900 border-gray-200/60"
          }`}
          title={isLocked ? "Đang khóa vị trí (Click để mở khóa)" : "Click để khóa vị trí phần tử"}
        >
          {isLocked ? (
            <>
              <Lock className="w-3 h-3 text-amber-700" />
              <span>Khóa</span>
            </>
          ) : (
            <Unlock className="w-3 h-3" />
          )}
        </button>

        {/* Thứ tự lớp hiển thị (Z-Index) */}
        <div className="relative shrink-0" ref={layerRef}>
          <button
            type="button"
            onClick={() => {
              setIsLayerMenuOpen(!isLayerMenuOpen);
              setIsFontMenuOpen(false);
              setIsSizeMenuOpen(false);
              setIsColorMenuOpen(false);
            }}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer border ${
              isLayerMenuOpen
                ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                : "hover:bg-gray-100 text-gray-600 hover:text-gray-900 border-gray-200/60"
            }`}
            title="Thứ tự lớp hiển thị (Z-Index)"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          {/* Menu nổi hẳn ra ngoài ô */}
          {isLayerMenuOpen && (
            <div className="absolute top-full right-0 mt-1.5 w-44 bg-white rounded-xl shadow-2xl border border-gray-200 p-1.5 z-[9999] text-xs space-y-1 animate-scale-up">
              <button
                type="button"
                onClick={() => handleLayerChange(1)}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-gray-100 flex items-center justify-between text-gray-700 font-medium"
              >
                <span>Nâng lên 1 lớp</span>
                <ArrowUp className="w-3 h-3 text-gray-400" />
              </button>
              <button
                type="button"
                onClick={() => handleLayerChange(-1)}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-gray-100 flex items-center justify-between text-gray-700 font-medium"
              >
                <span>Hạ xuống 1 lớp</span>
                <ArrowDown className="w-3 h-3 text-gray-400" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateProps(id, { zIndex: 99 });
                  setIsLayerMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-gray-100 flex items-center justify-between text-gray-700 font-medium"
              >
                <span>Lên trên cùng</span>
                <Sparkles className="w-3 h-3 text-amber-500" />
              </button>
            </div>
          )}
        </div>

        {/* Nhân bản (Duplicate: Ctrl+D) */}
        <button
          type="button"
          onClick={() => onDuplicate(id)}
          className="w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 flex items-center justify-center transition-colors cursor-pointer border border-gray-200/60"
          title="Nhân bản (Ctrl+D)"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>

        {/* Xóa (Delete) */}
        <button
          type="button"
          onClick={() => onDelete(id)}
          className="w-7 h-7 rounded-lg hover:bg-rose-50 text-gray-500 hover:text-[#e54153] flex items-center justify-center transition-colors cursor-pointer border border-gray-200/60"
          title="Xóa phần tử (Delete)"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {/* Nút đóng / bỏ chọn (Deselect) */}
        {onDeselect && (
          <button
            type="button"
            onClick={onDeselect}
            className="w-6 h-6 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors cursor-pointer ml-0.5"
            title="Đóng thanh công cụ (Bỏ chọn)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
