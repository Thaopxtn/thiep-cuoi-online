"use client";

import React, { useState } from "react";
import { X, Check, Copy, ExternalLink, QrCode, Smartphone, Download, Share2 } from "lucide-react";

interface EditorPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateName: string;
  templateId: string;
  cardSlug?: string;
}

export default function EditorPublishModal({
  isOpen,
  onClose,
  templateName,
  templateId,
  cardSlug,
}: EditorPublishModalProps) {
  const [copied, setCopied] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [copiedGuest, setCopiedGuest] = useState(false);
  const currentOrigin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3005";
  const defaultSlug = cardSlug || (templateId === "8c5055d8-30db-4b38-8831-e11063e3d352" ? "hong-phong" : templateId);
  const [liveUrl, setLiveUrl] = useState(`${currentOrigin}/show/${defaultSlug}`);
  const [liveQr, setLiveQr] = useState(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${currentOrigin}/show/${defaultSlug}`)}`);

  React.useEffect(() => {
    if (isOpen) {
      const activeSlug = cardSlug || (templateId === "8c5055d8-30db-4b38-8831-e11063e3d352" ? "hong-phong" : templateId);
      const url = `${currentOrigin}/show/${activeSlug}`;
      setLiveUrl(url);
      setLiveQr(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`);
    }
  }, [isOpen, templateId, cardSlug, currentOrigin]);

  if (!isOpen) return null;

  const publicUrl = liveUrl;
  const qrUrl = liveQr;

  const handleCopy = () => {
    navigator.clipboard?.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 p-6 sm:p-8 relative animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <Check className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold font-serif text-gray-900">
            Xuất bản thiệp thành công!
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Thiệp cưới <strong>{templateName}</strong> đã sẵn sàng để gửi tới khách mời.
          </p>
        </div>

        {/* QR Code & Link preview */}
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col sm:flex-row items-center gap-4 mb-5">
          <div className="w-28 h-28 bg-white p-2 rounded-xl shadow-xs border border-gray-200 shrink-0">
            <img src={qrUrl} alt="QR Code" className="w-full h-full object-contain" />
          </div>

          <div className="space-y-2 min-w-0 w-full text-left">
            <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block">
              Đường link thiệp mời:
            </label>
            <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-700 shadow-2xs">
              <span className="truncate flex-1 font-mono text-[11px]">{publicUrl}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-zen-primary hover:text-red-700 font-bold shrink-0 flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Đã chép" : "Chép"}</span>
              </button>
            </div>
            <p className="text-[10px] text-gray-400">
              Quét mã QR bằng camera điện thoại để xem ngay trên smartphone.
            </p>
          </div>
        </div>

        {/* Personalized Guest Link Section */}
        <div className="p-3.5 bg-rose-50/70 rounded-2xl border border-rose-100 mb-5 text-left">
          <label className="text-[11px] font-bold text-rose-900 block mb-1.5">
            💌 Gửi riêng cho từng khách (Tự in tên lên bìa thư sáp):
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nhập tên khách: VD Anh Tuấn, Cô Lan..."
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-rose-200 rounded-xl focus:outline-none focus:border-zen-primary shadow-2xs"
            />
            <button
              type="button"
              onClick={() => {
                const link = guestName.trim()
                  ? `${publicUrl}?to=${encodeURIComponent(guestName.trim())}`
                  : publicUrl;
                navigator.clipboard?.writeText(link);
                setCopiedGuest(true);
                setTimeout(() => setCopiedGuest(false), 2000);
              }}
              className="px-3.5 py-1.5 bg-zen-primary hover:bg-[#d93849] text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
            >
              {copiedGuest ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedGuest ? "Đã sao chép!" : "Chép link riêng"}</span>
            </button>
          </div>
          {guestName.trim() && (
            <p className="text-[10px] text-rose-700 font-mono truncate mt-1.5">
              Link: {`${publicUrl}?to=${encodeURIComponent(guestName.trim())}`}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-4 rounded-xl border border-gray-200 hover:border-gray-300 bg-white text-gray-800 font-semibold text-xs flex items-center justify-center gap-2 transition-all hover:scale-105"
          >
            <ExternalLink className="w-4 h-4 text-gray-500" />
            <span>Mở trang thiệp</span>
          </a>

          <button
            type="button"
            onClick={handleCopy}
            className="py-3 px-4 rounded-xl bg-zen-primary hover:bg-[#d93849] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-zen-primary/20 transition-all hover:scale-105"
          >
            <Share2 className="w-4 h-4 text-white" />
            <span>Chia sẻ đường dẫn</span>
          </button>
        </div>
      </div>
    </div>
  );
}
