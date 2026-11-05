/** On-canvas distribute visual helpers for multi path-point selection.
 *  Phosphor equal-gap ticks + triple-dot handle motifs + gap badges.
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

/** Draw gap-size badges between equal-spacing ticks when zoom allows readable text. */
export function drawGapBadges(
  ctx: CanvasRenderingContext2D,
  axis: DistAxis,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  count: number,
  zoom: number,
  gapLabel: string,
) {
  if (zoom < 1.2 || count < 3) return;
  const n = Math.max(3, count);
  const fontSize = Math.min(11, Math.max(8, 10 / zoom * 1.4));
  ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.fillStyle = "rgba(6, 23, 15, 0.85)";
  ctx.strokeStyle = "rgba(126, 224, 255, 0.95)";
  ctx.lineWidth = 0.8 / zoom;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const pad = 3 / zoom;
  const metrics = ctx.measureText(gapLabel);
  const tw = metrics.width + pad * 2;
  const th = fontSize + pad;
  if (axis === "h") {
    const y = boxY + boxH / 2;
    for (let i = 0; i < n - 1; i++) {
      const t0 = i / (n - 1);
      const t1 = (i + 1) / (n - 1);
      const mx = boxX + ((t0 + t1) / 2) * boxW;
      const bx = mx - tw / 2;
      const by = y - th / 2 - 6 / zoom;
      ctx.fillRect(bx, by, tw, th);
      ctx.strokeRect(bx, by, tw, th);
      ctx.fillStyle = "#7ee0ff";
      ctx.fillText(gapLabel, mx, by + th / 2);
      ctx.fillStyle = "rgba(6, 23, 15, 0.85)";
    }
  } else {
    const x = boxX + boxW / 2;
    for (let i = 0; i < n - 1; i++) {
      const t0 = i / (n - 1);
      const t1 = (i + 1) / (n - 1);
      const my = boxY + ((t0 + t1) / 2) * boxH;
      const bx = x + 6 / zoom;
      const by = my - th / 2;
      ctx.fillRect(bx, by, tw, th);
      ctx.strokeRect(bx, by, tw, th);
      ctx.fillStyle = "#7ee0ff";
      ctx.fillText(gapLabel, bx + tw / 2, my);
      ctx.fillStyle = "rgba(6, 23, 15, 0.85)";
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
