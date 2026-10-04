"use client";

import React from "react";

export interface InvitationLetterProps {
  badge?: string;
  salutation?: string;
  body: string;
  signature?: string;
  theme?: "sky" | "wedding";
}

export default function InvitationLetterModule({
  badge = "Thư Mời",
  salutation = "Bạn Thân Mến",
  body,
  signature,
  theme = "sky",
}: InvitationLetterProps) {
  const isSky = theme === "sky";

  return (
    <section
      className={`py-8 px-5 mx-3 my-4 rounded-3xl shadow-lg border ${
        isSky
          ? "bg-white/95 border-sky-100"
          : "bg-white border-stone-200"
      }`}
    >
      <div className="text-center mb-4">
        {badge && (
          <span
            className={`text-xs uppercase font-bold tracking-widest ${
              isSky ? "text-sky-500" : "text-[#8c6d58]"
            }`}
          >
            {badge}
          </span>
        )}
        <h3 className="text-2xl font-bold text-gray-900 font-serif mt-1">
          {salutation}
        </h3>
      </div>

      <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line text-left">
        {body}
      </p>

      {signature && (
        <div
          className={`mt-6 text-right font-signature text-2xl pr-2 ${
            isSky ? "text-sky-700" : "text-[#8c6d58]"
          }`}
        >
          {signature}
        </div>
      )}
    </section>
  );
}
