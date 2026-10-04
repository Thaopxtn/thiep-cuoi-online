"use client";

import React, { useRef, useState, useMemo, useEffect } from "react";

// Precalculated optimal angle limit for arc
const ARC_ANGLE = (() => {
  let e = 0;
  let t = 0.6;
  for (let r = 0; r < 40; r += 1) {
    const m = (e + t) / 2;
    if ((1.1 * Math.sin(m)) / (1.1 - (1 - Math.cos(m))) < 0.5646424733950354) {
      e = m;
    } else {
      t = m;
    }
  }
  return e;
})();

function wrapOffset(e: number, t: number) {
  const r = t / 2;
  return (((e + r) % t) + t) % t - r;
}

interface ArcCarouselProps<T> {
  items: T[];
  label: string;
  cardWidth?: number;
  visibleCards?: number;
  caption?: boolean;
  renderCard: (item: T, info: { isRepeat: boolean }) => React.ReactNode;
}

export default function ArcCarousel<T extends { id?: string | number }>({
  items,
  label,
  cardWidth = 210,
  visibleCards = 7,
  caption = false,
  renderCard,
}: ArcCarouselProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [containerWidth, setContainerWidth] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Layout calculation
  const layout = useMemo(() => {
    if (containerWidth <= 0) return null;
    const isMobile = containerWidth < 640;
    const gap = isMobile ? 12 : 20;
    const radius = containerWidth / 2 / 0.5646424733950354;
    let width = isMobile ? 132 : cardWidth;
    if (visibleCards && !isMobile) {
      width = Math.max(
        132,
        Math.min(width, Math.floor((2 * radius * ARC_ANGLE) / (visibleCards - 1) - gap))
      );
    }
    const height = Math.round(1.47 * width);
    return {
      containerWidth,
      cardWidth: width,
      cardHeight: height,
      step: width + gap,
      radius,
      perspective: 1.1 * radius,
      stageHeight: Math.ceil((height + (caption ? 28 : 0)) * 1.25),
    };
  }, [containerWidth, cardWidth, visibleCards, caption]);

  // Duplication count to cover circumference
  const copiesCount = useMemo(() => {
    if (!layout || items.length === 0) return 1;
    const visibleHalf = layout.containerWidth / 2 + layout.cardWidth;
    const arcSpan = reducedMotion
      ? visibleHalf
      : layout.radius * Math.asin(Math.min(1, visibleHalf / layout.radius));
    return Math.max(1, Math.ceil((2 * arcSpan + layout.step) / (items.length * layout.step)));
  }, [layout, items.length, reducedMotion]);

  const virtualItems = useMemo(() => {
    return Array.from({ length: copiesCount }, (_, copyIdx) =>
      items.map((item) => ({ item, copy: copyIdx }))
    ).flat();
  }, [items, copiesCount]);

  const state = useRef({
    offset: 0,
    velocity: 0,
    target: null as number | null,
    dragging: false,
    captured: false,
    pointerId: -1,
    lastX: 0,
    lastTime: 0,
    travel: 0,
    hovering: false,
    focused: false,
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setReducedMotion(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !layout || virtualItems.length === 0) return;
    const s = state.current;
    const totalCircumference = virtualItems.length * layout.step;
    let rafId = 0;
    let lastTimestamp = 0;

    const renderTransforms = () => {
      itemRefs.current.forEach((itemEl, idx) => {
        if (!itemEl) return;
        const relativeOffset = wrapOffset(idx * layout.step - s.offset, totalCircumference);
        const visibleSpan = layout.containerWidth / 2 + layout.cardWidth;

        if (reducedMotion) {
          const isVisible = Math.abs(relativeOffset) < visibleSpan;
          itemEl.style.transform = `translate(-50%, -50%) translate3d(${relativeOffset.toFixed(2)}px, 0, 0)`;
          itemEl.style.zIndex = "1";
          itemEl.style.opacity = isVisible ? "1" : "0";
          itemEl.style.pointerEvents = isVisible ? "" : "none";
          return;
        }

        const angle = relativeOffset / layout.radius;
        const xPos = layout.radius * Math.sin(angle);
        const zPos = layout.radius * (1 - Math.cos(angle));
        const isVisible = Math.abs(angle) < Math.PI / 2 && Math.abs(xPos) < visibleSpan;

        itemEl.style.transform = `translate(-50%, -50%) translate3d(${xPos.toFixed(2)}px, 0, ${zPos.toFixed(2)}px) rotateY(${(-angle).toFixed(4)}rad)`;
        itemEl.style.zIndex = String(Math.round(zPos) + 1);
        itemEl.style.opacity = isVisible ? "1" : "0";
        itemEl.style.pointerEvents = isVisible ? "" : "none";
      });
    };

    const tick = (now: number) => {
      const dt = lastTimestamp ? Math.min(0.05, (now - lastTimestamp) / 1000) : 0;
      lastTimestamp = now;

      if (!s.dragging) {
        if (s.target !== null) {
          s.offset += (s.target - s.offset) * Math.min(1, 10 * dt);
          if (Math.abs(s.target - s.offset) < 0.5) {
            s.offset = s.target;
            s.target = null;
          }
        } else if (Math.abs(s.velocity) > 8) {
          s.offset += s.velocity * dt;
          s.velocity *= Math.exp(-4 * dt);
        } else {
          s.velocity = 0;
          if (!reducedMotion && !s.hovering && !s.focused) {
            s.offset += 28 * dt; // automatic smooth slow scroll
          }
        }
      }

      s.offset = wrapOffset(s.offset, totalCircumference);
      if (s.target !== null) {
        s.target = s.offset + wrapOffset(s.target - s.offset, totalCircumference);
      }

      renderTransforms();
      rafId = requestAnimationFrame(tick);
    };

    const start = () => {
      if (!rafId) {
        lastTimestamp = 0;
        rafId = requestAnimationFrame(tick);
      }
    };

    const stop = () => {
      cancelAnimationFrame(rafId);
      rafId = 0;
    };

    renderTransforms();

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start();
      else stop();
    });
    io.observe(el);

    return () => {
      io.disconnect();
      stop();
    };
  }, [layout, virtualItems, reducedMotion]);

  const handlePointerUp = (e: React.PointerEvent) => {
    const s = state.current;
    if (e.pointerId === s.pointerId) {
      s.dragging = false;
      if (performance.now() - s.lastTime > 80) {
        s.velocity = 0;
      }
      if (s.captured && e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_5%,#000_95%,transparent)]"
    >
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        className="relative h-[278px] cursor-grab touch-pan-y select-none transition-opacity duration-500 active:cursor-grabbing sm:h-[344px]"
        style={{
          height: layout ? layout.stageHeight : undefined,
          opacity: layout ? 1 : 0,
        }}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          const s = state.current;
          s.dragging = true;
          s.captured = false;
          s.pointerId = e.pointerId;
          s.lastX = e.clientX;
          s.lastTime = performance.now();
          s.travel = 0;
          s.velocity = 0;
          s.target = null;
        }}
        onPointerMove={(e) => {
          const s = state.current;
          if (!s.dragging || e.pointerId !== s.pointerId) return;
          const now = performance.now();
          const dx = e.clientX - s.lastX;
          const dt = Math.max(1, now - s.lastTime) / 1000;
          s.lastX = e.clientX;
          s.lastTime = now;
          s.travel += Math.abs(dx);
          if (!s.captured && s.travel > 6) {
            s.captured = true;
            e.currentTarget.setPointerCapture(e.pointerId);
          }
          s.offset -= dx;
          s.velocity = 0.6 * s.velocity + (-dx / dt) * 0.4;
        }}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") state.current.hovering = true;
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") state.current.hovering = false;
        }}
        onClickCapture={(e) => {
          if (state.current.travel > 6) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onDragStart={(e) => e.preventDefault()}
        onFocus={(e) => {
          const target = e.target as HTMLElement;
          if (!target.matches(":focus-visible")) return;
          const s = state.current;
          s.focused = true;
          const li = target.closest("[data-arc-index]") as HTMLElement | null;
          if (!li || !layout) return;
          const idx = Number(li.dataset.arcIndex);
          const total = virtualItems.length * layout.step;
          s.velocity = 0;
          s.target = s.offset + wrapOffset(idx * layout.step - s.offset, total);
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            state.current.focused = false;
          }
        }}
      >
        <ul
          className="absolute inset-0 m-0 list-none p-0"
          style={{ perspective: layout ? `${Math.round(layout.perspective)}px` : undefined }}
        >
          {virtualItems.map(({ item, copy }, idx) => {
            const isRepeat = copy > 0;
            const key = `${(item as any).id ?? idx}-${copy}`;
            return (
              <li
                key={key}
                ref={(el) => {
                  itemRefs.current[idx] = el;
                }}
                data-arc-index={idx}
                aria-hidden={isRepeat || undefined}
                className="absolute left-1/2 top-1/2 [backface-visibility:hidden] [will-change:transform]"
                style={{ width: layout?.cardWidth }}
              >
                {renderCard(item, { isRepeat })}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
