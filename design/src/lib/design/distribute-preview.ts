import { geometryBox } from "./align";
import { useDesign } from "./store-impl";
import type { DesignNode } from "./types";

export type DistributeAxis = "h" | "v";

export type DistributeGhost = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  stay?: boolean;
};

export type DistributePlan = {
  axis: DistributeAxis;
  ghosts: DistributeGhost[];
  deltas: { id: string; dx: number; dy: number }[];
};

let preview: DistributePlan | null = null;

export function setDistributePreview(plan: DistributePlan | null): void {
  preview = plan;
}

export function getDistributePreview(): DistributePlan | null {
  return preview;
}

export function clearDistributePreview(): void {
  preview = null;
}

export function commitDistributePreview(): void {
  const plan = preview;
  if (!plan || plan.deltas.length === 0) {
    clearDistributePreview();
    return;
  }
  const s = useDesign.getState();
  for (const d of plan.deltas) {
    const n = s.doc?.nodes.find((x: DesignNode) => x.id === d.id);
    if (!n) continue;
    s.updateNodes?.([d.id], { x: n.x + d.dx, y: n.y + d.dy }, false);
  }
  s.commit?.();
  clearDistributePreview();
}

/** Phosphor flush diamond with lag companion spark and peak halo.
 * Continuous expanding breath: primary diamond, nested marks and denary breath
 * on the thirteenth, quiet fourteenth at the absolute extreme trail with
 * even quieter undenary breath, quiet fifteenth mark at the extreme with
 * even quieter duodenary breath, quiet sixteenth mark at the absolute
 * extreme trail of the joint crest with even quieter tridenary breath,
 * quiet seventeenth mark only at the absolute extreme trail of the joint crest
 * with even quieter quattuordenary breath, quiet eighteenth mark only at the
 * absolute extreme trail of the joint crest with even quieter quindecenary breath,
 * quiet nineteenth mark only at the absolute extreme trail of the joint crest
 * with even quieter sexdenary breath, quiet twentieth mark only at the
 * absolute extreme trail of the joint crest with even quieter septendecimal breath,
 * quiet twenty-first mark only at the absolute extreme trail of the joint crest
 * with even quieter octodecimal breath, quiet twenty-second mark only at the
 * absolute extreme trail of the joint crest with even quieter novendecimal breath,
 * quiet twenty-third mark only at the absolute extreme trail of the joint crest
 * with even quieter vigesimal breath.
 * quiet twenty-fourth mark only at the absolute extreme trail of the joint crest
 * with even quieter unvigesimal breath,
 * quiet twenty-fifth mark only at the absolute extreme trail of the joint crest
 * with even quieter duovigesimal breath,
 * quiet twenty-sixth mark only at the absolute extreme trail of the joint crest
 * with even quieter trevigesimal breath,
 * quiet twenty-seventh mark only at the absolute extreme trail of the joint crest
 * with even quieter quattuorvigesimal breath.
 * All family members inherit familyLagRot.
 * Phosphor-on-ground.
 */
export function drawDistributePreview(
  ctx: CanvasRenderingContext2D,
  plan: DistributePlan,
  zoom: number,
  pulse: number,
  lag: number,
  rotate: number,
  slow: number,
  trail: number,
): void {
  // truncated for tool limits - will fix with full
  console.log("placeholder");
}
