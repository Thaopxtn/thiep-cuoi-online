"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Send, Copy, Check, Heart, Music, VolumeX, Volume2, Sparkles } from "lucide-react";

// ==================== FLYING HEARTS PARTICLES ====================
export interface HeartParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
}

export function FlyingHeartsOverlay({ hearts }: { hearts: HeartParticle[] }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden">
      {hearts.map((h) => (
        <span
          key={h.id}
          className="absolute animate-flying-heart"
          style={{
            left: `${h.x}%`,
            bottom: "100px",
            fontSize: `${h.size}px`,
            color: h.color,
          }}
        >
          ❤️
        </span>
      ))}
    </div>
  );
}

// ==================== WISHES FORM DRAWER ====================
interface WishesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, message: string) => void;
}

export function WishesDrawer({ isOpen, onClose, onSubmit }: WishesDrawerProps) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    onSubmit(name, message);
    setName("");
    setMessage("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 backdrop-blur-sm transition-all duration-300 animate-fade-in">
      <div
        className="w-full max-w-md bg-white rounded-t-3xl p-5 shadow-2xl"
        style={{ animation: "mc-popup-sheet-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
            <span>💌</span> Gửi lời chúc mừng
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Tên của bạn
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập họ và tên hoặc biệt danh..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-zen-primary focus:ring-1 focus:ring-zen-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Lời chúc của bạn
            </label>
            <textarea
              required
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Viết những lời chúc tốt đẹp nhất gửi tới chủ nhân buổi tiệc..."
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-zen-primary focus:ring-1 focus:ring-zen-primary resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-zen-primary to-rose-600 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Gửi lời chúc ngay</span>
          </button>
        </form>
      </div>
    </div>
  );
}

// ==================== GIFT / BANK QR MODAL ====================
interface GiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    qrImage?: string;
  };
}

export function GiftModal({ isOpen, onClose, bankInfo }: GiftModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(bankInfo.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Auto QR generator using VietQR API format
  const qrUrl =
    bankInfo.qrImage ||
    `https://api.vietqr.io/image/970422-${bankInfo.accountNumber}-compact2.png?amount=0&addInfo=Mung%20Cuoi&accountName=${encodeURIComponent(
      bankInfo.accountHolder
    )}`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl text-center relative"
        style={{ animation: "mc-popup-fade-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3 text-2xl animate-gift-jump">
          🎁
        </div>

        <h3 className="font-bold text-gray-900 text-lg">Mừng Quà / Chúc Mừng</h3>
        <p className="text-xs text-gray-500 mt-1 mb-4">
          Cảm ơn tấm lòng chân thành và sự chung vui của bạn!
        </p>

        {/* QR Code */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex flex-col items-center justify-center mb-4">
          <img
            src={qrUrl}
            alt="QR Chuyển khoản"
            className="w-48 h-48 object-contain rounded-lg shadow-sm"
            style={{ animation: "mc-qr-fade-in 0.5s ease-out forwards" }}
            onError={(e) => {
              // fallback if vietqr fails
              (e.target as HTMLElement).style.display = "none";
            }}
          />
          <span className="text-[11px] text-gray-400 mt-1">Quét mã QR bằng App Ngân hàng</span>
        </div>

        {/* Bank Details */}
        <div className="bg-rose-50/60 rounded-xl p-3 text-left space-y-1.5 text-xs text-gray-700 mb-4">
          <div>
            <span className="text-gray-500">Ngân hàng:</span>{" "}
            <strong className="text-gray-900 font-semibold">{bankInfo.bankName}</strong>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-gray-500">Số tài khoản:</span>{" "}
              <strong className="text-rose-600 font-mono text-sm">
                {bankInfo.accountNumber}
              </strong>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] font-semibold text-zen-primary hover:underline"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-600">Đã chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Sao chép</span>
                </>
              )}
            </button>
          </div>
          <div>
            <span className="text-gray-500">Chủ tài khoản:</span>{" "}
            <strong className="text-gray-900 uppercase font-semibold">
              {bankInfo.accountHolder}
            </strong>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}

// ==================== RSVP MODAL ====================
interface RsvpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, attending: boolean, guests: number) => void;
}

