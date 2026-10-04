"use client";

import React from "react";
import { Crown } from "lucide-react";

export interface HeroLuxuryGoldProps {
  eventTitle?: string;
  person1: string;
  person2: string;
  date: string;
  mainPhoto: string;
  subTitle?: string;
}

export default function HeroLuxuryGoldModule({
  eventTitle = "ROYAL WEDDING INVITATION",
  person1,
  person2,
  date,
  mainPhoto,
  subTitle = "Trân trọng kính mời quý khách đến dự lễ thành hôn",
}: HeroLuxuryGoldProps) {
  return (
    <section className="relative pt-8 pb-12 px-4 text-center overflow-hidden bg-gradient-to-b from-[#0f1115] via-[#181b22] to-[#0a0c0e] text-[#f4d06f]">
      {/* Subtle gold sparkles */}
      <div className="absolute top-6 left-6 text-amber-300 animate-pulse text-xl">
        ✨
      </div>
      <div className="absolute top-12 right-8 text-amber-400 text-lg">✦</div>
      <div className="absolute top-48 left-4 text-amber-200 text-sm">✦</div>
      <div className="absolute top-56 right-6 text-amber-300 text-xl animate-pulse">
        ✨
      </div>

      {/* Royal Crown Insignia */}
      <div className="relative z-10 w-12 h-12 mx-auto mb-2 rounded-full border border-amber-400/40 flex items-center justify-center bg-amber-400/10 shadow-lg">
        <Crown className="w-5 h-5 text-amber-300" />
      </div>

      {/* Subtext */}
      <div className="relative z-10">
        <span className="text-[10px] uppercase tracking-[0.3em] text-amber-300/80 font-serif font-light">
          {eventTitle}
        </span>
        <p className="text-xs text-amber-100/70 font-serif italic mt-1 max-w-xs mx-auto">
          {subTitle}
        </p>
      </div>

      {/* Couple Names in Shimmering Gold */}
      <div className="relative z-10 my-6 py-2 border-y border-amber-400/30 max-w-xs mx-auto">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 tracking-wider">
          {person1}
        </h1>
        <div className="text-amber-400/80 text-sm font-serif my-0.5">&</div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 tracking-wider">
          {person2}
        </h1>
      </div>

      {/* Luxury Photo Frame with Gold Border */}
      <div className="relative z-10 my-4 mx-auto w-64 sm:w-72 aspect-[4/5] flex items-center justify-center">
        {/* Outer gold glow border */}
        <div className="w-full h-full p-2 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-300 to-amber-500 shadow-[0_0_25px_rgba(234,179,8,0.25)]">
          <div className="w-full h-full rounded-xl overflow-hidden bg-black">
            <img
              src={mainPhoto}
              alt={`${person1} & ${person2}`}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Date */}
      <div className="relative z-10 mt-6 text-amber-300 font-serif text-sm tracking-widest">
        {date ? date.split("-").reverse().join(" . ") : "2026 . 12 . 29"}
      </div>
    </section>
  );
}
