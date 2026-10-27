"use client";

import { useState } from "react";
import Image from "next/image";
import { X, PhoneCall } from "lucide-react";

export default function FloatingSupport() {
  const [closed, setClosed] = useState(false);
  const [bubbleClosed, setBubbleClosed] = useState(false);

  if (closed) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-[998] flex items-end gap-3 pointer-events-auto"
      role="complementary"
      aria-label="Tư vấn hỗ trợ trực tuyến"
    >
      {/* Speech Bubble */}
      {!bubbleClosed && (
        <div className="relative bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-xl border border-rose-100 max-w-[230px] sm:max-w-[260px] text-xs sm:text-sm text-gray-800 leading-snug animate-fade-in">
          <button
            onClick={() => setBubbleClosed(true)}
            className="absolute -top-2 -left-2 w-5 h-5 bg-gray-500 text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors shadow cursor-pointer"
            aria-label="Đóng thông báo"
          >
            <X className="w-3 h-3" />
          </button>

          <p className="m-0">
            👋 Hi! Bạn cần trợ giúp tạo{" "}
            <strong className="text-zen-primary font-bold">
              thiệp cưới online
            </strong>{" "}
            nhanh chóng? Gọi ngay nhé!
          </p>

          {/* Bubble tail */}
          <div className="absolute right-[-6px] bottom-4 w-3 h-3 bg-white rotate-45 border-r border-t border-rose-100" />
        </div>
      )}

      {/* Support Icon Widget */}
      <div className="relative group cursor-pointer">
        <button
          onClick={() => setClosed(true)}
          className="absolute -top-1.5 -right-1.5 z-10 w-5 h-5 bg-gray-600 hover:bg-gray-800 text-white rounded-full flex items-center justify-center shadow transition-colors cursor-pointer"
          aria-label="Ẩn hỗ trợ"
        >
          <X className="w-3 h-3" />
        </button>

        <a
          href="tel:0823312212"
          aria-label="Liên hệ tư vấn"
          className="block transition-all duration-300 hover:scale-105"
        >
          <div className="relative w-20 md:w-24 h-20 md:h-24 drop-shadow-lg">
            <Image
              src="/assets/landing/support-icon-317.webp"
              alt="Zenlove Support"
              fill
              sizes="(max-width: 768px) 80px, 96px"
              className="object-contain"
            />
          </div>
        </a>
      </div>
    </div>
  );
}
