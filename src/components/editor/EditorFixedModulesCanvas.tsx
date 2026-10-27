"use client";

import React, { useState, useEffect } from "react";
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
  EyeOff,
  Camera,
  CreditCard,
  MessageSquare,
  Gift,
  ExternalLink,
  Palette,
} from "lucide-react";
import { WeddingCard } from "@/data/initialCards";
import { calculateCountdown } from "@/lib/moduleHelpers";
import { generateVietQrUrl } from "@/lib/vietQrBankCodes";
import { WeddingCalendarCard, DEFAULT_LOVE_STORY } from "@/components/show/InteractiveSections";
import { FixedModuleId } from "./EditorFixedModuleEditModal";

export function scrollToFixedModule(moduleId: string) {
  if (typeof window === "undefined") return;
  setTimeout(() => {
    const el = document.getElementById(`fixed-module-${moduleId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-4", "ring-rose-400", "ring-offset-2", "transition-all", "duration-500");
      setTimeout(() => {
        el.classList.remove("ring-4", "ring-rose-400", "ring-offset-2");
      }, 1500);
    }
  }, 100);
}

interface EditorFixedModulesCanvasProps {
  card?: WeddingCard | null;
  onOpenFixedModulesTab?: () => void;
  onToggleFixedModule?: (key: keyof WeddingCard, value: boolean) => void;
  onOpenAlbumDrawer?: () => void;
  onOpenSettings?: () => void;
  onOpenModuleConfig?: (moduleId: FixedModuleId) => void;
  selectedFixedModuleId?: FixedModuleId | null;
  onSelectFixedModule?: (moduleId: FixedModuleId) => void;
  readOnly?: boolean;
}

export default function EditorFixedModulesCanvas({
  card,
  onOpenFixedModulesTab,
  onToggleFixedModule,
  onOpenAlbumDrawer,
  onOpenSettings,
  onOpenModuleConfig,
  selectedFixedModuleId,
  onSelectFixedModule,
  readOnly = false,
}: EditorFixedModulesCanvasProps) {
  const [copiedBank, setCopiedBank] = useState<string | null>(null);

  // Countdown timer state - initialized with a deterministic placeholder to avoid SSR hydration mismatch
  const [countdown, setCountdown] = useState({
    days: 30,
    hours: 12,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!card) return;
    setCountdown(calculateCountdown(card.weddingDate, card.weddingTime));
    const timer = setInterval(() => {
      setCountdown(calculateCountdown(card.weddingDate, card.weddingTime));
    }, 1000);
    return () => clearInterval(timer);
  }, [card?.weddingDate, card?.weddingTime]);

  if (!card) return null;

  const showCalendar = card.showCalendar !== false;
  const showEvents = card.showEvents !== false;
  const showLoveStory = card.showLoveStory !== false;
  const showAlbum = card.showAlbum !== false;
  const showRsvp = card.showRsvp !== false;
  const showGiftBox = card.showGiftBox !== false;
  const showWishes = card.showWishes !== false;

  const activeFixedCount = [
    showCalendar,
    showEvents,
    showLoveStory,
    showAlbum,
    showRsvp,
    showGiftBox,
    showWishes,
  ].filter(Boolean).length;

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

  // Selected Style Variants
  const styles = card.fixedModuleStyles || {};
  const calendarStyle = styles.calendar || "classic-cream";
  const eventsStyle = styles.events || "timeline-cards";
  const loveStoryStyle = styles.loveStory || "vertical-timeline";
  const loveStoryItems = card.loveStory && card.loveStory.length > 0 ? card.loveStory : DEFAULT_LOVE_STORY;
  const albumStyle = styles.album || "grid-modern";
  const rsvpStyle = styles.rsvp || "clean-rounded";
  const giftBoxStyle = styles.giftBox || "dual-bank-cards";
  const wishesStyle = styles.wishes || "stream-bubble";

  return (
    <div
      className={`w-full relative z-10 flex flex-col bg-[#fbf9f5] ${readOnly ? "" : "border-t-2 border-dashed border-amber-900/30 select-none"}`}
      onClick={(e) => !readOnly && e.stopPropagation()}
    >
      {/* ================= KHÔNG CÓ KHỐI NÀO BẬT ================= */}
      {!readOnly && activeFixedCount === 0 && (
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
        <div
          id="fixed-module-calendar"
          onClick={() => {
            onSelectFixedModule?.("calendar");
            onOpenModuleConfig?.("calendar");
          }}
          className={`relative group/module border-b border-amber-900/10 p-5 transition-all cursor-pointer ${
            selectedFixedModuleId === "calendar"
              ? "ring-2 ring-rose-500 shadow-md ring-offset-2"
              : "hover:ring-2 hover:ring-rose-400/60"
          } ${
            calendarStyle === "luxury-gold"
              ? "bg-gradient-to-b from-[#1a120b] via-[#2a1d13] to-[#1a120b] text-amber-200"
              : calendarStyle === "traditional-red"
              ? "bg-gradient-to-b from-[#8b0000] to-[#700000] text-amber-100"
              : calendarStyle === "modern-minimal"
              ? "bg-white text-gray-900"
              : "bg-gradient-to-b from-white to-[#fbf9f5] text-gray-800"
          }`}
          title="Nhấp để tùy chỉnh ngày giờ cưới & kiểu dáng ở thanh bên phải"
        >
          {/* Countdown Preview */}
          <div className={`rounded-2xl border p-4 shadow-2xs mb-4 text-center ${
            calendarStyle === "luxury-gold"
              ? "bg-[#24170d] border-amber-500/30 text-amber-200"
              : calendarStyle === "traditional-red"
              ? "bg-[#9e1010] border-amber-300/40 text-amber-100"
              : calendarStyle === "modern-minimal"
              ? "bg-gray-50 border-gray-200 text-gray-900"
              : "bg-white border-amber-900/10 text-gray-800"
          }`}>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${
              calendarStyle === "luxury-gold" || calendarStyle === "traditional-red" ? "text-amber-300" : "text-amber-800"
            }`}>
              {calendarStyle === "traditional-red" ? "囍 Đếm ngược ngày thành hôn 囍" : "Đếm ngược ngày chung đôi"}
            </span>

            <div className="grid grid-cols-4 gap-2 mt-2.5" suppressHydrationWarning>
              {[
                { val: countdown.days, label: "Ngày" },
                { val: countdown.hours, label: "Giờ" },
                { val: countdown.minutes, label: "Phút" },
                { val: countdown.seconds, label: "Giây" },
              ].map((t, idx) => (
                <div
                  key={idx}
                  suppressHydrationWarning
                  className={`rounded-xl py-2 px-1 border flex flex-col items-center shadow-2xs ${
                    calendarStyle === "luxury-gold"
                      ? "bg-[#160d07] border-amber-500/40"
                      : calendarStyle === "traditional-red"
                      ? "bg-[#7d0000] border-amber-300/40 text-white"
                      : calendarStyle === "modern-minimal"
                      ? "bg-white border-gray-300 text-black font-mono"
                      : "bg-[#fcfaf7] border-amber-900/10"
                  }`}
                >
                  <span
                    suppressHydrationWarning
                    className={`text-xl font-bold font-cormorant ${
                      calendarStyle === "luxury-gold" ? "text-amber-300" : calendarStyle === "traditional-red" ? "text-amber-200" : "text-[#511419]"
                    }`}
                  >
                    {String(t.val).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] uppercase font-semibold opacity-75">
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
              themeStyle={calendarStyle === "luxury-gold" ? "luxury" : calendarStyle === "traditional-red" ? "traditional" : "default"}
            />
          </div>
        </div>
      )}

      {/* ================= 2. CHƯƠNG TRÌNH HÔN LỄ & BẢN ĐỒ ================= */}
      {showEvents && card.events && card.events.length > 0 && (
        <div
          id="fixed-module-events"
          onClick={() => {
            onSelectFixedModule?.("events");
            onOpenModuleConfig?.("events");
          }}
          className={`relative group/module border-b border-amber-900/10 p-5 transition-all cursor-pointer ${
            selectedFixedModuleId === "events"
              ? "ring-2 ring-rose-500 shadow-md ring-offset-2"
              : "hover:ring-2 hover:ring-rose-400/60"
          } ${
            eventsStyle === "traditional-red"
              ? "bg-gradient-to-b from-[#8b0000]/10 via-white to-[#8b0000]/5"
              : eventsStyle === "vertical-timeline"
              ? "bg-gradient-to-b from-[#faf7f2] to-white"
              : "bg-white"
          }`}
          title="Nhấp để tùy chỉnh chương trình hôn lễ & kiểu dáng ở thanh bên phải"
        >
          <div className="text-center mb-4">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">
              Thông Tin Hôn Lễ
            </span>
            <h3 className="text-xl font-bold font-serif text-[#511419] mt-0.5">
              Chương Trình Hôn Lễ
            </h3>
            <div className="w-8 h-0.5 bg-amber-700/40 mx-auto mt-1.5" />
          </div>

          {/* DẠNG 1: TIMELINE DỌC (vertical-timeline) */}
          {eventsStyle === "vertical-timeline" ? (
            <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-rose-500 before:via-amber-400 before:to-rose-600">
              {card.events.map((evt, idx) => (
                <div key={evt.id || idx} className="relative group/step">
                  <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-rose-600 border-2 border-white shadow-sm ring-2 ring-rose-200" />
                  <div className="bg-white rounded-xl border border-rose-100 p-3.5 shadow-2xs">
                    <span className="text-xs font-bold text-rose-700 uppercase flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{evt.time}</span>
                    </span>
                    <h4 className="font-bold text-gray-900 text-sm mt-0.5">{evt.title}</h4>
                    <p className="text-xs text-amber-900 font-semibold mt-0.5">{evt.venue}</p>
                    {evt.address && <p className="text-[11px] text-gray-500 mt-0.5">{evt.address}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* DẠNG 2 & 3: THẺ CARD ĐỘC LẬP HOẶC TRUYỀN THỐNG */
            <div className="space-y-3">
              {card.events.map((evt, idx) => (
                <div
                  key={evt.id || `evt-${idx}`}
                  className={`rounded-2xl border p-4 shadow-2xs relative ${
                    eventsStyle === "traditional-red"
                      ? "bg-[#fffaf7] border-rose-300"
                      : "bg-[#fcfaf7] border-amber-900/15"
                  }`}
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
          )}
        </div>
      )}

      {/* ================= 2.5. CHUYỆN TÌNH YÊU (LOVE STORY TIMELINE) ================= */}
      {showLoveStory && (
        <div
          id="fixed-module-loveStory"
          onClick={() => {
            onSelectFixedModule?.("loveStory");
            onOpenModuleConfig?.("loveStory");
          }}
          className={`relative group/module border-b border-amber-900/10 p-5 transition-all cursor-pointer ${
            selectedFixedModuleId === "loveStory"
              ? "ring-2 ring-rose-500 shadow-md ring-offset-2"
              : "hover:ring-2 hover:ring-rose-400/60"
          } ${
            loveStoryStyle === "romantic-journal"
              ? "bg-[#faf6ee]"
              : loveStoryStyle === "milestone-cards"
              ? "bg-gradient-to-b from-[#fffaf7] to-white"
              : "bg-[#fcfaf7]"
          }`}
          title="Nhấp để tùy chỉnh các mốc thời gian tình yêu & kiểu dáng ở thanh bên phải"
        >
          <div className="text-center mb-5">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest block font-serif">
              OUR LOVE STORY
            </span>
            <h3 className="text-xl font-bold font-serif text-[#511419] mt-0.5">
              Chuyện Tình Yêu Của Chúng Mình
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5 max-w-xs mx-auto">
              Từng khoảnh khắc đẹp đẽ đã vun đắp nên tình yêu bền chặt hôm nay
            </p>
            <div className="w-8 h-0.5 bg-amber-700/40 mx-auto mt-2" />
          </div>

          {/* DẠNG 1: DÒNG THỜI GIAN DỌC (vertical-timeline) */}
          {loveStoryStyle === "vertical-timeline" && (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-rose-400 before:via-amber-400 before:to-rose-500">
              {loveStoryItems.map((item, idx) => (
                <div key={item.id || idx} className="relative group/step">
                  <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white shadow-sm ring-2 ring-rose-200" />
                  <div className="bg-white rounded-xl border border-rose-100/80 p-3 shadow-2xs">
                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
                      {item.date}
                    </span>
                    <h4 className="font-bold text-gray-900 text-sm mt-0.5">{item.title}</h4>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{item.description}</p>
                    {item.imageUrl && (
                      <div className="mt-2 rounded-lg overflow-hidden aspect-video bg-gray-100 max-h-32">
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* DẠNG 2: THẺ CỘT MỐC ĐỘC LẬP (milestone-cards) */}
          {loveStoryStyle === "milestone-cards" && (
            <div className="space-y-3">
              {loveStoryItems.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="bg-white rounded-2xl border border-rose-200/70 p-3.5 shadow-2xs relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200/50">
                      {item.date}
                    </span>
                    <span className="text-xs">💍</span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm mt-1">{item.title}</h4>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{item.description}</p>
                  {item.imageUrl && (
                    <div className="mt-2.5 rounded-xl overflow-hidden aspect-video bg-gray-100 max-h-32">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* DẠNG 3: NHẬT KÝ CỔ ĐIỂN (romantic-journal) */}
          {loveStoryStyle === "romantic-journal" && (
            <div className="space-y-3 p-3 bg-[#fdfbf7] rounded-2xl border border-[#d8c5ad] shadow-inner">
              {loveStoryItems.map((item, idx) => (
                <div key={item.id || idx} className="border-b border-[#e5d8c5] pb-3 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-1.5 text-[#8c6239] text-xs font-serif italic">
                    <span>✧</span>
                    <span className="font-bold">{item.date}</span>
                    <span>-</span>
                    <span className="font-bold">{item.title}</span>
                  </div>
                  <p className="text-xs text-[#5c4738] font-serif mt-1 leading-relaxed">
                    "{item.description}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= 3. ALBUM ẢNH CƯỚI ================= */}
      {showAlbum && (
        <div
          id="fixed-module-album"
          onClick={() => {
            onSelectFixedModule?.("album");
            onOpenModuleConfig?.("album");
          }}
          className={`relative group/module border-b border-amber-900/10 bg-[#faf7f2] p-5 transition-all cursor-pointer ${
            selectedFixedModuleId === "album"
              ? "ring-2 ring-rose-500 shadow-md ring-offset-2"
              : "hover:ring-2 hover:ring-rose-400/60"
          }`}
          title="Nhấp để quản lý album ảnh cưới & kiểu dáng ở thanh bên phải"
        >
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

          {/* DẠNG 1: POLAROID SCRAPBOOK */}
          {albumStyle === "polaroid-scrapbook" ? (
            <div className="grid grid-cols-2 gap-3 pt-2">
              {galleryPhotos.slice(0, 4).map((photoUrl, idx) => (
                <div
                  key={idx}
                  className={`bg-white p-2.5 pb-4 shadow-md rounded-lg border border-amber-900/10 transition-transform ${
                    idx % 2 === 0 ? "rotate-[-2deg]" : "rotate-[2deg]"
                  }`}
                >
                  <div className="aspect-[4/5] bg-gray-100 rounded overflow-hidden">
                    <img src={photoUrl} alt="Polaroid" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-center text-[10px] text-gray-400 font-serif italic mt-2">
                    Khoảnh khắc #{idx + 1}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            /* DẠNG 2: GRID TIÊU CHUẨN HOẶC MASONRY */
            <div className="grid grid-cols-2 gap-2.5">
              {galleryPhotos.slice(0, 4).map((photoUrl, idx) => (
                <div
                  key={idx}
                  className={`relative rounded-xl overflow-hidden shadow-2xs border border-white bg-gray-100 ${
                    idx === 0 && albumStyle === "grid-modern" ? "col-span-2 aspect-[16/9]" : "aspect-[4/5]"
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
          )}

          {(card.album?.length || 0) > 4 && (
            <p className="text-center text-[10px] text-gray-500 mt-2 font-medium">
              + còn {(card.album?.length || 0) - 4} ảnh nữa trong album trực tuyến
            </p>
          )}
        </div>
      )}

      {/* ================= 4. FORM XÁC NHẬN THAM DỰ (RSVP) ================= */}
      {showRsvp && (
        <div
          id="fixed-module-rsvp"
          onClick={() => {
            onSelectFixedModule?.("rsvp");
            onOpenModuleConfig?.("rsvp");
          }}
          className={`relative group/module border-b border-amber-900/10 p-5 transition-all cursor-pointer ${
            selectedFixedModuleId === "rsvp"
              ? "ring-2 ring-rose-500 shadow-md ring-offset-2"
              : "hover:ring-2 hover:ring-rose-400/60"
          } ${
            rsvpStyle === "red-velvet"
              ? "bg-gradient-to-b from-[#4c0519] via-[#700922] to-[#4c0519] text-amber-100"
              : rsvpStyle === "luxury-envelope"
              ? "bg-gradient-to-b from-[#fef3c7]/30 via-white to-[#fee2e2]/30 text-gray-800"
              : "bg-white text-gray-800"
          }`}
          title="Nhấp để tùy chỉnh RSVP & kiểu dáng ở thanh bên phải"
        >

          <div className="text-center mb-4">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${
              rsvpStyle === "red-velvet" ? "text-amber-300" : "text-amber-800"
            }`}>
              Xác Nhận Tham Dự
            </span>
            <h3 className={`text-xl font-bold font-serif mt-0.5 ${
              rsvpStyle === "red-velvet" ? "text-white" : "text-[#511419]"
            }`}>
              Lời Hẹn Chung Vui
            </h3>
            <p className="text-[11px] opacity-75 mt-0.5">
              Khách mời gửi phản hồi trực tuyến về cho bạn
            </p>
          </div>

          {/* RSVP Form Preview */}
          <div className={`rounded-2xl p-4 border shadow-2xs space-y-3 ${
            rsvpStyle === "red-velvet"
              ? "bg-[#380211] border-amber-400/30 text-white"
              : "bg-[#fcfaf7] border-amber-900/15 text-gray-800"
          }`}>
            <div>
              <label className="block text-[11px] font-bold mb-1 opacity-90">Họ và tên của bạn:</label>
              <input
                type="text"
                readOnly
                placeholder="Nhập tên khách mời..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white text-gray-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold mb-1 opacity-90">Số điện thoại:</label>
              <input
                type="text"
                readOnly
                placeholder="0912..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white text-gray-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold mb-1 opacity-90">Bạn sẽ tham dự chứ?</label>
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
              className={`w-full py-2.5 rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 opacity-90 cursor-not-allowed ${
                rsvpStyle === "red-velvet"
                  ? "bg-gradient-to-r from-amber-400 to-amber-500 text-[#4c0519]"
                  : "bg-gradient-to-r from-rose-600 to-[#511419] text-white"
              }`}
            >
              <span>Xác nhận tham dự</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ================= 5. HỘP MỪNG CƯỚI VIETQR ================= */}
      {showGiftBox && (
        <div
          id="fixed-module-giftBox"
          onClick={() => {
            onSelectFixedModule?.("giftBox");
            onOpenModuleConfig?.("giftBox");
          }}
          className={`relative group/module border-b border-amber-900/10 p-5 transition-all cursor-pointer ${
            selectedFixedModuleId === "giftBox"
              ? "ring-2 ring-rose-500 shadow-md ring-offset-2"
              : "hover:ring-2 hover:ring-rose-400/60"
          } ${
            giftBoxStyle === "red-envelope"
              ? "bg-gradient-to-b from-[#8b0000] via-[#a11212] to-[#700000] text-amber-100"
              : giftBoxStyle === "luxury-gold"
              ? "bg-gradient-to-b from-[#18181b] via-[#27272a] to-[#09090b] text-amber-200"
              : "bg-[#faf7f2] text-gray-800"
          }`}
          title="Nhấp để tùy chỉnh số tài khoản & kiểu dáng ở thanh bên phải"
        >

          <div className="text-center mb-4">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${
              giftBoxStyle === "red-envelope" || giftBoxStyle === "luxury-gold" ? "text-amber-300" : "text-amber-800"
            }`}>
              {giftBoxStyle === "red-envelope" ? "囍 Bao Lì Xì Mừng Cưới 囍" : "Hộp Mừng Cưới Online"}
            </span>
            <h3 className={`text-xl font-bold font-serif mt-0.5 ${
              giftBoxStyle === "red-envelope" || giftBoxStyle === "luxury-gold" ? "text-white" : "text-[#511419]"
            }`}>
              Gửi Quà Mừng Cưới
            </h3>
            <p className="text-[11px] opacity-75 mt-0.5">
              Quét mã VietQR chuyển khoản nhanh mừng đôi uyên ương
            </p>
          </div>

          <div className="space-y-3">
            {/* Chú Rể */}
            {card.groom?.accountNumber && (
              <div className={`rounded-2xl border p-3.5 shadow-2xs flex items-center gap-3.5 ${
                giftBoxStyle === "red-envelope"
                  ? "bg-[#6b0b0b] border-amber-400/40 text-white"
                  : giftBoxStyle === "luxury-gold"
                  ? "bg-[#1c1917] border-amber-500/40 text-amber-200"
                  : "bg-white border-amber-900/15"
              }`}>
                <div className="w-20 h-20 bg-white rounded-xl overflow-hidden shrink-0 border border-gray-200 p-1 flex items-center justify-center">
                  <img
                    src={groomQr}
                    alt={`VietQR ${groomBankOwner}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    giftBoxStyle === "red-envelope" || giftBoxStyle === "luxury-gold" ? "text-amber-300" : "text-rose-800"
                  }`}>
                    Mừng Chú Rể ({card.groom.name || "Chú Rể"})
                  </span>
                  <p className="text-xs font-bold truncate mt-0.5">
                    {card.groom.bankName || "MB BANK"} • {card.groom.accountNumber}
                  </p>
                  <p className="text-[10px] opacity-75 truncate uppercase font-semibold">
                    Chủ TK: {groomBankOwner}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(card.groom.accountNumber!, "groom");
                    }}
                    className="mt-2 text-[10px] px-2.5 py-1 rounded-lg bg-black/10 hover:bg-black/20 text-current font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer border border-current/20"
                  >
                    {copiedBank === "groom" ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500">Đã sao chép</span>
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
              <div className={`rounded-2xl border p-3.5 shadow-2xs flex items-center gap-3.5 ${
                giftBoxStyle === "red-envelope"
                  ? "bg-[#6b0b0b] border-amber-400/40 text-white"
                  : giftBoxStyle === "luxury-gold"
                  ? "bg-[#1c1917] border-amber-500/40 text-amber-200"
                  : "bg-white border-amber-900/15"
              }`}>
                <div className="w-20 h-20 bg-white rounded-xl overflow-hidden shrink-0 border border-gray-200 p-1 flex items-center justify-center">
                  <img
                    src={brideQr}
                    alt={`VietQR ${brideBankOwner}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    giftBoxStyle === "red-envelope" || giftBoxStyle === "luxury-gold" ? "text-amber-300" : "text-rose-800"
                  }`}>
                    Mừng Cô Dâu ({card.bride.name || "Cô Dâu"})
                  </span>
                  <p className="text-xs font-bold truncate mt-0.5">
                    {card.bride.bankName || "TECHCOMBANK"} • {card.bride.accountNumber}
                  </p>
                  <p className="text-[10px] opacity-75 truncate uppercase font-semibold">
                    Chủ TK: {brideBankOwner}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(card.bride.accountNumber!, "bride");
                    }}
                    className="mt-2 text-[10px] px-2.5 py-1 rounded-lg bg-black/10 hover:bg-black/20 text-current font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer border border-current/20"
                  >
                    {copiedBank === "bride" ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500">Đã sao chép</span>
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
        <div
          id="fixed-module-wishes"
          onClick={() => {
            onSelectFixedModule?.("wishes");
            onOpenModuleConfig?.("wishes");
          }}
          className={`relative group/module p-5 transition-all cursor-pointer ${
            selectedFixedModuleId === "wishes"
              ? "ring-2 ring-rose-500 shadow-md ring-offset-2"
              : "hover:ring-2 hover:ring-rose-400/60"
          } ${
            wishesStyle === "vintage-card"
              ? "bg-[#fbf7ee] text-amber-950"
              : "bg-white text-gray-800"
          }`}
          title="Nhấp để tùy chỉnh sổ lưu bút & kiểu dáng ở thanh bên phải"
        >

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
          <div className={`rounded-2xl p-4 border shadow-2xs space-y-2.5 ${
            wishesStyle === "vintage-card"
              ? "bg-[#faf3e0] border-amber-900/20"
              : "bg-[#fcfaf7] border-amber-900/15"
          }`}>
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
                className={`rounded-xl p-3 border text-xs flex items-start justify-between gap-2 ${
                  wishesStyle === "vintage-card"
                    ? "bg-[#f4ebd0] border-amber-900/20 font-serif"
                    : "bg-[#faf7f2] border-amber-900/10"
                }`}
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
