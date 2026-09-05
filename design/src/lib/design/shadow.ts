import type { Shadow } from "./types";

export const DEFAULT_SHADOW: Shadow = { color: "#000000", blur: 28, ox: 0, oy: 18 };

export function cloneShadow(shadow: Shadow | null): Shadow | null {
  if (!shadow) return null;
  return { color: shadow.color, blur: shadow.blur, ox: shadow.ox, oy: shadow.oy };
}

export function shadowChipLabel(shadow: Shadow | null): string {
  if (!shadow) return "off";
  return `${shadow.color} · b${shadow.blur} · ${shadow.ox},${shadow.oy}`;
}

export function shadowKey(shadow: Shadow | null): string {
  if (!shadow) return "off";
  return `on:${shadow.color}:${shadow.blur}:${shadow.ox}:${shadow.oy}`;
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
