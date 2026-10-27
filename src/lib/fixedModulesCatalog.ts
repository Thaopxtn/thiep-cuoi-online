import {
  Calendar as CalendarIcon,
  Heart,
  Clock,
  Send,
  Camera,
  MessageSquare,
  Gift,
} from "lucide-react";

export type FixedModuleId = "calendar" | "events" | "album" | "rsvp" | "giftBox" | "wishes" | "loveStory";

export interface StyleOption {
  id: string;
  name: string;
  description: string;
  previewBg: string;
  accentColor: string;
  badge?: string;
  icon: string;
}

export const MODULE_STYLE_CATALOG: Record<FixedModuleId, { title: string; icon: any; styles: StyleOption[] }> = {
  loveStory: {
    title: "Chuyện Tình Yêu (Love Story Timeline)",
    icon: Heart,
    styles: [
      {
        id: "vertical-timeline",
        name: "Dòng Thời Gian Dọc (Classic Timeline)",
        description: "Trục dọc nối liền các mốc kỷ niệm: Lần đầu gặp gỡ, Lời hẹn ước, Cầu hôn và Ngày chung đôi.",
        previewBg: "from-white to-[#fcfaf7]",
        accentColor: "#e11d48",
        badge: "Mặc định",
        icon: "⏳",
      },
      {
        id: "milestone-cards",
        name: "Thẻ Cột Mốc Tình Yêu (Milestone Cards)",
        description: "Các thẻ kỷ niệm riêng biệt bo góc mềm mại, hiển thị ngày tháng nổi bật kèm ảnh chụp từng cột mốc.",
        previewBg: "from-[#fffaf7] to-[#fef2f2]",
        accentColor: "#be123c",
        badge: "Ngọt ngào",
        icon: "💍",
      },
      {
        id: "romantic-journal",
        name: "Nhật Ký Tình Yêu Cổ Điển",
        description: "Trình bày như những trang nhật ký vintage lãng mạn lưu giữ trọn vẹn kỷ niệm tình yêu.",
        previewBg: "from-[#fbf7ee] to-[#ece3cf]",
        accentColor: "#9a3412",
        badge: "Hoài niệm",
        icon: "📖",
      },
    ],
  },

  calendar: {
    title: "Lịch Cưới & Đếm Ngược (Save The Date)",
    icon: CalendarIcon,
    styles: [
      {
        id: "classic-cream",
        name: "Trang Nhã Nền Kem",
        description: "Bảng đếm ngược 4 ô thanh lịch, lịch tháng viền tròn mềm mại với trái tim hồng đánh dấu ngày chung đôi.",
        previewBg: "from-[#fbf9f5] to-[#f4eee4]",
        accentColor: "#511419",
        badge: "Phổ biến",
        icon: "🗓️",
      },
      {
        id: "luxury-gold",
        name: "Hoàng Gia Gold Quý Tộc",
        description: "Viền hoa văn mạ vàng Champagne sang trọng, phông chữ hoàng gia cổ điển lộng lẫy.",
        previewBg: "from-[#1a120b] via-[#2c1d11] to-[#1a120b]",
        accentColor: "#d4af37",
        badge: "Sang trọng",
        icon: "✨",
      },
      {
        id: "modern-minimal",
        name: "Tối Giản Hiện Đại",
        description: "Typography to bản tối giản phong cách Studio Hàn Quốc, đen trắng sạch sẽ và tinh tế.",
        previewBg: "from-white to-gray-100",
        accentColor: "#111827",
        icon: "🖤",
      },
      {
        id: "traditional-red",
        name: "Truyền Thống Song Hỷ",
        description: "Sắc đỏ may mắn Á Đông trang nghiêm, họa tiết chữ Song Hỷ son vàng mang lại phúc lộc trăm năm.",
        previewBg: "from-[#8b0000] via-[#a11212] to-[#8b0000]",
        accentColor: "#fbbf24",
        badge: "Truyền thống",
        icon: "囍",
      },
    ],
  },

  events: {
    title: "Chương Trình Hôn Lễ & Bản Đồ",
    icon: Clock,
    styles: [
      {
        id: "timeline-cards",
        name: "Thẻ Sự Kiện Độc Lập",
        description: "Mỗi mốc sự kiện là một thẻ card bo góc thanh lịch kèm biểu tượng giờ, địa điểm và nút chỉ đường riêng biệt.",
        previewBg: "from-white to-[#fbf8f2]",
        accentColor: "#881337",
        badge: "Mặc định",
        icon: "📇",
      },
      {
        id: "vertical-timeline",
        name: "Dòng Thời Gian Dọc (Timeline)",
        description: "Trục đứng nối liền các mốc thời gian bằng đường kẻ nét đứt và chấm tròn phát sáng theo diễn biến câu chuyện.",
        previewBg: "from-[#faf7f2] to-white",
        accentColor: "#e11d48",
        badge: "Nghệ thuật",
        icon: "⏳",
      },
      {
        id: "traditional-red",
        name: "Thiệp Hồng Lễ Cưới",
        description: "Khung hoa văn đỏ nhung trang trọng truyền thống dành riêng cho Lễ Vu Quy, Lễ Thành Hôn & Tiệc Cưới.",
        previewBg: "from-[#7f1d1d] to-[#991b1b]",
        accentColor: "#fde047",
        badge: "Truyền thống",
        icon: "🧧",
      },
    ],
  },

  album: {
    title: "Album Ảnh Cưới Phát Hành",
    icon: Camera,
    styles: [
      {
        id: "grid-modern",
        name: "Lưới 2 Cột Hiện Đại",
        description: "Ảnh bìa 16:9 toàn cảnh hoành tráng phía trên, các khoảnh khắc tiếp theo bố trí dạng lưới 2 cột gọn gàng.",
        previewBg: "from-white to-gray-50",
        accentColor: "#db2777",
        badge: "Mặc định",
        icon: "🖼️",
      },
      {
        id: "polaroid-scrapbook",
        name: "Polaroid Kỷ Niệm Scrapbook",
        description: "Ảnh lồng viền Polaroid dán băng dính keo Washi nghiêng nhẹ lãng mạn như cuốn sổ nhật ký tình yêu.",
        previewBg: "from-[#fcf8f2] to-[#f5ede0]",
        accentColor: "#d97706",
        badge: "Ngọt ngào",
        icon: "📸",
      },
      {
        id: "masonry-chic",
        name: "Tạp Chí Thời Trang So Le",
        description: "Bố cục ảnh nghệ thuật so le kích thước đa dạng phong cách bìa tạp chí ảnh cưới Vogue thanh lịch.",
        previewBg: "from-[#fdfcfb] to-[#f4f1ea]",
        accentColor: "#4b5563",
        icon: "📰",
      },
    ],
  },

  rsvp: {
    title: "Form Xác Nhận Tham Dự (RSVP)",
    icon: Send,
    styles: [
      {
        id: "clean-rounded",
        name: "Form Bo Góc Hiện Đại",
        description: "Giao diện trắng sáng tinh khôi, các nút chọn số lượng người và trạng thái tham dự bo tròn thân thiện.",
        previewBg: "from-white to-rose-50/40",
        accentColor: "#be123c",
        badge: "Mặc định",
        icon: "💌",
      },
      {
        id: "red-velvet",
        name: "Nhung Đỏ Quý Phái (Red Velvet)",
        description: "Sắc nhung đỏ sẫm kết hợp viền kim tuyến vàng quý phái, tạo cảm giác thiệp mời trang trọng hàng đầu.",
        previewBg: "from-[#4c0519] via-[#881337] to-[#4c0519]",
        accentColor: "#fef08a",
        badge: "Quý phái",
        icon: "🌹",
      },
      {
        id: "luxury-envelope",
        name: "Phong Thư Mời Hồi Đáp",
        description: "Form thiết kế lồng trong phong bì thư sang trọng, đem lại trải nghiệm hồi âm ấm áp cho khách mời.",
        previewBg: "from-[#fef3c7] via-white to-[#fee2e2]",
        accentColor: "#9a3412",
        icon: "✉️",
      },
    ],
  },

  giftBox: {
    title: "Hộp Mừng Cưới VietQR Online",
    icon: Gift,
    styles: [
      {
        id: "dual-bank-cards",
        name: "2 Thẻ Ngân Hàng Hiện Đại",
        description: "Thẻ Chú Rể & Cô Dâu nền sáng viền champagne, mã VietQR tạo tức thì và nút sao chép STK 1 chạm.",
        previewBg: "from-white to-[#faf7f2]",
        accentColor: "#047857",
        badge: "Mặc định",
        icon: "💳",
      },
      {
        id: "red-envelope",
        name: "Bao Lì Xì Đỏ May Mắn",
        description: "Phong bao lì xì đỏ may mắn thêu kim tuyến, mở ra mã VietQR và lời chúc phúc trăm năm hạnh phúc.",
        previewBg: "from-[#991b1b] via-[#b91c1c] to-[#7f1d1d]",
        accentColor: "#fde047",
        badge: "Độc đáo",
        icon: "🧧",
      },
      {
        id: "luxury-gold",
        name: "Hoàng Gia Gold Vương Giả",
        description: "Nền đen huyền bí viền chỉ vàng Gold 24k sang trọng, tôn vinh đẳng cấp của tiệc cưới hoàng gia.",
        previewBg: "from-[#18181b] via-[#27272a] to-[#09090b]",
        accentColor: "#facc15",
        badge: "VIP",
        icon: "👑",
      },
    ],
  },

  wishes: {
    title: "Sổ Lưu Bút & Lời Chúc Mừng",
    icon: MessageSquare,
    styles: [
      {
        id: "stream-bubble",
        name: "Dòng Lời Chúc Bong Bóng",
        description: "Các lời chúc dạng bong bóng chat ấm cúng hiển thị nối tiếp nhau kèm nút thả tim tương tác thời gian thực.",
        previewBg: "from-white to-pink-50/50",
        accentColor: "#e11d48",
        badge: "Mặc định",
        icon: "💬",
      },
      {
        id: "vintage-card",
        name: "Bưu Thiếp Lưu Bút Cổ Điển",
        description: "Lời chúc được khắc họa trên từng tấm bưu thiếp giấy vintage hoài niệm, lưu giữ kỷ niệm sâu sắc.",
        previewBg: "from-[#fbf7ee] to-[#ece3cf]",
        accentColor: "#78350f",
        badge: "Vintage",
        icon: "📜",
      },
    ],
  },
};
