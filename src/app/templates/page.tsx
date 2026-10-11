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
  ArrowUpDown,
  Filter,
  Heart,
  Palette,
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
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);

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

        {/* Filter Section: Categories + Controls Toolbar */}
        <section className="space-y-4 mb-8">
          {/* Top Row: Category Pills + Right Controls */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Horizontal Scrollable Category Pills */}
            <div
              className="-mx-3 flex items-center gap-2 overflow-x-auto px-3 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
              role="group"
              aria-label="Danh mục thiệp"
            >
              <button
                type="button"
                onClick={() => handleSelectCategory("all")}
                className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  selectedCategory === "all"
                    ? "border-zen-primary bg-zen-primary/10 text-zen-primary shadow-xs"
                    : "border-gray-200 bg-white text-gray-600 hover:border-zen-primary/60"
                }`}
              >
                Tất cả ({categoryCounts["all"] || 207})
              </button>

              {ZENLOVE_CATEGORIES.map((cat) => {
                const count = categoryCounts[cat.idCat] || 0;
                const isSelected = selectedCategory === cat.idCat;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat.idCat)}
                    className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "border-zen-primary bg-zen-primary/10 text-zen-primary shadow-xs"
                        : "border-gray-200 bg-white text-gray-600 hover:border-zen-primary/60"
                    }`}
                  >
                    <span>{cat.name}</span>
                    {count > 0 && <span className="ml-1 opacity-70 text-[11px]">({count})</span>}
                  </button>
                );
              })}
            </div>

            {/* Right Controls: Gợi ý + Favorites + Segmented + Phân loại + Sắp xếp */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0">
              {/* 'Gợi ý' Button */}
              <button
                type="button"
                onClick={() => setIsSuggestModalOpen(true)}
                className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-zen-primary bg-zen-primary px-3.5 py-1.5 text-xs sm:text-sm font-bold text-white transition-all hover:bg-[#d93849] shadow-xs active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Gợi ý</span>
              </button>

              {/* Favorites Tab Button */}
              <button
                type="button"
                onClick={() => {
                  setShowFavoritesOnly(!showFavoritesOnly);
                  setVisibleCount(ITEMS_PER_PAGE);
                }}
                className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  showFavoritesOnly
                    ? "border-rose-500 bg-rose-50 text-rose-600 shadow-xs"
                    : "border-gray-200 bg-white text-gray-700 hover:border-rose-300 hover:text-rose-600"
                }`}
                title="Xem danh sách mẫu bạn đã bấm tim yêu thích"
              >
                <Heart className={`w-3.5 h-3.5 ${showFavoritesOnly ? "fill-current" : ""}`} />
                <span>Đã thích ({favoriteIds.length})</span>
              </button>

              {/* Segmented Control: Tất cả | Tự do | Biểu mẫu */}
              <div
                role="radiogroup"
                aria-label="Lọc theo loại thiệp"
                className="inline-flex p-1 bg-gray-100 rounded-full text-xs font-semibold shrink-0 border border-gray-200"
              >
                {[
                  { id: "ALL", label: "Tất cả" },
                  { id: "CANVAS", label: "Tự do" },
                  { id: "FORM", label: "Biểu mẫu" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setPageTypeFilter(item.id as any);
                      setVisibleCount(ITEMS_PER_PAGE);
                    }}
                    className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                      pageTypeFilter === item.id
                        ? "bg-white text-gray-900 shadow-xs font-bold"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Tag / Price Filter Dropdown */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsTagDropdownOpen(!isTagDropdownOpen);
                    setIsSortDropdownOpen(false);
                  }}
                  className="flex items-center gap-1 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs sm:text-sm font-medium border-gray-200 bg-white text-gray-600 hover:border-zen-primary/60 transition-colors cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>
                    {tagFilter === "all"
                      ? "Phân loại"
                      : tagFilter === "free"
                      ? "Miễn phí"
                      : tagFilter === "hot"
                      ? "Nổi bật"
                      : "Mới nhất"}
                  </span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>

                {isTagDropdownOpen && (
                  <div
                    className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-40 animate-fade-in"
                    onClick={() => setIsTagDropdownOpen(false)}
                  >
                    {[
                      { id: "all", label: "Tất cả mẫu" },
                      { id: "free", label: "Miễn phí" },
                      { id: "hot", label: "Nổi bật (Hot)" },
                      { id: "new", label: "Mới ra mắt" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setTagFilter(item.id);
                          setVisibleCount(ITEMS_PER_PAGE);
                        }}
                        className={`w-full text-left px-3.5 py-1.5 text-xs transition-colors cursor-pointer ${
                          tagFilter === item.id
                            ? "bg-rose-50 text-zen-primary font-bold"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsSortDropdownOpen(!isSortDropdownOpen);
                    setIsTagDropdownOpen(false);
                  }}
                  className="flex items-center gap-1 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs sm:text-sm font-medium border-gray-200 bg-white text-gray-600 hover:border-zen-primary/60 transition-colors cursor-pointer"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>
                    {sortBy === "latest"
                      ? "Vừa cập nhật"
                      : sortBy === "views"
                      ? "Xem nhiều nhất"
                      : "Yêu thích nhất"}
                  </span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>

                {isSortDropdownOpen && (
                  <div
                    className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-40 animate-fade-in"
                    onClick={() => setIsSortDropdownOpen(false)}
                  >
                    {[
                      { id: "latest", label: "Vừa cập nhật" },
                      { id: "views", label: "Xem nhiều nhất" },
                      { id: "likes", label: "Yêu thích nhất" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSortBy(item.id as any);
                          setVisibleCount(ITEMS_PER_PAGE);
                        }}
                        className={`w-full text-left px-3.5 py-1.5 text-xs transition-colors cursor-pointer ${
                          sortBy === item.id
                            ? "bg-rose-50 text-zen-primary font-bold"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Color Tone Palette Filter Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-y border-gray-100">
            <div className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase tracking-wider pr-2 shrink-0">
              <Palette className="w-3.5 h-3.5 text-rose-500" />
              <span>Tone màu:</span>
            </div>
            {COLOR_TONE_OPTIONS.map((c) => {
              const active = colorToneFilter === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setColorToneFilter(c.id);
                    setVisibleCount(ITEMS_PER_PAGE);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all border cursor-pointer ${
                    active
                      ? "border-zen-primary bg-zen-primary text-white shadow-xs font-bold scale-105"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {c.id !== "all" && (
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: c.colorHex }}
                    />
                  )}
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search bar & active filter chips */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            {/* Live Search Input */}
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên mẫu thiệp, phong cách..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(ITEMS_PER_PAGE);
                }}
                className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm rounded-full border border-gray-200 bg-white focus:outline-none focus:border-zen-primary focus:ring-2 focus:ring-rose-100 transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Results count text */}
            <div className="text-xs text-gray-500 font-medium self-end sm:self-center">
              Tìm thấy <strong className="text-zen-primary">{filteredTemplates.length}</strong> mẫu thiệp
            </div>
          </div>
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
                onClick={() => {
                  setSelectedCategory("all");
                  setPageTypeFilter("ALL");
                  setTagFilter("all");
                  setColorToneFilter("all");
                  setShowFavoritesOnly(false);
                  setSearchQuery("");
                }}
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
