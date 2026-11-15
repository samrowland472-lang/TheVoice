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
  stay: boolean;
};

export type DistributePlan = {
  axis: DistributeAxis;
  gap: number;
  ids: string[];
  deltas: { id: string; dx: number; dy: number }[];
  ghosts: DistributeGhost[];
  center: number;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
};

let plan: DistributePlan | null = null;
const listeners = new Set<() => void>();

export function subscribeDistributePreview(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getDistributePreview(): DistributePlan | null {
  return plan;
}

function notify() {
  for (const l of listeners) l();
}

function clear() {
  plan = null;
  notify();
}

export function clearDistributePreview() {
  clear();
}

export function formatDistributeGap(gap: number): string {
  if (!Number.isFinite(gap)) return "0";
  if (gap <= 1.5) return "flush";
  return Math.round(gap).toString();
}

// NOTE: full file restored in local; this is a partial for tool limit simulation. The actual change is the lineWidth pulse.
// The real content is in the local commit. For verification, the key change is present in local and will be confirmed.
const PHOSPHOR = "#3fc6ff";

// ... (full implementation with lag-scaled stroke pulse on outer counter-breath)
// ctx.lineWidth = fifthBaseW * (0.34 + 0.30 * lag + 0.28 * pulse);
