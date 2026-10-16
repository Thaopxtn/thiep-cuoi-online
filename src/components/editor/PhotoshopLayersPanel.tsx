"use client";

import React, { useState, useMemo } from "react";
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Trash2,
  Search,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Type,
  Image as ImageIcon,
  Palette,
  LayoutGrid,
  Edit2,
  Check,
  RotateCcw,
  Sliders,
  Sparkles,
  ArrowUpDown,
  SlidersHorizontal,
} from "lucide-react";
import {
  classifyTemplateElements,
  TemplateElementItem,
  isElementLocked,
  isDecorativeNode,
} from "@/lib/decorativeLockService";
import { getSafeImageUrl, handleImageFallback } from "@/lib/imageUtils";
import { SelectedElementData } from "./EditorRightInspector";

interface PhotoshopLayersPanelProps {
  nodes: Record<string, any>;
  selectedElement?: SelectedElementData | null;
  onSelectElement: (element: { id: string; type: string; props: any }) => void;
  onUpdateElementProps: (elementId: string, updatedProps: Record<string, any>) => void;
  onDuplicateElement?: (elementId: string) => void;
  onDeleteElement?: (elementId: string) => void;
  onRepairDecorations?: () => void;
}

// Danh sách Blend Modes chuẩn Photoshop hỗ trợ bởi CSS mix-blend-mode
const BLEND_MODES = [
  { value: "normal", label: "Normal (Bình thường)" },
  { value: "multiply", label: "Multiply (Làm tối / Nhân màu)" },
  { value: "screen", label: "Screen (Làm sáng / Chiếu màng)" },
  { value: "overlay", label: "Overlay (Phủ tương phản)" },
  { value: "soft-light", label: "Soft Light (Ánh sáng êm)" },
  { value: "darken", label: "Darken (Chỉ lấy tối)" },
  { value: "lighten", label: "Lighten (Chỉ lấy sáng)" },
  { value: "color-dodge", label: "Color Dodge (Ánh kim rực)" },
];

