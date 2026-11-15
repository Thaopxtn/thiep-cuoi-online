/** Immutable, bounded snapshots of the editable document, independent of React. */
export interface EditorHistory<T> {
  readonly value: T;
  readonly entries: readonly T[];
  readonly index: number;
  readonly limit: number;
}

export type EditorHistoryAction<T> =
  | { readonly type: "replace"; readonly value: T }
  | { readonly type: "record"; readonly value: T }
  | { readonly type: "reset"; readonly value: T }
  | { readonly type: "undo" }
  | { readonly type: "redo" };

export type HistoryEquality<T> = (left: T, right: T) => boolean;

export function createEditorHistory<T>(value: T, limit = 100): EditorHistory<T> {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError("History limit must be a positive integer");
  }
  return { value, entries: [value], index: 0, limit };
}

/** Compare acyclic plain document data without serializing or losing false/0/undefined. */
export function equalHistorySnapshots(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (left === null || right === null || typeof left !== "object" || typeof right !== "object") return false;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length
      && left.every((value, index) => equalHistorySnapshots(value, right[index]));
  }
  if (Object.getPrototypeOf(left) !== Object.prototype || Object.getPrototypeOf(right) !== Object.prototype) return false;
  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const keys = Object.keys(leftRecord);
  return keys.length === Object.keys(rightRecord).length && keys.every((key) =>
    Object.prototype.hasOwnProperty.call(rightRecord, key) && equalHistorySnapshots(leftRecord[key], rightRecord[key]));
}

export function editorHistoryReducer<T>(
  state: EditorHistory<T>,
  action: EditorHistoryAction<T>,
  isEqual: HistoryEquality<T> = Object.is,
): EditorHistory<T> {
  switch (action.type) {
    case "replace":
      return Object.is(state.value, action.value) ? state : { ...state, value: action.value };
    case "reset":
      return createEditorHistory(action.value, state.limit);
    case "record": {
      if (isEqual(state.entries[state.index], action.value)) {
        return Object.is(state.value, action.value) ? state : { ...state, value: action.value };
      }
      const entries = [...state.entries.slice(0, state.index + 1), action.value].slice(-state.limit);
      return { ...state, value: action.value, entries, index: entries.length - 1 };
    }
    case "undo": {
      if (state.index === 0) return state;
      const index = state.index - 1;
      return { ...state, index, value: state.entries[index] };
    }
    case "redo": {
      if (state.index === state.entries.length - 1) return state;
      const index = state.index + 1;
      return { ...state, index, value: state.entries[index] };
    }
  }
}
