"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { X, PhoneCall, MessageCircle } from "lucide-react";

export default function FloatingSupport() {
  const [menuOpen, setMenuOpen] = useState(false);
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closePanel = () => {
    setMenuOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!menuOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    };
    const handleOutside = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("pointerdown", handleOutside);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("pointerdown", handleOutside);
    };
  }, [menuOpen]);

  return (
    <div
      ref={containerRef}
      className="fixed bottom-5 right-5 z-[998] flex flex-col items-end gap-3 pointer-events-auto"
      role="complementary"
      aria-label="Tư vấn hỗ trợ trực tuyến"
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-expanded={menuOpen}
        aria-controls={panelId}
        aria-label={menuOpen ? "Đóng hỗ trợ" : "Mở hỗ trợ"}
        title="Tư vấn tạo thiệp cưới"
        className="relative order-last rounded-full transition-transform hover:scale-105"
      >
        <span className="relative block w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 drop-shadow-xl cursor-pointer">
          <Image
            src="/assets/landing/support-icon-317.webp"
            alt=""
            fill
            sizes="(max-width: 768px) 80px, 96px"
            className="object-contain"
          />
        </span>
      </button>

      {menuOpen && (
        <div
          id={panelId}
          role="region"
          aria-label="Liên hệ hỗ trợ"
          className="relative order-first bg-white/95 backdrop-blur-md rounded-2xl p-4 pt-12 shadow-2xl border border-rose-200/90 w-[280px] max-w-[calc(100vw-2.5rem)] text-sm text-gray-800 leading-snug animate-fade-in"
        >
          <button
            type="button"
            onClick={closePanel}
            className="absolute top-1 right-1 w-11 h-11 text-gray-600 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Đóng bảng hỗ trợ"
          >
            <X className="w-4 h-4" />
          </button>

          <p className="m-0 font-medium text-gray-700">
            Chào bạn! Cần trợ giúp tạo <strong className="text-zen-primary font-bold">thiệp cưới online</strong> hoặc mở khóa gói VIP?
          </p>

          <div className="mt-3 flex flex-col gap-2">
            <a
              href="https://zalo.me/0823312212"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-1.5 bg-[#0068FF] hover:bg-[#0052cc] text-white py-2 px-3 rounded-xl font-bold text-xs shadow-xs transition-transform active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Nhắn tin qua Zalo</span>
            </a>
            <a
              href="tel:0823312212"
              className="inline-flex min-h-11 items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-zen-primary border border-rose-200 py-1.5 px-3 rounded-xl font-bold text-xs transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Hotline: 0823.312.212</span>
            </a>
          </div>

          {/* Bubble tail */}
          <div className="absolute right-6 -bottom-1.5 w-3 h-3 bg-white rotate-45 border-r border-b border-rose-200" />
        </div>
      )}
    </div>
  );
}
