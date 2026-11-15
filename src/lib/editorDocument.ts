/** Stored node shape shared by editing commands and renderers; no format migration. */
export interface EditorNode {
  props?: Record<string, unknown>;
  type?: unknown;
  parent?: string;
  nodes?: string[];
  linkedNodes?: Record<string, string>;
  [key: string]: unknown;
}

export type EditorNodes = Record<string, EditorNode>;

export interface EditorSelectedElement {
  id: string;
  type: string;
  props: Record<string, unknown>;
}

export function getEditorNodeType(node: EditorNode): string {
  if (typeof node.type === "string") return node.type;
  if (node.type && typeof node.type === "object" && "resolvedName" in node.type && typeof node.type.resolvedName === "string") return node.type.resolvedName;
  return "Widget";
}

/** CSS geometry accepts numeric strings, but never NaN, infinity or empty values. */
export function getEditorNumber(value: unknown, fallback: number): number {
  if (typeof value !== "number" && (typeof value !== "string" || value.trim() === "")) return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

/** Flat documents may contain valid layers absent from ROOT.nodes. Keep them. */
export function getEditorLayers<T extends EditorNode>(nodes: Record<string, T>, includeHidden = false): Array<{ id: string; node: T; zIndex: number }> {
  return Object.entries(nodes)
    .filter(([id, node]) => id !== "ROOT" && node && typeof node === "object" && !Array.isArray(node) && (includeHidden || !node.props?.hidden))
    .map(([id, node]) => ({ id, node, zIndex: getEditorNumber(node.props?.zIndex, 1) }))
    .sort((left, right) => left.zIndex - right.zIndex);
}

export function resolveEditorSelection(nodes: EditorNodes, ids: readonly string[]): EditorSelectedElement[] {
  return Array.from(new Set(ids)).flatMap((id) => {
    const node = nodes[id];
    return id !== "ROOT" && Object.prototype.hasOwnProperty.call(nodes, id) && node && typeof node === "object" && !Array.isArray(node)
      ? [{ id, type: getEditorNodeType(node), props: node.props ?? {} }] : [];
  });
}
