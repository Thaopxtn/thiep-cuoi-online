"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Edit3,
  Eye,
  Copy,
  Check,
  Share2,
  QrCode,
  Trash2,
  Calendar,
  Users,
  MessageSquare,
  Gift,
  Settings,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { getAllCards, deleteCard, WeddingCard } from "@/lib/weddingCardService";

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"cards" | "rsvp" | "wishes" | "settings">("cards");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Live operational cards state
  const [myCards, setMyCards] = useState<WeddingCard[]>([]);

  useEffect(() => {
    setMyCards(getAllCards());
  }, []);

  // Aggregated RSVPs from all user cards
  const rsvpsList = myCards.flatMap((card) =>
    (card.rsvps || []).map((r) => ({
      ...r,
      cardName: card.name,
      cardSlug: card.slug,
    }))
  );

  // Aggregated Wishes from all user cards
  const wishesList = myCards.flatMap((card) =>
    (card.wishes || []).map((w) => ({
      ...w,
      cardName: card.name,
      cardSlug: card.slug,
    }))
  );

  const copyLink = (cardId: string, slug: string) => {
    const url = `${window.location.origin}/show/${slug}`;
    navigator.clipboard?.writeText(url);
    setCopiedId(cardId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteCard = (cardId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa thiệp cưới này không?")) {
      deleteCard(cardId);
      setMyCards(getAllCards());
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfaf8] text-zen-black selection:bg-rose-100 selection:text-zen-primary">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-20">
        {/* Top User Greeting & Stats Bar */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400 to-zen-primary text-white flex items-center justify-center text-xl font-bold shadow-md overflow-hidden">
              {user ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                "ZL"
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {user ? user.name : "Người dùng ZenLove"}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-bold border border-emerald-200">
                  Tài khoản VIP
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {user ? user.email : "zenlove.user@gmail.com"} • Quản lý tất cả thiệp cưới của bạn tại đây
              </p>
            </div>
          </div>

          <Link
            href="/templates"
            className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-zen-primary text-white text-xs sm:text-sm font-bold shadow-md hover:bg-[#d93849] transition-all flex items-center justify-center gap-2 shrink-0 group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            <span>Tạo thiệp cưới mới</span>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-px mb-6 overflow-x-auto scrollbar-none">
          {[
            { id: "cards", label: "Thiệp cưới của tôi", icon: Calendar, count: myCards.length },
            { id: "rsvp", label: "Khách mời & Xác nhận (RSVP)", icon: Users, count: rsvpsList.length },
            { id: "wishes", label: "Sổ lưu bút & Lời chúc", icon: MessageSquare, count: wishesList.length },
            { id: "settings", label: "Cài đặt tài khoản", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? "border-zen-primary text-zen-primary bg-rose-50/50 rounded-t-xl"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      isActive ? "bg-rose-100 text-zen-primary" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: THIỆP CƯỚI CỦA TÔI */}
        {activeTab === "cards" && (
          <div className="space-y-6">
            {myCards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myCards.map((card) => (
                  <div
                    key={card.id}
                    className="bg-white rounded-3xl border border-gray-100 shadow-xs hover:shadow-lg transition-all p-5 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start gap-4">
                        <div className="w-20 h-28 rounded-xl overflow-hidden shrink-0 bg-gray-100 border border-gray-200">
                          <img
                            src={card.coverImage || (card as any).thumbnail}
                            alt={card.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                card.status === "published"
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                  : "bg-amber-50 text-amber-600 border border-amber-200"
                              }`}
                            >
                              {card.status === "published" ? "🟢 Đã xuất bản" : "🟡 Đang soạn"}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              Mẫu: {card.templateName}
                            </span>
                          </div>

                          <h3 className="font-bold text-gray-900 text-sm sm:text-base mt-1 line-clamp-1">
                            {card.name}
                          </h3>

                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-zen-primary" />
                            <span>Ngày cưới: {card.weddingDate}</span>
                          </p>

                          {/* Stats counter */}
                          <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5 text-gray-400" />
                              <strong>{card.views}</strong> lượt xem
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-gray-400" />
                              <strong>{Array.isArray(card.rsvps) ? card.rsvps.length : (card as any).rsvps || 0}</strong> xác nhận
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                              <strong>{Array.isArray(card.wishes) ? card.wishes.length : (card as any).wishes || 0}</strong> lời chúc
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions Bar */}
                    <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/design-template/${card.id}`}
                          className="px-3.5 py-1.5 rounded-xl bg-zen-primary text-white text-xs font-bold hover:bg-[#d93849] transition-colors flex items-center gap-1.5 shadow-2xs"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Chỉnh sửa mẫu</span>
                        </Link>

                        <Link
                          href={`/show/${card.slug}`}
                          target="_blank"
                          className="px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-gray-200"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem thiệp</span>
                        </Link>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => copyLink(card.id, card.slug)}
                          className="p-2 rounded-xl text-gray-500 hover:text-zen-primary hover:bg-rose-50 transition-colors"
                          title="Sao chép đường dẫn thiệp"
                        >
                          {copiedId === card.id ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCard(card.id)}
                          className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Xóa thiệp"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center bg-white rounded-3xl border border-gray-100 p-8 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-rose-50 text-zen-primary flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">
                  Bạn chưa tạo thiệp cưới nào
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto">
                  Khám phá kho 200+ mẫu thiệp cưới online đẹp lung linh và bắt đầu thiết kế thiệp riêng của bạn ngay.
                </p>
                <Link
                  href="/templates"
                  className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-zen-primary text-white text-xs font-bold shadow-md hover:bg-[#d93849] transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Chọn mẫu và tạo ngay</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: KHÁCH MỜI RSVP */}
        {activeTab === "rsvp" && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Danh sách khách mời đã xác nhận tham dự
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tổng cộng {rsvpsList.length} phản hồi từ khách mời
                </p>
              </div>
              <button
                type="button"
                onClick={() => alert("Đang xuất file Excel danh sách khách mời...")}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất file Excel</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 text-gray-500 font-semibold uppercase tracking-wider text-[11px] border-b border-gray-100">
                  <tr>
                    <th className="py-3.5 px-5">Tên khách mời</th>
                    <th className="py-3.5 px-5">Số điện thoại</th>
                    <th className="py-3.5 px-5">Trạng thái tham dự</th>
                    <th className="py-3.5 px-5 text-center">Số người</th>
                    <th className="py-3.5 px-5">Thời gian gửi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {rsvpsList.map((rsvp) => (
                    <tr key={rsvp.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-gray-900">{rsvp.name}</td>
                      <td className="py-3.5 px-5 text-gray-600">{rsvp.phone}</td>
                      <td className="py-3.5 px-5">
                        {rsvp.attending ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Có tham dự</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-gray-500 font-semibold bg-gray-100 px-2.5 py-1 rounded-full text-[11px]">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Không thể đến</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-center font-bold">
                        {rsvp.attending ? rsvp.guests : "-"}
                      </td>
                      <td className="py-3.5 px-5 text-gray-400">
                        {rsvp.createdAt || (rsvp as any).date || "Vừa xong"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SỔ LƯU BÚT & LỜI CHÚC */}
        {activeTab === "wishes" && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Lời chúc phúc từ bạn bè và người thân
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Tất cả những thông điệp yêu thương gửi đến cặp đôi
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wishesList.map((wish) => (
                <div
                  key={wish.id}
                  className="bg-rose-50/30 rounded-2xl p-4 border border-rose-100 shadow-2xs flex flex-col justify-between"
                >
                  <p className="text-xs sm:text-sm text-gray-700 italic font-serif leading-relaxed">
                    "{wish.content}"
                  </p>
                  <div className="mt-3 pt-2.5 border-t border-rose-100/60 flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-900">{wish.name || (wish as any).sender}</span>
                    <span className="text-gray-400 text-[11px]">{wish.createdAt || (wish as any).time || "Vừa gửi"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: CÀI ĐẶT TÀI KHOẢN */}
        {activeTab === "settings" && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 sm:p-8 max-w-2xl">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Thông tin tài khoản Google
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Quản lý hồ sơ và các tùy chọn bảo mật tài khoản
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-500 font-semibold mb-1">Họ và tên</label>
                <input
                  type="text"
                  disabled
                  value={user ? user.name : "Người dùng ZenLove"}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 font-medium"
                />
              </div>

              <div>
                <label className="block text-gray-500 font-semibold mb-1">Địa chỉ Email</label>
                <input
                  type="email"
                  disabled
                  value={user ? user.email : "zenlove.user@gmail.com"}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 font-medium"
                />
              </div>

              <div>
                <label className="block text-gray-500 font-semibold mb-1">Gói dịch vụ đang sử dụng</label>
                <div className="p-4 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-zen-primary">Gói Trọn Đời (VIP Unlimited)</span>
                    <p className="text-[11px] text-gray-500 mt-0.5">Không giới hạn tạo thiệp, hiệu ứng cao cấp và xóa logo</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-white px-3 py-1 rounded-full shadow-2xs border border-emerald-100">
                    Đang hoạt động
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
