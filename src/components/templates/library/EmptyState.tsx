"use client";

import React from "react";
import { FolderHeart, Search, Heart, Sparkles, Plus, RefreshCw } from "lucide-react";

interface EmptyStateProps {
  type?: "search" | "custom" | "favorites" | "general";
  onResetFilters?: () => void;
  onCreateNew?: () => void;
}

export default function EmptyState({
  type = "general",
  onResetFilters,
  onCreateNew,
}: EmptyStateProps) {
  if (type === "custom") {
    return (
      <div className="text-center py-16 sm:py-24 bg-white rounded-3xl border border-dashed border-rose-200 p-8 shadow-xs">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-zen-primary flex items-center justify-center mx-auto mb-4 ring-8 ring-rose-50/50">
          <FolderHeart className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-gray-900 text-lg sm:text-xl font-serif">
          Bạn chưa có mẫu tự tạo nào trong kho
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
          Tạo mẫu thiệp độc đáo của riêng bạn bằng Studio thiết kế trực quan,
          hoặc nhập mẫu từ tệp JSON sao lưu có sẵn.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {onCreateNew && (
            <button
              type="button"
              onClick={onCreateNew}
              className="px-5 py-2.5 rounded-full bg-zen-primary hover:bg-red-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-zen-primary/25 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo template đầu tiên</span>
            </button>
          )}
          {onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-4 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-gray-700 text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <span>Xem tất cả mẫu hệ thống</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  if (type === "favorites") {
    return (
      <div className="text-center py-16 sm:py-24 bg-white rounded-3xl border border-dashed border-rose-200 p-8 shadow-xs">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4 ring-8 ring-rose-50/50">
          <Heart className="w-8 h-8 fill-rose-100" />
        </div>
        <h3 className="font-bold text-gray-900 text-lg sm:text-xl font-serif">
          Chưa có mẫu thiệp yêu thích nào
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
          Bấm vào biểu tượng trái tim <Heart className="w-3.5 h-3.5 inline text-rose-500 fill-current" /> ở góc mỗi mẫu để lưu lại vào danh sách yêu thích và truy cập nhanh bất kỳ lúc nào.
        </p>
        {onResetFilters && (
          <div className="mt-6">
            <button
              type="button"
              onClick={onResetFilters}
              className="px-5 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-semibold transition-all hover:scale-105"
            >
              Khám phá toàn bộ mẫu
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="text-center py-16 sm:py-24 bg-white rounded-3xl border border-dashed border-gray-200 p-8 shadow-xs">
      <div className="w-16 h-16 rounded-3xl bg-stone-100 text-gray-400 flex items-center justify-center mx-auto mb-4 ring-8 ring-stone-100/50">
        <Search className="w-8 h-8" />
      </div>
      <h3 className="font-bold text-gray-900 text-lg sm:text-xl font-serif">
        Không tìm thấy mẫu thiệp phù hợp
      </h3>
      <p className="text-xs sm:text-sm text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
        Thử bỏ bớt một vài bộ lọc, tìm kiếm không dấu hoặc đổi từ khóa để có thêm nhiều lựa chọn.
      </p>
      {onResetFilters && (
        <div className="mt-6">
          <button
            type="button"
            onClick={onResetFilters}
            className="px-5 py-2.5 rounded-full bg-zen-primary hover:bg-red-600 text-white text-xs sm:text-sm font-semibold shadow-md shadow-zen-primary/25 transition-all duration-200 hover:scale-105 flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Xóa tất cả bộ lọc</span>
          </button>
        </div>
      )}
    </div>
  );
}
