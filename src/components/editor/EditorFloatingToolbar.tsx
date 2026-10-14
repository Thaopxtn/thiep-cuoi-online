"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  Trash2,
  Layers,
  Lock,
  Unlock,
  Sparkles,
  FlipHorizontal,
  FlipVertical,
  ImageIcon,
  Palette,
  ChevronDown,
  RotateCcw,
  CornerUpLeft,
  CornerUpRight,
  ShieldCheck,
  Check,
  Wand2,
} from "lucide-react";

export interface FloatingToolbarProps {
  selectedElement: {
    id: string;
    type: string;
    props: Record<string, any>;
  };
  canvasWidth: number;
  onUpdateProps: (id: string, updatedProps: Record<string, any>) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenImageDrawer?: () => void;
  onRemoveBackground?: () => void;
  onOpenManualCutout?: () => void;
}

// Bảng màu thiết kế thiệp cưới kinh điển (Wedding Luxury Palettes)
const QUICK_COLORS = [
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

// Danh sách Font chữ Việt hóa nổi bật
const QUICK_FONTS = [
  { label: "Charmonman (Chữ ký hoàng gia)", value: "font-charmonman" },
  { label: "Charm (Thư pháp thanh lịch)", value: "font-charm" },
  { label: "Dancing Script (Thư pháp trẻ trung)", value: "font-dancing-script" },
  { label: "Great Vibes (Thư pháp uốn lượn)", value: "font-great-vibes" },
  { label: "Alex Brush (Chữ ký thanh thoát)", value: "font-alex-brush" },
  { label: "Playfair Display (Cổ điển sang trọng)", value: "font-playfair" },
  { label: "Lora (Serif tinh tế chuẩn mực)", value: "font-lora" },
  { label: "Cormorant Garamond (Đẳng cấp châu Âu)", value: "font-cormorant" },
  { label: "Cinzel (Hoàng gia La Mã)", value: "font-cinzel" },
  { label: "Be Vietnam Pro (Chuẩn quốc dân)", value: "font-vietnam" },
  { label: "Montserrat (Hình khối hiện đại)", value: "font-montserrat" },
  { label: "Plus Jakarta Sans (Mượt mà thời thượng)", value: "font-jakarta" },
];

export default function EditorFloatingToolbar({
  selectedElement,
  canvasWidth,
  onUpdateProps,
  onDuplicate,
  onDelete,
  onOpenImageDrawer,
  onRemoveBackground,
  onOpenManualCutout,
}: FloatingToolbarProps) {
  const { id, type, props } = selectedElement;
  const isLocked = Boolean(props.locked);

  const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);
  const [isFontMenuOpen, setIsFontMenuOpen] = useState(false);
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);

  const colorRef = useRef<HTMLDivElement>(null);
  const fontRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) {
        setIsColorMenuOpen(false);
      }
      if (fontRef.current && !fontRef.current.contains(e.target as Node)) {
        setIsFontMenuOpen(false);
      }
      if (layerRef.current && !layerRef.current.contains(e.target as Node)) {
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
    type === "BankCardBox";

  const isPhoto = type === "PhotoBox";
  const isShape = type === "GeometricBox";

  // Center horizontally inside canvas
  const handleCenterHorizontal = () => {
    const elWidth = Number(props.width) || 100;
    const newLeft = Math.round((canvasWidth - elWidth) / 2);
    onUpdateProps(id, { left: newLeft });
  };

  // Toggle bold
  const handleToggleBold = () => {
    const isBold = props.fontWeight === "bold" || props.fontWeight === 700;
    onUpdateProps(id, { fontWeight: isBold ? "normal" : "bold" });
  };

  // Toggle italic
  const handleToggleItalic = () => {
    const isItalic = props.fontStyle === "italic";
    onUpdateProps(id, { fontStyle: isItalic ? "normal" : "italic" });
  };

  // Change font size by delta
  const handleChangeFontSize = (delta: number) => {
    const current = Number(props.fontSize) || 20;
    const next = Math.max(10, Math.min(120, current + delta));
    onUpdateProps(id, { fontSize: next });
  };

  // Cycle text align
  const handleCycleAlign = () => {
    const current = props.textAlign || "left";
    const next = current === "left" ? "center" : current === "center" ? "right" : "left";
    onUpdateProps(id, { textAlign: next });
  };

  // Layer adjustments
  const currentZ = Number(props.zIndex) || 1;
  const handleLayerChange = (delta: number) => {
    onUpdateProps(id, { zIndex: Math.max(1, currentZ + delta) });
    setIsLayerMenuOpen(false);
  };

  return (
    <div
      className="absolute -top-12 left-1/2 pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/90 flex items-center px-2 py-1 gap-1 z-50 animate-fade-in select-none"
      style={{
        transform: `translate(-50%, 0) rotate(${-(props.rotation || 0)}deg)`,
        transformOrigin: "center center",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. NẾU LÀ TEXT: BỘ CÔNG CỤ SOẠN THẢO CHỮ CANVA */}
      {isText && (
        <>
          {/* Font Family Quick Dropdown */}
          <div className="relative" ref={fontRef}>
            <button
              type="button"
              onClick={() => setIsFontMenuOpen(!isFontMenuOpen)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 text-gray-800 text-[11px] font-semibold transition-colors cursor-pointer max-w-[130px] truncate"
              title="Chọn font chữ thiết kế"
            >
              <span className="truncate">
                {QUICK_FONTS.find((f) => f.value === props.fontFamily)?.label.split(" (")[0] ||
                  props.fontFamily?.replace("font-", "") ||
                  "Font chữ"}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
            </button>

            {isFontMenuOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 p-1.5 z-[100] max-h-64 overflow-y-auto scrollbar-thin animate-scale-up">
                <div className="text-[10px] font-bold text-gray-400 px-2 py-1 uppercase tracking-wider">
                  Font Việt Hóa Thiệp Cưới
                </div>
                {QUICK_FONTS.map((font) => (
                  <button
                    key={font.value}
                    type="button"
                    onClick={() => {
                      onUpdateProps(id, { fontFamily: font.value });
                      setIsFontMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      props.fontFamily === font.value
                        ? "bg-rose-50 text-[#e54153] font-bold"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span className={font.value}>{font.label}</span>
                    {props.fontFamily === font.value && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-4 bg-gray-200 mx-0.5" />

          {/* Font Size [-] [size] [+] */}
          <div className="flex items-center gap-0.5 bg-gray-50 rounded-lg p-0.5 border border-gray-200/60">
            <button
              type="button"
              onClick={() => handleChangeFontSize(-2)}
              className="w-5 h-5 rounded hover:bg-white text-gray-600 hover:text-gray-900 text-xs font-bold flex items-center justify-center transition-colors cursor-pointer"
              title="Giảm cỡ chữ"
            >
              −
            </button>
            <span className="w-6 text-center text-[11px] font-mono font-bold text-gray-800">
              {props.fontSize || 20}
            </span>
            <button
              type="button"
              onClick={() => handleChangeFontSize(2)}
              className="w-5 h-5 rounded hover:bg-white text-gray-600 hover:text-gray-900 text-xs font-bold flex items-center justify-center transition-colors cursor-pointer"
              title="Tăng cỡ chữ"
            >
              +
            </button>
          </div>

          <div className="w-px h-4 bg-gray-200 mx-0.5" />

          {/* Quick Color Picker */}
          <div className="relative" ref={colorRef}>
            <button
              type="button"
              onClick={() => setIsColorMenuOpen(!isColorMenuOpen)}
              className="p-1 rounded-lg hover:bg-gray-100 flex items-center gap-1 transition-colors cursor-pointer"
              title="Đổi màu chữ"
            >
              <div
                className="w-4 h-4 rounded-md border border-gray-300 shadow-2xs"
                style={{ backgroundColor: props.color || "#1c171a" }}
              />
              <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
            </button>

            {isColorMenuOpen && (
              <div className="absolute top-full left-0 mt-1.5 p-2.5 bg-white rounded-2xl shadow-2xl border border-gray-200 grid grid-cols-5 gap-1.5 z-[100] w-48 animate-scale-up">
                {QUICK_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => {
                      onUpdateProps(id, { color: c.value });
                      setIsColorMenuOpen(false);
                    }}
                    className="w-7 h-7 rounded-xl border border-black/10 flex items-center justify-center transition-transform hover:scale-115 active:scale-95 shadow-2xs cursor-pointer relative"
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  >
                    {props.color === c.value && (
                      <Check
                        className={`w-3.5 h-3.5 stroke-[3] ${
                          c.value === "#ffffff" ? "text-gray-900" : "text-white"
                        }`}
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bold, Italic, Alignment */}
          <button
            type="button"
            onClick={handleToggleBold}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              props.fontWeight === "bold" || props.fontWeight === 700
                ? "bg-rose-50 text-[#e54153]"
                : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
            }`}
            title="In đậm (Bold)"
          >
            <Bold className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={handleToggleItalic}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              props.fontStyle === "italic"
                ? "bg-rose-50 text-[#e54153]"
                : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
            }`}
            title="In nghiêng (Italic)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleCycleAlign}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            title={`Căn lề: ${props.textAlign || "left"}`}
          >
            {props.textAlign === "center" ? (
              <AlignCenter className="w-3.5 h-3.5" />
            ) : props.textAlign === "right" ? (
              <AlignRight className="w-3.5 h-3.5" />
            ) : (
              <AlignLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </>
      )}

      {/* 2. NẾU LÀ ẢNH (PHOTOBOX): CÔNG CỤ ẢNH CỦA CANVA */}
      {isPhoto && (
        <>
          {/* Nút thay ảnh nhanh */}
          <button
            type="button"
            onClick={onOpenImageDrawer}
            className="px-2 py-1 rounded-lg hover:bg-gray-100 text-gray-700 hover:text-[#e54153] text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            title="Thay ảnh này từ máy tính hoặc thư viện"
          >
            <ImageIcon className="w-3.5 h-3.5 text-[#e54153]" />
            <span>Thay ảnh</span>
          </button>

          <div className="w-px h-4 bg-gray-200 mx-0.5" />

          {/* Nút Tách nền AI */}
          <button
            type="button"
            onClick={onRemoveBackground}
            className="px-2 py-1 rounded-lg bg-gradient-to-r from-amber-50 to-rose-50 hover:from-amber-100 hover:to-rose-100 text-amber-800 text-[11px] font-bold flex items-center gap-1 border border-amber-200/60 shadow-2xs transition-all cursor-pointer"
            title="Tách phông nền nhân vật ảnh cưới tự động bằng AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-400" />
            <span>Xóa nền AI</span>
          </button>

          {/* Lật ngang Flip X */}
          <button
            type="button"
            onClick={() => onUpdateProps(id, { flipX: !props.flipX })}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              props.flipX
                ? "bg-rose-50 text-[#e54153]"
                : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
            }`}
            title="Lật ảnh đối xứng ngang (Flip Horizontal)"
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
          </button>

          {/* Bo góc nhanh (0px -> 16px -> 50%) */}
          <button
            type="button"
            onClick={() => {
              const currentRadius = props.borderRadius ? props.borderRadius[0] : 0;
              let nextRadius = [0, 0, 0, 0];
              if (currentRadius === 0) nextRadius = [16, 16, 16, 16];
              else if (currentRadius === 16) nextRadius = [999, 999, 999, 999];
              else nextRadius = [0, 0, 0, 0];
              onUpdateProps(id, { borderRadius: nextRadius });
            }}
            className="px-1.5 py-1 rounded-lg hover:bg-gray-100 text-gray-600 text-[10px] font-semibold transition-colors cursor-pointer"
            title="Bo góc khung ảnh (Vuông / Bo viền / Tròn xoe)"
          >
            Bo góc
          </button>
        </>
      )}

      {/* 3. NẾU LÀ SHAPE (GEOMETRICBOX): CÔNG CỤ HÌNH KHỐI */}
      {isShape && (
        <>
          <div className="relative" ref={colorRef}>
            <button
              type="button"
              onClick={() => setIsColorMenuOpen(!isColorMenuOpen)}
              className="p-1 rounded-lg hover:bg-gray-100 flex items-center gap-1 transition-colors cursor-pointer"
              title="Đổi màu hình khối"
            >
              <div
                className="w-4 h-4 rounded-md border border-gray-300 shadow-2xs"
                style={{ backgroundColor: props.fill || props.backgroundColor || "#ffffff" }}
              />
              <span className="text-[11px] font-semibold text-gray-700">Màu nền</span>
            </button>

            {isColorMenuOpen && (
              <div className="absolute top-full left-0 mt-1.5 p-2.5 bg-white rounded-2xl shadow-2xl border border-gray-200 grid grid-cols-5 gap-1.5 z-[100] w-48 animate-scale-up">
                {QUICK_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => {
                      onUpdateProps(id, { fill: c.value, backgroundColor: c.value });
                      setIsColorMenuOpen(false);
                    }}
                    className="w-7 h-7 rounded-xl border border-black/10 flex items-center justify-center transition-transform hover:scale-115 active:scale-95 shadow-2xs cursor-pointer relative"
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  >
                    {(props.fill === c.value || props.backgroundColor === c.value) && (
                      <Check
                        className={`w-3.5 h-3.5 stroke-[3] ${
                          c.value === "#ffffff" ? "text-gray-900" : "text-white"
                        }`}
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ================= CÁC CÔNG CỤ CHUNG (ALIGN, LAYER, DUPLICATE, LOCK, DELETE) ================= */}
      <div className="w-px h-4 bg-gray-200 mx-0.5" />

      {/* Căn giữa thiệp (Center in Card) */}
      <button
        type="button"
        onClick={handleCenterHorizontal}
        className="px-2 py-1 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 text-[11px] font-semibold transition-colors cursor-pointer"
        title="Căn giữa thiệp theo chiều ngang"
      >
        Căn giữa
      </button>

      {/* Dropdown quản lý Lớp (Layers) */}
      <div className="relative" ref={layerRef}>
        <button
          type="button"
          onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          title={`Lớp hiển thị (z-index: ${currentZ})`}
        >
          <Layers className="w-3.5 h-3.5" />
        </button>

        {isLayerMenuOpen && (
          <div className="absolute top-full right-0 mt-1.5 w-40 bg-white rounded-2xl shadow-2xl border border-gray-200 p-1.5 z-[100] animate-scale-up flex flex-col gap-0.5 text-xs">
            <button
              type="button"
              onClick={() => handleLayerChange(1)}
              className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-gray-100 text-gray-700 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Lên 1 lớp</span>
              <span className="text-[10px] text-gray-400">Ctrl+]</span>
            </button>
            <button
              type="button"
              onClick={() => handleLayerChange(10)}
              className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-gray-100 text-gray-700 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Lên trên cùng</span>
              <span className="text-[10px] text-gray-400">Top</span>
            </button>
            <div className="h-px bg-gray-100 my-0.5" />
            <button
              type="button"
              onClick={() => handleLayerChange(-1)}
              className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-gray-100 text-gray-700 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Xuống 1 lớp</span>
              <span className="text-[10px] text-gray-400">Ctrl+[</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdateProps(id, { zIndex: 1 })}
              className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-gray-100 text-gray-700 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Về đáy thiệp</span>
              <span className="text-[10px] text-gray-400">Bottom</span>
            </button>
          </div>
        )}
      </div>

      {/* Khóa / Mở khóa vị trí (Lock / Unlock) */}
      <button
        type="button"
        onClick={() => onUpdateProps(id, { locked: !isLocked })}
        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
          isLocked
            ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
            : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
        }`}
        title={isLocked ? "Mở khóa phần tử (Ctrl+L)" : "Khóa cố định vị trí (Ctrl+L)"}
      >
        {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
      </button>

      {/* Nhân bản (Duplicate) */}
      <button
        type="button"
        onClick={() => onDuplicate(id)}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
        title="Nhân bản phần tử (Ctrl+D)"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>

      {/* Xóa (Delete) */}
      <button
        type="button"
        onClick={() => onDelete(id)}
        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-[#e54153] transition-colors cursor-pointer"
        title="Xóa phần tử (Delete)"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
