import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => {
  class DatabaseUnavailableError extends Error {}
  return {
    DatabaseUnavailableError,
    configured: true,
    auth: vi.fn(), cards: vi.fn(), rsvps: vi.fn(), wishes: vi.fn(), activities: vi.fn(),
  };
});

vi.mock("@/lib/serverAuth", () => ({ verifyAdminAuth: mocks.auth }));
vi.mock("@/lib/serverDb", () => ({
  DatabaseUnavailableError: mocks.DatabaseUnavailableError,
  get isDbConfigured() { return mocks.configured; },
  getCardsFromDb: mocks.cards,
  getAllRsvpsFromDb: mocks.rsvps,
  getAllWishesFromDb: mocks.wishes,
}));
vi.mock("@/lib/activityService", () => ({
  getAggregatedActivities: mocks.activities, recordActivity: vi.fn(),
}));

import { GET as health } from "@/app/api/admin/health/route";
import { GET as stats } from "@/app/api/admin/stats/route";
import { GET as activities } from "@/app/api/admin/activities/route";

const request = (path: string) => new NextRequest(`http://localhost:3005/api/admin/${path}`);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.configured = true;
  mocks.auth.mockResolvedValue({ authenticated: true });
  mocks.cards.mockResolvedValue([]);
  mocks.rsvps.mockResolvedValue([]);
  mocks.wishes.mockResolvedValue([]);
  mocks.activities.mockResolvedValue([]);
  vi.stubEnv("SUPABASE_URL", "https://database.example.test");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-key");
  vi.stubEnv("SUPABASE_SECRET_KEY", "");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Admin database health probe", () => {
  it("accepts a successful empty database response and reports a measured connection", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json([]));
    vi.stubGlobal("fetch", fetchMock);
    const response = await health(request("health"));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toMatchObject({ success: true, status: "healthy", source: "database",
      services: { database: { connected: true, status: "live" } } });
    expect(data.services.database.latencyMs).toBeTypeOf("number");
    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });

  it.each([Response.json({ error: "access denied" }, { status: 401 }), Response.json({ unexpected: true })])(
    "returns degraded when the probe cannot verify a rows response", async (result) => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(result));
      const response = await health(request("health"));
      expect(response.status).toBe(503);
      expect(await response.json()).toMatchObject({ success: false, status: "degraded",
        services: { database: { connected: false, status: "unavailable" } } });
    }
  );

  it("reports unconfigured database honestly without making a request", async () => {
    mocks.configured = false;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await health(request("health"));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ success: false,
      services: { database: { configured: false, connected: false, status: "unconfigured", latencyMs: null } } });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("aborts a stalled response body after 2500 ms", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async (_url, options) => ({
      ok: true,
      json: () => new Promise((_resolve, reject) => {
        options.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      }),
    })));
    const pending = health(request("health"));
    await vi.advanceTimersByTimeAsync(2500);
    const response = await pending;
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      services: { database: { connected: false, status: "timeout", latencyMs: 2500 } },
    });
  });

  it("requires admin authorization before probing infrastructure", async () => {
    mocks.auth.mockResolvedValue({ authenticated: false });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect((await health(request("health"))).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("Admin live data contracts", () => {
  it("treats an empty live database as valid zero statistics", async () => {
    const response = await stats(request("stats"));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, status: "live", source: "database",
      stats: { totalCards: 0, totalRsvps: 0, totalWishes: 0 } });
    expect(mocks.cards).toHaveBeenCalledWith(undefined, undefined, { strict: true });
    expect(mocks.rsvps).toHaveBeenCalledWith({ strict: true });
    expect(mocks.wishes).toHaveBeenCalledWith({ strict: true });
  });

  it("does not substitute zero statistics for a failed database read", async () => {
    mocks.rsvps.mockRejectedValue(new mocks.DatabaseUnavailableError("private database diagnostics"));
    const response = await stats(request("stats"));
    expect(response.status).toBe(503);
    const data = await response.json();
    expect(data).toMatchObject({ success: false, status: "degraded", source: "unavailable" });
    expect(data.stats).toBeUndefined();
    expect(JSON.stringify(data)).not.toContain("private database diagnostics");
  });

  it("requires verified database reads for activity aggregation", async () => {
    const response = await activities(request("activities?limit=100"));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, status: "live",
      source: "database_and_runtime", activities: [] });
    expect(mocks.activities).toHaveBeenCalledWith(expect.objectContaining({ strictDatabase: true, limit: 100 }));
  });

  it("does not present runtime-only activities as a complete live database feed", async () => {
    mocks.activities.mockRejectedValue(new mocks.DatabaseUnavailableError("Database offline"));
    const response = await activities(request("activities"));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ success: false, status: "degraded", source: "unavailable" });
  });
});
