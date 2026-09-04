import type { TextNode, Valign } from "./types";

export type MeasureFn = (text: string) => number;

export function normalizeWrap(node: Pick<TextNode, "wrap"> | { wrap?: boolean }): boolean {
  return node.wrap !== false;
}

export function normalizeValign(node: Pick<TextNode, "valign"> | { valign?: Valign }): Valign {
  return node.valign === "middle" || node.valign === "bottom" ? node.valign : "top";
}

/** Split a paragraph into lines that fit `maxWidth`. Empty input yields one empty line. */
export function wrapParagraph(text: string, maxWidth: number, measure: MeasureFn): string[] {
  const width = Math.max(1, maxWidth);
  const raw = text.replace(/\r/g, "");
  if (raw === "") return [""];
  const tokens = raw.split(/(\s+)/);
  const lines: string[] = [];
  let current = "";

  const flush = () => {
    lines.push(current);
    current = "";
  };

  const pushChunk = (chunk: string) => {
    if (!chunk) return;
    const trial = current + chunk;
    if (!current || measure(trial) <= width) {
      current = trial;
      return;
    }
    flush();
    if (measure(chunk) <= width) {
      current = chunk;
      return;
    }
    let piece = "";
    for (const ch of chunk) {
      const next = piece + ch;
      if (piece && measure(next) > width) {
        lines.push(piece);
        piece = ch;
      } else {
        piece = next;
      }
    }
    current = piece;
  };

  for (const token of tokens) {
    if (token === "") continue;
    if (/^\s+$/.test(token)) {
      if (!current) continue;
      const trial = current + token;
      if (measure(trial) <= width) current = trial;
      else flush();
      continue;
    }
    pushChunk(token);
  }
  if (current || lines.length === 0) flush();
  return lines.map((l) => l.replace(/\s+$/, ""));
}

export function layoutTextLines(
  node: Pick<TextNode, "text" | "uppercase" | "wrap" | "w" | "fontSize" | "lineHeight" | "h" | "valign">,
  measure: MeasureFn,
): { lines: string[]; lineHeight: number; startY: number } {
  const source = node.uppercase ? node.text.toUpperCase() : node.text;
  const paragraphs = source.split("\n");
  const lines = normalizeWrap(node)
    ? paragraphs.flatMap((p) => wrapParagraph(p, node.w, measure))
    : paragraphs;
  const lineHeight = node.fontSize * (node.lineHeight || 1);
  const block = lines.length * lineHeight;
  const valign = normalizeValign(node);
  let startY = 0;
  if (valign === "middle") startY = (node.h - block) / 2;
  if (valign === "bottom") startY = node.h - block;
  return { lines, lineHeight, startY };
}
