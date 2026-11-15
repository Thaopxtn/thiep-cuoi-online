"use client";

import { useCallback, useRef, useState } from "react";

interface EditorSelection<TModule extends string> {
  nodeIds: string[];
  moduleId: TModule | null;
}

/** IDs are the source of truth; properties are always read from the current document. */
export function useEditorSelection<TModule extends string>() {
  const [state, setState] = useState<EditorSelection<TModule>>({ nodeIds: [], moduleId: null });
  const current = useRef(state);
  const commit = useCallback((next: EditorSelection<TModule>) => {
    if (current.current.moduleId === next.moduleId && current.current.nodeIds.length === next.nodeIds.length && current.current.nodeIds.every((id, index) => id === next.nodeIds[index])) return;
    current.current = next;
    setState(next);
  }, []);
  const selectNodes = useCallback((ids: readonly string[]) => {
    commit({ nodeIds: Array.from(new Set(ids)).filter((id) => id !== "ROOT" && id.length > 0), moduleId: null });
  }, [commit]);
  const toggleNode = useCallback((id: string) => {
    if (!id || id === "ROOT") return;
    const ids = current.current.nodeIds;
    selectNodes(ids.includes(id) ? ids.filter((selected) => selected !== id) : [...ids, id]);
  }, [selectNodes]);
  const selectModule = useCallback((moduleId: TModule | null) => {
    commit({ nodeIds: moduleId === null ? current.current.nodeIds : [], moduleId });
  }, [commit]);
  const reconcile = useCallback((existingIds: ReadonlySet<string>) => {
    commit({ ...current.current, nodeIds: current.current.nodeIds.filter((id) => existingIds.has(id)) });
  }, [commit]);
  return { ...state, selectNodes, toggleNode, selectModule, reconcile };
}
