import {
  ColorFamily,
  StyleTag,
  TemplateFeature,
} from "@/data/templates/types";

export interface CategoryOption {
  id: string;
  label: string;
  icon?: string;
  description?: string;
}

export const CATEGORIES: CategoryOption[] = [
  { id: "all", label: "Tất cả", description: "Toàn bộ bộ sưu tập thiệp" },
  { id: "wedding", label: "Thiệp cưới", description: "Lễ thành hôn & vu quy lãng mạn" },
  { id: "graduation", label: "Thiệp tốt nghiệp", description: "Lễ trao bằng cử nhân, tri ân" },
  { id: "birthday", label: "Thiệp sinh nhật", description: "Tiệc sinh nhật, thôi nôi, mừng tuổi" },
  { id: "event", label: "Sự kiện", description: "Khai trương, hội nghị, gala, tân gia" },
  { id: "anniversary", label: "Kỷ niệm", description: "Kỷ niệm ngày cưới, ngày yêu" },
];

export interface StyleOption {
  id: StyleTag;
  label: string;
  description: string;
}

export const STYLE_TAGS: StyleOption[] = [
  { id: "classic", label: "Cổ điển", description: "Sang trọng, trường tồn với thời gian" },
  { id: "modern", label: "Hiện đại", description: "Tươi mới, bố cục tạp chí thời thượng" },
  { id: "minimal", label: "Tối giản", description: "Đơn giản, tinh tế, thoáng đãng" },
  { id: "traditional", label: "Truyền thống", description: "Đậm đà phong vị Á Đông" },
  { id: "rustic", label: "Rustic mộc", description: "Hoa cỏ sân vườn, bohemian ấm áp" },
  { id: "luxury", label: "Hoàng gia", description: "Vàng kim, nhung đỏ, đẳng cấp" },
  { id: "playful", label: "Trẻ trung", description: "Sôi động, ngập tràn màu sắc" },
  { id: "cute", label: "Dễ thương", description: "Đáng yêu, tông pastel ngọt ngào" },
];

export interface ColorFamilyOption {
  id: ColorFamily;
  label: string;
  swatchHex: string;
  borderHex?: string;
}

export const COLOR_FAMILIES: ColorFamilyOption[] = [
  { id: "red", label: "Đỏ", swatchHex: "#DC2626" },
  { id: "gold", label: "Vàng kim", swatchHex: "#D97706" },
  { id: "pink", label: "Hồng", swatchHex: "#EC4899" },
  { id: "pastel", label: "Pastel", swatchHex: "#FBCFE8" },
  { id: "green", label: "Xanh lá", swatchHex: "#16A34A" },
  { id: "blue", label: "Xanh dương", swatchHex: "#0284C7" },
  { id: "neutral", label: "Be / Kem", swatchHex: "#E7E5E4", borderHex: "#D6D3D1" },
];

export interface FeatureOption {
  id: TemplateFeature;
  label: string;
  iconName: string;
  description: string;
}

export const TEMPLATE_FEATURES: FeatureOption[] = [
  { id: "countdown", label: "Đếm ngược", iconName: "Clock", description: "Đồng hồ đếm ngược đến sự kiện" },
  { id: "calendar", label: "Lịch sự kiện", iconName: "Calendar", description: "Lịch tháng đánh dấu ngày tổ chức" },
  { id: "album", label: "Album ảnh", iconName: "Images", description: "Khung ảnh cưới / kỷ niệm" },
  { id: "map", label: "Bản đồ", iconName: "MapPin", description: "Google Maps chỉ đường trực tiếp" },
  { id: "rsvp", label: "Xác nhận tham dự", iconName: "CheckSquare", description: "Form RSVP trực tuyến" },
  { id: "gift", label: "Mừng mừng / QR", iconName: "Gift", description: "Hộp mừng cưới & mã VietQR" },
  { id: "wishes", label: "Sổ lưu bút", iconName: "MessageSquare", description: "Lời chúc bay & gửi lời chúc" },
  { id: "music", label: "Nhạc nền", iconName: "Music", description: "Nhạc nền du dương tự động phát" },
  { id: "envelope", label: "Bì thư mở nắp", iconName: "Mail", description: "Hiệu ứng mở bì thư ấn tượng" },
];

export const TAG_OPTIONS = [
  { id: "all", label: "Tất cả nhãn" },
  { id: "HOT", label: "HOT", colorClass: "bg-red-500 text-white" },
  { id: "PREMIUM", label: "PREMIUM", colorClass: "bg-indigo-600 text-white" },
  { id: "FREE", label: "FREE", colorClass: "bg-emerald-500 text-white" },
  { id: "MỚI", label: "MỚI", colorClass: "bg-amber-500 text-white" },
];

export const SORT_OPTIONS = [
  { id: "newest", label: "Vừa cập nhật" },
  { id: "popular", label: "Xem nhiều nhất" },
  { id: "likes", label: "Yêu thích nhất" },
  { id: "title", label: "Tên A - Z" },
];
