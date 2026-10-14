"use client";

import React, { useState, useRef } from "react";
import { AdvancedColorPicker } from "@/components/ui/AdvancedColorPicker";
import {
  Settings,
  Sparkles,
  ChevronDown,
  ChevronRight,
  RotateCw,
  Crop,
  Wand2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  FlipHorizontal,
  FlipVertical,
  Layers,
  Sliders,
  Bold,
  Italic,
  Loader2,
  Eraser,
  Calendar as CalendarIcon,
  MapPin,
  Gift,
  Clock,
  Image as ImageIcon,
  Plus,
  Trash2,
  Send,
  Check,
  ExternalLink,
  Lock,
  Palette,
  Users,
  QrCode,
  Building2,
  Copy as CopyIcon,
  Play,
  RefreshCw,
  SlidersHorizontal,
  Eye,
  Zap,
  CheckCircle2,
  Volume2,
  VolumeX,
  Waves,
} from "lucide-react";
import {
  ENTRANCE_EFFECTS,
  EXIT_EFFECTS,
  CONTINUOUS_EFFECTS,
  ANIMATION_CATEGORIES,
  DURATION_PRESETS,
  DELAY_PRESETS,
  EASING_OPTIONS,
  ANIMATION_COMBOS,
  HOVER_EFFECTS,
  AnimationMode,
  AnimationGroup,
  AnimationCategory,
  AnimationCombo,
  ContinuousEffectItem,
  ANIMATION_KEYFRAME_MAP,
} from "@/lib/animationCatalog";
import { weddingSounds } from "@/lib/soundEffects";
import { compressImageToWebP } from "@/lib/imageCompression";
import {  addUploadedImageToLibrary, addUploadedImagesToLibrary , uploadFileToServer } from "@/lib/mediaLibraryService";
import { getSafeImageUrl } from "@/lib/imageUtils";
import { isDecorativeNode } from "@/lib/decorativeLockService";
import {
  parseTimelineItems,
  generateTimelineHtml,
  parseDressCode,
  generateDressCodeHtml,
  parseCeremony,
  generateCeremonyHtml,
  parseFamilyInfo,
  generateFamilyInfoHtml,
  parseBankCard,
  generateBankCardHtml,
  calculateCountdown,
  formatCalendarData,
  TimelineItem,
  DressCodeColor,
  CeremonyData,
  FamilyInfoData,
  BankCardData,
} from "@/lib/moduleHelpers";
import { generateVietQrUrl, resolveBankCode } from "@/lib/vietQrBankCodes";

export interface SelectedElementData {
  id: string;
  type: "PhotoBox" | "TextBox" | "Container" | "Widget" | string;
  props: Record<string, any>;
}

interface EditorRightInspectorProps {
  selectedElement: SelectedElementData | null;
  onUpdateProps: (elementId: string, updatedProps: Record<string, any>) => void;
  onReplaceImage?: () => void;
  onRemoveBackground?: () => void;
  onOpenManualCutout?: () => void;
  isRemovingBackground?: boolean;
  onApplyComboToAll?: (combo: AnimationCombo) => void;
  onApplyStaggerAll?: (stepDelay: number) => void;
}

