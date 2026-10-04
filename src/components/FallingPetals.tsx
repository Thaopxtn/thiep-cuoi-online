"use client";

import React, { useEffect, useRef, useState } from "react";

interface Petal {
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
}

interface FallingPetalsProps {
  density?: number;
  active?: boolean;
}

export default function FallingPetals({
  density = 28,
  active = true,
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

    // Color palette for romantic rose petals & soft blossoms
    const petalColors = [
      "rgba(244, 63, 94, 0.75)",   // Rose
      "rgba(251, 113, 133, 0.8)",  // Pink
      "rgba(225, 29, 72, 0.7)",    // Crimson
      "rgba(254, 205, 211, 0.85)", // Blush
      "rgba(255, 228, 230, 0.9)",  // Light petal
      "rgba(244, 114, 182, 0.7)",  // Soft violet-pink
    ];

    const createPetal = (startY?: number): Petal => {
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
      };
    };

    const petals: Petal[] = [];
    for (let i = 0; i < density; i++) {
      // Distribute vertically on initial spawn
      petals.push(createPetal(Math.random() * height));
    }

    // Draw single realistic curved petal
    const drawPetal = (p: Petal) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(Math.cos(p.flip), 1); // 3D tumbling perspective flip

      ctx.beginPath();
      // Organic teardrop curved rose petal path
      ctx.moveTo(0, -p.size);
      ctx.bezierCurveTo(
        p.size * 0.8,
        -p.size * 0.6,
        p.size * 0.9,
        p.size * 0.4,
        0,
        p.size
      );
      ctx.bezierCurveTo(
        -p.size * 0.9,
        p.size * 0.4,
        -p.size * 0.8,
        -p.size * 0.6,
        0,
        -p.size
      );

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.shadowColor = "rgba(180, 20, 40, 0.15)";
      ctx.shadowBlur = 4;
      ctx.fill();

      // Delicate petal center crease highlight
      ctx.beginPath();
      ctx.moveTo(0, -p.size * 0.8);
      ctx.quadraticCurveTo(p.size * 0.1, 0, 0, p.size * 0.8);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    };

    let windTick = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      windTick += 0.012;
      const windForce = Math.sin(windTick) * 0.8;

      for (let i = 0; i < petals.length; i++) {
        const p = petals[i];
        p.y += p.speedY;
        p.x += p.speedX + windForce * 0.4;
        p.rotation += p.rotationSpeed;
        p.flip += p.flipSpeed;

        // Reset if offscreen
        if (p.y > height + 40 || p.x < -60 || p.x > width + 60) {
          petals[i] = createPetal(-20);
        }

        drawPetal(p);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isEnabled, density]);

  if (!isEnabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-30 select-none overflow-hidden"
      aria-hidden="true"
    />
  );
}
