"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Sliders,
  RotateCcw,
  Check,
  Power,
  ChevronDown,
  ChevronUp,
  ArrowDown,
  ArrowUp,
  ArrowRight,
  ArrowLeft,
  Flame,
  Search,
  Film,
  Mail,
  Palette,
  Eye,
  Crown,
  Heart,
  Wand2,
} from "lucide-react";
import {
  AmbientEffectType,
  EffectCategory,
  EffectConfig,
  EFFECT_CATEGORIES,
  EFFECTS_CATALOG,
  getDefaultEffectConfig,
} from "@/lib/effectsCatalog";
import { weddingSounds } from "@/lib/soundEffects";

interface EffectConfigPanelProps {
  currentConfig?: EffectConfig | null;
  currentEffectType?: AmbientEffectType;
  onChangeConfig: (newConfig: EffectConfig) => void;
  onToggleEffect?: (effectName: string) => void;
  // Cinematic additions
  envelopeTheme?: string;
  cinematicFx?: {
    enabled?: boolean;
    touchSparkles?: boolean;
    lightLeaks?: boolean;
    ambientDust?: boolean;
    goldShimmer?: boolean;
    sealSymbol?: string;
    intensity?: "subtle" | "normal" | "vibrant";
    colorScheme?: "gold" | "rose" | "champagne" | "aurora";
  };
  onChangeEnvelopeTheme?: (theme: string) => void;
  onChangeCinematicFx?: (fx: any) => void;
  onPreviewEnvelope?: () => void;
}

