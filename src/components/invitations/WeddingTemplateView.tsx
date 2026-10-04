"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Clock,
  Heart,
  MessageCircle,
  Gift,
  Mail,
  ExternalLink,
  Star,
} from "lucide-react";
import {
  WishesDrawer,
  GiftModal,
  RsvpModal,
  FlyingHeartsOverlay,
  HeartParticle,
  FloatingMusicPlayer,
} from "./InteractiveDrawers";

interface WeddingData {
  eventTitle: string;
  person1: string;
  person2?: string;
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

export default function WeddingTemplateView({
  data,
  interactive = true,
}: {
  data: WeddingData;
  interactive?: boolean;
}) {
  const [wishes, setWishes] = useState(data.initialWishes);
  const [isWishesOpen, setIsWishesOpen] = useState(false);
  const [isGiftOpen, setIsGiftOpen] = useState(false);
  const [isRsvpOpen, setIsRsvpOpen] = useState(false);

  // Likes & Hearts
  const [likesCount, setLikesCount] = useState(110);
  const [hearts, setHearts] = useState<HeartParticle[]>([]);

  // Inline RSVP form state
  const [rsvpName, setRsvpName] = useState("");
  const [rsvpAttending, setRsvpAttending] = useState(true);
  const [rsvpGuests, setRsvpGuests] = useState(1);
  const [rsvpDone, setRsvpDone] = useState(false);

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

  const handleInlineRsvp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName.trim()) return;
    setRsvpDone(true);
    setTimeout(() => setRsvpDone(false), 3000);
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-[#faf7f2] text-[#594d46] font-sans overflow-y-auto overflow-x-hidden select-none">
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

      {/* ================= SECTION 1: FLOATING STARS & ENVELOPE ================= */}
      <section className="relative pt-6 pb-12 px-4 text-center overflow-hidden">
        {/* Top Hashtags */}
        <div className="flex justify-between items-center text-xs font-serif text-stone-500 px-3 mb-6">
          <span>#weddingForever</span>
          <span>
            #{data.person1} & #{data.person2 || "CôDâu"}
          </span>
        </div>

        {/* Decorative Floating Stars */}
        <div className="absolute top-12 left-6 text-amber-300 animate-pulse text-2xl">
          ⭐
        </div>
        <div className="absolute top-20 right-8 text-amber-300 animate-bounce text-xl">
          ✨
        </div>
        <div className="absolute top-64 left-4 text-amber-300 text-lg">
          🌟
        </div>

        {/* Rising Envelope Mockup */}
        <div className="relative mx-auto w-72 sm:w-80 aspect-[4/5] flex items-center justify-center">
          {/* Back flap */}
          <div className="absolute inset-0 bg-[#e3ded6] rounded-2xl shadow-md transform rotate-1" />

          {/* Photo emerging from envelope */}
          <div className="relative z-10 w-64 h-72 rounded-xl overflow-hidden shadow-xl border-4 border-white transform -translate-y-4 hover:-translate-y-6 transition-transform duration-500">
            <img
              src={data.mainPhoto}
              alt="Ảnh cưới cô dâu chú rể"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Front folded envelope */}
          <div className="absolute bottom-0 inset-x-0 h-36 bg-[#f0eae1] rounded-b-2xl border-t-2 border-[#ded8cf] shadow-inner z-20 flex items-center justify-center">
            <span className="text-stone-400 text-xs font-serif tracking-widest uppercase">
              Save The Date
            </span>
          </div>
        </div>

        {/* Welcome Text */}
        <div className="mt-8">
          <h1 className="text-3xl sm:text-4xl font-serif text-[#4a3f35] italic tracking-wide">
            {data.eventTitle}
          </h1>
          <p className="text-sm font-serif tracking-widest text-stone-500 mt-2">
            {data.date.replace(/-/g, ".")}
          </p>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#8c6d58] mt-2">
            {data.person1} & {data.person2}
          </h2>
        </div>
      </section>

      {/* ================= SECTION 2: POLAROID PHOTO & QUOTE ================= */}
      <section className="py-8 px-4 text-center">
        {/* Taped photo */}
        <div className="relative mx-auto max-w-xs bg-white p-3 pt-6 rounded-lg shadow-xl border border-stone-200 transform -rotate-1">
          {/* Tape */}
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-white/70 backdrop-blur-sm border border-stone-300 shadow-sm opacity-80" />

          <img
            src={
              data.albumPhotos && data.albumPhotos[0]
                ? data.albumPhotos[0]
                : data.mainPhoto
            }
            alt="Khoảnh khắc hạnh phúc"
            className="w-full h-72 object-cover rounded"
          />

          <div className="mt-4 text-center">
            <span className="font-serif italic text-xl text-[#7a5c48]">
              Forever
            </span>
          </div>
        </div>

        {/* Romantic quote */}
        <p className="mt-6 px-4 text-xs sm:text-sm text-stone-600 leading-relaxed font-serif italic max-w-md mx-auto">
          "{data.quote}"
        </p>
      </section>

