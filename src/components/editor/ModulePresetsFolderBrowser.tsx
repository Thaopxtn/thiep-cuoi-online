"use client";

import React, { useState, useMemo } from "react";
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ArrowLeft,
  Search,
  Sparkles,
  Layers,
  Plus,
  Check,
  Settings,
  MapPin,
  Sliders,
} from "lucide-react";
import {
  MODULE_CATEGORIES,
  MODULE_PRESETS,
  ModulePresetItem,
  ModuleCategoryFolder,
  ModuleCategoryId,
  getPresetsByCategory,
  getCategoryFolder,
} from "@/lib/modulePresetsCatalog";
import PresetVisualPreviewMockup from "./PresetVisualPreviewMockup";

interface ModulePresetsFolderBrowserProps {
  onAddModulePreset: (preset: ModulePresetItem) => void;
  onOpenSettings?: () => void;
}

export default function ModulePresetsFolderBrowser({
  onAddModulePreset,
  onOpenSettings,
}: ModulePresetsFolderBrowserProps) {
  // Thư mục đang chọn: null (xem danh sách thư mục) hoặc categoryId (vd: "map", "calendar"...)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Tìm kiếm mẫu nhanh
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return MODULE_PRESETS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.styleName.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        p.badge.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Thông tin thư mục hiện tại
  const currentCategoryInfo = useMemo(() => {
    if (!selectedFolderId) return null;
    return getCategoryFolder(selectedFolderId);
  }, [selectedFolderId]);

  // Danh sách mẫu trong thư mục đang chọn (hoặc tất cả nếu selectedFolderId === "all")
  const displayedPresets = useMemo(() => {
    if (!selectedFolderId || selectedFolderId === "all") return MODULE_PRESETS;
    return getPresetsByCategory(selectedFolderId);
  }, [selectedFolderId]);

  return (
    <div className="flex flex-col h-full space-y-3 select-none">
      {/* 1. Header & Ô tìm kiếm thông minh */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-[#e54153] text-white flex items-center justify-center shadow-xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <span>Thư Viện Khối Mẫu</span>
                <span className="text-[10px] font-semibold bg-rose-50 text-rose-700 px-1.5 py-0.2 rounded-md border border-rose-200/60">
                  Nhiều Giao Diện
                </span>
              </h3>
              <p className="text-[10px] text-gray-500">
                {selectedFolderId
                  ? `${currentCategoryInfo?.name || "Tất cả"}: ${displayedPresets.length} kiểu dáng lựa chọn`
                  : `${MODULE_CATEGORIES.length} Thư mục chủ đề • ${MODULE_PRESETS.length} Kiểu dáng thiết kế`}
              </p>
            </div>
          </div>
        </div>

        {/* Ô tìm kiếm nhanh */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo chủ đề: Bản đồ, Lịch, QR, Timeline..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#e54153] bg-white placeholder-gray-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Thanh chuyển đổi nhanh danh mục / thư mục (Category Filter Pills) */}
        {!searchQuery && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none pt-0.5">
            <button
              type="button"
              onClick={() => setSelectedFolderId(null)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                selectedFolderId === null
                  ? "bg-rose-600 text-white shadow-2xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Folder className="w-3 h-3" />
              <span>Tất cả thư mục ({MODULE_CATEGORIES.length})</span>
            </button>
            {MODULE_CATEGORIES.map((cat) => {
              const count = getPresetsByCategory(cat.id).length;
              const isSelected = selectedFolderId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedFolderId(cat.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                    isSelected
                      ? "bg-rose-600 text-white shadow-2xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded-full ${
                      isSelected ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. KHU VỰC HIỂN THỊ DANH SÁCH KHỐI MẪU / THƯ MỤC */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-0">
        {/* A. NẾU ĐANG CÓ TỪ KHÓA TÌM KIẾM */}
        {searchQuery.trim() ? (
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-gray-500 px-1">
              Tìm thấy {searchResults.length} mẫu phù hợp:
            </div>
            {searchResults.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                Không tìm thấy mẫu nào phù hợp với "{searchQuery}"
              </div>
            ) : (
              searchResults.map((preset) => {
                const parentFolder = getCategoryFolder(preset.category);
                return (
                  <div
                    key={preset.id}
                    onClick={() => onAddModulePreset(preset)}
                    className="p-3 rounded-2xl border border-gray-200 hover:border-rose-400 bg-white flex flex-col gap-2 cursor-pointer shadow-2xs hover:shadow-xs transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 group-hover:bg-rose-50 border border-gray-100 flex items-center justify-center text-lg shrink-0 transition-colors">
                          {preset.previewIcon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-gray-900 group-hover:text-rose-600 truncate transition-colors">
                              {preset.name}
                            </h4>
                            <span className="px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-700 text-[9px] font-bold border border-rose-200/60 shrink-0">
                              {preset.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-500 font-medium truncate mt-0.5">
                            {parentFolder?.name} • {preset.styleName}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="px-2.5 py-1 rounded-lg bg-gray-100 group-hover:bg-rose-600 text-gray-700 group-hover:text-white text-[10px] font-bold shrink-0 transition-all pointer-events-none"
                      >
                        + Chèn
                      </button>
                    </div>

                    {/* Ảnh Demo Trực Quan Giao Diện Thay Vì Dùng Chữ */}
                    <div className="w-full">
                      <PresetVisualPreviewMockup preset={preset} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : selectedFolderId === null ? (
          /* B. XEM TẤT CẢ THƯ MỤC CHỦ ĐỀ (FOLDER VIEW) */
          <div className="space-y-2.5 animate-fade-in">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
              Chọn thư mục loại khối mẫu:
            </div>

            <div className="grid grid-cols-1 gap-2">
              {MODULE_CATEGORIES.map((folder) => {
                const presetsInFolder = getPresetsByCategory(folder.id);
                return (
                  <div
                    key={folder.id}
                    onClick={() => setSelectedFolderId(folder.id)}
                    className="p-3 rounded-2xl border border-gray-200/90 hover:border-rose-400 bg-white hover:bg-rose-50/20 cursor-pointer shadow-2xs hover:shadow-xs transition-all group flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-50 to-pink-100 border border-rose-100/80 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                        {folder.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-bold text-gray-900 group-hover:text-rose-600 transition-colors">
                            {folder.name}
                          </h4>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60">
                            {presetsInFolder.length} phong cách trong thư mục
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 truncate mt-0.5">
                          {folder.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-gray-400 group-hover:text-rose-600 shrink-0 text-xs font-semibold">
                      <span className="text-[11px] hidden sm:inline">Mở</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* C. XEM CÁC GIAO DIỆN BÊN TRONG THƯ MỤC ĐANG MỞ */
          <div className="space-y-3 animate-fade-in">
            {/* Nút trở lại danh sách thư mục */}
            <div className="flex items-center justify-between px-0.5">
              <button
                type="button"
                onClick={() => setSelectedFolderId(null)}
                className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 p-1.5 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Trở lại tất cả thư mục</span>
              </button>
              <span className="text-[10px] font-medium text-gray-400">
                {displayedPresets.length} phong cách trong thư mục
              </span>
            </div>

            {/* Banner nhỏ gọn giới thiệu chủ đề đang chọn */}
            {currentCategoryInfo && (
              <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 border border-rose-200/80 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg shrink-0">{currentCategoryInfo.icon}</span>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-rose-950 truncate">
                      {currentCategoryInfo.name}
                    </h4>
                    <p className="text-[9px] text-rose-800/80 truncate">
                      {currentCategoryInfo.description}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-rose-700 bg-white/90 px-2 py-0.5 rounded-full border border-rose-200/60 shrink-0">
                  {displayedPresets.length} kiểu dáng
                </span>
              </div>
            )}

            {/* Danh sách các giao diện trong thư mục */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
                Lựa chọn giao diện {currentCategoryInfo?.name || ""}:
              </div>

              {displayedPresets.map((preset) => {
                const parentFolder = getCategoryFolder(preset.category);
                return (
                  <div
                    key={preset.id}
                    onClick={() => onAddModulePreset(preset)}
                    className="p-3 rounded-2xl border border-gray-200 hover:border-rose-400 bg-white flex flex-col gap-2 cursor-pointer shadow-2xs hover:shadow-xs hover:bg-rose-50/15 transition-all group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 group-hover:bg-rose-100/60 border border-gray-100 flex items-center justify-center text-lg shrink-0 transition-colors">
                          {preset.previewIcon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs font-bold text-gray-900 group-hover:text-rose-600 truncate transition-colors">
                              {preset.name}
                            </h4>
                            <span className="px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-700 text-[9px] font-bold border border-rose-200/60 shrink-0">
                              {preset.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-rose-600 font-semibold mt-0.5">
                            {preset.styleName}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-xl bg-gray-100 group-hover:bg-gradient-to-r group-hover:from-rose-500 group-hover:to-[#e54153] text-gray-700 group-hover:text-white text-[11px] font-bold shrink-0 transition-all flex items-center gap-1 shadow-2xs pointer-events-none"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Chèn</span>
                      </button>
                    </div>

                    {/* Ảnh Demo Trực Quan Giao Diện Thay Vì Dùng Chữ */}
                    <div className="w-full">
                      <PresetVisualPreviewMockup preset={preset} />
                    </div>

                    <div className="flex items-center gap-2 text-[9px] text-gray-400 font-mono">
                      <span>Kích thước: {preset.defaultWidth} × {preset.defaultHeight}px</span>
                      <span>•</span>
                      <span>Tự động đẩy bố cục phía sau</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Bottom Quick Link */}
      {onOpenSettings && (
        <div className="pt-2 border-t border-gray-100 shrink-0">
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-full py-2.5 px-3 rounded-xl bg-gray-50 hover:bg-rose-50 text-gray-700 hover:text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 border border-gray-200/80 transition-colors cursor-pointer shadow-2xs"
          >
            <Sliders className="w-3.5 h-3.5 text-rose-500" />
            <span>Quản lý Khối mẫu cố định (Bật / Tắt) ➔</span>
          </button>
        </div>
      )}
    </div>
  );
}
