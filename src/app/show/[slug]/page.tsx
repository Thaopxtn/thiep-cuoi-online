"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Heart,
  Volume2,
  VolumeX,
  Music,
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  Send,
  CheckCircle,
  Copy,
  Share2,
  QrCode,
  Sparkles,
  ChevronDown,
  Navigation,
  Check,
  User,
  Phone,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import {
  getCardByIdOrSlug,
  fetchCardFromServer,
  addRsvp,
  addWish,
  incrementCardViews,
  WeddingCard,
} from "@/lib/weddingCardService";

export default function ShowInvitationPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "hong-phong";

  // Card state
  const [card, setCard] = useState<WeddingCard | null>(null);

  // Envelope state (opened or closed)
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false);

  // Audio state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    days: 42,
    hours: 14,
    minutes: 36,
    seconds: 52,
  });

  const setupCountdown = (found: WeddingCard) => {
    if (found.weddingDate) {
      const target = new Date(`${found.weddingDate}T${found.weddingTime || "11:00"}:00`).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, target - now);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    }
  };

  // Load card data (first local, then fresh from server)
  useEffect(() => {
    const found = getCardByIdOrSlug(slug);
    if (found) {
      setCard(found);
      setupCountdown(found);
    }

    // Tải dữ liệu mới nhất từ Supabase Cloud
    fetchCardFromServer(slug).then((serverCard) => {
      if (serverCard) {
        setCard(serverCard);
        setupCountdown(serverCard);
      }
    });

    incrementCardViews(slug);
  }, [slug]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Audio playback toggle
  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlayingAudio(true);
    }
  };

  const handleOpenEnvelope = () => {
    setIsEnvelopeOpen(true);
    if (audioRef.current && !isPlayingAudio) {
      audioRef.current.play().then(() => setIsPlayingAudio(true)).catch(() => {});
    }
  };

  // RSVP Form state
  const [rsvpName, setRsvpName] = useState("");
  const [rsvpPhone, setRsvpPhone] = useState("");
  const [rsvpAttending, setRsvpAttending] = useState<"yes" | "no">("yes");
  const [rsvpGuestsCount, setRsvpGuestsCount] = useState(1);
  const [rsvpNote, setRsvpNote] = useState("");
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);

  // Guestbook state
  const [guestName, setGuestName] = useState("");
  const [guestWish, setGuestWish] = useState("");
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleSendRsvp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!card || !rsvpName.trim() || !rsvpPhone.trim()) return;
    addRsvp(card.id, {
      name: rsvpName.trim(),
      phone: rsvpPhone.trim(),
      attending: rsvpAttending === "yes",
      guests: rsvpAttending === "yes" ? rsvpGuestsCount : 0,
      note: rsvpNote.trim(),
    });
    setRsvpSubmitted(true);
    // Refresh card
    setCard(getCardByIdOrSlug(card.id) || card);
  };

  const handleSendWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!card || !guestName.trim() || !guestWish.trim()) return;
    addWish(card.id, guestName.trim(), guestWish.trim());
    setGuestName("");
    setGuestWish("");
    // Refresh card
    setCard(getCardByIdOrSlug(card.id) || card);
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard?.writeText(text);
    if (type === "link") {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedBank(type);
      setTimeout(() => setCopiedBank(null), 2000);
    }
  };

  if (!card) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#511419] text-amber-100">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-amber-300 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs uppercase tracking-widest font-semibold">Đang mở thiệp cưới...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3efe6] flex flex-col items-center justify-start relative text-gray-800 selection:bg-rose-100 selection:text-zen-primary">
      {/* Background Wedding Audio */}
      <audio
        ref={audioRef}
        src={card.musicUrl || "https://cdn-resource.zenlove.me/mp3/thien-duong-voi-nguoi-thuong-diep-khuc-1787814882783-b1a24msg.mp3"}
        loop
        preload="auto"
      />

      {/* Floating Audio Controller */}
      <div className="fixed top-4 right-4 z-50">
        <button
          type="button"
          onClick={toggleAudio}
          className={`px-3 py-2 rounded-full backdrop-blur-md border shadow-lg flex items-center gap-2 transition-all ${
            isPlayingAudio
              ? "bg-rose-600/90 text-white border-rose-400 animate-pulse"
              : "bg-white/80 text-gray-700 border-gray-200 hover:bg-white"
          }`}
          title={isPlayingAudio ? "Tắt nhạc" : "Bật nhạc"}
        >
          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isPlayingAudio ? "animate-spin" : ""}`}>
            <Music className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold hidden sm:inline">
            {isPlayingAudio ? card.musicTitle || "Đang phát nhạc..." : "Nhạc nền"}
          </span>
          {isPlayingAudio ? (
            <Volume2 className="w-3.5 h-3.5" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 opacity-60" />
          )}
        </button>
      </div>

      {/* Top Floating Logo / Home link */}
      <div className="fixed top-4 left-4 z-50">
        <Link
          href="/"
          className="px-3.5 py-1.5 rounded-full bg-white/85 backdrop-blur-md border border-gray-200 shadow-sm flex items-center gap-1.5 text-xs font-bold text-gray-800 hover:text-zen-primary transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-zen-primary"></span>
          <span>ZenLove</span>
        </Link>
      </div>

      {/* ================= ENVELOPE MODAL (IF CLOSED) ================= */}
      {!isEnvelopeOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#511419] rounded-2xl shadow-2xl p-6 sm:p-8 text-center text-amber-50 border border-amber-900/40 relative overflow-hidden animate-scale-in">
            {/* Architectural Sketch Background */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://cdn-resource.zenlove.me/resources/mldw1mdn28infjta.png')",
              }}
            />

            {/* Floral Bouquet Graphic */}
            <div className="w-20 h-20 mx-auto mb-4 relative">
              <div className="w-full h-full rounded-full bg-amber-900/40 flex items-center justify-center border border-amber-400/30">
                <Sparkles className="w-9 h-9 text-amber-300 animate-pulse" />
              </div>
            </div>

            <p className="text-xs uppercase tracking-widest text-amber-200/80 font-medium">
              Thiệp Mời Cưới Hoàng Gia
            </p>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-amber-100 mt-2">
              {card.groom.name} & {card.bride.name}
            </h2>
            <p className="text-xs text-amber-200/90 mt-2 italic">
              "{card.story}"
            </p>

            {/* Wax Seal Button to Open */}
            <div className="mt-8 flex flex-col items-center">
              <button
                type="button"
                onClick={handleOpenEnvelope}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 shadow-xl border-2 border-amber-200/60 flex items-center justify-center text-amber-950 font-serif font-bold text-lg hover:scale-110 active:scale-95 transition-all cursor-pointer group"
                title="Nhấn để mở thiệp"
              >
                <Heart className="w-7 h-7 text-amber-950 fill-amber-950 group-hover:scale-110 transition-transform" />
              </button>
              <span className="text-xs text-amber-300 mt-3 font-semibold animate-bounce">
                Chạm để mở thiệp cưới 💌
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ================= MAIN MOBILE INVITATION CONTAINER ================= */}
      <main className="w-full max-w-[480px] bg-white shadow-2xl min-h-screen relative flex flex-col overflow-hidden pb-16">
        {/* Background Architectural Palace Sketch */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none bg-repeat-y bg-top"
          style={{
            backgroundImage:
              "url('https://cdn-resource.zenlove.me/resources/mldw1mdn28infjta.png')",
            backgroundSize: "100% auto",
          }}
        />

        {/* Top Header */}
        <div className="pt-8 pb-4 px-6 text-center relative z-10">
          <p className="text-[11px] uppercase tracking-widest text-amber-800 font-bold mb-1">
            Save The Date
          </p>
          <div className="w-12 h-0.5 bg-amber-700/30 mx-auto mb-4"></div>

          {/* Groom & Bride Typography */}
          <h1 className="text-3xl sm:text-4xl font-serif text-[#511419] font-bold tracking-tight">
            {card.groom.name}
          </h1>
          <div className="my-1.5 flex items-center justify-center gap-3">
            <span className="w-8 h-px bg-amber-700/40"></span>
            <Heart className="w-4 h-4 text-zen-primary fill-zen-primary" />
            <span className="w-8 h-px bg-amber-700/40"></span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif text-[#511419] font-bold tracking-tight">
            {card.bride.name}
          </h1>

          <p className="text-xs text-gray-500 mt-3 font-medium">
            Ngày trọng đại: <strong className="text-gray-900">{card.weddingDate}</strong>
          </p>
          {card.lunarDate && (
            <p className="text-[11px] text-gray-400 mt-0.5 italic">
              ({card.lunarDate})
            </p>
          )}
        </div>

        {/* Hero Photo with Envelope Framing (Matches user's editor screenshot!) */}
        <div className="px-6 py-2 relative z-10">
          <div className="relative rounded-2xl overflow-hidden shadow-lg border-4 border-white aspect-3/4 bg-gray-100 group">
            <img
              src={card.coverImage}
              alt={card.name}
              className="w-full h-full object-cover"
            />
            {/* Burgundy Corner Ribbons */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-[#511419] rotate-45 flex items-end justify-center pb-1 text-[10px] text-amber-200 font-bold">
              WEDDING
            </div>
          </div>
        </div>

        {/* Romantic Quote */}
        <div className="px-8 py-6 text-center relative z-10">
          <p className="text-xs sm:text-sm text-gray-600 italic font-serif leading-relaxed">
            "{card.story}"
          </p>
        </div>

        {/* ================= COUNTDOWN TIMER ================= */}
        <section className="px-6 py-6 bg-gradient-to-b from-[#fbf6f0] to-white mx-4 rounded-2xl border border-amber-900/10 shadow-xs relative z-10 text-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-3">
            Đếm ngược ngày chung đôi
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {[
              { val: timeLeft.days, label: "Ngày" },
              { val: timeLeft.hours, label: "Giờ" },
              { val: timeLeft.minutes, label: "Phút" },
              { val: timeLeft.seconds, label: "Giây" },
            ].map((t, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl py-2 px-1 shadow-xs border border-gray-100 flex flex-col items-center"
              >
                <span className="text-lg sm:text-xl font-bold font-mono text-[#511419]">
                  {String(t.val).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-gray-500 uppercase font-semibold">
                  {t.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ================= EVENT SCHEDULE ================= */}
        <section className="px-6 py-8 relative z-10 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-serif font-bold text-[#511419]">
              Chương Trình Hôn Lễ
            </h2>
            <div className="w-10 h-0.5 bg-amber-700/40 mx-auto mt-2"></div>
          </div>

          <div className="space-y-4">
            {card.events.map((evt) => (
              <div
                key={evt.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs relative overflow-hidden"
              >
                <div className="flex items-center gap-2 text-zen-primary text-xs font-bold uppercase tracking-wider mb-2">
                  <Clock className="w-4 h-4" />
                  <span>{evt.time}</span>
                </div>
                <h4 className="font-bold text-gray-900 text-base">
                  {evt.title}
                </h4>
                <div className="mt-2 flex items-start gap-2 text-xs text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <span>{evt.address || evt.venue}</span>
                </div>
                {evt.mapUrl && (
                  <a
                    href={evt.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-50 text-zen-primary text-xs font-bold hover:bg-rose-100 transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Chỉ đường Google Maps</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ================= RSVP FORM (Xác nhận tham dự) ================= */}
        <section className="px-6 py-8 bg-[#faf7f2] relative z-10 border-y border-amber-900/10">
          <div className="text-center mb-6">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">
              Xác Nhận Tham Dự
            </span>
            <h2 className="text-xl font-serif font-bold text-[#511419] mt-1">
              Lời Hẹn Chung Vui
            </h2>
            <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
              Sự hiện diện của bạn là niềm hạnh phúc lớn nhất của chúng mình!
            </p>
          </div>

          {rsvpSubmitted ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-emerald-200 shadow-xs animate-scale-in">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <h4 className="font-bold text-gray-900 text-sm">
                Đã gửi xác nhận thành công!
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                Cảm ơn bạn đã phản hồi. Hẹn gặp bạn trong ngày hạnh phúc của chúng mình nhé!
              </p>
              <button
                type="button"
                onClick={() => setRsvpSubmitted(false)}
                className="mt-3 text-xs text-zen-primary font-semibold hover:underline"
              >
                Gửi lại thông tin khác
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendRsvp} className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Họ và tên của bạn:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Nhập tên của bạn..."
                    value={rsvpName}
                    onChange={(e) => setRsvpName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Số điện thoại:
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="0912..."
                    value={rsvpPhone}
                    onChange={(e) => setRsvpPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-zen-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Bạn sẽ tham dự chứ?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRsvpAttending("yes")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      rsvpAttending === "yes"
                        ? "border-zen-primary bg-rose-50 text-zen-primary"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    🎉 Chắc chắn rồi!
                  </button>
                  <button
                    type="button"
                    onClick={() => setRsvpAttending("no")}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                      rsvpAttending === "no"
                        ? "border-gray-400 bg-gray-100 text-gray-800"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    💌 Tiếc quá bận rồi
                  </button>
                </div>
              </div>

              {rsvpAttending === "yes" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Số người cùng tham dự:
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setRsvpGuestsCount(num)}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          rsvpGuestsCount === num
                            ? "border-zen-primary bg-rose-50 text-zen-primary font-bold"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {num} người
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-zen-primary text-white text-xs font-bold shadow-md hover:bg-[#d93849] transition-all flex items-center justify-center gap-2"
              >
                <span>Xác nhận tham dự</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </section>

        {/* ================= BANKING GIFT QR BOX (Hộp mừng cưới online) ================= */}
        <section className="px-6 py-8 relative z-10">
          <div className="text-center mb-6">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">
              Hộp Mừng Cưới Online
            </span>
            <h2 className="text-xl font-serif font-bold text-[#511419] mt-1">
              Gửi Quà Mừng Cưới
            </h2>
            <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
              Dành cho bạn bè, người thân ở xa muốn gửi lời chúc và món quà mừng đến đôi uyên ương.
            </p>
          </div>

          <div className="space-y-4">
            {/* Chú rể */}
            {card.groom.accountNumber && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-200 p-1 flex items-center justify-center">
                  <img
                    src={card.groom.qrCode || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${card.groom.accountNumber}`}
                    alt={`QR ${card.groom.name}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-gray-400 uppercase">
                    Mừng Chú Rể ({card.groom.name})
                  </p>
                  <p className="text-xs font-bold text-gray-800 mt-0.5 truncate">
                    {card.groom.bankName} • {card.groom.accountNumber}
                  </p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(card.groom.accountNumber!, "groom")}
                    className="mt-2 text-[11px] px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold inline-flex items-center gap-1 transition-colors"
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

            {/* Cô dâu */}
            {card.bride.accountNumber && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-200 p-1 flex items-center justify-center">
                  <img
                    src={card.bride.qrCode || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${card.bride.accountNumber}`}
                    alt={`QR ${card.bride.name}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-gray-400 uppercase">
                    Mừng Cô Dâu ({card.bride.name})
                  </p>
                  <p className="text-xs font-bold text-gray-800 mt-0.5 truncate">
                    {card.bride.bankName} • {card.bride.accountNumber}
                  </p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(card.bride.accountNumber!, "bride")}
                    className="mt-2 text-[11px] px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold inline-flex items-center gap-1 transition-colors"
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
        </section>

        {/* ================= GUESTBOOK WISHES (Sổ lưu bút) ================= */}
        <section className="px-6 py-8 bg-[#faf7f2] relative z-10 border-t border-amber-900/10">
          <div className="text-center mb-6">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">
              Sổ Lưu Bút
            </span>
            <h2 className="text-xl font-serif font-bold text-[#511419] mt-1">
              Gửi Lời Chúc Mừng
            </h2>
          </div>

          <form onSubmit={handleSendWish} className="space-y-3 mb-6">
            <input
              type="text"
              required
              placeholder="Tên của bạn..."
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-zen-primary"
            />
            <textarea
              required
              rows={2}
              placeholder="Gửi lời chúc phúc tốt đẹp nhất đến cặp đôi..."
              value={guestWish}
              onChange={(e) => setGuestWish(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-zen-primary resize-none"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#511419] text-amber-50 text-xs font-bold shadow-md hover:bg-[#3d0f13] transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Gửi lời chúc</span>
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            </button>
          </form>

          {/* Wishes Feed */}
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {card.wishes && card.wishes.length > 0 ? (
              card.wishes.map((w) => (
                <div
                  key={w.id}
                  className="bg-white rounded-xl p-3.5 border border-gray-100 shadow-2xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-gray-900">{w.name}</span>
                    <span className="text-gray-400">{w.createdAt}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{w.content}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">
                Chưa có lời chúc nào. Hãy là người đầu tiên gửi lời chúc nhé!
              </p>
            )}
          </div>
        </section>

        {/* Bottom ZenLove Watermark */}
        <div className="pt-8 pb-12 px-6 text-center text-xs text-gray-400 border-t border-gray-100 relative z-10 bg-white space-y-2">
          <p className="text-[11px]">
            Thiệp cưới online được tạo bởi{" "}
            <Link href="/" className="font-bold text-zen-primary hover:underline">
              ZenLove.me
            </Link>
          </p>
          <Link
            href="/templates"
            className="inline-flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-zen-primary px-4 py-1.5 rounded-full bg-gray-50 border border-gray-200"
          >
            <span>Tạo thiệp cưới miễn phí như mẫu này</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {/* Bottom Floating Share / Action Bar */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 backdrop-blur-md border-t border-gray-200 p-2.5 px-4 flex items-center justify-between z-40 shadow-lg">
          <button
            type="button"
            onClick={() => copyToClipboard(window.location.href, "link")}
            className="flex-1 py-2 px-3 rounded-xl bg-rose-50 text-zen-primary text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-rose-100 transition-colors mr-2"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? "Đã sao chép link!" : "Chia sẻ thiệp"}</span>
          </button>

          <Link
            href={`/design-template/${card.templateId}`}
            className="py-2 px-4 rounded-xl bg-zen-primary text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#d93849] transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chỉnh sửa mẫu này</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
