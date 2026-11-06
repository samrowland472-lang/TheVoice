import { geometryBox } from "./align";
import { expandMovePlaces } from "./group-transform";
import { useDesign } from "./store-impl";
import { holdStudioStatus, releaseStudioStatus } from "./studio-status";
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

/**
 * Even gap between geometry boxes. First and last stay put; the middle shifts.
 * Returns null until three unlocked roots can share a gap.
 */
export function planDistributeWithGap(
  nodes: DesignNode[],
  ids: string[],
  axis: DistributeAxis,
  gap: number,
): DistributePlan | null {
  const roots = distributeRoots(nodes, ids);
  if (roots.length < 3) return null;
  const items = roots.map((n) => ({ n, box: geometryBox(n) }));
  items.sort((a, b) => (axis === "h" ? a.box.x - b.box.x : a.box.y - b.box.y));
  const first = items[0]!.box;
  const last = items[items.length - 1]!.box;
  const start0 = axis === "h" ? first.x : first.y;
  const end0 = axis === "h" ? last.x + last.w : last.y + last.h;
  const center = (start0 + end0) / 2;
  const total = items.reduce((sum, item) => sum + (axis === "h" ? item.box.w : item.box.h), 0);
  const span = Math.max(0, gap) * (items.length - 1) + total;
  const start = center - span / 2;

  const deltas: DistributePlan["deltas"] = [];
  const ghosts: DistributeGhost[] = [];
  const ticks: DistributeTick[] = [];
  let cursor = start;
  const placed: DistributeGhost[] = [];
  for (const item of items) {
    const dx = axis === "h" ? cursor - item.box.x : 0;
    const dy = axis === "v" ? cursor - item.box.y : 0;
    deltas.push({ id: item.n.id, dx, dy });
    const ghost = {
      x: item.box.x + dx,
      y: item.box.y + dy,
      w: item.box.w,
      h: item.box.h,
      stay: false,
    };
    ghosts.push(ghost);
    placed.push(ghost);
    cursor += (axis === "h" ? item.box.w : item.box.h) + Math.max(0, gap);
  }
  for (let i = 0; i < placed.length - 1; i++) {
    const a = placed[i]!;
    const b = placed[i + 1]!;
    if (axis === "h") {
      ticks.push({
        axis: "x",
        a: a.x + a.w,
        b: b.x,
        mid: (a.y + a.h / 2 + b.y + b.h / 2) / 2,
        size: gap,
      });
    } else {
      ticks.push({
        axis: "y",
        a: a.y + a.h,
        b: b.y,
        mid: (a.x + a.w / 2 + b.x + b.w / 2) / 2,
        size: gap,
      });
    }
  }
  return { axis, gap, ids: roots.map((n) => n.id), deltas, ghosts, ticks };
}

export function setLiveDistributePreview(axis: DistributeAxis, gap: number): DistributePlan | null {
  const doc = useDesign.getState().doc;
  const selection = useDesign.getState().selection;
  if (!doc) return null;
  const plan = planDistributeWithGap(doc.nodes, selection, axis, gap);
  if (!plan) {
    preview = null;
    emit();
    return null;
  }
  preview = plan;
  emit();
  const way = axis === "h" ? "across" : "down";
  const label = gap <= 1.5 ? `Flush · ${formatDistributeGap(gap)} px` : `Gap ${formatDistributeGap(gap)} px ${way}`;
  holdStudioStatus(`${label} · drag to snap · release to apply`);
  return plan;
}

/**
 * Even gap between geometry boxes. First and last stay put; the middle shifts.
 * Returns null until three unlocked roots can share a gap.
 */
