import { ModuleType, TemplateModule } from "@/components/modules/types";

export interface ModuleDefinition {
  type: ModuleType;
  name: string;
  category: "hero" | "info" | "gallery" | "interactive" | "utility";
  categoryLabel: string;
  description: string;
  badge?: string;
  isHero?: boolean;
  getDefaultProps: (templateData: any) => Record<string, any>;
}

export const AVAILABLE_MODULES: ModuleDefinition[] = [
  // --- HERO MODULES ---
  {
    type: "hero-red-wax-envelope",
    name: "Bì thư sáp đỏ dập hoa hồng 3D",
    category: "hero",
    categoryLabel: "Phần mở đầu (Hero)",
    description: "Phong bì đỏ nhung sang trọng, con dấu sáp vàng hoa hồng và hiệu ứng thiệp trồi lên",
    badge: "HOT SANG TRỌNG",
    isHero: true,
    getDefaultProps: (d) => ({
      title: d.eventTitle || "THƯ MỜI CƯỚI",
      person1: d.person1 || "Văn Sâm",
      person2: d.person2 || "Mai Lan",
      date: d.date || "29.03.2026",
      heroPhoto: d.mainPhoto || "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=800&auto=format&fit=crop",
    }),
  },
  {
    type: "hero-traditional-red",
    name: "Bì thư đỏ truyền thống & Chữ Hỷ vàng",
    category: "hero",
    categoryLabel: "Phần mở đầu (Hero)",
    description: "Phong cách cưới truyền thống Á Đông, hoa văn song hỷ kim tuyến và ruy băng đỏ",
    badge: "TRUYỀN THỐNG",
    isHero: true,
    getDefaultProps: (d) => ({
      eventTitle: d.eventTitle || "THIỆP MỜI CƯỚI",
      person1: d.person1 || "Đức Duy",
      person2: d.person2 || "Mai Lan",
      date: d.date || "20.10.2026",
      mainPhoto: d.mainPhoto || "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop",
      subTitle: d.invitationBody || "Trân trọng kính mời tới dự lễ thành hôn của chúng tôi",
    }),
  },
  {
    type: "hero-envelope",
    name: "Bì thư mở ảnh đôi lãng mạn",
    category: "hero",
    categoryLabel: "Phần mở đầu (Hero)",
    description: "Bì thư phong cách hiện đại với hiệu ứng mở nắp, hiệu ứng sao lấp lánh và hashtag cưới",
    badge: "PHỔ BIẾN",
    isHero: true,
    getDefaultProps: (d) => ({
      eventTitle: d.eventTitle || "HAPPY WEDDING",
      person1: d.person1 || "Minh Quân",
      person2: d.person2 || "Ngọc Vy",
      date: d.date || "15.11.2026",
      mainPhoto: d.mainPhoto || "https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=800&auto=format&fit=crop",
      hashtags: ["#weddingForever", "#ourSpecialDay"],
    }),
  },
  {
    type: "hero-sky-countdown",
    name: "Bầu trời mây xanh & Đồng hồ đếm ngược",
    category: "hero",
    categoryLabel: "Phần mở đầu (Hero)",
    description: "Giao diện mây bay pastel thanh khiết kèm đồng hồ đếm ngược từng giây đến ngày vui",
    badge: "TỐT NGHIỆP / SỰ KIỆN",
    isHero: true,
    getDefaultProps: (d) => ({
      eventTitle: d.eventTitle || "LỄ TỐT NGHIỆP",
      person1: d.person1 || "Thảo Nhi",
      date: d.date || "25.06.2026",
      time: d.time || "08:30",
      mainPhoto: d.mainPhoto || "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop",
    }),
  },
  {
    type: "hero-birthday",
    name: "Sinh nhật ngập tràn bóng bay & pháo hoa",
    category: "hero",
    categoryLabel: "Phần mở đầu (Hero)",
    description: "Hiệu ứng bóng bay đa sắc màu, hộp quà lung linh và lời chúc tuổi mới rạng rỡ",
    badge: "SINH NHẬT",
    isHero: true,
    getDefaultProps: (d) => ({
      name: d.person1 || "Bé Bắp",
      ageText: "Tròn 1 Tuổi",
      date: d.date || "01.06.2026",
      time: d.time || "18:00",
      mainPhoto: d.mainPhoto || "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=800&auto=format&fit=crop",
    }),
  },
  {
    type: "hero-modern-minimal",
    name: "Hiện đại tối giản (Minimal Chic)",
    category: "hero",
    categoryLabel: "Phần mở đầu (Hero)",
    description: "Font chữ typography tinh tế, tone màu be/kem ấm áp trang nhã",
    badge: "MINIMALIST",
    isHero: true,
    getDefaultProps: (d) => ({
      eventTitle: d.eventTitle || "THE WEDDING OF",
      person1: d.person1 || "Gia Huy",
      person2: d.person2 || "Thục Trinh",
      date: d.date || "12.12.2026",
      mainPhoto: d.mainPhoto || "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop",
    }),
  },
  {
    type: "hero-floral-rustic",
    name: "Hoa lá thiên nhiên mộc mạc (Rustic Floral)",
    category: "hero",
    categoryLabel: "Phần mở đầu (Hero)",
    description: "Khung viền hoa hồng leo, lá khuynh diệp và màu sắc gỗ ấm cúng tự nhiên",
    badge: "RUSTIC",
    isHero: true,
    getDefaultProps: (d) => ({
      eventTitle: d.eventTitle || "SAVE OUR DATE",
      person1: d.person1 || "Tuấn Kiệt",
      person2: d.person2 || "Hồng Anh",
      date: d.date || "18.08.2026",
      mainPhoto: d.mainPhoto || "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=800&auto=format&fit=crop",
    }),
  },
  {
    type: "hero-luxury-gold",
    name: "Hoàng gia quý tộc viền vàng Luxury Gold",
    category: "hero",
    categoryLabel: "Phần mở đầu (Hero)",
    description: "Họa tiết baroque mạ vàng kim sa hoa, tôn vinh đẳng cấp ngày trọng đại",
    badge: "LUXURY",
    isHero: true,
    getDefaultProps: (d) => ({
      eventTitle: d.eventTitle || "ROYAL WEDDING INVITATION",
      person1: d.person1 || "Vương Anh",
      person2: d.person2 || "Gia Hân",
      date: d.date || "08.08.2026",
      mainPhoto: d.mainPhoto || "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=800&auto=format&fit=crop",
    }),
  },

  // --- INFO & SCHEDULE MODULES ---
  {
    type: "parents-family-invitation",
    name: "Thông điệp hai họ & Save The Date",
    category: "info",
    categoryLabel: "Thông tin & Lời mời",
    description: "Hiển thị trang trọng tên bố mẹ Nhà Trai, Nhà Gái và thẻ ngày cưới Save The Date kèm ảnh đôi",
    badge: "HAI HỌ",
    getDefaultProps: (d) => ({
      introTitle: "THAM DỰ LỄ THÀNH HÔN CỦA GIA ĐÌNH CHÚNG TÔI:",
      groomName: d.person1 || "Chú Rể",
      brideName: d.person2 || "Cô Dâu",
      saveDateDay: d.date ? d.date.split(".")[0] || "29" : "29",
      saveDateMonth: d.date ? d.date.split(".")[1] || "03" : "03",
    }),
  },
  {
    type: "wedding-schedule-cards",
    name: "Lịch trình sự kiện & Lịch tháng",
    category: "info",
    categoryLabel: "Thông tin & Lời mời",
    description: "Thẻ chia rõ Lễ Thành Hôn, Tiệc Mừng và lịch tháng có trái tim đánh dấu ngày lành",
    badge: "LỊCH TRÌNH",
    getDefaultProps: (d) => ({
      event1Title: "LỄ THÀNH HÔN",
      event1Time: `${d.time || "10:00"} - Chủ Nhật`,
      event1Date: d.date || "29.03.2026",
      event1Lunar: "(Tức Ngày Lành Tháng Tốt)",
      event1Venue: d.venue || "Tại Tư Gia Nhà Trai",
      event2Title: "TIỆC MỪNG ĐẠI HỶ",
      event2Time: "11:30 - Cùng Ngày",
      event2Date: d.date || "29.03.2026",
      event2Lunar: "(Tức Ngày Lành Tháng Tốt)",
      event2Venue: d.venue || "Tại Trung Tâm Tiệc Cưới",
    }),
  },
  {
    type: "calendar",
    name: "Lịch tháng khoanh tròn ngày vui",
    category: "info",
    categoryLabel: "Thông tin & Lời mời",
    description: "Bảng lịch tháng trực quan với biểu tượng trái tim đỏ khoanh tròn ngày tổ chức",
    getDefaultProps: (d) => ({
      title: "Lịch Ngày Vui",
      date: d.date || "29.03.2026",
      theme: "wedding",
    }),
  },
  {
    type: "story-quote",
    name: "Trích dẫn câu chuyện tình yêu & Lời ngỏ",
    category: "info",
    categoryLabel: "Thông tin & Lời mời",
    description: "Đoạn trích dẫn lãng mạn, thông điệp yêu thương hoặc châm ngôn ý nghĩa",
    getDefaultProps: (d) => ({
      heading: "Our Love Story",
      subheading: "Khoảnh khắc ngọt ngào",
      quote: d.quote || "Hạnh phúc không phải là điểm đến, mà là một hành trình cùng nhau chia sẻ mỗi ngày.",
      theme: "wedding",
    }),
  },
  {
    type: "invitation-letter",
    name: "Thư mời trang trọng & Chữ ký",
    category: "info",
    categoryLabel: "Thông tin & Lời mời",
    description: "Thư ngỏ chân tình gửi đến người thân, bạn bè thân thiết kèm chữ ký số thanh lịch",
    getDefaultProps: (d) => ({
      badge: "Thư Mời",
      salutation: "Kính Gửi Quý Khách",
      body: d.invitationBody || "Sự hiện diện của quý vị là niềm hạnh phúc lớn nhất của gia đình chúng tôi!",
      signature: d.signature || `${d.person1} & ${d.person2 || ""}`,
      theme: "wedding",
    }),
  },

  // --- GALLERY MODULES ---
  {
    type: "photo-gallery-grid",
    name: "Lưới Album ảnh cưới 2 cột cao cấp",
    category: "gallery",
    categoryLabel: "Album ảnh & Kỷ niệm",
    description: "Hiển thị ảnh cưới nghệ thuật với bố cục so le, hiệu ứng hover phóng to và lời cảm ơn kết thúc",
    badge: "ALBUM 2 CỘT",
    getDefaultProps: (d) => ({
      groomName: d.person1 || "Chú Rể",
      brideName: d.person2 || "Cô Dâu",
      date: d.date || "29.03.2026",
      closingTitle: "Rất Hân Hạnh Được Đón Tiếp Quý Khách!",
    }),
  },
  {
    type: "polaroid-tape",
    name: "Ảnh Polaroid dán băng dính vintage",
    category: "gallery",
    categoryLabel: "Album ảnh & Kỷ niệm",
    description: "Khung ảnh phong cách ảnh chụp lấy liền Polaroid dán băng keo trong suốt cổ điển",
    badge: "VINTAGE",
    getDefaultProps: (d) => ({
      photo: d.albumPhotos && d.albumPhotos.length > 0 ? d.albumPhotos[0] : d.mainPhoto,
      caption: "Forever & Always",
      subtext: d.quote || "Khoảnh khắc kỳ diệu nhất trong đời",
    }),
  },

  // --- VENUE & MAP MODULE ---
  {
    type: "venue-map",
    name: "Địa điểm tổ chức & Chỉ đường Google Maps",
    category: "info",
    categoryLabel: "Thông tin & Lời mời",
    description: "Thông tin hội trường, địa chỉ chi tiết kèm nút mở ứng dụng Google Maps tìm đường nhanh",
    badge: "BẢN ĐỒ",
    getDefaultProps: (d) => ({
      title: "Địa Điểm Tổ Chức",
      venue: d.venue || "Trung Tâm Hội Nghị & Tiệc Cưới",
      address: d.address || "123 Đường Hạnh Phúc, Quận 1, TP. Hồ Chí Minh",
      date: d.date || "29.03.2026",
      time: d.time || "10:00",
      mapUrl: d.mapUrl || "https://maps.google.com",
      theme: "wedding",
    }),
  },

  // --- INTERACTIVE & RSVP MODULES ---
  {
    type: "red-velvet-rsvp",
    name: "Xác nhận tham dự nhung đỏ hoàng gia",
    category: "interactive",
    categoryLabel: "Tương tác & Mừng cưới",
    description: "Form RSVP phong cách nhung đỏ sang trọng, hỗ trợ nhập số người đi cùng và lời nhắn",
    badge: "HOT RSVP",
    getDefaultProps: () => ({
      badgeText: "PHẢN HỒI THAM DỰ",
      title: "Xác Nhận Tham Dự",
      subtitle: "Để gia đình chuẩn bị chu đáo nhất, xin vui lòng phản hồi trước ngày cưới:",
    }),
  },
  {
    type: "rsvp",
    name: "Xác nhận tham dự chuẩn (RSVP Form)",
    category: "interactive",
    categoryLabel: "Tương tác & Mừng cưới",
    description: "Nút bấm mở ngăn kéo xác nhận tham dự tiệc nhẹ nhàng, tiện lợi cho khách mời",
    getDefaultProps: () => ({
      title: "Xác Nhận Tham Dự",
      subtitle: "Sự hiện diện của quý vị là niềm vinh hạnh cho gia đình chúng tôi!",
      theme: "wedding",
    }),
  },
  {
    type: "red-envelope-gift-card",
    name: "Bao lì xì đỏ may mắn VietQR 2 họ",
    category: "interactive",
    categoryLabel: "Tương tác & Mừng cưới",
    description: "Tặng phong bì mừng cưới online có tách riêng tài khoản mừng Nhà Trai và Nhà Gái",
    badge: "2 TÀI KHOẢN",
    getDefaultProps: (d) => ({
      groomBank: {
        bankName: d.bankInfo?.bankName || "BIDV",
        accountNumber: d.bankInfo?.accountNumber || "1290457180",
        accountHolder: d.bankInfo?.accountHolder || "NONG VAN SAM",
      },
      brideBank: {
        bankName: "AGRIBANK",
        accountNumber: "8502281029435",
        accountHolder: "MAI THI LAN",
      },
    }),
  },
  {
    type: "gift-bank",
    name: "Hộp mừng cưới VietQR chuyển khoản nhanh",
    category: "interactive",
    categoryLabel: "Tương tác & Mừng cưới",
    description: "Hộp mừng cưới hiện đại với thông tin số tài khoản và nút sao chép nhanh",
    getDefaultProps: (d) => ({
      title: "Hộp Mừng Cưới Online",
      subtitle: "Cảm ơn tấm lòng chân thành và tình cảm quý báu của quý khách!",
      bankName: d.bankInfo?.bankName || "Techcombank",
      accountNumber: d.bankInfo?.accountNumber || "190345678912",
      accountHolder: d.bankInfo?.accountHolder || "NGUYEN VAN A",
      theme: "wedding",
    }),
  },
  {
    type: "wishes-stream",
    name: "Luồng bong bóng lời chúc bay",
    category: "interactive",
    categoryLabel: "Tương tác & Mừng cưới",
    description: "Các lời chúc tốt đẹp của khách mời trôi nổi sinh động trên màn hình",
    getDefaultProps: () => ({
      maxVisible: 4,
    }),
  },
];

