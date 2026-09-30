import { handlePoint, RESIZE_HANDLES, mapNodeToBox, type Box } from "./box-resize";
import { descendantIds, unionBounds } from "./layer-groups";
import { isGroup, type DesignNode } from "./types";

export function groupBox(nodes: DesignNode[], groupId: string): Box | null {
  const g = nodes.find((n) => n.id === groupId);
  if (!g || !isGroup(g)) return null;
  const kids: DesignNode[] = [];
  for (const id of descendantIds(nodes, groupId)) {
    const n = nodes.find((node) => node.id === id);
    if (n && !isGroup(n)) kids.push(n);
  }
  const union = kids.length ? unionBounds(kids) : { x: g.x, y: g.y, w: g.w, h: g.h };
  if (!union) return { x: g.x, y: g.y, w: Math.max(1, g.w), h: Math.max(1, g.h) };
  return union;
}

export function groupTransformIds(nodes: DesignNode[], groupId: string): string[] {
  return [groupId, ...descendantIds(nodes, groupId)];
}

export function scaleGroupNodes(nodes: DesignNode[], groupId: string, to: Box): DesignNode[] {
  const from = groupBox(nodes, groupId);
  if (!from) return nodes;
  const ids = new Set(groupTransformIds(nodes, groupId));
  return nodes.map((n) => {
    if (!ids.has(n.id)) return n;
    if (n.id === groupId) return { ...n, x: to.x, y: to.y, w: to.w, h: to.h };
    return mapNodeToBox(n, from, to);
  });
}

export function selectionTransformBox(nodes: DesignNode[], selectedIds: string[]): Box | null {
  if (selectedIds.length === 1) {
    const only = nodes.find((n) => n.id === selectedIds[0]);
    if (only && isGroup(only)) return groupBox(nodes, only.id);
  }
  const picked = nodes.filter((n) => selectedIds.includes(n.id));
  if (!picked.length) return null;
  const groups = picked.filter(isGroup);
  if (groups.length === picked.length && groups.length === 1) return groupBox(nodes, groups[0]!.id);
  return unionBounds(picked);
}

export function drawTransformHandles(ctx: CanvasRenderingContext2D, box: Box, zoom: number) {
  const hair = 1 / Math.max(zoom, 0.01);
  const size = 8 / Math.max(zoom, 0.01);
  ctx.save();
  ctx.strokeStyle = "rgba(63,198,255,0.95)";
  ctx.lineWidth = hair * 1.2;
  ctx.setLineDash([6 * hair, 4 * hair]);
  ctx.strokeRect(box.x, box.y, box.w, box.h);
  ctx.setLineDash([]);
  ctx.fillStyle = "#0b1218";
  for (const h of RESIZE_HANDLES) {
    const p = handlePoint(box, h);
    ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
    ctx.strokeRect(p.x - size / 2, p.y - size / 2, size, size);
  }
  ctx.restore();
}

export function expandMovePlaces(
  nodes: DesignNode[],
  orig: { id: string; x: number; y: number }[],
): { id: string; x: number; y: number }[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const extra: { id: string; x: number; y: number }[] = [];
  const seen = new Set(orig.map((o) => o.id));
  for (const o of orig) {
    const n = byId.get(o.id);
    if (!n || !isGroup(n)) continue;
    const dx = o.x - n.x;
    const dy = o.y - n.y;
    for (const id of descendantIds(nodes, n.id)) {
      if (seen.has(id)) continue;
      const child = byId.get(id);
      if (!child) continue;
      seen.add(id);
      extra.push({ id, x: child.x + dx, y: child.y + dy });
    }
  }
  return [...orig, ...extra];
}
