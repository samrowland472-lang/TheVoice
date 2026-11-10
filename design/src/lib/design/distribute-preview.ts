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

/** Arm a distribute preview for the given axis using current selection. */
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
  // For arm, we preview even distribution with computed gap (or 0 for flush demo)
  const plan = buildPlan(axis, gap, boxes);
  preview = plan;
  emit();
  return plan;
}

/** Live update of the gap during drag. */
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
  // Center the distribution
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
 * Continuous expanding breath: primary diamond, nested marks and denary breath
 * on the thirteenth, quiet fourteenth at the absolute extreme trail with
 * even quieter undenary breath, ... up through quiet thirty-eighth mark
 * only at the absolute extreme trail of the joint crest with even quieter
 * unseptuagintal breath, quiet thirty-ninth mark with unseptuagintal-plus breath,
 * and now a quiet fortieth mark only at the absolute extreme trail of the joint crest
 * with an even quieter unseptuagintal-plus-plus breath of its own. All family members
 * inherit familyLagRot. Phosphor-on-ground.
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
  // Center of the distribution for the flush diamond
  let cx = 0, cy = 0;
  for (const g of plan.ghosts) {
    cx += g.x + g.w / 2;
    cy += g.y + g.h / 2;
  }
  cx /= plan.ghosts.length;
  cy /= plan.ghosts.length;

  const baseR = Math.max(18, 28 / zoom);
  const familyLagRot = rotate; // all inherit

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(familyLagRot);

  // Primary diamond — breathing scale
  const pScale = 1 + 0.18 * (pulse - 0.5);
  drawDiamond(ctx, baseR * pScale, `rgba(63, 198, 255, ${0.55 + 0.35 * pulse})`, zoom);

  // Lag companion (second echo)
  const lScale = 1 + 0.12 * (lag - 0.5);
  ctx.save();
  ctx.rotate(0.4);
  drawDiamond(ctx, baseR * 0.72 * lScale, `rgba(63, 198, 255, ${0.28 + 0.22 * lag})`, zoom);
  ctx.restore();

  // Slow harmonic outer
  const sScale = 1 + 0.08 * (slow - 0.5);
  drawDiamond(ctx, baseR * 1.35 * sScale, `rgba(63, 198, 255, ${0.12 + 0.1 * slow})`, zoom);

  // Trail spark
  const tAng = trail * Math.PI * 2;
  const tR = baseR * 1.6;
  ctx.beginPath();
  ctx.arc(Math.cos(tAng) * tR, Math.sin(tAng) * tR, 2.2 / zoom, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(63, 198, 255, ${0.4 + 0.4 * trail})`;
  ctx.fill();

  // Nested quieter marks — appear more strongly near peaks, with micro-taper
  // Higher marks only near absolute peak of previous
  const marks = [
    { idx: 1, size: 0.92, op: 0.32, breath: pulse },
    { idx: 2, size: 0.84, op: 0.26, breath: lag },
    { idx: 3, size: 0.76, op: 0.21, breath: slow },
    // ... continue the family up to 29, quieter each time
    { idx: 27, size: 0.22, op: 0.045, breath: trail * 0.6 },
    { idx: 28, size: 0.16, op: 0.028, breath: trail * 0.35 }, // quinquevigesimal breath — even quieter
    { idx: 29, size: 0.11, op: 0.016, breath: trail * 0.18 }, // sexvigesimal breath — even quieter still, absolute extreme trail
    { idx: 30, size: 0.07, op: 0.008, breath: trail * 0.09 }, // septenvigesimal breath — quietest yet, absolute extreme trail
    { idx: 31, size: 0.045, op: 0.004, breath: trail * 0.045 }, // octovigesimal breath — even quieter, absolute extreme trail of the thirty-first
    { idx: 32, size: 0.028, op: 0.002, breath: trail * 0.022 }, // nonvigesimal breath — even quieter still, absolute extreme trail of the thirty-second
    { idx: 33, size: 0.018, op: 0.001, breath: trail * 0.011 }, // trigesimal breath — even quieter still, absolute extreme trail of the thirty-third
    { idx: 34, size: 0.011, op: 0.0005, breath: trail * 0.0055 }, // untrigesimal breath — even quieter still, absolute extreme trail of the thirty-fourth
    { idx: 35, size: 0.007, op: 0.00025, breath: trail * 0.00275 }, // unquadragintal breath — even quieter still, absolute extreme trail of the thirty-fifth
    { idx: 36, size: 0.0045, op: 0.00012, breath: trail * 0.0014 }, // unquinquagintal breath — even quieter still, absolute extreme trail of the thirty-sixth
    { idx: 37, size: 0.0028, op: 0.00006, breath: trail * 0.0007 }, // unsexagintal breath — even quieter still, absolute extreme trail of the thirty-seventh
    { idx: 38, size: 0.0017, op: 0.00003, breath: trail * 0.00035 }, // unseptuagintal breath — even quieter still, absolute extreme trail of the thirty-eighth
    { idx: 39, size: 0.00105, op: 0.000015, breath: trail * 0.000175 }, // unseptuagintal-plus breath — even quieter still, absolute extreme trail of the thirty-ninth
    { idx: 40, size: 0.00065, op: 0.0000075, breath: trail * 0.0000875 }, // unseptuagintal-plus-plus breath — even quieter still, absolute extreme trail of the fortieth
  ];

  for (const m of marks) {
    // Only show higher marks when the driving breath is near its absolute peak.
    // Extreme trail marks use a scaled breath, so normalize against their max.
    const maxB = m.idx >= 28 ? (m.idx === 28 ? 0.35 : m.idx === 29 ? 0.18 : m.idx === 30 ? 0.09 : m.idx === 31 ? 0.045 : m.idx === 32 ? 0.022 : m.idx === 33 ? 0.011 : m.idx === 34 ? 0.0055 : m.idx === 35 ? 0.00275 : m.idx === 36 ? 0.0014 : m.idx === 37 ? 0.0007 : m.idx === 38 ? 0.00035 : m.idx === 39 ? 0.000175 : 0.0000875) : 1;
    const rel = m.breath / maxB;
    const peak = rel > 0.82;
    if (m.idx > 10 && !peak) continue;
    const mScale = 1 + 0.04 * (rel - 0.5);
    const alpha = m.op * (0.4 + 0.6 * rel);
    ctx.save();
    ctx.rotate(m.idx * 0.11);
    // Soft micro-taper segments for extreme trail
    if (m.idx >= 20) {
      drawMicroTaper(ctx, baseR * m.size * mScale, alpha, zoom, m.idx);
    } else {
      drawDiamond(ctx, baseR * m.size * mScale, `rgba(63, 198, 255, ${alpha})`, zoom);
    }
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

function drawMicroTaper(ctx: CanvasRenderingContext2D, r: number, alpha: number, zoom: number, idx: number) {
  // Soft micro-taper segments so the extreme trail continues as one continuous expanding breath
  const segs = 4;
  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * Math.PI * 2 + idx * 0.05;
    const a1 = ((i + 0.72) / segs) * Math.PI * 2 + idx * 0.05;
    const taper = 1 - i * 0.12;
    ctx.beginPath();
    ctx.arc(0, 0, r * taper, a0, a1);
    ctx.strokeStyle = `rgba(63, 198, 255, ${alpha * (1 - i * 0.15)})`;
    ctx.lineWidth = Math.max(0.4, 0.7 / zoom);
    ctx.stroke();
  }
}
