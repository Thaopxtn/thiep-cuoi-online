"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

export interface CinematicEffectsConfig {
  enableTouchSparkles?: boolean;
  enableLightLeaks?: boolean;
  enableAmbientDust?: boolean;
  intensity?: "subtle" | "normal" | "vibrant";
  colorScheme?: "gold" | "rose" | "champagne" | "aurora";
}

interface SparkleParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
  rotation: number;
  vRot: number;
  color: string;
  isStar: boolean;
}

const PALETTES = {
  gold: [
    "rgba(255, 215, 0, ",
    "rgba(255, 236, 179, ",
    "rgba(255, 179, 0, ",
    "rgba(255, 255, 255, ",
    "rgba(218, 165, 32, ",
  ],
  rose: [
    "rgba(255, 182, 193, ",
    "rgba(255, 105, 180, ",
    "rgba(255, 228, 225, ",
    "rgba(255, 255, 255, ",
    "rgba(244, 63, 94, ",
  ],
  champagne: [
    "rgba(250, 240, 230, ",
    "rgba(245, 222, 179, ",
    "rgba(255, 255, 255, ",
    "rgba(212, 175, 55, ",
    "rgba(238, 232, 170, ",
  ],
  aurora: [
    "rgba(147, 197, 253, ",
    "rgba(196, 181, 253, ",
    "rgba(251, 207, 232, ",
    "rgba(255, 255, 255, ",
    "rgba(253, 224, 71, ",
  ],
};

export default function CinematicEffectsOverlay({
  enableTouchSparkles = true,
  enableLightLeaks = true,
  enableAmbientDust = true,
  intensity = "normal",
  colorScheme = "gold",
}: CinematicEffectsConfig) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<SparkleParticle[]>([]);
  const animFrameIdRef = useRef<number | null>(null);
  const lastEmitTimeRef = useRef<number>(0);
  const palette = PALETTES[colorScheme] || PALETTES.gold;

  // Particle creation helper
  const addSparkle = useCallback(
    (x: number, y: number, count = 3) => {
      if (!canvasRef.current) return;
      const particles = particlesRef.current;
      if (particles.length > 70) return; // Prevent excessive particle buildup

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.8 + Math.random() * 2.2;
        const baseColor = palette[Math.floor(Math.random() * palette.length)];
        const isStar = Math.random() > 0.45;

        particles.push({
          x: x + (Math.random() - 0.5) * 16,
          y: y + (Math.random() - 0.5) * 16,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.6, // Slight upward drift
          size: isStar ? 4 + Math.random() * 5 : 2 + Math.random() * 3.5,
          alpha: 0.95,
          decay: 0.016 + Math.random() * 0.024,
          rotation: Math.random() * Math.PI,
          vRot: (Math.random() - 0.5) * 0.15,
          color: baseColor,
          isStar,
        });
      }
    },
    [palette]
  );

  // Handle touch and pointer movements
  useEffect(() => {
    if (!enableTouchSparkles) return;

    const handlePointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastEmitTimeRef.current < 25) return; // Throttle to 40fps emission
      lastEmitTimeRef.current = now;
      addSparkle(e.clientX, e.clientY, 2);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const now = performance.now();
      if (now - lastEmitTimeRef.current < 25) return;
      lastEmitTimeRef.current = now;

      if (e.touches && e.touches[0]) {
        const touch = e.touches[0];
        addSparkle(touch.clientX, touch.clientY, 3);
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [enableTouchSparkles, addSparkle]);

  // Ambient floating stardust loop
  useEffect(() => {
    if (!enableAmbientDust) return;

    const interval = setInterval(() => {
      if (typeof window === "undefined" || !canvasRef.current) return;
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      addSparkle(x, y, 1);
    }, 450);

    return () => clearInterval(interval);
  }, [enableAmbientDust, addSparkle]);

  // Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const draw4PointStar = (
      c: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      spikes: number,
      outerRadius: number,
      innerRadius: number
    ) => {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      c.beginPath();
      c.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        c.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        c.lineTo(x, y);
        rot += step;
      }
      c.lineTo(cx, cy - outerRadius);
      c.closePath();
      c.fill();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02; // Soft gravity
        p.rotation += p.vRot;
        p.alpha -= p.decay;

        if (p.alpha <= 0.01) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = `${p.color}${p.alpha})`;

        if (p.isStar) {
          // Glow halo
          ctx.shadowBlur = 6;
          ctx.shadowColor = `${p.color}0.8)`;
          draw4PointStar(ctx, 0, 0, 4, p.size, p.size * 0.35);
        } else {
          // Circular fairy dust
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {/* 1. Cinematic Lens Flare & Anamorphic Light Leaks */}
      {enableLightLeaks && (
        <>
          {/* Top-Right Golden Anamorphic Glow */}
          <div
            className={`absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-br from-amber-300/18 via-yellow-400/10 to-transparent blur-3xl animate-pulse pointer-events-none mix-blend-screen ${
              intensity === "vibrant" ? "opacity-90" : intensity === "subtle" ? "opacity-35" : "opacity-60"
            }`}
            style={{ animationDuration: "8s" }}
          />
          {/* Top-Left Soft Champagne Vignette Sweep */}
          <div
            className={`absolute top-1/4 -left-36 w-80 h-80 rounded-full bg-gradient-to-tr from-rose-400/15 via-amber-200/10 to-transparent blur-3xl animate-pulse pointer-events-none mix-blend-screen ${
              intensity === "vibrant" ? "opacity-80" : intensity === "subtle" ? "opacity-30" : "opacity-50"
            }`}
            style={{ animationDuration: "11s" }}
          />
          {/* Subtle horizontal cinematic streak */}
          <div className="absolute top-12 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-300/25 to-transparent blur-[1px] pointer-events-none" />
        </>
      )}

      {/* 2. Particle Canvas (Touch Sparkle Trail & Stardust) */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
    </div>
  );
}
