"use client";

import React from "react";

export interface HeroTraditionalRedProps {
  eventTitle?: string;
  person1: string;
  person2: string;
  date: string;
  mainPhoto: string;
  subTitle?: string;
}

export default function HeroTraditionalRedModule({
  eventTitle = "THIỆP MỜI CƯỚI",
  person1,
  person2,
  date,
  mainPhoto,
  subTitle = "Trân trọng kính mời tới dự lễ thành hôn của chúng tôi",
}: HeroTraditionalRedProps) {
  return (
    <section className="relative pt-8 pb-12 px-4 text-center overflow-hidden bg-gradient-to-b from-[#8B0000] via-[#990000] to-[#670000] text-[#fbf1c7]">
      {/* Traditional Pattern overlay */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffd700_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

      {/* Decorative Golden Double Happiness Symbol */}
      <div className="relative z-10 w-14 h-14 mx-auto mb-3 rounded-full border-2 border-amber-300/80 flex items-center justify-center bg-red-950/40 shadow-inner">
        <span className="text-2xl font-serif text-amber-300 select-none">囍</span>
      </div>

      {/* Header */}
      <div className="relative z-10 space-y-1">
        <span className="text-[11px] uppercase tracking-[0.25em] text-amber-200/90 font-semibold">
          Wedding Invitation
        </span>
        <h1 className="text-2xl sm:text-3xl font-serif font-black text-amber-300 tracking-wider">
          {eventTitle}
        </h1>
        <p className="text-xs text-amber-100/80 italic font-serif max-w-xs mx-auto pt-1">
          {subTitle}
        </p>
      </div>

      {/* Couple Names in Gold Cursive/Serif */}
      <div className="relative z-10 my-6 py-2 border-y border-amber-300/30 max-w-xs mx-auto">
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-amber-200 tracking-wide">
          {person1}
        </h2>
        <div className="text-amber-400 text-sm my-0.5">&</div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-amber-200 tracking-wide">
          {person2}
        </h2>
      </div>

      {/* Traditional Red Envelope with Wax Seal and Photo */}
      <div className="relative z-10 mx-auto w-64 sm:w-72 aspect-[4/5] mt-4 flex items-center justify-center">
        {/* Red envelope frame */}
        <div className="absolute inset-0 bg-[#700000] rounded-2xl border-2 border-amber-400/50 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-400/10 via-transparent to-transparent" />
        </div>

        {/* Photo in arched frame */}
        <div className="relative z-10 w-56 h-64 rounded-t-full rounded-b-xl overflow-hidden border-2 border-amber-300 shadow-xl">
          <img
            src={mainPhoto}
            alt="Ảnh cưới truyền thống"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Golden Seal */}
        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 z-20 w-10 h-10 rounded-full bg-amber-400 border-2 border-amber-100 shadow-lg flex items-center justify-center text-red-900 font-serif font-black text-xs">
          囍
        </div>
      </div>

      {/* Date */}
      <div className="relative z-10 mt-8 text-amber-200 font-serif text-sm tracking-widest">
        {date ? date.split("-").reverse().join(" . ") : "20 . 02 . 2026"}
      </div>
    </section>
  );
}
