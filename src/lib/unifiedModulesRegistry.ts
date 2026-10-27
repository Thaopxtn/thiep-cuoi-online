import React from "react";
import {
  CreditCard,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Check,
  MessageSquare,
  Camera,
  Users,
  Palette,
  Heart,
  Sparkles,
  Phone,
  Gift,
} from "lucide-react";
import { WeddingCard } from "@/data/initialCards";
import { MODULE_STYLE_CATALOG, FixedModuleId } from "./fixedModulesCatalog";
import { MODULE_PRESETS } from "./modulePresetsCatalog";

export type UnifiedModuleId =
  | "giftBox"
  | "calendar"
  | "events"
  | "map"
  | "rsvp"
  | "wishes"
  | "album"
  | "family"
  | "dresscode"
  | "loveStory"
  | "intro";

export type ThemeCategoryId =
  | "wedding"      // Mời cưới
  | "birthday"     // Sinh nhật
  | "event"        // Sự kiện
  | "conference"   // Hội nghị
  | "graduation"   // Tốt nghiệp
  | "political"    // Chính trị
  | "education"    // Học tập
  | "other";       // Đồ họa khác

export interface ThemeCategoryDef {
  id: ThemeCategoryId;
  label: string;
  icon: string;
  description: string;
}

export const THEME_CATEGORIES: ThemeCategoryDef[] = [
  { id: "wedding", label: "Mời cưới", icon: "💍", description: "Khối mẫu thiệp cưới, lễ ăn hỏi, đính hôn, vu quy" },
  { id: "birthday", label: "Sinh nhật", icon: "🎂", description: "Khối mẫu tiệc sinh nhật, thôi nôi, mừng thọ" },
  { id: "event", label: "Sự kiện", icon: "🎉", description: "Khối mẫu khai trương, gala dinner, party, liên hoan" },
  { id: "conference", label: "Hội nghị", icon: "🏛️", description: "Khối mẫu hội thảo, tọa đàm, diễn đàn doanh nghiệp" },
  { id: "graduation", label: "Tốt nghiệp", icon: "🎓", description: "Khối mẫu lễ trao bằng, tri ân thầy cô, kỷ yếu" },
  { id: "political", label: "Chính trị", icon: "⭐", description: "Khối mẫu đại hội, hội nghị ban ngành, đoàn thể" },
  { id: "education", label: "Học tập", icon: "📚", description: "Khối mẫu khóa học, workshop, đào tạo, học thuật" },
  { id: "other", label: "Đồ họa khác", icon: "🎨", description: "Các khối đồ họa, biểu mẫu và trang trí đa năng" },
];

export function getDefaultThemeCategory(
  templateCategory?: string,
  cardCategory?: string
): ThemeCategoryId {
  const text = `${templateCategory || ""} ${cardCategory || ""}`.toLowerCase();
  if (text.includes("sinh-nhat") || text.includes("sinh nhật") || text.includes("birthday")) {
    return "birthday";
  }
  if (text.includes("tot-nghiep") || text.includes("tốt nghiệp") || text.includes("graduation")) {
    return "graduation";
  }
  if (text.includes("hoi-nghi") || text.includes("hội nghị") || text.includes("conference") || text.includes("hoi-thao")) {
    return "conference";
  }
  if (text.includes("chinh-tri") || text.includes("chính trị") || text.includes("political") || text.includes("dai-hoi")) {
    return "political";
  }
  if (text.includes("hoc-tap") || text.includes("học tập") || text.includes("education") || text.includes("khoa-hoc")) {
    return "education";
  }
  if (text.includes("su-kien") || text.includes("sự kiện") || text.includes("event") || text.includes("ky-niem")) {
    return "event";
  }
  if (text.includes("do-hoa") || text.includes("khac") || text.includes("other")) {
    return "other";
  }
  return "wedding";
}

export interface UnifiedStyleOption {
  id: string;
  name: string;
  badge?: string;
  icon: string;
  description?: string;
  previewBg?: string;
}

