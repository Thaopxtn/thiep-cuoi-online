export type ModuleType =
  | "hero-envelope"
  | "hero-sky-countdown"
  | "hero-traditional-red"
  | "hero-birthday"
  | "hero-modern-minimal"
  | "hero-floral-rustic"
  | "hero-luxury-gold"
  | "hero-red-wax-envelope"
  | "parents-family-invitation"
  | "wedding-schedule-cards"
  | "red-velvet-rsvp"
  | "red-envelope-gift-card"
  | "photo-gallery-grid"
  | "calendar"
  | "story-quote"
  | "polaroid-tape"
  | "photo-grid"
  | "venue-map"
  | "invitation-letter"
  | "rsvp"
  | "gift-bank"
  | "wishes-stream";

export interface TemplateModule {
  id: string;
  type: ModuleType;
  name: string;
  description: string;
  enabled: boolean;
  props: Record<string, any>;
}

export interface SharedInteractiveHandlers {
  onOpenWishes?: () => void;
  onOpenGift?: () => void;
  onOpenRsvp?: () => void;
  onShootHeart?: () => void;
  onAddWish?: (name: string, message: string) => void;
}
