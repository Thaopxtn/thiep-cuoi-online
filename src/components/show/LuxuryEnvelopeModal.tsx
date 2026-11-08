"use client";

import React, { useState, useEffect, useRef } from "react";
import { Heart, Sparkles, Crown } from "lucide-react";
import { weddingSounds } from "@/lib/soundEffects";

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
  theme?: "cream" | "burgundy" | "traditional" | "emerald" | "midnight" | "blush" | string;
  customSealSymbol?: "囍" | "heart" | "crown" | "sparkle" | "monogram" | string;
}

interface BurstParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  decay: number;
  rotation: number;
  vRot: number;
  isStar: boolean;
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
  customSealSymbol,
}: LuxuryEnvelopeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const burstCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Palettes config
  const isTraditional = theme === "traditional";
  const isBurgundy = theme === "burgundy";
  const isEmerald = theme === "emerald";
  const isMidnight = theme === "midnight";
  const isBlush = theme === "blush";

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
    : isEmerald
    ? {
        envelopeBg: "from-[#062c22] via-[#0b3d30] to-[#041f18]",
        pocketGradientStart: "#0e4b3c",
        pocketGradientEnd: "#072a21",
        flapGradientStart: "#125847",
        flapGradientEnd: "#0a362b",
        goldStroke: "#dfb76c",
        ribbonBg: "from-[#0b3d30] via-[#145343] to-[#072a21]",
        ribbonBorder: "#dfb76c",
        ribbonTail: "from-[#145343] to-[#062c22]",
        tagBg: "bg-[#f4faf7]",
        tagText: "text-[#0b3d30]",
        tagBorder: "border-[#c9a859]",
        sealOuter: "from-[#dfb76c] via-[#b99144] to-[#866322]",
        sealInner: "from-[#0b3d30] via-[#134e3f] to-[#062c22]",
        sealText: "text-[#ffd700]",
        symbol: "crown",
      }
    : isMidnight
    ? {
        envelopeBg: "from-[#0d1527] via-[#15223e] to-[#080d19]",
        pocketGradientStart: "#1c2b4e",
        pocketGradientEnd: "#0f182c",
        flapGradientStart: "#233662",
        flapGradientEnd: "#131f38",
        goldStroke: "#e2d5b8",
        ribbonBg: "from-[#15223e] via-[#20335c] to-[#0e1628]",
        ribbonBorder: "#e2d5b8",
        ribbonTail: "from-[#20335c] to-[#0d1527]",
        tagBg: "bg-[#f8f9fc]",
        tagText: "text-[#15223e]",
        tagBorder: "border-[#c4b595]",
        sealOuter: "from-[#e2d5b8] via-[#bfb090] to-[#8d7e5d]",
        sealInner: "from-[#15223e] via-[#1f3056] to-[#0d1527]",
        sealText: "text-[#fbf5e6]",
        symbol: "sparkle",
      }
    : isBlush
    ? {
        envelopeBg: "from-[#572733] via-[#6f3241] to-[#421d27]",
        pocketGradientStart: "#7f3b4c",
        pocketGradientEnd: "#522430",
        flapGradientStart: "#924558",
        flapGradientEnd: "#612a38",
        goldStroke: "#f1cbb5",
        ribbonBg: "from-[#6f3241] via-[#873e50] to-[#4d212c]",
        ribbonBorder: "#f1cbb5",
        ribbonTail: "from-[#873e50] to-[#421d27]",
        tagBg: "bg-[#fff7f8]",
        tagText: "text-[#572733]",
        tagBorder: "border-[#e5a88c]",
        sealOuter: "from-[#e5a88c] via-[#cb8c70] to-[#995e46]",
        sealInner: "from-[#6f3241] via-[#843c4e] to-[#4b202a]",
        sealText: "text-[#ffded1]",
        symbol: "heart",
      }
    : {
        // Cream / Champagne default
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

  const activeSymbol = customSealSymbol || colors.symbol;

  // Extract monogram initial from guest name
  const getGuestInitial = (name?: string): string | null => {
    if (!name) return null;
    let clean = name.trim();
    if (!clean) return null;
    clean = clean.replace(/\b(vip|pro|plus|\(vip\)|\(pro\))\b/gi, "").trim();
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length === 0) return name.trim()[0]?.toUpperCase() || null;
    const prefixes = /^(anh|chị|chi|em|bạn|ban|bác|bac|chú|chu|cô|co|dì|di|gia\s*đình|gđ|gd|mr|ms|mrs)$/i;
    const meaningfulWords = words.filter((w, i) => (i === 0 && words.length > 1 ? !prefixes.test(w) : true));
    const targetWord = meaningfulWords[meaningfulWords.length - 1] || words[words.length - 1];
    const initial = targetWord ? targetWord[0].toUpperCase() : null;
    return initial && /^[A-ZÀ-Ỹ0-9]$/i.test(initial) ? initial : null;
  };
  const guestInitial = getGuestInitial(guestName);

  // 3D Parallax Tilt (Gyroscope on mobile)
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return;
      const yTilt = Math.max(-10, Math.min(10, e.gamma / 3));
      const xTilt = Math.max(-8, Math.min(8, (e.beta - 45) / 4));
      setTilt({ x: -xTilt, y: yTilt });
    };

    if (typeof window !== "undefined" && window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", handleOrientation, true);
    }
    return () => {
      if (typeof window !== "undefined" && window.DeviceOrientationEvent) {
        window.removeEventListener("deviceorientation", handleOrientation);
      }
    };
  }, []);

  // 3D Mouse Parallax on desktop
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const normX = (e.clientX - centerX) / (rect.width / 2);
    const normY = (e.clientY - centerY) / (rect.height / 2);
    setTilt({
      x: -normY * 7,
      y: normX * 9,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  // Wax Seal Canvas Particle Burst
  const triggerWaxBurst = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpening) return;

    // Haptic vibration feedback
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate([40, 25, 55]);
      } catch {}
    }

    // Play synthesized envelope open sound
    weddingSounds.playEnvelopeOpen();

    // Canvas particle burst animation
    const canvas = burstCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const originX = rect.left + rect.width / 2;
        const originY = rect.top + rect.height / 2;

        const burstColors = ["#ffd700", "#fff3a8", "#ffc107", "#ffa000", "#ffffff", "#fce4ec"];
        const particles: BurstParticle[] = [];

        for (let i = 0; i < 48; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 3.5 + Math.random() * 7.5;
          particles.push({
            x: originX,
            y: originY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1.2,
            size: 2.5 + Math.random() * 4.5,
            alpha: 1.0,
            color: burstColors[Math.floor(Math.random() * burstColors.length)],
            decay: 0.018 + Math.random() * 0.02,
            rotation: Math.random() * Math.PI,
            vRot: (Math.random() - 0.5) * 0.2,
            isStar: Math.random() > 0.4,
          });
        }

        const renderBurst = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          let alive = 0;
          for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.18; // gravity
            p.rotation += p.vRot;
            p.alpha -= p.decay;

            if (p.alpha <= 0.01) continue;
            alive++;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.shadowColor = "#ffd700";
            ctx.shadowBlur = 8;

            if (p.isStar) {
              // 4-point gold star
              ctx.beginPath();
              ctx.moveTo(0, -p.size);
              ctx.lineTo(p.size * 0.35, -p.size * 0.35);
              ctx.lineTo(p.size, 0);
              ctx.lineTo(p.size * 0.35, p.size * 0.35);
              ctx.lineTo(0, p.size);
              ctx.lineTo(-p.size * 0.35, p.size * 0.35);
              ctx.lineTo(-p.size, 0);
              ctx.lineTo(-p.size * 0.35, -p.size * 0.35);
              ctx.closePath();
              ctx.fill();
            } else {
              ctx.beginPath();
              ctx.arc(0, 0, p.size, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          }

          if (alive > 0) {
            requestAnimationFrame(renderBurst);
          } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        };

        requestAnimationFrame(renderBurst);
      }
    }

    onOpen();
  };

  if (isOpen) return null;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-4 select-none transition-all duration-1000 ${
        isOpening
          ? "opacity-0 scale-[1.2] translate-y-[-4%] pointer-events-none"
          : "opacity-100 scale-100"
      }`}
    >
      {/* Canvas for full-screen particle burst */}
      <canvas ref={burstCanvasRef} className="fixed inset-0 pointer-events-none z-50 w-full h-full" />

      {/* 1. Cinematic Background with Anamorphic Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {coverImage ? (
          <img
            src={coverImage}
            alt="Wedding Cover"
            className="w-full h-full object-cover blur-md brightness-60 scale-110"
          />
        ) : (
          <div className="w-full h-full bg-[#170e10]" />
        )}

        {/* Soft Warm Radial Vignette */}
        <div className="absolute inset-0 bg-radial-[circle_at_center,rgba(0,0,0,0.2)_0%,rgba(0,0,0,0.85)_100%]" />

        {/* Atmospheric Bokeh shimmer dots */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffd700_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />

        {/* Cinematic horizontal lens flare beam */}
        <div className="absolute top-1/3 inset-x-0 h-48 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent blur-3xl pointer-events-none animate-pulse" />
      </div>

      {/* 2. Main 3D Envelope Scene Wrapper with Gyro/Mouse Tilt */}
      <div
        className="relative w-full max-w-[360px] perspective-envelope z-10 transition-transform duration-200 ease-out"
        style={{
          transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        <div className="relative w-full h-[240px] transform-style-3d drop-shadow-[0_30px_70px_rgba(0,0,0,0.7)]">
          {/* Dynamic Glare Light Sheet reacting to tilt */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none z-30 opacity-40 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle at ${50 + tilt.y * 3}% ${
                50 + tilt.x * 3
              }%, rgba(255, 255, 255, 0.35) 0%, transparent 60%)`,
            }}
          />

          {/* Layer A: Envelope Back Wall */}
          <div
            className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${colors.envelopeBg} border border-amber-400/30 overflow-hidden`}
          >
            {/* Inner artistic liner pattern */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:12px_12px]" />
          </div>

          {/* Layer B: The Sliding Invitation Letter Card */}
          <div
            className={`envelope-letter-slide absolute inset-x-4 top-4 bottom-4 bg-[#fffdfa] rounded-xl border border-amber-500/30 shadow-lg p-3 text-center flex flex-col justify-between z-10 transition-all duration-1000 ${
              isOpening ? "-translate-y-36 scale-[1.05] shadow-2xl" : "translate-y-0"
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

          {/* Layer C: Gapless Front Pocket */}
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

              <path
                d="M 0 16 L 175 75 Q 180 77 185 75 L 360 16 L 360 224 A 16 16 0 0 1 344 240 L 16 240 A 16 16 0 0 1 0 224 Z"
                fill="url(#pocketGrad)"
                stroke={colors.goldStroke}
                strokeWidth="1"
              />
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
              <div className="w-full h-px bg-amber-200/40" />

              {/* Guest Invitation Calligraphy Badge on Ribbon */}
              <div
                className={`absolute px-3.5 py-1 rounded-full ${colors.tagBg} ${colors.tagBorder} border shadow-md flex items-center gap-1.5`}
              >
                <Sparkles className="w-3 h-3 text-amber-500 animate-pulse shrink-0" />
                <span className={`text-[12px] font-bold font-cormorant font-serif ${colors.tagText}`}>
                  {guestName ? `Kính mời: ${guestName}` : "Trân trọng kính mời"}
                </span>
              </div>
            </div>
          </div>

          {/* Layer D: 3D Top Flap with Realistic Wax Seal */}
          <div
            className={`envelope-flap-3d envelope-flap-3d-smooth absolute top-0 inset-x-0 h-[145px] z-30 origin-top cursor-pointer ${
              isOpening ? "envelope-flap-3d-open" : ""
            }`}
            onClick={triggerWaxBurst}
          >
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
              onClick={triggerWaxBurst}
              className="absolute top-[96px] left-1/2 -translate-x-1/2 w-16 h-16 rounded-full cursor-pointer group z-40 transition-transform duration-300 hover:scale-110 active:scale-95"
              title="Chạm vào con dấu sáp để mở thiệp cưới"
            >
              {/* Interactive golden pulsating aura hint */}
              <div className="absolute -inset-2 rounded-full border-2 border-amber-300/70 animate-ping pointer-events-none opacity-40 -z-20" />
              <div className="absolute -inset-3 rounded-full bg-amber-400/20 blur-md pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity -z-20" />

              {/* Crossed Ribbon Tails hanging beneath the wax seal */}
              <div
                className={`absolute top-8 left-2 w-3 h-8 bg-gradient-to-b ${colors.ribbonTail} border-l border-amber-300/40 rotate-15 shadow-sm pointer-events-none -z-10`}
                style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)" }}
              />
              <div
                className={`absolute top-8 right-2 w-3 h-8 bg-gradient-to-b ${colors.ribbonTail} border-r border-amber-300/40 -rotate-15 shadow-sm pointer-events-none -z-10`}
                style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)" }}
              />

              {/* Outer Organic Wavy Wax Puddle with Shimmer */}
              <div
                className={`w-full h-full rounded-[48%_52%_49%_51%_/_53%_47%_52%_48%] bg-gradient-to-br ${colors.sealOuter} p-1 shadow-[0_8px_20px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.6)] flex items-center justify-center animate-wax-seal-glow border border-amber-200/60 relative overflow-hidden`}
              >
                {/* Shimmer light sweep across wax seal */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

                {/* Inner Wax Cavity with Engraved Monogram */}
                <div
                  className={`w-11 h-11 rounded-[47%_53%_50%_50%_/_52%_48%_53%_47%] bg-gradient-to-br ${colors.sealInner} border border-amber-300/50 flex items-center justify-center shadow-[inset_0_3px_6px_rgba(0,0,0,0.5)]`}
                >
                  {guestInitial && activeSymbol === "monogram" ? (
                    <span className="text-xl font-bold font-serif text-amber-200 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] tracking-tight">
                      {guestInitial}
                    </span>
                  ) : activeSymbol === "囍" ? (
                    <span className="text-2xl font-bold font-serif text-yellow-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      囍
                    </span>
                  ) : activeSymbol === "crown" ? (
                    <Crown className="w-5 h-5 text-amber-300 drop-shadow group-hover:scale-110 transition-transform" />
                  ) : activeSymbol === "heart" ? (
                    <Heart className="w-5 h-5 text-amber-300 fill-amber-300 drop-shadow group-hover:scale-110 transition-transform" />
                  ) : (
                    <Sparkles className="w-5 h-5 fill-amber-300 text-amber-300 drop-shadow group-hover:scale-110 transition-transform" />
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
            onClick={triggerWaxBurst}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/60 hover:bg-black/80 text-amber-200 border border-amber-400/50 backdrop-blur-md shadow-2xl text-xs font-semibold tracking-wide transition-all hover:scale-105 active:scale-95 cursor-pointer animate-bounce"
          >
            <span>💌</span>
            <span>Chạm vào con dấu sáp để mở thiệp</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
          </button>
        </div>
      </div>
    </div>
  );
}
