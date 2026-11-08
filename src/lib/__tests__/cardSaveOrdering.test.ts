import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { INITIAL_CARDS, saveCard, saveCardAsync, getCardByIdOrSlug } from "../weddingCardService";

describe("Card save request ordering", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) || null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      key: (index: number) => [...store.keys()][index] || null,
      get length() { return store.size; },
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("serializes requests and prevents an older response from replacing newer album/nodes/settings", async () => {
    const oldCard = { ...INITIAL_CARDS[0], id: "save-order-test", slug: "save-order-test", userId: "owner", album: ["old.jpg"], nodes: { ROOT: { props: { height: 100 } } } };
    const latest = { ...oldCard, album: ["new.jpg"], nodes: { ROOT: { props: { height: 200 } } }, showGiftBox: false, envelopeTheme: "emerald", musicUrl: "new.mp3" };
    let finishFirst!: (response: Response) => void;
    const fetchSpy = vi.fn()
      .mockImplementationOnce(() => new Promise<Response>((resolve) => { finishFirst = resolve; }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true })));
    vi.stubGlobal("fetch", fetchSpy);
    const first = saveCardAsync(oldCard);
    await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    saveCard(latest);
    const second = saveCardAsync(latest);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    finishFirst(new Response(JSON.stringify({ success: true })));
    await first;
    expect(getCardByIdOrSlug(oldCard.id)?.album).toEqual(["new.jpg"]);
    await second;
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchSpy.mock.calls[1][1].body)).toMatchObject({ album: ["new.jpg"], nodes: latest.nodes, showGiftBox: false, envelopeTheme: "emerald", musicUrl: "new.mp3" });
    expect(getCardByIdOrSlug(oldCard.id)).toMatchObject({
      ...latest, updatedAt: new Date().toLocaleDateString("vi-VN"),
    });
  });

  it("a failed older save does not block a later snapshot", async () => {
    const card = { ...INITIAL_CARDS[0], id: "save-order-failure", slug: "save-order-failure" };
    const fetchSpy = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(new Response(JSON.stringify({ success: true })));
    vi.stubGlobal("fetch", fetchSpy);
    const first = saveCardAsync(card);
    const second = saveCardAsync({ ...card, album: [] });
    expect((await first).success).toBe(false);
    expect((await second).success).toBe(true);
    expect(getCardByIdOrSlug(card.id)?.album).toEqual([]);
  });

  it("caches server-authoritative VIP, ownership and empty content from the saved row", async () => {
    const stale = { ...INITIAL_CARDS[0], id: "authoritative-save", slug: "authoritative-save", userId: "owner", isVip: false, plan: "free" as const, showWatermark: true, album: ["old.jpg"] };
    const persisted = { ...stale, userId: "server-owner", isVip: true, plan: "vip" as const, showWatermark: false, vipUnlockedAt: "2026-11-04T01:00:00Z", album: [], story: "", nodes: { ROOT: { props: { height: 200 } } }, rsvps: [], wishes: [] };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, card: persisted }))));
    expect((await saveCardAsync(stale)).success).toBe(true);
    expect(getCardByIdOrSlug(stale.id)).toMatchObject({ ...persisted, updatedAt: new Date().toLocaleDateString("vi-VN") });
    expect(JSON.parse(localStorage.getItem("zenlove_cards_server-owner")!)[0]).toMatchObject({ userId: "server-owner", isVip: true, plan: "vip", showWatermark: false, album: [], story: "" });
  });
});
