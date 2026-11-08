import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("SUPABASE_URL", "https://qa.invalid");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://qa.invalid");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "qa-fake-service");
  vi.stubGlobal("fetch", vi.fn());
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("Authoritative database reads", () => {
  it.each(["http", "malformed", "network"])("does not replace an unavailable database with cached ownership: %s", async (failure) => {
    if (failure === "network") vi.mocked(fetch).mockRejectedValue(new Error("QA offline"));
    else vi.mocked(fetch).mockImplementation(async () => new Response(failure === "http" ? "unavailable" : "{}", { status: failure === "http" ? 503 : 200 }));
    const db = await import("../serverDb");
    await expect(db.getCardByIdOrSlugFromDb("qa-card")).rejects.toBeInstanceOf(db.DatabaseUnavailableError);
    await expect(db.getCardsFromDb(undefined, undefined, { strict: true })).rejects.toBeInstanceOf(db.DatabaseUnavailableError);
    await expect(db.getAllRsvpsFromDb({ strict: true })).rejects.toBeInstanceOf(db.DatabaseUnavailableError);
  });

  it("distinguishes a confirmed empty result from unavailability", async () => {
    vi.mocked(fetch).mockImplementation(async () => new Response("[]"));
    const db = await import("../serverDb");
    expect(await db.getCardsFromDb(undefined, undefined, { strict: true })).toEqual([]);
    expect(await db.getCardByIdOrSlugFromDb("qa-card")).toBeNull();
  });

  it("never acknowledges a missing RSVP insert row or invents a server ID", async () => {
    vi.mocked(fetch).mockImplementation(async () => new Response("[]"));
    const db = await import("../serverDb");
    expect(await db.createRsvpInDb({ cardId: "qa-card", name: "QA Guest", attending: false, guests: 0 } as any)).toBeNull();
    expect(await db.createWishInDb({ cardId: "qa-card", name: "QA Guest", content: "QA wish" } as any)).toBeNull();
  });
});
