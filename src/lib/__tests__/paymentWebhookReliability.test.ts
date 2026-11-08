import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ activate: vi.fn(), card: vi.fn(), wish: vi.fn() }));
vi.mock("@/lib/serverDb", () => ({
  activateCardVipInDb: mocks.activate,
  getCardByIdOrSlugFromDb: mocks.card,
  createWishInDb: mocks.wish,
}));
vi.mock("@/lib/activityService", () => ({ recordActivity: vi.fn() }));

const card = { id: "card-payment", slug: "payment-test", name: "Test card" };
const json = (body: unknown, status = 200) => Response.json(body, { status });
const request = (body: Record<string, unknown>, token = "test-webhook-secret") => new NextRequest("http://localhost/api/webhook/payment", {
  method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify({ amount: 99000, content: "VIP payment-test", referenceCode: "tx-test", transferType: "in", ...body }),
});

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("PAYMENT_WEBHOOK_TOKEN", "test-webhook-secret");
  vi.stubEnv("PAYMENT_ACCOUNT_NUMBER", "");
  vi.stubEnv("SUPABASE_URL", "https://database.example.test");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-key");
  mocks.activate.mockResolvedValue({ success: true, card });
  mocks.card.mockResolvedValue(card);
  mocks.wish.mockResolvedValue({ id: "wish-payment" });
  vi.stubGlobal("fetch", vi.fn());
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks();
});

describe("Payment webhook persistence contracts", () => {
  it.each([
    { amount: 1 }, { amount: 99001 }, { amount: -1 }, { amount: "not-a-number" },
    { transferType: "out" }, { amountOut: 99000 }, { referenceCode: "" },
  ])("rejects invalid payment before claiming or activating: %j", async (body) => {
    const { POST } = await import("@/app/api/webhook/payment/route");
    expect((await POST(request(body))).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.activate).not.toHaveBeenCalled();
  });

  it("rejects a wrong secret and a wrong receiving account", async () => {
    const { POST } = await import("@/app/api/webhook/payment/route");
    expect((await POST(request({}, "wrong-secret"))).status).toBe(401);
    vi.stubEnv("PAYMENT_ACCOUNT_NUMBER", "123456");
    expect((await POST(request({ accountNumber: "987654" }))).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("claims pending, activates, then marks completed; repeated delivery does not activate twice", async () => {
    const fetchMock = vi.mocked(fetch)
      .mockResolvedValueOnce(json([{ reference_code: "tx-test" }]))
      .mockResolvedValueOnce(json([{ reference_code: "tx-test", processed_at: "done" }]));
    const { POST } = await import("@/app/api/webhook/payment/route");
    expect((await POST(request({}))).status).toBe(200);
    const claim = JSON.parse(String(fetchMock.mock.calls[0][1]!.body));
    expect(claim).toMatchObject({ reference_code: "tx-test", processed_at: null, claim_token: expect.any(String) });
    expect(fetchMock.mock.calls[1][0]).toContain(`claim_token=eq.${claim.claim_token}`);
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]!.body)).processed_at).toEqual(expect.any(String));
    expect((await (await POST(request({}))).json()).alreadyProcessed).toBe(true);
    expect(mocks.activate).toHaveBeenCalledTimes(1);
  });

  it("releases a failed activation so a later webhook can retry", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(json([{ reference_code: "tx-test" }]))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(json([{ reference_code: "tx-test" }]))
      .mockResolvedValueOnce(json([{ reference_code: "tx-test", processed_at: "done" }]));
    mocks.activate.mockResolvedValueOnce({ success: false });
    const { POST } = await import("@/app/api/webhook/payment/route");
    expect((await POST(request({}))).status).toBe(503);
    expect(vi.mocked(fetch).mock.calls[1][1]!.method).toBe("DELETE");
    expect((await POST(request({}))).status).toBe(200);
    expect(mocks.activate).toHaveBeenCalledTimes(2);
  });

  it("does not treat an in-progress database claim as completed", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(json([])).mockResolvedValueOnce(json([
      { processed_at: null, claimed_at: new Date().toISOString() },
    ]));
    const { POST } = await import("@/app/api/webhook/payment/route");
    expect((await POST(request({}))).status).toBe(503);
    expect(mocks.activate).not.toHaveBeenCalled();
  });

  it("atomically reclaims an expired pending claim", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(json([])).mockResolvedValueOnce(json([
      { processed_at: null, claimed_at: new Date(Date.now() - 10 * 60000).toISOString() },
    ])).mockResolvedValueOnce(json([{ reference_code: "tx-test" }]))
      .mockResolvedValueOnce(json([{ reference_code: "tx-test", processed_at: "done" }]));
    const { POST } = await import("@/app/api/webhook/payment/route");
    expect((await POST(request({}))).status).toBe(200);
    expect(vi.mocked(fetch).mock.calls[2][0]).toContain("processed_at=is.null&claimed_at=lt.");
    expect(mocks.activate).toHaveBeenCalledOnce();
  });

  it("keeps a failed completion retryable and uses one gift-wish id for repeated deliveries", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(json([{ reference_code: "tx-test" }]))
      .mockResolvedValueOnce(json({ error: "database down" }, 500))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(json([{ reference_code: "tx-test" }]))
      .mockResolvedValueOnce(json([{ reference_code: "tx-test", processed_at: "done" }]));
    const { POST } = await import("@/app/api/webhook/payment/route");
    expect((await POST(request({ content: "MC payment-test Chuc mung" }))).status).toBe(503);
    expect((await POST(request({ content: "MC payment-test Chuc mung" }))).status).toBe(200);
    expect(mocks.wish).toHaveBeenCalledTimes(2);
    expect(mocks.wish.mock.calls[0][0].id).toBe(mocks.wish.mock.calls[1][0].id);
  });
});
