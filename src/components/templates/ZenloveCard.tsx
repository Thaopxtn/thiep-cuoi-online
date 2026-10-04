"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Eye, Sparkles } from "lucide-react";
import { ZenLoveTemplate } from "@/data/zenloveTemplates";

interface ZenloveCardProps {
  template: ZenLoveTemplate;
  onPreview: (template: ZenLoveTemplate) => void;
  onUse: (templateId: string) => void;
  isLiked?: boolean;
  onToggleLike?: (id: string) => void;
}

export default function ZenloveCard({
  template,
  onPreview,
  onUse,
  isLiked = false,
  onToggleLike,
}: ZenloveCardProps) {
  const [likes, setLikes] = useState(template.likeCount || 0);
  const [liked, setLiked] = useState(isLiked);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const newLiked = !liked;
    setLiked(newLiked);
    setLikes((prev) => (newLiked ? prev + 1 : Math.max(0, prev - 1)));
    if (onToggleLike) onToggleLike(template.id);
  };

  const isForm = template.targetPageType === "FORM";
  const isHot = template.templateType === "hot" || template.viewCount > 2000;
  const isNew = template.templateType === "new";

  return (
    <div className="template-item-v3 flex flex-col group/template-item-v3">
      <article
        onClick={() => onPreview(template)}
        className="relative flex w-full cursor-pointer flex-col items-center rounded-[12px] shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_32px_rgba(229,65,83,0.18)] transition-all duration-300 ease-out hover:-translate-y-2 bg-white border border-gray-100/80 overflow-hidden"
      >
        {/* Aspect Ratio 1000/1470 container */}
        <div className="relative w-full overflow-hidden bg-gray-50 [aspect-ratio:1000/1470]">
          {/* Top-left Badges */}
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 transition-all duration-200 group-hover/template-item-v3:-translate-y-8 group-hover/template-item-v3:opacity-0 pointer-events-none">
            {isForm && (
              <span className="rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                Biểu mẫu
              </span>
            )}
            {isHot && !isForm && (
              <span className="rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md bg-gradient-to-r from-rose-500 to-amber-500 text-white flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" />
                Hot
              </span>
            )}
            {isNew && !isHot && !isForm && (
              <span className="rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md bg-emerald-600 text-white">
                Mới
              </span>
            )}
          </div>

          {/* Long WebP Image with smooth auto-scroll on hover */}
          <div className="relative w-full h-full overflow-hidden bg-gray-100">
            <img
              src={template.imageUrl}
              alt={`Thiệp cưới online miễn phí - ${template.name} | Zenlove`}
              title={`Xem và tùy chỉnh ${template.name} miễn phí`}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600";
              }}
              className="w-full h-auto align-top transition-transform duration-200 ease-out group-hover/template-item-v3:duration-[2800ms] group-hover/template-item-v3:ease-linear group-hover/template-item-v3:-translate-y-[45%]"
            />
          </div>

          {/* Hover Overlay with Action Buttons */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover/template-item-v3:opacity-100">
            {/* Center-bottom 'Xem mẫu' button */}
            <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-auto px-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview(template);
                }}
                className="w-full max-w-[130px] rounded-full bg-zen-primary hover:bg-[#d93849] py-2 text-xs font-bold text-white shadow-lg shadow-zen-primary/40 transition-all duration-200 hover:scale-105 flex items-center justify-center gap-1.5"
              >
                <span>Xem mẫu</span>
              </button>
            </div>

            {/* Top-Right Badges: Likes & Views */}
            <div className="absolute top-2 right-2 flex flex-col gap-1 items-end pointer-events-auto">
              <button
                type="button"
                onClick={handleLike}
                className={`rounded-full text-[11px] font-semibold flex items-center gap-1 px-2 py-0.5 shadow-sm transition-all hover:scale-110 ${
                  liked
                    ? "bg-rose-600 text-white"
                    : "bg-[#ff4d6d]/90 text-white hover:bg-rose-600"
                }`}
                title="Yêu thích mẫu này"
              >
                <Heart className={`w-3 h-3 ${liked ? "fill-current" : ""}`} />
                <span>{likes}</span>
              </button>

              <div
                className="rounded-full text-[11px] font-semibold flex items-center gap-1 px-2 py-0.5 text-white bg-blue-500/90 shadow-sm"
                title={`${template.viewCount || 0} lượt xem`}
              >
                <Eye className="w-3 h-3" />
                <span>{template.viewCount || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Footer: Title & Category */}
        <div className="w-full px-2.5 py-2.5 text-left bg-white border-t border-gray-50 flex items-center justify-between gap-1">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 text-xs sm:text-[13px] truncate group-hover/template-item-v3:text-zen-primary transition-colors">
              {template.name}
            </h3>
            <p className="text-[11px] text-gray-400 truncate mt-0.5">
              {template.categoryName || "Thiệp cưới"}
            </p>
          </div>
          <span className="shrink-0 text-[10px] font-medium text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
            {isForm ? "Biểu mẫu" : "Tự do"}
          </span>
        </div>
      </article>
    </div>
  );
}
