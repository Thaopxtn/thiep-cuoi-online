"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Sparkles,
  FolderHeart,
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  Heart,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingSupport from "@/components/FloatingSupport";
import ZenloveCard from "@/components/templates/ZenloveCard";
import ZenlovePreviewModal from "@/components/templates/ZenlovePreviewModal";
import SmartSuggestModal from "@/components/templates/SmartSuggestModal";
import {
  ZENLOVE_TEMPLATES,
  ZENLOVE_CATEGORIES,
  ZenLoveTemplate,
} from "@/data/zenloveTemplates";
import { cloneTemplateToNewCard } from "@/lib/weddingCardService";
import { useAuth } from "@/context/AuthContext";
import {
  getFavoriteIds,
  toggleFavorite,
  FAVORITES_EVENT_CHANGE,
} from "@/lib/storage/favorites";
import {
  COLOR_TONE_OPTIONS,
  ColorTone,
  detectColorTone,
} from "@/lib/templateUnifiedService";

const ITEMS_PER_PAGE = 24;

function TemplatesPageContent() {
  const router = useRouter();
  const { isLoggedIn, openLoginModal } = useAuth();

  // State
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [pageTypeFilter, setPageTypeFilter] = useState<"ALL" | "CANVAS" | "FORM">("ALL");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"latest" | "views" | "likes">("latest");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState<number>(ITEMS_PER_PAGE);
  const [colorToneFilter, setColorToneFilter] = useState<ColorTone>("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  // Modals
  const [previewTemplate, setPreviewTemplate] = useState<ZenLoveTemplate | null>(null);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);

  // Sync favorites on mount and on storage events
  useEffect(() => {
    setFavoriteIds(getFavoriteIds());

    const handleFavChange = () => {
      setFavoriteIds(getFavoriteIds());
    };

    window.addEventListener(FAVORITES_EVENT_CHANGE, handleFavChange);
    return () => window.removeEventListener(FAVORITES_EVENT_CHANGE, handleFavChange);
  }, []);

  // Compute category item counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: ZENLOVE_TEMPLATES.length };
    ZENLOVE_TEMPLATES.forEach((t) => {
      counts[t.categorySlug] = (counts[t.categorySlug] || 0) + 1;
    });
    return counts;
  }, []);

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    return ZENLOVE_TEMPLATES.filter((tpl) => {
      // Favorites filter
      if (showFavoritesOnly && !favoriteIds.includes(tpl.id)) {
        return false;
      }

      // Category filter
      if (selectedCategory !== "all" && tpl.categorySlug !== selectedCategory) {
        return false;
      }

      // Color tone filter
      if (colorToneFilter !== "all") {
        const tone = detectColorTone(tpl.name, tpl.description, tpl.categoryName);
        if (tone !== colorToneFilter) {
          return false;
        }
      }

      // Page type filter (CANVAS vs FORM)
      if (pageTypeFilter !== "ALL" && tpl.targetPageType !== pageTypeFilter) {
        return false;
      }

      // Tag filter
      if (tagFilter === "free" && tpl.templateType !== "free") return false;
      if (tagFilter === "hot" && tpl.templateType !== "hot" && tpl.viewCount < 2000) return false;
      if (tagFilter === "new" && tpl.templateType !== "new") return false;

      // Search query (Hỗ trợ tìm kiếm theo Tên, Thể loại, Mô tả, và Mã số thứ tự Mẫu 01..Mẫu 207)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = tpl.name.toLowerCase().includes(query);
        const matchCategory = tpl.categoryName.toLowerCase().includes(query);
        const matchSlug = tpl.slug.toLowerCase().includes(query);
        const matchDesc = tpl.description?.toLowerCase().includes(query);
        const matchCode = tpl.code?.toLowerCase().includes(query);
        const matchDisplayCode = tpl.displayCode?.toLowerCase().includes(query);
        const matchOrderNumber =
          tpl.orderNumber !== undefined &&
          (String(tpl.orderNumber) === query ||
            `0${tpl.orderNumber}` === query ||
            `mẫu ${tpl.orderNumber}` === query ||
            `mau ${tpl.orderNumber}` === query ||
            `mau-${tpl.orderNumber}` === query);

        if (
          !matchName &&
          !matchCategory &&
          !matchSlug &&
          !matchDesc &&
          !matchCode &&
          !matchDisplayCode &&
          !matchOrderNumber
        ) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "views") {
        return (b.viewCount || 0) - (a.viewCount || 0);
      }
      if (sortBy === "likes") {
        return (b.likeCount || 0) - (a.likeCount || 0);
      }
      // Latest: sort by createdAt or original order
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [
    selectedCategory,
    pageTypeFilter,
    tagFilter,
    sortBy,
    searchQuery,
    colorToneFilter,
    showFavoritesOnly,
    favoriteIds,
  ]);

  // Sliced templates for display
  const displayedTemplates = useMemo(() => {
    return filteredTemplates.slice(0, visibleCount);
  }, [filteredTemplates, visibleCount]);

  const handleUseTemplate = async (templateId: string) => {
    if (!isLoggedIn) {
      setPreviewTemplate(null);
      openLoginModal("Vui lòng đăng nhập để bắt đầu tạo thiệp cưới với mẫu này", {
        type: "clone_template",
        templateId,
      });
      return;
    }
    try {
      const newCard = await cloneTemplateToNewCard(templateId);
      setPreviewTemplate(null);
      router.push(`/design-template/${newCard.id}?clonedFrom=${templateId}`);
    } catch (err) {
      setPreviewTemplate(null);
      router.push(`/design-template/${templateId}`);
    }
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, filteredTemplates.length));
  };

  const handleShowAll = () => {
    setVisibleCount(filteredTemplates.length);
  };

  const handleSelectCategory = (catSlug: string) => {
    setSelectedCategory(catSlug);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  const advancedFilterCount = [pageTypeFilter !== "ALL", tagFilter !== "all", colorToneFilter !== "all"].filter(Boolean).length;
  const hasActiveFilters = advancedFilterCount > 0 || selectedCategory !== "all" || showFavoritesOnly || searchQuery !== "";
  const activeFilterLabels = [
    pageTypeFilter !== "ALL" ? (pageTypeFilter === "CANVAS" ? "Kéo thả tự do" : "Điền thông tin theo mẫu") : "",
    tagFilter !== "all" ? ({ free: "Miễn phí", hot: "Nổi bật", new: "Mới ra mắt" }[tagFilter]) : "",
    colorToneFilter !== "all" ? COLOR_TONE_OPTIONS.find((color) => color.id === colorToneFilter)?.label : "",
  ].filter(Boolean);
  const resetFilters = () => {
    setSelectedCategory("all");
    setPageTypeFilter("ALL");
    setTagFilter("all");
    setColorToneFilter("all");
    setShowFavoritesOnly(false);
    setSearchQuery("");
    setVisibleCount(ITEMS_PER_PAGE);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fffbfa] text-zen-black">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-20">
        {/* Breadcrumb Navigation matching ZenLove */}
        <nav
          className="flex items-center justify-center gap-1.5 text-xs text-gray-500 mb-5"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-zen-primary transition-colors">
            Trang chủ
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-semibold text-gray-900">Mẫu thiệp</span>
        </nav>

        {/* Section Header with Decorative SVGs matching ZenLove */}
        <div className="relative text-center max-w-3xl mx-auto mb-8 sm:mb-10 px-4">
          <div className="absolute top-0 left-0 opacity-60 hidden md:block pointer-events-none">
            <svg width="68" height="12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M2.267 7.66c1.73.586 3.641.772 5.46.639 3.815-.28 9.064-2.132 11.847-5.407.66-.777 2.661-.736 3.224.112.65.98 1.499 1.915 2.625 2.786 5.99 4.635 13.017 2.99 16.257-3.007.415-.768 1.6-.86 2.081-.133 1.244 1.881 2.764 3.564 4.768 4.946 6.454 4.449 13.742.612 17.59-5.17"
                stroke="#7569BB"
                strokeWidth="3"
                strokeMiterlimit="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1 className="page-title text-3xl sm:text-4xl md:text-5xl font-heading text-gray-900 tracking-tight leading-relaxed">
            <span>Mẫu thiệp</span>{" "}
            <span className="font-signature leading-relaxed text-gradient-mm text-4xl sm:text-5xl md:text-6xl inline-block px-1">
              online đẹp
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed mt-3">
            Khám phá hơn 200+ mẫu thiệp điện tử đa dạng: cưới, sinh nhật, sự kiện, kỷ niệm từ ZenLove{" "}
            <span className="inline-block animate-bounce">✨</span>
          </p>

          {/* Quick Studio Action Buttons */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <Link
              href="/design-template/8c5055d8-30db-4b38-8831-e11063e3d352"
              className="px-4 py-2 rounded-full bg-zen-primary hover:bg-[#d93849] text-white text-xs sm:text-sm font-bold shadow-md shadow-zen-primary/20 transition-all hover:scale-105 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Studio Thiết kế Canvas</span>
            </Link>

            <Link
              href="/thiep-online/khach-hang"
              className="px-4 py-2 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-all hover:scale-105 flex items-center gap-1.5"
            >
              <FolderHeart className="w-3.5 h-3.5 text-rose-400" />
              <span>Thiệp Khách Hàng Thực Tế</span>
            </Link>
          </div>
        </div>

        <section className="template-filters mb-8 rounded-2xl border border-[var(--zen-border)] bg-white p-4 sm:p-6" aria-label="Tìm và lọc mẫu thiệp">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label htmlFor="template-search" className="mb-2 block text-sm font-bold text-gray-800">Tìm mẫu thiệp</label>
              <div className="relative">
                <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500" />
                <input id="template-search" type="search" placeholder="Tên mẫu, mã mẫu hoặc phong cách..."
                  value={searchQuery} onChange={(event) => { setSearchQuery(event.target.value); setVisibleCount(ITEMS_PER_PAGE); }}
                  className="min-h-11 w-full rounded-xl border border-gray-300 bg-white py-2 pl-10 pr-11 text-sm" />
                {searchQuery && <button type="button" aria-label="Xóa từ khóa tìm kiếm" onClick={() => { setSearchQuery(""); setVisibleCount(ITEMS_PER_PAGE); }}
                  className="absolute right-0 top-0 flex size-11 items-center justify-center text-gray-600"><X className="size-4" /></button>}
              </div>
            </div>
            <button type="button" onClick={() => setIsSuggestModalOpen(true)} className="zen-control">
              <Sparkles className="size-4" aria-hidden="true" /> Gợi ý mẫu phù hợp
            </button>
          </div>

          <fieldset className="mt-5">
            <legend className="mb-2 text-sm font-bold text-gray-800">Dịp của bạn</legend>
            <div className="flex flex-wrap gap-2">
              {[{ idCat: "all", name: "Tất cả" }, ...ZENLOVE_CATEGORIES].map((category) => (
                <button key={category.idCat} type="button" aria-pressed={selectedCategory === category.idCat}
                  onClick={() => handleSelectCategory(category.idCat)} className="zen-control">
                  {category.name}<span className="text-xs tabular-nums">({categoryCounts[category.idCat] || 0})</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
            <button type="button" aria-pressed={showFavoritesOnly}
              onClick={() => { setShowFavoritesOnly(!showFavoritesOnly); setVisibleCount(ITEMS_PER_PAGE); }} className="zen-control">
              <Heart className={`size-4 ${showFavoritesOnly ? "fill-current" : ""}`} aria-hidden="true" />
              Đã thích ({favoriteIds.length})
            </button>
            <button type="button" aria-expanded={isAdvancedFiltersOpen} aria-controls="advanced-template-filters"
              onClick={() => setIsAdvancedFiltersOpen((open) => !open)} className="zen-control">
              <SlidersHorizontal className="size-4" aria-hidden="true" /> Bộ lọc
              {advancedFilterCount > 0 && <span className="rounded-full bg-rose-100 px-2 text-xs">{advancedFilterCount}</span>}
              <ChevronDown className={`size-4 ${isAdvancedFiltersOpen ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
            <label className="flex min-h-11 items-center gap-2 text-sm text-gray-600 sm:ml-auto">
              Sắp xếp
              <select value={sortBy} onChange={(event) => { setSortBy(event.target.value as typeof sortBy); setVisibleCount(ITEMS_PER_PAGE); }}
                className="min-h-11 max-w-full rounded-xl border border-gray-300 bg-white px-2 text-sm text-gray-800">
                <option value="latest">Vừa cập nhật</option>
                <option value="views">Xem nhiều nhất</option>
                <option value="likes">Yêu thích nhất</option>
              </select>
            </label>
          </div>

          {isAdvancedFiltersOpen && (
            <div id="advanced-template-filters" className="mt-4 space-y-5 border-t border-gray-100 pt-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-bold text-gray-800">Cách chỉnh sửa
                  <select value={pageTypeFilter} onChange={(event) => { setPageTypeFilter(event.target.value as typeof pageTypeFilter); setVisibleCount(ITEMS_PER_PAGE); }}
                    className="mt-2 min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 font-normal">
                    <option value="ALL">Tất cả cách chỉnh sửa</option>
                    <option value="CANVAS">Kéo thả tự do</option>
                    <option value="FORM">Điền thông tin theo mẫu</option>
                  </select>
                </label>
                <label className="text-sm font-bold text-gray-800">Phân loại
                  <select value={tagFilter} onChange={(event) => { setTagFilter(event.target.value); setVisibleCount(ITEMS_PER_PAGE); }}
                    className="mt-2 min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 font-normal">
                    <option value="all">Tất cả mẫu</option><option value="free">Miễn phí</option>
                    <option value="hot">Nổi bật</option><option value="new">Mới ra mắt</option>
                  </select>
                </label>
              </div>
              <fieldset>
                <legend className="mb-2 text-sm font-bold text-gray-800">Tone màu</legend>
                <div className="flex flex-wrap gap-2">
                  {COLOR_TONE_OPTIONS.map((color) => (
                    <button key={color.id} type="button" aria-pressed={colorToneFilter === color.id}
                      onClick={() => { setColorToneFilter(color.id); setVisibleCount(ITEMS_PER_PAGE); }} className="zen-control">
                      {color.id !== "all" && <span aria-hidden="true" className="size-3 rounded-full border border-gray-300" style={{ backgroundColor: color.colorHex }} />}
                      {color.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
            <p role="status" className="text-sm text-gray-600">Tìm thấy <strong className="text-gray-900">{filteredTemplates.length}</strong> mẫu thiệp</p>
            {hasActiveFilters && <button type="button" onClick={resetFilters} className="zen-control">Đặt lại bộ lọc</button>}
          </div>
          {activeFilterLabels.length > 0 && <p className="mt-2 text-sm text-gray-600">Đang lọc: {activeFilterLabels.join(" · ")}</p>}
        </section>
        {/* Templates 6-column Responsive Grid */}
        <section>
          {displayedTemplates.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3.5 gap-y-6">
              {displayedTemplates.map((template) => (
                <ZenloveCard
                  key={template.id}
                  template={template}
                  isLiked={favoriteIds.includes(template.id)}
                  onToggleLike={(id) => {
                    toggleFavorite(id);
                  }}
                  onPreview={(tpl) => setPreviewTemplate(tpl)}
                  onUse={handleUseTemplate}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-white rounded-3xl border border-gray-100 p-8 shadow-xs">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-zen-primary flex items-center justify-center mx-auto mb-3">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">
                Không tìm thấy mẫu thiệp phù hợp
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto">
                Hãy thử thay đổi từ khóa tìm kiếm, bỏ bộ lọc màu sắc hoặc bấm đặt lại bộ lọc.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 px-5 py-2 rounded-full bg-zen-primary text-white text-xs font-bold hover:bg-[#d93849] transition-colors shadow-xs cursor-pointer"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          )}

          {/* Load More Pagination */}
          {visibleCount < filteredTemplates.length && (
            <div className="mt-10 flex flex-col items-center gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="rounded-full bg-zen-primary hover:bg-[#d93849] px-7 py-3 text-sm font-bold text-white shadow-md shadow-zen-primary/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <span>Tải thêm mẫu</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleShowAll}
                  className="rounded-full bg-white hover:bg-gray-50 border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 shadow-2xs transition-all hover:scale-105 cursor-pointer"
                >
                  Xem tất cả ({filteredTemplates.length})
                </button>
              </div>

              <span className="text-xs text-gray-400">
                Đang hiển thị {displayedTemplates.length} / {filteredTemplates.length} mẫu thiệp
              </span>
            </div>
          )}
        </section>

        {/* Hidden SEO Anchors matching ZenLove */}
        <div className="sr-only">
          <a title="Mẫu Thiệp cưới online đẹp" href="/templates/thiep-cuoi">
            Mẫu Thiệp cưới đẹp
          </a>
          <a title="Mẫu Thiệp tốt nghiệp online đẹp" href="/templates/thiep-tot-nghiep">
            Mẫu Thiệp tốt nghiệp đẹp
          </a>
          <a title="Mẫu Sự kiện online đẹp" href="/templates/thiep-su-kien">
            Mẫu Sự kiện đẹp
          </a>
          <a title="Mẫu Kỷ niệm online đẹp" href="/templates/thiep-ky-niem">
            Mẫu Kỷ niệm đẹp
          </a>
          <a title="Mẫu Lời chúc online đẹp" href="/templates/thiep-loi-chuc">
            Mẫu Lời chúc đẹp
          </a>
          <a title="Mẫu Thiệp sinh nhật online đẹp" href="/templates/thiep-sinh-nhat">
            Mẫu Thiệp sinh nhật đẹp
          </a>
          <a title="Mẫu Thiệp Tất Niên online đẹp" href="/templates/thiep-moi-tat-nien">
            Mẫu Thiệp Tất Niên đẹp
          </a>
          <a title="Mẫu Khác online đẹp" href="/templates/other">
            Mẫu Khác đẹp
          </a>
        </div>
      </main>

      {/* Modals */}
      <ZenlovePreviewModal
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onUse={handleUseTemplate}
      />

      <SmartSuggestModal
        isOpen={isSuggestModalOpen}
        onClose={() => setIsSuggestModalOpen(false)}
        templates={ZENLOVE_TEMPLATES}
        onSelectTemplate={(tpl) => setPreviewTemplate(tpl)}
      />

      <Footer />
      <FloatingSupport />
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#fffbfa]">
          <div className="animate-spin w-8 h-8 rounded-full border-4 border-zen-primary border-t-transparent" />
        </div>
      }
    >
      <TemplatesPageContent />
    </Suspense>
  );
}
