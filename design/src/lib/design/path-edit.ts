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
    const crosses = a.y > pt.y !== b.y > pt.y && pt.x < ((b.x - a.x) * (pt.y - a.y)) / (b.y - a.y + 1e-9) + b.x;
    if (crosses) inside = !inside;
  }
  return inside;
}