export default function EffectConfigPanel({
  currentConfig,
  currentEffectType = "petals",
  onChangeConfig,
  onToggleEffect,
  envelopeTheme = "cream",
  cinematicFx,
  onChangeEnvelopeTheme,
  onChangeCinematicFx,
  onPreviewEnvelope,
}: EffectConfigPanelProps) {
  const [activeTabMode, setActiveTabMode] = useState<"ambient" | "cinematic">("cinematic");
  const [selectedCategory, setSelectedCategory] = useState<EffectCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isConfigExpanded, setIsConfigExpanded] = useState(true);

  // Active configuration values
  const activeType: AmbientEffectType =
    currentConfig?.type || currentEffectType || "petals";
  const isEnabled = currentConfig ? currentConfig.enabled : true;

  const currentDensity = currentConfig?.density ?? 28;
  const currentSpeed = currentConfig?.speed ?? 1.0;
  const currentSize = currentConfig?.size ?? 1.0;
  const currentOpacity = currentConfig?.opacity ?? 0.85;
  const currentDirection = currentConfig?.direction ?? "down";

  const activeEffectItem =
    EFFECTS_CATALOG.find((e) => e.id === activeType) || EFFECTS_CATALOG[0];

  // Filtered list
  const filteredEffects = EFFECTS_CATALOG.filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        item.name.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q)
      );
    }
    if (selectedCategory === "all") return true;
    return item.category === selectedCategory;
  });

  // Handler: Select an effect
  const handleSelectEffect = (type: AmbientEffectType) => {
    try {
      weddingSounds.playPop();
    } catch {}

    const defaultConf = getDefaultEffectConfig(type);
    onChangeConfig({
      ...defaultConf,
      enabled: true,
      density: currentDensity,
      speed: currentSpeed,
      size: currentSize,
      opacity: currentOpacity,
    });
    onToggleEffect?.(type);
  };

  // Handler: Toggle overall on/off
  const handleTogglePower = () => {
    try {
      weddingSounds.playSoftClick();
    } catch {}

    const nextEnabled = !isEnabled;
    onChangeConfig({
      type: activeType,
      enabled: nextEnabled,
      density: currentDensity,
      speed: currentSpeed,
      size: currentSize,
      opacity: currentOpacity,
      direction: currentDirection,
    });
  };

  // Handler: Reset to factory defaults
  const handleResetDefaults = () => {
    try {
      weddingSounds.playSoftClick();
    } catch {}

    const def = getDefaultEffectConfig(activeType);
    onChangeConfig({
      ...def,
      enabled: isEnabled,
    });
  };

  // Envelope theme swatches
  const envelopeThemes = [
    { id: "cream", name: "Pearl Champagne", color: "#f4efe6", border: "#d4af37", label: "Trắng ngọc trai" },
    { id: "burgundy", name: "Ruby Velvet", color: "#541218", border: "#e0b86b", label: "Đỏ rượu hoàng gia" },
    { id: "emerald", name: "Emerald Noble", color: "#0b3d30", border: "#dfb76c", label: "Lục bảo quý tộc" },
    { id: "midnight", name: "Midnight Sapphire", color: "#15223e", border: "#e2d5b8", label: "Dạ yến huyền ảo" },
    { id: "blush", name: "Rose Romance", color: "#6f3241", border: "#f1cbb5", label: "Hồng thạch anh" },
    { id: "traditional", name: "Song Hỷ Chu Sa", color: "#941722", border: "#f3c66f", label: "Đỏ truyền thống" },
  ];

  // Seal symbols
  const sealSymbols = [
    { id: "sparkle", label: "Ánh Sao", icon: <Sparkles className="w-4 h-4 text-amber-500" /> },
    { id: "囍", label: "Song Hỷ", icon: <span className="font-serif font-bold text-amber-600 text-sm">囍</span> },
    { id: "heart", label: "Trái Tim", icon: <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> },
    { id: "crown", label: "Vương Miện", icon: <Crown className="w-4 h-4 text-amber-500" /> },
    { id: "monogram", label: "Tên Khách", icon: <span className="font-serif font-bold text-amber-700 text-xs">A-Z</span> },
  ];

  const currentSeal = cinematicFx?.sealSymbol || "sparkle";

  return (
    <div className="space-y-4">
      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-xl border border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTabMode("cinematic")}
          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTabMode === "cinematic"
              ? "bg-white text-rose-600 shadow-xs border border-gray-200/80"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Kỹ Xảo Điện Ảnh 🎬</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTabMode("ambient")}
          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTabMode === "ambient"
              ? "bg-white text-rose-600 shadow-xs border border-gray-200/80"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Hạt Rơi ({EFFECTS_CATALOG.length})</span>
        </button>
      </div>

      {/* ================= SECTION 1: CINEMATIC EFFECTS & 3D ENVELOPE ================= */}
      {activeTabMode === "cinematic" && (
        <div className="space-y-4">
          {/* 3D Envelope Intro Preview & Setting */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-purple-500/10 border border-amber-300/60 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <span>Phong Bì Hoàng Gia 3D</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[9px] font-bold">
                      Đỉnh Cao
                    </span>
                  </h4>
                  <p className="text-[10px] text-gray-500 leading-tight">
                    Mở màn thiệp với con dấu sáp & nổ hạt hoàng kim 3 chiều
                  </p>
                </div>
              </div>

              {onPreviewEnvelope && (
                <button
                  type="button"
                  onClick={onPreviewEnvelope}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shadow-xs flex items-center gap-1 active:scale-95 transition-all"
                  title="Mở thử nghiệm phong bì 3D"
                >
                  <Eye className="w-3 h-3" />
                  <span>Xem thử</span>
                </button>
              )}
            </div>

            {/* Choose Theme Palette */}
            <div>
              <label className="text-[10.5px] font-bold text-gray-700 block mb-1.5">
                Màu sắc & Chất liệu phong bì:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {envelopeThemes.map((t) => {
                  const isSelected = (envelopeTheme || "cream") === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onChangeEnvelopeTheme?.(t.id)}
                      className={`p-1.5 rounded-xl border text-left transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? "border-amber-500 ring-2 ring-amber-200 bg-amber-50/50 shadow-2xs"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full shrink-0 border"
                        style={{ backgroundColor: t.color, borderColor: t.border }}
                      />
                      <span className="text-[10px] font-semibold text-gray-700 truncate">{t.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Choose Wax Seal Emblem */}
            <div>
              <label className="text-[10.5px] font-bold text-gray-700 block mb-1.5">
                Biểu tượng con dấu sáp (Wax Seal Emblem):
              </label>
              <div className="grid grid-cols-5 gap-1">
                {sealSymbols.map((s) => {
                  const isSelected = currentSeal === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() =>
                        onChangeCinematicFx?.({
                          ...cinematicFx,
                          sealSymbol: s.id,
                        })
                      }
                      className={`p-1.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all ${
                        isSelected
                          ? "border-amber-500 ring-2 ring-amber-200 bg-amber-50 shadow-2xs"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      {s.icon}
                      <span className="text-[9px] font-medium text-gray-600 truncate">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Interactive Motion Graphic Toggles */}
          <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Hiệu Ứng Chuyển Động Điện Ảnh (Motion Graphics)</span>
            </h4>

            {/* Toggle 1: Touch Sparkles */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-200/80">
              <div>
                <span className="text-[11px] font-bold text-gray-800 block">
                  ✨ Vệt bụi vàng theo ngón tay (Touch Trail)
                </span>
                <span className="text-[9.5px] text-gray-500 block">
                  Bụi sao lấp lánh nở hoa khi khách vuốt màn hình
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onChangeCinematicFx?.({
                    ...cinematicFx,
                    touchSparkles: !(cinematicFx?.touchSparkles ?? true),
                  })
                }
                className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                  (cinematicFx?.touchSparkles ?? true) ? "bg-amber-500" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                    (cinematicFx?.touchSparkles ?? true) ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Toggle 2: Light Leaks */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-200/80">
              <div>
                <span className="text-[11px] font-bold text-gray-800 block">
                  🌅 Vệt sáng ống kính điện ảnh (Lens Flare)
                </span>
                <span className="text-[9.5px] text-gray-500 block">
                  Ánh sáng máy quay phim Hollywood ấm áp ở góc màn hình
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onChangeCinematicFx?.({
                    ...cinematicFx,
                    lightLeaks: !(cinematicFx?.lightLeaks ?? true),
                  })
                }
                className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                  (cinematicFx?.lightLeaks ?? true) ? "bg-amber-500" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                    (cinematicFx?.lightLeaks ?? true) ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Toggle 3: Gold Foil Shimmer */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-200/80">
              <div>
                <span className="text-[11px] font-bold text-gray-800 block">
                  👑 Dát vàng ánh kim lấp lánh (Gold Shimmer)
                </span>
                <span className="text-[9.5px] text-gray-500 block">
                  Vệt phản quang ánh kim tráng bạc quét qua các tiêu đề
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onChangeCinematicFx?.({
                    ...cinematicFx,
                    goldShimmer: !(cinematicFx?.goldShimmer ?? true),
                  })
                }
                className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                  (cinematicFx?.goldShimmer ?? true) ? "bg-amber-500" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                    (cinematicFx?.goldShimmer ?? true) ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SECTION 2: AMBIENT PARTICLE EFFECTS ================= */}
      {activeTabMode === "ambient" && (
        <div className="space-y-4">
          {/* Header & Power Toggle */}
          <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{activeEffectItem.icon}</span>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <span>{activeEffectItem.name}</span>
                    {activeEffectItem.badge && (
                      <span className="px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-600 border border-rose-200/60 text-[9px] font-bold">
                        {activeEffectItem.badge}
                      </span>
                    )}
                  </h4>
                  <p className="text-[10.5px] text-gray-500 line-clamp-1">{activeEffectItem.desc}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTogglePower}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                  isEnabled
                    ? "bg-rose-500 hover:bg-rose-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{isEnabled ? "Đang bật" : "Đã tắt"}</span>
              </button>
            </div>

            {/* Slider Controls Drawer */}
            <div className="pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsConfigExpanded(!isConfigExpanded)}
                className="w-full flex items-center justify-between text-[11px] font-bold text-gray-600 hover:text-gray-900 py-1"
              >
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-rose-500" />
                  <span>Tinh chỉnh mật độ, tốc độ & kích thước hạt</span>
                </span>
                {isConfigExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {isConfigExpanded && (
                <div className="mt-3 space-y-3 pt-2">
                  {/* Density */}
                  <div>
                    <div className="flex justify-between text-[10.5px] font-bold text-gray-700 mb-1">
                      <span>Mật độ hạt:</span>
                      <span className="text-rose-600">{currentDensity} hạt</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="70"
                      value={currentDensity}
                      onChange={(e) =>
                        onChangeConfig({
                          type: activeType,
                          enabled: isEnabled,
                          density: Number(e.target.value),
                          speed: currentSpeed,
                          size: currentSize,
                          opacity: currentOpacity,
                          direction: currentDirection,
                        })
                      }
                      className="w-full accent-rose-500 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Speed */}
                  <div>
                    <div className="flex justify-between text-[10.5px] font-bold text-gray-700 mb-1">
                      <span>Tốc độ bay:</span>
                      <span className="text-rose-600">{currentSpeed}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.4"
                      max="2.2"
                      step="0.1"
                      value={currentSpeed}
                      onChange={(e) =>
                        onChangeConfig({
                          type: activeType,
                          enabled: isEnabled,
                          density: currentDensity,
                          speed: Number(e.target.value),
                          size: currentSize,
                          opacity: currentOpacity,
                          direction: currentDirection,
                        })
                      }
                      className="w-full accent-rose-500 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Size */}
                  <div>
                    <div className="flex justify-between text-[10.5px] font-bold text-gray-700 mb-1">
                      <span>Kích thước hạt:</span>
                      <span className="text-rose-600">{currentSize}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.6"
                      max="1.6"
                      step="0.1"
                      value={currentSize}
                      onChange={(e) =>
                        onChangeConfig({
                          type: activeType,
                          enabled: isEnabled,
                          density: currentDensity,
                          speed: currentSpeed,
                          size: Number(e.target.value),
                          opacity: currentOpacity,
                          direction: currentDirection,
                        })
                      }
                      className="w-full accent-rose-500 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm hiệu ứng (hoa, tuyết, pháo hoa, bụi vàng...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {EFFECT_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold whitespace-nowrap transition-all border shrink-0 ${
                    selectedCategory === cat.id
                      ? "bg-rose-500 text-white border-rose-500 shadow-2xs"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog of Effects */}
          <div className="space-y-2">
            {filteredEffects.map((eff) => {
              const isCurrent = isEnabled && activeType === eff.id;
              return (
                <div
                  key={eff.id}
                  onClick={() => handleSelectEffect(eff.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer select-none group relative ${
                    isCurrent
                      ? "border-rose-500 ring-2 ring-rose-200 bg-rose-50/20 shadow-xs"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="text-2xl shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                        {eff.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h5 className={`text-xs font-bold truncate ${isCurrent ? "text-rose-600" : "text-gray-900"}`}>
                            {eff.name}
                          </h5>
                          {eff.badge && (
                            <span className="px-1.5 py-0.2 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 text-[9px] font-bold shrink-0">
                              {eff.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10.5px] text-gray-500 mt-0.5 leading-snug">{eff.desc}</p>
                      </div>
                    </div>

                    <div className="shrink-0 mt-0.5">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                          isCurrent
                            ? "bg-rose-500 border-rose-500 text-white shadow-2xs"
                            : "border-gray-300 group-hover:border-gray-400 bg-white"
                        }`}
                      >
                        {isCurrent && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
