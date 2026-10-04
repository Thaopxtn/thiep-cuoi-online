"use client";

import React from "react";
import {
  CATEGORIES,
  STYLE_TAGS,
  COLOR_FAMILIES,
  TEMPLATE_FEATURES,
  TAG_OPTIONS,
} from "@/lib/templateTaxonomy";
import {
  TemplateFilterState,
  UseTemplateFiltersReturn,
} from "@/hooks/useTemplateFilters";
import {
  Sparkles,
  Heart,
  RotateCcw,
  Check,
  X,
  SlidersHorizontal,
  Clock,
  Calendar,
  Images,
  MapPin,
  CheckSquare,
  Gift,
  MessageSquare,
  Music,
  Mail,
} from "lucide-react";
import { StyleTag, ColorFamily, TemplateFeature } from "@/data/templates/types";

interface FilterPanelProps {
  filters: TemplateFilterState;
  filterActions: Pick<
    UseTemplateFiltersReturn,
    | "setCategory"
    | "toggleStyleTag"
    | "setColorFamily"
    | "toggleFeature"
    | "setTag"
    | "setFavoritesOnly"
    | "clearAllFilters"
    | "activeFilterCount"
  >;
  categoryCounts?: Record<string, number>;
  totalCount?: number;
  favoriteCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

const FEATURE_ICONS: Record<string, React.ElementType> = {
  Clock,
  Calendar,
  Images,
  MapPin,
  CheckSquare,
  Gift,
  MessageSquare,
  Music,
  Mail,
};

export default function FilterPanel({
  filters,
  filterActions,
  categoryCounts = {},
  totalCount = 0,
  favoriteCount = 0,
  isOpenMobile = false,
  onCloseMobile,
}: FilterPanelProps) {
  const content = (
    <div className="space-y-6 text-xs text-gray-700">
      {/* Header with Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-zen-primary" />
          <span className="font-bold text-sm text-gray-900 font-serif">
            Bộ Lọc Tìm Kiếm
          </span>
          {filterActions.activeFilterCount > 0 && (
            <span className="bg-zen-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {filterActions.activeFilterCount}
            </span>
          )}
        </div>

        {filterActions.activeFilterCount > 0 && (
          <button
            type="button"
            onClick={filterActions.clearAllFilters}
            className="text-[11px] text-gray-500 hover:text-zen-primary flex items-center gap-1 font-medium transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Đặt lại</span>
          </button>
        )}
      </div>

      {/* Favorites Toggle */}
      <div className="p-3 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart
            className={`w-4 h-4 ${
              filters.favoritesOnly
                ? "text-rose-600 fill-rose-600"
                : "text-rose-500"
            }`}
          />
          <div>
            <span className="font-semibold text-gray-900 block text-xs">
              Mẫu đã thích
            </span>
            <span className="text-[10px] text-gray-500">
              {favoriteCount} mẫu đã lưu
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => filterActions.setFavoritesOnly(!filters.favoritesOnly)}
          className={`w-10 h-5 rounded-full transition-colors relative focus:outline-none ${
            filters.favoritesOnly ? "bg-rose-500" : "bg-gray-200"
          }`}
          aria-label="Lọc mẫu yêu thích"
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-xs transition-transform transform ${
              filters.favoritesOnly ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Categories Section */}
      <div>
        <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] mb-2.5">
          Danh mục
        </h4>
        <div className="space-y-1">
          {CATEGORIES.map((cat) => {
            const isSelected =
              filters.category === cat.id ||
              (!filters.category && cat.id === "all");
            const count =
              cat.id === "all" ? totalCount : categoryCounts[cat.id] || 0;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => filterActions.setCategory(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all text-left ${
                  isSelected
                    ? "bg-rose-50 text-zen-primary font-bold shadow-2xs"
                    : "hover:bg-gray-50 text-gray-600"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected
                      ? "bg-rose-500 text-white font-bold"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Style Tags Section */}
      <div>
        <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] mb-2.5">
          Phong cách thiết kế
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {STYLE_TAGS.map((st) => {
            const isSelected = filters.styleTags.includes(st.id);
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => filterActions.toggleStyleTag(st.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] transition-all flex items-center gap-1 border ${
                  isSelected
                    ? "bg-stone-900 text-white border-stone-900 font-semibold shadow-xs"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {isSelected && <Check className="w-2.5 h-2.5" />}
                <span>{st.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Family Swatches */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
            Tông màu chủ đạo
          </h4>
          {filters.colorFamily !== "all" && (
            <button
              type="button"
              onClick={() => filterActions.setColorFamily("all")}
              className="text-[10px] text-zen-primary hover:underline"
            >
              Mặc định
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {COLOR_FAMILIES.map((c) => {
            const isSelected = filters.colorFamily === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() =>
                  filterActions.setColorFamily(isSelected ? "all" : c.id)
                }
                title={c.label}
                className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center border-2 ${
                  isSelected
                    ? "scale-110 shadow-md ring-2 ring-stone-900"
                    : "hover:scale-105 border-white shadow-xs"
                }`}
                style={{
                  backgroundColor: c.swatchHex,
                  borderColor: c.borderHex || "#fff",
                }}
              >
                {isSelected && (
                  <Check
                    className={`w-3.5 h-3.5 ${
                      c.id === "neutral" ? "text-gray-900" : "text-white"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Features Checkboxes */}
      <div>
        <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] mb-2.5">
          Tính năng có trong thiệp
        </h4>
        <div className="space-y-1.5">
          {TEMPLATE_FEATURES.map((feat) => {
            const isSelected = filters.features.includes(feat.id);
            const Icon = FEATURE_ICONS[feat.iconName] || Sparkles;

            return (
              <label
                key={feat.id}
                className="flex items-center justify-between p-1.5 rounded-xl hover:bg-gray-50 cursor-pointer select-none"
              >
                <div className="flex items-center gap-2 text-gray-700">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => filterActions.toggleFeature(feat.id)}
                    className="rounded text-zen-primary focus:ring-zen-primary h-3.5 w-3.5 border-gray-300"
                  />
                  <Icon className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs">{feat.label}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Tag Filter (HOT, PREMIUM, FREE, MỚI) */}
      <div>
        <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] mb-2">
          Phân loại nhãn
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {TAG_OPTIONS.map((tagOpt) => {
            const isSelected = filters.tag === tagOpt.id;
            return (
              <button
                key={tagOpt.id}
                type="button"
                onClick={() => filterActions.setTag(tagOpt.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider transition-all border ${
                  isSelected
                    ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                    : "bg-stone-50 text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {tagOpt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-24 bg-white rounded-3xl border border-gray-200/80 p-5 shadow-xs">
          {content}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-[99999] lg:hidden bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in"
          onClick={onCloseMobile}
        >
          <div
            className="w-full max-w-xs sm:max-w-sm bg-white h-full p-5 overflow-y-auto shadow-2xl flex flex-col justify-between animate-slide-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
                <span className="font-bold text-base text-gray-900 font-serif">
                  Bộ Lọc Nâng Cao
                </span>
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {content}
            </div>

            <div className="pt-4 border-t border-gray-100 mt-6 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={onCloseMobile}
                className="w-full py-2.5 rounded-full bg-zen-primary hover:bg-red-600 text-white font-bold text-xs shadow-md transition-colors"
              >
                Xem kết quả ({totalCount} mẫu)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
