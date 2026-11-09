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

/** Phosphor flush diamond with lag companion spark and peak halo.
 * Continuous expanding breath: primary diamond, nested marks and denary breath
 * on the thirteenth, quiet fourteenth at the absolute extreme trail with
 * even quieter undenary breath, quiet fifteenth mark at the extreme with
 * even quieter duodenary breath, quiet sixteenth mark at the absolute
 * extreme trail of the joint crest with even quieter tridenary breath,
 * quiet seventeenth mark only at the absolute extreme trail of the joint crest
 * with even quieter quattuordenary breath, quiet eighteenth mark only at the
 * absolute extreme trail of the joint crest with even quieter quindecenary breath,
 * quiet nineteenth mark only at the absolute extreme trail of the joint crest
 * with even quieter sexdenary breath, quiet twentieth mark only at the
 * absolute extreme trail of the joint crest with even quieter septendecimal breath,
 * quiet twenty-first mark only at the absolute extreme trail of the joint crest
 * with even quieter octodecimal breath, quiet twenty-second mark only at the
 * absolute extreme trail of the joint crest with even quieter novendecimal breath,
 * quiet twenty-third mark only at the absolute extreme trail of the joint crest
 * with even quieter vigesimal breath.
 * quiet twenty-fourth mark only at the absolute extreme trail of the joint crest
 * with even quieter unvigesimal breath,
 * quiet twenty-fifth mark only at the absolute extreme trail of the joint crest
 * with even quieter duovigesimal breath,
 * quiet twenty-sixth mark only at the absolute extreme trail of the joint crest
 * with even quieter trevigesimal breath.
 * All family members inherit familyLagRot.
 * Phosphor-on-ground.
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
  const z = Math.max(zoom, 0.01);
  const ghosts = plan.ghosts;
  if (ghosts.length < 2) return;

  // Overall contact diamond centered on the flush group
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const g of ghosts) {
    minX = Math.min(minX, g.x);
    minY = Math.min(minY, g.y);
    maxX = Math.max(maxX, g.x + g.w);
    maxY = Math.max(maxY, g.y + g.h);
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const halfW = Math.max(12 / z, (maxX - minX) * 0.42);
  const halfH = Math.max(12 / z, (maxY - minY) * 0.42);

  const familyLagRot = rotate + (lag - 0.5) * 0.35;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(familyLagRot);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // Shared micro-taper helper: short soft segments
  const taper = (len: number, a0: number, a1: number, width: number, alpha: number) => {
    ctx.save();
    ctx.strokeStyle = `rgba(63, 198, 255, ${alpha})`;
    ctx.lineWidth = width / z;
    ctx.beginPath();
    const steps = 6;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = a0 + (a1 - a0) * t;
      const r = len * (0.65 + 0.35 * Math.sin(t * Math.PI));
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  };

  // Primary diamond
  const drawDiamond = (scale: number, alpha: number, width: number, dash: number[] = []) => {
    ctx.save();
    ctx.scale(scale, scale);
    ctx.strokeStyle = `rgba(63, 198, 255, ${alpha})`;
    ctx.lineWidth = width / z;
    ctx.setLineDash(dash.map(d => d / z));
    ctx.beginPath();
    ctx.moveTo(0, -halfH);
    ctx.lineTo(halfW, 0);
    ctx.lineTo(0, halfH);
    ctx.lineTo(-halfW, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  };

  // Breathing primary
  const breath = 0.92 + 0.08 * pulse;
  drawDiamond(breath, 0.85, 1.4);

  // Soft radial halo
  ctx.save();
  ctx.globalAlpha = 0.22 * (0.6 + 0.4 * slow);
  ctx.strokeStyle = "rgba(63, 198, 255, 1)";
  ctx.lineWidth = 6 / z;
  drawDiamond(breath * 1.18, 1, 1);
  ctx.restore();

  // Second softer outer halo
  ctx.save();
  ctx.globalAlpha = 0.12 * trail;
  drawDiamond(breath * 1.32, 1, 0.8);
  ctx.restore();

  // Quiet secondary tick (short cross at vertices, lagged)
  ctx.save();
  ctx.rotate((lag - 0.5) * 0.4);
  ctx.strokeStyle = `rgba(63, 198, 255, ${0.55 * lag})`;
  ctx.lineWidth = 0.8 / z;
  const tick = 7 / z;
  for (const [tx, ty] of [[0, -halfH * breath], [halfW * breath, 0], [0, halfH * breath], [-halfW * breath, 0]]) {
    ctx.beginPath();
    ctx.moveTo(tx - tick, ty);
    ctx.lineTo(tx + tick, ty);
    ctx.moveTo(tx, ty - tick);
    ctx.lineTo(tx, ty + tick);
    ctx.stroke();
  }
  ctx.restore();

  // Faint trailing after-image
  ctx.save();
  ctx.globalAlpha = 0.18 * trail;
  ctx.rotate(-familyLagRot * 0.15);
  drawDiamond(breath * 0.96, 1, 0.9, [3, 2]);
  ctx.restore();

  // Quiet counter-rotating tick
  ctx.save();
  ctx.rotate(-familyLagRot * 0.7);
  ctx.strokeStyle = `rgba(63, 198, 255, ${0.35 * (1 - lag * 0.3)})`;
  ctx.lineWidth = 0.6 / z;
  ctx.beginPath();
  ctx.arc(0, 0, halfW * breath * 0.55, 0, Math.PI * 1.6);
  ctx.stroke();
  ctx.restore();

  // Cross-fade bridge
  ctx.save();
  ctx.globalAlpha = 0.28 * pulse;
  ctx.strokeStyle = "rgba(63, 198, 255, 1)";
  ctx.lineWidth = 0.5 / z;
  ctx.beginPath();
  ctx.moveTo(-halfW * 0.4, -halfH * 0.2);
  ctx.lineTo(halfW * 0.4, halfH * 0.2);
  ctx.moveTo(halfW * 0.4, -halfH * 0.2);
  ctx.lineTo(-halfW * 0.4, halfH * 0.2);
  ctx.stroke();
  ctx.restore();

  // Second quieter inner arc
  taper(halfW * 0.48 * breath, Math.PI * 0.15, Math.PI * 0.85, 0.7, 0.32 * lag);

  // Filament trail
  taper(halfW * 0.72 * breath, -Math.PI * 0.1, Math.PI * 0.9, 0.45, 0.22 * trail);

  // Third counter-arc
  taper(halfW * 0.38 * breath, Math.PI * 1.1, Math.PI * 1.9, 0.55, 0.26 * (1 - pulse * 0.4));

  // Fourth echo micro-taper
  taper(halfW * 0.62 * breath, Math.PI * 0.05, Math.PI * 0.55, 0.35, 0.18 * slow);

  // Fifth filament secondary breath
  taper(halfW * 0.81 * breath, Math.PI * 0.4, Math.PI * 1.3, 0.4, 0.16 * lag);

  // Sixth tertiary breath
  taper(halfW * 0.29 * breath, -Math.PI * 0.3, Math.PI * 0.4, 0.3, 0.14 * pulse);

  // Seventh quaternary breath
  taper(halfW * 0.55 * breath, Math.PI * 0.7, Math.PI * 1.6, 0.32, 0.12 * trail);

  // Eighth quinary breath
  taper(halfW * 0.44 * breath, Math.PI * 1.4, Math.PI * 2.1, 0.28, 0.11 * slow);

  // Ninth senary breath
  taper(halfW * 0.67 * breath, -Math.PI * 0.2, Math.PI * 0.6, 0.25, 0.10 * lag);

  // Tenth septenary breath
  taper(halfW * 0.36 * breath, Math.PI * 0.25, Math.PI * 0.95, 0.22, 0.09 * pulse);

  // Eleventh octonary breath
  taper(halfW * 0.58 * breath, Math.PI * 1.05, Math.PI * 1.75, 0.2, 0.08 * trail);

  // Twelfth mark — quiet, near peak
  const twelfthPeak = Math.max(0, pulse - 0.65) * 2.2;
  if (twelfthPeak > 0.05) {
    ctx.save();
    ctx.globalAlpha = 0.42 * twelfthPeak;
    ctx.strokeStyle = "rgba(63, 198, 255, 1)";
    ctx.lineWidth = 0.7 / z;
    ctx.beginPath();
    ctx.arc(0, -halfH * breath * 0.92, 4.5 / z, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Nonary breath on twelfth
  if (twelfthPeak > 0.1) {
    taper(halfW * 0.22 * breath, Math.PI * 1.5, Math.PI * 1.85, 0.18, 0.07 * twelfthPeak * lag);
  }

  // Thirteenth mark — only at absolute extreme trail of the joint crest
  const thirteenthPeak = Math.max(0, trail - 0.72) * 3.1;
  if (thirteenthPeak > 0.04) {
    ctx.save();
    ctx.globalAlpha = 0.28 * thirteenthPeak;
    ctx.rotate(familyLagRot * 0.2);
    ctx.strokeStyle = "rgba(63, 198, 255, 1)";
    ctx.lineWidth = 0.5 / z;
    const r13 = halfW * breath * 1.05;
    ctx.beginPath();
    ctx.moveTo(r13 * 0.92, -2 / z);
    ctx.lineTo(r13 * 1.08, 0);
    ctx.lineTo(r13 * 0.92, 2 / z);
    ctx.stroke();
    ctx.restore();
  }

  // Denary breath — even quieter on the thirteenth
  if (thirteenthPeak > 0.08) {
    taper(halfW * 0.16 * breath, Math.PI * 0.05, Math.PI * 0.35, 0.14, 0.045 * thirteenthPeak * slow);
  }

  // Quiet fourteenth mark at absolute extreme trail
  const fourteenthPeak = Math.max(0, trail - 0.82) * 4.2;
  if (fourteenthPeak > 0.03) {
    ctx.save();
    ctx.globalAlpha = 0.18 * fourteenthPeak;
    ctx.rotate(familyLagRot * 0.12);
    ctx.strokeStyle = "rgba(63, 198, 255, 1)";
    ctx.lineWidth = 0.35 / z;
    const r14 = halfW * breath * 1.14;
    ctx.beginPath();
    ctx.arc(r14, 0, 2.2 / z, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Undenary breath — even quieter on the fourteenth
  if (fourteenthPeak > 0.07) {
    taper(halfW * 0.11 * breath, Math.PI * 0.08, Math.PI * 0.28, 0.11, 0.032 * fourteenthPeak * slow);
  }

  // Quiet fifteenth mark only at the absolute extreme trail of the joint crest
  const fifteenthPeak = Math.max(0, trail - 0.9) * 5.5;
  if (fifteenthPeak > 0.025) {
    ctx.save();
    ctx.globalAlpha = 0.12 * fifteenthPeak;
    ctx.rotate(familyLagRot * 0.08);
    ctx.strokeStyle = "rgba(63, 198, 255, 1)";
    ctx.lineWidth = 0.25 / z;
    const r15 = halfW * breath * 1.22;
    ctx.beginPath();
    ctx.moveTo(r15 * 0.96, -1.2 / z);
    ctx.lineTo(r15 * 1.04, 0);
    ctx.lineTo(r15 * 0.96, 1.2 / z);
    ctx.stroke();
    ctx.restore();
  }

  // Duodenary breath — even quieter on the fifteenth
  if (fifteenthPeak > 0.06) {
    taper(halfW * 0.08 * breath, Math.PI * 0.12, Math.PI * 0.32, 0.09, 0.022 * fifteenthPeak * slow);
  }

  // Quiet sixteenth mark only at the absolute extreme trail of the joint crest
  const sixteenthPeak = Math.max(0, trail - 0.94) * 6.8;
  if (sixteenthPeak > 0.02) {
    ctx.save();
    ctx.globalAlpha = 0.08 * sixteenthPeak;
    ctx.rotate(familyLagRot * 0.05);
    ctx.strokeStyle = "rgba(63, 198, 255, 1)";
    ctx.lineWidth = 0.18 / z;
    const r16 = halfW * breath * 1.29;
    ctx.beginPath();
    ctx.arc(r16, 0, 1.4 / z, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Tridenary breath — even quieter on the sixteenth
  if (sixteenthPeak > 0.05) {
    taper(halfW * 0.055 * breath, Math.PI * 0.14, Math.PI * 0.28, 0.07, 0.014 * sixteenthPeak * slow);
  }

  // Quiet seventeenth mark only at the absolute extreme trail of the joint crest
  const seventeenthPeak = Math.max(0, trail - 0.97) * 8.2;
  if (seventeenthPeak > 0.015) {
    ctx.save();
    ctx.globalAlpha = 0.055 * seventeenthPeak;
    ctx.rotate(familyLagRot * 0.035);
    ctx.strokeStyle = "rgba(63, 198, 255, 1)";
    ctx.lineWidth = 0.12 / z;
    const r17 = halfW * breath * 1.36;
    ctx.beginPath();
    ctx.moveTo(r17 * 0.97, -0.9 / z);
    ctx.lineTo(r17 * 1.03, 0);
    ctx.lineTo(r17 * 0.97, 0.9 / z);
    ctx.stroke();
    ctx.restore();
  }

  // Quattuordenary breath — even quieter on the seventeenth
  if (seventeenthPeak > 0.04) {
    taper(halfW * 0.038 * breath, Math.PI * 0.16, Math.PI * 0.26, 0.05, 0.009 * seventeenthPeak * slow);
  }

  // Quiet eighteenth mark only at the absolute extreme trail of the joint crest
  const eighteenthPeak = Math.max(0, trail - 0.99) * 10.5;
  if (eighteenthPeak > 0.01) {
    ctx.save();
    ctx.globalAlpha = 0.035 * eighteenthPeak;
    ctx.rotate(familyLagRot * 0.022);
    ctx.strokeStyle = "rgba(63, 198, 255, 1)";
    ctx.lineWidth = 0.09 / z;
    const r18 = halfW * breath * 1.42;
    ctx.beginPath();
    ctx.moveTo(r18 * 0.98, -0.7 / z);
    ctx.lineTo(r18 * 1.02, 0);
    ctx.lineTo(r18 * 0.98, 0.7 / z);
    ctx.stroke();
    ctx.restore();
  }

  // Quindecenary breath — even quieter on the eighteenth
  if (eighteenthPeak > 0.03) {
    taper(halfW * 0.028 * breath, Math.PI * 0.18, Math.PI * 0.24, 0.035, 0.006 * eighteenthPeak * slow);
  }

  // Quiet nineteenth mark only at the absolute extreme trail of the joint crest
  const nineteenthPeak = Math.max(0, trail - 0.995) * 12.0;
  if (nineteenthPeak > 0.008) {
    ctx.save();
    ctx.globalAlpha = 0.022 * nineteenthPeak;
    ctx.rotate(familyLagRot * 0.014);
    ctx.strokeStyle = "rgba(63, 198, 255, 1)";
    ctx.lineWidth = 0.07 / z;
    const r19 = halfW * breath * 1.48;
    ctx.beginPath();
    ctx.moveTo(r19 * 0.985, -0.55 / z);
    ctx.lineTo(r19 * 1.015, 0);
    ctx.lineTo(r19 * 0.985, 0.55 / z);
    ctx.stroke();
    ctx.restore();
  }

  // Sexdenary breath — even quieter on the nineteenth
  if (nineteenthPeak > 0.025) {
    taper(halfW * 0.02 * breath, Math.PI * 0.20, Math.PI * 0.22, 0.025, 0.004 * nineteenthPeak * slow);
  }

  // Quiet twentieth mark only at the absolute extreme trail of the joint crest
  const twentiethPeak = Math.max(0, trail - 0.9975) * 14.0;
  if (twentiethPeak > 0.006) {
    ctx.save();
    ctx.globalAlpha = 0.014 * twentiethPeak;
    ctx.rotate(familyLagRot * 0.009);
    ctx.strokeStyle = "rgba(63, 198, 255, 1)";
    ctx.lineWidth = 0.05 / z;
    const r20 = halfW * breath * 1.54;
    ctx.beginPath();
    ctx.moveTo(r20 * 0.99, -0.4 / z);
    ctx.lineTo(r20 * 1.01, 0);
    ctx.lineTo(r20 * 0.99, 0.4 / z);
    ctx.stroke();
    ctx.restore();
  }

  // Septendecimal breath — even quieter on the twentieth
  if (twentiethPeak > 0.02) {
    taper(halfW * 0.014 * breath, Math.PI * 0.21, Math.PI * 0.23, 0.018, 0.0025 * twentiethPeak * slow);
  }

  // Quiet twenty-first mark only at the absolute extreme trail of the joint crest
  const twentyFirstPeak = Math.max(0, trail - 0.9987) * 16.0;
  if (twentyFirstPeak > 0.004) {
    ctx.save();
    ctx.globalAlpha = 0.009 * twentyFirstPeak;
    ctx.rotate(familyLagRot * 0.0055);
    ctx.strokeStyle = "rgba(63, 198, 255, 1)";
    ctx.lineWidth = 0.035 / z;
    const r21 = halfW * breath * 1.60;
    ctx.beginPath();
    ctx.moveTo(r21 * 0.992, -0.28 / z);
    ctx.lineTo(r21 * 1.008, 0);
    ctx.lineTo(r21 * 0.992, 0.28 / z);
    ctx.stroke();
    ctx.restore();
  }

  // Octodecimal breath — even quieter on the twenty-first
  if (twentyFirstPeak > 0.015) {
    taper(halfW * 0.01 * breath, Math.PI * 0.215, Math.PI * 0.225, 0.012, 0.0016 * twentyFirstPeak * slow);
  }

  // Quiet twenty-second mark only at the absolute extreme trail of the joint crest
  const twentySecondPeak = Math.max(0, trail - 0.9993) * 18.5;
  if (twentySecondPeak > 0.003) {
    ctx.save();
    ctx.globalAlpha = 0.0055 * twentySecondPeak;
    ctx.rotate(familyLagRot * 0.0032);
    ctx.strokeStyle = "rgba(63, 198, 255, 1)";
    ctx.lineWidth = 0.022 / z;
    const r22 = halfW * breath * 1.66;
    ctx.beginPath();
    ctx.moveTo(r22 * 0.994, -0.18 / z);
    ctx.lineTo(r22 * 1.006, 0);
    ctx.lineTo(r22 * 0.994, 0.18 / z);
    ctx.stroke();
    ctx.restore();
  }

  // Novendecimal breath — even quieter on the twenty-second
  if (twentySecondPeak > 0.012) {
    taper(halfW * 0.007 * breath, Math.PI * 0.218, Math.PI * 0.222, 0.008, 0.001 * twentySecondPeak * slow);
  }

  // Quiet twenty-third mark only at the absolute extreme trail of the joint crest
  const twentyThirdPeak = Math.max(0, trail - 0.9996) * 21.0;
  if (twentyThirdPeak > 0.002) {
    ctx.save();
    ctx.globalAlpha = 0.0032 * twentyThirdPeak;
    ctx.rotate(familyLagRot * 0.0018);
    ctx.strokeStyle = "rgba(63, 198, 255, 1)";
    ctx.lineWidth = 0.014 / z;
    const r23 = halfW * breath * 1.72;
    ctx.beginPath();
    ctx.moveTo(r23 * 0.996, -0.11 / z);
    ctx.lineTo(r23 * 1.004, 0);
    ctx.lineTo(r23 * 0.996, 0.11 / z);
    ctx.stroke();
    ctx.restore();
  }

  // Vigesimal breath — even quieter on the twenty-third
  if (twentyThirdPeak > 0.009) {
    taper(halfW * 0.0045 * breath, Math.PI * 0.2195, Math.PI * 0.2205, 0.005, 0.0006 * twentyThirdPeak * slow);
  }

  // Quiet twenty-fourth mark only at the absolute extreme trail of the joint crest
  const twentyFourthPeak = Math.max(0, trail - 0.9998) * 24.0;
  if (twentyFourthPeak > 0.0015) {
    ctx.save();
    ctx.globalAlpha = 0.0018 * twentyFourthPeak;
    ctx.rotate(familyLagRot * 0.0010);
    ctx.strokeStyle = "rgba(63, 198, 255, 1)";
    ctx.lineWidth = 0.009 / z;
    const r24 = halfW * breath * 1.78;
    ctx.beginPath();
    ctx.moveTo(r24 * 0.9975, -0.07 / z);
    ctx.lineTo(r24 * 1.0025, 0);
    ctx.lineTo(r24 * 0.9975, 0.07 / z);
    ctx.stroke();
    ctx.restore();
  }

  // Unvigesimal breath — even quieter on the twenty-fourth
  if (twentyFourthPeak > 0.006) {
    taper(halfW * 0.0028 * breath, Math.PI * 0.2202, Math.PI * 0.2208, 0.003, 0.00035 * twentyFourthPeak * slow);
  }

  // Quiet twenty-fifth mark only at the absolute extreme trail of the joint crest
  const twentyFifthPeak = Math.max(0, trail - 0.9999) * 28.0;
  if (twentyFifthPeak > 0.001) {
    ctx.save();
    ctx.globalAlpha = 0.0011 * twentyFifthPeak;
    ctx.rotate(familyLagRot * 0.0006);
    ctx.strokeStyle = "rgba(63, 198, 255, 1)";
    ctx.lineWidth = 0.0055 / z;
    const r25 = halfW * breath * 1.84;
    ctx.beginPath();
    ctx.moveTo(r25 * 0.9982, -0.045 / z);
    ctx.lineTo(r25 * 1.0018, 0);
    ctx.lineTo(r25 * 0.9982, 0.045 / z);
    ctx.stroke();
    ctx.restore();
  }

  // Duovigesimal breath — even quieter on the twenty-fifth
  if (twentyFifthPeak > 0.004) {
    taper(halfW * 0.0016 * breath, Math.PI * 0.2205, Math.PI * 0.2209, 0.0018, 0.0002 * twentyFifthPeak * slow);
  }

  // Quiet twenty-sixth mark only at the absolute extreme trail of the joint crest
  const twentySixthPeak = Math.max(0, trail - 0.99995) * 32.0;
  if (twentySixthPeak > 0.0007) {
    ctx.save();
    ctx.globalAlpha = 0.00065 * twentySixthPeak;
    ctx.rotate(familyLagRot * 0.00035);
    ctx.strokeStyle = "rgba(63, 198, 255, 1)";
    ctx.lineWidth = 0.0032 / z;
    const r26 = halfW * breath * 1.90;
    ctx.beginPath();
    ctx.moveTo(r26 * 0.9988, -0.028 / z);
    ctx.lineTo(r26 * 1.0012, 0);
    ctx.lineTo(r26 * 0.9988, 0.028 / z);
    ctx.stroke();
    ctx.restore();
  }

  // Trevigesimal breath — even quieter on the twenty-sixth
  if (twentySixthPeak > 0.0025) {
    taper(halfW * 0.0009 * breath, Math.PI * 0.2207, Math.PI * 0.22095, 0.001, 0.00011 * twentySixthPeak * slow);
  }

  ctx.restore();

  // Original ghost outlines (kept quiet so the diamond remains the focus)
  ctx.save();
  ctx.lineWidth = 0.6 / z;
  for (const g of ghosts) {
    ctx.strokeStyle = g.stay ? "rgba(63, 198, 255, 0.35)" : "rgba(63, 198, 255, 0.18)";
    ctx.setLineDash(g.stay ? [] : [3 / z, 2 / z]);
    ctx.strokeRect(g.x, g.y, g.w, g.h);
  }
  ctx.setLineDash([]);
  ctx.restore();
}
