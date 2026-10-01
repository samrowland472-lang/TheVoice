import { uid } from "./id";
import { isGroup, type DesignNode, type GroupNode, type NodeKind } from "./types";

export { isGroup };
export type { GroupNode };

export function makeGroup(patch: Partial<GroupNode> & { x: number; y: number; w: number; h: number }): GroupNode {
  return {
    id: uid("gr"),
    name: "Group",
    kind: "group",
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    blend: "source-over",
    fill: "transparent",
    stroke: "transparent",
    strokeWidth: 0,
    strokeDash: 0,
    strokeDashOffset: 0,
    lineCap: "round",
    lineJoin: "round",
    miterLimit: 4,
    radius: 0,
    shadow: null,
    ...patch,
  };
}

export function childrenOf(nodes: DesignNode[], parentId: string): DesignNode[] {
  return nodes.filter((n) => n.parentId === parentId);
}

export function descendantIds(nodes: DesignNode[], rootId: string): string[] {
  const out: string[] = [];
  const walk = (id: string) => {
    for (const child of childrenOf(nodes, id)) {
      out.push(child.id);
      walk(child.id);
    }
  };
  walk(rootId);
  return out;
}

export function ancestorHidden(nodes: DesignNode[], id: string): boolean {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  let cur = byId.get(id);
  const seen = new Set<string>();
  while (cur?.parentId) {
    if (seen.has(cur.parentId)) break;
    seen.add(cur.parentId);
    const parent = byId.get(cur.parentId);
    if (!parent) break;
    if (!parent.visible) return true;
    cur = parent;
  }
  return false;
}

export function nodeBounds(n: DesignNode) {
  return { x: n.x, y: n.y, w: n.w, h: n.h };
}

export function unionBounds(nodes: DesignNode[]): { x: number; y: number; w: number; h: number } | null {
  if (!nodes.length) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.w);
    maxY = Math.max(maxY, n.y + n.h);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

export interface LayerRow {
  node: DesignNode;
  depth: number;
}

export function layerRows(nodes: DesignNode[], collapsed = new Set<string>()): LayerRow[] {
  const roots = nodes.filter((n) => !n.parentId);
  const rows: LayerRow[] = [];
  const walk = (list: DesignNode[], depth: number) => {
    for (let i = list.length - 1; i >= 0; i--) {
      const n = list[i]!;
      rows.push({ node: n, depth });
      if (isGroup(n) && !collapsed.has(n.id)) walk(childrenOf(nodes, n.id), depth + 1);
    }
  };
  walk(roots, 0);
  return rows;
}

export function groupSelected(nodes: DesignNode[], selectedIds: string[]): { nodes: DesignNode[]; groupId: string } | null {
  const idset = new Set(selectedIds);
  const targets = nodes.filter((n) => idset.has(n.id) && !n.parentId);
  if (targets.length < 2) return null;
  const box = unionBounds(targets);
  if (!box) return null;
  const group = makeGroup({ ...box, name: "Group" });
  const targetIds = new Set(targets.map((t) => t.id));
  const next = nodes.map((n) => (targetIds.has(n.id) ? { ...n, parentId: group.id } : n));
  const last = Math.max(...targets.map((t) => next.findIndex((n) => n.id === t.id)));
  const inserted = [...next.slice(0, last + 1), group, ...next.slice(last + 1)];
  return { nodes: inserted, groupId: group.id };
}

export function ungroupSelected(nodes: DesignNode[], selectedIds: string[]): { nodes: DesignNode[]; nextSelection: string[] } {
  const idset = new Set(selectedIds);
  const groups = nodes.filter((n) => idset.has(n.id) && isGroup(n));
  if (!groups.length) return { nodes, nextSelection: selectedIds };
  const drop = new Set(groups.map((g) => g.id));
  const released: string[] = [];
  const next = nodes
    .filter((n) => !drop.has(n.id))
    .map((n) => {
      if (n.parentId && drop.has(n.parentId)) {
        released.push(n.id);
        const { parentId: _omit, ...rest } = n;
        void _omit;
        return rest as DesignNode;
      }
      return n;
    });
  return { nodes: next, nextSelection: released.length ? released : selectedIds.filter((id) => !drop.has(id)) };
}

export function applyGroupPatch(nodes: DesignNode[], ids: string[], patch: Partial<DesignNode>): DesignNode[] {
  const idset = new Set(ids);
  let next = nodes.map((n) => (idset.has(n.id) ? ({ ...n, ...patch } as DesignNode) : n));
  for (const id of ids) {
    const before = nodes.find((n) => n.id === id);
    const after = next.find((n) => n.id === id);
    if (!before || !after || !isGroup(after)) continue;
    const kids = descendantIds(next, id);
    if (!kids.length) continue;
    if ("x" in patch || "y" in patch) {
      const dx = after.x - before.x;
      const dy = after.y - before.y;
      if (dx || dy) {
        next = next.map((n) => (kids.includes(n.id) ? { ...n, x: n.x + dx, y: n.y + dy } : n));
      }
    }
    // Hide does not cascade. A hidden group hoists: children keep their own
    // visibility, the group box is not painted, and opacity/blend still wrap the nest.
    if ("locked" in patch) {
      next = next.map((n) => (kids.includes(n.id) ? { ...n, locked: after.locked } : n));
    }
  }
  return next;
}

export const GROUP_KIND: NodeKind = "group";
