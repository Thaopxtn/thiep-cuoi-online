"use client";

import React, { useEffect, useRef, useState } from "react";
import { AmbientEffectType, EffectConfig } from "@/lib/effectsCatalog";

export type { AmbientEffectType };

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
  type?: string;
  wingFlap?: number;
  wingSpeed?: number;
  burstAge?: number;
  burstMaxAge?: number;
  trailLength?: number;
}

interface FallingPetalsProps {
  density?: number;
  speed?: number;
  size?: number;
  opacity?: number;
  direction?: "down" | "up" | "wind-left" | "wind-right";
  active?: boolean;
  effectType?: AmbientEffectType;
  className?: string;
  isContainerRelative?: boolean;
}

export default function FallingPetals({
  density = 28,
  speed = 1.0,
  size = 1.0,
  opacity = 0.85,
  direction,
  active = true,
  effectType = "petals",
  className,
  isContainerRelative = false,
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
    const parent = isContainerRelative ? canvas.parentElement : null;
    let width = (canvas.width = parent ? parent.clientWidth : window.innerWidth);
    let height = (canvas.height = parent ? parent.clientHeight : window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      const currentParent = isContainerRelative ? canvas.parentElement : null;
      width = canvas.width = currentParent ? currentParent.clientWidth : window.innerWidth;
      height = canvas.height = currentParent ? currentParent.clientHeight : window.innerHeight;
    };

    let resizeObserver: ResizeObserver | null = null;
    if (isContainerRelative && parent && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => handleResize());
      resizeObserver.observe(parent);
    }
    window.addEventListener("resize", handleResize);

    // Color palettes
    const roseColors = [
      "rgba(244, 63, 94, 0.85)",   // Rose
      "rgba(225, 29, 72, 0.9)",    // Crimson
      "rgba(190, 18, 60, 0.85)",   // Dark rose
      "rgba(251, 113, 133, 0.8)",  // Soft rose
      "rgba(254, 205, 211, 0.9)",  // Blush
    ];

    const cherryColors = [
      "rgba(251, 113, 133, 0.85)", // Sakura pink
      "rgba(253, 164, 175, 0.85)", // Light petal
      "rgba(254, 205, 211, 0.9)",  // Soft blush
      "rgba(255, 228, 230, 0.95)", // Pale cherry
      "rgba(244, 114, 182, 0.75)", // Pink violet
    ];

    const heartColors = [
      "rgba(244, 63, 94, 0.85)",   // Rose red
      "rgba(239, 68, 68, 0.9)",    // Warm red
      "rgba(236, 72, 153, 0.85)",  // Magenta pink
      "rgba(251, 113, 133, 0.8)",  // Coral pink
      "rgba(244, 114, 182, 0.85)", // Sweet pink
    ];

    const sparkleColors = [
      "rgba(250, 204, 21, 0.95)",  // Gold
      "rgba(253, 224, 71, 0.9)",   // Bright gold
      "rgba(245, 158, 11, 0.85)",  // Amber gold
      "rgba(255, 255, 255, 0.98)", // Pure brilliance
      "rgba(254, 240, 138, 0.9)",  // Champagne
    ];

    const confettiColors = [
      "rgba(239, 68, 68, 0.9)",    // Red
      "rgba(245, 158, 11, 0.9)",   // Gold
      "rgba(236, 72, 153, 0.9)",   // Pink
      "rgba(139, 92, 246, 0.9)",   // Purple
      "rgba(16, 185, 129, 0.9)",   // Emerald
      "rgba(59, 130, 246, 0.9)",   // Blue
      "rgba(255, 255, 255, 0.95)", // White
    ];

    const leafColors = [
      "rgba(217, 119, 6, 0.85)",   // Amber
      "rgba(180, 83, 9, 0.85)",    // Brown orange
      "rgba(234, 88, 12, 0.85)",   // Deep orange
      "rgba(194, 65, 12, 0.85)",   // Rust
      "rgba(202, 138, 4, 0.8)",    // Golden yellow
    ];

    const butterflyColors = [
      "rgba(236, 72, 153, 0.9)",   // Pink
      "rgba(168, 85, 247, 0.9)",   // Purple
      "rgba(59, 130, 246, 0.85)",  // Blue
      "rgba(245, 158, 11, 0.9)",   // Amber
    ];

    // Determine default direction based on effect type if not explicitly set
    const effectiveDirection =
      direction ||
      (effectType === "hearts" || effectType === "bubbles" || effectType === "lanterns"
        ? "up"
        : effectType === "stars"
        ? "wind-left"
        : effectType === "petals_cherry" || effectType === "leaves" || effectType === "butterflies"
        ? "wind-right"
        : "down");

    const isMobile = width < 640;
    const sizeMultiplier = size * (isMobile ? 0.85 : 1.0);
    const speedMultiplier = speed;

    const createParticle = (startY?: number): Particle => {
      // Base coordinates
      let x = Math.random() * width;
      let y = startY !== undefined ? startY : Math.random() * height - height;

      if (effectiveDirection === "up") {
        y = startY !== undefined ? startY : height + Math.random() * 50;
      }

      // Base speeds calculated from direction
      let baseSpeedY = Math.random() * 1.2 + 0.7;
      let baseSpeedX = (Math.random() - 0.5) * 0.5;

      if (effectiveDirection === "up") {
        baseSpeedY = -(Math.random() * 1.1 + 0.6);
        baseSpeedX = (Math.random() - 0.5) * 0.6;
      } else if (effectiveDirection === "wind-right") {
        baseSpeedY = Math.random() * 0.9 + 0.6;
        baseSpeedX = Math.random() * 1.5 + 0.8;
      } else if (effectiveDirection === "wind-left") {
        baseSpeedY = Math.random() * 0.9 + 0.6;
        baseSpeedX = -(Math.random() * 1.6 + 0.9);
      }

      // 1. CHERRY PETALS
      if (effectType === "petals_cherry") {
        return {
          x,
          y,
          size: (Math.random() * 6 + 8) * sizeMultiplier,
          speedY: (baseSpeedY * 0.9) * speedMultiplier,
          speedX: (baseSpeedX * 1.1) * speedMultiplier,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.025,
          flip: Math.random() * Math.PI,
          flipSpeed: Math.random() * 0.03 + 0.015,
          opacity: (Math.random() * 0.25 + 0.7) * opacity,
          color: cherryColors[Math.floor(Math.random() * cherryColors.length)],
          type: "petal_cherry",
        };
      }

      // 2. HEARTS
      if (effectType === "hearts") {
        return {
          x,
          y,
          size: (Math.random() * 8 + 10) * sizeMultiplier,
          speedY: -(Math.random() * 1.1 + 0.6) * speedMultiplier,
          speedX: (Math.random() - 0.5) * 0.6 * speedMultiplier,
          rotation: Math.random() * 0.6 - 0.3,
          rotationSpeed: (Math.random() - 0.5) * 0.015,
          flip: Math.random() * Math.PI,
          flipSpeed: Math.random() * 0.025 + 0.01,
          opacity: (Math.random() * 0.3 + 0.7) * opacity,
          color: heartColors[Math.floor(Math.random() * heartColors.length)],
          type: "heart",
        };
      }

      // 3. SPARKLES (GOLD STARS)
      if (effectType === "sparkles") {
        return {
          x,
          y,
          size: (Math.random() * 7 + 4) * sizeMultiplier,
          speedY: (Math.random() * 0.7 + 0.3) * speedMultiplier,
          speedX: (Math.random() - 0.5) * 0.4 * speedMultiplier,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.03,
          flip: 0,
          flipSpeed: 0,
          opacity: (Math.random() * 0.35 + 0.65) * opacity,
          color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.06 + 0.03,
          type: "sparkle",
        };
      }

      // 4. SNOW
      if (effectType === "snow") {
        return {
          x,
          y,
          size: (Math.random() * 4 + 3) * sizeMultiplier,
          speedY: (Math.random() * 0.8 + 0.5) * speedMultiplier,
          speedX: (Math.random() - 0.5) * 0.4 * speedMultiplier,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.015,
          flip: 0,
          flipSpeed: 0,
          opacity: (Math.random() * 0.3 + 0.7) * opacity,
          color: "rgba(255, 255, 255, 0.95)",
          type: "snow",
        };
      }

      // 5. CONFETTI
      if (effectType === "confetti") {
        return {
          x,
          y,
          size: (Math.random() * 7 + 6) * sizeMultiplier,
          speedY: (Math.random() * 1.8 + 1.2) * speedMultiplier,
          speedX: (Math.random() - 0.5) * 1.2 * speedMultiplier,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.07,
          flip: Math.random() * Math.PI,
          flipSpeed: Math.random() * 0.06 + 0.03,
          opacity: (Math.random() * 0.25 + 0.75) * opacity,
          color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
          type: "confetti",
        };
      }

      // 6. FIREWORKS
      if (effectType === "fireworks") {
        return {
          x: Math.random() * (width - 100) + 50,
          y: Math.random() * (height * 0.6) + 40,
          size: (Math.random() * 16 + 24) * sizeMultiplier,
          speedY: (Math.random() * 0.3 - 0.15) * speedMultiplier,
          speedX: (Math.random() * 0.3 - 0.15) * speedMultiplier,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.02,
          flip: 0,
          flipSpeed: 0,
          opacity: 0.95 * opacity,
          color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
          burstAge: 0,
          burstMaxAge: Math.random() * 40 + 35,
          type: "firework",
        };
      }

      // 7. BUTTERFLIES
      if (effectType === "butterflies") {
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          size: (Math.random() * 5 + 10) * sizeMultiplier,
          speedY: (Math.random() * 0.6 - 0.3) * speedMultiplier,
          speedX: (Math.random() * 0.9 + 0.4) * speedMultiplier,
          rotation: (Math.random() - 0.5) * 0.4,
          rotationSpeed: (Math.random() - 0.5) * 0.02,
          flip: 0,
          flipSpeed: 0,
          wingFlap: Math.random() * Math.PI,
          wingSpeed: Math.random() * 0.15 + 0.12,
          opacity: 0.9 * opacity,
          color: butterflyColors[Math.floor(Math.random() * butterflyColors.length)],
          type: "butterfly",
        };
      }

      // 8. BUBBLES
      if (effectType === "bubbles") {
        return {
          x,
          y: startY !== undefined ? startY : height + Math.random() * 40,
          size: (Math.random() * 12 + 8) * sizeMultiplier,
          speedY: -(Math.random() * 0.9 + 0.5) * speedMultiplier,
          speedX: (Math.random() - 0.5) * 0.6 * speedMultiplier,
          rotation: 0,
          rotationSpeed: 0,
          flip: 0,
          flipSpeed: 0,
          opacity: (Math.random() * 0.25 + 0.65) * opacity,
          color: "rgba(255, 255, 255, 0.8)",
          pulse: Math.random() * Math.PI,
          pulseSpeed: Math.random() * 0.03 + 0.015,
          type: "bubble",
        };
      }

      // 9. LEAVES (AUTUMN)
      if (effectType === "leaves") {
        return {
          x,
          y,
          size: (Math.random() * 8 + 10) * sizeMultiplier,
          speedY: (Math.random() * 1.0 + 0.6) * speedMultiplier,
          speedX: (Math.random() * 0.8 + 0.3) * speedMultiplier,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.03,
          flip: Math.random() * Math.PI,
          flipSpeed: Math.random() * 0.04 + 0.02,
          opacity: (Math.random() * 0.3 + 0.7) * opacity,
          color: leafColors[Math.floor(Math.random() * leafColors.length)],
          type: "leaf",
        };
      }

      // 10. STARS (METEORS)
      if (effectType === "stars") {
        return {
          x: Math.random() * width + 80,
          y: Math.random() * (height * 0.6) - 50,
          size: (Math.random() * 3 + 2) * sizeMultiplier,
          speedY: (Math.random() * 2.5 + 2.0) * speedMultiplier,
          speedX: -(Math.random() * 3.5 + 2.8) * speedMultiplier,
          rotation: -Math.PI / 4,
          rotationSpeed: 0,
          flip: 0,
          flipSpeed: 0,
          opacity: (Math.random() * 0.3 + 0.7) * opacity,
          color: "rgba(255, 255, 255, 0.95)",
          trailLength: Math.random() * 40 + 35,
          type: "shooting_star",
        };
      }

      // 11. LANTERNS
      if (effectType === "lanterns") {
        return {
          x,
          y: startY !== undefined ? startY : height + Math.random() * 60,
          size: (Math.random() * 10 + 14) * sizeMultiplier,
          speedY: -(Math.random() * 0.7 + 0.4) * speedMultiplier,
          speedX: (Math.random() - 0.5) * 0.3 * speedMultiplier,
          rotation: (Math.random() - 0.5) * 0.1,
          rotationSpeed: (Math.random() - 0.5) * 0.005,
          flip: 0,
          flipSpeed: 0,
          opacity: (Math.random() * 0.2 + 0.8) * opacity,
          color: "rgba(239, 68, 68, 0.9)",
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.03,
          type: "lantern",
        };
      }

      // 12. FEATHERS
      if (effectType === "feathers") {
        return {
          x,
          y,
          size: (Math.random() * 8 + 12) * sizeMultiplier,
          speedY: (Math.random() * 0.8 + 0.4) * speedMultiplier,
          speedX: (Math.random() - 0.5) * 0.7 * speedMultiplier,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.02,
          flip: Math.random() * Math.PI,
          flipSpeed: Math.random() * 0.025 + 0.015,
          opacity: (Math.random() * 0.25 + 0.75) * opacity,
          color: "rgba(255, 255, 255, 0.95)",
          type: "feather",
        };
      }

      // 13. FIREFLIES
      if (effectType === "fireflies") {
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          size: (Math.random() * 3 + 3) * sizeMultiplier,
          speedY: (Math.random() * 0.6 - 0.3) * speedMultiplier,
          speedX: (Math.random() * 0.6 - 0.3) * speedMultiplier,
          rotation: 0,
          rotationSpeed: 0,
          flip: 0,
          flipSpeed: 0,
          opacity: (Math.random() * 0.3 + 0.7) * opacity,
          color: "rgba(234, 179, 8, 0.95)",
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.05 + 0.025,
          type: "firefly",
        };
      }

      // 14. DEFAULT: ROSE PETALS
      return {
        x,
        y,
        size: (Math.random() * 6 + 9) * sizeMultiplier,
        speedY: (baseSpeedY * 1.1) * speedMultiplier,
        speedX: (baseSpeedX * 1.0) * speedMultiplier,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        flip: Math.random() * Math.PI,
        flipSpeed: Math.random() * 0.03 + 0.015,
        opacity: (Math.random() * 0.25 + 0.75) * opacity,
        color: roseColors[Math.floor(Math.random() * roseColors.length)],
        type: "petal_rose",
      };
    };

    // Calculate count
    const baseCount = Math.round(density * (isMobile ? 0.75 : 1.0));
    const particles: Particle[] = [];
    for (let i = 0; i < baseCount; i++) {
      particles.push(createParticle(Math.random() * height));
    }

    // DRAW FUNCTIONS
    const drawPetalRose = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(Math.cos(p.flip), 1);

      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.bezierCurveTo(p.size * 0.85, -p.size * 0.6, p.size * 0.95, p.size * 0.45, 0, p.size);
      ctx.bezierCurveTo(-p.size * 0.95, p.size * 0.45, -p.size * 0.85, -p.size * 0.6, 0, -p.size);

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.shadowColor = "rgba(180, 20, 40, 0.2)";
      ctx.shadowBlur = 4;
      ctx.fill();

      // Highlight crease
      ctx.beginPath();
      ctx.moveTo(0, -p.size * 0.75);
      ctx.quadraticCurveTo(p.size * 0.1, 0, 0, p.size * 0.75);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    };

    const drawPetalCherry = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(Math.cos(p.flip), 1);

      const s = p.size;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * 0.7, -s * 0.7, s * 0.8, s * 0.5, 0, s * 0.8);
      ctx.bezierCurveTo(-s * 0.8, s * 0.5, -s * 0.7, -s * 0.7, 0, -s);

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fill();

      ctx.restore();
    };

    const drawHeart = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(Math.cos(p.flip) * 0.35 + 0.65, 1);

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
      ctx.shadowColor = "rgba(251, 191, 36, 0.6)";
      ctx.shadowBlur = 7;
      ctx.fill();

      // Bright center
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.22, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      ctx.restore();
    };

    const drawSnow = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.shadowColor = "rgba(255, 255, 255, 0.6)";
      ctx.shadowBlur = 4;
      ctx.fill();

      ctx.restore();
    };

    const drawConfetti = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(Math.cos(p.flip), Math.sin(p.flip));

      const w = p.size;
      const h = p.size * 0.55;

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fillRect(-w / 2, -h / 2, w, h);

      ctx.restore();
    };

    const drawBubble = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);

      const r = p.size;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);

      const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.7)");
      grad.addColorStop(0.6, "rgba(236, 72, 153, 0.2)");
      grad.addColorStop(0.85, "rgba(59, 130, 246, 0.35)");
      grad.addColorStop(1, "rgba(255, 255, 255, 0.8)");

      ctx.fillStyle = grad;
      ctx.globalAlpha = p.opacity;
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Specular highlight
      ctx.beginPath();
      ctx.arc(-r * 0.35, -r * 0.35, r * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.fill();

      ctx.restore();
    };

    const drawButterfly = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      const flap = p.wingFlap ? Math.cos(p.wingFlap) : 1;
      const s = p.size;

      // Left wing
      ctx.save();
      ctx.scale(flap, 1);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-s * 0.8, -s * 0.9, -s * 1.3, -s * 0.2, 0, s * 0.6);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fill();
      ctx.restore();

      // Right wing
      ctx.save();
      ctx.scale(-flap, 1);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-s * 0.8, -s * 0.9, -s * 1.3, -s * 0.2, 0, s * 0.6);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fill();
      ctx.restore();

      // Body
      ctx.beginPath();
      ctx.ellipse(0, 0, 1.5, s * 0.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#333333";
      ctx.fill();

      ctx.restore();
    };

    const drawLeaf = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(Math.cos(p.flip), 1);

      const s = p.size;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(s * 0.8, -s * 0.2, s * 0.3, s * 0.7);
      ctx.lineTo(0, s);
      ctx.lineTo(-s * 0.3, s * 0.7);
      ctx.quadraticCurveTo(-s * 0.8, -s * 0.2, 0, -s);

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fill();

      // Stem
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.8);
      ctx.lineTo(0, s * 1.1);
      ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    };

    const drawShootingStar = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      const len = p.trailLength || 40;
      const grad = ctx.createLinearGradient(0, 0, len, 0);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      grad.addColorStop(0.3, "rgba(56, 189, 248, 0.6)");
      grad.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(len, 0);
      ctx.strokeStyle = grad;
      ctx.lineWidth = p.size;
      ctx.lineCap = "round";
      ctx.stroke();

      // Bright head
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 1.4, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 8;
      ctx.fill();

      ctx.restore();
    };

    const drawLantern = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      const s = p.size;
      // Lantern glow
      ctx.beginPath();
      ctx.arc(0, 0, s * 1.3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(251, 146, 60, 0.25)";
      ctx.fill();

      // Lantern body
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.7, s, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(239, 68, 68, 0.9)";
      ctx.globalAlpha = p.opacity;
      ctx.fill();

      // Top and bottom rims
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(-s * 0.4, -s - 2, s * 0.8, 3);
      ctx.fillRect(-s * 0.4, s - 1, s * 0.8, 3);

      // Tassel
      ctx.beginPath();
      ctx.moveTo(0, s + 2);
      ctx.lineTo(0, s + 8);
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    };

    const drawFeather = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(Math.cos(p.flip), 1);

      const s = p.size;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(s * 0.4, -s * 0.3, s * 0.2, s * 0.8);
      ctx.quadraticCurveTo(0, s, 0, s * 1.1);
      ctx.quadraticCurveTo(0, s, -s * 0.2, s * 0.8);
      ctx.quadraticCurveTo(-s * 0.4, -s * 0.3, 0, -s);

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fill();

      // Quill line
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.9);
      ctx.lineTo(0, s * 1.15);
      ctx.strokeStyle = "rgba(220, 220, 220, 0.6)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    };

    const drawFirefly = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);

      const pulseFactor = p.pulse ? (Math.sin(p.pulse) + 1.2) * 0.5 : 1;
      const r = p.size * pulseFactor;

      // Glow halo
      ctx.beginPath();
      ctx.arc(0, 0, r * 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(250, 204, 21, 0.3)";
      ctx.globalAlpha = p.opacity * pulseFactor;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(234, 179, 8, 0.95)";
      ctx.fill();

      ctx.restore();
    };

    const drawFirework = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);

      const age = p.burstAge || 0;
      const maxAge = p.burstMaxAge || 40;
      const progress = age / maxAge;
      const radius = p.size * progress;
      const numSparks = 12;

      ctx.globalAlpha = Math.max(0, 1 - progress) * p.opacity;

      for (let j = 0; j < numSparks; j++) {
        const angle = (j / numSparks) * Math.PI * 2;
        const sparkX = Math.cos(angle) * radius;
        const sparkY = Math.sin(angle) * radius;

        ctx.beginPath();
        ctx.arc(sparkX, sparkY, 2, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fill();
      }

      ctx.restore();
    };

    let windTick = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      windTick += 0.015;
      const windForce = Math.sin(windTick) * 0.7;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 1. Position update
        p.y += p.speedY;
        p.x += p.speedX;

        // Custom wind & oscillation
        if (p.type === "heart" || p.type === "bubble" || p.type === "lantern") {
          p.x += Math.sin(windTick * 2 + i) * 0.5;
        } else if (p.type === "butterfly") {
          p.x += Math.cos(windTick * 1.5 + i) * 0.8;
          p.y += Math.sin(windTick * 2 + i) * 0.6;
          if (p.wingFlap !== undefined && p.wingSpeed) p.wingFlap += p.wingSpeed;
        } else if (p.type === "firefly") {
          p.x += Math.sin(windTick * 3 + i) * 0.7;
          p.y += Math.cos(windTick * 2.5 + i) * 0.7;
          if (p.pulse !== undefined && p.pulseSpeed) p.pulse += p.pulseSpeed;
        } else if (p.type === "sparkle") {
          p.x += windForce * 0.2;
          if (p.pulse !== undefined && p.pulseSpeed) p.pulse += p.pulseSpeed;
        } else if (p.type === "firework") {
          if (p.burstAge !== undefined) p.burstAge += 1;
        } else {
          p.x += windForce * 0.4;
        }

        p.rotation += p.rotationSpeed;
        p.flip += p.flipSpeed;

        // 2. Bounds check & respawn
        let respawn = false;

        if (p.type === "firework") {
          if (p.burstAge !== undefined && p.burstMaxAge && p.burstAge >= p.burstMaxAge) {
            respawn = true;
          }
        } else if (effectiveDirection === "up") {
          if (p.y < -50 || p.x < -60 || p.x > width + 60) respawn = true;
        } else if (effectiveDirection === "wind-left") {
          if (p.x < -100 || p.y > height + 60) respawn = true;
        } else if (effectiveDirection === "wind-right") {
          if (p.x > width + 100 || p.y > height + 60) respawn = true;
        } else {
          if (p.y > height + 50 || p.x < -60 || p.x > width + 60) respawn = true;
        }

        if (respawn) {
          particles[i] = createParticle(
            effectiveDirection === "up" ? height + 20 : -30
          );
        }

        // 3. Render specific particle
        switch (p.type) {
          case "petal_cherry":
            drawPetalCherry(p);
            break;
          case "heart":
            drawHeart(p);
            break;
          case "sparkle":
            drawSparkle(p);
            break;
          case "snow":
            drawSnow(p);
            break;
          case "confetti":
            drawConfetti(p);
            break;
          case "bubble":
            drawBubble(p);
            break;
          case "butterfly":
            drawButterfly(p);
            break;
          case "leaf":
            drawLeaf(p);
            break;
          case "shooting_star":
            drawShootingStar(p);
            break;
          case "lantern":
            drawLantern(p);
            break;
          case "feather":
            drawFeather(p);
            break;
          case "firefly":
            drawFirefly(p);
            break;
          case "firework":
            drawFirework(p);
            break;
          default:
            drawPetalRose(p);
            break;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [isEnabled, density, speed, size, opacity, direction, effectType, isContainerRelative]);

  if (!isEnabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className={
        className ||
        (isContainerRelative
          ? "absolute inset-0 pointer-events-none z-20 select-none overflow-hidden"
          : "fixed inset-0 pointer-events-none z-30 select-none overflow-hidden")
      }
      aria-hidden="true"
    />
  );
}
