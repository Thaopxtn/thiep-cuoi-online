import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WeddingCard } from "@/data/initialCards";

const mocks = vi.hoisted(() => ({ api: vi.fn(), fetchGuests: vi.fn() }));
vi.mock("@/lib/apiClient", () => ({ apiFetch: mocks.api }));
vi.mock("@/lib/guestManagementService", async (original) => ({
  ...await original<typeof import("../guestManagementService")>(), fetchGuestsForCard: mocks.fetchGuests,
}));
import { importBulkInvitationGuests, importLegacyBulkGuests, prepareBulkInvitationGuests, prepareLegacyBulkGuests, readLegacyBulkGuests } from "../bulkInvitationService";

const card = { id: "bulk-card", slug: "bulk-slug" } as WeddingCard;
const ack = () => new Response(JSON.stringify({ success: true, guests: [], rsvps: [] }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.api.mockReset().mockResolvedValue(ack());
  mocks.fetchGuests.mockReset().mockResolvedValue([]);
});
afterEach(() => vi.unstubAllGlobals());

describe("Bulk invitation CRM import", () => {
  it("reads the original slug storage without changing or deleting it", () => {
    const original = JSON.stringify([{ id: "old-1", name: "Khách cũ", group: "groom", isSent: true }]);
    const storage = { getItem: vi.fn().mockReturnValue(original), setItem: vi.fn(), removeItem: vi.fn() };
    expect(readLegacyBulkGuests(card.slug, storage)).toEqual(JSON.parse(original));
    expect(storage.getItem).toHaveBeenCalledWith("zenlove_guests_bulk-slug");
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
  });

  it("preserves legacy identity and all CRM metadata including zero, false and empty strings", async () => {
    const input = Object.freeze({ id: "old-1", cardId: card.id, name: "Khách cũ", group: "bride", status: "viewed", isSent: true,
      email: "old@example.test", phone: "", tableNumber: "Bàn VIP", estimatedGuests: 0, notes: "Ghi chú gốc", checkedIn: false,
      rsvpId: "response-1", createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-02T00:00:00.000Z" });
    const [record] = await prepareLegacyBulkGuests(card, Object.freeze([input]));
    expect(record).toEqual({ id: "old-1", cardId: card.id, name: "Khách cũ", group: "bride_side", status: "viewed",
      email: input.email, phone: "", tableNumber: input.tableNumber, estimatedGuests: 0, notes: input.notes, checkedIn: false,
      rsvpId: input.rsvpId, createdAt: input.createdAt, updatedAt: input.updatedAt });
    expect(input.group).toBe("bride");
  });

  it("retains the original check-in timestamp when importing a checked-in guest", async () => {
    const [record] = await prepareLegacyBulkGuests(card, [{ id: "checked", name: "Đã đến", group: "vip", checkedIn: true,
      checkedInAt: "2026-11-08T10:30:00+07:00", estimatedGuests: 0, notes: "", tableNumber: "" }]);
    expect(record).toMatchObject({ checkedIn: true, checkedInAt: "2026-11-08T03:30:00.000Z", estimatedGuests: 0, notes: "", tableNumber: "" });
  });

  it("uses deterministic fallback ids across retries and separates identical names", async () => {
    const input = [{ name: "Cùng tên" }, { name: "Cùng tên" }, { id: "id with spaces", name: "Khách ba" }];
    const first = await prepareLegacyBulkGuests(card, input);
    const retry = await prepareLegacyBulkGuests(card, input);
    expect(first.map(({ id }) => id)).toEqual(retry.map(({ id }) => id));
    expect(new Set(first.map(({ id }) => id)).size).toBe(3);
    expect(first.every(({ id }) => /^[a-zA-Z0-9_:-]{1,200}$/.test(id))).toBe(true);
  });

  it("does not import deleted rows or silently mix another card's guest data", async () => {
    expect(await prepareLegacyBulkGuests(card, [{ id: "gone", name: "Đã xóa", deletedAt: "2026-11-08" }])).toEqual([]);
    await expect(importLegacyBulkGuests(card, [{ id: "other", cardId: "another-card", name: "Wrong card" }])).rejects.toThrow("không hợp lệ");
    await expect(importLegacyBulkGuests(card, [{ id: "duplicate", name: "One" }, { id: "duplicate", name: "Two" }])).rejects.toThrow("bị trùng");
    expect(mocks.api).not.toHaveBeenCalled();
  });

  it("preserves the modal's email/group formats and CRM table metadata", async () => {
    const text = "Anh An - 0912345678 - an@example.test\nChị Bình | bride | 0987654321\nAnh Cường, colleagues, cuong@example.test, Bàn 5";
    const guests = await prepareBulkInvitationGuests(card, text, "vip");
    expect(guests[0]).toMatchObject({ name: "Anh An", phone: "0912345678", email: "an@example.test", group: "vip" });
    expect(guests[1]).toMatchObject({ name: "Chị Bình", phone: "0987654321", group: "bride_side" });
    expect(guests[2]).toMatchObject({ name: "Anh Cường", email: "cuong@example.test", group: "colleagues", tableNumber: "Bàn 5" });
    expect(guests.map(({ id }) => id)).toEqual((await prepareBulkInvitationGuests(card, text, "vip")).map(({ id }) => id));
  });

  it("retains batch ids after a committed request loses its response", async () => {
    mocks.api.mockRejectedValueOnce(new Error("Lost response")).mockImplementation(() => Promise.resolve(ack()));
    await expect(importBulkInvitationGuests(card, "Anh An | groom | an@example.test", "friends")).rejects.toThrow("Lost response");
    const first = JSON.parse(mocks.api.mock.calls[0][1].body).guests;
    await importBulkInvitationGuests(card, "Anh An | groom | an@example.test", "friends");
    expect(JSON.parse(mocks.api.mock.calls[1][1].body).guests.map((guest: { id: string }) => guest.id)).toEqual(first.map((guest: { id: string }) => guest.id));
  });

  it("waits for an acknowledged import before reading or returning the confirmed CRM list", async () => {
    let acknowledge!: (response: Response) => void;
    mocks.api.mockImplementation(() => new Promise<Response>((resolve) => { acknowledge = resolve; }));
    const confirmed = [{ id: "legacy", name: "Confirmed CRM name", notes: "Server metadata" }];
    mocks.fetchGuests.mockResolvedValue(confirmed);
    const pending = importLegacyBulkGuests(card, [{ id: "legacy", name: "Old name" }]);
    await vi.waitFor(() => expect(mocks.api).toHaveBeenCalledTimes(1));
    expect(mocks.fetchGuests).not.toHaveBeenCalled();
    acknowledge(ack());
    expect(await pending).toEqual(confirmed);
  });

  it("rejects failed acknowledgements without showing a new list or deleting the original", async () => {
    mocks.api.mockResolvedValue(new Response(JSON.stringify({ success: false, message: "Session expired" }), { status: 401 }));
    await expect(importLegacyBulkGuests(card, [{ id: "legacy", name: "Kept" }])).rejects.toThrow("Session expired");
    expect(mocks.fetchGuests).not.toHaveBeenCalled();
    mocks.api.mockResolvedValue(new Response(JSON.stringify({ success: true })));
    await expect(importLegacyBulkGuests(card, [{ id: "legacy", name: "Kept" }])).rejects.toThrow("Không thể nhập");
  });

  it("splits more than 200 guests into server-sized batches without dropping ids", async () => {
    const input = Array.from({ length: 201 }, (_, index) => ({ id: `old-${index}`, name: `Guest ${index}`, group: "friends" }));
    mocks.api.mockImplementation(() => Promise.resolve(ack()));
    await importLegacyBulkGuests(card, input);
    expect(mocks.api).toHaveBeenCalledTimes(2);
    expect(JSON.parse(mocks.api.mock.calls[0][1].body).guests).toHaveLength(200);
    expect(JSON.parse(mocks.api.mock.calls[1][1].body).guests[0].id).toBe("old-200");
    expect(mocks.fetchGuests).toHaveBeenCalledWith(card);
  });
});
