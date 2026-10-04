"use client";

import React from "react";
import { X, Keyboard } from "lucide-react";

interface EditorShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditorShortcutsModal({
  isOpen,
  onClose,
}: EditorShortcutsModalProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: "Ctrl + Z", desc: "Hoàn tác hành động gần nhất" },
    { key: "Ctrl + Y", desc: "Làm lại hành động vừa hoàn tác" },
    { key: "Ctrl + S", desc: "Lưu bản nháp thiệp vào kho mẫu" },
    { key: "Delete / Backspace", desc: "Xóa phần tử đang chọn" },
    { key: "Ctrl + D", desc: "Nhân bản phần tử đang chọn" },
    { key: "Phím mũi tên", desc: "Di chuyển phần tử 1px" },
    { key: "Shift + Mũi tên", desc: "Di chuyển phần tử 10px" },
    { key: "Esc", desc: "Hủy chọn phần tử hoặc đóng modal" },
  ];

  return (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 p-6 relative animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-800 flex items-center justify-center">
            <Keyboard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-gray-900">Phím tắt nhanh</h3>
            <p className="text-[11px] text-gray-400">Các thao tác nhanh trong ZenLove Studio</p>
          </div>
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs"
            >
              <span className="text-gray-600 font-medium">{sc.desc}</span>
              <kbd className="px-2.5 py-1 rounded-md bg-white border border-gray-200 shadow-2xs font-mono font-bold text-gray-800 text-[11px]">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
