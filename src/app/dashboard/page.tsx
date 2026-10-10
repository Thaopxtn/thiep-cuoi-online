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
  Lock,
  Shield,
  LogOut,
  KeyRound,
  AlertCircle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WeddingPerksWidget from "@/components/dashboard/WeddingPerksWidget";
import { useAuth } from "@/context/AuthContext";
import { getAllCards, deleteCard, fetchCardsFromServer, WeddingCard } from "@/lib/weddingCardService";

export default function DashboardPage() {
  const { user, updatePassword, updateProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"cards" | "rsvp" | "wishes" | "settings">("cards");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Personalized Guest Link Modal state
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [selectedCardForGuest, setSelectedCardForGuest] = useState<WeddingCard | null>(null);
  const [guestLinkInput, setGuestLinkInput] = useState("");
  const [copiedGuestLink, setCopiedGuestLink] = useState(false);

  // Live operational cards state
  const [myCards, setMyCards] = useState<WeddingCard[]>([]);

  // Account Settings state
  const [profileName, setProfileName] = useState(user?.name || "");
  const [savingName, setSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (user?.name) {
      setProfileName(user.name);
    }
  }, [user]);

  useEffect(() => {
    // Tải trước từ cache cục bộ của user này
    setMyCards(getAllCards(user?.id));

    // Tải đồng bộ mới nhất từ Supabase Cloud theo tài khoản đăng nhập
    if (user?.id) {
      fetchCardsFromServer(user.id).then((remoteCards) => {
        setMyCards(remoteCards || []);
      });
    } else {
      setMyCards(getAllCards());
    }
  }, [user?.id]);

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

  const handleDeleteCard = async (cardId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa thiệp cưới này không?")) {
      deleteCard(cardId);
      if (user?.id) {
        try {
          await fetch(`/api/cards/${cardId}?userId=${encodeURIComponent(user.id)}`, {
            method: "DELETE",
            headers: { "x-user-id": user.id },
          });
        } catch (e) {}
      }
      setMyCards(getAllCards(user?.id));
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
            {/* Widget Đối Tác & Ưu Đãi Cưới Độc Quyền */}
            <WeddingPerksWidget />

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

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCardForGuest(card);
                            setGuestLinkInput("");
                            setIsGuestModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-zen-primary text-xs font-bold transition-colors flex items-center gap-1.5 border border-rose-200 cursor-pointer"
                          title="Tạo đường dẫn thiệp mời riêng có tên từng khách"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Mời khách</span>
                        </button>
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
              <a
                href="/api/cards/export-all"
                download
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất file Excel (CSV)</span>
              </a>
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

        {/* TAB 4: CÀI ĐẶT VÀ BẢO MẬT TÀI KHOẢN */}
        {activeTab === "settings" && (
          <div className="space-y-6 max-w-2xl">
            {/* Mục 1: Thông tin hồ sơ cá nhân */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-zen-primary flex items-center justify-center font-bold">
                  👤
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Thông tin tài khoản
                  </h3>
                  <p className="text-xs text-gray-500">
                    Quản lý thông tin định danh và phương thức liên kết
                  </p>
                </div>
              </div>

              {nameMessage && (
                <div
                  className={`p-3 mb-4 rounded-xl text-xs flex items-center gap-2 ${
                    nameMessage.type === "success"
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                      : "bg-rose-50 border border-rose-200 text-rose-700"
                  }`}
                >
                  {nameMessage.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <span>{nameMessage.text}</span>
                </div>
              )}

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!profileName.trim()) return;
                  setSavingName(true);
                  setNameMessage(null);
                  const res = await updateProfile(profileName.trim());
                  setSavingName(false);
                  setNameMessage({
                    type: res.success ? "success" : "error",
                    text: res.message || "Cập nhật thành công!",
                  });
                }}
                className="space-y-4 text-xs"
              >
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Họ và tên hiển thị</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-800 font-medium focus:outline-none focus:border-zen-primary transition-colors"
                      placeholder="Nhập họ và tên của bạn"
                    />
                    <button
                      type="submit"
                      disabled={savingName}
                      className="px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs transition-colors shrink-0 disabled:opacity-50"
                    >
                      {savingName ? "Đang lưu..." : "Lưu họ tên"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Địa chỉ Email</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || "thaoh.user@gmail.com"}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 font-medium cursor-not-allowed"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Email dùng để đăng nhập và nhận thông báo khách mời mừng cưới.
                  </p>
                </div>

                <div className="pt-2">
                  <label className="block text-gray-700 font-bold mb-1">Phương thức xác thực</label>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-[11px] border border-blue-200">
                      <Shield className="w-3.5 h-3.5 text-blue-600" />
                      <span>{user?.provider === "email" ? "Tài khoản Email & Mật khẩu" : "Tài khoản Google OAuth (Đã liên kết)"}</span>
                    </span>
                  </div>
                </div>
              </form>
            </div>

            {/* Mục 2: Quản lý Mật khẩu & Bảo mật */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Bảo mật & Quản lý mật khẩu
                  </h3>
                  <p className="text-xs text-gray-500">
                    Đặt mật khẩu mới để có thể đăng nhập bằng cả Email và Mật khẩu
                  </p>
                </div>
              </div>

              {passwordMessage && (
                <div
                  className={`p-3 mb-4 rounded-xl text-xs flex items-center gap-2 ${
                    passwordMessage.type === "success"
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                      : "bg-rose-50 border border-rose-200 text-rose-700"
                  }`}
                >
                  {passwordMessage.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <span>{passwordMessage.text}</span>
                </div>
              )}

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newPassword || newPassword.length < 6) {
                    setPasswordMessage({ type: "error", text: "Mật khẩu phải có tối thiểu 6 ký tự" });
                    return;
                  }
                  if (newPassword !== confirmPassword) {
                    setPasswordMessage({ type: "error", text: "Mật khẩu xác nhận không khớp" });
                    return;
                  }
                  setSavingPassword(true);
                  setPasswordMessage(null);
                  const res = await updatePassword(newPassword);
                  setSavingPassword(false);
                  if (res.success) {
                    setPasswordMessage({ type: "success", text: "Đã cập nhật mật khẩu mới thành công!" });
                    setNewPassword("");
                    setConfirmPassword("");
                  } else {
                    setPasswordMessage({ type: "error", text: res.message || "Không thể cập nhật mật khẩu" });
                  }
                }}
                className="space-y-4 text-xs"
              >
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Mật khẩu mới</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="Nhập ít nhất 6 ký tự"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-800 font-medium focus:outline-none focus:border-zen-primary transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Xác nhận mật khẩu mới</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-800 font-medium focus:outline-none focus:border-zen-primary transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="px-5 py-2.5 rounded-xl bg-zen-primary hover:bg-[#d93849] text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {savingPassword ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>Lưu mật khẩu</span>
                  </button>

                  <button
                    type="button"
                    onClick={logout}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-rose-600 font-bold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= MODAL TẠO LINK MỜI RIÊNG CHO KHÁCH TỪ DASHBOARD ================= */}
        {isGuestModalOpen && selectedCardForGuest && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-gray-100 flex flex-col gap-4 animate-scale-in">
              <div className="flex items-center justify-between border-b pb-3 border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💌</span>
                  <h3 className="text-base font-bold text-gray-900">
                    Tạo Link Thiệp Mời Riêng
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGuestModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-lg leading-none p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs text-gray-600 leading-relaxed">
                Thiệp: <strong className="text-gray-900">{selectedCardForGuest.name}</strong>
                <p className="mt-1 text-gray-500">
                  Nhập tên khách mời để thiệp tự động in tên khách lên phong bì sáp hoàng gia và điền sẵn vào mục xác nhận tham dự (RSVP).
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Tên khách mời:</label>
                <input
                  type="text"
                  placeholder="VD: Anh Tuấn & Bạn gái, Gia đình Bác Hùng..."
                  value={guestLinkInput}
                  onChange={(e) => setGuestLinkInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:border-zen-primary focus:ring-1 focus:ring-zen-primary"
                />
              </div>

              {/* Generated link preview */}
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-1">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Đường dẫn gửi khách:
                </span>
                <p className="text-xs font-mono text-gray-800 break-all select-all">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}/show/${selectedCardForGuest.slug}${
                        guestLinkInput.trim()
                          ? `?to=${encodeURIComponent(guestLinkInput.trim())}`
                          : ""
                      }`
                    : ""}
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window === "undefined") return;
                    const link = `${window.location.origin}/show/${selectedCardForGuest.slug}${
                      guestLinkInput.trim()
                        ? `?to=${encodeURIComponent(guestLinkInput.trim())}`
                        : ""
                    }`;
                    navigator.clipboard.writeText(link);
                    setCopiedGuestLink(true);
                    setTimeout(() => setCopiedGuestLink(false), 2500);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-zen-primary hover:bg-[#d93849] text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {copiedGuestLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedGuestLink ? "Đã sao chép link!" : "Sao chép link mời"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (typeof window === "undefined") return;
                    const link = `${window.location.origin}/show/${selectedCardForGuest.slug}${
                      guestLinkInput.trim()
                        ? `?to=${encodeURIComponent(guestLinkInput.trim())}`
                        : ""
                    }`;
                    window.open(`https://zalo.me/share?url=${encodeURIComponent(link)}`, "_blank");
                  }}
                  className="py-2.5 px-4 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs border border-blue-200 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Gửi Zalo</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
