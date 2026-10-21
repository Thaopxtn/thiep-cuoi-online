"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  MapPin,
  Heart,
  Send,
  Sparkles,
  CheckCircle,
  CreditCard,
  QrCode,
  Phone,
  MessageCircle,
  Crown,
  Copy,
  Check,
  X,
} from "lucide-react";

import {
  handleImageFallback,
  getSafeImageUrl,
  isDecorativeAsset,
  FALLBACK_WEDDING_IMG,
  DEFAULT_WEDDING_BACKGROUND,
} from "@/lib/imageUtils";
import { weddingSounds } from "@/lib/soundEffects";
import { calculateCountdown, formatCalendarData, getModuleRenderHtml, getSafeMapUrl, getGiftQrUrl } from "@/lib/moduleHelpers";
import { generateVietQrUrl } from "@/lib/vietQrBankCodes";
import { ANIMATION_KEYFRAME_MAP } from "@/lib/animationCatalog";

interface CardNodeRendererProps {
  nodes: Record<string, any>;
  onRsvpSuccess?: (rsvpData: any) => void;
  onOpenGiftQr?: () => void;
  groom?: { name?: string; bankName?: string; accountNumber?: string; accountName?: string; qrCode?: string };
  bride?: { name?: string; bankName?: string; accountNumber?: string; accountName?: string; qrCode?: string };
}


interface CardScrollAnimatedNodeProps {
  id: string;
  top: number;
  left: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  transition?: {
    effectEnabled?: boolean;
    effectType?: string;
    exitEffectType?: string;
    effectDuration?: number;
    effectDelay?: number;
    effectEasing?: string;
    hoverEffect?: string;
  };
  hoverClass?: string;
  continuousClass?: string;
  children: React.ReactNode;
}

function CardScrollAnimatedNode({
  id,
  top,
  left,
  width,
  height,
  rotation,
  opacity,
  zIndex,
  transition,
  hoverClass = "",
  continuousClass = "",
  children,
}: CardScrollAnimatedNodeProps) {
  const domRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [hasEnteredOnce, setHasEnteredOnce] = useState(false);
  const [runCount, setRunCount] = useState(0);

  const hasEntrance = Boolean(
    transition?.effectEnabled !== false &&
    transition?.effectType &&
    transition.effectType !== "none"
  );

  const exitEffect =
    transition?.exitEffectType && transition.exitEffectType !== "none"
      ? transition.exitEffectType
      : null;

  const hasMotion = hasEntrance || Boolean(exitEffect);

  useEffect(() => {
    if (!hasMotion) {
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
            setRunCount((prev) => prev + 1);
          } else {
            setIsInView(false);
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: "0px 0px -20px 0px",
      }
    );

    observer.observe(currentDom);
    return () => {
      observer.disconnect();
    };
  }, [hasMotion]);

  if (!hasMotion) {
    return (
      <div
        ref={domRef}
        className={`absolute pointer-events-auto ${hoverClass}`}
        style={{
          top: `${top}px`,
          left: `${left}px`,
          width: `${width}px`,
          height: `${height}px`,
          transform: `rotate(${rotation}deg)`,
          opacity: opacity,
          zIndex: zIndex,
        }}
      >
        <div className={`w-full h-full ${continuousClass}`}>
          {children}
        </div>
      </div>
    );
  }

  // Motion styling calculation
  let innerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
  };

  if (isInView) {
    // Entrance running when scrolled into view
    const animName = hasEntrance
      ? ANIMATION_KEYFRAME_MAP[transition!.effectType!] || transition!.effectType
      : undefined;

    innerStyle = {
      ...innerStyle,
      opacity: opacity,
      animationName: animName,
      animationDuration: `${transition?.effectDuration ?? 1.2}s`,
      animationDelay: `${transition?.effectDelay ?? 0}s`,
      animationTimingFunction:
        transition?.effectEasing || "cubic-bezier(0.16, 1, 0.3, 1)",
      animationFillMode: "both",
    };
  } else if (!hasEnteredOnce) {
    // Waiting for initial scroll to viewport
    innerStyle = {
      ...innerStyle,
      opacity: 0,
      pointerEvents: "none",
    };
  } else {
    // Scrolled past: trigger exit animation or fade out
    if (exitEffect) {
      const exitAnimName =
        ANIMATION_KEYFRAME_MAP[exitEffect] || exitEffect;
      innerStyle = {
        ...innerStyle,
        animationName: exitAnimName,
        animationDuration: "0.55s",
        animationTimingFunction: "ease-in",
        animationFillMode: "both",
        pointerEvents: "none",
      };
    } else {
      innerStyle = {
        ...innerStyle,
        opacity: 0,
        transition: "opacity 0.4s ease-out",
        pointerEvents: "none",
      };
    }
  }

  return (
    <div
      ref={domRef}
      className={`absolute pointer-events-auto ${hoverClass}`}
      style={{
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
        height: `${height}px`,
        transform: `rotate(${rotation}deg)`,
        zIndex: zIndex,
      }}
    >
      <div
        key={isInView ? `enter-${runCount}` : `exit-${runCount}`}
        style={innerStyle}
        className={`w-full h-full ${continuousClass}`}
      >
        {children}
      </div>
    </div>
  );
}

