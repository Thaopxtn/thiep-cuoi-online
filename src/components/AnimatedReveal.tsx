"use client";

import React, { useEffect, useRef, useState } from "react";

interface AnimatedRevealProps {
  children: React.ReactNode;
  animation?: "fade-up" | "zoom-in" | "reveal" | "none";
  delay?: number; // ms
  className?: string;
  threshold?: number;
}

export default function AnimatedReveal({
  children,
  animation = "fade-up",
  delay = 0,
  className = "",
  threshold = 0.12,
}: AnimatedRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Fallback nếu trình duyệt không hỗ trợ IntersectionObserver
    if (!("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Ngắt kết nối sau khi đã hiển thị để tối ưu hiệu năng
          observer.unobserve(element);
        }
      },
      {
        threshold,
        rootMargin: "0px 0px -40px 0px", // Kích hoạt sớm hơn một chút khi chuẩn bị cuộn tới
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  const getAnimationClass = () => {
    if (!isVisible) return "opacity-0";
    switch (animation) {
      case "fade-up":
        return "animate-appear-fade-up";
      case "zoom-in":
        return "animate-appear-zoom-in";
      case "reveal":
        return "animate-appear-reveal";
      default:
        return "opacity-100";
    }
  };

  return (
    <div
      ref={ref}
      className={`transition-opacity ${getAnimationClass()} ${className}`}
      style={{
        animationDelay: delay > 0 ? `${delay}ms` : undefined,
      }}
    >
      {children}
    </div>
  );
}
