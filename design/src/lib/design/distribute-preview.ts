import { geometryBox } from "./align";
import { expandMovePlaces } from "./group-transform";
import { useDesign } from "./store-impl";
import { setStudioStatus } from "./studio-status";
import type { DesignNode } from "./types";

export type DistributeAxis = "h" | "v";

export type DistributeTick = {
  axis: "x" | "y";
  a: number;
  b: number;
  mid: number;
  size: number;
};

export type DistributeGhost = { x: number; y: number; w: number; h: number; stay: boolean };

export type DistributePlan = {
  axis: DistributeAxis;
  gap: number;
  ids: string[];
  deltas: { id: string; dx: number; dy: number }[];
  ghosts: DistributeGhost[];
  ticks: DistributeTick[];
};

type Listener = () => void;

let live: DistributePlan | null = null;
const listeners = new Set<Listener>();

function emit() {
  for (const fn of listeners) fn();
}

/** Selected unlocked layers, skipping anything nested inside another selection. */
export function distributeRoots(nodes: DesignNode[], ids: string[]): DesignNode[] {
  const set = new Set(ids);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const roots: DesignNode[] = [];
  for (const id of ids) {
    const n = byId.get(id);
    if (!n || n.locked) continue;
    let parent = n.parentId;
    let nested = false;
    while (parent) {
      if (set.has(parent)) {
        nested = true;
        break;
      }
      parent = byId.get(parent)?.parentId;
    }
    if (!nested) roots.push(n);
  }
  return roots;
}

export function formatDistributeGap(size: number): string {
  const rounded = Math.round(size * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function planFromBoxes(
  roots: DesignNode[],
  axis: DistributeAxis,
  forcedGap?: number,
): DistributePlan | null {
  if (roots.length < 2) return null;
  const boxes = roots.map((n) => ({ n, box: geometryBox(n) }));
  boxes.sort((a, b) => (axis === "h" ? a.box.x - b.box.x : a.box.y - b.box.y));
  const first = boxes[0]!;
  const last = boxes[boxes.length - 1]!;
  const start = axis === "h" ? first.box.x : first.box.y;
  const end = axis === "h" ? last.box.x + last.box.w : last.box.y + last.box.h;
  const total = boxes.reduce((s, b) => s + (axis === "h" ? b.box.w : b.box.h), 0);
  const natural = boxes.length > 1 ? (end - start - total) / (boxes.length - 1) : 0;
  const gap = forcedGap ?? Math.max(0, natural);

  // Place sequentially from the first box so the extremes stay when gap is natural.
  let cursor = start;
  const ghosts: DistributeGhost[] = [];
  const deltas: DistributePlan["deltas"] = [];
  const ticks: DistributeTick[] = [];
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i]!;
    const size = axis === "h" ? b.box.w : b.box.h;
    const nextPos = cursor;
    const dx = axis === "h" ? nextPos - b.box.x : 0;
    const dy = axis === "v" ? nextPos - b.box.y : 0;
    const stay = i === 0 || i === boxes.length - 1;
    ghosts.push({
      x: axis === "h" ? nextPos : b.box.x,
      y: axis === "v" ? nextPos : b.box.y,
      w: b.box.w,
      h: b.box.h,
      stay,
    });
    if (dx || dy) deltas.push({ id: b.n.id, dx, dy });
    if (i < boxes.length - 1) {
      const mid = nextPos + size + gap / 2;
      ticks.push({
        axis: axis === "h" ? "x" : "y",
        a: nextPos + size,
        b: nextPos + size + gap,
        mid,
        size: gap,
      });
    }
    cursor += size + gap;
  }
  // Mark the final ghost as stay even if the loop already did.
  if (ghosts.length) ghosts[ghosts.length - 1]!.stay = true;

  return {
    axis,
    gap,
    ids: boxes.map((b) => b.n.id),
    deltas,
    ghosts,
    ticks,
  };
}

