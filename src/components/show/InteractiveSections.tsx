"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Camera,
  Upload,
  Image as ImageIcon,
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

  const isLuxury = themeStyle === "luxury";
  const isTraditional = themeStyle === "traditional";

  const cardBg = isLuxury
    ? "bg-gradient-to-b from-[#1a120b] via-[#24170d] to-[#1a120b] border-amber-500/40 text-amber-200 shadow-2xl"
    : isTraditional
    ? "bg-gradient-to-b from-[#8b0000] to-[#700000] border-2 border-amber-400/50 text-amber-100 shadow-2xl"
    : "bg-white/95 backdrop-blur-md border border-amber-200/80 shadow-xl text-gray-900";

  const titleColor = isLuxury
    ? "text-amber-300"
    : isTraditional
    ? "text-amber-200"
    : "text-gray-900";

  const subColor = isLuxury
    ? "text-amber-200/70"
    : isTraditional
    ? "text-amber-100/80"
    : "text-gray-500";

  const headerDayColor = isLuxury
    ? "text-amber-400/80 border-amber-500/20"
    : isTraditional
    ? "text-amber-200/80 border-amber-400/20"
    : "text-gray-400 border-gray-100";

  const dayNormalColor = isLuxury
    ? "text-amber-100/90 hover:bg-amber-400/10"
    : isTraditional
    ? "text-white/95 hover:bg-amber-400/15"
    : "text-gray-700 hover:bg-gray-100/70";

  const targetDayStyle = isLuxury
    ? "bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 text-amber-950 font-bold shadow-md scale-105 z-10 animate-pulse"
    : isTraditional
    ? "bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 text-[#700000] font-bold shadow-md scale-105 z-10 animate-pulse"
    : "bg-gradient-to-br from-rose-500 via-rose-600 to-amber-700 text-white font-bold shadow-md scale-105 z-10 animate-pulse";

  const targetHeartColor = isLuxury
    ? "bg-amber-200 text-amber-950"
    : isTraditional
    ? "bg-red-700 text-yellow-300"
    : "bg-amber-400 text-amber-950";

  const googleBtnStyle = isLuxury
    ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-bold shadow-md shadow-amber-900/30"
    : isTraditional
    ? "bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-[#700000] font-bold shadow-md shadow-black/30"
    : "bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold shadow-md shadow-rose-900/10";

  const icsBtnStyle = isLuxury
    ? "bg-black/40 hover:bg-black/60 text-amber-200 border border-amber-500/40"
    : isTraditional
    ? "bg-[#550000] hover:bg-[#400000] text-amber-200 border border-amber-400/40"
    : "bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200";

  return (
    <div className={`w-full max-w-md mx-auto my-6 p-6 rounded-3xl text-center relative overflow-hidden group ${cardBg}`}>
      {/* Background soft ornamentation */}
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-rose-100/50 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-amber-100/50 blur-2xl pointer-events-none" />

      {/* Header Month / Year */}
      <div className="mb-4">
        <span className={`text-[10px] tracking-widest uppercase font-serif font-bold block ${isLuxury ? "text-amber-400" : isTraditional ? "text-amber-200" : "text-amber-800"}`}>
          SAVE THE DATE
        </span>
        <h3 className={`text-xl font-bold font-serif mt-1 ${titleColor}`}>
          Tháng {targetMonth} / {targetYear}
        </h3>
        <p className={`text-xs mt-0.5 ${subColor}`}>
          {weddingTime ? `Thời gian: ${weddingTime}` : ""} • {venue}
        </p>
      </div>

      {/* Days of week header */}
      <div className={`grid grid-cols-7 gap-1 text-[11px] font-semibold mb-2 border-b pb-2 ${headerDayColor}`}>
        <span>T2</span>
        <span>T3</span>
        <span>T4</span>
        <span>T5</span>
        <span>T6</span>
        <span>T7</span>
        <span className={isLuxury ? "text-amber-300" : isTraditional ? "text-yellow-300" : "text-rose-500"}>CN</span>
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
                isTarget ? targetDayStyle : dayNormalColor
              }`}
            >
              <span>{dayNum}</span>
              {isTarget && (
                <span className={`absolute -top-1.5 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] shadow-xs ${targetHeartColor}`}>
                  ♥
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons to Add into Calendar */}
      <div className={`mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-4 border-t ${isLuxury ? "border-amber-500/20" : isTraditional ? "border-amber-400/20" : "border-gray-100"}`}>
        <button
          type="button"
          onClick={handleGoogleCalendar}
          className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all hover:scale-102 active:scale-98 cursor-pointer ${googleBtnStyle}`}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>Thêm vào Google Calendar</span>
          <ExternalLink className="w-3 h-3 opacity-80" />
        </button>

        <button
          type="button"
          onClick={handleDownloadIcs}
          className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all hover:scale-102 active:scale-98 cursor-pointer ${icsBtnStyle}`}
          title="Tải file .ics cho Apple Calendar / Outlook"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Lưu vào máy (.ics)</span>
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   2. LOVE STORY TIMELINE (DÒNG THỜI GIAN TÌNH YÊU)
   ========================================================= */

import { DEFAULT_LOVE_STORY, LoveStoryItem } from "@/lib/loveStoryConstants";
export { DEFAULT_LOVE_STORY, type LoveStoryItem };

interface LoveStoryTimelineProps {
  items?: LoveStoryItem[];
  themeStyle?: "luxury" | "traditional" | "pastel" | "default";
}

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

/* =========================================================
   4. GUEST PHOTO WALL (KHOẢNH KHẮC TIỆC CƯỚI TỪ KHÁCH MỜI)
   ========================================================= */

export interface GuestPhotoItem {
  id: string;
  senderName: string;
  url: string;
  caption?: string;
  createdAt: string;
  likes: number;
}

interface GuestPhotoWallProps {
  slug: string;
  initialGuestName?: string;
}

export function GuestPhotoWall({ slug, initialGuestName }: GuestPhotoWallProps) {
  const [photos, setPhotos] = useState<GuestPhotoItem[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [senderName, setSenderName] = useState(initialGuestName || "");
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Load photos
  useEffect(() => {
    async function fetchPhotos() {
      try {
        const res = await fetch(`/api/show/${slug}/photos`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.photos)) {
            setPhotos(data.photos);
          }
        }
      } catch {}
    }
    fetchPhotos();
  }, [slug]);

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setSelectedFile(f);
      setFilePreview(URL.createObjectURL(f));
    }
  };

  // Handle submit photo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      const fd = new FormData();
      fd.append("file", selectedFile);
      fd.append("senderName", senderName.trim() || "Khách Quý");
      fd.append("caption", caption.trim());

      const res = await fetch(`/api/show/${slug}/photos`, {
        method: "POST",
        body: fd,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.photo) {
          setPhotos((prev) => [data.photo, ...prev]);
          setIsUploadOpen(false);
          setSelectedFile(null);
          setFilePreview(null);
          setCaption("");
          setStatusMsg("🎉 Cảm ơn bạn! Bức ảnh kỷ niệm của bạn đã được lưu vào Album tiệc cưới!");
          setTimeout(() => setStatusMsg(null), 4000);
        }
      } else {
        setStatusMsg("Không thể tải ảnh lên. Vui lòng thử lại!");
        setTimeout(() => setStatusMsg(null), 3000);
      }
    } catch {
      setStatusMsg("Lỗi kết nối khi tải ảnh lên.");
      setTimeout(() => setStatusMsg(null), 3000);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full my-8 px-4 sm:px-6">
      {statusMsg && (
        <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold text-center animate-fade-in">
          {statusMsg}
        </div>
      )}

      {/* Header & Upload Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 p-4 rounded-2xl border border-rose-200/60">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
            <Camera className="w-4 h-4 text-zen-primary" />
            <span>Khoảnh Khắc Tiệc Cưới Từ Khách Mời</span>
          </h3>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Cùng chia sẻ những bức ảnh chụp ngẫu hứng tại sảnh cưới và bàn tiệc!
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsUploadOpen(true)}
          className="px-4 py-2 rounded-xl bg-zen-primary hover:bg-[#d93849] text-white text-xs font-bold shadow-md shadow-zen-primary/20 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Gửi ảnh kỷ niệm của bạn</span>
        </button>
      </div>

      {/* Photos Masonry / Grid */}
      {photos.length === 0 ? (
        <div className="p-8 text-center bg-gray-50/60 rounded-2xl border border-dashed border-gray-200">
          <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-gray-600">Chưa có ảnh nào từ khách mời</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Hãy là người đầu tiên chia sẻ khoảnh khắc vui vẻ trong tiệc cưới cùng cô dâu chú rể!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col"
            >
              <div className="aspect-square w-full bg-gray-100 overflow-hidden relative">
                <img
                  src={item.url}
                  alt={item.caption || "Ảnh khách mời"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="p-2.5 flex flex-col justify-between flex-1">
                <div>
                  <span className="text-[11px] font-bold text-gray-800 block truncate">
                    {item.senderName}
                  </span>
                  {item.caption && (
                    <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5 italic">
                      "{item.caption}"
                    </p>
                  )}
                </div>
                <span className="text-[9px] text-gray-400 mt-1 block">
                  {new Date(item.createdAt).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-gray-100 animate-scale-up space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-zen-primary" />
                <span>Gửi Ảnh Kỷ Niệm Tiệc Cưới</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* File input / Preview */}
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Chọn ảnh chụp của bạn:
                </label>
                {filePreview ? (
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
                    <img src={filePreview} alt="Preview" className="w-full h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreview(null);
                      }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                    >
                      <CloseIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 hover:border-zen-primary rounded-2xl cursor-pointer bg-gray-50/50 hover:bg-rose-50/30 transition-colors">
                    <Camera className="w-8 h-8 text-gray-400 mb-1" />
                    <span className="text-xs font-bold text-gray-700">Chụp hoặc chọn ảnh từ máy</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">Hỗ trợ JPG, PNG, WebP (Tối đa 6MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Tên của bạn / Bàn tiệc:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Vd: Bạn Mai (Bàn 5)..."
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full p-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-zen-primary"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Lời nhắn gửi đôi uyên ương:
                </label>
                <input
                  type="text"
                  placeholder="Vd: Chúc mừng đôi bạn trẻ cực phẩm!..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full p-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-zen-primary"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-600 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || isUploading}
                  className="flex-1 py-2 rounded-xl bg-zen-primary hover:bg-[#d93849] disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? "Đang gửi..." : "Gửi ảnh ngay"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