/**
 * Generate a new TemplateModule instance
 */
export function createModuleInstance(
  type: ModuleType,
  templateData: any
): TemplateModule {
  const def = AVAILABLE_MODULES.find((m) => m.type === type);
  const id = `mod-${type}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;

  if (def) {
    return {
      id,
      type: def.type,
      name: def.name,
      description: def.description,
      enabled: true,
      props: def.getDefaultProps(templateData),
    };
  }

  return {
    id,
    type,
    name: "Module tùy chỉnh",
    description: "",
    enabled: true,
    props: {},
  };
}

/**
 * Ready-made preset module configurations
 */
export const TEMPLATE_PRESETS = [
  {
    id: "preset-burgundy-wax",
    name: "Bì thư Đỏ Nhung Sáp Vàng Hoàng Gia (Best Seller)",
    category: "wedding",
    categoryName: "Thiệp cưới",
    description: "Bì thư đỏ nhung cổ điển, dập sáp hoa hồng vàng 3D, thiệp cưới 2 họ, RSVP nhung và VietQR 2 họ",
    image: "https://content.pancake.vn/1/s1200x650/fwebp90/c4/93/41/6c/26a2152470d62cafcfd166ba886705656a2bf74f8d13a1c10a49934a-w:2560-h:1706-l:246335-t:image/jpeg.jpg",
    moduleTypes: [
      "hero-red-wax-envelope",
      "parents-family-invitation",
      "wedding-schedule-cards",
      "red-velvet-rsvp",
      "red-envelope-gift-card",
      "photo-gallery-grid",
      "wishes-stream",
    ] as ModuleType[],
  },
  {
    id: "preset-traditional-red",
    name: "Thiệp Cưới Song Hỷ Đỏ Thắm Truyền Thống",
    category: "wedding",
    categoryName: "Thiệp cưới",
    description: "Đậm đà phong vị đám cưới Việt Nam, chữ Hỷ mạ vàng, lời thề nguyền son sắt và lịch ngày lành",
    image: "/assets/templates/long_0e710ebe.webp",
    moduleTypes: [
      "hero-traditional-red",
      "story-quote",
      "calendar",
      "venue-map",
      "rsvp",
      "gift-bank",
      "wishes-stream",
    ] as ModuleType[],
  },
  {
    id: "preset-modern-envelope",
    name: "Bì Thư Mở Ảnh Đôi & Khung Polaroid Lãng Mạn",
    category: "wedding",
    categoryName: "Thiệp cưới",
    description: "Mở phong bì lấp lánh sao, ảnh đôi Polaroid dán băng keo vintage và hộp mừng cưới hiện đại",
    image: "/assets/templates/long_c1328fd2.webp",
    moduleTypes: [
      "hero-envelope",
      "polaroid-tape",
      "venue-map",
      "rsvp",
      "gift-bank",
      "wishes-stream",
    ] as ModuleType[],
  },
  {
    id: "preset-sky-graduation",
    name: "Thiệp Kỷ Yếu & Tốt Nghiệp Bầu Trời Mây Xanh",
    category: "graduation",
    categoryName: "Thiệp tốt nghiệp",
    description: "Đếm ngược đến giờ làm lễ tốt nghiệp, lịch sự kiện, thư mời bạn thân và bản đồ hội trường",
    image: "/assets/templates/long_718400d5.webp",
    moduleTypes: [
      "hero-sky-countdown",
      "calendar",
      "invitation-letter",
      "venue-map",
      "wishes-stream",
    ] as ModuleType[],
  },
  {
    id: "preset-happy-birthday",
    name: "Tiệc Sinh Nhật Ngập Tràn Bóng Bay & Pháo Hoa",
    category: "birthday",
    categoryName: "Thiệp sinh nhật",
    description: "Không khí tưng bừng tuổi mới, lời chúc ngọt ngào, lịch tiệc và hộp quà sinh nhật VietQR",
    image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=800&auto=format&fit=crop",
    moduleTypes: [
      "hero-birthday",
      "story-quote",
      "calendar",
      "venue-map",
      "gift-bank",
      "wishes-stream",
    ] as ModuleType[],
  },
];

/**
 * Curated high-resolution stock photos for quick template creation
 */
export const SAMPLE_PHOTOS = {
  wedding: [
    {
      label: "Cặp đôi hoàng hôn lãng mạn",
      url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=800&auto=format&fit=crop",
    },
    {
      label: "Nắm tay hạnh phúc áo cưới trắng",
      url: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop",
    },
    {
      label: "Bó hoa cưới & Nhẫn đính hôn",
      url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop",
    },
    {
      label: "Khoảnh khắc trao nụ cười",
      url: "https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=800&auto=format&fit=crop",
    },
    {
      label: "Cổng hoa cưới tự nhiên ngoài trời",
      url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=800&auto=format&fit=crop",
    },
  ],
  graduation: [
    {
      label: "Mũ cử nhân tung bay bầu trời",
      url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop",
    },
    {
      label: "Nụ cười rạng rỡ ngày nhận bằng",
      url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=800&auto=format&fit=crop",
    },
  ],
  birthday: [
    {
      label: "Bánh kem nến lung linh & Bóng bay",
      url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=800&auto=format&fit=crop",
    },
    {
      label: "Hộp quà và dải ruy băng rực rỡ",
      url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=800&auto=format&fit=crop",
    },
  ],
};
