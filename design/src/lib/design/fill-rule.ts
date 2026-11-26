import type { PathNode, PathPoint } from "./types";

export type PathFillRule = "evenodd" | "nonzero";

export function pathFillRule(n: PathNode): PathFillRule {
  return n.fillRule ?? ((n.holes?.length ?? 0) > 0 ? "evenodd" : "nonzero");
}

export function holeFillRule(n: PathNode, index: number): PathFillRule {
  return n.holeFillRules?.[index] ?? pathFillRule(n);
}

export function dropHole(n: PathNode, hole: number): PathNode {
  return {
    ...n,
    holes: (n.holes ?? []).filter((_, i) => i !== hole),
    holeFillRules: n.holeFillRules ? n.holeFillRules.filter((_, i) => i !== hole) : n.holeFillRules,
  };
}

export function setHoleFillRule(n: PathNode, hole: number, rule: PathFillRule): PathNode {
  const count = n.holes?.length ?? 0;
  if (hole < 0 || hole >= count) return n;
  const next = [...(n.holeFillRules ?? [])];
  while (next.length < count) next.push(pathFillRule(n));
  next[hole] = rule;
  return { ...n, holeFillRules: next };
}

export function partitionPathHoles(n: PathNode): { cut: PathPoint[][]; islands: PathPoint[][] } {
  const cut: PathPoint[][] = [];
  const islands: PathPoint[][] = [];
  (n.holes ?? []).forEach((ring, i) => {
    if (ring.length < 3) return;
    if (holeFillRule(n, i) === "nonzero") islands.push(ring);
    else cut.push(ring);
  });
  return { cut, islands };
}
