"use client";

import React from "react";
import { Download, Copy, Trash2, X, CheckSquare, Sparkles } from "lucide-react";
import { TemplateItem } from "@/data/templates";

interface BulkActionBarProps {
  selectedCount: number;
  totalFilteredCount: number;
  isAllSelected: boolean;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkExport: () => void;
  onBulkDuplicate: () => void;
  onBulkDelete: () => void;
}

export default function BulkActionBar({
  selectedCount,
  totalFilteredCount,
  isAllSelected,
  onSelectAll,
  onClearSelection,
  onBulkExport,
  onBulkDuplicate,
  onBulkDelete,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 inset-x-0 z-[99990] flex justify-center px-4 pointer-events-none animate-slide-up">
      <div className="pointer-events-auto bg-stone-900/95 backdrop-blur-md text-white px-4 sm:px-6 py-3 rounded-2xl shadow-2xl border border-stone-800 flex flex-wrap items-center justify-between gap-3 sm:gap-6 max-w-2xl w-full">
        {/* Selected count info & select all button */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
          <div className="w-6 h-6 rounded-full bg-zen-primary text-white font-bold flex items-center justify-center text-xs shadow-xs">
            {selectedCount}
          </div>
          <span className="font-semibold text-stone-100 hidden sm:inline">
            Đã chọn {selectedCount} mẫu
          </span>

          <button
            type="button"
            onClick={onSelectAll}
            className="text-[11px] text-stone-300 hover:text-white underline font-medium ml-1"
          >
            {isAllSelected ? "Bỏ chọn tất cả" : `Chọn tất cả (${totalFilteredCount})`}
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Export JSON */}
          <button
            type="button"
            onClick={onBulkExport}
            title="Xuất file JSON bộ sưu tập"
            className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Xuất JSON</span>
          </button>

          {/* Duplicate */}
          <button
            type="button"
            onClick={onBulkDuplicate}
            title="Nhân bản các mẫu đã chọn"
            className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Nhân bản</span>
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={onBulkDelete}
            title="Xóa các mẫu tự tạo đã chọn"
            className="px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa</span>
          </button>

          {/* Close Selection */}
          <button
            type="button"
            onClick={onClearSelection}
            title="Hủy chọn"
            className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
