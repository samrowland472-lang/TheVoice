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

export function shadowOxKey(shadow: Shadow | null): string {
  return shadow ? `ox:${shadow.ox}` : "off";
}

export function shadowOyKey(shadow: Shadow | null): string {
  return shadow ? `oy:${shadow.oy}` : "off";
}

export function shadowOffsetChipLabel(axis: "ox" | "oy", shadow: Shadow | null): string {
  if (!shadow) return `${axis} off`;
  return `${axis} ${shadow[axis]}`;
}

export function stampShadowOffset(shadow: Shadow | null, axis: "ox" | "oy", value: number): Shadow {
  const base = shadow ? cloneShadow(shadow)! : { ...DEFAULT_SHADOW };
  return { ...base, [axis]: value };
}
