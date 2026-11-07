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
 *  Flush diamonds pulse subtly so contact reads as alive, with a soft multi-stop radial glow, a faint inner ring echo, a phase-lagged second echo arc, a quieter counter-arc on the opposite side that slowly orbits with a shared phase, tiny peak sparks when the pulse peaks, a second slower harmonic so the diamond breathes on two timescales, a third even-fainter orbital spark that trails the pulse, soft bilateral glow flares that brighten with the slow harmonic, a faint rotating cross-hair that only appears near peak pulse, subtle vertical companion flares that respond to the primary breath, a quiet outer dashed ring that slowly expands and fades on the peak, a faint inner diamond echo that pulses opposite the outer scale, a subtle phase-offset inner diamond that trails the primary breath by a small delay, soft radial tick marks that briefly appear on the diamond vertices at peak, a soft rotational offset on the trailing inner diamond so it reads as a delayed nested echo, and a faint secondary pair of radial ticks that appear slightly after the primary ones, plus a quiet vertical secondary tick pair that lags even further via the trail pulse, and a very faint counter-rotating outline on the lag diamond that continues to settle after the nested echo. */
export function drawDistributePreview(ctx: CanvasRenderingContext2D, plan: DistributePlan, zoom: number, pulse = 0, pulseLag = 0, pulseRotate = 0, pulseSlow = 0, pulseTrail = 0) {
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
    // Subtle pulse: scale 0.86–1.14, opacity 0.72–1.0 so contact feels alive.
    // Second slower harmonic gently modulates the amplitude so the junction breathes on two timescales.
    const base = 3.2 / z;
    const scale = 0.86 + 0.18 * pulse + 0.10 * pulseSlow;
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
      // Faint inner diamond echo that pulses opposite the outer scale.
      // Shrinks as the outer diamond grows so the junction has a quiet nested breath.
      const innerScale = 0.48 + 0.28 * (1 - pulse);
      const innerDiamond = diamond * innerScale;
      const innerAlpha = (alpha * 0.32 * (0.45 + 0.55 * (1 - pulse))).toFixed(3);
      ctx.strokeStyle = `rgba(63,198,255,${innerAlpha})`;
      ctx.lineWidth = 0.55 / z;
      ctx.fillStyle = `rgba(63,198,255,${(parseFloat(innerAlpha) * 0.12).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(cx, cy - innerDiamond);
      ctx.lineTo(cx + innerDiamond, cy);
      ctx.lineTo(cx, cy + innerDiamond);
      ctx.lineTo(cx - innerDiamond, cy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.lineWidth = 1.2 / z;
      // Subtle phase-offset inner diamond that trails the primary breath by a small delay.
      // Uses the lag pulse so it peaks slightly after the main diamond — quieter, a touch smaller, nested depth.
      // Soft rotational offset so it reads as a delayed nested echo rather than a perfectly aligned copy.
      const lagInnerScale = 0.42 + 0.22 * (1 - pulseLag);
      const lagInnerDiamond = diamond * lagInnerScale;
      const lagInnerAlpha = (alpha * 0.18 * (0.4 + 0.6 * pulseLag)).toFixed(3);
      const lagRot = 0.22 + pulseRotate * 0.11;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(lagRot);
      ctx.strokeStyle = `rgba(63,198,255,${lagInnerAlpha})`;
      ctx.lineWidth = 0.42 / z;
      ctx.fillStyle = `rgba(63,198,255,${(parseFloat(lagInnerAlpha) * 0.08).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(0, -lagInnerDiamond);
      ctx.lineTo(lagInnerDiamond, 0);
      ctx.lineTo(0, lagInnerDiamond);
      ctx.lineTo(-lagInnerDiamond, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      // Very faint counter-rotating outline on the lag diamond so the nested echo feels like it is still settling.
      // Slightly larger, opposite rotation direction, lowest alpha — reads as residual motion after the lag diamond arrives.
      const counterLagRot = -lagRot * 0.72 + pulseRotate * 0.06;
      const counterLagAlpha = (parseFloat(lagInnerAlpha) * 0.38).toFixed(3);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(counterLagRot);
      ctx.strokeStyle = `rgba(63,198,255,${counterLagAlpha})`;
      ctx.lineWidth = 0.26 / z;
      ctx.beginPath();
      const outlineSize = lagInnerDiamond * 1.06;
      ctx.moveTo(0, -outlineSize);
      ctx.lineTo(outlineSize, 0);
      ctx.lineTo(0, outlineSize);
      ctx.lineTo(-outlineSize, 0);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
      ctx.lineWidth = 1.2 / z;
      // Faint inner ring — secondary pulse echo that breathes opposite the outer diamond so contact reads as a living junction.
      // Softened stroke: thinner line, lower alpha so it never competes with the diamond or sparks.
      const echoScale = 0.38 + 0.22 * (1 - pulse);
      const echoR = diamond * echoScale;
      const echoAlpha = (alpha * 0.28 * (0.5 + 0.5 * pulse)).toFixed(3);
      ctx.strokeStyle = `rgba(63,198,255,${echoAlpha})`;
      ctx.lineWidth = 0.42 / z;
      ctx.beginPath();
      ctx.arc(cx, cy, echoR, 0, Math.PI * 2);
      ctx.stroke();
      // Very subtle second echo arc — lags the primary pulse by a phase offset so the junction has depth.
      // Smaller radius, even lower alpha, only a short arc so it reads as a trailing breath rather than a full ring.
      const lagScale = 0.22 + 0.16 * (1 - pulseLag);
      const lagR = diamond * lagScale;
      const lagAlpha = (alpha * 0.16 * (0.4 + 0.6 * pulseLag)).toFixed(3);
      ctx.strokeStyle = `rgba(63,198,255,${lagAlpha})`;
      ctx.lineWidth = 0.32 / z;
      // Short arc centred on the top peak, sweeping ~70° so it feels directional and quiet.
      const lagStart = -Math.PI * 0.72 + pulseRotate;
      const lagSweep = Math.PI * 0.38;
      ctx.beginPath();
      ctx.arc(cx, cy, lagR, lagStart, lagStart + lagSweep);
      ctx.stroke();
      // Faint counter-arc on the opposite side of the diamond.
      // Quieter alpha, slightly larger radius, shorter sweep so it balances the lag without competing.
      const counterScale = 0.28 + 0.14 * (1 - pulse);
      const counterR = diamond * counterScale;
      const counterAlpha = (alpha * 0.11 * (0.45 + 0.55 * pulse)).toFixed(3);
      ctx.strokeStyle = `rgba(63,198,255,${counterAlpha})`;
      ctx.lineWidth = 0.28 / z;
      const counterStart = lagStart + Math.PI; // already includes pulseRotate via lagStart
      const counterSweep = Math.PI * 0.32;
      ctx.beginPath();
      ctx.arc(cx, cy, counterR, counterStart, counterStart + counterSweep);
      ctx.stroke();
      // Third even-fainter orbital spark that trails the pulse further.
      // Smaller radius, shorter sweep, lowest alpha so it reads as a quiet trailing breath.
      const trailScale = 0.16 + 0.10 * (1 - pulseTrail);
      const trailR = diamond * trailScale;
      const trailAlpha = (alpha * 0.065 * (0.35 + 0.65 * pulseTrail)).toFixed(3);
      ctx.strokeStyle = `rgba(63,198,255,${trailAlpha})`;
      ctx.lineWidth = 0.20 / z;
      const trailStart = lagStart + Math.PI * 1.42 + pulseRotate * 0.35;
      const trailSweep = Math.PI * 0.20;
      ctx.beginPath();
      ctx.arc(cx, cy, trailR, trailStart, trailStart + trailSweep);
      ctx.stroke();
      ctx.lineWidth = 1.2 / z;
      // Soft bilateral glow flares that brighten with the slow harmonic.
      // Quiet left/right breaths on the diamond flanks so the junction has a lateral living edge.
      const flareStrength = 0.28 + 0.72 * pulseSlow;
      const flareR = diamond * (0.95 + 0.35 * pulseSlow);
      const flareOffset = diamond * 0.72;
      const flareInner = (alpha * 0.26 * flareStrength).toFixed(3);
      const flareMid = (alpha * 0.09 * flareStrength).toFixed(3);
      // Left flank
      const leftGrad = ctx.createRadialGradient(cx - flareOffset, cy, 0, cx - flareOffset, cy, flareR);
      leftGrad.addColorStop(0, `rgba(63,198,255,${flareInner})`);
      leftGrad.addColorStop(0.42, `rgba(63,198,255,${flareMid})`);
      leftGrad.addColorStop(1, "rgba(63,198,255,0)");
      ctx.fillStyle = leftGrad;
      ctx.beginPath();
      ctx.arc(cx - flareOffset, cy, flareR, 0, Math.PI * 2);
      ctx.fill();
      // Right flank
      const rightGrad = ctx.createRadialGradient(cx + flareOffset, cy, 0, cx + flareOffset, cy, flareR);
      rightGrad.addColorStop(0, `rgba(63,198,255,${flareInner})`);
      rightGrad.addColorStop(0.42, `rgba(63,198,255,${flareMid})`);
      rightGrad.addColorStop(1, "rgba(63,198,255,0)");
      ctx.fillStyle = rightGrad;
      ctx.beginPath();
      ctx.arc(cx + flareOffset, cy, flareR, 0, Math.PI * 2);
      ctx.fill();
      // Subtle vertical companion flares that respond to the primary breath.
      // Quiet top/bottom breaths so the junction has a vertical living edge that follows the main pulse.
      const vFlareStrength = 0.18 + 0.82 * pulse;
      const vFlareR = diamond * (0.68 + 0.26 * pulse);
      const vFlareOffset = diamond * 0.66;
      const vFlareInner = (alpha * 0.15 * vFlareStrength).toFixed(3);
      const vFlareMid = (alpha * 0.048 * vFlareStrength).toFixed(3);
      // Top
      const topGrad = ctx.createRadialGradient(cx, cy - vFlareOffset, 0, cx, cy - vFlareOffset, vFlareR);
      topGrad.addColorStop(0, `rgba(63,198,255,${vFlareInner})`);
      topGrad.addColorStop(0.48, `rgba(63,198,255,${vFlareMid})`);
      topGrad.addColorStop(1, "rgba(63,198,255,0)");
      ctx.fillStyle = topGrad;
      ctx.beginPath();
      ctx.arc(cx, cy - vFlareOffset, vFlareR, 0, Math.PI * 2);
      ctx.fill();
      // Bottom
      const botGrad = ctx.createRadialGradient(cx, cy + vFlareOffset, 0, cx, cy + vFlareOffset, vFlareR);
      botGrad.addColorStop(0, `rgba(63,198,255,${vFlareInner})`);
      botGrad.addColorStop(0.48, `rgba(63,198,255,${vFlareMid})`);
      botGrad.addColorStop(1, "rgba(63,198,255,0)");
      ctx.fillStyle = botGrad;
      ctx.beginPath();
      ctx.arc(cx, cy + vFlareOffset, vFlareR, 0, Math.PI * 2);
      ctx.fill();
      // Quiet outer dashed ring that slowly expands and fades on the peak.
      // Appears only near the top of the primary breath, expands outward, and dissolves so the contact mark feels like it releases a quiet pulse.
      if (pulse > 0.62) {
        const ringStrength = Math.min(1, (pulse - 0.62) / 0.38);
        const ringScale = 1.35 + 0.95 * ringStrength;
        const ringR = diamond * ringScale;
        const ringAlpha = (alpha * 0.22 * (1 - ringStrength * 0.72)).toFixed(3);
        ctx.save();
        ctx.strokeStyle = `rgba(63,198,255,${ringAlpha})`;
        ctx.lineWidth = (0.38 + 0.18 * (1 - ringStrength)) / z;
        ctx.setLineDash([2.4 / z, 3.1 / z]);
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
      // Faint rotating cross-hair that only appears near peak pulse.
      // Thin phosphor arms slowly turn so the junction briefly reads as aligned.
      if (pulse > 0.72) {
        const crossStrength = Math.min(1, (pulse - 0.72) / 0.28);
        const crossAlpha = (0.18 + 0.32 * crossStrength).toFixed(3);
        const crossLen = diamond * (1.28 + 0.22 * crossStrength);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(pulseRotate);
        ctx.strokeStyle = `rgba(63,198,255,${crossAlpha})`;
        ctx.lineWidth = (0.5 + 0.22 * crossStrength) / z;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-crossLen, 0);
        ctx.lineTo(crossLen, 0);
        ctx.moveTo(0, -crossLen);
        ctx.lineTo(0, crossLen);
        ctx.stroke();
        ctx.restore();
      }
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
      // Soft radial tick marks that briefly appear on the diamond vertices at peak.
      // Quieter and shorter than the contact sparks, with a small gap so they read as independent marks rather than extensions of the spark.
      // Only near the absolute top of the breath so the junction briefly shows a precise alignment tick.
      if (pulse > 0.82) {
        const tickStrength = Math.min(1, (pulse - 0.82) / 0.18);
        const tickLen = (1.1 + 1.4 * tickStrength) / z;
        const tickGap = 1.8 / z;
        const tickAlpha = (0.22 + 0.28 * tickStrength).toFixed(3);
        ctx.strokeStyle = `rgba(63,198,255,${tickAlpha})`;
        ctx.lineWidth = (0.38 + 0.22 * tickStrength) / z;
        ctx.lineCap = "round";
        const peaks = [
          [cx, cy - diamond],
          [cx + diamond, cy],
          [cx, cy + diamond],
          [cx - diamond, cy],
        ];
        for (const [px, py] of peaks) {
          const dx = px - cx;
          const dy = py - cy;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          const startX = px + ux * tickGap;
          const startY = py + uy * tickGap;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(startX + ux * tickLen, startY + uy * tickLen);
          ctx.stroke();
        }
        ctx.lineWidth = 1.2 / z;
        ctx.lineCap = "butt";
      }
      // Faint secondary pair of radial ticks that appear slightly after the primary ones.
      // Uses the lag pulse so they peak a beat later — shorter, quieter, only the horizontal pair so they read as a delayed echo rather than a full repeat.
      if (pulseLag > 0.78) {
        const secStrength = Math.min(1, (pulseLag - 0.78) / 0.22);
        const secLen = (0.85 + 1.1 * secStrength) / z;
        const secGap = 2.6 / z;
        const secAlpha = (0.14 + 0.18 * secStrength).toFixed(3);
        ctx.strokeStyle = `rgba(63,198,255,${secAlpha})`;
        ctx.lineWidth = (0.28 + 0.16 * secStrength) / z;
        ctx.lineCap = "round";
        const secPeaks = [
          [cx + diamond, cy],
          [cx - diamond, cy],
        ];
        for (const [px, py] of secPeaks) {
          const dx = px - cx;
          const dy = py - cy;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          const startX = px + ux * secGap;
          const startY = py + uy * secGap;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(startX + ux * secLen, startY + uy * secLen);
          ctx.stroke();
        }
        ctx.lineWidth = 1.2 / z;
        ctx.lineCap = "butt";
      }
      // Quiet vertical secondary tick pair that lags even further.
      // Uses the trail pulse so they appear a beat after the horizontal echo — shorter still, only the vertical vertices, so the settling feels sequential and nested.
      if (pulseTrail > 0.72) {
        const trailStrength = Math.min(1, (pulseTrail - 0.72) / 0.28);
        const trailLen = (0.7 + 0.9 * trailStrength) / z;
        const trailGap = 3.2 / z;
        const trailAlpha = (0.10 + 0.14 * trailStrength).toFixed(3);
        ctx.strokeStyle = `rgba(63,198,255,${trailAlpha})`;
        ctx.lineWidth = (0.22 + 0.14 * trailStrength) / z;
        ctx.lineCap = "round";
        const trailPeaks = [
          [cx, cy - diamond],
          [cx, cy + diamond],
        ];
        for (const [px, py] of trailPeaks) {
          const dx = px - cx;
          const dy = py - cy;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          const startX = px + ux * trailGap;
          const startY = py + uy * trailGap;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(startX + ux * trailLen, startY + uy * trailLen);
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
