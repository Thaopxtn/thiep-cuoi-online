"use client";

import React from "react";

export interface HeroFloralRusticProps {
  eventTitle?: string;
  person1: string;
  person2: string;
  date: string;
  mainPhoto: string;
  quote?: string;
}

export default function HeroFloralRusticModule({
  eventTitle = "Save The Date",
  person1,
  person2,
  date,
  mainPhoto,
  quote = "We decided on forever",
}: HeroFloralRusticProps) {
  return (
    <section className="relative pt-8 pb-12 px-4 text-center overflow-hidden bg-[#f4f7f4] text-stone-800">
      {/* Botanical floral decorative icons */}
      <div className="absolute top-4 left-4 text-emerald-600/30 text-2xl">🌿</div>
      <div className="absolute top-6 right-6 text-rose-400/40 text-2xl">🌸</div>
      <div className="absolute top-44 left-3 text-emerald-600/20 text-xl">🍃</div>
      <div className="absolute top-52 right-4 text-emerald-600/20 text-xl">🌿</div>

      {/* Header */}
      <div className="relative z-10 space-y-1">
        <span className="text-[11px] uppercase tracking-[0.25em] text-emerald-700 font-medium">
          {eventTitle}
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif text-[#2d4a3e] italic font-normal">
          {person1} & {person2}
        </h1>
        <p className="text-xs text-stone-500 font-serif italic">{quote}</p>
      </div>

      {/* Arched Floral Photo */}
      <div className="relative z-10 my-6 mx-auto w-64 sm:w-72 aspect-[4/5] flex items-center justify-center">
        <div className="w-full h-full rounded-t-full rounded-b-2xl overflow-hidden border-4 border-white shadow-xl bg-white p-1">
          <img
            src={mainPhoto}
            alt={`${person1} & ${person2}`}
            className="w-full h-full object-cover rounded-t-full rounded-b-xl"
          />
        </div>
      </div>

      {/* Date */}
      <div className="relative z-10 text-[#2d4a3e] font-serif text-sm tracking-widest font-semibold">
        {date ? date.split("-").reverse().join(" . ") : "2026 . 10 . 15"}
      </div>
    </section>
  );
}
