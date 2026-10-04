"use client";

import React, { useRef, useState, useEffect } from "react";

export type TransitionEffect =
  | "scale-in"
  | "slide-up"
  | "slide-down"
  | "slide-left"
  | "slide-right"
  | "fade-in"
  | "bounce-in"
  | "flip-in"
  | "zoom-in"
  | "rotate-in";

const ANIMATION_MAP: Record<string, string> = {
  "fade-in": "fadeIn",
  "slide-up": "slideInUp",
  "slide-down": "slideInDown",
  "slide-left": "slideInRight",
  "slide-right": "slideInLeft",
  "scale-in": "zoomIn",
  "scale-out": "zoomIn",
  "rotate-in": "rotateIn",
  "rotate-out": "rotateIn",
  "bounce-in": "bounceIn",
  "flip-in": "flipInY",
  "zoom-in": "zoomIn",
};

interface ScrollAnimationWrapperProps {
  children: React.ReactNode;
  effectType?: TransitionEffect;
  effectDuration?: number;
  effectDelay?: number;
  effectEasing?: string;
  effectEnabled?: boolean;
  className?: string;
}

export default function ScrollAnimationWrapper({
  children,
  effectType = "scale-in",
  effectDuration = 1.2,
  effectDelay = 0,
  effectEasing = "cubic-bezier(0.16, 1, 0.3, 1)",
  effectEnabled = true,
  className = "",
}: ScrollAnimationWrapperProps) {
  const domRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!effectEnabled) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -30px 0px",
      }
    );

    const currentDom = domRef.current;
    if (currentDom) {
      observer.observe(currentDom);
    }

    return () => {
      if (currentDom) observer.unobserve(currentDom);
    };
  }, [effectEnabled]);

  if (!effectEnabled) {
    return <div className={className}>{children}</div>;
  }

  const animName = ANIMATION_MAP[effectType] || "zoomIn";

  const style: React.CSSProperties = isVisible
    ? {
        animationName: animName,
        animationDuration: `${effectDuration}s`,
        animationDelay: `${effectDelay}s`,
        animationTimingFunction: effectEasing,
        animationFillMode: "both",
        animationIterationCount: 1,
        width: "100%",
      }
    : {
        opacity: 0,
        width: "100%",
      };

  return (
    <div ref={domRef} style={style} className={className}>
      {children}
    </div>
  );
}
