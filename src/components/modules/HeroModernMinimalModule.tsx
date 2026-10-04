"use client";

import React from "react";

export interface HeroModernMinimalProps {
  eventTitle?: string;
  person1: string;
  person2: string;
  date: string;
  time?: string;
  mainPhoto: string;
  venue?: string;
}

export default function HeroModernMinimalModule({
  eventTitle = "THE WEDDING OF",
  person1,
  person2,
  date,
  time = "11:30",
  mainPhoto,
  venue = "Grand Palace",
}: HeroModernMinimalProps) {
  return (
    <section className="relative pt-6 pb-10 px-4 text-center overflow-hidden bg-[#faf8f5] text-stone-900">
      {/* Top Editorial Subtext */}
      <div className="text-[11px] tracking-[0.3em] uppercase text-stone-400 font-serif font-light mb-3">
        {eventTitle}
      </div>

      {/* Main Couple Names */}
      <h1 className="text-3xl sm:text-4xl font-serif text-stone-800 tracking-wide font-normal">
        {person1}
      </h1>
      {person2 && (
        <>
          <div className="font-serif italic text-stone-400 text-lg my-0.5">and</div>
          <h1 className="text-3xl sm:text-4xl font-serif text-stone-800 tracking-wide font-normal">
            {person2}
          </h1>
        </>
      )}

      {/* Elegant Portrait Frame */}
      <div className="relative z-10 my-6 mx-auto w-64 sm:w-72 aspect-[3/4] max-w-xs shadow-2xl rounded-2xl overflow-hidden border-8 border-white">
        <img
          src={mainPhoto}
          alt={person2 ? `${person1} & ${person2}` : person1}
          className="w-full h-full object-cover"
        />
        {/* Subtle gradient overlay at bottom of photo */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent flex items-end justify-center pb-3">
          <span className="text-white text-xs font-serif tracking-widest uppercase">
            Together Forever
          </span>
        </div>
      </div>

      {/* Date & Location Pill */}
      <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white shadow-sm border border-stone-200 text-xs font-serif text-stone-600">
        <span className="font-semibold text-stone-900">
          {date ? date.split("-").reverse().join(" . ") : "2026.12.29"}
        </span>
        <span className="text-stone-300">|</span>
        <span>{time}</span>
        <span className="text-stone-300">|</span>
        <span className="truncate max-w-[120px]">{venue}</span>
      </div>
    </section>
  );
}
