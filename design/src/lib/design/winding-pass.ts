import type { PathPoint } from "./types";
import {
  cleanRingForWinding as cleanRing,
  keyOfForWinding as keyOf,
  ringArea,
  selfCrossingsForWinding as selfCrossings,
  splitRingAtHitsForWinding as splitRingAtHits,
  WINDING_GRID as GRID,
} from "./polygon-clip";

export type Ring = PathPoint[];

/**
 * Winding pass: walk a self-overlapping trace (figure-eight / bowtie),
 * close a simple lobe every time the polyline returns to a vertex, then
 * recurse so clip sees simple rings instead of one twisted contour.
 */
function extractWindingLobes(split: Ring): Ring[] {
  const lastAt = new Map<string, number>();
  const lobes: Ring[] = [];
  const pushLobe = (slice: PathPoint[]) => {
    const lobe = cleanRing(slice);
    if (lobe.length >= 3 && Math.abs(ringArea(lobe)) > GRID * 40) lobes.push(lobe);
  };
  for (let i = 0; i < split.length; i++) {
    const k = keyOf(split[i]!);
    const prev = lastAt.get(k);
    if (prev != null && i - prev >= 3) pushLobe(split.slice(prev, i));
    lastAt.set(k, i);
  }
  if (split.length >= 4) {
    const start = keyOf(split[0]!);
    const end = keyOf(split[split.length - 1]!);
    if (start !== end) pushLobe(split);
  }
  return lobes;
}

export function splitSelfOverlapping(ring: Ring, depth = 0): Ring[] {
  const raw = cleanRing(ring);
  if (depth > 6) return raw.length >= 3 ? [raw] : [];
  if (raw.length < 4) return raw.length >= 3 ? [raw] : [];
  const hits = selfCrossings(raw);
  const split = hits.length ? splitRingAtHits(raw, hits) : raw;
  if (split.length < 4) return [raw];

  let lobes = extractWindingLobes(split);
  if (hits.length && lobes.length < 2) {
    const k = keyOf(split[0]!);
    const idxs = split.map((p, i) => (keyOf(p) === k ? i : -1)).filter((i) => i >= 0);
    if (idxs.length >= 2) {
      const a = idxs[0]!;
      const b = idxs[1]!;
      const wrap = cleanRing([...split.slice(b), ...split.slice(0, a)]);
      if (wrap.length >= 3 && Math.abs(ringArea(wrap)) > GRID * 40) lobes.push(wrap);
    }
  }
  if (!lobes.length) return [raw];

  const unique: Ring[] = [];
  const seen = new Set<string>();
  for (const lobe of lobes) {
    const sig = lobe.map(keyOf).sort().join("|");
    if (seen.has(sig)) continue;
    seen.add(sig);
    const nestedHits = selfCrossings(lobe);
    if (nestedHits.length && lobe !== raw) {
      for (const n of splitSelfOverlapping(lobe, depth + 1)) {
        const ns = n.map(keyOf).sort().join("|");
        if (seen.has(ns)) continue;
        seen.add(ns);
        unique.push(n);
      }
    } else {
      unique.push(lobe);
    }
  }
  return unique.length ? unique : [raw];
}
