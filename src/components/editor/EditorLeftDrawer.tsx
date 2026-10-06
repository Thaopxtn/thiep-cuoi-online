"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  UploadCloud,
  ChevronLeft,
  Image as ImageIcon,
  Plus,
  Music,
  MapPin,
  Calendar,
  Gift,
  Heart,
  Sparkles,
  FileText,
  Search,
  Check,
  Play,
  Pause,
  Volume2,
  Palette,
  Wand2,
  QrCode,
  Sliders,
  Eye,
  SlidersHorizontal,
  RotateCcw,
  Layers,
  PhoneCall,
  MessageCircle,
  HelpCircle,
  Command,
  Flame,
  Camera,
  Wrench,
  Loader2,
  Copy,
  Trash2,
  Settings,
  Lock,
} from "lucide-react";
import { EditorToolTab } from "./EditorLeftRail";
import { ZENLOVE_TEMPLATES, ZenLoveTemplate } from "@/data/zenloveTemplates";
import { compressImageToWebP, formatBytes } from "@/lib/imageCompression";
import { useUploadedMediaLibrary, countImageUsageInNodes } from "@/lib/mediaLibraryService";
import { getSafeImageUrl, handleImageFallback, DEFAULT_WEDDING_BACKGROUND, DEFAULT_WEDDING_BACKGROUND_RED, DEFAULT_WEDDING_BACKGROUND_SILK } from "@/lib/imageUtils";
import { isDecorativeNode } from "@/lib/decorativeLockService";
import { generateVietQrUrl } from "@/lib/vietQrBankCodes";
import { SelectedElementData } from "./EditorRightInspector";
import { WeddingCard } from "@/data/initialCards";
import { AutoFillFormData, applyAutoFillToNodes } from "@/lib/templateValidation";

interface EditorLeftDrawerProps {
  activeTab: EditorToolTab;
  isOpen: boolean;
  onClose: () => void;
  nodes?: Record<string, any>;
  card?: WeddingCard | null;
  onOpenAutoFillModal?: () => void;
  onApplyAutoFill?: (
    updatedNodes: Record<string, any>,
    updatedCard: Partial<WeddingCard>,
    stats: { textCount: number; photoCount: number; widgetCount: number }
  ) => void;
  // Image
  onAddImage: (url: string) => void;
  selectedElement?: SelectedElementData | null;
  onUpdateElementProps?: (elementId: string, updatedProps: Record<string, any>) => void;
  // Text
  onAddText: (text: string, type: "heading" | "subheading" | "body") => void;
  // Background
  currentBackground?: {
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundOpacity?: number;
  };
  onChangeBackground?: (bg: { color?: string; image?: string; opacity?: number }) => void;
  // Stock
  onAddStock?: (stockUrl: string, name: string) => void;
  // Tools
  onRemoveBackground?: () => void;
  isRemovingBackground?: boolean;
  // Music
  currentMusic?: { title: string; url: string };
  onChangeMusic: (title: string, url: string) => void;
  // Widgets
  onAddWidget?: (widgetType: string, customProps?: Record<string, any>) => void;
  // Templates
  onSelectTemplate: (template: ZenLoveTemplate) => void;
  // Effects
  onToggleEffect?: (effectName: string) => void;
  activeEffects?: string[];
  // Presets
  onApplyThemePreset?: (preset: {
    name: string;
    backgroundColor: string;
    primaryColor: string;
    textColor: string;
    fontFamily?: string;
  }) => void;
  // Settings
  onOpenSettings?: () => void;
}

