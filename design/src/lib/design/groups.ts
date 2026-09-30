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
