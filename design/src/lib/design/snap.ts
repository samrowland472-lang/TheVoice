import { aabb } from "./geometry";
import type { DesignNode } from "./types";

export interface GuideSet {
  x: number[];
  y: number[];
}

function edges(n: { x: number; y: number; w: number; h: number }) {
  return {
    l: n.x,
    c: n.x + n.w / 2,
    r: n.x + n.w,
    t: n.y,
    m: n.y + n.h / 2,
    b: n.y + n.h,
  };
}

export function smartSnap(
  moving: DesignNode[],
  others: DesignNode[],
  artboard: { width: number; height: number },
  threshold = 8,
): { dx: number; dy: number; guides: GuideSet } {
  if (!moving.length) return { dx: 0, dy: 0, guides: { x: [], y: [] } };
  const box = aabb(moving);
  const m = edges(box);
  const xs: number[] = [0, artboard.width / 2, artboard.width];
  const ys: number[] = [0, artboard.height / 2, artboard.height];
  for (const n of others) {
    const e = edges(n);
    xs.push(e.l, e.c, e.r);
    ys.push(e.t, e.m, e.b);
  }

  let bestX = threshold + 1;
  let bestY = threshold + 1;
  let dx = 0;
  let dy = 0;
  const gx: number[] = [];
  const gy: number[] = [];

  for (const mx of [m.l, m.c, m.r]) {
    for (const tx of xs) {
      const d = Math.abs(tx - mx);
      if (d < bestX) {
        bestX = d;
        dx = tx - mx;
        gx.length = 0;
        gx.push(tx);
      } else if (d === bestX && d <= threshold) {
        gx.push(tx);
      }
    }
  }
  for (const my of [m.t, m.m, m.b]) {
    for (const ty of ys) {
      const d = Math.abs(ty - my);
      if (d < bestY) {
        bestY = d;
        dy = ty - my;
        gy.length = 0;
        gy.push(ty);
      } else if (d === bestY && d <= threshold) {
        gy.push(ty);
      }
    }
  }

  return {
    dx: bestX <= threshold ? dx : 0,
    dy: bestY <= threshold ? dy : 0,
    guides: {
      x: bestX <= threshold ? [...new Set(gx)] : [],
      y: bestY <= threshold ? [...new Set(gy)] : [],
    },
  };
}

export function rectsIntersect(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
