"use client";

import React, { useState, useRef } from "react";
import {
  Plus,
  Trash2,
  Copy,
  Layers,
  MoreHorizontal,
  RotateCw,
  Sparkles,
  MapPin,
  Calendar as CalendarIcon,
  Gift,
  Heart,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { SelectedElementData } from "./EditorRightInspector";
import { compressImageToWebP } from "@/lib/imageCompression";

interface EditorCanvasProps {
  nodes: Record<string, any>;
  selectedElement: SelectedElementData | null;
  onSelectElement: (element: SelectedElementData | null) => void;
  onUpdateElementProps: (elementId: string, updatedProps: Record<string, any>) => void;
  onDeleteElement: (elementId: string) => void;
  onDuplicateElement: (elementId: string) => void;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onQuickReplacePhoto: (index: number) => void;
}

export default function EditorCanvas({
  nodes,
  selectedElement,
  onSelectElement,
  onUpdateElementProps,
  onDeleteElement,
  onDuplicateElement,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onQuickReplacePhoto,
}: EditorCanvasProps) {
  const rootNode = nodes["ROOT"] || {};
  const rootProps = rootNode.props || {};

  const canvasWidth = rootProps.width || 500;
  const canvasHeight = rootProps.height || 5270;
  const backgroundColor = rootProps.backgroundColor || "#ffffff";
  const bgImg = rootProps.backgroundImage;
  const backgroundImage = bgImg
    ? (bgImg.startsWith("http") || bgImg.startsWith("blob:") || bgImg.startsWith("data:") || bgImg.startsWith("/uploads") || bgImg.startsWith("/")
        ? bgImg
        : `https://cdn-resource.zenlove.me/${bgImg.replace(/^\//, "")}`)
    : null;

  // Extract all child node entries in proper z-order
  const childNodes = Object.entries(nodes)
    .filter(([id]) => id !== "ROOT")
    .map(([id, node]) => ({
      id,
      type: node.type?.resolvedName || "Widget",
      props: node.props || {},
      zIndex: node.props?.zIndex || 1,
    }))
    .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  // Find all PhotoBox nodes that represent real wedding photos
  const photoCandidates = childNodes.filter(
    (n) => n.type === "PhotoBox" && (n.props.imgKey || n.props.src)
  );
  let photoSlots = [...photoCandidates].sort((a, b) => {
    // Prioritize explicitly replaceable, or hero photos with large width or top position
    const aScore = (a.props.isReplaceable ? 1000 : 0) + ((a.props.width || 0) > 150 ? 500 : 0) - (a.props.top || 0) * 0.05;
    const bScore = (b.props.isReplaceable ? 1000 : 0) + ((b.props.width || 0) > 150 ? 500 : 0) - (b.props.top || 0) * 0.05;
    return bScore - aScore;
  });

  // If none matched, check any node with imgKey
  if (photoSlots.length === 0) {
    const anyImageNodes = Object.entries(nodes)
      .filter(([id, n]) => id !== "ROOT" && (n.props?.imgKey || n.type?.resolvedName === "PhotoBox"))
      .map(([id, n]) => ({ id, type: "PhotoBox", props: n.props || {}, zIndex: n.props?.zIndex || 1 }));
    if (anyImageNodes.length > 0) {
      photoSlots = anyImageNodes;
    }
  }

  // If still none found, provide couple default thumbnails
  if (photoSlots.length === 0) {
    photoSlots = [
      {
        id: "U4ZPPsHPXy",
        type: "PhotoBox",
        props: {
          imgKey:
            "uploads/20ebff90-ba33-4679-b427-52cdb622de1e/trong-nha-3-cuoi/aW1hZ2UtOHdhdGVybWFya2VkXzE3ODA2MDk1NDQ3MTBfN3ltMzBoMjZ0cA.jpg",
        },
        zIndex: 9,
      },
      {
        id: "nc326y93D4",
        type: "PhotoBox",
        props: {
          imgKey:
            "uploads/8a871955-90a1-4541-b4e2-f998447e57fb/ngoai-troi-cay-xanh/TURBd016SXdNalF0TVRJdE1qY3RTMVJoUzJoRVkwZzFhRE15Y0dWcldqUjNSRUpSV21WTmEwVkxkMkp5V1ZsZk1UYzNOVFUxTVRnME56QTFPVjh4ZVRFNFpXRnJkVGc0Tnd3YXRlcm1hcmtlZF8xNzgwMDc2MzU1MzQxX2Fla3ZqcGhzd3M.jpg?crop=0,653,1080,720",
        },
        zIndex: 59,
      },
    ];
  } else if (photoSlots.length > 2) {
    photoSlots = photoSlots.slice(0, 2);
  }

  const getImageUrl = (key: string) => {
    if (!key) return "";
    if (key.startsWith("http") || key.startsWith("blob:") || key.startsWith("data:") || key.startsWith("/uploads") || key.startsWith("/")) return key;
    return `https://cdn-resource.zenlove.me/${key.replace(/^\//, "")}`;
  };

  const quickFileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [isUploadingSlot, setIsUploadingSlot] = useState(false);

  // Drag-to-move and drag-to-rotate states
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initialLeft: number;
    initialTop: number;
    elementId: string;
  } | null>(null);

  const handleMouseDownElement = (e: React.MouseEvent, id: string, props: any, type: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onSelectElement({ id, type, props });

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialLeft: Number(props.left ?? 0),
      initialTop: Number(props.top ?? 0),
      elementId: id,
    };
    setIsDragging(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = (moveEvent.clientX - dragStartRef.current.startX) / zoomLevel;
      const dy = (moveEvent.clientY - dragStartRef.current.startY) / zoomLevel;
      const newLeft = Math.round(dragStartRef.current.initialLeft + dx);
      const newTop = Math.round(dragStartRef.current.initialTop + dy);
      onUpdateElementProps(dragStartRef.current.elementId, {
        left: newLeft,
        top: newTop,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseDownRotate = (e: React.MouseEvent, id: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    const element = document.getElementById(`canvas-node-${id}`);
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    setIsRotating(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const rad = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
      let deg = Math.round((rad * 180) / Math.PI) - 90;
      if (deg < 0) deg += 360;
      onUpdateElementProps(id, { rotation: deg });
    };

    const handleMouseUp = () => {
      setIsRotating(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleSlotClick = (slot: any) => {
    setActiveSlotId(slot.id);
    onSelectElement({ id: slot.id, type: "PhotoBox", props: slot.props || {} });
    if (quickFileInputRef.current) {
      quickFileInputRef.current.value = "";
      quickFileInputRef.current.click();
    }
  };

  const handleQuickFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeSlotId) return;

    try {
      setIsUploadingSlot(true);
      const compressed = await compressImageToWebP(file, { maxDimension: 1600, quality: 0.82 });
      const formData = new FormData();
      formData.append("file", compressed.file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      let uploadedUrl = compressed.dataUrl;
      if (res.ok) {
        const json = await res.json();
        if (json.url) uploadedUrl = json.url;
      }

      onUpdateElementProps(activeSlotId, { imgKey: uploadedUrl, src: uploadedUrl });
      onSelectElement({
        id: activeSlotId,
        type: "PhotoBox",
        props: { ...(nodes[activeSlotId]?.props || {}), imgKey: uploadedUrl, src: uploadedUrl },
      });
    } catch (err) {
      console.error("Lỗi thay ảnh nhanh:", err);
      const localUrl = URL.createObjectURL(file);
      onUpdateElementProps(activeSlotId, { imgKey: localUrl, src: localUrl });
    } finally {
      setIsUploadingSlot(false);
      if (quickFileInputRef.current) quickFileInputRef.current.value = "";
    }
  };

  return (
    <div
      className="flex-1 h-full overflow-auto relative flex items-start justify-center p-4 sm:p-8 select-none bg-[#dedfe2]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onSelectElement(null);
        }
      }}
    >
      {/* ================= INVITATION CANVAS CONTAINER ================= */}
      <div
        className="relative bg-[#fbf8f2] shadow-[0_20px_50px_rgba(0,0,0,0.18)] rounded-xs overflow-hidden transition-transform duration-100 origin-top shrink-0"
        style={{
          width: `${canvasWidth}px`,
          minHeight: `${canvasHeight}px`,
          backgroundColor: backgroundColor || "#fbf8f2",
          backgroundImage: backgroundImage
            ? `url("${backgroundImage}")`
            : undefined,
          backgroundSize: "100% auto",
          backgroundRepeat: "repeat-y",
          transform: `scale(${zoomLevel})`,
        }}
      >
        {/* Blueprint Graph Grid Overlay (Matches screenshot: visible on entire card) */}
        <div
          className="absolute inset-0 pointer-events-none z-[5] canvas-blueprint-grid opacity-70"
          aria-hidden="true"
        />

        {/* Render child elements */}
        {childNodes.map((child) => {
          const { id, type, props } = child;

          const top = props.top ?? 0;
          const left = props.left ?? 0;
          const width = props.width ?? 100;
          const height = props.height ?? 100;
          const rotation = props.rotation ?? 0;
          const opacity = props.opacity ?? 1;
          const zIndex = props.zIndex ?? 1;

          // Continuous animation class
          let animClass = "";
          if (props.continuousAnimation?.type === "float") {
            animClass = "animate-zen-float";
          } else if (props.continuousAnimation?.type === "bounce") {
            animClass = "animate-zen-bounce";
          } else if (props.continuousAnimation?.type === "wobble") {
            animClass = "animate-zen-wobble";
          } else if (props.continuousAnimation?.type === "pulse") {
            animClass = "animate-zen-pulse";
          } else if (props.continuousAnimation?.type === "wiggle") {
            animClass = "animate-zen-wiggle";
          } else if (props.continuousAnimation?.type === "shake") {
            animClass = "animate-zen-shake";
          }

          return (
            <div
              key={id}
              id={`canvas-node-${id}`}
              onMouseDown={(e) => handleMouseDownElement(e, id, props, type)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectElement({ id, type, props });
              }}
              className={`absolute group select-none ${
                selectedElement?.id === id
                  ? "cursor-grab active:cursor-grabbing ring-1 ring-[#e54153]/40"
                  : "cursor-pointer hover:ring-1 hover:ring-gray-300/60"
              }`}
              style={{
                top: `${top}px`,
                left: `${left}px`,
                width: `${width}px`,
                height: `${height}px`,
                transform: `rotate(${rotation}deg)`,
                opacity: opacity,
                zIndex: zIndex,
              }}
            >
              {/* Element Content by Type */}
              {type === "PhotoBox" && props.imgKey && (
                <div
                  className={`w-full h-full overflow-hidden ${animClass}`}
                  style={{
                    borderRadius: props.borderRadius
                      ? `${props.borderRadius[0]}px`
                      : "0px",
                    border: props.borderSize
                      ? `${props.borderSize}px ${props.borderStyle || "solid"} ${props.borderColor || "#ffffff"}`
                      : undefined,
                    boxShadow: props.hasBoxShadow
                      ? `${props.boxShadow?.offsetX || 0}px ${props.boxShadow?.offsetY || 4}px ${props.boxShadow?.blur || 10}px ${props.boxShadow?.color || "rgba(0,0,0,0.15)"}`
                      : undefined,
                    transform: `scaleX(${props.flipX ? -1 : 1}) scaleY(${
                      props.flipY ? -1 : 1
                    })`,
                  }}
                >
                  <img
                    src={getImageUrl(props.imgKey)}
                    alt={props.alt || ""}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600";
                    }}
                    className="w-full h-full object-cover pointer-events-none select-none transition-all duration-300"
                    style={{
                      filter: props.filterStyle || undefined,
                    }}
                    draggable={false}
                  />
                </div>
              )}

              {type === "TextBox" && (
                <div
                  className={`w-full h-full select-none ${animClass} ${
                    props.fontFamily && props.fontFamily.startsWith("font-")
                      ? props.fontFamily
                      : ""
                  }`}
                  style={{
                    fontFamily:
                      props.fontFamily && !props.fontFamily.startsWith("font-")
                        ? props.fontFamily
                        : undefined,
                    fontSize: `${props.fontSize || 20}px`,
                    color: props.color || "#1c171a",
                    fontWeight: props.fontWeight || "normal",
                    fontStyle: props.fontStyle || "normal",
                    textAlign: props.textAlign || "left",
                    lineHeight: props.lineHeight ? `${props.lineHeight}` : "1.2",
                    letterSpacing: props.letterSpacing
                      ? `${props.letterSpacing}px`
                      : "normal",
                    textShadow: props.hasTextShadow && props.textShadow
                      ? `${props.textShadow.offsetX || 0}px ${props.textShadow.offsetY || 1}px ${props.textShadow.blur || 4}px ${props.textShadow.color || "rgba(0,0,0,0.5)"}`
                      : undefined,
                  }}
                  dangerouslySetInnerHTML={{ __html: props.text || "" }}
                />
              )}

              {type === "GeometricBox" && (
                <div
                  className={`w-full h-full ${animClass}`}
                  style={{
                    backgroundColor: props.fill || props.backgroundColor || "transparent",
                    borderRadius: props.borderRadius
                      ? Array.isArray(props.borderRadius)
                        ? `${props.borderRadius[0]}px`
                        : `${props.borderRadius}px`
                      : props.shapeType === "circle"
                      ? "50%"
                      : "0px",
                    border: props.borderSize
                      ? `${props.borderSize}px ${props.borderStyle || "solid"} ${props.borderColor || "transparent"}`
                      : undefined,
                    boxShadow: props.hasBoxShadow
                      ? `${props.boxShadow?.offsetX || 0}px ${props.boxShadow?.offsetY || 4}px ${props.boxShadow?.blur || 10}px ${props.boxShadow?.color || "rgba(0,0,0,0.15)"}`
                      : undefined,
                    opacity: props.opacity ?? 1,
                  }}
                />
              )}

              {type === "CarouselBox" && (
                <div
                  className={`w-full h-full overflow-hidden relative shadow-lg ${animClass}`}
                  style={{
                    borderRadius: props.borderRadius
                      ? Array.isArray(props.borderRadius)
                        ? `${props.borderRadius[0]}px`
                        : `${props.borderRadius}px`
                      : "24px",
                  }}
                >
                  {props.imgList && props.imgList.length > 0 ? (
                    <img
                      src={getImageUrl(props.imgList[0]?.imageKey || props.imgList[0]?.src)}
                      alt="Wedding Album Carousel"
                      className="w-full h-full object-cover select-none pointer-events-none"
                      draggable={false}
                    />
                  ) : (
                    <div className="w-full h-full bg-rose-50 flex items-center justify-center text-xs font-semibold text-gray-500">
                      Album ảnh cưới (Carousel)
                    </div>
                  )}
                  {props.imgList && props.imgList.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-xs">
                      {props.imgList.slice(0, 5).map((_: any, idx: number) => (
                        <span
                          key={idx}
                          className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? "bg-white" : "bg-white/50"}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {type === "LineBox" && (
                <div
                  className="w-full h-full"
                  style={{
                    backgroundColor:
                      props.fill || props.borderColor || "#e2e8f0",
                  }}
                />
              )}

              {type === "CountdownBoxV2" && (
                <div className="w-full h-full flex items-center justify-around p-3 bg-white/20 backdrop-blur-xs rounded-xl border border-stone-200/50 text-center">
                  {[
                    { val: "28", label: "Ngày" },
                    { val: "14", label: "Giờ" },
                    { val: "36", label: "Phút" },
                    { val: "50", label: "Giây" },
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <span className="text-xl font-black font-serif text-[#590310]">
                        {item.val}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-gray-600">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {type === "CalendarBoxV2" && (
                <div className="w-full h-full p-4 rounded-3xl bg-amber-50/40 border border-amber-200/40 flex flex-col justify-center items-center text-center">
                  <span className="text-xs uppercase font-bold text-[#590310] tracking-widest">
                    Tháng 12 • 2026
                  </span>
                  <div className="text-4xl font-serif font-black text-[#590310] my-2">
                    29
                  </div>
                  <span className="text-xs text-gray-700">Thứ Ba • 16:30</span>
                </div>
              )}

              {type === "ReminderBox" && (
                <div className="w-full h-full rounded-full bg-[#ece4d8] text-[#590310] flex items-center justify-center font-bold text-sm shadow-sm gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{props.text || "Thêm vào lịch"}</span>
                </div>
              )}

              {type === "GiftQrBox" && (
                <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                  {props.imgKey && (
                    <img
                      src={getImageUrl(props.imgKey)}
                      alt="Gift"
                      className="w-24 h-24 object-contain animate-bounce"
                    />
                  )}
                  <span className="text-xs font-bold text-[#590310] mt-1">
                    {props.modalTitle || "Hộp Quà Yêu Thương"}
                  </span>
                </div>
              )}

              {type === "RsvpBoxV2" && (
                <div className="w-full h-full p-5 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between text-left">
                  <h4 className="font-bold text-base text-[#511419] font-serif">
                    {props.titleText || "Xác nhận tham dự"}
                  </h4>
                  <div className="space-y-2 text-xs">
                    <input
                      type="text"
                      placeholder="Họ và tên của bạn"
                      className="w-full p-2 rounded-lg border border-gray-200 text-xs"
                    />
                    <div className="flex gap-2">
                      <button className="flex-1 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">
                        Sẽ tham dự
                      </button>
                      <button className="flex-1 py-1.5 rounded-lg bg-gray-50 text-gray-600 border border-gray-200 font-semibold text-[11px]">
                        Không thể dự
                      </button>
                    </div>
                  </div>
                  <button className="w-full py-2 rounded-lg bg-[#511419] text-white font-bold text-xs">
                    Gửi xác nhận
                  </button>
                </div>
              )}

              {type === "MapBox" && (
                <div className="w-full h-full rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center text-center p-4 relative">
                  <div className="flex flex-col items-center gap-1 text-gray-600">
                    <MapPin className="w-6 h-6 text-red-500 animate-pulse" />
                    <span className="text-xs font-bold text-gray-800">
                      Bản đồ chỉ đường
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {props.address || "ZenLove Wedding Palace"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* ================= SELECTION OVERLAY (Z-Index 50: Always on top of all canvas layers) ================= */}
        {selectedElement && (() => {
          const node = nodes[selectedElement.id];
          if (!node) return null;
          const p = node.props || {};
          const top = p.top ?? 0;
          const left = p.left ?? 0;
          const width = p.width ?? 100;
          const height = p.height ?? 100;
          const rotation = p.rotation ?? 0;

          return (
            <div
              className="absolute pointer-events-none border border-[#e54153] z-50 select-none"
              style={{
                top: `${top}px`,
                left: `${left}px`,
                width: `${width}px`,
                height: `${height}px`,
                transform: `rotate(${rotation}deg)`,
              }}
            >
              {/* Drag Move Hit Area (Border edges allow direct dragging) */}
              <div
                onMouseDown={(e) => handleMouseDownElement(e, selectedElement.id, p, selectedElement.type)}
                className="absolute inset-0 pointer-events-auto cursor-move"
                title="Giữ chuột và kéo để di chuyển vị trí"
              />

              {/* 4 Corner handles (Red L-brackets) */}
              <div className="absolute -top-1 -left-1 w-3.5 h-3.5 border-t-2 border-l-2 border-[#e54153] pointer-events-none" />
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 border-t-2 border-r-2 border-[#e54153] pointer-events-none" />
              <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 border-b-2 border-l-2 border-[#e54153] pointer-events-none" />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 border-b-2 border-r-2 border-[#e54153] pointer-events-none" />

              {/* Real-time coordinates tooltip when moving/rotating */}
              {(isDragging || isRotating) && (
                <div
                  className="absolute -bottom-14 left-1/2 pointer-events-none bg-gray-900/90 text-white text-[10px] font-mono px-2 py-0.5 rounded-md shadow-md whitespace-nowrap z-50"
                  style={{
                    transform: `translate(-50%, 0) rotate(${-rotation}deg)`,
                    transformOrigin: "center center",
                  }}
                >
                  {isRotating ? `Góc xoay: ${rotation}°` : `X: ${left}px • Y: ${top}px`}
                </div>
              )}

              {/* Top Floating Mini-Toolbar (Counter-rotated to remain horizontal) */}
              <div
                className="absolute -top-11 left-1/2 pointer-events-auto bg-white rounded-lg shadow-md border border-gray-200 flex items-center px-1.5 py-1 gap-1.5 z-50"
                style={{
                  transform: `translate(-50%, 0) rotate(${-rotation}deg)`,
                  transformOrigin: "center center",
                }}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateElement(selectedElement.id);
                  }}
                  className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                  title="Nhân bản"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteElement(selectedElement.id);
                  }}
                  className="p-1 hover:bg-red-50 rounded text-gray-600 hover:text-[#e54153] transition-colors cursor-pointer"
                  title="Xóa phần tử"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const currentZ = Number(p.zIndex) || 1;
                    onUpdateElementProps(selectedElement.id, { zIndex: currentZ + 1 });
                  }}
                  className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                  title="Đưa lên lớp trên (+1)"
                >
                  <Layers className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateElementProps(selectedElement.id, {
                      left: Math.round((canvasWidth - (p.width || 100)) / 2),
                    });
                  }}
                  className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors cursor-pointer text-[10px] font-bold px-1"
                  title="Căn giữa thiệp"
                >
                  Căn giữa
                </button>
              </div>

              {/* Bottom Rotation Handle */}
              <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center z-50">
                <div className="w-px h-3.5 bg-[#e54153]" />
                <div
                  onMouseDown={(e) => handleMouseDownRotate(e, selectedElement.id)}
                  className="w-5 h-5 rounded-full bg-white border border-gray-300 shadow-sm flex items-center justify-center cursor-grab active:cursor-grabbing text-gray-700 hover:text-[#e54153] hover:scale-110 transition-transform"
                  title="Kéo chuột để xoay phần tử"
                >
                  <RotateCw className="w-3 h-3" />
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ================= FLOATING RIGHT ZOOM CONTROLS (Matches screenshot!) ================= */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col bg-white rounded-full shadow-md border border-gray-200 overflow-hidden z-40">
        <button
          type="button"
          onClick={onZoomIn}
          className="p-2 hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors flex items-center justify-center"
          title="Phóng to"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onResetZoom}
          className="px-2 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-50 text-center"
          title="Đặt lại 100%"
        >
          {Math.round(zoomLevel * 100)}%
        </button>
        <button
          type="button"
          onClick={onZoomOut}
          className="p-2 hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors flex items-center justify-center"
          title="Thu nhỏ"
        >
          <span className="font-bold text-xs block leading-none text-center">−</span>
        </button>
      </div>

      {/* ================= FLOATING BOTTOM-LEFT: THAY ẢNH NHANH (2) ⤹ (Matches screenshot!) ================= */}
      <div className="absolute bottom-4 left-6 z-40 bg-white rounded-xl shadow-lg border border-gray-200 p-2.5 flex flex-col gap-1.5 pointer-events-auto">
        <span className="text-[12px] font-semibold text-gray-700 flex items-center justify-between">
          <span>Thay ảnh nhanh ({photoSlots.length}) ⤹</span>
          {isUploadingSlot && <Loader2 className="w-3 h-3 text-[#e54153] animate-spin" />}
        </span>
        <div className="flex items-center gap-2">
          {photoSlots.map((slot, i) => {
            const isThisLoading = isUploadingSlot && activeSlotId === slot.id;
            return (
              <button
                key={slot.id || i}
                type="button"
                onClick={() => handleSlotClick(slot)}
                disabled={isUploadingSlot}
                className="w-12 h-14 rounded-lg overflow-hidden border border-gray-200 hover:border-[#e54153] shadow-xs relative group transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                title={`Nhấn để chọn và thay thế ảnh cưới #${i + 1} từ máy tính`}
              >
                <img
                  src={getImageUrl(slot.props?.imgKey)}
                  alt="Couple Slot"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=200";
                  }}
                  className="w-full h-full object-cover"
                />
                {/* Small swap icon badge in bottom-right corner */}
                <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-white/90 border border-gray-300 shadow-2xs flex items-center justify-center text-gray-700 group-hover:bg-[#e54153] group-hover:text-white transition-colors">
                  {isThisLoading ? (
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  ) : (
                    <RotateCw className="w-2.5 h-2.5" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <input
          ref={quickFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleQuickFileChange}
        />
      </div>

      {/* ================= FLOATING BOTTOM-RIGHT: AI COLOR (Matches screenshot!) ================= */}
      <div className="absolute bottom-4 right-6 z-40 pointer-events-auto">
        <button
          type="button"
          className="px-4 py-2 rounded-full bg-white text-gray-700 hover:text-[#e54153] border border-gray-200 shadow-md text-xs font-semibold flex items-center gap-1.5 transition-transform hover:scale-105 active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
          <span>AI Color</span>
        </button>
      </div>
    </div>
  );
}
