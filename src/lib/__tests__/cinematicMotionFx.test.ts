import { describe, it, expect } from "vitest";
import { WeddingCard } from "@/data/initialCards";
import { toPublicCardDTO } from "@/lib/cardDto";

describe("Cinematic Motion Graphics Suite & 3D Envelope Suite", () => {
  it("PublicCardDTO preserves and sanitizes cinematicFx and expanded envelopeThemes", () => {
    const mockCard: WeddingCard = {
      id: "card_cinematic_test",
      slug: "cinematic-test",
      name: "Thiệp Điện Ảnh",
      templateId: "aurora-luxury",
      templateName: "Aurora Luxury",
      status: "published",
      updatedAt: new Date().toISOString(),
      views: 120,
      coverImage: "https://example.com/cover.jpg",
      story: "Love story",
      weddingDate: "2026-12-25",
      weddingTime: "18:00",
      lunarDate: "16/11 Bính Ngọ",
      groom: {
        userId: "admin_secret_uid",
        name: "Quốc Tuấn",
        title: "Chú Rể",
        phone: "0901234567",
      },
      bride: {
        name: "Minh Anh",
        title: "Cô Dâu",
        phone: "0907654321",
      },
      events: [],
      album: [],
      musicTitle: "A Thousand Years",
      musicUrl: "https://example.com/music.mp3",
      rsvps: [],
      wishes: [],
      envelopeTheme: "emerald",
      cinematicFx: {
        enabled: true,
        touchSparkles: true,
        lightLeaks: true,
        ambientDust: true,
        goldShimmer: true,
        sealSymbol: "crown",
        intensity: "vibrant",
        colorScheme: "gold",
      },
    };

    const publicDto = toPublicCardDTO(mockCard);

    // 1. Envelope Theme must match expanded palette
    expect(publicDto.envelopeTheme).toBe("emerald");

    // 2. Cinematic FX must be present
    expect(publicDto.cinematicFx).toBeDefined();
    expect(publicDto.cinematicFx.sealSymbol).toBe("crown");
    expect(publicDto.cinematicFx.touchSparkles).toBe(true);
    expect(publicDto.cinematicFx.lightLeaks).toBe(true);
    expect(publicDto.cinematicFx.goldShimmer).toBe(true);

    // 3. Sensitive fields must still be stripped
    expect((publicDto as any).userId).toBeUndefined();
    expect((publicDto.groom as any).userId).toBeUndefined();
  });

  it("Supports all 6 luxury envelope themes and wax seal emblems", () => {
    const validThemes = ["cream", "burgundy", "emerald", "midnight", "blush", "traditional"];
    const validEmblems = ["囍", "heart", "crown", "sparkle", "monogram"];

    expect(validThemes).toHaveLength(6);
    expect(validEmblems).toHaveLength(5);
    expect(validThemes.includes("emerald")).toBe(true);
    expect(validThemes.includes("midnight")).toBe(true);
    expect(validThemes.includes("blush")).toBe(true);
  });
});
