import { aabb } from "./geometry";
import { uid } from "./id";
import type { DesignNode, GroupNode } from "./types";
import { isGroup } from "./types";

export function childrenOf(nodes: DesignNode[], parentId: string): DesignNode[] {
  return nodes.filter((n) => n.parentId === parentId);
}

export function descendantsOf(nodes: DesignNode[], parentId: string): DesignNode[] {
  const out: DesignNode[] = [];
  const walk = (id: string) => {
    for (const n of nodes) {
      if (n.parentId === id) {
        out.push(n);
        walk(n.id);
      }
    }
  };
  walk(parentId);
  return out;
}

export function withDescendants(nodes: DesignNode[], ids: string[]): Set<string> {
  const set = new Set(ids);
  for (const id of [...set]) {
    for (const d of descendantsOf(nodes, id)) set.add(d.id);
  }
  return set;
}

export function flattenLayers(nodes: DesignNode[]): { node: DesignNode; depth: number }[] {
  const byParent = new Map<string | undefined, DesignNode[]>();
  for (const n of nodes) {
    const key = n.parentId;
    const list = byParent.get(key) ?? [];
    list.push(n);
    byParent.set(key, list);
  }
  const rows: { node: DesignNode; depth: number }[] = [];
  const walk = (parentId: string | undefined, depth: number) => {
    const kids = byParent.get(parentId);
    if (!kids) return;
    for (const n of [...kids].reverse()) {
      rows.push({ node: n, depth });
      if (isGroup(n) && n.collapsed) continue;
      walk(n.id, depth + 1);
    }
  };
  walk(undefined, 0);
  return rows;
}

export function makeGroup(nodes: DesignNode[], memberIds: string[]): { nodes: DesignNode[]; groupId: string } | null {
  const unique = [...new Set(memberIds)];
  if (unique.length < 2) return null;
  const members = nodes.filter((n) => unique.includes(n.id));
  if (members.length < 2) return null;
  const parents = new Set(members.map((n) => n.parentId));
  if (parents.size > 1) return null;
  const parentId = members[0]?.parentId;
  const leaves = members.filter((n) => !isGroup(n));
  const boxSrc = leaves.length ? leaves : members;
  const box = aabb(boxSrc);
  const group: GroupNode = {
    id: uid("gp"),
    name: "Group",
    kind: "group",
    x: box.x,
    y: box.y,
    w: box.w,
    h: box.h,
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
    parentId,
    collapsed: false,
  };
  const memberSet = new Set(unique);
  const next = nodes.map((n) => (memberSet.has(n.id) ? { ...n, parentId: group.id } : n));
  const firstIdx = next.findIndex((n) => memberSet.has(n.id));
  const insertAt = firstIdx < 0 ? next.length : firstIdx;
  next.splice(insertAt, 0, group);
  return { nodes: next, groupId: group.id };
}

export function ungroup(nodes: DesignNode[], groupIds: string[]): DesignNode[] {
  const drop = new Set(groupIds.filter((id) => nodes.some((n) => n.id === id && isGroup(n))));
  if (!drop.size) return nodes;
  return nodes
    .filter((n) => !drop.has(n.id))
    .map((n) => {
      if (n.parentId && drop.has(n.parentId)) {
        const g = nodes.find((x) => x.id === n.parentId);
        return { ...n, parentId: g?.parentId };
      }
      return n;
    });
}

export type LayerDrop =
  | { mode: "into"; groupId: string }
  | { mode: "before" | "after"; anchorId: string };

function ancestorIds(nodes: DesignNode[], id: string): string[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const out: string[] = [];
  const seen = new Set<string>();
  let cur = byId.get(id);
  while (cur?.parentId && !seen.has(cur.parentId)) {
    seen.add(cur.parentId);
    out.push(cur.parentId);
    cur = byId.get(cur.parentId);
  }
  return out;
}

function movingRoots(nodes: DesignNode[], ids: string[]): DesignNode[] {
  const idset = new Set(ids);
  return nodes.filter((n) => idset.has(n.id) && !ancestorIds(nodes, n.id).some((a) => idset.has(a)));
}

function subtreeEnd(nodes: DesignNode[], id: string): number {
  const desc = new Set(descendantsOf(nodes, id).map((n) => n.id));
  let end = nodes.findIndex((n) => n.id === id);
  nodes.forEach((n, i) => {
    if (desc.has(n.id) && i > end) end = i;
  });
  return end;
}

/** A group cannot land inside itself or a descendant. Sibling drops need a real anchor. */
export function layerDropLegal(nodes: DesignNode[], ids: string[], drop: LayerDrop): boolean {
  const moving = movingRoots(nodes, ids);
  if (!moving.length) return false;
  const movingIds = new Set(moving.map((n) => n.id));
  if (drop.mode === "into") {
    if (movingIds.has(drop.groupId)) return false;
    const group = nodes.find((n) => n.id === drop.groupId);
    if (!group || !isGroup(group)) return false;
    if (moving.some((m) => ancestorIds(nodes, group.id).includes(m.id))) return false;
    return true;
  }
  if (movingIds.has(drop.anchorId)) return false;
  const anchor = nodes.find((n) => n.id === drop.anchorId);
  if (!anchor) return false;
  if (moving.some((m) => ancestorIds(nodes, anchor.id).includes(m.id))) return false;
  return true;
}

/** Move layer roots in the list. Into a group sets parentId. Sibling drops keep the anchor parent. */
export function applyLayerDrop(nodes: DesignNode[], ids: string[], drop: LayerDrop): DesignNode[] | null {
  if (!layerDropLegal(nodes, ids, drop)) return null;
  const moving = movingRoots(nodes, ids);
  const movingIds = new Set(moving.map((n) => n.id));

  let parentId: string | undefined;
  if (drop.mode === "into") {
    parentId = drop.groupId;
  } else {
    const anchor = nodes.find((n) => n.id === drop.anchorId);
    parentId = anchor?.parentId;
  }

  const rest = nodes.filter((n) => !movingIds.has(n.id));
  const patched = moving.map((n) => ({ ...n, parentId }));
  let index = rest.length;
  if (drop.mode === "into") {
    index = subtreeEnd(rest, drop.groupId) + 1;
  } else {
    const anchorAt = rest.findIndex((n) => n.id === drop.anchorId);
    if (anchorAt < 0) return null;
    index = drop.mode === "before" ? subtreeEnd(rest, drop.anchorId) + 1 : anchorAt;
  }
  if (index < 0) index = 0;
  if (index > rest.length) index = rest.length;
  const next = rest.slice();
  next.splice(index, 0, ...patched);
  return next;
}

/** Visual up is in front (later in the node array) among siblings. */
export function nudgeLayer(nodes: DesignNode[], id: string, dir: "up" | "down"): DesignNode[] | null {
  const node = nodes.find((n) => n.id === id);
  if (!node) return null;
  const siblings = nodes.filter((n) => n.parentId === node.parentId);
  const idx = siblings.findIndex((n) => n.id === id);
  const other = dir === "up" ? siblings[idx + 1] : siblings[idx - 1];
  if (!other) return null;
  const a = nodes.findIndex((n) => n.id === id);
  const b = nodes.findIndex((n) => n.id === other.id);
  if (a < 0 || b < 0) return null;
  const next = nodes.slice();
  const tmp = next[a]!;
  next[a] = next[b]!;
  next[b] = tmp;
  return next;
}
