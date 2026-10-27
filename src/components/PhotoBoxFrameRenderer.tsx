"use client";

import React from "react";
import { handleImageFallback, FALLBACK_WEDDING_IMG, isDecorativeAsset } from "@/lib/imageUtils";

export interface PhotoBoxFrameProps {
  props: Record<string, any>;
  getImageUrl: (key: string) => string;
  isEditor?: boolean;
}

export default function PhotoBoxFrameRenderer({
  props,
  getImageUrl,
  isEditor = false,
}: PhotoBoxFrameProps) {
  const frameType = props.frameType || "default";
  const imgUrl = getImageUrl(props.imgKey || props.src || "");
  const alt = props.alt || "Ảnh cưới";

  const onImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    handleImageFallback(
      e,
      FALLBACK_WEDDING_IMG,
      !props.isReplaceable || isDecorativeAsset(props.imgKey)
    );
  };

  const flipTransform = `scaleX(${props.flipX ? -1 : 1}) scaleY(${props.flipY ? -1 : 1})`;

  // 1. POLAROID FRAME (Khung Polaroid Cổ Điển)
  if (frameType === "polaroid") {
    return (
      <div
        className="w-full h-full bg-white shadow-xl flex flex-col p-2.5 pb-7 sm:pb-8 transition-transform select-none"
        style={{
          borderRadius: "8px",
          boxShadow:
            props.hasBoxShadow && props.boxShadow
              ? `${props.boxShadow.offsetX || 0}px ${props.boxShadow.offsetY || 10}px ${props.boxShadow.blur || 20}px ${props.boxShadow.color || "rgba(0,0,0,0.18)"}`
              : "0 10px 25px -3px rgba(0, 0, 0, 0.18), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
          border: "1px solid rgba(0,0,0,0.08)",
          transform: flipTransform,
        }}
      >
        <div className="flex-1 w-full overflow-hidden rounded-[3px] bg-stone-100 relative shadow-inner">
          <img
            src={imgUrl}
            alt={alt}
            onError={onImgError}
            className="w-full h-full object-cover select-none pointer-events-none"
            style={{ filter: props.filterStyle || undefined }}
            draggable={false}
          />
        </div>
        <div className="h-5 mt-1.5 flex items-center justify-center text-center">
          <span className="font-serif italic text-gray-500 text-[11px] tracking-wide truncate px-1">
            {props.captionText || "Sweet Memories • Forever"}
          </span>
        </div>
      </div>
    );
  }

  // 2. FILM STRIP FRAME (Khung Dải Phim 35mm Điện Ảnh)
  if (frameType === "film") {
    return (
      <div
        className="w-full h-full bg-[#141210] shadow-2xl flex flex-col p-1.5 rounded-lg overflow-hidden select-none"
        style={{
          boxShadow:
            props.hasBoxShadow && props.boxShadow
              ? `${props.boxShadow.offsetX || 0}px ${props.boxShadow.offsetY || 8}px ${props.boxShadow.blur || 20}px ${props.boxShadow.color || "rgba(0,0,0,0.35)"}`
              : "0 12px 28px rgba(0,0,0,0.35)",
          transform: flipTransform,
        }}
      >
        {/* Top film sprocket holes */}
        <div className="h-3.5 flex items-center justify-between px-2 bg-black/70 rounded-t-xs">
          {[...Array(6)].map((_, i) => (
            <span key={i} className="w-2.5 h-1.5 bg-white/70 rounded-[1px] shadow-inner" />
          ))}
        </div>
        {/* Photo area */}
        <div className="flex-1 w-full overflow-hidden my-1 bg-black relative">
          <img
            src={imgUrl}
            alt={alt}
            onError={onImgError}
            className="w-full h-full object-cover select-none pointer-events-none"
            style={{ filter: props.filterStyle || undefined }}
            draggable={false}
          />
        </div>
        {/* Bottom film sprocket holes with camera roll text */}
        <div className="h-3.5 flex items-center justify-between px-2 bg-black/70 rounded-b-xs">
          {[...Array(6)].map((_, i) => (
            <span key={i} className="w-2.5 h-1.5 bg-white/70 rounded-[1px] shadow-inner" />
          ))}
        </div>
      </div>
    );
  }

  // 3. POSTAGE STAMP FRAME (Khung Tem Thư Scalloped Bưu Thiếp)
  if (frameType === "stamp") {
    return (
      <div
        className="w-full h-full bg-[#faf7f2] p-2 shadow-lg flex flex-col rounded-xs select-none"
        style={{
          border: props.borderSize
            ? `${props.borderSize}px dashed ${props.borderColor || "#e2d5c3"}`
            : "6px dashed #e2d5c3",
          boxShadow: "0 8px 20px rgba(100,70,40,0.15)",
          transform: flipTransform,
        }}
      >
        <div className="flex-1 w-full overflow-hidden rounded-[2px] bg-stone-100 relative">
          <img
            src={imgUrl}
            alt={alt}
            onError={onImgError}
            className="w-full h-full object-cover select-none pointer-events-none"
            style={{ filter: props.filterStyle || undefined }}
            draggable={false}
          />
        </div>
      </div>
    );
  }

  // 4. OCTAGON DIAMOND FRAME (Khung Bát Giác Kim Cương)
  if (frameType === "octagon") {
    return (
      <div
        className="w-full h-full overflow-hidden select-none"
        style={{
          clipPath:
            "polygon(22% 0%, 78% 0%, 100% 22%, 100% 78%, 78% 100%, 22% 100%, 0% 78%, 0% 22%)",
          border: props.borderSize
            ? `${props.borderSize}px ${props.borderStyle || "solid"} ${props.borderColor || "#b48c36"}`
            : "3px solid #b48c36",
          boxShadow: "0 8px 22px rgba(180, 140, 54, 0.25)",
          transform: flipTransform,
        }}
      >
        <img
          src={imgUrl}
          alt={alt}
          onError={onImgError}
          className="w-full h-full object-cover select-none pointer-events-none"
          style={{ filter: props.filterStyle || undefined }}
          draggable={false}
        />
      </div>
    );
  }

  // 5. ARCH GATE FRAME (Khung Cổng Vòm Lễ Đường)
  if (frameType === "arch") {
    const rawR = props.borderRadius;
    const archRadius = Array.isArray(rawR)
      ? `${rawR[0]}px ${rawR[1]}px ${rawR[2]}px ${rawR[3]}px`
      : "160px 160px 16px 16px";

    return (
      <div
        className="w-full h-full overflow-hidden select-none"
        style={{
          borderRadius: archRadius,
          border: props.borderSize
            ? `${props.borderSize}px ${props.borderStyle || "solid"} ${props.borderColor || "#d4af37"}`
            : "3px solid #d4af37",
          boxShadow:
            props.hasBoxShadow && props.boxShadow
              ? `${props.boxShadow.offsetX || 0}px ${props.boxShadow.offsetY || 8}px ${props.boxShadow.blur || 24}px ${props.boxShadow.color || "rgba(212, 175, 55, 0.25)"}`
              : "0 8px 24px rgba(212, 175, 55, 0.25)",
          transform: flipTransform,
        }}
      >
        <img
          src={imgUrl}
          alt={alt}
          onError={onImgError}
          className="w-full h-full object-cover select-none pointer-events-none"
          style={{ filter: props.filterStyle || undefined }}
          draggable={false}
        />
      </div>
    );
  }

  // 6. CIRCLE WREATH FRAME (Khung Tròn Nguyệt Quế Hoàng Gia)
  if (frameType === "circle_wreath") {
    return (
      <div
        className="w-full h-full overflow-hidden rounded-full select-none"
        style={{
          border: props.borderSize
            ? `${props.borderSize}px ${props.borderStyle || "double"} ${props.borderColor || "#d4af37"}`
            : "4px double #d4af37",
          boxShadow: "0 6px 20px rgba(212, 175, 55, 0.3)",
          transform: flipTransform,
        }}
      >
        <img
          src={imgUrl}
          alt={alt}
          onError={onImgError}
          className="w-full h-full object-cover select-none pointer-events-none"
          style={{ filter: props.filterStyle || undefined }}
          draggable={false}
        />
      </div>
    );
  }

  // 7. CAMEO OVAL FRAME (Khung Oval Quý Tộc Châu Âu)
  if (frameType === "cameo_oval") {
    return (
      <div
        className="w-full h-full overflow-hidden select-none"
        style={{
          borderRadius: "50% / 50%",
          border: props.borderSize
            ? `${props.borderSize}px ${props.borderStyle || "solid"} ${props.borderColor || "#c5a059"}`
            : "4px solid #c5a059",
          boxShadow: "0 8px 24px rgba(197, 160, 89, 0.25)",
          transform: flipTransform,
        }}
      >
        <img
          src={imgUrl}
          alt={alt}
          onError={onImgError}
          className="w-full h-full object-cover select-none pointer-events-none"
          style={{ filter: props.filterStyle || undefined }}
          draggable={false}
        />
      </div>
    );
  }

  // 8. ROMANTIC HEART FRAME (Khung Trái Tim Hạnh Phúc)
  if (frameType === "heart") {
    const rawR = props.borderRadius;
    const heartRadius = Array.isArray(rawR)
      ? `${rawR[0]}px ${rawR[1]}px ${rawR[2]}px ${rawR[3]}px`
      : "165px 165px 40px 40px";

    return (
      <div
        className="w-full h-full overflow-hidden select-none"
        style={{
          borderRadius: heartRadius,
          border: props.borderSize
            ? `${props.borderSize}px ${props.borderStyle || "solid"} ${props.borderColor || "#e54153"}`
            : "3px solid #e54153",
          boxShadow: "0 8px 20px rgba(229, 65, 83, 0.25)",
          transform: flipTransform,
        }}
      >
        <img
          src={imgUrl}
          alt={alt}
          onError={onImgError}
          className="w-full h-full object-cover select-none pointer-events-none"
          style={{ filter: props.filterStyle || undefined }}
          draggable={false}
        />
      </div>
    );
  }

  // 9. DEFAULT / DOUBLE CHIC / CUSTOM ROUNDED FRAME
  const radius = props.borderRadius
    ? Array.isArray(props.borderRadius)
      ? `${props.borderRadius[0]}px ${props.borderRadius[1]}px ${props.borderRadius[2]}px ${props.borderRadius[3]}px`
      : `${props.borderRadius}px`
    : "0px";

  return (
    <div
      className="w-full h-full overflow-hidden select-none"
      style={{
        borderRadius: radius,
        border: props.borderSize
          ? `${props.borderSize}px ${props.borderStyle || "solid"} ${props.borderColor || "#ffffff"}`
          : undefined,
        boxShadow: props.hasBoxShadow
          ? `${props.boxShadow?.offsetX || 0}px ${props.boxShadow?.offsetY || 4}px ${props.boxShadow?.blur || 10}px ${props.boxShadow?.color || "rgba(0,0,0,0.15)"}`
          : undefined,
        transform: flipTransform,
      }}
    >
      <img
        src={imgUrl}
        alt={alt}
        onError={onImgError}
        className="w-full h-full object-cover pointer-events-none select-none transition-all duration-300"
        style={{ filter: props.filterStyle || undefined }}
        draggable={false}
      />
    </div>
  );
}
