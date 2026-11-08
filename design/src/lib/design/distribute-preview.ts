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
  const z = Math.max(zoom, 0.01);
  // Ghost boxes
  ctx.save();
  ctx.lineWidth = 1 / z;
  for (const g of plan.ghosts) {
    ctx.strokeStyle = g.stay ? "rgba(63, 198, 255, 0.85)" : "rgba(63, 198, 255, 0.45)";
    ctx.setLineDash(g.stay ? [] : [4 / z, 3 / z]);
    ctx.strokeRect(g.x, g.y, g.w, g.h);
  }
  ctx.setLineDash([]);
  ctx.restore();

  // Flush diamond only when nearly closed
  if (plan.gap > 1.5 || plan.ghosts.length < 3) return;

  // Center of the group
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const g of plan.ghosts) {
    minX = Math.min(minX, g.x);
    minY = Math.min(minY, g.y);
    maxX = Math.max(maxX, g.x + g.w);
    maxY = Math.max(maxY, g.y + g.h);
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const size = 28 / z;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotate * 0.15);

  // Outer dashed ring with soft opacity modulation
  const outerR = size * 1.35;
  ctx.beginPath();
  ctx.arc(0, 0, outerR, 0, Math.PI * 2);
  ctx.setLineDash([3 / z, 4 / z]);
  ctx.strokeStyle = `rgba(63, 198, 255, ${0.18 + 0.12 * pulse})`;
  ctx.lineWidth = 1 / z;
  ctx.stroke();
  ctx.setLineDash([]);

  // Primary diamond
  const r = size * (0.92 + 0.08 * pulse);
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r, 0);
  ctx.lineTo(0, r);
  ctx.lineTo(-r, 0);
  ctx.closePath();
  ctx.strokeStyle = `rgba(63, 198, 255, ${0.75 + 0.2 * pulse})`;
  ctx.lineWidth = 1.4 / z;
  ctx.stroke();

  // Inner echo diamond (phase-offset)
  const ir = r * (0.62 + 0.06 * lag);
  ctx.beginPath();
  ctx.moveTo(0, -ir);
  ctx.lineTo(ir, 0);
  ctx.lineTo(0, ir);
  ctx.lineTo(-ir, 0);
  ctx.closePath();
  ctx.strokeStyle = `rgba(126, 224, 255, ${0.35 + 0.2 * lag})`;
  ctx.lineWidth = 0.8 / z;
  ctx.stroke();

  // Radial ticks
  const tickCount = 8;
  for (let i = 0; i < tickCount; i++) {
    const a = (i / tickCount) * Math.PI * 2 + rotate;
    const len = (6 + 2 * Math.sin(a * 2 + slow * 4)) / z;
    const inner = r * 0.15;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
    ctx.lineTo(Math.cos(a) * (inner + len), Math.sin(a) * (inner + len));
    ctx.strokeStyle = `rgba(63, 198, 255, ${0.25 + 0.2 * pulse})`;
    ctx.lineWidth = 0.6 / z;
    ctx.stroke();
  }

  // Companion spark on the trailing side
  const trailPhase = Math.max(0, trail);
  if (trailPhase > 0.35) {
    const trailAng = rotate + Math.PI * 0.65;
    const trailDist = r * (0.55 + 0.25 * trailPhase);
    const sx = Math.cos(trailAng) * trailDist;
    const sy = Math.sin(trailAng) * trailDist;
    const sparkSize = (2.2 + 1.2 * trailPhase) / z;
    const breath = 0.5 + 0.5 * Math.sin(slow * 6);

    // Soft radial halo
    const halo = sparkSize * (2.4 + 0.8 * breath);
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, halo);
    g.addColorStop(0, `rgba(126, 224, 255, ${0.35 * trailPhase * breath})`);
    g.addColorStop(1, "rgba(126, 224, 255, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(sx, sy, halo, 0, Math.PI * 2);
    ctx.fill();

    // Primary companion spark
    ctx.beginPath();
    ctx.arc(sx, sy, sparkSize, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(180, 240, 255, ${0.55 + 0.35 * trailPhase})`;
    ctx.fill();

    // Faint trailing after-image when trail is high
    if (trailPhase > 0.68) {
      const lagDist = trailDist * 1.18;
      const lx = Math.cos(trailAng) * lagDist;
      const ly = Math.sin(trailAng) * lagDist;
      const lagSize = sparkSize * 0.62;
      ctx.beginPath();
      ctx.arc(lx, ly, lagSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(126, 224, 255, ${0.22 * trailPhase * (0.6 + 0.4 * breath)})`;
      ctx.fill();
    }

    // Second, even softer halo ring — only at absolute peak of trail + slow breath
    const peak = trailPhase * breath;
    if (peak > 0.82) {
      const outerHalo = sparkSize * (3.6 + 0.6 * peak);
      const og = ctx.createRadialGradient(sx, sy, sparkSize * 1.4, sx, sy, outerHalo);
      og.addColorStop(0, `rgba(63, 198, 255, ${0.12 * (peak - 0.7)})`);
      og.addColorStop(1, "rgba(63, 198, 255, 0)");
      ctx.fillStyle = og;
      ctx.beginPath();
      ctx.arc(sx, sy, outerHalo, 0, Math.PI * 2);
      ctx.fill();

      // Quiet counter-rotating inner tick — only while the peak halo is live
      // so the lag family stays one coherent mark instead of discrete ticks.
      // Micro cross-fade into the after-image so the trail side never reads as separate marks.
      const counterAng = -rotate * 1.35 + Math.PI * 0.42;
      const innerDist = sparkSize * 1.55;
      const ix = Math.cos(counterAng) * innerDist;
      const iy = Math.sin(counterAng) * innerDist;
      const tickLen = (1.6 + 0.7 * peak) / z;
      const fade = Math.min(1, (peak - 0.82) / 0.12);
      ctx.save();
      ctx.translate(sx, sy);
      // Primary tick
      ctx.beginPath();
      ctx.moveTo(ix - Math.cos(counterAng) * tickLen, iy - Math.sin(counterAng) * tickLen);
      ctx.lineTo(ix + Math.cos(counterAng) * tickLen, iy + Math.sin(counterAng) * tickLen);
      ctx.strokeStyle = `rgba(180, 240, 255, ${0.16 * (peak - 0.75) * (1 - fade * 0.35)})`;
      ctx.lineWidth = 0.65 / z;
      ctx.lineCap = "round";
      ctx.stroke();
      // Second even quieter inner arc — only at absolute peak of the outer halo.
      // Slow opacity pulse so the trail side breathes as a single gesture.
      if (peak > 0.90) {
        const arcBreath = 0.5 + 0.5 * Math.sin(slow * 4.2);
        const arcOpacity = 0.09 * (peak - 0.88) * arcBreath;
        const arcR = sparkSize * (1.85 + 0.25 * arcBreath);
        const arcStart = counterAng - 0.55;
        const arcEnd = counterAng + 0.38;
        ctx.beginPath();
        ctx.arc(0, 0, arcR, arcStart, arcEnd);
        ctx.strokeStyle = `rgba(126, 224, 255, ${arcOpacity})`;
        ctx.lineWidth = 0.4 / z;
        ctx.lineCap = "round";
        ctx.stroke();
        // Faint trailing filament — only when the slow breath is near its own peak,
        // so the quiet arc softens into the lag family as one continuous breath.
        if (arcBreath > 0.82) {
          const filamentBreath = (arcBreath - 0.82) / 0.18;
          const filamentOpacity = 0.045 * filamentBreath * (peak - 0.88);
          const filamentStart = arcEnd - 0.08;
          const filamentEnd = arcEnd + 0.22;
          const filamentR = arcR * (1.02 + 0.06 * filamentBreath);
          ctx.beginPath();
          ctx.arc(0, 0, filamentR, filamentStart, filamentEnd);
          ctx.strokeStyle = `rgba(180, 240, 255, ${filamentOpacity})`;
          ctx.lineWidth = 0.28 / z;
          ctx.lineCap = "round";
          ctx.stroke();
        }

        // Third even quieter counter-arc — drifts opposite the first so the lag
        // family reads as one continuous breath. Only at the absolute peak of
        // the outer halo, with its own slow counter-phase.
        if (peak > 0.94) {
          const oppAng = counterAng + Math.PI * 0.92;
          const oppBreath = 0.5 + 0.5 * Math.sin(slow * 3.4 + Math.PI * 0.7);
          const oppOpacity = 0.055 * (peak - 0.92) * oppBreath;
          const oppR = sparkSize * (2.15 + 0.18 * oppBreath);
          const oppStart = oppAng - 0.42;
          const oppEnd = oppAng + 0.28;
          ctx.beginPath();
          ctx.arc(0, 0, oppR, oppStart, oppEnd);
          ctx.strokeStyle = `rgba(160, 230, 255, ${oppOpacity})`;
          ctx.lineWidth = 0.32 / z;
          ctx.lineCap = "round";
          ctx.stroke();
        }
      }
      // Soft cross-fade bridge toward the trailing after-image
      if (trailPhase > 0.68 && fade > 0.15) {
        const lagDx = Math.cos(trailAng) * trailDist * 0.18;
        const lagDy = Math.sin(trailAng) * trailDist * 0.18;
        const bridgeX = ix * (1 - fade * 0.4) + lagDx * fade * 0.4;
        const bridgeY = iy * (1 - fade * 0.4) + lagDy * fade * 0.4;
        ctx.beginPath();
        ctx.moveTo(ix * 0.7, iy * 0.7);
        ctx.lineTo(bridgeX, bridgeY);
        const bridgeBreath = 0.65 + 0.35 * Math.sin(slow * 3.1);
        ctx.strokeStyle = `rgba(126, 224, 255, ${0.11 * fade * (peak - 0.8) * bridgeBreath})`;
        ctx.lineWidth = 0.45 / z;
        ctx.lineCap = "round";
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  ctx.restore();
}
