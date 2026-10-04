"use client";

import React from "react";

export interface WeddingScheduleCardsProps {
  event1Title?: string;
  event1Time?: string;
  event1Date?: string;
  event1Lunar?: string;
  event1Venue?: string;

  event2Title?: string;
  event2Time?: string;
  event2Date?: string;
  event2Lunar?: string;
  event2Venue?: string;

  calendarTitle?: string;
  selectedDay?: number;
  patternBackground?: string;
}

export default function WeddingScheduleCardsModule({
  event1Title = "LỄ THÀNH HÔN",
  event1Time = "10:00 - Chủ Nhật",
  event1Date = "29.03.2026",
  event1Lunar = "(Tức Ngày 11 Tháng 02 Năm Bính Ngọ)",
  event1Venue = "Tại Tư Gia Nhà Trai",

  event2Title = "TIỆC MỪNG LỄ THÀNH HÔN",
  event2Time = "10:00 - Chủ Nhật",
  event2Date = "29.03.2026",
  event2Lunar = "(Tức Ngày 11 Tháng 02 Năm Bính Ngọ)",
  event2Venue = "Tại Tư Gia Nhà Trai",

  calendarTitle = "Tháng 3 - 2026",
  selectedDay = 29,
  patternBackground = "https://content.pancake.vn/web-media/5a/52/74/74/574a7c4763d40620ff28f78743b60b877bb2496e5c1cd8d94ca90f99-w:1313-h:2500-l:21034-t:image/png.png",
}: WeddingScheduleCardsProps) {
  // Days of March 2026 (starts on Sunday = CN)
  // Mar 1 is Sunday.
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <section
      className="relative w-full py-10 px-4 overflow-hidden bg-[#FAF8F5] text-center"
      style={{
        backgroundImage: `url(${patternBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="max-w-sm mx-auto space-y-6">
        {/* Card 1: LỄ THÀNH HÔN */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-gray-100 text-center transition-transform duration-300 hover:scale-[1.02]">
          <h3 className="text-xl sm:text-2xl font-bold tracking-wider text-[#700000] uppercase font-serif">
            {event1Title}
          </h3>
          <div className="w-12 h-[1px] bg-[#536077]/40 mx-auto my-3" />
          <p className="font-semibold text-gray-800 text-sm">{event1Time}</p>
          <p className="text-base font-bold text-gray-900 mt-1">{event1Date}</p>
          <p className="text-xs italic text-gray-500 mt-1">{event1Lunar}</p>
          <p className="text-sm font-medium text-gray-700 mt-3 pt-2 border-t border-gray-100">
            {event1Venue}
          </p>
        </div>

        {/* Card 2: TIỆC MỪNG LỄ THÀNH HÔN */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-gray-100 text-center transition-transform duration-300 hover:scale-[1.02]">
          <h3 className="text-xl sm:text-2xl font-bold tracking-wider text-[#700000] uppercase font-serif">
            {event2Title}
          </h3>
          <div className="w-12 h-[1px] bg-[#536077]/40 mx-auto my-3" />
          <p className="font-semibold text-gray-800 text-sm">{event2Time}</p>
          <p className="text-base font-bold text-gray-900 mt-1">{event2Date}</p>
          <p className="text-xs italic text-gray-500 mt-1">{event2Lunar}</p>
          <p className="text-sm font-medium text-gray-700 mt-3 pt-2 border-t border-gray-100">
            {event2Venue}
          </p>
        </div>

        {/* Calendar Card */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-gray-100">
          <h4 className="font-signature text-3xl text-gray-800 mb-4">
            {calendarTitle}
          </h4>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-xs font-bold text-gray-700 pb-2 border-b border-gray-200">
            <span>T2</span>
            <span>T3</span>
            <span>T4</span>
            <span>T5</span>
            <span>T6</span>
            <span>T7</span>
            <span className="text-[#8C1007]">CN</span>
          </div>

          {/* Days grid: March 2026 starts on Sunday (col 7) */}
          <div className="grid grid-cols-7 gap-1 text-xs font-medium text-gray-800 pt-3">
            {/* 6 empty cells for Mon - Sat */}
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            {/* Day 1 (Sunday) */}
            <span className="py-1 text-[#8C1007] font-bold">1</span>

            {/* Days 2 to 31 */}
            {daysInMonth.slice(1).map((day) => {
              const isCircled = day === selectedDay;
              const isSunday = (day - 1 + 6) % 7 === 6;

              return (
                <div
                  key={day}
                  className="relative py-1 flex items-center justify-center"
                >
                  {isCircled && (
                    <div className="absolute inset-0 m-auto w-7 h-7 rounded-full border-2 border-[#8C1007] flex items-center justify-center animate-pulse" />
                  )}
                  <span
                    className={`${
                      isCircled
                        ? "font-bold text-[#8C1007] text-sm"
                        : isSunday
                        ? "text-[#8C1007] font-semibold"
                        : "text-gray-700"
                    }`}
                  >
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
