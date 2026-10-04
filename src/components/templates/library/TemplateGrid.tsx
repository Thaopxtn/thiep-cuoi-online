"use client";

import React, { useState, useEffect, useRef } from "react";
import { TemplateItem } from "@/data/templates/types";
import TemplateCard from "@/components/templates/TemplateCard";
import EmptyState from "./EmptyState";
import { ChevronDown, Sparkles } from "lucide-react";

interface TemplateGridProps {
  templates: TemplateItem[];
  isReady?: boolean;
  onPreview: (template: TemplateItem) => void;
  onUse: (templateId: string) => void;
  // Management actions slot for /kho-template
  renderCardActions?: (template: TemplateItem) => React.ReactNode;
  renderCardBadge?: (template: TemplateItem) => React.ReactNode;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (templateId: string) => void;
  emptyType?: "search" | "custom" | "favorites" | "general";
  onResetFilters?: () => void;
  onCreateNew?: () => void;
}

const PAGE_SIZE = 18;

export default function TemplateGrid({
  templates,
  isReady = true,
  onPreview,
  onUse,
  renderCardActions,
  renderCardBadge,
  selectable = false,
  selectedIds,
  onToggleSelect,
  emptyType = "search",
  onResetFilters,
  onCreateNew,
}: TemplateGridProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset pagination when templates array changes (e.g., filter changed)
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [templates.length]);

  // Infinite scroll trigger via IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, templates.length));
        }
      },
      { rootMargin: "400px" }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [templates.length]);

  // Loading skeleton when storage is hydrating
  if (!isReady) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white p-3 border border-gray-100 shadow-xs animate-pulse flex flex-col gap-3"
          >
            <div className="w-full [aspect-ratio:1000/1470] bg-stone-200 rounded-xl" />
            <div className="h-4 bg-stone-200 rounded w-3/4 mx-auto" />
            <div className="h-3 bg-stone-100 rounded w-1/2 mx-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <EmptyState
        type={emptyType}
        onResetFilters={onResetFilters}
        onCreateNew={onCreateNew}
      />
    );
  }

  const visibleTemplates = templates.slice(0, visibleCount);
  const hasMore = visibleCount < templates.length;

  return (
    <div className="space-y-8">
      {/* Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
        {visibleTemplates.map((item) => (
          <div key={item.id} className="relative group/wrapper flex flex-col">
            {/* Template Card with lazy preview and favorite heart */}
            <TemplateCard
              template={item}
              onPreview={onPreview}
              onUse={onUse}
              selectable={selectable}
              selected={selectedIds?.has(item.id)}
              onToggleSelect={onToggleSelect}
              topBadgeSlot={renderCardBadge ? renderCardBadge(item) : undefined}
            />

            {/* Optional Card Actions slot */}
            {renderCardActions && (
              <div className="mt-2">{renderCardActions(item)}</div>
            )}
          </div>
        ))}
      </div>

      {/* Infinite Scroll Sentinel & Fallback Button */}
      {hasMore && (
        <div ref={sentinelRef} className="pt-4 flex flex-col items-center justify-center gap-3">
          <button
            type="button"
            onClick={() =>
              setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, templates.length))
            }
            className="px-6 py-2.5 rounded-full bg-white hover:bg-stone-50 border border-gray-200 text-gray-700 text-xs sm:text-sm font-semibold shadow-xs transition-all hover:scale-105 flex items-center gap-2"
          >
            <ChevronDown className="w-4 h-4 text-gray-500 animate-bounce" />
            <span>
              Xem thêm ({templates.length - visibleCount} mẫu còn lại)
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
