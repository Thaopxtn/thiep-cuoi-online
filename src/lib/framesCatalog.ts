/**
 * Danh mục Khung Ảnh Cưới Nghệ Thuật (Wedding Frames Catalog)
 * Cung cấp các kiểu dáng khung ảnh đa dạng phong cách kéo thả như Canva:
 * Cổng vòm, Khung Polaroid, Khung Nguyệt Quế, Bát Giác, Tem Thư, Dải Phim, Trái Tim, v.v.
 */

export interface WeddingFrameItem {
  id: string;
  name: string;
  category: "arch" | "vintage" | "royal" | "modern" | "romantic";
  badge: string;
  previewIcon: string;
  defaultWidth: number;
  defaultHeight: number;
  borderRadius: number | number[];
  borderSize?: number;
  borderStyle?: string;
  borderColor?: string;
  hasBoxShadow?: boolean;
  boxShadow?: {
    offsetX: number;
    offsetY: number;
    blur: number;
    spread: number;
    color: string;
  };
  frameType: string;
  description: string;
  defaultImgKey: string;
}

export const WEDDING_FRAMES: WeddingFrameItem[] = [
  {
    id: "frame_arch_royal",
    name: "Khung Cổng Vòm Lễ Đường",
    category: "arch",
    badge: "Hot",
    previewIcon: "🏛️",
    defaultWidth: 320,
    defaultHeight: 440,
    borderRadius: [160, 160, 16, 16],
    borderSize: 3,
    borderStyle: "solid",
    borderColor: "#d4af37",
    hasBoxShadow: true,
    boxShadow: {
      offsetX: 0,
      offsetY: 8,
      blur: 24,
      spread: 0,
      color: "rgba(212, 175, 55, 0.25)",
    },
    frameType: "arch",
    description: "Khung cong vòm lễ đường hoàng gia, đỉnh vòm cung uyển chuyển mạ viền vàng.",
    defaultImgKey: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800",
  },
  {
    id: "frame_polaroid_vintage",
    name: "Khung Polaroid Hoài Niệm",
    category: "vintage",
    badge: "Vintage",
    previewIcon: "📷",
    defaultWidth: 300,
    defaultHeight: 380,
    borderRadius: [12, 12, 12, 12],
    borderSize: 12,
    borderStyle: "solid",
    borderColor: "#ffffff",
    hasBoxShadow: true,
    boxShadow: {
      offsetX: 0,
      offsetY: 10,
      blur: 20,
      spread: 0,
      color: "rgba(0, 0, 0, 0.15)",
    },
    frameType: "polaroid",
    description: "Khung ảnh chụp lấy liền Polaroid giấy mỹ thuật viền trắng đáy rộng cổ điển.",
    defaultImgKey: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=800",
  },
  {
    id: "frame_circle_wreath",
    name: "Khung Tròn Nguyệt Quế Vàng",
    category: "royal",
    badge: "Hoàng gia",
    previewIcon: "👑",
    defaultWidth: 320,
    defaultHeight: 320,
    borderRadius: [999, 999, 999, 999],
    borderSize: 4,
    borderStyle: "double",
    borderColor: "#d4af37",
    hasBoxShadow: true,
    boxShadow: {
      offsetX: 0,
      offsetY: 6,
      blur: 20,
      spread: 0,
      color: "rgba(212, 175, 55, 0.3)",
    },
    frameType: "circle_wreath",
    description: "Khung tròn hoàn hảo viền kép ánh kim tượng trưng cho tình yêu viên mãn vĩnh cửu.",
    defaultImgKey: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800",
  },
  {
    id: "frame_octagon_gold",
    name: "Khung Bát Giác Kim Cương",
    category: "royal",
    badge: "Sang trọng",
    previewIcon: "💎",
    defaultWidth: 330,
    defaultHeight: 330,
    borderRadius: [36, 36, 36, 36],
    borderSize: 3,
    borderStyle: "solid",
    borderColor: "#b48c36",
    hasBoxShadow: true,
    boxShadow: {
      offsetX: 0,
      offsetY: 8,
      blur: 22,
      spread: 0,
      color: "rgba(180, 140, 54, 0.25)",
    },
    frameType: "octagon",
    description: "Khung bát giác vát góc hình học kim cương quý phái, nổi bật sự sang trọng.",
    defaultImgKey: "https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=800",
  },
  {
    id: "frame_stamp_postage",
    name: "Khung Tem Thư Scalloped",
    category: "vintage",
    badge: "Độc đáo",
    previewIcon: "📮",
    defaultWidth: 310,
    defaultHeight: 400,
    borderRadius: [20, 20, 20, 20],
    borderSize: 6,
    borderStyle: "dashed",
    borderColor: "#e5d5be",
    hasBoxShadow: true,
    boxShadow: {
      offsetX: 0,
      offsetY: 6,
      blur: 16,
      spread: 0,
      color: "rgba(100, 70, 40, 0.15)",
    },
    frameType: "stamp",
    description: "Viền tem bưu thiếp cổ điển mang hơi hướng phong thư tình gửi từ phương xa.",
    defaultImgKey: "https://images.unsplash.com/photo-1544717302-de2939b7ef71?q=80&w=800",
  },
  {
    id: "frame_film_strip",
    name: "Khung Dải Phim Kỷ Niệm",
    category: "modern",
    badge: "Nghệ thuật",
    previewIcon: "🎞️",
    defaultWidth: 340,
    defaultHeight: 320,
    borderRadius: [16, 16, 16, 16],
    borderSize: 8,
    borderStyle: "solid",
    borderColor: "#1e1b18",
    hasBoxShadow: true,
    boxShadow: {
      offsetX: 0,
      offsetY: 8,
      blur: 20,
      spread: 0,
      color: "rgba(0, 0, 0, 0.3)",
    },
    frameType: "film",
    description: "Khung phim nhựa nghệ thuật ghi dấu từng khoảnh khắc điện ảnh của hai bạn.",
    defaultImgKey: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=800",
  },
  {
    id: "frame_romantic_heart",
    name: "Khung Trái Tim Hạnh Phúc",
    category: "romantic",
    badge: "Lãng mạn",
    previewIcon: "💖",
    defaultWidth: 330,
    defaultHeight: 330,
    borderRadius: [165, 165, 40, 40],
    borderSize: 3,
    borderStyle: "solid",
    borderColor: "#e54153",
    hasBoxShadow: true,
    boxShadow: {
      offsetX: 0,
      offsetY: 8,
      blur: 20,
      spread: 0,
      color: "rgba(229, 65, 83, 0.25)",
    },
    frameType: "heart",
    description: "Dáng tim ngọt ngào đong đầy tình yêu, bo góc mềm mại viền đỏ nhung.",
    defaultImgKey: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?q=80&w=800",
  },
  {
    id: "frame_cameo_oval",
    name: "Khung Oval Quý Tộc Châu Âu",
    category: "royal",
    badge: "Quý phái",
    previewIcon: "🪞",
    defaultWidth: 300,
    defaultHeight: 400,
    borderRadius: [150, 150, 150, 150],
    borderSize: 4,
    borderStyle: "solid",
    borderColor: "#c5a059",
    hasBoxShadow: true,
    boxShadow: {
      offsetX: 0,
      offsetY: 8,
      blur: 24,
      spread: 0,
      color: "rgba(197, 160, 89, 0.25)",
    },
    frameType: "cameo_oval",
    description: "Khung oval dáng gương châu Âu cổ điển, thanh thoát và tôn dáng chân dung.",
    defaultImgKey: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=800",
  },
  {
    id: "frame_double_border_chic",
    name: "Khung Viền Kép Bo Góc Chic",
    category: "modern",
    badge: "Hiện đại",
    previewIcon: "🖼️",
    defaultWidth: 320,
    defaultHeight: 420,
    borderRadius: [28, 28, 28, 28],
    borderSize: 2,
    borderStyle: "solid",
    borderColor: "#780405",
    hasBoxShadow: true,
    boxShadow: {
      offsetX: 0,
      offsetY: 6,
      blur: 18,
      spread: 0,
      color: "rgba(120, 4, 5, 0.2)",
    },
    frameType: "double_chic",
    description: "Viền kép thanh lịch bo góc hiện đại phù hợp tiệc cưới tối giản sang trọng.",
    defaultImgKey: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=800",
  },
];

export function getFrameById(id: string): WeddingFrameItem | undefined {
  return WEDDING_FRAMES.find((f) => f.id === id);
}
