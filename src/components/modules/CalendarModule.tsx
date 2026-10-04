"use client";

import React from "react";

export interface CalendarModuleProps {
  title?: string;
  date: string; // YYYY-MM-DD
  theme?: "sky" | "wedding" | "classic";
}

export default function CalendarModule({
  title = "Lịch Sự Kiện",
  date,
  theme = "wedding",
}: CalendarModuleProps) {
  const eventDate = new Date(date);
  const eventDay = eventDate.getDate() || 10;
  const eventMonth = eventDate.getMonth() + 1 || 3;
  const eventYear = eventDate.getFullYear() || 2026;

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
        <h3
          className={`text-xl font-bold font-serif ${
            isSky ? "text-[#1e6091]" : "text-[#4a3f35]"
          }`}
        >
          {title}
        </h3>
        <p
          className={`text-xs font-medium ${
            isSky ? "text-[#468faf]" : "text-stone-500"
          }`}
        >
          Tháng {eventMonth} năm {eventYear}
        </p>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {["Hai", "Ba", "Tư", "Năm", "Sáu", "Bảy", "CN"].map((day, idx) => (
          <div
            key={idx}
            className={`py-1.5 font-bold rounded-lg text-[11px] ${
              isSky
                ? "text-sky-800 bg-sky-50"
                : "text-stone-700 bg-stone-100"
            }`}
          >
            {day}
          </div>
        ))}

        {/* 31 days representation */}
        {Array.from({ length: 31 }).map((_, i) => {
          const dayNum = i + 1;
          const isEvent = dayNum === eventDay;
          return (
            <div
              key={i}
              className={`py-2 rounded-xl flex items-center justify-center font-medium transition-all ${
                isEvent
                  ? "bg-[#ff4d6d] text-white font-bold shadow-md scale-105"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {dayNum}
            </div>
          );
        })}
      </div>
    </section>
  );
}