export function planDistribute(nodes: DesignNode[], ids: string[], axis: DistributeAxis): DistributePlan | null {
  const roots = distributeRoots(nodes, ids);
  if (roots.length < 3) return null;
  const items = roots.map((n) => ({ n, box: geometryBox(n) }));
  items.sort((a, b) => (axis === "h" ? a.box.x - b.box.x : a.box.y - b.box.y));
  const first = items[0]!.box;
  const last = items[items.length - 1]!.box;
  const span = axis === "h" ? last.x + last.w - first.x : last.y + last.h - first.y;
  const total = items.reduce((sum, item) => sum + (axis === "h" ? item.box.w : item.box.h), 0);
  const gap = (span - total) / (items.length - 1);
  if (!Number.isFinite(gap)) return null;

  const deltas: DistributePlan["deltas"] = [];
  const ghosts: DistributeGhost[] = [];
  const ticks: DistributeTick[] = [];
  let cursor = axis === "h" ? first.x : first.y;
  const placed: DistributeGhost[] = [];
  for (const item of items) {
    const dx = axis === "h" ? cursor - item.box.x : 0;
    const dy = axis === "v" ? cursor - item.box.y : 0;
    deltas.push({ id: item.n.id, dx, dy });
    const ghost = {
      x: item.box.x + dx,
      y: item.box.y + dy,
      w: item.box.w,
      h: item.box.h,
      stay: ghosts.length === 0,
    };
    ghosts.push(ghost);
    placed.push(ghost);
    cursor += (axis === "h" ? item.box.w : item.box.h) + gap;
  }
  if (ghosts.length) ghosts[ghosts.length - 1]!.stay = true;
  for (let i = 0; i < placed.length - 1; i++) {
    const a = placed[i]!;
    const b = placed[i + 1]!;
    if (axis === "h") {
      ticks.push({
        axis: "x",
        a: a.x + a.w,
        b: b.x,
        mid: (a.y + a.h / 2 + b.y + b.h / 2) / 2,
        size: gap,
      });
    } else {
      ticks.push({
        axis: "y",
        a: a.y + a.h,
        b: b.y,
        mid: (a.x + a.w / 2 + b.x + b.w / 2) / 2,
        size: gap,
      });
    }
  }
  return { axis, gap, ids: roots.map((n) => n.id), deltas, ghosts, ticks };
}

export function applyDistribute(nodes: DesignNode[], plan: DistributePlan): DesignNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const places = plan.deltas
    .map((d) => {
      const n = byId.get(d.id);
      if (!n || (!d.dx && !d.dy)) return null;
      return { id: d.id, x: n.x + d.dx, y: n.y + d.dy };
    })
    .filter((p): p is { id: string; x: number; y: number } => Boolean(p));
  if (!places.length) return nodes;
  const expanded = expandMovePlaces(nodes, places);
  const map = new Map(expanded.map((p) => [p.id, p]));
  return nodes.map((n) => {
    const p = map.get(n.id);
    return p ? { ...n, x: p.x, y: p.y } : n;
  });
}

let preview: DistributePlan | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const fn of listeners) fn();
}

export function getDistributePreview(): DistributePlan | null {
  return preview;
}

