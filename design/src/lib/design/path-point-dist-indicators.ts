/** On-canvas distribute visual helpers for multi path-point selection.
 *  Phosphor equal-gap ticks + triple-dot handle motifs.
 */

export type DistAxis = "h" | "v";

/** Draw equal-spacing ticks along a horizontal or vertical span. */
export function drawEqualGapTicks(
  ctx: CanvasRenderingContext2D,
  axis: DistAxis,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  count: number,
  zoom: number,
) {
  const n = Math.max(3, count);
  ctx.strokeStyle = "rgba(126, 224, 255, 0.9)";
  ctx.lineWidth = 1.4 / zoom;
  if (axis === "h") {
    const y = boxY + boxH / 2;
    const tickH = 5 / zoom;
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const tx = boxX + t * boxW;
      ctx.beginPath();
      ctx.moveTo(tx, y - tickH);
      ctx.lineTo(tx, y + tickH);
      ctx.stroke();
    }
  } else {
    const x = boxX + boxW / 2;
    const tickW = 5 / zoom;
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const ty = boxY + t * boxH;
      ctx.beginPath();
      ctx.moveTo(x - tickW, ty);
      ctx.lineTo(x + tickW, ty);
      ctx.stroke();
    }
  }
}

/** Draw a phosphor square handle with three equal-gap dots oriented to axis. */
export function drawDistHandle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  axis: DistAxis,
  zoom: number,
) {
  const ds = 7 / zoom;
  const half = ds / 2;
  const dotR = 0.9 / zoom;
  const span = 4.2 / zoom;
  ctx.fillStyle = "#3fc6ff";
  ctx.strokeStyle = "#06170f";
  ctx.lineWidth = 1 / zoom;
  ctx.fillRect(x - half, y - half, ds, ds);
  ctx.strokeRect(x - half, y - half, ds, ds);
  ctx.fillStyle = "#06170f";
  if (axis === "h") {
    for (const t of [-1, 0, 1] as const) {
      ctx.beginPath();
      ctx.arc(x + t * (span / 2), y, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    for (const t of [-1, 0, 1] as const) {
      ctx.beginPath();
      ctx.arc(x, y + t * (span / 2), dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Spine + ticks connecting distribute target ghost positions. */
export function drawDistTargetSpine(
  ctx: CanvasRenderingContext2D,
  axis: DistAxis,
  targets: { x: number; y: number }[],
  zoom: number,
) {
  if (targets.length < 3) return;
  const sorted = targets.slice().sort((a, b) => (axis === "h" ? a.x - b.x : a.y - b.y));
  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(126, 224, 255, 0.85)";
  ctx.lineWidth = 1.2 / zoom;
  ctx.beginPath();
  if (axis === "h") {
    const y = sorted.reduce((s, p) => s + p.y, 0) / sorted.length;
    ctx.moveTo(sorted[0]!.x, y);
    ctx.lineTo(sorted[sorted.length - 1]!.x, y);
    ctx.stroke();
    const tickH = 4 / zoom;
    for (const p of sorted) {
      ctx.beginPath();
      ctx.moveTo(p.x, y - tickH);
      ctx.lineTo(p.x, y + tickH);
      ctx.stroke();
    }
  } else {
    const x = sorted.reduce((s, p) => s + p.x, 0) / sorted.length;
    ctx.moveTo(x, sorted[0]!.y);
    ctx.lineTo(x, sorted[sorted.length - 1]!.y);
    ctx.stroke();
    const tickW = 4 / zoom;
    for (const p of sorted) {
      ctx.beginPath();
      ctx.moveTo(x - tickW, p.y);
      ctx.lineTo(x + tickW, p.y);
      ctx.stroke();
    }
  }
}
