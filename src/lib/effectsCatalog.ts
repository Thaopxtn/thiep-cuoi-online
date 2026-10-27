export type AmbientEffectType =
  | "petals"        // Cánh hoa hồng rơi
  | "petals_cherry" // Cánh hoa anh đào rơi
  | "hearts"        // Trái tim tình yêu bay
  | "sparkles"      // Bụi vàng lấp lánh hoàng kim
  | "snow"          // Tuyết rơi mùa đông
  | "confetti"      // Pháo giấy kim tuyến tiệc tùng
  | "fireworks"     // Pháo hoa rực rỡ
  | "butterflies"   // Đôi bướm uyên ương dập dìu
  | "bubbles"       // Bong bóng xà phòng ngũ sắc
  | "leaves"        // Lá vàng mùa thu rơi
  | "stars"         // Mưa sao băng phát sáng
  | "lanterns"      // Đèn lồng trời may mắn
  | "feathers"      // Lông vũ trắng thiên thần
  | "fireflies";    // Ánh sáng đom đóm dạ quang

export type EffectCategory = "all" | "romantic" | "luxury" | "party" | "nature";

export interface EffectConfig {
  type: AmbientEffectType;
  enabled: boolean;
  density: number;        // 10 - 80 (hạt)
  speed: number;          // 0.5 - 2.0 (tốc độ)
  size: number;           // 0.6 - 1.6 (kích thước)
  opacity: number;        // 0.3 - 1.0 (độ rõ nét)
  direction: "down" | "up" | "wind-left" | "wind-right";
}

export interface EffectItem {
  id: AmbientEffectType;
  name: string;
  icon: string;
  desc: string;
  category: EffectCategory;
  categoryLabel: string;
  badge?: string;
  previewBg: string;
  defaultConfig: Omit<EffectConfig, "type" | "enabled">;
}

export const EFFECT_CATEGORIES: { id: EffectCategory; label: string; icon: string }[] = [
  { id: "all", label: "Tất cả", icon: "✨" },
  { id: "romantic", label: "Lãng mạn & Tình yêu", icon: "💖" },
  { id: "luxury", label: "Hoàng gia & Quý phái", icon: "👑" },
  { id: "party", label: "Tiệc tùng & Rực rỡ", icon: "🎉" },
  { id: "nature", label: "Thiên nhiên & Bốn mùa", icon: "🍃" },
];

