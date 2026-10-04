import { TemplateItem } from "../types";

export const EVENT_PRESETS: TemplateItem[] = [
  {
    id: "event-tiec-tan-gia-nhu-y",
    title: "Tiệc Tân Gia Như Ý (Housewarming)",
    slug: "tiec-tan-gia-nhu-y",
    category: "event",
    categoryName: "Sự kiện",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop",
    scrollPercent: "82%",
    scrollDuration: "8.5s",
    tag: "FREE",
    likes: 198,
    views: 1820,
    description:
      "Mẫu thiệp mừng tân gia nhà mới tươi sáng, phong cách hiện đại kèm bản đồ chỉ đường và đếm ngược tiệc mừng.",
    type: "general",
    recipe: "sky-graduation",
    meta: {
      createdAt: "2026-03-03T10:00:00.000Z",
      updatedAt: "2026-03-03T10:00:00.000Z",
      version: 1,
      author: "ZenLove Studio",
      styleTags: ["modern", "playful"],
      colorFamily: "blue",
      palette: {
        primary: "#0284C7",
        secondary: "#38BDF8",
        accent: "#F0F9FF",
        background: "#F8FAFC",
      },
      features: ["countdown", "calendar", "map", "wishes", "music"],
      origin: "preset",
    },
    defaultData: {
      eventTitle: "TIỆC MỪNG TÂN GIA",
      person1: "Gia đình Tuấn Kiệt & Lan Hương",
      date: "25.04.2026",
      time: "11:00",
      venue: "Tổ ấm mới KĐT Vinhomes Ocean Park",
      address: "Biệt thự San Hô 06-18, Gia Lâm, Hà Nội",
      mapUrl: "https://maps.google.com/?q=Vinhomes+Ocean+Park",
      quote:
        "An cư lạc nghiệp - Căn nhà mới tràn ngập tiếng cười và tình yêu thương của gia đình nhỏ.",
      invitationBody:
        "Trân trọng kính mời anh chị em, bạn bè thân quý đến chung vui bữa cơm thân mật mừng nhà mới của gia đình chúng tôi!",
      signature: "Tuấn Kiệt & Lan Hương",
      mainPhoto:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop",
      albumPhotos: [
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800&auto=format&fit=crop",
      ],
      musicTitle: "Happy Acoustic Guitar",
      musicUrl:
        "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3",
      bankInfo: {
        bankName: "MBBank",
        accountNumber: "0388999888",
        accountHolder: "TRAN TUAN KIET",
      },
      initialWishes: [],
    },
  },
  {
    id: "event-gala-khai-truong-luxury",
    title: "Gala Dinner & Khai Trương Doanh Nghiệp (Grand Opening)",
    slug: "gala-dinner-khai-truong-luxury",
    category: "event",
    categoryName: "Sự kiện",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop",
    scrollPercent: "90%",
    scrollDuration: "9.5s",
    tag: "PREMIUM",
    likes: 540,
    views: 4620,
    description:
      "Mẫu thiệp mời sự kiện Hoàng Gia Luxury Gold đẳng cấp cho tiệc khai trương, hội nghị khách hàng và gala tri ân.",
    type: "wedding",
    recipe: "luxury-gold",
    meta: {
      createdAt: "2026-03-04T11:00:00.000Z",
      updatedAt: "2026-03-04T11:00:00.000Z",
      version: 1,
      author: "ZenLove Studio",
      styleTags: ["luxury", "classic"],
      colorFamily: "gold",
      palette: {
        primary: "#D97706",
        secondary: "#FCD34D",
        accent: "#FFFBEB",
        background: "#18181B",
      },
      features: ["calendar", "map", "rsvp", "gift", "wishes", "music"],
      origin: "preset",
    },
    defaultData: {
      eventTitle: "GRAND OPENING & GALA DINNER",
      person1: "Tập Đoàn ZENLOVE GLOBAL",
      person2: "Ban Giám Đốc",
      date: "18.08.2026",
      time: "17:30",
      venue: "Khách Sạn Sheraton Saigon Grand Opera",
      address: "88 Đồng Khởi, Bến Nghé, Quận 1, TP.HCM",
      mapUrl: "https://maps.google.com/?q=Sheraton+Saigon",
      quote:
        "Khởi sắc tương lai - Kết nối thịnh vượng. Cùng chúng tôi đánh dấu cột mốc vươn tầm mới.",
      invitationBody:
        "Trân trọng kính mời Quý Đối tác & Quý Khách hàng đến tham dự Lễ Khai trương & Tiệc Gala Tri ân 2026.",
      signature: "Ban Lãnh Đạo Tập Đoàn",
      mainPhoto:
        "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop",
      albumPhotos: [],
      musicTitle: "Grand Corporate Symphony",
      musicUrl:
        "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3",
      bankInfo: {
        bankName: "Vietcombank",
        accountNumber: "0071009988776",
        accountHolder: "CTY CP ZENLOVE GLOBAL",
      },
      initialWishes: [],
    },
  },
];
