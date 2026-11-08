import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WeddingCard, WeddingRsvp } from "@/data/initialCards";
import { checkInGuestAsync, deleteGuestAsync, exportGuestsToCsv, fetchGuestsForCard, getGuestsByCardId, importGuestsAsync, mergeGuestsAndRsvps, saveGuestAsync, type GuestItem } from "../guestManagementService";

const mocks = vi.hoisted(() => ({ api: vi.fn(), user: { id: "owner" } as { id: string } | null }));
vi.mock("../apiClient", () => ({
  apiFetch: mocks.api,
  getStoredUser: () => mocks.user,
  getAuthAccessToken: () => mocks.user ? "mock-token" : undefined,
  getAuthRefreshToken: () => undefined,
}));
const guest: GuestItem = { id: "legacy-1", cardId: "card-1", name: "Manual Guest", phone: "0912345678", email: "guest@example.test", group: "vip", tableNumber: "Bàn VIP", estimatedGuests: 2, status: "sent", notes: "Manual private note", createdAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-02T00:00:00Z" };
const response: WeddingRsvp = { id: "server-rsvp-1", cardId: "card-1", name: "Response Guest", phone: "+84 912 345 678", attending: true, guests: 0, note: "Response note", checkedIn: false, createdAt: "2026-11-01T00:00:00Z" };
const card = { id: "card-1", rsvps: [response] } as WeddingCard;
const json = (guests: GuestItem[], rsvps = [response]) => ({ ok: true, json: async () => structuredClone({ success: true, guests, rsvps }) }) as Response;
let store: Map<string, string>;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = { id: "owner" };
  store = new Map();
  vi.stubGlobal("window", {});
  vi.stubGlobal("localStorage", { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value) });
});
afterEach(() => vi.unstubAllGlobals());

describe("CRM/RSVP reconciliation", () => {
  it("exports confirmed RSVP seats including zero without changing the manual estimate", () => {
    const csv = exportGuestsToCsv([{ ...guest, estimatedGuests: 2, responseGuests: 0 }]);
    expect(csv).toContain(',"0",');
    expect(guest.estimatedGuests).toBe(2);
  });
  it("merges a unique normalized phone without losing manual fields or confusing RSVP with check-in", () => {
    const merged = mergeGuestsAndRsvps([guest], [response]);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ ...guest, source: "crm", rsvpId: response.id, responseGuests: 0, responseStatus: "confirmed", checkedIn: false });
    expect(guest).not.toHaveProperty("rsvpId");
  });
  it("keeps guests with ambiguous shared phones and names separate", () => {
    expect(mergeGuestsAndRsvps([guest, { ...guest, id: "manual-2" }], [response])).toHaveLength(3);
    expect(mergeGuestsAndRsvps([{ ...guest, phone: "" }], [{ ...response, phone: "", name: guest.name }])).toHaveLength(2);
  });
  it("honors an explicit link and suppresses deleted CRM entries without deleting response history", () => {
    const tombstone = { ...guest, phone: "", rsvpId: response.id, deletedAt: "2026-11-04T00:00:00Z" };
    expect(mergeGuestsAndRsvps([tombstone], [response])).toEqual([]);
    expect(response.id).toBe("server-rsvp-1");
  });
});

