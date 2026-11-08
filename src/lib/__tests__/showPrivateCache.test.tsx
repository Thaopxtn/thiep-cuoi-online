import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const captured = vi.hoisted(() => ({ effects: [] as Array<{ effect: () => void | (() => void); deps?: unknown[] }> }));
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, useEffect: (effect: () => void | (() => void), deps?: unknown[]) => { captured.effects.push({ effect, deps }); } };
});
vi.mock("next/navigation", () => ({ useParams: () => ({ slug: "private-show-slug" }) }));
vi.mock("@/lib/weddingCardService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../weddingCardService")>()),
  incrementCardViews: vi.fn(),
}));
import ShowInvitationPage from "@/app/show/[slug]/page";
import { INITIAL_CARDS, saveCard } from "../weddingCardService";
import { toPublicCardDTO } from "../cardDto";

describe("Public viewer and private editor cache", () => {
  beforeEach(() => {
    captured.effects = [];
    const store = new Map<string, string>();
    vi.stubGlobal("window", { location: { search: "" }, innerWidth: 1200 });
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) || null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      key: (index: number) => [...store.keys()][index] || null,
      get length() { return store.size; },
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("runs the real viewer loading effect without replacing the owner's private snapshot with PublicCardDTO", async () => {
    const card = {
      ...INITIAL_CARDS[0], id: "private-show-card", slug: "private-show-slug", userId: "private-owner",
      nodes: { ROOT: { props: {} }, first: { props: {} }, second: { props: {} } },
      rsvps: [{ id: "private-rsvp", cardId: "private-show-card", name: "Khách thử", phone: "0912345678", note: "Ghi chú riêng", attending: true, guests: 1, createdAt: "2026-11-04T01:00:00Z" }],
    };
    saveCard(card);
    const privateIdCache = localStorage.getItem("card_private-show-card");
    const privateSlugCache = localStorage.getItem("card_slug_private-show-slug");
    const publicCard = toPublicCardDTO(card);
    expect(publicCard).not.toHaveProperty("userId");
    expect(publicCard.rsvps[0]).not.toHaveProperty("phone");
    const fetchSpy = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, card: publicCard })));
    vi.stubGlobal("fetch", fetchSpy);
    renderToStaticMarkup(<ShowInvitationPage />);
    const loading = captured.effects.find(({ deps }) => deps?.[0] === "private-show-slug");
    expect(loading).toBeDefined();
    const cleanup = loading!.effect();
    try {
      await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalledWith("/api/show/private-show-slug"));
      await new Promise<void>((resolve) => setImmediate(resolve));
      expect(localStorage.getItem("card_private-show-card")).toBe(privateIdCache);
      expect(localStorage.getItem("card_slug_private-show-slug")).toBe(privateSlugCache);
    } finally {
      if (cleanup) cleanup();
    }
  });
});
