import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function SolutionSection() {
  return (
    <section
      id="solution"
      className="bg-white pb-12 pt-4"
      role="region"
      aria-labelledby="solution-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2
          id="solution-heading"
          className="solution-animate text-2xl md:text-3xl text-black mb-4 font-heading"
        >
          TỰ TẠO THIỆP ONLINE VỚI{" "}
          <span className="text-primary block md:inline-block text-gradient-mm font-bold">
            VÔ VÀN TÍNH NĂNG HAY
          </span>
        </h2>

        <p className="solution-animate text-md md:text-lg text-black max-w-4xl mx-auto mb-8 md:mb-14">
          ZenLove mang đến giải pháp thiệp online hiện đại, tính năng{" "}
          <span className="text-primary font-signature font-bold text-2xl md:text-3xl">
            Miễn Phí
          </span>{" "}
          giúp bạn dễ dàng tạo những chiếc thiệp độc đáo, mang đậm màu sắc cá nhân.
        </p>

        {/* CTA with floating sparkles */}
        <div className="solution-animate relative inline-block">
          <div
            className="absolute -top-4 -left-8 text-3xl animation-float-in pointer-events-none select-none"
            aria-hidden="true"
          >
            ✨
          </div>
          <div
            className="absolute -bottom-4 -left-4 text-3xl animation-float-in pointer-events-none select-none"
            style={{ animationDelay: "0.8s" }}
            aria-hidden="true"
          >
            ✨
          </div>
          <div
            className="absolute -top-2 -right-4 text-3xl animation-float-in pointer-events-none select-none"
            style={{ animationDelay: "1.4s" }}
            aria-hidden="true"
          >
            ✨
          </div>
          <div
            className="absolute -bottom-2 -right-8 text-3xl animation-float-in pointer-events-none select-none"
            style={{ animationDelay: "2.1s" }}
            aria-hidden="true"
          >
            ✨
          </div>

          <Link
            className="inline-flex items-center gap-2 !bg-zen-primary text-white hover:text-white px-8 py-3 rounded-full font-medium shadow-md transition-all duration-300 hover:scale-105 hover:bg-[#d93849] focus:outline-none focus:ring-4 focus:ring-primary/25"
            title="Tạo thiệp cưới online ngay bằng Zenlove"
            aria-label="Tạo thiệp cưới online ngay bằng Zenlove"
            href="/templates"
          >
            <span className="font-bold">Thiết kế thiệp ngay</span>
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
