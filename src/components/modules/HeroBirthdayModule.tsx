"use client";

import React, { useState, useEffect } from "react";
import { Cake, Sparkles } from "lucide-react";

export interface HeroBirthdayProps {
  eventTitle?: string;
  person1: string;
  age?: number | string;
  date: string;
  time?: string;
  mainPhoto: string;
}

export default function HeroBirthdayModule({
  eventTitle = "Happy Birthday",
  person1,
  age = 12,
  date,
  time = "18:00",
  mainPhoto,
}: HeroBirthdayProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const targetDate = new Date(`${date}T${time}:00`).getTime();
    const updateCountdown = () => {
      const now = new Date().getTime();
      const diff = targetDate - now;
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      }
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [date, time]);

  return (
    <section className="relative pt-8 pb-12 px-4 text-center overflow-hidden bg-gradient-to-b from-[#1b3a60] via-[#245288] to-[#122842] text-white">
      {/* Floating Confetti / Balloons */}
      <div className="absolute top-4 left-6 text-2xl animate-bounce">🎈</div>
      <div className="absolute top-10 right-6 text-xl animate-pulse">🎉</div>
      <div className="absolute top-36 left-4 text-amber-300 text-lg">✨</div>
      <div className="absolute top-48 right-4 text-amber-300 text-xl">⭐</div>

      {/* Heading */}
      <div className="relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-semibold tracking-wider uppercase mb-2">
          <Cake className="w-3.5 h-3.5 text-amber-300" />
          <span>Sinh Nhật Tuổi Mới</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-amber-200 drop-shadow-md">
          {eventTitle}
        </h1>

        <h2 className="text-2xl sm:text-3xl font-bold text-amber-300 mt-1 font-serif">
          {person1}
        </h2>
      </div>

      {/* Birthday Portrait with Big Age Number */}
      <div className="relative z-10 my-6 mx-auto w-64 h-72 sm:w-72 sm:h-80 flex items-center justify-center">
        <div className="w-full h-full rounded-3xl overflow-hidden border-4 border-white/80 shadow-2xl relative">
          <img
            src={mainPhoto}
            alt={person1}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Big Stylized Age Badge */}
          <div className="absolute bottom-3 left-4 flex items-baseline gap-1">
            <span className="text-5xl font-black text-white font-serif drop-shadow-lg leading-none">
              {age}
            </span>
            <span className="text-xs uppercase font-bold text-amber-300 tracking-wider">
              Tuổi
            </span>
          </div>
        </div>
      </div>

      {/* Countdown Grid */}
      <div className="relative z-10 grid grid-cols-4 gap-2 max-w-[260px] mx-auto mt-2">
        {[
          { label: "Ngày", val: timeLeft.days },
          { label: "Giờ", val: timeLeft.hours },
          { label: "Phút", val: timeLeft.minutes },
          { label: "Giây", val: timeLeft.seconds },
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-white/15 backdrop-blur-md rounded-xl py-1.5 px-1 flex flex-col items-center border border-white/20"
          >
            <span className="text-base sm:text-lg font-black text-amber-300 leading-none">
              {String(item.val).padStart(2, "0")}
            </span>
            <span className="text-[9px] text-gray-200 mt-0.5">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
