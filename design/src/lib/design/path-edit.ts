import { nodeCenter, rotatePoint } from "./geometry";
import { dragPathHandle, drawPathTangents, hitPathEdit, type PathEditHit } from "./path-curve";
import type { PathNode, PathPoint } from "./types";

export type { PathEditHit };

export function pathWorldToLocal(n: PathNode, wx: number, wy: number) {
  const c = nodeCenter(n);
  const p = n.rotation ? rotatePoint(wx, wy, c.x, c.y, -n.rotation) : { x: wx, y: wy };
  return { x: p.x - n.x, y: p.y - n.y };
}

function pointInRing(pt: { x: number; y: number }, ring: PathPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]!;
    const b = ring[j]!;
    const crosses = a.y > pt.y !== b.y > pt.y && pt.x < ((b.x - a.x) * (pt.y - a.y)) / (b.y - a.y + 1e-9) + a.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

/** Hit holes first so subtract diamonds stay grabable. Ring body picks the hole itself. */
export function hitPathNode(n: PathNode, wx: number, wy: number, zoom: number): PathEditHit | null {
  const local = pathWorldToLocal(n, wx, wy);
  const holes = n.holes ?? [];
  for (let h = holes.length - 1; h >= 0; h--) {
    const ring = holes[h]!;
    const hit = hitPathEdit(0, 0, ring, local.x, local.y, zoom);
    if (hit) return { ...hit, hole: h };
  }
  for (let h = holes.length - 1; h >= 0; h--) {
    const ring = holes[h]!;
    if (ring.length >= 3 && pointInRing(local, ring)) {
      return { index: 0, arm: "anchor", hole: h };
    }
  }
  return hitPathEdit(0, 0, n.points, local.x, local.y, zoom);
}

export function contourOf(n: PathNode, hole?: number): PathPoint[] {
  if (hole == null) return n.points;
  return n.holes?.[hole] ?? [];
}

export function clonePathPoint(p: PathPoint): PathPoint {
  return {
    ...p,
    in: p.in ? { ...p.in } : p.in,
    out: p.out ? { ...p.out } : p.out,
  };
}

/** Frozen geometry for undo and mid-drag apply. Points travel with the box. */
export function snapshotPathNode(n: PathNode): PathNode {
  return {
    ...n,
    points: n.points.map(clonePathPoint),
    holes: n.holes?.map((ring) => ring.map(clonePathPoint)),
  };
}

export function applyPathEdit(
  n: PathNode,
  hit: PathEditHit,
  localX: number,
  localY: number,
  keepSmooth: boolean,
): PathNode {
  const ring = contourOf(n, hit.hole);
  const pt = ring[hit.index];
  if (!pt) return n;
  let nextPt: PathPoint;
  if (hit.arm === "anchor") {
    nextPt = { ...pt, x: localX, y: localY };
  } else {
    nextPt = dragPathHandle(pt, hit.arm, localX, localY, keepSmooth && pt.smooth !== false);
  }
  const nextRing = ring.map((p, i) => (i === hit.index ? nextPt : p));
  if (hit.hole == null) return { ...n, points: nextRing };
  const holes = (n.holes ?? []).map((h, i) => (i === hit.hole ? nextRing : h));
  return { ...n, holes };
}

export function drawPathNodeTangents(
  ctx: CanvasRenderingContext2D,
  n: PathNode,
  zoom: number,
  active?: PathEditHit | null,
  showLengths = false,
) {
  const c = nodeCenter(n);
  ctx.save();
  if (n.rotation) {
    ctx.translate(c.x, c.y);
    ctx.rotate((n.rotation * Math.PI) / 180);
    ctx.translate(-c.x, -c.y);
  }
  const outerActive = active && active.hole == null ? active : null;
  drawPathTangents(ctx, n.x, n.y, n.points, zoom, outerActive, "phosphor", showLengths);
  const holes = n.holes ?? [];
  for (let h = 0; h < holes.length; h++) {
    const holeActive = active && active.hole === h ? { ...active, hole: undefined } : null;
    if (holeActive) {
      ctx.save();
      ctx.beginPath();
      const ring = holes[h]!;
      if (ring[0]) ctx.moveTo(n.x + ring[0].x, n.y + ring[0].y);
      for (let i = 1; i < ring.length; i++) ctx.lineTo(n.x + ring[i]!.x, n.y + ring[i]!.y);
      ctx.closePath();
      ctx.strokeStyle = "rgba(126,224,255,0.85)";
      ctx.lineWidth = 2 / zoom;
      ctx.stroke();
      ctx.restore();
    }
    drawPathTangents(ctx, n.x, n.y, holes[h]!, zoom, holeActive, "cool", showLengths);
  }
  ctx.restore();
}

/** Hit-test the live tangent length labels drawn by drawPathTangents. */
export function hitPathLengthLabel(
  n: PathNode,
  wx: number,
  wy: number,
  zoom: number,
  active?: PathEditHit | null,
): { index: number; arm: "in" | "out"; hole?: number; labelX: number; labelY: number; length: number } | null {
  if (!active) return null;
  const c = nodeCenter(n);
  const off = 10 / zoom;
  const hitR = 16 / zoom;

  function checkRing(
    pts: PathPoint[],
    hole: number | undefined,
    ringActive: PathEditHit | null,
  ): { index: number; arm: "in" | "out"; hole?: number; labelX: number; labelY: number; length: number } | null {
    if (!ringActive) return null;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i]!;
      const isAnchorActive = ringActive.index === i && ringActive.arm === "anchor";
      const arms: Array<{ arm: "in" | "out"; h: { x: number; y: number } }> = [];
      if (p.in && (Math.abs(p.in.x) > 0.2 || Math.abs(p.in.y) > 0.2)) arms.push({ arm: "in", h: p.in });
      if (p.out && (Math.abs(p.out.x) > 0.2 || Math.abs(p.out.y) > 0.2)) arms.push({ arm: "out", h: p.out });
      for (const { arm, h } of arms) {
        const hot = ringActive.index === i && ringActive.arm === arm;
        if (!(hot || isAnchorActive)) continue;
        const ax = n.x + p.x;
        const ay = n.y + p.y;
        const hx = ax + h.x;
        const hy = ay + h.y;
        const va = n.rotation ? rotatePoint(ax, ay, c.x, c.y, n.rotation) : { x: ax, y: ay };
        const vh = n.rotation ? rotatePoint(hx, hy, c.x, c.y, n.rotation) : { x: hx, y: hy };
        const dx = vh.x - va.x;
        const dy = vh.y - va.y;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        const lx = vh.x + ux * off;
        const ly = vh.y + uy * off;
        if (Math.hypot(wx - lx, wy - ly) <= hitR) {
          return { index: i, arm, hole, labelX: lx, labelY: ly, length: Math.round(len) };
        }
      }
    }
    return null;
  }

  const outerActive = active.hole == null ? active : null;
  const outer = checkRing(n.points, undefined, outerActive);
  if (outer) return outer;
  const holes = n.holes ?? [];
  for (let h = 0; h < holes.length; h++) {
    const holeActive = active.hole === h ? { ...active, hole: undefined } : null;
    const hit = checkRing(holes[h]!, h, holeActive);
    if (hit) return hit;
  }
  return null;
}
