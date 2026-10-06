"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  Heart,
  Eye,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  SlidersHorizontal,
  Copy,
  Check,
} from "lucide-react";
import { TemplateItem, generateDefaultModules } from "@/data/templates";
import { isFavorite, toggleFavorite } from "@/lib/storage/favorites";
import ModuleRenderer from "../modules/ModuleRenderer";

interface TemplatePreviewModalProps {
  template: TemplateItem | null;
  onClose: () => void;
  onUse: (templateId: string) => void;
}

export default function TemplatePreviewModal({
  template,
  onClose,
  onUse,
}: TemplatePreviewModalProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  useEffect(() => {
    if (template) {
      setIsLiked(isFavorite(template.id));
    }
  }, [template]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!template) return null;

  // QR Code URL using QR Server API
  const currentUrl =
    typeof window !== "undefined" ? window.location.origin : "https://zenlove.me";
  const previewTargetUrl = `${currentUrl}/design-template/${template.id}`;
  const detailPageUrl = `/templates/${template.slug || template.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    previewTargetUrl
  )}`;

  const handleToggleLike = () => {
    const next = toggleFavorite(template.id);
    setIsLiked(next);
  };

  const handleCopyColor = (hex: string) => {
    navigator.clipboard?.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md transition-all duration-300 animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 relative flex flex-col ${
          fullscreen
            ? "w-full h-full max-w-none rounded-none"
            : "w-full max-w-4xl max-h-[92vh]"
        }`}
      >
        {/* Top bar on Mobile */}
        <div className="flex sm:hidden items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm truncate">
            {template.title}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: Phone Mockup Frame */}
          <div className="w-full md:w-[50%] bg-[#f8f9fa] flex items-center justify-center p-3 sm:p-6 overflow-hidden relative">
            {/* Heart Favorite on top-left */}
            <button
              onClick={handleToggleLike}
              className={`absolute top-4 left-4 z-20 w-9 h-9 rounded-full shadow flex items-center justify-center transition-transform hover:scale-110 ${
                isLiked ? "bg-rose-500 text-white" : "bg-white/90 text-rose-500"
              }`}
              title={isLiked ? "Đã yêu thích" : "Yêu thích mẫu này"}
            >
              <Heart className={`w-5 h-5 ${isLiked ? "fill-white" : ""}`} />
            </button>

            {/* Realistic Smartphone Frame */}
            <div className="relative w-full max-w-[340px] h-[560px] sm:h-[620px] bg-black rounded-[40px] p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-[4px] border-gray-800 flex flex-col overflow-hidden">
              {/* Phone Camera Notch */}
              <div className="absolute top-4 inset-x-0 z-30 flex justify-center pointer-events-none">
                <div className="w-24 h-4 bg-black rounded-full" />
              </div>

              {/* Live Interactive Screen */}
              <div className="relative w-full h-full rounded-[30px] overflow-hidden bg-white">
                {template.slug || template.id ? (
                  <iframe
                    src={`/show/${template.slug || template.id}`}
                    className="w-full h-full border-0"
                    title={template.title}
                  />
                ) : (
                  <ModuleRenderer
                    modules={generateDefaultModules(template)}
                    bankInfo={template.defaultData.bankInfo}
                    musicUrl={template.defaultData.musicUrl}
                    musicTitle={template.defaultData.musicTitle}
                    initialWishes={template.defaultData.initialWishes}
                    interactive={true}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Template Info & CTAs */}
          <div className="w-full md:w-[50%] p-5 sm:p-8 flex flex-col justify-between overflow-y-auto">
            {/* Close button on desktop */}
            <button
              onClick={onClose}
              className="hidden sm:flex absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              {/* Top stats */}
              <div className="flex items-center gap-2 mb-3">
                <div className="rounded-full text-xs font-semibold flex items-center gap-1.5 px-3 py-1 text-white bg-rose-500">
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  <span>{template.likes}</span>
                </div>
                <div className="rounded-full text-xs font-semibold flex items-center gap-1.5 px-3 py-1 text-white bg-blue-500">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{template.views}</span>
                </div>
                <span className="text-xs text-gray-500 ml-auto font-medium">
                  {template.categoryName}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-serif">
                {template.title}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1.5 leading-relaxed">
                {template.description}
              </p>

              {/* Color Palette Preview */}
              {template.meta?.palette && (
                <div className="mt-4 p-3 rounded-2xl bg-stone-50 border border-stone-200/70">
                  <div className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Bảng màu chủ đạo</span>
                    {copiedColor && (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Đã sao chép {copiedColor}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {Object.entries(template.meta.palette).map(([key, hex]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleCopyColor(hex)}
                        title={`Bấm để sao chép mã màu ${hex} (${key})`}
                        className="group/color flex-1 flex flex-col items-center gap-1 p-1.5 rounded-xl bg-white border border-gray-200/80 hover:border-zen-primary transition-all shadow-2xs"
                      >
                        <span
                          className="w-full h-5 rounded-lg border border-black/10"
                          style={{ backgroundColor: hex }}
                        />
                        <span className="text-[9px] font-mono text-gray-500 group-hover/color:text-zen-primary">
                          {hex}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Feature Checklist */}
              <div className="mt-5 space-y-2.5 text-xs text-gray-700">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold text-gray-900">Thiết kế:</strong>{" "}
                    Đa dạng phong cách, chuẩn thẩm mỹ cao, hiển thị hoàn hảo trên di động.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold text-gray-900">Tùy biến:</strong>{" "}
                    Chỉnh sửa từng chữ, đổi ảnh cưới, nhạc nền và số tài khoản ngân hàng trực quan.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold text-gray-900">Chia sẻ:</strong>{" "}
                    Gửi thiệp mời đa nền tảng (Zalo, Messenger, SMS) chỉ với 1 đường link duy nhất.
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions & QR */}
            <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col items-center gap-3">
              {/* Buttons */}
              <div className="flex items-center gap-2.5 w-full">
                <Link
                  href={detailPageUrl}
                  onClick={onClose}
                  className="py-2.5 px-3.5 rounded-full border border-gray-200 hover:border-gray-400 bg-white text-gray-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  title="Xem trang chi tiết đầy đủ của mẫu"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                  <span className="hidden sm:inline">Chi tiết</span>
                </Link>

                <Link
                  href={`/design-template/${template.id}`}
                  onClick={onClose}
                  className="py-2.5 px-3.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  title="Mở trong Studio Tạo Template"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Studio</span>
                </Link>

                <button
                  type="button"
                  onClick={() => onUse(template.id)}
                  className="flex-1 py-2.5 px-4 rounded-full bg-zen-primary hover:bg-red-600 text-white text-xs sm:text-sm font-semibold shadow-md shadow-zen-primary/30 transition-all hover:scale-[1.02] active:scale-95 text-center flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Sử dụng mẫu này</span>
                </button>
              </div>

              {/* QR Code */}
              <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-2xl border border-gray-100 w-full">
                <img
                  src={qrUrl}
                  alt="Mã QR quét xem thiệp"
                  className="w-12 h-12 rounded-lg bg-white p-1 border shadow-2xs"
                />
                <div className="text-left">
                  <div className="text-xs font-semibold text-gray-800">
                    Quét mã QR bằng điện thoại
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    Mở camera để trải nghiệm thiệp tương tác trên di động
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
