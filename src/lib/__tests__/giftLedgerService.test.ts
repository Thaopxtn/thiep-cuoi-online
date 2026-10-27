import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateGiftStats,
  formatVndCurrency,
  exportGiftLedgerToCsv,
  GiftEntry,
  calculateBudgetStats,
  BudgetItem,
  BUDGET_CATEGORIES,
} from "../giftLedgerService";

describe("giftLedgerService", () => {
  const sampleEntries: GiftEntry[] = [
    {
      id: "gift-1",
      cardId: "card-123",
      senderName: "Bác Hùng",
      amount: 1000000,
      method: "cash",
      relation: "groom_side",
      wishes: "Chúc hai cháu trăm năm hạnh phúc!",
      createdAt: "2026-11-20T10:00:00Z",
    },
    {
      id: "gift-2",
      cardId: "card-123",
      senderName: "Anh Hoàng",
      amount: 500000,
      method: "transfer",
      relation: "friends",
      wishes: "Mừng đám cưới bạn hiền!",
      createdAt: "2026-11-20T11:00:00Z",
    },
    {
      id: "gift-3",
      cardId: "card-123",
      senderName: "Chị Lan",
      amount: 2000000,
      method: "transfer",
      relation: "colleagues",
      wishes: "Chúc mừng tân lang tân nương!",
      createdAt: "2026-11-20T12:00:00Z",
    },
  ];

  it("calculateGiftStats should accurately compute totals and breakdown", () => {
    const stats = calculateGiftStats(sampleEntries);
    expect(stats.totalAmount).toBe(3500000);
    expect(stats.totalCount).toBe(3);
    expect(stats.cashAmount).toBe(1000000);
    expect(stats.cashCount).toBe(1);
    expect(stats.transferAmount).toBe(2500000);
    expect(stats.transferCount).toBe(2);
  });

  it("formatVndCurrency should format with VND currency sign", () => {
    const formatted = formatVndCurrency(1000000);
    expect(formatted).toContain("1.000.000");
    expect(formatted).toMatch(/₫|VND/);
  });

  it("exportGiftLedgerToCsv should include UTF-8 BOM and valid CSV columns", () => {
    const csv = exportGiftLedgerToCsv(sampleEntries, "Thiệp Cưới Hoàng & Mai");
    expect(csv.charCodeAt(0)).toBe(0xfeff); // UTF-8 BOM
    expect(csv).toContain("STT,Người mừng,Số tiền (VNĐ),Phương thức,Quan hệ,Lời chúc,Thời gian");
    expect(csv).toContain('"Bác Hùng","1000000","Tiền mặt / Phong bì","Họ Nhà Trai"');
    expect(csv).toContain('"Anh Hoàng","500000","Chuyển khoản (VietQR)","Bạn Bè"');
  });

  describe("Budget Planner Calculations", () => {
    const sampleBudgetItems: BudgetItem[] = [
      {
        id: "b1",
        cardId: "card-123",
        category: "venue",
        title: "Tiệc cưới khách sạn 5 sao",
        estimatedCost: 80000000,
        actualCost: 85000000,
        isPaid: true,
        createdAt: "2026-11-20T10:00:00Z",
      },
      {
        id: "b2",
        cardId: "card-123",
        category: "decor",
        title: "Trang trí sảnh hoa tươi",
        estimatedCost: 20000000,
        actualCost: 18000000,
        isPaid: false,
        createdAt: "2026-11-20T11:00:00Z",
      },
      {
        id: "b3",
        cardId: "card-123",
        category: "media",
        title: "Quay phóng sự cưới 4K",
        estimatedCost: 15000000,
        actualCost: 15000000,
        isPaid: true,
        createdAt: "2026-11-20T12:00:00Z",
      },
    ];

    it("calculateBudgetStats should compute totalEstimated, totalActual, and totalPaid accurately", () => {
      const stats = calculateBudgetStats(sampleBudgetItems);
      expect(stats.totalEstimated).toBe(115000000);
      expect(stats.totalActual).toBe(118000000);
      expect(stats.totalPaid).toBe(100000000); // 85M + 15M
    });

    it("BUDGET_CATEGORIES should cover all key wedding categories", () => {
      expect(BUDGET_CATEGORIES.length).toBeGreaterThanOrEqual(7);
      const catIds = BUDGET_CATEGORIES.map((c) => c.id);
      expect(catIds).toContain("venue");
      expect(catIds).toContain("decor");
      expect(catIds).toContain("outfit");
      expect(catIds).toContain("media");
      expect(catIds).toContain("jewelry");
    });
  });
});
