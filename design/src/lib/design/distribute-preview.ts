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

function computePlan(nodes: DesignNode[], ids: string[], axis: DistributeAxis, forcedGap?: number): DistributePlan | null {
  const roots = nodes.filter((n) => ids.includes(n.id) && !n.locked && n.visible);
  if (roots.length < 3) return null;
  const items = roots.map((n) => ({ n, box: geometryBox(n) }));
  items.sort((a, b) => (axis === "h" ? a.box.x - b.box.x : a.box.y - b.box.y));
  const first = items[0]!.box;
  const last = items[items.length - 1]!.box;
  const start0 = axis === "h" ? first.x : first.y;
  const end0 = axis === "h" ? last.x + last.w : last.y + last.h;
  const center = (start0 + end0) / 2;
  const total = items.reduce((s, i) => s + (axis === "h" ? i.box.w : i.box.h), 0);
  const n = items.length;
  const naturalGap = n > 1 ? ((end0 - start0) - total) / (n - 1) : 0;
  const gap = forcedGap !== undefined ? forcedGap : Math.max(0, naturalGap);

  // Place with fixed center, variable gap
  const span = total + gap * (n - 1);
  let cursor = center - span / 2;
  const deltas: DistributePlan["deltas"] = [];
  const ghosts: DistributeGhost[] = [];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const item of items) {
    const size = axis === "h" ? item.box.w : item.box.h;
    const target = cursor;
    const dx = axis === "h" ? target - item.box.x : 0;
    const dy = axis === "v" ? target - item.box.y : 0;
    deltas.push({ id: item.n.id, dx, dy });
    const gx = item.n.x + dx;
    const gy = item.n.y + dy;
    ghosts.push({
      id: item.n.id,
      x: gx,
      y: gy,
      w: item.n.w,
      h: item.n.h,
      stay: Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5,
    });
    minX = Math.min(minX, gx);
    minY = Math.min(minY, gy);
    maxX = Math.max(maxX, gx + item.n.w);
    maxY = Math.max(maxY, gy + item.n.h);
    cursor += size + gap;
  }

  return {
    axis,
    gap,
    ids: roots.map((r) => r.id),
    deltas,
    ghosts,
    center,
    bounds: { minX, minY, maxX, maxY },
  };
}

export function armDistributePreview(axis: DistributeAxis) {
  const s = useDesign.getState();
  if (!s.doc || s.selection.length < 3) {
    clear();
    return;
  }
  const next = computePlan(s.doc.nodes, s.selection, axis);
  plan = next;
  notify();
}

export function setLiveDistributePreview(axis: DistributeAxis, gap: number) {
  const s = useDesign.getState();
  if (!s.doc || s.selection.length < 3) {
    clear();
    return;
  }
  const next = computePlan(s.doc.nodes, s.selection, axis, Math.max(0, gap));
  plan = next;
  notify();
}

export function commitDistributePreview() {
  if (!plan) return;
  const s = useDesign.getState();
  if (!s.doc) {
    clear();
    return;
  }
  s.commit();
  const nextNodes = s.doc.nodes.map((n) => {
    const d = plan!.deltas.find((dd) => dd.id === n.id);
    if (!d || (Math.abs(d.dx) < 0.1 && Math.abs(d.dy) < 0.1)) return n;
    return { ...n, x: n.x + d.dx, y: n.y + d.dy };
  });
  useDesign.setState({ doc: { ...s.doc, nodes: nextNodes }, dirty: true });
  clear();
}

const PHOSPHOR = "#3fc6ff";

// Diamond bloom constants — primary, lag, and slow harmonics so the contact treatment stays tunable
const DIAMOND_BLOOM_BASE = 0.65;
const DIAMOND_BLOOM_PULSE = 0.35;
const DIAMOND_LAG_BLOOM_BASE = 0.5;
const DIAMOND_LAG_BLOOM_PULSE = 0.5;
const DIAMOND_SLOW_BLOOM_BASE = 0.4;
const DIAMOND_SLOW_BLOOM_PULSE = 0.6;

