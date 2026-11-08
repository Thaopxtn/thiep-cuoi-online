import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { WeddingCard } from "@/data/initialCards";

const db = vi.hoisted(() => ({ rows: new Map<string, WeddingCard>(), upsert: vi.fn(), content: vi.fn(), remove: vi.fn() }));
vi.mock("@/lib/serverDb", () => ({
  getCardByIdOrSlugFromDb: async (id: string) => {
    const found = [...db.rows.values()].find((card) => card.id === id || card.slug === id);
    return found ? structuredClone(found) : null;
  },
  getCardsFromDb: async (userId?: string) => structuredClone([...db.rows.values()].filter((card) => !userId || card.userId === userId)),
  upsertCardToDb: db.upsert,
  saveCardContentToDb: db.content,
  deleteCardFromDb: db.remove,
}));
vi.mock("@/lib/serverAuth", () => ({
  verifyUserAuth: async (request: NextRequest) => {
    const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
    return { authenticated: token === "account-A" || token === "account-B", userId: token };
  },
  verifyAdminAuth: async () => ({ authenticated: false }),
  isCardOwner: (card: WeddingCard, userId: string) => card.userId === userId,
}));
vi.mock("@/lib/activityService", () => ({ recordActivity: vi.fn() }));
vi.mock("@/lib/securityUtils", () => ({ getSafeSiteUrl: () => "https://zenlove.example.test" }));
vi.mock("@/lib/zenloveCloner", () => ({ getOrCloneCustomerCard: vi.fn() }));

import { POST as CREATE, GET as LIST } from "@/app/api/cards/route";
import { PUT, GET as PRIVATE, DELETE } from "@/app/api/cards/[id]/route";
import { POST as PUBLISH } from "@/app/api/cards/[id]/publish/route";
import { GET as SHOW } from "@/app/api/show/[slug]/route";
import { INITIAL_CARDS } from "@/data/initialCards";

const params = { params: { id: "lifecycle-card" } };
const request = (method: string, token?: string, body?: unknown, path = "/api/cards/lifecycle-card") => new NextRequest(`https://zenlove.example.test${path}`, {
  method,
  headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

describe("Isolated card route lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.rows.clear();
    db.upsert.mockImplementation(async (card: WeddingCard) => {
      const saved = structuredClone({ ...db.rows.get(card.id), ...card });
      db.rows.set(saved.id, saved);
      return structuredClone(saved);
    });
    db.content.mockImplementation(async (id: string, content: Partial<WeddingCard>) => {
      const existing = db.rows.get(id);
      if (!existing) return null;
      const saved = structuredClone({ ...existing, ...content });
      db.rows.set(id, saved);
      return structuredClone(saved);
    });
    db.remove.mockImplementation(async (id: string) => db.rows.delete(id));
  });

  it("creates, edits, reloads, publishes and shows a card while denying the other account", async () => {
    const draft = { ...INITIAL_CARDS[0], id: "lifecycle-card", slug: "lifecycle-slug", name: "Thiệp thử độc lập", status: "draft", userId: "forged-owner", isVip: true, plan: "vip", showWatermark: false, album: ["old.jpg"], rsvps: [], wishes: [] };
    const created = await CREATE(request("POST", "account-A", draft, "/api/cards"));
    expect(created.status).toBe(200);
    expect((await created.json()).card).toMatchObject({ userId: "account-A", isVip: false, plan: "free", showWatermark: true, status: "draft" });

    expect((await PRIVATE(request("GET", "account-B"), params)).status).toBe(403);
    expect((await PUT(request("PUT", "account-B", { name: "Không được ghi" }), params)).status).toBe(403);
    expect((await DELETE(request("DELETE", "account-B"), params)).status).toBe(403);
    expect((await PUBLISH(request("POST", "account-B"), params)).status).toBe(403);
    const listB = await LIST(request("GET", "account-B", undefined, "/api/cards?userId=account-A"));
    expect((await listB.json()).cards).toEqual([]);

    const content = {
      story: "", coverImage: "", album: [], musicTitle: "", musicUrl: "", loveStory: [],
      showGiftBox: false, showWishes: false, showRsvp: false, showEvents: false, showCalendar: false, showAlbum: false, showLoveStory: false,
      groom: { name: "Chú Rể Thử", phone: "", accountNumber: "" }, bride: { name: "Cô Dâu Thử", phone: "" },
      nodes: { ROOT: { type: { resolvedName: "GeometricBox" }, props: { height: 1200 } }, text: { type: { resolvedName: "TextBox" }, props: { text: "Nội dung riêng" } } },
    };
    expect((await PUT(request("PUT", "account-A", content), params)).status).toBe(200);
    const reloaded = await PRIVATE(request("GET", "account-A"), params);
    expect((await reloaded.json()).card).toMatchObject(content);
    expect((await SHOW(request("GET"), { params: { slug: "lifecycle-slug" } })).status).toBe(403);

    const saved = db.rows.get("lifecycle-card")!;
    saved.rsvps = [{ id: "rsvp-private", cardId: saved.id, name: "Khách thử", phone: "0912345678", note: "Ghi chú riêng", attending: true, guests: 2, createdAt: "2026-11-04T01:00:00Z" }];
    const published = await PUBLISH(request("POST", "account-A"), params);
    expect(published.status).toBe(200);
    expect(db.content).toHaveBeenCalledWith("lifecycle-card", { status: "published" });
    expect((await published.json()).publicUrl).toBe("https://zenlove.example.test/show/lifecycle-slug");

    // A fresh anonymous request has no browser storage or user authentication.
    const viewed = await SHOW(request("GET"), { params: { slug: "lifecycle-slug" } });
    expect(viewed.status).toBe(200);
    const publicCard = (await viewed.json()).card;
    expect(publicCard).toMatchObject({ ...content, groom: { name: "Chú Rể Thử", phone: "" }, bride: { name: "Cô Dâu Thử", phone: "" }, status: "published" });
    expect(publicCard).not.toHaveProperty("userId");
    expect(publicCard.rsvps[0]).not.toHaveProperty("phone");
    expect(publicCard.rsvps[0]).not.toHaveProperty("note");
  });
});
