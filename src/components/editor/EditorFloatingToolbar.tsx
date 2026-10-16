"use client";

import React from "react";

export interface FloatingToolbarProps {
  selectedElement?: any;
  canvasWidth?: number;
  onUpdateProps?: any;
  onDuplicate?: any;
  onDelete?: any;
  onOpenImageDrawer?: any;
  onRemoveBackground?: any;
  onOpenManualCutout?: any;
}

// Giữ lại hằng số dự phòng cho type safety
export const QUICK_COLORS = [
  { label: "Đỏ Đô Hoàng Gia", value: "#780405" },
  { label: "Đỏ Ruby Lãng Mạn", value: "#e54153" },
  { label: "Vàng Gold Ánh Kim", value: "#d4af37" },
  { label: "Vàng Đồng Cổ Điển", value: "#c5a880" },
  { label: "Đen Than Sang Trọng", value: "#1c171a" },
  { label: "Nâu Tây Thanh Lịch", value: "#4a3b32" },
  { label: "Xanh Navy Quý Phái", value: "#1e3a8a" },
  { label: "Hồng Phấn Ngọt Ngào", value: "#f43f5e" },
  { label: "Trắng Tinh Khôi", value: "#ffffff" },
];

export const QUICK_FONTS = [
  { label: "Charmonman (Chữ ký hoàng gia)", value: "font-charmonman" },
  { label: "Charm (Thư pháp thanh lịch)", value: "font-charm" },
  { label: "Dancing Script (Thư pháp trẻ trung)", value: "font-dancing-script" },
  { label: "Great Vibes (Thư pháp uốn lượn)", value: "font-great-vibes" },
  { label: "Alex Brush (Chữ ký thanh thoát)", value: "font-alex-brush" },
  { label: "Playfair Display (Cổ điển sang trọng)", value: "font-playfair" },
  { label: "Lora (Serif tinh tế chuẩn mực)", value: "font-lora" },
  { label: "Cormorant Garamond (Đẳng cấp châu Âu)", value: "font-cormorant" },
  { label: "Cinzel (Hoàng gia La Mã)", value: "font-cinzel" },
  { label: "Be Vietnam Pro (Chuẩn quốc dân)", value: "font-vietnam" },
  { label: "Montserrat (Hình khối hiện đại)", value: "font-montserrat" },
  { label: "Plus Jakarta Sans (Mượt mà thời thượng)", value: "font-jakarta" },
];

/**
 * DEPRECATED: Đã được thay thế hoàn toàn bởi EditorTopContextualBar (nằm ngoài khung thiệp, cố định trên cùng).
 * Component này trả về null để đảm bảo 100% KHÔNG BAO GIỜ hiển thị đè lên chữ trên canvas thiệp cưới.
 */
export default function EditorFloatingToolbar(_props: FloatingToolbarProps) {
  return null;
}
