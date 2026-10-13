"use client";

import React, { useRef, useState, useEffect } from "react";

import { ANIMATION_KEYFRAME_MAP } from "@/lib/animationCatalog";

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
  | "rotate-in"
  | string;

const ANIMATION_MAP: Record<string, string> = {
  ...ANIMATION_KEYFRAME_MAP,
  "fade-in": "fadeIn",
  "slide-up": "slideInUp",
  "slide-down": "slideInDown",
  "slide-left": "fadeInLeft",
  "slide-right": "fadeInRight",
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
  exitEffectType?: string;
  effectDuration?: number;
  effectDelay?: number;
  effectEasing?: string;
  effectEnabled?: boolean;
  className?: string;
}

export default function ScrollAnimationWrapper({
  children,
  effectType = "scale-in",
  exitEffectType,
  effectDuration = 1.2,
  effectDelay = 0,
  effectEasing = "cubic-bezier(0.16, 1, 0.3, 1)",
  effectEnabled = true,
  className = "",
}: ScrollAnimationWrapperProps) {
  const domRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [hasEnteredOnce, setHasEnteredOnce] = useState(false);
  const [runCount, setRunCount] = useState(0);

  useEffect(() => {
    if (!effectEnabled) {
      setIsInView(true);
      return;
    }

    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsInView(true);
      setHasEnteredOnce(true);
      return;
    }

    const currentDom = domRef.current;
    if (!currentDom) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            setHasEnteredOnce(true);
            setRunCount((c) => c + 1);
          } else {
            setIsInView(false);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -20px 0px",
      }
    );

    observer.observe(currentDom);

    return () => {
      observer.disconnect();
    };
  }, [effectEnabled]);

  if (!effectEnabled) {
    return <div className={className}>{children}</div>;
  }

  const animName = ANIMATION_MAP[effectType] || "zoomIn";
  const exitAnimName = exitEffectType ? ANIMATION_MAP[exitEffectType] || exitEffectType : undefined;

  let style: React.CSSProperties = {
    width: "100%",
  };

  if (isInView) {
    style = {
      ...style,
      animationName: animName,
      animationDuration: `${effectDuration}s`,
      animationDelay: `${effectDelay}s`,
      animationTimingFunction: effectEasing,
      animationFillMode: "both",
    };
  } else if (!hasEnteredOnce) {
    style = {
      ...style,
      opacity: 0,
      pointerEvents: "none",
    };
  } else {
    // Scrolled past: exit animation or fade out
    if (exitAnimName && exitAnimName !== "none") {
      style = {
        ...style,
        animationName: exitAnimName,
        animationDuration: "0.55s",
        animationTimingFunction: "ease-in",
        animationFillMode: "both",
        pointerEvents: "none",
      };
    } else {
      style = {
        ...style,
        opacity: 0,
        transition: "opacity 0.4s ease-out",
        pointerEvents: "none",
      };
    }
  }

  return (
    <div
      ref={domRef}
      key={isInView ? `enter-${runCount}` : `exit-${runCount}`}
      style={style}
      className={className}
    >
      {children}
    </div>
  );
}
