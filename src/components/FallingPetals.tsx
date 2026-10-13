"use client";

import React, { useEffect, useRef, useState } from "react";

export type AmbientEffectType = "petals" | "sparkles" | "hearts" | "confetti";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotationSpeed: number;
  flip: number;
  flipSpeed: number;
  opacity: number;
  color: string;
  pulse?: number;
  pulseSpeed?: number;
  type?: "rect" | "heart" | "sparkle" | "petal";
}

interface FallingPetalsProps {
  density?: number;
  active?: boolean;
  effectType?: AmbientEffectType;
}

export default function FallingPetals({
  density = 28,
  active = true,
  effectType = "petals",
}: FallingPetalsProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isEnabled, setIsEnabled] = useState(active);

  useEffect(() => {
    setIsEnabled(active);
  }, [active]);

  useEffect(() => {
    if (!isEnabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Color palettes for different modes
    const petalColors = [
      "rgba(244, 63, 94, 0.75)",   // Rose
      "rgba(251, 113, 133, 0.8)",  // Pink
      "rgba(225, 29, 72, 0.7)",    // Crimson
      "rgba(254, 205, 211, 0.85)", // Blush
      "rgba(255, 228, 230, 0.9)",  // Light petal
      "rgba(244, 114, 182, 0.7)",  // Soft violet-pink
    ];

    const sparkleColors = [
      "rgba(250, 204, 21, 0.9)",   // Golden yellow
      "rgba(253, 224, 71, 0.85)",  // Bright gold
      "rgba(245, 158, 11, 0.75)",  // Amber gold
      "rgba(255, 255, 255, 0.95)", // Brilliant white sparkle
      "rgba(254, 240, 138, 0.8)",  // Champagne
    ];

    const heartColors = [
      "rgba(244, 63, 94, 0.8)",    // Rose
      "rgba(239, 68, 68, 0.85)",   // Warm red
      "rgba(244, 114, 182, 0.75)", // Pink
      "rgba(251, 113, 133, 0.8)",  // Coral pink
      "rgba(253, 164, 175, 0.9)",  // Blush
    ];

    const confettiColors = [
      "rgba(239, 68, 68, 0.85)",   // Red
      "rgba(245, 158, 11, 0.85)",  // Gold
      "rgba(236, 72, 153, 0.85)",  // Pink
      "rgba(139, 92, 246, 0.85)",  // Purple
      "rgba(16, 185, 129, 0.85)",  // Emerald
      "rgba(255, 255, 255, 0.9)",  // White
    ];

    const createParticle = (startY?: number): Particle => {
      if (effectType === "sparkles") {
        const size = Math.random() * 8 + 4; // 4px to 12px
        return {
          x: Math.random() * width,
          y: startY !== undefined ? startY : Math.random() * height - height,
          size,
          speedY: Math.random() * 0.8 + 0.3,
          speedX: (Math.random() - 0.5) * 0.4,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.03,
          flip: 0,
          flipSpeed: 0,
          opacity: Math.random() * 0.4 + 0.6,
          color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.06 + 0.03,
          type: "sparkle",
        };
      }

      if (effectType === "hearts") {
        const size = Math.random() * 10 + 8; // 8px to 18px
        return {
          x: Math.random() * width,
          y: startY !== undefined ? startY : height + Math.random() * 50, // Float UPWARDS or slow drift
          size,
          speedY: -(Math.random() * 1.0 + 0.6), // Floating upwards
          speedX: (Math.random() - 0.5) * 0.6,
          rotation: Math.random() * 0.6 - 0.3,
          rotationSpeed: (Math.random() - 0.5) * 0.015,
          flip: Math.random() * Math.PI,
          flipSpeed: Math.random() * 0.02 + 0.01,
          opacity: Math.random() * 0.35 + 0.65,
          color: heartColors[Math.floor(Math.random() * heartColors.length)],
          type: "heart",
        };
      }

      if (effectType === "confetti") {
        const size = Math.random() * 8 + 6; // 6px to 14px
        return {
          x: Math.random() * width,
          y: startY !== undefined ? startY : Math.random() * height - height,
          size,
          speedY: Math.random() * 2.2 + 1.2,
          speedX: (Math.random() - 0.5) * 1.5,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.08,
          flip: Math.random() * Math.PI,
          flipSpeed: Math.random() * 0.08 + 0.04,
          opacity: Math.random() * 0.3 + 0.7,
          color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
          type: "rect",
        };
      }

      // Default: rose petals
      const size = Math.random() * 12 + 10; // 10px to 22px
      return {
        x: Math.random() * width,
        y: startY !== undefined ? startY : Math.random() * height - height,
        size,
        speedY: Math.random() * 1.4 + 0.8,
        speedX: (Math.random() - 0.5) * 0.9,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        flip: Math.random() * Math.PI,
        flipSpeed: Math.random() * 0.03 + 0.015,
        opacity: Math.random() * 0.4 + 0.55,
        color: petalColors[Math.floor(Math.random() * petalColors.length)],
        type: "petal",
      };
    };

    const particles: Particle[] = [];
    const count = effectType === "sparkles" ? Math.round(density * 1.5) : density;
    for (let i = 0; i < count; i++) {
      particles.push(createParticle(Math.random() * height));
    }

    // Draw single realistic curved petal
    const drawPetal = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(Math.cos(p.flip), 1); // 3D tumbling perspective flip

      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.bezierCurveTo(p.size * 0.8, -p.size * 0.6, p.size * 0.9, p.size * 0.4, 0, p.size);
      ctx.bezierCurveTo(-p.size * 0.9, p.size * 0.4, -p.size * 0.8, -p.size * 0.6, 0, -p.size);

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.shadowColor = "rgba(180, 20, 40, 0.15)";
      ctx.shadowBlur = 4;
      ctx.fill();

      // Petal center crease highlight
      ctx.beginPath();
      ctx.moveTo(0, -p.size * 0.8);
      ctx.quadraticCurveTo(p.size * 0.1, 0, 0, p.size * 0.8);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    };

    // Draw 4-point gold sparkle star
    const drawSparkle = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      const pulseFactor = p.pulse ? (Math.sin(p.pulse) + 1.2) * 0.5 : 1;
      const s = p.size * pulseFactor;

      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(0, 0, s, 0);
      ctx.quadraticCurveTo(0, 0, 0, s);
      ctx.quadraticCurveTo(0, 0, -s, 0);
      ctx.quadraticCurveTo(0, 0, 0, -s);

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity * pulseFactor;
      ctx.shadowColor = "rgba(251, 191, 36, 0.5)";
      ctx.shadowBlur = 8;
      ctx.fill();

      // Center bright core
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.fill();

      ctx.restore();
    };

    // Draw cute romantic heart
    const drawHeart = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(Math.cos(p.flip) * 0.4 + 0.6, 1);

      const s = p.size;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.3);
      ctx.bezierCurveTo(-s * 0.5, -s * 0.4, -s, s * 0.1, 0, s);
      ctx.bezierCurveTo(s, s * 0.1, s * 0.5, -s * 0.4, 0, s * 0.3);

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.shadowColor = "rgba(244, 63, 94, 0.3)";
      ctx.shadowBlur = 5;
      ctx.fill();

      ctx.restore();
    };

    // Draw festive rectangular confetti piece
    const drawConfetti = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(Math.cos(p.flip), Math.sin(p.flip));

      const w = p.size;
      const h = p.size * 0.5;

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
      ctx.shadowBlur = 3;
      ctx.fillRect(-w / 2, -h / 2, w, h);

      ctx.restore();
    };

    let windTick = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      windTick += 0.012;
      const windForce = Math.sin(windTick) * 0.8;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (effectType === "hearts") {
          // Floating UP
          p.y += p.speedY;
          p.x += p.speedX + Math.sin(windTick * 2 + i) * 0.6;
          p.rotation += p.rotationSpeed;
          p.flip += p.flipSpeed;

          if (p.y < -40 || p.x < -40 || p.x > width + 40) {
            particles[i] = createParticle(height + 20);
          }
          drawHeart(p);
        } else if (effectType === "sparkles") {
          // Drifting down + pulsing
          p.y += p.speedY;
          p.x += p.speedX + windForce * 0.2;
          p.rotation += p.rotationSpeed;
          if (p.pulse !== undefined && p.pulseSpeed) p.pulse += p.pulseSpeed;

          if (p.y > height + 20 || p.x < -30 || p.x > width + 30) {
            particles[i] = createParticle(-15);
          }
          drawSparkle(p);
        } else if (effectType === "confetti") {
          // Tumble down fast
          p.y += p.speedY;
          p.x += p.speedX + windForce * 0.8;
          p.rotation += p.rotationSpeed;
          p.flip += p.flipSpeed;

          if (p.y > height + 30 || p.x < -40 || p.x > width + 40) {
            particles[i] = createParticle(-20);
          }
          drawConfetti(p);
        } else {
          // Rose petals
          p.y += p.speedY;
          p.x += p.speedX + windForce * 0.4;
          p.rotation += p.rotationSpeed;
          p.flip += p.flipSpeed;

          if (p.y > height + 40 || p.x < -60 || p.x > width + 60) {
            particles[i] = createParticle(-20);
          }
          drawPetal(p);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isEnabled, density, effectType]);

  if (!isEnabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-30 select-none overflow-hidden"
      aria-hidden="true"
    />
  );
}
