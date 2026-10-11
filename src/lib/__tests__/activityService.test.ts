import { describe, it, expect, vi, beforeEach } from "vitest";
import { recordActivity, getAggregatedActivities } from "../activityService";

// Mock serverDb module
vi.mock("../serverDb", () => ({
  getCardsFromDb: vi.fn().mockResolvedValue([
    {
      id: "card_mock_1",
      name: "Thiệp cưới Hoàng Nam & Mai Lan",
      slug: "hoang-nam-mai-lan",
      status: "published",
      views: 120,
      updatedAt: "2026-10-10T10:00:00Z",
      groom: { name: "Hoàng Nam" },
      bride: { name: "Mai Lan" },
      userId: "user_test_1",
    },
  ]),
  getAllRsvpsFromDb: vi.fn().mockResolvedValue([
    {
      id: "rsvp_mock_1",
      name: "Anh Tuấn",
      phone: "0901234567",
      attending: true,
      guests: 2,
      note: "Sẽ đến đúng giờ",
      cardName: "Thiệp cưới Hoàng Nam & Mai Lan",
      cardSlug: "hoang-nam-mai-lan",
      createdAt: "2026-10-11T08:00:00Z",
    },
  ]),
  getAllWishesFromDb: vi.fn().mockResolvedValue([
    {
      id: "wish_mock_1",
      name: "Chị Hạnh",
      content: "Chúc hai em trăm năm hạnh phúc!",
      cardName: "Thiệp cưới Hoàng Nam & Mai Lan",
      cardSlug: "hoang-nam-mai-lan",
      createdAt: "2026-10-11T09:00:00Z",
    },
  ]),
  getUsersWithStatsFromDb: vi.fn().mockResolvedValue([
    {
      id: "user_test_1",
      email: "nam@example.com",
      name: "Hoàng Nam",
      provider: "google",
      cardsCount: 1,
      createdAt: "2026-10-09T08:00:00Z",
    },
  ]),
}));

describe("Activity Service - Giám sát toàn bộ hoạt động của website và người dùng", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Ghi nhận sự kiện thời gian thực (recordActivity)", () => {
    const act = recordActivity({
      type: "user_login",
      title: "Đăng nhập tài khoản",
      actorName: "Lê Văn A",
      actorEmail: "leva@example.com",
      actorType: "user",
      details: "Đăng nhập bằng Email/Password",
    });

    expect(act).toBeDefined();
    expect(act.id).toMatch(/^act_/);
    expect(act.type).toBe("user_login");
    expect(act.actorName).toBe("Lê Văn A");
    expect(act.timestamp).toBeDefined();
  });

  it("Tổng hợp đầy đủ hoạt động từ Database và Runtime Buffer (getAggregatedActivities)", async () => {
    const activities = await getAggregatedActivities();

    expect(activities).toBeInstanceOf(Array);
    expect(activities.length).toBeGreaterThan(0);

    // Kiểm tra có sự kiện card, rsvp, wish, user
    const types = activities.map((a) => a.type);
    expect(types).toContain("card_publish");
    expect(types).toContain("rsvp_submit");
    expect(types).toContain("wish_submit");
    expect(types).toContain("user_register");
  });

  it("Lọc theo loại hành động (type filter)", async () => {
    const rsvpOnly = await getAggregatedActivities({ type: "rsvp_submit" });
    expect(rsvpOnly.length).toBeGreaterThan(0);
    rsvpOnly.forEach((a) => {
      expect(a.type).toBe("rsvp_submit");
    });

    const wishOnly = await getAggregatedActivities({ type: "wish_submit" });
    expect(wishOnly.length).toBeGreaterThan(0);
    wishOnly.forEach((a) => {
      expect(a.type).toBe("wish_submit");
    });
  });

  it("Tìm kiếm theo từ khóa (keyword search)", async () => {
    const searchResults = await getAggregatedActivities({ search: "Mai Lan" });
    expect(searchResults.length).toBeGreaterThan(0);
    const found = searchResults.some(
      (a) =>
        a.title.includes("Mai Lan") ||
        a.actorName.includes("Mai Lan") ||
        (a.targetName && a.targetName.includes("Mai Lan"))
    );
    expect(found).toBe(true);
  });
});
