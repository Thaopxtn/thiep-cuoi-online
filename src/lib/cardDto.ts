import { WeddingCard, WeddingRsvp, WeddingWish, WeddingEvent } from "@/data/initialCards";

/**
 * PublicCardDTO: DTO an toàn chỉ chứa dữ liệu công khai cho khách xem thiệp.
 * - Tuyệt đối không chứa userId, groom.userId, email quản trị.
 * - Danh sách RSVP không chứa số điện thoại hay ghi chú riêng tư.
 * - Chỉ áp dụng cho thiệp ở trạng thái 'published'.
 */
export interface PublicRsvpDTO {
  id: string;
  cardId: string;
  name: string;
  attending: boolean;
  guests: number;
  createdAt: string;
}

export interface PublicCardDTO {
  id: string;
  slug: string;
  name: string;
  templateId: string;
  templateName: string;
  status: "published";
  updatedAt: string;
  views: number;
  coverImage: string;
  story: string;
  weddingDate: string;
  weddingTime: string;
  lunarDate: string;
  groom: {
    name: string;
    title: string;
    phone?: string;
    parents?: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    qrCode?: string;
  };
  bride: {
    name: string;
    title: string;
    phone?: string;
    parents?: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    qrCode?: string;
  };
  events: WeddingEvent[];
  album: string[];
  musicTitle: string;
  musicUrl: string;
  rsvps: PublicRsvpDTO[];
  wishes: WeddingWish[];
  nodes?: Record<string, any>;
  showGiftBox?: boolean;
  showWishes?: boolean;
  showRsvp?: boolean;
  showEvents?: boolean;
}

/**
 * Lọc danh sách RSVP để công khai cho khách:
 * Loại bỏ hoàn toàn phone và note riêng tư.
 */
export function sanitizeRsvpsForPublic(rsvps?: WeddingRsvp[]): PublicRsvpDTO[] {
  if (!Array.isArray(rsvps)) return [];
  return rsvps.map((r) => ({
    id: r.id,
    cardId: r.cardId,
    name: r.name || "Khách mời",
    attending: Boolean(r.attending),
    guests: Number(r.guests || 1),
    createdAt: r.createdAt || "",
  }));
}

/**
 * Chuyển đổi WeddingCard thành PublicCardDTO
 * - Xóa sạch userId của chủ thiệp
 * - Ẩn số điện thoại và ghi chú khách mời trong RSVP
 * - Ẩn thông tin tài khoản nếu showGiftBox = false
 */
export function toPublicCardDTO(card: WeddingCard): PublicCardDTO {
  const showGift = card.showGiftBox !== false;

  return {
    id: card.id,
    slug: card.slug,
    name: card.name,
    templateId: card.templateId || card.id,
    templateName: card.templateName || "Hồng Phong",
    status: "published",
    updatedAt: card.updatedAt,
    views: Number(card.views || 0),
    coverImage: card.coverImage || "",
    story: card.story || "",
    weddingDate: card.weddingDate || "2026-11-18",
    weddingTime: card.weddingTime || "11:00",
    lunarDate: card.lunarDate || "",
    groom: {
      name: card.groom?.name || "Chú Rể",
      title: card.groom?.title || "Chú Rể",
      phone: card.groom?.phone || "",
      parents: card.groom?.parents || "",
      bankName: showGift ? card.groom?.bankName : undefined,
      accountNumber: showGift ? card.groom?.accountNumber : undefined,
      accountName: showGift ? card.groom?.accountName : undefined,
      qrCode: showGift ? card.groom?.qrCode : undefined,
    },
    bride: {
      name: card.bride?.name || "Cô Dâu",
      title: card.bride?.title || "Cô Dâu",
      phone: card.bride?.phone || "",
      parents: card.bride?.parents || "",
      bankName: showGift ? card.bride?.bankName : undefined,
      accountNumber: showGift ? card.bride?.accountNumber : undefined,
      accountName: showGift ? card.bride?.accountName : undefined,
      qrCode: showGift ? card.bride?.qrCode : undefined,
    },
    events: Array.isArray(card.events) ? card.events : [],
    album: Array.isArray(card.album) ? card.album : [],
    musicTitle: card.musicTitle || "",
    musicUrl: card.musicUrl || "",
    rsvps: sanitizeRsvpsForPublic(card.rsvps),
    wishes: Array.isArray(card.wishes) ? card.wishes : [],
    nodes: card.nodes,
    showGiftBox: card.showGiftBox,
    showWishes: card.showWishes,
    showRsvp: card.showRsvp,
    showEvents: card.showEvents,
  };
}
