import type { DesignNode, GradientFill } from "./types";
import { isGradient } from "./types";

export function fillKey(fill: DesignNode["fill"]): string {
  if (typeof fill === "string") return fill;
  const cx = fill.cx ?? 0.5;
  const cy = fill.cy ?? 0.5;
  const fx = fill.fx ?? cx;
  const fy = fill.fy ?? cy;
  const r0 = fill.r0 ?? 0;
  return `g:${fill.type}:${fill.angle}:${cx}:${cy}:${fx}:${fy}:${r0}:${fill.stops.map((s) => `${s.offset}:${s.color}`).join("|")}`;
}

export function solidOf(fill: DesignNode["fill"], fallback: string): string {
  if (typeof fill === "string" && fill !== "transparent") return fill;
  if (fill && typeof fill !== "string") return fill.stops[0]?.color ?? fallback;
  return fallback;
}

export function fillChipLabel(fill: DesignNode["fill"]): string {
  if (fill === "transparent") return "none";
  if (typeof fill === "string") return fill;
  if (isGradient(fill)) {
    const a = fill.stops[0]?.color ?? "grad";
    const b = fill.stops[fill.stops.length - 1]?.color ?? a;
    if (fill.type === "radial") {
      const ox = fill.cx ?? 0.5;
      const oy = fill.cy ?? 0.5;
      const fx = fill.fx ?? ox;
      const fy = fill.fy ?? oy;
      const centreOff = Math.abs(ox - 0.5) > 0.01 || Math.abs(oy - 0.5) > 0.01;
      const focalOff = Math.abs(fx - ox) > 0.01 || Math.abs(fy - oy) > 0.01;
      const r0 = fill.r0 ?? 0;
      const r0Note = r0 > 0.01 ? ` r${(r0 * 100).toFixed(0)}` : "";
      if (centreOff || focalOff || r0Note) {
        const base = `radial ${(ox * 100).toFixed(0)},${(oy * 100).toFixed(0)}${r0Note}`;
        return focalOff
          ? `${base}→${(fx * 100).toFixed(0)},${(fy * 100).toFixed(0)} · ${a}→${b}`
          : `${base} · ${a}→${b}`;
      }
      return `radial · ${a}→${b}`;
    }
    return `grad ${fill.angle}° · ${a}→${b}`;
  }
  return "fill";
}

export function strokeChipLabel(stroke: string, width: number): string {
  if (stroke === "transparent" || width <= 0) return "none";
  return `${stroke} · ${width}`;
}

export function strokeKey(stroke: string, width: number): string {
  if (stroke === "transparent" || width <= 0) return "off";
  return `${stroke}:${width}`;
}

export function cloneFill(fill: DesignNode["fill"]): DesignNode["fill"] {
  if (typeof fill === "string") return fill;
  const g: GradientFill = {
    type: fill.type === "radial" ? "radial" : "linear",
    angle: fill.angle,
    stops: fill.stops.map((s) => ({ offset: s.offset, color: s.color })),
  };
  if (fill.cx != null) g.cx = fill.cx;
  if (fill.cy != null) g.cy = fill.cy;
  if (fill.fx != null) g.fx = fill.fx;
  if (fill.fy != null) g.fy = fill.fy;
  if (fill.r0 != null) g.r0 = fill.r0;
  return g;
}
