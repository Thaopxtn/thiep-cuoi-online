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
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Upload,
  UploadCloud,
  Lock,
  Unlock,
  Magnet,
  Edit3,
  X,
  CreditCard,
  QrCode,
  Phone,
  MessageCircle,
  Crown,
} from "lucide-react";
import { SelectedElementData } from "./EditorRightInspector";
import EditorTopContextualBar from "./EditorTopContextualBar";
import EditorContextMenu from "./EditorContextMenu";
import EditorBottomBar from "./EditorBottomBar";
import { compressImageToWebP } from "@/lib/imageCompression";
import {  addUploadedImageToLibrary, addUploadedImagesToLibrary , uploadFileToServer } from "@/lib/mediaLibraryService";
import {
  getSafeImageUrl,
  handleImageFallback,
  FALLBACK_WEDDING_IMG,
  DEFAULT_WEDDING_BACKGROUND,
  isDecorativeAsset,
} from "@/lib/imageUtils";
import { isDecorativeNode, isElementLocked, getRealWeddingPhotoSlots } from "@/lib/decorativeLockService";
import { calculateCountdown, formatCalendarData, getModuleRenderHtml, getGiftQrUrl, getSafeMapUrl } from "@/lib/moduleHelpers";
import { generateVietQrUrl } from "@/lib/vietQrBankCodes";
import { ANIMATION_KEYFRAME_MAP } from "@/lib/animationCatalog";

