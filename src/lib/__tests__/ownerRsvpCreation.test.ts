import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  user: { authenticated: true, userId: "owner" }, admin: { authenticated: false }, getCard: vi.fn(), create: vi.fn(),
}));
vi.mock("@/lib/serverAuth", () => ({
  verifyUserAuth: async () => mocks.user,
  verifyAdminAuth: async () => mocks.admin,
  isCardOwner: (card: { userId: string }, userId: string) => card.userId === userId,
}));
vi.mock("@/lib/serverDb", () => ({ getCardByIdOrSlugFromDb: mocks.getCard, createRsvpInDb: mocks.create }));
import { POST } from "@/app/api/cards/[id]/rsvps/route";

const params = { params: { id: "draft-card" } };
const request = (body: unknown) => new NextRequest("http://localhost/api/cards/draft-card/rsvps", { method: "POST", body: JSON.stringify(body) });

describe("Owner guest creation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user = { authenticated: true, userId: "owner" };
    mocks.admin = { authenticated: false };
    mocks.getCard.mockResolvedValue({ id: "draft-card", userId: "owner", status: "draft" });
    mocks.create.mockImplementation(async (body) => ({ ...body, id: "persisted-rsvp", createdAt: "2026-11-04T01:00:00Z" }));
  });

  it("accepts the owner's manual guest on a draft with optional phone and preserves declined zero guests", async () => {
    const result = await POST(request({ name: " Khách thử ", attending: false, guests: 0, note: " Bận " }), params);
    expect(result.status).toBe(201);
    expect(mocks.create).toHaveBeenCalledWith({ cardId: "draft-card", name: "Khách thử", phone: "", attending: false, guests: 0, note: "Bận" });
    expect((await result.json()).rsvp.id).toBe("persisted-rsvp");
  });

  it("denies anonymous and other-account creation before persistence", async () => {
    mocks.user = { authenticated: false, userId: "" };
    expect((await POST(request({ name: "Khách thử" }), params)).status).toBe(401);
    mocks.user = { authenticated: true, userId: "stranger" };
    expect((await POST(request({ name: "Khách thử" }), params)).status).toBe(403);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it.each([{ name: "A" }, { name: "Khách thử", guests: 11 }, { name: "Khách thử", guests: "2" }, { name: "Khách thử", phone: "123" }, { name: "Khách thử", checkedIn: true }, { name: "Khách thử", cardId: "foreign" }, { name: "Khách thử", userId: "foreign" }])("rejects invalid or privileged fields %j", async (body) => {
    expect((await POST(request(body), params)).status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("does not acknowledge a failed persistence call", async () => {
    mocks.create.mockResolvedValue(null);
    expect((await POST(request({ name: "Khách thử" }), params)).status).toBe(500);
  });
});
