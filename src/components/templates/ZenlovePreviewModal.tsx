"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Heart,
  Eye,
  Share2,
  Copy,
  Check,
  Music,
  Volume2,
  VolumeX,
  Sparkles,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  Calendar,
  MapPin,
  Gift,
} from "lucide-react";
import { ZenLoveTemplate } from "@/data/zenloveTemplates";

interface ZenlovePreviewModalProps {
  template: ZenLoveTemplate | null;
  onClose: () => void;
  onUse: (templateId: string) => void;
}

export default function ZenlovePreviewModal({
  template,
  onClose,
  onUse,
}: ZenlovePreviewModalProps) {
  const [isPlayingMusic, setIsPlayingMusic] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [likes, setLikes] = useState(0);
  const [previewMode, setPreviewMode] = useState<"image" | "interactive">("image");
  const [isCloning, setIsCloning] = useState(false);

  useEffect(() => {
    if (template) {
      setLikes(template.likeCount || 0);
      setIsLiked(false);
      setIsPlayingMusic(true);
      setPreviewMode("image");
      setIsCloning(false);
    }
  }, [template]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!template) return null;

  const handleToggleLike = () => {
    const next = !isLiked;
    setIsLiked(next);
    setLikes((prev) => (next ? prev + 1 : Math.max(0, prev - 1)));
  };

  const handleCopyLink = () => {
    const url = typeof window !== "undefined" ? window.location.href : "https://zenlove.me";
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const isForm = template.targetPageType === "FORM";

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[92vh] border border-gray-100 relative animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button Top Right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-9 h-9 rounded-full bg-white/90 hover:bg-gray-100 shadow-md text-gray-500 hover:text-gray-900 flex items-center justify-center transition-all hover:scale-105"
          aria-label="Đóng xem trước"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column: Realistic Phone Mockup Preview */}
        <div className="w-full md:w-[48%] bg-gradient-to-b from-[#f8f9fa] to-[#edeef0] p-4 sm:p-6 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-rose-200/40 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-indigo-200/30 blur-3xl pointer-events-none" />

          {/* Preview Mode Switcher */}
          <div className="mb-3 z-10 flex items-center gap-1.5 p-1 bg-white/90 backdrop-blur-md rounded-2xl shadow-xs border border-gray-200/80 text-[11px] font-semibold text-gray-600">
            <button
              type="button"
              onClick={() => setPreviewMode("image")}
              className={`px-3 py-1 rounded-xl transition-all ${
                previewMode === "image"
                  ? "bg-stone-900 text-white font-bold shadow-2xs"
                  : "hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Ảnh thiết kế
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode("interactive")}
              className={`px-3 py-1 rounded-xl transition-all flex items-center gap-1 ${
                previewMode === "interactive"
                  ? "bg-zen-primary text-white font-bold shadow-2xs"
                  : "hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Thiệp tương tác thật</span>
            </button>
          </div>

          {/* Smartphone Shell */}
          <div className="relative w-[280px] sm:w-[310px] h-[520px] sm:h-[580px] bg-black rounded-[44px] p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] ring-1 ring-white/20 flex flex-col">
            {/* Phone Screen Bezel */}
            <div className="relative w-full h-full bg-white rounded-[34px] overflow-hidden flex flex-col border border-stone-800/40">
              {/* Phone Status Bar & Dynamic Island */}
              <div className="h-7 w-full bg-white/90 backdrop-blur-md shrink-0 flex items-center justify-between px-6 z-20 border-b border-gray-100/50">
                <span className="text-[11px] font-bold text-gray-800">09:41</span>
                {/* Dynamic Island */}
                <div className="w-20 h-3.5 bg-black rounded-full" />
                <div className="flex items-center gap-1.5 text-gray-700">
                  <span className="text-[10px]">5G</span>
                  <div className="w-4 h-2 rounded-[2px] border border-gray-600 p-0.5 flex items-center">
                    <div className="w-full h-full bg-gray-800 rounded-[1px]" />
                  </div>
                </div>
              </div>

              {/* Scrollable Template Content */}
              {previewMode === "interactive" ? (
                <div className="flex-1 w-full h-full relative overflow-hidden bg-[#faf7f2]">
                  <iframe
                    src={`/show/${template.slug}`}
                    className="w-full h-full border-0"
                    title={template.name}
                  />
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto scroll-smooth [scrollbar-width:thin] relative">
                  <img
                    src={template.imageUrl}
                    alt={template.name}
                    className="w-full h-auto object-top"
                  />

                  {/* Floating Music Widget */}
                  <div className="sticky bottom-3 inset-x-3 mx-auto z-20">
                    <div className="bg-black/80 backdrop-blur-md text-white rounded-full px-3.5 py-1.5 flex items-center justify-between shadow-lg">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center ${
                            isPlayingMusic ? "animate-spin" : ""
                          }`}
                        >
                          <Music className="w-2.5 h-2.5 text-white" />
                        </div>
                        <span className="text-[11px] font-medium truncate">
                          Beautiful In White • Nhạc nền
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsPlayingMusic(!isPlayingMusic)}
                        className="p-1 hover:text-rose-400 transition-colors"
                        title={isPlayingMusic ? "Tắt âm thanh" : "Bật âm thanh"}
                      >
                        {isPlayingMusic ? (
                          <Volume2 className="w-3.5 h-3.5" />
                        ) : (
                          <VolumeX className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Template Info & Actions */}
        <div className="w-full md:w-[52%] p-6 sm:p-8 flex flex-col justify-between overflow-y-auto bg-white">
          <div className="space-y-5">
            {/* Header tags & External Link */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-zen-primary border border-rose-100">
                  {template.categoryName || "Thiệp cưới"}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                  {isForm ? "Biểu mẫu (Dễ điền)" : "Tự do (Tùy biến cao)"}
                </span>
                {template.templateType && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 uppercase">
                    {template.templateType}
                  </span>
                )}
              </div>

              {/* Mở trực tiếp bản gốc ZenLove */}
              <a
                href={`https://zenlove.me/templates/${template.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-zen-primary bg-stone-100 hover:bg-rose-50 px-3 py-1 rounded-full border border-gray-200 transition-colors"
                title="Mở trực tiếp mẫu này trên website ZenLove.me bản gốc để đối chiếu"
              >
                <span>Mở bản gốc ZenLove</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Template Title */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-black font-serif text-gray-900 tracking-tight">
                {template.name}
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
                {(template.description || "")
                  .replace(/<[^>]+>/g, "")
                  .trim() ||
                  `Mẫu thiệp ${template.categoryName} cao cấp với hiệu ứng trượt mượt mà, hỗ trợ phát nhạc, album ảnh cưới, bản đồ chỉ đường và nhận tiền mừng qua mã QR.`}
              </p>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-4 py-3 px-4 rounded-2xl bg-gray-50/80 border border-gray-100 text-xs">
              <div className="flex items-center gap-1.5 text-rose-600 font-semibold">
                <Heart className="w-4 h-4 fill-current" />
                <span>{likes} người yêu thích</span>
              </div>
              <div className="w-px h-4 bg-gray-200" />
              <div className="flex items-center gap-1.5 text-blue-600 font-semibold">
                <Eye className="w-4 h-4" />
                <span>{template.viewCount || 0} lượt xem</span>
              </div>
            </div>

            {/* Interactive Feature Highlights */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Tính năng nổi bật đi kèm:
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-50">
                  <Smartphone className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Chuẩn mọi thiết bị</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-50">
                  <Music className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Phát nhạc tự động</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-50">
                  <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Google Maps chỉ đường</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-50">
                  <Gift className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Mã QR mừng cưới</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="mt-8 pt-5 border-t border-gray-100 space-y-3">
            <div className="flex items-center gap-3">
              {/* Like Button */}
              <button
                type="button"
                onClick={handleToggleLike}
                className={`flex-1 py-3 px-4 rounded-full border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 ${
                  isLiked
                    ? "border-rose-300 bg-rose-50 text-rose-600 shadow-xs"
                    : "border-gray-200 hover:border-rose-200 bg-white text-gray-700"
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                <span>{isLiked ? "Đã thích" : "Yêu thích"}</span>
              </button>

              {/* Share Button */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="py-3 px-4 rounded-full border border-gray-200 hover:border-gray-300 bg-white text-xs sm:text-sm font-bold text-gray-700 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Đã chép link</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-gray-500" />
                    <span>Chia sẻ</span>
                  </>
                )}
              </button>
            </div>

            {/* Primary 'Dùng mẫu này' Button */}
            <button
              type="button"
              disabled={isCloning}
              onClick={() => {
                setIsCloning(true);
                onUse(template.id);
              }}
              className="w-full py-3.5 px-6 rounded-full bg-zen-primary hover:bg-[#d93849] disabled:opacity-85 text-white font-bold text-sm sm:text-base shadow-lg shadow-zen-primary/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {isCloning ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang clone mẫu về Studio của bạn...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Dùng mẫu này ngay (Clone về Studio)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
