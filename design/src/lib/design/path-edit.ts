import { nodeCenter, rotatePoint } from "./geometry";
import { dragPathHandle, drawPathTangents, hitPathEdit, type PathEditHit } from "./path-curve";
import type { PathNode, PathPoint } from "./types";

export type { PathEditHit };

export function pathWorldToLocal(n: PathNode, wx: number, wy: number) {
  const c = nodeCenter(n);
  const p = n.rotation ? rotatePoint(wx, wy, c.x, c.y, -n.rotation) : { x: wx, y: wy };
  return { x: p.x - n.x, y: p.y - n.y };
}

/** Hit holes first so subtract diamonds stay grabable. */
export function hitPathNode(n: PathNode, wx: number, wy: number, zoom: number): PathEditHit | null {
  const local = pathWorldToLocal(n, wx, wy);
  const holes = n.holes ?? [];
  for (let h = holes.length - 1; h >= 0; h--) {
    const hit = hitPathEdit(0, 0, holes[h]!, local.x, local.y, zoom);
    if (hit) return { ...hit, hole: h };
  }
  return hitPathEdit(0, 0, n.points, local.x, local.y, zoom);
}

export function contourOf(n: PathNode, hole?: number): PathPoint[] {
  if (hole == null) return n.points;
  return n.holes?.[hole] ?? [];
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
) {
  const c = nodeCenter(n);
  ctx.save();
  if (n.rotation) {
    ctx.translate(c.x, c.y);
    ctx.rotate((n.rotation * Math.PI) / 180);
    ctx.translate(-c.x, -c.y);
  }
  const outerActive = active && active.hole == null ? active : null;
  drawPathTangents(ctx, n.x, n.y, n.points, zoom, outerActive, "phosphor");
  const holes = n.holes ?? [];
  for (let h = 0; h < holes.length; h++) {
    const holeActive = active && active.hole === h ? { ...active, hole: undefined } : null;
    drawPathTangents(ctx, n.x, n.y, holes[h]!, zoom, holeActive, "cool");
  }
  ctx.restore();
}
