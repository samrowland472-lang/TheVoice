import { pathWorldToLocal } from "./path-edit";
import { cutContourMany, hitCompoundSegment, strokeHitsCompound, type SegmentHit } from "./path-cut";
import { pathNode } from "./node-factory";
import type { PathNode, PathPoint } from "./types";
import { explodeTwistedPath } from "./winding-pass";

function clonePathStyle(n: PathNode, points: PathPoint[], closed: boolean, holes?: PathPoint[][]): PathNode {
  const extra = pathNode({
    x: n.x,
    y: n.y,
    w: n.w,
    h: n.h,
    points,
    closed,
    holes: holes && holes.length ? holes : undefined,
    fill: n.fill,
    stroke: n.stroke,
    strokeWidth: n.strokeWidth,
    opacity: n.opacity,
    blend: n.blend,
    rotation: n.rotation,
  });
  extra.name = n.name;
  return extra;
}

function applyCutsToPath(
  n: PathNode,
  groups: { hole: number | null; hits: SegmentHit[] }[],
): { keep: PathNode; extras: PathNode[] } | null {
  if (!groups.length) return null;
  let keep: PathNode = { ...n, holes: n.holes ? n.holes.map((h) => h.map((p) => ({ ...p }))) : n.holes };
  const extras: PathNode[] = [];
  const outerGroup = groups.find((g) => g.hole == null);
  const holeGroups = groups.filter((g) => g.hole != null);
  if (outerGroup) {
    const pieces = cutContourMany(keep.points, keep.closed, outerGroup.hits);
    const released = keep.closed && (keep.holes?.length ?? 0) > 0;
    keep = { ...keep, points: pieces[0] ?? keep.points, closed: false, holes: released ? undefined : keep.holes };
    for (const piece of pieces.slice(1)) {
      if (piece.length >= 2) extras.push(clonePathStyle(n, piece, false));
    }
    if (released) {
      for (const hole of n.holes ?? []) {
        if (hole.length >= 3) extras.push(clonePathStyle(n, hole, true));
      }
    }
  }
  const survivingHoles = [...(keep.holes ?? [])];
  const removed = new Set<number>();
  for (const g of holeGroups.sort((a, b) => (b.hole ?? 0) - (a.hole ?? 0))) {
    const idx = g.hole!;
    const ring = survivingHoles[idx];
    if (!ring) continue;
    const pieces = cutContourMany(ring, true, g.hits);
    removed.add(idx);
    for (const piece of pieces) {
      if (piece.length >= 2) extras.push(clonePathStyle(n, piece, false));
    }
  }
  if (removed.size) {
    keep = { ...keep, holes: survivingHoles.filter((_, i) => !removed.has(i)) };
  }
  return { keep, extras };
}

function groupCompoundHits(hits: { hole: number | null; hit: SegmentHit }[]) {
  const grouped = new Map<number | string, { hole: number | null; hits: SegmentHit[] }>();
  for (const h of hits) {
    const key = h.hole == null ? "outer" : h.hole;
    const g = grouped.get(key) ?? { hole: h.hole, hits: [] };
    g.hits.push(h.hit);
    grouped.set(key, g);
  }
  return [...grouped.values()];
}

function closedSibling(n: PathNode, lobe: PathNode): PathNode {
  return clonePathStyle(n, lobe.points, true, lobe.holes);
}

/** Planarize figure-eight / bowtie traces, then cut only the lobes the stroke actually crosses. Untouched lobes stay closed siblings. */
export function applyKnifeStrokeToPath(
  n: PathNode,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): { keep: PathNode; extras: PathNode[] } | null {
  const a = { x: ax - n.x, y: ay - n.y };
  const b = { x: bx - n.x, y: by - n.y };
  const lobes = explodeTwistedPath(n);
  const extras: PathNode[] = [];
  let keep: PathNode | null = null;
  let any = false;
  lobes.forEach((lobe, i) => {
    const hits = strokeHitsCompound(lobe, a, b);
    if (!hits.length) {
      const intact = i === 0 ? { ...lobe, id: n.id, name: n.name } : closedSibling(n, lobe);
      if (!keep) keep = intact;
      else extras.push(intact);
      return;
    }
    const applied = applyCutsToPath(lobe, groupCompoundHits(hits));
    if (!applied) {
      const intact = i === 0 ? { ...lobe, id: n.id, name: n.name } : closedSibling(n, lobe);
      if (!keep) keep = intact;
      else extras.push(intact);
      return;
    }
    any = true;
    const first = i === 0 ? { ...applied.keep, id: n.id, name: n.name } : applied.keep;
    if (!keep) keep = first;
    else extras.push(first);
    extras.push(...applied.extras);
  });
  if (!any || !keep) return null;
  return { keep, extras };
}

export function applyKnifePointToPath(
  n: PathNode,
  wx: number,
  wy: number,
  zoom: number,
): { keep: PathNode; extras: PathNode[] } | null {
  const local = pathWorldToLocal(n, wx, wy);
  const lobes = explodeTwistedPath(n);
  let bestLobe: PathNode | null = null;
  let bestIndex = -1;
  let bestHole: number | null = null;
  let bestHit: SegmentHit | null = null;
  for (let index = 0; index < lobes.length; index++) {
    const lobe = lobes[index]!;
    const found = hitCompoundSegment(lobe, local.x, local.y, zoom);
    if (!found) continue;
    if (!bestHit || found.hit.dist < bestHit.dist) {
      bestLobe = lobe;
      bestIndex = index;
      bestHole = found.hole;
      bestHit = found.hit;
    }
  }
  if (!bestLobe || !bestHit || bestIndex < 0) return null;
  const applied = applyCutsToPath(bestLobe, [{ hole: bestHole, hits: [bestHit] }]);
  if (!applied) return null;
  const nodes: PathNode[] = [];
  lobes.forEach((lobe, i) => {
    if (i === bestIndex) {
      const cut = i === 0 ? { ...applied.keep, id: n.id, name: n.name } : applied.keep;
      nodes.push(cut, ...applied.extras);
      return;
    }
    nodes.push(i === 0 ? { ...lobe, id: n.id, name: n.name } : closedSibling(n, lobe));
  });
  const keep = nodes.find((p) => p.id === n.id) ?? nodes[0]!;
  return { keep, extras: nodes.filter((p) => p !== keep) };
}
