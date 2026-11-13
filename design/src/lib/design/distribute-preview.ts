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
 * Outer slow harmonic is quieter at rest. Trail spark gains a soft contact bloom
 * near diamond points with a secondary inner taper for deeper contact. Faint
 * radial falloff grounds the family. Primary diamond carries a faint inner glow
 * that breathes with the pulse. Lag companion rotation offset micro-adjusted for
 * tighter family cohesion. Fifth nested mark quieted further and given a faint
 * phase offset so it never quite syncs with the primary. All members inherit
 * familyLagRot. Shared stroke-width breathing across the nested family, plus a
 * soft outer halo on the primary diamond at peak pulse.  * Micro secondary spark
 * trails the primary trail at a fixed phase lag, quieter and slightly inset.
 * Secondary spark gains a faint radial pulse at peak contact so the lagged breath
 * reads as continuous without competing with the lead spark. Outer halo on the
 * primary diamond now uses a soft radial gradient falloff. Fifth nested mark
 * carries a faint phase-offset shimmer only at absolute peak. A quieter echo
 * filament mirrors the primary trailing stroke on the opposite side of the lag
 * offset, dissolving fully into the ground. Ground falloff quiets further at rest.
 * Echo filament phase tightened so it tracks the primary more closely without competing. Phosphor-on-ground.
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

  // Faint radial falloff under the whole family so the flush diamond feels more grounded.
  // Quieter at rest so the ground only lifts when the pulse is active.
  const falloffR = baseR * 2.4;
  const restQuiet = 0.28 + 0.72 * pulse;
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, falloffR);
  grad.addColorStop(0, `rgba(63, 198, 255, ${0.042 * restQuiet})`);
  grad.addColorStop(0.55, `rgba(63, 198, 255, ${0.016 * restQuiet})`);
  grad.addColorStop(1, "rgba(63, 198, 255, 0)");
  ctx.beginPath();
  ctx.arc(0, 0, falloffR, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  const pScale = 1 + 0.18 * (pulse - 0.5);
  const primaryR = baseR * pScale;

  // Shared stroke-width breathing across the nested family
  const familyBreath = 0.45 * pulse + 0.35 * lag + 0.2 * slow;
  const strokeBreath = 1 + 0.2 * (familyBreath - 0.5);

  // Softened outer halo falloff on the primary diamond at peak pulse.
  // Gradient fill instead of a hard stroke so the bloom dissolves more gradually.
  if (pulse > 0.68) {
    const haloR = primaryR * 1.42;
    const t = Math.min(1, (pulse - 0.68) / 0.32);
    const haloA = 0.034 * t;
    const haloGrad = ctx.createRadialGradient(0, 0, primaryR * 0.85, 0, 0, haloR);
    haloGrad.addColorStop(0, `rgba(63, 198, 255, ${haloA * 0.15})`);
    haloGrad.addColorStop(0.35, `rgba(63, 198, 255, ${haloA * 0.55})`);
    haloGrad.addColorStop(0.7, `rgba(63, 198, 255, ${haloA * 0.22})`);
    haloGrad.addColorStop(1, "rgba(63, 198, 255, 0)");
    ctx.beginPath();
    ctx.moveTo(0, -haloR);
    ctx.lineTo(haloR, 0);
    ctx.lineTo(0, haloR);
    ctx.lineTo(-haloR, 0);
    ctx.closePath();
    ctx.fillStyle = haloGrad;
    ctx.fill();
  }

  // Faint inner glow that breathes with the pulse — softer fill inside the primary diamond
  const glowR = primaryR * 0.62;
  const glowA = 0.045 + 0.055 * pulse;
  ctx.beginPath();
  ctx.moveTo(0, -glowR);
  ctx.lineTo(glowR, 0);
  ctx.lineTo(0, glowR);
  ctx.lineTo(-glowR, 0);
  ctx.closePath();
  ctx.fillStyle = `rgba(63, 198, 255, ${glowA})`;
  ctx.fill();
  drawDiamond(ctx, primaryR, `rgba(63, 198, 255, ${0.55 + 0.35 * pulse})`, zoom, strokeBreath);

  const lScale = 1 + 0.12 * (lag - 0.5);
  ctx.save();
  // Micro-adjusted rotation offset for tighter family cohesion with the primary diamond
  ctx.rotate(0.31);
  drawDiamond(ctx, baseR * 0.72 * lScale, `rgba(63, 198, 255, ${0.28 + 0.22 * lag})`, zoom, strokeBreath);
  ctx.restore();

  // Subtle trailing filament between the primary diamond and the lag companion.
  // Soft tapered stroke that only breathes when the lag is close, dissolving into the ground.
  const lagAng = 0.31;
  const lagR = baseR * 0.72 * lScale;
  const pX = Math.cos(lagAng) * primaryR * 0.78;
  const pY = Math.sin(lagAng) * primaryR * 0.78;
  const lX = Math.cos(lagAng) * lagR * 0.92;
  const lY = Math.sin(lagAng) * lagR * 0.92;
  const filamentA = 0.055 + 0.035 * Math.max(0, lag - 0.35);
  const filamentGrad = ctx.createLinearGradient(pX, pY, lX, lY);
  filamentGrad.addColorStop(0, `rgba(63, 198, 255, ${filamentA * 0.25})`);
  filamentGrad.addColorStop(0.45, `rgba(63, 198, 255, ${filamentA})`);
  filamentGrad.addColorStop(1, `rgba(63, 198, 255, ${filamentA * 0.15})`);
  ctx.beginPath();
  ctx.moveTo(pX, pY);
  ctx.quadraticCurveTo(
    Math.cos(lagAng) * (primaryR + lagR) * 0.42,
    Math.sin(lagAng) * (primaryR + lagR) * 0.42,
    lX,
    lY,
  );
  ctx.strokeStyle = filamentGrad;
  ctx.lineWidth = Math.max(0.45, 0.7 / zoom) * strokeBreath * 0.65;
  ctx.lineCap = "round";
  ctx.stroke();

  // Faint echo filament on the opposite side of the lag offset.
  // Quieter quadratic stroke that only appears when the lag is close, dissolving fully into the ground.
  // Tighter phase: control point pulled closer so the echo tracks the primary filament more tightly.
  const echoAng = lagAng + Math.PI;
  const echoPX = Math.cos(echoAng) * primaryR * 0.72;
  const echoPY = Math.sin(echoAng) * primaryR * 0.72;
  const echoLX = Math.cos(echoAng) * lagR * 0.85;
  const echoLY = Math.sin(echoAng) * lagR * 0.85;
  const echoA = 0.022 + 0.014 * Math.max(0, lag - 0.48);
  const echoGrad = ctx.createLinearGradient(echoPX, echoPY, echoLX, echoLY);
  echoGrad.addColorStop(0, `rgba(63, 198, 255, ${echoA * 0.16})`);
  echoGrad.addColorStop(0.5, `rgba(63, 198, 255, ${echoA})`);
  echoGrad.addColorStop(1, `rgba(63, 198, 255, ${echoA * 0.06})`);
  ctx.beginPath();
  ctx.moveTo(echoPX, echoPY);
  ctx.quadraticCurveTo(
    Math.cos(echoAng) * (primaryR + lagR) * 0.34,
    Math.sin(echoAng) * (primaryR + lagR) * 0.34,
    echoLX,
    echoLY,
  );
  ctx.strokeStyle = echoGrad;
  ctx.lineWidth = Math.max(0.32, 0.5 / zoom) * strokeBreath * 0.48;
  ctx.lineCap = "round";
  ctx.stroke();

  const sScale = 1 + 0.08 * (slow - 0.5);
  // Quieter outer slow harmonic so the nested family stays softer at rest
  drawDiamond(ctx, baseR * 1.35 * sScale, `rgba(63, 198, 255, ${0.07 + 0.06 * slow})`, zoom, strokeBreath * 0.85);

  const tAng = trail * Math.PI * 2;
  const tR = baseR * 1.6;
  // Micro-taper: spark radius eases smaller near trail extremes so contact reads continuous
  const taper = 0.65 + 0.35 * Math.sin(trail * Math.PI);
  const sparkR = (2.2 / zoom) * taper;
  const sparkX = Math.cos(tAng) * tR;
  const sparkY = Math.sin(tAng) * tR;

  // Subtle contact bloom when the trail spark nears a diamond point (cardinal angles)
  // Secondary inner taper deepens the bloom so contact feels more continuous
  const cardinal = Math.PI / 2;
  const angDist = Math.min(
    Math.abs(tAng % cardinal),
    cardinal - Math.abs(tAng % cardinal),
  );
  const nearPoint = 1 - Math.min(1, angDist / (cardinal * 0.35));
  const innerTaper = 0.55 + 0.45 * Math.pow(nearPoint, 1.4);
  const bloomR = sparkR * (2.4 + 1.2 * nearPoint) * (0.82 + 0.18 * innerTaper);
  const bloomA = (0.09 + 0.14 * nearPoint) * (0.6 + 0.4 * taper) * (0.7 + 0.3 * innerTaper);
  ctx.beginPath();
  ctx.arc(sparkX, sparkY, bloomR, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(63, 198, 255, ${bloomA})`;
  ctx.fill();

  // Soft inner core of the bloom, tighter and brighter at peak contact
  if (nearPoint > 0.35) {
    const coreR = sparkR * (1.15 + 0.55 * nearPoint) * innerTaper;
    const coreA = (0.12 + 0.18 * nearPoint) * innerTaper * (0.5 + 0.5 * taper);
    ctx.beginPath();
    ctx.arc(sparkX, sparkY, coreR, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(63, 198, 255, ${coreA})`;
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(sparkX, sparkY, sparkR, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(63, 198, 255, ${(0.4 + 0.4 * trail) * (0.75 + 0.25 * taper)})`;
  ctx.fill();

  // Micro secondary spark trailing the primary trail at a fixed phase lag
  // Quieter, slightly inset, and phase-lagged so it never overlaps the lead contact
  const lagPhase = 0.42;
  const secAng = tAng - lagPhase;
  const secR = tR * 0.86;
  const secTaper = 0.55 + 0.45 * Math.sin((trail - lagPhase / (Math.PI * 2)) * Math.PI);
  const secSparkR = (1.35 / zoom) * Math.max(0.4, secTaper);
  const secX = Math.cos(secAng) * secR;
  const secY = Math.sin(secAng) * secR;
  ctx.beginPath();
  ctx.arc(secX, secY, secSparkR, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(63, 198, 255, ${(0.18 + 0.22 * trail) * (0.65 + 0.35 * Math.max(0, secTaper))})`;
  ctx.fill();

  // Faint radial pulse on the secondary spark at peak contact
  // Soft expanding bloom that only appears when the lagged spark nears a diamond point
  const secCardinal = Math.PI / 2;
  const secAngDist = Math.min(
    Math.abs(secAng % secCardinal),
    secCardinal - Math.abs(secAng % secCardinal),
  );
  const secNearPoint = 1 - Math.min(1, secAngDist / (secCardinal * 0.42));
  if (secNearPoint > 0.58) {
    const pulseScale = 0.65 + 0.35 * Math.sin(trail * Math.PI);
    const pulseR = secSparkR * (1.65 + 1.1 * secNearPoint) * pulseScale;
    const pulseA = 0.065 * ((secNearPoint - 0.58) / 0.42) * (0.55 + 0.45 * trail);
    const pulseGrad = ctx.createRadialGradient(secX, secY, secSparkR * 0.4, secX, secY, pulseR);
    pulseGrad.addColorStop(0, `rgba(63, 198, 255, ${pulseA * 1.25})`);
    pulseGrad.addColorStop(0.55, `rgba(63, 198, 255, ${pulseA * 0.45})`);
    pulseGrad.addColorStop(1, "rgba(63, 198, 255, 0)");
    ctx.beginPath();
    ctx.arc(secX, secY, pulseR, 0, Math.PI * 2);
    ctx.fillStyle = pulseGrad;
    ctx.fill();
  }

  // Quiet fifth mark only near absolute peak of the trail breath — softened further
  const marks = [
    { idx: 1, size: 0.85, op: 0.35, breath: pulse },
    { idx: 2, size: 0.62, op: 0.22, breath: lag },
    { idx: 3, size: 0.48, op: 0.14, breath: slow },
    { idx: 4, size: 0.36, op: 0.09, breath: trail },
    { idx: 5, size: 0.13, op: 0.016, breath: trail * 0.48 },
  ];

  for (const m of marks) {
    const maxB = m.idx === 5 ? 0.48 : 1;
    const rel = m.breath / maxB;
    const peak = rel > (m.idx === 5 ? 0.86 : 0.78);
    if (m.idx > 2 && !peak) continue;
    const mScale = 1 + 0.04 * (rel - 0.5);
    const alpha = m.op * (0.45 + 0.55 * rel);
    ctx.save();
    // Faint phase offset on the fifth mark so it never quite syncs with the primary
    const phaseOff = m.idx === 5 ? 0.11 + 0.04 * Math.sin(trail * Math.PI * 1.7) : 0;
    ctx.rotate(m.idx * 0.18 + phaseOff);
    drawDiamond(ctx, baseR * m.size * mScale, `rgba(63, 198, 255, ${alpha})`, zoom, strokeBreath);
    // Faint phase-offset shimmer on the fifth nested mark at absolute peak.
    // A quieter secondary stroke that lags the primary mark so the innermost
    // mark breathes on its own micro-timescale without crowding the family.
    if (m.idx === 5 && peak) {
      const shimRel = Math.max(0, (rel - 0.86) / 0.14);
      const shimPhase = 0.07 * Math.sin(trail * Math.PI * 2.3 + 0.4);
      ctx.rotate(shimPhase);
      const shimAlpha = alpha * 0.42 * shimRel;
      const shimR = baseR * m.size * mScale * 1.18;
      drawDiamond(ctx, shimR, `rgba(63, 198, 255, ${shimAlpha})`, zoom, strokeBreath * 0.65);
    }
    ctx.restore();
  }

  ctx.restore();
}

function drawDiamond(ctx: CanvasRenderingContext2D, r: number, style: string, zoom: number, strokeMul = 1) {
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r, 0);
  ctx.lineTo(0, r);
  ctx.lineTo(-r, 0);
  ctx.closePath();
  ctx.strokeStyle = style;
  ctx.lineWidth = Math.max(0.6, 1.1 / zoom) * strokeMul;
  ctx.stroke();
}
