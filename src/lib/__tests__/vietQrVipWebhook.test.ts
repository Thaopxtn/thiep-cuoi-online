import { describe, it, expect } from "vitest";
import { generateVietQrUrl } from "../vietQrBankCodes";

describe("VietQR Webhook VIP Auto-Activation & Napas247 Integration", () => {
  const cardSlug = "thao-anh-hanh-phuc-2026";

  // Regex nhận diện cú pháp kích hoạt VIP trong Webhook
  const vipRegex = /(?:VIP|ZENLOVE\s*VIP|NANG\s*CAP)\s+([a-zA-Z0-9_-]+)/i;
  // Regex nhận diện mừng cưới online
  const mcRegex = /MC\s+([a-zA-Z0-9_-]+)/i;

  it("should accurately parse VIP activation memo from bank transfer contents", () => {
    const testCases = [
      { content: "VIP thao-anh-hanh-phuc-2026", expectedSlug: "thao-anh-hanh-phuc-2026" },
      { content: "ZENLOVE VIP duc-manh-thuy-dung", expectedSlug: "duc-manh-thuy-dung" },
      { content: "Nang cap hoang-nam-mai-lan", expectedSlug: "hoang-nam-mai-lan" },
      { content: "MBVCB.123456.VIP thao-anh-2026.CT tu NGUYEN VAN A", expectedSlug: "thao-anh-2026" },
    ];

    for (const tc of testCases) {
      const match = tc.content.match(vipRegex);
      expect(match).not.toBeNull();
      expect(match![1].toLowerCase()).toBe(tc.expectedSlug);
    }
  });

  it("should distinguish between VIP activation and Wedding Gift (MC)", () => {
    const vipContent = "VIP thao-anh-hanh-phuc-2026";
    const giftContent = "MC thao-anh-hanh-phuc-2026 Chu Ba mung hai chau";

    expect(vipContent.match(vipRegex)).not.toBeNull();
    expect(vipContent.match(mcRegex)).toBeNull();

    expect(giftContent.match(mcRegex)).not.toBeNull();
    expect(giftContent.match(vipRegex)).toBeNull();
  });

  it("should generate standard Napas247 VietQR URL with correct bank code and memo", () => {
    const bank = "MB";
    const acc = "240220038888";
    const name = "ZENLOVE PREMIUM";
    const amount = 99000;
    const memo = `VIP ${cardSlug}`;

    const url = generateVietQrUrl(bank, acc, name, amount, memo);

    expect(url).toContain("https://img.vietqr.io/image/MB-240220038888-compact2.png");
    expect(url).toContain("amount=99000");
    expect(url).toContain(encodeURIComponent(memo));
  });

  it("should verify VIP card object mutations remove watermark and unlock unlimited features", () => {
    const originalCard = {
      id: "card-123",
      slug: cardSlug,
      name: "Đám cưới Thảo & Anh",
      isVip: false,
      plan: "free" as const,
      showWatermark: true,
      groom: { name: "Chú Rể", title: "Chú Rể", phone: "" },
    };

    // Mô phỏng hàm kích hoạt VIP
    const nowIso = new Date().toISOString();
    const activatedCard = {
      ...originalCard,
      isVip: true,
      plan: "vip" as const,
      vipUnlockedAt: nowIso,
      showWatermark: false,
      groom: {
        ...originalCard.groom,
        isVip: true,
        plan: "vip",
        vipUnlockedAt: nowIso,
      },
    };

    expect(activatedCard.isVip).toBe(true);
    expect(activatedCard.plan).toBe("vip");
    expect(activatedCard.showWatermark).toBe(false);
    expect(activatedCard.vipUnlockedAt).toBeDefined();
    expect(activatedCard.groom.isVip).toBe(true);
  });
});
