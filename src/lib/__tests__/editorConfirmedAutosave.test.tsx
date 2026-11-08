import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WeddingCard } from "@/data/initialCards";

// Execute the page's actual event handlers and timer coordinator. Child rendering and
// React scheduling are isolated so no browser, real API, or filesystem database is used.
const harness = vi.hoisted(() => ({ index: 0, slots: [] as any[], effects: [] as Array<() => void | (() => void)>, card: null as WeddingCard | null, save: vi.fn(), local: vi.fn() }));
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  const same = (a?: unknown[], b?: unknown[]) => Boolean(a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index])));
  const hooks = {
    useState: (initial: unknown) => {
      const index = harness.index++;
      if (!(index in harness.slots)) harness.slots[index] = { state: typeof initial === "function" ? initial() : initial };
      return [harness.slots[index].state, (value: unknown) => { harness.slots[index].state = typeof value === "function" ? value(harness.slots[index].state) : value; }];
    },
    useRef: (initial: unknown) => {
      const index = harness.index++;
      if (!(index in harness.slots)) harness.slots[index] = { current: initial };
      return harness.slots[index];
    },
    useCallback: (callback: unknown, deps?: unknown[]) => {
      const index = harness.index++;
      if (!same(harness.slots[index]?.deps, deps)) harness.slots[index] = { value: callback, deps };
      return harness.slots[index].value;
    },
    useEffect: (effect: () => void | (() => void), deps?: unknown[]) => {
      const index = harness.index++;
      if (!same(harness.slots[index]?.deps, deps)) harness.effects.push(effect);
      harness.slots[index] = { deps };
    },
  };
  return { ...actual, ...hooks, default: { ...actual.default, ...hooks } };
});
vi.mock("next/navigation", () => ({ useParams: () => ({ id: "editor-autosave-card" }), useRouter: () => ({ push: vi.fn() }) }));
vi.mock("next/dynamic", () => ({ default: () => () => null }));
vi.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: { id: "owner", name: "Người thử" }, isLoggedIn: true, openLoginModal: vi.fn() }) }));
vi.mock("@/lib/weddingCardService", () => ({
  getCardByIdOrSlug: () => harness.card ? structuredClone(harness.card) : undefined,
  fetchCardForEditor: async () => ({ success: true, isOwner: true, card: structuredClone(harness.card) }),
  saveCard: harness.local,
  saveCardAsync: harness.save,
}));
vi.mock("@/lib/decorativeLockService", async (importOriginal) => ({
  ...await importOriginal<typeof import("../decorativeLockService")>(),
  repairAndLockDecorativeNodes: (nodes: unknown) => ({ repairedNodes: nodes, repairedCount: 0 }),
  getRealWeddingPhotoSlots: () => [],
}));
import DesignTemplatePage from "@/app/design-template/[id]/page";
import { INITIAL_CARDS } from "@/data/initialCards";

function renderPage() {
  harness.index = 0;
  return DesignTemplatePage();
}
function propsWith(root: React.ReactNode, key: string): any {
  if (Array.isArray(root)) {
    for (const item of root) { const found = propsWith(item, key); if (found) return found; }
  } else if (React.isValidElement<Record<string, unknown>>(root)) {
    if (key in root.props) return root.props;
    return propsWith(root.props.children as React.ReactNode, key);
  }
  return undefined;
}

