import type { Shadow } from "./types";

export const DEFAULT_SHADOW: Shadow = { color: "#000000", blur: 28, ox: 0, oy: 18, spread: 0, inset: false };

export function shadowSpread(shadow: Shadow | null | undefined): number {
  return shadow?.spread ?? DEFAULT_SHADOW.spread ?? 0;
}

export function shadowInset(shadow: Shadow | null | undefined): boolean {
  return Boolean(shadow?.inset);
}

export function cloneShadow(shadow: Shadow | null): Shadow | null {
  if (!shadow) return null;
  return {
    color: shadow.color,
    blur: shadow.blur,
    ox: shadow.ox,
    oy: shadow.oy,
    spread: shadowSpread(shadow),
    inset: shadowInset(shadow),
  };
}

export function shadowChipLabel(shadow: Shadow | null): string {
  if (!shadow) return "off";
  const spread = shadowSpread(shadow);
  const inset = shadowInset(shadow) ? " · in" : "";
  return `${shadow.color} · b${shadow.blur} · ${shadow.ox},${shadow.oy} · s${spread}${inset}`;
}

export function shadowKey(shadow: Shadow | null): string {
  if (!shadow) return "off";
  return `on:${shadow.color}:${shadow.blur}:${shadow.ox}:${shadow.oy}:${shadowSpread(shadow)}:${shadowInset(shadow) ? "in" : "out"}`;
}

export function shadowOxLabel(ox: number): string {
  return `ox ${ox}`;
}

export function shadowOyLabel(oy: number): string {
  return `oy ${oy}`;
}

export function stampShadowOx(shadow: Shadow | null, ox: number): Shadow {
  const base = shadow ? cloneShadow(shadow)! : { ...DEFAULT_SHADOW };
  return { ...base, ox };
}

export function stampShadowOy(shadow: Shadow | null, oy: number): Shadow {
  const base = shadow ? cloneShadow(shadow)! : { ...DEFAULT_SHADOW };
  return { ...base, oy };
}

export function stampShadowColor(shadow: Shadow | null, color: string): Shadow {
  const base = shadow ? cloneShadow(shadow)! : { ...DEFAULT_SHADOW };
  return { ...base, color };
}

export function stampShadowBlur(shadow: Shadow | null, blur: number): Shadow {
  const base = shadow ? cloneShadow(shadow)! : { ...DEFAULT_SHADOW };
  return { ...base, blur };
}

export function shadowColorLabel(color: string | null | undefined): string {
  return color ?? DEFAULT_SHADOW.color;
}

export function shadowBlurLabel(blur: number | null | undefined): string {
  return `b${blur ?? DEFAULT_SHADOW.blur}`;
}

export function shadowOffsetChipLabel(axis: "ox" | "oy", shadow: Shadow | null): string {
  const value = shadow ? shadow[axis] : DEFAULT_SHADOW[axis];
  return axis === "ox" ? shadowOxLabel(value) : shadowOyLabel(value);
}

export function stampShadowOffset(shadow: Shadow | null, axis: "ox" | "oy", value: number): Shadow {
  return axis === "ox" ? stampShadowOx(shadow, value) : stampShadowOy(shadow, value);
}

export function shadowSpreadLabel(spread: number | null | undefined): string {
  return `s${spread ?? 0}`;
}

export function shadowInsetLabel(inset: boolean | null | undefined): string {
  return inset ? "inset" : "drop";
}

export function stampShadowSpread(shadow: Shadow | null, spread: number): Shadow {
  const base = shadow ? cloneShadow(shadow)! : { ...DEFAULT_SHADOW };
  return { ...base, spread };
}

export function stampShadowInset(shadow: Shadow | null, inset: boolean): Shadow {
  const base = shadow ? cloneShadow(shadow)! : { ...DEFAULT_SHADOW };
  return { ...base, inset };
}

/**
 * Shared mapping for the artboard, PNG, and SVG.
 * Spread fattens blur. Inset keeps the authored offset — the renderer
 * clips with destination-in instead of flipping the drop.
 */
export function canvasShadowParams(shadow: Shadow) {
  const spread = Math.max(0, shadowSpread(shadow));
  return {
    color: shadow.color,
    blur: shadow.blur + spread,
    ox: shadow.ox,
    oy: shadow.oy,
    spread,
    inset: shadowInset(shadow),
  };
}
