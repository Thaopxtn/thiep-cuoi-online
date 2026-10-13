import { describe, it, expect } from "vitest";
import { findZenloveTemplate, ZENLOVE_TEMPLATES } from "@/data/zenloveTemplates";
import { INITIAL_CARDS } from "@/data/initialCards";
import { toggleWishLike, getAllCards, getCardByIdOrSlug } from "./weddingCardService";

describe("Hệ thống Hiệu ứng & Mẫu thiệp cưới tương tác ZenLove", () => {
  it("3 mẫu template mới (Aurora Luxury, Chung Đôi Son Sắt, Pure Romance) đã được đăng ký trên hệ thống", () => {
    const aurora = findZenloveTemplate("aurora-luxury");
    expect(aurora).toBeDefined();
    expect(aurora?.name).toBe("Aurora Luxury");

    const chungDoi = findZenloveTemplate("chung-doi-son-sat");
    expect(chungDoi).toBeDefined();
    expect(chungDoi?.name).toBe("Chung Đôi Son Sắt");

    const pureRomance = findZenloveTemplate("pure-romance");
    expect(pureRomance).toBeDefined();
    expect(pureRomance?.name).toBe("Pure Romance");
  });

  it("INITIAL_CARDS chứa 3 mẫu thiệp với đầy đủ dữ liệu cấu hình phong bì, hiệu ứng rơi và Love Story", () => {
    const auroraCard = INITIAL_CARDS.find((c) => c.slug === "aurora-luxury");
    expect(auroraCard).toBeDefined();
    expect(auroraCard?.envelopeTheme).toBe("cream");
    expect(auroraCard?.ambientEffect).toBe("sparkles");
    expect(auroraCard?.loveStory?.length).toBeGreaterThan(0);

    const chungDoiCard = INITIAL_CARDS.find((c) => c.slug === "chung-doi-son-sat");
    expect(chungDoiCard).toBeDefined();
    expect(chungDoiCard?.envelopeTheme).toBe("traditional");
    expect(chungDoiCard?.ambientEffect).toBe("petals");

    const pureRomanceCard = INITIAL_CARDS.find((c) => c.slug === "pure-romance");
    expect(pureRomanceCard).toBeDefined();
    expect(pureRomanceCard?.envelopeTheme).toBe("cream");
    expect(pureRomanceCard?.ambientEffect).toBe("hearts");
  });

  it("toggleWishLike xử lý đúng khi thả tim lời chúc", () => {
    const targetCard = INITIAL_CARDS.find((c) => c.wishes.length > 0);
    expect(targetCard).toBeDefined();
    if (targetCard && targetCard.wishes[0]) {
      const wishId = targetCard.wishes[0].id;
      // In node/vitest environment, toggleWishLike returns a number >= 1
      const count = toggleWishLike(targetCard.id, wishId);
      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });
});
