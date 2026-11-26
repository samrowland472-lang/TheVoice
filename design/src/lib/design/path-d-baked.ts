import { bakeRingRotation, nodeCenter } from "./geometry";
import { pathD } from "./path-curve";
import type { DesignNode, PathNode } from "./types";

/** Path `d` with rotation baked into anchors and cubic handles (no SVG rotate group). */
export function pathDBaked(
  n: Pick<DesignNode, "x" | "y" | "w" | "h" | "rotation">,
  pts: PathNode["points"],
  closed: boolean,
): string {
  const rot = n.rotation ?? 0;
  if (!rot) return pathD(n.x, n.y, pts, closed);
  const c = nodeCenter(n as DesignNode);
  return pathD(0, 0, bakeRingRotation(n.x, n.y, pts, c.x, c.y, rot), closed);
}
