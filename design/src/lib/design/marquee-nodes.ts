import { aabb } from "./geometry";
import { descendantsOf } from "./groups";
import type { DesignNode } from "./types";

type Box = { x: number; y: number; w: number; h: number };

function hits(n: DesignNode, mq: Box) {
  const b = aabb([n]);
  return b.x < mq.x + mq.w && b.x + b.w > mq.x && b.y < mq.y + mq.h && b.y + b.h > mq.y;
}

function contains(n: DesignNode, mq: Box) {
  const b = aabb([n]);
  return b.x >= mq.x && b.y >= mq.y && b.x + b.w <= mq.x + mq.w && b.y + b.h <= mq.y + mq.h;
}

/** Hitting a group box also selects its unlocked visible children. Locked layers stay out. */
export function nodesInMarquee(nodes: DesignNode[], mq: Box, mode: "intersect" | "contain" = "intersect"): string[] {
  const test = mode === "contain" ? contains : hits;
  const picked = new Set<string>();
  for (const n of nodes) {
    if (!n.visible || n.locked || !test(n, mq)) continue;
    picked.add(n.id);
    if (n.kind === "group") {
      for (const child of descendantsOf(nodes, n.id)) {
        if (child.visible && !child.locked) picked.add(child.id);
      }
    }
  }
  return nodes.filter((n) => picked.has(n.id)).map((n) => n.id);
}
