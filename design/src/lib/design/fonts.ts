export interface CanvasFont {
  id: string;
  family: string;
  fallback: string;
  weights: number[];
  role: "display" | "body" | "mono";
}

export const CANVAS_FONTS: CanvasFont[] = [
  { id: "chakra", family: "Chakra Petch", fallback: "system-ui", weights: [400, 500, 600, 700], role: "display" },
  { id: "syne", family: "Syne", fallback: "system-ui", weights: [400, 600, 700, 800], role: "display" },
  { id: "bebas", family: "Bebas Neue", fallback: "Impact, system-ui", weights: [400], role: "display" },
  { id: "fraunces", family: "Fraunces", fallback: "Georgia, serif", weights: [400, 600, 700], role: "display" },
  { id: "outfit", family: "Outfit", fallback: "system-ui", weights: [300, 400, 500, 600, 700], role: "body" },
  { id: "instrument", family: "Instrument Sans", fallback: "system-ui", weights: [400, 500, 600, 700], role: "body" },
  { id: "share", family: "Share Tech Mono", fallback: "ui-monospace, monospace", weights: [400], role: "mono" },
  { id: "ibm", family: "IBM Plex Mono", fallback: "ui-monospace, monospace", weights: [400, 500, 600], role: "mono" },
];

export function fontStack(family: string): string {
  const f = CANVAS_FONTS.find((c) => c.family === family);
  return f ? `"${f.family}", ${f.fallback}` : `"${family}", system-ui, sans-serif`;
}

export const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Chakra+Petch:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=IBM+Plex+Mono:wght@400;500;600&family=Instrument+Sans:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700&family=Share+Tech+Mono&family=Syne:wght@400;600;700;800&display=swap";