import { WeddingCard } from "@/data/initialCards";
import EditorFixedModulesCanvas from "./EditorFixedModulesCanvas";
import { FixedModuleId } from "./EditorFixedModuleEditModal";

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
  onSetZoomLevel?: (zoom: number) => void;
  onFitToScreen?: () => void;
  onQuickReplacePhoto: (index: number) => void;
  onOpenImageDrawer?: () => void;
  onRemoveBackground?: () => void;
  onOpenManualCutout?: () => void;
  onOpenPreview?: () => void;
  onOpenShortcuts?: () => void;
  isLeftDrawerOpen?: boolean;
  card?: WeddingCard | null;
  onOpenFixedModulesTab?: () => void;
  onToggleFixedModule?: (key: keyof WeddingCard, value: boolean) => void;
  onOpenSettings?: () => void;
  onOpenModuleConfig?: (moduleId: FixedModuleId) => void;
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
  onSetZoomLevel,
  onFitToScreen,
  onQuickReplacePhoto,
  onOpenImageDrawer,
  onRemoveBackground,
  onOpenManualCutout,
  onOpenPreview,
  onOpenShortcuts,
  isLeftDrawerOpen = false,
  card,
  onOpenFixedModulesTab,
  onToggleFixedModule,
  onOpenSettings,
  onOpenModuleConfig,
}: EditorCanvasProps) {
  const rootNode = nodes["ROOT"] || {};
  const rootProps = rootNode.props || {};

  const canvasWidth = rootProps.width || 500;

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

  // Tự động tính toán chiều cao canvas an toàn dựa trên phần tử ở đáy thấp nhất
  const maxChildBottom = childNodes.reduce((max, child) => {
    const top = Number(child.props?.top ?? 0);
    const rawH = child.props?.height;
    const height = typeof rawH === "number" ? rawH : parseFloat(rawH) || 120;
    return Math.max(max, top + height);
  }, 0);

  const canvasHeight = Math.max(
    Number(rootProps.height || 0),
    maxChildBottom + 160,
    1400
  );

  const backgroundColor = rootProps.backgroundColor || "#ffffff";
  const bgImg = rootProps.backgroundImage;
  const rawBg = bgImg ? getSafeImageUrl(bgImg, "") : "";
  const backgroundImage =
    rawBg && rawBg.trim().length > 0 && !rawBg.endsWith("/none")
      ? rawBg
      : DEFAULT_WEDDING_BACKGROUND;


  // Track replaced photo slot IDs and panel state
  const [replacedSlotIds, setReplacedSlotIds] = useState<Set<string>>(new Set());
  const [isQuickPanelCollapsed, setIsQuickPanelCollapsed] = useState(false);
  const quickScrollRef = useRef<HTMLDivElement>(null);
  const initialSlotImagesRef = useRef<Record<string, string>>({});

  // Canva Design Tools State
  const [isGridVisible, setIsGridVisible] = useState(true);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    element: SelectedElementData | null;
  } | null>(null);
  const [inlineEditNode, setInlineEditNode] = useState<{ id: string; text: string } | null>(null);

  // 1-second live ticker for real-time countdown
  const [, setLiveTick] = useState(0);
  React.useEffect(() => {
    const timer = setInterval(() => setLiveTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Danh sách các khung ảnh cưới THỰC SỰ trong template (loại trừ 100% họa tiết trang trí)
  const photoSlots = React.useMemo(() => {
    return getRealWeddingPhotoSlots(nodes);
  }, [nodes]);

  // Record initial image URLs to detect changes
  React.useEffect(() => {
    photoSlots.forEach((slot) => {
      const img = slot.props?.imgKey || slot.props?.src || "";
      if (img && !initialSlotImagesRef.current[slot.id]) {
        initialSlotImagesRef.current[slot.id] = img;
      }
    });
  }, [photoSlots]);

  // Check if a photo slot has been successfully replaced
  const isSlotReplaced = (slot: any) => {
    if (replacedSlotIds.has(slot.id)) return true;
    const initialImg = initialSlotImagesRef.current[slot.id];
    const currentImg = (slot.props?.imgKey || slot.props?.src || "").trim();
    if (initialImg && currentImg && initialImg !== currentImg) return true;
    if (currentImg.startsWith("blob:") || currentImg.startsWith("data:")) return true;
    return false;
  };

  const replacedCount = photoSlots.filter(isSlotReplaced).length;

  // Calculate thumbnail dimensions based on actual aspect ratio of photo box
  const getSlotDimensions = (slot: any) => {
    const rawW = Number(slot.props?.width) || 100;
    const rawH = Number(slot.props?.height) || 120;
    const ratio = Math.max(0.4, Math.min(2.5, rawW / rawH));
    const baseHeight = 58;
    let width = Math.round(baseHeight * ratio);
    width = Math.max(44, Math.min(94, width));
    return {
      width,
      height: baseHeight,
      ratioLabel: ratio > 1.25 ? "Ngang" : ratio < 0.8 ? "Dọc" : "Vuông",
    };
  };

  const scrollQuickPanel = (direction: "left" | "right") => {
    if (quickScrollRef.current) {
      quickScrollRef.current.scrollBy({
        left: direction === "left" ? -180 : 180,
        behavior: "smooth",
      });
    }
  };

  const getImageUrl = (key: string) => {
    return getSafeImageUrl(key, "");
  };

  const quickFileInputRef = useRef<HTMLInputElement>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);
  const activeSlotIdRef = useRef<string | null>(null);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [barActiveSlotId, setBarActiveSlotId] = useState<string | null>(null);
  const [isUploadingSlot, setIsUploadingSlot] = useState(false);
  const [isBatchUploading, setIsBatchUploading] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [batchMessage, setBatchMessage] = useState<string | null>(null);

  // Drag-to-move and drag-to-rotate states
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  // Magnetic Smart Snapping states
  const [isSnappingEnabled, setIsSnappingEnabled] = useState(true);
  const [activeSnapGuides, setActiveSnapGuides] = useState<{
    vertical?: number;
    horizontal?: number;
    labelV?: string;
    labelH?: string;
  } | null>(null);

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

    // Không cho phép kéo di chuyển nếu phần tử bị khóa (mặc định các họa tiết bị khóa, trừ khi đã mở khóa)
    if (isElementLocked(id, props, nodes[id])) {
      return;
    }

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
      let newLeft = Math.round(dragStartRef.current.initialLeft + dx);
      let newTop = Math.round(dragStartRef.current.initialTop + dy);

      let guideV: number | undefined = undefined;
      let guideH: number | undefined = undefined;
      let guideLabelV: string | undefined = undefined;
      let guideLabelH: string | undefined = undefined;

      if (isSnappingEnabled) {
        const elemW = Number(props.width ?? 100);
        const elemH = Number(props.height ?? 100);
        const elemCenterX = newLeft + elemW / 2;

        // 1. Snap Trục X (Tâm canvas = 250px & Lề chuẩn)
        if (Math.abs(elemCenterX - 250) <= 8) {
          newLeft = Math.round(250 - elemW / 2);
          guideV = 250;
          guideLabelV = "Căn giữa (250px)";
        } else if (Math.abs(newLeft - 30) <= 6) {
          newLeft = 30;
          guideV = 30;
          guideLabelV = "Lề trái (30px)";
        } else if (Math.abs(newLeft + elemW - 470) <= 6) {
          newLeft = 470 - elemW;
          guideV = 470;
          guideLabelV = "Lề phải (470px)";
        }

        // 2. Snap Trục Y (Dính đáy khối phía trên hoặc ngang hàng)
        const otherNodes = childNodes.filter((c) => c.id !== id && !isDecorativeNode(c.id, nodes[c.id]));
        for (const other of otherNodes) {
          const oTop = Number(other.props.top ?? 0);
          const oH = Number(other.props.height ?? 100);
          const oBottom = oTop + oH;

          // Dính vào đáy khối trước với khoảng cách chuẩn 20px hoặc 12px
          if (Math.abs(newTop - (oBottom + 20)) <= 8) {
            newTop = oBottom + 20;
            guideH = newTop;
            guideLabelH = "Dính cách 20px";
            break;
          } else if (Math.abs(newTop - (oBottom + 12)) <= 6) {
            newTop = oBottom + 12;
            guideH = newTop;
            guideLabelH = "Dính cách 12px";
            break;
          } else if (Math.abs(newTop - oTop) <= 6) {
            newTop = oTop;
            guideH = oTop;
            guideLabelH = "Ngang đỉnh";
            break;
          } else if (Math.abs(newTop + elemH - oBottom) <= 6) {
            newTop = oBottom - elemH;
            guideH = oBottom;
            guideLabelH = "Ngang đáy";
            break;
          }
        }
      }

      setActiveSnapGuides(
        guideV !== undefined || guideH !== undefined
          ? { vertical: guideV, horizontal: guideH, labelV: guideLabelV, labelH: guideLabelH }
          : null
      );

      onUpdateElementProps(dragStartRef.current.elementId, {
        left: newLeft,
        top: newTop,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      setActiveSnapGuides(null);
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

  // 8-Point Canvas Resize Logic
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef<{
    startX: number;
    startY: number;
    initialLeft: number;
    initialTop: number;
    initialWidth: number;
    initialHeight: number;
    elementId: string;
    direction: string;
    rotation: number;
  } | null>(null);

  const handleMouseDownResize = (
    e: React.MouseEvent,
    id: string,
    direction: "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w",
    currentProps: any
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    const initialLeft = Number(currentProps.left ?? 0);
    const initialTop = Number(currentProps.top ?? 0);
    const initialWidth = Number(currentProps.width ?? 100);
    const initialHeight = Number(currentProps.height ?? 100);
    const rotation = Number(currentProps.rotation ?? 0);

    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialLeft,
      initialTop,
      initialWidth,
      initialHeight,
      elementId: id,
      direction,
      rotation,
    };
    setIsResizing(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizeStartRef.current) return;
      const ref = resizeStartRef.current;

      let dx = (moveEvent.clientX - ref.startX) / zoomLevel;
      let dy = (moveEvent.clientY - ref.startY) / zoomLevel;

      if (ref.rotation !== 0) {
        const rad = (-ref.rotation * Math.PI) / 180;
        const rotatedDx = dx * Math.cos(rad) - dy * Math.sin(rad);
        const rotatedDy = dx * Math.sin(rad) + dy * Math.cos(rad);
        dx = rotatedDx;
        dy = rotatedDy;
      }

      let newWidth = ref.initialWidth;
      let newHeight = ref.initialHeight;
      let newLeft = ref.initialLeft;
      let newTop = ref.initialTop;

      const minSize = 20;

      if (direction.includes("e")) {
        newWidth = Math.max(minSize, Math.round(ref.initialWidth + dx));
      }
      if (direction.includes("s")) {
        newHeight = Math.max(minSize, Math.round(ref.initialHeight + dy));
      }
      if (direction.includes("w")) {
        const potentialWidth = Math.max(minSize, Math.round(ref.initialWidth - dx));
        newLeft = Math.round(ref.initialLeft + (ref.initialWidth - potentialWidth));
        newWidth = potentialWidth;
      }
      if (direction.includes("n")) {
        const potentialHeight = Math.max(minSize, Math.round(ref.initialHeight - dy));
        newTop = Math.round(ref.initialTop + (ref.initialHeight - potentialHeight));
        newHeight = potentialHeight;
      }

      onUpdateElementProps(ref.elementId, {
        width: newWidth,
        height: newHeight,
        left: newLeft,
        top: newTop,
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Touch Event Handlers for iPad & Mobile Touchscreens
  const handleTouchStartElement = (e: React.TouchEvent, id: string, props: any, type: string) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    onSelectElement({ id, type, props });

    // Không cho phép chạm kéo di chuyển nếu phần tử bị khóa (mặc định các họa tiết bị khóa, trừ khi đã mở khóa)
    if (isElementLocked(id, nodes[id])) {
      return;
    }

    dragStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initialLeft: Number(props.left ?? 0),
      initialTop: Number(props.top ?? 0),
      elementId: id,
    };
    setIsDragging(true);

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!dragStartRef.current || moveEvent.touches.length !== 1) return;
      const t = moveEvent.touches[0];
      const dx = (t.clientX - dragStartRef.current.startX) / zoomLevel;
      const dy = (t.clientY - dragStartRef.current.startY) / zoomLevel;
      const newLeft = Math.round(dragStartRef.current.initialLeft + dx);
      const newTop = Math.round(dragStartRef.current.initialTop + dy);
      onUpdateElementProps(dragStartRef.current.elementId, {
        left: newLeft,
        top: newTop,
      });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };

    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
  };

  const handleTouchStartRotate = (e: React.TouchEvent, id: string) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const element = document.getElementById(`canvas-node-${id}`);
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    setIsRotating(true);

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.touches.length !== 1) return;
      const t = moveEvent.touches[0];
      const rad = Math.atan2(t.clientY - centerY, t.clientX - centerX);
      let deg = Math.round((rad * 180) / Math.PI) - 90;
      if (deg < 0) deg += 360;
      onUpdateElementProps(id, { rotation: deg });
    };

    const handleTouchEnd = () => {
      setIsRotating(false);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };

    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
  };

  const handleTouchStartResize = (
    e: React.TouchEvent,
    id: string,
    direction: "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w",
    currentProps: any
  ) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];

    const initialLeft = Number(currentProps.left ?? 0);
    const initialTop = Number(currentProps.top ?? 0);
    const initialWidth = Number(currentProps.width ?? 100);
    const initialHeight = Number(currentProps.height ?? 100);
    const rotation = Number(currentProps.rotation ?? 0);

    resizeStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initialLeft,
      initialTop,
      initialWidth,
      initialHeight,
      elementId: id,
      direction,
      rotation,
    };
    setIsResizing(true);

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!resizeStartRef.current || moveEvent.touches.length !== 1) return;
      const t = moveEvent.touches[0];
      const ref = resizeStartRef.current;

      let dx = (t.clientX - ref.startX) / zoomLevel;
      let dy = (t.clientY - ref.startY) / zoomLevel;

      if (ref.rotation !== 0) {
        const rad = (-ref.rotation * Math.PI) / 180;
        const rotatedDx = dx * Math.cos(rad) - dy * Math.sin(rad);
        const rotatedDy = dx * Math.sin(rad) + dy * Math.cos(rad);
        dx = rotatedDx;
        dy = rotatedDy;
      }

      let newWidth = ref.initialWidth;
      let newHeight = ref.initialHeight;
      let newLeft = ref.initialLeft;
      let newTop = ref.initialTop;

      const minSize = 20;

      if (direction.includes("e")) {
        newWidth = Math.max(minSize, Math.round(ref.initialWidth + dx));
      }
      if (direction.includes("s")) {
        newHeight = Math.max(minSize, Math.round(ref.initialHeight + dy));
      }
      if (direction.includes("w")) {
        const potentialWidth = Math.max(minSize, Math.round(ref.initialWidth - dx));
        newLeft = Math.round(ref.initialLeft + (ref.initialWidth - potentialWidth));
        newWidth = potentialWidth;
      }
      if (direction.includes("n")) {
        const potentialHeight = Math.max(minSize, Math.round(ref.initialHeight - dy));
        newTop = Math.round(ref.initialTop + (ref.initialHeight - potentialHeight));
        newHeight = potentialHeight;
      }

      onUpdateElementProps(ref.elementId, {
        width: newWidth,
        height: newHeight,
        left: newLeft,
        top: newTop,
      });
    };

    const handleTouchEnd = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };

    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
  };

  // Đồng bộ activeSlotId khi người dùng chọn/bỏ chọn phần tử trên canvas
  React.useEffect(() => {
    if (selectedElement && selectedElement.type === "PhotoBox") {
      setActiveSlotId(selectedElement.id);
      activeSlotIdRef.current = selectedElement.id;
    } else {
      setActiveSlotId(null);
      activeSlotIdRef.current = null;
      setBarActiveSlotId(null);
    }
  }, [selectedElement]);

  const handleSlotClick = (slot: any) => {
    // Kiểm tra xem ô ảnh này ĐÃ ĐƯỢC BẤM LẦN 1 TRÊN THANH NÀY hay chưa
    const isSecondClick = barActiveSlotId === slot.id;

    if (isSecondClick) {
      // === BẤM LẦN 2: CHỌN ẢNH TỪ MÁY TÍNH ===
      activeSlotIdRef.current = slot.id;
      setActiveSlotId(slot.id);
      if (quickFileInputRef.current) {
        quickFileInputRef.current.value = "";
        quickFileInputRef.current.click();
      }
      return;
    }

    // === BẤM LẦN 1: CHỌN ẢNH ĐÓ ĐỂ CÓ THỂ CHỌN ẢNH SẴN CÓ BÊN TRÁI ===
    setBarActiveSlotId(slot.id);
    activeSlotIdRef.current = slot.id;
    setActiveSlotId(slot.id);
    onSelectElement({ id: slot.id, type: "PhotoBox", props: slot.props || {} });

    // Tự động cuộn canvas đến chính giữa vị trí ảnh được chọn trên thiệp
    const element = document.getElementById(`canvas-node-${slot.id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    // Tự động mở ngăn thư viện "Hình ảnh" có sẵn bên trái
    onOpenImageDrawer?.();
  };

  const handleQuickFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetSlotId = activeSlotIdRef.current || activeSlotId;
    if (!file || !targetSlotId) return;

    try {
      setIsUploadingSlot(true);
      const compressed = await compressImageToWebP(file, { maxDimension: 1600, quality: 0.82 });
      const formData = new FormData();
      formData.append("file", compressed.file);

      const res = await uploadFileToServer(formData);
      let uploadedUrl = compressed.dataUrl;
      if (res.ok) {
        const json = await res.json();
        if (json.url) uploadedUrl = json.url;
      }

      // Tự động lưu ảnh thay thế vào Thư viện ảnh đã tải lên
      addUploadedImageToLibrary(uploadedUrl);

      onUpdateElementProps(targetSlotId, { imgKey: uploadedUrl, src: uploadedUrl });
      onSelectElement({
        id: targetSlotId,
        type: "PhotoBox",
        props: { ...(nodes[targetSlotId]?.props || {}), imgKey: uploadedUrl, src: uploadedUrl },
      });

      // Đánh dấu tích xanh đã thay ảnh thành công
      setReplacedSlotIds((prev) => {
        const next = new Set(prev);
        next.add(targetSlotId);
        return next;
      });
    } catch (err) {
      console.error("Lỗi thay ảnh nhanh:", err);
      const localUrl = URL.createObjectURL(file);
      addUploadedImageToLibrary(localUrl);
      onUpdateElementProps(targetSlotId, { imgKey: localUrl, src: localUrl });
      setReplacedSlotIds((prev) => {
        const next = new Set(prev);
        next.add(targetSlotId);
        return next;
      });
    } finally {
      setIsUploadingSlot(false);
      if (quickFileInputRef.current) quickFileInputRef.current.value = "";
    }
  };

  const handleBatchFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setIsBatchUploading(true);
      setBatchProgress({ current: 0, total: files.length });

      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        setBatchProgress({ current: i + 1, total: files.length });
        const file = files[i];
        try {
          const compressed = await compressImageToWebP(file, { maxDimension: 1600, quality: 0.82 });
          const formData = new FormData();
          formData.append("file", compressed.file);

          const res = await uploadFileToServer(formData);
          let uploadedUrl = compressed.dataUrl;
          if (res.ok) {
            const json = await res.json();
            if (json.url) uploadedUrl = json.url;
          }
          uploadedUrls.push(uploadedUrl);
        } catch (err) {
          console.error("Lỗi nén/tải ảnh:", err);
          const localUrl = URL.createObjectURL(file);
          uploadedUrls.push(localUrl);
        }
      }

      if (uploadedUrls.length > 0) {
        // 1. Lưu TẤT CẢ các ảnh đã chọn (cả ảnh thay thế và ảnh thừa) vào Thư viện ảnh đã tải lên
        addUploadedImagesToLibrary(uploadedUrls);

        // 2. Tự động thay thế tuần tự 2 khung ảnh chính (Phong bì & Chân thiệp)
        const slotsToReplace = Math.min(uploadedUrls.length, photoSlots.length);
        const replacedIds = new Set(replacedSlotIds);

        for (let i = 0; i < slotsToReplace; i++) {
          const slot = photoSlots[i];
          const newUrl = uploadedUrls[i];
          onUpdateElementProps(slot.id, { imgKey: newUrl, src: newUrl });
          replacedIds.add(slot.id);
        }
        setReplacedSlotIds(replacedIds);

        // 3. Tự động nạp các ảnh tiếp theo (ảnh 3 đến 8) vào Album Carousel (CarouselBox)
        const carouselEntry = Object.entries(nodes).find(
          ([, n]: [string, any]) => n?.type?.resolvedName === "CarouselBox"
        );
        let carouselFilledCount = 0;
        if (carouselEntry && uploadedUrls.length > slotsToReplace) {
          const [carouselId, carouselNode] = carouselEntry;
          const carouselImages = uploadedUrls.slice(slotsToReplace, slotsToReplace + 6);
          const newImgList = carouselImages.map((url, idx) => ({
            id: `carousel-img-${Date.now()}-${idx}`,
            imageKey: url,
            src: url,
          }));
          onUpdateElementProps(carouselId, { imgList: newImgList });
          carouselFilledCount = newImgList.length;
        }

        // 4. Thông báo kết quả và số lượng ảnh thừa
        const totalAssigned = slotsToReplace + carouselFilledCount;
        const extraCount = uploadedUrls.length - totalAssigned;
        if (carouselFilledCount > 0) {
          setBatchMessage(
            `Đã gán ${slotsToReplace} ảnh cưới chính & ${carouselFilledCount} ảnh vào Album Carousel! ${
              extraCount > 0 ? `${extraCount} ảnh lưu vào Thư viện.` : ""
            }`
          );
        } else if (extraCount > 0) {
          setBatchMessage(
            `Đã thay ${slotsToReplace} ảnh cưới! ${extraCount} ảnh thừa đã lưu vào Thư viện media.`
          );
        } else {
          setBatchMessage(`Đã thay thành công ${slotsToReplace}/${photoSlots.length} ảnh cưới trên thiệp!`);
        }
        setTimeout(() => setBatchMessage(null), 6000);

        // 5. Mở ngăn thư viện bên trái để người dùng xem ngay ảnh đã tải và ảnh thừa
        onOpenImageDrawer?.();
      }
    } catch (err) {
      console.error("Lỗi thay ảnh hàng loạt:", err);
    } finally {
      setIsBatchUploading(false);
      setBatchProgress(null);
      if (batchFileInputRef.current) batchFileInputRef.current.value = "";
    }
  };

  return (
    <div
      className="flex-1 h-full overflow-auto relative flex flex-col items-center p-2 sm:p-8 pb-32 sm:pb-48 select-none bg-[#dedfe2] touch-pan-y"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onSelectElement(null);
          setContextMenu(null);
        }
      }}
      onContextMenu={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
          setContextMenu(null);
        }
      }}
    >
      {/* ================= CANVA-STYLE TOP CONTEXTUAL FORMATTING BAR (OUTSIDE CANVAS CARD) ================= */}
      {selectedElement && (
        <div className="sticky top-2 z-50 mb-3 shrink-0 pointer-events-auto overflow-visible">
          <EditorTopContextualBar
            selectedElement={selectedElement}
            onUpdateProps={onUpdateElementProps}
            onDuplicate={onDuplicateElement}
            onDelete={onDeleteElement}
            onDeselect={() => onSelectElement(null)}
            onOpenImageDrawer={onOpenImageDrawer}
            onRemoveBackground={onRemoveBackground}
            onOpenManualCutout={onOpenManualCutout}
          />
        </div>
      )}

      {/* ================= INVITATION CANVAS CONTAINER ================= */}
      <div
        className="relative bg-[#fbf8f2] shadow-[0_20px_50px_rgba(0,0,0,0.18)] rounded-xs overflow-hidden transition-transform duration-100 origin-top shrink-0 mb-20 flex flex-col"
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
        {/* Upper custom design nodes area */}
        <div
          className="relative w-full shrink-0"
          style={{
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
          }}
        >
        {/* Blueprint Graph Grid Overlay (Toggleable Canva-style grid) */}
        {isGridVisible && (
          <div
            className="absolute inset-0 pointer-events-none z-[5] canvas-blueprint-grid opacity-70 animate-fade-in"
            aria-hidden="true"
          />
        )}

        {/* Magnetic Snap Guides Overlay */}
        {activeSnapGuides && (
          <div className="absolute inset-0 pointer-events-none z-[999]" aria-hidden="true">
            {activeSnapGuides.vertical !== undefined && (
              <div
                className="absolute top-0 bottom-0 w-0 border-l-2 border-dashed border-[#e54153] z-[999]"
                style={{ left: `${activeSnapGuides.vertical}px` }}
              >
                {activeSnapGuides.labelV && (
                  <div className="bg-[#e54153] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap mt-2 -translate-x-1/2 inline-block">
                    {activeSnapGuides.labelV}
                  </div>
                )}
              </div>
            )}
            {activeSnapGuides.horizontal !== undefined && (
              <div
                className="absolute left-0 right-0 h-0 border-t-2 border-dashed border-indigo-500 z-[999]"
                style={{ top: `${activeSnapGuides.horizontal}px` }}
              >
                {activeSnapGuides.labelH && (
                  <div className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap mr-2 -translate-y-1/2 float-right inline-block">
                    {activeSnapGuides.labelH}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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

          // Ẩn phần tử nếu cờ hidden được kích hoạt (như tính năng con mắt trong Photoshop)
          if (props.hidden) {
            return null;
          }

          const isLocked = isElementLocked(id, nodes[id]);
          const isDecorative = isDecorativeNode(id, nodes[id]);

          // Entrance / Exit transition effect
          const transition = props.transition;
          const hasTransition =
            transition?.effectEnabled !== false &&
            transition?.effectType &&
            transition.effectType !== "none";

          const animName = hasTransition
            ? ANIMATION_KEYFRAME_MAP[transition.effectType] || transition.effectType
            : undefined;

          const transitionStyle: React.CSSProperties = animName
            ? {
                animationName: animName,
                animationDuration: `${transition.effectDuration ?? 1.2}s`,
                animationDelay: `${transition.effectDelay ?? 0}s`,
                animationTimingFunction:
                  transition.effectEasing || "cubic-bezier(0.16, 1, 0.3, 1)",
                animationFillMode: "both",
              }
            : {};

          const hoverClass =
            transition?.hoverEffect === "scale-up-gentle"
              ? "hover-effect-scale-up-gentle"
              : transition?.hoverEffect === "glow-soft"
              ? "hover-effect-glow-soft"
              : transition?.hoverEffect === "bounce-tap"
              ? "hover-effect-bounce-tap"
              : transition?.hoverEffect === "tilt-3d"
              ? "hover-effect-tilt-3d"
              : "";

          return (
            <div
              key={`${id}-${props._previewKey || ""}`}
              id={`canvas-node-${id}`}
              onMouseDown={(e) => {
                handleMouseDownElement(e, id, props, type);
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectElement({ id, type, props });
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const el = { id, type, props };
                onSelectElement(el);
                setContextMenu({
                  x: e.clientX,
                  y: e.clientY,
                  element: el,
                });
              }}
              onDoubleClick={(e) => {
                if (isLocked) return;
                e.stopPropagation();
                if (type === "TextBox") {
                  setInlineEditNode({ id, text: props.text || "" });
                }
              }}
              className={`absolute group select-none ${hoverClass} ${
                isLocked
                  ? "pointer-events-auto cursor-pointer"
                  : selectedElement?.id === id
                  ? "cursor-grab active:cursor-grabbing ring-1 ring-[#e54153]/40 pointer-events-auto"
                  : "cursor-pointer hover:ring-1 hover:ring-gray-300/60 pointer-events-auto"
              }`}
              style={{
                top: `${top}px`,
                left: `${left}px`,
                width: `${width}px`,
                height: `${height}px`,
                transform: `rotate(${rotation}deg)`,
                opacity: opacity,
                zIndex: zIndex,
                mixBlendMode: props.blendMode || undefined,
                ...transitionStyle,
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
                      handleImageFallback(
                        e,
                        undefined,
                        !props.isReplaceable || isDecorativeAsset(props.imgKey)
                      );
                    }}
                    className="w-full h-full object-cover pointer-events-none select-none transition-all duration-300"
                    style={{
                      filter: props.filterStyle || undefined,
                    }}
                    draggable={false}
                  />
                </div>
              )}

              {(type === "TextBox" ||
                type === "TimelineBox" ||
                type === "DressCodeBox" ||
                type === "CeremonyBox" ||
                type === "FamilyInfoBox" ||
                type === "BankCardBox") && (
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
                  dangerouslySetInnerHTML={{ __html: getModuleRenderHtml(type, props) }}
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
                      onError={(e) => {
                        handleImageFallback(e, FALLBACK_WEDDING_IMG, false);
                      }}
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

              {type === "CountdownBoxV2" && (() => {
                const cd = calculateCountdown(props.targetDate, props.targetTime);
                const textColor = props.textColor || "#590310";
                const variant = props.styleVariant;

                if (variant === "flip") {
                  return (
                    <div className="w-full h-full flex flex-col justify-between p-3 bg-slate-900 text-white rounded-2xl border border-slate-700 shadow-lg text-center select-none">
                      <div className="flex items-center justify-between text-[10px] border-b border-slate-800 pb-1">
                        <span className="font-bold text-slate-300 tracking-wider">ĐẾM NGƯỢC NGÀY CHUNG ĐÔI</span>
                        <span className="text-rose-400 font-bold font-mono">FLIP CLOCK</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 my-auto">
                        {[
                          { val: String(cd.days).padStart(2, "0"), label: "Ngày" },
                          { val: String(cd.hours).padStart(2, "0"), label: "Giờ" },
                          { val: String(cd.minutes).padStart(2, "0"), label: "Phút" },
                          { val: String(cd.seconds).padStart(2, "0"), label: "Giây" },
                        ].map((item, i) => (
                          <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-1.5 relative overflow-hidden flex flex-col items-center shadow-inner">
                            <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-950/80 z-10" />
                            <span className="text-xl sm:text-2xl font-black font-mono text-cyan-300 z-0">
                              {item.val}
                            </span>
                            <span className="text-[9px] uppercase font-bold text-slate-400 mt-0.5">
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="text-[9px] text-slate-400">Chính xác theo thời gian thực</div>
                    </div>
                  );
                }

                if (variant === "hearts") {
                  return (
                    <div className="w-full h-full flex flex-col justify-between p-3 bg-gradient-to-b from-rose-50/90 to-white rounded-2xl border border-rose-200 shadow-md text-center select-none">
                      <div className="flex items-center justify-between text-[10px] border-b border-rose-100 pb-1">
                        <span className="font-bold text-rose-800 tracking-wider flex items-center gap-1">
                          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> CÙNG ĐẾM NGƯỢC
                        </span>
                        <span className="text-rose-600 font-bold text-[9px]">Chung Đôi</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 my-auto">
                        {[
                          { val: String(cd.days).padStart(2, "0"), label: "Ngày" },
                          { val: String(cd.hours).padStart(2, "0"), label: "Giờ" },
                          { val: String(cd.minutes).padStart(2, "0"), label: "Phút" },
                          { val: String(cd.seconds).padStart(2, "0"), label: "Giây" },
                        ].map((item, i) => (
                          <div key={i} className="bg-white border border-rose-200/80 rounded-xl p-1.5 flex flex-col items-center shadow-2xs">
                            <span className="text-xl sm:text-2xl font-black font-serif text-rose-600">
                              {item.val}
                            </span>
                            <span className="text-[9px] uppercase font-bold text-rose-400 mt-0.5">
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="text-[9px] text-rose-500 font-medium">❤️ Đếm ngược từng khoảnh khắc ngọt ngào</div>
                    </div>
                  );
                }

                return (
                  <div className="w-full h-full flex items-center justify-around p-3 bg-white/20 backdrop-blur-xs rounded-xl border border-stone-200/50 text-center select-none">
                    {[
                      { val: String(cd.days).padStart(2, "0"), label: "Ngày" },
                      { val: String(cd.hours).padStart(2, "0"), label: "Giờ" },
                      { val: String(cd.minutes).padStart(2, "0"), label: "Phút" },
                      { val: String(cd.seconds).padStart(2, "0"), label: "Giây" },
                    ].map((item, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <span
                          className="text-xl font-black font-serif"
                          style={{ color: textColor }}
                        >
                          {item.val}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-gray-600">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {type === "CalendarBoxV2" && (() => {
                const cal = formatCalendarData(props);
                const themeColor = props.themeColor || "#590310";
                const variant = props.styleVariant;

                if (variant === "royal") {
                  return (
                    <div className="w-full h-full p-3.5 rounded-3xl bg-gradient-to-br from-amber-50 via-white to-amber-100/50 border-2 border-amber-300 shadow-md flex flex-col justify-between items-center text-center select-none">
                      <div className="flex items-center gap-1.5 text-amber-900 border-b border-amber-200/80 pb-1 w-full justify-center">
                        <Crown className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-[10px] uppercase font-serif font-bold tracking-widest">
                          {cal.formattedTitle}
                        </span>
                      </div>
                      <div className="text-4xl sm:text-5xl font-serif font-black text-amber-950 my-1 drop-shadow-xs">
                        {cal.day}
                      </div>
                      <div className="text-[10px] font-serif font-semibold text-amber-800 bg-amber-100/60 px-3 py-0.5 rounded-full border border-amber-200">
                        {cal.dayOfWeek} • {cal.time} • Ngày Hoàng Đạo
                      </div>
                    </div>
                  );
                }

                if (variant === "stamp") {
                  return (
                    <div className="w-full h-full p-3 rounded-2xl bg-[#fdfaf2] border-2 border-dashed border-amber-400/90 shadow-sm flex items-center justify-between gap-3 text-left select-none">
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-mono text-amber-800 font-bold tracking-widest uppercase">
                          POSTMARK • WEDDING
                        </span>
                        <h4 className="text-base font-bold text-gray-900 font-serif mt-0.5">
                          Ngày {cal.day} {cal.formattedTitle}
                        </h4>
                        <p className="text-[10px] text-gray-600">{cal.dayOfWeek} • {cal.time}</p>
                      </div>
                      <div className="w-16 h-16 rounded-full border-2 border-dashed border-rose-500 bg-white flex flex-col items-center justify-center text-rose-600 rotate-6 shrink-0 shadow-2xs">
                        <Heart className="w-4 h-4 fill-rose-500" />
                        <span className="text-[10px] font-bold font-mono mt-0.5">{cal.day}.{cal.month}</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="w-full h-full p-4 rounded-3xl bg-amber-50/40 border border-amber-200/40 flex flex-col justify-center items-center text-center select-none">
                    <span
                      className="text-xs uppercase font-bold tracking-widest"
                      style={{ color: themeColor }}
                    >
                      {cal.formattedTitle}
                    </span>
                    <div
                      className="text-4xl font-serif font-black my-2"
                      style={{ color: themeColor }}
                    >
                      {cal.day}
                    </div>
                    <span className="text-xs text-gray-700">
                      {cal.dayOfWeek} • {cal.time}
                    </span>
                  </div>
                );
              })()}

              {type === "ReminderBox" && (
                <div className="w-full h-full rounded-full bg-[#ece4d8] text-[#590310] flex items-center justify-center font-bold text-sm shadow-sm gap-2 select-none">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{props.text || "Thêm vào lịch"}</span>
                </div>
              )}

              {type === "GiftQrBox" && (() => {
                const variant = props.styleVariant || "minimal";
                const modalTitle = props.modalTitle || "Hộp Quà Mừng Cưới (VietQR)";

                // 1. GIAO DIỆN 1: CẢ NHÀ TRAI & NHÀ GÁI (dual_accounts)
                if (variant === "dual_accounts") {
                  const gBank = props.groomBank || props.bankName || "MB BANK";
                  const gAcc = props.groomAccount || props.accountNumber || "999988882026";
                  const gName = props.groomName || props.accountName || "LÊ ĐỨC MẠNH";
                  const gQr = generateVietQrUrl(gBank, gAcc, gName, undefined, "Mung cuoi Chu Re");

                  const bBank = props.brideBank || "VIETCOMBANK";
                  const bAcc = props.brideAccount || "1028492049";
                  const bName = props.brideName || "TRẦN LỆ QUYÊN";
                  const bQr = generateVietQrUrl(bBank, bAcc, bName, undefined, "Mung cuoi Co Dau");

                  return (
                    <div className="w-full h-full bg-white/95 rounded-2xl p-3 border border-rose-200/90 shadow-md flex flex-col justify-between select-none">
                      <div className="flex items-center justify-between border-b border-rose-100 pb-1.5 mb-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                          <span>🎁</span>
                          <span className="font-serif">{modalTitle}</span>
                        </div>
                        <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          Napas 24/7
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
                        {/* Nhà Trai */}
                        <div className="bg-gradient-to-b from-blue-50/60 to-white rounded-xl p-2 border border-blue-200/80 flex flex-col items-center justify-between text-center shadow-2xs">
                          <div className="w-full flex items-center justify-between text-[10px] font-bold text-blue-900 border-b border-blue-100 pb-1">
                            <span className="bg-blue-100/70 text-blue-800 px-1.5 py-0.2 rounded font-mono">{gBank}</span>
                            <span>🤵 Nhà Trai</span>
                          </div>
                          <div className="w-20 h-20 sm:w-24 sm:h-24 p-1 bg-white rounded-lg border border-blue-200 shadow-inner flex items-center justify-center my-1 overflow-hidden">
                            {gQr ? (
                              <img src={gQr} alt="QR Nhà Trai" className="w-full h-full object-contain" onError={(e) => handleImageFallback(e, undefined, false)} />
                            ) : (
                              <span className="text-[9px] text-gray-400">Chưa có mã QR</span>
                            )}
                          </div>
                          <div className="w-full space-y-0.5">
                            <p className="text-[10px] font-bold text-gray-800 truncate">{gName}</p>
                            <p className="text-[9px] font-mono font-semibold text-blue-700 bg-blue-50/80 py-0.5 px-1 rounded truncate">
                              STK: {gAcc}
                            </p>
                          </div>
                        </div>

                        {/* Nhà Gái */}
                        <div className="bg-gradient-to-b from-rose-50/60 to-white rounded-xl p-2 border border-rose-200/80 flex flex-col items-center justify-between text-center shadow-2xs">
                          <div className="w-full flex items-center justify-between text-[10px] font-bold text-rose-900 border-b border-rose-100 pb-1">
                            <span className="bg-rose-100/70 text-rose-800 px-1.5 py-0.2 rounded font-mono">{bBank}</span>
                            <span>👰 Nhà Gái</span>
                          </div>
                          <div className="w-20 h-20 sm:w-24 sm:h-24 p-1 bg-white rounded-lg border border-rose-200 shadow-inner flex items-center justify-center my-1 overflow-hidden">
                            {bQr ? (
                              <img src={bQr} alt="QR Nhà Gái" className="w-full h-full object-contain" onError={(e) => handleImageFallback(e, undefined, false)} />
                            ) : (
                              <span className="text-[9px] text-gray-400">Chưa có mã QR</span>
                            )}
                          </div>
                          <div className="w-full space-y-0.5">
                            <p className="text-[10px] font-bold text-gray-800 truncate">{bName}</p>
                            <p className="text-[9px] font-mono font-semibold text-rose-700 bg-rose-50/80 py-0.5 px-1 rounded truncate">
                              STK: {bAcc}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="text-center text-[9px] text-gray-500 pt-1.5 flex items-center justify-center gap-1">
                        <span>Chuyển khoản mừng cưới 24/7 trực tiếp tới Cô Dâu & Chú Rể</span>
                      </div>
                    </div>
                  );
                }

                // 2. GIAO DIỆN 3: DẠNG THẺ ATM LUXURY (vip_gold_card)
                if (variant === "vip_gold_card") {
                  const bankName = props.bankName || "TECHCOMBANK";
                  const accNum = props.accountNumber || "987654321098";
                  const accName = props.accountName || "HOÀNG NAM & THẢO LINH";
                  const qrUrl = props.imgKey || generateVietQrUrl(bankName, accNum, accName, undefined, "Mung cuoi VIP");
                  const formattedNum = accNum.replace(/(\d{4})/g, "$1 ").trim();

                  return (
                    <div className="w-full h-full bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 text-amber-950 p-3.5 rounded-2xl relative overflow-hidden shadow-lg border border-amber-300 flex flex-col justify-between select-none">
                      <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/20 rounded-full blur-xl pointer-events-none" />

                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black tracking-widest font-mono uppercase bg-amber-900/10 px-2 py-0.5 rounded border border-amber-900/20">
                            VIETQR GOLD VIP
                          </span>
                          <span className="text-[9px] font-bold text-amber-900/80 font-mono">{bankName}</span>
                        </div>
                        <CreditCard className="w-5 h-5 text-amber-900/80" />
                      </div>

                      <div className="flex items-center justify-between gap-3 my-auto relative z-10">
                        <div className="space-y-1.5 min-w-0">
                          <div className="w-7 h-5 rounded bg-gradient-to-br from-amber-600/40 to-amber-700/60 border border-amber-700/60 shadow-xs flex items-center justify-center">
                            <div className="w-4 h-2.5 border-t border-b border-amber-800/40" />
                          </div>
                          <div>
                            <p className="font-mono text-sm sm:text-base font-black tracking-wider text-amber-950 drop-shadow-xs truncate">
                              {formattedNum}
                            </p>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-900 truncate mt-0.5">
                              {accName}
                            </p>
                          </div>
                        </div>

                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white p-1 rounded-xl border-2 border-amber-500 shadow-md shrink-0 flex items-center justify-center overflow-hidden">
                          {qrUrl ? (
                            <img src={qrUrl} alt="VietQR VIP" className="w-full h-full object-contain" onError={(e) => handleImageFallback(e, undefined, false)} />
                          ) : (
                            <QrCode className="w-14 h-14 text-amber-950" />
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-amber-900/90 font-semibold relative z-10 border-t border-amber-400/60 pt-1">
                        <span>Napas 247 • Chuyển khoản mừng cưới thuận tiện</span>
                        <span className="font-bold">VIP MEMBER</span>
                      </div>
                    </div>
                  );
                }

                // 3. GIAO DIỆN 2: THẺ TRUNG TÂM GỌN GÀNG (single_clean)
                if (variant === "single_clean") {
                  const bankName = props.bankName || "VIETCOMBANK";
                  const accNum = props.accountNumber || "1028492049";
                  const accName = props.accountName || "NGUYỄN HOÀNG NAM";
                  const qrUrl = props.imgKey || generateVietQrUrl(bankName, accNum, accName, undefined, "Mung cuoi hai ban");

                  return (
                    <div className="w-full h-full bg-white/95 p-3.5 rounded-2xl border border-emerald-200/90 shadow-md flex items-center justify-between gap-3 select-none">
                      <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                        <div>
                          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <span>{bankName}</span>
                            <span>• 24/7</span>
                          </div>
                          <h4 className="text-sm font-bold text-gray-900 truncate mt-1.5 font-serif uppercase">
                            {accName}
                          </h4>
                          <p className="text-xs font-mono font-semibold text-gray-600 mt-0.5">
                            STK: <span className="text-gray-900 font-bold">{accNum}</span>
                          </p>
                        </div>

                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (typeof navigator !== "undefined" && navigator.clipboard) {
                                navigator.clipboard.writeText(accNum);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors pointer-events-auto"
                          >
                            <Copy className="w-3 h-3 text-blue-600" />
                            <span>Sao chép số TK</span>
                          </button>
                        </div>
                      </div>

                      <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white border-2 border-emerald-200 rounded-xl p-1.5 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                        {qrUrl ? (
                          <img src={qrUrl} alt="VietQR" className="w-full h-full object-contain" onError={(e) => handleImageFallback(e, undefined, false)} />
                        ) : (
                          <QrCode className="w-16 h-16 text-gray-800" />
                        )}
                      </div>
                    </div>
                  );
                }

                // 4. GIAO DIỆN 4: LỜI CHÚC & COPY STK (message_envelope)
                if (variant === "message_envelope") {
                  const bankName = props.bankName || "VPBANK";
                  const accNum = props.accountNumber || "888820268888";
                  const accName = props.accountName || "LÊ ĐỨC MẠNH";
                  const msg = props.messageText || "Sự hiện diện và lời chúc phúc của quý vị là món quà vô giá nhất đối với chúng mình!";
                  const qrUrl = props.imgKey || generateVietQrUrl(bankName, accNum, accName, undefined, "Mung cuoi hai ban");

                  return (
                    <div className="w-full h-full bg-gradient-to-br from-rose-50/70 via-white to-amber-50/40 p-3 rounded-2xl border border-rose-200 shadow-md flex flex-col justify-between select-none text-center">
                      <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-100/70 px-3 py-0.5 rounded-full w-fit mx-auto">
                        <span>💌</span>
                        <span>{modalTitle}</span>
                      </div>

                      <p className="text-[10px] text-gray-600 italic px-2 my-1 line-clamp-2">
                        "{msg}"
                      </p>

                      <div className="flex items-center justify-center gap-3 my-0.5">
                        <div className="w-20 h-20 p-1 bg-white rounded-xl border border-rose-200 shadow-inner shrink-0 overflow-hidden">
                          {qrUrl ? (
                            <img src={qrUrl} alt="VietQR" className="w-full h-full object-contain" onError={(e) => handleImageFallback(e, undefined, false)} />
                          ) : (
                            <QrCode className="w-14 h-14 text-gray-700" />
                          )}
                        </div>
                        <div className="text-left space-y-0.5">
                          <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 font-mono">{bankName}</span>
                          <p className="text-xs font-bold text-gray-900 truncate">{accName}</p>
                          <p className="text-[11px] font-mono font-bold text-rose-600">{accNum}</p>
                        </div>
                      </div>

                      <span className="text-[9px] text-gray-500 font-medium">
                        Cảm ơn tình cảm và sự chúc phúc của quý khách!
                      </span>
                    </div>
                  );
                }

                // 5. GIAO DIỆN 6: HAI THẺ DỌC KÈM GỢI Ý (dual_vertical)
                if (variant === "dual_vertical") {
                  const gBank = props.groomBank || props.bankName || "MB BANK";
                  const gAcc = props.groomAccount || props.accountNumber || "240220038888";
                  const gName = props.groomName || props.accountName || "TRẦN MINH QUÂN";
                  const gQr = generateVietQrUrl(gBank, gAcc, gName, undefined, "Mung cuoi Chu Re");

                  const bBank = props.brideBank || "TECHCOMBANK";
                  const bAcc = props.brideAccount || "19038294829012";
                  const bName = props.brideName || "LÊ THỊ MAI";
                  const bQr = generateVietQrUrl(bBank, bAcc, bName, undefined, "Mung cuoi Co Dau");

                  return (
                    <div className="w-full h-full bg-white/95 rounded-2xl p-2.5 border border-rose-200/90 shadow-md flex flex-col justify-between select-none">
                      <div className="flex items-center justify-between text-xs font-bold text-rose-800 px-1">
                        <span>🎁 {modalTitle}</span>
                        <div className="flex gap-1 text-[8px]">
                          {["200k", "500k", "1Tr"].map((m, idx) => (
                            <span key={idx} className="px-1.5 py-0.2 bg-rose-50 text-rose-700 rounded border border-rose-200 font-bold">{m}</span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5 my-auto">
                        {/* Row 1: Chú Rể */}
                        <div className="flex items-center justify-between p-1.5 bg-blue-50/50 rounded-xl border border-blue-100 gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-sm">🤵</span>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold text-blue-900 truncate">Mừng Chú Rể • {gName}</p>
                              <p className="text-[9px] font-mono text-gray-600 truncate">{gBank}: {gAcc}</p>
                            </div>
                          </div>
                          <div className="w-12 h-12 bg-white p-0.5 rounded-lg border border-blue-200 shrink-0 overflow-hidden flex items-center justify-center">
                            {gQr ? <img src={gQr} alt="QR Chú Rể" className="w-full h-full object-contain" /> : <QrCode className="w-8 h-8 text-blue-900" />}
                          </div>
                        </div>

                        {/* Row 2: Cô Dâu */}
                        <div className="flex items-center justify-between p-1.5 bg-rose-50/50 rounded-xl border border-rose-100 gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-sm">👰</span>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold text-rose-900 truncate">Mừng Cô Dâu • {bName}</p>
                              <p className="text-[9px] font-mono text-gray-600 truncate">{bBank}: {bAcc}</p>
                            </div>
                          </div>
                          <div className="w-12 h-12 bg-white p-0.5 rounded-lg border border-rose-200 shrink-0 overflow-hidden flex items-center justify-center">
                            {bQr ? <img src={bQr} alt="QR Cô Dâu" className="w-full h-full object-contain" /> : <QrCode className="w-8 h-8 text-rose-900" />}
                          </div>
                        </div>
                      </div>

                      <span className="text-[9px] text-center text-gray-500 font-medium">Quét mã chuyển khoản Napas 24/7 tiện lợi</span>
                    </div>
                  );
                }

                // 6. GIAO DIỆN MẶC ĐỊNH / TỐI GIẢN (minimal)
                const qrUrl = getGiftQrUrl(props) || (props.bankName && props.accountNumber ? generateVietQrUrl(props.bankName, props.accountNumber, props.accountName) : "");

                return (
                  <div className="w-full h-full bg-white/95 rounded-2xl p-3 border border-rose-200 shadow-md flex flex-col items-center justify-between text-center select-none">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full">
                      <span>🎁</span>
                      <span>{modalTitle}</span>
                    </div>

                    {/* Mã QR chuẩn Napas 24/7 Thật */}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 p-1.5 bg-white rounded-xl border-2 border-dashed border-amber-400/80 shadow-inner flex items-center justify-center my-1 overflow-hidden">
                      {qrUrl ? (
                        <img
                          src={qrUrl}
                          alt="Mã VietQR Mừng Cưới"
                          onError={(e) => handleImageFallback(e, undefined, false)}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-xs text-gray-500">Chưa có thông tin tài khoản</span>
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-[11px] font-bold text-gray-800">
                        {props.bankName || ""} {props.accountNumber ? `• ${props.accountNumber}` : ""}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase font-semibold truncate max-w-[190px]">
                        {props.accountName || ""}
                      </p>
                    </div>

                    <span className="text-[10px] text-rose-600 font-bold">
                      Quét mã chuyển khoản Napas 24/7 ↗
                    </span>
                  </div>
                );
              })()}

              {type === "RsvpBoxV2" && (() => {
                const variant = props.styleVariant;
                const titleText = props.titleText || "Xác nhận tham dự";

                if (variant === "direct_call") {
                  return (
                    <div className="w-full h-full p-4 bg-white/95 rounded-2xl border border-rose-200 shadow-md flex flex-col justify-between text-center select-none">
                      <div>
                        <div className="flex items-center justify-center gap-1 text-xs font-bold text-rose-800">
                          <Phone className="w-3.5 h-3.5 text-rose-600" />
                          <span>{titleText}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">Liên hệ trực tiếp qua điện thoại hoặc Zalo</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 my-auto">
                        <button
                          type="button"
                          className="py-2 px-3 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:bg-blue-700 pointer-events-auto"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Gọi Nhà Trai</span>
                        </button>
                        <button
                          type="button"
                          className="py-2 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:bg-emerald-700 pointer-events-auto"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Nhắn Zalo</span>
                        </button>
                      </div>

                      <span className="text-[9px] text-gray-400">Tiện lợi cho người lớn tuổi và bạn bè</span>
                    </div>
                  );
                }

                if (variant === "minimal_choice") {
                  return (
                    <div className="w-full h-full p-4 bg-white/95 rounded-2xl border border-gray-200 shadow-md flex flex-col justify-between text-center select-none">
                      <h4 className="font-bold text-sm text-[#511419] font-serif">
                        {titleText}
                      </h4>
                      <div className="grid grid-cols-2 gap-2 my-auto">
                        <button className="py-2.5 rounded-xl bg-emerald-50 text-emerald-800 border-2 border-emerald-300 font-bold text-xs flex items-center justify-center gap-1 shadow-2xs hover:bg-emerald-100 pointer-events-auto">
                          <Check className="w-3.5 h-3.5" /> Sẽ tham dự
                        </button>
                        <button className="py-2.5 rounded-xl bg-gray-50 text-gray-700 border-2 border-gray-200 font-bold text-xs flex items-center justify-center gap-1 shadow-2xs hover:bg-gray-100 pointer-events-auto">
                          <X className="w-3.5 h-3.5" /> Rất tiếc bận
                        </button>
                      </div>
                      <span className="text-[9px] text-gray-500">1 Chạm phản hồi nhanh</span>
                    </div>
                  );
                }

                return (
                  <div className="w-full h-full p-4 sm:p-5 bg-white/95 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between text-left select-none">
                    <h4 className="font-bold text-sm sm:text-base text-[#511419] font-serif">
                      {titleText}
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
                );
              })()}

              {type === "MapBox" && (() => {
                const variant = props.styleVariant || "minimal";
                const venueName = props.venueName || props.title || "Trung tâm Tiệc cưới Trống Đồng";
                const address = props.address || "Số 72 Quán Sứ, Hoàn Kiếm, Hà Nội";
                const generatedMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venueName} ${address}`)}`;
                const mapUrl = getSafeMapUrl(props.mapUrl, generatedMapUrl);

                if (variant === "satellite_preview") {
                  const previewImg = props.previewImg || "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=600";
                  return (
                    <div className="w-full h-full rounded-2xl overflow-hidden border border-gray-200 bg-white/95 flex flex-col shadow-xs group">
                      <div className="relative w-full h-[55%] overflow-hidden bg-slate-100">
                        <img src={previewImg} alt="Bản đồ vị trí" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className="p-1.5 bg-red-600 text-white rounded-full shadow-lg animate-bounce">
                            <MapPin className="w-4 h-4" />
                          </div>
                        </div>
                        <span className="absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-xs">
                          Ảnh Vệ Tinh
                        </span>
                      </div>
                      <div className="flex-1 p-2 flex flex-col justify-between items-center text-center">
                        <div>
                          <h4 className="text-xs font-bold text-gray-900 font-serif line-clamp-1">{venueName}</h4>
                          <p className="text-[10px] text-gray-500 line-clamp-1">{address}</p>
                        </div>
                        <a
                          href={mapUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 text-white rounded-full text-[10px] font-bold shadow-xs pointer-events-auto"
                        >
                          <span>Mở Google Maps</span>
                          <span>↗</span>
                        </a>
                      </div>
                    </div>
                  );
                }

                if (variant === "dual_venue") {
                  const vGroom = props.venueNameGroom || "Tư gia Nhà Trai";
                  const aGroom = props.addressGroom || "Số 12 Phố Huế, Hoàn Kiếm";
                  const urlGroom = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${vGroom} ${aGroom}`)}`;
                  const vBride = props.venueNameBride || "Tư gia Nhà Gái";
                  const aBride = props.addressBride || "Số 45 Lê Lợi, Ba Đình";
                  const urlBride = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${vBride} ${aBride}`)}`;

                  return (
                    <div className="w-full h-full rounded-2xl border border-rose-200/80 bg-white/95 p-2.5 flex flex-col justify-between shadow-xs text-center select-none">
                      <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                        📍 Địa Điểm Hai Gia Đình
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] font-bold text-blue-700 uppercase bg-blue-50 px-1.5 py-0.5 rounded">Nhà Trai</span>
                            <p className="text-[11px] font-bold text-gray-900 mt-0.5 truncate">{vGroom}</p>
                            <p className="text-[9px] text-gray-500 line-clamp-2 mt-0.5">{aGroom}</p>
                          </div>
                          <a
                            href={urlGroom}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1.5 inline-flex items-center justify-center gap-0.5 py-1 px-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-bold pointer-events-auto"
                          >
                            Chỉ đường ↗
                          </a>
                        </div>

                        <div className="p-2 rounded-xl bg-rose-50/50 border border-rose-100 flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] font-bold text-rose-700 uppercase bg-rose-50 px-1.5 py-0.5 rounded">Nhà Gái</span>
                            <p className="text-[11px] font-bold text-gray-900 mt-0.5 truncate">{vBride}</p>
                            <p className="text-[9px] text-gray-500 line-clamp-2 mt-0.5">{aBride}</p>
                          </div>
                          <a
                            href={urlBride}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1.5 inline-flex items-center justify-center gap-0.5 py-1 px-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-bold pointer-events-auto"
                          >
                            Chỉ đường ↗
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (variant === "qr_nav") {
                  const qrMapUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mapUrl)}`;
                  return (
                    <div className="w-full h-full rounded-2xl border border-gray-200 bg-white/95 p-3 flex items-center justify-between gap-3 shadow-xs select-none">
                      <div className="flex-1 flex flex-col justify-between h-full text-left">
                        <div>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-rose-700 uppercase">
                            <MapPin className="w-3.5 h-3.5 text-rose-600" />
                            <span>Chỉ Đường Thông Minh</span>
                          </div>
                          <h4 className="text-xs font-bold text-gray-900 font-serif mt-1">{venueName}</h4>
                          <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5">{address}</p>
                        </div>
                        <div className="pt-2">
                          <a
                            href={mapUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold shadow-xs pointer-events-auto"
                          >
                            Mở Google Maps ↗
                          </a>
                        </div>
                      </div>
                      <div className="w-24 h-24 rounded-xl border border-gray-200 p-1.5 bg-white flex flex-col items-center justify-center shrink-0 shadow-inner">
                        <img src={qrMapUrl} alt="QR Chỉ đường" className="w-full h-full object-contain" />
                        <span className="text-[8px] text-gray-400 mt-0.5">Quét bằng camera</span>
                      </div>
                    </div>
                  );
                }

                if (variant === "royal_gold") {
                  return (
                    <div className="w-full h-full rounded-2xl border-2 border-amber-400/80 bg-gradient-to-b from-amber-50/50 via-white to-amber-50/30 p-3 flex flex-col items-center justify-between text-center shadow-md relative overflow-hidden select-none">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 text-amber-950 flex items-center justify-center shadow-xs">
                          <MapPin className="w-3.5 h-3.5 text-amber-900" />
                        </div>
                        <h4 className="text-xs font-bold text-amber-950 font-serif uppercase tracking-wider">{venueName}</h4>
                        <p className="text-[10px] text-amber-900/80 line-clamp-2 max-w-[280px]">{address}</p>
                      </div>
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-3.5 py-1 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:brightness-110 text-white rounded-full text-[10px] font-bold shadow-xs pointer-events-auto transition-all"
                      >
                        <span>CHỈ ĐƯỜNG ĐẾN HÔN LỄ</span>
                        <span>↗</span>
                      </a>
                    </div>
                  );
                }

                if (variant === "roadmap_card") {
                  const parkingNote = props.parkingNote || "Có bãi đỗ xe ô tô & xe máy miễn phí";
                  return (
                    <div className="w-full h-full rounded-2xl border border-slate-200 bg-white/95 p-3 flex flex-col justify-between shadow-xs text-left select-none">
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                            <MapPin className="w-4 h-4 text-red-500" />
                            <span>{venueName}</span>
                          </div>
                          <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Chỉ dẫn đỗ xe
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-600 mt-1 line-clamp-2">{address}</p>
                        <div className="mt-1.5 p-1.5 rounded-lg bg-slate-50 border border-slate-100 text-[10px] text-slate-600 flex items-center gap-1.5">
                          <span>🚗</span>
                          <span className="truncate">{parkingNote}</span>
                        </div>
                      </div>
                      <div className="pt-1 flex items-center justify-end">
                        <a
                          href={mapUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[9px] font-bold pointer-events-auto transition-colors"
                        >
                          <span>Mở Google Maps</span>
                          <span>↗</span>
                        </a>
                      </div>
                    </div>
                  );
                }

                if (variant === "handdrawn") {
                  return (
                    <div className="w-full h-full rounded-2xl border-2 border-dashed border-[#8c6d46]/70 bg-[#faf6ee] p-3 flex flex-col justify-between text-center shadow-xs select-none relative overflow-hidden">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-7 h-7 rounded-full bg-[#f0e6d2] border border-[#8c6d46]/50 text-[#6a4f2e] flex items-center justify-center shadow-2xs">
                          <MapPin className="w-4 h-4 text-[#8c6d46]" />
                        </div>
                        <span className="text-[9px] font-serif uppercase tracking-widest text-[#8c6d46]">Sơ Đồ Hướng Dẫn</span>
                        <h4 className="text-xs font-bold text-[#4a3520] font-serif">{venueName}</h4>
                        <p className="text-[10px] text-[#7a6245] italic line-clamp-2 max-w-[280px]">{address}</p>
                      </div>
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-[#6a4f2e] hover:bg-[#533d23] text-[#faf6ee] rounded-full text-[10px] font-bold shadow-xs pointer-events-auto transition-all"
                      >
                        <span>Xem bản đồ dẫn đường</span>
                        <span>↗</span>
                      </a>
                    </div>
                  );
                }

                if (variant === "darkmode") {
                  return (
                    <div className="w-full h-full rounded-2xl border border-amber-500/40 bg-zinc-950 text-white p-3 flex flex-col justify-between text-center shadow-xl select-none relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-black/60 pointer-events-none" />
                      <div className="relative z-10 flex flex-col items-center gap-1">
                        <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-400/60 text-amber-300 flex items-center justify-center shadow-inner">
                          <MapPin className="w-4 h-4 text-amber-400" />
                        </div>
                        <span className="text-[9px] font-mono tracking-widest text-amber-400 uppercase">Luxury Night Venue</span>
                        <h4 className="text-xs font-bold text-amber-100 font-serif tracking-wide">{venueName}</h4>
                        <p className="text-[10px] text-zinc-400 line-clamp-2 max-w-[280px]">{address}</p>
                      </div>
                      <div className="relative z-10 pt-1">
                        <a
                          href={mapUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center justify-center gap-1 px-4 py-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 text-zinc-950 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg pointer-events-auto transition-all"
                        >
                          <span>Dẫn Đường Google Maps</span>
                          <span>↗</span>
                        </a>
                      </div>
                    </div>
                  );
                }

                // Default: Minimal 1-touch card
                return (
                  <div className="w-full h-full rounded-2xl overflow-hidden border border-gray-200 bg-white/95 flex flex-col items-center justify-between text-center p-3 relative shadow-xs">
                    <div className="flex flex-col items-center gap-1 text-gray-700">
                      <MapPin className="w-6 h-6 text-red-500 animate-pulse" />
                      <span className="text-xs font-bold text-gray-900 font-serif">
                        {venueName}
                      </span>
                      <span className="text-[11px] text-gray-600 line-clamp-2 max-w-[280px]">
                        {address}
                      </span>
                    </div>
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-full text-[10px] font-bold shadow-xs transition-colors pointer-events-auto"
                    >
                      <span>Chỉ đường Google Maps</span>
                      <span>↗</span>
                    </a>
                  </div>
                );
              })()}
            </div>
          );
        })}

        {/* ================= SELECTION OVERLAY (Z-Index 50: Always on top of all canvas layers) ================= */}
        {selectedElement && (() => {
          const node = nodes[selectedElement.id];
          if (!node) return null;
          const p = node.props || {};
          const isLocked = isElementLocked(selectedElement.id, node);
          const top = p.top ?? 0;
          const left = p.left ?? 0;
          const width = p.width ?? 100;
          const height = p.height ?? 100;
          const rotation = p.rotation ?? 0;

          return (
            <div
              className={`absolute pointer-events-none z-50 select-none ${
                isLocked
                  ? "border-2 border-dashed border-amber-500/80"
                  : "border border-[#e54153]"
              }`}
              style={{
                top: `${top}px`,
                left: `${left}px`,
                width: `${width}px`,
                height: `${height}px`,
                transform: `rotate(${rotation}deg)`,
              }}
            >
              {/* Drag Move Hit Area (chỉ kéo được nếu phần tử chưa bị khóa) */}
              <div
                onMouseDown={(e) => handleMouseDownElement(e, selectedElement.id, p, selectedElement.type)}
                onTouchStart={(e) => handleTouchStartElement(e, selectedElement.id, p, selectedElement.type)}
                className={`absolute inset-0 pointer-events-auto ${
                  isLocked ? "cursor-default" : "cursor-move"
                }`}
                title={isLocked ? "Họa tiết đang khóa (Bấm Mở khóa bên trên để di chuyển)" : "Giữ chuột hoặc chạm để di chuyển vị trí"}
              />

              {/* Nếu phần tử bị khóa: Hiển thị Badge thông báo ĐÃ KHÓA kèm nút Mở khóa */}
              {isLocked ? (
                <div
                  className="absolute -top-9 left-1/2 pointer-events-auto bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap z-50 cursor-pointer transition-colors"
                  style={{
                    transform: `translate(-50%, 0) rotate(${-rotation}deg)`,
                    transformOrigin: "center center",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateElementProps(selectedElement.id, { locked: false });
                  }}
                  title="Click để mở khóa và tự do chỉnh sửa, kéo thả, co giãn"
                >
                  <Lock className="w-3 h-3 text-amber-200" />
                  <span>Họa tiết đang khóa</span>
                  <span className="text-[10px] bg-white/20 hover:bg-white/30 px-1.5 py-0.5 rounded ml-0.5 inline-flex items-center gap-1 font-bold">
                    <Unlock className="w-2.5 h-2.5" /> Mở khóa
                  </span>
                </div>
              ) : (
                <>
                  {/* Nếu là họa tiết nhưng đã được mở khóa: hiện badge nhỏ cho phép khóa lại */}
                  {isDecorativeNode(selectedElement.id, node) && (
                    <div
                      className="absolute -top-9 left-1/2 pointer-events-auto bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-medium px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 whitespace-nowrap z-50 cursor-pointer transition-colors"
                      style={{
                        transform: `translate(-50%, 0) rotate(${-rotation}deg)`,
                        transformOrigin: "center center",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateElementProps(selectedElement.id, { locked: true });
                      }}
                      title="Click để khóa lại sau khi đã chỉnh sửa xong"
                    >
                      <Unlock className="w-2.5 h-2.5 text-emerald-200" />
                      <span>Đã mở khóa</span>
                      <span className="text-[9px] bg-white/20 px-1 py-0.2 rounded font-bold ml-0.5">Khóa lại</span>
                    </div>
                  )}
                  {/* 8-Point Interactive Resize Handles (Mouse & Touch Enabled with expanded touch targets) */}
                  {/* Top-Left (nw) */}
                  <div
                    onMouseDown={(e) => handleMouseDownResize(e, selectedElement.id, "nw", p)}
                    onTouchStart={(e) => handleTouchStartResize(e, selectedElement.id, "nw", p)}
                    className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#e54153] rounded-xs shadow-xs pointer-events-auto cursor-nwse-resize hover:scale-125 transition-transform z-50 touch-none before:content-[''] before:absolute before:-inset-2.5 before:bg-transparent"
                    title="Kéo để co giãn kích thước"
                  />
                  {/* Top-Center (n) */}
                  <div
                    onMouseDown={(e) => handleMouseDownResize(e, selectedElement.id, "n", p)}
                    onTouchStart={(e) => handleTouchStartResize(e, selectedElement.id, "n", p)}
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-[#e54153] rounded-xs shadow-xs pointer-events-auto cursor-ns-resize hover:scale-125 transition-transform z-50 touch-none before:content-[''] before:absolute before:-inset-2.5 before:bg-transparent"
                    title="Kéo để thay đổi chiều cao"
                  />
                  {/* Top-Right (ne) */}
                  <div
                    onMouseDown={(e) => handleMouseDownResize(e, selectedElement.id, "ne", p)}
                    onTouchStart={(e) => handleTouchStartResize(e, selectedElement.id, "ne", p)}
                    className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#e54153] rounded-xs shadow-xs pointer-events-auto cursor-nesw-resize hover:scale-125 transition-transform z-50 touch-none before:content-[''] before:absolute before:-inset-2.5 before:bg-transparent"
                    title="Kéo để co giãn kích thước"
                  />
                  {/* Center-Right (e) */}
                  <div
                    onMouseDown={(e) => handleMouseDownResize(e, selectedElement.id, "e", p)}
                    onTouchStart={(e) => handleTouchStartResize(e, selectedElement.id, "e", p)}
                    className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 bg-white border-2 border-[#e54153] rounded-xs shadow-xs pointer-events-auto cursor-ew-resize hover:scale-125 transition-transform z-50 touch-none before:content-[''] before:absolute before:-inset-2.5 before:bg-transparent"
                    title="Kéo để thay đổi chiều rộng"
                  />
                  {/* Bottom-Right (se) */}
                  <div
                    onMouseDown={(e) => handleMouseDownResize(e, selectedElement.id, "se", p)}
                    onTouchStart={(e) => handleTouchStartResize(e, selectedElement.id, "se", p)}
                    className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#e54153] rounded-xs shadow-xs pointer-events-auto cursor-nwse-resize hover:scale-125 transition-transform z-50 touch-none before:content-[''] before:absolute before:-inset-2.5 before:bg-transparent"
                    title="Kéo để co giãn kích thước"
                  />
                  {/* Bottom-Center (s) */}
                  <div
                    onMouseDown={(e) => handleMouseDownResize(e, selectedElement.id, "s", p)}
                    onTouchStart={(e) => handleTouchStartResize(e, selectedElement.id, "s", p)}
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-[#e54153] rounded-xs shadow-xs pointer-events-auto cursor-ns-resize hover:scale-125 transition-transform z-50 touch-none before:content-[''] before:absolute before:-inset-2.5 before:bg-transparent"
                    title="Kéo để thay đổi chiều cao"
                  />
                  {/* Bottom-Left (sw) */}
                  <div
                    onMouseDown={(e) => handleMouseDownResize(e, selectedElement.id, "sw", p)}
                    onTouchStart={(e) => handleTouchStartResize(e, selectedElement.id, "sw", p)}
                    className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#e54153] rounded-xs shadow-xs pointer-events-auto cursor-nesw-resize hover:scale-125 transition-transform z-50 touch-none before:content-[''] before:absolute before:-inset-2.5 before:bg-transparent"
                    title="Kéo để co giãn kích thước"
                  />
                  {/* Center-Left (w) */}
                  <div
                    onMouseDown={(e) => handleMouseDownResize(e, selectedElement.id, "w", p)}
                    onTouchStart={(e) => handleTouchStartResize(e, selectedElement.id, "w", p)}
                    className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 bg-white border-2 border-[#e54153] rounded-xs shadow-xs pointer-events-auto cursor-ew-resize hover:scale-125 transition-transform z-50 touch-none before:content-[''] before:absolute before:-inset-2.5 before:bg-transparent"
                    title="Kéo để thay đổi chiều rộng"
                  />

                  {/* Real-time coordinates tooltip when moving/rotating/resizing */}
                  {(isDragging || isRotating || isResizing) && (
                    <div
                      className="absolute -bottom-14 left-1/2 pointer-events-none bg-gray-900/90 text-white text-[10px] font-mono px-2 py-0.5 rounded-md shadow-md whitespace-nowrap z-50"
                      style={{
                        transform: `translate(-50%, 0) rotate(${-rotation}deg)`,
                        transformOrigin: "center center",
                      }}
                    >
                      {isRotating
                        ? `Góc xoay: ${rotation}°`
                        : isResizing
                        ? `Rộng: ${width}px • Cao: ${height}px`
                        : `X: ${left}px • Y: ${top}px`}
                    </div>
                  )}


                  {/* Bottom Rotation Handle */}
                  <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center z-50">
                    <div className="w-px h-3.5 bg-[#e54153]" />
                    <div
                      onMouseDown={(e) => handleMouseDownRotate(e, selectedElement.id)}
                      onTouchStart={(e) => handleTouchStartRotate(e, selectedElement.id)}
                      className="w-7 h-7 sm:w-5 sm:h-5 rounded-full bg-white border border-gray-300 shadow-sm flex items-center justify-center cursor-grab active:cursor-grabbing text-gray-700 hover:text-[#e54153] hover:scale-110 transition-transform touch-none"
                      title="Kéo chuột hoặc chạm xoay phần tử"
                    >
                      <RotateCw className="w-3 h-3" />
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })()}
        </div>

        {/* ================= LOWER FIXED MODULES SECTION ================= */}
        <EditorFixedModulesCanvas
          card={card}
          onOpenFixedModulesTab={onOpenFixedModulesTab}
          onToggleFixedModule={onToggleFixedModule}
          onOpenAlbumDrawer={onOpenImageDrawer}
          onOpenSettings={onOpenSettings}
          onOpenModuleConfig={onOpenModuleConfig}
        />
      </div>

      {/* ================= CANVA BOTTOM CONTROL BAR ================= */}
      <EditorBottomBar
        zoomLevel={zoomLevel}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onResetZoom={onResetZoom}
        onSetZoom={(z) => onSetZoomLevel?.(z)}
        onFitToScreen={() => {
          if (onFitToScreen) {
            onFitToScreen();
          } else {
            const vh = typeof window !== "undefined" ? window.innerHeight : 900;
            const fit = Math.max(0.4, Math.min(1.2, (vh - 160) / canvasHeight));
            onSetZoomLevel?.(Number(fit.toFixed(2)));
          }
        }}
        isGridVisible={isGridVisible}
        onToggleGrid={() => setIsGridVisible((v) => !v)}
        isSnappingEnabled={isSnappingEnabled}
        onToggleSnapping={() => setIsSnappingEnabled((v) => !v)}
        onOpenPreview={() => onOpenPreview?.()}
        onOpenShortcuts={() => onOpenShortcuts?.()}
      />

      {/* ================= FIXED BOTTOM-LEFT: THAY ẢNH NHANH TOÀN BỘ TEMPLATE ================= */}
      {photoSlots.length > 0 && !isQuickPanelCollapsed ? (
        <div
          className={`fixed bottom-16 sm:bottom-5 z-30 max-w-[calc(100vw-24px)] sm:max-w-[70vw] lg:max-w-2xl pointer-events-auto select-none transition-all duration-300 ease-in-out animate-fade-in ${
            isLeftDrawerOpen ? "hidden md:block md:left-[395px]" : "left-3 right-3 sm:right-auto sm:left-24"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/90 p-3 sm:p-3.5 flex flex-col gap-2 transition-all">
            {/* Header info */}
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="w-6 h-6 rounded-lg bg-rose-50 text-[#e54153] flex items-center justify-center shrink-0">
                  <ImageIcon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5 whitespace-nowrap">
                  Thay ảnh nhanh ({photoSlots.length} ảnh)
                </span>

                {/* NÚT THAY HÀNG LOẠT */}
                <button
                  type="button"
                  onClick={() => batchFileInputRef.current?.click()}
                  disabled={isUploadingSlot || isBatchUploading}
                  className="bg-gradient-to-r from-rose-500 to-[#e54153] hover:from-rose-600 hover:to-[#c93243] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1 transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap disabled:opacity-50"
                  title={`Chọn nhiều ảnh cùng lúc từ máy tính để tự động thay ${photoSlots.length} ảnh trên thiệp. Ảnh thừa sẽ được lưu vào Thư viện đã tải lên.`}
                >
                  <Sparkles className="w-3 h-3 text-amber-200 fill-amber-200" />
                  <span>Thay hàng loạt</span>
                </button>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors whitespace-nowrap ${
                    replacedCount === photoSlots.length && photoSlots.length > 0
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : "bg-gray-100 text-gray-600 border border-gray-200"
                  }`}
                >
                  {replacedCount === photoSlots.length && photoSlots.length > 0 ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                      <span>Đã thay đủ {replacedCount}/{photoSlots.length}</span>
                    </>
                  ) : (
                    <span>Đã thay: {replacedCount}/{photoSlots.length}</span>
                  )}
                </span>

                {/* Badge slot đang chọn + Nút Tải từ máy */}
                {barActiveSlotId && (
                  <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-semibold text-[#e54153] animate-fade-in">
                    <span>
                      Đang chọn #{photoSlots.findIndex((s) => s.id === barActiveSlotId) + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        activeSlotIdRef.current = barActiveSlotId;
                        if (quickFileInputRef.current) {
                          quickFileInputRef.current.value = "";
                          quickFileInputRef.current.click();
                        }
                      }}
                      className="bg-[#e54153] hover:bg-[#c93243] text-white px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                      title="Bấm để chọn ảnh từ máy tính"
                    >
                      <Upload className="w-2.5 h-2.5" />
                      <span>Tải từ máy</span>
                    </button>
                  </div>
                )}

                {/* Trạng thái đang tải đơn lẻ */}
                {isUploadingSlot && !isBatchUploading && (
                  <span className="flex items-center gap-1 text-[11px] text-[#e54153] font-semibold animate-pulse whitespace-nowrap">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Đang tải ảnh...</span>
                  </span>
                )}

                {/* Trạng thái đang tải hàng loạt */}
                {isBatchUploading && batchProgress && (
                  <span className="flex items-center gap-1 text-[11px] text-[#e54153] font-semibold animate-pulse whitespace-nowrap bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Đang xử lý {batchProgress.current}/{batchProgress.total} ảnh...</span>
                  </span>
                )}

                {/* Thông báo kết quả thay hàng loạt */}
                {batchMessage && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold animate-fade-in flex items-center gap-1 whitespace-nowrap">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>{batchMessage}</span>
                  </span>
                )}
              </div>

              {/* Panel controls */}
              <div className="flex items-center gap-1 shrink-0">
                {photoSlots.length > 5 && (
                  <div className="flex items-center gap-0.5 mr-1">
                    <button
                      type="button"
                      onClick={() => scrollQuickPanel("left")}
                      className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                      title="Cuộn sang trái"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollQuickPanel("right")}
                      className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                      title="Cuộn sang phải"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setIsQuickPanelCollapsed(true)}
                  className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                  title="Thu nhỏ thanh thay ảnh nhanh"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Thumbnails Row - Mở rộng theo tỉ lệ ảnh và số lượng ảnh */}
            <div
              ref={quickScrollRef}
              className="flex items-center gap-2.5 overflow-x-auto scrollbar-thin py-1.5 px-0.5 scroll-smooth max-w-full"
            >
              {photoSlots.map((slot, i) => {
                const isThisLoading = isUploadingSlot && activeSlotId === slot.id;
                const replaced = isSlotReplaced(slot);
                const dims = getSlotDimensions(slot);
                const isBarActive = barActiveSlotId === slot.id;

                return (
                  <button
                    key={slot.id || i}
                    type="button"
                    onClick={() => handleSlotClick(slot)}
                    disabled={isUploadingSlot}
                    style={{
                      width: `${dims.width}px`,
                      height: `${dims.height}px`,
                    }}
                    className={`shrink-0 rounded-xl overflow-hidden relative group transition-all cursor-pointer ${
                      isBarActive
                        ? "ring-3 ring-[#e54153] ring-offset-2 border-2 border-white shadow-xl scale-105 z-10"
                        : replaced
                        ? "border-2 border-emerald-500 ring-2 ring-emerald-200/70 shadow-sm"
                        : "border border-gray-200 hover:border-[#e54153] hover:ring-2 hover:ring-[#e54153]/20 shadow-2xs"
                    } hover:scale-105 active:scale-95`}
                    title={
                      isBarActive
                        ? `Ảnh cưới #${i + 1} (${dims.ratioLabel}) • ĐANG CHỌN! BẤM LẦN 2 ĐỂ TẢI ẢNH TỪ MÁY TÍNH 📁`
                        : `Ảnh cưới #${i + 1} (${dims.ratioLabel}) • ${
                            replaced ? "Đã thay thành công ✓ • " : ""
                          }Bấm lần 1: Chọn ảnh & xem ảnh sẵn có`
                    }
                  >
                    <img
                      src={getImageUrl(slot.props?.imgKey || slot.props?.src)}
                      alt={`Ảnh ${i + 1}`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=200";
                      }}
                      className="w-full h-full object-cover"
                    />

                    {/* Số thứ tự ảnh */}
                    <div className="absolute top-1 left-1 px-1 py-0.2 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold rounded-md leading-tight pointer-events-none">
                      #{i + 1}
                    </div>

                    {/* Badge gợi ý bấm lần 2 khi đang được chọn */}
                    {isBarActive && (
                      <div className="absolute top-1 right-1 px-1 py-0.2 bg-[#e54153] text-white text-[8px] font-bold rounded shadow-xs flex items-center gap-0.5 pointer-events-none animate-pulse">
                        <Upload className="w-2 h-2" />
                        <span>Lần 2</span>
                      </div>
                    )}

                    {/* Tích xanh khi đã thay ảnh thành công HOẶC icon Rotate khi chưa thay */}
                    {replaced ? (
                      <div
                        className="absolute bottom-1 right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500 text-white shadow-md flex items-center justify-center animate-scale-in z-20"
                        title="Đã thay ảnh thành công ✓"
                      >
                        <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-white/90 border border-gray-300 shadow-2xs flex items-center justify-center text-gray-700 group-hover:bg-[#e54153] group-hover:text-white transition-colors">
                        {isThisLoading ? (
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        ) : (
                          <RotateCw className="w-2.5 h-2.5" />
                        )}
                      </div>
                    )}

                    {/* Loading overlay khi đang tải ảnh */}
                    {isThisLoading && (
                      <div className="absolute inset-0 bg-black/45 flex items-center justify-center z-30">
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <input
            ref={quickFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleQuickFileChange}
          />
          <input
            ref={batchFileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleBatchFileChange}
          />
        </div>
      ) : photoSlots.length > 0 ? (
        /* Trạng thái thu nhỏ gọn gàng */
        <div
          className={`fixed bottom-16 sm:bottom-5 z-30 pointer-events-auto select-none transition-all duration-300 ease-in-out animate-fade-in ${
            isLeftDrawerOpen ? "hidden md:block md:left-[395px]" : "left-3 sm:left-24"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setIsQuickPanelCollapsed(false)}
            className="px-3.5 py-2 rounded-full bg-white/95 backdrop-blur-md text-gray-700 hover:text-[#e54153] border border-gray-200/90 shadow-xl text-xs font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Mở rộng thanh thay ảnh nhanh"
          >
            <div className="w-5 h-5 rounded-full bg-rose-50 text-[#e54153] flex items-center justify-center">
              <ImageIcon className="w-3 h-3" />
            </div>
            <span>Thay ảnh nhanh ({photoSlots.length})</span>
            {replacedCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center gap-0.5">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
                <span>{replacedCount}/{photoSlots.length}</span>
              </span>
            )}
            <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
      ) : null}

      {/* ================= FLOATING BOTTOM-RIGHT: AI COLOR (Fixed on screen) ================= */}
      {/* ================= CANVA RIGHT-CLICK CONTEXT MENU ================= */}
      {contextMenu && (
        <EditorContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          selectedElement={contextMenu.element}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          onClose={() => setContextMenu(null)}
          onDuplicate={onDuplicateElement}
          onDelete={onDeleteElement}
          onUpdateProps={onUpdateElementProps}
          onRemoveBackground={onRemoveBackground}
        />
      )}

      {/* ================= DOUBLE-CLICK INLINE TEXT QUICK EDIT POPOVER ================= */}
      {inlineEditNode && (
        <div
          className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
          onClick={() => setInlineEditNode(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 p-5 relative animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#e54153] flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-800">Chỉnh sửa nhanh nội dung</h3>
                  <p className="text-[11px] text-gray-400">Gõ nội dung thiệp và bấm Áp dụng (Ctrl + Enter)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInlineEditNode(null)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              autoFocus
              value={inlineEditNode.text}
              onChange={(e) =>
                setInlineEditNode({ ...inlineEditNode, text: e.target.value })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  onUpdateElementProps(inlineEditNode.id, { text: inlineEditNode.text });
                  setInlineEditNode(null);
                }
              }}
              rows={5}
              className="w-full p-3.5 rounded-2xl border border-gray-200 focus:outline-none focus:border-[#e54153] focus:ring-2 focus:ring-[#e54153]/20 text-sm text-gray-800 font-sans leading-relaxed resize-none"
              placeholder="Nhập nội dung văn bản..."
            />

            <div className="flex items-center justify-between mt-3 text-xs">
              <span className="text-gray-400 text-[11px]">Mẹo: Nhấn Ctrl + Enter để lưu nhanh</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInlineEditNode(null)}
                  className="px-4 py-2 rounded-xl hover:bg-gray-100 text-gray-600 font-semibold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateElementProps(inlineEditNode.id, { text: inlineEditNode.text });
                    setInlineEditNode(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#e54153] hover:bg-[#c93243] text-white font-bold shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  Áp dụng ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
