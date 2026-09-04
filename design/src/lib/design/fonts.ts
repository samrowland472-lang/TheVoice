export type FontAxisTag = "opsz" | "wdth" | "slnt" | "ital" | "GRAD" | "SOFT";

export interface FontAxis {
  tag: FontAxisTag;
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
  slnt?: FontAxis;
  ital?: FontAxis;
  GRAD?: FontAxis;
  SOFT?: FontAxis;
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
    SOFT: { tag: "SOFT", min: 0, max: 100, fallback: 0 },
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
  {
    id: "inter",
    family: "Inter",
    fallback: "system-ui",
    weights: [400, 500, 600, 700],
    role: "body",
    slnt: { tag: "slnt", min: -10, max: 0, fallback: 0 },
  },
  {
    id: "roboto-flex",
    family: "Roboto Flex",
    fallback: "system-ui",
    weights: [400, 500, 600, 700],
    role: "body",
    GRAD: { tag: "GRAD", min: -200, max: 150, fallback: 0 },
  },
  {
    id: "newsreader",
    family: "Newsreader",
    fallback: "Georgia, serif",
    weights: [400, 600, 700],
    role: "display",
    opsz: { tag: "opsz", min: 6, max: 72, fallback: 72 },
    ital: { tag: "ital", min: 0, max: 1, fallback: 0 },
  },
  { id: "share", family: "Share Tech Mono", fallback: "ui-monospace, monospace", weights: [400], role: "mono" },
  { id: "ibm", family: "IBM Plex Mono", fallback: "ui-monospace, monospace", weights: [400, 500, 600], role: "mono" },
];

export function fontStack(family: string): string {
  const f = CANVAS_FONTS.find((c) => c.family === family);
  return f ? `"${f.family}", ${f.fallback}` : `"${family}", system-ui, sans-serif`;
}

export const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Chakra+Petch:wght@400;500;600;700&family=Fraunces:opsz,SOFT,wght@9..144,0..100,400;9..144,0..100,600;9..144,0..100,700&family=IBM+Plex+Mono:wght@400;500;600&family=Instrument+Sans:wdth,wght@75..100,400;75..100,500;75..100,600;75..100,700&family=Inter:slnt,wght@-10..0,400;-10..0,500;-10..0,600;-10..0,700&family=Newsreader:ital,opsz,wght@0..1,6..72,400;0..1,6..72,600;0..1,6..72,700&family=Outfit:wght@300;400;500;600;700&family=Roboto+Flex:GRAD,wght@-200..150,400;-200..150,500;-200..150,600;-200..150,700&family=Share+Tech+Mono&family=Syne:wght@400;600;700;800&display=swap";

export function canvasFont(family: string): CanvasFont | undefined {
  return CANVAS_FONTS.find((c) => c.family === family);
}

export function faceAxis(family: string, tag: FontAxisTag): FontAxis | undefined {
  return canvasFont(family)?.[tag];
}

export function anyFaceHasAxis(families: string[], tag: FontAxisTag): boolean {
  return families.some((family) => Boolean(faceAxis(family, tag)));
}

export function clampAxis(axis: FontAxis, value: number | undefined, auto?: number): number {
  const raw = value ?? auto ?? axis.fallback;
  if (!Number.isFinite(raw)) return axis.fallback;
  return Math.min(axis.max, Math.max(axis.min, raw));
}

export function variationSettings(node: {
  fontFamily: string;
  fontSize: number;
  opticalSize?: number;
  fontWidth?: number;
  fontSlant?: number;
  fontItalic?: number;
  fontGrade?: number;
  fontSoft?: number;
}): string {
  const face = canvasFont(node.fontFamily);
  const parts: string[] = [];
  if (face?.opsz) {
    parts.push(`\"opsz\" ${clampAxis(face.opsz, node.opticalSize, node.fontSize)}`);
  }
  if (face?.wdth) {
    parts.push(`\"wdth\" ${clampAxis(face.wdth, node.fontWidth)}`);
  }
  if (face?.slnt) {
    parts.push(`\"slnt\" ${clampAxis(face.slnt, node.fontSlant)}`);
  }
  if (face?.ital) {
    parts.push(`\"ital\" ${clampAxis(face.ital, node.fontItalic)}`);
  }
  if (face?.GRAD) {
    parts.push(`\"GRAD\" ${clampAxis(face.GRAD, node.fontGrade)}`);
  }
  if (face?.SOFT) {
    parts.push(`\"SOFT\" ${clampAxis(face.SOFT, node.fontSoft)}`);
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
    fontSlant?: number;
    fontItalic?: number;
    fontGrade?: number;
    fontSoft?: number;
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
