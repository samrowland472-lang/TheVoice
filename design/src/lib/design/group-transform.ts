import { handlePoint, RESIZE_HANDLES, type Box } from "./box-resize";
import { rotatePoint } from "./geometry";
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

/**
 * Axis-aligned scale in the group frame, refit as a rectangle so a rotated
 * child stays a rect (edge lengths follow the scaled axes; no skew).
 */
export function frameScaleAxes(rotationDeg: number, sx: number, sy: number) {
  const r = (rotationDeg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  const ux = sx * c;
  const uy = sy * s;
  const vx = -sx * s;
  const vy = sy * c;
  const wScale = Math.hypot(ux, uy) || 1;
  const hScale = Math.hypot(vx, vy) || 1;
  let rotation = (Math.atan2(uy, ux) * 180) / Math.PI;
  if (Object.is(rotation, -0)) rotation = 0;
  return { wScale, hScale, rotation };
}

function scaleLocalPoint<T extends { x: number; y: number; in?: { x: number; y: number } | null; out?: { x: number; y: number } | null }>(
  p: T,
  sx: number,
  sy: number,
): T {
  return {
    ...p,
    x: p.x * sx,
    y: p.y * sy,
    in: p.in ? { x: p.in.x * sx, y: p.in.y * sy } : p.in,
    out: p.out ? { x: p.out.x * sx, y: p.out.y * sy } : p.out,
  };
}

/** Scale a leaf in the unrotated nest frame. Rotation is refit so the rect does not shear. */
export function scaleNodeInFrame(n: DesignNode, from: Box, to: Box): DesignNode {
  if (from.w < 1e-6 || from.h < 1e-6) return n;
  const sx = to.w / from.w;
  const sy = to.h / from.h;
  const cx = n.x + n.w / 2;
  const cy = n.y + n.h / 2;
  const ncx = to.x + (cx - from.x) * sx;
  const ncy = to.y + (cy - from.y) * sy;
  const fitted = frameScaleAxes(n.rotation || 0, sx, sy);
  const w = Math.max(1, n.w * fitted.wScale);
  const h = n.kind === "text" ? n.h : Math.max(1, n.h * fitted.hScale);
  const x = ncx - w / 2;
  const y = ncy - h / 2;
  if (n.kind === "path") {
    return {
      ...n,
      x,
      y,
      w,
      h,
      rotation: fitted.rotation,
      points: n.points.map((pt) => scaleLocalPoint(pt, fitted.wScale, fitted.hScale)),
      holes: n.holes?.map((ring) => ring.map((pt) => scaleLocalPoint(pt, fitted.wScale, fitted.hScale))),
    };
  }
  return { ...n, x, y, w, h, rotation: fitted.rotation };
}

export function scaleGroupNodes(nodes: DesignNode[], groupId: string, to: Box): DesignNode[] {
  const from = groupBox(nodes, groupId);
  if (!from) return nodes;
  const ids = new Set(groupTransformIds(nodes, groupId));
  return nodes.map((n) => {
    if (!ids.has(n.id)) return n;
    if (n.id === groupId) return { ...n, x: to.x, y: to.y, w: to.w, h: to.h };
    return scaleNodeInFrame(n, from, to);
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

export function rotateHandlePoint(box: Box, zoom: number) {
  return { x: box.x + box.w / 2, y: box.y - 28 / Math.max(zoom, 0.01) };
}

/** Screen-space chip just above a group AABB so the name can be edited on the board. */
export function selectionLabelScreen(
  box: Box,
  viewport: { x: number; y: number; zoom: number },
): { left: number; top: number } {
  const z = Math.max(viewport.zoom, 0.01);
  return {
    left: viewport.x + box.x * z,
    top: viewport.y + box.y * z - 26,
  };
}

/** World point into the unrotated frame (group angle turns the nest about the box centre). */
export function unspinPoint(box: Box, x: number, y: number, rotation: number) {
  if (!rotation) return { x, y };
  return rotatePoint(x, y, box.x + box.w / 2, box.y + box.h / 2, -rotation);
}

export function spinPoint(box: Box, x: number, y: number, rotation: number) {
  if (!rotation) return { x, y };
  return rotatePoint(x, y, box.x + box.w / 2, box.y + box.h / 2, rotation);
}

export function hitRotateHandle(box: Box, x: number, y: number, zoom: number, rotation = 0): boolean {
  const local = unspinPoint(box, x, y, rotation);
  const p = rotateHandlePoint(box, zoom);
  const r = 12 / Math.max(zoom, 0.01);
  return Math.hypot(local.x - p.x, local.y - p.y) <= r;
}

export function rotateNodeAbout(n: DesignNode, cx: number, cy: number, delta: number): DesignNode {
  if (!delta) return n;
  const ocx = n.x + n.w / 2;
  const ocy = n.y + n.h / 2;
  const p = rotatePoint(ocx, ocy, cx, cy, delta);
  return { ...n, x: p.x - n.w / 2, y: p.y - n.h / 2, rotation: n.rotation + delta };
}

/** Nest angle lives on the group. Board, PNG, and SVG turn children about the group centre. */
export function rotateGroupNodes(nodes: DesignNode[], groupId: string, delta: number): DesignNode[] {
  if (!delta) return nodes;
  return nodes.map((n) => (n.id === groupId ? { ...n, rotation: n.rotation + delta } : n));
}

/** Rotate every selected node (and group descendants) about the shared AABB centre. */
export function rotateSelectionNodes(nodes: DesignNode[], selectedIds: string[], delta: number): DesignNode[] {
  if (!delta || !selectedIds.length) return nodes;
  if (selectedIds.length === 1) {
    const only = nodes.find((n) => n.id === selectedIds[0]);
    if (only && isGroup(only)) return rotateGroupNodes(nodes, only.id, delta);
  }
  const box = selectionTransformBox(nodes, selectedIds);
  if (!box) return nodes;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const ids = new Set<string>();
  for (const id of selectedIds) {
    ids.add(id);
    const n = nodes.find((x) => x.id === id);
    if (n && isGroup(n)) {
      for (const d of descendantIds(nodes, id)) ids.add(d);
    }
  }
  return nodes.map((n) => (ids.has(n.id) ? rotateNodeAbout(n, cx, cy, delta) : n));
}

export function drawTransformHandles(ctx: CanvasRenderingContext2D, box: Box, zoom: number, rotation = 0) {
  const hair = 1 / Math.max(zoom, 0.01);
  const size = 8 / Math.max(zoom, 0.01);
  const rot = rotateHandlePoint(box, zoom);
  const midTop = { x: box.x + box.w / 2, y: box.y };
  ctx.save();
  if (rotation) {
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    ctx.translate(cx, cy);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  }
  ctx.strokeStyle = "rgba(63,198,255,0.95)";
  ctx.lineWidth = hair * 1.2;
  ctx.setLineDash([6 * hair, 4 * hair]);
  ctx.strokeRect(box.x, box.y, box.w, box.h);
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(midTop.x, midTop.y);
  ctx.lineTo(rot.x, rot.y);
  ctx.stroke();
  ctx.fillStyle = "#0b1218";
  ctx.beginPath();
  ctx.arc(rot.x, rot.y, 5 / Math.max(zoom, 0.01), 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
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
