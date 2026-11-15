import { getEditorNumber, type EditorNode, type EditorNodes } from "./editorDocument";

export type EditorAlignment = "left" | "center" | "right" | "top" | "middle" | "bottom";

export type EditorCommand =
  | { type: "insert"; id: string; node: EditorNode; parentId?: string }
  | { type: "delete"; ids: readonly string[] }
  | { type: "duplicate"; ids: readonly string[]; offset?: { x: number; y: number } }
  | { type: "move"; ids: readonly string[]; delta: { x: number; y: number } }
  | { type: "align"; ids: readonly string[]; alignment: EditorAlignment };

export interface EditorCommandOptions {
  idFactory?: (sourceId: string) => string;
  /** Position-lock policy belongs to the editor; locked layers can still anchor alignment. */
  canTransform?: (id: string, node: EditorNode) => boolean;
}

export interface EditorCommandResult {
  nodes: EditorNodes;
  selectedIds: string[];
  changed: boolean;
  idMap: Record<string, string>;
}

function hasNode(nodes: EditorNodes, id: string): boolean {
  return Object.prototype.hasOwnProperty.call(nodes, id) && Boolean(nodes[id])
    && typeof nodes[id] === "object" && !Array.isArray(nodes[id]);
}

function selectedIds(nodes: EditorNodes, ids: readonly string[]): string[] {
  return Array.from(new Set(ids)).filter((id) => id !== "ROOT" && hasNode(nodes, id));
}

function assertNewNodeId(nodes: EditorNodes, id: string): void {
  if (!id || ["ROOT", "__proto__", "prototype", "constructor"].includes(id) || Object.prototype.hasOwnProperty.call(nodes, id)) {
    throw new RangeError("Node IDs must be new, unique and non-reserved");
  }
}

function insertNode(nodes: EditorNodes, command: Extract<EditorCommand, { type: "insert" }>): EditorCommandResult {
  assertNewNodeId(nodes, command.id);
  const parentId = command.parentId ?? command.node.parent ?? (hasNode(nodes, "ROOT") ? "ROOT" : undefined);
  if (parentId !== undefined && !hasNode(nodes, parentId)) throw new RangeError("Inserted nodes require an existing parent");
  const inserted = structuredClone(command.node);
  if (parentId !== undefined) inserted.parent = parentId;
  const next = { ...nodes, [command.id]: inserted };
  if (parentId !== undefined) {
    const parent = nodes[parentId];
    next[parentId] = { ...parent, nodes: [...(Array.isArray(parent.nodes) ? parent.nodes : []), command.id] };
  }
  return { nodes: next, selectedIds: [command.id], changed: true, idMap: {} };
}

/** Children remain flat canvas layers; following ownership must never discard unrelated orphans. */
function ownedSubgraph(nodes: EditorNodes, ids: string[]): Set<string> {
  const owned = new Set<string>();
  const pending = [...ids];
  const childrenByParent = new Map<string, string[]>();
  Object.entries(nodes).forEach(([id, node]) => {
    if (typeof node?.parent === "string") {
      const siblings = childrenByParent.get(node.parent) ?? [];
      siblings.push(id);
      childrenByParent.set(node.parent, siblings);
    }
  });
  while (pending.length > 0) {
    const id = pending.pop();
    if (!id || id === "ROOT" || owned.has(id) || !hasNode(nodes, id)) continue;
    owned.add(id);
    const node = nodes[id];
    const references = [...(node.nodes ?? []), ...Object.values(node.linkedNodes ?? {}), ...(childrenByParent.get(id) ?? [])];
    references.forEach((childId) => {
      if (!hasNode(nodes, childId)) return;
      const parent = nodes[childId].parent;
      // An explicit parent wins over a foreign/shared reference in legacy data.
      if (parent === undefined || parent === id) pending.push(childId);
    });
  }
  return owned;
}

function removeNodes(nodes: EditorNodes, ids: string[]): EditorCommandResult {
  const removed = ownedSubgraph(nodes, ids);
  if (removed.size === 0) return { nodes, selectedIds: [], changed: false, idMap: {} };
  const next = { ...nodes };
  removed.forEach((id) => { delete next[id]; });
  Object.entries(next).forEach(([id, node]) => {
    if (!hasNode(next, id)) return;
    let updated = node;
    if (Array.isArray(node.nodes) && node.nodes.some((childId) => removed.has(childId))) {
      updated = { ...updated, nodes: node.nodes.filter((childId) => !removed.has(childId)) };
    }
    if (Object.values(node.linkedNodes ?? {}).some((childId) => removed.has(childId))) {
      updated = { ...updated, linkedNodes: Object.fromEntries(Object.entries(node.linkedNodes ?? {}).filter(([, childId]) => !removed.has(childId))) };
    }
    if (updated !== node) next[id] = updated;
  });
  return { nodes: next, selectedIds: [], changed: true, idMap: {} };
}

