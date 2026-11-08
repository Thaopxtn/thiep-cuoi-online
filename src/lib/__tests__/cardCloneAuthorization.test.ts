import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ upsertCard: vi.fn() }));
vi.mock("@/lib/serverDb", () => ({ upsertCardToDb: mocks.upsertCard }));
vi.mock("@/lib/serverAuth", () => ({
  verifyUserAuth: vi.fn().mockResolvedValue({ authenticated: true, userId: "verified-owner" }),
  verifyAdminAuth: vi.fn().mockResolvedValue({ authenticated: false }),
}));
vi.mock("@/lib/activityService", () => ({ recordActivity: vi.fn() }));
vi.mock("fs", () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    readFileSync: vi.fn().mockReturnValue(JSON.stringify({ parsedNodes: { ROOT: {} } })),
  },
}));
vi.mock("@/data/zenloveTemplates", () => ({
  findZenloveTemplate: vi.fn().mockReturnValue({ id: "template-1", slug: "test-template", name: "Mẫu 1" }),
}));
vi.mock("@/lib/templateFormAdapter", () => ({ convertFormTemplateToCanvasNodes: vi.fn() }));
vi.mock("@/lib/templateExtractor", () => ({
  extractWeddingDetailsFromTemplate: vi.fn().mockReturnValue({
    groomName: "An", brideName: "Bình", album: [],
  }),
}));
vi.mock("@/lib/brandedSlug", () => ({
  generateBrandedWeddingSlug: vi.fn().mockReturnValue("safe-cloned-slug"),
}));

import { POST } from "@/app/api/cards/clone/route";

describe("Template clone entitlement boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.upsertCard.mockImplementation(async (card) => card);
  });

  it("ignores supplied ownership and VIP fields when cloning a template", async () => {
    const response = await POST(new NextRequest("https://app.example.test/api/cards/clone", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId: "template-1", userId: "stranger", isVip: true,
        plan: "premium", showWatermark: false, vipUnlockedAt: "forged",
        groom: { userId: "stranger", isVip: true, plan: "vip" },
      }),
    }));

    expect(response.status).toBe(200);
    expect(mocks.upsertCard.mock.calls[0][0]).toMatchObject({
      userId: "verified-owner", status: "draft", isVip: false,
      plan: "free", showWatermark: true, groom: { userId: "verified-owner" },
    });
    expect(mocks.upsertCard.mock.calls[0][0].vipUnlockedAt).toBeUndefined();
    expect(mocks.upsertCard.mock.calls[0][0].groom.isVip).toBeUndefined();
    expect(mocks.upsertCard.mock.calls[0].slice(1)).toEqual([undefined, { createOnly: true }]);
  });
});
