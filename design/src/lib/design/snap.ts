import { aabb } from "./geometry";
import type { DesignNode } from "./types";

export interface GuideSet {
  x: number[];
  y: number[];
}

export type Box = { x: number; y: number; w: number; h: number };

function edges(n: Box) {
  return {
    l: n.x,
    c: n.x + n.w / 2,
    r: n.x + n.w,
    t: n.y,
    m: n.y + n.h / 2,
    b: n.y + n.h,
  };
}

function uniq(xs: number[], eps = 0.5) {
  const out: number[] = [];
  for (const x of [...xs].sort((a, b) => a - b)) {
    if (!out.length || Math.abs(out[out.length - 1]! - x) > eps) out.push(x);
  }
  return out;
}

/** Axis-aligned world bounds of a node, rotation-aware via corner transform. */
export function nodeWorldAabb(n: DesignNode): Box {
  return aabb([n]);
}

/**
 * Snap a moving selection to the artboard and unselected siblings.
 * Aligns left/center/right and top/middle/bottom, plus equal-gap spacing
 * against neighboring sibling boxes.
 */
export function smartSnap(
  moving: DesignNode[],
  others: DesignNode[],
  artboard: { width: number; height: number },
  threshold = 8,
  extra?: GuideSet,
): { dx: number; dy: number; guides: GuideSet } {
  if (!moving.length) return { dx: 0, dy: 0, guides: { x: [], y: [] } };

  const box = aabb(moving);
  const m = edges(box);
  const siblingBoxes = others.filter((n) => n.visible).map(nodeWorldAabb);

  const xs: number[] = [0, artboard.width / 2, artboard.width, ...(extra?.x ?? [])];
  const ys: number[] = [0, artboard.height / 2, artboard.height, ...(extra?.y ?? [])];
  for (const b of siblingBoxes) {
    const e = edges(b);
    xs.push(e.l, e.c, e.r);
    ys.push(e.t, e.m, e.b);
  }

  type Cand = { delta: number; dist: number; line: number };
  const xCands: Cand[] = [];
  const yCands: Cand[] = [];

  for (const tx of xs) {
    for (const my of [m.l, m.c, m.r]) {
      xCands.push({ delta: tx - my, dist: Math.abs(tx - my), line: tx });
    }
  }
  for (const ty of ys) {
    for (const my of [m.t, m.m, m.b]) {
      yCands.push({ delta: ty - my, dist: Math.abs(ty - my), line: ty });
    }
  }

  const sortedX = [...siblingBoxes].sort((a, b) => a.x - b.x);
  const sortedY = [...siblingBoxes].sort((a, b) => a.y - b.y);
  for (let i = 0; i < sortedX.length; i++) {
    const a = sortedX[i]!;
    const ar = a.x + a.w;
    for (let j = i + 1; j < sortedX.length; j++) {
      const b = sortedX[j]!;
      const gap = b.x - ar;
      if (gap <= 0) continue;
      xCands.push({ delta: a.x - gap - box.w - box.x, dist: Math.abs(a.x - gap - box.w - box.x), line: a.x });
      xCands.push({ delta: ar + gap - box.x, dist: Math.abs(ar + gap - box.x), line: ar + gap });
      xCands.push({
        delta: b.x + b.w + gap - box.x,
        dist: Math.abs(b.x + b.w + gap - box.x),
        line: b.x + b.w,
      });
    }
    xCands.push({ delta: a.x - box.w - box.x, dist: Math.abs(a.x - box.w - box.x), line: a.x });
    xCands.push({ delta: ar - box.x, dist: Math.abs(ar - box.x), line: ar });
  }
  for (let i = 0; i < sortedY.length; i++) {
    const a = sortedY[i]!;
    const ab = a.y + a.h;
    for (let j = i + 1; j < sortedY.length; j++) {
      const b = sortedY[j]!;
      const gap = b.y - ab;
      if (gap <= 0) continue;
      yCands.push({ delta: a.y - gap - box.h - box.y, dist: Math.abs(a.y - gap - box.h - box.y), line: a.y });
      yCands.push({ delta: ab + gap - box.y, dist: Math.abs(ab + gap - box.y), line: ab + gap });
      yCands.push({
        delta: b.y + b.h + gap - box.y,
        dist: Math.abs(b.y + b.h + gap - box.y),
        line: b.y + b.h,
      });
    }
    yCands.push({ delta: a.y - box.h - box.y, dist: Math.abs(a.y - box.h - box.y), line: a.y });
    yCands.push({ delta: ab - box.y, dist: Math.abs(ab - box.y), line: ab });
  }

  let bestX = threshold + 1;
  let dx = 0;
  const gx: number[] = [];
  for (const c of xCands) {
    if (c.dist < bestX - 0.01) {
      bestX = c.dist;
      dx = c.delta;
      gx.length = 0;
      gx.push(c.line);
    } else if (Math.abs(c.dist - bestX) <= 0.01 && c.dist <= threshold) {
      gx.push(c.line);
    }
  }

  let bestY = threshold + 1;
  let dy = 0;
  const gy: number[] = [];
  for (const c of yCands) {
    if (c.dist < bestY - 0.01) {
      bestY = c.dist;
      dy = c.delta;
      gy.length = 0;
      gy.push(c.line);
    } else if (Math.abs(c.dist - bestY) <= 0.01 && c.dist <= threshold) {
      gy.push(c.line);
    }
  }

  return {
    dx: bestX <= threshold ? dx : 0,
    dy: bestY <= threshold ? dy : 0,
    guides: {
      x: bestX <= threshold ? uniq(gx) : [],
      y: bestY <= threshold ? uniq(gy) : [],
    },
  };
}

export function rectsIntersect(a: Box, b: Box) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function marqueeHitsNode(n: DesignNode, mq: Box): boolean {
  return rectsIntersect(nodeWorldAabb(n), mq);
}

export function marqueeContainsNode(n: DesignNode, mq: Box): boolean {
  const b = nodeWorldAabb(n);
  return b.x >= mq.x && b.y >= mq.y && b.x + b.w <= mq.x + mq.w && b.y + b.h <= mq.y + mq.h;
}

export function nodesInMarquee(nodes: DesignNode[], mq: Box, mode: "intersect" | "contain" = "intersect"): string[] {
  const test = mode === "contain" ? marqueeContainsNode : marqueeHitsNode;
  return nodes.filter((n) => n.visible && !n.locked && test(n, mq)).map((n) => n.id);
}
