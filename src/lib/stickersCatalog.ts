/**
 * Danh mục Họa Tiết & Sticker Trang Trí Tiệc Cưới (Wedding Stickers & Motifs Catalog)
 * Cung cấp kho tài nguyên thiết kế đa dạng kéo thả Canva-style:
 * Hoa lá, Nhẫn cưới, Song Hỷ, Họa tiết góc, Con dấu sáp, Ánh sáng lấp lánh...
 */

export interface WeddingStickerItem {
  id: string;
  category: "flowers" | "rings" | "traditional" | "flourishes" | "seals" | "accents";
  name: string;
  url: string;
  width: number;
  height: number;
  badge?: string;
  isSvg?: boolean;
}

export const STICKER_CATEGORIES: Array<{
  id: "all" | "flowers" | "rings" | "traditional" | "flourishes" | "seals" | "accents";
  label: string;
  icon: string;
}> = [
  { id: "all", label: "Tất cả", icon: "✨" },
  { id: "flowers", label: "Hoa lá", icon: "🌸" },
  { id: "rings", label: "Nhẫn & Uyên Ương", icon: "💍" },
  { id: "traditional", label: "Song Hỷ", icon: "囍" },
  { id: "flourishes", label: "Góc viền", icon: "⚜️" },
  { id: "seals", label: "Con dấu sáp", icon: "🔏" },
  { id: "accents", label: "Lấp lánh", icon: "✨" },
];

