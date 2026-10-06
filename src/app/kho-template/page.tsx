"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Plus,
  Upload,
  Download,
  Copy,
  Trash2,
  Edit3,
  ChevronRight,
  Archive,
  RefreshCw,
  FolderHeart,
  SlidersHorizontal,
  CheckSquare,
  HardDrive,
  Check,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingSupport from "@/components/FloatingSupport";
import TemplatePreviewModal from "@/components/templates/TemplatePreviewModal";
import CreateTemplateModal from "@/components/templates/CreateTemplateModal";
import ImportTemplateModal from "@/components/templates/ImportTemplateModal";
import ExportTemplateModal from "@/components/templates/ExportTemplateModal";
import FilterPanel from "@/components/templates/library/FilterPanel";
import LibraryToolbar from "@/components/templates/library/LibraryToolbar";
import TemplateGrid from "@/components/templates/library/TemplateGrid";
import BulkActionBar from "@/components/templates/library/BulkActionBar";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import Toast, { ToastData } from "@/components/common/Toast";
import { useTemplateLibrary } from "@/hooks/useTemplateLibrary";
import { useTemplateFilters } from "@/hooks/useTemplateFilters";
import { TemplateItem, TEMPLATES_DATA } from "@/data/templates";
import {
  deleteCustomTemplate,
  deleteCustomTemplates,
  duplicateTemplate,
  duplicateTemplates,
  exportAllCustomTemplates,
  getStorageUsageAsync,
  saveCustomTemplate,
  StorageUsageInfo,
} from "@/lib/templateStorage";
import { cloneTemplateToNewCard } from "@/lib/weddingCardService";

