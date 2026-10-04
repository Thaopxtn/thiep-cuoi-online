"use client";

import { useState } from "react";
import { X } from "lucide-react";

export default function FloatingSupport() {
  const [closed, setClosed] = useState(false);
  const [bubbleClosed, setBubbleClosed] = useState(false);

  if (closed) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[998] flex items-end gap-2.5 sm:gap-3 pointer-events-auto"
      role="complementary"
      aria-label="Tư vấn hỗ trợ trực tuyến"
    >
      {/* Speech Bubble */}
      {!bubbleClosed && (
        <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-3.5 shadow-xl border border-gray-100 max-w-[230px] sm:max-w-[260px] text-xs sm:text-sm text-gray-800 leading-snug">
          <button
            onClick={() => setBubbleClosed(true)}
            className="absolute -top-2 -left-2 w-5 h-5 bg-gray-500 text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors shadow"
            aria-label="Đóng thông báo"
          >
            <X className="w-3 h-3" />
          </button>

          <p className="m-0">
            👋 Hi! Bạn muốn tạo{" "}
            <strong className="text-zen-primary font-bold">
              thiệp cưới online
            </strong>{" "}
            nhanh hơn? Liên hệ ngay!
          </p>

          {/* Bubble tail */}
          <div className="absolute right-[-6px] bottom-4 w-3 h-3 bg-white rotate-45 border-r border-t border-gray-100" />
        </div>
      )}

      {/* Support Icon Widget */}
      <div className="relative group cursor-pointer">
        <button
          onClick={() => setClosed(true)}
          className="absolute -top-1.5 -right-1.5 z-10 w-5 h-5 bg-gray-600 hover:bg-gray-800 text-white rounded-full flex items-center justify-center shadow transition-colors"
          aria-label="Ẩn hỗ trợ"
        >
          <X className="w-3 h-3" />
        </button>

        <a
          href="tel:0823312212"
          aria-label="Liên hệ tư vấn"
          className="block transition-transform duration-300 hover:scale-105"
        >
          <img
            src="/assets/landing/support-icon-317.webp"
            alt="Zenlove Support"
            className="w-20 md:w-24 h-auto drop-shadow-lg"
          />
        </a>
      </div>
    </div>
  );
}