describe("Acknowledged guest sync", () => {
  it("migrates legacy ids once for the owner and preserves every CRM field", async () => {
    store.set("zenlove_guest_crm_card-1", JSON.stringify([guest]));
    mocks.api.mockResolvedValue(json([guest]));
    expect((await fetchGuestsForCard(card))[0]).toMatchObject({ id: guest.id, group: "vip", tableNumber: "Bàn VIP", notes: guest.notes });
    expect(mocks.api.mock.calls[0][0]).toBe("/api/cards/card-1/guests");
    expect(JSON.parse(mocks.api.mock.calls[0][1].body).guests).toEqual([guest]);
    await fetchGuestsForCard(card);
    expect(mocks.api.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(1);
  });
  it("retains legacy data on failed migration, expired sessions, or network failure", async () => {
    const original = JSON.stringify([guest]);
    store.set("zenlove_guest_crm_card-1", original);
    mocks.api.mockResolvedValue(new Response(JSON.stringify({ success: false, message: "Session expired" }), { status: 401 }));
    await expect(fetchGuestsForCard(card)).rejects.toThrow("Session expired");
    expect(store.get("zenlove_guest_crm_card-1")).toBe(original);
    mocks.api.mockRejectedValue(new Error("offline"));
    await expect(saveGuestAsync(card, { ...guest, name: "Unsaved" }, guest)).rejects.toThrow("offline");
    expect(getGuestsByCardId(card.id)[0].name).toBe(guest.name);
  });
  it("does not alter the cache while a write is pending and uses the confirmed row", async () => {
    store.set("zenlove_guest_crm_card-1", JSON.stringify([guest]));
    let acknowledge!: (value: Response) => void;
    mocks.api.mockImplementation(() => new Promise<Response>((resolve) => { acknowledge = resolve; }));
    const pending = saveGuestAsync(card, { ...guest, notes: "", tableNumber: "", estimatedGuests: 0 }, guest);
    expect(getGuestsByCardId(card.id)[0].notes).toBe(guest.notes);
    const saved = { ...guest, notes: "", tableNumber: "", estimatedGuests: 0 };
    acknowledge(json([saved], []));
    expect((await pending)[0]).toMatchObject(saved);
    const sent = JSON.parse(mocks.api.mock.calls[0][1].body);
    expect(sent).not.toHaveProperty("id");
    expect(sent).not.toHaveProperty("source");
  });
  it("converts an RSVP view to a linked CRM row to retain rich edits", async () => {
    const derived = mergeGuestsAndRsvps([], [response])[0];
    mocks.api.mockResolvedValue(json([{ ...guest, id: derived.id, rsvpId: response.id }]));
    await saveGuestAsync(card, { ...derived, group: "vip", notes: "Keep this" }, derived);
    const request = mocks.api.mock.calls[0];
    expect(request[1].method).toBe("POST");
    expect(JSON.parse(request[1].body).guests[0]).toMatchObject({ id: derived.id, rsvpId: response.id, group: "vip", notes: "Keep this" });
  });
  it("does not replay check-in when editing a checked-in guest's metadata", async () => {
    const arrived = { ...guest, checkedIn: true, checkedInAt: "2026-11-08T12:00:00Z", source: "crm" as const };
    mocks.api.mockResolvedValue(json([{ ...arrived, status: "sent" }], []));
    const saved = await saveGuestAsync(card, { ...arrived, status: "sent", tableNumber: "Bàn 02" }, arrived);
    const payload = JSON.parse(mocks.api.mock.calls[0][1].body);
    expect(payload).not.toHaveProperty("checkedIn");
    expect(payload).not.toHaveProperty("checkedInAt");
    expect(payload).toEqual({ tableNumber: "Bàn 02" });
    expect(saved[0].checkedInAt).toBe(arrived.checkedInAt);
  });
  it("updates only invitation status without overwriting another device's metadata", async () => {
    const latest = { ...guest, status: "viewed" as const, notes: "Changed on another device", tableNumber: "Bàn 12" };
    mocks.api.mockResolvedValue(json([latest], []));
    const saved = await saveGuestAsync(card, { ...guest, status: "viewed" }, guest);
    expect(JSON.parse(mocks.api.mock.calls[0][1].body)).toEqual({ status: "viewed" });
    expect(saved[0]).toMatchObject({ notes: latest.notes, tableNumber: latest.tableNumber });
  });
  it("routes check-in to the source of truth and waits for failure before changing state", async () => {
    const merged = mergeGuestsAndRsvps([guest], [response])[0];
    mocks.api.mockResolvedValueOnce(new Response(JSON.stringify({ success: false, message: "DB unavailable" }), { status: 503 }));
    await expect(checkInGuestAsync(card, merged, true)).rejects.toThrow("DB unavailable");
    expect(mocks.api.mock.calls[0][0]).toBe("/api/cards/card-1/rsvps/server-rsvp-1");
    expect(JSON.parse(mocks.api.mock.calls[0][1].body)).toEqual({ checkedIn: true });
    mocks.api.mockResolvedValueOnce(json([{ ...guest, checkedIn: true }], []));
    await checkInGuestAsync({ ...card, rsvps: [] }, { ...guest, source: "crm" }, true);
    expect(mocks.api.mock.calls[1][0]).toBe("/api/cards/card-1/guests/legacy-1");
  });
  it("reuses batch ids when a bulk-import response was lost", async () => {
    mocks.api.mockRejectedValueOnce(new Error("lost response")).mockResolvedValue(json([], []));
    await expect(importGuestsAsync(card, "Guest - 0912345678", "friends")).rejects.toThrow("lost response");
    const firstId = JSON.parse(mocks.api.mock.calls[0][1].body).guests[0].id;
    await importGuestsAsync(card, "Guest - 0912345678", "friends");
    expect(JSON.parse(mocks.api.mock.calls[1][1].body).guests[0].id).toBe(firstId);
  });
  it("does not resurrect a deleted CRM row or erase its RSVP history", async () => {
    mocks.api.mockResolvedValue(json([{ ...guest, deletedAt: "2026-11-04T00:00:00Z" }]));
    expect(await deleteGuestAsync(card, { ...guest, source: "crm" })).toEqual([]);
    expect(mocks.api.mock.calls[0][1].method).toBe("DELETE");
    expect(mocks.api).toHaveBeenCalledTimes(1);
  });
});
