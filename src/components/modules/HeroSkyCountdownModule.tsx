"use client";

import React, { useState, useEffect } from "react";

export interface HeroSkyCountdownProps {
  eventTitle: string;
  person1: string;
  date: string;
  time?: string;
  mainPhoto: string;
}

export default function HeroSkyCountdownModule({
  eventTitle,
  person1,
  date,
  time = "08:00",
  mainPhoto,
}: HeroSkyCountdownProps) {
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
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [date, time]);

  return (
    <section className="relative min-h-[560px] bg-gradient-to-b from-[#3a86c8] via-[#6ba4d6] to-[#a0c4e2] pt-8 pb-12 px-4 flex flex-col items-center text-center overflow-hidden">
      {/* Clouds effect */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/60 via-transparent to-transparent" />

      {/* Title */}
      <h1 className="relative z-10 text-3xl sm:text-4xl font-extrabold text-white tracking-wide drop-shadow-md">
        {eventTitle}
      </h1>
      <h2 className="relative z-10 text-2xl sm:text-3xl font-bold text-amber-300 mt-2 font-serif drop-shadow">
        {person1}
      </h2>

      {/* Countdown Grid */}
      <div className="relative z-10 grid grid-cols-4 gap-2 mt-6 max-w-[280px]">
        {[
          { label: "Ngày", val: timeLeft.days },
          { label: "Giờ", val: timeLeft.hours },
          { label: "Phút", val: timeLeft.minutes },
          { label: "Giây", val: timeLeft.seconds },
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-white/75 backdrop-blur-md rounded-2xl py-2 px-1 flex flex-col items-center shadow-sm border border-white/40"
          >
            <span className="text-lg sm:text-xl font-black text-[#1e6091] leading-none">
              {String(item.val).padStart(2, "0")}
            </span>
            <span className="text-[10px] text-[#2c7da0] font-medium mt-0.5">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Main Avatar */}
      <div className="relative z-10 mt-8 w-60 h-60 sm:w-68 sm:h-68 rounded-full p-2 bg-white/40 shadow-xl overflow-hidden backdrop-blur-xs">
        <img
          src={mainPhoto}
          alt={person1}
          className="w-full h-full object-cover rounded-full"
        />
      </div>
    </section>
  );
}
