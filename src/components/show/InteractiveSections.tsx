"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  Heart,
  Download,
  ExternalLink,
  Sparkles,
  Coffee,
  Gem,
  Church,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  X as CloseIcon,
} from "lucide-react";
import {
  generateGoogleCalendarUrl,
  downloadIcsFile,
  CalendarEventDetails,
} from "@/lib/calendarHelper";

/* =========================================================
   1. WEDDING CALENDAR CARD (LỊCH CƯỚI & ADD-TO-CALENDAR)
   ========================================================= */

interface WeddingCalendarCardProps {
  weddingDate?: string; // YYYY-MM-DD or DD/MM/YYYY
  weddingTime?: string; // HH:mm
  title?: string;
  venue?: string;
  themeStyle?: "luxury" | "traditional" | "pastel" | "default";
}

export function WeddingCalendarCard({
  weddingDate = "2026-11-20",
  weddingTime = "18:00",
  title = "Lễ Thành Hôn",
  venue = "Trung tâm tiệc cưới",
  themeStyle = "luxury",
}: WeddingCalendarCardProps) {
  // Parse date
  const parseDate = () => {
    if (!weddingDate) return { day: 20, month: 11, year: 2026 };
    if (weddingDate.includes("-")) {
      const parts = weddingDate.split("-");
      return {
        year: parseInt(parts[0], 10) || 2026,
        month: parseInt(parts[1], 10) || 11,
        day: parseInt(parts[2], 10) || 20,
      };
    }
    if (weddingDate.includes("/")) {
      const parts = weddingDate.split("/");
      return {
        day: parseInt(parts[0], 10) || 20,
        month: parseInt(parts[1], 10) || 11,
        year: parseInt(parts[2], 10) || 2026,
      };
    }
    return { day: 20, month: 11, year: 2026 };
  };

  const { day: targetDay, month: targetMonth, year: targetYear } = parseDate();

  // Calculate calendar grid for the target month
  const firstDayOfMonth = new Date(targetYear, targetMonth - 1, 1).getDay(); // 0 is Sun
  const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();

  // Shift to Mon = 0, Sun = 6
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }

  const eventDetails: CalendarEventDetails = {
    title: title || "Lễ Cưới Trọng Đại",
    description: `Trân trọng kính mời quý khách đến chung vui tại ${venue}!`,
    location: venue,
    startDate: `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`,
    startTime: weddingTime,
    durationHours: 4,
  };

  const handleGoogleCalendar = () => {
    const url = generateGoogleCalendarUrl(eventDetails);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDownloadIcs = () => {
    downloadIcsFile(eventDetails, `thiep-cuoi-${targetDay}-${targetMonth}-${targetYear}.ics`);
  };

  return (
    <div className="w-full max-w-md mx-auto my-6 p-6 rounded-3xl bg-white/95 backdrop-blur-md border border-amber-200/80 shadow-xl text-center relative overflow-hidden group">
      {/* Background soft ornamentation */}
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-rose-100/50 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-amber-100/50 blur-2xl pointer-events-none" />

      {/* Header Month / Year */}
      <div className="mb-4">
        <span className="text-[10px] tracking-widest uppercase font-serif text-amber-800 font-bold block">
          SAVE THE DATE
        </span>
        <h3 className="text-xl font-bold font-serif text-gray-900 mt-1">
          Tháng {targetMonth} / {targetYear}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {weddingTime ? `Thời gian: ${weddingTime}` : ""} • {venue}
        </p>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 text-[11px] font-semibold text-gray-400 mb-2 border-b border-gray-100 pb-2">
        <span>T2</span>
        <span>T3</span>
        <span>T4</span>
        <span>T5</span>
        <span>T6</span>
        <span>T7</span>
        <span className="text-rose-500">CN</span>
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-sm font-medium">
        {daysArray.map((dayNum, idx) => {
          if (dayNum === null) {
            return <div key={`empty-${idx}`} className="h-9" />;
          }

          const isTarget = dayNum === targetDay;

          return (
            <div
              key={`day-${dayNum}`}
              className={`h-9 flex items-center justify-center relative rounded-full transition-all ${
                isTarget
                  ? "bg-gradient-to-br from-rose-500 via-rose-600 to-amber-700 text-white font-bold shadow-md scale-105 z-10 animate-pulse"
                  : "text-gray-700 hover:bg-gray-100/70"
              }`}
            >
              <span>{dayNum}</span>
              {isTarget && (
                <span className="absolute -top-1.5 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 text-[8px] text-amber-950 shadow-xs">
                  ♥
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons to Add into Calendar */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={handleGoogleCalendar}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white text-xs font-bold shadow-md shadow-rose-900/10 flex items-center justify-center gap-1.5 transition-all hover:scale-102 active:scale-98 cursor-pointer"
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>Thêm vào Google Calendar</span>
          <ExternalLink className="w-3 h-3 opacity-80" />
        </button>

        <button
          type="button"
          onClick={handleDownloadIcs}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all hover:scale-102 active:scale-98 cursor-pointer"
          title="Tải file .ics cho Apple Calendar / Outlook"
        >
          <Download className="w-3.5 h-3.5 text-gray-500" />
          <span>Lưu vào máy (.ics)</span>
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   2. LOVE STORY TIMELINE (DÒNG THỜI GIAN TÌNH YÊU)
   ========================================================= */

export interface LoveStoryItem {
  id?: string;
  date: string;
  title: string;
  description: string;
  imageUrl?: string;
}

interface LoveStoryTimelineProps {
  items?: LoveStoryItem[];
  themeStyle?: "luxury" | "traditional" | "pastel" | "default";
}

const DEFAULT_LOVE_STORY: LoveStoryItem[] = [
  {
    id: "step1",
    date: "14 / 02 / 2021",
    title: "Lần Đầu Gặp Gỡ",
    description: "Một buổi chiều mưa bất chợt tại quán cafe nhỏ, ánh mắt chạm nhau mở ra câu chuyện của hai tâm hồn.",
    imageUrl: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "step2",
    date: "20 / 10 / 2022",
    title: "Lời Hẹn Ước Đầu Tiên",
    description: "Dưới ánh đèn lung linh của thành phố, chúng ta chính thức nắm tay nhau bước vào chặng đường hẹn hò ngọt ngào.",
    imageUrl: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "step3",
    date: "24 / 12 / 2024",
    title: "Khoảnh Khắc Cầu Hôn",
    description: "Bên bờ biển lúc hoàng hôn buông xuống, chiếc nhẫn trao tay cùng giọt nước mắt hạnh phúc: 'Em đồng ý!'.",
    imageUrl: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "step4",
    date: "Chung Đôi Mãi Mãi",
    title: "Ngày Chung Đôi",
    description: "Trước sự chứng kiến của gia đình và bạn bè, chúng ta trao nhau lời thề nguyện đồng hành suốt cuộc đời.",
    imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600&auto=format&fit=crop",
  },
];

export function LoveStoryTimeline({
  items = DEFAULT_LOVE_STORY,
}: LoveStoryTimelineProps) {
  const storyList = items && items.length > 0 ? items : DEFAULT_LOVE_STORY;

  const getStepIcon = (index: number) => {
    switch (index % 4) {
      case 0:
        return <Coffee className="w-4 h-4 text-amber-600" />;
      case 1:
        return <Sparkles className="w-4 h-4 text-rose-500" />;
      case 2:
        return <Gem className="w-4 h-4 text-purple-600" />;
      default:
        return <Church className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-10 px-4">
      <div className="text-center mb-8">
        <span className="text-[10px] tracking-widest uppercase font-serif text-amber-800 font-bold block">
          OUR LOVE STORY
        </span>
        <h3 className="text-2xl font-great-vibes text-amber-900 mt-1">
          Chuyện Tình Yêu Của Chúng Mình
        </h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
          Từng khoảnh khắc đẹp đẽ đã vun đắp nên tình yêu bền chặt hôm nay
        </p>
      </div>

      {/* Timeline track */}
      <div className="relative border-l-2 border-amber-300/60 ml-4 sm:ml-32 space-y-8">
        {storyList.map((item, idx) => (
          <div key={item.id || `story-${idx}`} className="relative pl-6 sm:pl-8 group">
            {/* Timeline icon node */}
            <div className="absolute -left-[17px] top-1.5 w-8 h-8 rounded-full bg-white border-2 border-amber-400 shadow-md flex items-center justify-center group-hover:scale-110 transition-transform">
              {getStepIcon(idx)}
            </div>

            {/* Date Tag */}
            <div className="sm:absolute sm:-left-32 sm:top-2 sm:w-24 sm:text-right mb-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-100/80 border border-amber-300 text-[10px] font-bold text-amber-900">
                {item.date}
              </span>
            </div>

            {/* Card Content */}
            <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-xs border border-amber-200/60 shadow-md hover:shadow-lg transition-all group-hover:-translate-y-0.5">
              <h4 className="text-base font-bold font-serif text-gray-800">{item.title}</h4>
              <p className="text-xs text-gray-600 leading-relaxed mt-1">{item.description}</p>
              {item.imageUrl && (
                <div className="mt-3 overflow-hidden rounded-xl border border-gray-100">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-36 object-cover hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   3. POLAROID & WASHI-TAPE PHOTO GALLERY (ALBUM ẢNH CỔ ĐIỂN)
   ========================================================= */

interface PolaroidGalleryProps {
  photos: string[];
  onPhotoClick?: (index: number) => void;
}

export function PolaroidGallery({ photos, onPhotoClick }: PolaroidGalleryProps) {
  if (!photos || photos.length === 0) return null;

  // Alternate slight tilts for charming scrapbook look
  const tilts = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2", "-rotate-2", "rotate-1"];

  return (
    <div className="w-full max-w-4xl mx-auto my-10 px-4">
      <div className="text-center mb-8">
        <span className="text-[10px] tracking-widest uppercase font-serif text-amber-800 font-bold block">
          MEMORIES GALLERY
        </span>
        <h3 className="text-2xl font-great-vibes text-amber-900 mt-1">
          Khoảnh Khắc Kỷ Niệm
        </h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
          Chạm vào từng bức ảnh để xem kích thước lớn
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
        {photos.map((url, idx) => {
          const tiltClass = tilts[idx % tilts.length];
          return (
            <div
              key={`polaroid-${idx}`}
              onClick={() => onPhotoClick && onPhotoClick(idx)}
              className={`bg-white p-2.5 pb-6 rounded-md shadow-lg border border-gray-200/80 transition-all duration-300 hover:rotate-0 hover:scale-105 hover:shadow-2xl hover:z-20 cursor-pointer relative group ${tiltClass}`}
            >
              {/* Washi masking tape strip at top edge */}
              <div
                className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-16 h-5 bg-amber-200/75 border border-amber-300/60 shadow-2xs backdrop-blur-xs pointer-events-none"
                style={{
                  clipPath: "polygon(5% 0%, 95% 0%, 100% 100%, 0% 100%)",
                }}
              />

              {/* Photo Image */}
              <div className="overflow-hidden rounded-xs aspect-4/5 bg-gray-100 relative">
                <img
                  src={url}
                  alt={`Khoảnh khắc cưới ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="p-2 rounded-full bg-white/90 text-gray-800 shadow-md">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Handwriting caption */}
              <div className="mt-2.5 text-center">
                <span className="text-[11px] font-serif italic text-gray-500 tracking-wide">
                  #Moment {idx + 1}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
