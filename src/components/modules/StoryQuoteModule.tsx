"use client";

import React from "react";

export interface StoryQuoteProps {
  heading?: string;
  subheading?: string;
  quote: string;
  theme?: "sky" | "wedding" | "minimal";
}

export default function StoryQuoteModule({
  heading = "Lời Yêu Thương",
  subheading,
  quote,
  theme = "wedding",
}: StoryQuoteProps) {
  const isSky = theme === "sky";

  return (
    <section
      className={`py-8 px-5 mx-3 my-4 rounded-3xl shadow-lg border text-center ${
        isSky
          ? "bg-white/95 border-sky-100"
          : "bg-white border-stone-200"
      }`}
    >
      {heading && (
        <h3
          className={`text-xl font-bold font-serif ${
            isSky ? "text-[#1e6091]" : "text-[#4a3f35]"
          }`}
        >
          {heading}
        </h3>
      )}

      {subheading && (
        <h4
          className={`text-base font-semibold mt-1 ${
            isSky ? "text-rose-500" : "text-[#8c6d58]"
          }`}
        >
          {subheading}
        </h4>
      )}

      <p className="text-xs sm:text-sm text-gray-600 mt-4 leading-relaxed whitespace-pre-line italic font-serif">
        "{quote}"
      </p>
    </section>
  );
}
