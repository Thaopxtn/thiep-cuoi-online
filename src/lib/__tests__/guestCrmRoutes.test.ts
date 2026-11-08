import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  user: { authenticated: true, userId: "owner-A" }, admin: { authenticated: false }, card: vi.fn(),
  list: vi.fn(), insert: vi.fn(), update: vi.fn(), remove: vi.fn(),
}));
vi.mock("@/lib/serverAuth", () => ({ verifyUserAuth: async () => mocks.user, verifyAdminAuth: async () => mocks.admin, isCardOwner: (card: { userId: string }, id: string) => card.userId === id }));
vi.mock("@/lib/serverDb", () => ({ getCardByIdOrSlugFromDb: mocks.card }));
vi.mock("@/lib/serverGuestRepository", () => ({ listGuestRecords: mocks.list, importGuestRecords: mocks.insert, updateGuestRecord: mocks.update, deleteGuestRecord: mocks.remove }));
import { GET, POST } from "@/app/api/cards/[id]/guests/route";
import { PATCH, DELETE } from "@/app/api/cards/[id]/guests/[guestId]/route";

const guest = { id: "legacy-1", cardId: "card-A", name: "Guest", phone: "0912345678", email: "guest@example.test", group: "vip", tableNumber: "Bàn 8", estimatedGuests: 0, status: "sent", notes: "Retain manual notes", createdAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-02T00:00:00Z" };
const params = { params: { id: "card-A", guestId: "legacy-1" } };
function request(method = "GET", body?: unknown) {
  return new NextRequest("http://localhost/api/cards/card-A/guests", { method, headers: { Authorization: "Bearer synthetic", "Content-Type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = { authenticated: true, userId: "owner-A" };
  mocks.admin = { authenticated: false };
  mocks.card.mockResolvedValue({ id: "card-A", userId: "owner-A", rsvps: [{ id: "rsvp-A" }] });
  mocks.list.mockResolvedValue([guest]);
  mocks.insert.mockResolvedValue(undefined);
  mocks.update.mockResolvedValue(guest);
  mocks.remove.mockResolvedValue(true);
});

describe("Private CRM ownership and mutation contracts", () => {
  it("blocks anonymous requests and owner B before any guest read/write", async () => {
    mocks.user = { authenticated: false, userId: "" };
    expect((await GET(request(), params)).status).toBe(401);
    mocks.user = { authenticated: true, userId: "owner-B" };
    expect((await GET(request(), params)).status).toBe(403);
    expect((await POST(request("POST", { guests: [guest] }), params)).status).toBe(403);
    expect((await PATCH(request("PATCH", { checkedIn: true }), params)).status).toBe(403);
    expect((await DELETE(request("DELETE"), params)).status).toBe(403);
    for (const fn of [mocks.list, mocks.insert, mocks.update, mocks.remove]) expect(fn).not.toHaveBeenCalled();
  });
  it("returns private CRM and RSVP data to their verified owner", async () => {
    const res = await GET(request(), params);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, guests: [guest], rsvps: [{ id: "rsvp-A" }] });
  });
  it("preserves stable legacy ids and all CRM metadata during owner-authorized import", async () => {
    const res = await POST(request("POST", { guests: [guest] }), params);
    expect(res.status).toBe(200);
    expect(mocks.insert).toHaveBeenCalledWith("card-A", [{ ...guest, createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-02T00:00:00.000Z" }]);
  });
  it("rejects cross-card imports or foreign RSVP links", async () => {
    expect((await POST(request("POST", { guests: [{ ...guest, cardId: "card-B" }] }), params)).status).toBe(400);
    expect((await POST(request("POST", { guests: [{ ...guest, rsvpId: "rsvp-B" }] }), params)).status).toBe(400);
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it.each([{ name: "" }, { group: "forged" }, { estimatedGuests: -1 }, { status: "forged" }, { checkedIn: "yes" }])("validates imported guest metadata %j", async (bad) => {
    expect((await POST(request("POST", { guests: [{ ...guest, ...bad }] }), params)).status).toBe(400);
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("separates attendance invitation status and sets/clears check-in timestamp on server", async () => {
    expect((await PATCH(request("PATCH", { checkedIn: true }), params)).status).toBe(200);
    expect(mocks.update.mock.calls[0][2]).toEqual({ checkedIn: true, checkedInAt: expect.any(String) });
    expect((await PATCH(request("PATCH", { checkedIn: false, estimatedGuests: 0, notes: "", tableNumber: "" }), params)).status).toBe(200);
    expect(mocks.update.mock.calls[1][2]).toEqual({ checkedIn: false, checkedInAt: null, estimatedGuests: 0, notes: "", tableNumber: "" });
  });
  it.each([{ cardId: "card-B" }, { deletedAt: "forged" }, { checkedInAt: "forged" }, { source: "rsvp" }, {}])("rejects protected update fields %j", async (body) => {
    expect((await PATCH(request("PATCH", body), params)).status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("does not acknowledge storage failures or missing records as success", async () => {
    mocks.list.mockRejectedValue(new Error("mock DB unavailable"));
    expect((await GET(request(), params)).status).toBe(503);
    mocks.insert.mockRejectedValue(new Error("mock DB unavailable"));
    expect((await POST(request("POST", { guests: [guest] }), params)).status).toBe(503);
    mocks.update.mockResolvedValue(null);
    expect((await PATCH(request("PATCH", { notes: "Changed" }), params)).status).toBe(404);
    mocks.remove.mockResolvedValue(false);
    expect((await DELETE(request("DELETE"), params)).status).toBe(404);
  });
});
