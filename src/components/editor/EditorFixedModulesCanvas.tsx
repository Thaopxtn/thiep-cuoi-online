"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Navigation,
  Heart,
  Sparkles,
  Send,
  Check,
  Copy,
  Sliders,
  Eye,
  EyeOff,
  Camera,
  CreditCard,
  MessageSquare,
  Gift,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react";
import { WeddingCard } from "@/data/initialCards";
import { calculateCountdown } from "@/lib/moduleHelpers";
import { generateVietQrUrl } from "@/lib/vietQrBankCodes";
import { WeddingCalendarCard } from "@/components/show/InteractiveSections";

interface EditorFixedModulesCanvasProps {
  card?: WeddingCard | null;
  onOpenFixedModulesTab?: () => void;
  onToggleFixedModule?: (key: keyof WeddingCard, value: boolean) => void;
  onOpenAlbumDrawer?: () => void;
  onOpenSettings?: () => void;
}

export default function EditorFixedModulesCanvas({
  card,
  onOpenFixedModulesTab,
  onToggleFixedModule,
  onOpenAlbumDrawer,
  onOpenSettings,
}: EditorFixedModulesCanvasProps) {
  const [copiedBank, setCopiedBank] = useState<string | null>(null);

  if (!card) return null;

  const showCalendar = card.showCalendar !== false;
  const showEvents = card.showEvents !== false;
  const showAlbum = (card.album && card.album.length > 0);
  const showRsvp = card.showRsvp !== false;
  const showGiftBox = card.showGiftBox !== false;
  const showWishes = card.showWishes !== false;
  const showLoveStory = card.showLoveStory !== false && Boolean(card.loveStory && card.loveStory.length > 0);

  const activeFixedCount = [
    showCalendar,
    showEvents,
    showRsvp,
    showGiftBox,
    showWishes,
    Boolean(card.album && card.album.length > 0),
  ].filter(Boolean).length;

  const countdown = calculateCountdown(card.weddingDate, card.weddingTime);

  const copyToClipboard = (text: string, type: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedBank(type);
      setTimeout(() => setCopiedBank(null), 2000);
    } catch {}
  };

  const groomBankOwner = (card.groom?.accountName || card.groom?.name || "CHÚ RỂ").toUpperCase();
  const brideBankOwner = (card.bride?.accountName || card.bride?.name || "CÔ DÂU").toUpperCase();

  const groomQr = card.groom?.accountNumber
    ? generateVietQrUrl(
        card.groom.bankName || "MB BANK",
        card.groom.accountNumber,
        groomBankOwner,
        undefined,
        `Mung cuoi ${card.groom.name || "chu re"}`
      )
    : "";

  const brideQr = card.bride?.accountNumber
    ? generateVietQrUrl(
        card.bride.bankName || "TECHCOMBANK",
        card.bride.accountNumber,
        brideBankOwner,
        undefined,
        `Mung cuoi ${card.bride.name || "co dau"}`
      )
    : "";

  const galleryPhotos =
    card.album && card.album.length > 0
      ? card.album
      : [
          card.coverImage || "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop",
        ];

  return (
    <div
      className="w-full relative z-10 flex flex-col bg-[#fbf9f5] border-t-2 border-dashed border-amber-900/30 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ================= STUDIO BANNER CHÂN TRANG ================= */}
      <div className="bg-gradient-to-r from-[#2a080c] via-[#511419] to-[#2a080c] text-white p-3.5 sm:p-4 shadow-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-amber-200 tracking-wide uppercase">
                Khối Mẫu Cố Định Chân Trang
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                {activeFixedCount}/6 đang bật
              </span>
            </div>
            <p className="text-[10px] text-amber-100/70 truncate mt-0.5">
              Tự động hiển thị ở cuối thiệp khi phát hành • Tùy chỉnh bật/tắt trong menu Khối Mẫu
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenFixedModulesTab?.()}
          className="shrink-0 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#511419] font-bold text-[11px] shadow-sm flex items-center gap-1 transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
          title="Mở tab Khối Mẫu để Bật/Tắt các khối cố định"
        >
          <span>Khối Mẫu</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ================= KHÔNG CÓ KHỐI NÀO BẬT ================= */}
      {activeFixedCount === 0 && (
        <div className="p-8 text-center bg-white/70 border-b border-amber-900/10">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-2">
            <EyeOff className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-gray-700">Tất cả khối mẫu cố định đang tắt</h4>
          <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
            Khách xem thiệp sẽ chỉ nhìn thấy các nội dung vẽ trên bảng thiết kế. Bạn có thể bật lại Lịch cưới, Hộp mừng QR, RSVP bất cứ lúc nào.
          </p>
          <button
            type="button"
            onClick={() => onOpenFixedModulesTab?.()}
            className="mt-3.5 px-4 py-2 rounded-xl bg-[#511419] text-amber-200 font-bold text-xs shadow-xs hover:bg-[#681920] transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Mở menu Khối Mẫu để Bật lại</span>
          </button>
        </div>
      )}

      {/* ================= 1. SAVE THE DATE & ĐẾM NGƯỢC ================= */}
      {showCalendar && (
        <div className="relative group/module border-b border-amber-900/10 bg-gradient-to-b from-white to-[#fbf9f5] p-5">
          {/* Header indicator */}
          <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-amber-900/10">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[11px] font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1">
                <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
                <span>Save The Date & Đếm Ngược</span>
              </span>
              <span className="px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-700 text-[9px] font-semibold">
                Cố định
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onOpenSettings?.()}
                className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-semibold transition-colors cursor-pointer"
                title="Thay đổi ngày giờ cưới"
              >
                ✏️ Sửa ngày cưới
              </button>
              <button
                type="button"
                onClick={() => onToggleFixedModule?.("showCalendar", false)}
                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-semibold transition-colors cursor-pointer flex items-center gap-0.5"
                title="Ẩn khối này khỏi thiệp"
              >
                <EyeOff className="w-3 h-3" />
                <span>Ẩn</span>
              </button>
            </div>
          </div>

          {/* Countdown Preview */}
          <div className="bg-white rounded-2xl border border-amber-900/10 p-4 shadow-2xs mb-4 text-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800">
              Đếm ngược ngày chung đôi
            </span>
            <div className="grid grid-cols-4 gap-2 mt-2.5">
              {[
                { val: countdown.days, label: "Ngày" },
                { val: countdown.hours, label: "Giờ" },
                { val: countdown.minutes, label: "Phút" },
                { val: countdown.seconds, label: "Giây" },
              ].map((t, idx) => (
                <div
                  key={idx}
                  className="bg-[#fcfaf7] rounded-xl py-2 px-1 border border-amber-900/10 flex flex-col items-center shadow-2xs"
                >
                  <span className="text-xl font-bold font-cormorant text-[#511419]">
                    {String(t.val).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] text-gray-500 uppercase font-semibold">
                    {t.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar Widget Preview */}
          <div className="pointer-events-none opacity-95">
            <WeddingCalendarCard
              weddingDate={card.weddingDate}
              weddingTime={card.weddingTime}
              title={card.name}
              venue={card.events?.[0]?.venue || "Trung tâm tiệc cưới"}
            />
          </div>
        </div>
      )}

      {/* ================= 2. CHƯƠNG TRÌNH HÔN LỄ & BẢN ĐỒ ================= */}
      {showEvents && card.events && card.events.length > 0 && (
        <div className="relative group/module border-b border-amber-900/10 bg-white p-5">
          {/* Header indicator */}
          <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-amber-900/10">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Chương Trình Hôn Lễ & Chỉ Đường ({card.events.length})</span>
              </span>
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 text-[9px] font-semibold">
                Cố định
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onOpenSettings?.()}
                className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-semibold transition-colors cursor-pointer"
                title="Thay đổi thông tin địa điểm hôn lễ"
              >
                ✏️ Sửa địa điểm
              </button>
              <button
                type="button"
                onClick={() => onToggleFixedModule?.("showEvents", false)}
                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-semibold transition-colors cursor-pointer flex items-center gap-0.5"
                title="Ẩn khối này khỏi thiệp"
              >
                <EyeOff className="w-3 h-3" />
                <span>Ẩn</span>
              </button>
            </div>
          </div>

          <div className="text-center mb-4">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">
              Thông Tin Hôn Lễ
            </span>
            <h3 className="text-xl font-bold font-serif text-[#511419] mt-0.5">
              Chương Trình Hôn Lễ
            </h3>
            <div className="w-8 h-0.5 bg-amber-700/40 mx-auto mt-1.5" />
          </div>

          <div className="space-y-3">
            {card.events.map((evt, idx) => (
              <div
                key={evt.id || `evt-${idx}`}
                className="bg-[#fcfaf7] rounded-2xl border border-amber-900/15 p-4 shadow-2xs relative"
              >
                <div className="flex items-center gap-1.5 text-rose-700 text-xs font-bold uppercase tracking-wider mb-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{evt.time}</span>
                </div>
                <h4 className="font-bold text-gray-900 text-sm">
                  {evt.title}
                </h4>
                <div className="mt-0.5 text-xs font-semibold text-amber-900">
                  {evt.venue}
                </div>
                {evt.address && (
                  <div className="mt-1 flex items-start gap-1.5 text-xs text-gray-600">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <span>{evt.address}</span>
                  </div>
                )}
                {evt.mapUrl && (
                  <div className="mt-3">
                    <a
                      href={evt.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-all shadow-2xs"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Chỉ đường Google Maps ↗</span>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= 3. ALBUM ẢNH CƯỚI ================= */}
      {showAlbum && (
        <div className="relative group/module border-b border-amber-900/10 bg-[#faf7f2] p-5">
          {/* Header indicator */}
          <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-amber-900/10">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
              <span className="text-[11px] font-bold text-pink-950 uppercase tracking-wider flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-pink-600" />
                <span>Album Ảnh Cưới ({card.album?.length || 0} ảnh)</span>
              </span>
              <span className="px-1.5 py-0.2 rounded-md bg-pink-50 text-pink-700 text-[9px] font-semibold">
                Cố định
              </span>
            </div>

            <button
              type="button"
              onClick={() => onOpenAlbumDrawer?.()}
              className="px-2.5 py-1 rounded-lg bg-pink-100 hover:bg-pink-200 text-pink-800 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
              title="Quản lý thêm/xóa/sắp xếp ảnh trong album"
            >
              <Camera className="w-3 h-3" />
              <span>Quản lý Album ↗</span>
            </button>
          </div>

          <div className="text-center mb-4">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">
              Khoảnh Khắc Ngọt Ngào
            </span>
            <h3 className="text-xl font-bold font-serif text-[#511419] mt-0.5">
              Album Ảnh Cưới
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Chạm để phóng to và ngắm nhìn khoảnh khắc hạnh phúc
            </p>
          </div>

          {/* Grid Photos Preview */}
          <div className="grid grid-cols-2 gap-2.5">
            {galleryPhotos.slice(0, 4).map((photoUrl, idx) => (
              <div
                key={idx}
                className={`relative rounded-xl overflow-hidden shadow-2xs border border-white bg-gray-100 ${
                  idx === 0 ? "col-span-2 aspect-[16/9]" : "aspect-[4/5]"
                }`}
              >
                <img
                  src={photoUrl}
                  alt={`Ảnh cưới ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-full bg-black/60 text-white text-[9px] font-medium backdrop-blur-xs flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                  <span>#{idx + 1}</span>
                </div>
              </div>
            ))}
          </div>

          {(card.album?.length || 0) > 4 && (
            <p className="text-center text-[10px] text-gray-500 mt-2 font-medium">
              + còn {(card.album?.length || 0) - 4} ảnh nữa trong album trực tuyến
            </p>
          )}
        </div>
      )}

      {/* ================= 4. FORM XÁC NHẬN THAM DỰ (RSVP) ================= */}
      {showRsvp && (
        <div className="relative group/module border-b border-amber-900/10 bg-white p-5">
          {/* Header indicator */}
          <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-amber-900/10">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[11px] font-bold text-rose-950 uppercase tracking-wider flex items-center gap-1">
                <Send className="w-3.5 h-3.5 text-rose-600" />
                <span>Form Xác Nhận Tham Dự (RSVP)</span>
              </span>
              <span className="px-1.5 py-0.2 rounded-md bg-rose-50 text-rose-700 text-[9px] font-semibold">
                Cố định
              </span>
            </div>

            <button
              type="button"
              onClick={() => onToggleFixedModule?.("showRsvp", false)}
              className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-semibold transition-colors cursor-pointer flex items-center gap-0.5"
              title="Ẩn khối này khỏi thiệp"
            >
              <EyeOff className="w-3 h-3" />
              <span>Ẩn</span>
            </button>
          </div>

          <div className="text-center mb-4">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">
              Xác Nhận Tham Dự
            </span>
            <h3 className="text-xl font-bold font-serif text-[#511419] mt-0.5">
              Lời Hẹn Chung Vui
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Khách mời gửi phản hồi trực tuyến về cho bạn
            </p>
          </div>

          {/* RSVP Form Preview */}
          <div className="bg-[#fcfaf7] rounded-2xl p-4 border border-amber-900/15 shadow-2xs space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Họ và tên của bạn:
              </label>
              <input
                type="text"
                readOnly
                placeholder="Nhập tên khách mời..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white text-gray-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Số điện thoại:
              </label>
              <input
                type="text"
                readOnly
                placeholder="0912..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white text-gray-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Bạn sẽ tham dự chứ?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="py-2 px-3 rounded-xl border border-rose-300 bg-rose-50 text-rose-700 text-xs font-bold text-center">
                  🎉 Chắc chắn rồi!
                </div>
                <div className="py-2 px-3 rounded-xl border border-gray-200 bg-white text-gray-500 text-xs text-center">
                  💌 Tiếc quá bận rồi
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-[#511419] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 opacity-90 cursor-not-allowed"
            >
              <span>Xác nhận tham dự</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ================= 5. HỘP MỪNG CƯỚI VIETQR ================= */}
      {showGiftBox && (
        <div className="relative group/module border-b border-amber-900/10 bg-[#faf7f2] p-5">
          {/* Header indicator */}
          <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-amber-900/10">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1">
                <Gift className="w-3.5 h-3.5 text-amber-600" />
                <span>Hộp Mừng Cưới VietQR Online</span>
              </span>
              <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 text-[9px] font-semibold">
                Cố định
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onOpenSettings?.()}
                className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-semibold transition-colors cursor-pointer"
                title="Thay đổi số tài khoản ngân hàng"
              >
                ✏️ Sửa số tài khoản
              </button>
              <button
                type="button"
                onClick={() => onToggleFixedModule?.("showGiftBox", false)}
                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-semibold transition-colors cursor-pointer flex items-center gap-0.5"
                title="Ẩn khối này khỏi thiệp"
              >
                <EyeOff className="w-3 h-3" />
                <span>Ẩn</span>
              </button>
            </div>
          </div>

          <div className="text-center mb-4">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">
              Hộp Mừng Cưới Online
            </span>
            <h3 className="text-xl font-bold font-serif text-[#511419] mt-0.5">
              Gửi Quà Mừng Cưới
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Quét mã VietQR chuyển khoản nhanh mừng đôi uyên ương
            </p>
          </div>

          <div className="space-y-3">
            {/* Chú Rể */}
            {card.groom?.accountNumber && (
              <div className="bg-white rounded-2xl border border-amber-900/15 p-3.5 shadow-2xs flex items-center gap-3.5">
                <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-200 p-1 flex items-center justify-center">
                  <img
                    src={groomQr}
                    alt={`VietQR ${groomBankOwner}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">
                    Mừng Chú Rể ({card.groom.name || "Chú Rể"})
                  </span>
                  <p className="text-xs font-bold text-gray-900 truncate mt-0.5">
                    {card.groom.bankName || "MB BANK"} • {card.groom.accountNumber}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate uppercase font-semibold">
                    Chủ TK: {groomBankOwner}
                  </p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(card.groom.accountNumber!, "groom")}
                    className="mt-2 text-[10px] px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedBank === "groom" ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Đã sao chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Sao chép STK</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Cô Dâu */}
            {card.bride?.accountNumber && (
              <div className="bg-white rounded-2xl border border-amber-900/15 p-3.5 shadow-2xs flex items-center gap-3.5">
                <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-200 p-1 flex items-center justify-center">
                  <img
                    src={brideQr}
                    alt={`VietQR ${brideBankOwner}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">
                    Mừng Cô Dâu ({card.bride.name || "Cô Dâu"})
                  </span>
                  <p className="text-xs font-bold text-gray-900 truncate mt-0.5">
                    {card.bride.bankName || "TECHCOMBANK"} • {card.bride.accountNumber}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate uppercase font-semibold">
                    Chủ TK: {brideBankOwner}
                  </p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(card.bride.accountNumber!, "bride")}
                    className="mt-2 text-[10px] px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedBank === "bride" ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Đã sao chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Sao chép STK</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= 6. SỔ LƯU BÚT & LỜI CHÚC MỪNG ================= */}
      {showWishes && (
        <div className="relative group/module bg-white p-5">
          {/* Header indicator */}
          <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-amber-900/10">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
              <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                <span>Sổ Lưu Bút & Lời Chúc Mừng</span>
              </span>
              <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 text-[9px] font-semibold">
                Cố định
              </span>
            </div>

            <button
              type="button"
              onClick={() => onToggleFixedModule?.("showWishes", false)}
              className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-semibold transition-colors cursor-pointer flex items-center gap-0.5"
              title="Ẩn khối này khỏi thiệp"
            >
              <EyeOff className="w-3 h-3" />
              <span>Ẩn</span>
            </button>
          </div>

          <div className="text-center mb-4">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">
              Sổ Lưu Bút
            </span>
            <h3 className="text-xl font-bold font-serif text-[#511419] mt-0.5">
              Gửi Lời Chúc Mừng
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Nơi lưu giữ những lời chúc tốt đẹp nhất từ bạn bè & người thân
            </p>
          </div>

          {/* Form Preview */}
          <div className="bg-[#fcfaf7] rounded-2xl p-4 border border-amber-900/15 shadow-2xs space-y-2.5">
            <input
              type="text"
              readOnly
              placeholder="Tên của bạn..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white text-gray-400 cursor-not-allowed"
            />
            <textarea
              readOnly
              rows={2}
              placeholder="Gửi lời chúc hạnh phúc trăm năm đến đôi bạn trẻ..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white text-gray-400 cursor-not-allowed resize-none"
            />
            <button
              type="button"
              disabled
              className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-700 to-[#511419] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 opacity-90 cursor-not-allowed"
            >
              <Send className="w-3 h-3" />
              <span>Gửi lời chúc</span>
            </button>
          </div>

          {/* Sample wishes preview */}
          <div className="mt-3.5 space-y-2">
            {[
              {
                name: "Nguyễn Hoàng Nam",
                time: "Vừa xong",
                text: "Chúc hai bạn trăm năm hạnh phúc, sớm đón quý tử nhé! 🎉",
              },
              {
                name: "Lê Thu Hà",
                time: "Hôm qua",
                text: "Chúc mừng hạnh phúc cô dâu chú rể! Trông hai bạn đẹp đôi quá đi! ❤️",
              },
            ].map((w, idx) => (
              <div
                key={idx}
                className="bg-[#faf7f2] rounded-xl p-3 border border-amber-900/10 text-xs flex items-start justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-xs">{w.name}</span>
                    <span className="text-[9px] text-gray-400">{w.time}</span>
                  </div>
                  <p className="text-gray-700 text-xs mt-0.5">{w.text}</p>
                </div>
                <div className="text-rose-500 flex items-center gap-0.5 shrink-0 text-[10px]">
                  <Heart className="w-3 h-3 fill-current" />
                  <span>1</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= FOOTER WATERMARK ================= */}
      <div className="py-4 text-center bg-[#f7f2ea] border-t border-amber-900/15">
        <p className="text-[10px] text-amber-900/60 font-serif">
          Thiết kế & Tùy biến bởi <strong>ZenLove Studio</strong>
        </p>
      </div>
    </div>
  );
}
