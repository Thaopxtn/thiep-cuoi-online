import { beforeEach, describe, expect, it, vi } from "vitest";

const scheduler = vi.hoisted(() => ({ cursor: 0, slots: [] as unknown[], replayedUpdaterCount: 0 }));

// The project tests hooks without a DOM. Replay state updater functions as React
// StrictMode can, while keeping commits batched until the next explicit render.
vi.mock("react", async (importOriginal) => {
  const react = await importOriginal<typeof import("react")>();
  return {
    ...react,
    useState: <T>(initial: T | (() => T)) => {
      const index = scheduler.cursor++;
      if (!(index in scheduler.slots)) scheduler.slots[index] = typeof initial === "function" ? (initial as () => T)() : initial;
      return [scheduler.slots[index], (value: T | ((previous: T) => T)) => {
        if (typeof value === "function") {
          scheduler.replayedUpdaterCount += 1;
          (value as (previous: T) => T)(scheduler.slots[index] as T);
          scheduler.slots[index] = (value as (previous: T) => T)(scheduler.slots[index] as T);
        } else scheduler.slots[index] = value;
      }];
    },
    useRef: <T>(initial: T) => {
      const index = scheduler.cursor++;
      if (!(index in scheduler.slots)) scheduler.slots[index] = { current: initial };
      return scheduler.slots[index];
    },
    useCallback: <T>(callback: T) => {
      const index = scheduler.cursor++;
      if (!(index in scheduler.slots)) scheduler.slots[index] = callback;
      return scheduler.slots[index];
    },
  };
});

import { useEditorHistory } from "../useEditorHistory";
import { equalHistorySnapshots } from "@/lib/editorHistory";

function HistoryHarness() {
  scheduler.cursor = 0;
  return useEditorHistory({ text: "A" }, { isEqual: equalHistorySnapshots });
}

describe("useEditorHistory command ordering", () => {
  beforeEach(() => { scheduler.cursor = 0; scheduler.slots = []; scheduler.replayedUpdaterCount = 0; });

  it("runs editing commands once and keeps all edits in a batch", () => {
    const history = HistoryHarness();
    let commandCount = 0;
    const command = (suffix: string) => history.setValue((previous) => {
      commandCount += 1;
      const next = { text: previous.text + suffix };
      history.record(next);
      return next;
    });
    command("B");
    command("C");
    const rendered = HistoryHarness();
    expect(commandCount).toBe(2);
    expect(scheduler.replayedUpdaterCount).toBe(0);
    expect(rendered.value.text).toBe("ABC");
    expect(rendered.history.map((entry) => entry.text)).toEqual(["A", "AB", "ABC"]);
    expect(rendered.historyIndex).toBe(2);
  });

  it("handles consecutive undo, redo and branch edits before rendering", () => {
    const history = HistoryHarness();
    history.record({ text: "B" });
    history.record({ text: "C" });
    expect(history.undo()).toEqual({ changed: true, value: { text: "B" } });
    expect(history.undo()).toEqual({ changed: true, value: { text: "A" } });
    expect(history.undo().changed).toBe(false);
    expect(history.redo().value).toEqual({ text: "B" });
    history.record({ text: "D" });
    expect(history.redo().changed).toBe(false);
    expect(HistoryHarness().history.map((entry) => entry.text)).toEqual(["A", "B", "D"]);
  });

  it("reports no-op records separately from changes and resets document history", () => {
    const history = HistoryHarness();
    expect(history.record({ text: "A" })).toBe(false);
    expect(history.record({ text: "B" })).toBe(true);
    history.reset({ text: "Other" });
    expect(history.undo().changed).toBe(false);
    expect(HistoryHarness()).toMatchObject({ value: { text: "Other" }, historyIndex: 0, history: [{ text: "Other" }] });
  });
});
