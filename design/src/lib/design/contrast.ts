/** WCAG 2.x contrast helpers for inspector. */

function hexToRgb(hex: string): [number, number, number] | null {
  const h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    const r = Number.parseInt(h[0]! + h[0]!, 16);
    const g = Number.parseInt(h[1]! + h[1]!, 16);
    const b = Number.parseInt(h[2]! + h[2]!, 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return [r, g, b];
  }
  if (h.length !== 6) return null;
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return [r, g, b];
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
}

export function contrastRatio(fg: string, bg: string): number | null {
  const a = luminance(fg);
  const b = luminance(bg);
  if (a == null || b == null) return null;
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return (hi + 0.05) / (lo + 0.05);
}

export function wcagLevel(ratio: number, large: boolean): "fail" | "AA" | "AAA" {
  const aa = large ? 3 : 4.5;
  const aaa = large ? 4.5 : 7;
  if (ratio >= aaa) return "AAA";
  if (ratio >= aa) return "AA";
  return "fail";
}

export function bestInk(bg: string, candidates: string[]): string {
  const pool = [...candidates, "#d9f5e3", "#0a0d0c", "#ffffff", "#000000"];
  let best = pool[0] ?? "#d9f5e3";
  let bestR = 0;
  for (const c of pool) {
    const r = contrastRatio(c, bg);
    if (r != null && r > bestR) {
      best = c;
      bestR = r;
    }
  }
  return best;
}

export function solidHex(fill: unknown, fallback = "#0a0d0c"): string {
  if (typeof fill === "string" && fill !== "transparent" && fill.startsWith("#")) return fill;
  if (fill && typeof fill === "object" && "stops" in fill) {
    const stops = (fill as { stops?: { color?: string }[] }).stops;
    const c = stops?.[0]?.color;
    if (typeof c === "string" && c.startsWith("#")) return c;
  }
  return fallback;
}
