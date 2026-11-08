import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteGuestRecord, importGuestRecords, listGuestRecords, updateGuestRecord } from "../serverGuestRepository";
import type { GuestItem } from "../guestManagementService";
const guest = { id: "legacy-1", cardId: "card-A", name: "Private guest", group: "vip", estimatedGuests: 0, status: "sent" } as GuestItem;
const json = (rows: unknown, status = 200) => new Response(JSON.stringify(rows), { status });
beforeEach(() => {
  vi.stubEnv("SUPABASE_URL", "https://mock.invalid");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "mock-service");
  vi.stubGlobal("fetch", vi.fn());
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("CRM durable repository", () => {
  it("uses insert-ignore for stable composite ids without overwriting existing guests/tombstones", async () => {
    vi.mocked(fetch).mockResolvedValue(json([]));
    await importGuestRecords("card-A", [guest]);
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain("cardId=eq.card-A&on_conflict=cardId,id");
    expect(new Headers(init!.headers).get("Prefer")).toBe("resolution=ignore-duplicates,return=representation");
    expect(JSON.parse(String(init!.body))).toEqual([guest]);
  });
  it("always scopes updates to card and id and requires a confirmed row", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(json([])).mockResolvedValueOnce(json([{ ...guest, notes: "" }]));
    expect(await updateGuestRecord("card-A", "legacy-1", { notes: "" })).toBeNull();
    expect(await updateGuestRecord("card-A", "legacy-1", { notes: "" })).toMatchObject({ notes: "" });
    expect(String(vi.mocked(fetch).mock.calls[1][0])).toContain("cardId=eq.card-A&id=eq.legacy-1&deletedAt=is.null");
  });
  it("keeps tombstones and treats a repeated deletion as idempotent", async () => {
    const tombstone = { ...guest, deletedAt: "2026-11-04T00:00:00Z" };
    vi.mocked(fetch).mockResolvedValueOnce(json([tombstone])).mockResolvedValueOnce(json([])).mockResolvedValueOnce(json([tombstone]));
    expect(await deleteGuestRecord("card-A", "legacy-1")).toBe(true);
    expect(await deleteGuestRecord("card-A", "legacy-1")).toBe(true);
    expect(vi.mocked(fetch).mock.calls[0][1]!.method).toBe("PATCH");
  });
  it("surfaces DB failure or malformed cross-card rows instead of a successful empty list", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(json({ error: "unavailable" }, 503)).mockResolvedValueOnce(json([{ ...guest, cardId: "card-B" }]));
    await expect(listGuestRecords("card-A")).rejects.toThrow();
    await expect(listGuestRecords("card-A")).rejects.toThrow();
  });
});