describe("Editor confirmed autosave handlers", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    harness.index = 0;
    harness.slots = [];
    harness.effects = [];
    harness.save.mockReset().mockResolvedValue({ success: true });
    harness.local.mockReset();
    harness.card = {
      ...INITIAL_CARDS[0], id: "editor-autosave-card", slug: "editor-autosave-slug", userId: "owner", album: ["https://example.test/album.webp"],
      nodes: { ROOT: { type: { resolvedName: "GeometricBox" }, props: { height: 1200 } }, one: { type: { resolvedName: "TextBox" }, props: { text: "Tên thử" } }, two: { type: { resolvedName: "TextBox" }, props: { text: "Ngày thử" } } },
    };
    vi.stubGlobal("localStorage", { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn(), length: 0 });
    vi.stubGlobal("window", { innerWidth: 1200, location: { search: "", pathname: "/design-template/editor-autosave-card" }, addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() });
    renderPage();
    const effects = harness.effects.splice(0);
    effects.forEach((effect) => effect());
    await Promise.resolve();
    await Promise.resolve();
    renderPage();
    harness.save.mockClear();
  });
  afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });

  it("saves fixed-module metadata through the coordinator and surfaces a failed server result", async () => {
    const page = renderPage();
    harness.save.mockResolvedValueOnce({ success: false, message: "offline" });
    propsWith(page, "onSaveCard").onSaveCard({ ...harness.card, showRsvp: false, rsvpTitle: "", fixedModuleStyles: { rsvp: "red-velvet" } });
    expect(harness.save).not.toHaveBeenCalled();
    expect(propsWith(renderPage(), "saveStatus").saveStatus).toBe("saving");
    await vi.advanceTimersByTimeAsync(1500);
    expect(harness.save).toHaveBeenCalledTimes(1);
    expect(harness.save.mock.calls[0][0]).toMatchObject({ showRsvp: false, rsvpTitle: "", fixedModuleStyles: { rsvp: "red-velvet" } });
    expect(propsWith(renderPage(), "saveStatus").saveStatus).toBe("offline");
  });

  it("reads the latest empty album/nodes/settings and ignores a stale failure after a newer save", async () => {
    const page = renderPage();
    let completeOld!: (result: { success: boolean }) => void;
    harness.save.mockImplementationOnce(() => new Promise((resolve) => { completeOld = resolve; }));
    propsWith(page, "onToggleFixedModule").onToggleFixedModule("showWishes", false);
    renderPage();
    await vi.advanceTimersByTimeAsync(1500);
    const nextPage = renderPage();
    propsWith(nextPage, "onUpdateAlbum").onUpdateAlbum([]);
    renderPage();
    await vi.advanceTimersByTimeAsync(1500);
    expect(harness.save.mock.calls[1][0]).toMatchObject({ album: [], showWishes: false, nodes: harness.card!.nodes });
    expect(propsWith(renderPage(), "saveStatus").saveStatus).toBe("saved");
    completeOld({ success: false });
    await Promise.resolve();
    expect(propsWith(renderPage(), "saveStatus").saveStatus).toBe("saved");
  });

  it("opens a local preview without firing an unacknowledged background save", () => {
    propsWith(renderPage(), "onPreview").onPreview();
    expect(harness.local).toHaveBeenCalled();
    expect(harness.save).not.toHaveBeenCalled();
  });

  it("keeps explicitly removed music empty when later autosaves rebuild the card", async () => {
    propsWith(renderPage(), "onChangeMusic").onChangeMusic("", "");
    renderPage();
    propsWith(renderPage(), "onToggleFixedModule").onToggleFixedModule("showWishes", false);
    renderPage();
    await vi.advanceTimersByTimeAsync(1500);
    expect(harness.save.mock.calls.at(-1)?.[0]).toMatchObject({ musicUrl: "", musicTitle: "", showWishes: false });
  });

  it("Ctrl+S uses the latest album and settings without reinstalling a stale shortcut closure", async () => {
    const keydown = vi.mocked(window.addEventListener).mock.calls.find(([event]) => event === "keydown")?.[1] as (event: KeyboardEvent) => void;
    expect(keydown).toBeTypeOf("function");
    propsWith(renderPage(), "onUpdateAlbum").onUpdateAlbum([]);
    renderPage();
    propsWith(renderPage(), "onToggleFixedModule").onToggleFixedModule("showWishes", false);
    renderPage();
    keydown({ key: "s", ctrlKey: true, preventDefault: vi.fn(), target: { tagName: "DIV" } } as unknown as KeyboardEvent);
    await Promise.resolve();
    expect(harness.save.mock.calls.at(-1)?.[0]).toMatchObject({ album: [], showWishes: false });
  });

  it("caches the published server row including a VIP activation completed during publication", async () => {
    const acknowledged = { ...harness.card!, status: "published", isVip: true, plan: "vip", showWatermark: false };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, card: acknowledged }))));
    await propsWith(renderPage(), "onProceedPublish").onProceedPublish();
    expect(harness.local.mock.calls.at(-1)?.[0]).toMatchObject({ status: "published", isVip: true, plan: "vip", showWatermark: false });
  });
});