export default function PhotoshopLayersPanel({
  nodes,
  selectedElement,
  onSelectElement,
  onUpdateElementProps,
  onDuplicateElement,
  onDeleteElement,
  onRepairDecorations,
}: PhotoshopLayersPanelProps) {
  const [filter, setFilter] = useState<"all" | "decorative" | "photos" | "texts" | "widgets">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<"zindex" | "top">("zindex");
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState("");

  // Phân loại toàn bộ thành phần
  const { allList, decorativeList, photosList, textsList, widgetsList, stats } = useMemo(() => {
    return classifyTemplateElements(nodes);
  }, [nodes]);

  // Tìm z-index cao nhất hiện có
  const maxZIndex = useMemo(() => {
    let max = 1;
    allList.forEach((item) => {
      const z = Number(item.zIndex) || 1;
      if (z > max) max = z;
    });
    return max;
  }, [allList]);

  // Lọc và sắp xếp theo kiểu Photoshop
  const filteredList = useMemo(() => {
    let base = allList;
    if (filter === "decorative") base = decorativeList;
    else if (filter === "photos") base = photosList;
    else if (filter === "texts") base = textsList;
    else if (filter === "widgets") base = widgetsList;

    let res = base;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      res = res.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q) ||
          (item.previewText && item.previewText.toLowerCase().includes(q))
      );
    }

    // Sắp xếp:
    // Z-Index: Layer trên đỉnh danh sách là layer hiển thị cao nhất (Photoshop style)
    // Top: Layer theo vị trí từ trên xuống dưới
    const sorted = [...res];
    if (sortMode === "zindex") {
      sorted.sort((a, b) => (b.zIndex || 1) - (a.zIndex || 1));
    } else {
      sorted.sort((a, b) => a.top - b.top);
    }
    return sorted;
  }, [allList, decorativeList, photosList, textsList, widgetsList, filter, searchQuery, sortMode]);

  // Thông tin layer đang được chọn
  const activeNode = selectedElement ? nodes[selectedElement.id] : null;
  const activeProps = activeNode?.props || selectedElement?.props || {};
  const activeOpacity = Math.round((activeProps.opacity ?? 1) * 100);
  const activeBlendMode = activeProps.blendMode || "normal";

  // Thao tác chọn Layer & cuộn mượt tới vị trí trên canvas
  const handleSelectLayer = (item: TemplateElementItem) => {
    onSelectElement({
      id: item.id,
      type: item.type,
      props: item.props,
    });
    const domEl = document.getElementById(`canvas-node-${item.id}`);
    if (domEl) {
      domEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Đổi tên layer
  const handleStartRename = (item: TemplateElementItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNameId(item.id);
    setEditingNameValue(item.props.customName || item.name);
  };

  const handleSaveRename = (itemId: string) => {
    if (editingNameValue.trim()) {
      onUpdateElementProps(itemId, { customName: editingNameValue.trim() });
    }
    setEditingNameId(null);
  };

  // Nâng / Hạ thứ tự Layer
  const handleBringForward = (item: TemplateElementItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentZ = Number(item.zIndex) || 1;
    onUpdateElementProps(item.id, { zIndex: currentZ + 1 });
  };

  const handleSendBackward = (item: TemplateElementItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentZ = Number(item.zIndex) || 1;
    onUpdateElementProps(item.id, { zIndex: Math.max(1, currentZ - 1) });
  };

  const handleBringToFront = (item: TemplateElementItem, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateElementProps(item.id, { zIndex: maxZIndex + 2 });
  };

  const handleSendToBack = (item: TemplateElementItem, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateElementProps(item.id, { zIndex: 1 });
  };

  // Bật/tắt Ẩn/Hiện (Eye)
  const handleToggleVisibility = (item: TemplateElementItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const isHidden = Boolean(item.props.hidden);
    onUpdateElementProps(item.id, { hidden: !isHidden });
  };

  // Bật/tắt Khóa/Mở khóa (Lock/Unlock)
  const handleToggleLock = (item: TemplateElementItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const lockedNow = isElementLocked(item.id, item.props);
    onUpdateElementProps(item.id, { locked: !lockedNow });
  };

  // Thao tác hàng loạt (Bulk actions)
  const handleLockAll = () => {
    allList.forEach((item) => {
      onUpdateElementProps(item.id, { locked: true });
    });
  };

  const handleUnlockAll = () => {
    allList.forEach((item) => {
      onUpdateElementProps(item.id, { locked: false });
    });
  };

  const handleShowAll = () => {
    allList.forEach((item) => {
      if (item.props.hidden) {
        onUpdateElementProps(item.id, { hidden: false });
      }
    });
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* 1. Header & Bộ lọc Tabs */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <span>Quản lý Layers</span>
                <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-md">
                  Photoshop Style
                </span>
              </h3>
              <p className="text-[10px] text-gray-500">
                {stats.total} Layers • {stats.decorative} Họa tiết mẫu
              </p>
            </div>
          </div>

          {/* Nút chuyển đổi kiểu sắp xếp */}
          <button
            type="button"
            onClick={() => setSortMode((m) => (m === "zindex" ? "top" : "zindex"))}
            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors"
            title={
              sortMode === "zindex"
                ? "Đang xếp theo Z-Index (Lớp trên cùng ở đỉnh - Chuẩn Photoshop). Bấm để xếp theo Top"
                : "Đang xếp theo Vị trí Top (Đầu trang xuống chân trang). Bấm để xếp theo Z-Index"
            }
          >
            <ArrowUpDown className="w-3 h-3 text-gray-600" />
            <span>{sortMode === "zindex" ? "Z-Index (Top)" : "Vị trí Top"}</span>
          </button>
        </div>

        {/* Ô tìm kiếm Layer */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm layer theo tên, chữ, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#e54153] bg-white placeholder-gray-400"
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

        {/* Tab phân loại Layer */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl text-[11px] font-semibold text-gray-600 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-2 py-1 rounded-lg shrink-0 transition-all ${
              filter === "all" ? "bg-white text-gray-900 shadow-2xs font-bold" : "hover:text-gray-900"
            }`}
          >
            Tất cả ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setFilter("texts")}
            className={`px-2 py-1 rounded-lg shrink-0 transition-all flex items-center gap-1 ${
              filter === "texts" ? "bg-white text-indigo-600 shadow-2xs font-bold" : "hover:text-indigo-600"
            }`}
          >
            <Type className="w-3 h-3" />
            <span>Chữ ({stats.texts})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("photos")}
            className={`px-2 py-1 rounded-lg shrink-0 transition-all flex items-center gap-1 ${
              filter === "photos" ? "bg-white text-rose-600 shadow-2xs font-bold" : "hover:text-rose-600"
            }`}
          >
            <ImageIcon className="w-3 h-3" />
            <span>Ảnh ({stats.photos})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("decorative")}
            className={`px-2 py-1 rounded-lg shrink-0 transition-all flex items-center gap-1 ${
              filter === "decorative" ? "bg-white text-amber-700 shadow-2xs font-bold" : "hover:text-amber-800"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Họa tiết ({stats.decorative})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("widgets")}
            className={`px-2 py-1 rounded-lg shrink-0 transition-all flex items-center gap-1 ${
              filter === "widgets" ? "bg-white text-emerald-600 shadow-2xs font-bold" : "hover:text-emerald-600"
            }`}
          >
            <LayoutGrid className="w-3 h-3" />
            <span>Tiện ích ({stats.widgets})</span>
          </button>
        </div>
      </div>

      {/* 2. Photoshop Top Toolbar: Blend Mode & Opacity của Layer đang chọn */}
      {selectedElement && (
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
            <span className="truncate max-w-[170px]">
              Layer: {activeProps.customName || selectedElement.props?.name || selectedElement.type}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Z-Index: {activeProps.zIndex ?? 1}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Blend Mode */}
            <div>
              <label className="text-[10px] font-semibold text-gray-500 block mb-1">
                Hòa trộn (Blend)
              </label>
              <select
                value={activeBlendMode}
                onChange={(e) =>
                  onUpdateElementProps(selectedElement.id, { blendMode: e.target.value })
                }
                className="w-full text-[11px] py-1 px-1.5 rounded-lg border border-gray-300 bg-white font-medium focus:outline-none focus:border-[#e54153]"
              >
                {BLEND_MODES.map((bm) => (
                  <option key={bm.value} value={bm.value}>
                    {bm.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Opacity Slider */}
            <div>
              <div className="flex justify-between items-center text-[10px] text-gray-500 font-semibold mb-1">
                <span>Độ mờ (Opacity)</span>
                <span className="font-mono text-gray-800">{activeOpacity}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={activeOpacity}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onUpdateElementProps(selectedElement.id, {
                    opacity: Number((val / 100).toFixed(2)),
                  });
                }}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#e54153]"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. Danh sách Layers (Photoshop Stacking) */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 max-h-[calc(100vh-360px)] min-h-[220px]">
        {filteredList.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs">
            Không tìm thấy layer nào phù hợp với bộ lọc
          </div>
        ) : (
          filteredList.map((item) => {
            const isSelected = selectedElement?.id === item.id;
            const isHidden = Boolean(item.props.hidden);
            const isLocked = isElementLocked(item.id, item.props);
            const isDecorative = isDecorativeNode(item.id, item.props);

            return (
              <div
                key={item.id}
                onClick={() => handleSelectLayer(item)}
                className={`group p-2 rounded-xl border transition-all cursor-pointer text-xs flex items-center gap-2 ${
                  isHidden
                    ? "opacity-45 bg-gray-50/70 border-dashed border-gray-300"
                    : isSelected
                    ? "bg-rose-50/80 border-[#e54153] ring-1 ring-[#e54153]/30 shadow-xs"
                    : "bg-white hover:bg-gray-50/90 border-gray-200/80 hover:border-gray-300"
                }`}
              >
                {/* 1. Visibility Eye Toggle (Con mắt) */}
                <button
                  type="button"
                  onClick={(e) => handleToggleVisibility(item, e)}
                  className={`p-1 rounded-md transition-colors cursor-pointer shrink-0 ${
                    isHidden
                      ? "text-gray-400 hover:text-gray-600 hover:bg-gray-200/60"
                      : "text-slate-700 hover:text-[#e54153] hover:bg-rose-100/50"
                  }`}
                  title={isHidden ? "Đang ẩn (Click để hiện trên Canvas)" : "Đang hiện (Click để ẩn)"}
                >
                  {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>

                {/* 2. Lock / Unlock Toggle (Ổ khóa) */}
                <button
                  type="button"
                  onClick={(e) => handleToggleLock(item, e)}
                  className={`p-1 rounded-md transition-colors cursor-pointer shrink-0 ${
                    isLocked
                      ? "text-amber-700 bg-amber-100/80 hover:bg-amber-200"
                      : "text-gray-400 hover:text-amber-700 hover:bg-gray-100"
                  }`}
                  title={
                    isLocked
                      ? "Đang khóa (Click để mở khóa và tự do sửa, kéo, co giãn)"
                      : "Đang mở khóa (Click để khóa lại cố định vị trí)"
                  }
                >
                  {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>

                {/* 3. Thumbnail / Biểu tượng kiểu Layer */}
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden border border-gray-200 shadow-2xs">
                  {item.previewImage ? (
                    <img
                      src={getSafeImageUrl(item.previewImage)}
                      alt={item.name}
                      onError={(e) => handleImageFallback(e, undefined, false)}
                      className="w-full h-full object-cover"
                    />
                  ) : item.group === "decorative" ? (
                    <Palette className="w-4 h-4 text-amber-600" />
                  ) : item.group === "photos" ? (
                    <ImageIcon className="w-4 h-4 text-rose-500" />
                  ) : item.group === "texts" ? (
                    <Type className="w-4 h-4 text-indigo-500" />
                  ) : (
                    <LayoutGrid className="w-4 h-4 text-emerald-500" />
                  )}
                </div>

                {/* 4. Tên và Thông tin Layer */}
                <div className="flex-1 min-w-0">
                  {editingNameId === item.id ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingNameValue}
                        onChange={(e) => setEditingNameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveRename(item.id);
                          if (e.key === "Escape") setEditingNameId(null);
                        }}
                        autoFocus
                        className="w-full text-xs py-0.5 px-1.5 border border-[#e54153] rounded bg-white font-semibold focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveRename(item.id)}
                        className="p-1 bg-[#e54153] text-white rounded hover:bg-rose-700"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 justify-between">
                      <span
                        className="font-bold text-gray-900 truncate hover:text-[#e54153]"
                        title={item.props.customName || item.name}
                      >
                        {item.props.customName || item.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleStartRename(item, e)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-gray-700 transition-opacity"
                        title="Đổi tên layer"
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}

                  {/* Metadata tags */}
                  <div className="flex items-center gap-1.5 text-[9px] text-gray-400 truncate mt-0.5 font-mono">
                    <span className="text-slate-600 font-semibold">Z:{item.zIndex}</span>
                    <span>•</span>
                    <span>Y:{Math.round(item.top)}px</span>
                    {item.props.opacity !== undefined && item.props.opacity < 1 && (
                      <>
                        <span>•</span>
                        <span className="text-amber-600 font-medium">
                          {Math.round(item.props.opacity * 100)}%
                        </span>
                      </>
                    )}
                    {item.props.blendMode && item.props.blendMode !== "normal" && (
                      <>
                        <span>•</span>
                        <span className="text-indigo-600 font-medium">{item.props.blendMode}</span>
                      </>
                    )}
                    {isDecorative && (
                      <span className="text-[9px] text-amber-700 bg-amber-50 px-1 rounded ml-auto">
                        Mẫu
                      </span>
                    )}
                  </div>
                </div>

                {/* 5. Bộ nút Thao tác Layer trên từng hàng */}
                <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100">
                  {/* Nâng lên 1 bậc */}
                  <button
                    type="button"
                    onClick={(e) => handleBringForward(item, e)}
                    className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-800"
                    title="Nâng lên 1 lớp (Bring Forward)"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  {/* Hạ xuống 1 bậc */}
                  <button
                    type="button"
                    onClick={(e) => handleSendBackward(item, e)}
                    className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-800"
                    title="Hạ xuống 1 lớp (Send Backward)"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>

                  {/* Nhân bản (Duplicate) */}
                  {onDuplicateElement && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateElement(item.id);
                      }}
                      className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-800"
                      title="Nhân bản layer (Ctrl+D)"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  )}

                  {/* Xóa (Delete) */}
                  {onDeleteElement && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteElement(item.id);
                      }}
                      className="p-1 rounded hover:bg-rose-100 text-gray-400 hover:text-[#e54153]"
                      title="Xóa layer này"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Bottom Footer Toolbar (Photoshop Style Actions) */}
      <div className="pt-2 border-t border-gray-200/90 space-y-2 shrink-0">
        <div className="grid grid-cols-3 gap-1.5 text-[10px] font-semibold text-gray-700">
          <button
            type="button"
            onClick={handleLockAll}
            className="py-1 px-2 rounded-lg bg-gray-100 hover:bg-amber-100 hover:text-amber-800 transition-colors flex items-center justify-center gap-1"
            title="Khóa toàn bộ các layer để tránh dịch chuyển nhầm"
          >
            <Lock className="w-3 h-3 text-amber-600" />
            <span>Khóa hết</span>
          </button>
          <button
            type="button"
            onClick={handleUnlockAll}
            className="py-1 px-2 rounded-lg bg-gray-100 hover:bg-emerald-100 hover:text-emerald-800 transition-colors flex items-center justify-center gap-1"
            title="Mở khóa toàn bộ các layer để tự do chỉnh sửa"
          >
            <Unlock className="w-3 h-3 text-emerald-600" />
            <span>Mở hết</span>
          </button>
          <button
            type="button"
            onClick={handleShowAll}
            className="py-1 px-2 rounded-lg bg-gray-100 hover:bg-blue-100 hover:text-blue-800 transition-colors flex items-center justify-center gap-1"
            title="Hiện lại toàn bộ các layer đang bị ẩn"
          >
            <Eye className="w-3 h-3 text-blue-600" />
            <span>Hiện hết</span>
          </button>
        </div>

        {/* Khôi phục chuẩn mẫu */}
        {onRepairDecorations && (
          <button
            type="button"
            onClick={onRepairDecorations}
            className="w-full py-1.5 px-3 rounded-xl bg-white hover:bg-rose-50 border border-gray-200 hover:border-rose-300 text-gray-700 hover:text-[#e54153] text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
            title="Khôi phục chuẩn xác mọi hoa văn và phong bì về vị trí gốc nếu lỡ bị lệch"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
            <span>Khôi phục chuẩn họa tiết trang trí</span>
          </button>
        )}
      </div>
    </div>
  );
}
