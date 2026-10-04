"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Smartphone,
  QrCode,
  Sparkles,
  Share2,
} from "lucide-react";
import CardNodeRenderer from "@/components/CardNodeRenderer";

interface EditorLivePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Record<string, any>;
  templateName: string;
  slugOrId: string;
}

export default function EditorLivePreviewModal({
  isOpen,
  onClose,
  nodes,
  templateName,
  slugOrId,
}: EditorLivePreviewModalProps) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3005";
  const liveShowUrl = `${origin}/show/${slugOrId}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(liveShowUrl)}`;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard?.writeText(liveShowUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-zinc-950/95 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[95vh] relative animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-9 h-9 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
          title="Đóng xem trước (ESC)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column: Realistic Interactive Smartphone Mockup */}
        <div className="w-full md:w-[50%] bg-[#0e0e11] p-4 sm:p-6 flex items-center justify-center relative overflow-hidden border-b md:border-b-0 md:border-r border-zinc-800/80">
          <div className="relative w-[300px] sm:w-[330px] h-[580px] sm:h-[640px] bg-black rounded-[48px] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.8)] ring-1 ring-zinc-700/50 flex flex-col">
            {/* Phone Screen Bezel */}
            <div className="relative w-full h-full bg-white rounded-[38px] overflow-hidden flex flex-col border border-zinc-800/60">
              {/* Dynamic Island / Status Bar */}
              <div className="h-7 w-full bg-white/95 backdrop-blur-md shrink-0 flex items-center justify-between px-6 z-30 border-b border-gray-100">
                <span className="text-[11px] font-bold text-gray-800">09:41</span>
                <div className="w-20 h-3.5 bg-black rounded-full" />
                <div className="flex items-center gap-1.5 text-gray-700">
                  <span className="text-[10px] font-semibold">5G</span>
                  <div className="w-4 h-2 rounded-[2px] border border-gray-600 p-0.5 flex items-center">
                    <div className="w-full h-full bg-gray-800 rounded-[1px]" />
                  </div>
                </div>
              </div>

              {/* Scrollable Canvas Render (Exact User Edits) */}
              <div className="flex-1 overflow-y-auto scroll-smooth [scrollbar-width:none] relative bg-white">
                <CardNodeRenderer nodes={nodes} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Actions & Link Sharing */}
        <div className="w-full md:w-[50%] p-6 sm:p-8 flex flex-col justify-between bg-zinc-900 text-white">
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Bản xem trước trực tiếp (Live Preview)</span>
              </div>
              <h3 className="text-2xl font-bold text-white font-serif">
                {templateName}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Đây là mẫu thiết kế thực tế đúng 100% với các chỉnh sửa ảnh, chữ, màu sắc và hiệu ứng của bạn.
              </p>
            </div>

            {/* Live Link Box */}
            <div className="space-y-2 bg-zinc-800/60 p-4 rounded-2xl border border-zinc-700/60">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                Đường dẫn xem trước chính thức:
              </label>
              <div className="flex items-center gap-2 bg-zinc-950/80 border border-zinc-700 px-3 py-2.5 rounded-xl text-xs">
                <span className="truncate flex-1 font-mono text-zinc-200 text-[11px]">
                  {liveShowUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 transition-colors shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Đã chép" : "Sao chép"}</span>
                </button>
              </div>
              <p className="text-[10px] text-zinc-400">
                Bạn có thể gửi link này cho bạn bè hoặc người thân xem thử trên điện thoại thật.
              </p>
            </div>

            {/* QR Code toggle */}
            {showQr ? (
              <div className="bg-white p-4 rounded-2xl text-center space-y-2 animate-scale-in">
                <img
                  src={qrUrl}
                  alt="Mã QR xem trước"
                  className="w-40 h-40 mx-auto object-contain"
                />
                <p className="text-xs text-zinc-700 font-medium">
                  Quét bằng camera điện thoại để xem trực tiếp
                </p>
                <button
                  type="button"
                  onClick={() => setShowQr(false)}
                  className="text-xs text-rose-600 font-bold hover:underline"
                >
                  Ẩn mã QR
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowQr(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-2 border border-zinc-700 transition-colors"
              >
                <QrCode className="w-4 h-4 text-zinc-400" />
                <span>Hiển thị mã QR để quét trên điện thoại</span>
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-6 border-t border-zinc-800 grid grid-cols-2 gap-3 mt-6">
            <a
              href={liveShowUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs flex items-center justify-center gap-2 transition-all hover:scale-102 shadow-md"
            >
              <ExternalLink className="w-4 h-4 text-zinc-900" />
              <span>Mở tab mới</span>
            </a>

            <button
              type="button"
              onClick={handleCopy}
              className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all hover:scale-102 shadow-md"
            >
              <Share2 className="w-4 h-4 text-white" />
              <span>{copied ? "Đã sao chép!" : "Chia sẻ link"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
