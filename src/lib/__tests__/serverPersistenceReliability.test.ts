import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const local = vi.hoisted(() => ({ contents: "[]", mtime: 0, failWrites: false, writes: 0 }));
vi.mock("fs", () => ({
  default: {
    existsSync: () => true,
    statSync: () => ({ mtimeMs: local.mtime }),
    readFileSync: () => local.contents,
    mkdirSync: vi.fn(),
    writeFileSync: (_path: string, contents: string) => {
      local.writes += 1;
      if (local.failWrites) throw new Error("mock EROFS");
      local.contents = contents;
      local.mtime += 1;
    },
  },
}));

const originalCard = {
  id: "card-reliability",
  slug: "reliability",
  name: "Original design",
  groom: { name: "Groom", userId: "owner", isVip: false, plan: "free", showWatermark: true },
  bride: { name: "Bride" },
  rsvps: [{ id: "rsvp-1", cardId: "card-reliability", name: "Guest", phone: "0912345678", attending: true, guests: 2, checkedIn: true, checkedInAt: "2026-11-01T00:00:00Z" }],
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("SUPABASE_URL", "https://mock.invalid");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://mock.invalid");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "mock-service");
  local.contents = JSON.stringify([originalCard]);
  local.mtime += 1;
  local.failWrites = false;
  local.writes = 0;
  vi.stubGlobal("fetch", vi.fn());
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Durable card writes", () => {
  it.each(["http", "network", "empty", "wrong-row"])("does not report or cache a failed cloud write: %s", async (failure) => {
    const fetch = vi.mocked(global.fetch);
    if (failure === "network") fetch.mockRejectedValue(new Error("mock unavailable"));
    else fetch.mockResolvedValue(json(failure === "http" ? { error: "unavailable" } : failure === "empty" ? [] : [{ id: "another-card" }], failure === "http" ? 500 : 200));
    const { upsertCardToDb } = await import("../serverDb");
    expect(await upsertCardToDb({ ...originalCard, name: "Changed design" } as any)).toBeNull();
    expect(local.writes).toBe(0);
    expect(JSON.parse(local.contents)[0].name).toBe("Original design");
  });

  it("returns the confirmed database row without writing an ephemeral production cache", async () => {
    vi.mocked(global.fetch).mockResolvedValue(json([{ ...originalCard, name: "Cloud-confirmed design" }]));
    const { upsertCardToDb } = await import("../serverDb");
    expect((await upsertCardToDb(originalCard as any))?.name).toBe("Cloud-confirmed design");
    expect(local.writes).toBe(0);
  });

  it("never mirrors configured QA/cloud writes into the customer's local file in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const before = local.contents;
    const fetch = vi.mocked(global.fetch);
    fetch.mockResolvedValueOnce(json([originalCard]));
    const { upsertCardToDb, saveCardContentToDb, activateCardVipInDb } = await import("../serverDb");
    expect(await upsertCardToDb(originalCard as any, undefined, { createOnly: true })).toBeTruthy();
    fetch.mockResolvedValueOnce(json({ ...originalCard, name: "QA changed" }));
    expect(await saveCardContentToDb(originalCard.id, { name: "QA changed" })).toBeTruthy();
    fetch.mockResolvedValueOnce(json({ ...originalCard, groom: { ...originalCard.groom, isVip: true, plan: "vip", showWatermark: false } }));
    expect((await activateCardVipInDb(originalCard.id)).success).toBe(true);
    expect(local.writes).toBe(0);
    expect(local.contents).toBe(before);
  });

  it("does not publish an offline cache mutation if the file write fails", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    local.failWrites = true;
    const { getCardByIdOrSlugFromDb, upsertCardToDb } = await import("../serverDb");
    expect(await upsertCardToDb({ ...originalCard, name: "Unsaved design" } as any)).toBeNull();
    expect((await getCardByIdOrSlugFromDb(originalCard.id))?.name).toBe("Original design");
  });

  it("fails closed when production has no database", async () => {
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const { upsertCardToDb } = await import("../serverDb");
    expect(await upsertCardToDb(originalCard as any)).toBeNull();
    expect(local.writes).toBe(0);
  });

  it("uses an insert-only operation so concurrent creates cannot replace an existing owner", async () => {
    vi.mocked(global.fetch).mockResolvedValue(json({ error: "duplicate key" }, 409));
    const { upsertCardToDb } = await import("../serverDb");
    expect(await upsertCardToDb(originalCard as any, undefined, { createOnly: true })).toBeNull();
    const init = vi.mocked(global.fetch).mock.calls[0][1]!;
    expect(new Headers(init.headers).get("Prefer")).toBe("return=representation");
    expect(local.writes).toBe(0);
  });

  it("refuses insert-only offline collisions by either id or slug", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const { upsertCardToDb } = await import("../serverDb");
    expect(await upsertCardToDb({ ...originalCard, name: "Attacker" } as any, undefined, { createOnly: true })).toBeNull();
    expect(await upsertCardToDb({ ...originalCard, id: "new-id" } as any, undefined, { createOnly: true })).toBeNull();
    expect(local.writes).toBe(0);
  });
});

