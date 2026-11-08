import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { WeddingCard } from "@/data/initialCards";

const mocks = vi.hoisted(() => ({
  getCard: vi.fn(), upsertCard: vi.fn(), userAuth: vi.fn(), adminAuth: vi.fn(),
}));

vi.mock("@/lib/serverDb", () => ({
  getCardByIdOrSlugFromDb: mocks.getCard,
  upsertCardToDb: mocks.upsertCard,
  getCardsFromDb: vi.fn(),
  deleteCardFromDb: vi.fn(),
}));
vi.mock("@/lib/serverAuth", async (importOriginal) => ({
  ...await importOriginal<typeof import("../serverAuth")>(),
  verifyUserAuth: mocks.userAuth,
  verifyAdminAuth: mocks.adminAuth,
}));
vi.mock("@/lib/activityService", () => ({ recordActivity: vi.fn() }));

import { PUT } from "@/app/api/cards/[id]/route";
import { POST } from "@/app/api/cards/route";

function existingCard(overrides: Partial<WeddingCard> = {}): WeddingCard {
  return {
    id: "existing-card", slug: "existing-slug", name: "Thiệp ban đầu",
    templateId: "template-1", templateName: "Mẫu 1", status: "draft",
    updatedAt: "2026-11-03", views: 24, coverImage: "", story: "Câu chuyện",
    weddingDate: "2026-12-01", weddingTime: "11:00", lunarDate: "",
    groom: { userId: "owner", name: "Chú Rể", title: "Chú Rể", phone: "" },
    bride: { name: "Cô Dâu", title: "Cô Dâu", phone: "" },
    events: [], album: [], musicTitle: "", musicUrl: "", rsvps: [], wishes: [],
    userId: "owner", isVip: false, plan: "free", showWatermark: true,
    ...overrides,
  };
}

