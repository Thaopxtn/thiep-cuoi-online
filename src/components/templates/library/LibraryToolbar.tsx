"use client";

import React, { useRef, useEffect } from "react";
import {
  Search,
  SlidersHorizontal,
  X,
  RotateCcw,
  Sparkles,
  FolderHeart,
  Layers,
} from "lucide-react";
import { SORT_OPTIONS, STYLE_TAGS, CATEGORIES } from "@/lib/templateTaxonomy";
import {
  TemplateFilterState,
  UseTemplateFiltersReturn,
} from "@/hooks/useTemplateFilters";

interface LibraryToolbarProps {
  filters: TemplateFilterState;
  filterActions: Pick<
    UseTemplateFiltersReturn,
    | "setQuery"
    | "setSortBy"
    | "setCategory"
    | "toggleStyleTag"
    | "setColorFamily"
    | "toggleFeature"
    | "setTag"
    | "setFavoritesOnly"
    | "setSource"
    | "clearAllFilters"
    | "activeFilterCount"
  >;
  totalCount: number;
  customCount?: number;
  presetsCount?: number;
  showSourceTabs?: boolean;
  onOpenMobileFilter?: () => void;
}

export default function LibraryToolbar({
  filters,
  filterActions,
  totalCount,
  customCount = 0,
  presetsCount = 0,
  showSourceTabs = true,
  onOpenMobileFilter,
}: LibraryToolbarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut '/' to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const activeCategoryLabel =
    CATEGORIES.find((c) => c.id === filters.category)?.label || "";

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-4 sm:p-5 shadow-xs mb-6 space-y-4">
      {/* Top Row: Source tabs & Results count */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
        {/* Source Filter Tabs */}
        {showSourceTabs && (
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-2xl text-xs font-medium">
            <button
              type="button"
              onClick={() => filterActions.setSource("all")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filters.source === "all"
                  ? "bg-white text-gray-900 font-bold shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Tất cả mẫu ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => filterActions.setSource("custom")}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                filters.source === "custom"
                  ? "bg-zen-primary text-white font-bold shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <FolderHeart className="w-3.5 h-3.5" />
              <span>Mẫu của tôi ({customCount})</span>
            </button>
            <button
              type="button"
              onClick={() => filterActions.setSource("presets")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filters.source === "presets"
                  ? "bg-white text-gray-900 font-bold shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Mẫu hệ thống ({presetsCount})
            </button>
          </div>
        )}

        {/* Results summary & Mobile filter button */}
        <div className="flex items-center gap-2 ml-auto">
          {onOpenMobileFilter && (
            <button
              type="button"
              onClick={onOpenMobileFilter}
              className="lg:hidden px-3.5 py-1.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-gray-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-zen-primary" />
              <span>Bộ lọc</span>
              {filterActions.activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-zen-primary text-white text-[10px] flex items-center justify-center font-bold">
                  {filterActions.activeFilterCount}
                </span>
              )}
            </button>
          )}

          <div className="text-xs text-gray-500 font-medium">
            Hiển thị <span className="font-bold text-gray-900">{totalCount}</span> mẫu
          </div>
        </div>
      </div>

      {/* Middle Row: Search bar & Sort Dropdown */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:flex-1">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Tìm theo tên mẫu, chủ tiệc, địa điểm (nhấn '/' để tìm)..."
            value={filters.query}
            onChange={(e) => filterActions.setQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2 rounded-2xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-zen-primary focus:ring-1 focus:ring-zen-primary shadow-2xs placeholder:text-gray-400 bg-stone-50/50"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          {filters.query && (
            <button
              type="button"
              onClick={() => filterActions.setQuery("")}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              title="Xóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-gray-500 whitespace-nowrap hidden sm:inline">
            Sắp xếp:
          </span>
          <select
            value={filters.sortBy}
            onChange={(e) => filterActions.setSortBy(e.target.value as any)}
            className="w-full sm:w-auto py-2 px-3 rounded-2xl border border-gray-200 text-xs sm:text-sm text-gray-700 focus:outline-none focus:border-zen-primary shadow-2xs cursor-pointer bg-white"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bottom Row: Active Filter Chips */}
      {filterActions.activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100 text-xs">
          <span className="text-gray-500 text-[11px] font-medium mr-1">
            Đang lọc:
          </span>

          {/* Category Chip */}
          {filters.category && filters.category !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-medium">
              <span>{activeCategoryLabel}</span>
              <button
                type="button"
                onClick={() => filterActions.setCategory("all")}
                className="hover:text-rose-950"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Style Tag Chips */}
          {filters.styleTags.map((st) => {
            const label = STYLE_TAGS.find((s) => s.id === st)?.label || st;
            return (
              <span
                key={st}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-800 text-[11px] font-medium"
              >
                <span>{label}</span>
                <button
                  type="button"
                  onClick={() => filterActions.toggleStyleTag(st)}
                  className="hover:text-stone-950"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}

          {/* Color Chip */}
          {filters.colorFamily && filters.colorFamily !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-800 text-[11px] font-medium">
              <span>Màu: {filters.colorFamily}</span>
              <button
                type="button"
                onClick={() => filterActions.setColorFamily("all")}
                className="hover:text-stone-950"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Feature Chips */}
          {filters.features.map((feat) => (
            <span
              key={feat}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[11px] font-medium"
            >
              <span>{feat}</span>
              <button
                type="button"
                onClick={() => filterActions.toggleFeature(feat)}
                className="hover:text-blue-950"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Tag Chip */}
          {filters.tag && filters.tag !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-900 text-white text-[10px] font-bold">
              <span>{filters.tag}</span>
              <button
                type="button"
                onClick={() => filterActions.setTag("all")}
                className="hover:text-rose-300"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Favorites Chip */}
          {filters.favoritesOnly && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-800 text-[11px] font-semibold">
              <span>Đã thích</span>
              <button
                type="button"
                onClick={() => filterActions.setFavoritesOnly(false)}
                className="hover:text-pink-950"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Clear All Button */}
          <button
            type="button"
            onClick={filterActions.clearAllFilters}
            className="text-[11px] text-zen-primary hover:underline font-semibold ml-auto flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Xóa hết</span>
          </button>
        </div>
      )}
    </div>
  );
}
