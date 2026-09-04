import type { Align, TextNode } from "./types";

export type TypeStyle = {
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;
  align: Align;
  uppercase: boolean;
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
  ].join(":");
}

export function typeChipLabel(node: Pick<TextNode, keyof TypeStyle> | TypeStyle): string {
  const t = normalizeType(node);
  const family = t.fontFamily.split(" ").pop() || t.fontFamily;
  const size = Number.isInteger(t.fontSize) ? String(t.fontSize) : String(Math.round(t.fontSize * 10) / 10);
  return `${family} ${size}`;
}
