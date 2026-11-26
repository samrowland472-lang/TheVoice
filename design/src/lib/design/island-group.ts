import { ringArea, type Ring } from "./polygon-clip";

const GRID = 1e-4;

function pointInRing(pt: { x: number; y: number }, ring: Ring): boolean {
  let inside = false;
  const n = ring.length;
  const EPS = 1e-9;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const a = ring[i]!;
    const b = ring[j]!;
    const inter =
      a.y > pt.y !== b.y > pt.y && pt.x < ((b.x - a.x) * (pt.y - a.y)) / (b.y - a.y || EPS) + a.x;
    if (inter) inside = !inside;
  }
  return inside;
}

function ringContains(outer: Ring, inner: Ring): boolean {
  if (inner.length < 3 || outer.length < 3) return false;
  let hits = 0;
  const sample = Math.min(inner.length, 5);
  for (let i = 0; i < sample; i++) {
    if (pointInRing(inner[Math.floor((i * inner.length) / sample)]!, outer)) hits += 1;
  }
  return hits >= Math.ceil(sample / 2);
}

function smallestParent(rings: Ring[], index: number): number {
  let parent = -1;
  let parentArea = Infinity;
  const inner = rings[index]!;
  for (let i = 0; i < rings.length; i++) {
    if (i === index) continue;
    const cand = rings[i]!;
    if (!ringContains(cand, inner)) continue;
    const area = Math.abs(ringArea(cand));
    if (area + GRID < parentArea) {
      parentArea = area;
      parent = i;
    }
  }
  return parent;
}

export function ringDepth(rings: Ring[], index: number): number {
  let depth = 0;
  let i = index;
  const seen = new Set<number>();
  while (!seen.has(i)) {
    seen.add(i);
    const p = smallestParent(rings, i);
    if (p < 0) return depth;
    depth += 1;
    i = p;
  }
  return depth;
}

export function groupIslandsNested(rings: Ring[]): { outer: Ring; holes: Ring[] }[] {
  if (!rings.length) return [];
  const byArea = [...rings].sort((a, b) => Math.abs(ringArea(b)) - Math.abs(ringArea(a)));
  const parent = byArea.map((_, i) => smallestParent(byArea, i));
  const roots: number[] = [];
  for (let i = 0; i < byArea.length; i++) {
    if (parent[i] === -1) roots.push(i);
  }
  return roots.map((root) => {
    const holes: Ring[] = [];
    for (let j = 0; j < byArea.length; j++) {
      if (j === root) continue;
      let walk = parent[j]!;
      let owned = false;
      const seen = new Set<number>();
      while (walk >= 0 && !seen.has(walk)) {
        seen.add(walk);
        if (walk === root) {
          owned = true;
          break;
        }
        walk = parent[walk]!;
      }
      if (owned) holes.push(byArea[j]!);
    }
    return { outer: byArea[root]!, holes };
  });
}
