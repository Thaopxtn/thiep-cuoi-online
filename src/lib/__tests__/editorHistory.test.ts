import { describe, expect, it } from "vitest";
import { createEditorHistory, editorHistoryReducer, equalHistorySnapshots } from "../editorHistory";

describe("editor document history", () => {
  it("undoes and redoes immutable snapshots without changing the original state", () => {
    const initial = Object.freeze({ text: "Ban đầu", enabled: false });
    const original = createEditorHistory(initial);
    const changed = editorHistoryReducer(original, { type: "record", value: { text: "Đã sửa", enabled: false } });
    const undone = editorHistoryReducer(changed, { type: "undo" });
    const redone = editorHistoryReducer(undone, { type: "redo" });
    expect(original).toMatchObject({ value: initial, entries: [initial], index: 0 });
    expect(undone.value).toBe(initial);
    expect(redone.value.text).toBe("Đã sửa");
    expect(editorHistoryReducer(original, { type: "undo" })).toBe(original);
    expect(editorHistoryReducer(redone, { type: "redo" })).toBe(redone);
  });

  it("drops only the redo branch when an edit follows undo", () => {
    let state = createEditorHistory("A");
    state = editorHistoryReducer(state, { type: "record", value: "B" });
    state = editorHistoryReducer(state, { type: "record", value: "C" });
    state = editorHistoryReducer(state, { type: "undo" });
    state = editorHistoryReducer(state, { type: "record", value: "D" });
    expect(state.entries).toEqual(["A", "B", "D"]);
    expect(editorHistoryReducer(state, { type: "redo" })).toBe(state);
    expect(editorHistoryReducer(state, { type: "undo" }).value).toBe("B");
  });

  it("ignores equivalent documents and preserves redo after a no-op", () => {
    let state = createEditorHistory({ photo: { visible: false, opacity: 0, label: "", frames: [] } });
    state = editorHistoryReducer(state, { type: "record", value: { photo: { visible: true, opacity: 0, label: "", frames: [] } } }, equalHistorySnapshots);
    state = editorHistoryReducer(state, { type: "undo" }, equalHistorySnapshots);
    const entries = state.entries;
    state = editorHistoryReducer(state, { type: "record", value: { photo: { frames: [], label: "", opacity: 0, visible: false } } }, equalHistorySnapshots);
    expect(state.entries).toBe(entries);
    expect(state.index).toBe(0);
    expect(editorHistoryReducer(state, { type: "redo" }).value.photo.visible).toBe(true);
  });

  it("bounds memory to the newest 100 snapshots with a valid cursor", () => {
    let state = createEditorHistory(0);
    for (let value = 1; value <= 150; value += 1) state = editorHistoryReducer(state, { type: "record", value });
    expect(state.entries).toHaveLength(100);
    expect(state.entries[0]).toBe(51);
    expect(state.index).toBe(99);
    for (let step = 0; step < 150; step += 1) state = editorHistoryReducer(state, { type: "undo" });
    expect(state.value).toBe(51);
    expect(state.index).toBe(0);
  });

  it("resets on document load and does not turn a replacement into an undo step", () => {
    let state = createEditorHistory("original", 3);
    state = editorHistoryReducer(state, { type: "replace", value: "pending" });
    expect(state.entries).toEqual(["original"]);
    expect(state.value).toBe("pending");
    state = editorHistoryReducer(state, { type: "record", value: "pending" });
    expect(state.entries).toEqual(["original", "pending"]);
    state = editorHistoryReducer(state, { type: "reset", value: "another document" });
    expect(state).toMatchObject({ entries: ["another document"], index: 0, limit: 3 });
  });

  it("rejects invalid limits and keeps meaningful data differences", () => {
    for (const limit of [0, -1, 1.5, Infinity, NaN]) expect(() => createEditorHistory({}, limit)).toThrow(RangeError);
    expect(equalHistorySnapshots({ value: undefined }, {})).toBe(false);
    expect(equalHistorySnapshots({ value: false }, { value: 0 })).toBe(false);
    expect(equalHistorySnapshots([1, 2], [2, 1])).toBe(false);
    expect(equalHistorySnapshots(new Date(0), new Date(1))).toBe(false);
  });
});
