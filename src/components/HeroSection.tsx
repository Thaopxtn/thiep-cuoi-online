"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, CheckCircle2, Star, Heart } from "lucide-react";

export default function HeroSection() {
  const words = ["kỷ niệm", "đám cưới", "sinh nhật", "tốt nghiệp"];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <section id="hero" className="relative pt-20 md:pt-28 pb-12 md:pb-16 overflow-hidden">
      {/* Background subtle radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-rose-100/40 via-pink-50/30 to-amber-50/20 blur-3xl pointer-events-none -z-10 rounded-full" />

      <div className="relative mt-0 md:mt-2 px-0 py-6 md:px-0 md:py-12 max-w-7xl mx-auto sm:px-6 lg:px-8">
        {/* Background Scrolling Banner */}
        <div className="backgroundWrp bg-base-100/90" aria-hidden="true">
          <div className="imgWrp animate-hero-img-scroll">
            <img
              alt="Thiệp cưới online miễn phí đẹp nhất - Zenlove"
              title="Tạo thiệp cưới online sang trọng và tinh tế"
              src="/assets/landing/hero-pc.webp"
              className="w-full h-auto"
              style={{ color: "transparent", width: "100%", height: "auto" }}
            />
          </div>
          <div className="imgWrp animate-hero-img-scroll">
            <img
              alt="Mẫu thiệp cưới online đẹp - Website thiệp cưới miễn phí"
              title="Thiệp cưới điện tử hiện đại với Zenlove"
              src="/assets/landing/hero-pc.webp"
              className="w-full h-auto"
              style={{ color: "transparent", width: "100%", height: "auto" }}
            />
          </div>
        </div>

        {/* Gradient Overlay Mask */}
        <div className="gradientWrp pointer-events-none"></div>

        {/* Main Content Box */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
          <div className="contentWrp">
            {/* Eyebrow Badge */}
            <div className="hero-slide-up mb-4 inline-flex items-center gap-2 rounded-full border border-rose-200/70 bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-zen-primary shadow-xs backdrop-blur-sm">
              <span className="flex size-2 rounded-full bg-zen-primary animate-pulse" />
              <span>Nền tảng thiệp cưới công nghệ #1</span>
              <span className="text-gray-300">·</span>
              <span className="text-gray-600 font-medium">0đ chi phí tạo thiệp</span>
            </div>

            {/* Main Headline */}
            <h1
              id="hero-heading"
              className="hero-slide-up font-heading text-4xl leading-[1.12] tracking-[-0.02em] text-gray-900 md:text-left lg:text-5xl xl:text-[3.75rem]"
            >
              <span>Đổi mới cách gửi lời mời </span>
              <span className="inline-block align-baseline w-auto">
                <span className="relative inline-block align-baseline">
                  <span
                    aria-hidden="true"
                    className="invisible select-none whitespace-nowrap font-signature text-zen-primary"
                  >
                    tốt nghiệp
                  </span>
                  <span className="absolute -inset-y-[0.2em] left-0 right-0 inline-flex items-center overflow-hidden">
                    <span
                      key={currentWordIndex}
                      className="inline-block whitespace-nowrap font-signature text-zen-primary animate-fade-in text-[1.15em]"
                      aria-live="polite"
                    >
                      {words[currentWordIndex]}
                    </span>
                  </span>
                </span>
              </span>
              <div className="relative block mt-1">
                <span>với </span>
                <span className="text-gradient-mm font-bold">ZenLove.</span>
              </div>
            </h1>

            {/* Description Subtitle */}
            <p className="hero-slide-up text-center md:text-left text-base md:text-lg mt-5 md:mt-5 text-gray-600 leading-relaxed max-w-xl">
              Tạo thiệp cưới điện tử hiện đại, mở phong bì thư sáp hoàng gia, tích hợp bản đồ chỉ đường, đếm ngược ngày cưới và quản lý khách RSVP hoàn toàn tự động.
            </p>

            {/* Feature Pills */}
            <div className="hero-slide-up mt-4 flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-xs md:text-sm text-gray-600 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>207+ Mẫu thiệp cao cấp</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Chia sẻ 1 chạm qua Zalo/FB</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Hộp mừng cưới VietQR 24/7</span>
              </span>
            </div>

            {/* Call to Actions */}
            <div className="hero-slide-up mt-8 flex flex-col sm:flex-row justify-center md:justify-start gap-3.5 sm:gap-4">
              <Link
                href="/templates"
                id="hero-btn-start"
                className="group relative inline-flex items-center justify-center gap-2.5 bg-zen-primary hover:bg-[#d93849] text-white px-8 py-3.5 rounded-full font-bold text-base shadow-[0_12px_32px_rgba(229,65,83,0.32)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(229,65,83,0.42)]"
                aria-label="Bắt đầu tạo thiệp cùng ZenLove"
              >
                <span>Bắt đầu tạo thiệp miễn phí</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              <Link
                href="/tao-thiep-cuoi-online"
                id="hero-btn-guides"
                title="Xem hướng dẫn tạo thiệp cưới online"
                aria-label="Xem hướng dẫn tạo thiệp"
                className="inline-flex items-center justify-center gap-2 border border-gray-200 bg-white/90 hover:bg-rose-50/60 text-gray-800 hover:text-zen-primary px-7 py-3.5 rounded-full font-semibold text-base shadow-xs backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-200"
              >
                <span>Xem video hướng dẫn</span>
                <span className="text-xs bg-rose-100 text-zen-primary font-bold px-2 py-0.5 rounded-full">
                  10 phút
                </span>
              </Link>
            </div>

            {/* Social Proof */}
            <div className="hero-slide-up mt-9 pt-7 border-t border-gray-100/80 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 sm:gap-5">
              {/* Avatar Stack */}
              <div className="flex -space-x-2.5 overflow-hidden py-1">
                <img
                  className="inline-block size-9 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces"
                  alt="Khách hàng Zenlove"
                  referrerPolicy="no-referrer"
                  loading="eager"
                />
                <img
                  className="inline-block size-9 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces"
                  alt="Khách hàng Zenlove"
                  referrerPolicy="no-referrer"
                  loading="eager"
                />
                <img
                  className="inline-block size-9 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces"
                  alt="Khách hàng Zenlove"
                  referrerPolicy="no-referrer"
                  loading="eager"
                />
                <img
                  className="inline-block size-9 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces"
                  alt="Khách hàng Zenlove"
                  referrerPolicy="no-referrer"
                  loading="eager"
                />
                <div className="flex size-9 items-center justify-center rounded-full bg-rose-50 text-[11px] font-bold text-zen-primary ring-2 ring-white">
                  +10K
                </div>
              </div>

              {/* Rating & text */}
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="ml-1 text-xs font-bold text-gray-900">5.0 / 5.0</span>
                </div>
                <p className="mt-0.5 text-xs sm:text-sm text-gray-600">
                  Hơn <strong className="text-gray-900 font-semibold">10.000+</strong> cặp đôi đã tạo &amp; gửi thiệp thành công
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
