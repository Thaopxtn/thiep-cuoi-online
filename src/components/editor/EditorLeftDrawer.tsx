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
  Unlock,
  Eraser,
  Type,
  LayoutGrid,
  Clock,
  Users,
  CreditCard,
  Navigation,
  ExternalLink,
  MessageSquare,
  Crown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Edit3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Download,
  Upload,
  FileJson,
  ShieldCheck,
  Keyboard,
} from "lucide-react";
import { EditorToolTab } from "./EditorLeftRail";
import { ZENLOVE_TEMPLATES, ZenLoveTemplate } from "@/data/zenloveTemplates";
import { compressImageToWebP, formatBytes } from "@/lib/imageCompression";
import {
  useUploadedMediaLibrary,
  countImageUsageInNodes,
  uploadFileToServer,
  extractImagesFromNodes,
  isSameImageUrl,
} from "@/lib/mediaLibraryService";
import { getSafeImageUrl, handleImageFallback, DEFAULT_WEDDING_BACKGROUND, DEFAULT_WEDDING_BACKGROUND_RED, DEFAULT_WEDDING_BACKGROUND_SILK } from "@/lib/imageUtils";
import {
  isDecorativeNode,
  isElementLocked,
  classifyTemplateElements,
  TemplateElementItem,
  repairAndLockDecorativeNodes,
} from "@/lib/decorativeLockService";
import { POPULAR_BANKS } from "@/lib/vietQrBankCodes";
import { CURATED_WEDDING_SONGS } from "@/lib/weddingMusicLibrary";
import { syncCardDataToCanvasNodes } from "@/lib/textSyncService";
import { SelectedElementData } from "./EditorRightInspector";
import { WeddingCard } from "@/data/initialCards";
import { AutoFillFormData, applyAutoFillToNodes } from "@/lib/templateValidation";
import {
  MODULE_CATEGORIES,
  MODULE_PRESETS,
  ModulePresetItem,
  getPresetsByCategory,
} from "@/lib/modulePresetsCatalog";
import { weddingSounds } from "@/lib/soundEffects";
import PhotoshopLayersPanel from "./PhotoshopLayersPanel";
import ModulePresetsFolderBrowser from "./ModulePresetsFolderBrowser";
import { MODULE_STYLE_CATALOG, FixedModuleId } from "./EditorFixedModuleEditModal";
import { scrollToFixedModule } from "./EditorFixedModulesCanvas";
import PresetVisualPreviewMockup from "./PresetVisualPreviewMockup";
import { WEDDING_FRAMES, WeddingFrameItem } from "@/lib/framesCatalog";
import {
  WEDDING_STICKERS,
  STICKER_CATEGORIES,
  getStickersByCategory,
  WeddingStickerItem,
} from "@/lib/stickersCatalog";
import {
  UNIFIED_WEDDING_MODULES,
  UnifiedModuleDef,
  THEME_CATEGORIES,
  ThemeCategoryId,
  getDefaultThemeCategory,
  getModulesForTheme,
} from "@/lib/unifiedModulesRegistry";
import EffectConfigPanel from "./EffectConfigPanel";
import { EffectConfig } from "@/lib/effectsCatalog";

interface EditorLeftDrawerProps {
  activeTab: EditorToolTab;
  isOpen: boolean;
  onClose: () => void;
  onSelectTab?: (tab: EditorToolTab) => void;
  onSelectFixedModule?: (moduleId: FixedModuleId) => void;
  onDuplicateElement?: (elementId: string) => void;
  onDeleteElement?: (elementId: string) => void;
  nodes?: Record<string, any>;
  card?: WeddingCard | null;
  onOpenAutoFillModal?: () => void;
  onApplyAutoFill?: (
    updatedNodes: Record<string, any>,
    updatedCard: Partial<WeddingCard>,
    stats: { textCount: number; photoCount: number; widgetCount: number }
  ) => void;
  onSelectElement?: (element: { id: string; type: string; props: any }) => void;
  onRepairDecorations?: () => void;
  // Image & Album
  cardAlbum?: string[];
  onUpdateAlbum?: (album: string[]) => void;
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
  // Stock & Elements & Frames
  onAddStock?: (stockUrl: string, name: string) => void;
  onAddFrame?: (frame: WeddingFrameItem) => void;
  onAddSpacer?: (height: number) => void;
  onShiftElementsBelow?: (thresholdY: number, deltaY: number) => void;
  // Tools
  onRemoveBackground?: () => void;
  onOpenManualCutout?: () => void;
  isRemovingBackground?: boolean;
  onExportPng?: () => void;
  onExportJson?: () => void;
  onImportJson?: (jsonData: any) => void;
  // Music
  currentMusic?: { title: string; url: string };
  onChangeMusic: (title: string, url: string) => void;
  // Widgets / Module Presets
  onAddWidget?: (widgetType: string, customProps?: Record<string, any>) => void;
  onAddModulePreset?: (preset: ModulePresetItem) => void;
  // Templates
  currentTemplateId?: string;
  isLoadingTemplate?: boolean;
  onSelectTemplate: (template: ZenLoveTemplate) => void;
  // Effects
  onToggleEffect?: (effectName: string) => void;
  activeEffects?: string[];
  currentEffectConfig?: EffectConfig | null;
  onChangeEffectConfig?: (config: EffectConfig) => void;
  onChangeEnvelopeTheme?: (theme: string) => void;
  onChangeCinematicFx?: (fx: any) => void;
  onPreviewEnvelope?: () => void;
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
  onOpenModuleConfig?: (moduleId: import("./EditorFixedModuleEditModal").FixedModuleId) => void;
}

