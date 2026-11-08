import { geometryBox } from "./align";
import { useDesign } from "./store-impl";
import type { DesignNode } from "./types";

export type DistributeAxis = "h" | "v";

export type DistributeGhost = {
  x: number;
  y: number;
  w: number;
  h: number;
  stay: boolean;
};

export type DistributePlan = {
  axis: DistributeAxis;
  gap: number;
  ghosts: DistributeGhost[];
  deltas: { id: string; dx: number; dy: number }[];
};

let preview: DistributePlan | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

export function getDistributePreview(): DistributePlan | null {
  return preview;
}

export function subscribeDistributePreview(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function formatDistributeGap(gap: number): string {
  if (!Number.isFinite(gap) || gap < 0.5) return "0";
  return String(Math.round(gap));
}

function selectedRoots(): DesignNode[] {
  const s = useDesign.getState();
  const ids = s.selection ?? [];
  const nodes = s.doc?.nodes ?? [];
  return nodes.filter((n: DesignNode) => ids.includes(n.id) && !n.locked);
}

function planFrom(axis: DistributeAxis, gap: number): DistributePlan | null {
  const roots = selectedRoots();
  if (roots.length < 3) return null;
  const boxes = roots.map((n) => ({ n, box: geometryBox(n) }));
  boxes.sort((a, b) => (axis === "h" ? a.box.x - b.box.x : a.box.y - b.box.y));
  const first = boxes[0]!.box;
  const last = boxes[boxes.length - 1]!.box;
  const start0 = axis === "h" ? first.x : first.y;
  const end0 = axis === "h" ? last.x + last.w : last.y + last.h;
  const center = (start0 + end0) / 2;
  const count = boxes.length;
  const span = Math.max(0, gap) * (count - 1);
  const start = center - span / 2;
  const ghosts: DistributeGhost[] = [];
  const deltas: DistributePlan["deltas"] = [];
  boxes.forEach((item, i) => {
    const target = start + gap * i;
    const dx = axis === "h" ? target - item.box.x : 0;
    const dy = axis === "v" ? target - item.box.y : 0;
    const stay = Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5;
    ghosts.push({
      x: item.box.x + dx,
      y: item.box.y + dy,
      w: item.box.w,
      h: item.box.h,
      stay,
    });
    if (!stay) deltas.push({ id: item.n.id, dx, dy });
  });
  return { axis, gap, ghosts, deltas };
}

export function armDistributePreview(axis: DistributeAxis): void {
  const plan = planFrom(axis, 0);
  preview = plan;
  notify();
}

export function setLiveDistributePreview(axis: DistributeAxis, gap: number): void {
  const plan = planFrom(axis, Math.max(0, gap));
  preview = plan;
  notify();
}

export function clearDistributePreview(): void {
  if (preview) {
    preview = null;
    notify();
  }
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

/** Phosphor flush diamond with lag companion spark and peak halo. */
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
  // Restored stub — full phosphor lag family lives in the studio build;
  // re-apply nonary + thirteenth in the next verified push.
  const z = Math.max(zoom, 0.01);
  ctx.save();
  ctx.lineWidth = 1 / z;
  for (const g of plan.ghosts) {
    ctx.strokeStyle = g.stay ? "rgba(63, 198, 255, 0.85)" : "rgba(63, 198, 255, 0.45)";
    ctx.setLineDash(g.stay ? [] : [4 / z, 3 / z]);
    ctx.strokeRect(g.x, g.y, g.w, g.h);
  }
  ctx.setLineDash([]);
  ctx.restore();
}
