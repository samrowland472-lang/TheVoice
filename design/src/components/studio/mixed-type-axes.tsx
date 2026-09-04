import { anyFaceHasAxis, clampAxis, faceAxis, type FontAxis } from "@/lib/design/fonts";
import { useDesign } from "@/lib/design/store";
import type { TextNode } from "@/lib/design/types";
import { NumField } from "./num-field";

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function formatNum(n: number) {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

function axisValues(nodes: TextNode[], tag: "opsz" | "wdth"): number[] {
  const out: number[] = [];
  for (const n of nodes) {
    const axis = faceAxis(n.fontFamily, tag);
    if (!axis) continue;
    out.push(tag === "opsz" ? clampAxis(axis, n.opticalSize, n.fontSize) : clampAxis(axis, n.fontWidth));
  }
  return out;
}

function unionAxis(nodes: TextNode[], tag: "opsz" | "wdth"): FontAxis | null {
  const axes = nodes.map((n) => faceAxis(n.fontFamily, tag)).filter((a): a is FontAxis => Boolean(a));
  if (!axes.length) return null;
  return {
    tag,
    min: Math.min(...axes.map((a) => a.min)),
    max: Math.max(...axes.map((a) => a.max)),
    fallback: axes[axes.length - 1]!.fallback,
  };
}

export function MixedAxisSliders({
  nodes,
  patch,
}: {
  nodes: TextNode[];
  patch: (partial: Partial<TextNode>, commit?: boolean) => void;
}) {
  const families = nodes.map((n) => n.fontFamily);
  const keyNode = nodes[nodes.length - 1]!;
  const opszAxis = unionAxis(nodes, "opsz");
  const wdthAxis = unionAxis(nodes, "wdth");
  if (!opszAxis && !wdthAxis) return null;

  const opszVals = axisValues(nodes, "opsz");
  const wdthVals = axisValues(nodes, "wdth");
  const mixedOpsz = unique(opszVals.map((n) => Math.round(n * 10) / 10)).length > 1;
  const mixedWdth = unique(wdthVals.map((n) => Math.round(n * 10) / 10)).length > 1;
  const keyOpsz = faceAxis(keyNode.fontFamily, "opsz");
  const keyWdth = faceAxis(keyNode.fontFamily, "wdth");
  const opszValue = keyOpsz
    ? clampAxis(keyOpsz, keyNode.opticalSize, keyNode.fontSize)
    : opszVals[opszVals.length - 1] ?? opszAxis?.fallback ?? 144;
  const wdthValue = keyWdth
    ? clampAxis(keyWdth, keyNode.fontWidth)
    : wdthVals[wdthVals.length - 1] ?? wdthAxis?.fallback ?? 100;
  const opszAuto = nodes.filter((n) => faceAxis(n.fontFamily, "opsz")).every((n) => n.opticalSize == null);

  return (
    <>
      {anyFaceHasAxis(families, "opsz") && opszAxis && (
        <label className="mt-2 block text-[11px] text-ink-dim">
          <span className="mb-1 block">
            {mixedOpsz ? "Optical · mixed" : `Optical ${formatNum(opszValue)}${opszAuto ? " · auto" : ""}`}
          </span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              className="range-phosphor min-w-0 flex-1"
              min={opszAxis.min}
              max={opszAxis.max}
              step={1}
              aria-label={mixedOpsz ? "type optical size mixed" : "type optical size"}
              value={opszValue}
              onChange={(e) => patch({ opticalSize: Number(e.target.value) }, false)}
              onPointerUp={() => useDesign.getState().commit()}
            />
            <NumField
              className="field w-16 font-mono"
              value={opszValue}
              mixed={mixedOpsz}
              min={opszAxis.min}
              max={opszAxis.max}
              aria-label="type optical size"
              onCommit={(n) => patch({ opticalSize: n })}
            />
          </div>
          <button
            type="button"
            className="mt-1 h-7 rounded-[8px] border border-border px-2 text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
            onClick={() => patch({ opticalSize: undefined })}
          >
            Auto from size
          </button>
        </label>
      )}
      {anyFaceHasAxis(families, "wdth") && wdthAxis && (
        <label className="mt-2 block text-[11px] text-ink-dim">
          <span className="mb-1 block">{mixedWdth ? "Width · mixed" : `Width ${formatNum(wdthValue)}`}</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              className="range-phosphor min-w-0 flex-1"
              min={wdthAxis.min}
              max={wdthAxis.max}
              step={1}
              aria-label={mixedWdth ? "type width mixed" : "type width"}
              value={wdthValue}
              onChange={(e) => patch({ fontWidth: Number(e.target.value) }, false)}
              onPointerUp={() => useDesign.getState().commit()}
            />
            <NumField
              className="field w-16 font-mono"
              value={wdthValue}
              mixed={mixedWdth}
              min={wdthAxis.min}
              max={wdthAxis.max}
              aria-label="type width"
              onCommit={(n) => patch({ fontWidth: n })}
            />
          </div>
        </label>
      )}
    </>
  );
}