export default function EditorLeftDrawer({
  activeTab,
  isOpen,
  onClose,
  onSelectTab,
  nodes = {},
  card,
  cardAlbum,
  onUpdateAlbum,
  onOpenAutoFillModal,
  onApplyAutoFill,
  onSelectElement,
  onRepairDecorations,
  onDuplicateElement,
  onDeleteElement,
  onAddImage,
  selectedElement,
  onUpdateElementProps,
  onAddText,
  currentBackground,
  onChangeBackground,
  onAddStock,
  onAddFrame,
  onAddSpacer,
  onShiftElementsBelow,
  onRemoveBackground,
  onOpenManualCutout,
  isRemovingBackground = false,
  onExportPng,
  onExportJson,
  onImportJson,
  currentMusic,
  onChangeMusic,
  onAddWidget,
  onAddModulePreset,
  currentTemplateId,
  isLoadingTemplate = false,
  onSelectTemplate,
  onToggleEffect,
  activeEffects = [],
  currentEffectConfig,
  onChangeEffectConfig,
  onChangeEnvelopeTheme,
  onChangeCinematicFx,
  onPreviewEnvelope,
  onApplyThemePreset,
  onOpenSettings,
  onOpenModuleConfig,
  onSelectFixedModule,
}: EditorLeftDrawerProps) {
  // Module Category Filter
  const [selectedModuleCategory, setSelectedModuleCategory] = useState<string>("all");

  // Bộ lọc & Tìm kiếm cho bảng điều khiển Khối Mẫu thống nhất
  const [widgetsSubTab, setWidgetsSubTab] = useState<"library" | "manage">("library");
  const [widgetsSearchQuery, setWidgetsSearchQuery] = useState("");
  const [widgetsFilterCategory, setWidgetsFilterCategory] = useState<string>("all");
  const [selectedThemeCategory, setSelectedThemeCategory] = useState<ThemeCategoryId>(() =>
    getDefaultThemeCategory(card?.templateName || card?.templateId || card?.slug, (card as any)?.category)
  );

  // Thông tin thiệp cưới toàn diện (Điền 1 lần là xong - Chuyển toàn bộ từ biểu mẫu đầy đủ & mục cố định ra ngoài)
  const [groomName, setGroomName] = useState(card?.groom?.name || "");
  const [groomPhone, setGroomPhone] = useState(card?.groom?.phone || "");
  const [groomFather, setGroomFather] = useState("");
  const [groomMother, setGroomMother] = useState("");
  const [groomBank, setGroomBank] = useState(card?.groom?.bankName || "MB BANK");
  const [groomAccount, setGroomAccount] = useState(card?.groom?.accountNumber || "");
  const [groomAccountName, setGroomAccountName] = useState(card?.groom?.accountName || card?.groom?.name || "");

  const [brideName, setBrideName] = useState(card?.bride?.name || "");
  const [bridePhone, setBridePhone] = useState(card?.bride?.phone || "");
  const [brideFather, setBrideFather] = useState("");
  const [brideMother, setBrideMother] = useState("");
  const [brideBank, setBrideBank] = useState(card?.bride?.bankName || "TECHCOMBANK");
  const [brideAccount, setBrideAccount] = useState(card?.bride?.accountNumber || "");
  const [brideAccountName, setBrideAccountName] = useState(card?.bride?.accountName || card?.bride?.name || "");

  const [weddingDate, setWeddingDate] = useState(card?.weddingDate || "2026-11-20");
  const [weddingTime, setWeddingTime] = useState(card?.weddingTime || "11:00");
  const [lunarDate, setLunarDate] = useState(card?.lunarDate || "Ngày 12 tháng 10 năm Bính Ngọ");

  const [venueName, setVenueName] = useState(card?.events?.[0]?.venue || "");
  const [address, setAddress] = useState(card?.events?.[0]?.address || "");
  const [mapUrl, setMapUrl] = useState(card?.events?.[0]?.mapUrl || "");

  // Tùy chọn Bật/Tắt các mục cố định & sơ đồ hôn lễ
  const [showGiftBox, setShowGiftBox] = useState(card?.showGiftBox !== false);
  const [showMapBox, setShowMapBox] = useState(card?.showEvents !== false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showWishes, setShowWishes] = useState(card?.showWishes !== false);
  const [showRsvp, setShowRsvp] = useState(card?.showRsvp !== false);
  const [showCalendar, setShowCalendar] = useState(card?.showCalendar !== false);
  const [showEvents, setShowEvents] = useState(card?.showEvents !== false);
  const [showAlbum, setShowAlbum] = useState(card?.showAlbum !== false);
  const [showLoveStory, setShowLoveStory] = useState(card?.showLoveStory !== false);

  // Nhạc nền
  const [musicTitle, setMusicTitle] = useState(card?.musicTitle || currentMusic?.title || CURATED_WEDDING_SONGS[0].title);
  const [musicUrl, setMusicUrl] = useState(card?.musicUrl || currentMusic?.url || CURATED_WEDDING_SONGS[0].url);
  const [previewingSongId, setPreviewingSongId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const [autoFillSuccessMessage, setAutoFillSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!card) return;
    if (card.groom?.name) setGroomName(card.groom.name);
    if (card.groom?.phone) setGroomPhone(card.groom.phone);
    if (card.groom?.parents) {
      const parts = card.groom.parents.split("&");
      if (parts[0]) setGroomFather(parts[0].replace(/^(Ông:?|Ông)\s*/i, "").trim());
      if (parts[1]) setGroomMother(parts[1].replace(/^(Bà:?|Bà)\s*/i, "").trim());
    }
    if (card.groom?.bankName) setGroomBank(card.groom.bankName);
    if (card.groom?.accountNumber) setGroomAccount(card.groom.accountNumber);
    if (card.groom?.accountName) setGroomAccountName(card.groom.accountName);

    if (card.bride?.name) setBrideName(card.bride.name);
    if (card.bride?.phone) setBridePhone(card.bride.phone);
    if (card.bride?.parents) {
      const parts = card.bride.parents.split("&");
      if (parts[0]) setBrideFather(parts[0].replace(/^(Ông:?|Ông)\s*/i, "").trim());
      if (parts[1]) setBrideMother(parts[1].replace(/^(Bà:?|Bà)\s*/i, "").trim());
    }
    if (card.bride?.bankName) setBrideBank(card.bride.bankName);
    if (card.bride?.accountNumber) setBrideAccount(card.bride.accountNumber);
    if (card.bride?.accountName) setBrideAccountName(card.bride.accountName);

    if (card.weddingDate) setWeddingDate(card.weddingDate);
    if (card.weddingTime) setWeddingTime(card.weddingTime);
    if (card.lunarDate) setLunarDate(card.lunarDate);

    if (card.events?.[0]?.venue) setVenueName(card.events[0].venue);
    if (card.events?.[0]?.address) setAddress(card.events[0].address);
    if (card.events?.[0]?.mapUrl) setMapUrl(card.events[0].mapUrl);

    setShowGiftBox(card.showGiftBox !== false);
    setShowMapBox(card.showEvents !== false);
    setShowWishes(card.showWishes !== false);
    setShowRsvp(card.showRsvp !== false);
    setShowCalendar(card.showCalendar !== false);
    setShowEvents(card.showEvents !== false);

    if (card.musicTitle) setMusicTitle(card.musicTitle);
    if (card.musicUrl) setMusicUrl(card.musicUrl);
    if (card.showAlbum !== undefined) setShowAlbum(card.showAlbum !== false);
    if (card.showLoveStory !== undefined) setShowLoveStory(card.showLoveStory !== false);
  }, [card]);

  // Thao tác bật/tắt nhanh từng khối mẫu cố định với hiệu ứng âm thanh và lưu tức thì
  const handleToggleFixedModule = (
    key: "showGiftBox" | "showMapBox" | "showRsvp" | "showWishes" | "showCalendar" | "showEvents" | "showAlbum" | "showLoveStory",
    newValue: boolean,
    moduleTitle: string
  ) => {
    try {
      weddingSounds.playSoftClick();
    } catch {}

    let partial: Partial<WeddingCard> = {};
    if (key === "showGiftBox") {
      setShowGiftBox(newValue);
      partial = { showGiftBox: newValue };
    } else if (key === "showMapBox") {
      setShowMapBox(newValue);
      setShowEvents(newValue);
      partial = { showEvents: newValue };
    } else if (key === "showRsvp") {
      setShowRsvp(newValue);
      partial = { showRsvp: newValue };
    } else if (key === "showWishes") {
      setShowWishes(newValue);
      partial = { showWishes: newValue };
    } else if (key === "showCalendar") {
      setShowCalendar(newValue);
      partial = { showCalendar: newValue };
    } else if (key === "showEvents") {
      setShowEvents(newValue);
      setShowMapBox(newValue);
      partial = { showEvents: newValue };
    } else if (key === "showAlbum") {
      setShowAlbum(newValue);
      partial = { showAlbum: newValue };
    } else if (key === "showLoveStory") {
      setShowLoveStory(newValue);
      partial = { showLoveStory: newValue };
    }

    onApplyAutoFill?.(nodes || {}, partial, { textCount: 0, photoCount: 0, widgetCount: 0 });

    if (newValue) {
      const modIdMap: Record<string, FixedModuleId> = {
        showGiftBox: "giftBox",
        showMapBox: "events",
        showEvents: "events",
        showRsvp: "rsvp",
        showWishes: "wishes",
        showCalendar: "calendar",
        showAlbum: "album",
        showLoveStory: "loveStory",
      };
      const targetModId = modIdMap[key];
      if (targetModId) {
        scrollToFixedModule(targetModId);
        onSelectFixedModule?.(targetModId);
      }
    }
  };

  const handleCustomizeUnifiedModule = (mod: UnifiedModuleDef) => {
    try {
      weddingSounds.playSoftClick();
    } catch {}

    if (mod.isFixed && mod.fixedModuleId) {
      onSelectFixedModule?.(mod.fixedModuleId);
      scrollToFixedModule(mod.fixedModuleId);
    } else {
      const existingNodeId = mod.findNodeId?.(nodes || {});
      if (existingNodeId) {
        const node = nodes?.[existingNodeId];
        onSelectElement?.({
          id: existingNodeId,
          type: node?.type?.resolvedName || mod.widgetType || "Widget",
          props: node?.props || {},
        });
        setTimeout(() => {
          const el = document.getElementById(`canvas-node-${existingNodeId}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 80);
      } else {
        if (mod.widgetType) {
          onAddWidget?.(mod.widgetType, mod.defaultProps);
        }
      }
    }
  };

  const handleToggleUnifiedModule = (mod: UnifiedModuleDef, newValue: boolean) => {
    try {
      weddingSounds.playSoftClick();
    } catch {}

    if (mod.isFixed) {
      const fixedKeyMap: Record<string, "showGiftBox" | "showCalendar" | "showEvents" | "showRsvp" | "showWishes" | "showAlbum" | "showLoveStory"> = {
        giftBox: "showGiftBox",
        calendar: "showCalendar",
        events: "showEvents",
        rsvp: "showRsvp",
        wishes: "showWishes",
        album: "showAlbum",
        loveStory: "showLoveStory",
      };
      const key = fixedKeyMap[mod.id];
      if (key) {
        handleToggleFixedModule(key, newValue, mod.name);
      }
    } else {
      const existingNodeId = mod.findNodeId?.(nodes || {});
      if (newValue) {
        if (existingNodeId) {
          const node = nodes?.[existingNodeId];
          onSelectElement?.({
            id: existingNodeId,
            type: node?.type?.resolvedName || mod.widgetType || "Widget",
            props: node?.props || {},
          });
          setTimeout(() => {
            const el = document.getElementById(`canvas-node-${existingNodeId}`);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 80);
        } else if (mod.widgetType) {
          onAddWidget?.(mod.widgetType, mod.defaultProps);
        }
      } else {
        if (existingNodeId) {
          onDeleteElement?.(existingNodeId);
        }
      }
    }
  };

  const handleSetAllFixedModules = (status: boolean) => {
    try {
      weddingSounds.playSoftClick();
    } catch {}
    setShowGiftBox(status);
    setShowMapBox(status);
    setShowRsvp(status);
    setShowWishes(status);
    setShowCalendar(status);
    setShowEvents(status);
    setShowAlbum(status);
    setShowLoveStory(status);

    const partial: Partial<WeddingCard> = {
      showGiftBox: status,
      showEvents: status,
      showRsvp: status,
      showWishes: status,
      showCalendar: status,
      showAlbum: status,
      showLoveStory: status,
    };
    onApplyAutoFill?.(nodes || {}, partial, { textCount: 0, photoCount: 0, widgetCount: 0 });

    if (!status) {
      UNIFIED_WEDDING_MODULES.filter(m => !m.isFixed).forEach(m => {
        const nodeId = m.findNodeId?.(nodes || {});
        if (nodeId) onDeleteElement?.(nodeId);
      });
    } else {
      UNIFIED_WEDDING_MODULES.filter(m => !m.isFixed && m.widgetType).forEach(m => {
        const nodeId = m.findNodeId?.(nodes || {});
        if (!nodeId) onAddWidget?.(m.widgetType!, m.defaultProps);
      });
    }
  };

  const handleQuickChangeStyle = (
    moduleId: FixedModuleId,
    styleId: string,
    moduleKey: "showGiftBox" | "showEvents" | "showRsvp" | "showWishes" | "showCalendar",
    styleTitle: string
  ) => {
    try {
      weddingSounds.playSoftClick();
    } catch {}

    const updatedStyles = {
      ...(card?.fixedModuleStyles || {}),
      [moduleId]: styleId,
    };

    let partial: Partial<WeddingCard> = {
      fixedModuleStyles: updatedStyles,
    };

    if (moduleKey === "showGiftBox") {
      setShowGiftBox(true);
      partial.showGiftBox = true;
    } else if (moduleKey === "showEvents") {
      setShowEvents(true);
      setShowMapBox(true);
      partial.showEvents = true;
    } else if (moduleKey === "showRsvp") {
      setShowRsvp(true);
      partial.showRsvp = true;
    } else if (moduleKey === "showWishes") {
      setShowWishes(true);
      partial.showWishes = true;
    } else if (moduleKey === "showCalendar") {
      setShowCalendar(true);
      partial.showCalendar = true;
    }

    onApplyAutoFill?.(nodes || {}, partial, { textCount: 0, photoCount: 0, widgetCount: 0 });
    scrollToFixedModule(moduleId);
    onSelectFixedModule?.(moduleId);
  };

  const handleGenerateMapUrl = () => {
    const query = `${venueName} ${address}`.trim();
    if (!query) return;
    setMapUrl(`https://maps.google.com/?q=${encodeURIComponent(query)}`);
  };

  const handleDrawerFillSample = () => {
    setGroomName("Trần Minh Quân");
    setGroomPhone("0912 345 678");
    setGroomFather("Trần Văn Hùng");
    setGroomMother("Nguyễn Thị Mai");
    setGroomBank("MB BANK");
    setGroomAccount("240220038888");
    setGroomAccountName("TRAN MINH QUAN");

    setBrideName("Phạm Mai Linh");
    setBridePhone("0987 654 321");
    setBrideFather("Phạm Quốc Tuấn");
    setBrideMother("Lê Thị Thảo");
    setBrideBank("TECHCOMBANK");
    setBrideAccount("190365824988");
    setBrideAccountName("PHAM MAI LINH");

    setWeddingDate("2026-12-25");
    setWeddingTime("11:30");
    setLunarDate("Ngày 16 tháng 11 năm Bính Ngọ");

    setVenueName("Trung tâm Hội nghị & Tiệc cưới Trống Đồng Palace");
    setAddress("Số 72 Quán Sứ, Hoàn Kiếm, TP. Hà Nội");
    setMapUrl("https://maps.google.com/?q=72+Quan+Su+Hoan+Kiem+Ha+Noi");

    setShowGiftBox(true);
    setShowMapBox(true);
    setShowWishes(true);
    setShowRsvp(true);
    setShowCalendar(true);
    setShowEvents(true);
  };

  const handleDrawerAutoFillApply = () => {
    const errs: Record<string, string> = {};
    if (!groomName.trim()) {
      errs.groomName = "Vui lòng nhập họ & tên Chú Rể";
    }
    if (!brideName.trim()) {
      errs.brideName = "Vui lòng nhập họ & tên Cô Dâu";
    }
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setAutoFillSuccessMessage(null);
      return;
    }
    setFieldErrors({});

    const cleanGroomAcc = (groomAccount || "").replace(/[^0-9]/g, "");
    const cleanBrideAcc = (brideAccount || "").replace(/[^0-9]/g, "");
    const generatedMap = mapUrl || (address ? `https://maps.google.com/?q=${encodeURIComponent(`${venueName} ${address}`.trim())}` : "");

    const formData: AutoFillFormData = {
      groomName: groomName.trim(),
      groomPhone: groomPhone.trim(),
      groomFather: groomFather.trim(),
      groomMother: groomMother.trim(),
      groomBank,
      groomAccount: cleanGroomAcc,
      groomAccountName: groomAccountName.trim().toUpperCase() || groomName.trim().toUpperCase(),

      brideName: brideName.trim(),
      bridePhone: bridePhone.trim(),
      brideFather: brideFather.trim(),
      brideMother: brideMother.trim(),
      brideBank,
      brideAccount: cleanBrideAcc,
      brideAccountName: brideAccountName.trim().toUpperCase() || brideName.trim().toUpperCase(),

      weddingDate,
      weddingTime,
      lunarDate,
      venueName: venueName.trim() || "Trung tâm Tiệc cưới",
      address: address.trim() || "Hà Nội",
      mapUrl: generatedMap,

      coverPhoto: card?.coverImage || "",
      albumPhotos: card?.album || [],
    };

    let { updatedNodes, updatedCard, stats } = applyAutoFillToNodes(nodes || {}, card || null, formData);

    const groomParentsStr = groomFather && groomMother ? `Ông ${groomFather} & Bà ${groomMother}` : card?.groom?.parents || "";
    const brideParentsStr = brideFather && brideMother ? `Ông ${brideFather} & Bà ${brideMother}` : card?.bride?.parents || "";

    const { syncedNodes } = syncCardDataToCanvasNodes(
      {
        groom: {
          name: groomName.trim(),
          phone: groomPhone.trim(),
          parents: groomParentsStr,
          bankName: groomBank,
          accountNumber: cleanGroomAcc,
          accountName: groomAccountName.trim().toUpperCase() || groomName.trim().toUpperCase(),
        } as any,
        bride: {
          name: brideName.trim(),
          phone: bridePhone.trim(),
          parents: brideParentsStr,
          bankName: brideBank,
          accountNumber: cleanBrideAcc,
          accountName: brideAccountName.trim().toUpperCase() || brideName.trim().toUpperCase(),
        } as any,
        weddingDate,
        weddingTime,
        lunarDate,
        events: [
          {
            id: "evt-main",
            title: "Lễ Thành Hôn",
            time: `${weddingTime} • ${weddingDate}`,
            venue: venueName.trim() || "Trung tâm Tiệc cưới",
            address: address.trim() || "Hà Nội",
            mapUrl: generatedMap,
          },
        ],
      },
      updatedNodes
    );
    updatedNodes = syncedNodes;

    const finalCard: Partial<WeddingCard> = {
      ...updatedCard,
      weddingDate,
      weddingTime,
      lunarDate,
      showGiftBox,
      showEvents: showMapBox,
      showWishes,
      showRsvp,
      showCalendar,
      musicTitle,
      musicUrl,
      groom: {
        ...(card?.groom || {}),
        title: card?.groom?.title || "Chú Rể",
        name: groomName.trim(),
        phone: groomPhone.trim(),
        parents: groomParentsStr,
        bankName: groomBank,
        accountNumber: cleanGroomAcc,
        accountName: groomAccountName.trim().toUpperCase() || groomName.trim().toUpperCase(),
      },
      bride: {
        ...(card?.bride || {}),
        title: card?.bride?.title || "Cô Dâu",
        name: brideName.trim(),
        phone: bridePhone.trim(),
        parents: brideParentsStr,
        bankName: brideBank,
        accountNumber: cleanBrideAcc,
        accountName: brideAccountName.trim().toUpperCase() || brideName.trim().toUpperCase(),
      },
      events: [
        {
          id: "evt-main",
          title: "Lễ Thành Hôn",
          time: `${weddingTime} • ${weddingDate}`,
          venue: venueName.trim() || "Trung tâm Tiệc cưới",
          address: address.trim() || "Hà Nội",
          mapUrl: generatedMap,
        },
      ],
    };

    if (musicUrl && onChangeMusic) {
      onChangeMusic(musicTitle, musicUrl);
    }

    onApplyAutoFill?.(updatedNodes, finalCard, stats);
    setAutoFillSuccessMessage(`✓ Đã cập nhật thành công ${stats.textCount} đoạn chữ, bản đồ & hộp mừng cưới!`);
    setTimeout(() => setAutoFillSuccessMessage(null), 5000);
  };

  // Image & Album Tab state: "album" (Album cưới phát hành) | "uploads" (Kho ảnh đã tải lên)
  const [imageSubTab, setImageSubTab] = useState<"album" | "uploads">("album");
  const [previewLightboxUrl, setPreviewLightboxUrl] = useState<string | null>(null);

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

  // Danh sách ảnh trong Album cưới phát hành (đồng bộ thời gian thực với Studio)
  const effectiveAlbum = React.useMemo(() => {
    if (Array.isArray(cardAlbum)) return cardAlbum;
    if (Array.isArray(card?.album)) return card.album;
    return Array.from(
      new Set(
        [
          card?.coverImage,
          ...extractImagesFromNodes(nodes),
        ].filter((u): u is string => Boolean(u) && typeof u === "string" && u.trim().length > 0)
      )
    );
  }, [cardAlbum, card?.album, card?.coverImage, nodes]);

  // Thao tác chỉnh sửa Album cưới
  const handleSetAsCover = (photoUrl: string) => {
    const next = [photoUrl, ...effectiveAlbum.filter((p) => p !== photoUrl)];
    onUpdateAlbum?.(next);
  };

  const handleRemoveFromAlbum = (photoUrl: string) => {
    const next = effectiveAlbum.filter((p) => p !== photoUrl);
    onUpdateAlbum?.(next);
  };

  const handleMoveAlbumPhoto = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= effectiveAlbum.length) return;
    const next = [...effectiveAlbum];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    onUpdateAlbum?.(next);
  };

  const handleAddToAlbum = (photoUrl: string) => {
    if (effectiveAlbum.some((p) => isSameImageUrl(p, photoUrl))) return;
    const next = [...effectiveAlbum, photoUrl];
    onUpdateAlbum?.(next);
  };

  const handleAddAllUploadsToAlbum = () => {
    const toAdd = uploadedImages.filter((u) => !effectiveAlbum.some((p) => isSameImageUrl(p, u)));
    if (toAdd.length === 0) return;
    const next = [...effectiveAlbum, ...toAdd];
    onUpdateAlbum?.(next);
  };

  // Background Tab state
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const [customBgColor, setCustomBgColor] = useState("#ffffff");
  const [bgOpacity, setBgOpacity] = useState(1);

  // Elements Tab state (Canva-style Thành phần: Khung, Sticker, Hình khối, Khoảng trống)
  const [elementsSubTab, setElementsSubTab] = useState<"frames" | "stickers" | "shapes" | "spacers">("frames");
  const [stockCategory, setStockCategory] = useState<string>("all");
  const [stockSearch, setStockSearch] = useState("");

  // Tools Tab state
  const jsonBackupInputRef = useRef<HTMLInputElement>(null);

  const handleJsonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        onImportJson?.(parsed);
      } catch (err) {
        alert("File JSON không hợp lệ hoặc bị lỗi cú pháp!");
      }
    };
    reader.readAsText(file);
    if (jsonBackupInputRef.current) jsonBackupInputRef.current.value = "";
  };

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
      const res = await uploadFileToServer(formData);
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
          const res = await uploadFileToServer(formData);
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

      // Lưu bền vững vào Media Library và đưa vào Album cưới phát hành
      if (newUrls.length > 0) {
        addUploadedImages(newUrls);
        const updatedAlbum = Array.from(new Set([...effectiveAlbum, ...newUrls]));
        onUpdateAlbum?.(updatedAlbum);
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
      const res = await uploadFileToServer(formData);
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
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-2xs z-40 md:hidden animate-fade-in"
        onClick={onClose}
      />

      <aside className="fixed inset-x-0 bottom-0 z-50 md:relative md:inset-auto md:w-[320px] md:h-full bg-white border-t md:border-t-0 md:border-r border-gray-200 flex flex-col max-h-[80vh] md:max-h-full rounded-t-3xl md:rounded-none shadow-2xl md:shadow-sm animate-slide-up md:animate-slide-in select-none shrink-0">
        {/* Pull handle on mobile */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-2 md:hidden" />

        {/* Hidden audio element for preview */}
        <audio ref={audioRef} onEnded={() => setPlayingSongId(null)} />

        {/* Collapse Drawer button on right edge for desktop */}
        <button
          type="button"
          onClick={onClose}
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-md text-gray-500 hover:text-gray-900 items-center justify-center z-40 transition-transform hover:scale-110"
          title="Thu gọn bảng công cụ"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Drawer Header */}
        <div className="px-4 py-3 md:p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-gray-900 capitalize flex items-center gap-1.5">
            {activeTab === "autofill" && "Thông tin thiệp cưới"}
            {activeTab === "layers" && "Lớp & Phần tử"}
            {activeTab === "image" && "Ảnh & Album cưới"}
            {activeTab === "text" && "Văn bản"}
            {activeTab === "background" && "Nền thiệp"}
            {activeTab === "stock" && "Thành phần đồ họa (Khung & Họa tiết)"}
            {activeTab === "tools" && "Công cụ & AI"}
            {activeTab === "music" && "Nhạc nền"}
            {activeTab === "widgets" && "Khối mẫu"}
            {activeTab === "templates" && "Mẫu thiệp"}
            {activeTab === "effects" && "Hiệu ứng"}
            {activeTab === "presets" && "Màu sắc & Font"}
            {activeTab === "support" && "Hỗ trợ"}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
              ZenLove Studio
            </span>
            <button
              type="button"
              onClick={onClose}
              className="md:hidden w-7 h-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 text-xs font-bold"
              title="Đóng bảng công cụ"
            >
              ✕
            </button>
          </div>
        </div>

      {/* Drawer Body corresponding to activeTab */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ================= 0. TAB: THÔNG TIN THIỆP CƯỚI (ALL-IN-ONE) ================= */}
        {activeTab === "autofill" && (
          <div className="space-y-4">
            {/* Banner Thông Tin & Nút Hành Động Nhanh */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 border border-rose-200/80 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#e54153] to-[#ff5b70] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">
                      Thông Tin Thiệp Cưới
                    </h4>
                    <p className="text-[10px] text-gray-500">
                      Điền 1 lần là xong • Tự động đồng bộ toàn bộ thiệp
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDrawerFillSample}
                  className="px-2.5 py-1 rounded-xl bg-white/90 hover:bg-white text-[#e54153] text-[10px] font-bold border border-rose-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                  title="Điền nhanh dữ liệu mẫu để thử nghiệm"
                >
                  ⚡ Điền mẫu thử
                </button>
              </div>

              {/* Nút lưu nổi bật trên đầu */}
              <button
                type="button"
                onClick={handleDrawerAutoFillApply}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#e54153] to-[#ff5268] hover:from-[#d93849] hover:to-[#e54153] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Lưu & Áp Dụng Vào Thiệp</span>
              </button>
            </div>

            {/* Thông báo thành công */}
            {autoFillSuccessMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 animate-fadeIn">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
                <span>{autoFillSuccessMessage}</span>
              </div>
            )}

            {/* PHẦN 1: THÔNG TIN CÔ DÂU & CHÚ RỂ (HAI NHÀ) */}
            <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <Heart className="w-4 h-4 text-[#e54153]" />
                <span className="text-xs font-bold text-gray-900">
                  1. Cô Dâu & Chú Rể (Nhà Trai - Nhà Gái)
                </span>
              </div>

              {/* Nhà Trai / Chú Rể */}
              <div className="p-2.5 rounded-xl bg-blue-50/40 border border-blue-100/80 space-y-2">
                <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1">
                  <span>🎩</span>
                  <span>Nhà Trai / Chú Rể</span>
                </span>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-semibold text-gray-700">Tên Chú Rể <span className="text-rose-500 font-bold">*</span>:</label>
                    <span className="text-[9px] text-gray-400 font-medium">Bắt buộc</span>
                  </div>
                  <input
                    type="text"
                    value={groomName}
                    onChange={(e) => {
                      setGroomName(e.target.value);
                      if (fieldErrors.groomName) setFieldErrors((prev) => ({ ...prev, groomName: "" }));
                    }}
                    placeholder="VD: Trần Minh Quân"
                    className={`w-full text-xs p-2 rounded-xl border bg-white font-medium focus:outline-none transition-all ${
                      fieldErrors.groomName
                        ? "border-rose-400 bg-rose-50/20 ring-1 ring-rose-400"
                        : "border-gray-200 focus:border-[#e54153]"
                    }`}
                  />
                  {fieldErrors.groomName && (
                    <p className="text-[10px] text-rose-500 font-semibold">{fieldErrors.groomName}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-600">Số điện thoại:</label>
                  <input
                    type="tel"
                    value={groomPhone}
                    onChange={(e) => setGroomPhone(e.target.value)}
                    placeholder="VD: 0912 345 678"
                    className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-gray-600">Thân phụ (Bố):</label>
                    <input
                      type="text"
                      value={groomFather}
                      onChange={(e) => setGroomFather(e.target.value)}
                      placeholder="Trần Văn Hùng"
                      className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-gray-600">Thân mẫu (Mẹ):</label>
                    <input
                      type="text"
                      value={groomMother}
                      onChange={(e) => setGroomMother(e.target.value)}
                      placeholder="Nguyễn Thị Mai"
                      className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Nhà Gái / Cô Dâu */}
              <div className="p-2.5 rounded-xl bg-rose-50/40 border border-rose-100/80 space-y-2">
                <span className="text-[11px] font-bold text-rose-900 flex items-center gap-1">
                  <span>👰</span>
                  <span>Nhà Gái / Cô Dâu</span>
                </span>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-semibold text-gray-700">Tên Cô Dâu <span className="text-rose-500 font-bold">*</span>:</label>
                    <span className="text-[9px] text-gray-400 font-medium">Bắt buộc</span>
                  </div>
                  <input
                    type="text"
                    value={brideName}
                    onChange={(e) => {
                      setBrideName(e.target.value);
                      if (fieldErrors.brideName) setFieldErrors((prev) => ({ ...prev, brideName: "" }));
                    }}
                    placeholder="VD: Phạm Mai Linh"
                    className={`w-full text-xs p-2 rounded-xl border bg-white font-medium focus:outline-none transition-all ${
                      fieldErrors.brideName
                        ? "border-rose-400 bg-rose-50/20 ring-1 ring-rose-400"
                        : "border-gray-200 focus:border-[#e54153]"
                    }`}
                  />
                  {fieldErrors.brideName && (
                    <p className="text-[10px] text-rose-500 font-semibold">{fieldErrors.brideName}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-600">Số điện thoại:</label>
                  <input
                    type="tel"
                    value={bridePhone}
                    onChange={(e) => setBridePhone(e.target.value)}
                    placeholder="VD: 0987 654 321"
                    className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-gray-600">Thân phụ (Bố):</label>
                    <input
                      type="text"
                      value={brideFather}
                      onChange={(e) => setBrideFather(e.target.value)}
                      placeholder="Phạm Quốc Tuấn"
                      className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-gray-600">Thân mẫu (Mẹ):</label>
                    <input
                      type="text"
                      value={brideMother}
                      onChange={(e) => setBrideMother(e.target.value)}
                      placeholder="Lê Thị Thảo"
                      className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* PHẦN 2: THỜI GIAN & SƠ ĐỒ HÔN LỄ */}
            <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-gray-900">
                  2. Thời Gian & Sơ Đồ Hôn Lễ
                </span>
              </div>

              {/* Ngày cưới & Giờ cưới */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-600">Ngày cưới (Dương lịch):</label>
                  <input
                    type="date"
                    value={weddingDate}
                    onChange={(e) => setWeddingDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-600">Giờ tổ chức:</label>
                  <input
                    type="time"
                    value={weddingTime}
                    onChange={(e) => setWeddingTime(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                  />
                </div>
              </div>

              {/* Ngày âm lịch */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-600">Ngày âm lịch:</label>
                <input
                  type="text"
                  value={lunarDate}
                  onChange={(e) => setLunarDate(e.target.value)}
                  placeholder="VD: Ngày 12 tháng 10 năm Bính Ngọ"
                  className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                />
              </div>

              {/* Tên địa điểm */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-600">Trung tâm tiệc cưới / Nhà rạp:</label>
                <input
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="VD: Trống Đồng Palace / Tư gia Nhà Gái"
                  className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white font-medium"
                />
              </div>

              {/* Địa chỉ cụ thể */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-600">Địa chỉ cụ thể:</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="VD: Số 72 Quán Sứ, Hoàn Kiếm, Hà Nội"
                  className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white"
                />
              </div>

              {/* Link Google Maps / Sơ đồ chỉ đường */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold text-gray-600">Link Google Maps (Chỉ đường):</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGenerateMapUrl}
                      className="text-[10px] text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      title="Tạo link Google Maps từ tên địa điểm & địa chỉ"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Tạo link tự động</span>
                    </button>
                    {mapUrl && (
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-0.5"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Xem thử</span>
                      </a>
                    )}
                  </div>
                </div>
                <input
                  type="url"
                  value={mapUrl}
                  onChange={(e) => setMapUrl(e.target.value)}
                  placeholder="https://maps.google.com/?q=..."
                  className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white font-mono text-[11px]"
                />
              </div>
            </div>

            {/* PHẦN 3: HỘP MỪNG CƯỚI & VIETQR */}
            <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-gray-900">
                    3. Mừng Cưới & VietQR Ngân Hàng
                  </span>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showGiftBox}
                    onChange={(e) => setShowGiftBox(e.target.checked)}
                    className="w-3.5 h-3.5 accent-[#e54153] rounded"
                  />
                  <span className="text-[10px] font-bold text-gray-700">Hiển thị</span>
                </label>
              </div>

              {/* Ngân hàng Chú Rể */}
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200/70 space-y-2">
                <span className="text-[10px] font-bold text-gray-700 uppercase">
                  Tài Khoản Mừng Chú Rể (Nhà Trai)
                </span>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-600">Ngân hàng:</label>
                  <select
                    value={groomBank}
                    onChange={(e) => setGroomBank(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white font-medium"
                  >
                    {POPULAR_BANKS.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-gray-600">Số tài khoản:</label>
                    <input
                      type="text"
                      value={groomAccount}
                      onChange={(e) => setGroomAccount(e.target.value)}
                      placeholder="VD: 240220038888"
                      className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-gray-600">Chủ tài khoản:</label>
                    <input
                      type="text"
                      value={groomAccountName}
                      onChange={(e) => setGroomAccountName(e.target.value.toUpperCase())}
                      placeholder="TRAN MINH QUAN"
                      className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white uppercase font-bold text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Ngân hàng Cô Dâu */}
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200/70 space-y-2">
                <span className="text-[10px] font-bold text-gray-700 uppercase">
                  Tài Khoản Mừng Cô Dâu (Nhà Gái)
                </span>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-600">Ngân hàng:</label>
                  <select
                    value={brideBank}
                    onChange={(e) => setBrideBank(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white font-medium"
                  >
                    {POPULAR_BANKS.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-gray-600">Số tài khoản:</label>
                    <input
                      type="text"
                      value={brideAccount}
                      onChange={(e) => setBrideAccount(e.target.value)}
                      placeholder="VD: 190365824988"
                      className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-gray-600">Chủ tài khoản:</label>
                    <input
                      type="text"
                      value={brideAccountName}
                      onChange={(e) => setBrideAccountName(e.target.value.toUpperCase())}
                      placeholder="PHAM MAI LINH"
                      className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e54153] bg-white uppercase font-bold text-[11px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* GỢI Ý ĐIỀU HƯỚNG SANG MỤC KHỐI MẪU CỐ ĐỊNH */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-50 via-rose-50/40 to-amber-50/50 border border-purple-200/70 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Sliders className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-gray-900 block truncate">
                    Bật / Tắt Các Khối Mẫu Cố Định
                  </span>
                  <span className="text-[10px] text-gray-500 block truncate">
                    Đã chuyển về tab <strong>Khối mẫu</strong> để đồng bộ giao diện
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onSelectTab?.("widgets");
                }}
                className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold transition-all shadow-2xs cursor-pointer shrink-0"
              >
                Mở Khối Mẫu ➔
              </button>
            </div>

            {/* PHẦN 4: NHẠC NỀN ĐÁM CƯỚI */}
            <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-rose-600" />
                  <span className="text-xs font-bold text-gray-900">
                    4. Nhạc Nền Thiệp Cưới
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 font-medium truncate max-w-[150px]">
                  {musicTitle}
                </span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {CURATED_WEDDING_SONGS.map((song) => {
                  const isSelected = musicUrl === song.url;
                  const isPreviewing = previewingSongId === song.id;

                  return (
                    <div
                      key={song.id}
                      onClick={() => {
                        setMusicTitle(song.title);
                        setMusicUrl(song.url);
                      }}
                      className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                        isSelected
                          ? "bg-rose-50 border-rose-300 text-rose-900"
                          : "bg-gray-50/70 hover:bg-gray-100 border-gray-200 text-gray-700"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm shrink-0">🎵</span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold truncate">{song.title}</p>
                          <p className="text-[9px] text-gray-500 truncate">{song.artist}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isPreviewing) {
                              previewAudioRef.current?.pause();
                              setPreviewingSongId(null);
                            } else {
                              if (previewAudioRef.current) {
                                previewAudioRef.current.src = song.url;
                                previewAudioRef.current.play().catch(() => {});
                                setPreviewingSongId(song.id);
                              }
                            }
                          }}
                          className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 text-gray-600 shadow-2xs"
                        >
                          {isPreviewing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        </button>
                        {isSelected && <Check className="w-4 h-4 text-rose-600 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Nút to dưới cùng để lưu toàn bộ */}
            <button
              type="button"
              onClick={handleDrawerAutoFillApply}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#e54153] via-[#f04a5e] to-[#ff5268] hover:brightness-105 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>LƯU & ÁP DỤNG TOÀN BỘ THÔNG TIN</span>
            </button>
          </div>
        )}

        {/* ================= TAB: THÀNH PHẦN THIỆP (LAYERS - PHOTOSHOP STYLE) ================= */}
        {activeTab === "layers" && (
          <PhotoshopLayersPanel
            nodes={nodes}
            selectedElement={selectedElement}
            onSelectElement={(el) => onSelectElement?.(el)}
            onUpdateElementProps={(id, updated) => onUpdateElementProps?.(id, updated)}
            onDuplicateElement={onDuplicateElement}
            onDeleteElement={onDeleteElement}
            onRepairDecorations={onRepairDecorations}
          />
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

            {/* Sub-tab Navigation: 📸 Album cưới phát hành vs 📁 Thư viện ảnh đã tải */}
            <div className="flex p-1 bg-gray-100/90 rounded-2xl gap-1 border border-gray-200/60 shadow-2xs">
              <button
                type="button"
                onClick={() => setImageSubTab("album")}
                className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  imageSubTab === "album"
                    ? "bg-white text-rose-600 shadow-xs border border-gray-100"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Album phát hành ({effectiveAlbum.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setImageSubTab("uploads")}
                className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  imageSubTab === "uploads"
                    ? "bg-white text-rose-600 shadow-xs border border-gray-100"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Kho ảnh tải ({uploadedImages.length})</span>
              </button>
            </div>

            {/* Context Notice when an element is actively selected */}
            {selectedElement && selectedElement.type === "PhotoBox" && (() => {
              const isLockedPhoto = isElementLocked(selectedElement.id, nodes[selectedElement.id]);
              if (isLockedPhoto) {
                return (
                  <div className="px-2.5 py-2 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-[11px] text-amber-800 shadow-2xs">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Họa tiết của mẫu (Đang khóa)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onUpdateElementProps?.(selectedElement.id, { locked: false })}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold shadow-2xs transition-colors cursor-pointer"
                      title="Mở khóa họa tiết để thay bằng ảnh của bạn"
                    >
                      <Unlock className="w-2.5 h-2.5" /> Mở khóa
                    </button>
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
                <span className="text-[10px] text-gray-500 font-medium">Bấm ảnh để thêm vào album xoay</span>
              </div>
            )}

            {/* ================= SUB-TAB 1: ALBUM CƯỚI PHÁT HÀNH ================= */}
            {imageSubTab === "album" && (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-gradient-to-r from-rose-50/80 via-white to-amber-50/70 border border-rose-200/60 shadow-2xs text-left">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">
                          {effectiveAlbum.length} ảnh sẽ xuất hiện trong Album cưới khi phát hành
                        </h4>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          Ảnh số 1 (👑) là <strong>Ảnh bìa</strong> chính của thiệp. Khách mời sẽ xem toàn bộ các ảnh này trong album cưới trực tuyến.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {effectiveAlbum.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-xs bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 p-4">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-gray-600">Chưa có ảnh nào trong Album phát hành.</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Hãy bấm khung tải ảnh ở trên hoặc chọn ảnh từ Kho ảnh tải lên.
                    </p>
                    <button
                      type="button"
                      onClick={() => setImageSubTab("uploads")}
                      className="mt-3 px-3 py-1.5 bg-zen-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#d93849] transition-all cursor-pointer inline-flex items-center gap-1"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Xem Kho ảnh đã tải lên</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    {effectiveAlbum.map((src, idx) => {
                      const safeSrc = getSafeImageUrl(src);
                      const isCover = idx === 0;
                      const usageCount = countImageUsageInNodes(src, nodes);
                      const isCurrentlyUsing =
                        selectedElement?.type === "PhotoBox" &&
                        (selectedElement.props?.imgKey === src ||
                          selectedElement.props?.imgKey === safeSrc ||
                          selectedElement.props?.src === src ||
                          selectedElement.props?.src === safeSrc);

                      return (
                        <div
                          key={`${src}-${idx}`}
                          onClick={() => {
                            if (selectedElement && selectedElement.type === "PhotoBox" && onUpdateElementProps) {
                              const isLockedPhoto = isElementLocked(selectedElement.id, nodes[selectedElement.id]);
                              if (isLockedPhoto) {
                                alert("Họa tiết trang trí này đang bị khóa. Hãy bấm 'Mở khóa' ở phía trên để thay ảnh!");
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
                          className={`group relative aspect-[4/5] rounded-2xl overflow-hidden border cursor-pointer hover:shadow-md transition-all ${
                            isCover
                              ? "border-amber-400 ring-2 ring-amber-300/60 shadow-xs"
                              : isCurrentlyUsing
                              ? "border-[#e54153] ring-2 ring-rose-300"
                              : "border-gray-200 hover:border-[#e54153]"
                          }`}
                        >
                          <img
                            src={safeSrc}
                            alt={`Album ảnh cưới ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => handleImageFallback(e)}
                            loading="lazy"
                          />

                          {/* Top-left Index & Cover Badge */}
                          <div className="absolute top-1.5 left-1.5 z-10 pointer-events-none">
                            {isCover ? (
                              <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[9px] font-bold shadow-xs flex items-center gap-1">
                                <Crown className="w-3 h-3" />
                                <span>#1 Bìa</span>
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-bold backdrop-blur-xs">
                                #{idx + 1}
                              </span>
                            )}
                          </div>

                          {/* Top-right Actions: Set as Cover & Remove from album */}
                          <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            {!isCover && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetAsCover(src);
                                }}
                                className="w-6 h-6 rounded-md bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                                title="Đặt làm ảnh bìa chính (#1)"
                              >
                                <Crown className="w-3 h-3" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewLightboxUrl(safeSrc);
                              }}
                              className="w-6 h-6 rounded-md bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                              title="Xem ảnh lớn"
                            >
                              <Eye className="w-3 h-3" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFromAlbum(src);
                              }}
                              className="w-6 h-6 rounded-md bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                              title="Xóa khỏi album cưới (không xóa ảnh khỏi máy)"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Bottom-left Canvas Usage Badge */}
                          <div className="absolute bottom-1.5 left-1.5 z-10 pointer-events-none">
                            {usageCount > 0 ? (
                              <span className="px-1.5 py-0.5 rounded-md bg-emerald-600/90 text-white text-[9px] font-bold shadow-xs flex items-center gap-1 backdrop-blur-xs">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                                <span>Trên thiệp</span>
                              </span>
                            ) : null}
                          </div>

                          {/* Bottom-right Reorder Buttons: ⬅️ and ➡️ */}
                          <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveAlbumPhoto(idx, idx - 1);
                                }}
                                className="w-6 h-6 rounded-md bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                                title="Đưa ảnh lên trước"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            )}

                            {idx < effectiveAlbum.length - 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveAlbumPhoto(idx, idx + 1);
                                }}
                                className="w-6 h-6 rounded-md bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                                title="Đưa ảnh ra sau"
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          {/* Hover action label */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[11px] font-bold p-1 text-center pointer-events-none">
                            <span>
                              {selectedElement && selectedElement.type === "PhotoBox"
                                ? "Thay vào khung đang chọn"
                                : selectedElement && selectedElement.type === "CarouselBox"
                                ? "Thêm vào album xoay (+)"
                                : "Chèn vào thiệp (+)"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Switch to Uploads Helper */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-gray-500">
                    Kho ảnh tải lên có {uploadedImages.length} ảnh
                  </span>
                  <button
                    type="button"
                    onClick={() => setImageSubTab("uploads")}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Mở kho ảnh tải lên</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            )}

            {/* ================= SUB-TAB 2: KHO ẢNH ĐÃ TẢI LÊN ================= */}
            {imageSubTab === "uploads" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="flex flex-col gap-0.5 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-gray-800">
                        Thư viện đã tải lên ({uploadedImages.length})
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" /> Tự động lưu
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500 font-medium">
                      {uploadedImages.filter((s) => effectiveAlbum.some((p) => isSameImageUrl(p, s))).length} đã đưa vào Album •{" "}
                      {uploadedImages.filter((s) => !effectiveAlbum.some((p) => isSameImageUrl(p, s))).length} chưa có trong Album
                    </div>
                  </div>

                  {uploadedImages.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddAllUploadsToAlbum();
                        }}
                        className="text-[10px] text-zen-primary hover:underline font-bold cursor-pointer"
                        title="Đưa tất cả ảnh đã tải vào Album cưới phát hành"
                      >
                        + Đưa hết vào Album
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("Bạn có chắc chắn muốn xóa tất cả ảnh đã tải lên khỏi thư viện không?")) {
                            clearUploadedLibrary();
                          }
                        }}
                        className="text-[10px] text-gray-400 hover:text-rose-600 transition-colors font-medium cursor-pointer"
                        title="Xóa tất cả ảnh đã tải lên"
                      >
                        Xóa tất cả
                      </button>
                    </div>
                  )}
                </div>

                {uploadedImages.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-xs">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>Chưa có ảnh nào trong thư viện tải lên.</p>
                    <p className="text-[11px] text-gray-400 mt-1">Bấm khung bên trên để tải ảnh từ máy tính hoặc điện thoại.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {uploadedImages.map((src, idx) => {
                      const safeSrc = getSafeImageUrl(src);
                      const isInAlbum = effectiveAlbum.some((p) => isSameImageUrl(p, src));
                      const usageCount = countImageUsageInNodes(src, nodes);
                      const isCurrentlyUsing =
                        selectedElement?.type === "PhotoBox" &&
                        (selectedElement.props?.imgKey === src ||
                          selectedElement.props?.imgKey === safeSrc ||
                          selectedElement.props?.src === src ||
                          selectedElement.props?.src === safeSrc);

                      return (
                        <div
                          key={`${src}-${idx}`}
                          onClick={() => {
                            if (selectedElement && selectedElement.type === "PhotoBox" && onUpdateElementProps) {
                              const isLockedPhoto = isElementLocked(selectedElement.id, nodes[selectedElement.id]);
                              if (isLockedPhoto) {
                                alert("Họa tiết trang trí này đang bị khóa. Hãy bấm 'Mở khóa' ở phía trên để thay ảnh!");
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
                            isCurrentlyUsing
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
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(src);
                                setCopiedUrl(src);
                                setTimeout(() => setCopiedUrl(null), 2000);
                              }}
                              className="w-6 h-6 rounded-md bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                              title="Sao chép đường dẫn ảnh"
                            >
                              {copiedUrl === src ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewLightboxUrl(safeSrc);
                              }}
                              className="w-6 h-6 rounded-md bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                              title="Xem ảnh lớn"
                            >
                              <Eye className="w-3 h-3" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeUploadedImage(src);
                              }}
                              className="w-6 h-6 rounded-md bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                              title="Xóa ảnh khỏi thư viện"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          {/* In Album or Add to Album Badge / Button */}
                          <div className="absolute bottom-1.5 right-1.5 z-20">
                            {isInAlbum ? (
                              <span
                                className="px-1.5 py-0.5 rounded-md bg-rose-600 text-white text-[9px] font-bold shadow-xs flex items-center gap-0.5 backdrop-blur-xs"
                                title="Ảnh này đã có trong Album cưới phát hành"
                              >
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>Trong Album</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToAlbum(src);
                                }}
                                className="px-2 py-0.5 rounded-md bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 text-[9px] font-bold shadow-xs flex items-center gap-0.5 cursor-pointer transition-colors"
                                title="Đưa ảnh này vào Album cưới phát hành"
                              >
                                <Plus className="w-2.5 h-2.5" />
                                <span>Thêm vào Album</span>
                              </button>
                            )}
                          </div>

                          {/* Usage count badge */}
                          <div className="absolute bottom-1.5 left-1.5 z-10 pointer-events-none">
                            {usageCount > 0 ? (
                              <span
                                className="px-1.5 py-0.5 rounded-md bg-emerald-600/90 text-white text-[9px] font-bold shadow-xs flex items-center gap-1 backdrop-blur-xs"
                                title={`Ảnh này đang được dùng ${usageCount} lần trên thiệp`}
                              >
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                                <span>Dùng {usageCount} lần</span>
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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

        {/* ================= 4. TAB: THÀNH PHẦN ĐỒ HỌA (CANVA-STYLE ELEMENTS) ================= */}
        {activeTab === "stock" && (
          <div className="space-y-3.5 select-none">
            {/* Elements Category Navigation (4 nhóm chính: Khung ảnh, Họa tiết, Hình khối, Khoảng trống) */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-gray-100 rounded-xl text-[11px] font-bold">
              {[
                { id: "frames", label: "Khung ảnh", icon: "🖼️" },
                { id: "stickers", label: "Họa tiết", icon: "🌸" },
                { id: "shapes", label: "Hình khối", icon: "📐" },
                { id: "spacers", label: "Khoảng trống", icon: "↕️" },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setElementsSubTab(c.id as any)}
                  className={`py-1.5 px-1 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                    elementsSubTab === c.id
                      ? "bg-white text-gray-900 shadow-2xs font-extrabold"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <span className="text-xs">{c.icon}</span>
                  <span className="truncate">{c.label}</span>
                </button>
              ))}
            </div>

            {/* Hint tip for Drag and Drop */}
            <div className="px-2.5 py-1.5 rounded-lg bg-rose-50/70 border border-rose-100 text-[10px] text-rose-700 flex items-center justify-between">
              <span>💡 Mẹo: Bấm để chèn hoặc giữ chuột kéo thả trực tiếp lên thiệp!</span>
            </div>

            {/* ================= A. KHUNG ẢNH CƯỚI (FRAMES) ================= */}
            {elementsSubTab === "frames" && (
              <div className="space-y-2.5">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-0.5">
                  Lựa chọn khung hình ({WEDDING_FRAMES.length} mẫu):
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {WEDDING_FRAMES.map((frame) => (
                    <div
                      key={frame.id}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData(
                          "application/zenlove-element",
                          JSON.stringify({ type: "frame", frame, data: frame })
                        );
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                      onClick={() => {
                        if (onAddFrame) {
                          onAddFrame(frame);
                        } else {
                          onAddImage(frame.defaultImgKey);
                        }
                      }}
                      className="p-2 rounded-2xl border border-gray-200/90 hover:border-rose-400 bg-white cursor-pointer group shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between text-left"
                    >
                      <div className="aspect-[4/5] rounded-xl overflow-hidden mb-1.5 bg-stone-100 relative p-1.5 flex items-center justify-center">
                        <img
                          src={frame.defaultImgKey}
                          alt={frame.name}
                          style={{
                            borderRadius: Array.isArray(frame.borderRadius)
                              ? frame.borderRadius.map((r) => `${r * 0.25}px`).join(" ")
                              : `${(frame.borderRadius as number) * 0.25}px`,
                            border: `${frame.borderSize ? Math.min(3, frame.borderSize) : 1}px ${
                              frame.borderStyle || "solid"
                            } ${frame.borderColor || "#d4af37"}`,
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-black/60 text-white backdrop-blur-xs">
                          {frame.badge}
                        </span>
                      </div>

                      <div className="px-0.5">
                        <span className="text-[11px] font-bold text-gray-800 block truncate group-hover:text-rose-600 transition-colors">
                          {frame.previewIcon} {frame.name}
                        </span>
                        <span className="text-[9px] text-gray-400 font-mono mt-0.5 block">
                          {frame.defaultWidth} × {frame.defaultHeight}px
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================= B. HỌA TIẾT & STICKER ================= */}
            {elementsSubTab === "stickers" && (
              <div className="space-y-2.5">
                {/* Category chips filter */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                  {STICKER_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setStockCategory(cat.id)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 transition-all ${
                        stockCategory === cat.id
                          ? "bg-[#e54153] text-white shadow-2xs"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <span>{cat.icon}</span> <span>{cat.label}</span>
                    </button>
                  ))}
                </div>

                {/* Stickers Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {getStickersByCategory(stockCategory).map((stock) => (
                    <div
                      key={stock.id}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData(
                          "application/zenlove-element",
                          JSON.stringify({ type: "sticker", stockUrl: stock.url, name: stock.name, data: stock })
                        );
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                      onClick={() => {
                        if (onAddStock) {
                          onAddStock(stock.url, stock.name);
                        } else {
                          onAddImage(stock.url);
                        }
                      }}
                      className="p-1.5 rounded-2xl border border-gray-200 hover:border-[#e54153] bg-white cursor-pointer group shadow-2xs hover:shadow-xs transition-all text-center flex flex-col justify-between"
                    >
                      <div className="aspect-square rounded-xl overflow-hidden mb-1.5 bg-stone-50/80 flex items-center justify-center p-2 relative">
                        <img
                          src={stock.url}
                          alt={stock.name}
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                        />
                        {stock.badge && (
                          <span className="absolute top-1 right-1 text-[8px] font-bold px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            {stock.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-gray-700 block truncate px-1">
                        {stock.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================= C. HÌNH KHỐI & ĐƯỜNG KẺ (SHAPES & LINES) ================= */}
            {elementsSubTab === "shapes" && (
              <div className="space-y-3">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-0.5">
                  Hình khối trang trí & vạch kẻ:
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Shape 1: Rounded Card Panel */}
                  <div
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        "application/zenlove-element",
                        JSON.stringify({
                          type: "shape",
                          shapeType: "rectangle",
                          fill: "#ffffff",
                          width: 440,
                          height: 200,
                          borderRadius: 24,
                          borderSize: 1,
                          borderColor: "#e5e7eb",
                          opacity: 0.95,
                        })
                      );
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    onClick={() => {
                      onAddWidget?.("GeometricBox", {
                        width: 440,
                        height: 200,
                        backgroundColor: "#ffffff",
                        borderRadius: 24,
                        borderSize: 1,
                        borderColor: "#e5e7eb",
                        opacity: 0.95,
                      });
                    }}
                    className="p-3 rounded-2xl border border-gray-200 hover:border-rose-400 bg-white cursor-pointer group shadow-2xs text-center"
                  >
                    <div className="w-full h-14 rounded-xl bg-rose-50/60 border border-rose-200 mb-2 flex items-center justify-center text-rose-500 font-bold text-xs">
                      Thẻ Nền
                    </div>
                    <span className="text-xs font-bold text-gray-800 block">Thẻ Bo Góc 24px</span>
                    <span className="text-[10px] text-gray-400 font-mono">440 × 200px</span>
                  </div>

                  {/* Shape 2: Circle Badge */}
                  <div
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        "application/zenlove-element",
                        JSON.stringify({
                          type: "shape",
                          shapeType: "circle",
                          fill: "#780405",
                          width: 120,
                          height: 120,
                          borderRadius: 999,
                          opacity: 1,
                        })
                      );
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    onClick={() => {
                      onAddWidget?.("GeometricBox", {
                        width: 120,
                        height: 120,
                        backgroundColor: "#780405",
                        borderRadius: 999,
                        shapeType: "circle",
                        opacity: 1,
                      });
                    }}
                    className="p-3 rounded-2xl border border-gray-200 hover:border-rose-400 bg-white cursor-pointer group shadow-2xs text-center"
                  >
                    <div className="w-14 h-14 mx-auto rounded-full bg-[#780405] mb-2 flex items-center justify-center text-amber-200 font-bold text-xs shadow-xs">
                      Huy hiệu
                    </div>
                    <span className="text-xs font-bold text-gray-800 block">Khối Tròn Tròn</span>
                    <span className="text-[10px] text-gray-400 font-mono">120 × 120px</span>
                  </div>

                  {/* Shape 3: Gold Divider Line */}
                  <div
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        "application/zenlove-element",
                        JSON.stringify({
                          type: "shape",
                          shapeType: "line",
                          fill: "#d4af37",
                          width: 360,
                          height: 2,
                          borderColor: "#d4af37",
                        })
                      );
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    onClick={() => {
                      onAddWidget?.("LineBox", {
                        width: 360,
                        height: 2,
                        backgroundColor: "#d4af37",
                        borderColor: "#d4af37",
                        borderSize: 2,
                      });
                    }}
                    className="col-span-2 p-3 rounded-2xl border border-gray-200 hover:border-rose-400 bg-white cursor-pointer group shadow-2xs flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-gray-800 block">Vạch Ngăn Mạ Vàng</span>
                      <span className="text-[10px] text-gray-400 font-mono">360 × 2px</span>
                    </div>
                    <div className="w-36 h-0.5 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent rounded-full" />
                  </div>
                </div>
              </div>
            )}

            {/* ================= D. KHOẢNG TRỐNG BỐ CỤC (SPACERS) ================= */}
            {elementsSubTab === "spacers" && (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
                  <span className="font-bold">✨ Co dãn & Chèn khoảng trống:</span> Bấm chọn một mức khoảng trống bên dưới để tự động đẩy toàn bộ nội dung phía sau xuống dưới!
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { height: 40, label: "Nhỏ (+40px)", desc: "Giãn nhẹ giữa 2 dòng" },
                    { height: 80, label: "Vừa (+80px)", desc: "Khoảng cách chuẩn khối" },
                    { height: 120, label: "Lớn (+120px)", desc: "Phân tách rõ phân đoạn" },
                    { height: 200, label: "Trang (+200px)", desc: "Tạo trang màn hình mới" },
                  ].map((sp) => (
                    <button
                      key={sp.height}
                      type="button"
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData(
                          "application/zenlove-element",
                          JSON.stringify({ type: "spacer", height: sp.height, data: sp })
                        );
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                      onClick={() => onAddSpacer?.(sp.height)}
                      className="p-3 rounded-2xl border border-gray-200 hover:border-[#e54153] bg-white hover:bg-rose-50/20 text-left transition-all group shadow-2xs cursor-pointer flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-base font-bold text-gray-900 group-hover:text-rose-600">
                          ↕️ {sp.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500">{sp.desc}</p>
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-gray-600">Hoặc kéo thước dời trực tiếp trên Canvas:</span>
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                    ↕️ Thanh dời bố cục
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= 5. TAB: CÔNG CỤ & TIỆN ÍCH THIẾT KẾ ================= */}
        {activeTab === "tools" && (
          <div className="space-y-4">
            {/* Header giới thiệu chức năng */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50/60 to-rose-50/60 border border-purple-100 shadow-2xs">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Wrench className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-bold text-gray-900">Bộ công cụ Studio đồ họa</h4>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Tích hợp AI xử lý ảnh cưới, căn chỉnh vị trí thông minh, bảo vệ họa tiết mẫu và sao lưu thiết kế dự phòng.
              </p>
            </div>

            {/* 1. AI Background Removal */}
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-purple-50/50 to-pink-50/80 border border-indigo-100/60 shadow-2xs space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Wand2 className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">✨ AI Tách phông & Xử lý ảnh</h4>
                  <p className="text-[10px] text-gray-500">Tự động tách nền cô dâu chú rể hoặc chỉnh tay</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onRemoveBackground}
                  disabled={isRemovingBackground}
                  className="w-full py-2 px-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  title="Tự động nhận diện và xóa nền bảo vệ nhân vật"
                >
                  {isRemovingBackground ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Tự động AI</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onOpenManualCutout}
                  className="w-full py-2 px-2.5 rounded-xl bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  title="Chỉnh sửa cọ tẩy và khôi phục nhân vật thủ công"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Cọ tẩy thủ công</span>
                </button>
              </div>
              <p className="text-[10px] text-indigo-700/80 italic">
                * Mẹo: Nhấp chọn một khung ảnh trên thiệp để thực hiện tách nền ngay.
              </p>
            </div>

            {/* 2. Căn chỉnh & Thứ tự lớp thông minh */}
            <div className="p-3 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Căn chỉnh & Bố cục nhanh</h4>
                    <p className="text-[10px] text-gray-500">Căn lề, căn giữa và điều phối lớp</p>
                  </div>
                </div>
                {selectedElement && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                    {selectedElement.type === "TextBox"
                      ? "Văn bản"
                      : selectedElement.type === "PhotoBox"
                      ? "Ảnh cưới"
                      : selectedElement.type === "Widget"
                      ? "Khối mẫu"
                      : "Đối tượng"}
                  </span>
                )}
              </div>

              {selectedElement ? (
                <div className="space-y-2.5">
                  {/* Nhóm Căn lề khổ thiệp (Canvas 500px) */}
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                      Căn lề trên khổ thiệp (500px):
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => onUpdateElementProps?.(selectedElement.id, { x: 24 })}
                        className="py-1.5 px-2 rounded-lg bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-200 text-gray-700 hover:text-blue-700 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
                        title="Căn lề trái cách mép 24px"
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                        <span>Lề trái</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const w = Number(selectedElement.props?.width || 200);
                          const centerX = Math.max(0, Math.round((500 - w) / 2));
                          onUpdateElementProps?.(selectedElement.id, { x: centerX });
                        }}
                        className="py-1.5 px-2 rounded-lg bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-blue-700 text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                        title="Căn chính giữa chiều ngang thiệp"
                      >
                        <AlignCenter className="w-3.5 h-3.5 text-blue-600" />
                        <span>Căn giữa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const w = Number(selectedElement.props?.width || 200);
                          const rightX = Math.max(0, 500 - w - 24);
                          onUpdateElementProps?.(selectedElement.id, { x: rightX });
                        }}
                        className="py-1.5 px-2 rounded-lg bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-200 text-gray-700 hover:text-blue-700 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
                        title="Căn lề phải cách mép 24px"
                      >
                        <AlignRight className="w-3.5 h-3.5" />
                        <span>Lề phải</span>
                      </button>
                    </div>
                  </div>

                  {/* Nhóm Thứ tự lớp & Thao tác */}
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                      Thứ tự lớp & Thao tác:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const allZ = Object.values(nodes).map((n: any) => Number(n.props?.zIndex || 1));
                          const maxZ = allZ.length > 0 ? Math.max(...allZ) : 10;
                          onUpdateElementProps?.(selectedElement.id, { zIndex: maxZ + 1 });
                        }}
                        className="py-1.5 px-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5 text-gray-500" />
                        <span>Lên trên cùng</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const allZ = Object.values(nodes).map((n: any) => Number(n.props?.zIndex || 1));
                          const minZ = allZ.length > 0 ? Math.min(...allZ) : 1;
                          onUpdateElementProps?.(selectedElement.id, { zIndex: Math.max(1, minZ - 1) });
                        }}
                        className="py-1.5 px-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5 text-gray-500" />
                        <span>Xuống dưới cùng</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const isLocked = Boolean(selectedElement.props?.locked) || isElementLocked(selectedElement.id, selectedElement.props);
                          onUpdateElementProps?.(selectedElement.id, { locked: !isLocked });
                        }}
                        className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          Boolean(selectedElement.props?.locked) || isElementLocked(selectedElement.id, selectedElement.props)
                            ? "bg-amber-50 border-amber-300 text-amber-800"
                            : "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700"
                        }`}
                      >
                        {Boolean(selectedElement.props?.locked) || isElementLocked(selectedElement.id, selectedElement.props) ? (
                          <>
                            <Lock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Mở khóa đối tượng</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3.5 h-3.5 text-gray-500" />
                            <span>Khóa vị trí</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDuplicateElement?.(selectedElement.id)}
                        className="py-1.5 px-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5 text-gray-500" />
                        <span>Nhân bản</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-800 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                    <span>Chưa chọn phần tử để căn chỉnh</span>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Nhấp chọn một dòng chữ, ảnh cưới hoặc khung hình trên bảng thiết kế để sử dụng công cụ căn lề, căn giữa và điều phối lớp.
                  </p>
                </div>
              )}
            </div>

            {/* 3. Bảo vệ & Khôi phục họa tiết chuẩn của template */}
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-teal-50/50 border border-emerald-200/70 shadow-2xs space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-200" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Bảo vệ họa tiết mẫu độc quyền</h4>
                  <p className="text-[10px] text-gray-500">Khóa cố định hoa văn viền và khung trang trí</p>
                </div>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Tự động nhận diện hoa văn viền nghệ thuật và họa tiết độc quyền của mẫu để khóa vị trí cố định, tránh xê dịch ngoài ý muốn khi sửa văn bản.
              </p>
              <button
                type="button"
                onClick={onRepairDecorations}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-200" />
                <span>Khóa cố định & Khôi phục họa tiết chuẩn</span>
              </button>
            </div>

            {/* 4. Sao lưu & Xuất dữ liệu */}
            <div className="p-3 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-xs">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Sao lưu & Xuất bản thiết kế</h4>
                  <p className="text-[10px] text-gray-500">Lưu dự phòng và xuất ảnh độ phân giải cao</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onExportPng}
                  className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-gray-800 hover:text-rose-700 font-semibold text-xs shadow-2xs flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer text-center"
                >
                  <Download className="w-4 h-4 text-rose-500" />
                  <span>Xuất ảnh HD (PNG)</span>
                </button>
                <button
                  type="button"
                  onClick={onExportJson}
                  className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-200 text-gray-800 hover:text-blue-700 font-semibold text-xs shadow-2xs flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer text-center"
                >
                  <FileJson className="w-4 h-4 text-blue-500" />
                  <span>Tải file sao lưu (.json)</span>
                </button>
              </div>

              <div>
                <input
                  ref={jsonBackupInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleJsonFileChange}
                />
                <button
                  type="button"
                  onClick={() => jsonBackupInputRef.current?.click()}
                  className="w-full py-2 px-3 rounded-xl border border-dashed border-gray-300 hover:border-blue-400 bg-gray-50 hover:bg-blue-50/60 text-gray-700 hover:text-blue-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Phục hồi từ file sao lưu (.json)</span>
                </button>
              </div>
            </div>

            {/* 5. Tra cứu phím tắt thiết kế nhanh */}
            <div className="p-3 rounded-2xl bg-gray-50/80 border border-gray-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gray-800 text-white flex items-center justify-center shadow-xs">
                  <Keyboard className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Phím tắt thao tác nhanh</h4>
                  <p className="text-[10px] text-gray-500">Tăng tốc độ thiết kế như designer chuyên nghiệp</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                <div className="p-1.5 rounded-lg bg-white border border-gray-200 flex items-center justify-between">
                  <span className="text-gray-600">Hoàn tác:</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-gray-100 font-mono text-[10px] text-gray-800 border font-bold">
                    Ctrl + Z
                  </kbd>
                </div>
                <div className="p-1.5 rounded-lg bg-white border border-gray-200 flex items-center justify-between">
                  <span className="text-gray-600">Làm lại:</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-gray-100 font-mono text-[10px] text-gray-800 border font-bold">
                    Ctrl + Y
                  </kbd>
                </div>
                <div className="p-1.5 rounded-lg bg-white border border-gray-200 flex items-center justify-between">
                  <span className="text-gray-600">Nhân bản:</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-gray-100 font-mono text-[10px] text-gray-800 border font-bold">
                    Ctrl + D
                  </kbd>
                </div>
                <div className="p-1.5 rounded-lg bg-white border border-gray-200 flex items-center justify-between">
                  <span className="text-gray-600">Xóa đối tượng:</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-gray-100 font-mono text-[10px] text-gray-800 border font-bold">
                    Del / Backspace
                  </kbd>
                </div>
                <div className="p-1.5 rounded-lg bg-white border border-gray-200 flex items-center justify-between col-span-2">
                  <span className="text-gray-600">Dịch chuyển từng pixel:</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-gray-100 font-mono text-[10px] text-gray-800 border font-bold">
                      Phím mũi tên
                    </kbd>
                    <span className="text-gray-400 text-[10px]">(+Shift = 10px)</span>
                  </div>
                </div>
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

        {/* ================= 7. TAB: KHỐI MẪU THEO CHỦ ĐỀ (UNIFIED ALL-IN-ONE) ================= */}
        {activeTab === "widgets" && (() => {
          const currentThemeDef = THEME_CATEGORIES.find((c) => c.id === selectedThemeCategory) || THEME_CATEGORIES[0];
          const modulesForTheme = getModulesForTheme(selectedThemeCategory);
          const activeCount = modulesForTheme.filter((m) => m.isActive(card, nodes || {})).length;

          const filteredModules = modulesForTheme.filter((mod) => {
            if (widgetsSearchQuery) {
              const q = widgetsSearchQuery.toLowerCase().trim();
              const matchName = mod.displayName.toLowerCase().includes(q) || mod.name.toLowerCase().includes(q);
              const matchCat = mod.categoryLabel.toLowerCase().includes(q);
              const matchSummary = mod.getSummary(card, nodes || {}, selectedThemeCategory).toLowerCase().includes(q);
              const matchStyles = mod.styles.some(
                (s) => s.name.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q))
              );
              return matchName || matchCat || matchSummary || matchStyles;
            }
            return true;
          });

          return (
            <div className="space-y-3.5 select-none animate-fadeIn">
              {/* Segmented Switcher: Kho Khối Mẫu Thủ Công vs Quản Lý Bật/Tắt */}
              <div className="flex items-center p-1 bg-gray-100 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setWidgetsSubTab("library");
                    try { weddingSounds.playSoftClick(); } catch {}
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    widgetsSubTab === "library"
                      ? "bg-white text-rose-600 shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-rose-500" />
                  <span>Kho Khối Mẫu Thủ Công</span>
                  <span className="text-[9px] bg-rose-50 text-rose-700 px-1.5 py-0.2 rounded-full border border-rose-200/60 font-semibold">
                    Mới
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWidgetsSubTab("manage");
                    try { weddingSounds.playSoftClick(); } catch {}
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    widgetsSubTab === "manage"
                      ? "bg-white text-rose-600 shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-rose-500" />
                  <span>Bật/Tắt Khối</span>
                  <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded-full font-semibold">
                    {activeCount}/{modulesForTheme.length}
                  </span>
                </button>
              </div>

              {widgetsSubTab === "library" ? (
                <div className="pt-1">
                  <ModulePresetsFolderBrowser
                    onAddModulePreset={(preset) => {
                      if (onAddModulePreset) {
                        onAddModulePreset(preset);
                      }
                    }}
                    onOpenSettings={() => setWidgetsSubTab("manage")}
                  />
                </div>
              ) : (
                <>
                  {/* 1. Header Banner & Bộ Điều Khiển Chung */}
              <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-50 via-white to-amber-50/70 border border-rose-200/80 shadow-2xs text-left">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#e54153] to-[#ff5b70] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 flex-wrap">
                        <span>Khối Mẫu: {currentThemeDef.label}</span>
                      </h4>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Bấm vào khối để tùy chỉnh chi tiết ở cột phải
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-rose-600 border border-rose-200/60 shadow-2xs shrink-0">
                    {activeCount}/{modulesForTheme.length} Bật
                  </span>
                </div>

                {/* Nút bật/tắt toàn bộ nhanh */}
                <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-rose-100">
                  <button
                    type="button"
                    onClick={() => handleSetAllFixedModules(true)}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-white hover:bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 shadow-2xs transition-all cursor-pointer text-center"
                  >
                    ✓ Bật tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAllFixedModules(false)}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-white hover:bg-gray-100 text-gray-600 text-[10px] font-bold border border-gray-200 shadow-2xs transition-all cursor-pointer text-center"
                  >
                    ✕ Tắt tất cả
                  </button>
                </div>
              </div>

              {/* 2. Thanh tìm kiếm & Menu chuyển 8 Thể loại chủ đề */}
              <div className="space-y-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm nhanh khối mẫu: Mừng cưới, Bản đồ, Lịch, RSVP..."
                    value={widgetsSearchQuery}
                    onChange={(e) => setWidgetsSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-7 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#e54153] bg-white placeholder-gray-400 shadow-2xs"
                  />
                  {widgetsSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setWidgetsSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Dải 8 Thể loại Chủ đề: Mời cưới, Sinh nhật, Sự kiện, Hội nghị, Tốt nghiệp, Chính trị, Học tập, Đồ họa khác */}
                {!widgetsSearchQuery && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider px-1">
                      <span>Chọn chủ đề khối:</span>
                      <span className="text-rose-600 font-bold lowercase">
                        {currentThemeDef.label} ({modulesForTheme.length} khối)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar pt-0.5">
                      {THEME_CATEGORIES.map((theme) => {
                        const isSelected = selectedThemeCategory === theme.id;
                        return (
                          <button
                            key={theme.id}
                            type="button"
                            onClick={() => {
                              setSelectedThemeCategory(theme.id);
                              try {
                                weddingSounds.playSoftClick();
                              } catch {}
                            }}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 flex items-center gap-1.5 border ${
                              isSelected
                                ? "bg-rose-600 text-white border-rose-600 shadow-2xs scale-[1.02]"
                                : "bg-gray-50 text-gray-700 border-gray-200/80 hover:bg-gray-100 hover:border-gray-300"
                            }`}
                            title={theme.description}
                          >
                            <span className="text-sm leading-none">{theme.icon}</span>
                            <span>{theme.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. DANH SÁCH CÁC KHỐI MẪU THEO CHỦ ĐỀ - BẤM TRỰC TIẾP ĐỂ TÙY CHỈNH & CÔNG TẮC CHUẨN */}
              <div className="space-y-2.5">
                {filteredModules.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-500 bg-gray-50/50 rounded-2xl border border-gray-200">
                    Không tìm thấy khối mẫu nào trong chủ đề "{currentThemeDef.label}".
                  </div>
                ) : (
                  filteredModules.map((mod) => {
                    const isActive = mod.isActive(card, nodes || {});
                    const summary = mod.getSummary(card, nodes || {}, selectedThemeCategory);
                    const ModIcon = mod.Icon;

                    return (
                      <div
                        key={mod.id}
                        onClick={() => handleCustomizeUnifiedModule(mod)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer select-none group relative ${
                          isActive
                            ? "bg-white border-rose-200 shadow-2xs hover:border-rose-400 hover:shadow-xs"
                            : "bg-gray-50/70 border-gray-200 opacity-75 hover:opacity-100 hover:border-gray-300 hover:bg-white"
                        }`}
                        title="Bấm vào khối để mở tùy chỉnh kiểu dáng & nội dung ở cột phải"
                      >
                        <div className="flex items-center justify-between gap-3">
                          {/* Bên trái: Icon + Tiêu đề đầy đủ + Trạng thái & Tóm tắt */}
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                isActive ? mod.iconBgClass : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              <ModIcon className="w-4.5 h-4.5" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h5 className="text-xs font-bold text-gray-900 group-hover:text-rose-600 transition-colors truncate">
                                  {mod.displayName}
                                </h5>
                                <span
                                  className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold shrink-0 ${
                                    isActive
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : "bg-gray-100 text-gray-500"
                                  }`}
                                >
                                  {isActive ? "Bật" : "Tắt"}
                                </span>
                              </div>
                              <p className="text-[10.5px] text-gray-500 truncate mt-0.5 leading-tight">
                                {summary}
                              </p>
                            </div>
                          </div>

                          {/* Bên phải: Công tắc Switch bật/tắt đúng chuẩn iOS/Tailwind */}
                          <div className="shrink-0 flex items-center gap-1.5 pl-1">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isActive}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleUnifiedModule(mod, !isActive);
                              }}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                isActive ? "bg-emerald-500" : "bg-gray-300 hover:bg-gray-400"
                              }`}
                              title={isActive ? "Bấm công tắc để tắt khối này" : "Bấm công tắc để bật khối này"}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                  isActive ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
                </>
              )}
            </div>
          );
        })()}

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

            {isLoadingTemplate && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-center gap-2 animate-pulse">
                <div className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin shrink-0" />
                <span className="font-semibold text-[11px]">Đang nạp mẫu thiết kế mới...</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto pr-0.5">
              {ZENLOVE_TEMPLATES.filter((t) =>
                t.name.toLowerCase().includes(searchTemplate.toLowerCase())
              ).map((t) => {
                const isCurrentTemplate =
                  currentTemplateId === t.id ||
                  currentTemplateId === t.slug ||
                  (Boolean(t.slug) && currentTemplateId?.includes(t.slug));

                return (
                  <div
                    key={t.id}
                    onClick={() => onSelectTemplate(t)}
                    className={`group cursor-pointer rounded-xl p-1.5 bg-white text-center transition-all relative ${
                      isCurrentTemplate
                        ? "border-2 border-[#e54153] ring-2 ring-rose-200 shadow-md bg-rose-50/20"
                        : "border border-gray-200 hover:border-[#e54153] hover:shadow-sm"
                    }`}
                  >
                    <div className="aspect-[1000/1470] overflow-hidden rounded-lg bg-gray-100 mb-1 relative">
                      <img
                        src={t.imageUrl}
                        alt={t.name}
                        className="w-full h-auto object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                      {isCurrentTemplate && (
                        <div className="absolute top-1.5 right-1.5 bg-[#e54153] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs flex items-center gap-0.5">
                          <span>✓ Đang mở</span>
                        </div>
                      )}
                    </div>
                    <p
                      className={`text-[11px] font-bold truncate ${
                        isCurrentTemplate ? "text-[#e54153]" : "text-gray-900"
                      }`}
                    >
                      {t.name}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= 9. TAB: HIỆU ỨNG (14 HIỆU ỨNG & CẤU HÌNH LIVE) ================= */}
        {activeTab === "effects" && (
          <EffectConfigPanel
            currentConfig={currentEffectConfig}
            currentEffectType={(card?.ambientEffect as any) || currentEffectConfig?.type || "petals"}
            onChangeConfig={(newConf) => {
              onChangeEffectConfig?.(newConf);
            }}
            onToggleEffect={onToggleEffect}
            envelopeTheme={card?.envelopeTheme}
            cinematicFx={card?.cinematicFx}
            onChangeEnvelopeTheme={onChangeEnvelopeTheme}
            onChangeCinematicFx={onChangeCinematicFx}
            onPreviewEnvelope={onPreviewEnvelope}
          />
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

    {/* Lightbox Preview Modal for Album & Uploaded Photos */}
    {previewLightboxUrl && (
      <div
        className="fixed inset-0 z-[9999999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        onClick={() => setPreviewLightboxUrl(null)}
      >
        <div className="relative max-w-lg max-h-[90vh] p-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setPreviewLightboxUrl(null)}
            className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-gray-900 flex items-center justify-center shadow-xl hover:bg-gray-100 font-bold transition-all z-20 cursor-pointer"
            title="Đóng xem ảnh lớn"
          >
            ✕
          </button>
          <img
            src={previewLightboxUrl}
            alt="Ảnh cưới phóng to"
            className="max-h-[82vh] max-w-full rounded-2xl object-contain shadow-2xl border-2 border-white/20 select-none animate-scale-up"
          />
        </div>
      </div>
    )}
  </>
  );
}
