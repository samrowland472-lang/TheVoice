import type { DesignDocument } from "./types";

export type BleedEdges = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type PrintMarkLayout = {
  bleed: number;
  edges: BleedEdges;
  width: number;
  height: number;
  mark: number;
  gap: number;
  corners: Array<{ x: number; y: number; sx: number; sy: number }>;
};

export function resolveBleed(doc: DesignDocument): BleedEdges {
  const raw = doc.artboard.bleedEdges;
  if (raw) {
    return {
      top: Math.max(0, raw.top ?? 0),
      right: Math.max(0, raw.right ?? 0),
      bottom: Math.max(0, raw.bottom ?? 0),
      left: Math.max(0, raw.left ?? 0),
    };
  }
  const b = Math.max(0, doc.artboard.bleed ?? 0);
  return { top: b, right: b, bottom: b, left: b };
}

export function uniformBleed(edges: BleedEdges): number | null {
  if (edges.top === edges.right && edges.right === edges.bottom && edges.bottom === edges.left) {
    return edges.top;
  }
  return null;
}

export function printMarkLayout(doc: DesignDocument): PrintMarkLayout {
  const edges = resolveBleed(doc);
  const bleed = Math.max(edges.top, edges.right, edges.bottom, edges.left);
  const { width, height } = doc.artboard;
  const mark = Math.max(16, Math.min(42, Math.min(width, height) * 0.035));
  const gap = Math.max(3, Math.min(8, mark * 0.18));
  return {
    bleed,
    edges,
    width,
    height,
    mark,
    gap,
    corners: [
      { x: 0, y: 0, sx: -1, sy: -1 },
      { x: width, y: 0, sx: 1, sy: -1 },
      { x: 0, y: height, sx: -1, sy: 1 },
      { x: width, y: height, sx: 1, sy: 1 },
    ],
  };
}

/** Live bleed band + crop / registration marks in document space (trim origin). */
export function drawPrintMarks(
  ctx: CanvasRenderingContext2D,
  doc: DesignDocument,
  zoom: number,
  opts?: { bleedBand?: boolean; marks?: boolean },
) {
  const layout = printMarkLayout(doc);
  const { edges, width, height, mark, gap, corners } = layout;
  const hair = 1 / Math.max(zoom, 0.05);
  const hasBleed = edges.top > 0 || edges.right > 0 || edges.bottom > 0 || edges.left > 0;
  const bleedBand = opts?.bleedBand ?? hasBleed;
  const marks = opts?.marks ?? true;

  ctx.save();

  if (bleedBand && hasBleed) {
    ctx.beginPath();
    ctx.rect(-edges.left, -edges.top, width + edges.left + edges.right, height + edges.top + edges.bottom);
    ctx.rect(0, 0, width, height);
    ctx.fillStyle = "rgba(63,198,255,0.08)";
    ctx.fill("evenodd");
    ctx.strokeStyle = "rgba(63,198,255,0.55)";
    ctx.lineWidth = 1.05 * hair;
    ctx.setLineDash([7 * hair, 5 * hair]);
    ctx.strokeRect(-edges.left, -edges.top, width + edges.left + edges.right, height + edges.top + edges.bottom);
    ctx.setLineDash([]);
  }

  if (!marks) {
    ctx.restore();
    return;
  }

  ctx.strokeStyle = "rgba(63,198,255,0.28)";
  ctx.lineWidth = hair;
  ctx.strokeRect(0, 0, width, height);

  const strokes: Array<{ color: string; width: number }> = [
    { color: "rgba(7,9,8,0.92)", width: 2.6 * hair },
    { color: "rgba(63,198,255,0.95)", width: 1.05 * hair },
  ];

  for (const s of strokes) {
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width;
    ctx.beginPath();
    for (const c of corners) {
      ctx.moveTo(c.x + c.sx * gap, c.y);
      ctx.lineTo(c.x + c.sx * (gap + mark), c.y);
      ctx.moveTo(c.x, c.y + c.sy * gap);
      ctx.lineTo(c.x, c.y + c.sy * (gap + mark));
    }
    ctx.stroke();
  }

  const midX = width / 2;
  const midY = height / 2;
  const arm = Math.min(10, mark * 0.35);
  const regs: Array<[number, number]> = [
    [midX, -Math.max(edges.top, gap + arm + 4)],
    [midX, height + Math.max(edges.bottom, gap + arm + 4)],
    [-Math.max(edges.left, gap + arm + 4), midY],
    [width + Math.max(edges.right, gap + arm + 4), midY],
  ];
  for (const s of strokes) {
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width;
    for (const [rx, ry] of regs) {
      ctx.beginPath();
      ctx.moveTo(rx - arm, ry);
      ctx.lineTo(rx + arm, ry);
      ctx.moveTo(rx, ry - arm);
      ctx.lineTo(rx, ry + arm);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(rx, ry, arm * 0.45, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.restore();
}

export function drawDocGuides(ctx: CanvasRenderingContext2D, doc: DesignDocument, zoom: number) {
  const guides = doc.guides ?? [];
  if (!guides.length) return;
  const hair = 1 / Math.max(zoom, 0.05);
  const { width, height } = doc.artboard;
  ctx.save();
  ctx.strokeStyle = "rgba(63,198,255,0.45)";
  ctx.lineWidth = hair;
  ctx.setLineDash([4 * hair, 3 * hair]);
  for (const g of guides) {
    ctx.beginPath();
    if (g.axis === "x") {
      ctx.moveTo(g.pos, -24 * hair);
      ctx.lineTo(g.pos, height + 24 * hair);
    } else {
      ctx.moveTo(-24 * hair, g.pos);
      ctx.lineTo(width + 24 * hair, g.pos);
    }
    ctx.stroke();
  }
  ctx.restore();
}

const PREF = "voice-design-print-marks";

export function readPrintMarksPref(): boolean {
  try {
    return localStorage.getItem(PREF) === "1";
  } catch {
    return false;
  }
}

export function writePrintMarksPref(on: boolean) {
  try {
    localStorage.setItem(PREF, on ? "1" : "0");
  } catch {
    /* blocked */
  }
}
