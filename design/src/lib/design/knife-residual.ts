import { useDesign } from "./store";
import { asEditablePath } from "./shape-to-path";
import { knifeSplitPieces, knifePointSplitPieces } from "./path-cut";
import type { DesignNode, Viewport } from "./types";

export type KnifeResidualPiece = {
  pts: { x: number; y: number }[];
  cx: number;
  cy: number;
  ox: number;
  oy: number;
  label: string;
};

export type KnifeResidual = {
  pieces: KnifeResidualPiece[];
  midX: number;
  midY: number;
  t0: number;
  duration: number;
};

/** Snapshot the live explode preview so residual can replay it after the cut lands. */
export function collectKnifeResidual(
  doc: { nodes: DesignNode[] } | null | undefined,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  zoom: number,
): KnifeResidual | null {
  if (!doc) return null;
  const dist = Math.hypot(bx - ax, by - ay);
  const preferred = useDesign.getState().selection[0];
  const paths: DesignNode[] = [];
  for (const n of doc.nodes) {
    if (!n.visible || n.locked) continue;
    const p = asEditablePath(n);
    if (p && p.points.length >= 2) paths.push(p);
  }
  const ordered = preferred
    ? ([paths.find((n) => n.id === preferred), ...paths.filter((n) => n.id !== preferred)].filter(Boolean) as DesignNode[])
    : paths;

  const cutMidX = (ax + bx) / 2;
  const cutMidY = (ay + by) / 2;
  const baseExplode = Math.min(22 / zoom, Math.max(0, dist - 8) * 0.18);
  type PieceInfo = {
    worldCx: number;
    worldCy: number;
    piece: { x: number; y: number }[];
    nodeX: number;
    nodeY: number;
    angle: number;
  };
  const allPieces: PieceInfo[] = [];
  for (const n of ordered) {
    const p = asEditablePath(n);
    if (!p) continue;
    const pieces =
      dist < 4 / zoom
        ? knifePointSplitPieces(p, bx - n.x, by - n.y, zoom)
        : knifeSplitPieces(p, ax, ay, bx, by);
    for (const piece of pieces) {
      if (piece.length < 2) continue;
      let sx = 0;
      let sy = 0;
      for (const pt of piece) {
        sx += pt.x;
        sy += pt.y;
      }
      const cnt = piece.length;
      const localCx = sx / cnt;
      const localCy = sy / cnt;
      const worldCx = n.x + localCx;
      const worldCy = n.y + localCy;
      allPieces.push({
        worldCx,
        worldCy,
        piece,
        nodeX: n.x,
        nodeY: n.y,
        angle: Math.atan2(worldCy - cutMidY, worldCx - cutMidX),
      });
    }
  }
  if (!allPieces.length) return null;
  allPieces.sort((a, b) => a.angle - b.angle);
  const residualPieces: KnifeResidualPiece[] = allPieces.map((info, idx) => {
    const stagger = allPieces.length > 1 ? 0.65 + 0.55 * (idx / Math.max(1, allPieces.length - 1)) : 1;
    const explode = Math.max(baseExplode * stagger, allPieces.length > 1 ? 10 / zoom : 0);
    let ox = 0;
    let oy = 0;
    if (explode > 0.5) {
      const dx = info.worldCx - cutMidX;
      const dy = info.worldCy - cutMidY;
      const len = Math.hypot(dx, dy) || 1;
      ox = (dx / len) * explode;
      oy = (dy / len) * explode;
    }
    const pts = info.piece.map((pt) => ({
      x: info.nodeX + pt.x + ox,
      y: info.nodeY + pt.y + oy,
    }));
    return {
      pts,
      cx: info.worldCx,
      cy: info.worldCy,
      ox,
      oy,
      label: String(idx + 1),
    };
  });
  return {
    pieces: residualPieces,
    midX: cutMidX,
    midY: cutMidY,
    t0: performance.now(),
    duration: 880,
  };
}

export function drawKnifeResidual(
  ctx: CanvasRenderingContext2D,
  residual: KnifeResidual,
  vp: Viewport,
  dpr: number,
) {
  const age = performance.now() - residual.t0;
  if (age >= residual.duration) return;
  const t = age / residual.duration;
  const hold = 0.48;
  let alpha = 1;
  if (t > hold) {
    const fade = Math.min(1, (t - hold) / (1 - hold));
    // Cosine ease-out: stays readable longer, then settles smoothly to zero.
    alpha = Math.cos(fade * Math.PI / 2);
  }
  if (alpha < 0.015) return;

  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.zoom, vp.zoom);
  ctx.globalAlpha = alpha;

  ctx.strokeStyle = "rgba(63, 198, 255, 0.7)";
  ctx.lineWidth = 1.35 / vp.zoom;
  ctx.setLineDash([3 / vp.zoom, 3 / vp.zoom]);
  for (const piece of residual.pieces) {
    if (piece.pts.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(piece.pts[0]!.x, piece.pts[0]!.y);
    for (let i = 1; i < piece.pts.length; i++) {
      const pt = piece.pts[i]!;
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();
  }
  ctx.setLineDash([]);

  if (residual.pieces.length > 1) {
    ctx.font = `${Math.max(10, 12 / vp.zoom)}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const lab of residual.pieces) {
      const lx = lab.cx + lab.ox;
      const ly = lab.cy + lab.oy;
      if (Math.hypot(lab.ox, lab.oy) > 2 / vp.zoom) {
        ctx.strokeStyle = "rgba(63, 198, 255, 0.4)";
        ctx.lineWidth = 0.75 / vp.zoom;
        ctx.setLineDash([2 / vp.zoom, 2 / vp.zoom]);
        ctx.beginPath();
        ctx.moveTo(lab.cx, lab.cy);
        ctx.lineTo(lx, ly);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      const pad = 6 / vp.zoom;
      const tw = ctx.measureText(lab.label).width;
      const bw = tw + pad * 2;
      const bh = 16 / vp.zoom;
      ctx.fillStyle = "rgba(6, 23, 15, 0.9)";
      ctx.strokeStyle = "#3fc6ff";
      ctx.lineWidth = 1.25 / vp.zoom;
      ctx.beginPath();
      ctx.roundRect(lx - bw / 2, ly - bh / 2, bw, bh, 4 / vp.zoom);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#3fc6ff";
      ctx.beginPath();
      ctx.arc(lx, ly, 1.5 / vp.zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(lab.label, lx, ly);
    }
  }

  ctx.restore();
}
