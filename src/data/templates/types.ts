import { TemplateModule } from "@/components/modules/types";

export type StyleTag =
  | "classic"
  | "modern"
  | "minimal"
  | "traditional"
  | "rustic"
  | "luxury"
  | "playful"
  | "cute";

export type ColorFamily =
  | "red"
  | "gold"
  | "pink"
  | "pastel"
  | "green"
  | "blue"
  | "neutral";

export type TemplateFeature =
  | "countdown"
  | "calendar"
  | "album"
  | "map"
  | "rsvp"
  | "gift"
  | "wishes"
  | "music"
  | "envelope";

export type RecipeId =
  | "red-wax-classic"
  | "sky-graduation"
  | "traditional-red"
  | "birthday-balloon"
  | "modern-minimal"
  | "floral-rustic"
  | "luxury-gold"
  | "standard-envelope";

export interface TemplatePalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

export interface TemplateMeta {
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  version: number;
  author: string; // "ZenLove" | "Bạn" | string
  styleTags: StyleTag[];
  colorFamily: ColorFamily;
  palette: TemplatePalette;
  features: TemplateFeature[];
  origin: "preset" | "custom" | "imported" | "duplicated";
  sourceId?: string; // id của template gốc nếu là bản sao
}

export interface TemplateItem {
  id: string;
  title: string;
  slug: string;
  category: "all" | "wedding" | "graduation" | "birthday" | "event" | "anniversary";
  categoryName: string;
  image: string;
  scrollPercent: string;
  scrollDuration: string;
  tag?: "PREMIUM" | "HOT" | "FREE" | "MỚI" | "NỔI BẬT" | "SANG TRỌNG" | "HOÀNG GIA" | string;
  likes: number;
  views: number;
  description: string;
  type: "graduation" | "wedding" | "general";
  recipe?: RecipeId;
  meta?: TemplateMeta;
  modules?: TemplateModule[];
  defaultData: {
    eventTitle: string;
    person1: string;
    person2?: string;
    date: string;
    time: string;
    venue: string;
    address: string;
    mapUrl: string;
    quote: string;
    invitationBody: string;
    signature?: string;
    mainPhoto: string;
    albumPhotos: string[];
    musicTitle: string;
    musicUrl: string;
    bankInfo: {
      bankName: string;
      accountNumber: string;
      accountHolder: string;
      qrImage?: string;
    };
    initialWishes: Array<{
      id: string;
      name: string;
      message: string;
      time?: string;
    }>;
  };
}
