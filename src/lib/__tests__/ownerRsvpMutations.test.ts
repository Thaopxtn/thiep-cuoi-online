import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  user: { authenticated: true, userId: "owner" },
  admin: { authenticated: false },
  getCard: vi.fn(), update: vi.fn(), remove: vi.fn(),
}));
vi.mock("@/lib/serverAuth", () => ({
  verifyUserAuth: async () => mocks.user,
  verifyAdminAuth: async () => mocks.admin,
  isCardOwner: (card: { userId: string }, userId: string) => card.userId === userId,
}));
vi.mock("@/lib/serverDb", () => ({
  getCardByIdOrSlugFromDb: mocks.getCard,
  updateCardRsvpInDb: mocks.update,
  deleteCardRsvpFromDb: mocks.remove,
}));
import { PATCH, DELETE } from "@/app/api/cards/[id]/rsvps/[rsvpId]/route";

const rsvp = { id: "rsvp-1", cardId: "card-1", attending: true, guests: 2 };
const params = { params: { id: "card-1", rsvpId: "rsvp-1" } };
const request = (body: unknown, method = "PATCH") => new NextRequest("http://localhost/api/cards/card-1/rsvps/rsvp-1", {
  method, headers: { Authorization: "Bearer owner-token", "Content-Type": "application/json" },
  ...(method === "PATCH" ? { body: JSON.stringify(body) } : {}),
});

describe("Owner RSVP mutation contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user = { authenticated: true, userId: "owner" };
    mocks.admin = { authenticated: false };
    mocks.getCard.mockResolvedValue({ id: "card-1", userId: "owner", rsvps: [rsvp] });
    mocks.update.mockImplementation(async (_cardId, _id, updates) => ({ ...rsvp, ...updates }));
    mocks.remove.mockResolvedValue(true);
  });

  it("requires authentication and rejects another card's owner before writing", async () => {
    mocks.user = { authenticated: false, userId: "" };
    expect((await PATCH(request({ checkedIn: true }), params)).status).toBe(401);
    mocks.user = { authenticated: true, userId: "stranger" };
    expect((await DELETE(request(undefined, "DELETE"), params)).status).toBe(403);
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it("rejects an RSVP id from another card", async () => {
    const result = await PATCH(request({ checkedIn: true }), { params: { ...params.params, rsvpId: "foreign-rsvp" } });
    expect(result.status).toBe(404);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("persists attendance with zero guests and returns the persisted row", async () => {
    const result = await PATCH(request({ attending: false, guests: 0 }), params);
    expect(result.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith("card-1", "rsvp-1", { attending: false, guests: 0 }, "owner-token");
    expect((await result.json()).rsvp.guests).toBe(0);
  });

  it("timestamps check-in on the server and supports undo", async () => {
    await PATCH(request({ checkedIn: true, tableNumber: "Bàn 4" }), params);
    expect(mocks.update.mock.calls[0][2]).toMatchObject({ checkedIn: true, checkedInAt: expect.any(String), tableNumber: "Bàn 4" });
    await PATCH(request({ checkedIn: false }), params);
    expect(mocks.update.mock.calls[1][2]).toEqual({ checkedIn: false, checkedInAt: undefined });
  });

  it.each([{ userId: "stranger" }, { checkedInAt: "forged" }, { guests: -1 }, { checkedIn: "yes" }, {}])("rejects unsafe or malformed updates %j", async (body) => {
    expect((await PATCH(request(body), params)).status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("surfaces persistence failures and only acknowledges a successful delete", async () => {
    mocks.update.mockResolvedValue(null);
    expect((await PATCH(request({ checkedIn: true }), params)).status).toBe(500);
    expect((await DELETE(request(undefined, "DELETE"), params)).status).toBe(200);
    expect(mocks.remove).toHaveBeenCalledWith("card-1", "rsvp-1", "owner-token");
    mocks.remove.mockResolvedValue(false);
    expect((await DELETE(request(undefined, "DELETE"), params)).status).toBe(500);
  });
});