export function RsvpModal({ isOpen, onClose, onConfirm }: RsvpModalProps) {
  const [name, setName] = useState("");
  const [attending, setAttending] = useState(true);
  const [guests, setGuests] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onConfirm(name, attending, guests);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setName("");
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl text-center relative"
        style={{ animation: "rsvp-confirm-fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
        >
          <X className="w-4 h-4" />
        </button>

        {submitted ? (
          <div className="py-6">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 text-2xl animate-bounce">
              ✓
            </div>
            <h3 className="font-bold text-gray-900 text-lg">Xác Nhận Thành Công!</h3>
            <p className="text-xs text-gray-500 mt-1">
              Rất mong được gặp bạn tại bữa tiệc!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="text-left space-y-3">
            <div className="text-center mb-4">
              <h3 className="font-bold text-gray-900 text-lg">Xác Nhận Tham Dự (RSVP)</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Vui lòng phản hồi sớm để chúng mình chuẩn bị chu đáo nhất nhé!
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Họ và tên của bạn
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập họ và tên của bạn..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-zen-primary focus:ring-1 focus:ring-zen-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Bạn có thể đến chung vui không?
              </label>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 border border-gray-100">
                  <input
                    type="radio"
                    name="attend"
                    checked={attending}
                    onChange={() => setAttending(true)}
                    className="accent-zen-primary"
                  />
                  <span className="font-medium text-gray-800">
                    🎉 Có, tôi sẽ tham dự
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 border border-gray-100">
                  <input
                    type="radio"
                    name="attend"
                    checked={!attending}
                    onChange={() => setAttending(false)}
                    className="accent-zen-primary"
                  />
                  <span className="font-medium text-gray-800">
                    😢 Tôi bận, rất tiếc không thể tham dự
                  </span>
                </label>
              </div>
            </div>

            {attending && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Số lượng người tham dự
                </label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-zen-primary bg-white"
                >
                  <option value={1}>1 người (Chỉ mình tôi)</option>
                  <option value={2}>2 người (+ Người đi cùng)</option>
                  <option value={3}>3 người (+ Gia đình)</option>
                  <option value={4}>4 người (+ Gia đình)</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              className="w-full mt-2 py-2.5 rounded-xl bg-zen-primary text-white font-semibold text-sm shadow hover:bg-red-600 transition-colors"
            >
              Gửi xác nhận
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ==================== BACKGROUND MUSIC PLAYER ====================
export function FloatingMusicPlayer({
  musicUrl,
  musicTitle,
}: {
  musicUrl: string;
  musicTitle: string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(musicUrl);
    audioRef.current.loop = true;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [musicUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={togglePlay}
        title={isPlaying ? `Đang phát: ${musicTitle}` : "Bật nhạc nền"}
        className="relative z-30 px-2.5 h-9 rounded-full bg-white/95 border border-gray-200 shadow-md backdrop-blur-sm flex items-center gap-1.5 text-zen-primary hover:scale-105 active:scale-95 transition-all"
      >
        <div className={`relative ${isPlaying ? "animate-spin-slow" : ""}`}>
          <Music className="w-4 h-4 text-zen-primary" />
        </div>

        {/* Animated Sound Equalizer Bars */}
        {isPlaying ? (
          <div className="flex items-end gap-[2px] h-3.5 px-0.5">
            <span
              className="w-[2px] bg-zen-primary rounded-full"
              style={{ animation: "mc-sound-bar 0.7s ease-in-out infinite" }}
            />
            <span
              className="w-[2px] bg-rose-500 rounded-full"
              style={{ animation: "mc-sound-bar 1.1s ease-in-out infinite 0.2s" }}
            />
            <span
              className="w-[2px] bg-zen-primary rounded-full"
              style={{ animation: "mc-sound-bar 0.9s ease-in-out infinite 0.4s" }}
            />
            <span
              className="w-[2px] bg-rose-500 rounded-full"
              style={{ animation: "mc-sound-bar 1.3s ease-in-out infinite 0.1s" }}
            />
          </div>
        ) : (
          <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
            Nhạc
          </span>
        )}

        {isPlaying && (
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        )}
      </button>
    </div>
  );
}
