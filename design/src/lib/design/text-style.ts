import { clampAxis, faceAxis } from "./fonts";
import type { Align, TextNode } from "./types";

export type TypeStyle = {
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;
  align: Align;
  uppercase: boolean;
  opticalSize?: number;
  fontWidth?: number;
};

export const DEFAULT_TYPE: TypeStyle = {
  fontFamily: "Chakra Petch",
  fontWeight: 600,
  fontSize: 48,
  letterSpacing: 0,
  lineHeight: 1.1,
  align: "left",
  uppercase: false,
};

export function normalizeType(node: Pick<TextNode, keyof TypeStyle> | TypeStyle): TypeStyle {
  return {
    fontFamily: node.fontFamily || DEFAULT_TYPE.fontFamily,
    fontWeight: node.fontWeight ?? DEFAULT_TYPE.fontWeight,
    fontSize: node.fontSize ?? DEFAULT_TYPE.fontSize,
    letterSpacing: node.letterSpacing ?? DEFAULT_TYPE.letterSpacing,
    lineHeight: node.lineHeight ?? DEFAULT_TYPE.lineHeight,
    align: node.align ?? DEFAULT_TYPE.align,
    uppercase: Boolean(node.uppercase),
    opticalSize: node.opticalSize,
    fontWidth: node.fontWidth,
  };
}

export function cloneType(node: Pick<TextNode, keyof TypeStyle> | TypeStyle): TypeStyle {
  return { ...normalizeType(node) };
}

export function typeKey(node: Pick<TextNode, keyof TypeStyle> | TypeStyle): string {
  const t = normalizeType(node);
  return [
    t.fontFamily,
    t.fontWeight,
    Math.round(t.fontSize * 100) / 100,
    Math.round(t.letterSpacing * 100) / 100,
    Math.round(t.lineHeight * 100) / 100,
    t.align,
    t.uppercase ? "1" : "0",
    t.opticalSize == null ? "auto" : String(Math.round(t.opticalSize * 10) / 10),
    t.fontWidth == null ? "auto" : String(Math.round(t.fontWidth * 10) / 10),
  ].join(":");
}

function formatChipNum(n: number) {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
}

function axisToken(node: TypeStyle, tag: "opsz" | "wdth"): string | null {
  const axis = faceAxis(node.fontFamily, tag);
  if (!axis) return null;
  if (tag === "opsz") {
    if (node.opticalSize == null) return "auto";
    return formatChipNum(clampAxis(axis, node.opticalSize, node.fontSize));
  }
  if (node.fontWidth == null) return "auto";
  return formatChipNum(clampAxis(axis, node.fontWidth));
}

/** True when supporting faces in the set do not share one opsz or wdth token. */
export function typeAxesDiffer(
  nodes: Array<Pick<TextNode, keyof TypeStyle> | TypeStyle>,
  tag: "opsz" | "wdth",
): boolean {
  const tokens = new Set<string>();
  for (const raw of nodes) {
    const token = axisToken(normalizeType(raw), tag);
    if (token != null) tokens.add(token);
  }
  return tokens.size > 1;
}

export function typeChipLabel(
  node: Pick<TextNode, keyof TypeStyle> | TypeStyle,
  peers?: Array<Pick<TextNode, keyof TypeStyle> | TypeStyle>,
): string {
  const t = normalizeType(node);
  const family = t.fontFamily.split(" ").pop() || t.fontFamily;
  const size = formatChipNum(t.fontSize);
  const group = peers && peers.length ? peers : [node];
  const parts = [`${family} ${size}`];
  if (typeAxesDiffer(group, "opsz")) {
    const token = axisToken(t, "opsz");
    if (token) parts.push(token === "auto" ? "opsz auto" : `opsz ${token}`);
  }
  if (typeAxesDiffer(group, "wdth")) {
    const token = axisToken(t, "wdth");
    if (token) parts.push(token === "auto" ? "wdth auto" : `wdth ${token}`);
  }
  return parts.join(" · ");
}

export function clampTypeSize(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_TYPE.fontSize;
  return Math.min(400, Math.max(6, n));
}

/** Scale every layer's size from the key so mixed stacks keep their steps. */
export function scaledTypeSizes(
  nodes: Pick<TextNode, "id" | "fontSize">[],
  keyId: string,
  nextKeySize: number,
): Map<string, number> {
  const key = nodes.find((n) => n.id === keyId) ?? nodes[nodes.length - 1];
  const from = key?.fontSize && key.fontSize > 0 ? key.fontSize : DEFAULT_TYPE.fontSize;
  const to = clampTypeSize(nextKeySize);
  const ratio = to / from;
  const out = new Map<string, number>();
  for (const n of nodes) {
    const next = n.id === key?.id ? to : clampTypeSize(n.fontSize * ratio);
    out.set(n.id, next);
  }
  return out;
}