export function planDistributeWithGap(
  nodes: DesignNode[],
  ids: string[],
  axis: DistributeAxis,
  gap: number,
): DistributePlan | null {
  const roots = distributeRoots(nodes, ids);
  return planFromBoxes(roots, axis, gap);
}

export function planDistribute(
  nodes: DesignNode[],
  ids: string[],
  axis: DistributeAxis,
): DistributePlan | null {
  const roots = distributeRoots(nodes, ids);
  return planFromBoxes(roots, axis);
}

export function distributeMoveCount(plan: DistributePlan): number {
  return plan.deltas.length;
}

/** First click previews the phosphor gaps before any commit. */
export function armDistributePreview(axis: DistributeAxis): DistributePlan | null {
  const { doc, selection } = useDesign.getState();
  if (!doc) return null;
  const plan = planDistribute(doc.nodes, selection, axis);
  live = plan;
  emit();
  if (plan) {
    const way = axis === "h" ? "across" : "down";
    setStudioStatus(`Gap ${formatDistributeGap(plan.gap)} px ${way}`);
  }
  return plan;
}

export function setLiveDistributePreview(axis: DistributeAxis, gap: number): DistributePlan | null {
  const { doc, selection } = useDesign.getState();
  if (!doc) return null;
  const plan = planDistributeWithGap(doc.nodes, selection, axis, Math.max(0, gap));
  live = plan;
  emit();
  return plan;
}

export function getDistributePreview(): DistributePlan | null {
  return live;
}

export function subscribeDistributePreview(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function clearDistributePreview(): void {
  live = null;
  emit();
}

export function cancelDistributePreview(): void {
  clearDistributePreview();
}

export function commitDistributePreview(): boolean {
  const plan = live;
  if (!plan || !plan.deltas.length) {
    clearDistributePreview();
    return false;
  }
  const { doc, updateNodes } = useDesign.getState();
  if (!doc) {
    clearDistributePreview();
    return false;
  }
  const places = plan.deltas.map((d) => {
    const n = doc.nodes.find((x) => x.id === d.id);
    return n ? { id: d.id, x: n.x + d.dx, y: n.y + d.dy } : { id: d.id, x: 0, y: 0 };
  });
  const expanded = expandMovePlaces(doc.nodes, places);
  for (const p of expanded) {
    const n = doc.nodes.find((x) => x.id === p.id);
    if (!n) continue;
    updateNodes([p.id], { x: p.x, y: p.y }, false);
  }
  useDesign.getState().commit();
  clearDistributePreview();
  setStudioStatus(`Distributed · ${formatDistributeGap(plan.gap)} px`);
  return true;
}

const PHOSPHOR = "#3fc6ff";

function diamondPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, rot = 0) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(s, 0);
  ctx.lineTo(0, s);
  ctx.lineTo(-s, 0);
  ctx.closePath();
  ctx.restore();
}

/**
 * Draw the live distribute preview.
 * When the gap collapses to a flush (near-zero), a lag diamond breathes with
 * overshoot, phase-offset inner diamond, vertex flares, a quiet secondary
 * after-image on the trailing inner diamond, soft radial tick length
 * modulation that recedes with the slow breath, and a gentle scale pulse
 * on the outer dashed ring tied to the same slow breath.
 */