export const WEDDING_STICKERS: WeddingStickerItem[] = [
  // ================= 1. HOA LÁ & THỰC VẬT (FLOWERS & BOTANICALS) =================
  {
    id: "stk-flower-1",
    category: "flowers",
    name: "Hoa hồng đỏ Burgundy",
    url: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=350",
    width: 140,
    height: 140,
    badge: "Hot",
  },
  {
    id: "stk-flower-2",
    category: "flowers",
    name: "Cành lá ô liu xanh tươi",
    url: "https://images.unsplash.com/photo-1508615039623-a25605d2b022?q=80&w=350",
    width: 130,
    height: 150,
  },
  {
    id: "stk-flower-3",
    category: "flowers",
    name: "Bông mẫu đơn trắng kem",
    url: "https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=350",
    width: 140,
    height: 140,
    badge: "Mới",
  },
  {
    id: "stk-flower-4",
    category: "flowers",
    name: "Cành cúc họa mi vintage",
    url: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=350",
    width: 120,
    height: 140,
  },
  {
    id: "stk-flower-5",
    category: "flowers",
    name: "Nhành lá bạch đàn Eucalyptus",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=350",
    width: 130,
    height: 160,
  },
  {
    id: "stk-flower-6",
    category: "flowers",
    name: "Bó hoa cưới baby trắng",
    url: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=350",
    width: 150,
    height: 150,
  },
  {
    id: "stk-flower-7",
    category: "flowers",
    name: "Cành hoa đào mùa xuân",
    url: "https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=350",
    width: 160,
    height: 120,
  },

  // ================= 2. NHẪN & UYÊN ƯƠNG (RINGS & LOVE) =================
  {
    id: "stk-ring-1",
    category: "rings",
    name: "Cặp nhẫn cưới kim cương vàng",
    url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=350",
    width: 140,
    height: 140,
    badge: "VIP",
  },
  {
    id: "stk-ring-2",
    category: "rings",
    name: "Chim bồ câu trắng hòa bình",
    url: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?q=80&w=350",
    width: 150,
    height: 130,
    badge: "Lãng mạn",
  },
  {
    id: "stk-ring-3",
    category: "rings",
    name: "Đôi thiên nga tình yêu",
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=350",
    width: 160,
    height: 140,
  },
  {
    id: "stk-ring-4",
    category: "rings",
    name: "Cặp ly sâm panh nâng chúc mừng",
    url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=350",
    width: 130,
    height: 160,
  },
  {
    id: "stk-ring-5",
    category: "rings",
    name: "Trái tim dát vàng nghệ thuật",
    url: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=350",
    width: 120,
    height: 120,
  },
  {
    id: "stk-ring-6",
    category: "rings",
    name: "Chìa khóa mở cửa trái tim",
    url: "https://images.unsplash.com/photo-1582139329536-e7284fece509?q=80&w=350",
    width: 130,
    height: 130,
  },

  // ================= 3. SONG HỶ & TRUYỀN THỐNG (TRADITIONAL) =================
  {
    id: "stk-trad-1",
    category: "traditional",
    name: "Chữ Song Hỷ đỏ truyền thống",
    url: "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?q=80&w=350",
    width: 140,
    height: 140,
    badge: "Kinh điển",
  },
  {
    id: "stk-trad-2",
    category: "traditional",
    name: "Chữ Song Hỷ mạ vàng hoàng gia",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=350",
    width: 140,
    height: 140,
    badge: "Sang trọng",
  },
  {
    id: "stk-trad-3",
    category: "traditional",
    name: "Đóa sen hồng cung đình",
    url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=350",
    width: 140,
    height: 140,
  },
  {
    id: "stk-trad-4",
    category: "traditional",
    name: "Mây ngũ sắc cát tường",
    url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=350",
    width: 160,
    height: 100,
  },
  {
    id: "stk-trad-5",
    category: "traditional",
    name: "Cặp lồng đèn đỏ may mắn",
    url: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?q=80&w=350",
    width: 130,
    height: 160,
  },
  {
    id: "stk-trad-6",
    category: "traditional",
    name: "Pháo hoa chúc mừng hỷ sự",
    url: "https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?q=80&w=350",
    width: 150,
    height: 150,
  },
  {
    id: "stk-trad-7",
    category: "traditional",
    name: "Bánh phu thê truyền thống",
    url: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=350",
    width: 130,
    height: 130,
  },

  // ================= 4. GÓC VIỀN & VẠCH NGĂN (FLOURISHES & DIVIDERS) =================
  {
    id: "stk-flourish-1",
    category: "flourishes",
    name: "Họa tiết góc mạ vàng Baroque",
    url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=350",
    width: 140,
    height: 140,
    badge: "Hoàng gia",
  },
  {
    id: "stk-flourish-2",
    category: "flourishes",
    name: "Nơ ruy băng lụa đỏ satin",
    url: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=350",
    width: 150,
    height: 110,
    badge: "Mềm mại",
  },
  {
    id: "stk-flourish-3",
    category: "flourishes",
    name: "Vạch ngăn kim cương dát vàng",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=350",
    width: 240,
    height: 40,
  },
  {
    id: "stk-flourish-4",
    category: "flourishes",
    name: "Góc viền Art Deco hình học",
    url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=350",
    width: 130,
    height: 130,
  },
  {
    id: "stk-flourish-5",
    category: "flourishes",
    name: "Dải lụa hoàng gia Champagne",
    url: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?q=80&w=350",
    width: 180,
    height: 90,
  },
  {
    id: "stk-flourish-6",
    category: "flourishes",
    name: "Vòng nguyệt quế vàng Crown",
    url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=350",
    width: 150,
    height: 150,
  },
  {
    id: "stk-flourish-7",
    category: "flourishes",
    name: "Vạch chia dòng hoa lá uốn lượn",
    url: "https://images.unsplash.com/photo-1508615039623-a25605d2b022?q=80&w=350",
    width: 260,
    height: 50,
  },
  {
    id: "stk-flourish-8",
    category: "flourishes",
    name: "Dải nơ kem sang trọng",
    url: "https://images.unsplash.com/photo-1544717302-de2939b7ef71?q=80&w=350",
    width: 140,
    height: 100,
  },

  // ================= 5. CON DẤU SÁP & TEM (SEALS & STAMPS) =================
  {
    id: "stk-seal-1",
    category: "seals",
    name: "Con dấu sáp đỏ trái tim hoàng gia",
    url: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=350",
    width: 110,
    height: 110,
    badge: "Hot",
  },
  {
    id: "stk-seal-2",
    category: "seals",
    name: "Con dấu sáp vàng ánh kim Monogram",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=350",
    width: 110,
    height: 110,
  },
  {
    id: "stk-seal-3",
    category: "seals",
    name: "Con dấu sáp xanh ngọc cành ô liu",
    url: "https://images.unsplash.com/photo-1508615039623-a25605d2b022?q=80&w=350",
    width: 110,
    height: 110,
  },
  {
    id: "stk-seal-4",
    category: "seals",
    name: "Tem bưu thiếp hoa hồng cổ điển",
    url: "https://images.unsplash.com/photo-1544717302-de2939b7ef71?q=80&w=350",
    width: 120,
    height: 150,
  },
  {
    id: "stk-seal-5",
    category: "seals",
    name: "Dấu sáp bạc nạm ngọc trai",
    url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=350",
    width: 110,
    height: 110,
  },

  // ================= 6. LẤP LÁNH & ÁNH SÁNG (GLOW & ACCENTS) =================
  {
    id: "stk-accent-1",
    category: "accents",
    name: "Bụi sao vàng lấp lánh (Sparkles)",
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=350",
    width: 150,
    height: 150,
    badge: "Hiệu ứng",
  },
  {
    id: "stk-accent-2",
    category: "accents",
    name: "Vệt sáng Bokeh hoàng kim",
    url: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=350",
    width: 200,
    height: 140,
  },
  {
    id: "stk-accent-3",
    category: "accents",
    name: "Cánh hoa rơi bồng bềnh",
    url: "https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=350",
    width: 160,
    height: 160,
  },
  {
    id: "stk-accent-4",
    category: "accents",
    name: "Ánh chớp sao băng ước nguyện",
    url: "https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?q=80&w=350",
    width: 150,
    height: 150,
  },
];

export function getStickersByCategory(category: string): WeddingStickerItem[] {
  if (category === "all") return WEDDING_STICKERS;
  return WEDDING_STICKERS.filter((s) => s.category === category);
}
