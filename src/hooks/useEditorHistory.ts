"use client";

import { useCallback, useRef, useState, type SetStateAction } from "react";
import {
  createEditorHistory,
  editorHistoryReducer,
  type EditorHistoryAction,
  type HistoryEquality,
} from "@/lib/editorHistory";

interface EditorHistoryOptions<T> {
  readonly limit?: number;
  readonly isEqual?: HistoryEquality<T>;
}

/**
 * Document transitions run once in event/effect handlers, outside React's state
 * updater replay. A ref keeps several edits in one batch in their original order.
 * Callers must treat each snapshot as immutable and call setters outside rendering.
 */
export function useEditorHistory<T>(initialValue: T, options: EditorHistoryOptions<T> = {}) {
  const [state, setState] = useState(() => createEditorHistory(initialValue, options.limit));
  const current = useRef(state);
  const equality = useRef(options.isEqual ?? Object.is);
  equality.current = options.isEqual ?? Object.is;

  const transition = useCallback((action: EditorHistoryAction<T>) => {
    const previous = current.current;
    const next = editorHistoryReducer(previous, action, equality.current);
    if (next !== previous) {
      current.current = next;
      setState(next);
    }
    return { previous, next };
  }, []);

  // Compatibility for existing editing commands. Recording remains explicit so
  // loading a document or restoring history never creates an extra undo step.
  const setValue = useCallback((action: SetStateAction<T>) => {
    const value = typeof action === "function"
      ? (action as (previous: T) => T)(current.current.value)
      : action;
    transition({ type: "replace", value });
  }, [transition]);

  const record = useCallback((value: T) => {
    const { previous, next } = transition({ type: "record", value });
    return previous.entries !== next.entries;
  }, [transition]);

  const reset = useCallback((value: T) => {
    transition({ type: "reset", value });
  }, [transition]);

  const undo = useCallback(() => {
    const { previous, next } = transition({ type: "undo" });
    return { changed: previous !== next, value: next.value };
  }, [transition]);

  const redo = useCallback(() => {
    const { previous, next } = transition({ type: "redo" });
    return { changed: previous !== next, value: next.value };
  }, [transition]);

  return { value: state.value, history: state.entries, historyIndex: state.index, setValue, record, reset, undo, redo };
}
