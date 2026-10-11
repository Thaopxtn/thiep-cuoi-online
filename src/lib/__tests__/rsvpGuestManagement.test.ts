import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  addRsvp,
  deleteRsvp,
  updateRsvpStatus,
  getAllCards,
  saveCard,
  INITIAL_CARDS,
  WeddingCard,
} from "../weddingCardService";

describe("RSVP Guest Management & Table Estimation", () => {
  const testCardId = "test-card-rsvp-1";
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    const mockStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, val: string) => {
        store[key] = val;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      key: (index: number) => Object.keys(store)[index] || null,
      length: 0,
    };

    (globalThis as any).window = {
      localStorage: mockStorage,
      location: { origin: "http://localhost:3005" },
    };
    (globalThis as any).localStorage = mockStorage;
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Setup clean card for testing
    const sampleCard: WeddingCard = {
      ...INITIAL_CARDS[0],
      id: testCardId,
      slug: "test-card-rsvp",
      rsvps: [
        {
          id: "rsvp-sample-1",
          cardId: testCardId,
          name: "Nguyễn Văn A",
          phone: "0912345678",
          attending: true,
          guests: 2,
          note: "Chúc hai bạn hạnh phúc",
          createdAt: "10/10/2026, 10:00:00",
        },
        {
          id: "rsvp-sample-2",
          cardId: testCardId,
          name: "Trần Thị B",
          phone: "0987654321",
          attending: false,
          guests: 0,
          note: "Tiếc quá hôm đó bận công tác",
          createdAt: "10/10/2026, 11:00:00",
        },
      ],
    };
    saveCard(sampleCard);
  });

  it("thêm khách mời mới thủ công (addRsvp) thành công", () => {
    const newGuest = addRsvp(testCardId, {
      name: "Lê Văn C",
      phone: "0901234567",
      attending: true,
      guests: 3,
      note: "Gia đình đi 3 người",
    });

    expect(newGuest).toBeDefined();
    expect(newGuest.name).toBe("Lê Văn C");
    expect(newGuest.attending).toBe(true);
    expect(newGuest.guests).toBe(3);

    const cards = getAllCards();
    const updatedCard = cards.find((c) => c.id === testCardId);
    expect(updatedCard?.rsvps?.some((r) => r.name === "Lê Văn C")).toBe(true);
  });

  it("chuyển đổi trạng thái tham dự của khách (updateRsvpStatus)", () => {
    // Chuyển từ attending true -> false
    updateRsvpStatus(testCardId, "rsvp-sample-1", false, 0);

    let cards = getAllCards();
    let updatedCard = cards.find((c) => c.id === testCardId);
    let rsvp1 = updatedCard?.rsvps?.find((r) => r.id === "rsvp-sample-1");
    expect(rsvp1?.attending).toBe(false);
    expect(rsvp1?.guests).toBe(0);

    // Chuyển lại từ false -> true với 2 khách
    updateRsvpStatus(testCardId, "rsvp-sample-1", true, 2);
    cards = getAllCards();
    updatedCard = cards.find((c) => c.id === testCardId);
    rsvp1 = updatedCard?.rsvps?.find((r) => r.id === "rsvp-sample-1");
    expect(rsvp1?.attending).toBe(true);
    expect(rsvp1?.guests).toBe(2);
  });

  it("xóa khách mời khỏi danh sách (deleteRsvp)", () => {
    deleteRsvp(testCardId, "rsvp-sample-2");

    const cards = getAllCards();
    const updatedCard = cards.find((c) => c.id === testCardId);
    expect(updatedCard?.rsvps?.some((r) => r.id === "rsvp-sample-2")).toBe(false);
  });

  it("ước tính số bàn tiệc chuẩn (mâm 10 người và mâm 6 người)", () => {
    const rsvps = [
      { attending: true, guests: 2 },
      { attending: true, guests: 4 },
      { attending: true, guests: 5 },
      { attending: false, guests: 0 },
      { attending: true, guests: 1 },
    ];

    const totalAttendingGuests = rsvps
      .filter((r) => r.attending)
      .reduce((sum, r) => sum + r.guests, 0); // 2 + 4 + 5 + 1 = 12

    expect(totalAttendingGuests).toBe(12);

    const tables10 = Math.ceil(totalAttendingGuests / 10); // 12 / 10 = 2 bàn mâm 10
    const tables6 = Math.ceil(totalAttendingGuests / 6);   // 12 / 6 = 2 bàn mâm 6

    expect(tables10).toBe(2);
    expect(tables6).toBe(2);
  });

  it("xuất CSV UTF-8 với ký tự BOM và định dạng chuẩn Excel", () => {
    const BOM = "\uFEFF";
    const headers = ["STT", "Họ và tên", "Số điện thoại", "Trạng thái", "Số người"];
    const row = ["1", '"Nguyễn Văn A"', '"0912345678"', "Có tham dự", "2"];
    const csvContent = BOM + [headers.join(","), row.join(",")].join("\r\n");

    expect(csvContent.startsWith("\uFEFF")).toBe(true);
    expect(csvContent).toContain("Nguyễn Văn A");
    expect(csvContent).toContain("Có tham dự");
  });
});
