"use client";

import React, { useEffect, useRef } from "react";
import {
  Copy,
  Trash2,
  Lock,
  Unlock,
  Layers,
  ArrowUp,
  ArrowDown,
  AlignCenter,
  Sparkles,
  RotateCcw,
  Sliders,
  Scissors,
  Check,
} from "lucide-react";

export interface ContextMenuProps {
  x: number;
  y: number;
  selectedElement: {
    id: string;
    type: string;
    props: Record<string, any>;
  } | null;
  canvasWidth: number;
  canvasHeight: number;
  onClose: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateProps: (id: string, updatedProps: Record<string, any>) => void;
  onRemoveBackground?: () => void;
}

export default function EditorContextMenu({
  x,
  y,
  selectedElement,
  canvasWidth,
  canvasHeight,
  onClose,
  onDuplicate,
  onDelete,
  onUpdateProps,
  onRemoveBackground,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click or scroll
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleScroll = () => onClose();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("mousedown", handleClick);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!selectedElement) return null;

  const { id, type, props } = selectedElement;
  const isLocked = Boolean(props.locked);
  const currentZ = Number(props.zIndex) || 1;

  // Align horizontal center
  const handleCenterHorizontal = () => {
    const elWidth = Number(props.width) || 100;
    onUpdateProps(id, { left: Math.round((canvasWidth - elWidth) / 2) });
    onClose();
  };

  // Align vertical center
  const handleCenterVertical = () => {
    const elHeight = Number(props.height) || 100;
    onUpdateProps(id, { top: Math.round((canvasHeight - elHeight) / 2) });
    onClose();
  };

  // Reset rotation to 0
  const handleResetRotation = () => {
    onUpdateProps(id, { rotation: 0 });
    onClose();
  };

  // Layer ordering
  const handleLayer = (delta: number) => {
    onUpdateProps(id, { zIndex: Math.max(1, currentZ + delta) });
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-[99999] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/90 py-1.5 min-w-[210px] text-xs select-none animate-scale-up"
      style={{
        left: `${Math.min(window.innerWidth - 230, x)}px`,
        top: `${Math.min(window.innerHeight - 340, y)}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 flex items-center justify-between">
        <span>{type.replace("Box", "").replace("V2", "") || "Phần tử"}</span>
        <span className="font-mono text-[9px] text-gray-400">z: {currentZ}</span>
      </div>

      <div className="p-1 space-y-0.5">
        {/* Nhân bản */}
        <button
          type="button"
          onClick={() => {
            onDuplicate(id);
            onClose();
          }}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Copy className="w-3.5 h-3.5 text-gray-500" />
            <span className="font-medium">Nhân bản</span>
          </div>
          <span className="text-[10px] font-mono text-gray-400">Ctrl+D</span>
        </button>

        {/* Khóa / Mở khóa vị trí */}
        <button
          type="button"
          onClick={() => {
            onUpdateProps(id, { locked: !isLocked });
            onClose();
          }}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            {isLocked ? (
              <Unlock className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-gray-500" />
            )}
            <span className="font-medium">{isLocked ? "Mở khóa vị trí" : "Khóa vị trí"}</span>
          </div>
          <span className="text-[10px] font-mono text-gray-400">Ctrl+L</span>
        </button>

        {/* Nút tách nền AI nếu là ảnh */}
        {type === "PhotoBox" && onRemoveBackground && (
          <button
            type="button"
            onClick={() => {
              onRemoveBackground();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-amber-50 text-amber-900 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-400" />
              <span className="font-semibold">Tách phông nền AI</span>
            </div>
            <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-md">0đ</span>
          </button>
        )}

        <div className="h-px bg-gray-100 my-1" />

        {/* Sắp xếp lớp Z-Index */}
        <div className="text-[10px] font-bold text-gray-400 px-2 py-0.5 uppercase tracking-wider">
          Sắp xếp thứ tự lớp
        </div>

        <button
          type="button"
          onClick={() => handleLayer(1)}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <ArrowUp className="w-3.5 h-3.5 text-gray-500" />
            <span>Tiến lên 1 lớp</span>
          </div>
          <span className="text-[10px] font-mono text-gray-400">Ctrl+]</span>
        </button>

        <button
          type="button"
          onClick={() => handleLayer(15)}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-gray-500" />
            <span>Lên trên cùng</span>
          </div>
          <span className="text-[10px] font-mono text-gray-400">Top</span>
        </button>

        <button
          type="button"
          onClick={() => handleLayer(-1)}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <ArrowDown className="w-3.5 h-3.5 text-gray-500" />
            <span>Lùi về 1 lớp</span>
          </div>
          <span className="text-[10px] font-mono text-gray-400">Ctrl+[</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onUpdateProps(id, { zIndex: 1 });
            onClose();
          }}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-gray-500 rotate-180" />
            <span>Về đáy dưới cùng</span>
          </div>
          <span className="text-[10px] font-mono text-gray-400">Bottom</span>
        </button>

        <div className="h-px bg-gray-100 my-1" />

        {/* Căn lề */}
        <div className="text-[10px] font-bold text-gray-400 px-2 py-0.5 uppercase tracking-wider">
          Căn gióng vị trí
        </div>

        <button
          type="button"
          onClick={handleCenterHorizontal}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <AlignCenter className="w-3.5 h-3.5 text-gray-500" />
            <span>Căn giữa theo chiều ngang</span>
          </div>
        </button>

        <button
          type="button"
          onClick={handleCenterVertical}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <AlignCenter className="w-3.5 h-3.5 text-gray-500 rotate-90" />
            <span>Căn giữa theo chiều dọc</span>
          </div>
        </button>

        {props.rotation !== 0 && (
          <button
            type="button"
            onClick={handleResetRotation}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
              <span>Đặt lại góc xoay (0°)</span>
            </div>
            <span className="text-[10px] font-mono text-gray-400">{props.rotation}°</span>
          </button>
        )}

        <div className="h-px bg-gray-100 my-1" />

        {/* Xóa */}
        <button
          type="button"
          onClick={() => {
            onDelete(id);
            onClose();
          }}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 font-medium">
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa phần tử</span>
          </div>
          <span className="text-[10px] font-mono text-red-400">Del</span>
        </button>
      </div>
    </div>
  );
}
