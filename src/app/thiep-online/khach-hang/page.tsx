"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Search,
  Calendar,
  Eye,
  Heart,
  Share2,
  X,
  ExternalLink,
  Check,
  Smartphone,
  Plus,
  Trash2,
  Edit3,
  Users,
  Lock,
  Sparkles,
  Copy,
  AlertCircle,
  Clock,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingSupport from "@/components/FloatingSupport";
import { useAuth } from "@/context/AuthContext";
import {
  getAllCards,
  fetchCardsFromServer,
  deleteCard,
  WeddingCard,
} from "@/lib/weddingCardService";

export default function CustomerInvitationsPage() {
  const { user, isLoggedIn, openLoginModal } = useAuth();

  const [cards, setCards] = useState<WeddingCard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal share / guest link state
  const [guestModalCard, setGuestModalCard] = useState<WeddingCard | null>(null);
  const [guestNameInput, setGuestNameInput] = useState("");
  const [copiedGuestLink, setCopiedGuestLink] = useState(false);

  // Modal delete confirmation state
  const [deletingCard, setDeletingCard] = useState<WeddingCard | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deletePendingRef = useRef(false);

  // Load user cards
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    if (user?.id) {
      // 1. Tải trước từ cache cục bộ của user
      const localCards = getAllCards(user.id);
      if (isMounted) {
        setCards(localCards);
      }

      // 2. Đồng bộ mới nhất từ server
      fetchCardsFromServer(user.id)
        .then((remoteCards) => {
          if (isMounted && remoteCards) {
            setCards(remoteCards);
          }
        })
        .catch((err) => {
          console.warn("fetchCardsFromServer error:", err);
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    } else {
      // Chưa đăng nhập: không hiển thị thiệp mẫu của người khác
      setCards([]);
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Handle delete card
  const handleConfirmDelete = async () => {
    if (!deletingCard || deletePendingRef.current) return;
    deletePendingRef.current = true;
    setDeletePending(true);
    setDeleteError(null);
    try {
      await deleteCard(deletingCard.id);
      setCards((prev) => prev.filter((c) => c.id !== deletingCard.id));
      setDeletingCard(null);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Không thể xóa thiệp. Vui lòng thử lại.");
    } finally {
      deletePendingRef.current = false;
      setDeletePending(false);
    }
  };

  // Copy standard card URL
  const handleCopyLink = (card: WeddingCard, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/show/${card.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(card.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filtered cards
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      // 1. Status filter
      if (statusFilter === "published" && card.status !== "published") return false;
      if (statusFilter === "draft" && card.status !== "draft") return false;

      // 2. Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const groom = card.groom?.name?.toLowerCase() || "";
      const bride = card.bride?.name?.toLowerCase() || "";
      const cardName = card.name?.toLowerCase() || "";
      const slug = card.slug?.toLowerCase() || "";
      const venue = (card.events?.[0]?.venue || (card as any).venue || "").toLowerCase();
      return (
        cardName.includes(q) ||
        slug.includes(q) ||
        groom.includes(q) ||
        bride.includes(q) ||
        venue.includes(q)
      );
    });
  }, [cards, statusFilter, searchQuery]);

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
          <span className="font-semibold text-gray-900">Thiệp đã tạo</span>
        </nav>

        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-50 text-zen-primary text-xs font-bold uppercase tracking-wider mb-3 border border-rose-200/60 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Danh Sách Thiệp Đã Tạo Của Bạn</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Quản lý thiệp cưới của bạn
          </h1>

          <p className="mt-3.5 text-sm sm:text-base text-gray-600 leading-relaxed max-w-2xl mx-auto">
            {isLoggedIn
              ? `Xin chào ${user?.name || user?.email}! Dưới đây là danh sách toàn bộ các thiệp cưới online do chính bạn tạo và phát hành.`
              : "Xem lại, chỉnh sửa trong Studio và chia sẻ thiệp cưới online do tài khoản của bạn tạo."}
          </p>
        </div>

        {/* Chưa đăng nhập Alert Banner */}
        {!isLoggedIn && (
          <div className="max-w-3xl mx-auto mb-10 p-5 rounded-2xl bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 text-center sm:text-left">
              <div className="w-10 h-10 rounded-full bg-zen-primary/10 text-zen-primary flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">
                  Bạn đang ở chế độ khách vãng lai
                </h4>
                <p className="text-xs text-gray-600 mt-0.5">
                  Vui lòng đăng nhập để lưu trữ vĩnh viễn, đồng bộ đám mây và xem tất cả thiệp đã tạo của bạn.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openLoginModal("Vui lòng đăng nhập để xem và quản lý danh sách thiệp của bạn")}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-zen-primary hover:bg-[#d93849] text-white text-xs font-bold shadow-md transition-all shrink-0 cursor-pointer"
            >
              Đăng nhập ngay
            </button>
          </div>
        )}

        {/* Search, Filter & Action Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1 max-w-xl">
            {/* Search Box */}
            <div className="relative w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm thiệp theo tên cô dâu, chú rể, địa điểm..."
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

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-white border border-gray-200 p-1 rounded-full shrink-0 shadow-2xs w-full sm:w-auto justify-center">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  statusFilter === "all"
                    ? "bg-zen-primary text-white font-bold shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Tất cả ({cards.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("published")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  statusFilter === "published"
                    ? "bg-zen-primary text-white font-bold shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Đã xuất bản
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("draft")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  statusFilter === "draft"
                    ? "bg-zen-primary text-white font-bold shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Bản nháp
              </button>
            </div>
          </div>

          {/* Create New Card Button */}
          <Link
            href="/templates"
            className="w-full md:w-auto px-5 py-2.5 rounded-full bg-zen-primary hover:bg-[#d93849] text-white text-xs sm:text-sm font-bold shadow-md shadow-zen-primary/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo thiệp mới</span>
          </Link>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-500">
            <div className="w-8 h-8 border-3 border-zen-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs sm:text-sm">Đang tải danh sách thiệp của bạn...</p>
          </div>
        ) : filteredCards.length === 0 ? (
          /* Empty State */
          <div className="py-16 sm:py-20 px-4 text-center rounded-3xl bg-white border border-gray-100 shadow-sm max-w-2xl mx-auto">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-full bg-rose-50 text-zen-primary flex items-center justify-center shadow-inner">
              <Smartphone className="w-8 h-8 sm:w-10 sm:h-10 text-zen-primary/80" />
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              {cards.length === 0
                ? "Bạn chưa có thiệp cưới nào được tạo"
                : "Không tìm thấy thiệp nào phù hợp với bộ lọc"}
            </h3>

            <p className="text-xs sm:text-sm text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
              {cards.length === 0
                ? "Khám phá hơn 300+ mẫu thiệp cưới online tinh tế từ ZenLove và tự tay thiết kế tấm thiệp ý nghĩa cho ngày trọng đại của bạn."
                : "Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc để hiển thị đầy đủ thiệp đã tạo."}
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {cards.length === 0 ? (
                <Link
                  href="/templates"
                  className="px-6 py-2.5 rounded-full bg-zen-primary hover:bg-[#d93849] text-white text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-105"
                >
                  Khám phá kho mẫu thiệp
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                  className="px-5 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold transition-all"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredCards.map((card) => {
              const groomName = card.groom?.name || "Chú rể";
              const brideName = card.bride?.name || "Cô dâu";
              const rsvpCount = card.rsvps?.length || 0;
              const wishCount = card.wishes?.length || 0;
              const isPublished = card.status === "published";

              return (
                <div
                  key={card.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden group"
                >
                  {/* Top Image Preview */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                    <img
                      src={card.coverImage || "/assets/landing/hero-pc.webp"}
                      alt={card.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop";
                      }}
                    />

                    {/* Status Badge */}
                    <div className="absolute top-3 left-3 z-10">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                          isPublished
                            ? "bg-emerald-500 text-white"
                            : "bg-amber-400 text-gray-900"
                        }`}
                      >
                        {isPublished ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Đã xuất bản
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            Bản nháp
                          </>
                        )}
                      </span>
                    </div>

                    {/* Quick Stats Overlay */}
                    <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] text-white">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3 text-gray-300" />
                        {card.views || 0}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-rose-300" />
                        {rsvpCount}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3 text-red-400" />
                        {wishCount}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="font-bold text-gray-900 text-base line-clamp-1 group-hover:text-zen-primary transition-colors">
                          {card.name || `${groomName} & ${brideName}`}
                        </h3>
                      </div>

                      <div className="space-y-1 text-xs text-gray-500 mb-4">
                        {card.weddingDate && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-zen-primary shrink-0" />
                            <span>
                              Ngày cưới: <strong>{card.weddingDate}</strong>
                              {card.weddingTime && ` • ${card.weddingTime}`}
                            </span>
                          </div>
                        )}
                        {(card.events?.[0]?.venue || (card as any).venue) && (
                          <div className="flex items-center gap-1.5 line-clamp-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="truncate">{card.events?.[0]?.venue || (card as any).venue}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Grid */}
                    <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        {/* 1. View Card */}
                        <Link
                          href={`/show/${card.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-zen-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Xem thiệp</span>
                        </Link>

                        {/* 2. Edit Studio */}
                        <Link
                          href={`/design-template/${card.templateId || card.id}`}
                          className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Chỉnh sửa</span>
                        </Link>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* 3. Invite Guest */}
                        <button
                          type="button"
                          onClick={() => {
                            setGuestModalCard(card);
                            setGuestNameInput("");
                            setCopiedGuestLink(false);
                          }}
                          className="flex-1 px-3 py-2 rounded-xl border border-rose-200 text-zen-primary hover:bg-rose-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Mời khách</span>
                        </button>

                        {/* 4. Copy URL */}
                        <button
                          type="button"
                          onClick={(e) => handleCopyLink(card, e)}
                          title="Sao chép liên kết thiệp"
                          className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
                        >
                          {copiedId === card.id ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        {/* 5. Delete Card */}
                        <button
                          type="button"
                          onClick={() => setDeletingCard(card)}
                          title="Xóa thiệp"
                          className="p-2 rounded-xl border border-red-100 hover:bg-red-50 text-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL: MỜI KHÁCH VỚI TÊN RIÊNG */}
      {guestModalCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setGuestModalCard(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 text-zen-primary mb-3">
              <Share2 className="w-5 h-5" />
              <h3 className="font-extrabold text-gray-900 text-lg">
                Tạo Link Mời Khách Riêng
              </h3>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Nhập tên người nhận để in tên trang trọng lên con dấu xi sáp của thiệp cưới và điền sẵn vào mục xác nhận tham dự (RSVP).
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tên khách mời:
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Anh Tuấn & Chị Mai"
                  value={guestNameInput}
                  onChange={(e) => setGuestNameInput(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-300 focus:outline-none focus:border-zen-primary focus:ring-2 focus:ring-rose-100"
                />
              </div>

              {/* Generated Link Preview */}
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-[11px] font-bold text-gray-500 block mb-1">
                  Đường dẫn thiệp mời riêng:
                </span>
                <p className="text-xs text-gray-800 break-all font-mono">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}/show/${guestModalCard.slug}${
                        guestNameInput.trim()
                          ? `?to=${encodeURIComponent(guestNameInput.trim())}`
                          : ""
                      }`
                    : ""}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const link = `${window.location.origin}/show/${guestModalCard.slug}${
                      guestNameInput.trim()
                        ? `?to=${encodeURIComponent(guestNameInput.trim())}`
                        : ""
                    }`;
                    const msg = `💌 THIỆP MỜI THÀNH HÔN 💌\nTrân trọng kính mời: ${
                      guestNameInput.trim() || "Quý khách"
                    }\nTới dự ngày vui cùng chúng mình tại:\n👉 ${link}\nSự hiện diện của bạn là niềm hạnh phúc lớn nhất của chúng mình!`;
                    navigator.clipboard.writeText(msg);
                    setCopiedGuestLink(true);
                    setTimeout(() => setCopiedGuestLink(false), 2500);
                  }}
                  className="flex-1 py-3 px-4 rounded-full bg-zen-primary hover:bg-[#d93849] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  {copiedGuestLink ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Đã sao chép lời mời!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-white" />
                      <span>Sao chép lời mời gửi Zalo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: XÁC NHẬN XÓA THIỆP */}
      {deletingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto mb-3 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="font-extrabold text-gray-900 text-base mb-1">
              Xóa thiệp cưới này?
            </h3>

            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              Bạn có chắc chắn muốn xóa thiệp &quot;<strong>{deletingCard.name}</strong>&quot;? Hành động này sẽ xóa toàn bộ nội dung và danh sách khách RSVP đã ghi nhận.
            </p>

            {deleteError && <p role="alert" className="text-xs text-red-600 mb-3">{deleteError}</p>}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDeletingCard(null)}
                disabled={deletePending}
                className="flex-1 py-2.5 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletePending}
                className="flex-1 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                {deletePending ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <FloatingSupport />
    </div>
  );
}
