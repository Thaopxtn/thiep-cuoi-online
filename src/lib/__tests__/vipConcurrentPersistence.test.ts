import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("fs", () => ({ default: { existsSync: () => false } }));
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const original = { id: "concurrent-card", slug: "concurrent-card", name: "Original", user_id: "owner",
  groom: { userId: "owner", name: "Original groom", isVip: false, plan: "free", showWatermark: true },
  bride: { name: "Bride" }, rsvps: [], wishes: [] };

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("SUPABASE_URL", "https://concurrency.example.test");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-only");
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("VIP and editor writes share the current database row", () => {
  async function repository() {
    let row: any = clone(original);
    let beforeBillingWrite: (() => Promise<void>) | undefined;
    const fetchMock = vi.fn(async (url: string, init: RequestInit = {}) => {
      const body = init.body ? JSON.parse(String(init.body)) : undefined;
      if (!init.method || init.method === "GET") return Response.json([clone(row)]);
      if (url.endsWith("/rpc/save_card_content")) {
        const payload = body.content;
        const groom = { ...row.groom, ...payload.groom };
        for (const key of ["userId", "isVip", "plan", "vipUnlockedAt", "showWatermark"]) {
          if (key in row.groom) groom[key] = row.groom[key]; else delete groom[key];
        }
        row = { ...row, ...payload, groom, id: row.id, user_id: row.user_id, views: row.views };
        return Response.json(clone(row));
      }
      if (url.endsWith("/rpc/set_card_vip")) {
        await beforeBillingWrite?.();
        row.groom = { ...row.groom, isVip: body.enabled, plan: body.enabled ? "vip" : "free", showWatermark: !body.enabled };
        return Response.json(clone(row));
      }
      // The old REST writes replace the stale groom object and reproduce both races.
      if (init.method === "PATCH") await beforeBillingWrite?.();
      row = { ...row, ...body };
      return Response.json([clone(row)]);
    });
    vi.stubGlobal("fetch", fetchMock);
    const db = await import("../serverDb");
    return { db, fetchMock, read: () => clone(row), pauseBilling: (pause: () => Promise<void>) => { beforeBillingWrite = pause; } };
  }

  it("a stale content snapshot cannot revoke a completed VIP upgrade", async () => {
    const { db, read } = await repository();
    const stale = await db.getCardByIdOrSlugFromDb(original.id);
    expect((await db.activateCardVipInDb(original.id)).success).toBe(true);
    const saved = await db.upsertCardToDb({ ...stale!, name: "Latest content" });
    expect(saved).toMatchObject({ name: "Latest content", isVip: true, plan: "vip", showWatermark: false });
    expect(read().groom.isVip).toBe(true);
  });

  it("a VIP request started before a content save cannot restore older groom information", async () => {
    const { db, read, pauseBilling } = await repository();
    let release!: () => void;
    let started!: () => void;
    const entered = new Promise<void>((resolve) => { started = resolve; });
    pauseBilling(() => { started(); return new Promise<void>((resolve) => { release = resolve; }); });
    const upgrade = db.activateCardVipInDb(original.id);
    await entered;
    const card = await db.getCardByIdOrSlugFromDb(original.id);
    await db.upsertCardToDb({ ...card!, groom: { ...card!.groom, name: "New groom" } });
    release();
    expect((await upgrade).success).toBe(true);
    expect(read().groom).toMatchObject({ name: "New groom", isVip: true });
  });
});
