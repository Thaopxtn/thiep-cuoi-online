"use client";

import React from "react";

export interface HeroEnvelopeProps {
  eventTitle: string;
  person1: string;
  person2?: string;
  date: string;
  mainPhoto: string;
  hashtags?: string[];
}

export default function HeroEnvelopeModule({
  eventTitle,
  person1,
  person2,
  date,
  mainPhoto,
  hashtags = ["#weddingForever"],
}: HeroEnvelopeProps) {
  return (
    <section className="relative pt-6 pb-10 px-4 text-center overflow-hidden bg-[#faf7f2]">
      {/* Top Hashtags */}
      <div className="flex justify-between items-center text-xs font-serif text-stone-500 px-3 mb-6">
        <span>{hashtags[0] || "#weddingForever"}</span>
        <span>
          #{person1} & #{person2 || "CôDâu"}
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
            src={mainPhoto}
            alt="Ảnh cưới"
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
          {eventTitle}
        </h1>
        <p className="text-sm font-serif tracking-widest text-stone-500 mt-2">
          {date.replace(/-/g, ".")}
        </p>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#8c6d58] mt-2">
          {person1} & {person2}
        </h2>
      </div>
    </section>
  );
}
