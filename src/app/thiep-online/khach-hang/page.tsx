"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
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
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CUSTOMER_INVITATIONS, CustomerInvitation } from "@/data/customerInvitations";

export default function CustomerInvitationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSort, setSelectedSort] = useState<"latest" | "views">("latest");
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const toggleFavorite = (slug: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  const filteredInvitations = useMemo(() => {
    return CUSTOMER_INVITATIONS.filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.groomName?.toLowerCase().includes(q) ||
        item.brideName?.toLowerCase().includes(q) ||
        item.venue?.toLowerCase().includes(q) ||
        item.date.includes(q)
      );
    }).sort((a, b) => {
      if (selectedSort === "views") {
        return (b.views || 0) - (a.views || 0);
      }
      return 0; // default order
    });
  }, [searchQuery, selectedSort]);

  return (
    <div className="min-h-screen flex flex-col bg-[#fffbfa] text-zen-black selection:bg-rose-100 selection:text-zen-primary">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-20">
        {/* Breadcrumb matching ZenLove */}
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-zen-primary text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chuyện tình yêu thật đẹp</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Bộ sưu tập thiệp online của khách hàng
          </h1>

          <p className="mt-3.5 text-sm sm:text-base text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Khám phá bộ sưu tập thiệp online cực đẹp và độc đáo của khách hàng tại{" "}
            <span className="text-zen-primary font-bold">ZenLove</span>! Hơn{" "}
            <strong className="text-gray-900 font-bold">2.568</strong> câu chuyện tình yêu đã được sẻ chia.
          </p>

          {/* Search & Filter Bar */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xl mx-auto">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm theo tên cô dâu, chú rể, địa điểm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                <option value="latest">Mới nhất</option>
                <option value="views">Xem nhiều nhất</option>
              </select>
            </div>
          </div>
        </div>

        {/* Gallery Cards Grid (4 columns on desktop, 2 on mobile) */}
        {filteredInvitations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7">
            {filteredInvitations.map((item) => {
              const isFav = !!favorites[item.slug];
              return (
                <div
                  key={item.slug}
                  className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100/80 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col hover:-translate-y-1"
                >
                  {/* Image container with 4:3 / portrait aspect */}
                  <div className="relative aspect-4/3 overflow-hidden bg-gray-100">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <Link
                        href={`/show/${item.slug}`}
                        className="w-full py-2.5 px-4 rounded-xl bg-white/95 backdrop-blur-xs text-zen-primary text-xs font-bold text-center flex items-center justify-center gap-2 shadow-lg hover:bg-white transition-all transform translate-y-2 group-hover:translate-y-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem thiệp cưới</span>
                      </Link>
                    </div>

                    {/* Favorite Button */}
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(item.slug, e)}
                      className={`absolute top-3 right-3 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
                        isFav
                          ? "bg-rose-500 text-white shadow-md scale-110"
                          : "bg-white/80 text-gray-600 hover:bg-white hover:text-zen-primary"
                      }`}
                      title="Yêu thích"
                    >
                      <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
                    </button>

                    {/* Views Badge */}
                    {item.views && (
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-[11px] font-semibold text-white/90 flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{item.views.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3
                        className="font-bold text-gray-900 text-sm sm:text-base line-clamp-1 group-hover:text-zen-primary transition-colors"
                        title={item.title}
                      >
                        {item.title}
                      </h3>

                      {(item.groomName || item.brideName) && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                          Cô dâu & Chú rể:{" "}
                          <span className="font-semibold text-gray-700">
                            {item.groomName} & {item.brideName}
                          </span>
                        </p>
                      )}

                      {item.venue && (
                        <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">
                          {item.venue}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Calendar className="w-3.5 h-3.5 text-zen-primary" />
                        <span>{item.date}</span>
                      </div>

                      <Link
                        href={`/show/${item.slug}`}
                        className="font-bold text-zen-primary hover:underline flex items-center gap-1"
                      >
                        <span>Xem thiệp</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
              onClick={() => setSearchQuery("")}
              className="mt-4 px-5 py-2 rounded-full bg-zen-primary text-white text-xs font-bold hover:bg-[#d93849] transition-colors shadow-xs"
            >
              Xem tất cả thiệp
            </button>
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
                Tạo thiệp mẫu "Hồng Phong"
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