export const EFFECTS_CATALOG: EffectItem[] = [
  // 1. CÁNH HOA HỒNG RƠI
  {
    id: "petals",
    name: "Cánh hoa hồng rơi",
    icon: "🌹",
    desc: "Cánh hoa hồng nhung đỏ và hồng phấn chao nghiêng 3D lãng mạn",
    category: "romantic",
    categoryLabel: "Lãng mạn",
    badge: "Phổ biến nhất",
    previewBg: "from-rose-500/20 to-red-500/20",
    defaultConfig: {
      density: 28,
      speed: 1.0,
      size: 1.0,
      opacity: 0.85,
      direction: "down",
    },
  },

  // 2. CÁNH HOA ANH ĐÀO BAY
  {
    id: "petals_cherry",
    name: "Cánh hoa anh đào bay",
    icon: "🌸",
    desc: "Cánh hoa đào hồng phấn bay là đà theo làn gió nhẹ nhàng thanh khiết",
    category: "romantic",
    categoryLabel: "Lãng mạn",
    badge: "Thơ mộng",
    previewBg: "from-pink-400/20 to-rose-300/20",
    defaultConfig: {
      density: 32,
      speed: 0.85,
      size: 0.9,
      opacity: 0.8,
      direction: "wind-right",
    },
  },

  // 3. TRÁI TIM TÌNH YÊU BAY BỔNG
  {
    id: "hearts",
    name: "Trái tim tình yêu bay",
    icon: "💖",
    desc: "Những trái tim hồng phấn ngọt ngào bay lơ lửng từ dưới lên trên",
    category: "romantic",
    categoryLabel: "Lãng mạn",
    badge: "Ngọt ngào",
    previewBg: "from-rose-500/20 to-pink-500/20",
    defaultConfig: {
      density: 24,
      speed: 1.0,
      size: 1.1,
      opacity: 0.85,
      direction: "up",
    },
  },

  // 4. BỤI VÀNG LẤP LÁNH HOÀNG KIM
  {
    id: "sparkles",
    name: "Bụi vàng lấp lánh",
    icon: "✨",
    desc: "Bụi vàng kim tuyến 4 cánh phát sáng nhấp nháy sang trọng quý phái",
    category: "luxury",
    categoryLabel: "Hoàng gia",
    badge: "VIP Sang trọng",
    previewBg: "from-amber-400/20 to-yellow-500/20",
    defaultConfig: {
      density: 40,
      speed: 0.9,
      size: 1.0,
      opacity: 0.9,
      direction: "down",
    },
  },

  // 5. ĐÈN LỒNG TRỜI MAY MẮN
  {
    id: "lanterns",
    name: "Đèn lồng trời may mắn",
    icon: "🏮",
    desc: "Đèn lồng Hội An ấm áp tỏa ánh vàng cam bay bổng lên bầu trời",
    category: "luxury",
    categoryLabel: "Hoàng gia",
    badge: "Ấm áp",
    previewBg: "from-amber-500/20 to-red-500/20",
    defaultConfig: {
      density: 16,
      speed: 0.7,
      size: 1.2,
      opacity: 0.85,
      direction: "up",
    },
  },

  // 6. ÁNH SÁNG ĐOM ĐÓM DẠ QUANG
  {
    id: "fireflies",
    name: "Đom đóm dạ quang đêm",
    icon: "💡",
    desc: "Những đốm sáng dạ quang vàng xanh lập lòe chuyển động huyền ảo",
    category: "luxury",
    categoryLabel: "Hoàng gia",
    badge: "Huyền ảo",
    previewBg: "from-emerald-400/20 to-yellow-400/20",
    defaultConfig: {
      density: 30,
      speed: 0.75,
      size: 1.0,
      opacity: 0.85,
      direction: "wind-right",
    },
  },

  // 7. PHÁO HOA CHÚC MỪNG
  {
    id: "fireworks",
    name: "Pháo hoa chúc mừng",
    icon: "🎆",
    desc: "Những chùm pháo hoa bung nở rực rỡ tỏa tia sáng lung linh trên bầu trời",
    category: "party",
    categoryLabel: "Tiệc tùng",
    badge: "Bùng nổ",
    previewBg: "from-indigo-500/20 to-rose-500/20",
    defaultConfig: {
      density: 20,
      speed: 1.1,
      size: 1.2,
      opacity: 0.9,
      direction: "up",
    },
  },

  // 8. PHÁO GIẤY KIM TUYẾN CONFETTI
  {
    id: "confetti",
    name: "Pháo giấy Confetti",
    icon: "🎊",
    desc: "Mảnh giấy kim tuyến đa sắc màu xoay tròn rơi nhanh tưng bừng ngày vui",
    category: "party",
    categoryLabel: "Tiệc tùng",
    badge: "Sôi động",
    previewBg: "from-cyan-400/20 to-amber-400/20",
    defaultConfig: {
      density: 35,
      speed: 1.3,
      size: 1.0,
      opacity: 0.85,
      direction: "down",
    },
  },

  // 9. BONG BÓNG XÀ PHÒNG NGŨ SẮC
  {
    id: "bubbles",
    name: "Bong bóng ngũ sắc",
    icon: "🫧",
    desc: "Bong bóng trong suốt ánh xà cừ bay bồng bềnh nhẹ nhàng mộng mơ",
    category: "party",
    categoryLabel: "Tiệc tùng",
    badge: "Trong trẻo",
    previewBg: "from-sky-400/20 to-purple-400/20",
    defaultConfig: {
      density: 22,
      speed: 0.8,
      size: 1.1,
      opacity: 0.75,
      direction: "up",
    },
  },

  // 10. MƯA SAO BĂNG LƯỚT NGANG
  {
    id: "stars",
    name: "Mưa sao băng điều ước",
    icon: "💫",
    desc: "Những vệt sao băng phát sáng lướt ngang trời mang lại may mắn và hạnh phúc",
    category: "party",
    categoryLabel: "Tiệc tùng",
    badge: "Kỳ diệu",
    previewBg: "from-blue-500/20 to-cyan-400/20",
    defaultConfig: {
      density: 15,
      speed: 1.4,
      size: 1.1,
      opacity: 0.85,
      direction: "wind-left",
    },
  },

  // 11. TUYẾT RƠI MÙA ĐÔNG
  {
    id: "snow",
    name: "Tuyết rơi mùa đông",
    icon: "❄️",
    desc: "Bông tuyết trắng 6 cánh tinh khôi xoay tròn rơi êm đềm bình yên",
    category: "nature",
    categoryLabel: "Bốn mùa",
    badge: "Ấm áp",
    previewBg: "from-blue-400/20 to-cyan-300/20",
    defaultConfig: {
      density: 36,
      speed: 0.9,
      size: 1.0,
      opacity: 0.85,
      direction: "down",
    },
  },

  // 12. LÁ VÀNG MÙA THU RƠI
  {
    id: "leaves",
    name: "Lá vàng mùa thu rơi",
    icon: "🍂",
    desc: "Lá phong vàng cam mùa thu bay là đà chao nghiêng trong gió lãng mạn",
    category: "nature",
    categoryLabel: "Bốn mùa",
    badge: "Cổ điển",
    previewBg: "from-amber-600/20 to-orange-500/20",
    defaultConfig: {
      density: 22,
      speed: 0.95,
      size: 1.1,
      opacity: 0.85,
      direction: "wind-right",
    },
  },

  // 13. ĐÔI BƯỚM UYÊN ƯƠNG
  {
    id: "butterflies",
    name: "Đôi bướm uyên ương",
    icon: "🦋",
    desc: "Đôi bướm tình nhân dập dìu đập cánh chao lượn chúc phúc đôi uyên ương",
    category: "romantic",
    categoryLabel: "Lãng mạn",
    badge: "Uyên ương",
    previewBg: "from-purple-400/20 to-pink-400/20",
    defaultConfig: {
      density: 12,
      speed: 0.85,
      size: 1.3,
      opacity: 0.9,
      direction: "wind-right",
    },
  },

  // 14. LÔNG VŨ TRẮNG BỒNG BỀNH
  {
    id: "feathers",
    name: "Lông vũ trắng bồng bềnh",
    icon: "🪶",
    desc: "Những chiếc lông vũ trắng muốt lắc lư rơi nhẹ như mây trời thanh khiết",
    category: "romantic",
    categoryLabel: "Lãng mạn",
    badge: "Thanh khiết",
    previewBg: "from-stone-300/20 to-rose-200/20",
    defaultConfig: {
      density: 18,
      speed: 0.7,
      size: 1.2,
      opacity: 0.8,
      direction: "down",
    },
  },
];

export function getDefaultEffectConfig(type: AmbientEffectType): EffectConfig {
  const item = EFFECTS_CATALOG.find((e) => e.id === type) || EFFECTS_CATALOG[0];
  return {
    type: item.id,
    enabled: true,
    ...item.defaultConfig,
  };
}
