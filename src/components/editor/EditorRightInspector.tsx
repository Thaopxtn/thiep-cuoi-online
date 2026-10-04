"use client";

import React, { useState } from "react";
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
  AlignJustify,
  FlipHorizontal,
  FlipVertical,
  Link as LinkIcon,
  Maximize2,
  Layers,
  Lock,
  Eye,
  Sliders,
  Bold,
  Italic,
  Underline,
} from "lucide-react";

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
    clickAction: false, // Collapsed by default, outlined in red/rose in user screenshot
    padding: false,
    border: false,
    shadow: false,
    advanced: false,
    text: true,
  });

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!selectedElement) {
    return (
      <aside className="w-[300px] sm:w-[320px] bg-white border-l border-gray-200 h-full flex flex-col z-30 select-none shrink-0 shadow-xs p-5 text-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-3">
          <Settings className="w-6 h-6" />
        </div>
        <h4 className="text-xs font-bold text-gray-800">Chưa chọn phần tử nào</h4>
        <p className="text-[11px] text-gray-500 mt-1 max-w-[200px] mx-auto leading-relaxed">
          Nhấn vào bất kỳ ảnh, chữ hoặc thành phần nào trên thiệp để tùy chỉnh chi tiết.
        </p>
      </aside>
    );
  }

  const { id, type, props } = selectedElement;
  const isImage = type === "PhotoBox" || props.imgKey;
  const isText = type === "TextBox" || typeof props.text === "string";
  const isShape = type === "GeometricBox" || type === "LineBox";

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
          id="tab-settings-btn"
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "settings"
              ? "bg-white text-gray-900 shadow-2xs"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Cài đặt</span>
        </button>

        <button
          id="tab-effects-btn"
          type="button"
          onClick={() => setActiveTab("effects")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
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
        {activeTab === "settings" && isImage && (
          <div className="space-y-4">
            {/* Header: Hình ảnh */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
              <ChevronDown className="w-4 h-4 text-gray-500" />
              <span>Hình ảnh</span>
            </div>

            {/* Thumbnail Preview */}
            <div className="flex items-center justify-center py-1">
              <div className="w-24 h-28 rounded-lg overflow-hidden border border-gray-200 shadow-xs bg-gray-50 relative group">
                <img
                  src={getFullImageUrl(props.imgKey || props.src)}
                  alt="Selected"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Actions: Đổi ảnh | Cắt ảnh */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onReplaceImage}
                className="py-2 px-3 rounded-lg border border-gray-200 hover:border-gray-300 bg-white text-xs font-semibold text-gray-700 flex items-center justify-center gap-1.5 shadow-2xs transition-transform active:scale-95"
              >
                <RotateCw className="w-3.5 h-3.5 text-gray-500" />
                <span>Đổi ảnh</span>
              </button>

              <button
                type="button"
                className="py-2 px-3 rounded-lg border border-gray-200 hover:border-gray-300 bg-white text-xs font-semibold text-gray-700 flex items-center justify-center gap-1.5 shadow-2xs transition-transform active:scale-95"
              >
                <Crop className="w-3.5 h-3.5 text-gray-500" />
                <span>Cắt ảnh</span>
              </button>
            </div>

            {/* Magic Button: ✨ Xóa nền (AI Background Removal!) */}
            <button
              type="button"
              onClick={onRemoveBackground}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-xs shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.98]"
            >
              <Wand2 className="w-4 h-4 text-amber-300" />
              <span>Xóa nền</span>
            </button>

            {/* Slider: Độ mờ (Opacity) */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-700">Độ mờ</span>
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
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#e54153]"
              />
            </div>

            {/* Studio AI Color Grading Filters */}
            <div className="border-t border-gray-100 pt-2">
              <button
                type="button"
                onClick={() => toggleAccordion("filters")}
                className="w-full py-1.5 text-xs font-bold text-gray-800 flex items-center justify-between hover:text-gray-900"
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Bộ lọc màu Studio AI</span>
                </div>
                {openAccordions["filters"] ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {openAccordions["filters"] && (
                <div className="pt-2 grid grid-cols-2 gap-1.5">
                  {[
                    { id: "none", name: "Ảnh gốc", filter: "none", icon: "✨" },
                    { id: "korean", name: "Hàn Quốc", filter: "contrast(106%) brightness(108%) saturate(110%) sepia(4%)", icon: "🌸" },
                    { id: "vintage", name: "Cổ Điển", filter: "sepia(32%) contrast(110%) brightness(96%) saturate(85%)", icon: "🎞️" },
                    { id: "film", name: "Phim 35mm", filter: "contrast(118%) brightness(98%) saturate(92%) hue-rotate(-6deg)", icon: "🎬" },
                    { id: "bw", name: "Đen Trắng", filter: "grayscale(100%) contrast(125%) brightness(102%)", icon: "🖤" },
                    { id: "dreamy", name: "Mộng Mơ", filter: "brightness(112%) contrast(96%) saturate(125%) hue-rotate(8deg)", icon: "🦄" },
                    { id: "sunset", name: "Hoàng Hôn", filter: "sepia(24%) saturate(135%) brightness(104%) contrast(106%)", icon: "🌅" },
                  ].map((filterItem) => {
                    const isFilterActive =
                      (props.filterPreset === filterItem.id) ||
                      (!props.filterPreset && filterItem.id === "none" && !props.filterStyle);
                    return (
                      <button
                        key={filterItem.id}
                        type="button"
                        onClick={() => {
                          handlePropChange("filterPreset", filterItem.id);
                          handlePropChange("filterStyle", filterItem.filter);
                        }}
                        className={`p-1.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition-all text-left ${
                          isFilterActive
                            ? "border-zen-primary bg-rose-50 text-zen-primary shadow-2xs"
                            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <span className="text-xs">{filterItem.icon}</span>
                        <span className="truncate">{filterItem.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Căn chỉnh (Alignment) */}
            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
              <span className="text-xs font-semibold text-gray-700">Căn chỉnh</span>
              <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-0.5 bg-gray-50">
                <button
                  type="button"
                  onClick={() => handlePropChange("left", 50)}
                  className="p-1 rounded text-gray-500 hover:text-gray-900 hover:bg-white"
                  title="Căn trái"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handlePropChange("left", 133)}
                  className="p-1 rounded text-gray-500 hover:text-gray-900 hover:bg-white"
                  title="Căn giữa"
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handlePropChange("left", 230)}
                  className="p-1 rounded text-gray-500 hover:text-gray-900 hover:bg-white"
                  title="Căn phải"
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Accordions */}
            <div className="space-y-0.5 border-t border-gray-100 pt-2">
              {/* Lật ảnh */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion("flip")}
                  className="w-full py-2 text-xs font-semibold text-gray-800 flex items-center gap-1.5 hover:text-gray-900"
                >
                  {openAccordions["flip"] ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                  <span>Lật ảnh</span>
                </button>
                {openAccordions["flip"] && (
                  <div className="p-2.5 bg-gray-50/60 rounded-xl mb-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handlePropChange("flipX", !props.flipX)}
                      className={`flex-1 py-1.5 px-2 rounded-lg border text-xs flex items-center justify-center gap-1 ${
                        props.flipX
                          ? "border-[#e54153] bg-rose-50 text-[#e54153]"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <FlipHorizontal className="w-3.5 h-3.5" />
                      <span>Ngang</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePropChange("flipY", !props.flipY)}
                      className={`flex-1 py-1.5 px-2 rounded-lg border text-xs flex items-center justify-center gap-1 ${
                        props.flipY
                          ? "border-[#e54153] bg-rose-50 text-[#e54153]"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <FlipVertical className="w-3.5 h-3.5" />
                      <span>Dọc</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Hành động khi bấm (Exact red rounded border from screenshot!) */}
              <div className="border border-[#f43f5e] rounded-xl overflow-hidden bg-white shadow-2xs my-1.5">
                <button
                  type="button"
                  onClick={() => toggleAccordion("clickAction")}
                  className="w-full px-3 py-2 text-xs font-semibold text-gray-800 flex items-center gap-1.5 hover:bg-rose-50/30 transition-colors"
                >
                  {openAccordions["clickAction"] ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                  <span>Hành động khi bấm</span>
                </button>
                {openAccordions["clickAction"] && (
                  <div className="p-3 border-t border-rose-100 space-y-2 text-xs bg-rose-50/10">
                    <label className="block text-[11px] font-semibold text-gray-600">
                      Khi khách bấm vào ảnh này:
                    </label>
                    <select
                      value={props.clickAction || "zoom"}
                      onChange={(e) => handlePropChange("clickAction", e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                    >
                      <option value="none">Không có hành động</option>
                      <option value="zoom">Phóng to ảnh xem toàn màn hình</option>
                      <option value="link">Mở đường link liên kết</option>
                      <option value="scroll">Cuộn đến phần thông tin cưới</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Khoảng đệm */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion("padding")}
                  className="w-full py-2 text-xs font-semibold text-gray-800 flex items-center gap-1.5 hover:text-gray-900 border-t border-gray-100"
                >
                  {openAccordions["padding"] ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                  <span>Khoảng đệm</span>
                </button>
                {openAccordions["padding"] && (
                  <div className="p-2.5 bg-gray-50/60 rounded-xl mb-2 text-xs">
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={props.padding?.[0] || 0}
                      onChange={(e) => handlePropChange("padding", [parseInt(e.target.value)])}
                      className="w-full accent-[#e54153]"
                    />
                  </div>
                )}
              </div>

              {/* Đường viền */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion("border")}
                  className="w-full py-2 text-xs font-semibold text-gray-800 flex items-center gap-1.5 hover:text-gray-900 border-t border-gray-100"
                >
                  {openAccordions["border"] ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                  <span>Đường viền</span>
                </button>
                {openAccordions["border"] && (
                  <div className="p-2.5 bg-gray-50/60 rounded-xl mb-2 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span>Độ dày viền (px):</span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={props.borderSize || 0}
                        onChange={(e) => handlePropChange("borderSize", parseInt(e.target.value) || 0)}
                        className="w-16 p-1 border rounded text-right"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Đổ bóng */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion("shadow")}
                  className="w-full py-2 text-xs font-semibold text-gray-800 flex items-center gap-1.5 hover:text-gray-900 border-t border-gray-100"
                >
                  {openAccordions["shadow"] ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                  <span>Đổ bóng</span>
                </button>
                {openAccordions["shadow"] && (
                  <div className="p-2.5 bg-gray-50/60 rounded-xl mb-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!props.hasBoxShadow}
                        onChange={(e) => handlePropChange("hasBoxShadow", e.target.checked)}
                        className="accent-[#e54153]"
                      />
                      <span>Bật hiệu ứng đổ bóng</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Nâng cao */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion("advanced")}
                  className="w-full py-2 text-xs font-semibold text-gray-800 flex items-center gap-1.5 hover:text-gray-900 border-t border-gray-100"
                >
                  {openAccordions["advanced"] ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                  <span>Nâng cao</span>
                </button>
                {openAccordions["advanced"] && (
                  <div className="p-2.5 bg-gray-50/60 rounded-xl mb-2 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span>Lớp hiển thị (Z-Index):</span>
                      <input
                        type="number"
                        value={props.zIndex || 1}
                        onChange={(e) => handlePropChange("zIndex", parseInt(e.target.value) || 1)}
                        className="w-16 p-1 border rounded text-right"
                      />
                    </div>
                  </div>
                )}
              </div>
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
                Cài đặt hiệu ứng liên tục và xuất hiện cho phần tử được chọn.
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

        {/* ================= IF TEXT SELECTED ================= */}
        {isText && !isImage && (
          <div className="space-y-4">
            <div className="flex items-center gap-1 text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
              <ChevronDown className="w-4 h-4 text-gray-500" />
              <span>Văn bản</span>
            </div>

            {/* Textarea Content */}
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

              {/* Quick Wedding Color Swatches */}
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-semibold uppercase">Màu đề xuất:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { label: "Đỏ đô hoàng gia", color: "#511419" },
                    { label: "Đen than trang trọng", color: "#1c171a" },
                    { label: "Nâu đất đậm", color: "#451a03" },
                    { label: "Vàng đồng ánh kim", color: "#b45309" },
                    { label: "Trắng nổi bật", color: "#ffffff" },
                    { label: "Kem vàng sang", color: "#ece4d8" },
                    { label: "Hồng đất lãng mạn", color: "#9f1239" },
                    { label: "Xám chì đậm", color: "#374151" },
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
              </div>

              {/* Text Shadow for High Contrast */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">Đổ bóng chữ (Chống chìm):</span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={!!props.hasTextShadow}
                      onChange={(e) => {
                        handlePropChange("hasTextShadow", e.target.checked);
                        if (e.target.checked && !props.textShadow) {
                          handlePropChange("textShadow", {
                            offsetX: 0,
                            offsetY: 1,
                            blur: 4,
                            color: "rgba(0,0,0,0.6)",
                          });
                        }
                      }}
                      className="accent-zen-primary"
                    />
                    <span className="text-[11px] text-gray-600 font-medium">Bật</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Formatting buttons */}
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

        {/* ================= IF GEOMETRIC / SHAPE BOX SELECTED ================= */}
        {isShape && (
          <div className="space-y-4">
            <div className="flex items-center gap-1 text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
              <ChevronDown className="w-4 h-4 text-gray-500" />
              <span>Khối hình học / Hộp nền</span>
            </div>

            {/* Fill Color */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-700">Màu nền khối:</span>
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

              {/* Shape Color Swatches */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {[
                  { label: "Đỏ đô hoàng gia", color: "rgba(81, 20, 25, 1.00)" },
                  { label: "Trắng tinh", color: "#ffffff" },
                  { label: "Kem vintage", color: "#faf7f2" },
                  { label: "Đen than", color: "#1c171a" },
                  { label: "Vàng đồng", color: "#b45309" },
                  { label: "Hồng pastel", color: "#ffe4e6" },
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

            {/* Box Shadow */}
            <div className="pt-2 border-t border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={!!props.hasBoxShadow}
                  onChange={(e) => handlePropChange("hasBoxShadow", e.target.checked)}
                  className="accent-zen-primary"
                />
                <span className="font-semibold text-gray-700">Bật bóng đổ cho khối</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
