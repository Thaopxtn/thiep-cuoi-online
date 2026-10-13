/**
 * Danh mục Module Đa Mẫu cho Trình Thiết Kế Thiệp Cưới ZenLove
 * Cho phép người dùng lựa chọn nhiều phong cách (Styles) khác nhau cho từng Module.
 */

export interface ModulePresetItem {
  id: string;
  category: "calendar" | "ceremony" | "family" | "banking" | "rsvp" | "dresscode" | "intro";
  name: string;
  styleName: string;
  previewIcon: string;
  badge: string;
  type: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultProps: Record<string, any>;
}

export const MODULE_CATEGORIES = [
  { id: "calendar", name: "Lịch & Đếm ngược", icon: "📅" },
  { id: "ceremony", name: "Hôn lễ & Sự kiện", icon: "💒" },
  { id: "family", name: "Thông tin hai họ", icon: "👥" },
  { id: "banking", name: "Hộp mừng cưới", icon: "🎁" },
  { id: "rsvp", name: "Xác nhận tham dự", icon: "💌" },
  { id: "dresscode", name: "Trang phục", icon: "👗" },
  { id: "intro", name: "Lời ngỏ & Cảm ơn", icon: "✍️" },
] as const;

export const MODULE_PRESETS: ModulePresetItem[] = [
  // 1. LỊCH & ĐẾM NGƯỢC
  {
    id: "calendar_style_classic",
    category: "calendar",
    name: "Lịch Tháng Cổ Điển",
    styleName: "Mẫu 1: Tối giản",
    previewIcon: "📅",
    badge: "Phổ biến",
    type: "CalendarBoxV2",
    defaultWidth: 440,
    defaultHeight: 180,
    defaultProps: {
      selectedDate: "2026-11-18",
      targetTime: "11:00",
      primaryColor: "#511419",
      accentColor: "#d4af37",
      textColor: "#333333",
      styleVariant: "classic",
    },
  },
  {
    id: "calendar_style_royal",
    category: "calendar",
    name: "Lịch Khung Vàng Hoàng Gia",
    styleName: "Mẫu 2: Dát vàng",
    previewIcon: "✨",
    badge: "Sang trọng",
    type: "CalendarBoxV2",
    defaultWidth: 440,
    defaultHeight: 190,
    defaultProps: {
      selectedDate: "2026-11-18",
      targetTime: "11:00",
      primaryColor: "#7a1a24",
      accentColor: "#ffd700",
      textColor: "#2b1014",
      styleVariant: "royal",
    },
  },
  {
    id: "countdown_style_hearts",
    category: "calendar",
    name: "Đồng Hồ Đếm Ngược Trái Tim",
    styleName: "Mẫu 3: 4 Ô số đếm",
    previewIcon: "⏳",
    badge: "Sinh động",
    type: "CountdownBoxV2",
    defaultWidth: 440,
    defaultHeight: 110,
    defaultProps: {
      targetDate: "2026-11-18",
      targetTime: "11:00",
      primaryColor: "#511419",
      accentColor: "#e54153",
      textColor: "#1f2937",
    },
  },

  // 2. HÔN LỄ & SỰ KIỆN
  {
    id: "ceremony_style_classic",
    category: "ceremony",
    name: "Chương Trình Hôn Lễ Chi Tiết",
    styleName: "Mẫu 1: Thẻ trang trọng",
    previewIcon: "💒",
    badge: "Chuẩn lễ",
    type: "CeremonyBox",
    defaultWidth: 440,
    defaultHeight: 140,
    defaultProps: {
      ceremonyName: "Lễ Thành Hôn",
      date: "11:00 • 18/11/2026",
      location: "Trung tâm Tiệc cưới Trống Đồng Palace, 72 Quán Sứ, Hoàn Kiếm, Hà Nội",
      primaryColor: "#511419",
      textColor: "#333333",
    },
  },
  {
    id: "ceremony_style_timeline",
    category: "ceremony",
    name: "Dòng Thời Gian Ngày Cưới",
    styleName: "Mẫu 2: Dòng thời gian",
    previewIcon: "⏰",
    badge: "Hiện đại",
    type: "TimelineBox",
    defaultWidth: 440,
    defaultHeight: 220,
    defaultProps: {
      primaryColor: "#7a1a24",
      textColor: "#374151",
    },
  },
  {
    id: "ceremony_style_map",
    category: "ceremony",
    name: "Bản Đồ Google Maps Dẫn Đường",
    styleName: "Mẫu 3: Bản đồ 1 chạm",
    previewIcon: "🗺️",
    badge: "Tiện ích",
    type: "MapBox",
    defaultWidth: 440,
    defaultHeight: 120,
    defaultProps: {
      venueName: "Trung tâm Tiệc cưới",
      address: "Số 72 Quán Sứ, Hoàn Kiếm, Hà Nội",
      mapUrl: "https://maps.google.com/?q=Hanoi",
    },
  },

  // 3. THÔNG TIN HAI HỌ
  {
    id: "family_style_two_columns",
    category: "family",
    name: "Thông Tin Hai Họ Đối Xứng",
    styleName: "Mẫu 1: Nhà Trai & Nhà Gái",
    previewIcon: "👥",
    badge: "Cân đối",
    type: "FamilyInfoBox",
    defaultWidth: 440,
    defaultHeight: 130,
    defaultProps: {
      groomFather: "Ông Nguyễn Văn Hùng",
      groomMother: "Bà Trần Thị Lan",
      groomName: "Đức Mạnh",
      brideFather: "Ông Lê Văn Thành",
      brideMother: "Bà Vũ Thị Mai",
      brideName: "Thùy Dung",
      primaryColor: "#511419",
      textColor: "#374151",
    },
  },
  {
    id: "family_style_traditional",
    category: "family",
    name: "Họ Hàng Truyền Thống Song Hỷ",
    styleName: "Mẫu 2: Đỏ son chữ Hỷ",
    previewIcon: "囍",
    badge: "Truyền thống",
    type: "FamilyInfoBox",
    defaultWidth: 440,
    defaultHeight: 140,
    defaultProps: {
      groomFather: "Ông Nguyễn Quốc Dũng",
      groomMother: "Bà Lê Thị Kim",
      groomName: "Quốc Bảo",
      brideFather: "Ông Đặng Văn Minh",
      brideMother: "Bà Huỳnh Thị Nga",
      brideName: "Thanh Trúc",
      primaryColor: "#8b1520",
      textColor: "#1f2937",
    },
  },

  // 4. HỘP MỪNG CƯỚI (VIETQR)
  {
    id: "banking_style_dual",
    category: "banking",
    name: "Hộp Mừng Cưới 2 Họ (2 VietQR)",
    styleName: "Mẫu 1: Cả Dâu & Rể",
    previewIcon: "🎁",
    badge: "Napas 24/7",
    type: "BankCardBox",
    defaultWidth: 440,
    defaultHeight: 280,
    defaultProps: {
      title: "HỘP MỪNG CƯỚI ONLINE",
      description: "Sự hiện diện của quý vị là món quà quý giá nhất dành cho chúng tôi.",
      primaryColor: "#511419",
      textColor: "#333333",
    },
  },
  {
    id: "banking_style_single",
    category: "banking",
    name: "Hộp Mừng Cưới Đơn (1 VietQR)",
    styleName: "Mẫu 2: Thẻ trung tâm",
    previewIcon: "💳",
    badge: "Gọn gàng",
    type: "GiftQrBox",
    defaultWidth: 420,
    defaultHeight: 220,
    defaultProps: {
      modalTitle: "Hộp Quà Mừng Cưới (VietQR)",
      bankName: "MB BANK",
      accountNumber: "240220038888",
      accountName: "NGUYEN VAN HUNG",
    },
  },

  // 5. XÁC NHẬN THAM DỰ (RSVP)
  {
    id: "rsvp_style_modern",
    category: "rsvp",
    name: "Biểu Mẫu Xác Nhận Tham Dự",
    styleName: "Mẫu 1: Form hiện đại",
    previewIcon: "📝",
    badge: "Trực quan",
    type: "RsvpBoxV2",
    defaultWidth: 440,
    defaultHeight: 320,
    defaultProps: {
      title: "Xác Nhận Tham Dự",
      description: "Để chuẩn bị chu đáo nhất, xin vui lòng gửi phản hồi trước ngày hôn lễ.",
      primaryColor: "#e54153",
    },
  },

  // 6. TRANG PHỤC (DRESS CODE)
  {
    id: "dresscode_style_palette",
    category: "dresscode",
    name: "Bảng Màu Trang Phục Dự Tiệc",
    styleName: "Mẫu 1: 5 Gam màu",
    previewIcon: "🎨",
    badge: "Dress Code",
    type: "DressCodeBox",
    defaultWidth: 440,
    defaultHeight: 125,
    defaultProps: {
      description: "Khuyến khích trang phục màu Be, Hồng phấn, Nâu tây hoặc Trắng kem.",
      colors: ["#F5F5DC", "#FFD1DC", "#D2B48C", "#FFF8DC", "#2F4F4F"],
      primaryColor: "#511419",
      textColor: "#374151",
    },
  },

  // 7. LỜI NGỎ & CẢM ƠN
  {
    id: "intro_style_quote",
    category: "intro",
    name: "Lời Ngỏ & Danh Ngôn Tình Yêu",
    styleName: "Mẫu 1: Chữ thảo lãng mạn",
    previewIcon: "✍️",
    badge: "Cảm xúc",
    type: "TextBox",
    defaultWidth: 420,
    defaultHeight: 90,
    defaultProps: {
      text: `<p style="font-family:'Cormorant Garamond', serif; font-size:16px; font-style:italic; line-height:1.6; text-align:center; color:#511419;">"Hạnh phúc không phải là điểm đến, mà là hành trình ta cùng nhau bước qua mỗi ngày."</p>`,
      fontFamily: "font-cormorant",
      fontSize: 16,
      color: "#511419",
      textAlign: "center",
      lineHeight: 1.6,
    },
  },
  {
    id: "thankyou_style_handwritten",
    category: "intro",
    name: "Lời Cảm Ơn Kết Thiệp",
    styleName: "Mẫu 2: Thank You thư pháp",
    previewIcon: "🌸",
    badge: "Kết thúc",
    type: "TextBox",
    defaultWidth: 420,
    defaultHeight: 95,
    defaultProps: {
      text: `<div style="text-align:center;"><p style="font-family:'Great Vibes', cursive; font-size:28px; color:#511419; margin-bottom:4px;">Thank You!</p><p style="font-size:13px; color:#6b7280; font-style:italic;">Cảm ơn vì đã luôn yêu thương và chung vui cùng chúng tôi!</p></div>`,
      fontFamily: "font-great-vibes",
      fontSize: 24,
      color: "#511419",
      textAlign: "center",
    },
  },
];

export function getPresetsByCategory(category: string): ModulePresetItem[] {
  return MODULE_PRESETS.filter((p) => p.category === category);
}