describe("Confirmed VIP activation", () => {
  it.each(["http", "network", "empty", "unchanged"])("keeps VIP locked on an unconfirmed update: %s", async (failure) => {
    const fetch = vi.mocked(global.fetch);
    if (failure === "network") fetch.mockRejectedValueOnce(new Error("mock unavailable"));
    else fetch.mockResolvedValueOnce(json(failure === "http" ? { error: "unavailable" } : failure === "empty" ? [] : [originalCard], failure === "http" ? 500 : 200));
    const { activateCardVipInDb } = await import("../serverDb");
    expect(await activateCardVipInDb(originalCard.slug)).toEqual({ success: false });
    expect(local.writes).toBe(0);
    expect(JSON.parse(local.contents)[0].groom.isVip).toBe(false);
  });

  it("persists VIP in supported JSONB metadata and returns the confirmed row", async () => {
    const saved = { ...originalCard, isVip: false, groom: { ...originalCard.groom, isVip: true, plan: "vip", showWatermark: false } };
    vi.mocked(global.fetch).mockResolvedValueOnce(json(saved));
    const { activateCardVipInDb } = await import("../serverDb");
    const result = await activateCardVipInDb(originalCard.slug);
    expect(result.success).toBe(true);
    expect(result.card).toMatchObject({ isVip: true, plan: "vip", showWatermark: false });
    const [url, init] = vi.mocked(global.fetch).mock.calls[0];
    expect(String(url)).toContain("/rpc/set_card_vip");
    expect(init!.method).toBe("POST");
    expect(JSON.parse(String(init!.body))).toEqual({ card_key: originalCard.slug, enabled: true });
    expect(local.writes).toBe(0);
  });
});

describe("Card-scoped RSVP persistence", () => {
  it("updates the RSVP table, preserves zero/false, and clears a removed check-in timestamp", async () => {
    const saved = { ...originalCard.rsvps[0], guests: 0, attending: false, checkedIn: false, checkedInAt: null };
    vi.mocked(global.fetch).mockResolvedValue(json([saved]));
    const { updateCardRsvpInDb } = await import("../serverDb");
    expect(await updateCardRsvpInDb(originalCard.id, "rsvp-1", { guests: 0, attending: false, checkedIn: false, id: "forged", cardId: "forged" })).toEqual(saved);
    const [url, init] = vi.mocked(global.fetch).mock.calls[0];
    expect(String(url)).toContain("id=eq.rsvp-1&cardId=eq.card-reliability");
    expect(JSON.parse(String(init!.body))).toEqual({ attending: false, guests: 0, checkedIn: false, checkedInAt: null });
  });

  it("rejects a missing or mismatched RSVP instead of pretending an update succeeded", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(json([])).mockResolvedValueOnce(json([{ ...originalCard.rsvps[0], cardId: "other-card" }]));
    const { updateCardRsvpInDb } = await import("../serverDb");
    expect(await updateCardRsvpInDb(originalCard.id, "rsvp-1", { checkedIn: true })).toBeNull();
    expect(await updateCardRsvpInDb(originalCard.id, "rsvp-1", { checkedIn: true })).toBeNull();
  });

  it("checks both the card and RSVP on delete and confirms a row was deleted", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(json([])).mockResolvedValueOnce(json([originalCard.rsvps[0]]));
    const { deleteCardRsvpFromDb } = await import("../serverDb");
    expect(await deleteCardRsvpFromDb(originalCard.id, "rsvp-1")).toBe(false);
    expect(await deleteCardRsvpFromDb(originalCard.id, "rsvp-1")).toBe(true);
    expect(String(vi.mocked(global.fetch).mock.calls[1][0])).toContain("id=eq.rsvp-1&cardId=eq.card-reliability");
  });

  it("persists local RSVP updates and deletion only after successful offline writes", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const { updateCardRsvpInDb, deleteCardRsvpFromDb } = await import("../serverDb");
    local.failWrites = true;
    expect(await updateCardRsvpInDb(originalCard.id, "rsvp-1", { checkedIn: false })).toBeNull();
    expect(await deleteCardRsvpFromDb(originalCard.id, "rsvp-1")).toBe(false);
    expect(JSON.parse(local.contents)[0].rsvps[0].checkedIn).toBe(true);
    local.failWrites = false;
    expect((await updateCardRsvpInDb(originalCard.id, "rsvp-1", { checkedIn: false, guests: 0 }))?.checkedInAt).toBeUndefined();
    expect(await deleteCardRsvpFromDb(originalCard.id, "rsvp-1")).toBe(true);
    expect(JSON.parse(local.contents)[0].rsvps).toEqual([]);
  });
});