function request(method: string, body: unknown, path = "/api/cards/existing-card") {
  return new NextRequest(`https://app.example.test${path}`, {
    method,
    headers: { Authorization: "Bearer owner-token", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Card API write authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const card = existingCard();
    mocks.getCard.mockImplementation(async (key) =>
      key === card.id || key === card.slug ? card : null);
    mocks.upsertCard.mockImplementation(async (card) => card);
    mocks.userAuth.mockResolvedValue({ authenticated: true, userId: "owner" });
    mocks.adminAuth.mockResolvedValue({ authenticated: false });
  });

  it("allows content edits but preserves ownership, entitlements and server-managed data", async () => {
    const response = await PUT(request("PUT", {
      id: "replacement-id", userId: "attacker", user_id: "attacker",
      name: "Tên mới", story: "Nội dung mới", isVip: true, plan: "premium",
      vipUnlockedAt: "forged", showWatermark: false, views: 999999,
      rsvps: [{ id: "forged" }], wishes: [{ id: "forged" }],
      groom: { userId: "attacker", name: "Tên chú rể mới", isVip: true,
        plan: "vip", showWatermark: false, vipUnlockedAt: "forged" },
      bride: { name: "Tên cô dâu mới", isVip: true },
    }, "/api/cards/existing-slug"), { params: { id: "existing-slug" } });

    expect(response.status).toBe(200);
    const saved = mocks.upsertCard.mock.calls[0][0];
    expect(saved).toMatchObject({
      id: "existing-card", userId: "owner", name: "Tên mới", story: "Nội dung mới",
      isVip: false, plan: "free", showWatermark: true, views: 24, rsvps: [], wishes: [],
      groom: { userId: "owner", name: "Tên chú rể mới", isVip: false,
        plan: "free", showWatermark: true },
      bride: { name: "Tên cô dâu mới" },
    });
    expect(saved.vipUnlockedAt).toBeUndefined();
    expect(saved.groom.vipUnlockedAt).toBeUndefined();
    expect(saved.user_id).toBeUndefined();
    expect(saved.bride.isVip).toBeUndefined();
    expect(saved.weddingDate).toBe("2026-12-01");
  });

  it("keeps paid status when an older editor submits stale free-plan fields", async () => {
    const card = existingCard({ isVip: true, plan: "vip", showWatermark: false,
      vipUnlockedAt: "2026-11-01T00:00:00Z" });
    mocks.getCard.mockResolvedValue(card);
    const response = await PUT(request("PUT", {
      name: "Sửa nội dung", isVip: false, plan: "free", showWatermark: true,
      groom: { isVip: false, plan: "free", vipUnlockedAt: null },
    }), { params: { id: card.id } });

    expect(response.status).toBe(200);
    expect(mocks.upsertCard.mock.calls[0][0]).toMatchObject({
      isVip: true, plan: "vip", showWatermark: false, vipUnlockedAt: "2026-11-01T00:00:00Z",
      groom: { isVip: true, plan: "vip", showWatermark: false,
        vipUnlockedAt: "2026-11-01T00:00:00Z" },
    });
  });

  it("preserves a legacy groom owner and legacy paid metadata", async () => {
    const card = existingCard({ userId: undefined, isVip: undefined, plan: undefined,
      showWatermark: undefined,
      groom: { userId: "owner", name: "Chú Rể", title: "Chú Rể", phone: "",
        isVip: true, plan: "vip", showWatermark: false } as WeddingCard["groom"],
    });
    mocks.getCard.mockResolvedValue(card);
    expect((await PUT(request("PUT", { story: "Sửa thiệp cũ", groom: { userId: "attacker" } }),
      { params: { id: card.id } })).status).toBe(200);
    expect(mocks.upsertCard.mock.calls[0][0]).toMatchObject({
      userId: "owner", isVip: true, plan: "vip", showWatermark: false,
      groom: { userId: "owner", name: "Chú Rể", isVip: true },
    });
  });

  it("does not let a generic admin content save grant VIP", async () => {
    mocks.adminAuth.mockResolvedValue({ authenticated: true });
    expect((await PUT(request("PUT", { isVip: true, plan: "vip" }),
      { params: { id: "existing-card" } })).status).toBe(200);
    expect(mocks.upsertCard.mock.calls[0][0].isVip).toBe(false);
  });

  it("rejects changes to another user's card", async () => {
    mocks.userAuth.mockResolvedValue({ authenticated: true, userId: "stranger" });
    expect((await PUT(request("PUT", { name: "Stolen" }),
      { params: { id: "existing-card" } })).status).toBe(403);
    expect(mocks.upsertCard).not.toHaveBeenCalled();
  });

  it("does not overwrite another card through a changed slug", async () => {
    mocks.getCard.mockImplementation(async (key) => key === "taken-slug"
      ? existingCard({ id: "other-card", slug: "taken-slug", userId: "stranger" })
      : existingCard());
    expect((await PUT(request("PUT", { slug: "taken-slug" }),
      { params: { id: "existing-card" } })).status).toBe(409);
    expect(mocks.upsertCard).not.toHaveBeenCalled();
  });

  it("creates free cards with a verified owner despite forged nested paid metadata", async () => {
    mocks.getCard.mockResolvedValue(null);
    const response = await POST(request("POST", {
      id: "new-card", name: "Thiệp mới", userId: "stranger", isVip: true,
      plan: "vip", vipUnlockedAt: "forged", showWatermark: false, views: 99,
      groom: { name: "An", userId: "stranger", isVip: true, plan: "vip" },
      rsvps: [{ id: "forged" }], wishes: [{ id: "forged" }],
    }, "/api/cards"));

    expect(response.status).toBe(200);
    expect(mocks.upsertCard.mock.calls[0][0]).toMatchObject({
      id: "new-card", userId: "owner", isVip: false, plan: "free", showWatermark: true,
      views: 0, rsvps: [], wishes: [], status: "draft",
      groom: { name: "An", userId: "owner", isVip: false, plan: "free", showWatermark: true },
    });
    expect(mocks.upsertCard.mock.calls[0].slice(1)).toEqual(["owner-token", { createOnly: true }]);
  });

  it.each([
    { id: "existing-card", name: "Overwrite ID" },
    { id: "new-card", slug: "existing-slug", name: "Overwrite slug" },
  ])("rejects creation over an existing ID or slug: $name", async (body) => {
    expect((await POST(request("POST", body, "/api/cards"))).status).toBe(409);
    expect(mocks.upsertCard).not.toHaveBeenCalled();
  });
});
