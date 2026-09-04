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
