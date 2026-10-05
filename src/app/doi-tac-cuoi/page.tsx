"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  Gift,
  ExternalLink,
  Copy,
  Check,
  Star,
  Tag,
  Search,
  MapPin,
  ShieldCheck,
  Heart,
  PhoneCall,
  Send,
  CheckCircle2,
  Filter,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { WEDDING_PARTNERS, WEDDING_CATEGORIES, WeddingPartner } from "@/data/weddingPartners";

export default function WeddingPartnersPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal Đăng ký hợp tác
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [partnerFormData, setPartnerFormData] = useState({
    brandName: "",
    category: "studio",
    contactName: "",
    phone: "",
    email: "",
    website: "",
    message: "",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const filteredPartners = useMemo(() => {
    return WEDDING_PARTNERS.filter((partner) => {
      const matchCat = selectedCategory === "all" || partner.category === selectedCategory;
      const matchQuery =
        !searchQuery.trim() ||
        partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        partner.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        partner.discount.toLowerCase().includes(searchQuery.toLowerCase()) ||
        partner.locations.some((loc) => loc.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  const handlePartnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setIsPartnerModalOpen(false);
      setPartnerFormData({
        brandName: "",
        category: "studio",
        contactName: "",
        phone: "",
        email: "",
        website: "",
        message: "",
      });
      alert("Cảm ơn đối tác đã đăng ký! Đội ngũ phát triển ZenLove sẽ liên hệ trong 24h.");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfaf8] text-zen-black selection:bg-rose-100 selection:text-zen-primary">
      <Navbar />

      {/* Hero Banner Section */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 overflow-hidden bg-gradient-to-b from-rose-50/60 via-amber-50/30 to-[#fdfaf8]">
        <div className="absolute inset-0 bg-[radial-gradient(#e11d48_1px,transparent_1px)] [background-size:24px_24px] opacity-5 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100/80 border border-rose-200 text-zen-primary text-xs font-bold tracking-wide uppercase shadow-2xs mb-4">
            <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" />
            <span>HỆ SINH THÁI ĐỐI TÁC CƯỚI ZENLOVE</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Đặc Quyền Ưu Đãi Cho Cặp Đôi
          </h1>

          <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
            Tiết kiệm chi phí cưới với hàng loạt mã giảm giá độc quyền từ các thương hiệu hàng đầu: nhẫn cưới, studio ảnh, váy cưới, nhà hàng tiệc & tráp cưới.
          </p>

          {/* Quick value props */}
          <div className="mt-8 flex flex-wrap justify-center items-center gap-6 text-xs sm:text-sm text-gray-600 font-medium">
            <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur px-3.5 py-1.5 rounded-full border border-gray-100 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Đối tác uy tín hàng đầu</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur px-3.5 py-1.5 rounded-full border border-gray-100 shadow-2xs">
              <Gift className="w-4 h-4 text-rose-500" />
              <span>Giảm thêm đến 30% trực tiếp</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur px-3.5 py-1.5 rounded-full border border-gray-100 shadow-2xs">
              <Heart className="w-4 h-4 text-amber-500" />
              <span>Miễn phí 100% cho cô dâu chú rể</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm thương hiệu, dịch vụ, địa điểm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-zen-primary focus:ring-2 focus:ring-rose-50 transition-all bg-gray-50/50 focus:bg-white"
              />
            </div>

            {/* Total Results Count & Partner Register CTA */}
            <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4">
              <span className="text-xs text-gray-500">
                Tìm thấy <strong>{filteredPartners.length}</strong> đối tác
              </span>
              <button
                onClick={() => setIsPartnerModalOpen(true)}
                className="text-xs font-semibold px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Hợp tác cùng ZenLove</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Categories Tab Pill Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-4 scrollbar-none border-t border-gray-100 mt-4">
            {WEDDING_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? "bg-rose-500 text-white shadow-xs font-semibold"
                      : "bg-gray-100/80 text-gray-600 hover:bg-gray-200/80"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Partners Grid */}
        {filteredPartners.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPartners.map((partner) => {
              const isCopied = copiedCode === partner.couponCode;
              return (
                <div
                  key={partner.id}
                  className="bg-white rounded-3xl border border-gray-100 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* Partner Image / Thumbnail */}
                    <div className="relative h-48 overflow-hidden bg-gray-100">
                      <img
                        src={partner.coverUrl}
                        alt={partner.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-gray-800 shadow-2xs">
                          {partner.categoryName}
                        </span>
                      </div>

                      {/* Rating & Location */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                        <div className="flex items-center gap-1 font-semibold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{partner.rating} / 5.0</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-gray-200">
                          <MapPin className="w-3 h-3 text-rose-300" />
                          <span>{partner.locations.join(", ")}</span>
                        </div>
                      </div>
                    </div>

                    {/* Body Information */}
                    <div className="p-5">
                      <h3 className="font-bold text-gray-900 text-lg group-hover:text-zen-primary transition-colors">
                        {partner.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                        {partner.description}
                      </p>

                      {/* Voucher Card Container */}
                      <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-rose-50/80 to-amber-50/60 border border-rose-100/80 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                            <Tag className="w-3 h-3 shrink-0" />
                            <span className="truncate">{partner.discount}</span>
                          </div>
                          <div className="text-xs font-mono font-bold text-gray-800 mt-0.5 tracking-wider">
                            {partner.couponCode}
                          </div>
                        </div>

                        <button
                          onClick={() => handleCopyCode(partner.couponCode)}
                          className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            isCopied
                              ? "bg-emerald-500 text-white"
                              : "bg-white text-zen-primary border border-rose-200 hover:bg-rose-50 shadow-2xs"
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Đã chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Sao chép</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="p-5 pt-0">
                    <a
                      href={partner.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-zen-primary text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs group/btn cursor-pointer"
                    >
                      <span>Xem chi tiết & Áp dụng</span>
                      <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">Không tìm thấy đối tác phù hợp</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Vui lòng thử đổi từ khóa tìm kiếm hoặc chọn danh mục khác.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 text-zen-primary hover:bg-rose-100 transition-all cursor-pointer"
            >
              Xem tất cả đối tác
            </button>
          </div>
        )}

        {/* Banner Liên Hệ Đăng Ký Đối Tác Cưới Dưới Cùng */}
        <div className="mt-16 bg-gradient-to-r from-gray-900 via-gray-800 to-rose-950 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-xl">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.15),transparent)] pointer-events-none" />

          <div className="max-w-2xl relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-950/60 px-3 py-1 rounded-full border border-rose-800">
              Dành Cho Nhà Cung Cấp Dịch Vụ Cưới
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold mt-4">
              Tiếp Cận Hàng Vạn Cặp Đôi Chuẩn Bị Kết Hôn Mỗi Tháng
            </h2>
            <p className="text-sm text-gray-300 mt-3 leading-relaxed">
              Trở thành đối tác chính thức của ZenLove Wedding để đưa thương hiệu của bạn tiếp cận trực tiếp các cô dâu chú rể đang có nhu cầu đặt lịch nhẫn cưới, ảnh cưới, tiệc cưới và váy cưới thực tế.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 items-center">
              <button
                onClick={() => setIsPartnerModalOpen(true)}
                className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <span>Đăng ký trở thành Đối tác</span>
                <Send className="w-4 h-4" />
              </button>
              <a
                href="tel:0988888888"
                className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all border border-white/15 flex items-center gap-2"
              >
                <PhoneCall className="w-4 h-4 text-rose-400" />
                <span>Hotline: 0988.888.888</span>
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL: Đăng ký đối tác cưới */}
      {isPartnerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative">
            <h3 className="text-xl font-bold text-gray-900">
              Đăng Ký Đối Tác Cưới ZenLove
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Liên kết cùng ZenLove Wedding để tăng trưởng doanh số và nhận khách hàng cưới tiềm năng.
            </p>

            <form onSubmit={handlePartnerSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tên Thương Hiệu / Studio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: TuArt Wedding, White Palace..."
                  value={partnerFormData.brandName}
                  onChange={(e) =>
                    setPartnerFormData({ ...partnerFormData, brandName: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-zen-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Lĩnh vực dịch vụ *
                  </label>
                  <select
                    value={partnerFormData.category}
                    onChange={(e) =>
                      setPartnerFormData({ ...partnerFormData, category: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-zen-primary focus:outline-none bg-white"
                  >
                    <option value="jewelry">Nhẫn cưới</option>
                    <option value="studio">Studio ảnh</option>
                    <option value="dress">Váy cưới / Vest</option>
                    <option value="venue">Sảnh tiệc</option>
                    <option value="decor">Tráp & Hoa cưới</option>
                    <option value="honeymoon">Tuần trăng mật</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Người phụ trách *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Họ và tên"
                    value={partnerFormData.contactName}
                    onChange={(e) =>
                      setPartnerFormData({ ...partnerFormData, contactName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-zen-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0912..."
                    value={partnerFormData.phone}
                    onChange={(e) =>
                      setPartnerFormData({ ...partnerFormData, phone: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-zen-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email liên hệ *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="contact@brand.vn"
                    value={partnerFormData.email}
                    onChange={(e) =>
                      setPartnerFormData({ ...partnerFormData, email: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-zen-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Đề xuất chính sách ưu đãi cho cặp đôi
                </label>
                <textarea
                  rows={2}
                  placeholder="VD: Tặng voucher 2 triệu cho gói chụp, giảm 15% cho khách hàng ZenLove..."
                  value={partnerFormData.message}
                  onChange={(e) =>
                    setPartnerFormData({ ...partnerFormData, message: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-zen-primary focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPartnerModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={formSubmitted}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-zen-primary hover:bg-rose-600 text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {formSubmitted ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Đang gửi...</span>
                    </>
                  ) : (
                    <span>Gửi thông tin hợp tác</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
