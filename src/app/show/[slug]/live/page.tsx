"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Heart,
  QrCode,
  Sparkles,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  MessageSquare,
  Users,
  ChevronLeft,
  Calendar,
  MapPin,
  Image as ImageIcon,
} from "lucide-react";
import {
  fetchCardFromServer,
  WeddingCard,
  WeddingWish,
} from "@/lib/weddingCardService";
import FallingPetals from "@/components/FallingPetals";
import CinematicEffectsOverlay from "@/components/show/CinematicEffectsOverlay";
import { weddingSounds } from "@/lib/soundEffects";

export default function LiveWeddingScreen() {
  const params = useParams();
  const slug = (params?.slug as string) || "";

  const [card, setCard] = useState<WeddingCard | null>(null);
  const [wishes, setWishes] = useState<WeddingWish[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [lastWishId, setLastWishId] = useState<string | null>(null);
  const [newWishAlert, setNewWishAlert] = useState<WeddingWish | null>(null);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Tải thông tin thiệp
  useEffect(() => {
    async function loadCard() {
      const c = await fetchCardFromServer(slug);
      if (c) {
        setCard(c);
        if (Array.isArray(c.wishes)) {
          setWishes(c.wishes);
          if (c.wishes.length > 0) {
            setLastWishId(c.wishes[0].id);
          }
        }
      }
    }
    loadCard();
  }, [slug]);

  // Photo slideshow rotation every 7 seconds
  const albumPhotos = card?.album && card.album.length > 0
    ? card.album
    : card?.coverImage
    ? [card.coverImage]
    : [];

  useEffect(() => {
    if (albumPhotos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentPhotoIdx((prev) => (prev + 1) % albumPhotos.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [albumPhotos.length]);

  // 2. Tự động đồng bộ lời chúc thời gian thực mỗi 4 giây
  const fetchLiveWishes = useCallback(async () => {
    try {
      const res = await fetch(`/api/show/${slug}/wishes`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.wishes)) {
          const freshWishes: WeddingWish[] = data.wishes;
          setWishes(freshWishes);

          // Phát hiện lời chúc mới nhất xuất hiện
          if (freshWishes.length > 0 && freshWishes[0].id !== lastWishId) {
            setLastWishId(freshWishes[0].id);
            setNewWishAlert(freshWishes[0]);
            try {
              weddingSounds.playCelebration();
            } catch {}
            setTimeout(() => setNewWishAlert(null), 7000);
          }
        }
      }
    } catch {}
  }, [slug, lastWishId]);

  useEffect(() => {
    const timer = setInterval(fetchLiveWishes, 4000);
    return () => clearInterval(timer);
  }, [fetchLiveWishes]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Toggle Audio
  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isAudioPlaying) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsAudioPlaying(true)).catch(() => {});
    }
  };

  const groomName = card?.groom?.name || "Chú Rể";
  const brideName = card?.bride?.name || "Cô Dâu";
  const weddingDate = card?.weddingDate || "2026-11-20";
  const venue = card?.events?.[0]?.venue || "Trung tâm Tiệc cưới";
  const cardUrl = typeof window !== "undefined" ? `${window.location.origin}/show/${slug}` : "";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&margin=10&data=${encodeURIComponent(
    cardUrl
  )}`;

  return (
    <div className="relative min-h-screen w-full bg-[#16080e] text-white overflow-hidden flex flex-col font-sans select-none">
      {/* Cinematic Falling Petals & Light Leaks */}
      <FallingPetals effectType="sparkles" density={20} />
      <CinematicEffectsOverlay enableLightLeaks={true} enableTouchSparkles={false} />

      {/* Audio element if available */}
      {card?.musicUrl && <audio ref={audioRef} src={card.musicUrl} loop />}

      {/* Background Slideshow with Soft Blur Overlay */}
      {albumPhotos.length > 0 && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <img
            key={currentPhotoIdx}
            src={albumPhotos[currentPhotoIdx]}
            alt="Wedding Slideshow"
            className="w-full h-full object-cover blur-md brightness-[0.25] scale-105 transition-all duration-1000 ease-in-out"
          />
          <div className="absolute inset-0 bg-radial-[circle_at_center,rgba(0,0,0,0.1)_0%,rgba(0,0,0,0.85)_100%]" />
        </div>
      )}

      {/* Top Banner / Navigation */}
      <header className="relative z-20 px-6 py-4 flex items-center justify-between border-b border-rose-500/20 bg-black/40 backdrop-blur-md">
        <Link
          href={`/show/${slug}`}
          className="flex items-center gap-2 text-xs font-semibold text-rose-200 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Về trang thiệp</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            <span>Màn Hình Sân Khấu Tiệc Cưới</span>
          </span>

          {card?.musicUrl && (
            <button
              onClick={toggleAudio}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
              title={isAudioPlaying ? "Tắt nhạc" : "Bật nhạc"}
            >
              {isAudioPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
            title="Toàn màn hình"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Stage Grid */}
      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 md:p-10 items-center">
        {/* Left Column: Couple Showcase & QR Scan Code */}
        <section className="lg:col-span-5 flex flex-col items-center text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-widest shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>LỄ THÀNH HÔN TRỌN ĐỜI</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight gold-foil-shimmer">
            {groomName}
            <span className="text-rose-400 mx-3 text-3xl sm:text-4xl font-normal">&amp;</span>
            {brideName}
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm text-rose-200/90 font-medium">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-rose-400" />
              <span>{weddingDate}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-rose-400" />
              <span>{venue}</span>
            </div>
          </div>

          {/* Interactive Banquet QR Card */}
          <div className="mt-4 p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl flex flex-col items-center max-w-xs w-full animate-fade-in hover:scale-105 transition-transform duration-300">
            <div className="p-3 bg-white rounded-2xl shadow-inner">
              <img
                src={qrUrl}
                alt="Quét mã QR gửi lời chúc"
                className="w-44 h-44 object-contain rounded-xl"
              />
            </div>
            <p className="mt-3.5 text-xs font-bold text-amber-300 uppercase tracking-wide text-center flex items-center gap-1.5">
              <QrCode className="w-4 h-4" />
              <span>Quét mã QR tại bàn tiệc</span>
            </p>
            <p className="text-[11px] text-gray-300 mt-1 text-center leading-relaxed">
              Gửi lời chúc & mừng cưới để hiển thị trực tiếp lên màn hình LED
            </p>
          </div>
        </section>

        {/* Right Column: Live Floating Wishes Feed */}
        <section className="lg:col-span-7 flex flex-col h-[75vh] max-h-[720px] bg-white/10 backdrop-blur-md rounded-3xl border border-white/15 p-6 overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-5 h-5 text-rose-400 animate-pulse" />
              <h2 className="text-lg font-bold">Sổ Lời Chúc Trực Tiếp (Live Feed)</h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-rose-300">
              <Users className="w-4 h-4" />
              <span>{wishes.length} lời chúc phúc</span>
            </div>
          </div>

          {/* Newest Wish Highlight Popup with celebration animation */}
          {newWishAlert && (
            <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/40 via-rose-500/40 to-amber-500/40 border border-amber-300 shadow-xl animate-in fade-in slide-in-from-top-4 duration-500 flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-400 text-amber-950 font-black flex items-center justify-center shrink-0 text-xl shadow-md animate-bounce">
                🎉
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-amber-200 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Lời chúc mới nhất vừa gửi tới hai bạn!</span>
                </span>
                <p className="text-base font-bold text-white mt-0.5">{newWishAlert.name}</p>
                <p className="text-xs sm:text-sm text-rose-100 mt-1 line-clamp-2 italic font-serif">
                  "{newWishAlert.content}"
                </p>
              </div>
            </div>
          )}

          {/* Continuous Scrollable Wishes Stream */}
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 custom-scrollbar">
            {wishes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-8">
                <Heart className="w-12 h-12 text-rose-500/40 mb-3 animate-pulse" />
                <p className="text-sm font-medium">Chưa có lời chúc mừng nào</p>
                <p className="text-xs text-gray-500 mt-1">
                  Hãy là người đầu tiên quét mã QR trên bàn tiệc để gửi lời chúc đến cô dâu chú rể!
                </p>
              </div>
            ) : (
              wishes.map((w, idx) => (
                <div
                  key={w.id || idx}
                  className="p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 transition-all flex items-start gap-3.5"
                >
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white font-bold flex items-center justify-center text-sm shadow-md shrink-0">
                    {w.name ? w.name.charAt(0).toUpperCase() : "❤️"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-amber-200 truncate">{w.name}</h4>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {w.createdAt ? new Date(w.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "Vừa xong"}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-100 mt-1.5 leading-relaxed font-light">
                      "{w.content}"
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