function duplicateNodes(nodes: EditorNodes, ids: string[], offset: { x: number; y: number }, idFactory?: EditorCommandOptions["idFactory"]): EditorCommandResult {
  if (ids.length === 0) return { nodes, selectedIds: [], changed: false, idMap: {} };
  if (!idFactory) throw new TypeError("Duplicate commands require an ID factory");
  const owned = ownedSubgraph(nodes, ids);
  // Preserve document order rather than traversal order when selected ancestors overlap.
  const originals = Object.keys(nodes).filter((id) => owned.has(id));
  const mapping = new Map<string, string>();
  const allocated = new Set<string>();
  originals.forEach((id) => {
    const copyId = idFactory(id);
    assertNewNodeId(nodes, copyId);
    if (allocated.has(copyId)) throw new RangeError("Duplicate node IDs must be unique within the command");
    mapping.set(id, copyId);
    allocated.add(copyId);
  });
  const next = { ...nodes };
  originals.forEach((id) => {
    // Stored documents are structured data. Deep cloning also preserves false/0/empty,
    // undefined extensions and shared references within each node without JSON loss.
    const copy = structuredClone(nodes[id]);
    const copyId = mapping.get(id)!;
    copy.props = {
      ...copy.props,
      top: getEditorNumber(copy.props?.top, 0) + offset.y,
      left: getEditorNumber(copy.props?.left, 0) + offset.x,
    };
    if (!Number.isFinite(copy.props.top) || !Number.isFinite(copy.props.left)) {
      throw new RangeError("Duplicate offsets must produce finite coordinates");
    }
    if (copy.parent && mapping.has(copy.parent)) copy.parent = mapping.get(copy.parent)!;
    if (copy.nodes) copy.nodes = copy.nodes.filter((childId) => childId !== "ROOT" && hasNode(nodes, childId)).map((childId) => mapping.get(childId) ?? childId);
    if (copy.linkedNodes) {
      copy.linkedNodes = Object.fromEntries(Object.entries(copy.linkedNodes)
        .filter(([, childId]) => childId !== "ROOT" && hasNode(nodes, childId))
        .map(([slot, childId]) => [slot, mapping.get(childId) ?? childId]));
    }
    next[copyId] = copy;
  });
  Object.entries(nodes).forEach(([parentId, parent]) => {
    if (owned.has(parentId) || !hasNode(nodes, parentId) || !Array.isArray(parent.nodes)) return;
    let changed = false;
    const inserted = new Set<string>();
    const children = parent.nodes.flatMap((childId) => {
      const copyId = mapping.get(childId);
      if (!copyId || inserted.has(childId)) return [childId];
      changed = true;
      inserted.add(childId);
      return [childId, copyId];
    });
    // Some valid flat layers are omitted from a legacy parent's child list.
    originals.forEach((id) => {
      if (nodes[id].parent === parentId && !inserted.has(id)) {
        children.push(mapping.get(id)!);
        changed = true;
      }
    });
    if (changed) next[parentId] = { ...parent, nodes: children };
  });
  return { nodes: next, selectedIds: ids.map((id) => mapping.get(id)!), changed: true, idMap: Object.fromEntries(mapping) };
}

function transformNodes(nodes: EditorNodes, ids: string[], transform: (node: EditorNode) => { left: number; top: number }, canTransform?: EditorCommandOptions["canTransform"]): EditorCommandResult {
  let next = nodes;
  ids.forEach((id) => {
    const node = nodes[id];
    if (canTransform && !canTransform(id, node)) return;
    const position = transform(node);
    if (!Number.isFinite(position.left) || !Number.isFinite(position.top)) return;
    if (getEditorNumber(node.props?.left, 0) === position.left && getEditorNumber(node.props?.top, 0) === position.top) return;
    if (next === nodes) next = { ...nodes };
    next[id] = { ...node, props: { ...node.props, ...position } };
  });
  return { nodes: next, selectedIds: ids, changed: next !== nodes, idMap: {} };
}

/** One command yields one immutable document transition, regardless of selection size. */
export function applyEditorCommand(nodes: EditorNodes, command: EditorCommand, options: EditorCommandOptions = {}): EditorCommandResult {
  if (command.type === "insert") return insertNode(nodes, command);
  const ids = selectedIds(nodes, command.ids);
  if (command.type === "delete") return removeNodes(nodes, ids);
  if (command.type === "duplicate") {
    const offset = command.offset ?? { x: 20, y: 20 };
    if (!Number.isFinite(offset.x) || !Number.isFinite(offset.y)) return { nodes, selectedIds: ids, changed: false, idMap: {} };
    return duplicateNodes(nodes, ids, offset, options.idFactory);
  }
  if (command.type === "move") {
    const { x, y } = command.delta;
    if (!Number.isFinite(x) || !Number.isFinite(y) || (x === 0 && y === 0)) return { nodes, selectedIds: ids, changed: false, idMap: {} };
    return transformNodes(nodes, ids, (node) => ({ left: getEditorNumber(node.props?.left, 0) + x, top: getEditorNumber(node.props?.top, 0) + y }), options.canTransform);
  }
  if (ids.length < 2) return { nodes, selectedIds: ids, changed: false, idMap: {} };
  const bounds = ids.map((id) => {
    const props = nodes[id].props;
    return { left: getEditorNumber(props?.left, 0), top: getEditorNumber(props?.top, 0), width: Math.max(0, getEditorNumber(props?.width, 100)), height: Math.max(0, getEditorNumber(props?.height, 100)) };
  });
  const minLeft = Math.min(...bounds.map((box) => box.left));
  const maxRight = Math.max(...bounds.map((box) => box.left + box.width));
  const minTop = Math.min(...bounds.map((box) => box.top));
  const maxBottom = Math.max(...bounds.map((box) => box.top + box.height));
  return transformNodes(nodes, ids, (node) => {
    const props = node.props;
    let left = getEditorNumber(props?.left, 0);
    let top = getEditorNumber(props?.top, 0);
    const width = Math.max(0, getEditorNumber(props?.width, 100));
    const height = Math.max(0, getEditorNumber(props?.height, 100));
    switch (command.alignment) {
      case "left": left = minLeft; break;
      case "center": left = Math.round((minLeft + maxRight - width) / 2); break;
      case "right": left = maxRight - width; break;
      case "top": top = minTop; break;
      case "middle": top = Math.round((minTop + maxBottom - height) / 2); break;
      case "bottom": top = maxBottom - height; break;
    }
    return { left, top };
  }, options.canTransform);
}
