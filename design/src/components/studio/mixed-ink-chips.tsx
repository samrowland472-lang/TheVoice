import { cloneFill, fillChipLabel, solidOf, strokeChipLabel } from "@/lib/design/ink";
import { useDesign } from "@/lib/design/store";
import type { DesignNode } from "@/lib/design/types";

export function MixedFillChips({ nodes, ink }: { nodes: DesignNode[]; ink: string }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  const ids = nodes.map((n) => n.id);
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {nodes.map((n) => {
        const hex = solidOf(n.fill, ink);
        const label = fillChipLabel(n.fill);
        return (
          <button
            key={n.id}
            type="button"
            className="flex h-7 items-center gap-1.5 rounded-full border border-phosphor/50 bg-surface-alt px-2 font-mono text-[9px] text-phosphor"
            title={`Unify fill with ${n.name || n.kind}: ${label}`}
            aria-label={`Unify fill with ${n.name || n.kind}: ${label}`}
            onClick={() => updateNodes(ids, { fill: cloneFill(n.fill) }, true)}
          >
            <span
              className="size-3.5 shrink-0 rounded-full border border-phosphor/40"
              style={{ background: n.fill === "transparent" ? "transparent" : hex }}
            />
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function MixedStrokeChips({ nodes }: { nodes: DesignNode[] }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  const ids = nodes.map((n) => n.id);
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {nodes.map((n) => {
        const label = strokeChipLabel(n.stroke, n.strokeWidth);
        return (
          <button
            key={`stroke-${n.id}`}
            type="button"
            className="flex h-7 items-center gap-1.5 rounded-full border border-phosphor/50 bg-surface-alt px-2 font-mono text-[9px] text-phosphor"
            title={`Unify stroke with ${n.name || n.kind}: ${label}`}
            aria-label={`Unify stroke with ${n.name || n.kind}: ${label}`}
            onClick={() => updateNodes(ids, { stroke: n.stroke, strokeWidth: n.strokeWidth }, true)}
          >
            <span
              className="size-3.5 shrink-0 rounded-full border border-phosphor/40"
              style={{
                background: n.stroke === "transparent" ? "transparent" : n.stroke,
              }}
            />
            {label}
          </button>
        );
      })}
    </div>
  );
}
