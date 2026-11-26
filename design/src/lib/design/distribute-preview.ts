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
    ghosts.push({ id: item.n.id, x: gx, y: gy, w: item.n.w, h: item.n.h, stay: Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 });
    minX = Math.min(minX, gx);
    minY = Math.min(minY, gy);
    maxX = Math.max(maxX, gx + item.n.w);
    maxY = Math.max(maxY, gy + item.n.h);
    cursor += size + gap;
  }
  return { axis, gap, ids: roots.map((r) => r.id), deltas, ghosts, center, bounds: { minX, minY, maxX, maxY } };
}

export function armDistributePreview(axis: DistributeAxis) {
  const s = useDesign.getState();
  if (!s.doc || s.selection.length < 3) { clear(); return; }
  plan = computePlan(s.doc.nodes, s.selection, axis);
  notify();
}

export function setLiveDistributePreview(axis: DistributeAxis, gap: number) {
  const s = useDesign.getState();
  if (!s.doc || s.selection.length < 3) { clear(); return; }
  plan = computePlan(s.doc.nodes, s.selection, axis, Math.max(0, gap));
  notify();
}

export function commitDistributePreview() {
  if (!plan) return;
  const s = useDesign.getState();
  if (!s.doc) { clear(); return; }
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

export function drawDistributePreview(
  ctx: CanvasRenderingContext2D,
  planIn: DistributePlan,
  zoom: number,
  pulse: number,
  lag: number,
  rot: number,
  _slow: number,
  trail: number,
) {
  const { ghosts, bounds, gap, axis } = planIn;
  const flush = gap <= 1.5;
  const alpha = flush ? 0.85 : 0.55;
  ctx.save();
  ctx.lineWidth = 1 / zoom;
  ctx.strokeStyle = PHOSPHOR;
  ctx.globalAlpha = alpha;
  for (const g of ghosts) {
    ctx.beginPath();
    ctx.rect(g.x, g.y, g.w, g.h);
    ctx.setLineDash(g.stay ? [] : [4 / zoom, 3 / zoom]);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // Equal-spacing connectors between consecutive ghosts
  if (!flush && ghosts.length >= 2) {
    ctx.save();
    ctx.strokeStyle = PHOSPHOR;
    ctx.globalAlpha = 0.42;
    ctx.lineWidth = 0.75 / zoom;
    ctx.setLineDash([3 / zoom, 2 / zoom]);
    for (let i = 0; i < ghosts.length - 1; i++) {
      const a = ghosts[i]!;
      const b = ghosts[i + 1]!;
      let x1, y1, x2, y2;
      if (axis === "h") {
        x1 = a.x + a.w;
        y1 = a.y + a.h / 2;
        x2 = b.x;
        y2 = b.y + b.h / 2;
      } else {
        x1 = a.x + a.w / 2;
        y1 = a.y + a.h;
        x2 = b.x + b.w / 2;
        y2 = b.y;
      }
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      // Tick at midpoint + small gap readout
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      if (axis === "h") {
        ctx.moveTo(mx, my - 4 / zoom);
        ctx.lineTo(mx, my + 4 / zoom);
      } else {
        ctx.moveTo(mx - 4 / zoom, my);
        ctx.lineTo(mx + 4 / zoom, my);
      }
      ctx.stroke();
      // Per-gap label when space allows
      if (gap > 8 && zoom > 0.4) {
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = PHOSPHOR;
        ctx.font = `${Math.max(7, 8 / zoom)}px ui-sans-serif, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const labelOff = 10 / zoom;
        const lx = axis === "h" ? mx : mx + labelOff;
        const ly = axis === "h" ? my - labelOff : my;
        ctx.fillText(formatDistributeGap(gap), lx, ly);
        ctx.globalAlpha = 0.42;
      }
      ctx.setLineDash([3 / zoom, 2 / zoom]);
    }
    ctx.restore();
  }
  if (flush) {
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = (bounds.minY + bounds.maxY) / 2;
    const size = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) * 0.42;
    const bloom = 0.65 + 0.35 * pulse;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot * 0.15);
    ctx.beginPath();
    ctx.moveTo(0, -size * bloom);
    ctx.lineTo(size * bloom * 0.7, 0);
    ctx.lineTo(0, size * bloom);
    ctx.lineTo(-size * bloom * 0.7, 0);
    ctx.closePath();
    ctx.globalAlpha = 0.7;
    ctx.stroke();
    // Outer counter-breath diamond + parameterized trail (6 diminishing sparks)
    // Sparks and lag stroke share one phase clock: both orbit relative to familyLag
    const outerScale = 1.16 + 0.04 * lag;
    const familyLag = rot * 0.08;
    ctx.rotate(-familyLag * 1.35);
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.28 * bloom * outerScale);
    ctx.lineTo(size * 0.18 * outerScale, 0);
    ctx.lineTo(0, size * 0.28 * bloom * outerScale);
    ctx.lineTo(-size * 0.18 * outerScale, 0);
    ctx.closePath();
    ctx.lineWidth = (1 / zoom) * (0.38 + 0.42 * lag) * (0.82 + 0.36 * pulse);
    ctx.globalAlpha = 0.26 * pulse * lag;
    ctx.stroke();
    const SPARK_COUNT = 6;
    for (let i = 0; i < SPARK_COUNT; i++) {
      const t = i / (SPARK_COUNT - 1);
      const fade = Math.pow(1 - t, 1.35);
      // Lock spark angles to the same familyLag rotation that drives the lag stroke
      const angle = -familyLag * 1.35 + (i % 2 === 0 ? 1 : -1) * rot * (0.06 - t * 0.04) + Math.PI * (0.25 + t * 1.8);
      const radius = size * bloom * outerScale * (0.26 - t * 0.14) * (0.85 - t * 0.35) * (0.92 + 0.16 * trail);
      const yScale = 0.58 - t * 0.2;
      const sx = Math.cos(angle) * radius;
      const sy = Math.sin(angle) * radius * yScale;
      const sparkR = ((0.95 - t * 0.55) / zoom) * (0.35 + 0.45 * trail) * fade;
      if (sparkR < 0.15 / zoom) continue;
      ctx.beginPath();
      ctx.arc(sx, sy, sparkR, 0, Math.PI * 2);
      // Soft radial falloff: closer sparks brighter, trail phase shared with lag
      ctx.globalAlpha = (0.18 * fade) * trail * lag * (0.75 + 0.25 * (1 - t));
      ctx.fillStyle = PHOSPHOR;
      ctx.fill();
    }
    ctx.restore();
    const readout = gap <= 0.2 ? "flush" : formatDistributeGap(gap);
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = PHOSPHOR;
    ctx.font = `${Math.max(8, 10 / zoom)}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(readout, cx, cy);
  } else if (ghosts.length >= 2) {
    const labelFade = Math.max(0, Math.min(1, (gap - 1.5) / 10));
    if (labelFade > 0.02) {
      const mid = ghosts[Math.floor(ghosts.length / 2)];
      if (mid) {
        ctx.globalAlpha = 0.75 * labelFade;
        ctx.fillStyle = PHOSPHOR;
        ctx.font = `${Math.max(9, 11 / zoom)}px ui-sans-serif, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const lx = axis === "h" ? mid.x + mid.w / 2 : mid.x + mid.w + 14 / zoom;
        const ly = axis === "h" ? mid.y - 16 / zoom : mid.y + mid.h / 2;
        ctx.fillText(formatDistributeGap(gap), lx, ly);
      }
    }
  }
  ctx.restore();
}
