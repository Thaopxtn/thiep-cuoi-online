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
} from "lucide-react";
import { SelectedElementData } from "./EditorRightInspector";
import { compressImageToWebP } from "@/lib/imageCompression";
import { addUploadedImageToLibrary, addUploadedImagesToLibrary } from "@/lib/mediaLibraryService";
import {
  getSafeImageUrl,
  handleImageFallback,
  FALLBACK_WEDDING_IMG,
  DEFAULT_WEDDING_BACKGROUND,
  isDecorativeAsset,
} from "@/lib/imageUtils";
import { generateVietQrUrl } from "@/lib/vietQrBankCodes";
import { isDecorativeNode, getRealWeddingPhotoSlots } from "@/lib/decorativeLockService";

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
  onOpenImageDrawer?: () => void;
  isLeftDrawerOpen?: boolean;
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
  onOpenImageDrawer,
  isLeftDrawerOpen = false,
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

    // Không cho phép kéo di chuyển nếu phần tử bị khóa hoặc là họa tiết trang trí của mẫu
    if (props.locked || isDecorativeNode(id, nodes[id])) {
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

    // Không cho phép chạm kéo di chuyển nếu phần tử bị khóa hoặc là họa tiết trang trí của mẫu
    if (props.locked || isDecorativeNode(id, nodes[id])) {
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

      const res = await fetch("/api/upload", { method: "POST", body: formData });
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

          const res = await fetch("/api/upload", { method: "POST", body: formData });
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
      className="flex-1 h-full overflow-auto relative flex items-start justify-center p-4 sm:p-8 pb-36 sm:pb-48 select-none bg-[#dedfe2]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onSelectElement(null);
        }
      }}
    >
      {/* ================= INVITATION CANVAS CONTAINER ================= */}
      <div
        className="relative bg-[#fbf8f2] shadow-[0_20px_50px_rgba(0,0,0,0.18)] rounded-xs overflow-hidden transition-transform duration-100 origin-top shrink-0 mb-20"
        style={{
          width: `${canvasWidth}px`,
          minHeight: `${canvasHeight}px`,
          height: `${canvasHeight}px`,
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

          const isDecorative = isDecorativeNode(id, nodes[id]) || Boolean(props.locked);

          return (
            <div
              key={id}
              id={`canvas-node-${id}`}
              onMouseDown={(e) => {
                if (isDecorative) return;
                handleMouseDownElement(e, id, props, type);
              }}
              onClick={(e) => {
                if (isDecorative) return;
                e.stopPropagation();
                onSelectElement({ id, type, props });
              }}
              className={`absolute group select-none ${
                isDecorative
                  ? "pointer-events-none"
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

              {type === "GiftQrBox" && (() => {
                const isRealQrKey =
                  props.imgKey &&
                  (props.imgKey.includes("vietqr.io") || props.imgKey.includes("vietqr"));

                const qrUrl = isRealQrKey
                  ? props.imgKey
                  : generateVietQrUrl(
                      props.bankName || "MB BANK",
                      props.accountNumber || "240220038888",
                      props.accountName || "NGUYEN VAN HUNG",
                      undefined,
                      "Mung cuoi hai ban"
                    );

                return (
                  <div className="w-full h-full bg-white/95 rounded-2xl p-3 border border-rose-200 shadow-md flex flex-col items-center justify-between text-center select-none">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full">
                      <span>🎁</span>
                      <span>{props.modalTitle || "Hộp Quà Mừng Cưới (VietQR)"}</span>
                    </div>

                    {/* Mã QR chuẩn Napas 24/7 Thật */}
                    <div className="w-28 h-28 sm:w-32 sm:h-32 p-1.5 bg-white rounded-xl border-2 border-dashed border-amber-400/80 shadow-inner flex items-center justify-center my-1 overflow-hidden">
                      <img
                        src={qrUrl}
                        alt="Mã VietQR Mừng Cưới"
                        onError={(e) => handleImageFallback(e, undefined, false)}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-[11px] font-bold text-gray-800">
                        {props.bankName || "MB BANK"} • {props.accountNumber || "240220038888"}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase font-semibold truncate max-w-[190px]">
                        {props.accountName || "NGUYEN VAN HUNG"}
                      </p>
                    </div>

                    <span className="text-[10px] text-rose-600 font-bold">
                      Quét mã chuyển khoản Napas 24/7 ↗
                    </span>
                  </div>
                );
              })()}

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
          const isLocked = Boolean(p.locked || isDecorativeNode(selectedElement.id, node));
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
                title={isLocked ? "Họa tiết cố định của mẫu (Không thể di chuyển)" : "Giữ chuột hoặc chạm để di chuyển vị trí"}
              />

              {/* Nếu phần tử bị khóa: Hiển thị Badge thông báo ĐÃ KHÓA CỐ ĐỊNH */}
              {isLocked ? (
                <div
                  className="absolute -top-9 left-1/2 pointer-events-auto bg-amber-600 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap z-50"
                  style={{
                    transform: `translate(-50%, 0) rotate(${-rotation}deg)`,
                    transformOrigin: "center center",
                  }}
                >
                  <Lock className="w-3 h-3 text-amber-200" />
                  <span>Họa tiết cố định</span>
                </div>
              ) : (
                <>
                  {/* 8-Point Interactive Resize Handles (Mouse & Touch Enabled) */}
                  {/* Top-Left (nw) */}
                  <div
                    onMouseDown={(e) => handleMouseDownResize(e, selectedElement.id, "nw", p)}
                    onTouchStart={(e) => handleTouchStartResize(e, selectedElement.id, "nw", p)}
                    className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#e54153] rounded-xs shadow-xs pointer-events-auto cursor-nwse-resize hover:scale-125 transition-transform z-50 touch-none"
                    title="Kéo để co giãn kích thước"
                  />
                  {/* Top-Center (n) */}
                  <div
                    onMouseDown={(e) => handleMouseDownResize(e, selectedElement.id, "n", p)}
                    onTouchStart={(e) => handleTouchStartResize(e, selectedElement.id, "n", p)}
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-[#e54153] rounded-xs shadow-xs pointer-events-auto cursor-ns-resize hover:scale-125 transition-transform z-50 touch-none"
                    title="Kéo để thay đổi chiều cao"
                  />
                  {/* Top-Right (ne) */}
                  <div
                    onMouseDown={(e) => handleMouseDownResize(e, selectedElement.id, "ne", p)}
                    onTouchStart={(e) => handleTouchStartResize(e, selectedElement.id, "ne", p)}
                    className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#e54153] rounded-xs shadow-xs pointer-events-auto cursor-nesw-resize hover:scale-125 transition-transform z-50 touch-none"
                    title="Kéo để co giãn kích thước"
                  />
                  {/* Center-Right (e) */}
                  <div
                    onMouseDown={(e) => handleMouseDownResize(e, selectedElement.id, "e", p)}
                    onTouchStart={(e) => handleTouchStartResize(e, selectedElement.id, "e", p)}
                    className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 bg-white border-2 border-[#e54153] rounded-xs shadow-xs pointer-events-auto cursor-ew-resize hover:scale-125 transition-transform z-50 touch-none"
                    title="Kéo để thay đổi chiều rộng"
                  />
                  {/* Bottom-Right (se) */}
                  <div
                    onMouseDown={(e) => handleMouseDownResize(e, selectedElement.id, "se", p)}
                    onTouchStart={(e) => handleTouchStartResize(e, selectedElement.id, "se", p)}
                    className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#e54153] rounded-xs shadow-xs pointer-events-auto cursor-nwse-resize hover:scale-125 transition-transform z-50 touch-none"
                    title="Kéo để co giãn kích thước"
                  />
                  {/* Bottom-Center (s) */}
                  <div
                    onMouseDown={(e) => handleMouseDownResize(e, selectedElement.id, "s", p)}
                    onTouchStart={(e) => handleTouchStartResize(e, selectedElement.id, "s", p)}
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-[#e54153] rounded-xs shadow-xs pointer-events-auto cursor-ns-resize hover:scale-125 transition-transform z-50 touch-none"
                    title="Kéo để thay đổi chiều cao"
                  />
                  {/* Bottom-Left (sw) */}
                  <div
                    onMouseDown={(e) => handleMouseDownResize(e, selectedElement.id, "sw", p)}
                    onTouchStart={(e) => handleTouchStartResize(e, selectedElement.id, "sw", p)}
                    className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#e54153] rounded-xs shadow-xs pointer-events-auto cursor-nesw-resize hover:scale-125 transition-transform z-50 touch-none"
                    title="Kéo để co giãn kích thước"
                  />
                  {/* Center-Left (w) */}
                  <div
                    onMouseDown={(e) => handleMouseDownResize(e, selectedElement.id, "w", p)}
                    onTouchStart={(e) => handleTouchStartResize(e, selectedElement.id, "w", p)}
                    className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 bg-white border-2 border-[#e54153] rounded-xs shadow-xs pointer-events-auto cursor-ew-resize hover:scale-125 transition-transform z-50 touch-none"
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
                      onTouchStart={(e) => handleTouchStartRotate(e, selectedElement.id)}
                      className="w-5 h-5 rounded-full bg-white border border-gray-300 shadow-sm flex items-center justify-center cursor-grab active:cursor-grabbing text-gray-700 hover:text-[#e54153] hover:scale-110 transition-transform touch-none"
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

      {/* ================= FLOATING RIGHT ZOOM CONTROLS (Fixed on screen) ================= */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col bg-white rounded-full shadow-md border border-gray-200 overflow-hidden z-40">
        <button
          type="button"
          onClick={onZoomIn}
          className="p-2 hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors flex items-center justify-center cursor-pointer"
          title="Phóng to"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onResetZoom}
          className="px-2 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-50 text-center cursor-pointer"
          title="Đặt lại 100%"
        >
          {Math.round(zoomLevel * 100)}%
        </button>
        <button
          type="button"
          onClick={onZoomOut}
          className="p-2 hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors flex items-center justify-center cursor-pointer"
          title="Thu nhỏ"
        >
          <span className="font-bold text-xs block leading-none text-center">−</span>
        </button>
      </div>

      {/* ================= FIXED BOTTOM-LEFT: THAY ẢNH NHANH TOÀN BỘ TEMPLATE ================= */}
      {!isQuickPanelCollapsed ? (
        <div
          className={`fixed bottom-5 z-40 max-w-[calc(100vw-120px)] sm:max-w-[70vw] lg:max-w-2xl pointer-events-auto select-none transition-all duration-300 ease-in-out animate-fade-in ${
            isLeftDrawerOpen ? "left-4 sm:left-[395px]" : "left-16 sm:left-24"
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

            {/* Hướng dẫn thao tác rõ ràng */}
            <div className="flex items-center justify-between text-[10px] text-gray-500 px-0.5">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e54153] inline-block animate-pulse"></span>
                <span>
                  <strong>Bấm lần 1:</strong> Chọn ảnh &amp; xem ảnh sẵn có •{" "}
                  <strong>Bấm lần 2:</strong> Chọn ảnh từ máy •{" "}
                  <strong>Thay hàng loạt:</strong> Tự động gán {photoSlots.length} ảnh, ảnh thừa lưu vào Thư viện
                </span>
              </span>
              {photoSlots.length > 5 && (
                <span className="text-gray-400 hidden md:inline">← Cuộn ngang →</span>
              )}
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
      ) : (
        /* Trạng thái thu nhỏ gọn gàng */
        <div
          className={`fixed bottom-5 z-40 pointer-events-auto select-none transition-all duration-300 ease-in-out animate-fade-in ${
            isLeftDrawerOpen ? "left-4 sm:left-[395px]" : "left-16 sm:left-24"
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
      )}

      {/* ================= FLOATING BOTTOM-RIGHT: AI COLOR (Fixed on screen) ================= */}
      <div className="fixed bottom-5 right-6 z-40 pointer-events-auto">
        <button
          type="button"
          className="px-4 py-2 rounded-full bg-white text-gray-700 hover:text-[#e54153] border border-gray-200 shadow-md text-xs font-semibold flex items-center gap-1.5 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
          <span>AI Color</span>
        </button>
      </div>
    </div>
  );
}
