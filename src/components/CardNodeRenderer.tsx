"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  MapPin,
  Heart,
  Send,
  Sparkles,
  CheckCircle,
} from "lucide-react";

interface CardNodeRendererProps {
  nodes: Record<string, any>;
  onRsvpSuccess?: (rsvpData: any) => void;
  onOpenGiftQr?: () => void;
}

export default function CardNodeRenderer({
  nodes,
  onRsvpSuccess,
  onOpenGiftQr,
}: CardNodeRendererProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [rsvpSent, setRsvpSent] = useState(false);
  const [rsvpName, setRsvpName] = useState("");
  const [rsvpAttending, setRsvpAttending] = useState(true);

  const rootNode = nodes["ROOT"] || {};
  const rootProps = rootNode.props || {};

  const baseWidth = Number(rootProps.width) || 500;
  const baseHeight = Number(rootProps.height) || 4500;
  const backgroundColor = rootProps.backgroundColor || "#ffffff";
  const backgroundImage = rootProps.backgroundImage
    ? `https://cdn-resource.zenlove.me/${rootProps.backgroundImage.replace(/^\//, "")}`
    : null;

  // Responsive scale factor calculation to fit any mobile viewport perfectly
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const parentWidth = containerRef.current.parentElement?.clientWidth || window.innerWidth;
      const targetWidth = Math.min(parentWidth, 500);
      setScale(targetWidth / baseWidth);
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
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

  const getImageUrl = (key?: string) => {
    if (!key) return "";
    if (key.startsWith("http") || key.startsWith("blob:")) return key;
    return `https://cdn-resource.zenlove.me/${key.replace(/^\//, "")}`;
  };

  return (
    <div
      ref={containerRef}
      className="w-full flex justify-center overflow-hidden"
      style={{
        height: `${baseHeight * scale}px`,
      }}
    >
      <div
        className="relative origin-top transition-transform duration-150"
        style={{
          width: `${baseWidth}px`,
          height: `${baseHeight}px`,
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
          }

          return (
            <div
              key={id}
              className="absolute pointer-events-auto"
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
              {/* Photo Box */}
              {type === "PhotoBox" && props.imgKey && (
                <div
                  className={`w-full h-full overflow-hidden ${animClass}`}
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
                    className="w-full h-full object-cover select-none pointer-events-none"
                    style={{
                      filter: props.filterStyle || undefined,
                    }}
                    draggable={false}
                  />
                </div>
              )}

              {/* Text Box */}
              {type === "TextBox" && (
                <div
                  className={`w-full h-full select-none ${animClass} ${
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
                  dangerouslySetInnerHTML={{ __html: props.text || "" }}
                />
              )}

              {/* Geometric Box (Card panels, colored backgrounds) */}
              {type === "GeometricBox" && (
                <div
                  className={`w-full h-full ${animClass}`}
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
                  className={`w-full h-full overflow-hidden relative shadow-lg ${animClass}`}
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
              {type === "CountdownBoxV2" && (
                <div className="w-full h-full flex items-center justify-around p-3 bg-white/30 backdrop-blur-xs rounded-2xl border border-stone-200/50 text-center shadow-xs">
                  {[
                    { val: "28", label: "Ngày" },
                    { val: "14", label: "Giờ" },
                    { val: "36", label: "Phút" },
                    { val: "50", label: "Giây" },
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <span className="text-xl sm:text-2xl font-black font-serif text-[#590310]">
                        {item.val}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-gray-600">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Calendar Box */}
              {type === "CalendarBoxV2" && (
                <div className="w-full h-full p-4 rounded-3xl bg-amber-50/50 border border-amber-200/50 flex flex-col justify-center items-center text-center shadow-xs">
                  <span className="text-xs uppercase font-bold text-[#590310] tracking-widest">
                    Tháng 12 • 2026
                  </span>
                  <div className="text-4xl font-serif font-black text-[#590310] my-2">
                    29
                  </div>
                  <span className="text-xs text-gray-700">Thứ Ba • 16:30</span>
                </div>
              )}

              {/* Reminder Box */}
              {type === "ReminderBox" && (
                <button
                  type="button"
                  onClick={() => {
                    const title = encodeURIComponent("Đám cưới hạnh phúc");
                    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}`, "_blank");
                  }}
                  className="w-full h-full rounded-full bg-[#ece4d8] hover:bg-[#dfd4c4] text-[#590310] flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs gap-2 transition-colors cursor-pointer"
                >
                  <CalendarIcon className="w-4 h-4 text-[#590310]" />
                  <span>{props.text || "Thêm vào lịch"}</span>
                </button>
              )}

              {/* Gift QR Box */}
              {type === "GiftQrBox" && (
                <div
                  onClick={onOpenGiftQr}
                  className="w-full h-full flex flex-col items-center justify-center p-3 text-center cursor-pointer group"
                >
                  {props.imgKey && (
                    <img
                      src={getImageUrl(props.imgKey)}
                      alt="Gift"
                      className="w-20 h-20 object-contain group-hover:scale-105 transition-transform"
                    />
                  )}
                  <span className="text-xs font-bold text-[#590310] mt-1 group-hover:underline">
                    {props.modalTitle || "Hộp Quà Mừng Cưới"}
                  </span>
                </div>
              )}

              {/* RSVP Form Box */}
              {type === "RsvpBoxV2" && (
                <div className="w-full h-full p-4 sm:p-5 bg-white rounded-2xl border border-gray-100 shadow-md flex flex-col justify-between text-left">
                  {rsvpSent ? (
                    <div className="text-center py-6 space-y-2">
                      <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                      <h4 className="font-bold text-sm text-gray-800">Đã gửi xác nhận thành công!</h4>
                      <p className="text-xs text-gray-500">Hẹn gặp bạn trong ngày vui!</p>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!rsvpName.trim()) return;
                        setRsvpSent(true);
                        if (onRsvpSuccess) {
                          onRsvpSuccess({ name: rsvpName, attending: rsvpAttending });
                        }
                      }}
                      className="space-y-2.5"
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
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setRsvpAttending(true)}
                          className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold ${
                            rsvpAttending
                              ? "bg-rose-50 text-zen-primary border-zen-primary"
                              : "bg-gray-50 text-gray-600 border-gray-200"
                          }`}
                        >
                          🎉 Sẽ tham dự
                        </button>
                        <button
                          type="button"
                          onClick={() => setRsvpAttending(false)}
                          className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold ${
                            !rsvpAttending
                              ? "bg-gray-200 text-gray-800 border-gray-400"
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

              {/* Map Box */}
              {type === "MapBox" && (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(props.address || "Hà Nội")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-full rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center text-center p-3 hover:bg-gray-200 transition-colors block"
                >
                  <div className="flex flex-col items-center gap-1 text-gray-700">
                    <MapPin className="w-5 h-5 text-zen-primary" />
                    <span className="text-xs font-bold">{props.title || "Chỉ đường tới tiệc cưới"}</span>
                    <span className="text-[10px] text-gray-500 truncate max-w-[200px]">{props.address || "Xem trên Google Maps"}</span>
                  </div>
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
