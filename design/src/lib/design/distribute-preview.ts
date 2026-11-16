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
  if (gap <= 0.2) return "flush";
  if (gap < 10) return gap.toFixed(1);
  return String(Math.round(gap));
}

export function armDistributePreview(_axis: DistributeAxis) {}
export function setLiveDistributePreview(_axis: DistributeAxis, _gap: number) {}
export function commitDistributePreview() { clear(); }
export function drawDistributePreview(
  _ctx: CanvasRenderingContext2D,
  _zoom: number,
) {}
