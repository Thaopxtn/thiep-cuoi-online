"use client";

import React, { useState, useRef } from "react";
import {
  Settings,
  Sparkles,
  ChevronDown,
  ChevronRight,
  RotateCw,
  Crop,
  Wand2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  FlipHorizontal,
  FlipVertical,
  Layers,
  Sliders,
  Bold,
  Italic,
  Loader2,
  Calendar as CalendarIcon,
  MapPin,
  Gift,
  Clock,
  Image as ImageIcon,
  Plus,
  Trash2,
  Send,
  Check,
  ExternalLink,
} from "lucide-react";
import { compressImageToWebP } from "@/lib/imageCompression";

export interface SelectedElementData {
  id: string;
  type: "PhotoBox" | "TextBox" | "Container" | "Widget" | string;
  props: Record<string, any>;
}

interface EditorRightInspectorProps {
  selectedElement: SelectedElementData | null;
  onUpdateProps: (elementId: string, updatedProps: Record<string, any>) => void;
  onReplaceImage?: () => void;
  onRemoveBackground?: () => void;
}

export default function EditorRightInspector({
  selectedElement,
  onUpdateProps,
  onReplaceImage,
  onRemoveBackground,
}: EditorRightInspectorProps) {
  const [activeTab, setActiveTab] = useState<"settings" | "effects">("settings");
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    image: true,
    filters: true,
    flip: false,
    clickAction: false,
    padding: false,
    border: false,
    shadow: false,
    advanced: false,
    text: true,
    widget: true,
  });

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const carouselFileInputRef = useRef<HTMLInputElement>(null);
  const [isReplacingImage, setIsReplacingImage] = useState(false);
  const [isUploadingCarousel, setIsUploadingCarousel] = useState(false);

  const handleTriggerFilePicker = () => {
    if (replaceFileInputRef.current) {
      replaceFileInputRef.current.value = "";
      replaceFileInputRef.current.click();
    }
  };

  const handleFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedElement) return;

    try {
      setIsReplacingImage(true);
      const compressed = await compressImageToWebP(file, { maxDimension: 1600, quality: 0.82 });
      const formData = new FormData();
      formData.append("file", compressed.file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      let uploadedUrl = compressed.dataUrl;
      if (res.ok) {
        const json = await res.json();
        if (json.url) uploadedUrl = json.url;
      }

      onUpdateProps(selectedElement.id, { imgKey: uploadedUrl, src: uploadedUrl });
    } catch (err) {
      console.error("Lỗi thay ảnh:", err);
      const localUrl = URL.createObjectURL(file);
      onUpdateProps(selectedElement.id, { imgKey: localUrl, src: localUrl });
    } finally {
      setIsReplacingImage(false);
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = "";
    }
  };

  const handleAddCarouselImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedElement) return;

    try {
      setIsUploadingCarousel(true);
      const compressed = await compressImageToWebP(file, { maxDimension: 1600, quality: 0.82 });
      const currentList = Array.isArray(selectedElement.props.imgList) ? [...selectedElement.props.imgList] : [];
      currentList.push({
        imageKey: compressed.dataUrl,
        src: compressed.dataUrl,
        caption: "Khoảnh khắc cưới",
      });
      onUpdateProps(selectedElement.id, { imgList: currentList });
    } catch (err) {
      console.error("Lỗi thêm ảnh album:", err);
    } finally {
      setIsUploadingCarousel(false);
      if (carouselFileInputRef.current) carouselFileInputRef.current.value = "";
    }
  };

  const handleRemoveCarouselImage = (index: number) => {
    if (!selectedElement) return;
    const currentList = Array.isArray(selectedElement.props.imgList) ? [...selectedElement.props.imgList] : [];
    currentList.splice(index, 1);
    onUpdateProps(selectedElement.id, { imgList: currentList });
  };

  if (!selectedElement) {
    return (
      <aside className="w-[300px] sm:w-[320px] bg-white border-l border-gray-200 h-full flex flex-col z-30 select-none shrink-0 shadow-xs p-5 text-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-3">
          <Settings className="w-6 h-6" />
        </div>
        <h4 className="text-xs font-bold text-gray-800">Chưa chọn phần tử nào</h4>
        <p className="text-[11px] text-gray-500 mt-1 max-w-[200px] mx-auto leading-relaxed">
          Nhấn vào bất kỳ ảnh, chữ, khối hình hoặc tiện ích trên thiệp để tùy chỉnh chi tiết.
        </p>
      </aside>
    );
  }

  const { id, type, props } = selectedElement;
  const isImage = type === "PhotoBox" || !!props.imgKey;
  const isText = type === "TextBox" || typeof props.text === "string";
  const isShape = type === "GeometricBox" || type === "LineBox";
  const isCountdown = type === "CountdownBoxV2" || type === "CountdownBox";
  const isCalendar = type === "CalendarBoxV2" || type === "CalendarBox";
  const isMap = type === "MapBox";
  const isGift = type === "GiftQrBox";
  const isRsvp = type === "RsvpBoxV2" || type === "RsvpBox";
  const isCarousel = type === "CarouselBox";

  const toHexColor = (colorStr?: string): string => {
    if (!colorStr) return "#1c171a";
    if (colorStr.startsWith("#")) return colorStr.substring(0, 7);
    const rgbaMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (rgbaMatch) {
      const r = parseInt(rgbaMatch[1]).toString(16).padStart(2, "0");
      const g = parseInt(rgbaMatch[2]).toString(16).padStart(2, "0");
      const b = parseInt(rgbaMatch[3]).toString(16).padStart(2, "0");
      return `#${r}${g}${b}`;
    }
    return "#1c171a";
  };

  const handlePropChange = (key: string, value: any) => {
    onUpdateProps(id, { [key]: value });
  };

  const getFullImageUrl = (key: string) => {
    if (!key) return "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=400";
    if (key.startsWith("http") || key.startsWith("blob:")) return key;
    return `https://cdn-resource.zenlove.me/${key.replace(/^\//, "")}`;
  };

  return (
    <aside className="w-[300px] sm:w-[320px] bg-white border-l border-gray-200 h-full flex flex-col z-30 select-none shrink-0 shadow-xs">
      {/* Top Tabs: Cài đặt | Hiệu ứng */}
      <div className="flex border-b border-gray-200 bg-gray-50/50 p-1 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "settings"
              ? "bg-white text-gray-900 shadow-2xs"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <Settings className="w-3.5 h-3.5 text-gray-600" />
          <span>Cài đặt</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("effects")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "effects"
              ? "bg-white text-gray-900 shadow-2xs"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Hiệu ứng</span>
        </button>
      </div>

      {/* Inspector Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ================= TAB: CÀI ĐẶT (SETTINGS) ================= */}
        {activeTab === "settings" && (
          <div className="space-y-4">
            {/* 1. PHOTO INSPECTOR */}
            {isImage && (
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                  <span>Hình ảnh</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shrink-0 shadow-2xs group">
                      <img
                        src={getFullImageUrl(props.imgKey || props.src)}
                        alt="Selected Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=400";
                        }}
                      />
                      <div
                        onClick={handleTriggerFilePicker}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white text-[10px] font-bold"
                      >
                        Đổi ảnh
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <button
                        type="button"
                        onClick={handleTriggerFilePicker}
                        disabled={isReplacingImage}
                        className="w-full py-2 px-3 bg-zen-primary hover:bg-[#d93849] active:scale-98 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        {isReplacingImage ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RotateCw className="w-3.5 h-3.5" />
                        )}
                        <span>{isReplacingImage ? "Đang xử lý..." : "Đổi ảnh"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={onRemoveBackground}
                        className="w-full py-1.5 px-3 border border-purple-200 bg-purple-50/60 hover:bg-purple-100/60 text-purple-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Wand2 className="w-3.5 h-3.5 text-purple-600" />
                        <span>Xóa phông AI</span>
                      </button>
                    </div>
                  </div>

                  <input
                    ref={replaceFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFilePicked}
                    className="hidden"
                  />

                  {/* Filter presets */}
                  <div className="pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => toggleAccordion("filters")}
                      className="w-full py-1.5 text-xs font-semibold text-gray-800 flex items-center justify-between hover:text-gray-900"
                    >
                      <span className="flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-gray-500" />
                        <span>Bộ lọc & Màu ảnh</span>
                      </span>
                      {openAccordions["filters"] ? (
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </button>

                    {openAccordions["filters"] && (
                      <div className="space-y-3 pt-2">
                        <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                          {[
                            { id: "none", name: "Gốc", filter: "none" },
                            { id: "warm", name: "Ấm áp", filter: "sepia(0.25) contrast(1.05) saturate(1.15)" },
                            { id: "romance", name: "Lãng mạn", filter: "brightness(1.05) contrast(0.95) saturate(1.1) hue-rotate(-5deg)" },
                            { id: "cinema", name: "Điện ảnh", filter: "contrast(1.2) saturate(0.85)" },
                            { id: "bw", name: "Đen trắng", filter: "grayscale(1) contrast(1.15)" },
                            { id: "vintage", name: "Cổ điển", filter: "sepia(0.4) contrast(0.9) brightness(0.95)" },
                          ].map((f) => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => handlePropChange("filterStyle", f.filter)}
                              className={`py-1.5 rounded-lg border text-center transition-all ${
                                (props.filterStyle || "none") === f.filter
                                  ? "border-zen-primary bg-rose-50/50 text-zen-primary font-bold shadow-2xs"
                                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              {f.name}
                            </button>
                          ))}
                        </div>

                        {/* Sliders */}
                        <div className="space-y-2 pt-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Độ sáng:</span>
                            <span className="font-mono text-gray-500">{props.brightness ?? 100}%</span>
                          </div>
                          <input
                            type="range"
                            min="50"
                            max="150"
                            value={props.brightness ?? 100}
                            onChange={(e) => {
                              const b = parseInt(e.target.value);
                              handlePropChange("brightness", b);
                              handlePropChange("filterStyle", `brightness(${b / 100}) contrast(${(props.contrast ?? 100) / 100})`);
                            }}
                            className="w-full accent-zen-primary"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Lật ảnh */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">Lật ảnh:</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handlePropChange("flipX", !props.flipX)}
                        className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 ${
                          props.flipX ? "bg-rose-50 border-zen-primary text-zen-primary" : "border-gray-200 text-gray-600"
                        }`}
                        title="Lật ngang"
                      >
                        <FlipHorizontal className="w-3.5 h-3.5" />
                        <span>Ngang</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePropChange("flipY", !props.flipY)}
                        className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 ${
                          props.flipY ? "bg-rose-50 border-zen-primary text-zen-primary" : "border-gray-200 text-gray-600"
                        }`}
                        title="Lật dọc"
                      >
                        <FlipVertical className="w-3.5 h-3.5" />
                        <span>Dọc</span>
                      </button>
                    </div>
                  </div>

                  {/* Bo góc ảnh */}
                  <div className="pt-2 border-t border-gray-100 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700">Bo góc (px):</span>
                      <span className="font-mono text-gray-500">
                        {Array.isArray(props.borderRadius) ? props.borderRadius[0] : (props.borderRadius || 0)}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Array.isArray(props.borderRadius) ? props.borderRadius[0] : (props.borderRadius || 0)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        handlePropChange("borderRadius", [val, val, val, val]);
                      }}
                      className="w-full accent-zen-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. TEXT INSPECTOR */}
            {isText && !isImage && (
              <div className="space-y-4">
                <div className="flex items-center gap-1 text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                  <span>Văn bản</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-700">Nội dung chữ:</label>
                  <textarea
                    value={props.text || ""}
                    onChange={(e) => handlePropChange("text", e.target.value)}
                    rows={3}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary font-sans"
                  />
                </div>

                {/* Font family */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-700">Font chữ thiết kế:</label>
                  <select
                    value={props.fontFamily || "font-playfair"}
                    onChange={(e) => handlePropChange("fontFamily", e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white font-medium"
                  >
                    <optgroup label="Thư Pháp & Chữ Viết Tay">
                      <option value="font-great-vibes">Great Vibes (Thư pháp hoàng gia)</option>
                      <option value="font-alex-brush">Alex Brush (Chữ ký thanh thoát)</option>
                      <option value="font-parisienne">Parisienne (Quý phái lãng mạn)</option>
                      <option value="font-allura">Allura (Mềm mại uyển chuyển)</option>
                      <option value="font-ephesis">Ephesis (Bay bổng nghệ thuật)</option>
                      <option value="font-dancing-script">Dancing Script (Thư pháp trẻ trung)</option>
                      <option value="font-pinyon">Pinyon Script (Cổ điển quý tộc)</option>
                      <option value="font-sacramento">Sacramento (Nét thanh tao)</option>
                    </optgroup>
                    <optgroup label="Serif Sang Trọng & Hoàng Gia">
                      <option value="font-playfair">Playfair Display (Cổ điển sang trọng)</option>
                      <option value="font-cormorant">Cormorant Garamond (Đẳng cấp châu Âu)</option>
                      <option value="font-cinzel">Cinzel (Hoàng gia La Mã)</option>
                      <option value="font-prata">Prata (Thời trang thanh lịch)</option>
                    </optgroup>
                    <optgroup label="Hiện Đại & Tinh Gọn">
                      <option value="font-vietnam">Be Vietnam Pro (Chuẩn quốc dân)</option>
                      <option value="font-montserrat">Montserrat (Hình khối hiện đại)</option>
                      <option value="font-jakarta">Plus Jakarta Sans (Mượt mà thời thượng)</option>
                      <option value="font-sans">Inter (Giao diện tiêu chuẩn)</option>
                    </optgroup>
                  </select>
                </div>

                {/* Font size */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700">Cỡ chữ (px):</span>
                    <span className="font-mono text-gray-500">{props.fontSize || 24}px</span>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="80"
                    value={props.fontSize || 24}
                    onChange={(e) => handlePropChange("fontSize", parseInt(e.target.value))}
                    className="w-full accent-zen-primary"
                  />
                </div>

                {/* Color picker */}
                <div className="space-y-2 pt-1 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">Màu chữ:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={toHexColor(props.color)}
                        onChange={(e) => handlePropChange("color", e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0"
                      />
                      <span className="text-xs font-mono text-gray-500 uppercase">
                        {props.color || "#1c171a"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { label: "Đỏ đô hoàng gia", color: "#511419" },
                      { label: "Đen than trang trọng", color: "#1c171a" },
                      { label: "Nâu đất đậm", color: "#451a03" },
                      { label: "Vàng đồng ánh kim", color: "#b45309" },
                      { label: "Trắng nổi bật", color: "#ffffff" },
                      { label: "Hồng đất lãng mạn", color: "#9f1239" },
                    ].map((swatch) => (
                      <button
                        key={swatch.color}
                        type="button"
                        onClick={() => handlePropChange("color", swatch.color)}
                        className="w-6 h-6 rounded-full border border-gray-300 shadow-2xs hover:scale-110 active:scale-95 transition-transform"
                        style={{ backgroundColor: swatch.color }}
                        title={swatch.label}
                      />
                    ))}
                  </div>

                  {/* Anti-submerge Text Shadow */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">Đổ bóng chống chìm chữ:</span>
                    <input
                      type="checkbox"
                      checked={!!props.hasTextShadow}
                      onChange={(e) => {
                        handlePropChange("hasTextShadow", e.target.checked);
                        if (e.target.checked && !props.textShadow) {
                          handlePropChange("textShadow", { offsetX: 0, offsetY: 1, blur: 4, color: "rgba(0,0,0,0.6)" });
                        }
                      }}
                      className="accent-zen-primary"
                    />
                  </div>
                </div>

                {/* Alignment */}
                <div className="flex items-center gap-1 border border-gray-200 rounded-xl p-1 bg-gray-50 justify-around">
                  <button
                    type="button"
                    onClick={() => handlePropChange("fontWeight", props.fontWeight === "bold" ? "normal" : "bold")}
                    className={`p-1.5 rounded-lg ${props.fontWeight === "bold" ? "bg-white text-zen-primary font-bold shadow-2xs" : "text-gray-600"}`}
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePropChange("fontStyle", props.fontStyle === "italic" ? "normal" : "italic")}
                    className={`p-1.5 rounded-lg ${props.fontStyle === "italic" ? "bg-white text-zen-primary shadow-2xs" : "text-gray-600"}`}
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePropChange("textAlign", "left")}
                    className={`p-1.5 rounded-lg ${props.textAlign === "left" ? "bg-white text-zen-primary shadow-2xs" : "text-gray-600"}`}
                  >
                    <AlignLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePropChange("textAlign", "center")}
                    className={`p-1.5 rounded-lg ${props.textAlign === "center" ? "bg-white text-zen-primary shadow-2xs" : "text-gray-600"}`}
                  >
                    <AlignCenter className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePropChange("textAlign", "right")}
                    className={`p-1.5 rounded-lg ${props.textAlign === "right" ? "bg-white text-zen-primary shadow-2xs" : "text-gray-600"}`}
                  >
                    <AlignRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* 3. SHAPE & GEOMETRIC INSPECTOR */}
            {isShape && (
              <div className="space-y-4">
                <div className="flex items-center gap-1 text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                  <span>Khối hình học / Hộp nền</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700">Màu nền:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={toHexColor(props.fill || props.backgroundColor)}
                        onChange={(e) => handlePropChange("fill", e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0"
                      />
                      <span className="text-xs font-mono text-gray-500 uppercase">
                        {props.fill || props.backgroundColor || "Trong suốt"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {[
                      { label: "Đỏ đô hoàng gia", color: "rgba(81, 20, 25, 1.00)" },
                      { label: "Trắng tinh", color: "#ffffff" },
                      { label: "Kem vintage", color: "#faf7f2" },
                      { label: "Đen than", color: "#1c171a" },
                      { label: "Vàng đồng", color: "#b45309" },
                    ].map((swatch) => (
                      <button
                        key={swatch.color}
                        type="button"
                        onClick={() => handlePropChange("fill", swatch.color)}
                        className="w-6 h-6 rounded-full border border-gray-300 shadow-2xs hover:scale-110 active:scale-95 transition-transform"
                        style={{ backgroundColor: swatch.color }}
                        title={swatch.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Opacity slider */}
                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700">Độ mờ (Opacity):</span>
                    <span className="font-mono text-gray-600">
                      {typeof props.opacity === "number" ? props.opacity.toFixed(2) : "1.00"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={props.opacity ?? 1}
                    onChange={(e) => handlePropChange("opacity", parseFloat(e.target.value))}
                    className="w-full accent-zen-primary"
                  />
                </div>

                {/* Border Radius */}
                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700">Bo góc (px):</span>
                    <span className="font-mono text-gray-600">
                      {Array.isArray(props.borderRadius) ? props.borderRadius[0] : (props.borderRadius || 0)}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={Array.isArray(props.borderRadius) ? props.borderRadius[0] : (props.borderRadius || 0)}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      handlePropChange("borderRadius", [val, val, val, val]);
                    }}
                    className="w-full accent-zen-primary"
                  />
                </div>
              </div>
            )}

            {/* 4. COUNTDOWN BOX INSPECTOR */}
            {isCountdown && (
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
                  <Clock className="w-4 h-4 text-zen-primary" />
                  <span>Đồng hồ đếm ngược ngày cưới</span>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-gray-700">Ngày làm lễ:</label>
                  <input
                    type="date"
                    value={props.targetDate || "2026-11-18"}
                    onChange={(e) => handlePropChange("targetDate", e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-gray-700">Giờ làm lễ:</label>
                  <input
                    type="time"
                    value={props.targetTime || "11:00"}
                    onChange={(e) => handlePropChange("targetTime", e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-gray-700">Tiêu đề:</label>
                  <input
                    type="text"
                    value={props.titleText || "CÙNG ĐẾM NGƯỢC THỜI GIAN"}
                    onChange={(e) => handlePropChange("titleText", e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white"
                  />
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">Màu chữ đếm ngược:</span>
                  <input
                    type="color"
                    value={toHexColor(props.textColor || "#511419")}
                    onChange={(e) => handlePropChange("textColor", e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0"
                  />
                </div>
              </div>
            )}

            {/* 5. CALENDAR BOX INSPECTOR */}
            {isCalendar && (
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
                  <CalendarIcon className="w-4 h-4 text-zen-primary" />
                  <span>Lịch tháng đám cưới</span>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-gray-700">Ngày diễn ra tiệc:</label>
                  <input
                    type="date"
                    value={props.selectedDate || "2026-11-18"}
                    onChange={(e) => handlePropChange("selectedDate", e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white"
                  />
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">Màu điểm nhấn (Trái tim):</span>
                  <input
                    type="color"
                    value={toHexColor(props.themeColor || "#511419")}
                    onChange={(e) => handlePropChange("themeColor", e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0"
                  />
                </div>
              </div>
            )}

            {/* 6. MAP BOX INSPECTOR */}
            {isMap && (
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
                  <MapPin className="w-4 h-4 text-zen-primary" />
                  <span>Bản đồ & Địa điểm cưới</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-700">Tên địa điểm:</label>
                  <input
                    type="text"
                    value={props.title || "Trung tâm Tiệc cưới Trống Đồng"}
                    onChange={(e) => handlePropChange("title", e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-700">Địa chỉ chi tiết:</label>
                  <textarea
                    rows={2}
                    value={props.address || "Số 72 Quán Sứ, Hoàn Kiếm, Hà Nội"}
                    onChange={(e) => handlePropChange("address", e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-700">Link Google Maps:</label>
                  <input
                    type="text"
                    placeholder="https://maps.google.com/..."
                    value={props.mapUrl || ""}
                    onChange={(e) => handlePropChange("mapUrl", e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white"
                  />
                </div>
              </div>
            )}

            {/* 7. GIFT QR BOX INSPECTOR */}
            {isGift && (
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
                  <Gift className="w-4 h-4 text-zen-primary" />
                  <span>Hộp mừng cưới & Mã QR</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-700">Tiêu đề hộp quà:</label>
                  <input
                    type="text"
                    value={props.modalTitle || "Hộp Quà Mừng Cưới Yêu Thương"}
                    onChange={(e) => handlePropChange("modalTitle", e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white"
                  />
                </div>

                <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100 text-xs text-gray-700 space-y-1">
                  <p className="font-semibold text-zen-primary">💌 Tính năng tự động:</p>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Khi khách chạm vào hộp quà trên thiệp, cửa sổ popup chứa mã VietQR và số tài khoản của Cô Dâu & Chú Rể sẽ tự động mở lên kèm nút sao chép 1 chạm.
                  </p>
                </div>
              </div>
            )}

            {/* 8. RSVP FORM INSPECTOR */}
            {isRsvp && (
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
                  <Send className="w-4 h-4 text-zen-primary" />
                  <span>Biểu mẫu xác nhận tham dự (RSVP)</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-700">Tiêu đề biểu mẫu:</label>
                  <input
                    type="text"
                    value={props.titleText || "Xác nhận tham dự"}
                    onChange={(e) => handlePropChange("titleText", e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-700">Chữ trên nút gửi:</label>
                  <input
                    type="text"
                    value={props.submitText || "Gửi xác nhận"}
                    onChange={(e) => handlePropChange("submitText", e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white"
                  />
                </div>
              </div>
            )}

            {/* 9. CAROUSEL ALBUM INSPECTOR */}
            {isCarousel && (
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
                  <ImageIcon className="w-4 h-4 text-zen-primary" />
                  <span>Album ảnh cưới trượt (Carousel)</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">
                      Ảnh trong album ({Array.isArray(props.imgList) ? props.imgList.length : 0}):
                    </span>
                    <button
                      type="button"
                      onClick={() => carouselFileInputRef.current?.click()}
                      disabled={isUploadingCarousel}
                      className="px-2.5 py-1 rounded-lg bg-zen-primary text-white text-[11px] font-bold flex items-center gap-1 hover:bg-[#d93849] transition-colors cursor-pointer"
                    >
                      {isUploadingCarousel ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                      <span>Thêm ảnh</span>
                    </button>
                  </div>

                  <input
                    ref={carouselFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAddCarouselImage}
                    className="hidden"
                  />

                  {/* Thumbnail Grid */}
                  <div className="grid grid-cols-3 gap-2 pt-1 max-h-48 overflow-y-auto">
                    {Array.isArray(props.imgList) &&
                      props.imgList.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group bg-gray-50"
                        >
                          <img
                            src={getFullImageUrl(item.imageKey || item.src)}
                            alt="Album item"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveCarouselImage(idx)}
                            className="absolute top-1 right-1 p-1 rounded-full bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 cursor-pointer"
                            title="Xóa ảnh này"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700">Bo góc album:</span>
                    <span className="font-mono text-gray-600">
                      {Array.isArray(props.borderRadius) ? props.borderRadius[0] : (props.borderRadius || 24)}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    value={Array.isArray(props.borderRadius) ? props.borderRadius[0] : (props.borderRadius || 24)}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      handlePropChange("borderRadius", [val, val, val, val]);
                    }}
                    className="w-full accent-zen-primary"
                  />
                </div>
              </div>
            )}

            {/* 10. COMMON ADVANCED: Z-INDEX & POSITION */}
            <div className="pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => toggleAccordion("advanced")}
                className="w-full py-1.5 text-xs font-semibold text-gray-800 flex items-center justify-between hover:text-gray-900"
              >
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-gray-500" />
                  <span>Vị trí & Lớp hiển thị</span>
                </span>
                {openAccordions["advanced"] ? (
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                )}
              </button>

              {openAccordions["advanced"] && (
                <div className="p-2.5 bg-gray-50/70 rounded-xl space-y-2 text-xs mt-1">
                  <div className="flex items-center justify-between">
                    <span>Thứ tự lớp (Z-Index):</span>
                    <input
                      type="number"
                      value={props.zIndex || 1}
                      onChange={(e) => handlePropChange("zIndex", parseInt(e.target.value) || 1)}
                      className="w-16 p-1 border rounded text-right bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600">
                    <div>
                      <span>Tọa độ X: </span>
                      <span className="font-mono font-bold text-gray-800">{props.left ?? 0}px</span>
                    </div>
                    <div>
                      <span>Tọa độ Y: </span>
                      <span className="font-mono font-bold text-gray-800">{props.top ?? 0}px</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB: HIỆU ỨNG (ANIMATIONS & TRANSITIONS) ================= */}
        {activeTab === "effects" && (
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-2">
              <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Hiệu ứng chuyển động</span>
              </h4>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Cài đặt hiệu ứng liên tục và xuất hiện khi cuộn trang.
              </p>
            </div>

            {/* Continuous Animation Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-800 block">
                Hiệu ứng liên tục (Loop):
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "none", label: "Không có" },
                  { id: "float", label: "Bay lơ lửng 🕊️" },
                  { id: "bounce", label: "Nhún nhảy 🤾" },
                  { id: "wobble", label: "Rung rinh 🎈" },
                  { id: "pulse", label: "Nhịp tim 💓" },
                  { id: "wiggle", label: "Lắc lư 💃" },
                  { id: "shake", label: "Rung lắc 🔔" },
                ].map((item) => {
                  const currentType = props.continuousAnimation?.type || "none";
                  const isActive = currentType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        handlePropChange("continuousAnimation", {
                          type: item.id,
                          duration: props.continuousAnimation?.duration || 3,
                          delay: 0,
                        })
                      }
                      className={`p-2 rounded-xl border text-xs font-medium text-left transition-all ${
                        isActive
                          ? "border-[#e54153] bg-rose-50 text-[#e54153] font-bold shadow-2xs"
                          : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Speed / Duration slider */}
            {props.continuousAnimation?.type && props.continuousAnimation.type !== "none" && (
              <div className="space-y-1.5 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700">Tốc độ chuyển động:</span>
                  <span className="font-mono text-gray-600">
                    {props.continuousAnimation.duration || 3}s
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="0.2"
                  value={props.continuousAnimation.duration || 3}
                  onChange={(e) =>
                    handlePropChange("continuousAnimation", {
                      ...props.continuousAnimation,
                      duration: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-[#e54153]"
                />
              </div>
            )}

            {/* Transition on view */}
            <div className="space-y-2 pt-3 border-t border-gray-100">
              <label className="text-xs font-bold text-gray-800 block">
                Hiệu ứng khi cuộn tới (Xuất hiện):
              </label>
              <select
                value={props.transition?.effectType || "fadeIn"}
                onChange={(e) =>
                  handlePropChange("transition", {
                    effectEnabled: true,
                    effectType: e.target.value,
                    effectDuration: 1.5,
                    effectDelay: 0,
                    effectEasing: "ease",
                  })
                }
                className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white font-medium text-gray-800"
              >
                <option value="none">Không có hiệu ứng</option>
                <option value="fadeIn">Mờ dần vào (Fade In)</option>
                <option value="fadeInUp">Bay từ dưới lên (Fade In Up)</option>
                <option value="zoomIn">Phóng to dần (Zoom In)</option>
                <option value="bounceIn">Nảy bật vui nhộn (Bounce In)</option>
                <option value="flipInX">Lật thẻ 3D (Flip In)</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