export default function CardNodeRenderer({
  nodes,
  onRsvpSuccess,
  onOpenGiftQr,
  groom,
  bride,
}: CardNodeRendererProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [rsvpSent, setRsvpSent] = useState(false);
  const [rsvpName, setRsvpName] = useState("");
  const [rsvpPhone, setRsvpPhone] = useState("");
  const [rsvpGuests, setRsvpGuests] = useState(1);
  const [rsvpAttending, setRsvpAttending] = useState(true);

  // Live countdown ticker
  const [, setLiveTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setLiveTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const rootNode = nodes["ROOT"] || {};
  const rootProps = rootNode.props || {};

  const baseWidth = Number(rootProps.width) || 500;
  const baseHeight = Number(rootProps.height) || 4500;
  const backgroundColor = rootProps.backgroundColor || "#ffffff";
  const bgImg = rootProps.backgroundImage;
  const rawBg = bgImg ? getSafeImageUrl(bgImg, "") : "";
  // Tự động sử dụng texture hoa văn cung điện hoàng gia tinh tế khi mẫu không có hình nền
  const backgroundImage =
    rawBg && rawBg.trim().length > 0 && !rawBg.endsWith("/none")
      ? rawBg
      : DEFAULT_WEDDING_BACKGROUND;

  const [containerWidth, setContainerWidth] = useState(500);

  // Responsive scale factor calculation to fit any mobile viewport perfectly without clipping
  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current) return;
      const parentWidth = containerRef.current.parentElement?.clientWidth || window.innerWidth;
      const availableWidth = Math.min(parentWidth, 500);
      setContainerWidth(parentWidth);
      setScale(availableWidth / baseWidth);
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [baseWidth]);

  // Extract all child node entries in proper z-order
  const childNodes = Object.entries(nodes)
    .filter(([id]) => id !== "ROOT")
    .map(([id, node]) => ({
      id,
      type: node.type?.resolvedName || "Widget",
      props: node.props || {},
      zIndex: Number(node.props?.zIndex) || 1,
    }))
    .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  // Tự động tính toán chiều cao an toàn dựa trên phần tử ở đáy thấp nhất
  const maxChildBottom = childNodes.reduce((max, child) => {
    const top = Number(child.props?.top ?? 0);
    const rawH = child.props?.height;
    const height = typeof rawH === "number" ? rawH : parseFloat(rawH) || 120;
    return Math.max(max, top + height);
  }, 0);

  // Tự động tính toán chiều cao an toàn vừa khít với nội dung thực tế
  const effectiveBaseHeight =
    maxChildBottom > 0
      ? maxChildBottom + 40
      : Math.max(Number(rootProps.height || 0), 1200);

  const getImageUrl = (key?: string) => {
    return getSafeImageUrl(key, "");
  };

  const targetScaledWidth = baseWidth * scale;
  const offsetX = Math.max(0, Math.round((containerWidth - targetScaledWidth) / 2));

  return (
    <div
      ref={containerRef}
      className="w-full relative overflow-hidden"
      style={{
        height: `${effectiveBaseHeight * scale}px`,
      }}
    >
      <div
        className="absolute top-0 transition-transform duration-150 origin-top-left"
        style={{
          left: `${offsetX}px`,
          width: `${baseWidth}px`,
          height: `${effectiveBaseHeight}px`,
          backgroundColor: backgroundColor,
          backgroundImage: backgroundImage ? `url("${backgroundImage}")` : undefined,
          backgroundSize: "100% auto",
          backgroundRepeat: "repeat-y",
          transform: `scale(${scale})`,
        }}
      >
        {childNodes.map((child) => {
          const { id, type, props } = child;

          const top = Number(props.top) ?? 0;
          const left = Number(props.left) ?? 0;
          const width = Number(props.width) ?? 100;
          const height = Number(props.height) ?? 100;
          const rotation = Number(props.rotation) ?? 0;
          const opacity = Number(props.opacity) ?? 1;
          const zIndex = Number(props.zIndex) ?? 1;

          // Continuous animation class
          let animClass = "";
          if (props.continuousAnimation?.type === "float") {
            animClass = "animate-zen-float";
          } else if (props.continuousAnimation?.type === "bounce") {
            animClass = "animate-zen-bounce";
          } else if (props.continuousAnimation?.type === "wobble") {
            animClass = "animate-zen-wobble";
          } else if (props.continuousAnimation?.type === "pulse") {
            animClass = "animate-zen-pulse";
          } else if (props.continuousAnimation?.type === "wiggle") {
            animClass = "animate-zen-wiggle";
          } else if (props.continuousAnimation?.type === "shake") {
            animClass = "animate-zen-shake";
          }

          // Entrance / Exit transition effect
          const transition = props.transition;

          const hoverClass =
            transition?.hoverEffect === "scale-up-gentle"
              ? "hover-effect-scale-up-gentle"
              : transition?.hoverEffect === "glow-soft"
              ? "hover-effect-glow-soft"
              : transition?.hoverEffect === "bounce-tap"
              ? "hover-effect-bounce-tap"
              : transition?.hoverEffect === "tilt-3d"
              ? "hover-effect-tilt-3d"
              : "";

          return (
            <CardScrollAnimatedNode
              key={id}
              id={id}
              top={top}
              left={left}
              width={width}
              height={height}
              rotation={rotation}
              opacity={opacity}
              zIndex={zIndex}
              transition={transition}
              hoverClass={hoverClass}
              continuousClass={animClass}
            >
              {/* Photo Box */}
              {type === "PhotoBox" && props.imgKey && (
                <div
                  className="w-full h-full overflow-hidden"
                  style={{
                    borderRadius: props.borderRadius
                      ? Array.isArray(props.borderRadius)
                        ? `${props.borderRadius[0]}px`
                        : `${props.borderRadius}px`
                      : "0px",
                    border: props.borderSize
                      ? `${props.borderSize}px ${props.borderStyle || "solid"} ${props.borderColor || "#ffffff"}`
                      : undefined,
                    boxShadow: props.hasBoxShadow
                      ? `${props.boxShadow?.offsetX || 0}px ${props.boxShadow?.offsetY || 4}px ${props.boxShadow?.blur || 10}px ${props.boxShadow?.color || "rgba(0,0,0,0.15)"}`
                      : undefined,
                    transform: `scaleX(${props.flipX ? -1 : 1}) scaleY(${props.flipY ? -1 : 1})`,
                  }}
                >
                  <img
                    src={getImageUrl(props.imgKey)}
                    alt={props.alt || ""}
                    onError={(e) =>
                      handleImageFallback(
                        e,
                        undefined,
                        !props.isReplaceable || isDecorativeAsset(props.imgKey)
                      )
                    }
                    className="w-full h-full object-cover select-none pointer-events-none"
                    style={{
                      filter: props.filterStyle || undefined,
                    }}
                    draggable={false}
                  />
                </div>
              )}

              {/* Text Box & Specialized Modules */}
              {(type === "TextBox" ||
                type === "TimelineBox" ||
                type === "DressCodeBox" ||
                type === "CeremonyBox" ||
                type === "FamilyInfoBox" ||
                type === "BankCardBox") && (
                <div
                  className={`w-full h-full select-none ${
                    props.fontFamily && props.fontFamily.startsWith("font-")
                      ? props.fontFamily
                      : ""
                  }`}
                  style={{
                    fontFamily:
                      props.fontFamily && !props.fontFamily.startsWith("font-")
                        ? props.fontFamily
                        : undefined,
                    fontSize: `${props.fontSize || 20}px`,
                    color: props.color || "#1c171a",
                    fontWeight: props.fontWeight || "normal",
                    fontStyle: props.fontStyle || "normal",
                    textAlign: props.textAlign || "left",
                    lineHeight: props.lineHeight ? `${props.lineHeight}` : "1.2",
                    letterSpacing: props.letterSpacing
                      ? `${props.letterSpacing}px`
                      : "normal",
                    textShadow: props.hasTextShadow && props.textShadow
                      ? `${props.textShadow.offsetX || 0}px ${props.textShadow.offsetY || 1}px ${props.textShadow.blur || 4}px ${props.textShadow.color || "rgba(0,0,0,0.5)"}`
                      : undefined,
                  }}
                  dangerouslySetInnerHTML={{ __html: getModuleRenderHtml(type, props) }}
                />
              )}

              {/* Geometric Box (Card panels, colored backgrounds) */}
              {type === "GeometricBox" && (
                <div
                  className="w-full h-full"
                  style={{
                    backgroundColor: props.fill || props.backgroundColor || "transparent",
                    borderRadius: props.borderRadius
                      ? Array.isArray(props.borderRadius)
                        ? `${props.borderRadius[0]}px`
                        : `${props.borderRadius}px`
                      : props.shapeType === "circle"
                      ? "50%"
                      : "0px",
                    border: props.borderSize
                      ? `${props.borderSize}px ${props.borderStyle || "solid"} ${props.borderColor || "transparent"}`
                      : undefined,
                    boxShadow: props.hasBoxShadow
                      ? `${props.boxShadow?.offsetX || 0}px ${props.boxShadow?.offsetY || 4}px ${props.boxShadow?.blur || 10}px ${props.boxShadow?.color || "rgba(0,0,0,0.15)"}`
                      : undefined,
                    opacity: props.opacity ?? 1,
                  }}
                />
              )}

              {/* Carousel Box (Photo Gallery) */}
              {type === "CarouselBox" && (
                <div
                  className="w-full h-full overflow-hidden relative shadow-lg"
                  style={{
                    borderRadius: props.borderRadius
                      ? Array.isArray(props.borderRadius)
                        ? `${props.borderRadius[0]}px`
                        : `${props.borderRadius}px`
                      : "24px",
                  }}
                >
                  {props.imgList && props.imgList.length > 0 ? (
                    <img
                      src={getImageUrl(props.imgList[0]?.imageKey || props.imgList[0]?.src)}
                      alt="Wedding Gallery"
                      onError={(e) => handleImageFallback(e, FALLBACK_WEDDING_IMG, false)}
                      className="w-full h-full object-cover select-none pointer-events-none"
                      draggable={false}
                    />
                  ) : (
                    <div className="w-full h-full bg-rose-50 flex items-center justify-center text-xs font-semibold text-gray-500">
                      Album Ảnh Cưới
                    </div>
                  )}
                  {props.imgList && props.imgList.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-xs">
                      {props.imgList.slice(0, 5).map((_: any, idx: number) => (
                        <span
                          key={idx}
                          className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? "bg-white" : "bg-white/50"}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Line Divider */}
              {type === "LineBox" && (
                <div
                  className="w-full h-full"
                  style={{
                    backgroundColor: props.fill || props.borderColor || "#e2e8f0",
                  }}
                />
              )}

              {/* Countdown Box */}
              {type === "CountdownBoxV2" && (() => {
                const cd = calculateCountdown(props.targetDate, props.targetTime);
                const textColor = props.textColor || "#590310";
                const variant = props.styleVariant;

                if (variant === "flip") {
                  return (
                    <div className="w-full h-full flex flex-col justify-between p-3 bg-slate-900 text-white rounded-2xl border border-slate-700 shadow-lg text-center select-none">
                      <div className="flex items-center justify-between text-[10px] border-b border-slate-800 pb-1">
                        <span className="font-bold text-slate-300 tracking-wider">ĐẾM NGƯỢC NGÀY CHUNG ĐÔI</span>
                        <span className="text-rose-400 font-bold font-mono">FLIP CLOCK</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 my-auto" suppressHydrationWarning>
                        {[
                          { val: String(cd.days).padStart(2, "0"), label: "Ngày" },
                          { val: String(cd.hours).padStart(2, "0"), label: "Giờ" },
                          { val: String(cd.minutes).padStart(2, "0"), label: "Phút" },
                          { val: String(cd.seconds).padStart(2, "0"), label: "Giây" },
                        ].map((item, i) => (
                          <div key={i} suppressHydrationWarning className="bg-slate-800 border border-slate-700 rounded-xl p-1.5 relative overflow-hidden flex flex-col items-center shadow-inner">
                            <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-950/80 z-10" />
                            <span suppressHydrationWarning className="text-xl sm:text-2xl font-black font-mono text-cyan-300 z-0">
                              {item.val}
                            </span>
                            <span className="text-[9px] uppercase font-bold text-slate-400 mt-0.5">
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="text-[9px] text-slate-400">Chính xác theo thời gian thực</div>
                    </div>
                  );
                }

                if (variant === "hearts") {
                  return (
                    <div className="w-full h-full flex flex-col justify-between p-3 bg-gradient-to-b from-rose-50/90 to-white rounded-2xl border border-rose-200 shadow-md text-center select-none">
                      <div className="flex items-center justify-between text-[10px] border-b border-rose-100 pb-1">
                        <span className="font-bold text-rose-800 tracking-wider flex items-center gap-1">
                          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> CÙNG ĐẾM NGƯỢC
                        </span>
                        <span className="text-rose-600 font-bold text-[9px]">Chung Đôi</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 my-auto" suppressHydrationWarning>
                        {[
                          { val: String(cd.days).padStart(2, "0"), label: "Ngày" },
                          { val: String(cd.hours).padStart(2, "0"), label: "Giờ" },
                          { val: String(cd.minutes).padStart(2, "0"), label: "Phút" },
                          { val: String(cd.seconds).padStart(2, "0"), label: "Giây" },
                        ].map((item, i) => (
                          <div key={i} suppressHydrationWarning className="bg-white border border-rose-200/80 rounded-xl p-1.5 flex flex-col items-center shadow-2xs">
                            <span suppressHydrationWarning className="text-xl sm:text-2xl font-black font-serif text-rose-600">
                              {item.val}
                            </span>
                            <span className="text-[9px] uppercase font-bold text-rose-400 mt-0.5">
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="text-[9px] text-rose-500 font-medium">❤️ Đếm ngược từng khoảnh khắc ngọt ngào</div>
                    </div>
                  );
                }

                return (
                  <div className="w-full h-full flex items-center justify-around p-3 bg-white/30 backdrop-blur-xs rounded-2xl border border-stone-200/50 text-center shadow-xs" suppressHydrationWarning>
                    {[
                      { val: String(cd.days).padStart(2, "0"), label: "Ngày" },
                      { val: String(cd.hours).padStart(2, "0"), label: "Giờ" },
                      { val: String(cd.minutes).padStart(2, "0"), label: "Phút" },
                      { val: String(cd.seconds).padStart(2, "0"), label: "Giây" },
                    ].map((item, i) => (
                      <div key={i} suppressHydrationWarning className="flex flex-col items-center">
                        <span
                          suppressHydrationWarning
                          className="text-xl sm:text-2xl font-black font-serif"
                          style={{ color: textColor }}
                        >
                          {item.val}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-gray-600">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Calendar Box */}
              {type === "CalendarBoxV2" && (() => {
                const cal = formatCalendarData(props);
                const themeColor = props.themeColor || "#590310";
                const variant = props.styleVariant;

                if (variant === "handcrafted_grid") {
                  return (
                    <div className="w-full h-full p-3 rounded-2xl bg-[#590310] text-[#ece4d8] border border-[#ecd4a6]/40 shadow-md flex flex-col justify-between items-center text-center select-none font-serif">
                      <div className="text-[10px] uppercase font-bold tracking-widest text-[#ecd4a6]">
                        VÀO LÚC {cal.time}
                      </div>
                      <div className="flex items-center justify-center gap-3 my-0.5">
                        <span className="text-[11px] font-bold uppercase border-y border-[#ecd4a6]/40 px-2 py-0.5">
                          {cal.dayOfWeek}
                        </span>
                        <span className="text-4xl font-black text-[#ffd700] leading-none drop-shadow-xs">
                          {cal.day}
                        </span>
                        <span className="text-[11px] font-bold uppercase border-y border-[#ecd4a6]/40 px-2 py-0.5">
                          THÁNG {cal.month}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#ece4d8]/80 font-sans italic">
                        NĂM {cal.year} • (Tức ngày 11 tháng 11 năm Bính Ngọ)
                      </div>
                    </div>
                  );
                }

                if (variant === "royal") {
                  return (
                    <div className="w-full h-full p-3.5 rounded-3xl bg-gradient-to-br from-amber-50 via-white to-amber-100/50 border-2 border-amber-300 shadow-md flex flex-col justify-between items-center text-center select-none">
                      <div className="flex items-center gap-1.5 text-amber-900 border-b border-amber-200/80 pb-1 w-full justify-center">
                        <Crown className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-[10px] uppercase font-serif font-bold tracking-widest">
                          {cal.formattedTitle}
                        </span>
                      </div>
                      <div className="text-4xl sm:text-5xl font-serif font-black text-amber-950 my-1 drop-shadow-xs">
                        {cal.day}
                      </div>
                      <div className="text-[10px] font-serif font-semibold text-amber-800 bg-amber-100/60 px-3 py-0.5 rounded-full border border-amber-200">
                        {cal.dayOfWeek} • {cal.time} • Ngày Hoàng Đạo
                      </div>
                    </div>
                  );
                }

                if (variant === "stamp") {
                  return (
                    <div className="w-full h-full p-3 rounded-2xl bg-[#fdfaf2] border-2 border-dashed border-amber-400/90 shadow-sm flex items-center justify-between gap-3 text-left select-none">
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-mono text-amber-800 font-bold tracking-widest uppercase">
                          POSTMARK • WEDDING
                        </span>
                        <h4 className="text-base font-bold text-gray-900 font-serif mt-0.5">
                          Ngày {cal.day} {cal.formattedTitle}
                        </h4>
                        <p className="text-[10px] text-gray-600">{cal.dayOfWeek} • {cal.time}</p>
                      </div>
                      <div className="w-16 h-16 rounded-full border-2 border-dashed border-rose-500 bg-white flex flex-col items-center justify-center text-rose-600 rotate-6 shrink-0 shadow-2xs">
                        <Heart className="w-4 h-4 fill-rose-500" />
                        <span className="text-[10px] font-bold font-mono mt-0.5">{cal.day}.{cal.month}</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="w-full h-full p-4 rounded-3xl bg-amber-50/50 border border-amber-200/50 flex flex-col justify-center items-center text-center shadow-xs">
                    <span
                      className="text-xs uppercase font-bold tracking-widest"
                      style={{ color: themeColor }}
                    >
                      {cal.formattedTitle}
                    </span>
                    <div
                      className="text-4xl font-serif font-black my-2"
                      style={{ color: themeColor }}
                    >
                      {cal.day}
                    </div>
                    <span className="text-xs text-gray-700">
                      {cal.dayOfWeek} • {cal.time}
                    </span>
                  </div>
                );
              })()}

              {/* Reminder Box */}
              {type === "ReminderBox" && (() => {
                const title = encodeURIComponent(props.title || props.eventTitle || "Đám cưới hạnh phúc");
                const targetYear = props.year || 2026;
                const targetMonth = String(props.month || 12).padStart(2, "0");
                const targetDay = String(props.day || 29).padStart(2, "0");
                const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${targetYear}${targetMonth}${targetDay}T090000Z/${targetYear}${targetMonth}${targetDay}T140000Z`;
                return (
                  <button
                    type="button"
                    onClick={() => {
                      weddingSounds.playSoftClick();
                      window.open(calendarUrl, "_blank");
                    }}
                    className="w-full h-full rounded-full bg-[#ece4d8] hover:bg-[#dfd4c4] text-[#590310] flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <CalendarIcon className="w-4 h-4 text-[#590310]" />
                    <span>{props.text || "Thêm vào lịch"}</span>
                  </button>
                );
              })()}

              {/* Gift QR Box - Đa giao diện khớp Preview 100% */}
              {type === "GiftQrBox" && (() => {
                const variant = props.styleVariant || "minimal";
                const modalTitle = props.modalTitle || "Hộp Quà Mừng Cưới (VietQR)";

                // 0. GIAO DIỆN THỦ CÔNG: PHONG BÌ ĐỎ SONG HỶ KÉP VIETQR (red_envelope_pair)
                if (variant === "red_envelope_pair") {
                  const gBank = props.groomBank || props.bankName || "MB BANK";
                  const gAcc = props.groomAccount || props.accountNumber || "999988882026";
                  const gName = props.groomName || props.accountName || "LÊ ĐỨC MẠNH";
                  const gQr = generateVietQrUrl(gBank, gAcc, gName, undefined, "Mung cuoi Chu Re");

                  const bBank = props.brideBank || "VIETCOMBANK";
                  const bAcc = props.brideAccount || "1028492049";
                  const bName = props.brideName || "TRẦN LỆ QUYÊN";
                  const bQr = generateVietQrUrl(bBank, bAcc, bName, undefined, "Mung cuoi Co Dau");

                  return (
                    <div
                      onClick={() => {
                        weddingSounds.playChime();
                        onOpenGiftQr?.();
                      }}
                      className="w-full h-full bg-gradient-to-br from-[#881337] via-[#9f1239] to-[#881337] text-amber-100 rounded-2xl p-3 border-2 border-amber-400/80 shadow-xl flex flex-col justify-between cursor-pointer group hover:shadow-2xl transition-all select-none hover:scale-[1.01]"
                      title="Chạm để mở Hộp Quà Mừng Cưới"
                    >
                      <div className="flex items-center justify-between border-b border-amber-300/30 pb-1.5 mb-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-200">
                          <span className="text-sm">🧧</span>
                          <span className="font-serif font-bold uppercase tracking-wider">{modalTitle}</span>
                        </div>
                        <span className="text-[10px] font-bold font-serif text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-400/60">
                          囍 Song Hỷ Lâm Môn
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
                        {/* Phong Bì Nhà Trai */}
                        <div className="bg-gradient-to-b from-[#700f2d] to-[#500b20] rounded-xl p-2 border border-amber-400/50 flex flex-col items-center justify-between text-center shadow-md">
                          <div className="w-full flex items-center justify-between text-[9px] font-bold text-amber-200 border-b border-amber-400/20 pb-1">
                            <span className="bg-amber-400/20 text-amber-200 px-1.5 py-0.2 rounded font-mono">{gBank}</span>
                            <span>🤵 Nhà Trai</span>
                          </div>
                          <div className="w-20 h-20 sm:w-24 sm:h-24 p-1 bg-white rounded-lg border border-amber-300 shadow-inner flex items-center justify-center my-1 group-hover:scale-105 transition-transform overflow-hidden">
                            {gQr ? (
                              <img src={gQr} alt="QR Nhà Trai" className="w-full h-full object-contain" onError={(e) => handleImageFallback(e, undefined, false)} />
                            ) : (
                              <span className="text-[9px] text-gray-400">Chưa có mã QR</span>
                            )}
                          </div>
                          <div className="w-full space-y-0.5">
                            <p className="text-[10px] font-bold text-amber-100 truncate">{gName}</p>
                            <p className="text-[9px] font-mono font-semibold text-amber-300 bg-black/30 py-0.5 px-1 rounded truncate border border-amber-400/20">
                              STK: {gAcc}
                            </p>
                          </div>
                        </div>

                        {/* Phong Bì Nhà Gái */}
                        <div className="bg-gradient-to-b from-[#700f2d] to-[#500b20] rounded-xl p-2 border border-amber-400/50 flex flex-col items-center justify-between text-center shadow-md">
                          <div className="w-full flex items-center justify-between text-[9px] font-bold text-amber-200 border-b border-amber-400/20 pb-1">
                            <span className="bg-amber-400/20 text-amber-200 px-1.5 py-0.2 rounded font-mono">{bBank}</span>
                            <span>👰 Nhà Gái</span>
                          </div>
                          <div className="w-20 h-20 sm:w-24 sm:h-24 p-1 bg-white rounded-lg border border-amber-300 shadow-inner flex items-center justify-center my-1 group-hover:scale-105 transition-transform overflow-hidden">
                            {bQr ? (
                              <img src={bQr} alt="QR Nhà Gái" className="w-full h-full object-contain" onError={(e) => handleImageFallback(e, undefined, false)} />
                            ) : (
                              <span className="text-[9px] text-gray-400">Chưa có mã QR</span>
                            )}
                          </div>
                          <div className="w-full space-y-0.5">
                            <p className="text-[10px] font-bold text-amber-100 truncate">{bName}</p>
                            <p className="text-[9px] font-mono font-semibold text-amber-300 bg-black/30 py-0.5 px-1 rounded truncate border border-amber-400/20">
                              STK: {bAcc}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="text-center text-[9px] text-amber-200/90 pt-1.5 flex items-center justify-center gap-1 font-serif">
                        <span>Chuyển khoản mừng cưới Napas 24/7 tiện lợi & chúc phúc đôi uyên ương</span>
                      </div>
                    </div>
                  );
                }

                // 1. GIAO DIỆN 1: CẢ NHÀ TRAI & NHÀ GÁI (dual_accounts)
                if (variant === "dual_accounts") {
                  const gBank = props.groomBank || props.bankName || "MB BANK";
                  const gAcc = props.groomAccount || props.accountNumber || "999988882026";
                  const gName = props.groomName || props.accountName || "LÊ ĐỨC MẠNH";
                  const gQr = generateVietQrUrl(gBank, gAcc, gName, undefined, "Mung cuoi Chu Re");

                  const bBank = props.brideBank || "VIETCOMBANK";
                  const bAcc = props.brideAccount || "1028492049";
                  const bName = props.brideName || "TRẦN LỆ QUYÊN";
                  const bQr = generateVietQrUrl(bBank, bAcc, bName, undefined, "Mung cuoi Co Dau");

                  return (
                    <div
                      onClick={() => {
                        weddingSounds.playChime();
                        onOpenGiftQr?.();
                      }}
                      className="w-full h-full bg-white/95 rounded-2xl p-3 border border-rose-200/90 shadow-md flex flex-col justify-between cursor-pointer group hover:shadow-xl hover:border-rose-400 transition-all select-none hover:scale-[1.01]"
                      title="Chạm để mở Hộp Quà Mừng Cưới"
                    >
                      <div className="flex items-center justify-between border-b border-rose-100 pb-1.5 mb-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                          <span>🎁</span>
                          <span className="font-serif">{modalTitle}</span>
                        </div>
                        <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          Napas 24/7
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
                        {/* Nhà Trai */}
                        <div className="bg-gradient-to-b from-blue-50/60 to-white rounded-xl p-2 border border-blue-200/80 flex flex-col items-center justify-between text-center shadow-2xs">
                          <div className="w-full flex items-center justify-between text-[10px] font-bold text-blue-900 border-b border-blue-100 pb-1">
                            <span className="bg-blue-100/70 text-blue-800 px-1.5 py-0.2 rounded font-mono">{gBank}</span>
                            <span>🤵 Nhà Trai</span>
                          </div>
                          <div className="w-20 h-20 sm:w-24 sm:h-24 p-1 bg-white rounded-lg border border-blue-200 shadow-inner flex items-center justify-center my-1 group-hover:scale-105 transition-transform overflow-hidden">
                            {gQr ? (
                              <img src={gQr} alt="QR Nhà Trai" className="w-full h-full object-contain" onError={(e) => handleImageFallback(e, undefined, false)} />
                            ) : (
                              <span className="text-[9px] text-gray-400">Chưa có mã QR</span>
                            )}
                          </div>
                          <div className="w-full space-y-0.5">
                            <p className="text-[10px] font-bold text-gray-800 truncate">{gName}</p>
                            <p className="text-[9px] font-mono font-semibold text-blue-700 bg-blue-50/80 py-0.5 px-1 rounded truncate">
                              STK: {gAcc}
                            </p>
                          </div>
                        </div>

                        {/* Nhà Gái */}
                        <div className="bg-gradient-to-b from-rose-50/60 to-white rounded-xl p-2 border border-rose-200/80 flex flex-col items-center justify-between text-center shadow-2xs">
                          <div className="w-full flex items-center justify-between text-[10px] font-bold text-rose-900 border-b border-rose-100 pb-1">
                            <span className="bg-rose-100/70 text-rose-800 px-1.5 py-0.2 rounded font-mono">{bBank}</span>
                            <span>👰 Nhà Gái</span>
                          </div>
                          <div className="w-20 h-20 sm:w-24 sm:h-24 p-1 bg-white rounded-lg border border-rose-200 shadow-inner flex items-center justify-center my-1 group-hover:scale-105 transition-transform overflow-hidden">
                            {bQr ? (
                              <img src={bQr} alt="QR Nhà Gái" className="w-full h-full object-contain" onError={(e) => handleImageFallback(e, undefined, false)} />
                            ) : (
                              <span className="text-[9px] text-gray-400">Chưa có mã QR</span>
                            )}
                          </div>
                          <div className="w-full space-y-0.5">
                            <p className="text-[10px] font-bold text-gray-800 truncate">{bName}</p>
                            <p className="text-[9px] font-mono font-semibold text-rose-700 bg-rose-50/80 py-0.5 px-1 rounded truncate">
                              STK: {bAcc}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="text-center text-[9px] text-rose-600 font-bold pt-1.5 flex items-center justify-center gap-1 group-hover:underline">
                        <span>Chạm để mở STK Cô Dâu & Chú Rể ↗</span>
                      </div>
                    </div>
                  );
                }

                // 2. GIAO DIỆN 3: DẠNG THẺ ATM LUXURY (vip_gold_card)
                if (variant === "vip_gold_card") {
                  const bankName = props.bankName || "TECHCOMBANK";
                  const accNum = props.accountNumber || "987654321098";
                  const accName = props.accountName || "HOÀNG NAM & THẢO LINH";
                  const qrUrl = props.imgKey || generateVietQrUrl(bankName, accNum, accName, undefined, "Mung cuoi VIP");
                  const formattedNum = accNum.replace(/(\d{4})/g, "$1 ").trim();

                  return (
                    <div
                      onClick={() => {
                        weddingSounds.playChime();
                        onOpenGiftQr?.();
                      }}
                      className="w-full h-full bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 text-amber-950 p-3.5 rounded-2xl relative overflow-hidden shadow-lg border border-amber-300 flex flex-col justify-between cursor-pointer group hover:shadow-xl transition-all select-none hover:scale-[1.01]"
                      title="Chạm để mở Hộp Quà Mừng Cưới"
                    >
                      <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/20 rounded-full blur-xl pointer-events-none" />

                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black tracking-widest font-mono uppercase bg-amber-900/10 px-2 py-0.5 rounded border border-amber-900/20">
                            VIETQR GOLD VIP
                          </span>
                          <span className="text-[9px] font-bold text-amber-900/80 font-mono">{bankName}</span>
                        </div>
                        <CreditCard className="w-5 h-5 text-amber-900/80" />
                      </div>

                      <div className="flex items-center justify-between gap-3 my-auto relative z-10">
                        <div className="space-y-1.5 min-w-0">
                          <div className="w-7 h-5 rounded bg-gradient-to-br from-amber-600/40 to-amber-700/60 border border-amber-700/60 shadow-xs flex items-center justify-center">
                            <div className="w-4 h-2.5 border-t border-b border-amber-800/40" />
                          </div>
                          <div>
                            <p className="font-mono text-sm sm:text-base font-black tracking-wider text-amber-950 drop-shadow-xs truncate">
                              {formattedNum}
                            </p>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-900 truncate mt-0.5">
                              {accName}
                            </p>
                          </div>
                        </div>

                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white p-1 rounded-xl border-2 border-amber-500 shadow-md shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden">
                          {qrUrl ? (
                            <img src={qrUrl} alt="VietQR VIP" className="w-full h-full object-contain" onError={(e) => handleImageFallback(e, undefined, false)} />
                          ) : (
                            <QrCode className="w-14 h-14 text-amber-950" />
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-amber-900/90 font-semibold relative z-10 border-t border-amber-400/60 pt-1">
                        <span>Napas 247 • Chuyển khoản mừng cưới thuận tiện</span>
                        <span className="font-bold group-hover:underline">Chạm để mở ↗</span>
                      </div>
                    </div>
                  );
                }

                // 3. GIAO DIỆN 2: THẺ TRUNG TÂM GỌN GÀNG (single_clean)
                if (variant === "single_clean") {
                  const bankName = props.bankName || "VIETCOMBANK";
                  const accNum = props.accountNumber || "1028492049";
                  const accName = props.accountName || "NGUYỄN HOÀNG NAM";
                  const qrUrl = props.imgKey || generateVietQrUrl(bankName, accNum, accName, undefined, "Mung cuoi hai ban");

                  return (
                    <div
                      onClick={() => {
                        weddingSounds.playChime();
                        onOpenGiftQr?.();
                      }}
                      className="w-full h-full bg-white/95 p-3.5 rounded-2xl border border-emerald-200/90 shadow-md flex items-center justify-between gap-3 cursor-pointer group hover:shadow-xl hover:border-emerald-400 transition-all select-none hover:scale-[1.01]"
                      title="Chạm để mở Hộp Quà Mừng Cưới"
                    >
                      <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                        <div>
                          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <span>{bankName}</span>
                            <span>• 24/7</span>
                          </div>
                          <h4 className="text-sm font-bold text-gray-900 truncate mt-1.5 font-serif uppercase">
                            {accName}
                          </h4>
                          <p className="text-xs font-mono font-semibold text-gray-600 mt-0.5">
                            STK: <span className="text-gray-900 font-bold">{accNum}</span>
                          </p>
                        </div>

                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              weddingSounds.playPop();
                              if (typeof navigator !== "undefined" && navigator.clipboard) {
                                navigator.clipboard.writeText(accNum);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors pointer-events-auto"
                          >
                            <Copy className="w-3 h-3 text-blue-600" />
                            <span>Sao chép số TK</span>
                          </button>
                        </div>
                      </div>

                      <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white border-2 border-emerald-200 rounded-xl p-1.5 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform overflow-hidden">
                        {qrUrl ? (
                          <img src={qrUrl} alt="VietQR" className="w-full h-full object-contain" onError={(e) => handleImageFallback(e, undefined, false)} />
                        ) : (
                          <QrCode className="w-16 h-16 text-gray-800" />
                        )}
                      </div>
                    </div>
                  );
                }

                // 4. GIAO DIỆN 4: LỜI CHÚC & COPY STK (message_envelope)
                if (variant === "message_envelope") {
                  const bankName = props.bankName || "VPBANK";
                  const accNum = props.accountNumber || "888820268888";
                  const accName = props.accountName || "LÊ ĐỨC MẠNH";
                  const msg = props.messageText || "Sự hiện diện và lời chúc phúc của quý vị là món quà vô giá nhất đối với chúng mình!";
                  const qrUrl = props.imgKey || generateVietQrUrl(bankName, accNum, accName, undefined, "Mung cuoi hai ban");

                  return (
                    <div
                      onClick={() => {
                        weddingSounds.playChime();
                        onOpenGiftQr?.();
                      }}
                      className="w-full h-full bg-gradient-to-br from-rose-50/70 via-white to-amber-50/40 p-3 rounded-2xl border border-rose-200 shadow-md flex flex-col justify-between cursor-pointer group hover:shadow-xl hover:border-rose-400 transition-all select-none text-center hover:scale-[1.01]"
                      title="Chạm để mở Hộp Quà Mừng Cưới"
                    >
                      <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-100/70 px-3 py-0.5 rounded-full w-fit mx-auto">
                        <span>💌</span>
                        <span>{modalTitle}</span>
                      </div>

                      <p className="text-[10px] text-gray-600 italic px-2 my-1 line-clamp-2">
                        "{msg}"
                      </p>

                      <div className="flex items-center justify-center gap-3 my-0.5">
                        <div className="w-20 h-20 p-1 bg-white rounded-xl border border-rose-200 shadow-inner shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
                          {qrUrl ? (
                            <img src={qrUrl} alt="VietQR" className="w-full h-full object-contain" onError={(e) => handleImageFallback(e, undefined, false)} />
                          ) : (
                            <QrCode className="w-14 h-14 text-gray-700" />
                          )}
                        </div>
                        <div className="text-left space-y-0.5">
                          <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 font-mono">{bankName}</span>
                          <p className="text-xs font-bold text-gray-900 truncate">{accName}</p>
                          <p className="text-[11px] font-mono font-bold text-rose-600">{accNum}</p>
                        </div>
                      </div>

                      <span className="text-[9px] text-rose-600 font-bold group-hover:underline">
                        Chạm để mở Hộp Quà Mừng Cưới ↗
                      </span>
                    </div>
                  );
                }

                // 5. GIAO DIỆN 6: HAI THẺ DỌC KÈM GỢI Ý (dual_vertical)
                if (variant === "dual_vertical") {
                  const gBank = props.groomBank || props.bankName || "MB BANK";
                  const gAcc = props.groomAccount || props.accountNumber || "240220038888";
                  const gName = props.groomName || props.accountName || "TRẦN MINH QUÂN";
                  const gQr = generateVietQrUrl(gBank, gAcc, gName, undefined, "Mung cuoi Chu Re");

                  const bBank = props.brideBank || "TECHCOMBANK";
                  const bAcc = props.brideAccount || "19038294829012";
                  const bName = props.brideName || "LÊ THỊ MAI";
                  const bQr = generateVietQrUrl(bBank, bAcc, bName, undefined, "Mung cuoi Co Dau");

                  return (
                    <div
                      onClick={() => {
                        weddingSounds.playChime();
                        onOpenGiftQr?.();
                      }}
                      className="w-full h-full bg-white/95 rounded-2xl p-2.5 border border-rose-200/90 shadow-md flex flex-col justify-between cursor-pointer group hover:shadow-xl hover:border-rose-400 transition-all select-none hover:scale-[1.01]"
                      title="Chạm để mở Hộp Quà Mừng Cưới"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-rose-800 px-1">
                        <span>🎁 {modalTitle}</span>
                        <div className="flex gap-1 text-[8px]">
                          {["200k", "500k", "1Tr"].map((m, idx) => (
                            <span key={idx} className="px-1.5 py-0.2 bg-rose-50 text-rose-700 rounded border border-rose-200 font-bold">{m}</span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5 my-auto">
                        {/* Row 1: Chú Rể */}
                        <div className="flex items-center justify-between p-1.5 bg-blue-50/50 rounded-xl border border-blue-100 gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-sm">🤵</span>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold text-blue-900 truncate">Mừng Chú Rể • {gName}</p>
                              <p className="text-[9px] font-mono text-gray-600 truncate">{gBank}: {gAcc}</p>
                            </div>
                          </div>
                          <div className="w-12 h-12 bg-white p-0.5 rounded-lg border border-blue-200 shrink-0 overflow-hidden flex items-center justify-center">
                            {gQr ? <img src={gQr} alt="QR Chú Rể" className="w-full h-full object-contain" /> : <QrCode className="w-8 h-8 text-blue-900" />}
                          </div>
                        </div>

                        {/* Row 2: Cô Dâu */}
                        <div className="flex items-center justify-between p-1.5 bg-rose-50/50 rounded-xl border border-rose-100 gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-sm">👰</span>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold text-rose-900 truncate">Mừng Cô Dâu • {bName}</p>
                              <p className="text-[9px] font-mono text-gray-600 truncate">{bBank}: {bAcc}</p>
                            </div>
                          </div>
                          <div className="w-12 h-12 bg-white p-0.5 rounded-lg border border-rose-200 shrink-0 overflow-hidden flex items-center justify-center">
                            {bQr ? <img src={bQr} alt="QR Cô Dâu" className="w-full h-full object-contain" /> : <QrCode className="w-8 h-8 text-rose-900" />}
                          </div>
                        </div>
                      </div>

                      <span className="text-[9px] text-center text-rose-600 font-bold group-hover:underline">Chạm để mở STK Cô Dâu & Chú Rể ↗</span>
                    </div>
                  );
                }

                // 6. GIAO DIỆN MẶC ĐỊNH / TỐI GIẢN (minimal)
                let qrUrl = getGiftQrUrl(props);
                let bankName = props.bankName;
                let accountNumber = props.accountNumber;
                let accountName = props.accountName;

                if (!qrUrl && (groom?.accountNumber || bride?.accountNumber)) {
                  const targetBank = groom?.accountNumber ? groom : bride;
                  if (targetBank) {
                    bankName = targetBank.bankName || "MB BANK";
                    accountNumber = targetBank.accountNumber || "";
                    accountName = targetBank.accountName || targetBank.name || "CHỦ TÀI KHOẢN";
                    qrUrl = generateVietQrUrl(bankName, accountNumber, accountName, targetBank.qrCode, "Mung cuoi hai ban");
                  }
                }

                return (
                  <div
                    onClick={() => {
                      weddingSounds.playChime();
                      onOpenGiftQr?.();
                    }}
                    className="w-full h-full bg-white/95 rounded-2xl p-3 border border-rose-200/80 shadow-md flex flex-col items-center justify-between text-center cursor-pointer group hover:shadow-xl hover:border-rose-400 transition-all select-none hover:scale-[1.01]"
                    title="Chạm để mở Hộp Quà Mừng Cưới"
                  >
                    <div className="flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full">
                      <span>🎁</span>
                      <span>{modalTitle}</span>
                    </div>

                    {/* Khung Mã QR Chuẩn Napas 24/7 Thật */}
                    <div className="w-28 h-28 sm:w-32 sm:h-32 p-1.5 bg-white rounded-xl border-2 border-dashed border-amber-400/80 shadow-inner flex items-center justify-center my-1 group-hover:scale-105 transition-transform overflow-hidden">
                      {qrUrl ? (
                        <img
                          src={qrUrl}
                          alt="Mã VietQR Mừng Cưới"
                          onError={(e) => handleImageFallback(e, undefined, false)}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-xs text-gray-500">Chưa có thông tin tài khoản</span>
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-[11px] font-bold text-gray-800">
                        {bankName || ""} {accountNumber ? `• ${accountNumber}` : ""}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase font-semibold truncate max-w-[190px]">
                        {accountName || ""}
                      </p>
                    </div>

                    <span className="text-[10px] text-rose-600 font-bold group-hover:underline">
                      Chạm để mở STK Cô Dâu & Chú Rể ↗
                    </span>
                  </div>
                );
              })()}

              {/* RSVP Form Box */}
              {type === "RsvpBoxV2" && (
                <div className="w-full h-full p-4 sm:p-5 bg-white rounded-2xl border border-gray-100 shadow-md flex flex-col justify-between text-left">
                  {rsvpSent ? (
                    <div className="text-center py-6 space-y-2 animate-scale-up">
                      <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                      <h4 className="font-bold text-sm text-gray-800">Đã gửi xác nhận thành công!</h4>
                      <p className="text-xs text-gray-500">Hẹn gặp bạn trong ngày vui!</p>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!rsvpName.trim()) return;
                        weddingSounds.playCelebration();
                        setRsvpSent(true);
                        if (onRsvpSuccess) {
                          onRsvpSuccess({
                            name: rsvpName.trim(),
                            phone: rsvpPhone.trim(),
                            attending: rsvpAttending,
                            guests: rsvpAttending ? rsvpGuests : 0,
                          });
                        }
                      }}
                      className="space-y-2"
                    >
                      <h4 className="font-bold text-sm text-[#511419] font-serif">
                        {props.titleText || "Xác nhận tham dự"}
                      </h4>
                      <input
                        type="text"
                        required
                        placeholder="Họ và tên của bạn..."
                        value={rsvpName}
                        onChange={(e) => setRsvpName(e.target.value)}
                        className="w-full p-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-zen-primary"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                        type="tel"
                        required
                        placeholder="Số điện thoại..."
                          value={rsvpPhone}
                          onChange={(e) => setRsvpPhone(e.target.value)}
                          className="w-full p-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-zen-primary"
                        />
                        <select
                          value={rsvpGuests}
                          onChange={(e) => setRsvpGuests(Number(e.target.value))}
                          className="w-full p-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-zen-primary bg-white text-gray-700"
                        >
                          <option value={1}>1 người tham dự</option>
                          <option value={2}>2 người (+1 người thân)</option>
                          <option value={3}>3 người (+2 người thân)</option>
                          <option value={4}>4 người (Gia đình)</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            weddingSounds.playSoftClick();
                            setRsvpAttending(true);
                          }}
                          className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                            rsvpAttending
                              ? "bg-rose-50 text-zen-primary border-zen-primary shadow-2xs"
                              : "bg-gray-50 text-gray-600 border-gray-200"
                          }`}
                        >
                          🎉 Sẽ tham dự
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            weddingSounds.playSoftClick();
                            setRsvpAttending(false);
                          }}
                          className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                            !rsvpAttending
                              ? "bg-gray-200 text-gray-800 border-gray-400 shadow-2xs"
                              : "bg-gray-50 text-gray-600 border-gray-200"
                          }`}
                        >
                          💌 Tiếc quá bận
                        </button>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2 rounded-xl bg-zen-primary hover:bg-[#d93849] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <span>Gửi xác nhận</span>
                        <Send className="w-3 h-3" />
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Map Box (Hỗ trợ 6 giao diện bản đồ đa dạng) */}
              {type === "MapBox" && (() => {
                const variant = props.styleVariant || "minimal";
                const venueName = props.venueName || props.title || "Trung tâm Tiệc cưới";
                const address = props.address || "Hà Nội";
                const generatedMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venueName} ${address}`)}`;
                const mapUrl = getSafeMapUrl(props.mapUrl, generatedMapUrl);

                if (variant === "satellite_preview") {
                  const previewImg = props.previewImg || "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=600";
                  return (
                    <div className="w-full h-full rounded-2xl overflow-hidden border border-gray-200 bg-white/95 flex flex-col shadow-xs group">
                      <div className="relative w-full h-[55%] overflow-hidden bg-slate-100">
                        <img src={previewImg} alt="Bản đồ vị trí" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className="p-1.5 bg-red-600 text-white rounded-full shadow-lg animate-bounce">
                            <MapPin className="w-4 h-4" />
                          </div>
                        </div>
                        <span className="absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-xs">
                          Ảnh Vệ Tinh
                        </span>
                      </div>
                      <div className="flex-1 p-2 flex flex-col justify-between items-center text-center">
                        <div>
                          <h4 className="text-xs font-bold text-gray-900 font-serif line-clamp-1">{venueName}</h4>
                          <p className="text-[10px] text-gray-500 line-clamp-1">{address}</p>
                        </div>
                        <a
                          href={mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 text-white rounded-full text-[10px] font-bold shadow-xs pointer-events-auto"
                        >
                          <span>Mở Google Maps</span>
                          <span>↗</span>
                        </a>
                      </div>
                    </div>
                  );
                }

                if (variant === "dual_venue") {
                  const vGroom = props.venueNameGroom || "Tư gia Nhà Trai";
                  const aGroom = props.addressGroom || "Số 12 Phố Huế, Hoàn Kiếm";
                  const urlGroom = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${vGroom} ${aGroom}`)}`;
                  const vBride = props.venueNameBride || "Tư gia Nhà Gái";
                  const aBride = props.addressBride || "Số 45 Lê Lợi, Ba Đình";
                  const urlBride = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${vBride} ${aBride}`)}`;

                  return (
                    <div className="w-full h-full rounded-2xl border border-rose-200/80 bg-white/95 p-2.5 flex flex-col justify-between shadow-xs text-center select-none">
                      <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                        📍 Địa Điểm Hai Gia Đình
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] font-bold text-blue-700 uppercase bg-blue-50 px-1.5 py-0.5 rounded">Nhà Trai</span>
                            <p className="text-[11px] font-bold text-gray-900 mt-0.5 truncate">{vGroom}</p>
                            <p className="text-[9px] text-gray-500 line-clamp-2 mt-0.5">{aGroom}</p>
                          </div>
                          <a
                            href={urlGroom}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1.5 inline-flex items-center justify-center gap-0.5 py-1 px-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-bold pointer-events-auto"
                          >
                            Chỉ đường ↗
                          </a>
                        </div>

                        <div className="p-2 rounded-xl bg-rose-50/50 border border-rose-100 flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] font-bold text-rose-700 uppercase bg-rose-50 px-1.5 py-0.5 rounded">Nhà Gái</span>
                            <p className="text-[11px] font-bold text-gray-900 mt-0.5 truncate">{vBride}</p>
                            <p className="text-[9px] text-gray-500 line-clamp-2 mt-0.5">{aBride}</p>
                          </div>
                          <a
                            href={urlBride}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1.5 inline-flex items-center justify-center gap-0.5 py-1 px-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-bold pointer-events-auto"
                          >
                            Chỉ đường ↗
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (variant === "qr_nav") {
                  const qrMapUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mapUrl)}`;
                  return (
                    <div className="w-full h-full rounded-2xl border border-gray-200 bg-white/95 p-3 flex items-center justify-between gap-3 shadow-xs select-none">
                      <div className="flex-1 flex flex-col justify-between h-full text-left">
                        <div>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-rose-700 uppercase">
                            <MapPin className="w-3.5 h-3.5 text-rose-600" />
                            <span>Chỉ Đường Thông Minh</span>
                          </div>
                          <h4 className="text-xs font-bold text-gray-900 font-serif mt-1">{venueName}</h4>
                          <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5">{address}</p>
                        </div>
                        <div className="pt-2">
                          <a
                            href={mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold shadow-xs pointer-events-auto"
                          >
                            Mở Google Maps ↗
                          </a>
                        </div>
                      </div>
                      <div className="w-24 h-24 rounded-xl border border-gray-200 p-1.5 bg-white flex flex-col items-center justify-center shrink-0 shadow-inner">
                        <img src={qrMapUrl} alt="QR Chỉ đường" className="w-full h-full object-contain" />
                        <span className="text-[8px] text-gray-400 mt-0.5">Quét bằng camera</span>
                      </div>
                    </div>
                  );
                }

                if (variant === "royal_gold") {
                  return (
                    <div className="w-full h-full rounded-2xl border-2 border-amber-400/80 bg-gradient-to-b from-amber-50/50 via-white to-amber-50/30 p-3 flex flex-col items-center justify-between text-center shadow-md relative overflow-hidden select-none">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 text-amber-950 flex items-center justify-center shadow-xs">
                          <MapPin className="w-3.5 h-3.5 text-amber-900" />
                        </div>
                        <h4 className="text-xs font-bold text-amber-950 font-serif uppercase tracking-wider">{venueName}</h4>
                        <p className="text-[10px] text-amber-900/80 line-clamp-2 max-w-[280px]">{address}</p>
                      </div>
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3.5 py-1 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:brightness-110 text-white rounded-full text-[10px] font-bold shadow-xs pointer-events-auto transition-all"
                      >
                        <span>CHỈ ĐƯỜNG ĐẾN HÔN LỄ</span>
                        <span>↗</span>
                      </a>
                    </div>
                  );
                }

                if (variant === "roadmap_card") {
                  const parkingNote = props.parkingNote || "Có bãi đỗ xe ô tô & xe máy miễn phí";
                  return (
                    <div className="w-full h-full rounded-2xl border border-slate-200 bg-white/95 p-3 flex flex-col justify-between shadow-xs text-left select-none">
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                            <MapPin className="w-4 h-4 text-red-500" />
                            <span>{venueName}</span>
                          </div>
                          <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Chỉ dẫn đỗ xe
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-600 mt-1 line-clamp-2">{address}</p>
                        <div className="mt-1.5 p-1.5 rounded-lg bg-slate-50 border border-slate-100 text-[10px] text-slate-600 flex items-center gap-1.5">
                          <span>🚗</span>
                          <span className="truncate">{parkingNote}</span>
                        </div>
                      </div>
                      <div className="pt-1 flex items-center justify-end">
                        <a
                          href={mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[9px] font-bold pointer-events-auto transition-colors"
                        >
                          <span>Mở Google Maps</span>
                          <span>↗</span>
                        </a>
                      </div>
                    </div>
                  );
                }

                if (variant === "handdrawn") {
                  return (
                    <div className="w-full h-full rounded-2xl border-2 border-dashed border-[#8c6d46]/70 bg-[#faf6ee] p-3 flex flex-col justify-between text-center shadow-xs select-none relative overflow-hidden">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-7 h-7 rounded-full bg-[#f0e6d2] border border-[#8c6d46]/50 text-[#6a4f2e] flex items-center justify-center shadow-2xs">
                          <MapPin className="w-4 h-4 text-[#8c6d46]" />
                        </div>
                        <span className="text-[9px] font-serif uppercase tracking-widest text-[#8c6d46]">Sơ Đồ Hướng Dẫn</span>
                        <h4 className="text-xs font-bold text-[#4a3520] font-serif">{venueName}</h4>
                        <p className="text-[10px] text-[#7a6245] italic line-clamp-2 max-w-[280px]">{address}</p>
                      </div>
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-[#6a4f2e] hover:bg-[#533d23] text-[#faf6ee] rounded-full text-[10px] font-bold shadow-xs pointer-events-auto transition-all"
                      >
                        <span>Xem bản đồ dẫn đường</span>
                        <span>↗</span>
                      </a>
                    </div>
                  );
                }

                if (variant === "darkmode") {
                  return (
                    <div className="w-full h-full rounded-2xl border border-amber-500/40 bg-zinc-950 text-white p-3 flex flex-col justify-between text-center shadow-xl select-none relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-black/60 pointer-events-none" />
                      <div className="relative z-10 flex flex-col items-center gap-1">
                        <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-400/60 text-amber-300 flex items-center justify-center shadow-inner">
                          <MapPin className="w-4 h-4 text-amber-400" />
                        </div>
                        <span className="text-[9px] font-mono tracking-widest text-amber-400 uppercase">Luxury Night Venue</span>
                        <h4 className="text-xs font-bold text-amber-100 font-serif tracking-wide">{venueName}</h4>
                        <p className="text-[10px] text-zinc-400 line-clamp-2 max-w-[280px]">{address}</p>
                      </div>
                      <div className="relative z-10 pt-1">
                        <a
                          href={mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1 px-4 py-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 text-zinc-950 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg pointer-events-auto transition-all"
                        >
                          <span>Dẫn Đường Google Maps</span>
                          <span>↗</span>
                        </a>
                      </div>
                    </div>
                  );
                }

                // Default: Minimal 1-touch card
                return (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-full rounded-2xl overflow-hidden border border-gray-200 bg-white/95 flex flex-col items-center justify-between text-center p-3 hover:bg-gray-50 transition-colors block shadow-xs"
                  >
                    <div className="flex flex-col items-center gap-1 text-gray-700">
                      <MapPin className="w-5 h-5 text-red-500 animate-pulse" />
                      <span className="text-xs font-bold text-gray-900 font-serif line-clamp-1">{venueName}</span>
                      <span className="text-[11px] text-gray-600 line-clamp-2 max-w-[280px]">{address}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-full text-[10px] font-bold shadow-xs transition-colors mt-1">
                      <span>Chỉ đường Google Maps</span>
                      <span>↗</span>
                    </span>
                  </a>
                );
              })()}
            </CardScrollAnimatedNode>
          );
        })}
      </div>
    </div>
  );
}