export default function EditorLeftDrawer({
  activeTab,
  isOpen,
  onClose,
  nodes = {},
  card,
  onOpenAutoFillModal,
  onApplyAutoFill,
  onAddImage,
  selectedElement,
  onUpdateElementProps,
  onAddText,
  currentBackground,
  onChangeBackground,
  onAddStock,
  onRemoveBackground,
  isRemovingBackground = false,
  currentMusic,
  onChangeMusic,
  onAddWidget,
  onSelectTemplate,
  onToggleEffect,
  activeEffects = [],
  onApplyThemePreset,
  onOpenSettings,
}: EditorLeftDrawerProps) {
  // AutoFill state inside Drawer
  const [quickGroom, setQuickGroom] = useState(card?.groom?.name || "");
  const [quickBride, setQuickBride] = useState(card?.bride?.name || "");
  const [quickDate, setQuickDate] = useState(card?.weddingDate || "2026-11-20");
  const [quickTime, setQuickTime] = useState(card?.weddingTime || "11:00");
  const [quickVenue, setQuickVenue] = useState(card?.events?.[0]?.venue || "");
  const [quickAddress, setQuickAddress] = useState(card?.events?.[0]?.address || "");
  const [autoFillSuccessMessage, setAutoFillSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (card?.groom?.name) setQuickGroom(card.groom.name);
    if (card?.bride?.name) setQuickBride(card.bride.name);
    if (card?.weddingDate) setQuickDate(card.weddingDate);
    if (card?.weddingTime) setQuickTime(card.weddingTime);
    if (card?.events?.[0]?.venue) setQuickVenue(card.events[0].venue);
    if (card?.events?.[0]?.address) setQuickAddress(card.events[0].address);
  }, [card]);

  const handleDrawerAutoFillApply = () => {
    if (!quickGroom.trim() || !quickBride.trim()) {
      alert("Vui lòng nhập tên Chú Rể và Cô Dâu!");
      return;
    }
    const formData: AutoFillFormData = {
      groomName: quickGroom,
      brideName: quickBride,
      weddingDate: quickDate,
      weddingTime: quickTime,
      lunarDate: card?.lunarDate || "Ngày 10 tháng 10 năm Bính Ngọ",
      venueName: quickVenue || "Trung tâm Hội nghị & Tiệc cưới Trống Đồng Palace",
      address: quickAddress || "72 Quán Sứ, Hoàn Kiếm, Hà Nội",
      coverPhoto: card?.coverImage || "",
      albumPhotos: card?.album || [],
    };

    const { updatedNodes, updatedCard, stats } = applyAutoFillToNodes(nodes, card || null, formData);
    onApplyAutoFill?.(updatedNodes, updatedCard, stats);
    setAutoFillSuccessMessage(`Đã tự động cập nhật ${stats.textCount} văn bản & ${stats.widgetCount} tiện ích vào thiệp!`);
    setTimeout(() => setAutoFillSuccessMessage(null), 5000);
  };

  const handleDrawerFillSample = () => {
    setQuickGroom("Trần Minh Quân");
    setQuickBride("Phạm Mai Linh");
    setQuickDate("2026-12-25");
    setQuickTime("11:30");
    setQuickVenue("Trung tâm Tiệc cưới Trống Đồng Palace");
    setQuickAddress("Số 65 Quán Sứ, Hoàn Kiếm, TP. Hà Nội");
  };

  // Image Tab state with persistent Media Library (tự động lưu bền vững vào localStorage)
  const [imageSubTab, setImageSubTab] = useState<"all" | "folders">("all");
  const {
    images: uploadedImages,
    addImages: addUploadedImages,
    addImage: addUploadedImage,
    removeImage: removeUploadedImage,
    clearLibrary: clearUploadedLibrary,
  } = useUploadedMediaLibrary();
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [lastCompressionInfo, setLastCompressionInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Background Tab state
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const [customBgColor, setCustomBgColor] = useState("#ffffff");
  const [bgOpacity, setBgOpacity] = useState(1);

  // Stock Tab state
  const [stockCategory, setStockCategory] = useState<"flowers" | "rings" | "traditional" | "seals">("flowers");
  const [stockSearch, setStockSearch] = useState("");

  // Tools Tab state
  const [qrBank, setQrBank] = useState("MB");
  const [qrAccount, setQrAccount] = useState("240220038888");
  const [qrName, setQrName] = useState("NGUYEN VAN HUNG");
  const [qrAmount, setQrAmount] = useState("");
  const [qrMemo, setQrMemo] = useState("Mung cuoi hai ban");
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  // Music Tab state
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio upload state
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const [customAudioUrl, setCustomAudioUrl] = useState("");
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingAudio(true);
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      let audioSrc = "";
      if (res.ok) {
        const json = await res.json();
        if (json.url) audioSrc = json.url;
      }
      if (!audioSrc) {
        audioSrc = URL.createObjectURL(file);
      }
      const title = file.name.replace(/\.[^/.]+$/, "");
      onChangeMusic(title, audioSrc);
    } catch (err) {
      console.error("Lỗi upload nhạc:", err);
    } finally {
      setIsUploadingAudio(false);
      if (audioFileInputRef.current) audioFileInputRef.current.value = "";
    }
  };

  // Templates Tab state
  const [searchTemplate, setSearchTemplate] = useState("");

  useEffect(() => {
    if (audioRef.current) {
      if (playingSongId && audioUrl) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [playingSongId, audioUrl]);

  if (!isOpen) return null;

  // File upload handler with 95% WebP compression
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsCompressing(true);
      const newUrls: string[] = [];
      let totalOriginal = 0;
      let totalCompressed = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const result = await compressImageToWebP(file, { maxDimension: 1600, quality: 0.82 });
          totalOriginal += result.originalSize;
          totalCompressed += result.compressedSize;

          const formData = new FormData();
          formData.append("file", result.file);
          const res = await fetch("/api/upload", { method: "POST", body: formData });
          if (res.ok) {
            const json = await res.json();
            if (json.url) newUrls.push(json.url);
          } else {
            newUrls.push(result.dataUrl);
          }
        } catch (err) {
          const url = URL.createObjectURL(file);
          newUrls.push(url);
        }
      }

      const savings =
        totalOriginal > 0
          ? Math.round(((totalOriginal - totalCompressed) / totalOriginal) * 100)
          : 0;
      setLastCompressionInfo(
        `Nén WebP: ${formatBytes(totalOriginal)} ➔ ${formatBytes(totalCompressed)} (-${savings}%)`
      );
      setTimeout(() => setLastCompressionInfo(null), 6000);

      // Lưu bền vững vào Media Library (localStorage + broadcast event)
      if (newUrls.length > 0) {
        addUploadedImages(newUrls);
      }
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Background image file upload
  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressing(true);
      const result = await compressImageToWebP(file, { maxDimension: 1920, quality: 0.82 });
      const formData = new FormData();
      formData.append("file", result.file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      let uploadedUrl = result.dataUrl;
      if (res.ok) {
        const json = await res.json();
        if (json.url) uploadedUrl = json.url;
      }
      // Lưu ảnh nền đã tải lên vào Thư viện ảnh để tái sử dụng
      addUploadedImage(uploadedUrl);
      onChangeBackground?.({ image: uploadedUrl });
    } catch (err) {
      console.error(err);
    } finally {
      setIsCompressing(false);
      if (bgFileInputRef.current) bgFileInputRef.current.value = "";
    }
  };

  // VietQR generation
  const handleInsertVietQr = () => {
    setIsGeneratingQr(true);
    const cleanAccount = (qrAccount || "").replace(/[^a-zA-Z0-9]/g, "");
    const qrUrl = generateVietQrUrl(
      qrBank,
      cleanAccount,
      qrName ? qrName.toUpperCase() : undefined,
      qrAmount ? Number(qrAmount) || undefined : undefined,
      qrMemo || undefined
    );

    if (onAddWidget) {
      onAddWidget("GiftQrBox", {
        imgKey: qrUrl,
        bankName: qrBank,
        accountNumber: cleanAccount,
        accountName: qrName ? qrName.toUpperCase() : "",
        modalTitle: "Mừng Cưới Cô Dâu & Chú Rể",
      });
    } else {
      onAddImage(qrUrl);
    }
    setTimeout(() => setIsGeneratingQr(false), 500);
  };

  // 10 Curated Romantic Wedding Songs
  const weddingSongs = [
    {
      id: "s-1",
      title: "Beautiful In White - Shane Filan",
      desc: "Bản tình ca bất hủ trong lễ đường",
      url: "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3",
    },
    {
      id: "s-2",
      title: "A Thousand Years - Christina Perri",
      desc: "Ngàn năm đợi chờ một khoảnh khắc",
      url: "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3",
    },
    {
      id: "s-3",
      title: "Ngày Đầu Tiên - Đức Phúc",
      desc: "Khoảnh khắc trao nhẫn ngọt ngào nhất",
      url: "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3",
    },
    {
      id: "s-4",
      title: "Until I Found You - Stephen Sanchez",
      desc: "Giai điệu retro cổ điển lãng mạn",
      url: "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3",
    },
    {
      id: "s-5",
      title: "Cưới Nhau Đi (Yes I Do) - Bùi Anh Tuấn",
      desc: "Lời nguyện thề trước mặt hai gia đình",
      url: "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3",
    },
    {
      id: "s-6",
      title: "Perfect - Ed Sheeran",
      desc: "Khiêu vũ dưới ánh nến lung linh",
      url: "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3",
    },
    {
      id: "s-7",
      title: "Ánh Nắng Của Anh - Đức Phúc",
      desc: "Sưởi ấm con tim mỗi ngày thức giấc",
      url: "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3",
    },
    {
      id: "s-8",
      title: "Hạnh Phúc Cuối Cùng - Trương Việt Thái",
      desc: "Giai điệu piano dịu êm cảm xúc",
      url: "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3",
    },
    {
      id: "s-9",
      title: "Can't Help Falling In Love - Kina Grannis",
      desc: "Acoustic dịu ngọt bước vào lễ đường",
      url: "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3",
    },
    {
      id: "s-10",
      title: "Yêu Là Cưới - Phát Hồ",
      desc: "Sôi động rộn ràng tiệc cưới chung vui",
      url: "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3",
    },
  ];

  // Stock library assets
  const stockItems = [
    {
      id: "stk-1",
      cat: "flowers",
      name: "Hoa hồng Burgundy",
      url: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=350",
    },
    {
      id: "stk-2",
      cat: "flowers",
      name: "Cành lá Ô liu xanh",
      url: "https://images.unsplash.com/photo-1508615039623-a25605d2b022?q=80&w=350",
    },
    {
      id: "stk-3",
      cat: "flowers",
      name: "Hoa mẫu đơn trắng",
      url: "https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=350",
    },
    {
      id: "stk-4",
      cat: "flowers",
      name: "Cành cúc hoạ mi",
      url: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=350",
    },
    {
      id: "stk-5",
      cat: "rings",
      name: "Cặp nhẫn cưới kim cương",
      url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=350",
    },
    {
      id: "stk-6",
      cat: "rings",
      name: "Ly Champagne tiệc mừng",
      url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=350",
    },
    {
      id: "stk-7",
      cat: "rings",
      name: "Bồ câu ngậm nhẫn",
      url: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=350",
    },
    {
      id: "stk-8",
      cat: "traditional",
      name: "Chữ Song Hỷ mạ vàng",
      url: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=350",
    },
    {
      id: "stk-9",
      cat: "traditional",
      name: "Họa tiết quạt đỏ cung đình",
      url: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=350",
    },
    {
      id: "stk-10",
      cat: "seals",
      name: "Con dấu sáp đỏ Vintage",
      url: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=350",
    },
    {
      id: "stk-11",
      cat: "seals",
      name: "Khung góc hoàng gia mạ vàng",
      url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=350",
    },
  ];

  // Paper Textures
  const paperTextures = [
    {
      id: "tex-zenlove-1",
      name: "Cung điện Hoàng gia ZenLove",
      url: DEFAULT_WEDDING_BACKGROUND,
    },
    {
      id: "tex-zenlove-2",
      name: "Gấm hoa Song Hỷ Hoàng gia",
      url: DEFAULT_WEDDING_BACKGROUND_RED,
    },
    {
      id: "tex-zenlove-3",
      name: "Lụa tơ tằm cổ điển ZenLove",
      url: DEFAULT_WEDDING_BACKGROUND_SILK,
    },
    {
      id: "tex-zenlove-4",
      name: "Mây trời Hồng hạc lãng mạn",
      url: "https://cdn-resource.zenlove.me/resources/background/mj63u9y75kzfbxeg.webp",
    },
    {
      id: "tex-1",
      name: "Giấy gân mỹ thuật",
      url: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=600",
    },
    {
      id: "tex-2",
      name: "Vân đá Cẩm thạch",
      url: "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=600",
    },
    {
      id: "tex-3",
      name: "Giấy Kraft Vintage",
      url: "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?q=80&w=600",
    },
    {
      id: "tex-4",
      name: "Vàng ánh kim sang trọng",
      url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=600",
    },
    {
      id: "tex-5",
      name: "Nền hoa sen pastel",
      url: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=600",
    },
    {
      id: "tex-6",
      name: "Sợi lụa hoàng cung",
      url: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600",
    },
  ];

  // Preset themes
  const themePresets = [
    {
      name: "Burgundy Romance",
      tag: "Quý phái & Cổ điển",
      backgroundColor: "#590310",
      primaryColor: "#e54153",
      textColor: "#ffffff",
      fontFamily: "font-serif",
      swatches: ["#590310", "#e54153", "#f7e9ea", "#ffffff"],
    },
    {
      name: "Sage Botanical",
      tag: "Thanh mát & Tự nhiên",
      backgroundColor: "#f4f7f4",
      primaryColor: "#3b5a45",
      textColor: "#24362b",
      fontFamily: "font-sans",
      swatches: ["#3b5a45", "#6b8e23", "#eef2ed", "#ffffff"],
    },
    {
      name: "Korean Minimalist",
      tag: "Hàn Quốc tinh tế",
      backgroundColor: "#faf7f2",
      primaryColor: "#b46a55",
      textColor: "#3d312a",
      fontFamily: "font-sans",
      swatches: ["#b46a55", "#cbbba8", "#faf7f2", "#ffffff"],
    },
    {
      name: "Royal Classic",
      tag: "Hoàng gia sang trọng",
      backgroundColor: "#16243b",
      primaryColor: "#d4af37",
      textColor: "#ffffff",
      fontFamily: "font-serif",
      swatches: ["#16243b", "#d4af37", "#f3ece1", "#ffffff"],
    },
    {
      name: "Sweet Pastel",
      tag: "Hồng phấn ngọt ngào",
      backgroundColor: "#fff6f7",
      primaryColor: "#e54153",
      textColor: "#4a282d",
      fontFamily: "font-serif",
      swatches: ["#e54153", "#fcd4d9", "#fff6f7", "#ffffff"],
    },
    {
      name: "Vintage Parchment",
      tag: "Hoài niệm ấm áp",
      backgroundColor: "#f5f0eb",
      primaryColor: "#7a3e26",
      textColor: "#38231a",
      fontFamily: "font-serif",
      swatches: ["#7a3e26", "#c49a75", "#f5f0eb", "#ffffff"],
    },
  ];

  return (
    <aside className="w-[300px] sm:w-[320px] bg-white border-r border-gray-200 h-full flex flex-col z-30 select-none shrink-0 shadow-sm relative animate-slide-in">
      {/* Hidden audio element for preview */}
      <audio ref={audioRef} onEnded={() => setPlayingSongId(null)} />

      {/* Collapse Drawer button on right edge */}
      <button
        type="button"
        onClick={onClose}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-md text-gray-500 hover:text-gray-900 flex items-center justify-center z-40 transition-transform hover:scale-110"
        title="Thu gọn bảng công cụ"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Drawer Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-bold text-sm text-gray-900 capitalize flex items-center gap-1.5">
          {activeTab === "autofill" && "⚡ Tự động điền"}
          {activeTab === "image" && "Hình ảnh"}
          {activeTab === "text" && "Văn bản"}
          {activeTab === "background" && "Nền thiệp"}
          {activeTab === "stock" && "Kho ảnh & Sticker"}
          {activeTab === "tools" && "Công cụ & AI"}
          {activeTab === "music" && "Nhạc nền đám cưới"}
          {activeTab === "widgets" && "Tiện ích tương tác"}
          {activeTab === "templates" && "Đổi mẫu thiệp"}
          {activeTab === "effects" && "Hiệu ứng chuyển động"}
          {activeTab === "presets" && "Bộ phối màu & Font"}
          {activeTab === "support" && "Hỗ trợ khách hàng"}
        </h3>
        <span className="text-[11px] font-medium text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
          ZenLove Studio
        </span>
      </div>

      {/* Drawer Body corresponding to activeTab */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ================= 0. TAB: TỰ ĐỘNG ĐIỀN (AUTO-FILL) ================= */}
        {activeTab === "autofill" && (
          <div className="space-y-4">
            {/* Banner mở Modal đầy đủ */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-50 to-amber-50/50 border border-rose-200/80 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#e54153] to-[#ff5b70] text-white flex items-center justify-center shrink-0">
                  <Wand2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">
                    Biểu mẫu Tự Động Điền
                  </h4>
                  <p className="text-[10px] text-gray-500">
                    Tự động gán thông tin & ảnh vào toàn bộ thiệp
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenAutoFillModal}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#e54153] to-[#ff5268] hover:from-[#d93849] hover:to-[#e54153] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Mở biểu mẫu đầy đủ (Rộng rãi)</span>
              </button>
            </div>

            {/* Thông báo thành công */}
            {autoFillSuccessMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 animate-fadeIn">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
                <span>{autoFillSuccessMessage}</span>
              </div>
            )}

            {/* Biểu mẫu điền nhanh ngay trong Drawer */}
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
              <div className="flex items-center justify-between border-b border-gray-200/80 pb-2">
                <span className="text-xs font-bold text-gray-800">
                  Điền nhanh vào thiệp:
                </span>
                <button
                  type="button"
                  onClick={handleDrawerFillSample}
                  className="text-[10px] text-[#e54153] font-bold hover:underline cursor-pointer"
                >
                  ⚡ Điền mẫu thử
                </button>
              </div>

              {/* Chú rể & Cô dâu */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-700">Tên Chú Rể:</label>
                <input
                  type="text"
                  value={quickGroom}
                  onChange={(e) => setQuickGroom(e.target.value)}
                  placeholder="VD: Trần Minh Quân"
                  className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-700">Tên Cô Dâu:</label>
                <input
                  type="text"
                  value={quickBride}
                  onChange={(e) => setQuickBride(e.target.value)}
                  placeholder="VD: Phạm Mai Linh"
                  className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                />
              </div>

              {/* Ngày cưới & Giờ cưới */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-700">Ngày cưới:</label>
                  <input
                    type="date"
                    value={quickDate}
                    onChange={(e) => setQuickDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-700">Giờ cưới:</label>
                  <input
                    type="time"
                    value={quickTime}
                    onChange={(e) => setQuickTime(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                  />
                </div>
              </div>

              {/* Trung tâm tiệc cưới */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-700">Trung tâm tiệc cưới / Nhà rạp:</label>
                <input
                  type="text"
                  value={quickVenue}
                  onChange={(e) => setQuickVenue(e.target.value)}
                  placeholder="Trống Đồng Palace"
                  className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-700">Địa chỉ cụ thể:</label>
                <input
                  type="text"
                  value={quickAddress}
                  onChange={(e) => setQuickAddress(e.target.value)}
                  placeholder="Số 72 Quán Sứ, Hoàn Kiếm, Hà Nội"
                  className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                />
              </div>

              {/* Nút Áp dụng ngay */}
              <button
                type="button"
                onClick={handleDrawerAutoFillApply}
                className="w-full py-2.5 px-3 rounded-xl bg-[#e54153] hover:bg-[#d93849] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer mt-2"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Áp dụng vào thiệp cưới</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= 1. TAB: HÌNH ẢNH ================= */}
        {activeTab === "image" && (
          <div className="space-y-4">
            {/* Upload Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-rose-200 hover:border-[#e54153] rounded-2xl p-5 text-center cursor-pointer bg-rose-50/30 hover:bg-rose-50/60 transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-[#e54153] text-white flex items-center justify-center mx-auto mb-2.5 shadow-sm group-hover:scale-105 transition-transform">
                <UploadCloud className={`w-6 h-6 ${isCompressing ? "animate-bounce" : ""}`} />
              </div>
              <p className="text-xs text-gray-700 leading-snug font-semibold">
                {isCompressing
                  ? "Đang tự động nén WebP siêu nhẹ..."
                  : "Nhấn để chọn ảnh từ máy tính / điện thoại"}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">
                Tự động nén WebP tiết kiệm 95% dung lượng (0đ chi phí máy chủ)
              </p>

              {lastCompressionInfo && (
                <div className="mt-2 py-1 px-2.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold inline-block animate-fade-in">
                  ✨ {lastCompressionInfo}
                </div>
              )}
            </div>

            {/* Sub-tabs: Thư viện ảnh đã tải lên & tự động lưu */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-gray-800">
                    Thư viện đã tải lên ({uploadedImages.length})
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5" /> Tự động lưu
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 font-medium">
                  {uploadedImages.filter((s) => countImageUsageInNodes(s, nodes)).length} đang dùng trên thiệp •{" "}
                  {uploadedImages.filter((s) => countImageUsageInNodes(s, nodes) === 0).length} chưa dùng (ảnh thừa)
                </div>
              </div>
              {uploadedImages.length > 2 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm("Khôi phục danh sách ảnh mẫu mặc định? Các ảnh tải lên trước đó sẽ được dọn khỏi bộ nhớ tạm.")) {
                      clearUploadedLibrary();
                    }
                  }}
                  className="text-[10px] text-gray-400 hover:text-rose-600 transition-colors"
                  title="Đặt lại thư viện ảnh"
                >
                  Đặt lại
                </button>
              )}
            </div>

            {selectedElement && selectedElement.type === "PhotoBox" && (() => {
              const isLockedPhoto = isDecorativeNode(selectedElement.id, nodes[selectedElement.id]) || selectedElement.props?.locked;
              if (isLockedPhoto) {
                return (
                  <div className="px-2.5 py-2 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-[11px] text-amber-800 shadow-2xs">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Họa tiết trang trí của mẫu</span>
                    </div>
                    <span className="text-[10px] text-amber-700 font-medium">Đã khóa cố định</span>
                  </div>
                );
              }
              return (
                <div className="px-2.5 py-2 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-between text-[11px] text-[#e54153]">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>Đang chọn khung ảnh trên thiệp</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium">Bấm ảnh để thay thế</span>
                </div>
              );
            })()}

            {selectedElement && selectedElement.type === "CarouselBox" && (
              <div className="px-2.5 py-2 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-between text-[11px] text-[#e54153]">
                <div className="flex items-center gap-1.5 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>Đang chọn Album cưới ({Array.isArray(selectedElement.props?.imgList) ? selectedElement.props.imgList.length : 0} ảnh)</span>
                </div>
                <span className="text-[10px] text-gray-500 font-medium">Bấm ảnh để thêm vào album</span>
              </div>
            )}

            {/* Images Grid */}
            {uploadedImages.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs">
                <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>Chưa có ảnh nào trong thư viện.</p>
                <p className="text-[11px] text-gray-400 mt-1">Bấm khung bên trên để tải ảnh lên.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {uploadedImages.map((src, idx) => {
                  const safeSrc = getSafeImageUrl(src);
                  const usageCount = countImageUsageInNodes(src, nodes);
                  const isCurrentlyUsing =
                    selectedElement?.type === "PhotoBox" &&
                    (selectedElement.props?.imgKey === src ||
                      selectedElement.props?.imgKey === safeSrc ||
                      selectedElement.props?.src === src ||
                      selectedElement.props?.src === safeSrc);
                  const isInCarousel =
                    selectedElement?.type === "CarouselBox" &&
                    Array.isArray(selectedElement.props?.imgList) &&
                    selectedElement.props.imgList.some(
                      (item: any) =>
                        item?.imageKey === src ||
                        item?.imageKey === safeSrc ||
                        item?.src === src ||
                        item?.src === safeSrc
                    );

                  return (
                    <div
                      key={`${src}-${idx}`}
                      onClick={() => {
                        if (selectedElement && selectedElement.type === "PhotoBox" && onUpdateElementProps) {
                          const isLockedPhoto = isDecorativeNode(selectedElement.id, nodes[selectedElement.id]) || selectedElement.props?.locked;
                          if (isLockedPhoto) {
                            alert("Họa tiết trang trí này đã được khóa cố định để đảm bảo thiết kế gốc của thiệp!");
                            return;
                          }
                          onUpdateElementProps(selectedElement.id, { imgKey: safeSrc, src: safeSrc });
                        } else if (selectedElement && selectedElement.type === "CarouselBox" && onUpdateElementProps) {
                          const currentList = Array.isArray(selectedElement.props?.imgList) ? [...selectedElement.props.imgList] : [];
                          currentList.push({
                            imageKey: safeSrc,
                            src: safeSrc,
                            caption: `Khoảnh khắc cưới ${currentList.length + 1}`,
                          });
                          onUpdateElementProps(selectedElement.id, { imgList: currentList });
                        } else {
                          onAddImage(safeSrc);
                        }
                      }}
                      className={`group relative aspect-square rounded-xl overflow-hidden border cursor-pointer hover:shadow-md transition-all ${
                        isCurrentlyUsing || isInCarousel
                          ? "border-[#e54153] ring-2 ring-rose-300"
                          : "border-gray-200 hover:border-[#e54153]"
                      }`}
                    >
                      <img
                        src={safeSrc}
                        alt={`Uploaded ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => handleImageFallback(e)}
                        loading="lazy"
                      />

                      {/* Top floating quick action buttons */}
                      <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        {/* Copy URL button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(src);
                            setCopiedUrl(src);
                            setTimeout(() => setCopiedUrl(null), 2000);
                          }}
                          className="w-6 h-6 rounded-md bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors shadow-sm"
                          title="Sao chép đường dẫn ảnh"
                        >
                          {copiedUrl === src ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>

                        {/* Delete photo button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeUploadedImage(src);
                          }}
                          className="w-6 h-6 rounded-md bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition-colors shadow-sm"
                          title="Xóa ảnh khỏi thư viện"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Hover action overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[11px] font-bold p-1 text-center pointer-events-none">
                        <span>
                          {selectedElement && selectedElement.type === "PhotoBox"
                            ? "Thay thế ảnh đang chọn"
                            : selectedElement && selectedElement.type === "CarouselBox"
                            ? "Thêm vào album cưới (+)"
                            : "Chèn vào thiệp (+)"}
                        </span>
                      </div>

                      {/* Badge số lần sử dụng trên thiệp */}
                      <div className="absolute bottom-1.5 left-1.5 z-10 pointer-events-none">
                        {usageCount > 0 ? (
                          <span
                            className="px-1.5 py-0.5 rounded-md bg-emerald-600/90 text-white text-[9px] font-bold shadow-xs flex items-center gap-1 backdrop-blur-xs"
                            title={`Ảnh này đang được dùng ${usageCount} lần trên thiệp`}
                          >
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                            <span>Dùng {usageCount} lần</span>
                          </span>
                        ) : (
                          <span
                            className="px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-medium shadow-xs flex items-center gap-0.5 backdrop-blur-xs"
                            title="Ảnh này chưa được gán vào khung nào trên thiệp (Ảnh thừa / dự phòng)"
                          >
                            <span>Chưa dùng</span>
                          </span>
                        )}
                      </div>

                      {/* Active badge */}
                      {isCurrentlyUsing && (
                        <div className="absolute top-1.5 left-1.5 bg-[#e54153] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm flex items-center gap-0.5 pointer-events-none z-10 animate-pulse">
                          <span>Đang chọn</span>
                        </div>
                      )}
                      {isInCarousel && (
                        <div className="absolute top-1.5 left-1.5 bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm flex items-center gap-0.5 pointer-events-none z-10">
                          <span>Trong album</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= 2. TAB: VĂN BẢN ================= */}
        {activeTab === "text" && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => onAddText("Đức Mạnh & Lệ Quyên", "heading")}
              className="w-full py-3 px-4 rounded-xl border border-gray-200 hover:border-[#e54153] bg-gray-50/50 hover:bg-rose-50/30 text-left transition-all group"
            >
              <span className="text-lg font-black font-serif text-gray-900 group-hover:text-[#e54153] block">
                Thêm tiêu đề lớn
              </span>
              <span className="text-[11px] text-gray-400">Dành cho tên cô dâu & chú rể</span>
            </button>

            <button
              type="button"
              onClick={() => onAddText("Trân trọng kính mời quý khách", "subheading")}
              className="w-full py-2.5 px-4 rounded-xl border border-gray-200 hover:border-[#e54153] bg-gray-50/50 hover:bg-rose-50/30 text-left transition-all"
            >
              <span className="text-sm font-bold text-gray-800 block">Thêm tiêu đề phụ</span>
              <span className="text-[11px] text-gray-400">Dành cho lời chào, ngày tháng</span>
            </button>

            <button
              type="button"
              onClick={() => onAddText("Sự hiện diện của quý vị là niềm vinh hạnh cho gia đình chúng tôi", "body")}
              className="w-full py-2 px-4 rounded-xl border border-gray-200 hover:border-[#e54153] bg-gray-50/50 hover:bg-rose-50/30 text-left transition-all"
            >
              <span className="text-xs text-gray-700 block">Thêm đoạn văn bản ngắn</span>
              <span className="text-[10px] text-gray-400">Dành cho địa chỉ, thông điệp</span>
            </button>

            <div className="pt-2">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Kiểu chữ mẫu sẵn:
              </h4>
              <div className="space-y-1.5">
                {[
                  { text: "Save the date", font: "font-serif italic", size: "text-lg" },
                  { text: "Lễ Thành Hôn", font: "font-signature", size: "text-xl" },
                  { text: "Trăm Năm Hạnh Phúc", font: "font-serif", size: "text-base" },
                  { text: "Lễ Vu Quy", font: "font-signature", size: "text-xl" },
                ].map((sample, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onAddText(sample.text, "heading")}
                    className={`w-full p-2.5 rounded-xl border border-gray-100 hover:border-[#e54153]/50 text-center ${sample.font} ${sample.size} text-gray-800 hover:bg-rose-50/20`}
                  >
                    {sample.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= 3. TAB: NỀN THIỆP ================= */}
        {activeTab === "background" && (
          <div className="space-y-4">
            {/* Color Swatches */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-800">Màu sắc nền</span>
                <span className="text-[11px] font-mono text-gray-500 uppercase">
                  {currentBackground?.backgroundColor || customBgColor}
                </span>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {[
                  { name: "Trắng", hex: "#ffffff" },
                  { name: "Kem", hex: "#faf7f2" },
                  { name: "Linen", hex: "#f5f0eb" },
                  { name: "Nude", hex: "#fdf4f4" },
                  { name: "Burgundy", hex: "#590310" },
                  { name: "Crimson", hex: "#8b1524" },
                  { name: "Champagne", hex: "#f3ece1" },
                  { name: "Gold Pale", hex: "#eee4cb" },
                  { name: "Sage", hex: "#eef2ed" },
                  { name: "Olive", hex: "#e2e8df" },
                  { name: "Navy", hex: "#16243b" },
                  { name: "Dark Slate", hex: "#1f2124" },
                ].map((swatch, i) => {
                  const isActive = (currentBackground?.backgroundColor || customBgColor).toLowerCase() === swatch.hex.toLowerCase();
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setCustomBgColor(swatch.hex);
                        onChangeBackground?.({ color: swatch.hex });
                      }}
                      className={`w-9 h-9 rounded-xl border shadow-2xs transition-transform hover:scale-110 active:scale-95 relative flex items-center justify-center ${
                        isActive ? "ring-2 ring-[#e54153] ring-offset-1 border-white" : "border-gray-200"
                      }`}
                      style={{ backgroundColor: swatch.hex }}
                      title={swatch.name}
                    >
                      {isActive && (
                        <Check className={`w-3.5 h-3.5 ${["#590310", "#8b1524", "#16243b", "#1f2124"].includes(swatch.hex) ? "text-white" : "text-gray-900"}`} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Custom Color Picker Input */}
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="color"
                  value={currentBackground?.backgroundColor || customBgColor}
                  onChange={(e) => {
                    setCustomBgColor(e.target.value);
                    onChangeBackground?.({ color: e.target.value });
                  }}
                  className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0 overflow-hidden"
                />
                <input
                  type="text"
                  value={currentBackground?.backgroundColor || customBgColor}
                  onChange={(e) => {
                    setCustomBgColor(e.target.value);
                    onChangeBackground?.({ color: e.target.value });
                  }}
                  className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 font-mono focus:border-[#e54153] focus:outline-none uppercase"
                  placeholder="#FFFFFF"
                />
              </div>
            </div>

            {/* Paper Textures & Patterns */}
            <div className="border-t border-gray-100 pt-3">
              <span className="text-xs font-bold text-gray-800 block mb-2">
                Chất liệu giấy mỹ thuật & Hoa văn
              </span>
              <div className="grid grid-cols-2 gap-2">
                {paperTextures.map((tex) => (
                  <button
                    key={tex.id}
                    type="button"
                    onClick={() => onChangeBackground?.({ image: tex.url })}
                    className="p-1 rounded-xl border border-gray-200 hover:border-[#e54153] text-left group bg-white shadow-2xs hover:shadow-xs transition-all"
                  >
                    <div className="h-16 rounded-lg overflow-hidden mb-1.5 bg-gray-100">
                      <img
                        src={tex.url}
                        alt={tex.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-gray-800 block truncate px-1">
                      {tex.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Background Uploader */}
            <div className="border-t border-gray-100 pt-3">
              <input
                ref={bgFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleBgUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => bgFileInputRef.current?.click()}
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-gray-300 hover:border-[#e54153] bg-gray-50/50 hover:bg-rose-50/20 text-xs font-semibold text-gray-700 flex items-center justify-center gap-2 transition-all"
              >
                <UploadCloud className="w-4 h-4 text-gray-500" />
                <span>Tải ảnh nền riêng của bạn</span>
              </button>
            </div>

            {/* Reset Background button */}
            <button
              type="button"
              onClick={() => onChangeBackground?.({ color: "#ffffff", image: "", opacity: 1 })}
              className="w-full py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-rose-600 bg-gray-100 hover:bg-rose-50 flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại nền trắng chuẩn</span>
            </button>
          </div>
        )}

        {/* ================= 4. TAB: STOCK (KHO ẢNH & STICKER) ================= */}
        {activeTab === "stock" && (
          <div className="space-y-3">
            {/* Category tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-gray-100 rounded-xl text-[11px] font-bold">
              {[
                { id: "flowers", label: "Hoa lá" },
                { id: "rings", label: "Nhẫn" },
                { id: "traditional", label: "Song Hỷ" },
                { id: "seals", label: "Con dấu" },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setStockCategory(c.id as any)}
                  className={`py-1.5 rounded-lg transition-all text-center ${
                    stockCategory === c.id ? "bg-white text-gray-900 shadow-2xs" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Stock Grid */}
            <div className="grid grid-cols-2 gap-2">
              {stockItems
                .filter((s) => s.cat === stockCategory)
                .map((stock) => (
                  <div
                    key={stock.id}
                    onClick={() => {
                      if (onAddStock) {
                        onAddStock(stock.url, stock.name);
                      } else {
                        onAddImage(stock.url);
                      }
                    }}
                    className="p-1 rounded-xl border border-gray-200 hover:border-[#e54153] bg-white cursor-pointer group shadow-2xs hover:shadow-xs transition-all text-center"
                  >
                    <div className="aspect-square rounded-lg overflow-hidden mb-1.5 bg-stone-50 flex items-center justify-center p-2">
                      <img
                        src={stock.url}
                        alt={stock.name}
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-gray-700 block truncate px-1">
                      {stock.name}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ================= 5. TAB: CÔNG CỤ & AI ================= */}
        {activeTab === "tools" && (
          <div className="space-y-4">
            {/* 1. AI Background Removal */}
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-purple-50/50 to-pink-50/80 border border-indigo-100/60 shadow-2xs space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Wand2 className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">✨ AI Xóa phông thông minh</h4>
                  <p className="text-[10px] text-gray-500">Tách nền ảnh cưới chỉ trong 1 giây</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onRemoveBackground}
                disabled={isRemovingBackground}
                className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                {isRemovingBackground ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang AI tách nền...</span>
                  </>
                ) : (
                  <span>Xóa phông ảnh đang chọn</span>
                )}
              </button>
            </div>

            {/* 2. VietQR Generator */}
            <div className="p-3 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Tạo mã QR mừng cưới VietQR</h4>
                  <p className="text-[10px] text-gray-500">Chuẩn liên ngân hàng Napas 247</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                    Ngân hàng thụ hưởng:
                  </label>
                  <select
                    value={qrBank}
                    onChange={(e) => setQrBank(e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-200 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="MB">MB Bank (Quân Đội)</option>
                    <option value="VCB">Vietcombank</option>
                    <option value="TCB">Techcombank</option>
                    <option value="VPB">VPBank</option>
                    <option value="ACB">ACB Á Châu</option>
                    <option value="BIDV">BIDV</option>
                    <option value="CTG">VietinBank</option>
                    <option value="TPB">TPBank</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                    Số tài khoản:
                  </label>
                  <input
                    type="text"
                    value={qrAccount}
                    onChange={(e) => setQrAccount(e.target.value)}
                    placeholder="VD: 0987654321"
                    className="w-full p-2 rounded-lg border border-gray-200 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                    Tên chủ tài khoản (Viết hoa không dấu):
                  </label>
                  <input
                    type="text"
                    value={qrName}
                    onChange={(e) => setQrName(e.target.value.toUpperCase())}
                    placeholder="VD: NGUYEN VAN HUNG"
                    className="w-full p-2 rounded-lg border border-gray-200 uppercase text-xs focus:border-emerald-500 focus:outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                    Nội dung mừng cưới mặc định:
                  </label>
                  <input
                    type="text"
                    value={qrMemo}
                    onChange={(e) => setQrMemo(e.target.value)}
                    placeholder="Mung cuoi hai ban"
                    className="w-full p-2 rounded-lg border border-gray-200 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleInsertVietQr}
                  disabled={isGeneratingQr}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                >
                  {isGeneratingQr ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Chèn mã VietQR vào thiệp</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= 6. TAB: NHẠC NỀN ================= */}
        {activeTab === "music" && (
          <div className="space-y-3.5">
            {/* Current Active Music Card */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200/80 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block mb-1">
                Nhạc nền đang phát trên thiệp:
              </span>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#e54153] text-white flex items-center justify-center shrink-0">
                  <Music className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {currentMusic?.title || "Chưa chọn nhạc"}
                  </p>
                  <p className="text-[10px] text-gray-500 font-mono truncate">
                    {currentMusic?.url ? "Tự động phát khi mở thiệp" : "Không phát"}
                  </p>
                </div>
              </div>
            </div>

            {/* Custom MP3 Upload */}
            <div>
              <input
                ref={audioFileInputRef}
                type="file"
                accept="audio/*,.mp3,.m4a,.wav"
                onChange={handleAudioUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => audioFileInputRef.current?.click()}
                disabled={isUploadingAudio}
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-rose-300 hover:border-[#e54153] bg-white hover:bg-rose-50/30 text-xs font-bold text-gray-800 flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
              >
                {isUploadingAudio ? (
                  <>
                    <Loader2 className="w-4 h-4 text-[#e54153] animate-spin" />
                    <span>Đang tải lên bài hát...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4 text-[#e54153]" />
                    <span>Tải lên file MP3 của riêng bạn</span>
                  </>
                )}
              </button>
            </div>

            {/* Custom URL Input */}
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={customAudioUrl}
                onChange={(e) => setCustomAudioUrl(e.target.value)}
                placeholder="Dán link nhạc MP3 trực tiếp..."
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:border-[#e54153] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (customAudioUrl.trim()) {
                    onChangeMusic("Bản nhạc tự chọn", customAudioUrl.trim());
                    setCustomAudioUrl("");
                  }
                }}
                disabled={!customAudioUrl.trim()}
                className="px-3 py-2 bg-gray-900 hover:bg-[#e54153] disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-colors shrink-0"
              >
                Áp dụng
              </button>
            </div>

            <div className="border-t border-gray-100 pt-2">
              <span className="text-xs font-bold text-gray-800 block mb-2">
                Hoặc chọn bản tình ca gợi ý sẵn:
              </span>
            </div>

            <div className="space-y-2">
              {weddingSongs.map((song) => {
                const isThisPlaying = playingSongId === song.id;
                const isSelected = currentMusic?.title === song.title;

                return (
                  <div
                    key={song.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                      isSelected ? "border-[#e54153] bg-rose-50/40 shadow-2xs" : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (isThisPlaying) {
                            setPlayingSongId(null);
                          } else {
                            setPlayingSongId(song.id);
                            setAudioUrl(song.url);
                          }
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90 ${
                          isThisPlaying
                            ? "bg-[#e54153] text-white shadow-xs"
                            : "bg-rose-100 text-[#e54153] hover:bg-rose-200"
                        }`}
                        title={isThisPlaying ? "Tạm dừng nghe thử" : "Nghe thử"}
                      >
                        {isThisPlaying ? (
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {song.title}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">{song.desc}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onChangeMusic(song.title, song.url);
                      }}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold shrink-0 transition-transform active:scale-95 ${
                        isSelected
                          ? "bg-[#e54153] text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {isSelected ? "Đang chọn" : "Chọn"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= 7. TAB: TIỆN ÍCH ================= */}
        {activeTab === "widgets" && (
          <div className="space-y-2.5">
            {/* Quick settings banner for fixed footer items */}
            {onOpenSettings && (
              <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-50 via-amber-50 to-orange-50 border border-rose-200/90 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚙️</span>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Mục cố định chân trang</h4>
                    <p className="text-[10px] text-gray-600">Hộp mừng cưới VietQR, Sổ lưu bút, RSVP</p>
                  </div>
                </div>
                <p className="text-[11px] text-gray-600 leading-snug">
                  Đổi số tài khoản ngân hàng, tên cô dâu chú rể hoặc bật/tắt hiển thị các mục này ở cuối thiệp:
                </p>
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="w-full py-2 px-3 rounded-xl bg-zen-primary hover:bg-[#d93849] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Cài đặt Hộp mừng & RSVP</span>
                </button>
              </div>
            )}

            <div className="pt-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Chèn Widget vào trang:
              </span>
            </div>

            {[
              {
                id: "CountdownBoxV2",
                title: "Đếm ngược ngày cưới",
                desc: "Hiển thị đồng hồ đếm ngược Ngày - Giờ - Phút đến ngày cưới",
                icon: <Calendar className="w-5 h-5 text-indigo-500" />,
              },
              {
                id: "MapBox",
                title: "Bản đồ chỉ đường (Maps)",
                desc: "Tích hợp Google Maps dẫn đường khách đến tiệc cưới",
                icon: <MapPin className="w-5 h-5 text-blue-500" />,
              },
              {
                id: "GiftQrBox",
                title: "Hộp mừng cưới (QR Ngân hàng)",
                desc: "Quét mã QR chuyển khoản tiền mừng cưới tiện lợi",
                icon: <Gift className="w-5 h-5 text-amber-500" />,
              },
              {
                id: "RsvpBoxV2",
                title: "Xác nhận tham dự (RSVP)",
                desc: "Form khách xác nhận tham dự và số lượng người đi cùng",
                icon: <Heart className="w-5 h-5 text-rose-500" />,
              },
              {
                id: "CalendarBoxV2",
                title: "Lịch cưới tháng",
                desc: "Tờ lịch tháng với ngày cưới khoanh tròn trái tim",
                icon: <Calendar className="w-5 h-5 text-emerald-500" />,
              },
            ].map((widget) => (
              <div
                key={widget.id}
                onClick={() => onAddWidget?.(widget.id)}
                className="p-3 rounded-xl border border-gray-200 hover:border-[#e54153] bg-white flex items-start gap-3 cursor-pointer shadow-2xs hover:shadow-xs transition-all group"
              >
                <div className="p-2 rounded-xl bg-gray-50 group-hover:bg-rose-50 shrink-0 transition-colors">
                  {widget.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-900 group-hover:text-[#e54153] transition-colors">
                      {widget.title}
                    </h4>
                    <span className="text-[10px] font-bold text-gray-400 group-hover:text-[#e54153]">
                      + Chèn
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-snug mt-0.5">
                    {widget.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================= 8. TAB: MẪU ================= */}
        {activeTab === "templates" && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm mẫu thiệp..."
                value={searchTemplate}
                onChange={(e) => setSearchTemplate(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#e54153]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
              {ZENLOVE_TEMPLATES.filter((t) =>
                t.name.toLowerCase().includes(searchTemplate.toLowerCase())
              ).map((t) => (
                <div
                  key={t.id}
                  onClick={() => onSelectTemplate(t)}
                  className="group cursor-pointer rounded-xl border border-gray-200 hover:border-[#e54153] p-1.5 bg-white text-center hover:shadow-sm transition-all"
                >
                  <div className="aspect-[1000/1470] overflow-hidden rounded-lg bg-gray-100 mb-1">
                    <img
                      src={t.imageUrl}
                      alt={t.name}
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <p className="text-[11px] font-bold text-gray-900 truncate">
                    {t.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= 9. TAB: HIỆU ỨNG ================= */}
        {activeTab === "effects" && (
          <div className="space-y-2">
            {[
              { id: "petals", name: "Cánh hoa rơi", icon: "🌸", desc: "Cánh hoa đào hồng bay nhẹ nhàng" },
              { id: "hearts", name: "Trái tim tình yêu bay", icon: "💖", desc: "Trái tim lãng mạn bay bổng" },
              { id: "glitter", name: "Lấp lánh hoàng kim", icon: "✨", desc: "Bụi vàng sang trọng lung linh" },
              { id: "snow", name: "Tuyết rơi mùa đông", icon: "❄️", desc: "Hạt tuyết rơi êm đềm ấm áp" },
              { id: "fireworks", name: "Pháo hoa chúc mừng", icon: "🎆", desc: "Bùng nổ pháo hoa rực rỡ" },
              { id: "butterflies", name: "Bươm bướm lượn", icon: "🦋", desc: "Đôi bướm uyên ương dập dìu" },
            ].map((eff) => {
              const active = activeEffects.includes(eff.id);
              return (
                <button
                  key={eff.id}
                  type="button"
                  onClick={() => onToggleEffect?.(eff.id)}
                  className={`w-full p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all text-left ${
                    active
                      ? "border-[#e54153] bg-rose-50 text-[#e54153] shadow-2xs"
                      : "border-gray-200 hover:border-gray-300 bg-white text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{eff.icon}</span>
                    <div>
                      <p className="text-xs font-bold">{eff.name}</p>
                      <p className="text-[10px] text-gray-500 font-normal">{eff.desc}</p>
                    </div>
                  </div>
                  {active && <Check className="w-4 h-4 text-[#e54153]" />}
                </button>
              );
            })}
          </div>
        )}

        {/* ================= 10. TAB: PRESETS ================= */}
        {activeTab === "presets" && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 leading-relaxed">
              Áp dụng 1 chạm bộ phối màu & font chữ chuyên gia cho toàn bộ trang thiệp:
            </p>

            <div className="space-y-2.5">
              {themePresets.map((preset, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl border border-gray-200 hover:border-[#e54153] bg-white shadow-2xs space-y-2 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 group-hover:text-[#e54153]">
                        {preset.name}
                      </h4>
                      <span className="text-[10px] text-gray-400">{preset.tag}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onApplyThemePreset?.(preset)}
                      className="px-2.5 py-1 rounded-full bg-rose-50 hover:bg-[#e54153] text-[#e54153] hover:text-white text-[11px] font-bold transition-colors"
                    >
                      Áp dụng
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    {preset.swatches.map((color, idx) => (
                      <div
                        key={idx}
                        className="w-5 h-5 rounded-full border border-gray-200 shadow-2xs"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= 11. TAB: HỖ TRỢ ================= */}
        {activeTab === "support" && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 space-y-2">
              <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-[#e54153]" />
                <span>Trung tâm hỗ trợ cô dâu chú rể</span>
              </h4>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Đội ngũ kỹ thuật viên ZenLove luôn sẵn sàng hỗ trợ bạn chỉnh sửa thiệp đẹp nhất.
              </p>
              <div className="pt-1 flex gap-2">
                <a
                  href="https://zalo.me"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-center text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Chat Zalo</span>
                </a>
                <a
                  href="tel:0988000000"
                  className="flex-1 py-2 px-3 rounded-xl bg-[#e54153] hover:bg-rose-700 text-white font-bold text-center text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Gọi Hotline</span>
                </a>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl p-3 bg-white space-y-2">
              <h5 className="font-bold text-gray-800 flex items-center gap-1.5">
                <Command className="w-3.5 h-3.5 text-gray-500" />
                <span>Phím tắt thao tác nhanh</span>
              </h5>
              <div className="space-y-1.5 text-[11px] text-gray-600">
                <div className="flex justify-between py-0.5 border-b border-gray-50">
                  <span>Hoàn tác:</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-gray-100 font-mono text-[10px]">Ctrl + Z</kbd>
                </div>
                <div className="flex justify-between py-0.5 border-b border-gray-50">
                  <span>Làm lại:</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-gray-100 font-mono text-[10px]">Ctrl + Y</kbd>
                </div>
                <div className="flex justify-between py-0.5 border-b border-gray-50">
                  <span>Xóa phần tử:</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-gray-100 font-mono text-[10px]">Delete / Backspace</kbd>
                </div>
                <div className="flex justify-between py-0.5 border-b border-gray-50">
                  <span>Di chuyển tinh chỉnh:</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-gray-100 font-mono text-[10px]">Phím mũi tên</kbd>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl p-3 bg-white space-y-1.5">
              <h5 className="font-bold text-gray-800">Quy trình 3 bước gửi thiệp:</h5>
              <ol className="list-decimal list-inside text-[11px] text-gray-600 space-y-1 leading-relaxed">
                <li>Thay ảnh cưới và thông tin ngày giờ, địa điểm hôn lễ.</li>
                <li>Bấm <strong>Xem trước</strong> để kiểm tra trên điện thoại.</li>
                <li>Bấm <strong>Xuất bản</strong> để lấy link gửi qua Zalo / Facebook!</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
