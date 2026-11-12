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
  gap: number;
  ghosts: DistributeGhost[];
  deltas: { id: string; dx: number; dy: number }[];
};

let preview: DistributePlan | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const fn of listeners) fn();
}

export function setDistributePreview(plan: DistributePlan | null): void {
  preview = plan;
  emit();
}

export function getDistributePreview(): DistributePlan | null {
  return preview;
}

export function clearDistributePreview(): void {
  preview = null;
  emit();
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

export function subscribeDistributePreview(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function formatDistributeGap(gap: number): string {
  if (gap < 0.05) return "0";
  if (gap < 10) return gap.toFixed(1).replace(/\.0$/, "");
  return Math.round(gap).toString();
}

export function armDistributePreview(axis: DistributeAxis): DistributePlan | null {
  const s = useDesign.getState();
  const doc = s.doc;
  const selection = s.selection;
  if (!doc || selection.length < 3) {
    preview = null;
    emit();
    return null;
  }
  const nodes = selection
    .map((id) => doc.nodes.find((n) => n.id === id))
    .filter((n): n is DesignNode => !!n && !n.locked);
  if (nodes.length < 3) {
    preview = null;
    emit();
    return null;
  }
  const boxes = nodes.map((n) => ({ id: n.id, box: geometryBox(n), node: n }));
  boxes.sort((a, b) => (axis === "h" ? a.box.x - b.box.x : a.box.y - b.box.y));
  const first = boxes[0]!.box;
  const last = boxes[boxes.length - 1]!.box;
  const start = axis === "h" ? first.x : first.y;
  const end = axis === "h" ? last.x + last.w : last.y + last.h;
  const total = boxes.reduce((s, item) => s + (axis === "h" ? item.box.w : item.box.h), 0);
  const gap = boxes.length > 1 ? Math.max(0, (end - start - total) / (boxes.length - 1)) : 0;
  const plan = buildPlan(axis, gap, boxes);
  preview = plan;
  emit();
  return plan;
}

export function setLiveDistributePreview(axis: DistributeAxis, gap: number): void {
  const s = useDesign.getState();
  const doc = s.doc;
  const selection = s.selection;
  if (!doc || selection.length < 3) {
    preview = null;
    emit();
    return;
  }
  const nodes = selection
    .map((id) => doc.nodes.find((n) => n.id === id))
    .filter((n): n is DesignNode => !!n && !n.locked);
  if (nodes.length < 3) {
    preview = null;
    emit();
    return;
  }
  const boxes = nodes.map((n) => ({ id: n.id, box: geometryBox(n), node: n }));
  boxes.sort((a, b) => (axis === "h" ? a.box.x - b.box.x : a.box.y - b.box.y));
  const plan = buildPlan(axis, Math.max(0, gap), boxes);
  preview = plan;
  emit();
}

function buildPlan(
  axis: DistributeAxis,
  gap: number,
  boxes: { id: string; box: { x: number; y: number; w: number; h: number }; node: DesignNode }[],
): DistributePlan {
  const first = boxes[0]!.box;
  const last = boxes[boxes.length - 1]!.box;
  const start = axis === "h" ? first.x : first.y;
  const end = axis === "h" ? last.x + last.w : last.y + last.h;
  const total = boxes.reduce((s, item) => s + (axis === "h" ? item.box.w : item.box.h), 0);
  const available = end - start;
  const used = total + gap * (boxes.length - 1);
  const offset = (available - used) / 2;
  let cursor = start + offset;
  const ghosts: DistributeGhost[] = [];
  const deltas: { id: string; dx: number; dy: number }[] = [];
  for (const item of boxes) {
    const b = item.box;
    const size = axis === "h" ? b.w : b.h;
    const target = cursor;
    const dx = axis === "h" ? target - b.x : 0;
    const dy = axis === "v" ? target - b.y : 0;
    ghosts.push({
      id: item.id,
      x: b.x + dx,
      y: b.y + dy,
      w: b.w,
      h: b.h,
      stay: Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5,
    });
    if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
      deltas.push({ id: item.id, dx, dy });
    }
    cursor += size + gap;
  }
  return { axis, gap, ghosts, deltas };
}

/** Phosphor flush diamond with lag companion spark and peak halo.
 * Continuous expanding breath: primary diamond, nested marks, and a quieter
 * fifth mark only near the absolute peak of the trail breath. Trail spark
 * carries a micro-taper so extreme contact reads as one continuous breath.
 * All family members inherit familyLagRot. Phosphor-on-ground.
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
  if (!plan || plan.ghosts.length < 2) return;
  let cx = 0, cy = 0;
  for (const g of plan.ghosts) {
    cx += g.x + g.w / 2;
    cy += g.y + g.h / 2;
  }
  cx /= plan.ghosts.length;
  cy /= plan.ghosts.length;

  const baseR = Math.max(18, 28 / zoom);
  const familyLagRot = rotate;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(familyLagRot);

  const pScale = 1 + 0.18 * (pulse - 0.5);
  drawDiamond(ctx, baseR * pScale, `rgba(63, 198, 255, ${0.55 + 0.35 * pulse})`, zoom);

  const lScale = 1 + 0.12 * (lag - 0.5);
  ctx.save();
  ctx.rotate(0.4);
  drawDiamond(ctx, baseR * 0.72 * lScale, `rgba(63, 198, 255, ${0.28 + 0.22 * lag})`, zoom);
  ctx.restore();

  const sScale = 1 + 0.08 * (slow - 0.5);
  drawDiamond(ctx, baseR * 1.35 * sScale, `rgba(63, 198, 255, ${0.12 + 0.1 * slow})`, zoom);

  const tAng = trail * Math.PI * 2;
  const tR = baseR * 1.6;
  // Micro-taper: spark radius eases smaller near trail extremes so contact reads continuous
  const taper = 0.65 + 0.35 * Math.sin(trail * Math.PI);
  const sparkR = (2.2 / zoom) * taper;
  ctx.beginPath();
  ctx.arc(Math.cos(tAng) * tR, Math.sin(tAng) * tR, sparkR, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(63, 198, 255, ${(0.4 + 0.4 * trail) * (0.75 + 0.25 * taper)})`;
  ctx.fill();

  // Quiet fifth mark only near absolute peak of the trail breath — softened further
  const marks = [
    { idx: 1, size: 0.85, op: 0.35, breath: pulse },
    { idx: 2, size: 0.62, op: 0.22, breath: lag },
    { idx: 3, size: 0.48, op: 0.14, breath: slow },
    { idx: 4, size: 0.36, op: 0.09, breath: trail },
    { idx: 5, size: 0.16, op: 0.028, breath: trail * 0.48 },
  ];

  for (const m of marks) {
    const maxB = m.idx === 5 ? 0.48 : 1;
    const rel = m.breath / maxB;
    const peak = rel > (m.idx === 5 ? 0.86 : 0.78);
    if (m.idx > 2 && !peak) continue;
    const mScale = 1 + 0.04 * (rel - 0.5);
    const alpha = m.op * (0.45 + 0.55 * rel);
    ctx.save();
    ctx.rotate(m.idx * 0.18);
    drawDiamond(ctx, baseR * m.size * mScale, `rgba(63, 198, 255, ${alpha})`, zoom);
    ctx.restore();
  }

  ctx.restore();
}

function drawDiamond(ctx: CanvasRenderingContext2D, r: number, style: string, zoom: number) {
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r, 0);
  ctx.lineTo(0, r);
  ctx.lineTo(-r, 0);
  ctx.closePath();
  ctx.strokeStyle = style;
  ctx.lineWidth = Math.max(0.6, 1.1 / zoom);
  ctx.stroke();
}
