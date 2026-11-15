import { nodeBounds } from "./layer-groups";
import { useDesign } from "./store";
import type { DesignNode } from "./types";

export type DistributeAxis = "h" | "v";

export type DistributeGhost = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  stay: boolean;
  origX: number;
  origY: number;
};

export type DistributePlan = {
  axis: DistributeAxis;
  gap: number;
  ghosts: DistributeGhost[];
  deltas: { id: string; dx: number; dy: number }[];
};

const PHOSPHOR = "#3fc6ff";

type Listener = () => void;
const listeners = new Set<Listener>();
let livePlan: DistributePlan | null = null;

function emit() {
  for (const l of listeners) l();
}

export function subscribeDistributePreview(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getDistributePreview(): DistributePlan | null {
  return livePlan;
}

export function clearDistributePreview(): void {
  livePlan = null;
  emit();
}

export function formatDistributeGap(gap: number): string {
  const v = Math.max(0, gap);
  if (v < 0.05) return "0";
  const r = Math.round(v * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

function selectedMovableNodes(): DesignNode[] {
  const s = useDesign.getState();
  const doc = s.doc;
  if (!doc) return [];
  const sel = new Set(s.selection);
  return doc.nodes.filter((n) => sel.has(n.id) && n.kind !== "group");
}

function computePlan(axis: DistributeAxis, gap: number): DistributePlan | null {
  const nodes = selectedMovableNodes();
  if (nodes.length < 3) return null;
  const items = nodes.map((n) => {
    const b = nodeBounds(n);
    return { node: n, b };
  });
  items.sort((a, b) => (axis === "h" ? a.b.x - b.b.x : a.b.y - b.b.y));
  const first = items[0]!;
  const last = items[items.length - 1]!;
  const start = axis === "h" ? first.b.x : first.b.y;
  const end = axis === "h" ? last.b.x + last.b.w : last.b.y + last.b.h;
  const totalSize = items.reduce((s, it) => s + (axis === "h" ? it.b.w : it.b.h), 0);
  // Prefer caller gap when set; otherwise even-fill between extremes
  const usedGap = Number.isFinite(gap) ? Math.max(0, gap) : Math.max(0, (end - start - totalSize) / (items.length - 1));
  let cursor = start;
  const ghosts: DistributeGhost[] = [];
  const deltas: { id: string; dx: number; dy: number }[] = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i]!;
    const stay = i === 0 || i === items.length - 1;
    const nx = axis === "h" ? cursor : it.b.x;
    const ny = axis === "v" ? cursor : it.b.y;
    ghosts.push({
      id: it.node.id,
      x: nx,
      y: ny,
      w: it.b.w,
      h: it.b.h,
      stay,
      origX: it.b.x,
      origY: it.b.y,
    });
    if (!stay) {
      deltas.push({
        id: it.node.id,
        dx: nx - it.b.x,
        dy: ny - it.b.y,
      });
    }
    cursor += (axis === "h" ? it.b.w : it.b.h) + usedGap;
  }
  return { axis, gap: usedGap, ghosts, deltas };
}

export function armDistributePreview(axis: DistributeAxis): void {
  const plan = computePlan(axis, NaN);
  livePlan = plan;
  emit();
}

export function setLiveDistributePreview(axis: DistributeAxis, gap: number): void {
  const plan = computePlan(axis, gap);
  livePlan = plan;
  emit();
}

export function commitDistributePreview(): void {
  const plan = livePlan;
  if (!plan || !plan.deltas.length) {
    clearDistributePreview();
    return;
  }
  const s = useDesign.getState();
  s.commit();
  const byId = new Map(plan.deltas.map((d) => [d.id, d]));
  s.mapNodes(
    plan.deltas.map((d) => d.id),
    (n) => {
      const d = byId.get(n.id);
      if (!d) return n;
      return { ...n, x: n.x + d.dx, y: n.y + d.dy };
    },
    false,
  );
  clearDistributePreview();
}

/** Draw the live distribute ghosts and the flush diamond with orbital sparks. */
export function drawDistributePreview(
  ctx: CanvasRenderingContext2D,
  plan: DistributePlan,
  zoom: number,
  flushPulse: number,
  flushPulseLag: number,
  flushPulseRotate: number,
  flushPulseSlow: number,
  flushPulseTrail: number,
): void {
  if (!plan || !plan.ghosts.length) return;
  ctx.save();
  const g = plan.gap;
  const flush = g <= 1.5;
  const labelFade = flush ? Math.max(0, 1 - g / 1.5) : 0;

  // Ghost boxes for the even-spacing preview
  for (const ghost of plan.ghosts) {
    ctx.beginPath();
    ctx.rect(ghost.x, ghost.y, ghost.w, ghost.h);
    ctx.fillStyle = ghost.stay ? "rgba(63, 198, 255, 0.08)" : "rgba(63, 198, 255, 0.14)";
    ctx.fill();
    ctx.strokeStyle = ghost.stay ? "rgba(63, 198, 255, 0.55)" : PHOSPHOR;
    ctx.lineWidth = (ghost.stay ? 1.2 : 1.6) / zoom;
    ctx.setLineDash(ghost.stay ? [4 / zoom, 3 / zoom] : []);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Gap-tick labels that fade into the flush diamond
  if (!flush || labelFade < 0.95) {
    ctx.font = `${11 / zoom}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = `rgba(126, 224, 255, ${0.85 * (1 - labelFade)})`;
    for (let i = 0; i < plan.ghosts.length - 1; i++) {
      const a = plan.ghosts[i]!;
      const b = plan.ghosts[i + 1]!;
      const midX = plan.axis === "h" ? a.x + a.w + g / 2 : (a.x + a.w / 2 + b.x + b.w / 2) / 2;
      const midY = plan.axis === "v" ? a.y + a.h + g / 2 : (a.y + a.h / 2 + b.y + b.h / 2) / 2;
      ctx.fillText(formatDistributeGap(g), midX, midY);
    }
  }

  if (!flush) {
    ctx.restore();
    return;
  }

  // Flush diamond — phosphor-on-ground, no extra chrome
  const mid = plan.ghosts[Math.floor(plan.ghosts.length / 2)]!;
  const cx = mid.x + mid.w / 2;
  const cy = mid.y + mid.h / 2;
  const size = (18 + flushPulse * 6) / zoom;
  const trailFade = 0.55 + 0.45 * flushPulseTrail;

  function diamond(x: number, y: number, s: number, rot: number, alpha: number, width: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s, 0);
    ctx.closePath();
    ctx.strokeStyle = `rgba(63, 198, 255, ${alpha})`;
    ctx.lineWidth = width / zoom;
    ctx.stroke();
    ctx.restore();
  }

  // Primary breath diamond
  diamond(cx, cy, size, flushPulseRotate, 0.9, 1.6 + flushPulse * 0.8);

  // Lag-scaled stroke pulse on the outer counter-breath diamond itself (width breathes with lag + pulse, dissolves with trail-fade)
  const counterSize = size * (1.35 + flushPulseSlow * 0.15);
  const counterRot = flushPulseRotate + Math.PI / 4;
  diamond(
    cx,
    cy,
    counterSize,
    counterRot,
    0.55 * trailFade,
    1.2 + flushPulseLag * 1.4,
  );

  // Second slower harmonic spark
  const slowSparkR = counterSize + 4 / zoom;
  const slowAng = flushPulseRotate * 0.6 + Math.PI;
  const sx = cx + Math.cos(slowAng) * slowSparkR;
  const sy = cy + Math.sin(slowAng) * slowSparkR;
  ctx.beginPath();
  ctx.arc(sx, sy, (2.2 + flushPulseSlow * 1.2) / zoom, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(63, 198, 255, ${0.7 * trailFade})`;
  ctx.fill();

  // Soft radial falloff under the third opposite-phase spark on the outer counter-breath diamond (inherits trail-fade, phosphor-on-ground)
  const oppAng = flushPulseRotate + Math.PI + 0.4;
  const oppR = counterSize + 7 / zoom;
  const ox = cx + Math.cos(oppAng) * oppR;
  const oy = cy + Math.sin(oppAng) * oppR;
  const fall = ctx.createRadialGradient(ox, oy, 0, ox, oy, 8 / zoom);
  fall.addColorStop(0, `rgba(63, 198, 255, ${0.35 * trailFade})`);
  fall.addColorStop(1, "rgba(63, 198, 255, 0)");
  ctx.fillStyle = fall;
  ctx.beginPath();
  ctx.arc(ox, oy, 8 / zoom, 0, Math.PI * 2);
  ctx.fill();

  // Quieter opposite-phase third spark on the outer counter-breath diamond (further offset, smaller, dissolves with trail-fade)
  ctx.beginPath();
  ctx.arc(ox, oy, (1.6 + flushPulse * 0.6) / zoom, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(126, 224, 255, ${0.55 * trailFade})`;
  ctx.fill();

  // Trailing micro-sparks on the outer counter-breath diamond — each quieter, further, smaller, own soft radial falloff, shares trail-fade
  // Twenty-second quieter trailing micro-spark (furthest offset, smallest)
  const SPARK_COUNT = 22;
  for (let i = 1; i <= SPARK_COUNT; i++) {
    const t = i / SPARK_COUNT;
    const ang = counterRot + Math.PI + t * 1.8;
    const offset = (6 + i * 1.15) / zoom;
    const radius = Math.max(0.35, 1.8 - t * 1.4) / zoom;
    const px = cx + Math.cos(ang) * (counterSize + offset);
    const py = cy + Math.sin(ang) * (counterSize + offset);
    const quiet = (0.42 - t * 0.32) * trailFade;
    const glow = ctx.createRadialGradient(px, py, 0, px, py, radius * 4.2);
    glow.addColorStop(0, `rgba(63, 198, 255, ${Math.max(0, quiet)})`);
    glow.addColorStop(1, "rgba(63, 198, 255, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(px, py, radius * 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(126, 224, 255, ${Math.max(0, quiet * 1.4)})`;
    ctx.fill();
  }

  ctx.restore();
}
