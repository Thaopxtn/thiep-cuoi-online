"use client";

import React from "react";
import { MapPin, Clock, ExternalLink } from "lucide-react";

export interface VenueMapProps {
  title?: string;
  venue: string;
  address: string;
  date?: string;
  time?: string;
  mapUrl?: string;
  theme?: "sky" | "wedding";
}

export default function VenueMapModule({
  title = "Địa điểm tổ chức",
  venue,
  address,
  date,
  time,
  mapUrl,
  theme = "wedding",
}: VenueMapProps) {
  const isSky = theme === "sky";

  return (
    <section className="py-6 px-4 max-w-md mx-auto">
      <div
        className={`rounded-3xl p-5 shadow-lg border ${
          isSky
            ? "bg-white/95 border-sky-100"
            : "bg-white/95 border-stone-200"
        }`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isSky
                ? "bg-sky-100 text-sky-600"
                : "bg-[#8c6d58]/10 text-[#8c6d58]"
            }`}
          >
            <MapPin className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="font-serif font-bold text-gray-900 text-base">
              {title}
            </h3>
            {(date || time) && (
              <p className="text-xs text-stone-500">
                {time} {date ? `- Ngày ${date}` : ""}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1 text-left text-xs text-stone-700 bg-stone-50 p-3.5 rounded-2xl border border-stone-100">
          <div className="font-semibold text-gray-900 text-sm">{venue}</div>
          <div className="text-stone-500 leading-relaxed">{address}</div>
        </div>

        {mapUrl && (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-3 w-full py-2.5 rounded-xl text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow transition-colors ${
              isSky
                ? "bg-sky-600 hover:bg-sky-700"
                : "bg-[#8c6d58] hover:bg-[#735845]"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Chỉ đường trên Google Maps</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        )}
      </div>
    </section>
  );
}
