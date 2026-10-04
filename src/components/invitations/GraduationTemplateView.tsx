"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Calendar,
  Clock,
  Heart,
  MessageCircle,
  Gift,
  ThumbsUp,
  Share2,
  ExternalLink,
} from "lucide-react";
import {
  WishesDrawer,
  GiftModal,
  FlyingHeartsOverlay,
  HeartParticle,
  FloatingMusicPlayer,
} from "./InteractiveDrawers";

interface GraduationData {
  eventTitle: string;
  person1: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  mapUrl: string;
  quote: string;
  invitationBody: string;
  signature?: string;
  mainPhoto: string;
  albumPhotos: string[];
  musicTitle: string;
  musicUrl: string;
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    qrImage?: string;
  };
  initialWishes: Array<{
    id: string;
    name: string;
    message: string;
  }>;
}

export default function GraduationTemplateView({
  data,
  interactive = true,
}: {
  data: GraduationData;
  interactive?: boolean;
}) {
  // Countdown state
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Wishes state
  const [wishes, setWishes] = useState(data.initialWishes);
  const [isWishesOpen, setIsWishesOpen] = useState(false);
  const [isGiftOpen, setIsGiftOpen] = useState(false);

  // Likes & Hearts
  const [likesCount, setLikesCount] = useState(25);
  const [hearts, setHearts] = useState<HeartParticle[]>([]);

  useEffect(() => {
    const targetDate = new Date(`${data.date}T${data.time || "08:00"}:00`).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [data.date, data.time]);

  // Handle flying hearts
  const handleShootHeart = () => {
    const newHearts: HeartParticle[] = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      x: 35 + Math.random() * 35,
      y: 0,
      size: 24 + Math.random() * 18,
      color: "#ff4d6d",
    }));

    setHearts((prev) => [...prev, ...newHearts]);
    setLikesCount((prev) => prev + 1);

    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => !newHearts.includes(h)));
    }, 2000);
  };

  const handleAddWish = (name: string, message: string) => {
    setWishes((prev) => [{ id: Date.now().toString(), name, message }, ...prev]);
  };

  // Calendar calculations
  const eventDate = new Date(data.date);
  const eventDay = eventDate.getDate() || 10;
  const eventMonth = eventDate.getMonth() + 1 || 3;
  const eventYear = eventDate.getFullYear() || 2026;

  return (
    <div className="relative w-full h-full min-h-screen bg-[#61a5c2] text-gray-800 font-sans overflow-y-auto overflow-x-hidden select-none">
      {/* Floating Hearts Particles */}
      <FlyingHeartsOverlay hearts={hearts} />

      {/* Music Player */}
      {interactive && (
        <div className="absolute top-4 right-4 z-40">
          <FloatingMusicPlayer
            musicUrl={data.musicUrl}
            musicTitle={data.musicTitle}
          />
        </div>
      )}

      {/* ================= SECTION 1: HERO SKY & COUNTDOWN ================= */}
      <section className="relative min-h-[580px] bg-gradient-to-b from-[#3a86c8] via-[#6ba4d6] to-[#a0c4e2] pt-8 pb-12 px-4 flex flex-col items-center text-center overflow-hidden">
        {/* Watercolor Clouds */}
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/60 via-transparent to-transparent" />

        {/* Title */}
        <h1 className="relative z-10 text-3xl sm:text-4xl font-extrabold text-white tracking-wide drop-shadow-md">
          {data.eventTitle}
        </h1>
        <h2 className="relative z-10 text-2xl sm:text-3xl font-bold text-amber-300 mt-2 font-serif drop-shadow">
          {data.person1}
        </h2>

        {/* Countdown */}
        <div className="relative z-10 grid grid-cols-4 gap-2 mt-6 max-w-[280px]">
          {[
            { label: "Ngày", val: timeLeft.days },
            { label: "Giờ", val: timeLeft.hours },
            { label: "Phút", val: timeLeft.minutes },
            { label: "Giây", val: timeLeft.seconds },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white/70 backdrop-blur-md rounded-2xl py-2 px-1 flex flex-col items-center shadow-sm border border-white/40"
            >
              <span className="text-lg sm:text-xl font-black text-[#1e6091] leading-none">
                {String(item.val).padStart(2, "0")}
              </span>
              <span className="text-[10px] text-[#2c7da0] font-medium mt-0.5">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Graduate Portrait */}
        <div className="relative z-10 mt-8 w-60 h-60 sm:w-68 sm:h-68 rounded-full p-2 bg-white/40 shadow-xl overflow-hidden backdrop-blur-xs">
          <img
            src={data.mainPhoto}
            alt={data.person1}
            className="w-full h-full object-cover rounded-full"
          />
        </div>
      </section>

      {/* ================= SECTION 2: CALENDAR ================= */}
      <section className="bg-white/90 backdrop-blur-md py-8 px-5 mx-3 my-4 rounded-3xl shadow-lg border border-sky-100">
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-[#1e6091] font-serif">
            Lịch Tốt Nghiệp
          </h3>
          <p className="text-xs text-[#468faf] font-medium">
            Tháng {eventMonth} năm {eventYear}
          </p>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {["Hai", "Ba", "Tư", "Năm", "Sáu", "Bảy", "CN"].map((day, idx) => (
            <div
              key={idx}
              className="py-1.5 font-bold text-sky-800 bg-sky-50 rounded-lg text-[11px]"
            >
              {day}
            </div>
          ))}

          {/* Simple representative month days */}
          {Array.from({ length: 31 }).map((_, i) => {
            const dayNum = i + 1;
            const isEvent = dayNum === eventDay;
            return (
              <div
                key={i}
                className={`py-2 rounded-xl flex items-center justify-center font-medium transition-all ${
                  isEvent
                    ? "bg-[#ff4d6d] text-white font-bold shadow-md scale-105"
                    : "text-gray-700 hover:bg-sky-50"
                }`}
              >
                {dayNum}
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= SECTION 3: GRATITUDE ================= */}
      <section className="bg-white/95 py-8 px-5 mx-3 my-4 rounded-3xl shadow-lg border border-sky-100 text-center">
        <h3 className="text-xl font-bold text-[#1e6091] font-serif">
          Hoàn thành hành trình
        </h3>
        <h4 className="text-base font-semibold text-rose-500 mt-1">
          Tri ân sâu sắc
        </h4>

        <p className="text-xs sm:text-sm text-gray-600 mt-4 leading-relaxed whitespace-pre-line italic">
          "{data.quote}"
        </p>

        {/* Album Showcase */}
        {data.albumPhotos && data.albumPhotos.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-5">
            {data.albumPhotos.slice(0, 2).map((photo, i) => (
              <img
                key={i}
                src={photo}
                alt="Kỷ niệm"
                className="w-full h-36 object-cover rounded-2xl shadow"
              />
            ))}
          </div>
        )}
      </section>

      {/* ================= SECTION 4: INVITATION LETTER ================= */}
      <section className="bg-white/95 py-8 px-5 mx-3 my-4 rounded-3xl shadow-lg border border-sky-100">
        <div className="text-center mb-4">
          <span className="text-xs uppercase font-bold text-sky-500 tracking-widest">
            Thư Mời
          </span>
          <h3 className="text-2xl font-bold text-gray-900 font-serif mt-1">
            Bạn Thân Mến
          </h3>
        </div>

        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
          {data.invitationBody}
        </p>

        {/* Event Details Card */}
        <div className="mt-5 bg-sky-50/80 rounded-2xl p-4 border border-sky-100 space-y-2.5 text-xs text-gray-700">
          <div className="flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-gray-900">Thời gian:</span>{" "}
              {data.time} - Ngày {data.date}
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-gray-900">Địa điểm:</span>{" "}
              {data.venue}
              <div className="text-gray-500 text-[11px] mt-0.5">{data.address}</div>
            </div>
          </div>
        </div>

        {/* Map CTA */}
        {data.mapUrl && (
          <a
            href={data.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Xem đường đi trên Google Maps</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        )}

        {/* Signature */}
        {data.signature && (
          <div className="mt-6 text-right font-signature text-2xl text-sky-700 pr-2">
            {data.signature}
          </div>
        )}
      </section>

      {/* ================= FLOATING WISHES CHAT STREAM ================= */}
      <div className="px-4 mb-24 pointer-events-none space-y-2 max-w-sm">
        {wishes.slice(0, 4).map((w, idx) => (
          <div
            key={w.id || idx}
            className="bg-black/40 backdrop-blur-md text-white rounded-full py-1 px-3.5 text-xs inline-flex items-center gap-1.5 shadow-sm max-w-full truncate animate-fade-in"
          >
            <span className="font-bold text-amber-300 shrink-0">{w.name}:</span>
            <span className="truncate">{w.message}</span>
          </div>
        ))}
      </div>

      {/* ================= BOTTOM FLOATING ACTION BAR ================= */}
      {interactive && (
        <div className="fixed bottom-3 inset-x-0 z-50 px-3 flex justify-center">
          <div className="bg-gray-900/85 backdrop-blur-md rounded-full px-3 py-2 flex items-center gap-2 shadow-2xl border border-white/20 max-w-md w-full justify-between">
            {/* Wish button */}
            <button
              onClick={() => setIsWishesOpen(true)}
              className="flex-1 py-1.5 px-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-medium flex items-center justify-center gap-1 transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="truncate">Gửi lời chúc...</span>
            </button>

            {/* Shoot heart button */}
            <button
              onClick={handleShootHeart}
              className="py-1.5 px-3 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-medium flex items-center gap-1 transition-all active:scale-90"
            >
              <span>👏</span>
              <span>Bắn tim</span>
            </button>

            {/* Gift button */}
            <button
              onClick={() => setIsGiftOpen(true)}
              title="Mừng quà tốt nghiệp"
              className="w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow transition-all active:scale-90"
            >
              <Gift className="w-4 h-4" />
            </button>

            {/* Likes count */}
            <div className="flex items-center gap-1 text-white text-xs px-2">
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              <span className="font-mono">{likesCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* Modals & Drawers */}
      <WishesDrawer
        isOpen={isWishesOpen}
        onClose={() => setIsWishesOpen(false)}
        onSubmit={handleAddWish}
      />

      <GiftModal
        isOpen={isGiftOpen}
        onClose={() => setIsGiftOpen(false)}
        bankInfo={data.bankInfo}
      />
    </div>
  );
}
