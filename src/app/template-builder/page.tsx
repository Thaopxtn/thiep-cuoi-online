"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Download,
  Upload,
  Copy,
  Check,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Sparkles,
  Layers,
  Sliders,
  FileText,
  Smartphone,
  Tablet,
  Monitor,
  RotateCcw,
  Palette,
  Music,
  Calendar,
  MapPin,
  Heart,
  Gift,
  ExternalLink,
  FolderHeart,
  Info,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Image as ImageIcon,
  CloudOff,
  CheckCircle2,
  AlertTriangle,
  Search,
} from "lucide-react";
import { TemplateItem, TEMPLATES_DATA } from "@/data/templatesData";
import { TemplateModule, ModuleType } from "@/components/modules/types";
import {
  AVAILABLE_MODULES,
  TEMPLATE_PRESETS,
  SAMPLE_PHOTOS,
  createModuleInstance,
} from "@/lib/availableModules";
import { ZENLOVE_TEMPLATES, ZenLoveTemplate } from "@/data/zenloveTemplates";
import { convertZenLoveToTemplateItem } from "@/data/zenlovePresets";
import { generateDefaultModules } from "@/data/templates";
import {
  saveCustomTemplate,
  getStoredTemplateById,
  slugify,
  exportTemplateAsJson,
  copyTemplateToClipboard,
  getCustomTemplates,
  saveDraft,
  loadDraft,
  clearDraft,
  getStorageUsage,
  checkStorageQuota,
  hydrateStorage,
} from "@/lib/templateStorage";
import ModuleRenderer from "@/components/modules/ModuleRenderer";
import ExportTemplateModal from "@/components/templates/ExportTemplateModal";
import ImportTemplateModal from "@/components/templates/ImportTemplateModal";

function TemplateBuilderInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId =
    searchParams.get("id") ||
    searchParams.get("template") ||
    searchParams.get("slug") ||
    searchParams.get("clone");

  // Tự động chuyển hướng sang Studio Thiết kế Canvas hiện đại (/design-template/[id])
  useEffect(() => {
    const target = editId || "8c5055d8-30db-4b38-8831-e11063e3d352";
    router.replace(`/design-template/${target}`);
  }, [editId, router]);

  // Template State
  const [template, setTemplate] = useState<TemplateItem>(() => {
    // Default starter template
    const preset = TEMPLATE_PRESETS[0];
    const defaultData = { ...TEMPLATES_DATA[0].defaultData };
    return {
      id: "custom-tpl-starter",
      title: "Mẫu Thiệp Cưới Hoàng Gia Mới",
      slug: "thiep-cuoi-hoang-gia-moi",
      category: "wedding",
      categoryName: "Thiệp cưới",
      image: "https://content.pancake.vn/1/s1200x650/fwebp90/c4/93/41/6c/26a2152470d62cafcfd166ba886705656a2bf74f8d13a1c10a49934a-w:2560-h:1706-l:246335-t:image/jpeg.jpg",
      scrollPercent: "75%",
      scrollDuration: "8.5s",
      tag: "MỚI",
      likes: 1,
      views: 1,
      description: "Mẫu thiệp sang trọng được tạo bởi ZenLove Template Studio",
      type: "wedding",
      modules: preset.moduleTypes.map((t, idx) => ({
        ...createModuleInstance(t, defaultData),
        id: `mod-init-${t}-${idx}`,
      })),
      defaultData,
    };
  });

  // Selected Module for Right Panel Inspection
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(() => {
    return template.modules && template.modules.length > 0 ? template.modules[0].id : null;
  });

  // Navigation Tabs & Viewport
  const [leftTab, setLeftTab] = useState<"structure" | "catalog" | "cloned" | "presets">("structure");
  const [clonedSearch, setClonedSearch] = useState<string>("");
  const [previewMode, setPreviewMode] = useState<"modules" | "live_clone">("modules");
  const [rightTab, setRightTab] = useState<"props" | "eventData" | "metadata">("props");
  const [viewportMode, setViewportMode] = useState<"mobile" | "tablet" | "desktop">("mobile");
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [showOpeningIntro, setShowOpeningIntro] = useState(false);
  const [catalogFilter, setCatalogFilter] = useState<string>("all");

  // Modals
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Auto-save & Dirty State
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving" | "error">("saved");
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirtyRef = useRef(false);
  const lastSavedJsonRef = useRef<string>("");

  // Mark template as dirty whenever it changes
  const markDirty = useCallback(() => {
    isDirtyRef.current = true;
    setSaveStatus("unsaved");
  }, []);

  // Auto-save draft with debounce (2.5s after last change)
  useEffect(() => {
    if (!isDirtyRef.current) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      try {
        const newJson = JSON.stringify(template);
        if (newJson !== lastSavedJsonRef.current) {
          setSaveStatus("saving");
          saveDraft(template);
          lastSavedJsonRef.current = newJson;
          setSaveStatus("saved");
          isDirtyRef.current = false;

          // Check storage quota after auto-save
          const quota = checkStorageQuota();
          if (quota.message) {
            setStorageWarning(quota.message);
          } else {
            setStorageWarning(null);
          }
        }
      } catch {
        setSaveStatus("error");
      }
    }, 2500);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [template]);

  // Mark dirty on template changes (after initial load)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      lastSavedJsonRef.current = JSON.stringify(template);
      return;
    }
    markDirty();
  }, [template, markDirty]);


  // Pending draft for non-blocking notification
  const [pendingDraft, setPendingDraft] = useState<TemplateItem | null>(null);

  // Load draft on mount (if no editId)
  useEffect(() => {
    if (!editId) {
      const draft = loadDraft();
      if (draft && draft.title) {
        setPendingDraft(draft);
      }
    }
  }, [editId]);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load existing template if editId/template query is provided
  useEffect(() => {
    if (editId) {
      hydrateStorage().then(() => {
        // 1. Kiểm tra trong custom templates đã lưu trong máy
        const found = getStoredTemplateById(editId);
        if (found) {
          setTemplate(found);
          setSelectedModuleId(found.modules?.[0]?.id || null);
          return;
        }

        // 2. Kiểm tra trong danh sách 20 mẫu ZenLove clone
        const zenFound = ZENLOVE_TEMPLATES.find(
          (z) => z.id === editId || z.slug === editId
        );
        if (zenFound) {
          const converted = convertZenLoveToTemplateItem(zenFound);
          const modules = generateDefaultModules(converted);
          setTemplate({
            ...converted,
            modules,
          });
          setSelectedModuleId(modules[0]?.id || null);
          showToast(`Đã nạp mẫu clone "${zenFound.name}" từ ZenLove! ✨`);
          return;
        }

        // 3. Kiểm tra nếu là thiệp khách hàng hoặc mẫu clone trong cache
        fetch(`/api/zenlove-template/${editId}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((resJson) => {
            if (resJson?.success && resJson.data) {
              const cardData = resJson.data;
              const convertedZen: ZenLoveTemplate = {
                id: cardData.id || editId,
                name: cardData.name || `Thiệp Khách Hàng ${editId}`,
                slug: cardData.slugShow || cardData.slug || editId,
                description: "Mẫu thiệp khách hàng",
                categoryId: "custom",
                categoryName: "Khách hàng",
                categorySlug: "khach-hang",
                imageUrl: cardData.thumbnail || "",
                templateType: "custom",
                targetPageType: "CANVAS",
                likeCount: 0,
                viewCount: 0,
                usageCount: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                musicName: cardData.audioSettings?.musicTitle || "Bản nhạc cưới",
                musicUrl: cardData.audioSettings?.fileUrl || "",
              };
              const converted = convertZenLoveToTemplateItem(convertedZen);
              const modules = generateDefaultModules(converted);
              setTemplate({
                ...converted,
                modules,
              });
              setSelectedModuleId(modules[0]?.id || null);
              showToast(`Đã nạp thiệp khách hàng "${convertedZen.name}" vào Studio! ✨`);
            }
          })
          .catch((e) => console.warn("Lỗi nạp thiệp khách hàng vào studio:", e));
      });
    }
  }, [editId]);

  // Danh sách các mẫu ZenLove clone được lọc theo từ khóa tìm kiếm
  const filteredClonedTemplates = useMemo(() => {
    if (!clonedSearch.trim()) return ZENLOVE_TEMPLATES;
    const q = clonedSearch.toLowerCase().trim();
    return ZENLOVE_TEMPLATES.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.slug && t.slug.toLowerCase().includes(q))
    );
  }, [clonedSearch]);

  // Áp dụng mẫu ZenLove clone vào Studio
  const handleApplyClonedTemplate = (zen: ZenLoveTemplate) => {
    const converted = convertZenLoveToTemplateItem(zen);
    const modules = generateDefaultModules(converted);
    const newTpl: TemplateItem = {
      ...converted,
      id: `custom-from-${zen.slug || zen.id}-${Date.now().toString(36)}`,
      title: `${zen.name} (Tùy biến)`,
      slug: `${zen.slug || zen.id}-custom`,
      modules,
    };
    setTemplate(newTpl);
    setSelectedModuleId(modules[0]?.id || null);
    setLeftTab("structure");
    showToast(`Đã nạp mẫu clone "${zen.name}" vào Studio! 🎨`);
  };

  // Selected module reference
  const selectedModule = useMemo(() => {
    return template.modules?.find((m) => m.id === selectedModuleId) || null;
  }, [template.modules, selectedModuleId]);

  // Đồng bộ thời gian thực dữ liệu mẫu vào toàn bộ module liên quan
  const handleUpdateDefaultData = (field: string, value: any) => {
    setTemplate((prev) => {
      const updatedData = { ...prev.defaultData, [field]: value };
      const updatedModules = prev.modules?.map((m) => {
        const nextProps = { ...m.props };
        if (field === "eventTitle") {
          if ("title" in nextProps) nextProps.title = value;
          if ("eventTitle" in nextProps) nextProps.eventTitle = value;
        }
        if (field === "person1") {
          if ("person1" in nextProps) nextProps.person1 = value;
          if ("groomName" in nextProps) nextProps.groomName = value;
        }
        if (field === "person2") {
          if ("person2" in nextProps) nextProps.person2 = value;
          if ("brideName" in nextProps) nextProps.brideName = value;
        }
        if (field === "date") {
          if ("date" in nextProps) nextProps.date = value;
        }
        if (field === "time") {
          if ("time" in nextProps) nextProps.time = value;
        }
        if (field === "venue") {
          if ("venue" in nextProps) nextProps.venue = value;
          if ("event1Venue" in nextProps) nextProps.event1Venue = value;
        }
        if (field === "address") {
          if ("address" in nextProps) nextProps.address = value;
        }
        if (field === "quote") {
          if ("quote" in nextProps) nextProps.quote = value;
        }
        if (field === "mainPhoto") {
          if ("heroPhoto" in nextProps) nextProps.heroPhoto = value;
          if ("mainPhoto" in nextProps) nextProps.mainPhoto = value;
        }
        return { ...m, props: nextProps };
      });
      return { ...prev, defaultData: updatedData, modules: updatedModules };
    });
  };

  // Synchronize bank info
  const handleUpdateBankInfo = (field: string, value: string) => {
    setTemplate((prev) => {
      const updatedBank = { ...prev.defaultData.bankInfo, [field]: value };
      const updatedModules = prev.modules?.map((m) => {
        if (m.type === "gift-bank") {
          return {
            ...m,
            props: {
              ...m.props,
              [field]: value,
            },
          };
        }
        return m;
      });
      return {
        ...prev,
        defaultData: { ...prev.defaultData, bankInfo: updatedBank },
        modules: updatedModules,
      };
    });
  };

  // Module actions
  const handleToggleModule = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTemplate((prev) => ({
      ...prev,
      modules: prev.modules?.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)),
    }));
  };

  const handleMoveModule = (index: number, direction: "up" | "down", e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!template.modules) return;
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= template.modules.length) return;

    const list = [...template.modules];
    const item = list.splice(index, 1)[0];
    list.splice(targetIdx, 0, item);
    setTemplate((prev) => ({ ...prev, modules: list }));
  };

  const handleDeleteModule = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!template.modules) return;
    const filtered = template.modules.filter((m) => m.id !== id);
    setTemplate((prev) => ({ ...prev, modules: filtered }));
    if (selectedModuleId === id) {
      setSelectedModuleId(filtered.length > 0 ? filtered[0].id : null);
    }
  };

  const handleDuplicateModule = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!template.modules) return;
    const original = template.modules.find((m) => m.id === id);
    if (!original) return;

    const cloned: TemplateModule = {
      ...JSON.parse(JSON.stringify(original)),
      id: `mod-${original.type}-${Date.now().toString(36)}`,
      name: `${original.name} (Bản sao)`,
    };

    const idx = template.modules.findIndex((m) => m.id === id);
    const list = [...template.modules];
    list.splice(idx + 1, 0, cloned);
    setTemplate((prev) => ({ ...prev, modules: list }));
    setSelectedModuleId(cloned.id);
    showToast(`Đã nhân bản "${original.name}"`);
  };

  const handleAddModuleFromCatalog = (type: ModuleType) => {
    const newMod = createModuleInstance(type, template.defaultData);
    setTemplate((prev) => ({
      ...prev,
      modules: [...(prev.modules || []), newMod],
    }));
    setSelectedModuleId(newMod.id);
    setLeftTab("structure");
    setRightTab("props");
    showToast(`Đã thêm module "${newMod.name}" vào mẫu! ✨`);
  };

  // Update props of selected module
  const handleUpdateSelectedModuleProp = (propKey: string, value: any) => {
    if (!selectedModuleId || !template.modules) return;

    setTemplate((prev) => ({
      ...prev,
      modules: prev.modules?.map((m) => {
        if (m.id !== selectedModuleId) return m;
        return {
          ...m,
          props: {
            ...m.props,
            [propKey]: value,
          },
        };
      }),
    }));
  };

  // Apply Blueprint Preset
  const handleApplyPreset = (presetId: string) => {
    const p = TEMPLATE_PRESETS.find((x) => x.id === presetId);
    if (!p) return;

    setTemplate((prev) => ({
      ...prev,
      title: p.name,
      slug: slugify(p.name),
      category: p.category as any,
      categoryName: p.categoryName,
      description: p.description,
      image: p.image,
      modules: p.moduleTypes.map((t) => createModuleInstance(t, prev.defaultData)),
    }));

    showToast(`Đã áp dụng mẫu thiết kế "${p.name}"! 🎨`);
  };

  // Save to Storage
  const handleSaveToStore = () => {
    if (!template.title.trim()) {
      showToast("Vui lòng đặt tên cho mẫu template! ⚠️");
      return;
    }

    const finalTpl: TemplateItem = {
      ...template,
      slug: template.slug || slugify(template.title),
    };

    const res = saveCustomTemplate(finalTpl);
    if (res.success) {
      isDirtyRef.current = false;
      lastSavedJsonRef.current = JSON.stringify(finalTpl);
      setSaveStatus("saved");
      clearDraft(); // Clear auto-save draft after successful manual save
      showToast("Đã lưu Template vào Kho thành công! 💾");
    } else {
      setSaveStatus("error");
      showToast(`Lỗi khi lưu: ${res.error} ❌`);
    }
  };

  // Save & Open in Invitation Editor
  const handleSaveAndOpenLive = () => {
    handleSaveToStore();
    router.push(`/design-template/${template.id}`);
  };

  // Copy JSON
  const handleCopyJson = async () => {
    const success = await copyTemplateToClipboard(template);
    if (success) {
      showToast("Đã sao chép cấu hình JSON vào bộ nhớ tạm! 📋");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-stone-900 text-gray-100 overflow-hidden font-sans select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-[99999] bg-stone-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 border border-stone-700 animate-slide-in text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= TOP STUDIO APP BAR ================= */}
      <header className="h-14 bg-stone-950 border-b border-stone-800 px-4 flex items-center justify-between shrink-0 z-30">
        {/* Left: Back & Template Title */}
        <div className="flex items-center gap-3">
          <Link
            href="/kho-template"
            className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-gray-300 transition-colors"
            title="Trở về Kho Template"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <input
              type="text"
              value={template.title}
              onChange={(e) => setTemplate({ ...template, title: e.target.value })}
              className="bg-transparent hover:bg-stone-800/80 focus:bg-stone-800 text-sm font-bold text-white px-2 py-1 rounded-lg border border-transparent hover:border-stone-700 focus:border-zen-primary focus:outline-none transition-colors max-w-[200px] sm:max-w-xs truncate"
              title="Nhấn để đổi tên mẫu"
            />
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
              {template.categoryName}
            </span>
          </div>
        </div>

        {/* Center: Viewport Mode & Canvas Controls */}
        <div className="hidden md:flex items-center gap-1 bg-stone-900 p-1 rounded-xl border border-stone-800">
          <button
            onClick={() => setViewportMode("mobile")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              viewportMode === "mobile"
                ? "bg-stone-800 text-white shadow-xs"
                : "text-stone-400 hover:text-white"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile (375px)</span>
          </button>
          <button
            onClick={() => setViewportMode("tablet")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              viewportMode === "tablet"
                ? "bg-stone-800 text-white shadow-xs"
                : "text-stone-400 hover:text-white"
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Tablet</span>
          </button>
          <button
            onClick={() => setViewportMode("desktop")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              viewportMode === "desktop"
                ? "bg-stone-800 text-white shadow-xs"
                : "text-stone-400 hover:text-white"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>

          {/* Zoom controls */}
          <div className="h-4 w-px bg-stone-700 mx-1" />
          <button
            onClick={() => setZoomScale((prev) => Math.max(0.6, prev - 0.1))}
            className="w-6 h-6 rounded flex items-center justify-center text-stone-400 hover:text-white"
            title="Thu nhỏ"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="text-[11px] font-mono text-stone-400 w-9 text-center">
            {Math.round(zoomScale * 100)}%
          </span>
          <button
            onClick={() => setZoomScale((prev) => Math.min(1.4, prev + 0.1))}
            className="w-6 h-6 rounded flex items-center justify-center text-stone-400 hover:text-white"
            title="Phóng to"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Auto-save Status Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 text-[11px]">
            {saveStatus === "saved" && (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Đã lưu nháp</span>
              </>
            )}
            {saveStatus === "unsaved" && (
              <>
                <CloudOff className="w-3 h-3 text-amber-400" />
                <span className="text-amber-400 font-medium">Chưa lưu...</span>
              </>
            )}
            {saveStatus === "saving" && (
              <>
                <span className="w-3 h-3 rounded-full border-2 border-stone-500 border-t-white animate-spin" />
                <span className="text-stone-400 font-medium">Đang lưu...</span>
              </>
            )}
            {saveStatus === "error" && (
              <>
                <AlertTriangle className="w-3 h-3 text-red-400" />
                <span className="text-red-400 font-medium">Lỗi lưu!</span>
              </>
            )}
          </div>

          {/* Storage Warning */}
          {storageWarning && (
            <div className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-950/50 border border-amber-700/40 text-[10px] text-amber-300 max-w-[200px] truncate" title={storageWarning}>
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">Bộ nhớ gần đầy</span>
            </div>
          )}

          {/* Live Preview Tab */}
          <Link
            href={`/show/${template.slug?.replace(/-custom$/, "") || template.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-stone-700"
            title="Mở thiệp xem thực tế trên tab mới"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">Xem Thiệp Live</span>
          </Link>

          {/* Canvas Editor Jump */}
          <Link
            href={`/design-template/${template.slug?.replace(/-custom$/, "") || template.id}`}
            className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-stone-700"
            title="Chuyển sang Canvas Editor chỉnh sửa tự do từng layer (Craft.js)"
          >
            <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Canvas Editor</span>
          </Link>

          {/* Import JSON */}
          <button
            onClick={() => setIsImportOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-stone-700"
            title="Nhập cấu hình JSON"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nhập JSON</span>
          </button>

          {/* Export JSON */}
          <button
            onClick={() => setIsExportOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-stone-700"
            title="Xuất cấu hình JSON"
          >
            <Download className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Xuất JSON</span>
          </button>

          {/* Save to Kho */}
          <button
            onClick={handleSaveToStore}
            className="px-4 py-1.5 rounded-xl bg-zen-primary hover:bg-red-600 text-white text-xs font-bold shadow-md shadow-zen-primary/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Lưu Template</span>
          </button>
        </div>
      </header>

      {/* Non-blocking Draft Recovery Banner */}
      {pendingDraft && (
        <div className="bg-amber-950/90 border-b border-amber-600/40 text-amber-200 px-4 py-2 text-xs flex items-center justify-between z-30 shrink-0 animate-slide-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              Phát hiện bản nháp chưa lưu gần nhất: <strong className="text-white">&quot;{pendingDraft.title}&quot;</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => {
                setTemplate(pendingDraft);
                setSelectedModuleId(pendingDraft.modules?.[0]?.id || null);
                setPendingDraft(null);
                showToast("Đã khôi phục bản nháp! ✨");
              }}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              Khôi phục bản nháp
            </button>
            <button
              onClick={() => {
                clearDraft();
                setPendingDraft(null);
              }}
              className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs transition-colors"
            >
              Bỏ qua
            </button>
          </div>
        </div>
      )}

      {/* ================= THREE-PANEL STUDIO LAYOUT ================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* ================= LEFT PANEL: Structure, Catalog & Presets ================= */}
        <aside className="w-80 sm:w-88 bg-stone-950 border-r border-stone-800 flex flex-col shrink-0 z-20">
          {/* Tab Navigation */}
          <div className="flex border-b border-stone-800 p-1.5 gap-1 bg-stone-900/60">
            <button
              onClick={() => setLeftTab("structure")}
              className={`flex-1 py-1.5 px-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                leftTab === "structure"
                  ? "bg-stone-800 text-white shadow-xs"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Cấu trúc ({template.modules?.length || 0})</span>
            </button>
            <button
              onClick={() => setLeftTab("catalog")}
              className={`flex-1 py-1.5 px-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                leftTab === "catalog"
                  ? "bg-stone-800 text-white shadow-xs"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              <Plus className="w-3 h-3 text-zen-primary" />
              <span>Thêm</span>
            </button>
            <button
              onClick={() => setLeftTab("cloned")}
              className={`flex-1 py-1.5 px-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                leftTab === "cloned"
                  ? "bg-rose-950/80 text-rose-300 border border-rose-500/30 shadow-xs"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3 h-3 text-rose-400" />
              <span>Clone ({ZENLOVE_TEMPLATES.length})</span>
            </button>
            <button
              onClick={() => setLeftTab("presets")}
              className={`flex-1 py-1.5 px-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                leftTab === "presets"
                  ? "bg-stone-800 text-white shadow-xs"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              <FolderHeart className="w-3 h-3 text-amber-400" />
              <span>Khung sẵn</span>
            </button>
          </div>

          {/* Left Panel Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {/* TAB 1: MODULE TREE / STRUCTURE */}
            {leftTab === "structure" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1 text-xs text-stone-400">
                  <span>Thứ tự xuất hiện trên thiệp</span>
                  <button
                    onClick={() => setLeftTab("catalog")}
                    className="text-zen-primary font-bold hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Thêm mới
                  </button>
                </div>

                {template.modules && template.modules.length > 0 ? (
                  template.modules.map((mod, index) => {
                    const isSelected = mod.id === selectedModuleId;

                    return (
                      <div
                        key={mod.id}
                        onClick={() => {
                          setSelectedModuleId(mod.id);
                          setRightTab("props");
                        }}
                        className={`group p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? "bg-rose-950/40 border-zen-primary shadow-xs ring-1 ring-zen-primary/40 text-white"
                            : mod.enabled
                            ? "bg-stone-900 border-stone-800 hover:border-stone-700 text-stone-300"
                            : "bg-stone-900/40 border-stone-800/60 text-stone-500 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-5 h-5 rounded-md bg-stone-800 text-[10px] font-mono font-bold flex items-center justify-center text-stone-400 flex-shrink-0">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold truncate">{mod.name}</h4>
                            <span className="text-[10px] font-mono text-stone-500 block truncate">
                              {mod.type}
                            </span>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Reorder Buttons */}
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={(e) => handleMoveModule(index, "up", e)}
                            className="w-6 h-6 rounded bg-stone-800 hover:bg-stone-700 disabled:opacity-20 text-stone-400 flex items-center justify-center transition-colors"
                            title="Di chuyển lên"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === (template.modules?.length || 1) - 1}
                            onClick={(e) => handleMoveModule(index, "down", e)}
                            className="w-6 h-6 rounded bg-stone-800 hover:bg-stone-700 disabled:opacity-20 text-stone-400 flex items-center justify-center transition-colors"
                            title="Di chuyển xuống"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Active */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleModule(mod.id, e)}
                            className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                              mod.enabled
                                ? "text-emerald-400 hover:bg-emerald-950/40"
                                : "text-stone-600 hover:bg-stone-800"
                            }`}
                            title={mod.enabled ? "Đang bật (Nhấn để ẩn)" : "Đang ẩn (Nhấn để bật)"}
                          >
                            {mod.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>

                          {/* Duplicate */}
                          <button
                            type="button"
                            onClick={(e) => handleDuplicateModule(mod.id, e)}
                            className="w-6 h-6 rounded hover:bg-stone-800 text-stone-400 flex items-center justify-center transition-colors"
                            title="Nhân bản module này"
                          >
                            <Copy className="w-3 h-3" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteModule(mod.id, e)}
                            className="w-6 h-6 rounded hover:bg-rose-950 text-rose-400 flex items-center justify-center transition-colors"
                            title="Xóa module này"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 text-stone-500 text-xs">
                    Chưa có module nào. Hãy chuyển sang tab &quot;Thêm Module&quot; để thêm!
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MODULE CATALOG */}
            {leftTab === "catalog" && (
              <div className="space-y-3">
                {/* Category Pills */}
                <div className="flex gap-1 overflow-x-auto pb-1 text-[11px]">
                  {[
                    { id: "all", label: "Tất cả" },
                    { id: "hero", label: "Bì thư (Hero)" },
                    { id: "info", label: "Thông tin & Lịch" },
                    { id: "gallery", label: "Album ảnh" },
                    { id: "interactive", label: "Tương tác" },
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCatalogFilter(c.id)}
                      className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition-all ${
                        catalogFilter === c.id
                          ? "bg-zen-primary text-white"
                          : "bg-stone-800 text-stone-400 hover:text-white"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                {/* Available Modules List */}
                <div className="space-y-2">
                  {AVAILABLE_MODULES.filter(
                    (m) => catalogFilter === "all" || m.category === catalogFilter
                  ).map((mod) => (
                    <div
                      key={mod.type}
                      onClick={() => handleAddModuleFromCatalog(mod.type)}
                      className="p-3 rounded-xl border border-stone-800 bg-stone-900 hover:border-zen-primary/60 hover:bg-stone-850 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-stone-200 group-hover:text-zen-primary transition-colors">
                            {mod.name}
                          </h4>
                          {mod.badge && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                              {mod.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-400 line-clamp-2 mt-0.5">
                          {mod.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="w-7 h-7 rounded-lg bg-stone-800 group-hover:bg-zen-primary text-white flex items-center justify-center transition-colors flex-shrink-0"
                        title="Thêm vào mẫu"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: ZENLOVE CLONED TEMPLATES */}
            {leftTab === "cloned" && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-500 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm mẫu clone ZenLove..."
                    value={clonedSearch}
                    onChange={(e) => setClonedSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-stone-900 border border-stone-800 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-zen-primary"
                  />
                </div>

                <p className="text-[11px] text-stone-400">
                  {filteredClonedTemplates.length} mẫu thiệp cưới clone thực tế từ ZenLove. Chọn mẫu để nạp cấu trúc vào Studio:
                </p>

                <div className="space-y-2.5">
                  {filteredClonedTemplates.map((zen) => (
                    <div
                      key={zen.id}
                      className="p-2.5 rounded-xl border border-stone-800 bg-stone-900 hover:border-zen-primary/50 transition-all flex flex-col gap-2 group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-12 h-16 rounded-lg overflow-hidden bg-rose-50 flex-shrink-0 border border-stone-700">
                          <img
                            src={zen.imageUrl}
                            alt={zen.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-white group-hover:text-zen-primary transition-colors truncate">
                              {zen.name}
                            </h4>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 flex-shrink-0">
                              {zen.templateType === "hot" ? "HOT" : "FREE"}
                            </span>
                          </div>
                          <p className="text-[10px] font-mono text-stone-400 truncate mt-0.5">
                            slug: {zen.slug}
                          </p>
                          <p className="text-[10px] text-stone-500 truncate mt-0.5">
                            {zen.description || "Mẫu thiệp cưới online đẹp chuẩn ZenLove"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pt-1 border-t border-stone-800">
                        <button
                          type="button"
                          onClick={() => handleApplyClonedTemplate(zen)}
                          className="flex-1 py-1.5 rounded-lg bg-zen-primary hover:bg-red-600 text-white text-[11px] font-bold transition-colors flex items-center justify-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Nạp vào Studio</span>
                        </button>
                        <Link
                          href={`/design-template/${zen.slug || zen.id}`}
                          className="py-1.5 px-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                          title="Mở trong Canvas Editor"
                        >
                          <Maximize2 className="w-3 h-3 text-amber-400" />
                          <span>Canvas</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: PRESET BLUEPRINTS */}
            {leftTab === "presets" && (
              <div className="space-y-3">
                <p className="text-xs text-stone-400">
                  Khởi tạo nhanh template bằng các bộ khung mẫu thiết kế hoàn chỉnh:
                </p>

                <div className="space-y-2.5">
                  {TEMPLATE_PRESETS.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleApplyPreset(p.id)}
                      className="p-3 rounded-xl border border-stone-800 bg-stone-900 hover:border-amber-500/60 hover:bg-stone-850 cursor-pointer transition-all flex flex-col gap-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-800 text-stone-300">
                          {p.categoryName}
                        </span>
                        <span className="text-[10px] font-mono text-stone-500">
                          {p.moduleTypes.length} modules
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                        {p.name}
                      </h4>
                      <p className="text-[11px] text-stone-400 line-clamp-2">
                        {p.description}
                      </p>
                      <button
                        type="button"
                        className="w-full py-1.5 rounded-lg bg-stone-800 group-hover:bg-amber-600 text-white text-[11px] font-bold transition-colors text-center"
                      >
                        Áp dụng bộ khung này
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ================= CENTER CANVAS: Realtime Live Mockup ================= */}
        <main className="flex-1 bg-stone-900 flex flex-col items-center justify-center p-4 overflow-hidden relative">
          {/* Canvas Sub-bar */}
          <div className="absolute top-3 inset-x-0 flex items-center justify-between px-6 z-10 pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-2">
              <div className="flex items-center gap-2 bg-stone-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-stone-800 text-xs">
                <span className="text-stone-400">Góc nhìn:</span>
                <span className="font-bold text-white capitalize">{viewportMode}</span>
              </div>

              {/* Mode Switcher */}
              <div className="flex items-center gap-1 bg-stone-950/90 backdrop-blur-md p-1 rounded-full border border-stone-800 text-xs shadow-lg">
                <button
                  type="button"
                  onClick={() => setPreviewMode("modules")}
                  className={`px-3 py-1 rounded-full font-semibold transition-all flex items-center gap-1.5 ${
                    previewMode === "modules"
                      ? "bg-stone-800 text-white shadow-xs"
                      : "text-stone-400 hover:text-white"
                  }`}
                  title="Xem giao diện theo từng Module kéo thả"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Giao diện Modules ({template.modules?.filter((m) => m.enabled).length || 0})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("live_clone")}
                  className={`px-3 py-1 rounded-full font-semibold transition-all flex items-center gap-1.5 ${
                    previewMode === "live_clone"
                      ? "bg-zen-primary text-white shadow-md shadow-zen-primary/30"
                      : "text-stone-400 hover:text-white"
                  }`}
                  title="Xem thiệp cưới thực tế với phong bì, nhạc nền và tương tác"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Thiệp Thực Tế (ZenLove)</span>
                </button>
              </div>
            </div>

            <div className="pointer-events-auto flex items-center gap-2">
              {previewMode === "modules" && (
                <button
                  type="button"
                  onClick={() => setShowOpeningIntro(!showOpeningIntro)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border transition-all flex items-center gap-1.5 ${
                    showOpeningIntro
                      ? "bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/30"
                      : "bg-stone-950/80 text-stone-300 border-stone-800 hover:text-white"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Hiệu ứng mở bì thư: {showOpeningIntro ? "BẬT" : "TẮT"}</span>
                </button>
              )}

              <Link
                href={`/design-template/${template.slug?.replace(/-custom$/, "") || template.id}`}
                className="px-3 py-1.5 rounded-full bg-stone-950/80 hover:bg-stone-950 text-stone-300 hover:text-white border border-stone-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Mở trong Canvas Editor để kéo thả từng layer TextBox, ảnh, sticker"
              >
                <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Canvas Editor</span>
              </Link>

              <Link
                href={`/show/${template.slug?.replace(/-custom$/, "") || template.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-full bg-stone-950/80 hover:bg-stone-950 text-stone-300 hover:text-white border border-stone-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Mở thiệp trong tab mới"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                <span>Xem Tab Mới</span>
              </Link>
            </div>
          </div>

          {/* Centered Device Viewport Frame */}
          <div
            className="transition-all duration-300 flex items-center justify-center max-h-full"
            style={{
              transform: `scale(${zoomScale})`,
              transformOrigin: "center center",
            }}
          >
            {viewportMode === "mobile" ? (
              /* Realistic Smartphone Mockup */
              <div className="relative w-[375px] h-[660px] bg-black rounded-[44px] p-2.5 shadow-[0_25px_70px_rgba(0,0,0,0.7)] border-[4px] border-stone-800 flex flex-col overflow-hidden">
                {/* Dynamic Island / Notch */}
                <div className="absolute top-4 inset-x-0 z-30 flex justify-center pointer-events-none">
                  <div className="w-24 h-4 bg-black rounded-full" />
                </div>

                {/* Viewport Screen */}
                <div className="relative w-full h-full rounded-[34px] overflow-hidden bg-white">
                  {previewMode === "live_clone" ? (
                    <iframe
                      src={`/show/${template.slug?.replace(/-custom$/, "") || template.id}`}
                      title="Xem thiệp thực tế ZenLove"
                      className="w-full h-full border-0 bg-white"
                    />
                  ) : (
                    <ModuleRenderer
                      modules={template.modules?.filter((m) => m.enabled) || []}
                      bankInfo={template.defaultData.bankInfo}
                      musicUrl={template.defaultData.musicUrl}
                      musicTitle={template.defaultData.musicTitle}
                      initialWishes={template.defaultData.initialWishes}
                      interactive={true}
                      showOpeningIntro={showOpeningIntro}
                    />
                  )}
                </div>
              </div>
            ) : viewportMode === "tablet" ? (
              /* Tablet Mockup */
              <div className="relative w-[600px] h-[680px] bg-black rounded-[36px] p-3 shadow-2xl border-[4px] border-stone-800 flex flex-col overflow-hidden">
                <div className="relative w-full h-full rounded-[26px] overflow-hidden bg-white">
                  {previewMode === "live_clone" ? (
                    <iframe
                      src={`/show/${template.slug?.replace(/-custom$/, "") || template.id}`}
                      title="Xem thiệp thực tế ZenLove"
                      className="w-full h-full border-0 bg-white"
                    />
                  ) : (
                    <ModuleRenderer
                      modules={template.modules?.filter((m) => m.enabled) || []}
                      bankInfo={template.defaultData.bankInfo}
                      musicUrl={template.defaultData.musicUrl}
                      musicTitle={template.defaultData.musicTitle}
                      initialWishes={template.defaultData.initialWishes}
                      interactive={true}
                      showOpeningIntro={showOpeningIntro}
                    />
                  )}
                </div>
              </div>
            ) : (
              /* Desktop Mockup */
              <div className="relative w-[850px] h-[680px] bg-stone-800 rounded-2xl p-2 shadow-2xl border border-stone-700 flex flex-col overflow-hidden">
                <div className="relative w-full h-full rounded-xl overflow-hidden bg-white">
                  {previewMode === "live_clone" ? (
                    <iframe
                      src={`/show/${template.slug?.replace(/-custom$/, "") || template.id}`}
                      title="Xem thiệp thực tế ZenLove"
                      className="w-full h-full border-0 bg-white"
                    />
                  ) : (
                    <ModuleRenderer
                      modules={template.modules?.filter((m) => m.enabled) || []}
                      bankInfo={template.defaultData.bankInfo}
                      musicUrl={template.defaultData.musicUrl}
                      musicTitle={template.defaultData.musicTitle}
                      initialWishes={template.defaultData.initialWishes}
                      interactive={true}
                      showOpeningIntro={showOpeningIntro}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* ================= RIGHT PANEL: Deep Props Inspector & Settings ================= */}
        <aside className="w-80 sm:w-96 bg-stone-950 border-l border-stone-800 flex flex-col shrink-0 z-20">
          {/* Sub-tab Navigation */}
          <div className="flex border-b border-stone-800 p-1.5 gap-1 bg-stone-900/60">
            <button
              onClick={() => setRightTab("props")}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                rightTab === "props"
                  ? "bg-stone-800 text-white shadow-xs"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-rose-400" />
              <span>Thuộc tính</span>
            </button>
            <button
              onClick={() => setRightTab("eventData")}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                rightTab === "eventData"
                  ? "bg-stone-800 text-white shadow-xs"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Dữ liệu mẫu</span>
            </button>
            <button
              onClick={() => setRightTab("metadata")}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                rightTab === "metadata"
                  ? "bg-stone-800 text-white shadow-xs"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>Cài đặt mẫu</span>
            </button>
          </div>

          {/* Right Panel Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* TAB 1: MODULE PROPS INSPECTOR */}
            {rightTab === "props" && (
              <div className="space-y-4">
                {selectedModule ? (
                  <div>
                    {/* Header of selected module */}
                    <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between mb-4">
                      <div>
                        <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider block">
                          Đang tùy biến Module
                        </span>
                        <h3 className="font-bold text-sm text-white">{selectedModule.name}</h3>
                        <span className="text-[10px] font-mono text-stone-500">
                          ID: {selectedModule.id}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-800 text-stone-300">
                        {selectedModule.type}
                      </span>
                    </div>

                    {/* Dynamic Context Fields based on module type */}
                    <div className="space-y-3.5">
                      {/* Name input */}
                      <div>
                        <label className="block text-stone-400 font-semibold mb-1">
                          Tên hiển thị nội bộ
                        </label>
                        <input
                          type="text"
                          value={selectedModule.name}
                          onChange={(e) => {
                            const newName = e.target.value;
                            setTemplate((prev) => ({
                              ...prev,
                              modules: prev.modules?.map((m) =>
                                m.id === selectedModule.id ? { ...m, name: newName } : m
                              ),
                            }));
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                        />
                      </div>

                      {/* HERO MODULE FIELDS */}
                      {selectedModule.type.startsWith("hero-") && (
                        <>
                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              Tiêu đề thiệp (Event Title)
                            </label>
                            <input
                              type="text"
                              value={selectedModule.props?.title || selectedModule.props?.eventTitle || ""}
                              onChange={(e) => {
                                handleUpdateSelectedModuleProp("title", e.target.value);
                                handleUpdateSelectedModuleProp("eventTitle", e.target.value);
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-stone-400 font-semibold mb-1">
                                Chú rể / Người 1
                              </label>
                              <input
                                type="text"
                                value={selectedModule.props?.person1 || ""}
                                onChange={(e) =>
                                  handleUpdateSelectedModuleProp("person1", e.target.value)
                                }
                                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-stone-400 font-semibold mb-1">
                                Cô dâu / Người 2
                              </label>
                              <input
                                type="text"
                                value={selectedModule.props?.person2 || ""}
                                onChange={(e) =>
                                  handleUpdateSelectedModuleProp("person2", e.target.value)
                                }
                                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              Ngày tổ chức
                            </label>
                            <input
                              type="text"
                              value={selectedModule.props?.date || ""}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("date", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                            />
                          </div>

                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              URL Ảnh đại diện chính (Hero Photo)
                            </label>
                            <input
                              type="text"
                              value={
                                selectedModule.props?.heroPhoto ||
                                selectedModule.props?.mainPhoto ||
                                ""
                              }
                              onChange={(e) => {
                                handleUpdateSelectedModuleProp("heroPhoto", e.target.value);
                                handleUpdateSelectedModuleProp("mainPhoto", e.target.value);
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary text-[11px]"
                            />
                          </div>
                        </>
                      )}

                      {/* PARENTS FAMILY INVITATION FIELDS */}
                      {selectedModule.type === "parents-family-invitation" && (
                        <>
                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              Tiêu đề mở đầu
                            </label>
                            <input
                              type="text"
                              value={selectedModule.props?.introTitle || ""}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("introTitle", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-stone-400 font-semibold mb-1">
                                Tên Chú rể
                              </label>
                              <input
                                type="text"
                                value={selectedModule.props?.groomName || ""}
                                onChange={(e) =>
                                  handleUpdateSelectedModuleProp("groomName", e.target.value)
                                }
                                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-stone-400 font-semibold mb-1">
                                Tên Cô dâu
                              </label>
                              <input
                                type="text"
                                value={selectedModule.props?.brideName || ""}
                                onChange={(e) =>
                                  handleUpdateSelectedModuleProp("brideName", e.target.value)
                                }
                                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-stone-400 font-semibold mb-1">
                                Save The Date Ngày
                              </label>
                              <input
                                type="text"
                                value={selectedModule.props?.saveDateDay || ""}
                                onChange={(e) =>
                                  handleUpdateSelectedModuleProp("saveDateDay", e.target.value)
                                }
                                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-stone-400 font-semibold mb-1">
                                Save The Date Tháng
                              </label>
                              <input
                                type="text"
                                value={selectedModule.props?.saveDateMonth || ""}
                                onChange={(e) =>
                                  handleUpdateSelectedModuleProp("saveDateMonth", e.target.value)
                                }
                                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {/* VENUE MAP FIELDS */}
                      {selectedModule.type === "venue-map" && (
                        <>
                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              Tiêu đề khối
                            </label>
                            <input
                              type="text"
                              value={selectedModule.props?.title || ""}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("title", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              Tên địa điểm / Sảnh tiệc
                            </label>
                            <input
                              type="text"
                              value={selectedModule.props?.venue || ""}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("venue", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              Địa chỉ cụ thể
                            </label>
                            <input
                              type="text"
                              value={selectedModule.props?.address || ""}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("address", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              Link Google Maps
                            </label>
                            <input
                              type="text"
                              value={selectedModule.props?.mapUrl || ""}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("mapUrl", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary text-[11px]"
                            />
                          </div>
                        </>
                      )}

                      {/* STORY QUOTE FIELDS */}
                      {selectedModule.type === "story-quote" && (
                        <>
                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              Tiêu đề lớn
                            </label>
                            <input
                              type="text"
                              value={selectedModule.props?.heading || ""}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("heading", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              Tiêu đề phụ
                            </label>
                            <input
                              type="text"
                              value={selectedModule.props?.subheading || ""}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("subheading", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              Trích dẫn / Lời ngỏ
                            </label>
                            <textarea
                              rows={3}
                              value={selectedModule.props?.quote || ""}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("quote", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                            />
                          </div>
                        </>
                      )}

                      {/* GIFT BANK FIELDS */}
                      {selectedModule.type === "gift-bank" && (
                        <>
                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              Tên ngân hàng
                            </label>
                            <input
                              type="text"
                              value={selectedModule.props?.bankName || ""}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("bankName", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              Số tài khoản
                            </label>
                            <input
                              type="text"
                              value={selectedModule.props?.accountNumber || ""}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("accountNumber", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              Chủ tài khoản
                            </label>
                            <input
                              type="text"
                              value={selectedModule.props?.accountHolder || ""}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("accountHolder", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                            />
                          </div>
                        </>
                      )}

                      {/* RSVP FIELDS */}
                      {(selectedModule.type === "rsvp" || selectedModule.type === "red-velvet-rsvp") && (
                        <>
                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              Tiêu đề RSVP
                            </label>
                            <input
                              type="text"
                              value={selectedModule.props?.title || ""}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("title", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              Mô tả hướng dẫn
                            </label>
                            <textarea
                              rows={2}
                              value={selectedModule.props?.subtitle || ""}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("subtitle", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                            />
                          </div>
                        </>
                      )}

                      {/* WEDDING SCHEDULE CARDS FIELDS */}
                      {selectedModule.type === "wedding-schedule-cards" && (
                        <>
                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              Tên sự kiện 1
                            </label>
                            <input
                              type="text"
                              value={selectedModule.props?.event1Title || ""}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("event1Title", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-stone-400 font-semibold mb-1">
                                Giờ sự kiện 1
                              </label>
                              <input
                                type="text"
                                value={selectedModule.props?.event1Time || ""}
                                onChange={(e) =>
                                  handleUpdateSelectedModuleProp("event1Time", e.target.value)
                                }
                                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-stone-400 font-semibold mb-1">
                                Ngày sự kiện 1
                              </label>
                              <input
                                type="text"
                                value={selectedModule.props?.event1Date || ""}
                                onChange={(e) =>
                                  handleUpdateSelectedModuleProp("event1Date", e.target.value)
                                }
                                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              Ngày âm lịch sự kiện 1
                            </label>
                            <input
                              type="text"
                              value={selectedModule.props?.event1Lunar || ""}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("event1Lunar", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              Địa điểm sự kiện 1
                            </label>
                            <input
                              type="text"
                              value={selectedModule.props?.event1Venue || ""}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("event1Venue", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                            />
                          </div>

                          <div className="pt-2 border-t border-stone-800">
                            <label className="block text-stone-400 font-semibold mb-1">
                              Tên sự kiện 2
                            </label>
                            <input
                              type="text"
                              value={selectedModule.props?.event2Title || ""}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("event2Title", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-stone-400 font-semibold mb-1">
                                Giờ sự kiện 2
                              </label>
                              <input
                                type="text"
                                value={selectedModule.props?.event2Time || ""}
                                onChange={(e) =>
                                  handleUpdateSelectedModuleProp("event2Time", e.target.value)
                                }
                                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-stone-400 font-semibold mb-1">
                                Ngày sự kiện 2
                              </label>
                              <input
                                type="text"
                                value={selectedModule.props?.event2Date || ""}
                                onChange={(e) =>
                                  handleUpdateSelectedModuleProp("event2Date", e.target.value)
                                }
                                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              Ngày âm lịch sự kiện 2
                            </label>
                            <input
                              type="text"
                              value={selectedModule.props?.event2Lunar || ""}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("event2Lunar", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              Địa điểm sự kiện 2
                            </label>
                            <input
                              type="text"
                              value={selectedModule.props?.event2Venue || ""}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("event2Venue", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                            />
                          </div>
                        </>
                      )}

                      {/* CALENDAR MODULE FIELDS */}
                      {selectedModule.type === "calendar" && (
                        <>
                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              Tiêu đề lịch
                            </label>
                            <input
                              type="text"
                              value={selectedModule.props?.title || ""}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("title", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              Ngày tổ chức (DD.MM.YYYY)
                            </label>
                            <input
                              type="text"
                              value={selectedModule.props?.date || ""}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("date", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                              placeholder="VD: 29.03.2026"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              Phong cách (Theme)
                            </label>
                            <select
                              value={selectedModule.props?.theme || "wedding"}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("theme", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                            >
                              <option value="wedding">Cưới hỏi</option>
                              <option value="graduation">Tốt nghiệp</option>
                              <option value="birthday">Sinh nhật</option>
                              <option value="event">Sự kiện</option>
                            </select>
                          </div>
                        </>
                      )}

                      {/* INVITATION LETTER FIELDS */}
                      {selectedModule.type === "invitation-letter" && (
                        <>
                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              Huy hiệu (Badge)
                            </label>
                            <input
                              type="text"
                              value={selectedModule.props?.badge || ""}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("badge", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              Lời chào mở đầu (Salutation)
                            </label>
                            <input
                              type="text"
                              value={selectedModule.props?.salutation || ""}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("salutation", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              Nội dung thư mời
                            </label>
                            <textarea
                              rows={3}
                              value={selectedModule.props?.body || ""}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("body", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              Chữ ký
                            </label>
                            <input
                              type="text"
                              value={selectedModule.props?.signature || ""}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("signature", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                            />
                          </div>
                        </>
                      )}

                      {/* PHOTO GALLERY GRID FIELDS */}
                      {selectedModule.type === "photo-gallery-grid" && (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-stone-400 font-semibold mb-1">
                                Tên Chú rể
                              </label>
                              <input
                                type="text"
                                value={selectedModule.props?.groomName || ""}
                                onChange={(e) =>
                                  handleUpdateSelectedModuleProp("groomName", e.target.value)
                                }
                                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-stone-400 font-semibold mb-1">
                                Tên Cô dâu
                              </label>
                              <input
                                type="text"
                                value={selectedModule.props?.brideName || ""}
                                onChange={(e) =>
                                  handleUpdateSelectedModuleProp("brideName", e.target.value)
                                }
                                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              Ngày cưới
                            </label>
                            <input
                              type="text"
                              value={selectedModule.props?.date || ""}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("date", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              Lời kết thúc album
                            </label>
                            <input
                              type="text"
                              value={selectedModule.props?.closingTitle || ""}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("closingTitle", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                            />
                          </div>
                        </>
                      )}

                      {/* POLAROID TAPE FIELDS */}
                      {selectedModule.type === "polaroid-tape" && (
                        <>
                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              URL Ảnh Polaroid
                            </label>
                            <input
                              type="text"
                              value={selectedModule.props?.photo || ""}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("photo", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary text-[11px]"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              Caption (chú thích ảnh)
                            </label>
                            <input
                              type="text"
                              value={selectedModule.props?.caption || ""}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("caption", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              Dòng phụ (subtext)
                            </label>
                            <input
                              type="text"
                              value={selectedModule.props?.subtext || ""}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("subtext", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                            />
                          </div>
                        </>
                      )}

                      {/* RED ENVELOPE GIFT CARD (2 TÀI KHOẢN) FIELDS */}
                      {selectedModule.type === "red-envelope-gift-card" && (
                        <>
                          <div className="space-y-2">
                            <h4 className="font-bold text-rose-400 text-[11px] uppercase tracking-wider">
                              Tài khoản Nhà Trai
                            </h4>
                            <div>
                              <label className="block text-stone-400 font-semibold mb-1">
                                Ngân hàng
                              </label>
                              <input
                                type="text"
                                value={selectedModule.props?.groomBank?.bankName || ""}
                                onChange={(e) =>
                                  handleUpdateSelectedModuleProp("groomBank", {
                                    ...selectedModule.props?.groomBank,
                                    bankName: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-stone-400 font-semibold mb-1">
                                Số tài khoản
                              </label>
                              <input
                                type="text"
                                value={selectedModule.props?.groomBank?.accountNumber || ""}
                                onChange={(e) =>
                                  handleUpdateSelectedModuleProp("groomBank", {
                                    ...selectedModule.props?.groomBank,
                                    accountNumber: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-stone-400 font-semibold mb-1">
                                Chủ tài khoản
                              </label>
                              <input
                                type="text"
                                value={selectedModule.props?.groomBank?.accountHolder || ""}
                                onChange={(e) =>
                                  handleUpdateSelectedModuleProp("groomBank", {
                                    ...selectedModule.props?.groomBank,
                                    accountHolder: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                              />
                            </div>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-stone-800">
                            <h4 className="font-bold text-amber-400 text-[11px] uppercase tracking-wider">
                              Tài khoản Nhà Gái
                            </h4>
                            <div>
                              <label className="block text-stone-400 font-semibold mb-1">
                                Ngân hàng
                              </label>
                              <input
                                type="text"
                                value={selectedModule.props?.brideBank?.bankName || ""}
                                onChange={(e) =>
                                  handleUpdateSelectedModuleProp("brideBank", {
                                    ...selectedModule.props?.brideBank,
                                    bankName: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-stone-400 font-semibold mb-1">
                                Số tài khoản
                              </label>
                              <input
                                type="text"
                                value={selectedModule.props?.brideBank?.accountNumber || ""}
                                onChange={(e) =>
                                  handleUpdateSelectedModuleProp("brideBank", {
                                    ...selectedModule.props?.brideBank,
                                    accountNumber: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-stone-400 font-semibold mb-1">
                                Chủ tài khoản
                              </label>
                              <input
                                type="text"
                                value={selectedModule.props?.brideBank?.accountHolder || ""}
                                onChange={(e) =>
                                  handleUpdateSelectedModuleProp("brideBank", {
                                    ...selectedModule.props?.brideBank,
                                    accountHolder: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {/* WISHES STREAM FIELDS */}
                      {selectedModule.type === "wishes-stream" && (
                        <>
                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              Số lời chúc hiển thị cùng lúc
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={selectedModule.props?.maxVisible || 4}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("maxVisible", parseInt(e.target.value, 10) || 4)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                            />
                          </div>
                          <p className="text-[10px] text-stone-500">
                            Khách mời sẽ gửi lời chúc trực tiếp trên thiệp. Lời chúc sẽ hiển thị dạng bong bóng bay sinh động.
                          </p>
                        </>
                      )}

                      {/* PHOTO GRID (generic) FIELDS */}
                      {selectedModule.type === "photo-grid" && (
                        <>
                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              Tiêu đề Album
                            </label>
                            <input
                              type="text"
                              value={selectedModule.props?.title || ""}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("title", e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-400 font-semibold mb-1">
                              Số cột hiển thị
                            </label>
                            <select
                              value={selectedModule.props?.columns || 2}
                              onChange={(e) =>
                                handleUpdateSelectedModuleProp("columns", parseInt(e.target.value, 10))
                              }
                              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                            >
                              <option value={2}>2 cột</option>
                              <option value={3}>3 cột</option>
                              <option value={4}>4 cột</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-stone-500">
                    <Sliders className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>Hãy chọn một module ở cột bên trái để tùy chỉnh thuộc tính chi tiết.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: GLOBAL DEFAULT DATA */}
            {rightTab === "eventData" && (
              <div className="space-y-3.5">
                <div>
                  <h3 className="font-bold text-white text-sm">Dữ liệu sự kiện mặc định</h3>
                  <p className="text-[11px] text-stone-400">
                    Dữ liệu mẫu điền sẵn cho khách khi bắt đầu chọn template này
                  </p>
                </div>

                <div>
                  <label className="block text-stone-400 font-semibold mb-1">
                    Tiêu đề sự kiện
                  </label>
                  <input
                    type="text"
                    value={template.defaultData.eventTitle}
                    onChange={(e) => handleUpdateDefaultData("eventTitle", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-stone-400 font-semibold mb-1">
                      Nhân vật 1 (Chú rể)
                    </label>
                    <input
                      type="text"
                      value={template.defaultData.person1}
                      onChange={(e) => handleUpdateDefaultData("person1", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-400 font-semibold mb-1">
                      Nhân vật 2 (Cô dâu)
                    </label>
                    <input
                      type="text"
                      value={template.defaultData.person2 || ""}
                      onChange={(e) => handleUpdateDefaultData("person2", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-stone-400 font-semibold mb-1">
                      Ngày tổ chức
                    </label>
                    <input
                      type="text"
                      value={template.defaultData.date}
                      onChange={(e) => handleUpdateDefaultData("date", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-400 font-semibold mb-1">
                      Giờ tổ chức
                    </label>
                    <input
                      type="text"
                      value={template.defaultData.time}
                      onChange={(e) => handleUpdateDefaultData("time", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-400 font-semibold mb-1">
                    Địa điểm tổ chức
                  </label>
                  <input
                    type="text"
                    value={template.defaultData.venue}
                    onChange={(e) => handleUpdateDefaultData("venue", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 font-semibold mb-1">
                    Địa chỉ chi tiết
                  </label>
                  <input
                    type="text"
                    value={template.defaultData.address}
                    onChange={(e) => handleUpdateDefaultData("address", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 font-semibold mb-1">
                    Trích dẫn / Lời ngỏ
                  </label>
                  <textarea
                    rows={2}
                    value={template.defaultData.quote}
                    onChange={(e) => handleUpdateDefaultData("quote", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                  />
                </div>

                {/* Bank Account */}
                <div className="pt-2 border-t border-stone-800 space-y-2">
                  <h4 className="font-bold text-stone-300">Tài khoản mừng cưới VietQR</h4>
                  <div>
                    <label className="block text-stone-400 font-semibold mb-1">
                      Ngân hàng
                    </label>
                    <input
                      type="text"
                      value={template.defaultData.bankInfo.bankName}
                      onChange={(e) => handleUpdateBankInfo("bankName", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-400 font-semibold mb-1">
                      Số tài khoản
                    </label>
                    <input
                      type="text"
                      value={template.defaultData.bankInfo.accountNumber}
                      onChange={(e) => handleUpdateBankInfo("accountNumber", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-400 font-semibold mb-1">
                      Chủ tài khoản
                    </label>
                    <input
                      type="text"
                      value={template.defaultData.bankInfo.accountHolder}
                      onChange={(e) => handleUpdateBankInfo("accountHolder", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: TEMPLATE METADATA */}
            {rightTab === "metadata" && (
              <div className="space-y-3.5">
                <div>
                  <h3 className="font-bold text-white text-sm">Cài đặt nhận diện Template</h3>
                  <p className="text-[11px] text-stone-400">
                    Thông tin hiển thị trên thẻ card trong Kho Template
                  </p>
                </div>

                <div>
                  <label className="block text-stone-400 font-semibold mb-1">
                    Danh mục mẫu
                  </label>
                  <select
                    value={template.category}
                    onChange={(e) => {
                      const cat = e.target.value as any;
                      const catName =
                        cat === "wedding"
                          ? "Thiệp cưới"
                          : cat === "graduation"
                          ? "Thiệp tốt nghiệp"
                          : cat === "birthday"
                          ? "Thiệp sinh nhật"
                          : cat === "event"
                          ? "Sự kiện"
                          : "Kỷ niệm";
                      setTemplate({
                        ...template,
                        category: cat,
                        categoryName: catName,
                        type: cat === "graduation" ? "graduation" : "wedding",
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                  >
                    <option value="wedding">Thiệp cưới (Wedding)</option>
                    <option value="graduation">Thiệp tốt nghiệp (Graduation)</option>
                    <option value="birthday">Thiệp sinh nhật (Birthday)</option>
                    <option value="event">Sự kiện (Event)</option>
                    <option value="anniversary">Kỷ niệm (Anniversary)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-400 font-semibold mb-1">
                    Huy hiệu nổi bật (Tag)
                  </label>
                  <select
                    value={template.tag || "MỚI"}
                    onChange={(e) =>
                      setTemplate({ ...template, tag: e.target.value as any })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                  >
                    <option value="MỚI">MỚI (New)</option>
                    <option value="HOT">HOT (Thịnh hành)</option>
                    <option value="PREMIUM">PREMIUM (Cao cấp)</option>
                    <option value="FREE">FREE (Miễn phí)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-400 font-semibold mb-1">
                    Đường dẫn tĩnh (Slug)
                  </label>
                  <input
                    type="text"
                    value={template.slug}
                    onChange={(e) => setTemplate({ ...template, slug: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 font-semibold mb-1">
                    Mô tả ngắn
                  </label>
                  <textarea
                    rows={2}
                    value={template.description}
                    onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 font-semibold mb-1">
                    URL Ảnh bìa / Thumbnail
                  </label>
                  <input
                    type="text"
                    value={template.image}
                    onChange={(e) => setTemplate({ ...template, image: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-zen-primary text-[11px]"
                  />

                  {/* Stock photos */}
                  <div className="mt-2.5">
                    <span className="text-[10px] text-stone-500 block mb-1.5 font-semibold">
                      Hoặc chọn ảnh mẫu có sẵn:
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(SAMPLE_PHOTOS[template.category as keyof typeof SAMPLE_PHOTOS] || SAMPLE_PHOTOS.wedding).map(
                        (sample, idx) => (
                          <div
                            key={idx}
                            onClick={() => setTemplate({ ...template, image: sample.url })}
                            className={`aspect-[3/4] rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                              template.image === sample.url
                                ? "border-zen-primary scale-105"
                                : "border-transparent opacity-70 hover:opacity-100"
                            }`}
                          >
                            <img
                              src={sample.url}
                              alt={sample.label}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel Footer */}
          <div className="p-3 bg-stone-950 border-t border-stone-800 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleCopyJson}
              className="flex-1 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy JSON</span>
            </button>
            <button
              type="button"
              onClick={handleSaveToStore}
              className="flex-1 py-2 rounded-xl bg-zen-primary hover:bg-red-600 text-white text-xs font-bold shadow-md shadow-zen-primary/25 transition-all flex items-center justify-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu vào Kho</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Export Modal */}
      <ExportTemplateModal
        template={template}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      {/* Import Modal */}
      <ImportTemplateModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={(imported) => {
          if (imported.length > 0) {
            setTemplate(imported[0]);
            setSelectedModuleId(imported[0].modules?.[0]?.id || null);
            showToast(`Đã nạp mẫu "${imported[0].title}" vào công cụ thiết kế! 🎉`);
          }
        }}
      />
    </div>
  );
}

export default function TemplateBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen bg-stone-900 flex items-center justify-center text-white text-sm">
          Đang tải Studio Tạo Template...
        </div>
      }
    >
      <TemplateBuilderInner />
    </Suspense>
  );
}