export default function EditorRightInspector({
  selectedElement,
  onUpdateProps,
  onReplaceImage,
  onRemoveBackground,
  onOpenManualCutout,
  isRemovingBackground = false,
  onApplyComboToAll,
  onApplyStaggerAll,
}: EditorRightInspectorProps) {
  const [activeTab, setActiveTab] = useState<"settings" | "effects">("settings");
  const [effectGroup, setEffectGroup] = useState<AnimationGroup>("entrance");
  const [animMode, setAnimMode] = useState<AnimationMode>("entrance");
  const [animCategory, setAnimCategory] = useState<AnimationCategory>("all");
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [showAdvancedTiming, setShowAdvancedTiming] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [selectedComboId, setSelectedComboId] = useState<string | null>(null);
  const [staggerStep, setStaggerStep] = useState<number>(0.15);
  const [miniPreviewKey, setMiniPreviewKey] = useState<number>(0);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    image: true,
    filters: true,
    flip: false,
    clickAction: false,
    padding: false,
    border: false,
    shadow: false,
    advanced: false,
    text: true,
    widget: true,
  });

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const carouselFileInputRef = useRef<HTMLInputElement>(null);
  const carouselBatchFileInputRef = useRef<HTMLInputElement>(null);
  const carouselSwapSingleInputRef = useRef<HTMLInputElement>(null);
  const swapIndexRef = useRef<number | null>(null);

  const [isReplacingImage, setIsReplacingImage] = useState(false);
  const [isUploadingCarousel, setIsUploadingCarousel] = useState(false);
  const [carouselUploadProgress, setCarouselUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [carouselMessage, setCarouselMessage] = useState<string | null>(null);

  const handleTriggerFilePicker = () => {
    if (replaceFileInputRef.current) {
      replaceFileInputRef.current.value = "";
      replaceFileInputRef.current.click();
    }
  };

  const handleFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedElement) return;

    try {
      setIsReplacingImage(true);
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

      onUpdateProps(selectedElement.id, { imgKey: uploadedUrl, src: uploadedUrl });
    } catch (err) {
      console.error("Lỗi thay ảnh:", err);
      const localUrl = URL.createObjectURL(file);
      addUploadedImageToLibrary(localUrl);
      onUpdateProps(selectedElement.id, { imgKey: localUrl, src: localUrl });
    } finally {
      setIsReplacingImage(false);
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = "";
    }
  };

  const handleBatchReplaceCarouselImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !selectedElement) return;

    try {
      setIsUploadingCarousel(true);
      setCarouselUploadProgress({ current: 0, total: files.length });
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCarouselUploadProgress({ current: i + 1, total: files.length });

        try {
          const compressed = await compressImageToWebP(file, { maxDimension: 1600, quality: 0.82 });
          let uploadedUrl = compressed.dataUrl;

          try {
            const formData = new FormData();
            formData.append("file", compressed.file);
            const res = await uploadFileToServer(formData);
            if (res.ok) {
              const json = await res.json();
              if (json.url) uploadedUrl = json.url;
            }
          } catch (uploadErr) {
            console.warn("Upload carousel image API warning:", uploadErr);
          }

          uploadedUrls.push(uploadedUrl);
        } catch (itemErr) {
          console.error("Lỗi nén ảnh batch:", itemErr);
          const fallbackUrl = URL.createObjectURL(file);
          uploadedUrls.push(fallbackUrl);
        }
      }

      if (uploadedUrls.length > 0) {
        // Tự động lưu tất cả ảnh mới vào Thư viện ảnh đã tải lên
        addUploadedImagesToLibrary(uploadedUrls);

        // Thay thế toàn bộ danh sách ảnh trong album
        const newList = uploadedUrls.map((url, idx) => ({
          imageKey: url,
          src: url,
          caption: `Khoảnh khắc cưới ${idx + 1}`,
        }));
        onUpdateProps(selectedElement.id, { imgList: newList });
        setCarouselMessage(`Đã thay thế toàn bộ bằng ${uploadedUrls.length} ảnh mới!`);
        setTimeout(() => setCarouselMessage(null), 4000);
      }
    } catch (err) {
      console.error("Lỗi thay ảnh hàng loạt:", err);
    } finally {
      setIsUploadingCarousel(false);
      setCarouselUploadProgress(null);
      if (carouselBatchFileInputRef.current) carouselBatchFileInputRef.current.value = "";
    }
  };

  const handleAddCarouselImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !selectedElement) return;

    try {
      setIsUploadingCarousel(true);
      setCarouselUploadProgress({ current: 0, total: files.length });
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCarouselUploadProgress({ current: i + 1, total: files.length });

        try {
          const compressed = await compressImageToWebP(file, { maxDimension: 1600, quality: 0.82 });
          let uploadedUrl = compressed.dataUrl;

          try {
            const formData = new FormData();
            formData.append("file", compressed.file);
            const res = await uploadFileToServer(formData);
            if (res.ok) {
              const json = await res.json();
              if (json.url) uploadedUrl = json.url;
            }
          } catch (uploadErr) {
            console.warn("Upload carousel image API warning:", uploadErr);
          }

          uploadedUrls.push(uploadedUrl);
        } catch (itemErr) {
          console.error("Lỗi nén ảnh thêm album:", itemErr);
          const fallbackUrl = URL.createObjectURL(file);
          uploadedUrls.push(fallbackUrl);
        }
      }

      if (uploadedUrls.length > 0) {
        // Tự động lưu vào Thư viện ảnh đã tải lên
        addUploadedImagesToLibrary(uploadedUrls);

        const currentList = Array.isArray(selectedElement.props.imgList) ? [...selectedElement.props.imgList] : [];
        const newItems = uploadedUrls.map((url, idx) => ({
          imageKey: url,
          src: url,
          caption: `Khoảnh khắc cưới ${currentList.length + idx + 1}`,
        }));
        onUpdateProps(selectedElement.id, { imgList: [...currentList, ...newItems] });
        setCarouselMessage(`Đã thêm ${uploadedUrls.length} ảnh vào album!`);
        setTimeout(() => setCarouselMessage(null), 4000);
      }
    } catch (err) {
      console.error("Lỗi thêm ảnh album:", err);
    } finally {
      setIsUploadingCarousel(false);
      setCarouselUploadProgress(null);
      if (carouselFileInputRef.current) carouselFileInputRef.current.value = "";
    }
  };

  const handleTriggerSwapSingleImage = (index: number) => {
    swapIndexRef.current = index;
    if (carouselSwapSingleInputRef.current) {
      carouselSwapSingleInputRef.current.value = "";
      carouselSwapSingleInputRef.current.click();
    }
  };

  const handleSwapSingleFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetIdx = swapIndexRef.current;
    if (!file || !selectedElement || targetIdx === null) return;

    try {
      setIsUploadingCarousel(true);
      const compressed = await compressImageToWebP(file, { maxDimension: 1600, quality: 0.82 });
      let uploadedUrl = compressed.dataUrl;

      try {
        const formData = new FormData();
        formData.append("file", compressed.file);
        const res = await uploadFileToServer(formData);
        if (res.ok) {
          const json = await res.json();
          if (json.url) uploadedUrl = json.url;
        }
      } catch (uploadErr) {
        console.warn("Upload swap image API warning:", uploadErr);
      }

      // Lưu ảnh mới vào Thư viện đã tải lên
      addUploadedImageToLibrary(uploadedUrl);

      const currentList = Array.isArray(selectedElement.props.imgList) ? [...selectedElement.props.imgList] : [];
      if (currentList[targetIdx]) {
        currentList[targetIdx] = {
          ...currentList[targetIdx],
          imageKey: uploadedUrl,
          src: uploadedUrl,
        };
        onUpdateProps(selectedElement.id, { imgList: currentList });
        setCarouselMessage(`Đã đổi ảnh vị trí #${targetIdx + 1}!`);
        setTimeout(() => setCarouselMessage(null), 3000);
      }
    } catch (err) {
      console.error("Lỗi đổi ảnh album:", err);
    } finally {
      setIsUploadingCarousel(false);
      swapIndexRef.current = null;
      if (carouselSwapSingleInputRef.current) carouselSwapSingleInputRef.current.value = "";
    }
  };

  const handleClearCarouselImages = () => {
    if (!selectedElement) return;
    if (window.confirm("Bạn có chắc chắn muốn xóa tất cả ảnh trong album này? Bạn có thể thêm lại hoặc thay hàng loạt bất cứ lúc nào.")) {
      onUpdateProps(selectedElement.id, { imgList: [] });
      setCarouselMessage("Đã làm trống album ảnh.");
      setTimeout(() => setCarouselMessage(null), 3000);
    }
  };

  const handleRemoveCarouselImage = (index: number) => {
    if (!selectedElement) return;
    const currentList = Array.isArray(selectedElement.props.imgList) ? [...selectedElement.props.imgList] : [];
    currentList.splice(index, 1);
    onUpdateProps(selectedElement.id, { imgList: currentList });
  };

  if (!selectedElement) {
    return (
      <aside className="w-[300px] sm:w-[320px] bg-white border-l border-gray-200 h-full flex flex-col z-30 select-none shrink-0 shadow-xs p-5 text-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-3">
          <Settings className="w-6 h-6" />
        </div>
        <h4 className="text-xs font-bold text-gray-800">Chưa chọn phần tử nào</h4>
        <p className="text-[11px] text-gray-500 mt-1 max-w-[200px] mx-auto leading-relaxed">
          Nhấn vào bất kỳ ảnh, chữ, khối hình hoặc tiện ích trên thiệp để tùy chỉnh chi tiết.
        </p>
      </aside>
    );
  }

  const { id, type, props } = selectedElement;
  const isLocked = Boolean(props.locked || isDecorativeNode(id, { props, type }));
  const isImage = type === "PhotoBox" || (!props.text && !!props.imgKey);
  const isShape = type === "GeometricBox" || type === "LineBox";
  const isCountdown = type === "CountdownBoxV2" || type === "CountdownBox" || id.includes("countdown");
  const isCalendar = type === "CalendarBoxV2" || type === "CalendarBox" || id.includes("calendar");
  const isMap = type === "MapBox" || id.includes("map");
  const isGift = type === "GiftQrBox" || id.includes("gift_qr");
  const isRsvp = type === "RsvpBoxV2" || type === "RsvpBox" || id.includes("rsvp");
  const isCarousel = type === "CarouselBox";

  // Check interactive / structured wedding modules
  const isTimeline =
    type === "TimelineBox" ||
    id === "node_timeline_card" ||
    id.includes("timeline_card") ||
    props.moduleType === "timeline" ||
    (Array.isArray(props.items) && id.includes("timeline")) ||
    (typeof props.text === "string" && props.text.includes("Photo Booth") && !props.imgKey);

  const isDressCode =
    type === "DressCodeBox" ||
    id === "node_dress_card" ||
    id.includes("dress_card") ||
    props.moduleType === "dressCode" ||
    (Array.isArray(props.colors) && id.includes("dress")) ||
    (typeof props.text === "string" && (props.text.includes("DRESS CODE") || props.text.includes("trang phục theo tông màu")));

  const isCeremony =
    type === "CeremonyBox" ||
    id.startsWith("node_ceremony_") ||
    props.moduleType === "ceremony" ||
    !!props.ceremonyName ||
    (typeof props.text === "string" && (props.text.includes("Lễ Vu Quy") || props.text.includes("Lễ Thành Hôn")));

  const isFamilyInfo =
    type === "FamilyInfoBox" ||
    id === "node_family_info" ||
    props.moduleType === "familyInfo" ||
    (typeof props.text === "string" && props.text.includes("NHÀ TRAI") && props.text.includes("NHÀ GÁI"));

  const isBankCard =
    type === "BankCardBox" ||
    id === "node_bank_card" ||
    id.includes("bank_card") ||
    props.moduleType === "bankCard" ||
    (typeof props.text === "string" && (props.text.includes("HỘP MỪNG CƯỚI") || props.text.includes("STK:")));

  const isSpecialModule =
    isTimeline ||
    isDressCode ||
    isCeremony ||
    isFamilyInfo ||
    isBankCard ||
    isCountdown ||
    isCalendar ||
    isMap ||
    isGift ||
    isRsvp ||
    isCarousel;

  const isText = (type === "TextBox" || typeof props.text === "string") && !isSpecialModule;

  const toHexColor = (colorStr?: string): string => {
    if (!colorStr) return "#1c171a";
    if (colorStr.startsWith("#")) return colorStr.substring(0, 7);
    const rgbaMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (rgbaMatch) {
      const r = parseInt(rgbaMatch[1]).toString(16).padStart(2, "0");
      const g = parseInt(rgbaMatch[2]).toString(16).padStart(2, "0");
      const b = parseInt(rgbaMatch[3]).toString(16).padStart(2, "0");
      return `#${r}${g}${b}`;
    }
    return "#1c171a";
  };

  const handlePropChange = (key: string, value: any) => {
    onUpdateProps(id, { [key]: value });
  };

  const getFullImageUrl = (key: string) => {
    return getSafeImageUrl(
      key,
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=400"
    );
  };

  return (
    <aside className="w-[300px] sm:w-[320px] bg-white border-l border-gray-200 h-full flex flex-col z-30 select-none shrink-0 shadow-xs">
      {/* Top Tabs: Cài đặt | Hiệu ứng */}
      <div className="flex border-b border-gray-200 bg-gray-50/50 p-1 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "settings"
              ? "bg-white text-gray-900 shadow-2xs"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <Settings className="w-3.5 h-3.5 text-gray-600" />
          <span>Cài đặt</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("effects")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "effects"
              ? "bg-white text-gray-900 shadow-2xs"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Hiệu ứng</span>
        </button>
      </div>

      {/* Inspector Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ================= TAB: CÀI ĐẶT (SETTINGS) ================= */}
        {activeTab === "settings" && (
          <div className="space-y-4">
            {/* Banner nếu phần tử bị khóa cố định */}
            {isLocked && (
              <div className="p-3 bg-amber-50 border border-amber-200/90 rounded-2xl text-amber-900 shadow-2xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-xs text-amber-800">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Họa tiết trang trí của mẫu</span>
                  <span className="ml-auto text-[10px] font-semibold bg-amber-200/70 text-amber-800 px-2 py-0.5 rounded-full">
                    Đã khóa cố định
                  </span>
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Chi tiết này là đồ họa nghệ thuật gốc của thiệp, được cố định vị trí và hình ảnh để bảo toàn tính thẩm mỹ chuẩn.
                </p>
              </div>
            )}

            {/* 1. PHOTO INSPECTOR */}
            {isImage && (
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                  <span>Hình ảnh</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shrink-0 shadow-2xs group">
                      <img
                        src={getFullImageUrl(props.imgKey || props.src)}
                        alt="Selected Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=400";
                        }}
                      />
                      {!isLocked && (
                        <div
                          onClick={handleTriggerFilePicker}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white text-[10px] font-bold"
                        >
                          Đổi ảnh
                        </div>
                      )}
                    </div>

                    {isLocked ? (
                      <div className="flex-1 p-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-stone-600 text-xs flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="text-[11px] leading-tight">Họa tiết cố định, không thể thay đổi ảnh</span>
                      </div>
                    ) : (
                      <div className="flex-1 space-y-2">
                        <button
                          type="button"
                          onClick={handleTriggerFilePicker}
                          disabled={isReplacingImage}
                          className="w-full py-2 px-3 bg-zen-primary hover:bg-[#d93849] active:scale-98 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          {isReplacingImage ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RotateCw className="w-3.5 h-3.5" />
                          )}
                          <span>{isReplacingImage ? "Đang xử lý..." : "Đổi ảnh"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={onRemoveBackground}
                          disabled={isRemovingBackground}
                          className="w-full py-1.5 px-3 border border-purple-200 bg-purple-50/60 hover:bg-purple-100/60 disabled:opacity-60 text-purple-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {isRemovingBackground ? (
                            <Loader2 className="w-3.5 h-3.5 text-purple-600 animate-spin" />
                          ) : (
                            <Wand2 className="w-3.5 h-3.5 text-purple-600" />
                          )}
                          <span>{isRemovingBackground ? "Đang tách nền..." : "Xóa phông AI"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={onOpenManualCutout}
                          className="w-full py-1.5 px-3 border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/60 text-indigo-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          title="Tẩy nền thủ công & khôi phục nhân vật bằng cọ vẽ"
                        >
                          <Eraser className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Chỉnh sửa bằng tay</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <input
                    ref={replaceFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFilePicked}
                    className="hidden"
                  />

                  {/* Filter presets */}
                  <div className="pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => toggleAccordion("filters")}
                      className="w-full py-1.5 text-xs font-semibold text-gray-800 flex items-center justify-between hover:text-gray-900"
                    >
                      <span className="flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-gray-500" />
                        <span>Bộ lọc & Màu ảnh</span>
                      </span>
                      {openAccordions["filters"] ? (
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </button>

                    {openAccordions["filters"] && (
                      <div className="space-y-3 pt-2">
                        <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                          {[
                            { id: "none", name: "Gốc", filter: "none" },
                            { id: "warm", name: "Ấm áp", filter: "sepia(0.25) contrast(1.05) saturate(1.15)" },
                            { id: "romance", name: "Lãng mạn", filter: "brightness(1.05) contrast(0.95) saturate(1.1) hue-rotate(-5deg)" },
                            { id: "cinema", name: "Điện ảnh", filter: "contrast(1.2) saturate(0.85)" },
                            { id: "bw", name: "Đen trắng", filter: "grayscale(1) contrast(1.15)" },
                            { id: "vintage", name: "Cổ điển", filter: "sepia(0.4) contrast(0.9) brightness(0.95)" },
                          ].map((f) => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => handlePropChange("filterStyle", f.filter)}
                              className={`py-1.5 rounded-lg border text-center transition-all ${
                                (props.filterStyle || "none") === f.filter
                                  ? "border-zen-primary bg-rose-50/50 text-zen-primary font-bold shadow-2xs"
                                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              {f.name}
                            </button>
                          ))}
                        </div>

                        {/* Sliders */}
                        <div className="space-y-2 pt-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Độ sáng:</span>
                            <span className="font-mono text-gray-500">{props.brightness ?? 100}%</span>
                          </div>
                          <input
                            type="range"
                            min="50"
                            max="150"
                            value={props.brightness ?? 100}
                            onChange={(e) => {
                              const b = parseInt(e.target.value);
                              handlePropChange("brightness", b);
                              handlePropChange("filterStyle", `brightness(${b / 100}) contrast(${(props.contrast ?? 100) / 100})`);
                            }}
                            className="w-full accent-zen-primary"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Lật ảnh */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">Lật ảnh:</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handlePropChange("flipX", !props.flipX)}
                        className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 ${
                          props.flipX ? "bg-rose-50 border-zen-primary text-zen-primary" : "border-gray-200 text-gray-600"
                        }`}
                        title="Lật ngang"
                      >
                        <FlipHorizontal className="w-3.5 h-3.5" />
                        <span>Ngang</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePropChange("flipY", !props.flipY)}
                        className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 ${
                          props.flipY ? "bg-rose-50 border-zen-primary text-zen-primary" : "border-gray-200 text-gray-600"
                        }`}
                        title="Lật dọc"
                      >
                        <FlipVertical className="w-3.5 h-3.5" />
                        <span>Dọc</span>
                      </button>
                    </div>
                  </div>

                  {/* Bo góc ảnh */}
                  <div className="pt-2 border-t border-gray-100 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700">Bo góc (px):</span>
                      <span className="font-mono text-gray-500">
                        {Array.isArray(props.borderRadius) ? props.borderRadius[0] : (props.borderRadius || 0)}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Array.isArray(props.borderRadius) ? props.borderRadius[0] : (props.borderRadius || 0)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        handlePropChange("borderRadius", [val, val, val, val]);
                      }}
                      className="w-full accent-zen-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. TEXT INSPECTOR */}
            {isText && !isImage && (
              <div className="space-y-4">
                <div className="flex items-center gap-1 text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                  <span>Văn bản</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-700">Nội dung chữ:</label>
                  <textarea
                    value={props.text || ""}
                    onChange={(e) => handlePropChange("text", e.target.value)}
                    rows={3}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary font-sans"
                  />
                </div>

                {/* Font family */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-700">Font chữ thiết kế:</label>
                  <select
                    value={props.fontFamily || "font-playfair"}
                    onChange={(e) => handlePropChange("fontFamily", e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white font-medium"
                  >
                    <optgroup label="Thư Pháp & Chữ Viết Tay Việt Hóa">
                      <option value="font-charmonman">Charmonman (Chữ ký hoàng gia Việt hóa)</option>
                      <option value="font-charm">Charm (Thư pháp thanh lịch Việt hóa)</option>
                      <option value="font-dancing-script">Dancing Script (Thư pháp trẻ trung)</option>
                      <option value="font-great-vibes">Great Vibes (Thư pháp uốn lượn)</option>
                      <option value="font-alex-brush">Alex Brush (Chữ ký thanh thoát)</option>
                      <option value="font-pacifico">Pacifico (Bút cọ ngọt ngào)</option>
                      <option value="font-parisienne">Parisienne (Quý phái lãng mạn)</option>
                      <option value="font-allura">Allura (Mềm mại uyển chuyển)</option>
                      <option value="font-ephesis">Ephesis (Bay bổng nghệ thuật)</option>
                      <option value="font-pinyon">Pinyon Script (Cổ điển quý tộc)</option>
                      <option value="font-sacramento">Sacramento (Nét thanh tao)</option>
                    </optgroup>
                    <optgroup label="Serif Sang Trọng & Hoàng Gia">
                      <option value="font-playfair">Playfair Display (Cổ điển sang trọng)</option>
                      <option value="font-lora">Lora (Serif tinh tế chuẩn mực)</option>
                      <option value="font-cormorant">Cormorant Garamond (Đẳng cấp châu Âu)</option>
                      <option value="font-cinzel">Cinzel (Hoàng gia La Mã)</option>
                      <option value="font-prata">Prata (Thời trang thanh lịch)</option>
                    </optgroup>
                    <optgroup label="Hiện Đại & Tinh Gọn">
                      <option value="font-vietnam">Be Vietnam Pro (Chuẩn quốc dân)</option>
                      <option value="font-montserrat">Montserrat (Hình khối hiện đại)</option>
                      <option value="font-jakarta">Plus Jakarta Sans (Mượt mà thời thượng)</option>
                      <option value="font-sans">Inter (Giao diện tiêu chuẩn)</option>
                    </optgroup>
                  </select>
                </div>

                {/* Font size */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700">Cỡ chữ (px):</span>
                    <span className="font-mono text-gray-500">{props.fontSize || 24}px</span>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="80"
                    value={props.fontSize || 24}
                    onChange={(e) => handlePropChange("fontSize", parseInt(e.target.value))}
                    className="w-full accent-zen-primary"
                  />
                </div>

                {/* Color picker */}
                <div className="space-y-2 pt-1 border-t border-gray-100">
                  <AdvancedColorPicker
                    label="Màu chữ"
                    color={props.color || "#1c171a"}
                    onChange={(hex: string) => handlePropChange("color", hex)}
                    defaultSwatches={[
                      { label: "Đỏ đô hoàng gia", color: "#511419" },
                      { label: "Đen than trang trọng", color: "#1c171a" },
                      { label: "Nâu đất đậm", color: "#451a03" },
                      { label: "Vàng đồng ánh kim", color: "#b45309" },
                      { label: "Trắng nổi bật", color: "#ffffff" },
                      { label: "Hồng đất lãng mạn", color: "#9f1239" },
                    ]}
                  />

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { label: "Đỏ đô hoàng gia", color: "#511419" },
                      { label: "Đen than trang trọng", color: "#1c171a" },
                      { label: "Nâu đất đậm", color: "#451a03" },
                      { label: "Vàng đồng ánh kim", color: "#b45309" },
                      { label: "Trắng nổi bật", color: "#ffffff" },
                      { label: "Hồng đất lãng mạn", color: "#9f1239" },
                    ].map((swatch) => (
                      <button
                        key={swatch.color}
                        type="button"
                        onClick={() => handlePropChange("color", swatch.color)}
                        className="w-6 h-6 rounded-full border border-gray-300 shadow-2xs hover:scale-110 active:scale-95 transition-transform"
                        style={{ backgroundColor: swatch.color }}
                        title={swatch.label}
                      />
                    ))}
                  </div>

                  {/* Anti-submerge Text Shadow */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">Đổ bóng chống chìm chữ:</span>
                    <input
                      type="checkbox"
                      checked={!!props.hasTextShadow}
                      onChange={(e) => {
                        handlePropChange("hasTextShadow", e.target.checked);
                        if (e.target.checked && !props.textShadow) {
                          handlePropChange("textShadow", { offsetX: 0, offsetY: 1, blur: 4, color: "rgba(0,0,0,0.6)" });
                        }
                      }}
                      className="accent-zen-primary"
                    />
                  </div>
                </div>

                {/* Alignment */}
                <div className="flex items-center gap-1 border border-gray-200 rounded-xl p-1 bg-gray-50 justify-around">
                  <button
                    type="button"
                    onClick={() => handlePropChange("fontWeight", props.fontWeight === "bold" ? "normal" : "bold")}
                    className={`p-1.5 rounded-lg ${props.fontWeight === "bold" ? "bg-white text-zen-primary font-bold shadow-2xs" : "text-gray-600"}`}
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePropChange("fontStyle", props.fontStyle === "italic" ? "normal" : "italic")}
                    className={`p-1.5 rounded-lg ${props.fontStyle === "italic" ? "bg-white text-zen-primary shadow-2xs" : "text-gray-600"}`}
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePropChange("textAlign", "left")}
                    className={`p-1.5 rounded-lg ${props.textAlign === "left" ? "bg-white text-zen-primary shadow-2xs" : "text-gray-600"}`}
                  >
                    <AlignLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePropChange("textAlign", "center")}
                    className={`p-1.5 rounded-lg ${props.textAlign === "center" ? "bg-white text-zen-primary shadow-2xs" : "text-gray-600"}`}
                  >
                    <AlignCenter className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePropChange("textAlign", "right")}
                    className={`p-1.5 rounded-lg ${props.textAlign === "right" ? "bg-white text-zen-primary shadow-2xs" : "text-gray-600"}`}
                  >
                    <AlignRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* 3. SHAPE & GEOMETRIC INSPECTOR */}
            {isShape && (
              <div className="space-y-4">
                <div className="flex items-center gap-1 text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                  <span>Khối hình học / Hộp nền</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700">Màu nền:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={toHexColor(props.fill || props.backgroundColor)}
                        onChange={(e) => handlePropChange("fill", e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0"
                      />
                      <span className="text-xs font-mono text-gray-500 uppercase">
                        {props.fill || props.backgroundColor || "Trong suốt"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {[
                      { label: "Đỏ đô hoàng gia", color: "rgba(81, 20, 25, 1.00)" },
                      { label: "Trắng tinh", color: "#ffffff" },
                      { label: "Kem vintage", color: "#faf7f2" },
                      { label: "Đen than", color: "#1c171a" },
                      { label: "Vàng đồng", color: "#b45309" },
                    ].map((swatch) => (
                      <button
                        key={swatch.color}
                        type="button"
                        onClick={() => handlePropChange("fill", swatch.color)}
                        className="w-6 h-6 rounded-full border border-gray-300 shadow-2xs hover:scale-110 active:scale-95 transition-transform"
                        style={{ backgroundColor: swatch.color }}
                        title={swatch.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Opacity slider */}
                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700">Độ mờ (Opacity):</span>
                    <span className="font-mono text-gray-600">
                      {typeof props.opacity === "number" ? props.opacity.toFixed(2) : "1.00"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={props.opacity ?? 1}
                    onChange={(e) => handlePropChange("opacity", parseFloat(e.target.value))}
                    className="w-full accent-zen-primary"
                  />
                </div>

                {/* Border Radius */}
                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700">Bo góc (px):</span>
                    <span className="font-mono text-gray-600">
                      {Array.isArray(props.borderRadius) ? props.borderRadius[0] : (props.borderRadius || 0)}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={Array.isArray(props.borderRadius) ? props.borderRadius[0] : (props.borderRadius || 0)}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      handlePropChange("borderRadius", [val, val, val, val]);
                    }}
                    className="w-full accent-zen-primary"
                  />
                </div>
              </div>
            )}

            {/* 4. TIMELINE INSPECTOR */}
            {isTimeline && (() => {
              const items = parseTimelineItems(props.text, props.items);
              const title = props.title || "LỊCH TRÌNH NGÀY CƯỚI";

              const handleUpdateTimeline = (newItems: TimelineItem[], newTitle = title) => {
                const primaryColor = props.color || props.primaryColor || "#6b3b59";
                const textColor = props.textColor || "#2c2420";
                const newHtml = generateTimelineHtml(newItems, primaryColor, textColor);
                const newHeight = Math.max(160, newItems.length * 52 + 35);
                onUpdateProps(id, {
                  items: newItems,
                  title: newTitle,
                  text: newHtml,
                  height: newHeight,
                });
              };

              const handleItemChange = (idx: number, field: "time" | "title", val: string) => {
                const updated = [...items];
                updated[idx] = { ...updated[idx], [field]: val };
                handleUpdateTimeline(updated);
              };

              const handleAddItem = () => {
                const nextId = `t_${Date.now()}`;
                const lastTime = items[items.length - 1]?.time || "12:00";
                const updated = [...items, { id: nextId, time: lastTime, title: "Hoạt động mới" }];
                handleUpdateTimeline(updated);
              };

              const handleDeleteItem = (idx: number) => {
                if (items.length <= 1) return;
                const updated = items.filter((_, i) => i !== idx);
                handleUpdateTimeline(updated);
              };

              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
                    <Clock className="w-4 h-4 text-zen-primary" />
                    <span>Lịch trình ngày cưới (Timeline)</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-700">Tiêu đề lịch trình:</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => handleUpdateTimeline(items, e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white font-semibold"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                      <span>Các mốc thời gian ({items.length}):</span>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="text-[11px] text-zen-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm mốc</span>
                      </button>
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto p-1">
                      {items.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-2 group hover:border-gray-300 transition-colors"
                        >
                          <span className="text-[10px] font-bold text-gray-400 w-4 text-center shrink-0">
                            #{idx + 1}
                          </span>
                          <input
                            type="text"
                            value={item.time}
                            onChange={(e) => handleItemChange(idx, "time", e.target.value)}
                            placeholder="10:00"
                            className="w-16 p-1.5 text-xs font-bold rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-zen-primary text-center shrink-0"
                          />
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => handleItemChange(idx, "title", e.target.value)}
                            placeholder="Tên hoạt động"
                            className="flex-1 p-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-zen-primary font-medium"
                          />
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(idx)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                              title="Xóa mốc này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full py-2 rounded-xl border border-dashed border-rose-300 text-zen-primary hover:bg-rose-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Thêm mốc thời gian</span>
                  </button>
                </div>
              );
            })()}

            {/* 5. DRESS CODE INSPECTOR */}
            {isDressCode && (() => {
              const parsed = parseDressCode(props.text, props.colors, props.description);
              const colors = parsed.colors;
              const description = parsed.description;
              const title = props.title || "DRESS CODE TRANG PHỤC";

              const handleUpdateDressCode = (newColors: DressCodeColor[], newDesc = description, newTitle = title) => {
                const textColor = props.textColor || "#2c2420";
                const newHtml = generateDressCodeHtml(newColors, newDesc, textColor);
                onUpdateProps(id, {
                  colors: newColors,
                  description: newDesc,
                  title: newTitle,
                  text: newHtml,
                });
              };

              const handleColorChange = (idx: number, field: "color" | "label", val: string) => {
                const updated = [...colors];
                updated[idx] = { ...updated[idx], [field]: val };
                handleUpdateDressCode(updated);
              };

              const handleAddColor = () => {
                const next = [...colors, { color: "#F7D6D0", label: "Hồng phấn" }];
                handleUpdateDressCode(next);
              };

              const handleDeleteColor = (idx: number) => {
                if (colors.length <= 1) return;
                const next = colors.filter((_, i) => i !== idx);
                handleUpdateDressCode(next);
              };

              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
                    <Palette className="w-4 h-4 text-zen-primary" />
                    <span>Quy định trang phục (Dress Code)</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-700">Tiêu đề:</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => handleUpdateDressCode(colors, description, e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-700">Lời nhắn dặn dò:</label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => handleUpdateDressCode(colors, e.target.value, title)}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                      <span>Tông màu trang phục ({colors.length}):</span>
                      <button
                        type="button"
                        onClick={handleAddColor}
                        className="text-[11px] text-zen-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm màu</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {colors.map((c, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-2 group hover:border-gray-300 transition-colors"
                        >
                          <input
                            type="color"
                            value={toHexColor(c.color)}
                            onChange={(e) => handleColorChange(idx, "color", e.target.value)}
                            className="w-7 h-7 rounded-lg cursor-pointer border-0 shrink-0 p-0"
                            title="Chọn màu"
                          />
                          <input
                            type="text"
                            value={c.label}
                            onChange={(e) => handleColorChange(idx, "label", e.target.value)}
                            placeholder="Tên màu (VD: Be, Trắng)"
                            className="flex-1 p-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-zen-primary font-medium"
                          />
                          {colors.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteColor(idx)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                              title="Xóa màu này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddColor}
                    className="w-full py-2 rounded-xl border border-dashed border-rose-300 text-zen-primary hover:bg-rose-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Thêm màu trang phục</span>
                  </button>
                </div>
              );
            })()}

            {/* 6. CEREMONY INSPECTOR */}
            {isCeremony && (() => {
              const data = parseCeremony(props.text, props);

              const handleUpdate = (patch: Partial<CeremonyData>) => {
                const updated = { ...data, ...patch };
                const primaryColor = props.color || props.primaryColor || "#6b3b59";
                const textColor = props.textColor || "#2c2420";
                const newHtml = generateCeremonyHtml(updated, primaryColor, textColor);
                onUpdateProps(id, {
                  ...updated,
                  text: newHtml,
                });
              };

              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
                    <Sparkles className="w-4 h-4 text-zen-primary" />
                    <span>Chương trình hôn lễ (Buổi Lễ)</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-700">Tên buổi lễ:</label>
                    <input
                      type="text"
                      value={data.ceremonyName}
                      onChange={(e) => handleUpdate({ ceremonyName: e.target.value })}
                      placeholder="Lễ Vu Quy / Lễ Thành Hôn / Tiệc Mừng"
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-700">Giờ tổ chức:</label>
                      <input
                        type="text"
                        value={data.time}
                        onChange={(e) => handleUpdate({ time: e.target.value })}
                        placeholder="11:30"
                        className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-700">Ngày dương lịch:</label>
                      <input
                        type="text"
                        value={data.date}
                        onChange={(e) => handleUpdate({ date: e.target.value })}
                        placeholder="2027-09-15"
                        className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-700">Ngày âm lịch:</label>
                    <input
                      type="text"
                      value={data.lunarDate}
                      onChange={(e) => handleUpdate({ lunarDate: e.target.value })}
                      placeholder="(Tức ngày 15 tháng 8 năm Đinh Mùi)"
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-700">Địa điểm tổ chức:</label>
                    <input
                      type="text"
                      value={data.location}
                      onChange={(e) => handleUpdate({ location: e.target.value })}
                      placeholder="Tại Tư Gia Nhà Gái / Khách Sạn..."
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white"
                    />
                  </div>
                </div>
              );
            })()}

            {/* 7. FAMILY INFO INSPECTOR */}
            {isFamilyInfo && (() => {
              const data = parseFamilyInfo(props.text, props);

              const handleUpdate = (patch: Partial<FamilyInfoData>) => {
                const updated = { ...data, ...patch };
                const primaryColor = props.color || props.primaryColor || "#6b3b59";
                const textColor = props.textColor || "#2c2420";
                const newHtml = generateFamilyInfoHtml(updated, primaryColor, textColor);
                onUpdateProps(id, {
                  ...updated,
                  text: newHtml,
                });
              };

              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
                    <Users className="w-4 h-4 text-zen-primary" />
                    <span>Thông tin gia đình hai họ</span>
                  </div>

                  {/* NHÀ TRAI */}
                  <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2">
                    <span className="text-[11px] font-bold text-blue-900 uppercase">Khối Nhà Trai</span>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-600">Thân phụ (Bố):</label>
                      <input
                        type="text"
                        value={data.groomFather}
                        onChange={(e) => handleUpdate({ groomFather: e.target.value })}
                        className="w-full text-xs p-2 rounded-lg border border-gray-200 bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-600">Thân mẫu (Mẹ):</label>
                      <input
                        type="text"
                        value={data.groomMother}
                        onChange={(e) => handleUpdate({ groomMother: e.target.value })}
                        className="w-full text-xs p-2 rounded-lg border border-gray-200 bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-600 font-bold text-blue-900">Tên Chú Rể:</label>
                      <input
                        type="text"
                        value={data.groomName}
                        onChange={(e) => handleUpdate({ groomName: e.target.value })}
                        className="w-full text-xs p-2 rounded-lg border border-gray-200 bg-white font-bold"
                      />
                    </div>
                  </div>

                  {/* NHÀ GÁI */}
                  <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100 space-y-2">
                    <span className="text-[11px] font-bold text-rose-900 uppercase">Khối Nhà Gái</span>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-600">Thân phụ (Bố):</label>
                      <input
                        type="text"
                        value={data.brideFather}
                        onChange={(e) => handleUpdate({ brideFather: e.target.value })}
                        className="w-full text-xs p-2 rounded-lg border border-gray-200 bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-600">Thân mẫu (Mẹ):</label>
                      <input
                        type="text"
                        value={data.brideMother}
                        onChange={(e) => handleUpdate({ brideMother: e.target.value })}
                        className="w-full text-xs p-2 rounded-lg border border-gray-200 bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-600 font-bold text-rose-900">Tên Cô Dâu:</label>
                      <input
                        type="text"
                        value={data.brideName}
                        onChange={(e) => handleUpdate({ brideName: e.target.value })}
                        className="w-full text-xs p-2 rounded-lg border border-gray-200 bg-white font-bold"
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 8. BANK CARD 2 HỌ INSPECTOR */}
            {isBankCard && (() => {
              const data = parseBankCard(props.text, props);

              const handleUpdate = (patch: Partial<BankCardData>) => {
                const updated = { ...data, ...patch };
                const primaryColor = props.color || props.primaryColor || "#6b3b59";
                const textColor = props.textColor || "#2c2420";
                const newHtml = generateBankCardHtml(updated, primaryColor, textColor);
                onUpdateProps(id, {
                  ...updated,
                  text: newHtml,
                });
              };

              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
                    <Gift className="w-4 h-4 text-zen-primary" />
                    <span>Hộp mừng cưới & VietQR hai họ</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-700">Tiêu đề:</label>
                    <input
                      type="text"
                      value={data.title}
                      onChange={(e) => handleUpdate({ title: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-700">Lời nhắn:</label>
                    <textarea
                      rows={2}
                      value={data.description}
                      onChange={(e) => handleUpdate({ description: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white"
                    />
                  </div>

                  {/* TÀI KHOẢN NHÀ TRAI */}
                  <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2">
                    <span className="text-[11px] font-bold text-blue-900 uppercase">Tài khoản mừng Nhà Trai</span>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-600">Ngân hàng:</label>
                      <select
                        value={resolveBankCode(data.groomBank.bankName)}
                        onChange={(e) =>
                          handleUpdate({
                            groomBank: { ...data.groomBank, bankName: e.target.value },
                          })
                        }
                        className="w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-semibold"
                      >
                        <option value="MB">MB Bank (Quân Đội)</option>
                        <option value="VCB">Vietcombank</option>
                        <option value="TCB">Techcombank</option>
                        <option value="VPB">VPBank</option>
                        <option value="ACB">ACB Á Châu</option>
                        <option value="BIDV">BIDV</option>
                        <option value="CTG">VietinBank</option>
                        <option value="AGRIBANK">Agribank</option>
                        <option value="TPB">TPBank</option>
                        <option value="STB">Sacombank</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-600">Số tài khoản:</label>
                      <input
                        type="text"
                        value={data.groomBank.accountNumber}
                        onChange={(e) =>
                          handleUpdate({
                            groomBank: { ...data.groomBank, accountNumber: e.target.value },
                          })
                        }
                        className="w-full text-xs p-2 rounded-lg border border-gray-200 bg-white font-mono font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-600">Chủ tài khoản (Không dấu):</label>
                      <input
                        type="text"
                        value={data.groomBank.accountHolder}
                        onChange={(e) =>
                          handleUpdate({
                            groomBank: { ...data.groomBank, accountHolder: e.target.value.toUpperCase() },
                          })
                        }
                        className="w-full text-xs p-2 rounded-lg border border-gray-200 bg-white uppercase font-bold"
                      />
                    </div>
                  </div>

                  {/* TÀI KHOẢN NHÀ GÁI */}
                  <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100 space-y-2">
                    <span className="text-[11px] font-bold text-rose-900 uppercase">Tài khoản mừng Nhà Gái</span>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-600">Ngân hàng:</label>
                      <select
                        value={resolveBankCode(data.brideBank.bankName)}
                        onChange={(e) =>
                          handleUpdate({
                            brideBank: { ...data.brideBank, bankName: e.target.value },
                          })
                        }
                        className="w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-semibold"
                      >
                        <option value="TCB">Techcombank</option>
                        <option value="MB">MB Bank (Quân Đội)</option>
                        <option value="VCB">Vietcombank</option>
                        <option value="VPB">VPBank</option>
                        <option value="ACB">ACB Á Châu</option>
                        <option value="BIDV">BIDV</option>
                        <option value="CTG">VietinBank</option>
                        <option value="AGRIBANK">Agribank</option>
                        <option value="TPB">TPBank</option>
                        <option value="STB">Sacombank</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-600">Số tài khoản:</label>
                      <input
                        type="text"
                        value={data.brideBank.accountNumber}
                        onChange={(e) =>
                          handleUpdate({
                            brideBank: { ...data.brideBank, accountNumber: e.target.value },
                          })
                        }
                        className="w-full text-xs p-2 rounded-lg border border-gray-200 bg-white font-mono font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-600">Chủ tài khoản (Không dấu):</label>
                      <input
                        type="text"
                        value={data.brideBank.accountHolder}
                        onChange={(e) =>
                          handleUpdate({
                            brideBank: { ...data.brideBank, accountHolder: e.target.value.toUpperCase() },
                          })
                        }
                        className="w-full text-xs p-2 rounded-lg border border-gray-200 bg-white uppercase font-bold"
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 9. COUNTDOWN BOX INSPECTOR */}
            {isCountdown && (() => {
              const targetDate = props.targetDate || "2026-12-29";
              const targetTime = props.targetTime || "16:30";
              const cd = calculateCountdown(targetDate, targetTime);

              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
                    <Clock className="w-4 h-4 text-zen-primary" />
                    <span>Đồng hồ đếm ngược ngày cưới</span>
                  </div>

                  {/* Live countdown preview badge */}
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 font-semibold flex items-center justify-between">
                    <span>Đang đếm ngược thực tế:</span>
                    <span className="font-mono font-bold text-[#e54153]">
                      {cd.days}d {cd.hours}h {cd.minutes}m {cd.seconds}s
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-gray-700">Ngày làm lễ:</label>
                    <input
                      type="date"
                      value={targetDate.includes("T") ? targetDate.split("T")[0] : targetDate}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        handlePropChange("targetDate", `${newDate}T${targetTime}:00`);
                      }}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-gray-700">Giờ làm lễ:</label>
                    <input
                      type="time"
                      value={targetTime}
                      onChange={(e) => {
                        const newTime = e.target.value;
                        const dateOnly = targetDate.includes("T") ? targetDate.split("T")[0] : targetDate;
                        handlePropChange("targetTime", newTime);
                        handlePropChange("targetDate", `${dateOnly}T${newTime}:00`);
                      }}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-gray-700">Tiêu đề:</label>
                    <input
                      type="text"
                      value={props.titleText || "CÙNG ĐẾM NGƯỢC THỜI GIAN"}
                      onChange={(e) => handlePropChange("titleText", e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white"
                    />
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">Màu chữ đếm ngược:</span>
                    <input
                      type="color"
                      value={toHexColor(props.textColor || "#511419")}
                      onChange={(e) => handlePropChange("textColor", e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0"
                    />
                  </div>
                </div>
              );
            })()}

            {/* 10. CALENDAR BOX INSPECTOR */}
            {isCalendar && (() => {
              const cal = formatCalendarData(props);

              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
                    <CalendarIcon className="w-4 h-4 text-zen-primary" />
                    <span>Lịch ngày cưới</span>
                  </div>

                  {/* Live preview */}
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold flex items-center justify-between">
                    <span>Hiển thị trên thiệp:</span>
                    <span className="font-bold text-amber-950">
                      {cal.dayOfWeek}, {cal.day}/{cal.month}/{cal.year} ({cal.time})
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-gray-700">Ngày:</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={cal.day}
                        onChange={(e) => handlePropChange("day", parseInt(e.target.value) || 1)}
                        className="w-full text-xs p-2 rounded-xl border border-gray-200 font-bold text-center bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-gray-700">Tháng:</label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={cal.month}
                        onChange={(e) => handlePropChange("month", parseInt(e.target.value) || 1)}
                        className="w-full text-xs p-2 rounded-xl border border-gray-200 font-bold text-center bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-gray-700">Năm:</label>
                      <input
                        type="number"
                        min="2025"
                        max="2035"
                        value={cal.year}
                        onChange={(e) => handlePropChange("year", parseInt(e.target.value) || 2026)}
                        className="w-full text-xs p-2 rounded-xl border border-gray-200 font-bold text-center bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-gray-700">Giờ làm lễ:</label>
                    <input
                      type="text"
                      value={cal.time}
                      onChange={(e) => handlePropChange("time", e.target.value)}
                      placeholder="16:30"
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white font-bold"
                    />
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">Màu chữ & Trái tim:</span>
                    <input
                      type="color"
                      value={toHexColor(props.themeColor || "#511419")}
                      onChange={(e) => handlePropChange("themeColor", e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0"
                    />
                  </div>
                </div>
              );
            })()}

            {/* 11. MAP BOX INSPECTOR */}
            {isMap && (
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
                  <MapPin className="w-4 h-4 text-zen-primary" />
                  <span>Bản đồ & Địa điểm cưới</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-700">Tên địa điểm:</label>
                  <input
                    type="text"
                    value={props.title || props.venueName || "Trung tâm Tiệc cưới Trống Đồng"}
                    onChange={(e) => {
                      handlePropChange("title", e.target.value);
                      handlePropChange("venueName", e.target.value);
                    }}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-700">Địa chỉ chi tiết:</label>
                  <textarea
                    rows={2}
                    value={props.address || "Số 72 Quán Sứ, Hoàn Kiếm, Hà Nội"}
                    onChange={(e) => handlePropChange("address", e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-gray-700">Link Google Maps:</label>
                    {props.mapUrl && (
                      <a
                        href={props.mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-zen-primary hover:underline font-bold flex items-center gap-0.5"
                      >
                        <span>Mở bản đồ</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="https://maps.google.com/..."
                    value={props.mapUrl || ""}
                    onChange={(e) => handlePropChange("mapUrl", e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const query = encodeURIComponent(`${props.venueName || props.title || ""} ${props.address || ""}`);
                    const newUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
                    handlePropChange("mapUrl", newUrl);
                  }}
                  className="w-full py-1.5 px-2 rounded-lg border border-gray-200 hover:border-gray-300 text-gray-700 text-[11px] font-medium flex items-center justify-center gap-1 bg-gray-50"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tự động tạo link Google Maps từ địa chỉ</span>
                </button>
              </div>
            )}

            {/* 12. GIFT QR BOX INSPECTOR */}
            {isGift && (() => {
              const currentBank = props.bankName || "MB BANK";
              const currentNum = props.accountNumber || "240220038888";
              const currentHolder = props.accountName || "NGUYEN VAN HUNG";

              const handleUpdateQr = (bank: string, num: string, holder: string) => {
                const qrUrl = generateVietQrUrl(bank, num, holder, undefined, "Mung cuoi hai ban");
                onUpdateProps(id, {
                  bankName: bank,
                  accountNumber: num,
                  accountName: holder,
                  imgKey: qrUrl,
                  src: qrUrl,
                });
              };

              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
                    <Gift className="w-4 h-4 text-zen-primary" />
                    <span>Hộp mừng cưới & Mã QR VietQR</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-700">Tiêu đề hộp quà:</label>
                    <input
                      type="text"
                      value={props.modalTitle || "Hộp Quà Mừng Cưới Yêu Thương"}
                      onChange={(e) => handlePropChange("modalTitle", e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-700">Ngân hàng:</label>
                    <select
                      value={resolveBankCode(currentBank)}
                      onChange={(e) => handleUpdateQr(e.target.value, currentNum, currentHolder)}
                      className="w-full p-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold"
                    >
                      <option value="MB">MB Bank (Quân Đội)</option>
                      <option value="VCB">Vietcombank</option>
                      <option value="TCB">Techcombank</option>
                      <option value="VPB">VPBank</option>
                      <option value="ACB">ACB Á Châu</option>
                      <option value="BIDV">BIDV</option>
                      <option value="CTG">VietinBank</option>
                      <option value="AGRIBANK">Agribank</option>
                      <option value="TPB">TPBank</option>
                      <option value="STB">Sacombank</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-700">Số tài khoản:</label>
                    <input
                      type="text"
                      value={currentNum}
                      onChange={(e) => handleUpdateQr(currentBank, e.target.value, currentHolder)}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-700">Tên chủ tài khoản (Không dấu):</label>
                    <input
                      type="text"
                      value={currentHolder}
                      onChange={(e) => handleUpdateQr(currentBank, currentNum, e.target.value.toUpperCase())}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white uppercase font-bold"
                    />
                  </div>
                </div>
              );
            })()}

            {/* 13. RSVP FORM INSPECTOR */}
            {isRsvp && (
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
                  <Send className="w-4 h-4 text-zen-primary" />
                  <span>Biểu mẫu xác nhận tham dự (RSVP)</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-700">Tiêu đề biểu mẫu:</label>
                  <input
                    type="text"
                    value={props.titleText || "Xác nhận tham dự"}
                    onChange={(e) => handlePropChange("titleText", e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-700">Lời nhắn / Hạn chót:</label>
                  <textarea
                    rows={2}
                    value={props.subtitleText || props.subtitle || "Để gia đình chuẩn bị chu đáo nhất, xin vui lòng phản hồi trước ngày cưới:"}
                    onChange={(e) => handlePropChange("subtitleText", e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-700">Chữ trên nút gửi:</label>
                  <input
                    type="text"
                    value={props.submitText || "Gửi xác nhận"}
                    onChange={(e) => handlePropChange("submitText", e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary bg-white"
                  />
                </div>
              </div>
            )}

            {/* 9. CAROUSEL ALBUM INSPECTOR */}
            {isCarousel && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                    <ImageIcon className="w-4 h-4 text-zen-primary" />
                    <span>Album ảnh cưới trượt (Carousel)</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-semibold bg-gray-100 px-2 py-0.5 rounded-full">
                    {Array.isArray(props.imgList) ? props.imgList.length : 0} ảnh
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed -mt-1">
                  Trình chiếu lướt ảnh hoặc tự động cuộn các khoảnh khắc cưới
                </p>

                {/* Status Message */}
                {carouselMessage && (
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />
                    <span>{carouselMessage}</span>
                  </div>
                )}

                {/* Upload Progress Bar */}
                {carouselUploadProgress && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-[#e54153] space-y-1.5">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang nén & tải ảnh ({carouselUploadProgress.current}/{carouselUploadProgress.total})...</span>
                      </span>
                    </div>
                    <div className="w-full bg-rose-200/60 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#e54153] h-full transition-all duration-300"
                        style={{
                          width: `${Math.round((carouselUploadProgress.current / carouselUploadProgress.total) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* BATCH AND ADD CONTROLS */}
                <div className="space-y-2 pt-1">
                  {/* Nút THAY TOÀN BỘ ẢNH HÀNG LOẠT NỔI BẬT */}
                  <button
                    type="button"
                    onClick={() => carouselBatchFileInputRef.current?.click()}
                    disabled={isUploadingCarousel}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#e54153] to-[#ff5b70] hover:from-[#d93849] hover:to-[#e54153] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                    title="Chọn nhiều ảnh từ máy tính để thay thế toàn bộ album"
                  >
                    {isUploadingCarousel ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>⚡ Thay toàn bộ ảnh (Hàng loạt)</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Nút Thêm ảnh (chọn nhiều) */}
                    <button
                      type="button"
                      onClick={() => carouselFileInputRef.current?.click()}
                      disabled={isUploadingCarousel}
                      className="py-1.5 px-2.5 rounded-lg bg-white border border-gray-200 text-gray-700 text-[11px] font-semibold flex items-center justify-center gap-1 hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
                      title="Chọn thêm ảnh để nối tiếp vào album"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#e54153]" />
                      <span>+ Thêm ảnh</span>
                    </button>

                    {/* Nút Xóa tất cả */}
                    <button
                      type="button"
                      onClick={handleClearCarouselImages}
                      disabled={isUploadingCarousel || !Array.isArray(props.imgList) || props.imgList.length === 0}
                      className="py-1.5 px-2.5 rounded-lg bg-white border border-gray-200 text-gray-500 text-[11px] font-semibold flex items-center justify-center gap-1 hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-40"
                      title="Làm trống toàn bộ ảnh trong album"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa tất cả</span>
                    </button>
                  </div>
                </div>

                {/* Ẩn các file input */}
                <input
                  ref={carouselBatchFileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleBatchReplaceCarouselImages}
                  className="hidden"
                />
                <input
                  ref={carouselFileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleAddCarouselImages}
                  className="hidden"
                />
                <input
                  ref={carouselSwapSingleInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSwapSingleFilePicked}
                  className="hidden"
                />

                {/* Gợi ý tương tác với thư viện ảnh */}
                <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200/70 text-[11px] text-amber-800 flex items-start gap-1.5">
                  <span className="text-xs">💡</span>
                  <span>
                    Bấm mục <strong>Hình ảnh</strong> ở thanh công cụ bên trái để bấm ảnh có sẵn đưa vào album.
                  </span>
                </div>

                {/* Thumbnail Grid & Individual swap/delete */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                    <span>Danh sách ảnh ({Array.isArray(props.imgList) ? props.imgList.length : 0}):</span>
                  </div>

                  {Array.isArray(props.imgList) && props.imgList.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 pt-1 max-h-56 overflow-y-auto p-1.5 bg-gray-50/50 rounded-xl border border-gray-100">
                      {props.imgList.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group bg-gray-100 shadow-2xs"
                        >
                          <img
                            src={getFullImageUrl(item.imageKey || item.src)}
                            alt={`Album item ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />

                          {/* Index badge */}
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-bold pointer-events-none backdrop-blur-xs">
                            #{idx + 1}
                          </div>

                          {/* Action overlay */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                            <button
                              type="button"
                              onClick={() => handleTriggerSwapSingleImage(idx)}
                              className="p-1.5 rounded-full bg-white text-gray-800 hover:bg-gray-100 transition-colors shadow-sm cursor-pointer"
                              title="Đổi ảnh này bằng ảnh khác từ máy"
                            >
                              <RotateCw className="w-3 h-3 text-[#e54153]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveCarouselImage(idx)}
                              className="p-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
                              title="Xóa ảnh này khỏi album"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-gray-400 text-xs border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                      <ImageIcon className="w-7 h-7 mx-auto mb-1.5 opacity-40 text-gray-400" />
                      <p className="font-semibold text-gray-600">Album chưa có ảnh nào</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Bấm &quot;⚡ Thay toàn bộ ảnh&quot; hoặc &quot;+ Thêm ảnh&quot;</p>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700">Bo góc album:</span>
                    <span className="font-mono text-gray-600">
                      {Array.isArray(props.borderRadius) ? props.borderRadius[0] : (props.borderRadius || 24)}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    value={Array.isArray(props.borderRadius) ? props.borderRadius[0] : (props.borderRadius || 24)}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      handlePropChange("borderRadius", [val, val, val, val]);
                    }}
                    className="w-full accent-zen-primary"
                  />
                </div>
              </div>
            )}

            {/* 10. COMMON ADVANCED: Z-INDEX & POSITION */}
            <div className="pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => toggleAccordion("advanced")}
                className="w-full py-1.5 text-xs font-semibold text-gray-800 flex items-center justify-between hover:text-gray-900"
              >
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-gray-500" />
                  <span>Vị trí & Lớp hiển thị</span>
                </span>
                {openAccordions["advanced"] ? (
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                )}
              </button>

              {openAccordions["advanced"] && (
                <div className="p-2.5 bg-gray-50/70 rounded-xl space-y-2 text-xs mt-1">
                  <div className="flex items-center justify-between">
                    <span>Thứ tự lớp (Z-Index):</span>
                    <input
                      type="number"
                      value={props.zIndex || 1}
                      onChange={(e) => handlePropChange("zIndex", parseInt(e.target.value) || 1)}
                      className="w-16 p-1 border rounded text-right bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600">
                    <div>
                      <span>Tọa độ X: </span>
                      <span className="font-mono font-bold text-gray-800">{props.left ?? 0}px</span>
                    </div>
                    <div>
                      <span>Tọa độ Y: </span>
                      <span className="font-mono font-bold text-gray-800">{props.top ?? 0}px</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB: HIỆU ỨNG (ANIMATIONS & TRANSITIONS) ================= */}
        {activeTab === "effects" && (
          <div className="space-y-4">
            {/* Header: Title & Micro-sound toggle */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div>
                <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Hiệu ứng chuyển động</span>
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Phân nhóm Xuất hiện, Biến mất, Liên tục và Combo 1-chạm.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const nextMuted = !isSoundMuted;
                  setIsSoundMuted(nextMuted);
                  if (!nextMuted) weddingSounds.playSoftClick();
                }}
                title={isSoundMuted ? "Bật âm thanh vi mô tương tác" : "Tắt âm thanh vi mô tương tác"}
                className={`p-1.5 rounded-lg border transition-all ${
                  !isSoundMuted
                    ? "bg-rose-50 border-rose-200 text-[#e54153]"
                    : "bg-gray-50 border-gray-200 text-gray-400"
                }`}
              >
                {!isSoundMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* 1. Mini Live Preview Box (Khung xem trước mô phỏng theo nhóm đang chọn) */}
            <div className="relative overflow-hidden rounded-2xl border border-rose-200 bg-gradient-to-b from-rose-50/70 to-pink-50/40 p-3 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] text-gray-600 mb-2">
                <span className="font-bold flex items-center gap-1 text-gray-800">
                  <Eye className="w-3.5 h-3.5 text-[#e54153]" />
                  <span>
                    Mô phỏng:{" "}
                    <strong className="text-[#e54153]">
                      {effectGroup === "entrance"
                        ? "Xuất hiện"
                        : effectGroup === "exit"
                        ? "Biến mất"
                        : "Liên tục"}
                    </strong>
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (!isSoundMuted) weddingSounds.playEnvelopeOpen();
                    setMiniPreviewKey(Date.now());
                    if (selectedElement) {
                      onUpdateProps(selectedElement.id, { _previewKey: Date.now() });
                    }
                    setIsPlayingPreview(true);
                    setTimeout(() => setIsPlayingPreview(false), 900);
                  }}
                  className="px-2 py-0.5 rounded-md bg-white border border-rose-200 text-[#e54153] text-[10px] font-bold hover:bg-rose-50 flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                >
                  <Play className={`w-2.5 h-2.5 fill-current ${isPlayingPreview ? "animate-spin" : ""}`} />
                  <span>{isPlayingPreview ? "Đang chạy..." : "Phát lại"}</span>
                </button>
              </div>

              {/* Demo wedding card element */}
              <div className="h-16 rounded-xl bg-white/95 border border-rose-100 flex flex-col items-center justify-center p-2 text-center shadow-xs overflow-hidden relative">
                <div
                  key={miniPreviewKey}
                  style={
                    effectGroup === "exit"
                      ? {
                          animationName:
                            ANIMATION_KEYFRAME_MAP[props.transition?.exitEffectType || "fadeOut"] ||
                            "fadeOut",
                          animationDuration: "0.8s",
                          animationTimingFunction: "ease-in",
                          animationFillMode: "both",
                        }
                      : effectGroup === "entrance"
                      ? {
                          animationName:
                            ANIMATION_KEYFRAME_MAP[props.transition?.effectType || "fadeIn"] ||
                            "fadeIn",
                          animationDuration: `${props.transition?.effectDuration ?? 1.2}s`,
                          animationTimingFunction:
                            props.transition?.effectEasing || "cubic-bezier(0.16, 1, 0.3, 1)",
                          animationFillMode: "both",
                        }
                      : {}
                  }
                  className={`flex flex-col items-center ${
                    effectGroup === "continuous" || (!isPlayingPreview && props.continuousAnimation?.type)
                      ? props.continuousAnimation?.type === "float"
                        ? "animate-zen-float"
                        : props.continuousAnimation?.type === "pulse"
                        ? "animate-zen-pulse"
                        : props.continuousAnimation?.type === "bounce"
                        ? "animate-zen-bounce"
                        : props.continuousAnimation?.type === "wobble"
                        ? "animate-zen-wobble"
                        : props.continuousAnimation?.type === "wiggle"
                        ? "animate-zen-wiggle"
                        : props.continuousAnimation?.type === "shake"
                        ? "animate-zen-shake"
                        : ""
                      : ""
                  }`}
                >
                  <span className="text-[11px] font-serif font-bold text-gray-800">
                    Minh Quân & Phương Anh
                  </span>
                  <span className="text-[9px] text-[#e54153] font-medium mt-0.5">
                    {effectGroup === "entrance"
                      ? `${props.transition?.effectType || "fadeIn"} • Xuất hiện (${props.transition?.effectDuration ?? 1.2}s)`
                      : effectGroup === "exit"
                      ? `${props.transition?.exitEffectType || "none"} • Biến mất`
                      : `${props.continuousAnimation?.type || "none"} • Vòng lặp (${props.continuousAnimation?.duration || 3}s)`}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Top Segmented Selector: 3 NHÓM HIỆU ỨNG (Xuất hiện, Biến mất, Liên tục) */}
            <div className="grid grid-cols-3 p-1 bg-gray-100 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => {
                  setEffectGroup("entrance");
                  setAnimCategory("all");
                  if (!isSoundMuted) weddingSounds.playSoftClick();
                }}
                className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  effectGroup === "entrance"
                    ? "bg-white text-[#e54153] shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <span>✨ Xuất hiện</span>
                {props.transition?.effectType && props.transition?.effectType !== "none" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e54153]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setEffectGroup("exit");
                  setAnimCategory("all");
                  if (!isSoundMuted) weddingSounds.playSoftClick();
                }}
                className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  effectGroup === "exit"
                    ? "bg-white text-[#e54153] shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <span>💨 Biến mất</span>
                {props.transition?.exitEffectType && props.transition?.exitEffectType !== "none" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e54153]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setEffectGroup("continuous");
                  if (!isSoundMuted) weddingSounds.playSoftClick();
                }}
                className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  effectGroup === "continuous"
                    ? "bg-white text-[#e54153] shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <span>🔄 Liên tục</span>
                {props.continuousAnimation?.type && props.continuousAnimation?.type !== "none" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e54153]" />
                )}
              </button>
            </div>

            {/* ================= PHẦN NỘI DUNG NHÓM: 1. XUẤT HIỆN (ENTRANCE) ================= */}
            {effectGroup === "entrance" && (
              <div className="space-y-2.5 pt-0.5">
                {/* Category Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[11px]">
                  {ANIMATION_CATEGORIES.map((cat) => {
                    const isCatActive = animCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setAnimCategory(cat.id);
                          if (!isSoundMuted) weddingSounds.playSoftClick();
                        }}
                        className={`px-2 py-0.5 rounded-lg shrink-0 font-medium transition-all cursor-pointer ${
                          isCatActive
                            ? "bg-[#e54153] text-white font-bold shadow-2xs"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                        }`}
                      >
                        <span>{cat.icon}</span> <span className="ml-0.5">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Grid of tiles (Ô chọn hiệu ứng Xuất hiện - Gọn gàng 3 cột) */}
                <div className="grid grid-cols-3 gap-1.5 max-h-[220px] overflow-y-auto pr-0.5 scrollbar-thin">
                  {(() => {
                    const filteredList = ENTRANCE_EFFECTS.filter(
                      (eff) => animCategory === "all" || eff.category === animCategory || eff.id === "none"
                    );
                    const activeEffectId = props.transition?.effectType || "fadeIn";

                    return filteredList.map((eff) => {
                      const isSelected = activeEffectId === eff.id;
                      return (
                        <button
                          key={eff.id}
                          type="button"
                          title={`${eff.name} (${eff.nameEn})${eff.desc ? ` - ${eff.desc}` : ""}`}
                          onClick={() => {
                            if (!isSoundMuted) weddingSounds.playSoftClick();
                            const currentTransition = props.transition || {};
                            const updated = {
                              ...currentTransition,
                              effectEnabled: true,
                              effectType: eff.id,
                              effectDuration: currentTransition.effectDuration ?? 1.2,
                              effectDelay: currentTransition.effectDelay ?? 0,
                              effectEasing: currentTransition.effectEasing || "cubic-bezier(0.16, 1, 0.3, 1)",
                              hoverEffect: currentTransition.hoverEffect || "none",
                            };

                            if (selectedElement) {
                              onUpdateProps(selectedElement.id, {
                                transition: updated,
                                _previewKey: Date.now(),
                              });
                            }
                            setMiniPreviewKey(Date.now());
                            setIsPlayingPreview(true);
                            setTimeout(() => setIsPlayingPreview(false), 900);
                          }}
                          className={`relative p-2 rounded-xl border flex flex-col items-center justify-center text-center gap-1 transition-all group cursor-pointer ${
                            isSelected
                              ? "border-[#e54153] bg-rose-50 text-[#e54153] shadow-xs ring-1 ring-[#e54153]/30 font-bold"
                              : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-medium"
                          }`}
                        >
                          <span className="text-base group-hover:scale-115 transition-transform duration-150 inline-block leading-none">
                            {eff.icon}
                          </span>
                          <span className="text-[11px] leading-tight truncate w-full">
                            {eff.name}
                          </span>
                          {isSelected && (
                            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#e54153]" />
                          )}
                        </button>
                      );
                    });
                  })()}
                </div>

                {/* Timing controls for Entrance */}
                <div className="space-y-2 pt-1 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedTiming(!showAdvancedTiming)}
                    className="w-full flex items-center justify-between text-xs font-bold text-gray-700 hover:text-gray-900 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-gray-500" />
                      <span>Tốc độ & độ trễ</span>
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showAdvancedTiming ? "rotate-180" : ""}`} />
                  </button>

                  {showAdvancedTiming && (
                    <div className="space-y-3 p-2.5 bg-gray-50/80 rounded-xl border border-gray-100">
                      {/* Duration */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-gray-700">Thời gian (Duration):</span>
                          <span className="font-mono font-bold text-[#e54153]">
                            {props.transition?.effectDuration ?? 1.2}s
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.3"
                          max="3.5"
                          step="0.1"
                          value={props.transition?.effectDuration ?? 1.2}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            const cur = props.transition || {};
                            if (selectedElement) {
                              onUpdateProps(selectedElement.id, {
                                transition: { ...cur, effectEnabled: true, effectDuration: val },
                                _previewKey: Date.now(),
                              });
                            }
                            setMiniPreviewKey(Date.now());
                          }}
                          className="w-full accent-[#e54153]"
                        />
                        <div className="grid grid-cols-4 gap-1">
                          {DURATION_PRESETS.map((preset) => (
                            <button
                              key={preset.value}
                              type="button"
                              onClick={() => {
                                const cur = props.transition || {};
                                if (selectedElement) {
                                  onUpdateProps(selectedElement.id, {
                                    transition: { ...cur, effectEnabled: true, effectDuration: preset.value },
                                    _previewKey: Date.now(),
                                  });
                                }
                                setMiniPreviewKey(Date.now());
                              }}
                              className={`py-1 text-[10px] rounded-md border font-medium cursor-pointer ${
                                (props.transition?.effectDuration ?? 1.2) === preset.value
                                  ? "bg-rose-50 border-[#e54153] text-[#e54153] font-bold"
                                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              {preset.label.split(" ")[0]}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Delay */}
                      <div className="space-y-1.5 pt-2 border-t border-gray-200/60">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-gray-700">Độ trễ (Delay):</span>
                          <span className="font-mono font-bold text-[#e54153]">
                            {props.transition?.effectDelay ?? 0}s
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={props.transition?.effectDelay ?? 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            const cur = props.transition || {};
                            if (selectedElement) {
                              onUpdateProps(selectedElement.id, {
                                transition: { ...cur, effectEnabled: true, effectDelay: val },
                                _previewKey: Date.now(),
                              });
                            }
                            setMiniPreviewKey(Date.now());
                          }}
                          className="w-full accent-[#e54153]"
                        />
                        <div className="grid grid-cols-4 gap-1">
                          {DELAY_PRESETS.map((preset) => (
                            <button
                              key={preset.value}
                              type="button"
                              onClick={() => {
                                const cur = props.transition || {};
                                if (selectedElement) {
                                  onUpdateProps(selectedElement.id, {
                                    transition: { ...cur, effectEnabled: true, effectDelay: preset.value },
                                    _previewKey: Date.now(),
                                  });
                                }
                                setMiniPreviewKey(Date.now());
                              }}
                              className={`py-1 text-[10px] rounded-md border font-medium cursor-pointer ${
                                (props.transition?.effectDelay ?? 0) === preset.value
                                  ? "bg-rose-50 border-[#e54153] text-[#e54153] font-bold"
                                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Easing */}
                      <div className="space-y-1.5 pt-2 border-t border-gray-200/60">
                        <span className="font-semibold text-gray-700 text-[11px] block">
                          Gia tốc chuyển động:
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {EASING_OPTIONS.map((opt) => {
                            const isCurrentEasing = (props.transition?.effectEasing || "cubic-bezier(0.16, 1, 0.3, 1)") === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                  const cur = props.transition || {};
                                  if (selectedElement) {
                                    onUpdateProps(selectedElement.id, {
                                      transition: { ...cur, effectEnabled: true, effectEasing: opt.id },
                                      _previewKey: Date.now(),
                                    });
                                  }
                                  setMiniPreviewKey(Date.now());
                                }}
                                className={`p-1.5 text-left rounded-lg border text-[10px] transition-all cursor-pointer ${
                                  isCurrentEasing
                                    ? "bg-rose-50 border-[#e54153] text-[#e54153] font-bold"
                                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100"
                                }`}
                              >
                                <p className="font-semibold">{opt.label.split(" ")[0]}</p>
                                <p className="text-[9px] text-gray-400 truncate">{opt.desc}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stagger Cascade */}
                <div className="space-y-1.5 pt-1.5 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <Waves className="w-3.5 h-3.5 text-blue-500" />
                      <span>Hiệu ứng so le (Stagger):</span>
                    </label>
                    <span className="text-[10px] font-mono font-bold text-blue-600">{staggerStep}s</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[
                      { label: "0.1s", val: 0.1 },
                      { label: "0.15s", val: 0.15 },
                      { label: "0.2s", val: 0.2 },
                    ].map((step) => (
                      <button
                        key={step.val}
                        type="button"
                        onClick={() => {
                          setStaggerStep(step.val);
                          if (!isSoundMuted) weddingSounds.playSoftClick();
                        }}
                        className={`flex-1 py-1 text-[10px] rounded-lg border font-medium transition-all cursor-pointer ${
                          staggerStep === step.val
                            ? "bg-blue-50 border-blue-400 text-blue-600 font-bold"
                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {step.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isSoundMuted) weddingSounds.playEnvelopeOpen();
                      if (onApplyStaggerAll) {
                        onApplyStaggerAll(staggerStep);
                      } else if (selectedElement) {
                        const curTransition = props.transition || {};
                        onUpdateProps(selectedElement.id, {
                          transition: { ...curTransition, effectEnabled: true, effectDelay: staggerStep },
                          _previewKey: Date.now(),
                        });
                      }
                      setMiniPreviewKey(Date.now());
                      setIsPlayingPreview(true);
                      setTimeout(() => setIsPlayingPreview(false), 1000);
                    }}
                    className="w-full py-1.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  >
                    <Waves className="w-3.5 h-3.5" />
                    <span>Áp dụng so le toàn bộ thiệp</span>
                  </button>
                </div>
              </div>
            )}

            {/* ================= PHẦN NỘI DUNG NHÓM: 2. BIẾN MẤT (EXIT) ================= */}
            {effectGroup === "exit" && (
              <div className="space-y-2.5 pt-0.5">
                {/* Category Pills for Exit */}
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[11px]">
                  {ANIMATION_CATEGORIES.map((cat) => {
                    const isCatActive = animCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setAnimCategory(cat.id);
                          if (!isSoundMuted) weddingSounds.playSoftClick();
                        }}
                        className={`px-2 py-0.5 rounded-lg shrink-0 font-medium transition-all cursor-pointer ${
                          isCatActive
                            ? "bg-amber-600 text-white font-bold shadow-2xs"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                        }`}
                      >
                        <span>{cat.icon}</span> <span className="ml-0.5">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Grid of tiles (Ô chọn hiệu ứng Biến mất - Gọn gàng 3 cột) */}
                <div className="grid grid-cols-3 gap-1.5 max-h-[220px] overflow-y-auto pr-0.5 scrollbar-thin">
                  {(() => {
                    const filteredList = EXIT_EFFECTS.filter(
                      (eff) => animCategory === "all" || eff.category === animCategory || eff.id === "none"
                    );
                    const activeEffectId = props.transition?.exitEffectType || "none";

                    return filteredList.map((eff) => {
                      const isSelected = activeEffectId === eff.id;
                      return (
                        <button
                          key={eff.id}
                          type="button"
                          title={`${eff.name} (${eff.nameEn})${eff.desc ? ` - ${eff.desc}` : ""}`}
                          onClick={() => {
                            if (!isSoundMuted) weddingSounds.playSoftClick();
                            const currentTransition = props.transition || {};
                            const updated = {
                              ...currentTransition,
                              effectEnabled: true,
                              exitEffectType: eff.id,
                            };

                            if (selectedElement) {
                              onUpdateProps(selectedElement.id, {
                                transition: updated,
                                _previewKey: Date.now(),
                              });
                            }
                            setMiniPreviewKey(Date.now());
                            setIsPlayingPreview(true);
                            setTimeout(() => setIsPlayingPreview(false), 900);
                          }}
                          className={`relative p-2 rounded-xl border flex flex-col items-center justify-center text-center gap-1 transition-all group cursor-pointer ${
                            isSelected
                              ? "border-amber-500 bg-amber-50 text-amber-800 shadow-xs ring-1 ring-amber-500/30 font-bold"
                              : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-medium"
                          }`}
                        >
                          <span className="text-base group-hover:scale-115 transition-transform duration-150 inline-block leading-none">
                            {eff.icon}
                          </span>
                          <span className="text-[11px] leading-tight truncate w-full">
                            {eff.name}
                          </span>
                          {isSelected && (
                            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-600" />
                          )}
                        </button>
                      );
                    });
                  })()}
                </div>

                {/* Quick button to clear exit effect */}
                <button
                  type="button"
                  onClick={() => {
                    const currentTransition = props.transition || {};
                    if (selectedElement) {
                      onUpdateProps(selectedElement.id, {
                        transition: { ...currentTransition, exitEffectType: "none" },
                        _previewKey: Date.now(),
                      });
                    }
                    if (!isSoundMuted) weddingSounds.playSoftClick();
                  }}
                  className="w-full py-1.5 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>🚫 Đặt về mặc định (Mờ dần khi cuộn qua)</span>
                </button>
              </div>
            )}

            {/* ================= PHẦN NỘI DUNG NHÓM: 3. LIÊN TỤC (CONTINUOUS / LOOP) ================= */}
            {effectGroup === "continuous" && (
              <div className="space-y-2.5 pt-0.5">
                {/* Grid of tiles (Ô chọn hiệu ứng Liên tục - Gọn gàng 3 cột) */}
                <div className="grid grid-cols-3 gap-1.5 max-h-[220px] overflow-y-auto pr-0.5 scrollbar-thin">
                  {CONTINUOUS_EFFECTS.map((item) => {
                    const currentType = props.continuousAnimation?.type || "none";
                    const isSelected = currentType === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        title={`${item.name} (${item.nameEn})${item.desc ? ` - ${item.desc}` : ""}`}
                        onClick={() => {
                          if (!isSoundMuted) weddingSounds.playSoftClick();
                          handlePropChange("continuousAnimation", {
                            type: item.id,
                            duration: item.defaultDuration || props.continuousAnimation?.duration || 3,
                            delay: 0,
                          });
                          setMiniPreviewKey(Date.now());
                          setIsPlayingPreview(true);
                          setTimeout(() => setIsPlayingPreview(false), 900);
                        }}
                        className={`relative p-2 rounded-xl border flex flex-col items-center justify-center text-center gap-1 transition-all group cursor-pointer ${
                          isSelected
                            ? "border-purple-500 bg-purple-50 text-purple-800 shadow-xs ring-1 ring-purple-500/30 font-bold"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-medium"
                        }`}
                      >
                        <span className="text-base group-hover:scale-115 transition-transform duration-150 inline-block leading-none">
                          {item.icon}
                        </span>
                        <span className="text-[11px] leading-tight truncate w-full">
                          {item.name}
                        </span>
                        {isSelected && (
                          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-purple-600" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Speed / Duration slider for Loop */}
                {props.continuousAnimation?.type && props.continuousAnimation.type !== "none" && (
                  <div className="space-y-1.5 p-2 bg-purple-50/50 rounded-xl border border-purple-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700">Tốc độ lặp:</span>
                      <span className="font-mono font-bold text-purple-700">
                        {props.continuousAnimation.duration || 3}s / vòng
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="8"
                      step="0.2"
                      value={props.continuousAnimation.duration || 3}
                      onChange={(e) =>
                        handlePropChange("continuousAnimation", {
                          ...props.continuousAnimation,
                          duration: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-purple-600"
                    />
                  </div>
                )}

                {/* Quick button to clear continuous effect */}
                <button
                  type="button"
                  onClick={() => {
                    handlePropChange("continuousAnimation", { type: "none", duration: 3, delay: 0 });
                    if (!isSoundMuted) weddingSounds.playSoftClick();
                  }}
                  className="w-full py-1.5 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>🚫 Đặt về đứng yên (Không lặp chuyển động)</span>
                </button>
              </div>
            )}

            {/* ================= PHẦN DÙNG CHUNG: 4. COMBO CHUYỂN ĐỘNG 1-CHẠM ================= */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Combo 1-chạm:</span>
                </label>
                {onApplyComboToAll && (
                  <span className="text-[10px] text-gray-400">Đồng bộ cả thiệp</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {ANIMATION_COMBOS.map((combo) => {
                  const isSelected = selectedComboId === combo.id;
                  return (
                    <button
                      key={combo.id}
                      type="button"
                      title={`${combo.name}: ${combo.desc}`}
                      onClick={() => {
                        setSelectedComboId(combo.id);
                        if (!isSoundMuted) weddingSounds.playChime();
                        if (selectedElement) {
                          onUpdateProps(selectedElement.id, {
                            transition: {
                              effectEnabled: true,
                              effectType: combo.entranceEffect,
                              effectDuration: combo.duration,
                              effectDelay: 0,
                              effectEasing: combo.easing,
                              hoverEffect: combo.hoverEffect,
                            },
                            continuousAnimation: {
                              type: combo.loopEffect,
                              duration: combo.loopEffect === "pulse" ? 2 : combo.loopEffect === "bounce" ? 4.7 : 3.1,
                              delay: 0,
                            },
                            _previewKey: Date.now(),
                          });
                          setMiniPreviewKey(Date.now());
                          setIsPlayingPreview(true);
                          setTimeout(() => setIsPlayingPreview(false), 1000);
                        }
                      }}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center gap-1 transition-all relative cursor-pointer ${
                        isSelected
                          ? "border-[#e54153] bg-rose-50/90 text-[#e54153] shadow-xs font-bold ring-1 ring-[#e54153]/30"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-medium"
                      }`}
                    >
                      <span className="text-base leading-none">{combo.icon}</span>
                      <span className="text-[11px] leading-tight truncate w-full">{combo.name}</span>
                      {isSelected && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#e54153]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {onApplyComboToAll && (
                <button
                  type="button"
                  onClick={() => {
                    const currentCombo = ANIMATION_COMBOS.find((c) => c.id === selectedComboId) || ANIMATION_COMBOS[0];
                    if (!isSoundMuted) weddingSounds.playCelebration();
                    onApplyComboToAll(currentCombo);
                    setMiniPreviewKey(Date.now());
                    setIsPlayingPreview(true);
                    setTimeout(() => setIsPlayingPreview(false), 1200);
                  }}
                  className="w-full py-1.5 px-3 rounded-xl border border-rose-300 bg-gradient-to-r from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 text-[#e54153] text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Áp dụng Combo cho toàn bộ thiệp</span>
                </button>
              )}
            </div>

            {/* ================= PHẦN DÙNG CHUNG: 5. HIỆU ỨNG TƯƠNG TÁC KHI CHẠM (HOVER & TAP) ================= */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                <span>Hiệu ứng chạm / rê chuột (Hover):</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {HOVER_EFFECTS.map((hov) => {
                  const currentHover = props.transition?.hoverEffect || "none";
                  const isActive = currentHover === hov.id;
                  return (
                    <button
                      key={hov.id}
                      type="button"
                      title={`${hov.name}: ${hov.desc}`}
                      onClick={() => {
                        if (!isSoundMuted) weddingSounds.playSoftClick();
                        const cur = props.transition || {};
                        handlePropChange("transition", {
                          ...cur,
                          effectEnabled: true,
                          hoverEffect: hov.id,
                        });
                      }}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center gap-1 transition-all cursor-pointer ${
                        isActive
                          ? "border-[#e54153] bg-rose-50 text-[#e54153] font-bold shadow-2xs ring-1 ring-[#e54153]/30"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-medium"
                      }`}
                    >
                      <span className="text-base leading-none">{hov.icon}</span>
                      <span className="text-[11px] leading-tight truncate w-full">{hov.name}</span>
                      {isActive && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#e54153]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