function KhoTemplateContent() {
  const router = useRouter();

  // Tự động chuyển hướng đồng nhất về Kho Mẫu chuẩn (/templates)
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.replace("/templates");
    }
  }, []);

  const library = useTemplateLibrary();

  // Unified Filters
  const filterState = useTemplateFilters(
    library.allTemplates,
    library.customIds,
    library.favoriteIds,
    { syncWithUrl: true, defaultSource: "all" }
  );

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [exportTemplates, setExportTemplates] = useState<TemplateItem[]>([]);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateItem | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Storage usage
  const [storageInfo, setStorageInfo] = useState<StorageUsageInfo>({
    usedBytes: 0,
    usedKB: 0,
    usedMB: 0,
    estimatedMaxMB: 500,
    percentUsed: 0,
    isNearQuota: false,
    isCritical: false,
  });

  const loadStorageQuota = async () => {
    try {
      const info = await getStorageUsageAsync();
      setStorageInfo(info);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadStorageQuota();
  }, [library.customTemplates.length]);

  // Multi-select state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Notification Toast with Undo
  const [toast, setToast] = useState<ToastData | null>(null);
  const showToast = (data: Omit<ToastData, "id">) => {
    setToast({ id: String(Date.now()), ...data });
    setTimeout(() => {
      setToast((curr) => (curr && curr.message === data.message ? null : curr));
    }, 5000);
  };

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    library.allTemplates.forEach((t) => {
      const isCustom = library.customIds.has(t.id);
      if (filterState.filters.source === "custom" && !isCustom) return;
      if (filterState.filters.source === "presets" && isCustom) return;
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return counts;
  }, [library.allTemplates, library.customIds, filterState.filters.source]);

  // Actions
  const handleUseTemplate = async (templateId: string) => {
    try {
      const card = await cloneTemplateToNewCard(templateId);
      router.push(`/design-template/${card.id}?clonedFrom=${templateId}`);
    } catch {
      router.push(`/design-template/${templateId}`);
    }
  };

  const handleDuplicateSingle = (template: TemplateItem, e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateTemplate(template);
    showToast({
      message: `Đã nhân bản mẫu "${template.title}" thành công! 🎉`,
      type: "success",
    });
    library.refresh();
  };

  const handleDeleteSingle = (template: TemplateItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: "Xóa mẫu thiệp khỏi kho?",
      message: `Bạn có chắc chắn muốn xóa "${template.title}"? Thao tác này có thể hoàn tác trong vòng 5 giây sau khi xóa.`,
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        // Temporarily remember for undo
        const removedItem = { ...template };
        deleteCustomTemplate(template.id);
        library.refresh();

        showToast({
          message: `Đã xóa mẫu "${template.title}".`,
          type: "info",
          undoLabel: "Hoàn tác",
          undoAction: () => {
            saveCustomTemplate(removedItem);
            library.refresh();
            showToast({
              message: `Đã khôi phục mẫu "${removedItem.title}"!`,
              type: "success",
            });
          },
        });
      },
    });
  };

  const handleExportSingle = (template: TemplateItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setExportTemplates([template]);
    setIsExportOpen(true);
  };

  // Multi-select helpers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filterState.filteredTemplates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filterState.filteredTemplates.map((t) => t.id)));
    }
  };

  const handleBulkExport = () => {
    const list = filterState.filteredTemplates.filter((t) => selectedIds.has(t.id));
    if (list.length === 0) return;
    setExportTemplates(list);
    setIsExportOpen(true);
  };

  const handleBulkDuplicate = async () => {
    const list = filterState.filteredTemplates.filter((t) => selectedIds.has(t.id));
    if (list.length === 0) return;
    await duplicateTemplates(list);
    showToast({
      message: `Đã nhân bản ${list.length} mẫu thiệp thành công! 🎉`,
      type: "success",
    });
    setSelectedIds(new Set());
    setIsSelectMode(false);
    library.refresh();
  };

  const handleBulkDelete = () => {
    const list = filterState.filteredTemplates.filter((t) => selectedIds.has(t.id));
    const customToDelete = list.filter((t) => library.customIds.has(t.id));
    const presetCount = list.length - customToDelete.length;

    if (customToDelete.length === 0) {
      alert("Không có mẫu tự tạo nào được chọn. Các mẫu hệ thống không thể bị xóa.");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: `Xóa ${customToDelete.length} mẫu tự tạo?`,
      message: `Bạn có chắc chắn muốn xóa ${customToDelete.length} mẫu tự tạo đã chọn?${
        presetCount > 0 ? ` (${presetCount} mẫu hệ thống sẽ được giữ nguyên).` : ""
      }`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        const backupCopies = [...customToDelete];
        await deleteCustomTemplates(customToDelete.map((t) => t.id));
        setSelectedIds(new Set());
        setIsSelectMode(false);
        library.refresh();

        showToast({
          message: `Đã xóa ${customToDelete.length} mẫu thiệp.`,
          type: "info",
          undoLabel: "Hoàn tác",
          undoAction: () => {
            backupCopies.forEach((item) => saveCustomTemplate(item));
            library.refresh();
            showToast({
              message: `Đã khôi phục ${backupCopies.length} mẫu thiệp!`,
              type: "success",
            });
          },
        });
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fffbfa] text-zen-black">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-24 pb-24">
        {/* Toast Alert */}
        <Toast toast={toast} onClose={() => setToast(null)} />

        {/* Confirmation Modal */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        />

        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-1.5 text-xs text-gray-500 mb-4"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-zen-primary transition-colors">
            Trang chủ
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <Link href="/templates" className="hover:text-zen-primary transition-colors">
            Mẫu thiệp
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-semibold text-gray-800">Kho Template & Quản Lý Mẫu</span>
        </nav>

        {/* Hero Header */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-rose-500 via-rose-600 to-amber-500 text-white p-6 sm:p-8 md:p-10 mb-8 shadow-xl shadow-rose-500/15">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-xs font-semibold uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ZenLove Template Studio</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black font-serif tracking-tight">
                Kho Template & Quản Lý Mẫu
              </h1>
              <p className="mt-2 text-rose-100 text-xs sm:text-sm sm:leading-relaxed">
                Tự tạo các mẫu thiệp điện tử độc đáo, nhập khẩu hoặc xuất khẩu cấu hình JSON
                để chia sẻ, sao lưu và tái sử dụng không giới hạn trên IndexedDB.
              </p>
            </div>

            {/* Top Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/template-builder"
                className="px-5 py-2.5 rounded-2xl bg-white hover:bg-rose-50 text-zen-primary font-bold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span>Studio Tạo Mẫu</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-xs text-white font-semibold text-xs sm:text-sm border border-white/30 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo nhanh (Wizard)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsImportOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-xs text-white font-semibold text-xs sm:text-sm border border-white/30 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Nhập mẫu (JSON)</span>
              </button>

              {/* Multi-select Mode Toggle */}
              <button
                type="button"
                onClick={() => {
                  setIsSelectMode(!isSelectMode);
                  if (isSelectMode) setSelectedIds(new Set());
                }}
                className={`px-4 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2 ${
                  isSelectMode
                    ? "bg-stone-900 text-white shadow-lg"
                    : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span>{isSelectMode ? "Hủy chọn nhiều" : "Chọn nhiều"}</span>
              </button>
            </div>
          </div>

          {/* Quick KPI stats */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/20">
            <div className="bg-black/15 backdrop-blur-2xs rounded-2xl p-3">
              <span className="text-[11px] text-rose-100 uppercase tracking-wider block font-medium">
                Tổng mẫu trong kho
              </span>
              <span className="text-2xl font-black">{library.allTemplates.length}</span>
            </div>
            <div className="bg-black/15 backdrop-blur-2xs rounded-2xl p-3">
              <span className="text-[11px] text-rose-100 uppercase tracking-wider block font-medium">
                Mẫu của bạn (Tự tạo)
              </span>
              <span className="text-2xl font-black text-amber-300">
                {library.customTemplates.length}
              </span>
            </div>
            <div className="bg-black/15 backdrop-blur-2xs rounded-2xl p-3">
              <span className="text-[11px] text-rose-100 uppercase tracking-wider block font-medium">
                Mẫu hệ thống (Presets)
              </span>
              <span className="text-2xl font-black">{library.presets.length}</span>
            </div>
            <div className="bg-black/15 backdrop-blur-2xs rounded-2xl p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-rose-100 uppercase tracking-wider block font-medium">
                    Bộ nhớ IndexedDB
                  </span>
                  <span className="text-xs font-bold text-white">
                    {storageInfo.usedMB} MB / ~{storageInfo.estimatedMaxMB} MB
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    library.refresh();
                    loadStorageQuota();
                  }}
                  title="Làm mới bộ nhớ"
                  className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/20 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-amber-300 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(storageInfo.percentUsed, 2)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main 2-Column Kho Layout */}
        <div className="flex items-start gap-6 lg:gap-8">
          {/* Left Column: Filter Sidebar */}
          <FilterPanel
            filters={filterState.filters}
            filterActions={filterState}
            categoryCounts={categoryCounts}
            totalCount={filterState.filteredTemplates.length}
            favoriteCount={library.favoriteIds.length}
            isOpenMobile={isMobileFilterOpen}
            onCloseMobile={() => setIsMobileFilterOpen(false)}
          />

          {/* Right Column: Search Toolbar & Grid */}
          <div className="flex-1 min-w-0">
            <LibraryToolbar
              filters={filterState.filters}
              filterActions={filterState}
              totalCount={filterState.filteredTemplates.length}
              customCount={library.customTemplates.length}
              presetsCount={library.presets.length}
              showSourceTabs={true}
              onOpenMobileFilter={() => setIsMobileFilterOpen(true)}
            />

            {/* Backup all custom button if custom templates exist */}
            {library.customTemplates.length > 0 && (
              <div className="mb-4 flex items-center justify-between p-3 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-xs">
                <div className="flex items-center gap-2 text-amber-900 font-medium">
                  <Archive className="w-4 h-4 text-amber-600" />
                  <span>
                    Bạn có <strong>{library.customTemplates.length}</strong> mẫu tự tạo.
                    Hãy xuất file JSON sao lưu định kỳ để không bị mất khi xóa dữ liệu duyệt web.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => exportAllCustomTemplates()}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Sao lưu tất cả</span>
                </button>
              </div>
            )}

            {/* Template Grid with Card Actions Slot */}
            <TemplateGrid
              templates={filterState.filteredTemplates}
              isReady={library.isReady}
              onPreview={(tpl) => setPreviewTemplate(tpl)}
              onUse={handleUseTemplate}
              selectable={isSelectMode}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              emptyType={
                filterState.filters.favoritesOnly
                  ? "favorites"
                  : filterState.filters.source === "custom"
                  ? "custom"
                  : "search"
              }
              onResetFilters={filterState.clearAllFilters}
              onCreateNew={() => setIsCreateOpen(true)}
              renderCardBadge={(item) => {
                const isCustom = library.customIds.has(item.id);
                if (!isCustom) return null;
                return (
                  <span className="bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Tùy chỉnh</span>
                  </span>
                );
              }}
              renderCardActions={(item) => {
                const isCustom = library.customIds.has(item.id);
                return (
                  <div className="flex items-center justify-between gap-1 px-1">
                    <div className="flex items-center gap-1">
                      {/* Duplicate Button */}
                      <button
                        type="button"
                        onClick={(e) => handleDuplicateSingle(item, e)}
                        title="Nhân bản mẫu này"
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Export Button */}
                      <button
                        type="button"
                        onClick={(e) => handleExportSingle(item, e)}
                        title="Xuất file JSON"
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-rose-50 hover:text-zen-primary text-gray-600 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Studio Builder Link */}
                      <Link
                        href={`/template-builder?id=${item.id}`}
                        title="Tùy biến cấu trúc trong Studio Tạo Mẫu"
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-stone-800 hover:text-white text-gray-600 transition-colors flex items-center"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                      </Link>

                      {/* Edit Button */}
                      <Link
                        href={`/design-template/${item.id}`}
                        title="Mở trình thiết kế lời mời"
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-zen-primary transition-colors flex items-center gap-1 text-[11px] font-semibold"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Link>

                      {/* Delete Button (Custom templates only) */}
                      {isCustom && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSingle(item, e)}
                          title="Xóa mẫu này"
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              }}
            />
          </div>
        </div>
      </main>

      {/* Bulk Action Bar (fixed bottom when items selected) */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        totalFilteredCount={filterState.filteredTemplates.length}
        isAllSelected={
          selectedIds.size > 0 &&
          selectedIds.size === filterState.filteredTemplates.length
        }
        onSelectAll={handleSelectAll}
        onClearSelection={() => {
          setSelectedIds(new Set());
          setIsSelectMode(false);
        }}
        onBulkExport={handleBulkExport}
        onBulkDuplicate={handleBulkDuplicate}
        onBulkDelete={handleBulkDelete}
      />

      {/* Modals */}
      <CreateTemplateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(created) => {
          showToast({
            message: `Đã lưu mẫu "${created.title}" vào kho thành công! 🎉`,
            type: "success",
          });
          library.refresh();
        }}
      />

      <ImportTemplateModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={(imported) => {
          showToast({
            message: `Đã nhập thành công ${imported.length} mẫu thiệp vào kho! 📥`,
            type: "success",
          });
          library.refresh();
        }}
      />

      <ExportTemplateModal
        templates={exportTemplates}
        isOpen={isExportOpen}
        onClose={() => {
          setIsExportOpen(false);
          setExportTemplates([]);
        }}
      />

      <TemplatePreviewModal
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onUse={handleUseTemplate}
      />

      <Footer />
      <FloatingSupport />
    </div>
  );
}

export default function KhoTemplatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#fffbfa]">
          <div className="animate-spin w-8 h-8 rounded-full border-4 border-zen-primary border-t-transparent" />
        </div>
      }
    >
      <KhoTemplateContent />
    </Suspense>
  );
}
