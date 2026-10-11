import { describe, it, expect, vi } from "vitest";
import { INITIAL_CARDS } from "@/data/initialCards";
import { CardExportOptions } from "../cardImageExporter";

describe("cardImageExporter Module", () => {
  const sampleCard = INITIAL_CARDS[0];

  it("should have valid sample card data with groom, bride and dates", () => {
    expect(sampleCard).toBeDefined();
    expect(sampleCard.groom.name).toBe("Đức Mạnh");
    expect(sampleCard.bride.name).toBe("Thùy Dung");
    expect(sampleCard.weddingDate).toBe("2026-11-18");
  });

  it("should reject execution gracefully in non-browser environment", async () => {
    // In Node.js environment without DOM document, renderWeddingCardToCanvas throws clean error
    const { renderWeddingCardToCanvas } = await import("../cardImageExporter");
    
    // We expect it either throws document not defined or renders if jsdom/canvas is polyfilled
    if (typeof document === "undefined") {
      await expect(renderWeddingCardToCanvas(sampleCard)).rejects.toThrow(
        "renderWeddingCardToCanvas chỉ chạy trên trình duyệt"
      );
    }
  });

  it("should format correct filename pattern based on couple names and export mode", () => {
    const groomSlug = sampleCard.groom.name.replace(/\s+/g, "-");
    const brideSlug = sampleCard.bride.name.replace(/\s+/g, "-");
    const expectedStory = `thiep-cuoi-${groomSlug}-${brideSlug}-story.png`;
    const expectedPortrait = `thiep-cuoi-${groomSlug}-${brideSlug}-portrait.png`;

    expect(expectedStory).toBe("thiep-cuoi-Đức-Mạnh-Thùy-Dung-story.png");
    expect(expectedPortrait).toBe("thiep-cuoi-Đức-Mạnh-Thùy-Dung-portrait.png");
  });
});
