"use client";

import React from "react";
import { MessageCircle, Gift, Heart, Mail } from "lucide-react";
import { FloatingMusicPlayer } from "../invitations/InteractiveDrawers";

export interface FloatingActionBarProps {
  likesCount: number;
  onOpenWishes: () => void;
  onShootHeart: () => void;
  onOpenGift: () => void;
  onOpenRsvp?: () => void;
  showRsvp?: boolean;
  musicUrl?: string;
  musicTitle?: string;
}

export default function FloatingActionBarModule({
  likesCount,
  onOpenWishes,
  onShootHeart,
  onOpenGift,
  onOpenRsvp,
  showRsvp = false,
  musicUrl,
  musicTitle = "Bài hát",
}: FloatingActionBarProps) {
  return (
    <>
      {/* Floating Music Disc (Top Right) */}
      {musicUrl && (
        <div className="absolute top-4 right-4 z-40">
          <FloatingMusicPlayer musicUrl={musicUrl} musicTitle={musicTitle} />
        </div>
      )}

      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-3 inset-x-0 z-50 px-3 flex justify-center pointer-events-none">
        <div className="pointer-events-auto bg-stone-900/85 backdrop-blur-md rounded-full px-3 py-2 flex items-center gap-2 shadow-2xl border border-white/20 max-w-md w-full justify-between">
          {/* RSVP Button */}
          {showRsvp && onOpenRsvp && (
            <button
              onClick={onOpenRsvp}
              className="py-1.5 px-3 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center gap-1 transition-all active:scale-90"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>RSVP</span>
            </button>
          )}

          {/* Wish Button */}
          <button
            onClick={onOpenWishes}
            className="flex-1 py-1.5 px-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-medium flex items-center justify-center gap-1 transition-all"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="truncate">Gửi lời chúc...</span>
          </button>

          {/* Shoot Heart Button */}
          <button
            onClick={onShootHeart}
            className="py-1.5 px-3 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-medium flex items-center gap-1 transition-all active:scale-90"
          >
            <span>👏</span>
            <span>Bắn tim</span>
          </button>

          {/* Gift Button */}
          <button
            onClick={onOpenGift}
            title="Mừng quà"
            className="w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow transition-all active:scale-90 animate-gift-jump"
          >
            <Gift className="w-4 h-4" />
          </button>

          {/* Likes Count */}
          <div className="flex items-center gap-1 text-white text-xs px-1.5">
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            <span className="font-mono">{likesCount}</span>
          </div>
        </div>
      </div>
    </>
  );
}