export function drawDistributePreview(
  ctx: CanvasRenderingContext2D,
  plan: DistributePlan | null,
  zoom: number,
  flushPulse = 0,
  flushPulseLag = 0,
  flushPulseRotate = 0,
  flushPulseSlow = 0,
  flushPulseTrail = 0,
): void {
  if (!plan || !plan.ghosts.length) return;
  const z = Math.max(0.25, zoom);

  // Ghost plates
  for (const g of plan.ghosts) {
    ctx.save();
    ctx.strokeStyle = PHOSPHOR;
    ctx.globalAlpha = g.stay ? 0.35 : 0.55;
    ctx.lineWidth = 1 / z;
    ctx.setLineDash([4 / z, 3 / z]);
    ctx.strokeRect(g.x, g.y, g.w, g.h);
    ctx.setLineDash([]);
    if (g.stay) {
      ctx.globalAlpha = 0.7;
      ctx.font = `${10 / z}px ui-monospace, monospace`;
      ctx.fillStyle = PHOSPHOR;
      ctx.fillText("stay", g.x + 4 / z, g.y + 12 / z);
    }
    ctx.restore();
  }

  // Equal-spacing ticks
  ctx.save();
  ctx.strokeStyle = PHOSPHOR;
  ctx.fillStyle = PHOSPHOR;
  ctx.lineWidth = 1 / z;
  for (const t of plan.ticks) {
    ctx.globalAlpha = 0.6;
    if (t.axis === "x") {
      const y = plan.ghosts[0]!.y + plan.ghosts[0]!.h / 2;
      ctx.beginPath();
      ctx.moveTo(t.a, y);
      ctx.lineTo(t.b, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(t.a, y - 4 / z);
      ctx.lineTo(t.a, y + 4 / z);
      ctx.moveTo(t.b, y - 4 / z);
      ctx.lineTo(t.b, y + 4 / z);
      ctx.stroke();
    } else {
      const x = plan.ghosts[0]!.x + plan.ghosts[0]!.w / 2;
      ctx.beginPath();
      ctx.moveTo(x, t.a);
      ctx.lineTo(x, t.b);
      ctx.stroke();
    }
  }
  ctx.restore();

  // Flush lag diamond — only when the gap has collapsed
  if (plan.gap > 1.5) return;

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const g of plan.ghosts) {
    minX = Math.min(minX, g.x);
    minY = Math.min(minY, g.y);
    maxX = Math.max(maxX, g.x + g.w);
    maxY = Math.max(maxY, g.y + g.h);
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const base = Math.max(28, Math.min(maxX - minX, maxY - minY) * 0.55) / 2;

  // Parabolic settle swell + slight scale overshoot
  const swell = 0.82 + 0.28 * flushPulse + 0.08 * Math.sin(flushPulse * Math.PI);
  const overshoot = flushPulse > 0.72 ? (flushPulse - 0.72) / 0.28 : 0;
  const primary = base * swell * (1 + overshoot * 0.12);
  const rot = flushPulseRotate * 0.15;

  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // Outer dashed ring — gentle scale pulse with the slow breath so the whole lag mark breathes as one family
  const ringScale = 1.32 + 0.06 * flushPulseSlow; // 1.32 → 1.38 as slow breath peaks
  ctx.globalAlpha = 0.22 + 0.18 * flushPulseSlow;
  ctx.strokeStyle = PHOSPHOR;
  ctx.lineWidth = 1 / z;
  ctx.setLineDash([3 / z, 5 / z]);
  diamondPath(ctx, cx, cy, primary * ringScale, rot * 0.4);
  ctx.stroke();
  ctx.setLineDash([]);

  // Trailing after-image of the primary
  ctx.globalAlpha = 0.18 * (1 - flushPulse * 0.4);
  diamondPath(ctx, cx, cy, primary * 1.08, rot - 0.08);
  ctx.stroke();

  // Primary diamond with opacity dip
  ctx.globalAlpha = 0.55 + 0.25 * (1 - Math.abs(flushPulse - 0.5) * 2);
  ctx.lineWidth = 1.4 / z;
  diamondPath(ctx, cx, cy, primary, rot);
  ctx.stroke();

  // Counter-rotating outline
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 0.8 / z;
  diamondPath(ctx, cx, cy, primary * 0.92, -rot * 1.6);
  ctx.stroke();

  // Phase-offset inner diamond
  const inner = primary * (0.48 + 0.08 * flushPulseLag);
  const innerRot = rot + 0.35 + flushPulseLag * 0.2;
  ctx.globalAlpha = 0.45 + 0.2 * flushPulseLag;
  diamondPath(ctx, cx, cy, inner, innerRot);
  ctx.stroke();

  // Quiet secondary after-image on the trailing inner diamond itself
  const trailScale = 1.06 + 0.04 * flushPulseTrail;
  ctx.globalAlpha = 0.12 + 0.06 * (1 - flushPulseTrail);
  ctx.lineWidth = 0.7 / z;
  diamondPath(ctx, cx + 1.2 / z, cy + 0.6 / z, inner * trailScale, innerRot - 0.12);
  ctx.stroke();
  // Softer second echo slightly further behind
  ctx.globalAlpha = 0.07;
  diamondPath(ctx, cx + 2.4 / z, cy + 1.1 / z, inner * (trailScale + 0.04), innerRot - 0.22);
  ctx.stroke();

  // Inner echo
  ctx.globalAlpha = 0.22 * flushPulseSlow;
  diamondPath(ctx, cx, cy, inner * 0.62, innerRot + 0.4);
  ctx.stroke();

  // Radial ticks — soft length modulation tied to the slow breath.
  // Primary ticks recede slightly when the inner diamond after-image / echo is brightest.
  const recede = 0.94 + 0.06 * (1 - flushPulseSlow); // 1.00 → 0.94 as slow breath peaks
  ctx.globalAlpha = 0.4 * (0.85 + 0.15 * (1 - flushPulseSlow));
  ctx.lineWidth = 0.9 / z;
  for (let i = 0; i < 4; i++) {
    const a = rot + (i * Math.PI) / 2;
    const r0 = primary * 0.55;
    const r1 = primary * 1.12 * recede;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.stroke();
  }
  // Vertical secondary ticks — same quiet recede so the family stays coherent
  ctx.globalAlpha = 0.28 * (0.88 + 0.12 * (1 - flushPulseSlow));
  const vRecede = 0.96 + 0.04 * (1 - flushPulseSlow);
  ctx.beginPath();
  ctx.moveTo(cx, cy - primary * 1.2 * vRecede);
  ctx.lineTo(cx, cy - primary * 0.85 * vRecede);
  ctx.moveTo(cx, cy + primary * 0.85 * vRecede);
  ctx.lineTo(cx, cy + primary * 1.2 * vRecede);
  ctx.stroke();

  // Rotating cross-hair
  ctx.globalAlpha = 0.2 + 0.1 * flushPulse;
  ctx.rotate(flushPulseRotate * 0.05);
  ctx.beginPath();
  ctx.moveTo(cx - primary * 0.7, cy);
  ctx.lineTo(cx + primary * 0.7, cy);
  ctx.moveTo(cx, cy - primary * 0.7);
  ctx.lineTo(cx, cy + primary * 0.7);
  ctx.stroke();

  // Vertex flares — crest with the overshoot, softer falloff
  if (overshoot > 0.02) {
    const flareA = Math.min(0.55, overshoot * 0.9);
    const verts = [
      [0, -primary],
      [primary, 0],
      [0, primary],
      [-primary, 0],
    ];
    for (const [vx, vy] of verts) {
      const px = cx + vx * Math.cos(rot) - vy * Math.sin(rot);
      const py = cy + vx * Math.sin(rot) + vy * Math.cos(rot);
      ctx.globalAlpha = flareA * 0.7;
      ctx.beginPath();
      ctx.arc(px, py, (3.5 + overshoot * 4) / z, 0, Math.PI * 2);
      ctx.fillStyle = PHOSPHOR;
      ctx.fill();
      // Soft outer halo so flares never compete with primary radial ticks
      ctx.globalAlpha = flareA * 0.25;
      ctx.beginPath();
      ctx.arc(px, py, (7 + overshoot * 6) / z, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Companion / bilateral flares + sparks on the trail phase
  if (flushPulseTrail > 0.4) {
    ctx.globalAlpha = 0.15 * flushPulseTrail;
    const sparkR = primary * 1.25;
    for (let i = 0; i < 3; i++) {
      const a = flushPulseRotate + i * 2.1;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * sparkR, cy + Math.sin(a) * sparkR, 1.6 / z, 0, Math.PI * 2);
      ctx.fillStyle = PHOSPHOR;
      ctx.fill();
    }
  }

  ctx.restore();
}
