"use client";

import React, { useState } from "react";
import { Heart, Sparkles, FastForward } from "lucide-react";

interface OpeningEnvelopeIntroProps {
  person1?: string;
  person2?: string;
  eventTitle?: string;
  date?: string;
  theme?: "wedding" | "red" | "birthday" | "sky" | "gold";
  mode?: "fixed" | "absolute";
  onOpen: () => void;
  showSkip?: boolean;
}

export default function OpeningEnvelopeIntro({
  person1 = "Nhân vật chính",
  person2,
  eventTitle = "Thiệp Mời",
  date,
  theme = "wedding",
  mode = "absolute",
  onOpen,
  showSkip = true,
}: OpeningEnvelopeIntroProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const handleOpen = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isOpening) return;
    setIsOpening(true);
    // Play envelope away animation then dismiss
    setTimeout(() => {
      setIsDismissed(true);
      onOpen();
    }, 900);
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    onOpen();
  };

  // Particles for particle-burst
  const particles = [
    { dx: "-80px", dy: "-90px", rot: "120deg" },
    { dx: "85px", dy: "-100px", rot: "-160deg" },
    { dx: "-110px", dy: "20px", rot: "210deg" },
    { dx: "120px", dy: "10px", rot: "-190deg" },
    { dx: "-60px", dy: "110px", rot: "90deg" },
    { dx: "70px", dy: "120px", rot: "-120deg" },
    { dx: "0px", dy: "-140px", rot: "45deg" },
    { dx: "0px", dy: "150px", rot: "-45deg" },
  ];

  const isRed = theme === "red";
  const isBirthday = theme === "birthday";
  const isSky = theme === "sky";

  return (
    <div
      className={`${
        mode === "fixed" ? "fixed z-[100]" : "absolute z-40"
      } inset-0 flex items-center justify-center overflow-hidden select-none transition-opacity duration-300 ${
        isOpening ? "pointer-events-none" : ""
      }`}
      style={{
        background: isRed
          ? "radial-gradient(circle at center, #7f1d1d 0%, #450a0a 100%)"
          : isBirthday
          ? "radial-gradient(circle at center, #1e1b4b 0%, #0f172a 100%)"
          : isSky
          ? "radial-gradient(circle at center, #38bdf8 0%, #0284c7 100%)"
          : "radial-gradient(circle at center, #3f3f46 0%, #18181b 100%)",
      }}
    >
      {/* Ambient Rising Sparkles Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-amber-200/40 blur-[1px]"
            style={{
              width: `${(i % 3) * 3 + 4}px`,
              height: `${(i % 3) * 3 + 4}px`,
              left: `${(i * 19) % 100}%`,
              bottom: "-20px",
              animation: `ambient-rise ${3 + (i % 4)}s linear infinite`,
              animationDelay: `${(i * 0.4) % 3}s`,
              ["--sway" as any]: `${(i % 2 === 0 ? 1 : -1) * (15 + i * 3)}px`,
            }}
          />
        ))}
      </div>

      {/* Skip Button */}
      {showSkip && (
        <button
          type="button"
          onClick={handleSkip}
          className="absolute top-4 right-4 z-[110] flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white/90 text-[11px] font-medium tracking-wider transition-all duration-200 hover:scale-105"
        >
          <span>SKIP</span>
          <FastForward className="w-3 h-3" />
        </button>
      )}

      {/* Envelope Card Container */}
      <div
        className="relative w-[88%] max-w-[320px] aspect-[3/4] flex flex-col items-center justify-between p-5 rounded-[22px] shadow-[0_25px_60px_rgba(0,0,0,0.45)] border border-white/20 text-center"
        style={{
          background: isRed
            ? "linear-gradient(145deg, #991b1b, #7f1d1d)"
            : isBirthday
            ? "linear-gradient(145deg, #312e81, #1e1b4b)"
            : isSky
            ? "linear-gradient(145deg, #0284c7, #0369a1)"
            : "linear-gradient(145deg, #27272a, #18181b)",
          animation: isOpening
            ? "envelope-away 0.85s cubic-bezier(0.4, 0, 0.2, 1) forwards"
            : "none",
        }}
      >
        {/* Top Header */}
        <div className="w-full flex flex-col items-center pt-2">
          <span className="text-[10px] tracking-[0.25em] text-amber-200/80 uppercase font-semibold">
            WEDDING INVITATION
          </span>
          <h2 className="text-xl font-serif text-white mt-1.5 font-bold tracking-wide">
            {eventTitle}
          </h2>
          <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-amber-300 to-transparent mt-2" />
        </div>

        {/* Center Wax Seal with Beating Heart */}
        <div className="relative flex flex-col items-center my-auto">
          {/* Decorative Ring */}
          <div className="relative flex items-center justify-center">
            <div className="w-24 h-24 rounded-full border border-amber-300/40 p-1.5 flex items-center justify-center animate-spin-slow">
              <div className="w-full h-full rounded-full border border-dashed border-amber-300/60" />
            </div>

            {/* Wax Seal Button */}
            <button
              type="button"
              onClick={handleOpen}
              className="absolute w-16 h-16 rounded-full bg-gradient-to-br from-rose-500 to-red-600 shadow-[0_4px_20px_rgba(225,29,72,0.6)] flex items-center justify-center text-white cursor-pointer hover:scale-110 active:scale-95 transition-transform duration-200"
              title="Nhấn để mở thiệp"
            >
              <Heart className="w-8 h-8 fill-white animate-opening-heart drop-shadow" />
            </button>
          </div>

          {/* Particle Burst Elements when Opening */}
          {isOpening &&
            particles.map((p, idx) => (
              <div
                key={idx}
                className="absolute pointer-events-none text-amber-300"
                style={{
                  top: "50%",
                  left: "50%",
                  animation: "particle-burst 0.75s ease-out forwards",
                  ["--dx" as any]: p.dx,
                  ["--dy" as any]: p.dy,
                  ["--rot-end" as any]: p.rot,
                }}
              >
                <Sparkles className="w-5 h-5 fill-amber-300" />
              </div>
            ))}

          <span className="text-xs text-amber-100/90 mt-4 tracking-wider uppercase font-medium">
            Chạm để mở thiệp
          </span>
        </div>

        {/* Bottom Details & Open CTA */}
        <div className="w-full flex flex-col items-center pb-2">
          <p className="text-sm font-serif text-white/90">
            {person2 ? `${person1} & ${person2}` : person1}
          </p>
          {date && (
            <p className="text-xs text-amber-200/70 mt-1 font-mono tracking-wider">
              {date}
            </p>
          )}

          <button
            type="button"
            onClick={handleOpen}
            className="mt-4 px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-900 font-semibold text-xs tracking-wider uppercase shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-stone-900" />
            <span>Mở Thiệp Mời</span>
          </button>
        </div>
      </div>
    </div>
  );
}
