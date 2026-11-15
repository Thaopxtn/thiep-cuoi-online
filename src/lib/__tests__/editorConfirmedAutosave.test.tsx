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

async function loadCommandDocument() {
  harness.card = {
    ...harness.card!,
    nodes: {
      ROOT: { type: { resolvedName: "GeometricBox" }, props: { width: 500, height: 1400 }, nodes: ["one", "two"] },
      one: { type: { resolvedName: "TextBox" }, parent: "ROOT", props: { text: "First", left: 0, top: 100, width: 200, height: 50, opacity: 0, visible: false, custom: { label: "", stops: [{ offset: 0, enabled: false }] } } },
      two: { type: { resolvedName: "TextBox" }, parent: "ROOT", props: { text: "Second", left: 100, top: 200, width: 200, height: 50 } },
    },
  };
  harness.slots = [];
  harness.effects = [];
  vi.mocked(window.addEventListener).mockClear();
  renderPage();
  harness.effects.splice(0).forEach((effect) => effect());
  await Promise.resolve();
  await Promise.resolve();
  renderPage();
  harness.save.mockClear();
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

  it("preserves batched node edits, forks after undo and saves only the resulting document", async () => {
    const page = renderPage();
    const edit = propsWith(page, "onUpdateElementProps").onUpdateElementProps;
    edit("one", { color: "#112233" });
    edit("two", { color: "#445566" });
    expect(propsWith(renderPage(), "nodes").nodes).toMatchObject({
      one: { props: { color: "#112233" } }, two: { props: { color: "#445566" } },
    });

    propsWith(page, "onUndo").onUndo();
    edit("one", { fontSize: 24 });
    const forked = renderPage();
    expect(propsWith(forked, "canRedo").canRedo).toBe(false);
    propsWith(page, "onRedo").onRedo();
    renderPage();
    await vi.advanceTimersByTimeAsync(1500);
    expect(harness.save).toHaveBeenCalledTimes(1);
    const saved = harness.save.mock.calls[0][0];
    expect(saved.nodes.one.props).toMatchObject({ color: "#112233", fontSize: 24 });
    expect(saved.nodes.two.props).not.toHaveProperty("color");
  });

  it("clears inspector and multi-selection when undo removes a newly created element", () => {
    const page = renderPage();
    propsWith(page, "onDuplicateElement").onDuplicateElement("one");
    const duplicated = propsWith(renderPage(), "onSelectElements");
    const addedId = Object.keys(duplicated.nodes).find((id) => !harness.card!.nodes![id])!;
    expect(addedId).toBeTruthy();
    duplicated.onSelectElements([{ id: addedId, type: "TextBox", props: duplicated.nodes[addedId].props }]);
    expect(propsWith(renderPage(), "onSelectElements").selectedElements).toHaveLength(1);
    propsWith(page, "onUndo").onUndo();
    const restored = propsWith(renderPage(), "onSelectElements");
    expect(restored.nodes).not.toHaveProperty(addedId);
    expect(restored.selectedElement).toBeNull();
    expect(restored.selectedElements).toEqual([]);
  });

  it("still saves linked metadata when a command leaves an equivalent canvas snapshot", async () => {
    const original = propsWith(renderPage(), "nodes").nodes;
    const linked = { type: { resolvedName: "TextBox" }, props: { text: "Chú rể mới" } };
    // Load a document whose visual name is already correct but whose metadata is stale.
    harness.card = {
      ...harness.card!, nodes: { ...original, SQCFifGgBp: linked, wGk0GJqtnt: linked },
      groom: { ...harness.card!.groom, name: "Tên cũ" },
    };
    harness.slots = [];
    harness.effects = [];
    renderPage();
    harness.effects.splice(0).forEach((effect) => effect());
    await Promise.resolve();
    await Promise.resolve();
    renderPage();
    harness.save.mockClear();
    propsWith(renderPage(), "onUpdateElementProps").onUpdateElementProps("SQCFifGgBp", { text: "Chú rể mới" });
    renderPage();
    await vi.advanceTimersByTimeAsync(1500);
    expect(harness.save.mock.calls.at(-1)?.[0].groom.name).toBe("Chú rể mới");
  });

  it("keeps prior snapshots immutable across property, background and layout commands", () => {
    const page = renderPage();
    const original = propsWith(page, "nodes").nodes;
    for (const node of Object.values(original) as Array<{ props: object }>) {
      Object.freeze(node.props);
      Object.freeze(node);
    }
    Object.freeze(original);
    const snapshot = JSON.stringify(original);
    propsWith(page, "onUpdateElementProps").onUpdateElementProps("one", { color: "#123456" });
    propsWith(page, "onChangeBackground").onChangeBackground({ color: "#ffeedd" });
    propsWith(page, "onShiftElementsBelow").onShiftElementsBelow(0, 100);
    propsWith(page, "onDuplicateElement").onDuplicateElement("one");
    expect(JSON.stringify(original)).toBe(snapshot);
    const undo = propsWith(page, "onUndo").onUndo;
    undo(); undo(); undo(); undo();
    expect(propsWith(renderPage(), "nodes").nodes).toEqual(original);
  });

  it.each(["button", "link", "role-button", "menu", "dialog", "select"])("keeps canvas keys inside a focused %s control", (control) => {
    const canvas = propsWith(renderPage(), "onSelectElements");
    canvas.onSelectElement({ id: "one", type: "TextBox", props: canvas.nodes.one.props });
    renderPage();
    const keydown = vi.mocked(window.addEventListener).mock.calls.find(([event]) => event === "keydown")?.[1] as (event: KeyboardEvent) => void;
    const target = {
      tagName: control === "select" ? "SELECT" : control === "button" ? "BUTTON" : control === "link" ? "A" : "DIV",
      closest: (selector: string) => selector.startsWith("dialog")
        ? (control === "dialog" ? {} : null)
        : (control === "dialog" || control === "select" ? null : {}),
    };
    const preventDefault = vi.fn();
    for (const key of ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Delete", "Backspace", "Escape"]) {
      keydown({ key, target, preventDefault, ctrlKey: false, metaKey: false } as unknown as KeyboardEvent);
    }
    const after = propsWith(renderPage(), "onSelectElements");
    expect(after.nodes).toBe(canvas.nodes);
    expect(after.selectedElement?.id).toBe("one");
    expect(after.selectedElements).toHaveLength(1);
    expect(preventDefault).not.toHaveBeenCalled();
    expect(harness.save).not.toHaveBeenCalled();
  });

  it("still saves with Ctrl+S while an application button has focus", async () => {
    const keydown = vi.mocked(window.addEventListener).mock.calls.find(([event]) => event === "keydown")?.[1] as (event: KeyboardEvent) => void;
    const preventDefault = vi.fn();
    keydown({
      key: "s", ctrlKey: true, metaKey: false, preventDefault,
      target: { tagName: "BUTTON", closest: (selector: string) => selector.startsWith("dialog") ? null : {} },
    } as unknown as KeyboardEvent);
    await Promise.resolve();
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(harness.save).toHaveBeenCalledTimes(1);
    expect(harness.save.mock.calls[0][0].nodes).toEqual(harness.card!.nodes);
  });

  it("does not undo when a focused component has already handled the keyboard event", () => {
    propsWith(renderPage(), "onUpdateElementProps").onUpdateElementProps("one", { color: "#112233" });
    const changed = renderPage();
    const keydown = vi.mocked(window.addEventListener).mock.calls.find(([event]) => event === "keydown")?.[1] as (event: KeyboardEvent) => void;
    const preventDefault = vi.fn();
    keydown({ key: "z", ctrlKey: true, defaultPrevented: true, preventDefault, target: { tagName: "DIV" } } as unknown as KeyboardEvent);
    expect(propsWith(renderPage(), "nodes").nodes).toBe(propsWith(changed, "nodes").nodes);
    expect(propsWith(renderPage(), "canUndo").canUndo).toBe(true);
    expect(preventDefault).not.toHaveBeenCalled();
    keydown({ key: "z", ctrlKey: true, defaultPrevented: false, preventDefault, target: { tagName: "DIV" } } as unknown as KeyboardEvent);
    expect(propsWith(renderPage(), "nodes").nodes.one.props).not.toHaveProperty("color");
  });

  it("undoes one multi-selection arrow command atomically and restores selection geometry", async () => {
    await loadCommandDocument();
    const canvas = propsWith(renderPage(), "onSelectElements");
    const before = structuredClone(canvas.nodes);
    canvas.onSelectElements(["one", "two"].map((id) => ({ id, type: "TextBox", props: canvas.nodes[id].props })));
    renderPage();
    const keydown = vi.mocked(window.addEventListener).mock.calls.find(([event]) => event === "keydown")?.[1] as (event: KeyboardEvent) => void;
    keydown({ key: "ArrowRight", ctrlKey: false, metaKey: false, preventDefault: vi.fn(), target: { tagName: "DIV" } } as unknown as KeyboardEvent);
    const moved = propsWith(renderPage(), "onSelectElements");
    expect(moved.nodes.one.props.left).toBe(1);
    expect(moved.nodes.two.props.left).toBe(101);
    propsWith(renderPage(), "onUndo").onUndo();
    const restored = propsWith(renderPage(), "onSelectElements");
    expect(restored.nodes).toEqual(before);
    expect(restored.selectedElements.map((element: { id: string; props: { left: number } }) => [element.id, element.props.left])).toEqual([["one", 0], ["two", 100]]);
  });

  it("duplicates into its parent child list with independent nested properties and exact falsy values", async () => {
    await loadCommandDocument();
    const before = propsWith(renderPage(), "nodes").nodes;
    propsWith(renderPage(), "onDuplicateElement").onDuplicateElement("one");
    const canvas = propsWith(renderPage(), "onSelectElements");
    const added = Object.keys(canvas.nodes).find((id) => !(id in before))!;
    expect(added).toBeTruthy();
    expect(canvas.nodes.ROOT.nodes).toEqual(["one", added, "two"]);
    expect(canvas.nodes[added].parent).toBe("ROOT");
    expect(canvas.nodes[added].props).toMatchObject({ opacity: 0, visible: false, custom: { label: "", stops: [{ offset: 0, enabled: false }] } });
    expect(canvas.nodes[added].props.custom).not.toBe(before.one.props.custom);
    expect(canvas.nodes[added].props.custom.stops).not.toBe(before.one.props.custom.stops);
    expect(canvas.selectedElements.map((element: { id: string }) => element.id)).toEqual([added]);
    propsWith(renderPage(), "onUndo").onUndo();
    expect(propsWith(renderPage(), "nodes").nodes).toEqual(before);
    propsWith(renderPage(), "onRedo").onRedo();
    expect(propsWith(renderPage(), "nodes").nodes.ROOT.nodes).toEqual(["one", added, "two"]);
  });

  it("deletes graph references and both selection representations before saving the resulting document", async () => {
    await loadCommandDocument();
    const canvas = propsWith(renderPage(), "onSelectElements");
    canvas.onSelectElement({ id: "one", type: "TextBox", props: canvas.nodes.one.props });
    renderPage();
    propsWith(renderPage(), "onDeleteElement").onDeleteElement("one");
    const deleted = propsWith(renderPage(), "onSelectElements");
    expect(deleted.nodes).not.toHaveProperty("one");
    expect(deleted.nodes.ROOT.nodes).toEqual(["two"]);
    expect(deleted.selectedElement).toBeNull();
    expect(deleted.selectedElements).toEqual([]);
    await vi.advanceTimersByTimeAsync(1500);
    expect(harness.save.mock.calls.at(-1)?.[0].nodes.ROOT.nodes).toEqual(["two"]);
    expect(harness.save.mock.calls.at(-1)?.[0].nodes).not.toHaveProperty("one");
  });

  it("registers two same-timestamp image insertions with distinct IDs and one undo step per insertion", async () => {
    await loadCommandDocument();
    const page = renderPage();
    const before = propsWith(page, "nodes").nodes;
    const addImage = propsWith(page, "onAddImage").onAddImage;
    const timestamp = Date.now();
    addImage("https://example.test/first.webp");
    addImage("https://example.test/second.webp");
    expect(Date.now()).toBe(timestamp);
    const inserted = propsWith(renderPage(), "onSelectElements");
    const newIds = Object.keys(inserted.nodes).filter((id) => !(id in before));
    expect(newIds).toHaveLength(2);
    expect(new Set(newIds).size).toBe(2);
    expect(inserted.nodes.ROOT.nodes).toEqual(["one", "two", ...newIds]);
    expect(newIds.map((id) => inserted.nodes[id].parent)).toEqual(["ROOT", "ROOT"]);
    expect(newIds.map((id) => inserted.nodes[id].props.imgKey)).toEqual(["https://example.test/first.webp", "https://example.test/second.webp"]);
    propsWith(renderPage(), "onUndo").onUndo();
    const firstOnly = propsWith(renderPage(), "nodes").nodes;
    expect(firstOnly.ROOT.nodes).toEqual(["one", "two", newIds[0]]);
    expect(firstOnly).not.toHaveProperty(newIds[1]);
    propsWith(renderPage(), "onUndo").onUndo();
    expect(propsWith(renderPage(), "nodes").nodes).toEqual(before);
  });

  it("resolves fresh properties after alignment and keeps fixed-module and node selections exclusive", async () => {
    await loadCommandDocument();
    const canvas = propsWith(renderPage(), "onSelectElements");
    canvas.onSelectElements(["two", "one"].map((id) => ({ id, type: "TextBox", props: canvas.nodes[id].props })));
    renderPage();
    propsWith(renderPage(), "onAlignMultipleElements").onAlignMultipleElements(["one", "two"], "right");
    const aligned = propsWith(renderPage(), "onSelectElements");
    expect(aligned.nodes.one.props.left).toBe(100);
    expect(aligned.selectedElement.props.left).toBe(100);
    // Layer panels may still hold an old object; its ID must resolve to the live node.
    aligned.onSelectElement({ id: "one", type: "TextBox", props: canvas.nodes.one.props });
    renderPage();
    const keydown = vi.mocked(window.addEventListener).mock.calls.find(([event]) => event === "keydown")?.[1] as (event: KeyboardEvent) => void;
    keydown({ key: "ArrowRight", ctrlKey: false, metaKey: false, preventDefault: vi.fn(), target: { tagName: "DIV" } } as unknown as KeyboardEvent);
    expect(propsWith(renderPage(), "nodes").nodes.one.props.left).toBe(101);
    propsWith(renderPage(), "onSelectFixedModule").onSelectFixedModule("rsvp");
    const moduleSelection = propsWith(renderPage(), "onSelectElements");
    expect(moduleSelection.selectedFixedModuleId).toBe("rsvp");
    expect(moduleSelection.selectedElements).toEqual([]);
    moduleSelection.onToggleSelectElement({ id: "one", type: "TextBox", props: canvas.nodes.one.props });
    const nodeSelection = propsWith(renderPage(), "onSelectElements");
    expect(nodeSelection.selectedFixedModuleId).toBeNull();
    expect(nodeSelection.selectedElements.map((element: { id: string }) => element.id)).toEqual(["one"]);
    expect(nodeSelection.selectedElement.props.left).toBe(101);
  });

  it("uses locked nodes as alignment anchors without moving them through keyboard commands", async () => {
    await loadCommandDocument();
    propsWith(renderPage(), "onUpdateElementProps").onUpdateElementProps("one", { locked: true });
    const canvas = propsWith(renderPage(), "onSelectElements");
    canvas.onSelectElements(["one", "two"].map((id) => ({ id, type: "TextBox", props: canvas.nodes[id].props })));
    renderPage();
    propsWith(renderPage(), "onAlignMultipleElements").onAlignMultipleElements(["one", "two"], "left");
    const aligned = propsWith(renderPage(), "onSelectElements");
    expect(aligned.nodes.one.props).toMatchObject({ left: 0, locked: true });
    expect(aligned.nodes.two.props.left).toBe(0);
    const keydown = vi.mocked(window.addEventListener).mock.calls.find(([event]) => event === "keydown")?.[1] as (event: KeyboardEvent) => void;
    keydown({ key: "ArrowRight", ctrlKey: false, metaKey: false, preventDefault: vi.fn(), target: { tagName: "DIV" } } as unknown as KeyboardEvent);
    const moved = propsWith(renderPage(), "onSelectElements");
    expect(moved.nodes.one.props).toMatchObject({ left: 0, locked: true });
    expect(moved.nodes.two.props.left).toBe(1);
    propsWith(renderPage(), "onUndo").onUndo();
    expect(propsWith(renderPage(), "nodes").nodes.two.props.left).toBe(0);
    propsWith(renderPage(), "onUndo").onUndo();
    const restored = propsWith(renderPage(), "onSelectElements");
    expect(restored.nodes.two.props.left).toBe(100);
    restored.onSelectElement({ id: "one", type: "TextBox", props: restored.nodes.one.props });
    renderPage();
    const beforeLockedMove = propsWith(renderPage(), "nodes").nodes;
    keydown({ key: "ArrowRight", ctrlKey: false, metaKey: false, preventDefault: vi.fn(), target: { tagName: "DIV" } } as unknown as KeyboardEvent);
    expect(propsWith(renderPage(), "nodes").nodes).toBe(beforeLockedMove);
    expect(propsWith(renderPage(), "canRedo").canRedo).toBe(true);
  });

  it("keeps batched selection toggles in order before React renders again", async () => {
    await loadCommandDocument();
    const canvas = propsWith(renderPage(), "onSelectElements");
    canvas.onToggleSelectElement({ id: "one", type: "TextBox", props: canvas.nodes.one.props });
    canvas.onToggleSelectElement({ id: "two", type: "TextBox", props: canvas.nodes.two.props });
    const selected = propsWith(renderPage(), "onSelectElements");
    expect(selected.selectedElements.map((element: { id: string }) => element.id)).toEqual(["one", "two"]);
    expect(selected.selectedElement.id).toBe("two");
    expect(selected.selectedFixedModuleId).toBeNull();
  });
});