// Readout fade and breath constants — keep the diamond contact readable without competing chrome
const READOUT_BASE_ALPHA = 0.42;
const READOUT_PULSE_MIN = 0.55;
const READOUT_PULSE_RANGE = 0.45;
const READOUT_SCALE_BASE = 0.94;
const READOUT_SCALE_PULSE = 0.06;
// Lag-echo scale trails the primary breath so the readout has a matching second harmonic
const READOUT_LAG_SCALE_BASE = 0.91;
const READOUT_LAG_SCALE_PULSE = 0.09;
const READOUT_LAG_ALPHA = 0.16;
// Slow-harmonic scale trails further using flushPulseSlow so the readout gains a third layered breath
const READOUT_SLOW_SCALE_BASE = 0.87;
const READOUT_SLOW_SCALE_PULSE = 0.13;
const READOUT_SLOW_ALPHA = 0.09;
// Trails dissolve with the primary breath so layered echos fade cleanly instead of lingering
const READOUT_TRAIL_FADE_BASE = 0.38;
const READOUT_TRAIL_FADE_RANGE = 0.62;
// Rings share the same trail-fade so bloom falloff dissolves cleanly with the primary breath
const RING_TRAIL_FADE_BASE = 0.42;
const RING_TRAIL_FADE_RANGE = 0.58;
// Subtle counter-rotation on the readout using flushPulseRotate so the text has a quiet opposite drift
const READOUT_COUNTER_ROT = -0.045;

