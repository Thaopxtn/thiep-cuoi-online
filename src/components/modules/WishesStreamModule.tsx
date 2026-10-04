"use client";

import React from "react";

export interface WishesStreamProps {
  wishes: Array<{ id: string; name: string; message: string }>;
  maxVisible?: number;
}

export default function WishesStreamModule({
  wishes,
  maxVisible = 4,
}: WishesStreamProps) {
  if (!wishes || wishes.length === 0) return null;

  return (
    <div className="px-4 mb-24 pointer-events-none space-y-2 max-w-sm">
      {wishes.slice(0, maxVisible).map((w, idx) => (
        <div
          key={w.id || idx}
          className="bg-black/50 backdrop-blur-md text-white rounded-full py-1 px-3.5 text-xs inline-flex items-center gap-1.5 shadow-sm max-w-full truncate animate-fade-in"
        >
          <span className="font-bold text-amber-300 shrink-0">{w.name}:</span>
          <span className="truncate">{w.message}</span>
        </div>
      ))}
    </div>
  );
}
