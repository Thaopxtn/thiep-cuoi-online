import { describe, expect, it } from "vitest";
import { applyEditorCommand, type EditorAlignment } from "../editorCommands";
import type { EditorNodes } from "../editorDocument";

function freezeDocument<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freezeDocument);
    Object.freeze(value);
  }
  return value;
}

function document(): EditorNodes {
  return {
    ROOT: { type: { resolvedName: "GeometricBox" }, props: { width: 500, height: 1400 }, nodes: ["one", "two"] },
    one: { parent: "ROOT", type: { resolvedName: "TextBox" }, props: { left: 10, top: 20, width: 40, height: 20, opacity: 0, hidden: false, text: "", custom: { entries: [0, false, ""] } } },
    two: { parent: "ROOT", type: { resolvedName: "TextBox" }, props: { left: 100, top: 80, width: 20, height: 40 } },
  };
}

describe("editor command transitions", () => {
  it("inserts into ROOT in document order and deep-clones incoming extension data", () => {
    const nodes = freezeDocument(document());
    const incoming = freezeDocument({ type: { resolvedName: "TextBox" }, props: { text: "", opacity: 0, hidden: false, items: [{ label: "" }] }, extension: { values: [0, false, ""] } });
    const result = applyEditorCommand(nodes, { type: "insert", id: "new", node: incoming });
    expect(result).toMatchObject({ selectedIds: ["new"], changed: true });
    expect(result.nodes.ROOT.nodes).toEqual(["one", "two", "new"]);
    expect(result.nodes.new.parent).toBe("ROOT");
    expect(result.nodes.new.props).toEqual(incoming.props);
    expect(result.nodes.new.extension).toEqual(incoming.extension);
    expect(result.nodes.new.props).not.toBe(incoming.props);
    expect(result.nodes.new.props?.items).not.toBe(incoming.props.items);
    expect(result.nodes.new.extension).not.toBe(incoming.extension);
    expect(nodes.ROOT.nodes).toEqual(["one", "two"]);
  });

  it("supports an explicit parent without a child list and flat insertion without ROOT", () => {
    const nodes = freezeDocument(document());
    const inserted = applyEditorCommand(nodes, { type: "insert", id: "new", parentId: "two", node: { parent: "one", props: { text: "Child" } } });
    expect(inserted.nodes.new.parent).toBe("two");
    expect(inserted.nodes.two.nodes).toEqual(["new"]);
    expect(inserted.nodes.ROOT).toBe(nodes.ROOT);
    const flat = applyEditorCommand({}, { type: "insert", id: "new", node: { props: { text: "Flat" } } });
    expect(flat.nodes.new.parent).toBeUndefined();
    expect(Object.keys(flat.nodes)).toEqual(["new"]);
  });

  it("rejects insertion collisions and missing parents without changing any source data", () => {
    const nodes = freezeDocument(document());
    for (const id of ["one", "ROOT", "__proto__", "constructor", "prototype", ""]) {
      expect(() => applyEditorCommand(nodes, { type: "insert", id, node: { props: { text: "New" } } })).toThrow(RangeError);
    }
    expect(() => applyEditorCommand(nodes, { type: "insert", id: "new", parentId: "missing", node: {} })).toThrow(RangeError);
    expect(() => applyEditorCommand(nodes, { type: "insert", id: "new", node: { parent: "missing" } })).toThrow(RangeError);
    expect(nodes.ROOT.nodes).toEqual(["one", "two"]);
    expect(Object.keys(nodes)).toEqual(["ROOT", "one", "two"]);
  });

  it("protects ROOT and ignores missing, duplicate and inherited IDs", () => {
    const nodes = freezeDocument(document());
    for (const type of ["delete", "duplicate"] as const) {
      const result = applyEditorCommand(nodes, { type, ids: ["ROOT", "ROOT", "missing", "constructor"] });
      expect(result).toMatchObject({ selectedIds: [], changed: false, idMap: {} });
      expect(result.nodes).toBe(nodes);
    }
  });

  it("moves a multi-selection once per ID and converts numeric geometry without changing content", () => {
    const original = document();
    original.one.props = { ...original.one.props, top: "20", left: "10" };
    const nodes = freezeDocument(original);
    const result = applyEditorCommand(nodes, { type: "move", ids: ["ROOT", "one", "two", "one", "missing"], delta: { x: -5, y: 10 } });
    expect(result.selectedIds).toEqual(["one", "two"]);
    expect(result.changed).toBe(true);
    expect(result.nodes.one.props).toMatchObject({ left: 5, top: 30, opacity: 0, hidden: false, text: "", custom: { entries: [0, false, ""] } });
    expect(result.nodes.two.props).toMatchObject({ left: 95, top: 90 });
    expect(result.nodes.ROOT).toBe(nodes.ROOT);
    expect(nodes.one.props).toMatchObject({ left: "10", top: "20" });
  });

  it("keeps movement atomic and ignores non-finite deltas", () => {
    const nodes = freezeDocument(document());
    for (const delta of [{ x: NaN, y: 1 }, { x: 0, y: Infinity }, { x: 0, y: 0 }]) {
      expect(applyEditorCommand(nodes, { type: "move", ids: ["one", "two"], delta }).nodes).toBe(nodes);
    }
    const malformed = { ...nodes, one: { props: { top: "bad", left: Infinity, width: 0, height: 0 } } };
    const moved = applyEditorCommand(malformed, { type: "move", ids: ["one"], delta: { x: 1, y: 2 } });
    expect(moved.nodes.one.props).toEqual({ left: 1, top: 2, width: 0, height: 0 });
  });

  it("preserves locked selection while moving only layers allowed by editor policy", () => {
    const original = document();
    original.one.props = { ...original.one.props, locked: true };
    const nodes = freezeDocument(original);
    const result = applyEditorCommand(nodes, { type: "move", ids: ["one", "two"], delta: { x: 10, y: 1 } }, { canTransform: (_id, node) => !node.props?.locked });
    expect(result.selectedIds).toEqual(["one", "two"]);
    expect(result.nodes.one).toBe(nodes.one);
    expect(result.nodes.two.props).toMatchObject({ left: 110, top: 81 });
  });

  it("does not write non-finite geometry when finite values overflow", () => {
    const nodes = freezeDocument({ one: { props: { left: Number.MAX_VALUE, top: 0 } } });
    expect(applyEditorCommand(nodes, { type: "move", ids: ["one"], delta: { x: Number.MAX_VALUE, y: 1 } }).nodes).toBe(nodes);
    expect(() => applyEditorCommand(nodes, { type: "duplicate", ids: ["one"], offset: { x: Number.MAX_VALUE, y: 1 } }, { idFactory: () => "copy" })).toThrow(RangeError);
    expect(Object.keys(nodes)).toEqual(["one"]);
  });

  it.each<[EditorAlignment, number, number, number, number]>([
    ["left", 10, 20, 10, 80], ["center", 45, 20, 55, 80], ["right", 80, 20, 100, 80],
    ["top", 10, 20, 100, 20], ["middle", 10, 60, 100, 50], ["bottom", 10, 100, 100, 80],
  ])("aligns %s using the selected bounds without modifying frozen snapshots", (alignment, firstLeft, firstTop, secondLeft, secondTop) => {
    const nodes = freezeDocument(document());
    const result = applyEditorCommand(nodes, { type: "align", ids: ["ROOT", "one", "two", "one"], alignment });
    expect(result.selectedIds).toEqual(["one", "two"]);
    expect(result.nodes.one.props).toMatchObject({ left: firstLeft, top: firstTop, width: 40, height: 20 });
    expect(result.nodes.two.props).toMatchObject({ left: secondLeft, top: secondTop, width: 20, height: 40 });
    expect(nodes.one.props).toMatchObject({ left: 10, top: 20 });
    expect(nodes.two.props).toMatchObject({ left: 100, top: 80 });
  });

  it("uses locked layers as alignment anchors without writing to them", () => {
    const original = document();
    original.one.props = { ...original.one.props, locked: true };
    const nodes = freezeDocument(original);
    const aligned = applyEditorCommand(nodes, { type: "align", ids: ["one", "two"], alignment: "left" }, { canTransform: (_id, node) => !node.props?.locked });
    expect(aligned.nodes.one).toBe(nodes.one);
    expect(aligned.nodes.two.props?.left).toBe(10);
    expect(aligned.selectedIds).toEqual(["one", "two"]);
    expect(applyEditorCommand(nodes, { type: "align", ids: ["one"], alignment: "left" }).nodes).toBe(nodes);
  });

  it("deletes an owned graph and cleans incoming child/slot references without removing flat unrelated layers", () => {
    const original = document();
    original.one.nodes = ["child", "foreign"];
    original.one.linkedNodes = { heading: "linked" };
    original.child = { parent: "one", props: { text: "Owned child" } };
    original.linked = { parent: "one", props: { text: "Owned slot" } };
    original.omitted = { parent: "one", props: { text: "Child omitted from graph list" } };
    original.foreign = { parent: "two", props: { text: "Shared reference belongs elsewhere" } };
    original.unrelated = { props: { text: "Valid flat orphan", hidden: false } };
    original.two.linkedNodes = { foreign: "foreign", removed: "child" };
    const nodes = freezeDocument(original);
    const result = applyEditorCommand(nodes, { type: "delete", ids: ["ROOT", "one", "child", "one", "missing"] });
    expect(Object.keys(result.nodes).sort()).toEqual(["ROOT", "foreign", "two", "unrelated"]);
    expect(result.nodes.ROOT.nodes).toEqual(["two"]);
    expect(result.nodes.two.linkedNodes).toEqual({ foreign: "foreign" });
    expect(result.nodes.unrelated).toBe(nodes.unrelated);
    expect(result.nodes.foreign).toBe(nodes.foreign);
    expect(result.selectedIds).toEqual([]);
    expect(nodes.ROOT.nodes).toEqual(["one", "two"]);
    expect(nodes.child).toBeDefined();
  });

  it("terminates ownership cycles, never traversing ROOT", () => {
    const nodes = freezeDocument({
      ROOT: { nodes: ["one"], props: { height: 1400 } },
      one: { parent: "two", nodes: ["two", "ROOT"], props: { top: 0 } },
      two: { parent: "one", nodes: ["one"], props: { top: 20 } },
    });
    const removed = applyEditorCommand(nodes, { type: "delete", ids: ["one"] });
    expect(Object.keys(removed.nodes)).toEqual(["ROOT"]);
    expect(removed.nodes.ROOT).toEqual({ ...nodes.ROOT, nodes: [] });
    const copied = applyEditorCommand(nodes, { type: "duplicate", ids: ["one"] }, { idFactory: (id) => `${id}_copy` });
    expect(copied.nodes.one_copy.nodes).toEqual(["two_copy"]);
    expect(copied.nodes.two_copy.nodes).toEqual(["one_copy"]);
    expect(copied.nodes.ROOT.nodes).toEqual(["one", "one_copy"]);
  });

  it("duplicates overlapping selected graphs once, remapping ownership and cloning nested extension data", () => {
    const original = document();
    original.one.nodes = ["child", "missing", "foreign"];
    original.one.linkedNodes = { heading: "linked", missing: "missing" };
    original.one.extension = { active: false, values: [0, "", { label: "Original" }] };
    original.one.props = { ...original.one.props, top: "20", left: "10" };
    original.child = { parent: "one", props: { text: "Child", top: 40, left: 30 } };
    original.linked = { parent: "one", props: { text: "Linked", top: 50, left: 35 } };
    original.omitted = { parent: "one", props: { top: 0, left: 0 } };
    original.foreign = { parent: "two", props: { text: "External" } };
    const nodes = freezeDocument(original);
    const result = applyEditorCommand(nodes, { type: "duplicate", ids: ["one", "child", "one"], offset: { x: 24, y: 24 } }, { idFactory: (id) => `${id}_copy` });
    expect(result.selectedIds).toEqual(["one_copy", "child_copy"]);
    expect(Object.keys(result.idMap).sort()).toEqual(["child", "linked", "omitted", "one"]);
    expect(result.nodes.ROOT.nodes).toEqual(["one", "one_copy", "two"]);
    expect(result.nodes.one_copy.nodes).toEqual(["child_copy", "foreign"]);
    expect(result.nodes.one_copy.linkedNodes).toEqual({ heading: "linked_copy" });
    expect(result.nodes.one_copy.parent).toBe("ROOT");
    expect(result.nodes.child_copy.parent).toBe("one_copy");
    expect(result.nodes.one_copy.props).toMatchObject({ left: 34, top: 44, opacity: 0, hidden: false, text: "", custom: { entries: [0, false, ""] } });
    expect(result.nodes.child_copy.props).toMatchObject({ left: 54, top: 64 });
    expect(result.nodes.omitted_copy.props).toMatchObject({ left: 24, top: 24 });
    expect(result.nodes.one_copy.props?.custom).not.toBe(nodes.one.props?.custom);
    expect(result.nodes.one_copy.extension).toEqual(nodes.one.extension);
    expect(result.nodes.one_copy.extension).not.toBe(nodes.one.extension);
    expect(result.nodes.foreign).toBe(nodes.foreign);
    const copiedExtension = result.nodes.one_copy.extension as { values: unknown[] };
    copiedExtension.values.push("Only copy changes");
    expect(nodes.one.extension).toEqual({ active: false, values: [0, "", { label: "Original" }] });
    expect(nodes.ROOT.nodes).toEqual(["one", "two"]);
  });

  it("keeps flat legacy documents flat when no child list exists", () => {
    const nodes = freezeDocument({ ROOT: { props: { height: 1400 } }, one: { parent: "ROOT", props: { text: "A" } }, orphan: { props: { text: "B" } } });
    const copied = applyEditorCommand(nodes, { type: "duplicate", ids: ["one"] }, { idFactory: () => "copy" });
    expect(copied.nodes.ROOT).toBe(nodes.ROOT);
    expect(copied.nodes.orphan).toBe(nodes.orphan);
    expect(copied.nodes.copy.props).toMatchObject({ text: "A", top: 20, left: 20 });
    expect(copied.nodes.copy.parent).toBe("ROOT");
  });

  it("aborts conflicting ID allocation atomically instead of overwriting a layer", () => {
    const nodes = freezeDocument(document());
    expect(() => applyEditorCommand(nodes, { type: "duplicate", ids: ["one"] })).toThrow(TypeError);
    for (const id of ["two", "ROOT", "__proto__", "constructor", "prototype", ""]) {
      expect(() => applyEditorCommand(nodes, { type: "duplicate", ids: ["one"] }, { idFactory: () => id })).toThrow(RangeError);
    }
    expect(() => applyEditorCommand(nodes, { type: "duplicate", ids: ["one", "two"] }, { idFactory: () => "same-copy" })).toThrow(RangeError);
    expect(Object.keys(nodes)).toEqual(["ROOT", "one", "two"]);
  });
});
