"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Search,
  Calendar,
  Eye,
  Heart,
  ArrowRight,
  Sparkles,
  Share2,
  X,
  Filter,
  Music,
  Palette,
  ExternalLink,
  Layers,
  Check,
  Smartphone,
  ChevronDown,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CUSTOMER_INVITATIONS, CustomerInvitation } from "@/data/customerInvitations";

export default function CustomerInvitationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSort, setSelectedSort] = useState<"latest" | "views" | "nodes">("latest");
  const [activeFilter, setActiveFilter] = useState<"all" | "has_music" | "high_nodes" | "thanh_hon" | "vu_quy">("all");
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<CustomerInvitation | null>(null);
  const [displayCount, setDisplayCount] = useState<number>(24);

  const toggleFavorite = (slug: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  const handleCopyLink = (slug: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/show/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const filteredInvitations = useMemo(() => {
    return CUSTOMER_INVITATIONS.filter((item) => {
      // 1. Filter by category
      if (activeFilter === "has_music" && !item.musicTitle) return false;
      if (activeFilter === "high_nodes" && (item.nodesCount || 0) < 60) return false;
      if (activeFilter === "thanh_hon" && !item.title.toLowerCase().includes("thành hôn")) return false;
      if (activeFilter === "vu_quy" && !item.title.toLowerCase().includes("vu quy")) return false;

      // 2. Filter by search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.title.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q) ||
        item.groomName?.toLowerCase().includes(q) ||
        item.brideName?.toLowerCase().includes(q) ||
        item.venue?.toLowerCase().includes(q) ||
        item.date.includes(q)
      );
    }).sort((a, b) => {
      if (selectedSort === "views") {
        return (b.views || 0) - (a.views || 0);
      }
      if (selectedSort === "nodes") {
        return (b.nodesCount || 0) - (a.nodesCount || 0);
      }
      return 0; // default order
    });
  }, [searchQuery, selectedSort, activeFilter]);

  const visibleInvitations = useMemo(() => {
    return filteredInvitations.slice(0, displayCount);
  }, [filteredInvitations, displayCount]);

  const hasMore = displayCount < filteredInvitations.length;

  return (
    <div className="min-h-screen flex flex-col bg-[#fffbfa] text-zen-black selection:bg-rose-100 selection:text-zen-primary">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-20">
        {/* Breadcrumb */}
        <nav
          className="flex items-center justify-center gap-1.5 text-xs text-gray-500 mb-6"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-zen-primary transition-colors">
            Trang chủ
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-semibold text-gray-900">Thiệp online của khách hàng</span>
        </nav>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-50 text-zen-primary text-xs font-bold uppercase tracking-wider mb-3 border border-rose-200/60 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kho Thiệp Khách Hàng Clone Thực Tế</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Bộ sưu tập thiệp online của khách hàng
          </h1>

          <p className="mt-3.5 text-sm sm:text-base text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Khám phá <strong className="text-zen-primary font-bold">{CUSTOMER_INVITATIONS.length}</strong> mẫu thiệp cưới thực tế đã clone đầy đủ hiệu ứng, nhạc nền và ảnh chất lượng cao từ ZenLove. Bạn có thể xem trực tiếp hoặc tùy biến ngay!
          </p>

          {/* Search & Filter Bar */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-2xl mx-auto">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm theo tên cô dâu, chú rể, địa điểm, mã thiệp..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setDisplayCount(24);
                }}
                className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-full border border-gray-200 bg-white focus:outline-none focus:border-zen-primary focus:ring-2 focus:ring-rose-100 shadow-2xs transition-all"
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

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value as any)}
                className="px-4 py-2.5 text-xs rounded-full border border-gray-200 bg-white text-gray-700 font-medium focus:outline-none focus:border-zen-primary shadow-2xs cursor-pointer"
              >
                <option value="latest">Mới cập nhật</option>
                <option value="views">Xem nhiều nhất</option>
                <option value="nodes">Nhiều chi tiết nhất</option>
              </select>
            </div>
          </div>

          {/* Quick Filter Tags */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {[
              { id: "all", label: `Tất cả (${CUSTOMER_INVITATIONS.length})` },
              { id: "has_music", label: "Có nhạc nền 🎵" },
              { id: "high_nodes", label: "Nhiều hiệu ứng ✨" },
              { id: "thanh_hon", label: "Lễ Thành Hôn" },
              { id: "vu_quy", label: "Lễ Vu Quy" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setActiveFilter(f.id as any);
                  setDisplayCount(24);
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  activeFilter === f.id
                    ? "bg-zen-primary text-white shadow-xs"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-zen-primary/50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Cards Grid */}
        {visibleInvitations.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7">
              {visibleInvitations.map((item) => {
                const isFav = !!favorites[item.slug];
                const isCopied = copiedSlug === item.slug;

                return (
                  <div
                    key={item.slug}
                    className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100/90 shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col hover:-translate-y-1.5"
                  >
                    {/* Image container */}
                    <div className="relative aspect-[4/3] w-full min-h-[200px] overflow-hidden bg-stone-100">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        loading="lazy"
                        onError={(e) => {
                          // Fallback to placeholder if image fails
                          (e.target as HTMLImageElement).src =
                            "https://content.pancake.vn/1/s1200x650/fwebp90/c4/93/41/6c/26a2152470d62cafcfd166ba886705656a2bf74f8d13a1c10a49934a-w:2560-h:1706-l:246335-t:image/jpeg.jpg";
                        }}
                      />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                        {item.views !== undefined && (
                          <div className="px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-[10px] font-semibold text-white flex items-center gap-1 shadow-xs">
                            <Eye className="w-3 h-3" />
                            <span>{item.views.toLocaleString()}</span>
                          </div>
                        )}
                        {item.nodesCount && item.nodesCount > 0 && (
                          <div className="px-2 py-0.5 rounded-full bg-rose-600/80 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1 shadow-xs">
                            <Layers className="w-2.5 h-2.5" />
                            <span>{item.nodesCount} khối</span>
                          </div>
                        )}
                      </div>

                      {/* Top Right Controls */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                        <button
                          type="button"
                          onClick={(e) => handleCopyLink(item.slug, e)}
                          className="w-8 h-8 rounded-full bg-white/85 backdrop-blur-md text-gray-700 hover:text-zen-primary hover:bg-white flex items-center justify-center transition-all shadow-xs"
                          title="Sao chép liên kết thiệp"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                          ) : (
                            <Share2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(item.slug, e)}
                          className={`w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all shadow-xs ${
                            isFav
                              ? "bg-rose-500 text-white scale-105"
                              : "bg-white/85 text-gray-700 hover:bg-white hover:text-zen-primary"
                          }`}
                          title="Yêu thích"
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-current" : ""}`} />
                        </button>
                      </div>

                      {/* Hover Overlay with Action Buttons */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 gap-2">
                        <Link
                          href={`/show/${item.slug}`}
                          className="w-full py-2 px-3 rounded-xl bg-white text-zen-primary text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-md hover:bg-rose-50 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem thiệp online thực tế</span>
                        </Link>
                        <div className="grid grid-cols-2 gap-1.5">
                          <Link
                            href={`/design-template/${item.slug}`}
                            className="py-1.5 px-2 rounded-lg bg-zen-primary text-white text-[11px] font-bold text-center flex items-center justify-center gap-1 shadow-xs hover:bg-[#d93849] transition-all"
                          >
                            <Palette className="w-3 h-3" />
                            <span>Tùy biến</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => setPreviewItem(item)}
                            className="py-1.5 px-2 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold text-center flex items-center justify-center gap-1 hover:bg-black/80 transition-all"
                          >
                            <Smartphone className="w-3 h-3" />
                            <span>Xem trước</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3
                          className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-zen-primary transition-colors"
                          title={item.title}
                        >
                          {item.title}
                        </h3>

                        {(item.groomName || item.brideName) && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                            Cô dâu & Chú rể:{" "}
                            <span className="font-semibold text-gray-800">
                              {item.groomName} {item.brideName ? `& ${item.brideName}` : ""}
                            </span>
                          </p>
                        )}

                        {item.venue && (
                          <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">
                            📍 {item.venue}
                          </p>
                        )}

                        {item.musicTitle && (
                          <p className="text-[11px] text-rose-500 mt-1 line-clamp-1 flex items-center gap-1 font-medium">
                            <Music className="w-3 h-3 shrink-0" />
                            <span>{item.musicTitle}</span>
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Calendar className="w-3.5 h-3.5 text-zen-primary" />
                          <span>{item.date}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/design-template/${item.slug}`}
                            className="font-semibold text-xs text-gray-600 hover:text-zen-primary hover:underline"
                            title="Tùy biến trong Canvas Editor"
                          >
                            Dùng mẫu
                          </Link>
                          <Link
                            href={`/show/${item.slug}`}
                            className="font-bold text-zen-primary hover:underline flex items-center gap-0.5"
                          >
                            <span>Xem</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="mt-12 text-center">
                <button
                  type="button"
                  onClick={() => setDisplayCount((prev) => prev + 24)}
                  className="px-8 py-3 rounded-full bg-white border border-gray-200 text-gray-800 text-xs sm:text-sm font-bold shadow-xs hover:border-zen-primary hover:text-zen-primary hover:shadow-md transition-all inline-flex items-center gap-2 group"
                >
                  <span>Xem thêm thiệp cưới khác ({filteredInvitations.length - displayCount} mẫu còn lại)</span>
                  <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-20 text-center bg-white rounded-3xl border border-gray-100 p-8 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-zen-primary flex items-center justify-center mx-auto mb-3">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">
              Không tìm thấy thiệp cưới phù hợp
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto">
              Hãy thử tìm kiếm bằng từ khóa khác hoặc xóa bộ lọc để xem tất cả thiệp cưới của khách hàng.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setActiveFilter("all");
              }}
              className="mt-4 px-5 py-2 rounded-full bg-zen-primary text-white text-xs font-bold hover:bg-[#d93849] transition-colors shadow-xs"
            >
              Xem tất cả thiệp
            </button>
          </div>
        )}

        {/* Quick Phone Preview Modal */}
        {previewItem && (
          <div
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setPreviewItem(null)}
          >
            <div
              className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-3.5 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <h4 className="text-white text-sm font-bold truncate">
                    {previewItem.title}
                  </h4>
                  <p className="text-stone-400 text-xs truncate">
                    Mã thiệp: {previewItem.slug}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/show/${previewItem.slug}`}
                    target="_blank"
                    className="p-1.5 rounded-lg bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 transition-colors"
                    title="Mở toàn màn hình tab mới"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setPreviewItem(null)}
                    className="p-1.5 rounded-lg bg-stone-800 text-stone-400 hover:text-white hover:bg-stone-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Phone Frame Iframe */}
              <div className="flex-1 bg-stone-950 p-2 overflow-hidden flex items-center justify-center">
                <div className="w-[375px] max-w-full h-[620px] max-h-[70vh] rounded-2xl overflow-hidden shadow-2xl border-2 border-stone-700 bg-white">
                  <iframe
                    src={`/show/${previewItem.slug}`}
                    title={previewItem.title}
                    className="w-full h-full border-0"
                  />
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="p-3 bg-stone-950 border-t border-stone-800 flex items-center justify-between gap-2">
                <Link
                  href={`/design-template/${previewItem.slug}`}
                  className="flex-1 py-2 rounded-xl bg-zen-primary text-white text-xs font-bold text-center hover:bg-[#d93849] transition-all flex items-center justify-center gap-1.5"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Dùng & Tùy biến mẫu này</span>
                </Link>
                <Link
                  href={`/design-template/${previewItem.slug}`}
                  className="py-2 px-3 rounded-xl bg-stone-800 text-stone-200 text-xs font-semibold hover:bg-stone-700 transition-all"
                >
                  Mở Studio
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Banner Call to Action */}
        <section className="mt-20 rounded-3xl bg-gradient-to-br from-rose-50 via-pink-50/50 to-amber-50/40 border border-rose-100 p-8 sm:p-12 text-center relative overflow-hidden shadow-xs">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zen-primary/10 text-zen-primary text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Miễn phí 100%</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Tạo thiệp cưới online đẹp lung linh cho đám cưới của bạn
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 max-w-lg mx-auto leading-relaxed">
              Chỉ mất 5 phút để tạo thiệp cưới online chuẩn gu riêng của hai bạn. Dễ dàng chia sẻ qua Zalo, Messenger, Facebook kèm nhạc nền lãng mạn.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/templates"
                className="w-full sm:w-auto px-7 py-3 rounded-full bg-zen-primary text-white text-xs sm:text-sm font-bold shadow-md hover:bg-[#d93849] transition-all flex items-center justify-center gap-2 group"
              >
                <span>Khám phá 200+ mẫu thiệp</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/design-template/8c5055d8-30db-4b38-8831-e11063e3d352"
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-white border border-gray-200 text-gray-700 text-xs sm:text-sm font-bold hover:bg-gray-50 transition-all text-center shadow-2xs"
              >
                Mở Studio Thiết Kế
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
