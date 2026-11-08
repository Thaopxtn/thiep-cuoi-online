import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addRsvp, addWish, deleteCard, fetchCardsFromServer, getCardByIdOrSlug, getAllCards, saveCard, toggleRsvpCheckIn, INITIAL_CARDS } from "../weddingCardService";

const rsvpInput = { name: "Khách thử", phone: "0912345678", attending: true, guests: 2, note: "Ghi chú" };
const serverRsvp = { ...rsvpInput, id: "server-rsvp-1", cardId: "interaction-card", createdAt: "2026-11-04T01:00:00.000Z" };
const serverWish = { id: "server-wish-1", cardId: "interaction-card", name: "Khách thử", content: "Chúc hạnh phúc", createdAt: "2026-11-04T01:00:00.000Z" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("Confirmed RSVP, wish and card mutations", () => {
  let store: Map<string, string>;
  beforeEach(() => {
    store = new Map();
    vi.stubGlobal("window", { dispatchEvent: vi.fn() });
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) || null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      key: (index: number) => [...store.keys()][index] || null,
      get length() { return store.size; },
    });
    localStorage.setItem("zenlove_auth_user", JSON.stringify({ id: "owner", accessToken: "owner-token" }));
    saveCard({ ...INITIAL_CARDS[0], id: "interaction-card", slug: "interaction-slug", userId: "owner", rsvps: [], wishes: [], nodes: { ROOT: { props: { height: 1200 } } } });
  });
  afterEach(() => vi.unstubAllGlobals());
  const cacheSnapshot = () => [...store.entries()].filter(([key]) => key !== "zenlove_auth_user");

  it("waits for owner creation ack, caches the server ID, and uses it for the next mutation", async () => {
    const before = cacheSnapshot();
    let complete!: (response: Response) => void;
    const fetchSpy = vi.fn().mockImplementationOnce(() => new Promise<Response>((resolve) => { complete = resolve; }));
    vi.stubGlobal("fetch", fetchSpy);
    const pending = addRsvp("interaction-card", rsvpInput, { asOwner: true });
    expect(cacheSnapshot()).toEqual(before);
    expect(fetchSpy.mock.calls[0][0]).toBe("/api/cards/interaction-card/rsvps");
    complete(json({ success: true, rsvp: serverRsvp }, 201));
    const row = await pending;
    expect(row).toEqual(serverRsvp);
    expect(getAllCards()[0].rsvps).toEqual([serverRsvp]);
    expect(getCardByIdOrSlug("interaction-card")?.nodes).toEqual({ ROOT: { props: { height: 1200 } } });
    fetchSpy.mockResolvedValueOnce(json({ success: true, rsvp: { ...serverRsvp, checkedIn: true } }));
    await expect(toggleRsvpCheckIn("interaction-card", row.id)).resolves.toBe(true);
    expect(fetchSpy.mock.calls[1][0]).toBe("/api/cards/interaction-card/rsvps/server-rsvp-1");
  });

  it("public guest RSVP uses the public endpoint, even when the visitor is logged in", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(json({ success: true, rsvp: { id: serverRsvp.id, name: "Tên đã chuẩn hóa", attending: false, guests: 0, createdAt: serverRsvp.createdAt } }));
    vi.stubGlobal("fetch", fetchSpy);
    const row = await addRsvp("interaction-card", { ...rsvpInput, attending: false, guests: 0 });
    expect(fetchSpy.mock.calls[0][0]).toBe("/api/show/interaction-card/rsvp");
    expect(row).toMatchObject({ id: serverRsvp.id, name: "Tên đã chuẩn hóa", phone: rsvpInput.phone, cardId: "interaction-card", attending: false, guests: 0 });
    expect(new Headers(fetchSpy.mock.calls[0][1].headers).get("Authorization")).toBe("Bearer owner-token");
  });

  it("waits for wish ack and updates each cache with the persisted row once", async () => {
    const before = cacheSnapshot();
    let complete!: (response: Response) => void;
    vi.stubGlobal("fetch", vi.fn().mockImplementationOnce(() => new Promise<Response>((resolve) => { complete = resolve; })));
    const pending = addWish("interaction-card", serverWish.name, serverWish.content);
    expect(cacheSnapshot()).toEqual(before);
    complete(json({ success: true, wish: serverWish }));
    expect(await pending).toEqual(serverWish);
    expect(getCardByIdOrSlug("interaction-slug")?.wishes).toEqual([serverWish]);
    expect(getAllCards()[0].wishes).toEqual([serverWish]);
    expect(getCardByIdOrSlug("interaction-card")?.userId).toBe("owner");
  });

  it.each([
    ["RSVP", () => addRsvp("interaction-card", rsvpInput)],
    ["wish", () => addWish("interaction-card", serverWish.name, serverWish.content)],
    ["delete", () => deleteCard("interaction-card")],
  ] as const)("keeps all cache keys when %s gets a server error or loses its connection", async (_label, mutate) => {
    const before = cacheSnapshot();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(json({ success: false, message: "Không thể lưu thử nghiệm" }, 500)).mockRejectedValueOnce(new Error("offline")));
    await expect(mutate()).rejects.toThrow("Không thể lưu thử nghiệm");
    expect(cacheSnapshot()).toEqual(before);
    await expect(mutate()).rejects.toThrow("offline");
    expect(cacheSnapshot()).toEqual(before);
  });

  it("rejects malformed acknowledgements instead of inventing an ID", async () => {
    const before = cacheSnapshot();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ success: true })));
    await expect(addRsvp("interaction-card", rsvpInput)).rejects.toThrow();
    await expect(addWish("interaction-card", serverWish.name, serverWish.content)).rejects.toThrow();
    expect(cacheSnapshot()).toEqual(before);
  });

  it("deletes list/id/slug caches only after a single confirmed request", async () => {
    const before = cacheSnapshot();
    let complete!: (response: Response) => void;
    const fetchSpy = vi.fn().mockImplementationOnce(() => new Promise<Response>((resolve) => { complete = resolve; }));
    vi.stubGlobal("fetch", fetchSpy);
    const pending = deleteCard("interaction-card");
    await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    expect(cacheSnapshot()).toEqual(before);
    complete(json({ success: true }));
    await pending;
    expect(getAllCards()).toEqual([]);
    expect(localStorage.getItem("card_interaction-card")).toBeNull();
    expect(localStorage.getItem("card_slug_interaction-slug")).toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("refreshes an expired session before deletion and keeps cache until the retry is confirmed", async () => {
    localStorage.setItem("zenlove_auth_user", JSON.stringify({ id: "owner", accessToken: "old-token", refreshToken: "refresh-token" }));
    const fetchSpy = vi.fn().mockResolvedValueOnce(json({ success: false }, 401))
      .mockResolvedValueOnce(json({ success: true, accessToken: "new-token", refreshToken: "new-refresh-token" }))
      .mockResolvedValueOnce(json({ success: true }));
    vi.stubGlobal("fetch", fetchSpy);
    await deleteCard("interaction-card");
    expect(fetchSpy.mock.calls.map(([url]) => url)).toEqual(["/api/cards/interaction-card", "/api/auth/refresh", "/api/cards/interaction-card"]);
    expect(new Headers(fetchSpy.mock.calls[2][1].headers).get("Authorization")).toBe("Bearer new-token");
    expect(getAllCards()).toEqual([]);
  });

  it("does not let an older list response resurrect a card after confirmed deletion", async () => {
    const oldCard = getCardByIdOrSlug("interaction-card")!;
    let completeList!: (response: Response) => void;
    vi.stubGlobal("fetch", vi.fn()
      .mockImplementationOnce(() => new Promise<Response>((resolve) => { completeList = resolve; }))
      .mockResolvedValueOnce(json({ success: true })));
    const listing = fetchCardsFromServer("owner");
    await deleteCard("interaction-card");
    completeList(json({ success: true, cards: [oldCard] }));
    expect(await listing).toEqual([]);
    expect(getAllCards()).toEqual([]);
  });

  it("can submit for an anonymous visitor without a local card and never adopts the public card", async () => {
    localStorage.removeItem("zenlove_auth_user");
    const before = cacheSnapshot();
    const fetchSpy = vi.fn().mockResolvedValue(json({ success: true, wish: { ...serverWish, cardId: "foreign-card" } }));
    vi.stubGlobal("fetch", fetchSpy);
    const wish = await addWish("foreign-card", serverWish.name, serverWish.content);
    expect(wish.id).toBe(serverWish.id);
    expect(cacheSnapshot()).toEqual(before);
    expect(new Headers(fetchSpy.mock.calls[0][1].headers).get("Authorization")).toBeNull();
  });

  it("permits an explicit anonymous demo but never treats real-account failures as demo success", async () => {
    const full = getCardByIdOrSlug("interaction-card")!;
    localStorage.removeItem("zenlove_auth_user");
    saveCard({ ...full, userId: undefined, groom: { ...full.groom, userId: undefined } });
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const row = await addRsvp("interaction-card", rsvpInput, { localOnly: true });
    expect(row.id).toMatch(/^rsvp_demo_/);
    expect(fetchSpy).not.toHaveBeenCalled();
    localStorage.setItem("zenlove_auth_user", JSON.stringify({ id: "owner" }));
    await expect(addWish("interaction-card", serverWish.name, serverWish.content, { localOnly: true })).rejects.toThrow("Chỉ dữ liệu xem thử");
  });
});
