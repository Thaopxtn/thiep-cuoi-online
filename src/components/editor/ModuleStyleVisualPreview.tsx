"use client";

import React from "react";
import {
  CreditCard,
  Calendar,
  Clock,
  MapPin,
  Check,
  Heart,
  Camera,
  Users,
  Palette,
  QrCode,
  Crown,
  Navigation,
  Sparkles,
  MessageSquare,
  Gift,
  Mail,
} from "lucide-react";

interface ModuleStyleVisualPreviewProps {
  moduleId: string;
  styleId: string;
}

export default function ModuleStyleVisualPreview({
  moduleId,
  styleId,
}: ModuleStyleVisualPreviewProps) {
  return (
    <div className="w-full h-16 rounded-xl overflow-hidden border border-gray-200/90 relative bg-white flex flex-col justify-center shadow-2xs group-hover:border-rose-400 group-hover:shadow-xs transition-all select-none pointer-events-none">
      {renderMockup(moduleId, styleId)}
    </div>
  );
}

function renderMockup(moduleId: string, styleId: string) {
  // 1. HỘP MỪNG CƯỚI / VIETQR
  if (moduleId === "giftBox") {
    if (styleId === "red-envelope") {
      return (
        <div className="w-full h-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 p-2 flex items-center justify-between text-white relative overflow-hidden">
          <div className="absolute -right-2 -bottom-2 text-red-500/30 text-4xl font-serif">囍</div>
          <div className="flex items-center gap-2 z-10">
            <div className="w-8 h-8 rounded-lg bg-red-700/80 border border-amber-300/40 flex items-center justify-center text-amber-200 font-bold text-base shadow-inner">
              囍
            </div>
            <div>
              <div className="text-[10px] font-bold text-amber-200 tracking-wide">Bao Lì Xì Đỏ</div>
              <div className="text-[8px] text-red-100/90">Mừng Cưới May Mắn</div>
            </div>
          </div>
          <div className="z-10 bg-amber-400 text-red-950 px-2 py-0.5 rounded-full text-[8px] font-bold shadow-xs">
            VietQR
          </div>
        </div>
      );
    }

    if (styleId === "luxury-gold") {
      return (
        <div className="w-full h-full bg-gradient-to-r from-slate-900 via-stone-900 to-black p-2 flex items-center justify-between text-white relative overflow-hidden border border-amber-500/30">
          <div className="flex items-center gap-2 z-10">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-stone-950 font-bold shadow-md">
              <Crown className="w-4 h-4 text-stone-950" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-amber-300">VIP Gold Card</div>
              <div className="text-[8px] text-amber-200/70 font-mono">•••• 8888 • MB</div>
            </div>
          </div>
          <div className="z-10 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[8px] font-mono">
            ROYAL
          </div>
        </div>
      );
    }

    // dual-bank-cards (default)
    return (
      <div className="w-full h-full bg-stone-50 p-1.5 flex items-center gap-1.5">
        <div className="flex-1 h-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-1.5 text-white flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-bold">MB Bank</span>
            <div className="w-2.5 h-2 bg-amber-300 rounded-xs"></div>
          </div>
          <div className="text-[7.5px] font-mono tracking-wider">•••• 6868</div>
        </div>
        <div className="flex-1 h-full rounded-lg bg-gradient-to-r from-emerald-600 to-teal-700 p-1.5 text-white flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-bold">Vietcombank</span>
            <div className="w-2.5 h-2 bg-amber-300 rounded-xs"></div>
          </div>
          <div className="text-[7.5px] font-mono tracking-wider">•••• 9999</div>
        </div>
      </div>
    );
  }

  // 2. LỊCH CƯỚI & ĐẾM NGƯỢC
  if (moduleId === "calendar") {
    if (styleId === "luxury-gold") {
      return (
        <div className="w-full h-full bg-stone-900 p-2 flex items-center justify-between border border-amber-500/30 text-amber-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex flex-col items-center justify-center">
              <span className="text-[7px] text-amber-400 font-bold">TH 11</span>
              <span className="text-xs font-bold text-amber-200">20</span>
            </div>
            <div>
              <div className="text-[10px] font-serif font-bold text-amber-300">Hoàng Gia Gold</div>
              <div className="text-[8px] text-amber-200/60">Đếm ngược kim sa</div>
            </div>
          </div>
          <div className="flex items-center gap-1 font-mono text-[9px] bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30 text-amber-300">
            <span>12d</span>:<span>08h</span>:<span>45m</span>
          </div>
        </div>
      );
    }

    if (styleId === "modern-minimal") {
      return (
        <div className="w-full h-full bg-white p-2 flex items-center justify-between text-gray-900 border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex flex-col items-center justify-center">
              <span className="text-[7px] font-mono text-gray-300">NOV</span>
              <span className="text-xs font-bold">20</span>
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-900">Minimal Black & White</div>
              <div className="text-[8px] text-gray-500">Thanh lịch hiện đại</div>
            </div>
          </div>
          <div className="text-[8px] font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
            11:00 AM
          </div>
        </div>
      );
    }

    if (styleId === "traditional-red") {
      return (
        <div className="w-full h-full bg-red-600 p-2 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-red-900 flex flex-col items-center justify-center font-bold">
              <span className="text-[7px]">NGÀY</span>
              <span className="text-xs">20</span>
            </div>
            <div>
              <div className="text-[10px] font-bold text-amber-200">Truyền Thống Song Hỷ</div>
              <div className="text-[8px] text-red-100">Ngày lành tháng tốt</div>
            </div>
          </div>
          <div className="text-base text-amber-300 font-bold">囍</div>
        </div>
      );
    }

    // classic-cream (default)
    return (
      <div className="w-full h-full bg-[#faf7f2] p-2 flex items-center justify-between border border-[#e8dfd5]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex flex-col items-center justify-center">
            <span className="text-[7px] font-bold text-rose-500">T.11</span>
            <span className="text-xs font-bold text-rose-700">20</span>
          </div>
          <div>
            <div className="text-[10px] font-serif font-bold text-stone-800">Trang Nhã Nền Kem</div>
            <div className="text-[8px] text-stone-500">Lịch để bàn đánh dấu tim ❤️</div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[8px] text-rose-600 bg-white px-2 py-0.5 rounded-full border border-rose-200 font-bold">
          <Calendar className="w-2.5 h-2.5" /> 20/11/2026
        </div>
      </div>
    );
  }

  // 3. SỰ KIỆN & CHƯƠNG TRÌNH
  if (moduleId === "events") {
    if (styleId === "vertical-timeline") {
      return (
        <div className="w-full h-full bg-stone-50 p-2 flex items-center gap-3">
          <div className="flex flex-col items-center h-full justify-center">
            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
            <div className="w-0.5 h-4 bg-rose-200"></div>
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
          </div>
          <div className="flex-1 flex flex-col justify-between py-0.5">
            <div className="flex items-center justify-between text-[8px]">
              <span className="font-bold text-stone-800">09:00 • Lễ Thành Hôn</span>
              <span className="text-stone-400">Tư gia</span>
            </div>
            <div className="flex items-center justify-between text-[8px]">
              <span className="font-bold text-stone-800">11:30 • Tiệc Cưới Thân Mật</span>
              <span className="text-rose-600 font-bold">Trung tâm</span>
            </div>
          </div>
        </div>
      );
    }

    if (styleId === "traditional-red") {
      return (
        <div className="w-full h-full bg-gradient-to-r from-red-700 to-rose-700 p-2 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <span className="text-base text-amber-300">囍</span>
            <div>
              <div className="text-[10px] font-bold text-amber-200">Thiệp Hồng Lễ Cưới</div>
              <div className="text-[8px] text-red-100">09:30 Lễ Vu Quy • 11:30 Tiệc Mừng</div>
            </div>
          </div>
          <div className="px-2 py-0.5 bg-amber-400 text-red-950 font-bold text-[8px] rounded">
            Trang trọng
          </div>
        </div>
      );
    }

    // timeline-cards (default)
    return (
      <div className="w-full h-full bg-stone-50 p-1.5 flex items-center gap-1.5">
        <div className="flex-1 h-full bg-white border border-rose-200 rounded-lg p-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[8px] text-rose-600 font-bold">
            <Clock className="w-2.5 h-2.5" /> 09:00
          </div>
          <div className="text-[8.5px] font-bold text-stone-800 truncate">Lễ Thành Hôn</div>
        </div>
        <div className="flex-1 h-full bg-white border border-indigo-200 rounded-lg p-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[8px] text-indigo-600 font-bold">
            <Clock className="w-2.5 h-2.5" /> 11:30
          </div>
          <div className="text-[8.5px] font-bold text-stone-800 truncate">Tiệc Cưới</div>
        </div>
      </div>
    );
  }

  // 4. BẢN ĐỒ & CHỈ ĐƯỜNG
  if (moduleId === "map") {
    if (styleId === "satellite_preview") {
      return (
        <div className="w-full h-full bg-slate-900 p-2 flex items-center justify-between text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:8px_8px]"></div>
          <div className="z-10 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Navigation className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-cyan-300">Vệ Tinh GPS Live</div>
              <div className="text-[8px] text-slate-400 truncate max-w-[140px]">Radar chỉ đường nhấp nháy</div>
            </div>
          </div>
          <div className="z-10 px-2 py-0.5 rounded bg-cyan-500 text-slate-950 text-[8px] font-bold">
            Mở GPS
          </div>
        </div>
      );
    }

    if (styleId === "dual_venue") {
      return (
        <div className="w-full h-full bg-stone-50 p-1.5 grid grid-cols-2 gap-1.5">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-1.5 flex flex-col justify-between">
            <span className="text-[8px] font-bold text-blue-900">Nhà Trai</span>
            <div className="text-[7.5px] text-blue-700 bg-blue-100/70 px-1 py-0.5 rounded text-center">
              Chỉ đường 📍
            </div>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-1.5 flex flex-col justify-between">
            <span className="text-[8px] font-bold text-rose-900">Nhà Gái</span>
            <div className="text-[7.5px] text-rose-700 bg-rose-100/70 px-1 py-0.5 rounded text-center">
              Chỉ đường 📍
            </div>
          </div>
        </div>
      );
    }

    if (styleId === "qr_nav") {
      return (
        <div className="w-full h-full bg-gradient-to-r from-gray-50 to-stone-100 p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white border border-gray-300 rounded-lg flex items-center justify-center text-gray-800 shadow-2xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-900">Quét Mã QR Vị Trí</div>
              <div className="text-[8px] text-gray-500">Mở app Maps trong 1 giây</div>
            </div>
          </div>
          <div className="px-2 py-1 bg-stone-900 text-white text-[8px] font-bold rounded">
            Camera Scan
          </div>
        </div>
      );
    }

    if (styleId === "royal") {
      return (
        <div className="w-full h-full bg-gradient-to-r from-amber-50 to-amber-100/60 p-2 flex items-center justify-between border-2 border-amber-300/80">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-600" />
            <div>
              <div className="text-[10px] font-serif font-bold text-amber-900">Khung Vàng Hoàng Gia</div>
              <div className="text-[8px] text-amber-700/80">Sang trọng cho khách sạn 5 sao</div>
            </div>
          </div>
          <div className="px-2 py-0.5 bg-amber-500 text-white text-[8px] font-bold rounded">
            Maps
          </div>
        </div>
      );
    }

    if (styleId === "sketch") {
      return (
        <div className="w-full h-full bg-[#fdfaf2] p-2 flex items-center justify-between border border-dashed border-[#c5ad8d]">
          <div>
            <div className="text-[10px] font-serif italic text-[#8a6845] font-bold">~ Nét Vẽ Tay Vintage ~</div>
            <div className="text-[8px] text-[#a88c6e]">Đường cong nghệ thuật hoài niệm</div>
          </div>
          <MapPin className="w-4 h-4 text-[#8a6845]" />
        </div>
      );
    }

    // minimal (default)
    return (
      <div className="w-full h-full bg-blue-50/60 p-2 flex items-center justify-between border border-blue-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-blue-950">1 Chạm Google Maps</div>
            <div className="text-[8px] text-blue-700/80">Địa chỉ hội trường & Dẫn đường</div>
          </div>
        </div>
        <div className="px-2 py-1 bg-blue-600 text-white text-[8px] font-bold rounded shadow-2xs">
          Chỉ đường
        </div>
      </div>
    );
  }

  // 5. XÁC NHẬN THAM DỰ (RSVP)
  if (moduleId === "rsvp") {
    if (styleId === "red-velvet") {
      return (
        <div className="w-full h-full bg-gradient-to-r from-red-800 to-rose-900 p-2 flex items-center justify-between text-white border border-amber-400/40">
          <div className="flex items-center gap-2">
            <span className="text-base text-amber-300">✉️</span>
            <div>
              <div className="text-[10px] font-bold text-amber-200">Nhung Đỏ Quý Phái</div>
              <div className="text-[8px] text-red-200">Xác nhận dự tiệc hoàng gia</div>
            </div>
          </div>
          <div className="px-2 py-0.5 bg-amber-400 text-red-950 font-bold text-[8px] rounded">
            Phản hồi
          </div>
        </div>
      );
    }

    if (styleId === "luxury-envelope") {
      return (
        <div className="w-full h-full bg-[#fbf8f3] p-2 flex items-center justify-between border border-[#e5dacf]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#efe5d6] border border-[#d6c4ae] flex items-center justify-center text-stone-700">
              <Mail className="w-4 h-4 text-stone-600" />
            </div>
            <div>
              <div className="text-[10px] font-serif font-bold text-stone-800">Phong Thư Mời Hồi Đáp</div>
              <div className="text-[8px] text-stone-500">Mở nắp sáp niêm phong cổ điển</div>
            </div>
          </div>
          <div className="w-3.5 h-3.5 rounded-full bg-red-700 border border-amber-300 shadow-2xs"></div>
        </div>
      );
    }

    // clean-rounded (default)
    return (
      <div className="w-full h-full bg-teal-50/60 p-2 flex items-center justify-between border border-teal-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-teal-950">Form Bo Góc Hiện Đại</div>
            <div className="text-[8px] text-teal-700">Chọn: Tham dự / Vắng mặt</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="px-1.5 py-0.5 bg-teal-600 text-white text-[8px] font-bold rounded">Sẽ tới</span>
          <span className="px-1.5 py-0.5 bg-gray-200 text-gray-700 text-[8px] font-bold rounded">Bận</span>
        </div>
      </div>
    );
  }

  // 6. SỔ LƯU BÚT & LỜI CHÚC
  if (moduleId === "wishes") {
    if (styleId === "vintage-card") {
      return (
        <div className="w-full h-full bg-[#fbf6ed] p-2 flex items-center justify-between border border-[#dfd4c0]">
          <div>
            <div className="text-[10px] font-serif font-bold text-[#7a5d3c]">Bưu Thiếp Lưu Bút Cổ Điển</div>
            <div className="text-[8px] text-[#9a7e5f]">Giấy craft vintage & tem thư kỷ niệm</div>
          </div>
          <div className="w-6 h-7 bg-white border border-stone-300 rounded p-0.5 shadow-2xs flex flex-col items-center justify-center">
            <span className="text-[6px] font-mono text-stone-400">POST</span>
            <span className="text-[8px]">💌</span>
          </div>
        </div>
      );
    }

    if (styleId === "royal-gold") {
      return (
        <div className="w-full h-full bg-stone-900 p-2 flex items-center justify-between border border-amber-500/40 text-amber-200">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[10px] font-serif font-bold text-amber-300">Sổ Vàng Ký Tên Hoàng Gia</div>
              <div className="text-[8px] text-amber-200/60">Lưu danh quý khách dát vàng</div>
            </div>
          </div>
          <span className="text-base">👑</span>
        </div>
      );
    }

    // stream-bubble (default)
    return (
      <div className="w-full h-full bg-rose-50/50 p-1.5 flex flex-col justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-rose-400 text-white text-[7px] font-bold flex items-center justify-center">
            A
          </div>
          <div className="bg-white border border-rose-200 rounded-full px-2 py-0.5 text-[8px] text-gray-700 shadow-2xs truncate max-w-[170px]">
            Chúc hai bạn trăm năm hạnh phúc! ❤️
          </div>
        </div>
        <div className="flex items-center justify-between text-[7.5px] text-rose-600 font-bold px-1">
          <span>Dòng Lời Chúc Bong Bóng</span>
          <span className="flex items-center gap-0.5 text-rose-500">
            <Heart className="w-2.5 h-2.5 fill-rose-500" /> 88 lượt thả tim
          </span>
        </div>
      </div>
    );
  }

  // 7. ALBUM ẢNH TRỰC TUYẾN
  if (moduleId === "album") {
    if (styleId === "polaroid-scrapbook") {
      return (
        <div className="w-full h-full bg-[#f8f5f0] p-1.5 flex items-center justify-between border border-[#e5dfd4]">
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-10 bg-white border border-stone-200 p-1 shadow-2xs rotate-[-4deg] flex flex-col items-center">
              <div className="w-full h-6 bg-rose-100 rounded-xs"></div>
            </div>
            <div className="w-8 h-10 bg-white border border-stone-200 p-1 shadow-2xs rotate-[4deg] flex flex-col items-center">
              <div className="w-full h-6 bg-indigo-100 rounded-xs"></div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold text-stone-800">Polaroid Kỷ Niệm</div>
            <div className="text-[8px] text-stone-500">Scrapbook kẹp gỗ ngọt ngào</div>
          </div>
        </div>
      );
    }

    if (styleId === "masonry-chic") {
      return (
        <div className="w-full h-full bg-white p-1.5 flex items-center justify-between border border-gray-200">
          <div className="flex items-center gap-1">
            <div className="w-6 h-10 bg-stone-200 rounded-xs"></div>
            <div className="w-6 h-7 bg-stone-300 rounded-xs"></div>
            <div className="w-6 h-11 bg-stone-400 rounded-xs"></div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold text-gray-900">Tạp Chí Thời Trang</div>
            <div className="text-[8px] text-gray-500">Bố cục so le nghệ thuật</div>
          </div>
        </div>
      );
    }

    // grid-modern (default)
    return (
      <div className="w-full h-full bg-pink-50/50 p-1.5 flex items-center justify-between border border-pink-200">
        <div className="grid grid-cols-2 gap-1 w-14 h-full">
          <div className="bg-pink-200 rounded-xs"></div>
          <div className="bg-rose-300 rounded-xs"></div>
          <div className="bg-purple-200 rounded-xs"></div>
          <div className="bg-pink-300 rounded-xs"></div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold text-gray-900">Lưới 2 Cột Hiện Đại</div>
          <div className="text-[8px] text-pink-700">Bộ sưu tập ảnh cưới sắc nét</div>
        </div>
      </div>
    );
  }


  // 7.5. CHUYỆN TÌNH YÊU (LOVE STORY TIMELINE)
  if (moduleId === "loveStory") {
    if (styleId === "milestone-cards") {
      return (
        <div className="w-full h-full bg-[#fffaf7] p-1.5 flex items-center justify-between border border-rose-200">
          <div className="flex items-center gap-1.5">
            <div className="px-2 py-1 bg-white rounded-lg border border-rose-200 shadow-2xs text-center">
              <span className="text-[7px] font-bold text-rose-500 block">14/02</span>
              <span className="text-[8px] font-bold text-gray-800">Gặp Nhau</span>
            </div>
            <div className="px-2 py-1 bg-white rounded-lg border border-rose-200 shadow-2xs text-center">
              <span className="text-[7px] font-bold text-rose-500 block">24/12</span>
              <span className="text-[8px] font-bold text-gray-800">Cầu Hôn 💍</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold text-rose-900">Thẻ Cột Mốc</div>
            <div className="text-[8px] text-rose-600">Khoảnh khắc ngọt ngào</div>
          </div>
        </div>
      );
    }

    if (styleId === "romantic-journal") {
      return (
        <div className="w-full h-full bg-[#fcf8f0] p-2 flex items-center justify-between border border-dashed border-[#d8c5ad]">
          <div>
            <div className="text-[10px] font-serif italic text-[#7c5535] font-bold">~ Nhật Ký Chung Đôi ~</div>
            <div className="text-[8px] text-[#9a7858]">Từng trang giấy lưu dấu kỷ niệm</div>
          </div>
          <span className="text-base">📖</span>
        </div>
      );
    }

    // vertical-timeline (default)
    return (
      <div className="w-full h-full bg-rose-50/40 p-2 flex items-center gap-3 border border-rose-200/80">
        <div className="flex flex-col items-center h-full justify-center">
          <div className="w-2 h-2 rounded-full bg-rose-500"></div>
          <div className="w-0.5 h-4 bg-rose-300"></div>
          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
        </div>
        <div className="flex-1 flex flex-col justify-between py-0.5">
          <div className="flex items-center justify-between text-[8px]">
            <span className="font-bold text-gray-900">14/02 • Lần Đầu Gặp Gỡ</span>
            <span className="text-rose-500">☕</span>
          </div>
          <div className="flex items-center justify-between text-[8px]">
            <span className="font-bold text-gray-900">Chung Đôi • Ngày Cưới</span>
            <span className="text-amber-600">💍</span>
          </div>
        </div>
      </div>
    );
  }

  // 8. ĐẠI DIỆN HAI HỌ / BAN TỔ CHỨC
  if (moduleId === "family") {
    if (styleId === "modern") {
      return (
        <div className="w-full h-full bg-white p-1.5 grid grid-cols-2 divide-x divide-gray-200 border border-gray-200 text-center">
          <div className="flex flex-col justify-center px-1">
            <span className="text-[7.5px] font-bold text-gray-400">NHÀ TRAI</span>
            <span className="text-[8.5px] font-bold text-gray-900 truncate">Ông Hùng & Bà Lan</span>
          </div>
          <div className="flex flex-col justify-center px-1">
            <span className="text-[7.5px] font-bold text-gray-400">NHÀ GÁI</span>
            <span className="text-[8.5px] font-bold text-gray-900 truncate">Ông Thành & Bà Mai</span>
          </div>
        </div>
      );
    }

    if (styleId === "royal") {
      return (
        <div className="w-full h-full bg-gradient-to-r from-amber-50 to-stone-100 p-2 flex items-center justify-between border-2 border-amber-300">
          <Crown className="w-4 h-4 text-amber-600" />
          <div className="text-center">
            <div className="text-[10px] font-serif font-bold text-amber-900">Khung Hoa Hoàng Gia</div>
            <div className="text-[8px] text-amber-700">Hoa văn Baroque bao quanh tên phụ mẫu</div>
          </div>
          <Sparkles className="w-4 h-4 text-amber-500" />
        </div>
      );
    }

    // songhy (default)
    return (
      <div className="w-full h-full bg-amber-50/60 p-1.5 flex items-center justify-between border border-amber-200 text-center">
        <div className="flex-1 min-w-0">
          <span className="text-[7px] text-amber-800 font-bold block">NHÀ TRAI</span>
          <span className="text-[8px] font-bold text-gray-800 truncate block">Ông Hùng - Bà Lan</span>
        </div>
        <div className="w-6 h-6 rounded-full bg-red-600 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
          囍
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[7px] text-amber-800 font-bold block">NHÀ GÁI</span>
          <span className="text-[8px] font-bold text-gray-800 truncate block">Ông Thành - Bà Mai</span>
        </div>
      </div>
    );
  }

  // 9. DRESS CODE TRANG PHỤC
  if (moduleId === "dresscode") {
    if (styleId === "gold_black") {
      return (
        <div className="w-full h-full bg-stone-900 p-2 flex items-center justify-between text-white border border-amber-500/40">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-black border border-stone-600 shadow-xs"></div>
            <div className="w-5 h-5 rounded-full bg-[#d4af37] border border-amber-200 shadow-xs"></div>
            <div className="w-5 h-5 rounded-full bg-white border border-stone-300 shadow-xs"></div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold text-amber-300">Dạ Tiệc Gold & Black</div>
            <div className="text-[8px] text-stone-400">Đen, Vàng Gold, Trắng ánh kim</div>
          </div>
        </div>
      );
    }

    if (styleId === "terracotta") {
      return (
        <div className="w-full h-full bg-[#fdfaf7] p-2 flex items-center justify-between border border-[#e8d5c4]">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-[#c86d51] shadow-xs"></div>
            <div className="w-5 h-5 rounded-full bg-[#b87d4b] shadow-xs"></div>
            <div className="w-5 h-5 rounded-full bg-[#d9b48f] shadow-xs"></div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold text-[#8a4b36]">Màu Đất Terracotta</div>
            <div className="text-[8px] text-stone-500">Cam cháy, Nâu ấm, Nude Boho</div>
          </div>
        </div>
      );
    }

    // pastel_romance (default)
    return (
      <div className="w-full h-full bg-fuchsia-50/50 p-2 flex items-center justify-between border border-fuchsia-200">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-[#f7d6d0] border border-rose-200 shadow-xs"></div>
          <div className="w-5 h-5 rounded-full bg-[#e0bfb8] border border-rose-200 shadow-xs"></div>
          <div className="w-5 h-5 rounded-full bg-[#f5f5dc] border border-stone-200 shadow-xs"></div>
          <div className="w-5 h-5 rounded-full bg-[#d4af37] border border-amber-200 shadow-xs"></div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold text-fuchsia-950">Pastel Lãng Mạn</div>
          <div className="text-[8px] text-fuchsia-700">Hồng phấn, Be, Champagne</div>
        </div>
      </div>
    );
  }

  // 10. LỜI NGỎ & LOVE STORY
  if (moduleId === "intro") {
    if (styleId === "story_milestone") {
      return (
        <div className="w-full h-full bg-stone-50 p-2 flex items-center justify-between border border-stone-200">
          <div className="flex items-center gap-2">
            <span className="text-base">💍</span>
            <div>
              <div className="text-[10px] font-bold text-stone-900">Mốc Thời Gian Yêu Nhau</div>
              <div className="text-[8px] text-stone-500">Từng dấu mốc từ lúc quen nhau đến ngày chung đôi</div>
            </div>
          </div>
        </div>
      );
    }

    if (styleId === "thankyou") {
      return (
        <div className="w-full h-full bg-rose-50/60 p-2 flex items-center justify-between border border-rose-200">
          <div className="flex items-center gap-2">
            <span className="text-base">💐</span>
            <div>
              <div className="text-[10px] font-bold text-rose-950">Lời Tri Ân Sâu Sắc</div>
              <div className="text-[8px] text-rose-700">Thông điệp cảm ơn gửi tới quan khách tham dự</div>
            </div>
          </div>
        </div>
      );
    }

    // quote_timeless (default)
    return (
      <div className="w-full h-full bg-[#faf7f5] p-2 flex items-center justify-between border border-[#e8ded8]">
        <div className="flex items-center gap-2">
          <span className="text-base text-rose-500">❤️</span>
          <div>
            <div className="text-[10px] font-serif italic text-stone-800 font-bold">"Hẹn nhau trong ngày hạnh phúc..."</div>
            <div className="text-[8px] text-stone-500">Trích dẫn chữ nghiêng lãng mạn</div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="w-full h-full bg-gray-50 flex items-center justify-center text-xs text-gray-500 font-bold">
      {styleId}
    </div>
  );
}
