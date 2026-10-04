"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause } from "lucide-react";

interface AutoScrollControllerProps {
  containerRef?: React.RefObject<HTMLElement>;
  enabled?: boolean;
  speed?: number; // Pixels per frame (~ 0.8)
  initialDelay?: number;
}

export default function AutoScrollController({
  containerRef,
  enabled = true,
  speed = 0.8,
  initialDelay = 2000,
}: AutoScrollControllerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const timer = setTimeout(() => {
      setIsPlaying(true);
    }, initialDelay);

    return () => clearTimeout(timer);
  }, [enabled, initialDelay]);

  useEffect(() => {
    if (!isPlaying) {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      return;
    }

    const targetEl = containerRef?.current || window;

    const scrollStep = () => {
      if (targetEl === window) {
        window.scrollBy(0, speed);
        // If reached bottom, stop
        if (
          window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 5
        ) {
          setIsPlaying(false);
          return;
        }
      } else if (containerRef?.current) {
        const el = containerRef.current;
        el.scrollTop += speed;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 5) {
          setIsPlaying(false);
          return;
        }
      }
      animFrameId.current = requestAnimationFrame(scrollStep);
    };

    animFrameId.current = requestAnimationFrame(scrollStep);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [isPlaying, speed, containerRef]);

  // Pause on manual user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      // Don't auto pause permanently, but allow user to control
    };

    window.addEventListener("wheel", handleUserInteraction, { passive: true });
    window.addEventListener("touchstart", handleUserInteraction, { passive: true });

    return () => {
      window.removeEventListener("wheel", handleUserInteraction);
      window.removeEventListener("touchstart", handleUserInteraction);
    };
  }, []);

  return (
    <div className="fixed bottom-20 left-4 z-40">
      <button
        type="button"
        onClick={() => setIsPlaying(!isPlaying)}
        className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-md shadow-lg border border-black/5 flex items-center justify-center text-stone-700 hover:scale-110 active:scale-95 transition-all duration-200"
        title={isPlaying ? "Tạm dừng tự động cuộn" : "Tự động cuộn trang"}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>
    </div>
  );
}
