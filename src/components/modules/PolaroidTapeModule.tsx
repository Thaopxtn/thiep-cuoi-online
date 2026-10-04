"use client";

import React from "react";

export interface PolaroidTapeProps {
  photo: string;
  caption?: string;
  subtext?: string;
}

export default function PolaroidTapeModule({
  photo,
  caption = "Forever",
  subtext,
}: PolaroidTapeProps) {
  return (
    <section className="py-8 px-4 text-center">
      {/* Taped photo */}
      <div className="relative mx-auto max-w-xs bg-white p-3 pt-6 rounded-lg shadow-xl border border-stone-200 transform -rotate-1 hover:rotate-0 transition-transform duration-300">
        {/* Scotch Tape effect */}
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-white/70 backdrop-blur-sm border border-stone-300 shadow-sm opacity-80" />

        <div className="w-full h-72 overflow-hidden rounded">
          <img
            src={photo}
            alt={caption}
            className="w-full h-full object-cover"
          />
        </div>

        {caption && (
          <div className="mt-4 text-center">
            <span className="font-serif italic text-xl text-[#7a5c48]">
              {caption}
            </span>
          </div>
        )}
      </div>

      {subtext && (
        <p className="mt-6 px-4 text-xs sm:text-sm text-stone-600 leading-relaxed font-serif italic max-w-md mx-auto">
          "{subtext}"
        </p>
      )}
    </section>
  );
}
