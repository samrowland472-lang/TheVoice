export interface FontAxis {
  tag: "opsz" | "wdth";
  min: number;
  max: number;
  fallback: number;
}

export interface CanvasFont {
  id: string;
  family: string;
  fallback: string;
  weights: number[];
  role: "display" | "body" | "mono";
  opsz?: FontAxis;
  wdth?: FontAxis;
}

export const CANVAS_FONTS: CanvasFont[] = [
  { id: "chakra", family: "Chakra Petch", fallback: "system-ui", weights: [400, 500, 600, 700], role: "display" },
  { id: "syne", family: "Syne", fallback: "system-ui", weights: [400, 600, 700, 800], role: "display" },
  { id: "bebas", family: "Bebas Neue", fallback: "Impact, system-ui", weights: [400], role: "display" },
  {
    id: "fraunces",
    family: "Fraunces",
    fallback: "Georgia, serif",
    weights: [400, 600, 700],
    role: "display",
    opsz: { tag: "opsz", min: 9, max: 144, fallback: 144 },
  },
  { id: "outfit", family: "Outfit", fallback: "system-ui", weights: [300, 400, 500, 600, 700], role: "body" },
  {
    id: "instrument",
    family: "Instrument Sans",
    fallback: "system-ui",
    weights: [400, 500, 600, 700],
    role: "body",
    wdth: { tag: "wdth", min: 75, max: 100, fallback: 100 },
  },
  { id: "share", family: "Share Tech Mono", fallback: "ui-monospace, monospace", weights: [400], role: "mono" },
  { id: "ibm", family: "IBM Plex Mono", fallback: "ui-monospace, monospace", weights: [400, 500, 600], role: "mono" },
];

export function fontStack(family: string): string {
  const f = CANVAS_FONTS.find((c) => c.family === family);
  return f ? `"${f.family}", ${f.fallback}` : `"${family}", system-ui, sans-serif`;
}

export const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Chakra+Petch:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=IBM+Plex+Mono:wght@400;500;600&family=Instrument+Sans:wdth,wght@75..100,400;75..100,500;75..100,600;75..100,700&family=Outfit:wght@300;400;500;600;700&family=Share+Tech+Mono&family=Syne:wght@400;600;700;800&display=swap";

export function canvasFont(family: string): CanvasFont | undefined {
  return CANVAS_FONTS.find((c) => c.family === family);
}

export function clampAxis(axis: FontAxis, value: number | undefined, auto?: number): number {
  const raw = value ?? auto ?? axis.fallback;
  if (!Number.isFinite(raw)) return axis.fallback;
  return Math.min(axis.max, Math.max(axis.min, raw));
}

export function faceSupports(family: string, tag: FontAxis["tag"]): FontAxis | undefined {
  const face = canvasFont(family);
  return tag === "opsz" ? face?.opsz : face?.wdth;
}

export function effectiveAxis(
  node: { fontFamily: string; fontSize: number; opticalSize?: number; fontWidth?: number },
  tag: FontAxis["tag"],
): number | undefined {
  const axis = faceSupports(node.fontFamily, tag);
  if (!axis) return undefined;
  return tag === "opsz"
    ? clampAxis(axis, node.opticalSize, node.fontSize)
    : clampAxis(axis, node.fontWidth);
}

export function variationSettings(node: {
  fontFamily: string;
  fontSize: number;
  opticalSize?: number;
  fontWidth?: number;
}): string {
  const face = canvasFont(node.fontFamily);
  const parts: string[] = [];
  if (face?.opsz) {
    parts.push(`"opsz" ${clampAxis(face.opsz, node.opticalSize, node.fontSize)}`);
  }
  if (face?.wdth) {
    parts.push(`"wdth" ${clampAxis(face.wdth, node.fontWidth)}`);
  }
  return parts.join(", ");
}

export function applyFontFace(
  ctx: CanvasRenderingContext2D,
  node: {
    fontFamily: string;
    fontWeight: number;
    fontSize: number;
    letterSpacing: number;
    opticalSize?: number;
    fontWidth?: number;
  },
) {
  ctx.font = `${node.fontWeight} ${node.fontSize}px ${fontStack(node.fontFamily)}`;
  const settings = variationSettings(node);
  const varied = ctx as CanvasRenderingContext2D & {
    fontVariationSettings?: string;
    letterSpacing?: string;
  };
  if ("fontVariationSettings" in varied) {
    varied.fontVariationSettings = settings || "normal";
  }
  if ("letterSpacing" in varied) {
    varied.letterSpacing = `${node.letterSpacing}px`;
  }
}
