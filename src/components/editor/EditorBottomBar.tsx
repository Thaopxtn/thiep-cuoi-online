"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronUp, Grid, Keyboard, Magnet, Maximize2, Minus, Plus, RotateCcw, Shield, SlidersHorizontal, Sparkles } from "lucide-react";

export interface BottomBarProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onSetZoom: (zoom: number) => void;
  onFitToScreen: () => void;
  isGridVisible: boolean;
  onToggleGrid: () => void;
  isSnappingEnabled: boolean;
  onToggleSnapping: () => void;
  onOpenPreview: () => void;
  onOpenShortcuts: () => void;
  isAntiOverlapEnabled?: boolean;
  onToggleAntiOverlap?: () => void;
  onAutoArrangeBlocks?: () => void;
}
const ZOOM_PRESETS = [50, 75, 85, 100, 125, 150];

export default function EditorBottomBar({ zoomLevel, onZoomIn, onZoomOut, onResetZoom, onSetZoom, onFitToScreen, isGridVisible, onToggleGrid, isSnappingEnabled, onToggleSnapping, onOpenShortcuts, isAntiOverlapEnabled, onToggleAntiOverlap, onAutoArrangeBlocks }: BottomBarProps) {
  const [openPanel, setOpenPanel] = useState<"tools" | "zoom" | null>(null);
  const barRef = useRef<HTMLElement>(null);
  const toolsButtonRef = useRef<HTMLButtonElement>(null);
  const zoomButtonRef = useRef<HTMLButtonElement>(null);
  const zoomPercent = Math.round(zoomLevel * 100);

  useEffect(() => {
    if (!openPanel) return;
    const handlePointer = (event: PointerEvent) => {
      if (!barRef.current?.contains(event.target as Node)) setOpenPanel(null);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        (openPanel === "tools" ? toolsButtonRef : zoomButtonRef).current?.focus();
        setOpenPanel(null);
      }
    };
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [openPanel]);

  const closePanel = () => {
    setOpenPanel(null);
    (openPanel === "tools" ? toolsButtonRef : zoomButtonRef).current?.focus();
  };
  const layoutTools = [
    { label: "Lưới thiết kế", title: `Lưới thiết kế: Đang ${isGridVisible ? "BẬT" : "TẮT"}`, icon: Grid, active: isGridVisible, action: onToggleGrid },
    { label: "Bắt dính căn lề", title: `Bắt dính căn lề: Đang ${isSnappingEnabled ? "BẬT" : "TẮT"}`, icon: Magnet, active: isSnappingEnabled, action: onToggleSnapping },
    ...(onToggleAntiOverlap ? [{ label: "Chống đè khối", title: `Tự động chống đè khối: Đang ${isAntiOverlapEnabled ? "BẬT" : "TẮT"}`, icon: Shield, active: Boolean(isAntiOverlapEnabled), action: onToggleAntiOverlap }] : []),
  ];

  return (
    <footer className="studio-viewport-bar" aria-label="Điều khiển không gian thiết kế" ref={barRef} onClick={(event) => event.stopPropagation()} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpenPanel(null); }}>
      <div className="studio-viewport-options">
        <button ref={toolsButtonRef} type="button" className="studio-icon-button" title="Công cụ căn chỉnh" aria-expanded={openPanel === "tools"} aria-controls="studio-layout-tools" onClick={() => setOpenPanel(openPanel === "tools" ? null : "tools")}><SlidersHorizontal className="h-4 w-4" aria-hidden="true" /></button>
        {openPanel === "tools" && (
          <div id="studio-layout-tools" className="studio-viewport-popover left-0" aria-label="Công cụ căn chỉnh">
            <p className="px-3 py-2 text-xs font-semibold">Hỗ trợ bố cục</p>
            {layoutTools.map(({ label, title, icon: Icon, active, action }) => (
              <button key={label} type="button" className="studio-button" onClick={action} aria-pressed={active} title={title}><span className="flex items-center gap-2"><Icon className="h-4 w-4" aria-hidden="true" />{label}</span>{active && <Check className="h-4 w-4" aria-hidden="true" />}</button>
            ))}
            {onAutoArrangeBlocks && <button type="button" className="studio-button" onClick={() => { onAutoArrangeBlocks(); closePanel(); }} title="Tự động giãn cách đều và chống đè tất cả các khối (Auto-Arrange)"><span className="flex items-center gap-2"><Sparkles className="h-4 w-4" aria-hidden="true" />Giãn cách đều các khối</span></button>}
            <button type="button" className="studio-button" onClick={() => { onOpenShortcuts(); setOpenPanel(null); }} title="Bảng phím tắt trợ giúp"><span className="flex items-center gap-2"><Keyboard className="h-4 w-4" aria-hidden="true" />Phím tắt</span></button>
          </div>
        )}
      </div>
      <span className="studio-viewport-caption">Không gian thiết kế</span>
      <div className="flex min-w-0 items-center">
        <button type="button" className="studio-icon-button" title="Thu nhỏ canvas (-)" onClick={onZoomOut} disabled={zoomLevel <= 0.4}><Minus className="h-4 w-4" aria-hidden="true" /></button>
        <input type="range" min="40" max="150" step="1" value={zoomPercent} onChange={(event) => onSetZoom(Number(event.target.value) / 100)} className="studio-zoom-slider" aria-label="Tỉ lệ thu phóng" aria-valuetext={`${zoomPercent}%`} />
        <button type="button" className="studio-icon-button" title="Phóng to canvas (+)" onClick={onZoomIn} disabled={zoomLevel >= 1.5}><Plus className="h-4 w-4" aria-hidden="true" /></button>
        <div className="studio-viewport-options">
          <button ref={zoomButtonRef} type="button" className="studio-button tabular-nums" title="Chọn tỉ lệ thu phóng" aria-label="Chọn tỉ lệ thu phóng" aria-expanded={openPanel === "zoom"} aria-controls="studio-zoom-presets" onClick={() => setOpenPanel(openPanel === "zoom" ? null : "zoom")}><span>{zoomPercent}%</span><ChevronUp className="h-3 w-3" aria-hidden="true" /></button>
          {openPanel === "zoom" && (
            <div id="studio-zoom-presets" className="studio-viewport-popover right-0" aria-label="Tỉ lệ thu phóng">
              <button type="button" className="studio-button" onClick={() => { onFitToScreen(); closePanel(); }}>Vừa màn hình<Maximize2 className="h-4 w-4" aria-hidden="true" /></button>
              <button type="button" className="studio-button" onClick={() => { onResetZoom(); closePanel(); }}>Đặt lại 85%<RotateCcw className="h-4 w-4" aria-hidden="true" /></button>
              <div className="my-1 border-t border-[var(--studio-border)]" />
              {ZOOM_PRESETS.map((percent) => <button key={percent} type="button" className="studio-button" aria-pressed={zoomPercent === percent} onClick={() => { onSetZoom(percent / 100); closePanel(); }}>{percent}%{zoomPercent === percent && <Check className="h-4 w-4" aria-hidden="true" />}</button>)}
            </div>
          )}
        </div>
        <button type="button" className="studio-icon-button" title="Tự động thu phóng vừa vặn toàn bộ chiều cao màn hình" aria-label="Căn vừa màn hình" onClick={onFitToScreen}><Maximize2 className="h-4 w-4" aria-hidden="true" /></button>
      </div>
    </footer>
  );
}