export function drawDistributePreview(
  ctx: CanvasRenderingContext2D,
  plan: DistributePlan,
  zoom: number,
  pulse: number,
  lag: number,
  rot: number,
  slow: number,
  trail: number,
) {
  const { ghosts, bounds, gap, axis } = plan;
  const flush = gap <= 1.5;
  const alpha = flush ? 0.85 : 0.55;

  ctx.save();
  ctx.lineWidth = 1 / zoom;
  ctx.strokeStyle = PHOSPHOR;
  ctx.globalAlpha = alpha;

  // Ghost outlines
  for (const g of ghosts) {
    ctx.beginPath();
    ctx.rect(g.x, g.y, g.w, g.h);
    ctx.setLineDash(g.stay ? [] : [4 / zoom, 3 / zoom]);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Flush diamond contact bloom when nearly touching
  if (flush) {
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = (bounds.minY + bounds.maxY) / 2;
    const size = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) * 0.42;
    const bloom = DIAMOND_BLOOM_BASE + DIAMOND_BLOOM_PULSE * pulse;
    const lagBloom = DIAMOND_LAG_BLOOM_BASE + DIAMOND_LAG_BLOOM_PULSE * lag;
    const slowBloom = DIAMOND_SLOW_BLOOM_BASE + DIAMOND_SLOW_BLOOM_PULSE * slow;
    // Shared trail-fade so the inner radial fill dissolves with the primary breath
    const ringTrailFade = RING_TRAIL_FADE_BASE + RING_TRAIL_FADE_RANGE * pulse;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot * 0.15);

    // Primary diamond breath with faint radial gradient fill that inherits trail-fade
    ctx.beginPath();
    ctx.moveTo(0, -size * bloom);
    ctx.lineTo(size * bloom * 0.7, 0);
    ctx.lineTo(0, size * bloom);
    ctx.lineTo(-size * bloom * 0.7, 0);
    ctx.closePath();
    const r = size * bloom * 0.72;
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    grad.addColorStop(0, PHOSPHOR);
    grad.addColorStop(0.45, PHOSPHOR);
    grad.addColorStop(1, "rgba(63, 198, 255, 0)");
    ctx.globalAlpha = 0.28 * pulse * ringTrailFade;
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.globalAlpha = 0.7;
    ctx.stroke();

    // Subtle inner counter-stroke on the gradient diamond that inherits trail-fade
    // Slow pulse on stroke width so the counter-edge breathes without competing chrome
    ctx.save();
    ctx.rotate(-rot * 0.07);
    ctx.beginPath();
    const innerScale = 0.62;
    ctx.moveTo(0, -size * bloom * innerScale);
    ctx.lineTo(size * bloom * 0.7 * innerScale, 0);
    ctx.lineTo(0, size * bloom * innerScale);
    ctx.lineTo(-size * bloom * 0.7 * innerScale, 0);
    ctx.closePath();
    const baseW = 1 / zoom;
    ctx.lineWidth = baseW * (0.85 + 0.3 * slow);
    ctx.globalAlpha = 0.22 * pulse * ringTrailFade;
    ctx.stroke();
    ctx.restore();

    // Faint counter-orbiting tick on the primary bloom that inherits trail-fade
    const tickAngle = -rot * 0.22 + Math.PI * 0.3;
    const tickR = size * bloom * 0.76;
    const tx = Math.cos(tickAngle) * tickR;
    const ty = Math.sin(tickAngle) * tickR * 0.62;
    ctx.beginPath();
    ctx.arc(tx, ty, (1.7 / zoom) * (0.48 + 0.52 * trail), 0, Math.PI * 2);
    ctx.globalAlpha = 0.3 * trail * ringTrailFade;
    ctx.fillStyle = PHOSPHOR;
    ctx.fill();

    // Nested trailing tick on a quieter opposite orbit — trails the primary counter-tick with shared trail-fade
    const nestAngle = -rot * 0.18 + Math.PI * 0.55;
    const nestR = size * bloom * 0.62;
    const nx = Math.cos(nestAngle) * nestR;
    const ny = Math.sin(nestAngle) * nestR * 0.58;
    ctx.beginPath();
    ctx.arc(nx, ny, (1.2 / zoom) * (0.4 + 0.6 * trail), 0, Math.PI * 2);
    ctx.globalAlpha = 0.18 * trail * ringTrailFade;
    ctx.fill();

    // Secondary lag echo (trails the primary)
    ctx.beginPath();
    ctx.moveTo(0, -size * lagBloom * 0.85);
    ctx.lineTo(size * lagBloom * 0.55, 0);
    ctx.lineTo(0, size * lagBloom * 0.85);
    ctx.lineTo(-size * lagBloom * 0.55, 0);
    ctx.closePath();
    ctx.globalAlpha = 0.25 * lag;
    ctx.stroke();

    // Orbital spark with phase lag — trails the counter-breath
    const sparkAngle = rot + Math.PI * 0.6;
    const sparkR = size * (0.55 + 0.25 * trail);
    const sx = Math.cos(sparkAngle) * sparkR;
    const sy = Math.sin(sparkAngle) * sparkR * 0.6;
    ctx.beginPath();
    ctx.arc(sx, sy, (3.5 / zoom) * (0.6 + 0.4 * trail), 0, Math.PI * 2);
    ctx.globalAlpha = 0.9 * trail;
    ctx.fillStyle = PHOSPHOR;
    ctx.fill();

    // Second slower harmonic spark — inherits slow phase so long holds feel layered
    const sparkAngle2 = rot * 0.35 + Math.PI * 1.4;
    const sparkR2 = size * (0.72 + 0.18 * slow);
    const sx2 = Math.cos(sparkAngle2) * sparkR2;
    const sy2 = Math.sin(sparkAngle2) * sparkR2 * 0.55;
    ctx.beginPath();
    ctx.arc(sx2, sy2, (2.2 / zoom) * (0.5 + 0.5 * slow), 0, Math.PI * 2);
    ctx.globalAlpha = 0.55 * slow * trail;
    ctx.fill();

    // Quiet phase-offset spark — inherits counter-rotation for a fourth micro-harmonic
    const sparkAngle3 = rot * READOUT_COUNTER_ROT * 1.8 + Math.PI * 0.35;
    const sparkR3 = size * (0.48 + 0.12 * trail);
    const sx3 = Math.cos(sparkAngle3) * sparkR3;
    const sy3 = Math.sin(sparkAngle3) * sparkR3 * 0.7;
    ctx.beginPath();
    ctx.arc(sx3, sy3, (1.6 / zoom) * (0.4 + 0.6 * trail), 0, Math.PI * 2);
    ctx.globalAlpha = 0.28 * trail * ringTrailFade;
    ctx.fill();

    // Faint radial falloff rings — modulated by the same trail-fade factor as the readout trails
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, size * (0.3 + i * 0.18) * slowBloom, 0, Math.PI * 2);
      ctx.globalAlpha = (0.12 / i) * slow * ringTrailFade;
      ctx.stroke();
    }

    // Nested fifth mark with tighter familyLagRot inheritance
    // Lag-scaled stroke width so the fifth edge breathes with the phase lag without extra chrome
    const familyLag = rot * 0.08;
    ctx.save();
    ctx.rotate(familyLag);
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.28 * bloom);
    ctx.lineTo(size * 0.18, 0);
    ctx.lineTo(0, size * 0.28 * bloom);
    ctx.lineTo(-size * 0.18, 0);
    ctx.closePath();
    const fifthBaseW = 1 / zoom;
    ctx.lineWidth = fifthBaseW * (0.65 + 0.55 * lag);
    ctx.globalAlpha = 0.55 * pulse * lag * ringTrailFade;
    ctx.stroke();

    // Slow-orbiting micro-dot on the nested fifth mark that inherits trail-fade
    const microAngle = rot * 0.18 + Math.PI * 0.55;
    const microR = size * 0.24 * bloom;
    const mx = Math.cos(microAngle) * microR;
    const my = Math.sin(microAngle) * microR * 0.62;
    ctx.beginPath();
    ctx.arc(mx, my, (1.35 / zoom) * (0.45 + 0.55 * trail), 0, Math.PI * 2);
    ctx.globalAlpha = 0.62 * trail * ringTrailFade;
    ctx.fillStyle = PHOSPHOR;
    ctx.fill();

    ctx.restore();

    // Quiet outer counter-breath on the fifth-mark diamond — opposite rotation, slightly larger, lag-scaled stroke pulse, dissolves with trail-fade
    const outerScale = 1.16 + 0.04 * lag;
    const counterLag = -familyLag * 1.35;
    ctx.save();
    ctx.rotate(counterLag);
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.28 * bloom * outerScale);
    ctx.lineTo(size * 0.18 * outerScale, 0);
    ctx.lineTo(0, size * 0.28 * bloom * outerScale);
    ctx.lineTo(-size * 0.18 * outerScale, 0);
    ctx.closePath();
    // Lag-scaled stroke pulse: width breathes with both lag phase and primary pulse
    const outerStrokePulse = 0.82 + 0.36 * pulse;
    ctx.lineWidth = fifthBaseW * (0.38 + 0.42 * lag) * outerStrokePulse;
    ctx.globalAlpha = 0.26 * pulse * lag * ringTrailFade;
    ctx.stroke();

    // Quieter secondary micro-dot on the outer counter-breath — opposite phase, smaller, dissolves with trail-fade
    const outerMicroAngle = -rot * 0.14 + Math.PI * 1.15;
    const outerMicroR = size * 0.26 * bloom * outerScale * 0.85;
    const omx = Math.cos(outerMicroAngle) * outerMicroR;
    const omy = Math.sin(outerMicroAngle) * outerMicroR * 0.58;
    ctx.beginPath();
    ctx.arc(omx, omy, (0.95 / zoom) * (0.35 + 0.45 * trail), 0, Math.PI * 2);
    ctx.globalAlpha = 0.18 * trail * lag * ringTrailFade;
    ctx.fillStyle = PHOSPHOR;
    ctx.fill();

    // Third, even quieter opposite-phase spark on the outer counter-breath — further offset, smaller still, dissolves with trail-fade
    const outerSparkAngle = rot * 0.09 + Math.PI * 0.42;
    const outerSparkR = size * 0.21 * bloom * outerScale * 0.72;
    const osx = Math.cos(outerSparkAngle) * outerSparkR;
    const osy = Math.sin(outerSparkAngle) * outerSparkR * 0.48;
    ctx.beginPath();
    ctx.arc(osx, osy, (0.65 / zoom) * (0.28 + 0.38 * trail), 0, Math.PI * 2);
    ctx.globalAlpha = 0.09 * trail * lag * ringTrailFade;
    ctx.fillStyle = PHOSPHOR;
    ctx.fill();

    // Soft radial falloff under the third opposite-phase spark — inherits the same trail-fade
    const falloffR = (2.4 / zoom) * (0.42 + 0.58 * trail);
    const falloffGrad = ctx.createRadialGradient(osx, osy, 0, osx, osy, falloffR);
    falloffGrad.addColorStop(0, PHOSPHOR);
    falloffGrad.addColorStop(0.55, "rgba(63, 198, 255, 0.18)");
    falloffGrad.addColorStop(1, "rgba(63, 198, 255, 0)");
    ctx.save();
    ctx.globalAlpha = 0.038 * trail * lag * ringTrailFade;
    ctx.fillStyle = falloffGrad;
    ctx.beginPath();
    ctx.arc(osx, osy, falloffR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Fourth, quieter trailing micro-spark on the outer counter-breath — further offset still, smaller, shares the same falloff and trail-fade
    const outerSpark4Angle = -rot * 0.06 + Math.PI * 1.72;
    const outerSpark4R = size * 0.17 * bloom * outerScale * 0.58;
    const os4x = Math.cos(outerSpark4Angle) * outerSpark4R;
    const os4y = Math.sin(outerSpark4Angle) * outerSpark4R * 0.38;
    ctx.beginPath();
    ctx.arc(os4x, os4y, (0.48 / zoom) * (0.22 + 0.32 * trail), 0, Math.PI * 2);
    ctx.globalAlpha = 0.045 * trail * lag * ringTrailFade;
    ctx.fillStyle = PHOSPHOR;
    ctx.fill();

    // Soft radial falloff under the fourth trailing micro-spark — inherits the same trail-fade
    const falloff4R = (1.8 / zoom) * (0.35 + 0.48 * trail);
    const falloff4Grad = ctx.createRadialGradient(os4x, os4y, 0, os4x, os4y, falloff4R);
    falloff4Grad.addColorStop(0, PHOSPHOR);
    falloff4Grad.addColorStop(0.5, "rgba(63, 198, 255, 0.12)");
    falloff4Grad.addColorStop(1, "rgba(63, 198, 255, 0)");
    ctx.save();
    ctx.globalAlpha = 0.018 * trail * lag * ringTrailFade;
    ctx.fillStyle = falloff4Grad;
    ctx.beginPath();
    ctx.arc(os4x, os4y, falloff4R, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Fifth, even quieter trailing micro-spark on the outer counter-breath — furthest offset, smallest, shares the same falloff and trail-fade
    const outerSpark5Angle = rot * 0.035 + Math.PI * 2.28;
    const outerSpark5R = size * 0.13 * bloom * outerScale * 0.46;
    const os5x = Math.cos(outerSpark5Angle) * outerSpark5R;
    const os5y = Math.sin(outerSpark5Angle) * outerSpark5R * 0.31;
    ctx.beginPath();
    ctx.arc(os5x, os5y, (0.34 / zoom) * (0.16 + 0.24 * trail), 0, Math.PI * 2);
    ctx.globalAlpha = 0.021 * trail * lag * ringTrailFade;
    ctx.fillStyle = PHOSPHOR;
    ctx.fill();

    // Soft radial falloff under the fifth trailing micro-spark — inherits the same trail-fade
    const falloff5R = (1.35 / zoom) * (0.26 + 0.36 * trail);
    const falloff5Grad = ctx.createRadialGradient(os5x, os5y, 0, os5x, os5y, falloff5R);
    falloff5Grad.addColorStop(0, PHOSPHOR);
    falloff5Grad.addColorStop(0.42, "rgba(63, 198, 255, 0.07)");
    falloff5Grad.addColorStop(1, "rgba(63, 198, 255, 0)");
    ctx.save();
    ctx.globalAlpha = 0.008 * trail * lag * ringTrailFade;
    ctx.fillStyle = falloff5Grad;
    ctx.beginPath();
    ctx.arc(os5x, os5y, falloff5R, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Sixth, quietest trailing micro-spark on the outer counter-breath — furthest offset, smallest, shares the same falloff and trail-fade
    const outerSpark6Angle = -rot * 0.022 + Math.PI * 2.85;
    const outerSpark6R = size * 0.10 * bloom * outerScale * 0.35;
    const os6x = Math.cos(outerSpark6Angle) * outerSpark6R;
    const os6y = Math.sin(outerSpark6Angle) * outerSpark6R * 0.26;
    ctx.beginPath();
    ctx.arc(os6x, os6y, (0.24 / zoom) * (0.12 + 0.18 * trail), 0, Math.PI * 2);
    ctx.globalAlpha = 0.011 * trail * lag * ringTrailFade;
    ctx.fillStyle = PHOSPHOR;
    ctx.fill();

    // Soft radial falloff under the sixth trailing micro-spark — inherits the same trail-fade
    const falloff6R = (1.05 / zoom) * (0.20 + 0.28 * trail);
    const falloff6Grad = ctx.createRadialGradient(os6x, os6y, 0, os6x, os6y, falloff6R);
    falloff6Grad.addColorStop(0, PHOSPHOR);
    falloff6Grad.addColorStop(0.38, "rgba(63, 198, 255, 0.04)");
    falloff6Grad.addColorStop(1, "rgba(63, 198, 255, 0)");
    ctx.save();
    ctx.globalAlpha = 0.004 * trail * lag * ringTrailFade;
    ctx.fillStyle = falloff6Grad;
    ctx.beginPath();
    ctx.arc(os6x, os6y, falloff6R, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();

    // Faint gap-value readout on the diamond once labels have dissolved
    // Subtle scale pulse matches the primary diamond breath so contact stays readable
    // Matching lag-echo scale trails the primary using flushPulseLag
    // Slow-harmonic scale trails further using flushPulseSlow for a third layered breath
    const readout = gap <= 0.2 ? "flush" : formatDistributeGap(gap);
    const readoutAlpha = READOUT_BASE_ALPHA * (READOUT_PULSE_MIN + READOUT_PULSE_RANGE * pulse);
    const readoutScale = READOUT_SCALE_BASE + READOUT_SCALE_PULSE * pulse;
    const trailFade = READOUT_TRAIL_FADE_BASE + READOUT_TRAIL_FADE_RANGE * pulse;
    const readoutLagScale = READOUT_LAG_SCALE_BASE + READOUT_LAG_SCALE_PULSE * lag;
    const readoutLagAlpha = READOUT_LAG_ALPHA * lag * trailFade;
    const readoutSlowScale = READOUT_SLOW_SCALE_BASE + READOUT_SLOW_SCALE_PULSE * slow;
    const readoutSlowAlpha = READOUT_SLOW_ALPHA * slow * trailFade;
    const readoutFont = `${Math.max(8, 10 / zoom)}px ui-sans-serif, system-ui, sans-serif`;
    ctx.save();
    ctx.translate(0, size * 0.08);
    ctx.rotate(rot * READOUT_COUNTER_ROT);
    // Soft radial highlight under the gap readout — dissolves with trail-fade
    const hlR = size * 0.22;
    const hlGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, hlR);
    hlGrad.addColorStop(0, PHOSPHOR);
    hlGrad.addColorStop(0.55, "rgba(63, 198, 255, 0.4)");
    hlGrad.addColorStop(1, "rgba(63, 198, 255, 0)");
    ctx.save();
    ctx.globalAlpha = 0.22 * trailFade;
    ctx.fillStyle = hlGrad;
    ctx.beginPath();
    ctx.arc(0, 0, hlR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Faint trailing echo on the soft radial highlight — slightly larger, lag-scaled, dissolves with trail-fade
    const echoR = hlR * (1.28 + 0.08 * lag);
    const echoGrad = ctx.createRadialGradient(0, 0, hlR * 0.35, 0, 0, echoR);
    echoGrad.addColorStop(0, "rgba(63, 198, 255, 0)");
    echoGrad.addColorStop(0.4, "rgba(63, 198, 255, 0.22)");
    echoGrad.addColorStop(1, "rgba(63, 198, 255, 0)");
    ctx.save();
    ctx.globalAlpha = 0.11 * lag * trailFade;
    ctx.fillStyle = echoGrad;
    ctx.beginPath();
    ctx.arc(0, 0, echoR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Second, even fainter outer echo ring on the trailing highlight — larger still, more lag-scaled, dissolves with trail-fade
    const outerEchoR = echoR * (1.35 + 0.12 * lag);
    const outerEchoGrad = ctx.createRadialGradient(0, 0, echoR * 0.55, 0, 0, outerEchoR);
    outerEchoGrad.addColorStop(0, "rgba(63, 198, 255, 0)");
    outerEchoGrad.addColorStop(0.5, "rgba(63, 198, 255, 0.12)");
    outerEchoGrad.addColorStop(1, "rgba(63, 198, 255, 0)");
    ctx.save();
    ctx.globalAlpha = 0.055 * lag * trailFade;
    ctx.fillStyle = outerEchoGrad;
    ctx.beginPath();
    ctx.arc(0, 0, outerEchoR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Slow harmonic — trails furthest so long holds feel layered; alpha fades with primary breath
    ctx.save();
    ctx.scale(readoutSlowScale, readoutSlowScale);
    ctx.globalAlpha = readoutSlowAlpha;
    ctx.fillStyle = PHOSPHOR;
    ctx.font = readoutFont;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(readout, 0, 0);
    ctx.restore();
    // Lag echo — trails the primary scale so the text has a second harmonic; dissolves with pulse
    ctx.save();
    ctx.scale(readoutLagScale, readoutLagScale);
    ctx.globalAlpha = readoutLagAlpha;
    ctx.fillStyle = PHOSPHOR;
    ctx.font = readoutFont;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(readout, 0, 0);
    ctx.restore();
    // Primary readout
    ctx.scale(readoutScale, readoutScale);
    ctx.globalAlpha = readoutAlpha;
    ctx.fillStyle = PHOSPHOR;
    ctx.font = readoutFont;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(readout, 0, 0);
    ctx.restore();

    ctx.restore();
  }

  // Gap-tick labels that fade into the flush diamond as contact approaches
  if (!flush && ghosts.length >= 2) {
    const labelFade = Math.max(0, Math.min(1, (gap - 1.5) / 10));
    if (labelFade > 0.02) {
      const mid = ghosts[Math.floor(ghosts.length / 2)];
      if (mid) {
        ctx.globalAlpha = 0.4 * labelFade;
        ctx.strokeStyle = PHOSPHOR;
        ctx.beginPath();
        if (axis === "h") {
          ctx.moveTo(mid.x + mid.w / 2, mid.y - 10 / zoom);
          ctx.lineTo(mid.x + mid.w / 2, mid.y + mid.h + 10 / zoom);
        } else {
          ctx.moveTo(mid.x - 10 / zoom, mid.y + mid.h / 2);
          ctx.lineTo(mid.x + mid.w + 10 / zoom, mid.y + mid.h / 2);
        }
        ctx.stroke();

        // Soft label that dissolves as the diamond bloom takes over
        const label = formatDistributeGap(gap);
        ctx.globalAlpha = 0.75 * labelFade;
        ctx.fillStyle = PHOSPHOR;
        ctx.font = `${Math.max(9, 11 / zoom)}px ui-sans-serif, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const lx = axis === "h" ? mid.x + mid.w / 2 : mid.x + mid.w + 14 / zoom;
        const ly = axis === "h" ? mid.y - 16 / zoom : mid.y + mid.h / 2;
        ctx.fillText(label, lx, ly);
      }
    }
  }

  ctx.restore();
}
