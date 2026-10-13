"use client";

import React from "react";
import { Heart, Sparkles } from "lucide-react";

export interface LuxuryEnvelopeProps {
  isOpen: boolean;
  isOpening: boolean;
  onOpen: () => void;
  guestName?: string;
  groomName: string;
  brideName: string;
  weddingDate?: string;
  venue?: string;
  coverImage?: string;
  theme?: "cream" | "burgundy" | "traditional" | string;
}

export default function LuxuryEnvelopeModal({
  isOpen,
  isOpening,
  onOpen,
  guestName,
  groomName,
  brideName,
  weddingDate,
  venue,
  coverImage,
  theme = "cream",
}: LuxuryEnvelopeProps) {
  if (isOpen) return null;

  // Theme palettes & textures
  const isTraditional = theme === "traditional";
  const isBurgundy = theme === "burgundy";

  // Palette configs
  const colors = isTraditional
    ? {
        envelopeBg: "from-[#7d121b] via-[#941722] to-[#6a0d14]",
        pocketGradientStart: "#9e1a26",
        pocketGradientEnd: "#720e17",
        flapGradientStart: "#b82230",
        flapGradientEnd: "#83121c",
        goldStroke: "#f3c66f",
        ribbonBg: "from-[#a81c29] via-[#c42535] to-[#83121c]",
        ribbonBorder: "#f3c66f",
        ribbonTail: "from-[#c42535] to-[#720e17]",
        tagBg: "bg-[#fff8ea]",
        tagText: "text-[#80121b]",
        tagBorder: "border-[#e5b356]",
        sealOuter: "from-[#f59e0b] via-[#d97706] to-[#b45309]",
        sealInner: "from-[#991b1b] via-[#b91c1c] to-[#7f1d1d]",
        sealText: "text-[#fef3c7]",
        symbol: "囍",
      }
    : isBurgundy
    ? {
        envelopeBg: "from-[#450e13] via-[#541218] to-[#36090d]",
        pocketGradientStart: "#5c151c",
        pocketGradientEnd: "#3a0b10",
        flapGradientStart: "#751c26",
        flapGradientEnd: "#450e14",
        goldStroke: "#e0b86b",
        ribbonBg: "from-[#63171f] via-[#7d1d27] to-[#450e14]",
        ribbonBorder: "#e0b86b",
        ribbonTail: "from-[#7d1d27] to-[#3a0b10]",
        tagBg: "bg-[#fffdf9]",
        tagText: "text-[#450e13]",
        tagBorder: "border-[#d4af37]",
        sealOuter: "from-[#d4af37] via-[#aa8222] to-[#785b14]",
        sealInner: "from-[#5e141b] via-[#781922] to-[#450e13]",
        sealText: "text-[#ffd700]",
        symbol: "heart",
      }
    : {
        // Cream / Champagne (Default for Pure Romance & Aurora Luxury)
        envelopeBg: "from-[#f4efe6] via-[#faf7f2] to-[#eae2d5]",
        pocketGradientStart: "#ffffff",
        pocketGradientEnd: "#ede5d8",
        flapGradientStart: "#faf6ef",
        flapGradientEnd: "#dfd6c7",
        goldStroke: "#d4af37",
        ribbonBg: "from-[#ebdcc8] via-[#f7eee2] to-[#ddccb4]",
        ribbonBorder: "#d4af37",
        ribbonTail: "from-[#e8d7be] to-[#cfbeaa]",
        tagBg: "bg-[#ffffff]",
        tagText: "text-[#6b4e23]",
        tagBorder: "border-[#d4af37]",
        sealOuter: "from-[#e6ca65] via-[#c59b27] to-[#916f15]",
        sealInner: "from-[#faf7f2] via-[#f3ecdc] to-[#e0d3bc]",
        sealText: "text-[#8c6721]",
        symbol: "sparkle",
      };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-4 transition-all duration-700 select-none ${
        isOpening ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* 1. Cinematic Romantic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {coverImage ? (
          <img
            src={coverImage}
            alt="Wedding Cover"
            className="w-full h-full object-cover blur-md brightness-60 scale-110"
          />
        ) : (
          <div className="w-full h-full bg-[#1c0f12]" />
        )}
        {/* Soft Warm Radial Vignette */}
        <div className="absolute inset-0 bg-radial-[circle_at_center,rgba(0,0,0,0.25)_0%,rgba(0,0,0,0.85)_100%]" />
        {/* Atmospheric Bokeh shimmer dots */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffd700_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
      </div>

      {/* 2. Main 3D Envelope Scene Wrapper */}
      <div className="relative w-full max-w-[360px] perspective-envelope z-10 animate-scale-in">
        <div className="relative w-full h-[240px] transform-style-3d">

          {/* Layer A: Envelope Back Wall (Giấy mặt sau) */}
          <div
            className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${colors.envelopeBg} shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_35px_rgba(212,175,55,0.2)] border border-amber-400/30 overflow-hidden`}
          >
            {/* Inner artistic liner pattern */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:12px_12px]" />
          </div>

          {/* Layer B: The Sliding Invitation Letter Card (Tucked inside, slides up when opened) */}
          <div
            className={`envelope-letter-slide absolute inset-x-4 top-4 bottom-4 bg-[#fffdfa] rounded-xl border border-amber-500/30 shadow-lg p-3 text-center flex flex-col justify-between z-10 transition-transform duration-700 ${
              isOpening ? "-translate-y-28 scale-[1.03] shadow-2xl" : "translate-y-0"
            }`}
          >
            {/* Elegant Letter Content with Gold Foil Border */}
            <div className="border border-amber-700/25 rounded-lg p-3 h-full flex flex-col justify-between bg-gradient-to-b from-[#fffefc] to-[#fbf8f2]">
              <div>
                <span className="text-[9px] uppercase tracking-[0.25em] font-serif text-amber-900/80 font-bold block">
                  THIỆP MỜI THÀNH HÔN
                </span>
                <div className="w-8 h-px bg-amber-600/30 mx-auto mt-1" />
              </div>

              <div className="my-auto py-1">
                {guestName && (
                  <div className="inline-block px-2.5 py-0.5 mb-1 rounded-full bg-amber-50 border border-amber-300/70 text-[10px] font-semibold text-amber-900">
                    Kính mời: <strong className="font-serif">{guestName}</strong>
                  </div>
                )}
                <h2 className="text-2xl sm:text-3xl font-great-vibes text-[#511419] font-normal leading-tight">
                  {groomName}
                </h2>
                <div className="flex items-center justify-center gap-2 my-0.5">
                  <span className="w-4 h-px bg-amber-700/30" />
                  <span className="text-[10px] font-serif italic text-amber-800">&</span>
                  <span className="w-4 h-px bg-amber-700/30" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-great-vibes text-[#511419] font-normal leading-tight">
                  {brideName}
                </h2>
              </div>

              <div className="text-[9px] text-gray-600 font-medium border-t border-amber-700/15 pt-1.5 flex items-center justify-between">
                <span className="font-bold text-[#511419]">{weddingDate || "Ngày Hôn Lễ"}</span>
                <span className="truncate max-w-[150px] text-gray-500">{venue || "Trung tâm tiệc cưới"}</span>
              </div>
            </div>
          </div>

          {/* Layer C: Gapless Front Pocket (Túi đựng mặt trước 100% Watertight SVG) */}
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-2xl">
            <svg
              className="w-full h-full drop-shadow-[0_-5px_12px_rgba(0,0,0,0.25)]"
              viewBox="0 0 360 240"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="pocketGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={colors.pocketGradientStart} />
                  <stop offset="100%" stopColor={colors.pocketGradientEnd} />
                </linearGradient>
              </defs>

              {/* Seamless Front Pocket Geometry with rounded bottom corners */}
              <path
                d="M 0 16 L 175 75 Q 180 77 185 75 L 360 16 L 360 224 A 16 16 0 0 1 344 240 L 16 240 A 16 16 0 0 1 0 224 Z"
                fill="url(#pocketGrad)"
                stroke={colors.goldStroke}
                strokeWidth="1"
              />
              {/* Decorative Inset Gold Foil Stitching */}
              <path
                d="M 6 22 L 175 81 Q 180 83 185 81 L 354 22"
                fill="none"
                stroke={colors.goldStroke}
                strokeWidth="0.75"
                strokeDasharray="4 3"
                opacity="0.7"
              />
            </svg>

            {/* Satin Ribbon Band across the envelope body */}
            <div
              className={`absolute bottom-8 inset-x-0 h-8 bg-gradient-to-r ${colors.ribbonBg} border-y border-amber-400/40 shadow-sm flex items-center justify-center`}
            >
              {/* Ribbon Gold Foil Center Highlight */}
              <div className="w-full h-px bg-amber-200/40" />

              {/* Guest Invitation Calligraphy Badge on Ribbon */}
              <div
                className={`absolute px-3.5 py-1 rounded-full ${colors.tagBg} ${colors.tagBorder} border shadow-md flex items-center gap-1.5`}
              >
                <Sparkles className="w-3 h-3 text-amber-500 animate-pulse shrink-0" />
                <span className={`text-[11px] font-bold font-serif tracking-wide ${colors.tagText}`}>
                  {guestName ? `Kính mời: ${guestName}` : "Trân trọng kính mời"}
                </span>
              </div>
            </div>
          </div>

          {/* Layer D: 3D Top Flap with Realistic Wax Seal (Nắp gập xoay 3D với góc bo chuẩn) */}
          <div
            className={`envelope-flap-3d envelope-flap-3d-smooth absolute top-0 inset-x-0 h-[145px] z-30 origin-top cursor-pointer ${
              isOpening ? "envelope-flap-3d-open" : ""
            }`}
            onClick={onOpen}
          >
            {/* Top Flap SVG:
                Top corners rounded with exact 16px radius matching the envelope back!
                Apex reaches (180, 138) with a smooth rounded tip. */}
            <svg
              className="w-full h-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)]"
              viewBox="0 0 360 145"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="flapGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={colors.flapGradientStart} />
                  <stop offset="100%" stopColor={colors.flapGradientEnd} />
                </linearGradient>
              </defs>
              <path
                d="M 16 0 L 344 0 A 16 16 0 0 1 360 16 L 185 136 Q 180 140 175 136 L 0 16 A 16 16 0 0 1 16 0 Z"
                fill="url(#flapGrad)"
                stroke={colors.goldStroke}
                strokeWidth="1"
              />
              {/* Inset Gold Foil Stitching line on flap */}
              <path
                d="M 22 5 L 338 5 A 12 12 0 0 1 350 17 L 184 130 Q 180 133 176 130 L 10 17 A 12 12 0 0 1 22 5 Z"
                fill="none"
                stroke={colors.goldStroke}
                strokeWidth="0.75"
                strokeDasharray="4 3"
                opacity="0.6"
              />
            </svg>

            {/* 3D Photorealistic Melted Wax Seal Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpen();
              }}
              className="absolute top-[96px] left-1/2 -translate-x-1/2 w-16 h-16 rounded-full cursor-pointer group z-40 transition-transform duration-300 hover:scale-110 active:scale-95"
              title="Chạm vào con dấu sáp để mở thiệp cưới"
            >
              {/* Crossed Ribbon Tails hanging beneath the wax seal */}
              <div
                className={`absolute top-8 left-2 w-3 h-8 bg-gradient-to-b ${colors.ribbonTail} border-l border-amber-300/40 rotate-15 shadow-sm pointer-events-none -z-10`}
                style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)" }}
              />
              <div
                className={`absolute top-8 right-2 w-3 h-8 bg-gradient-to-b ${colors.ribbonTail} border-r border-amber-300/40 -rotate-15 shadow-sm pointer-events-none -z-10`}
                style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)" }}
              />

              {/* Outer Organic Wavy Wax Puddle (Gờ sáp nóng chảy bất đối xứng) */}
              <div
                className={`w-full h-full rounded-[48%_52%_49%_51%_/_53%_47%_52%_48%] bg-gradient-to-br ${colors.sealOuter} p-1 shadow-[0_8px_20px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.6)] flex items-center justify-center animate-wax-seal-glow border border-amber-200/60`}
              >
                {/* Inner Wax Cavity with Engraved Monogram */}
                <div
                  className={`w-11 h-11 rounded-[47%_53%_50%_50%_/_52%_48%_53%_47%] bg-gradient-to-br ${colors.sealInner} border border-amber-300/50 flex items-center justify-center shadow-[inset_0_3px_6px_rgba(0,0,0,0.5)]`}
                >
                  {colors.symbol === "囍" ? (
                    <span className="text-2xl font-bold font-serif text-yellow-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      囍
                    </span>
                  ) : colors.symbol === "heart" ? (
                    <Heart className="w-5 h-5 text-amber-300 fill-amber-300 drop-shadow group-hover:scale-110 transition-transform" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-amber-300">
                      <Sparkles className="w-5 h-5 fill-amber-300 drop-shadow group-hover:scale-110 transition-transform" />
                    </div>
                  )}
                </div>
              </div>
            </button>
          </div>

        </div>

        {/* 3. Interactive Call to Action Hint below envelope */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-black/50 hover:bg-black/70 text-amber-200 border border-amber-400/50 backdrop-blur-md shadow-xl text-xs font-semibold tracking-wide transition-all hover:scale-105 active:scale-95 cursor-pointer animate-bounce"
          >
            <span>💌</span>
            <span>Chạm vào con dấu để mở thiệp</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          </button>
        </div>
      </div>
    </div>
  );
}
