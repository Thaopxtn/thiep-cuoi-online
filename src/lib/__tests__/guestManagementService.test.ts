import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateGuestStats,
  bulkImportGuests,
  getZaloSharePayload,
  exportGuestsToCsv,
  GuestItem,
} from "../guestManagementService";
import { WeddingCard } from "@/data/initialCards";

describe("guestManagementService", () => {
  beforeEach(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
  });

  const mockCard: WeddingCard = {
    id: "card-crm-1",
    userId: "user-1",
    slug: "hoang-mai-wedding",
    name: "Lễ Thành Hôn Hoàng & Mai",
    themeId: "modern-minimalist",
    coverImage: "/images/cover.jpg",
    musicUrl: "/audio/wedding.mp3",
    musicAutoPlay: true,
    groom: {
      name: "Trần Minh Hoàng",
      role: "Chú rể",
      avatar: "/images/groom.jpg",
    },
    bride: {
      name: "Nguyễn Tuyết Mai",
      role: "Cô dâu",
      avatar: "/images/bride.jpg",
    },
    weddingDate: "2026-11-20",
    events: [
      {
        id: "evt-1",
        title: "Tiệc Cưới Chính",
        time: "18:00",
        date: "2026-11-20",
        venue: "Trung tâm Hội nghị White Palace",
        address: "194 Hoàng Văn Thụ, Q. Phú Nhuận, TP.HCM",
      },
    ],
    gallery: [],
    customSections: [],
    rsvps: [],
    wishes: [],
    views: 100,
    isPublished: true,
    createdAt: "2026-10-01",
    updatedAt: "2026-10-21",
  };

  it("bulkImportGuests parses multi-line inputs with phone and table correctly", () => {
    const rawInput = `
      Nguyễn Văn An - 0912345678 - Bàn 1
      Trần Thị Bình - Bạn Bè - 0987654321 - Bàn VIP
      Lê Hoàng Cúc - Nhà Trai
    `;

    const imported = bulkImportGuests("card-crm-1", rawInput, "friends");
    expect(imported).toHaveLength(3);
    expect(imported[0].name).toBe("Nguyễn Văn An");
    expect(imported[0].phone).toBe("0912345678");
    expect(imported[0].tableNumber).toBe("Bàn 1");

    expect(imported[1].name).toBe("Trần Thị Bình");
    expect(imported[1].group).toBe("friends");
    expect(imported[1].tableNumber).toBe("Bàn VIP");

    expect(imported[2].name).toBe("Lê Hoàng Cúc");
    expect(imported[2].group).toBe("groom_side");
  });

  it("calculateGuestStats aggregates counts, confirmed seats, and table counts correctly", () => {
    const sampleGuests: GuestItem[] = [
      {
        id: "g1",
        cardId: "card-crm-1",
        name: "Nguyễn Văn A",
        group: "friends",
        tableNumber: "Bàn 1",
        estimatedGuests: 2,
        status: "confirmed",
        createdAt: "2026-10-21",
        updatedAt: "2026-10-21",
      },
      {
        id: "g2",
        cardId: "card-crm-1",
        name: "Trần Thị B",
        group: "colleagues",
        tableNumber: "Bàn 1",
        estimatedGuests: 1,
        status: "sent",
        createdAt: "2026-10-21",
        updatedAt: "2026-10-21",
      },
      {
        id: "g3",
        cardId: "card-crm-1",
        name: "Lê Văn C",
        group: "vip",
        tableNumber: "Bàn VIP",
        estimatedGuests: 3,
        status: "confirmed",
        createdAt: "2026-10-21",
        updatedAt: "2026-10-21",
      },
      {
        id: "g4",
        cardId: "card-crm-1",
        name: "Phạm Thị D",
        group: "groom_side",
        estimatedGuests: 1,
        status: "not_sent",
        createdAt: "2026-10-21",
        updatedAt: "2026-10-21",
      },
    ];

    const stats = calculateGuestStats(sampleGuests);
    expect(stats.total).toBe(4);
    expect(stats.notSent).toBe(1);
    expect(stats.sent).toBe(1);
    expect(stats.confirmed).toBe(2);
    expect(stats.totalSeats).toBe(5); // 2 + 3
    expect(stats.assignedTablesCount).toBe(2); // "Bàn 1" and "Bàn VIP"
  });

  it("getZaloSharePayload generates valid personalized invitation URL and Zalo share text", () => {
    const guest: GuestItem = {
      id: "g-test",
      cardId: "card-crm-1",
      name: "Bác Hùng",
      group: "groom_side",
      tableNumber: "Bàn Trưởng Bối 1",
      estimatedGuests: 2,
      status: "not_sent",
      createdAt: "2026-10-21",
      updatedAt: "2026-10-21",
    };

    const payload = getZaloSharePayload(guest, mockCard, "https://zenlove.me");
    expect(payload.cardUrl).toContain("to=B%C3%A1c%20H%C3%B9ng");
    expect(new URL(payload.cardUrl).searchParams.get("guestId")).toBe(guest.id);
    expect(new URL(payload.cardUrl).searchParams.get("cardId")).toBe(mockCard.id);
    expect(payload.cardUrl).toContain("table=B%C3%A0n%20Tr%C6%B0%E1%BB%9Fng%20B%E1%BB%91i%201");
    expect(payload.zaloUrl).toContain("https://zalo.me/share");
    expect(payload.shareText).toContain("Bác Hùng");
    expect(payload.shareText).toContain("Bàn Trưởng Bối 1");
    expect(payload.shareText).toContain("Trần Minh Hoàng & Nguyễn Tuyết Mai");
  });

  it("exportGuestsToCsv produces valid UTF-8 BOM CSV format", () => {
    const guests: GuestItem[] = [
      {
        id: "g1",
        cardId: "card-crm-1",
        name: "Nguyễn Văn An",
        phone: "0901234567",
        group: "friends",
        tableNumber: "Bàn 5",
        estimatedGuests: 2,
        status: "confirmed",
        notes: "Bạn đại học",
        createdAt: "2026-10-21",
        updatedAt: "2026-10-21",
      },
    ];

    const csv = exportGuestsToCsv(guests);
    expect(csv.charCodeAt(0)).toBe(0xfeff); // UTF-8 BOM
    expect(csv).toContain("Họ Và Tên");
    expect(csv).toContain("Nguyễn Văn An");
    expect(csv).toContain("0901234567");
    expect(csv).toContain("Bàn 5");
  });
});