export function subscribeDistributePreview(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function clearDistributePreview(silent = false) {
  if (!preview && silent) return;
  preview = null;
  emit();
  if (!silent) releaseStudioStatus();
}

export function armDistributePreview(axis: DistributeAxis): DistributePlan | null {
  const doc = useDesign.getState().doc;
  const selection = useDesign.getState().selection;
  if (!doc) return null;
  const plan = planDistribute(doc.nodes, selection, axis);
  if (!plan) {
    preview = null;
    emit();
    holdStudioStatus("Distribute needs three unlocked layers");
    return null;
  }
  preview = plan;
  emit();
  const way = axis === "h" ? "across" : "down";
  holdStudioStatus(`Distribute preview · ${formatDistributeGap(plan.gap)} px ${way} · 2 stay · ${distributeMoveCount(plan)} move · Enter commits`);
  return plan;
}

/** First click previews the phosphor gaps. A second click on the same axis commits. */
export function toggleDistributePreview(axis: DistributeAxis) {
  if (preview?.axis === axis) {
    commitDistributePreview();
    return;
  }
  armDistributePreview(axis);
}

export function commitDistributePreview(): boolean {
  const plan = preview;
  const doc = useDesign.getState().doc;
  if (!plan || !doc) return false;
  const next = applyDistribute(doc.nodes, plan);
  useDesign.getState().commit();
  useDesign.setState({ doc: { ...doc, nodes: next }, dirty: true });
  preview = null;
  emit();
  const way = plan.axis === "h" ? "across" : "down";
  holdStudioStatus(`Distributed ${formatDistributeGap(plan.gap)} px ${way}`);
  return true;
}

export function distributeMoveCount(plan: DistributePlan): number {
  return plan.ghosts.filter((g) => !g.stay).length;
}

/** Phosphor ghosts at the even positions. First and last stay solid; movers are dashed.
 *  Near-zero gaps collapse the tick lines into a single flush contact mark and
 *  lift the label clear of the packed stack so the read stays clean.
 *  Flush diamonds pulse subtly so contact reads as alive, with a soft multi-stop radial glow and tiny peak sparks when the pulse peaks. */
export function drawDistributePreview(ctx: CanvasRenderingContext2D, plan: DistributePlan, zoom: number, pulse = 0) {
  const z = Math.max(zoom, 0.01);
  const flush = plan.gap <= 1.5;
  ctx.save();
  ctx.lineWidth = 1.2 / z;
  ctx.font = `${10 / z}px "IBM Plex Mono", ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const g of plan.ghosts) {
    ctx.setLineDash(g.stay ? [] : [5 / z, 4 / z]);
    ctx.strokeStyle = "rgba(63,198,255,0.92)";
    ctx.fillStyle = g.stay ? "rgba(63,198,255,0.04)" : "rgba(63,198,255,0.10)";
    ctx.beginPath();
    ctx.rect(g.x, g.y, g.w, g.h);
    ctx.fill();
    ctx.stroke();
    if (!g.stay) continue;
    const pin = 7 / z;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(g.x, g.y + pin);
    ctx.lineTo(g.x, g.y);
    ctx.lineTo(g.x + pin, g.y);
    ctx.moveTo(g.x + g.w - pin, g.y);
    ctx.lineTo(g.x + g.w, g.y);
    ctx.lineTo(g.x + g.w, g.y + pin);
    ctx.stroke();
    ctx.fillStyle = "rgba(63,198,255,0.95)";
    // Push the stay tag further out when the stack is flush so it doesn't sit on the next ghost.
    const stayLift = flush ? 16 / z : 9 / z;
    ctx.fillText("stay", g.x + g.w / 2, g.y - stayLift);
  }
  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(63,198,255,0.92)";
  ctx.fillStyle = "rgba(63,198,255,0.95)";
  const tick = 5 / z;
  const way = plan.axis === "h" ? "across" : "down";
  const label = flush ? `flush · ${formatDistributeGap(plan.gap)} px` : `${formatDistributeGap(plan.gap)} px ${way}`;
  ctx.font = `${11 / z}px "IBM Plex Mono", ui-monospace, monospace`;

  if (flush) {
    // Contact diamonds at each ghost junction instead of zero-length ticks.
    // Subtle pulse: scale 0.88–1.12, opacity 0.72–1.0 so contact feels alive.
    const base = 3.2 / z;
    const scale = 0.88 + 0.24 * pulse;
    const diamond = base * scale;
    const alpha = 0.72 + 0.28 * pulse;
    ctx.strokeStyle = `rgba(63,198,255,${alpha.toFixed(3)})`;
    ctx.fillStyle = `rgba(63,198,255,${(alpha * 0.18).toFixed(3)})`;
    for (const s of plan.ticks) {
      const cx = s.axis === "x" ? (s.a + s.b) / 2 : s.mid;
      const cy = s.axis === "x" ? s.mid : (s.a + s.b) / 2;
      // Softer radial glow — larger radius, gentler multi-stop falloff so the junction breathes without a hard halo.
      const glowR = diamond * 5.4;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      grad.addColorStop(0, `rgba(63,198,255,${(alpha * 0.22).toFixed(3)})`);
      grad.addColorStop(0.18, `rgba(63,198,255,${(alpha * 0.14).toFixed(3)})`);
      grad.addColorStop(0.45, `rgba(63,198,255,${(alpha * 0.05).toFixed(3)})`);
      grad.addColorStop(0.75, `rgba(63,198,255,${(alpha * 0.012).toFixed(3)})`);
      grad.addColorStop(1, "rgba(63,198,255,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
      ctx.fill();
      // Diamond itself
      ctx.strokeStyle = `rgba(63,198,255,${alpha.toFixed(3)})`;
      ctx.fillStyle = `rgba(63,198,255,${(alpha * 0.22).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(cx, cy - diamond);
      ctx.lineTo(cx + diamond, cy);
      ctx.lineTo(cx, cy + diamond);
      ctx.lineTo(cx - diamond, cy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Tiny contact sparks on the diamond peaks when the pulse is high — short bright ticks that flare with the peak.
      if (pulse > 0.55) {
        const sparkStrength = Math.min(1, (pulse - 0.55) / 0.45);
        const sparkLen = (1.6 + 2.4 * sparkStrength) / z;
        const sparkAlpha = (0.45 + 0.55 * sparkStrength).toFixed(3);
        ctx.strokeStyle = `rgba(63,198,255,${sparkAlpha})`;
        ctx.lineWidth = (0.7 + 0.6 * sparkStrength) / z;
        ctx.lineCap = "round";
        const peaks = [
          [cx, cy - diamond],
          [cx + diamond, cy],
          [cx, cy + diamond],
          [cx - diamond, cy],
        ];
        for (const [px, py] of peaks) {
          // Direction outward from center
          const dx = px - cx;
          const dy = py - cy;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + ux * sparkLen, py + uy * sparkLen);
          ctx.stroke();
        }
        ctx.lineWidth = 1.2 / z;
        ctx.lineCap = "butt";
      }
    }
    // One clear label above/beside the whole pack, lifted further on flush.
    if (plan.ghosts.length) {
      const gs = plan.ghosts;
      const minX = Math.min(...gs.map((g) => g.x));
      const maxX = Math.max(...gs.map((g) => g.x + g.w));
      const minY = Math.min(...gs.map((g) => g.y));
      const maxY = Math.max(...gs.map((g) => g.y + g.h));
      const lx = plan.axis === "h" ? (minX + maxX) / 2 : maxX + 22 / z;
      const ly = plan.axis === "h" ? minY - 30 / z : (minY + maxY) / 2;
      ctx.fillStyle = "rgba(63,198,255,0.96)";
      ctx.fillText(label, lx, ly);
    }
  } else {
    plan.ticks.forEach((s, index) => {
      ctx.beginPath();
      if (s.axis === "x") {
        ctx.moveTo(s.a, s.mid);
        ctx.lineTo(s.b, s.mid);
        ctx.moveTo(s.a, s.mid - tick);
        ctx.lineTo(s.a, s.mid + tick);
        ctx.moveTo(s.b, s.mid - tick);
        ctx.lineTo(s.b, s.mid + tick);
      } else {
        ctx.moveTo(s.mid, s.a);
        ctx.lineTo(s.mid, s.b);
        ctx.moveTo(s.mid - tick, s.a);
        ctx.lineTo(s.mid + tick, s.a);
        ctx.moveTo(s.mid - tick, s.b);
        ctx.lineTo(s.mid + tick, s.b);
      }
      ctx.stroke();
      if (index !== Math.floor((plan.ticks.length - 1) / 2)) return;
      const lx = s.axis === "x" ? (s.a + s.b) / 2 : s.mid + 14 / z;
      const ly = s.axis === "x" ? s.mid - 12 / z : (s.a + s.b) / 2;
      ctx.fillText(label, lx, ly);
    });
  }
  ctx.restore();
}
