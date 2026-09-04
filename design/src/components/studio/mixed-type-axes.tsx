import { anyFaceHasAxis, clampAxis, faceAxis, type FontAxis, type FontAxisTag } from "@/lib/design/fonts";
import { useDesign } from "@/lib/design/store";
import type { TextNode } from "@/lib/design/types";
import { NumField } from "./num-field";

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function formatNum(n: number) {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

export function nodeAxisValue(n: TextNode, tag: FontAxisTag): number | undefined {
  if (tag === "opsz") return n.opticalSize;
  if (tag === "wdth") return n.fontWidth;
  if (tag === "slnt") return n.fontSlant;
  if (tag === "ital") return n.fontItalic;
  if (tag === "GRAD") return n.fontGrade;
  if (tag === "SOFT") return n.fontSoft;
  return n.fontWonk;
}

function axisValues(nodes: TextNode[], tag: FontAxisTag): number[] {
  const out: number[] = [];
  for (const n of nodes) {
    const axis = faceAxis(n.fontFamily, tag);
    if (!axis) continue;
    out.push(tag === "opsz" ? clampAxis(axis, n.opticalSize, n.fontSize) : clampAxis(axis, nodeAxisValue(n, tag)));
  }
  return out;
}

function unionAxis(nodes: TextNode[], tag: FontAxisTag): FontAxis | null {
  const axes = nodes.map((n) => faceAxis(n.fontFamily, tag)).filter((a): a is FontAxis => Boolean(a));
  if (!axes.length) return null;
  return {
    tag,
    min: Math.min(...axes.map((a) => a.min)),
    max: Math.max(...axes.map((a) => a.max)),
    fallback: axes[axes.length - 1]!.fallback,
  };
}

export function axisField(tag: FontAxisTag): keyof TextNode {
  if (tag === "opsz") return "opticalSize";
  if (tag === "wdth") return "fontWidth";
  if (tag === "slnt") return "fontSlant";
  if (tag === "ital") return "fontItalic";
  if (tag === "GRAD") return "fontGrade";
  if (tag === "SOFT") return "fontSoft";
  return "fontWonk";
}

export function patchFor(tag: FontAxisTag, value: number | undefined): Partial<TextNode> {
  return { [axisField(tag)]: value } as Partial<TextNode>;
}

export const AXIS_TAGS: FontAxisTag[] = ["opsz", "wdth", "slnt", "ital", "GRAD", "SOFT", "WONK"];

const AXIS_UI: Record<
  FontAxisTag,
  { label: string; aria: string; step: number; auto?: string }
> = {
  opsz: { label: "Optical", aria: "type optical size", step: 1, auto: "Auto from size" },
  wdth: { label: "Width", aria: "type width", step: 1 },
  slnt: { label: "Slant", aria: "type slant", step: 0.1, auto: "Upright" },
  ital: { label: "Italic", aria: "type italic", step: 0.01, auto: "Roman" },
  GRAD: { label: "Grade", aria: "type grade", step: 1, auto: "Default grade" },
  SOFT: { label: "Softness", aria: "type softness", step: 1, auto: "Sharp" },
  WONK: { label: "Wonk", aria: "type wonk", step: 0.01, auto: "Unwonk" },
};

export function MixedAxisSliders({
  nodes,
  patch,
}: {
  nodes: TextNode[];
  patch: (partial: Partial<TextNode>, commit?: boolean) => void;
}) {
  const families = nodes.map((n) => n.fontFamily);
  const keyNode = nodes[nodes.length - 1]!;
  const tags: FontAxisTag[] = AXIS_TAGS;
  const present = tags.filter((tag) => anyFaceHasAxis(families, tag) && unionAxis(nodes, tag));
  if (!present.length) return null;

  return (
    <>
      {present.map((tag) => {
        const axis = unionAxis(nodes, tag)!;
        const ui = AXIS_UI[tag];
        const vals = axisValues(nodes, tag);
        const mixed = unique(vals.map((n) => Math.round(n * 100) / 100)).length > 1;
        const keyAxis = faceAxis(keyNode.fontFamily, tag);
        const value = keyAxis
          ? tag === "opsz"
            ? clampAxis(keyAxis, keyNode.opticalSize, keyNode.fontSize)
            : clampAxis(keyAxis, nodeAxisValue(keyNode, tag))
          : vals[vals.length - 1] ?? axis.fallback;
        const allAuto = nodes.filter((n) => faceAxis(n.fontFamily, tag)).every((n) => nodeAxisValue(n, tag) == null);
        const autoSuffix = tag === "opsz" && allAuto ? " \u00b7 auto" : allAuto && tag !== "wdth" ? " \u00b7 auto" : "";
        return (
          <label key={tag} className="mt-2 block text-[11px] text-ink-dim">
            <span className="mb-1 block">
              {mixed ? `${ui.label} \u00b7 mixed` : `${ui.label} ${formatNum(value)}${autoSuffix}`}
            </span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                className="range-phosphor min-w-0 flex-1"
                min={axis.min}
                max={axis.max}
                step={ui.step}
                aria-label={mixed ? `${ui.aria} mixed` : ui.aria}
                value={value}
                onChange={(e) => patch(patchFor(tag, Number(e.target.value)), false)}
                onPointerUp={() => useDesign.getState().commit()}
              />
              <NumField
                className="field w-16 font-mono"
                value={value}
                mixed={mixed}
                min={axis.min}
                max={axis.max}
                aria-label={ui.aria}
                onCommit={(n) => patch(patchFor(tag, n))}
              />
            </div>
            {ui.auto && (
              <button
                type="button"
                className="mt-1 h-7 rounded-[8px] border border-border px-2 text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
                onClick={() => patch(patchFor(tag, undefined))}
              >
                {ui.auto}
              </button>
            )}
          </label>
        );
      })}
    </>
  );
}