export interface UnifiedModuleDef {
  id: UnifiedModuleId;
  name: string;
  category: string;
  categoryLabel: string;
  themeCategories?: ThemeCategoryId[];
  customTitleByTheme?: Partial<Record<ThemeCategoryId, string>>;
  customSummaryByTheme?: Partial<Record<ThemeCategoryId, string>>;
  Icon: any;
  iconBgClass: string;
  iconColorClass: string;
  borderHoverClass: string;
  badgeColorClass: string;
  isFixed: boolean;
  widgetType?: string;
  fixedModuleId?: FixedModuleId;
  defaultWidth?: number;
  defaultHeight?: number;
  defaultProps?: Record<string, any>;
  styles: UnifiedStyleOption[];
  getSummary: (card: WeddingCard | null | undefined, nodes: Record<string, any>, theme?: ThemeCategoryId) => string;
  isActive: (card: WeddingCard | null | undefined, nodes: Record<string, any>) => boolean;
  findNodeId?: (nodes: Record<string, any>) => string | null;
}

export const UNIFIED_WEDDING_MODULES: UnifiedModuleDef[] = [
  // 1. HỘP MỪNG CƯỚI (VIETQR)
  {
    id: "giftBox",
    name: "Hộp Mừng Cưới (VietQR)",
    category: "giftBox",
    categoryLabel: "Mừng cưới",
    themeCategories: ["wedding", "birthday", "event", "education", "other"],
    customTitleByTheme: {
      wedding: "Hộp Mừng Cưới (VietQR)",
      birthday: "Hộp Quà & STK Mừng Tuổi Mới",
      event: "Ủng Hộ & Tài Trợ Sự Kiện",
      education: "Đóng Học Phí / Ủng Hộ Khóa Học",
      other: "Mã Thanh Toán & STK (VietQR)",
    },
    Icon: CreditCard,
    iconBgClass: "bg-emerald-50 text-emerald-600",
    iconColorClass: "text-emerald-600",
    borderHoverClass: "hover:border-emerald-300",
    badgeColorClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    isFixed: true,
    fixedModuleId: "giftBox",
    styles: MODULE_STYLE_CATALOG.giftBox?.styles || [
      { id: "dual-bank-cards", name: "2 Thẻ Ngân Hàng", icon: "💳", badge: "Mặc định" },
      { id: "red-envelope", name: "Bao Lì Xì Đỏ", icon: "🧧", badge: "May mắn" },
      { id: "luxury-gold", name: "Hoàng Gia Gold", icon: "👑", badge: "VIP" },
    ],
    getSummary: (card) => {
      const bank = card?.groom?.bankName || "MB Bank";
      const hasAcc = Boolean(card?.groom?.accountNumber);
      return `${bank} • ${hasAcc ? "✓ Đã có STK" : "Chưa nhập STK"}`;
    },
    isActive: (card) => card?.showGiftBox !== false,
  },

  // 2. LỊCH CƯỚI & ĐẾM NGƯỢC
  {
    id: "calendar",
    name: "Lịch Cưới & Đếm Ngược",
    category: "calendar",
    categoryLabel: "Lịch cưới",
    themeCategories: ["wedding", "birthday", "event", "conference", "graduation", "political", "education", "other"],
    customTitleByTheme: {
      wedding: "Lịch Cưới & Đếm Ngược",
      birthday: "Lịch Tiệc Sinh Nhật & Đếm Ngược",
      event: "Lịch & Đếm Ngược Khai Mạc",
      conference: "Thời Gian Hội Nghị & Đếm Ngược",
      graduation: "Lễ Tốt Nghiệp & Đếm Ngược",
      political: "Thời Gian Đại Hội & Đếm Ngược",
      education: "Lịch Khai Giảng & Đếm Ngược",
      other: "Lịch Sự Kiện & Đếm Ngược",
    },
    Icon: CalendarIcon,
    iconBgClass: "bg-indigo-50 text-indigo-600",
    iconColorClass: "text-indigo-600",
    borderHoverClass: "hover:border-indigo-300",
    badgeColorClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
    isFixed: true,
    fixedModuleId: "calendar",
    styles: MODULE_STYLE_CATALOG.calendar?.styles || [
      { id: "classic-cream", name: "Trang Nhã Nền Kem", icon: "🗓️", badge: "Phổ biến" },
      { id: "luxury-gold", name: "Hoàng Gia Gold", icon: "✨", badge: "Sang trọng" },
      { id: "modern-minimal", name: "Tối Giản Hiện Đại", icon: "🖤" },
      { id: "traditional-red", name: "Truyền Thống Song Hỷ", icon: "囍", badge: "Truyền thống" },
    ],
    getSummary: (card) => {
      const date = card?.weddingDate ? card.weddingDate.split("-").reverse().join("/") : "20/11/2026";
      const time = card?.weddingTime || "11:00";
      return `${date} • ${time}`;
    },
    isActive: (card) => card?.showCalendar !== false,
  },

  // 3. CHƯƠNG TRÌNH HÔN LỄ & SỰ KIỆN
  {
    id: "events",
    name: "Sự Kiện & Lễ Cưới",
    category: "events",
    categoryLabel: "Sự kiện",
    themeCategories: ["wedding", "birthday", "event", "conference", "graduation", "political", "education", "other"],
    customTitleByTheme: {
      wedding: "Sự Kiện & Lễ Cưới",
      birthday: "Chương Trình Tiệc Sinh Nhật",
      event: "Lịch Trình Sự Kiện / Agenda",
      conference: "Chương Trình Hội Nghị / Tọa Đàm",
      graduation: "Chương Trình Lễ Tốt Nghiệp",
      political: "Nội Dung & Chương Trình Đại Hội",
      education: "Lộ Trình / Giáo Trình Buổi Học",
      other: "Lịch Trình Các Mốc Thời Gian",
    },
    Icon: Clock,
    iconBgClass: "bg-purple-50 text-purple-600",
    iconColorClass: "text-purple-600",
    borderHoverClass: "hover:border-purple-300",
    badgeColorClass: "bg-purple-50 text-purple-700 border-purple-200",
    isFixed: true,
    fixedModuleId: "events",
    styles: MODULE_STYLE_CATALOG.events?.styles || [
      { id: "timeline-cards", name: "Thẻ Sự Kiện Độc Lập", icon: "📇", badge: "Mặc định" },
      { id: "vertical-timeline", name: "Dòng Thời Gian Dọc", icon: "⏳", badge: "Nghệ thuật" },
      { id: "traditional-red", name: "Thiệp Hồng Lễ Cưới", icon: "🧧", badge: "Truyền thống" },
    ],
    getSummary: (card) => {
      const venue = card?.events?.[0]?.venue || "Địa điểm tiệc cưới";
      const count = card?.events?.length || 1;
      return `${venue} • ${count} sự kiện`;
    },
    isActive: (card) => card?.showEvents !== false,
  },

  // 4. BẢN ĐỒ & CHỈ ĐƯỜNG GOOGLE MAPS
  {
    id: "map",
    name: "Bản Đồ & Chỉ Đường",
    category: "map",
    categoryLabel: "Bản đồ",
    themeCategories: ["wedding", "birthday", "event", "conference", "graduation", "political", "education", "other"],
    customTitleByTheme: {
      wedding: "Bản Đồ & Chỉ Đường",
      birthday: "Địa Điểm Tiệc & Chỉ Đường",
      event: "Địa Điểm Tổ Chức & Bản Đồ",
      conference: "Trung Tâm Hội Nghị & Chỉ Đường",
      graduation: "Giảng Đường / Hội Trường & Bản Đồ",
      political: "Hội Trường Ban Ngành & Chỉ Đường",
      education: "Phòng Học / Đào Tạo & Chỉ Đường",
      other: "Bản Đồ Google Maps Dẫn Đường",
    },
    Icon: MapPin,
    iconBgClass: "bg-blue-50 text-blue-600",
    iconColorClass: "text-blue-600",
    borderHoverClass: "hover:border-blue-300",
    badgeColorClass: "bg-blue-50 text-blue-700 border-blue-200",
    isFixed: false,
    widgetType: "MapBox",
    defaultWidth: 440,
    defaultHeight: 180,
    defaultProps: {
      venueName: "Trung tâm Tiệc cưới Trống Đồng Palace",
      address: "Số 72 Quán Sứ, Hoàn Kiếm, Hà Nội",
      styleVariant: "minimal",
    },
    styles: [
      { id: "minimal", name: "1 Chạm Tối Giản", icon: "🗺️", badge: "Phổ biến", description: "Tên hội trường, địa chỉ và nút mở Google Maps" },
      { id: "satellite_preview", name: "Ảnh Vệ Tinh Trực Quan", icon: "🛰️", badge: "Trực quan", description: "Bản đồ vệ tinh có ghim vị trí nhấp nháy" },
      { id: "dual_venue", name: "Cột Đôi Nhà Trai & Gái", icon: "📍", badge: "Song hành", description: "Chỉ đường riêng biệt cho hai bên gia đình" },
      { id: "qr_nav", name: "Quét Mã QR Định Vị", icon: "📱", badge: "Công nghệ", description: "Quét mã bằng camera để mở bản đồ tức thì" },
      { id: "royal", name: "Khung Vàng Hoàng Gia", icon: "✨", badge: "Hoàng gia", description: "Viền hoa văn sang trọng cho khách sạn 5 sao" },
      { id: "sketch", name: "Nét Mực Vẽ Tay Nghệ Thuật", icon: "🎨", badge: "Cổ điển", description: "Đường nét vẽ tay ấm áp và hoài niệm" },
    ],
    getSummary: (card, nodes) => {
      const mapNode = Object.values(nodes).find((n: any) => n?.type?.resolvedName === "MapBox" || n?.props?.styleVariant?.includes?.("map"));
      if (mapNode?.props?.venueName || mapNode?.props?.title) {
        return `${mapNode.props.venueName || mapNode.props.title} • Google Maps`;
      }
      const eventVenue = card?.events?.[0]?.venue;
      if (eventVenue) return `${eventVenue} • Chỉ đường`;
      return "Google Maps dẫn đường 1 chạm";
    },
    isActive: (_, nodes) => {
      return Object.values(nodes).some((n: any) => n?.type?.resolvedName === "MapBox");
    },
    findNodeId: (nodes) => {
      const entry = Object.entries(nodes).find(([, n]: [string, any]) => n?.type?.resolvedName === "MapBox");
      return entry ? entry[0] : null;
    },
  },

  // 5. XÁC NHẬN THAM DỰ (RSVP)
  {
    id: "rsvp",
    name: "Xác Nhận Tham Dự (RSVP)",
    category: "rsvp",
    categoryLabel: "RSVP",
    themeCategories: ["wedding", "birthday", "event", "conference", "graduation", "political", "education", "other"],
    customTitleByTheme: {
      wedding: "Xác Nhận Tham Dự (RSVP)",
      birthday: "Xác Nhận Dự Sinh Nhật (RSVP)",
      event: "Đăng Ký Tham Dự Sự Kiện",
      conference: "Xác Nhận Tham Dự (Đại Biểu)",
      graduation: "Đăng Ký Dự Lễ Tốt Nghiệp",
      political: "Điểm Danh & Xác Nhận Đại Biểu",
      education: "Đăng Ký Ghi Danh Khóa Học",
      other: "Phiếu Đăng Ký / Phản Hồi",
    },
    Icon: Check,
    iconBgClass: "bg-teal-50 text-teal-600",
    iconColorClass: "text-teal-600",
    borderHoverClass: "hover:border-teal-300",
    badgeColorClass: "bg-teal-50 text-teal-700 border-teal-200",
    isFixed: true,
    fixedModuleId: "rsvp",
    styles: MODULE_STYLE_CATALOG.rsvp?.styles || [
      { id: "clean-rounded", name: "Form Bo Góc Hiện Đại", icon: "💌", badge: "Mặc định" },
      { id: "red-velvet", name: "Nhung Đỏ Quý Phái", icon: "🌹", badge: "Quý phái" },
      { id: "luxury-envelope", name: "Phong Thư Mời Hồi Đáp", icon: "✉️" },
    ],
    getSummary: () => "Thu thập phản hồi & ước tính khách dự",
    isActive: (card) => card?.showRsvp !== false,
  },

  // 6. SỔ LƯU BÚT & LỜI CHÚC MỪNG
  {
    id: "wishes",
    name: "Sổ Lưu Bút & Lời Chúc",
    category: "wishes",
    categoryLabel: "Lời chúc",
    themeCategories: ["wedding", "birthday", "event", "conference", "graduation", "political", "education", "other"],
    customTitleByTheme: {
      wedding: "Sổ Lưu Bút & Lời Chúc",
      birthday: "Lời Chúc Mừng Sinh Nhật",
      event: "Gửi Lời Chúc Mừng Sự Kiện",
      conference: "Đóng Góp Ý Kiến & Lưu Niệm",
      graduation: "Lưu Bút Kỷ Niệm Tốt Nghiệp",
      political: "Sổ Lưu Niệm & Lời Chúc Đại Hội",
      education: "Cảm Nhận & Đánh Giá Khóa Học",
      other: "Hộp Lời Nhắn & Bình Luận",
    },
    Icon: MessageSquare,
    iconBgClass: "bg-rose-50 text-rose-600",
    iconColorClass: "text-rose-600",
    borderHoverClass: "hover:border-rose-300",
    badgeColorClass: "bg-rose-50 text-rose-700 border-rose-200",
    isFixed: true,
    fixedModuleId: "wishes",
    styles: MODULE_STYLE_CATALOG.wishes?.styles || [
      { id: "stream-bubble", name: "Dòng Lời Chúc Bong Bóng", icon: "💬", badge: "Mặc định" },
      { id: "vintage-card", name: "Bưu Thiếp Lưu Bút Cổ Điển", icon: "📜", badge: "Vintage" },
      { id: "royal-gold", name: "Sổ Vàng Ký Tên Hoàng Gia", icon: "👑", badge: "Hoàng gia" },
    ],
    getSummary: () => "Lời chúc yêu thương & thả tim trực tuyến",
    isActive: (card) => card?.showWishes !== false,
  },

  // 7. ALBUM ẢNH TRỰC TUYẾN
  {
    id: "album",
    name: "Album Ảnh Cưới",
    category: "album",
    categoryLabel: "Album ảnh",
    themeCategories: ["wedding", "birthday", "event", "conference", "graduation", "political", "education", "other"],
    customTitleByTheme: {
      wedding: "Album Ảnh Cưới",
      birthday: "Album Ảnh Kỷ Niệm Tuổi Mới",
      event: "Album Ảnh & Khoảnh Khắc Sự Kiện",
      conference: "Thư Viện Ảnh & Tư Liệu Hội Nghị",
      graduation: "Kỷ Yếu Ảnh Tốt Nghiệp",
      political: "Tư Liệu & Hình Ảnh Đại Hội",
      education: "Kho Tư Liệu & Hình Ảnh Khóa Học",
      other: "Bộ Sưu Tập Hình Ảnh",
    },
    Icon: Camera,
    iconBgClass: "bg-pink-50 text-pink-600",
    iconColorClass: "text-pink-600",
    borderHoverClass: "hover:border-pink-300",
    badgeColorClass: "bg-pink-50 text-pink-700 border-pink-200",
    isFixed: true,
    fixedModuleId: "album",
    styles: MODULE_STYLE_CATALOG.album?.styles || [
      { id: "grid-modern", name: "Lưới 2 Cột Hiện Đại", icon: "🖼️", badge: "Mặc định" },
      { id: "polaroid-scrapbook", name: "Polaroid Kỷ Niệm Scrapbook", icon: "📸", badge: "Ngọt ngào" },
      { id: "masonry-chic", name: "Tạp Chí Thời Trang So Le", icon: "📰" },
    ],
    getSummary: (card) => {
      const count = card?.album?.length || 0;
      return `${count} ảnh trong bộ sưu tập`;
    },
    isActive: (card) => card?.showAlbum !== false,
  },


  // 7.5. CHUYỆN TÌNH YÊU (LOVE STORY TIMELINE)
  {
    id: "loveStory",
    name: "Chuyện Tình Yêu (Love Story)",
    category: "loveStory",
    categoryLabel: "Chuyện tình",
    themeCategories: ["wedding", "birthday", "event", "graduation", "other"],
    customTitleByTheme: {
      wedding: "Chuyện Tình Yêu (Love Story)",
      birthday: "Hành Trình Trưởng Thành",
      event: "Cột Mốc Phát Triển / Milestone",
      graduation: "Kỷ Niệm Năm Tháng Học Trò",
      other: "Dấu Mốc Thời Gian",
    },
    Icon: Heart,
    iconBgClass: "bg-rose-50 text-rose-600",
    iconColorClass: "text-rose-600",
    borderHoverClass: "hover:border-rose-300",
    badgeColorClass: "bg-rose-50 text-rose-700 border-rose-200",
    isFixed: true,
    fixedModuleId: "loveStory",
    styles: MODULE_STYLE_CATALOG.loveStory?.styles || [
      { id: "vertical-timeline", name: "Dòng Thời Gian Dọc", icon: "⏳", badge: "Mặc định" },
      { id: "milestone-cards", name: "Thẻ Cột Mốc Tình Yêu", icon: "💍", badge: "Ngọt ngào" },
      { id: "romantic-journal", name: "Nhật Ký Tình Yêu", icon: "📖", badge: "Hoài niệm" },
    ],
    getSummary: (card) => {
      const count = card?.loveStory?.length || 4;
      return `${count} mốc kỷ niệm tình yêu`;
    },
    isActive: (card) => card?.showLoveStory !== false,
  },

  // 8. ĐẠI DIỆN GIA ĐÌNH HAI HỌ / BAN TỔ CHỨC
  {
    id: "family",
    name: "Đại Diện Gia Đình Hai Họ",
    category: "family",
    categoryLabel: "Hai họ",
    themeCategories: ["wedding", "birthday", "conference", "political", "education", "graduation", "other"],
    customTitleByTheme: {
      wedding: "Đại Diện Gia Đình Hai Họ",
      birthday: "Người Thân & Gia Đình",
      conference: "Ban Tổ Chức & Diễn Giả VIP",
      political: "Đoàn Chủ Tịch & Ban Tổ Chức",
      education: "Giảng Viên & Ban Đào Tạo",
      graduation: "Ban Giám Hiệu & Phụ Huynh",
      other: "Nhân Sự & Ban Đại Diện",
    },
    Icon: Users,
    iconBgClass: "bg-amber-50 text-amber-700",
    iconColorClass: "text-amber-700",
    borderHoverClass: "hover:border-amber-300",
    badgeColorClass: "bg-amber-50 text-amber-800 border-amber-200",
    isFixed: false,
    widgetType: "FamilyInfoBox",
    defaultWidth: 440,
    defaultHeight: 180,
    defaultProps: {
      groomFather: "Ông Nguyễn Văn Hùng",
      groomMother: "Bà Trần Thị Lan",
      brideFather: "Ông Lê Văn Thành",
      brideMother: "Bà Vũ Thị Mai",
      styleVariant: "songhy",
    },
    styles: [
      { id: "songhy", name: "Song Hỷ Truyền Thống", icon: "囍", badge: "Trang trọng", description: "Họa tiết Song Hỷ vàng kim ở giữa, hai họ đối xứng trang nghiêm" },
      { id: "modern", name: "Tối Giản Đối Xứng", icon: "✨", badge: "Hiện đại", description: "Font chữ thanh mảnh, chia hai cột Nhà Trai & Nhà Gái tinh tế" },
      { id: "royal", name: "Khung Hoa Hoàng Gia", icon: "👑", badge: "VIP", description: "Họa tiết hoa văn baroque lộng lẫy bao quanh tên phụ mẫu" },
    ],
    getSummary: (card, nodes) => {
      const famNode = Object.values(nodes).find((n: any) => n?.type?.resolvedName === "FamilyInfoBox");
      if (famNode?.props?.groomFather) {
        return `Nhà Trai: ${famNode.props.groomFather} • Nhà Gái`;
      }
      if (card?.groom?.parents) return `${card.groom.parents.split("&")[0]}...`;
      return "Giới thiệu thân phụ & thân mẫu hai nhà";
    },
    isActive: (_, nodes) => {
      return Object.values(nodes).some((n: any) => n?.type?.resolvedName === "FamilyInfoBox");
    },
    findNodeId: (nodes) => {
      const entry = Object.entries(nodes).find(([, n]: [string, any]) => n?.type?.resolvedName === "FamilyInfoBox");
      return entry ? entry[0] : null;
    },
  },

  // 9. GỢI Ý TRANG PHỤC (DRESS CODE)
  {
    id: "dresscode",
    name: "Gợi Ý Trang Phục (Dress Code)",
    category: "dresscode",
    categoryLabel: "Trang phục",
    themeCategories: ["wedding", "birthday", "event", "graduation", "conference", "other"],
    customTitleByTheme: {
      wedding: "Gợi Ý Trang Phục (Dress Code)",
      birthday: "Gợi Ý Trang Phục Tiệc",
      event: "Dress Code Dự Sự Kiện",
      graduation: "Lễ Phục Tốt Nghiệp",
      conference: "Quy Chuẩn Trang Phục Hội Nghị",
      other: "Bảng Tông Màu Gợi Ý",
    },
    Icon: Palette,
    iconBgClass: "bg-fuchsia-50 text-fuchsia-600",
    iconColorClass: "text-fuchsia-600",
    borderHoverClass: "hover:border-fuchsia-300",
    badgeColorClass: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
    isFixed: false,
    widgetType: "DressCodeBox",
    defaultWidth: 440,
    defaultHeight: 180,
    defaultProps: {
      title: "DRESS CODE TRANG PHỤC",
      description: "Để những bức hình kỷ niệm thêm phần đồng điệu, kính mong quý khách ưu tiên trang phục theo các tông màu gợi ý.",
      colors: [
        { color: "#F7D6D0", label: "Hồng phấn" },
        { color: "#E0BFB8", label: "Hồng đất" },
        { color: "#D4AF37", label: "Vàng Champagne" },
        { color: "#F5F5DC", label: "Beige" },
      ],
      styleVariant: "pastel_romance",
    },
    styles: [
      { id: "pastel_romance", name: "Pastel Lãng Mạn", icon: "🌸", badge: "Ngọt ngào", description: "Các ô tròn màu pastel dịu nhẹ kèm nhãn tên tông màu" },
      { id: "gold_black", name: "Dạ Tiệc Gold & Black", icon: "✨", badge: "Sang trọng", description: "Tông màu Champagne, Đen tuyền và Trắng ánh kim quý phái" },
      { id: "terracotta", name: "Màu Đất Terracotta Bohemian", icon: "🍂", badge: "Boho", description: "Cam cháy, Nâu ấm và Nude thời thượng" },
    ],
    getSummary: (_, nodes) => {
      const dcNode = Object.values(nodes).find((n: any) => n?.type?.resolvedName === "DressCodeBox");
      const count = Array.isArray(dcNode?.props?.colors) ? dcNode.props.colors.length : 4;
      return `${count} gam màu trang phục hài hòa`;
    },
    isActive: (_, nodes) => {
      return Object.values(nodes).some((n: any) => n?.type?.resolvedName === "DressCodeBox");
    },
    findNodeId: (nodes) => {
      const entry = Object.entries(nodes).find(([, n]: [string, any]) => n?.type?.resolvedName === "DressCodeBox");
      return entry ? entry[0] : null;
    },
  },

  // 10. LỜI NGỎ & LOVE STORY / THÔNG ĐIỆP
  {
    id: "intro",
    name: "Lời Ngỏ & Câu Chuyện Tình Yêu",
    category: "intro",
    categoryLabel: "Lời ngỏ",
    themeCategories: ["wedding", "birthday", "event", "conference", "graduation", "political", "education", "other"],
    customTitleByTheme: {
      wedding: "Lời Ngỏ & Love Story",
      birthday: "Thông Điệp Tuổi Mới",
      event: "Thông Điệp Chào Mừng Sự Kiện",
      conference: "Thông Cáo & Lời Khai Mạc",
      graduation: "Thư Tri Ân Cha Mẹ & Thầy Cô",
      political: "Diễn Văn & Lời Kêu Gọi",
      education: "Giới Thiệu Mục Tiêu Khóa Học",
      other: "Đoạn Trích Dẫn & Lời Ngỏ",
    },
    Icon: Heart,
    iconBgClass: "bg-red-50 text-red-600",
    iconColorClass: "text-red-600",
    borderHoverClass: "hover:border-red-300",
    badgeColorClass: "bg-red-50 text-red-700 border-red-200",
    isFixed: false,
    widgetType: "TextBox",
    defaultWidth: 440,
    defaultHeight: 140,
    defaultProps: {
      text: "Hẹn nhau trong ngày hạnh phúc. Một ngày đặc biệt, một lời hẹn trăm năm và thật nhiều yêu thương gửi tới tất cả người thân và bạn bè.",
      styleVariant: "quote_timeless",
      fontSize: 14,
      fontFamily: "Lora, serif",
      textAlign: "center",
      color: "#4a3b32",
    },
    styles: [
      { id: "quote_timeless", name: "Trích Dẫn Lãng Mạn", icon: "✍️", badge: "Tinh tế", description: "Chữ nghiêng thanh lịch kèm biểu tượng trái tim mở đầu" },
      { id: "story_milestone", name: "Mốc Thời Gian Yêu Nhau", icon: "💍", badge: "Kỷ niệm", description: "Lời kể từng dấu mốc từ lúc quen nhau đến ngày chung đôi" },
      { id: "thankyou", name: "Lời Tri Ân Sâu Sắc", icon: "💐", badge: "Ấm áp", description: "Thông điệp cảm ơn chân thành gửi tới quan khách tham dự" },
    ],
    getSummary: (card) => {
      if (card?.story) return `${card.story.slice(0, 35)}...`;
      return "Thông điệp tình yêu & lời tri ân gửi khách";
    },
    isActive: (_, nodes) => {
      return Object.values(nodes).some((n: any) => n?.props?.styleVariant?.includes?.("quote") || n?.props?.styleVariant?.includes?.("story"));
    },
    findNodeId: (nodes) => {
      const entry = Object.entries(nodes).find(([, n]: [string, any]) => n?.props?.styleVariant?.includes?.("quote") || n?.props?.styleVariant?.includes?.("story"));
      return entry ? entry[0] : null;
    },
  },
];

export function getModulesForTheme(theme: ThemeCategoryId): (UnifiedModuleDef & { displayName: string })[] {
  return UNIFIED_WEDDING_MODULES.filter((mod) => {
    if (!mod.themeCategories) return true;
    return mod.themeCategories.includes(theme);
  }).map((mod) => ({
    ...mod,
    displayName: mod.customTitleByTheme?.[theme] || mod.name,
  }));
}
