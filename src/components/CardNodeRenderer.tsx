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

import {
  handleImageFallback,
  getSafeImageUrl,
  isDecorativeAsset,
  FALLBACK_WEDDING_IMG,
  DEFAULT_WEDDING_BACKGROUND,
} from "@/lib/imageUtils";
import { weddingSounds } from "@/lib/soundEffects";
import { calculateCountdown, formatCalendarData, getModuleRenderHtml, getSafeMapUrl, getGiftQrUrl } from "@/lib/moduleHelpers";

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

  // Tự động tính toán chiều cao an toàn dựa trên phần tử ở đáy thấp nhất
  const maxChildBottom = childNodes.reduce((max, child) => {
    const top = Number(child.props?.top ?? 0);
    const rawH = child.props?.height;
    const height = typeof rawH === "number" ? rawH : parseFloat(rawH) || 120;
    return Math.max(max, top + height);
  }, 0);

  const effectiveBaseHeight = Math.max(
    Number(rootProps.height || 0),
    maxChildBottom + 160,
    1400
  );

  const getImageUrl = (key?: string) => {
    return getSafeImageUrl(key, "");
  };

  return (
    <div
      ref={containerRef}
      className="w-full flex justify-center overflow-hidden"
      style={{
        height: `${effectiveBaseHeight * scale}px`,
      }}
    >
      <div
        className="relative origin-top transition-transform duration-150"
        style={{
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
                  dangerouslySetInnerHTML={{ __html: getModuleRenderHtml(type, props) }}
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
                return (
                  <div className="w-full h-full flex items-center justify-around p-3 bg-white/30 backdrop-blur-xs rounded-2xl border border-stone-200/50 text-center shadow-xs">
                    {[
                      { val: String(cd.days).padStart(2, "0"), label: "Ngày" },
                      { val: String(cd.hours).padStart(2, "0"), label: "Giờ" },
                      { val: String(cd.minutes).padStart(2, "0"), label: "Phút" },
                      { val: String(cd.seconds).padStart(2, "0"), label: "Giây" },
                    ].map((item, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <span
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

              {/* Gift QR Box - Hiển thị mã VietQR thật 100% */}
              {type === "GiftQrBox" && (() => {
                const qrUrl = getGiftQrUrl(props);

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
                      <span>{props.modalTitle || "Hộp Quà Mừng Cưới (VietQR)"}</span>
                    </div>

                    {/* Khung Mã QR Chuẩn Napas 24/7 Thật */}
                    <div className="w-28 h-28 sm:w-32 sm:h-32 p-1.5 bg-white rounded-xl border-2 border-dashed border-amber-400/80 shadow-inner flex items-center justify-center my-1 group-hover:scale-105 transition-transform overflow-hidden">
                      {qrUrl ? <img
                        src={qrUrl}
                        alt="Mã VietQR Mừng Cưới"
                        onError={(e) => handleImageFallback(e, undefined, false)}
                        className="w-full h-full object-contain"
                      /> : <span className="text-xs text-gray-500">Chưa có thông tin tài khoản</span>}
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-[11px] font-bold text-gray-800">
                        {props.bankName || ""} {props.accountNumber ? `• ${props.accountNumber}` : ""}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase font-semibold truncate max-w-[190px]">
                        {props.accountName || ""}
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

              {/* Map Box */}
              {type === "MapBox" && (() => {
                const venueName = props.venueName || props.title || "Trung tâm Tiệc cưới";
                const address = props.address || "Hà Nội";
                const generatedMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venueName} ${address}`)}`;
                const mapUrl = getSafeMapUrl(props.mapUrl, generatedMapUrl);
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
