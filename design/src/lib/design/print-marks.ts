import type { DesignDocument } from "./types";

export type PrintMarkLayout = {
  bleed: number;
  width: number;
  height: number;
  mark: number;
  gap: number;
  corners: Array<{ x: number; y: number; sx: number; sy: number }>;
};

export function printMarkLayout(doc: DesignDocument): PrintMarkLayout {
  const bleed = Math.max(0, doc.artboard.bleed ?? 0);
  const { width, height } = doc.artboard;
  const mark = Math.max(16, Math.min(42, Math.min(width, height) * 0.035));
  const gap = Math.max(3, Math.min(8, mark * 0.18));
  return {
    bleed,
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
  const { bleed, width, height, mark, gap, corners } = layout;
  const hair = 1 / Math.max(zoom, 0.05);
  const bleedBand = opts?.bleedBand ?? bleed > 0;
  const marks = opts?.marks ?? true;

  ctx.save();

  if (bleedBand && bleed > 0) {
    ctx.beginPath();
    ctx.rect(-bleed, -bleed, width + bleed * 2, height + bleed * 2);
    ctx.rect(0, 0, width, height);
    ctx.fillStyle = "rgba(63,198,255,0.08)";
    ctx.fill("evenodd");
    ctx.strokeStyle = "rgba(63,198,255,0.55)";
    ctx.lineWidth = 1.05 * hair;
    ctx.setLineDash([7 * hair, 5 * hair]);
    ctx.strokeRect(-bleed, -bleed, width + bleed * 2, height + bleed * 2);
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
    [midX, -Math.max(bleed, gap + arm + 4)],
    [midX, height + Math.max(bleed, gap + arm + 4)],
    [-Math.max(bleed, gap + arm + 4), midY],
    [width + Math.max(bleed, gap + arm + 4), midY],
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
