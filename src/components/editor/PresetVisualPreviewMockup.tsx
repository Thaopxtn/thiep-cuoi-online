"use client";

import React from "react";
import {
  MapPin,
  Calendar,
  Heart,
  Clock,
  QrCode,
  CreditCard,
  Check,
  Sparkles,
  Phone,
  MessageCircle,
  ExternalLink,
  Crown,
  Navigation,
  Car,
  Utensils,
  Copy,
  Users,
} from "lucide-react";
import { ModulePresetItem } from "@/lib/modulePresetsCatalog";

interface PresetVisualPreviewMockupProps {
  preset: ModulePresetItem;
}

export default function PresetVisualPreviewMockup({ preset }: PresetVisualPreviewMockupProps) {
  // 1. Nếu preset có ảnh preview URL trực tiếp
  if (preset.previewImage) {
    return (
      <div className="w-full h-26 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 relative group-hover:border-rose-400 transition-all">
        <img
          src={preset.previewImage}
          alt={preset.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
    );
  }

  // 2. Render Mockup đồ họa trực quan theo từng Category & ID
  return (
    <div
      className="w-full h-26 rounded-xl overflow-hidden border border-gray-200/90 relative bg-white flex flex-col justify-between shadow-2xs group-hover:border-rose-400 group-hover:shadow-xs transition-all select-none"
      title={preset.description || preset.name}
    >
      {renderCategoryMockup(preset)}
    </div>
  );
}

function renderCategoryMockup(preset: ModulePresetItem) {
  switch (preset.category) {
    case "map":
      return renderMapMockup(preset);
    case "calendar":
      return renderCalendarMockup(preset);
    case "ceremony":
      return renderCeremonyMockup(preset);
    case "family":
      return renderFamilyMockup(preset);
    case "banking":
      return renderBankingMockup(preset);
    case "rsvp":
      return renderRsvpMockup(preset);
    case "dresscode":
      return renderDresscodeMockup(preset);
    case "intro":
      return renderIntroMockup(preset);
    default:
      return renderDefaultMockup(preset);
  }
}

// ==========================================
// A. BẢN ĐỒ & CHỈ ĐƯỜNG MOCKUPS
// ==========================================
function renderMapMockup(preset: ModulePresetItem) {
  if (preset.id === "map_style_dual") {
    return (
      <div className="w-full h-full grid grid-cols-2 divide-x divide-gray-100 bg-gray-50/50 p-1.5 gap-1.5 text-[9px]">
        {/* Nhà Trai */}
        <div className="bg-blue-50/70 border border-blue-200/60 rounded-lg p-1.5 flex flex-col justify-between">
          <div className="flex items-center gap-1 font-bold text-blue-900">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
            <span className="truncate">Nhà Trai</span>
          </div>
          <p className="text-[8px] text-blue-700/80 truncate">Tư gia Chú Rể</p>
          <div className="mt-1 bg-blue-600 text-white rounded px-1.5 py-0.5 text-[8px] font-bold text-center flex items-center justify-center gap-0.5">
            <MapPin className="w-2.5 h-2.5" /> Bản đồ
          </div>
        </div>

        {/* Nhà Gái */}
        <div className="bg-rose-50/70 border border-rose-200/60 rounded-lg p-1.5 flex flex-col justify-between">
          <div className="flex items-center gap-1 font-bold text-rose-900">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
            <span className="truncate">Nhà Gái</span>
          </div>
          <p className="text-[8px] text-rose-700/80 truncate">Tư gia Cô Dâu</p>
          <div className="mt-1 bg-rose-600 text-white rounded px-1.5 py-0.5 text-[8px] font-bold text-center flex items-center justify-center gap-0.5">
            <MapPin className="w-2.5 h-2.5" /> Bản đồ
          </div>
        </div>
      </div>
    );
  }

  if (preset.id === "map_style_qr") {
    return (
      <div className="w-full h-full bg-gradient-to-r from-gray-50 to-rose-50/40 p-2 flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
          <div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-900">
              <MapPin className="w-3 h-3 text-rose-600 shrink-0" />
              <span className="truncate">Grand Palace</span>
            </div>
            <p className="text-[8px] text-gray-500 truncate mt-0.5">142 Lê Duẩn, Hà Nội</p>
          </div>
          <span className="inline-flex items-center gap-1 text-[8px] font-semibold text-rose-700 bg-rose-100/70 px-1.5 py-0.5 rounded w-fit">
            <QrCode className="w-2.5 h-2.5" /> Quét chỉ đường
          </span>
        </div>

        {/* QR Code Graphic Mockup */}
        <div className="w-16 h-16 bg-white border border-gray-300 rounded-lg p-1 shadow-2xs flex flex-col items-center justify-center shrink-0">
          <div className="grid grid-cols-4 gap-0.5 w-full h-full p-0.5">
            <div className="bg-gray-900 rounded-xs"></div>
            <div className="bg-gray-900 rounded-xs"></div>
            <div className="bg-gray-300 rounded-xs"></div>
            <div className="bg-gray-900 rounded-xs"></div>
            <div className="bg-gray-900 rounded-xs"></div>
            <div className="bg-transparent"></div>
            <div className="bg-gray-900 rounded-xs"></div>
            <div className="bg-gray-300 rounded-xs"></div>
            <div className="bg-gray-300 rounded-xs"></div>
            <div className="bg-gray-900 rounded-xs"></div>
            <div className="bg-transparent"></div>
            <div className="bg-gray-900 rounded-xs"></div>
            <div className="bg-gray-900 rounded-xs"></div>
            <div className="bg-gray-300 rounded-xs"></div>
            <div className="bg-gray-900 rounded-xs"></div>
            <div className="bg-gray-900 rounded-xs"></div>
          </div>
        </div>
      </div>
    );
  }

  if (preset.id === "map_style_royal") {
    return (
      <div className="w-full h-full bg-gradient-to-br from-amber-50 via-white to-amber-100/40 p-2 flex flex-col justify-between border-2 border-amber-300/80 rounded-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[10px] font-serif font-bold text-amber-900 tracking-wider">
              ROYAL WEDDING MAP
            </span>
          </div>
          <span className="text-[8px] font-bold text-amber-700 bg-amber-100/80 px-1 rounded border border-amber-200">
            Gold Edition
          </span>
        </div>
        <div className="text-center py-1">
          <h5 className="text-[10px] font-bold text-gray-900">Trung Tâm Hội Nghị Grand Plaza</h5>
          <p className="text-[8px] text-gray-500">117 Trần Duy Hưng, Cầu Giấy, Hà Nội</p>
        </div>
        <div className="w-full py-1 rounded-md bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[9px] font-bold text-center flex items-center justify-center gap-1 shadow-2xs">
          <MapPin className="w-2.5 h-2.5 text-amber-200" />
          <span>Mở Chỉ Đường Hoàng Gia</span>
        </div>
      </div>
    );
  }

  if (preset.id === "map_style_handdrawn") {
    return (
      <div className="w-full h-full bg-[#fdfaf2] p-2 flex flex-col justify-between border border-dashed border-[#c5ad8d] rounded-xl relative">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-serif italic text-[#8a6845] font-semibold">
            ~ Sơ đồ đường đến hôn lễ ~
          </span>
          <span className="text-[8px] bg-[#efe5d2] text-[#715233] px-1 py-0.2 rounded font-mono">
            Vẽ tay Vintage
          </span>
        </div>

        {/* Vintage sketch trail graphic */}
        <div className="relative h-7 flex items-center justify-center">
          <svg className="w-full h-6" viewBox="0 0 200 24" fill="none">
            <path
              d="M 10 16 Q 60 4, 100 12 T 180 8"
              stroke="#a88c6e"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
            <circle cx="10" cy="16" r="3" fill="#8a6845" />
            <circle cx="180" cy="8" r="4" fill="#e11d48" />
          </svg>
          <div className="absolute right-3 top-0 text-[9px]">❤️</div>
        </div>

        <div className="w-full py-0.5 rounded bg-[#f1e6d4] text-[#63482d] text-[8px] font-bold text-center border border-[#d2bea4]">
          📍 Trung tâm tiệc cưới • Bấm xem bản đồ
        </div>
      </div>
    );
  }

  if (preset.id === "map_style_darkmode") {
    return (
      <div className="w-full h-full bg-slate-900 p-2 flex flex-col justify-between text-slate-100 rounded-xl border border-slate-700 relative overflow-hidden">
        {/* Glow grid background */}
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#06b6d4_1px,transparent_1px),linear-gradient(to_bottom,#06b6d4_1px,transparent_1px)] bg-[size:12px_12px]" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[9px] font-bold tracking-wider text-cyan-300">DARK LUXURY MAP</span>
          </div>
          <span className="text-[8px] font-mono text-cyan-400 bg-cyan-950/80 px-1 py-0.2 rounded border border-cyan-800">
            GPS Live
          </span>
        </div>

        <div className="relative z-10 text-center">
          <p className="text-[10px] font-bold text-white truncate">Riverside Palace Sài Gòn</p>
          <p className="text-[8px] text-slate-400 truncate">360D Bến Vân Đồn, Q.4, TP.HCM</p>
        </div>

        <div className="relative z-10 w-full py-1 rounded-md bg-gradient-to-r from-rose-500 to-cyan-500 text-white text-[9px] font-bold text-center flex items-center justify-center gap-1 shadow-md">
          <Navigation className="w-2.5 h-2.5" />
          <span>Dẫn Đường Vệ Tinh</span>
        </div>
      </div>
    );
  }

  if (preset.id === "map_style_roadmap") {
    return (
      <div className="w-full h-full bg-blue-50/40 p-2 flex flex-col justify-between rounded-xl border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[9px] font-bold text-blue-900">
            <Car className="w-3 h-3 text-blue-600" />
            <span>Chỉ Dẫn & Bãi Đỗ Xe</span>
          </div>
          <span className="text-[8px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
            Đỗ ô tô Free
          </span>
        </div>

        <div className="flex items-center justify-around py-1 bg-white rounded-lg border border-blue-100 shadow-2xs">
          <div className="flex items-center gap-1 text-[9px] text-gray-700">
            <span className="w-4 h-4 rounded bg-blue-600 text-white font-bold flex items-center justify-center text-[9px]">P</span>
            <span className="font-semibold">Bãi xe 500m</span>
          </div>
          <span className="text-gray-300">➔</span>
          <div className="flex items-center gap-1 text-[9px] text-gray-700">
            <span className="text-rose-600">🏛️</span>
            <span className="font-semibold">Sảnh Tiệc</span>
          </div>
        </div>

        <div className="w-full py-0.5 rounded bg-blue-600 text-white text-[8px] font-bold text-center">
          Bấm xem sơ đồ đỗ xe & Google Maps
        </div>
      </div>
    );
  }

  // Mặc định: map_style_preview & map_style_minimal (Bản đồ chuẩn)
  return (
    <div className="w-full h-full relative bg-slate-100 overflow-hidden flex flex-col justify-between p-2">
      {/* Simulated Map Streets Pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f1f5f9" />
        <path d="M 0 35 Q 80 40 280 20" stroke="#cbd5e1" strokeWidth="12" fill="none" />
        <path d="M 120 0 L 140 120" stroke="#cbd5e1" strokeWidth="10" fill="none" />
        <rect x="20" y="45" width="60" height="30" rx="4" fill="#dcfce7" />
        <rect x="160" y="30" width="80" height="40" rx="4" fill="#e0f2fe" />
      </svg>

      {/* Floating Pin */}
      <div className="relative z-10 flex items-center justify-center pt-1">
        <div className="flex items-center gap-1 bg-white/95 px-2 py-0.5 rounded-full shadow-sm border border-gray-200">
          <div className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
          <MapPin className="w-3 h-3 text-rose-600 fill-rose-600" />
          <span className="text-[9px] font-bold text-gray-800">Grand Palace Hotel</span>
        </div>
      </div>

      {/* Bottom Action Pill */}
      <div className="relative z-10 w-full py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-bold text-center flex items-center justify-center gap-1 shadow-xs">
        <Navigation className="w-2.5 h-2.5" />
        <span>Chỉ Đường Google Maps</span>
      </div>
    </div>
  );
}

// ==========================================
// B. LỊCH & ĐẾM NGƯỢC MOCKUPS
// ==========================================
function renderCalendarMockup(preset: ModulePresetItem) {
  if (preset.id.includes("countdown") || preset.id.includes("counter")) {
    const isFlip = preset.id === "countdown_style_flip";
    const isHearts = preset.id === "countdown_style_hearts" || preset.id === "calendar_style_sweet_counter";
    
    return (
      <div className={`w-full h-full p-2 flex flex-col justify-between ${
        isFlip ? "bg-slate-900 text-white" : isHearts ? "bg-rose-50/70" : "bg-white"
      }`}>
        <div className="flex items-center justify-between text-[9px]">
          <span className={`font-bold flex items-center gap-1 ${isFlip ? "text-slate-300" : "text-rose-700"}`}>
            <Clock className="w-3 h-3" />
            <span>ĐẾM NGƯỢC NGÀY CHUNG ĐÔI</span>
          </span>
          <span className={`text-[8px] font-bold px-1 rounded ${
            isFlip ? "bg-slate-800 text-rose-400" : "bg-rose-100 text-rose-700"
          }`}>
            28.12.2026
          </span>
        </div>

        {/* 4 Countdown Boxes */}
        <div className="grid grid-cols-4 gap-1.5 my-auto">
          {[
            { num: "28", label: "NGÀY" },
            { num: "14", label: "GIỜ" },
            { num: "35", label: "PHÚT" },
            { num: "10", label: "GIÂY" },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`rounded-lg p-1 text-center flex flex-col justify-center ${
                isFlip
                  ? "bg-slate-800 border border-slate-700 relative overflow-hidden"
                  : isHearts
                  ? "bg-gradient-to-b from-white to-rose-100/70 border border-rose-200/80 shadow-2xs"
                  : "bg-gray-50 border border-gray-200"
              }`}
            >
              {isFlip && <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-950/80" />}
              <span className={`text-xs font-bold leading-none ${isFlip ? "text-cyan-300" : "text-rose-600"}`}>
                {item.num}
              </span>
              <span className="text-[7px] text-gray-400 font-semibold mt-0.5">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="text-center text-[8px] text-gray-500 font-medium">
          {isHearts ? "❤️ Cùng đếm ngược từng khoảnh khắc ngọt ngào" : "Chính xác theo thời gian thực"}
        </div>
      </div>
    );
  }

  if (preset.id === "calendar_style_royal") {
    return (
      <div className="w-full h-full bg-gradient-to-br from-amber-50 to-white p-2 border-2 border-amber-300 rounded-xl flex flex-col justify-between">
        <div className="flex items-center justify-between text-amber-900 border-b border-amber-200/80 pb-1">
          <Crown className="w-3 h-3 text-amber-600" />
          <span className="text-[9px] font-serif font-bold tracking-wider">THÁNG 12 / 2026</span>
          <span className="text-[8px] font-serif text-amber-700">Chủ Nhật</span>
        </div>

        {/* Mini Calendar Grid */}
        <div className="grid grid-cols-7 gap-0.5 text-center text-[7px] text-gray-500 font-mono py-1">
          <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span className="text-amber-700 font-bold">CN</span>
          <span>22</span><span>23</span><span>24</span><span>25</span><span>26</span><span>27</span>
          <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold rounded-full w-4 h-4 flex items-center justify-center mx-auto shadow-xs">
            28
          </span>
        </div>

        <div className="text-center text-[8px] font-serif font-semibold text-amber-800 bg-amber-100/50 rounded py-0.5">
          ✨ Ngày Hoàng Đạo Cát Lành
        </div>
      </div>
    );
  }

  if (preset.id === "calendar_style_stamp") {
    return (
      <div className="w-full h-full bg-amber-50/40 p-2 border-2 border-dashed border-amber-400 rounded-xl flex items-center justify-between gap-2">
        <div className="flex-1">
          <div className="text-[8px] font-mono text-amber-800 font-bold uppercase tracking-wider">
            POSTMARK • WEDDING
          </div>
          <div className="text-xs font-bold text-gray-900 mt-0.5">28 THÁNG 12, 2026</div>
          <p className="text-[8px] text-gray-500">Kỷ niệm ngày hạnh phúc nhất</p>
        </div>

        {/* Stamp Emblem */}
        <div className="w-12 h-12 rounded-full border-2 border-dashed border-rose-500 flex flex-col items-center justify-center text-rose-600 rotate-12 shrink-0 bg-white shadow-2xs">
          <Heart className="w-3 h-3 fill-rose-500" />
          <span className="text-[8px] font-bold font-mono">28.12</span>
        </div>
      </div>
    );
  }

  // Classic Calendar (default)
  return (
    <div className="w-full h-full bg-white p-2 flex flex-col justify-between">
      <div className="flex items-center justify-between text-[9px] border-b border-gray-100 pb-1">
        <span className="font-bold text-rose-700 flex items-center gap-1">
          <Calendar className="w-3 h-3 text-rose-600" /> THÁNG 12 / 2026
        </span>
        <span className="text-[8px] font-bold text-rose-600 bg-rose-50 px-1 rounded">Ngày Cưới</span>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center text-[8px] text-gray-500 font-medium my-auto">
        <span className="text-gray-400">T2</span><span className="text-gray-400">T3</span><span className="text-gray-400">T4</span><span className="text-gray-400">T5</span><span className="text-gray-400">T6</span><span className="text-gray-400">T7</span><span className="text-rose-600 font-bold">CN</span>
        <span>22</span><span>23</span><span>24</span><span>25</span><span>26</span><span>27</span>
        <span className="bg-rose-600 text-white font-bold rounded-full w-4 h-4 flex items-center justify-center mx-auto shadow-2xs">
          28
        </span>
      </div>

      <div className="text-center text-[8px] text-rose-600 font-semibold bg-rose-50/70 rounded py-0.5">
        ❤️ Đánh dấu ngày chung đôi vào lịch của bạn
      </div>
    </div>
  );
}

// ==========================================
// C. HÔN LỄ & TIMELINE MOCKUPS
// ==========================================
function renderCeremonyMockup(preset: ModulePresetItem) {
  if (preset.id === "ceremony_style_timeline" || preset.id === "ceremony_style_steps") {
    return (
      <div className="w-full h-full bg-gray-50/50 p-2 flex flex-col justify-between">
        <div className="text-[9px] font-bold text-gray-800 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-rose-600" /> LỊCH TRÌNH NGÀY CƯỚI
          </span>
          <span className="text-[8px] text-rose-600 font-bold bg-rose-50 px-1 rounded">Timeline</span>
        </div>

        {/* 4 Horizontal Step Nodes */}
        <div className="flex items-center justify-between relative px-2 my-auto">
          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200" />
          {[
            { step: "08:30", label: "Đón khách", color: "bg-blue-500" },
            { step: "09:30", label: "Làm lễ", color: "bg-rose-500" },
            { step: "11:30", label: "Khai tiệc", color: "bg-amber-500" },
            { step: "13:00", label: "Chụp ảnh", color: "bg-purple-500" },
          ].map((item, idx) => (
            <div key={idx} className="relative z-10 flex flex-col items-center">
              <div className={`w-3.5 h-3.5 rounded-full ${item.color} text-white text-[7px] font-bold flex items-center justify-center shadow-2xs`}>
                {idx + 1}
              </div>
              <span className="text-[8px] font-bold text-gray-800 mt-1">{item.step}</span>
              <span className="text-[7px] text-gray-400">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="text-[8px] text-center text-gray-500">Rất mong quý khách đến đúng giờ</div>
      </div>
    );
  }

  if (preset.id === "ceremony_style_vuquy" || preset.id === "ceremony_style_dual_party") {
    return (
      <div className="w-full h-full grid grid-cols-2 divide-x divide-gray-100 bg-rose-50/30 p-1.5 gap-1.5 text-[9px]">
        <div className="bg-white border border-rose-200 rounded-lg p-1.5 flex flex-col justify-between shadow-2xs">
          <span className="text-[8px] font-bold text-rose-700 bg-rose-50 px-1 py-0.2 rounded w-fit">
            Lễ Vu Quy
          </span>
          <p className="font-bold text-gray-900 text-[10px]">09:00 Sáng</p>
          <p className="text-[8px] text-gray-500 truncate">Tư gia Nhà Gái</p>
        </div>

        <div className="bg-white border border-rose-200 rounded-lg p-1.5 flex flex-col justify-between shadow-2xs">
          <span className="text-[8px] font-bold text-blue-700 bg-blue-50 px-1 py-0.2 rounded w-fit">
            Lễ Thành Hôn
          </span>
          <p className="font-bold text-gray-900 text-[10px]">11:30 Trưa</p>
          <p className="text-[8px] text-gray-500 truncate">Trung tâm Tiệc cưới</p>
        </div>
      </div>
    );
  }

  // Classic Ceremony Card
  return (
    <div className="w-full h-full bg-gradient-to-br from-rose-50/50 to-white p-2 flex flex-col justify-between text-center">
      <div className="flex items-center justify-center gap-1 text-[9px] font-bold text-rose-800 tracking-wider">
        <span>💍</span> CHƯƠNG TRÌNH HÔN LỄ TRANG TRỌNG <span>💍</span>
      </div>

      <div className="py-1">
        <h5 className="text-[10px] font-bold text-gray-900">LỄ THÀNH HÔN</h5>
        <p className="text-[8px] text-rose-600 font-semibold">11:00 Trưa • Ngày 28 Tháng 12 Năm 2026</p>
        <p className="text-[8px] text-gray-500 truncate">Tại Grand Palace Hall, Hà Nội</p>
      </div>

      <div className="w-full py-0.5 bg-rose-100/70 text-rose-800 text-[8px] font-bold rounded">
        Kính mời Quý khách cùng nâng ly chúc mừng
      </div>
    </div>
  );
}

// ==========================================
// D. THÔNG TIN HAI HỌ MOCKUPS
// ==========================================
function renderFamilyMockup(preset: ModulePresetItem) {
  const isTraditional = preset.id === "family_style_traditional";

  return (
    <div className={`w-full h-full p-2 flex flex-col justify-between ${
      isTraditional ? "bg-red-50/60 border border-red-200" : "bg-white"
    }`}>
      {/* Header Crest */}
      <div className="flex items-center justify-between text-[9px]">
        <span className="font-bold text-gray-800">ĐẠI DIỆN HAI DÒNG HỌ</span>
        <span className={`font-bold px-1 rounded text-[9px] ${
          isTraditional ? "text-red-700 bg-red-100 font-serif" : "text-indigo-700 bg-indigo-50"
        }`}>
          {isTraditional ? "囍 Song Hỷ" : "Hai Họ"}
        </span>
      </div>

      {/* 2 Symmetrical Columns */}
      <div className="grid grid-cols-2 gap-2 text-[8px] my-auto">
        {/* Nhà Trai */}
        <div className="bg-gray-50/80 rounded-lg p-1.5 border border-gray-100">
          <div className="font-bold text-gray-900 border-b border-gray-200 pb-0.5 mb-1 flex items-center justify-between">
            <span>NHÀ TRAI</span>
            <span>🤵</span>
          </div>
          <p className="text-gray-500">Bố: Nguyễn Văn A</p>
          <p className="text-gray-500">Mẹ: Trần Thị B</p>
          <p className="font-bold text-rose-600 truncate mt-0.5">Chú rể: Hoàng Nam</p>
        </div>

        {/* Nhà Gái */}
        <div className="bg-gray-50/80 rounded-lg p-1.5 border border-gray-100">
          <div className="font-bold text-gray-900 border-b border-gray-200 pb-0.5 mb-1 flex items-center justify-between">
            <span>NHÀ GÁI</span>
            <span>👰</span>
          </div>
          <p className="text-gray-500">Bố: Lê Văn C</p>
          <p className="text-gray-500">Mẹ: Phạm Thị D</p>
          <p className="font-bold text-rose-600 truncate mt-0.5">Cô dâu: Thảo Linh</p>
        </div>
      </div>

      <div className="text-[7px] text-center text-gray-400">Trang trọng kính báo Quý thân bằng quyến thuộc</div>
    </div>
  );
}

// ==========================================
// E. MỪNG CƯỚI & VIETQR MOCKUPS
// ==========================================
function renderBankingMockup(preset: ModulePresetItem) {
  if (preset.id === "banking_style_card") {
    return (
      <div className="w-full h-full bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 p-2 text-amber-950 flex flex-col justify-between rounded-xl relative overflow-hidden shadow-2xs border border-amber-300">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-bold tracking-widest font-mono">VIETQR GOLD VIP</span>
          <CreditCard className="w-3.5 h-3.5 text-amber-900" />
        </div>

        <div className="flex items-center justify-between my-auto">
          <div>
            <div className="w-5 h-4 rounded bg-amber-600/30 border border-amber-700/40 mb-1" />
            <p className="font-mono text-[9px] font-bold tracking-wider">9876 5432 1098</p>
            <p className="text-[8px] font-bold truncate">HOANG NAM & THAO LINH</p>
          </div>
          <div className="w-10 h-10 bg-white p-0.5 rounded border border-amber-500 shadow-2xs shrink-0 flex items-center justify-center">
            <QrCode className="w-8 h-8 text-amber-950" />
          </div>
        </div>

        <div className="text-[7px] text-amber-900/80 font-semibold">Napas 247 • Chuyển khoản mừng cưới thuận tiện</div>
      </div>
    );
  }

  if (preset.id === "banking_style_single") {
    return (
      <div className="w-full h-full bg-white p-2 flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
          <div>
            <span className="text-[8px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
              Vietcombank 24/7
            </span>
            <p className="text-[10px] font-bold text-gray-900 truncate mt-1">NGUYEN HOANG NAM</p>
            <p className="text-[8px] font-mono text-gray-500">STK: 1029384756</p>
          </div>
          <div className="inline-flex items-center gap-1 text-[8px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded w-fit">
            <Copy className="w-2.5 h-2.5" /> Sao chép số TK
          </div>
        </div>

        {/* QR Box */}
        <div className="w-16 h-16 bg-white border border-gray-300 rounded-lg p-1 flex items-center justify-center shrink-0 shadow-2xs">
          <QrCode className="w-12 h-12 text-gray-900" />
        </div>
      </div>
    );
  }

  // Dual Banking (default)
  return (
    <div className="w-full h-full grid grid-cols-2 divide-x divide-gray-100 bg-gray-50/50 p-1.5 gap-1.5 text-[8px]">
      {/* Chú rể */}
      <div className="bg-white border border-blue-200 rounded-lg p-1.5 flex flex-col justify-between shadow-2xs">
        <div className="flex items-center justify-between font-bold text-blue-800">
          <span>MB Bank</span>
          <span>🤵</span>
        </div>
        <div className="flex items-center justify-center py-0.5">
          <QrCode className="w-7 h-7 text-gray-800" />
        </div>
        <p className="font-bold text-gray-900 truncate text-[8px]">Mừng Chú Rể</p>
      </div>

      {/* Cô dâu */}
      <div className="bg-white border border-rose-200 rounded-lg p-1.5 flex flex-col justify-between shadow-2xs">
        <div className="flex items-center justify-between font-bold text-rose-800">
          <span>Vietcombank</span>
          <span>👰</span>
        </div>
        <div className="flex items-center justify-center py-0.5">
          <QrCode className="w-7 h-7 text-gray-800" />
        </div>
        <p className="font-bold text-gray-900 truncate text-[8px]">Mừng Cô Dâu</p>
      </div>
    </div>
  );
}

// ==========================================
// F. XÁC NHẬN THAM DỰ RSVP MOCKUPS
// ==========================================
function renderRsvpMockup(preset: ModulePresetItem) {
  if (preset.id === "rsvp_style_call") {
    return (
      <div className="w-full h-full bg-rose-50/40 p-2 flex flex-col justify-between">
        <div className="text-[9px] font-bold text-gray-800 flex items-center justify-between">
          <span>XÁC NHẬN NHANH QUA ĐIỆN THOẠI</span>
          <span className="text-[8px] bg-rose-100 text-rose-700 px-1 rounded">1 Chạm</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 my-auto">
          <div className="bg-blue-600 text-white rounded-lg p-1.5 flex items-center justify-center gap-1 text-[8px] font-bold shadow-2xs">
            <Phone className="w-2.5 h-2.5" /> Gọi Nhà Trai
          </div>
          <div className="bg-emerald-600 text-white rounded-lg p-1.5 flex items-center justify-center gap-1 text-[8px] font-bold shadow-2xs">
            <MessageCircle className="w-2.5 h-2.5" /> Nhắn Zalo
          </div>
        </div>

        <div className="text-[8px] text-center text-gray-400">Tiện lợi cho người lớn tuổi và bạn bè</div>
      </div>
    );
  }

  // RSVP Form (default)
  return (
    <div className="w-full h-full bg-white p-2 flex flex-col justify-between text-[8px]">
      <div className="flex items-center justify-between">
        <span className="font-bold text-gray-900 text-[9px] flex items-center gap-1">
          <Heart className="w-2.5 h-2.5 text-rose-600 fill-rose-600" /> BIỂU MẪU XÁC NHẬN RSVP
        </span>
        <span className="text-rose-600 font-bold bg-rose-50 px-1 rounded">Trực tuyến</span>
      </div>

      {/* Input Field Simulation */}
      <div className="w-full py-1 px-1.5 bg-gray-50 border border-gray-200 rounded text-gray-400 truncate">
        👤 Nhập tên quý khách...
      </div>

      {/* Choice Pills */}
      <div className="grid grid-cols-2 gap-1">
        <div className="py-0.5 bg-rose-50 border border-rose-300 rounded text-rose-700 font-bold text-center">
          ✓ Sẽ tham dự
        </div>
        <div className="py-0.5 bg-gray-50 border border-gray-200 rounded text-gray-500 text-center">
          ✕ Rất tiếc bận
        </div>
      </div>

      <div className="w-full py-0.5 rounded bg-rose-600 text-white font-bold text-center">
        Gửi Phản Hồi Tham Dự
      </div>
    </div>
  );
}

// ==========================================
// G. TRANG PHỤC CƯỚI DRESSCODE MOCKUPS
// ==========================================
function renderDresscodeMockup(preset: ModulePresetItem) {
  if (preset.id === "dresscode_style_bw") {
    return (
      <div className="w-full h-full bg-slate-900 text-white p-2 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[9px]">
          <span className="font-bold tracking-wider text-slate-200">BLACK TIE & LUXURY</span>
          <span className="text-[8px] bg-slate-800 text-rose-400 px-1 rounded">Dress Code</span>
        </div>

        <div className="flex items-center justify-center gap-2 my-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-black border-2 border-slate-600 shadow-sm" />
            <span className="text-[8px] font-bold">Đen</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-white border-2 border-slate-400 shadow-sm" />
            <span className="text-[8px] font-bold text-slate-200">Trắng</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-slate-700 border-2 border-slate-500 shadow-sm" />
            <span className="text-[8px] font-bold text-slate-300">Ghi xám</span>
          </div>
        </div>

        <div className="text-[8px] text-center text-slate-400">Trang trọng, quý phái và đẳng cấp</div>
      </div>
    );
  }

  // 5 Pastel Swatches (default)
  return (
    <div className="w-full h-full bg-white p-2 flex flex-col justify-between">
      <div className="flex items-center justify-between text-[9px]">
        <span className="font-bold text-gray-900 flex items-center gap-1">
          <span>👗</span> BẢNG MÀU TRANG PHỤC
        </span>
        <span className="text-[8px] font-bold text-rose-700 bg-rose-50 px-1 rounded">Tone Pastel</span>
      </div>

      {/* 5 Circular Swatches */}
      <div className="flex items-center justify-around my-auto px-1">
        {[
          { color: "#F5EBE0", name: "Beige" },
          { color: "#FBCFE8", name: "Pastel Pink" },
          { color: "#D4A373", name: "Terracotta" },
          { color: "#E0E7FF", name: "Baby Blue" },
          { color: "#FFFFFF", name: "Trắng" },
        ].map((swatch, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <div
              className="w-5 h-5 rounded-full border border-gray-300 shadow-2xs"
              style={{ backgroundColor: swatch.color }}
            />
            <span className="text-[7px] text-gray-500 mt-0.5 truncate max-w-[32px]">{swatch.name}</span>
          </div>
        ))}
      </div>

      <div className="text-[8px] text-center text-gray-500 font-medium">
        Khuyến khích trang phục màu sắc thanh nhã
      </div>
    </div>
  );
}

// ==========================================
// H. LỜI NGỎ & GIỚI THIỆU MOCKUPS
// ==========================================
function renderIntroMockup(preset: ModulePresetItem) {
  if (preset.id === "intro_style_monogram") {
    return (
      <div className="w-full h-full bg-gradient-to-br from-amber-50 to-white p-2 border border-amber-200 rounded-xl flex items-center justify-between gap-2">
        <div className="flex-1">
          <div className="text-[8px] font-serif text-amber-800 tracking-widest font-bold">MONOGRAM CƯỚI</div>
          <div className="text-[10px] font-serif font-bold text-gray-900 mt-0.5">Hoàng Nam & Thảo Linh</div>
          <p className="text-[8px] text-gray-500">Khởi đầu câu chuyện tình yêu</p>
        </div>

        {/* Monogram Crest */}
        <div className="w-12 h-12 rounded-full border-2 border-amber-400 bg-amber-50/70 flex items-center justify-center text-amber-800 font-serif font-bold text-xs shrink-0 shadow-2xs">
          N & L
        </div>
      </div>
    );
  }

  // Romantic Script Card (default)
  return (
    <div className="w-full h-full bg-gradient-to-br from-rose-50/40 via-white to-rose-50/20 p-2 flex flex-col justify-between text-center">
      <div className="text-[9px] font-bold text-rose-800 flex items-center justify-center gap-1">
        <Sparkles className="w-3 h-3 text-rose-500" />
        <span>LỜI NGỎ YÊU THƯƠNG</span>
        <Sparkles className="w-3 h-3 text-rose-500" />
      </div>

      <div className="my-auto px-2">
        <p className="text-[9px] font-serif italic text-gray-700 leading-snug">
          "Hai tâm hồn, một nhịp đập, chung một mái nhà đong đầy hạnh phúc."
        </p>
        <p className="text-[8px] font-bold text-rose-600 mt-0.5">— Hoàng Nam & Thảo Linh —</p>
      </div>

      <div className="text-[7px] text-gray-400">Trân trọng kính mời Quý khách thân thương</div>
    </div>
  );
}

// Default Fallback Mockup
function renderDefaultMockup(preset: ModulePresetItem) {
  return (
    <div className="w-full h-full bg-gray-50 p-2 flex flex-col justify-between">
      <div className="flex items-center justify-between text-[9px]">
        <span className="font-bold text-gray-900">{preset.name}</span>
        <span className="text-rose-600 font-bold bg-rose-50 px-1 rounded">{preset.badge}</span>
      </div>
      <div className="text-center text-lg">{preset.previewIcon}</div>
      <div className="text-[8px] text-gray-500 text-center">{preset.styleName}</div>
    </div>
  );
}
