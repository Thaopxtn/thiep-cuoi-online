"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Heart, Eye, Sparkles, Check, ExternalLink } from "lucide-react";
import { TemplateItem, generateDefaultModules } from "@/data/templates";
import { isFavorite, toggleFavorite, FAVORITES_EVENT_CHANGE } from "@/lib/storage/favorites";
import ModuleRenderer from "../modules/ModuleRenderer";

interface TemplateCardProps {
  template: TemplateItem;
  onPreview: (template: TemplateItem) => void;
  onUse: (templateId: string) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (templateId: string) => void;
  topBadgeSlot?: React.ReactNode;
}

export default function TemplateCard({
  template,
  onPreview,
  onUse,
  selectable = false,
  selected = false,
  onToggleSelect,
  topBadgeSlot,
}: TemplateCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(0.72);
  const [isRendered, setIsRendered] = useState<boolean>(false);
  const [isFav, setIsFav] = useState<boolean>(false);

  // Check initial favorite state & listen for updates
  useEffect(() => {
    setIsFav(isFavorite(template.id));

    const handleFavChange = () => {
      setIsFav(isFavorite(template.id));
    };

    window.addEventListener(FAVORITES_EVENT_CHANGE, handleFavChange);
    return () => window.removeEventListener(FAVORITES_EVENT_CHANGE, handleFavChange);
  }, [template.id]);

  // Lazy render observer: only load ModuleRenderer when card enters viewport
  useEffect(() => {
    if (!containerRef.current || isRendered) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsRendered(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isRendered]);

  // Measure card width and calculate scale relative to standard 375px mobile viewport
  useEffect(() => {
    if (!containerRef.current) return;

    const updateScale = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        if (width > 0) {
          setScale(width / 375);
        }
      }
    };

    updateScale();

    const resizeObserver = new ResizeObserver(() => {
      updateScale();
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Memoize modules for this template
  const templateModules = useMemo(() => {
    return generateDefaultModules(template);
  }, [template]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = toggleFavorite(template.id);
    setIsFav(nextState);
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect?.(template.id);
  };

  const detailUrl = `/templates/${template.slug || template.id}`;

  return (
    <div className="template-item-v3 infrastructure w-full">
      <article
        onClick={() => onPreview(template)}
        className={`group relative flex w-full cursor-pointer flex-col items-center rounded-2xl bg-white transition-all duration-300 ease-in-out hover:-translate-y-1.5 ${
          selected
            ? "ring-2 ring-zen-primary shadow-lg shadow-rose-500/10"
            : "shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.12)] border border-gray-100"
        }`}
      >
        {/* Card Template Viewport Container */}
        <div
          ref={containerRef}
          className="relative w-full overflow-hidden rounded-2xl [aspect-ratio:1000/1470] bg-stone-100"
        >
          {/* Top Left: Checkbox (Selectable mode) OR Favorite Heart */}
          <div className="absolute top-2.5 left-2.5 z-40 flex items-center gap-1.5">
            {selectable ? (
              <button
                type="button"
                onClick={handleCheckboxClick}
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                  selected
                    ? "bg-zen-primary text-white shadow-md shadow-zen-primary/30"
                    : "bg-white/90 text-transparent border border-gray-300 hover:border-zen-primary shadow-xs"
                }`}
                title={selected ? "Bỏ chọn mẫu này" : "Chọn mẫu này"}
              >
                <Check className={`w-3.5 h-3.5 ${selected ? "text-white" : "opacity-0"}`} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFavoriteClick}
                className={`w-7 h-7 rounded-full shadow-sm backdrop-blur-xs flex items-center justify-center transition-all duration-200 hover:scale-115 active:scale-95 ${
                  isFav
                    ? "bg-rose-500 text-white"
                    : "bg-white/80 text-gray-400 hover:text-rose-500"
                }`}
                title={isFav ? "Bỏ yêu thích" : "Yêu thích mẫu này"}
              >
                <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-current" : ""}`} />
              </button>
            )}

            {topBadgeSlot}
          </div>

          {/* Top Right: Tag Badge */}
          {template.tag && (
            <div
              className={`absolute top-2.5 right-2.5 z-20 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-xs transition-all duration-200 group-hover:opacity-0 ${
                template.tag === "PREMIUM"
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                  : template.tag === "HOT"
                  ? "bg-gradient-to-r from-red-500 to-rose-600 text-white"
                  : template.tag === "FREE"
                  ? "bg-emerald-500 text-white"
                  : "bg-amber-500 text-white"
              }`}
            >
              {template.tag}
            </div>
          )}

          {/* Live Rendered Template (or Poster fallback before intersecting) */}
          {isRendered ? (
            <div
              className="absolute top-0 left-0 w-[375px] origin-top-left pointer-events-none select-none"
              style={{
                transform: `scale(${scale})`,
                width: "375px",
              }}
            >
              <div className="w-full transition-transform ease-out duration-700 group-hover:duration-[8s] group-hover:-translate-y-[62%]">
                <ModuleRenderer
                  modules={templateModules}
                  bankInfo={template.defaultData.bankInfo}
                  musicUrl={template.defaultData.musicUrl}
                  musicTitle={template.defaultData.musicTitle}
                  initialWishes={template.defaultData.initialWishes}
                  interactive={false}
                />
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-100 text-gray-300">
              {template.image ? (
                <img
                  src={template.image}
                  alt={template.title}
                  className="w-full h-full object-cover object-top opacity-90"
                  loading="lazy"
                />
              ) : (
                <div className="animate-pulse w-full h-full bg-stone-200" />
              )}
            </div>
          )}

          {/* Hover Overlay with Action Buttons */}
          <div className="pointer-events-none absolute inset-0 bg-black/35 opacity-0 backdrop-blur-[1px] transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-between p-3 z-30">
            {/* Top stats */}
            <div className="flex justify-end gap-1.5 self-end">
              <div className="rounded-full text-[10px] font-medium flex items-center gap-1 px-2 py-0.5 text-white bg-rose-500/90 shadow-xs backdrop-blur-xs">
                <Heart className="w-2.5 h-2.5 fill-current" />
                <span>{template.likes}</span>
              </div>
              <div className="rounded-full text-[10px] font-medium flex items-center gap-1 px-2 py-0.5 text-white bg-blue-500/90 shadow-xs backdrop-blur-xs">
                <Eye className="w-2.5 h-2.5" />
                <span>{template.views}</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pointer-events-auto flex flex-col gap-1.5 items-center w-full">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview(template);
                }}
                className="w-full max-w-[130px] py-1.5 px-3 rounded-full bg-zen-primary hover:bg-red-600 text-white text-xs font-semibold shadow-md transition-all duration-200 hover:scale-105 active:scale-95 text-center flex items-center justify-center gap-1"
              >
                <span>Xem mẫu</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUse(template.id);
                }}
                className="w-full max-w-[130px] py-1.5 px-3 rounded-full bg-white/95 hover:bg-white text-gray-800 text-xs font-medium shadow-xs transition-all duration-200 hover:scale-105 active:scale-95 text-center flex items-center justify-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Sử dụng</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card Title & Info */}
        <div className="p-3 w-full text-center">
          <Link
            href={detailUrl}
            onClick={(e) => e.stopPropagation()}
            className="block font-semibold text-xs sm:text-sm text-gray-900 truncate hover:text-zen-primary transition-colors"
            title={template.title}
          >
            {template.title}
          </Link>

          <div className="flex items-center justify-center gap-1.5 mt-1 text-[11px] text-gray-500">
            <span>{template.categoryName}</span>

            {/* Palette Dots Indicator */}
            {template.meta?.palette && (
              <div
                className="inline-flex items-center gap-0.5 ml-1"
                title={`Màu sắc: ${template.meta.colorFamily}`}
              >
                <span
                  className="w-2 h-2 rounded-full border border-black/10"
                  style={{ backgroundColor: template.meta.palette.primary }}
                />
                <span
                  className="w-2 h-2 rounded-full border border-black/10"
                  style={{ backgroundColor: template.meta.palette.secondary }}
                />
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
