"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  const words = ["kỷ niệm", "đám cưới", "sinh nhật", "tốt nghiệp"];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <section id="hero" className="pt-16 md:pt-20">
      <div className="relative mt-0 md:mt-2.5 px-0 py-10 md:px-0 md:py-16 max-w-7xl mx-auto sm:px-6 lg:px-8 rounded-[10px]">
        {/* Background Scrolling Banner */}
        <div className="backgroundWrp bg-base-100/90">
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
        <div className="gradientWrp"></div>

        {/* Main Content Box */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="contentWrp">
            <h1 className="sr-only">
              Tạo thiệp cưới online miễn phí, đẹp tinh tế trong 5 bước
            </h1>

            <div className="hero-slide-up text-headline text-gray-900 font-heading des-xl !leading items-center text-center text-4xl md:text-left lg:text-5xl xl:text-6xl">
              <span>Đổi mới cách gửi lời mời </span>
              <span className="inline-block align-baseline w-auto">
                <span className="relative inline-block align-baseline">
                  <span
                    aria-hidden="true"
                    className="invisible select-none whitespace-nowrap font-signature text-zen-primary"
                  >
                    tốt nghiệp
                  </span>
                  <span className="absolute -inset-y-[0.22em] left-0 right-0 inline-flex items-center overflow-hidden">
                    <span
                      key={currentWordIndex}
                      className="inline-block whitespace-nowrap font-signature text-zen-primary animate-fade-in"
                      aria-live="polite"
                    >
                      {words[currentWordIndex]}
                    </span>
                  </span>
                </span>
              </span>
              <div className="relative block">
                <span>với </span>
                <span className="text-gradient-mm">ZenLove.</span>
              </div>
            </div>

            <h2 className="sr-only">
              Tạo và gửi thiệp mời online nhanh chóng bằng ZenLove
            </h2>

            <p className="hero-slide-up text-center md:text-left text-base md:max-w-[635px] md:text-[1.125rem] mt-6 md:mt-4 relative m-0 max-w-none leading-6 md:leading-8 text-gray-700">
              Giải pháp tạo thiệp online đột phá giúp bạn gửi lời mời chuyên nghiệp chỉ
              qua một đường link, tiết kiệm tối đa chi phí in ấn và thời gian chuẩn
              bị.
            </p>

            <p className="hero-slide-up text-center md:text-left text-sm md:text-base text-gray-600 mt-4">
              Tạo miễn phí · Mẫu đa dạng · Đẹp mới thanh toán
            </p>

            <div className="hero-slide-up mt-6 flex justify-center md:justify-start gap-3 md:gap-4">
              <Link
                href="/templates"
                id="hero-btn-start"
                className="bg-zen-primary text-white hover:text-white px-6 py-3 md:px-10 md:py-3.5 rounded-full font-medium shadow-[0_12px_32px_rgba(239,68,68,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-600 hover:shadow-[0_18px_40px_rgba(239,68,68,0.35)] flex items-center"
                aria-label="Bắt đầu tạo thiệp cùng ZenLove"
              >
                <span className="text-sm md:text-lg font-bold">Tạo thiệp ngay</span>
              </Link>

              <Link
                href="/tao-thiep-cuoi-online"
                id="hero-btn-guides"
                title="Xem hướng dẫn tạo thiệp cưới online"
                aria-label="Xem hướng dẫn tạo thiệp"
                className="border border-zen-primary/18 bg-white/88 text-zen-primary hover:text-zen-primary px-6 py-3 md:px-10 md:py-3.5 rounded-full font-medium shadow-[0_10px_24px_rgba(15,23,42,0.08)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-zen-primary/28 hover:shadow-[0_16px_32px_rgba(15,23,42,0.12)] flex items-center gap-1 hover:bg-rose-50/50"
              >
                <span className="text-sm md:text-lg font-bold">Hướng dẫn</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