      {/* ================= SECTION 3: VENUE & GOOGLE MAPS ================= */}
      <section className="py-8 px-4 max-w-md mx-auto">
        <div className="bg-white/95 rounded-3xl p-5 shadow-lg border border-stone-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#8c6d58]/10 text-[#8c6d58] flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="font-serif font-bold text-gray-900 text-base">
                Địa điểm tổ chức
              </h3>
              <p className="text-xs text-stone-500">
                {data.time} - Ngày {data.date}
              </p>
            </div>
          </div>

          <div className="space-y-1 text-left text-xs text-stone-700 bg-stone-50 p-3.5 rounded-2xl border border-stone-100">
            <div className="font-semibold text-gray-900 text-sm">
              {data.venue}
            </div>
            <div className="text-stone-500 leading-relaxed">{data.address}</div>
          </div>

          {data.mapUrl && (
            <a
              href={data.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full py-2.5 rounded-xl bg-[#8c6d58] hover:bg-[#735845] text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Chỉ đường trên Google Maps</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          )}
        </div>
      </section>

      {/* ================= SECTION 4: INLINE RSVP FORM ================= */}
      <section className="py-8 px-4 max-w-md mx-auto mb-20">
        <div className="bg-white rounded-3xl p-5 shadow-xl border border-stone-200 text-center">
          <h3 className="text-xl font-serif font-bold text-gray-900">
            Xác nhận tham dự
          </h3>
          <p className="text-xs text-stone-500 mt-1 mb-5">
            Sự hiện diện của bạn là niềm vui trọn vẹn của chúng mình!
          </p>

          {rsvpDone ? (
            <div className="py-6">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                ✓
              </div>
              <p className="text-sm font-semibold text-gray-800">
                Cảm ơn bạn đã gửi xác nhận!
              </p>
            </div>
          ) : (
            <form onSubmit={handleInlineRsvp} className="space-y-3.5 text-left text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  required
                  value={rsvpName}
                  onChange={(e) => setRsvpName(e.target.value)}
                  placeholder="Nhập tên của bạn..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-[#8c6d58]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Bạn sẽ tham dự chứ?
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 p-2 rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-50">
                    <input
                      type="radio"
                      name="attending"
                      checked={rsvpAttending}
                      onChange={() => setRsvpAttending(true)}
                      className="accent-[#8c6d58]"
                    />
                    <span className="font-medium text-gray-800">
                      Có, tôi sẽ tham dự
                    </span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-50">
                    <input
                      type="radio"
                      name="attending"
                      checked={!rsvpAttending}
                      onChange={() => setRsvpAttending(false)}
                      className="accent-[#8c6d58]"
                    />
                    <span className="font-medium text-gray-800">
                      Tôi bận, rất tiếc không thể tham dự
                    </span>
                  </label>
                </div>
              </div>

              {rsvpAttending && (
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Số lượng người tham dự
                  </label>
                  <select
                    value={rsvpGuests}
                    onChange={(e) => setRsvpGuests(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-[#8c6d58] bg-white"
                  >
                    <option value={1}>1 người</option>
                    <option value={2}>2 người</option>
                    <option value={3}>3 người</option>
                    <option value={4}>4 người</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#8c6d58] hover:bg-[#735845] text-white font-semibold text-xs shadow-md transition-colors"
              >
                Gửi xác nhận
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-stone-100">
            <h4 className="font-serif italic text-2xl text-[#8c6d58]">
              Thank you
            </h4>
            <p className="text-[11px] text-stone-500 mt-1">
              Rất mong được gặp bạn tại đám cưới của chúng mình.
            </p>
          </div>
        </div>
      </section>

      {/* ================= FLOATING WISHES CHAT STREAM ================= */}
      <div className="px-4 mb-24 pointer-events-none space-y-2 max-w-sm">
        {wishes.slice(0, 4).map((w, idx) => (
          <div
            key={w.id || idx}
            className="bg-stone-900/65 backdrop-blur-md text-white rounded-full py-1 px-3.5 text-xs inline-flex items-center gap-1.5 shadow-sm max-w-full truncate animate-fade-in"
          >
            <span className="font-bold text-amber-200 shrink-0">{w.name}:</span>
            <span className="truncate">{w.message}</span>
          </div>
        ))}
      </div>

      {/* ================= BOTTOM FLOATING ACTION BAR ================= */}
      {interactive && (
        <div className="fixed bottom-3 inset-x-0 z-50 px-3 flex justify-center">
          <div className="bg-stone-900/85 backdrop-blur-md rounded-full px-3 py-2 flex items-center gap-2 shadow-2xl border border-white/20 max-w-md w-full justify-between">
            {/* RSVP Trigger */}
            <button
              onClick={() => setIsRsvpOpen(true)}
              className="py-1.5 px-3 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center gap-1 transition-all active:scale-90"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>RSVP</span>
            </button>

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
              title="Mừng cưới cô dâu chú rể"
              className="w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow transition-all active:scale-90"
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

      {/* Modals */}
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

      <RsvpModal
        isOpen={isRsvpOpen}
        onClose={() => setIsRsvpOpen(false)}
        onConfirm={(name, attending, guests) => {
          setRsvpName(name);
          setRsvpAttending(attending);
          setRsvpGuests(guests);
          setRsvpDone(true);
        }}
      />
    </div>
  );
}
