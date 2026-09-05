import { cloneFill, fillChipLabel, solidOf, strokeChipLabel } from "@/lib/design/ink";
import { useDesign } from "@/lib/design/store";
import type { BlendMode, DesignNode } from "@/lib/design/types";

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

export function MixedOpacityChips({ nodes }: { nodes: DesignNode[] }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  const ids = nodes.map((n) => n.id);
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {nodes.map((n) => {
        const label = `${Math.round(n.opacity * 100)}%`;
        return (
          <button
            key={`op-${n.id}`}
            type="button"
            className="flex h-7 items-center rounded-full border border-phosphor/50 bg-surface-alt px-2 font-mono text-[9px] text-phosphor"
            title={`Unify opacity with ${n.name || n.kind}: ${label}`}
            aria-label={`Unify opacity with ${n.name || n.kind}: ${label}`}
            onClick={() => updateNodes(ids, { opacity: n.opacity }, true)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function MixedBlendChips({ nodes }: { nodes: DesignNode[] }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  const ids = nodes.map((n) => n.id);
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {nodes.map((n) => (
        <button
          key={`blend-${n.id}`}
          type="button"
          className="flex h-7 items-center rounded-full border border-phosphor/50 bg-surface-alt px-2 font-mono text-[9px] text-phosphor"
          title={`Unify blend with ${n.name || n.kind}: ${n.blend}`}
          aria-label={`Unify blend with ${n.name || n.kind}: ${n.blend}`}
          onClick={() => updateNodes(ids, { blend: n.blend as BlendMode }, true)}
        >
          {n.blend}
        </button>
      ))}
    </div>
  );
}

export function visibilityChipLabel(visible: boolean): string {
  return visible ? "shown" : "hidden";
}

export function lockChipLabel(locked: boolean): string {
  return locked ? "locked" : "open";
}

export function MixedVisibilityChips({ nodes }: { nodes: DesignNode[] }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  const ids = nodes.map((n) => n.id);
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {nodes.map((n) => {
        const label = visibilityChipLabel(n.visible);
        return (
          <button
            key={`vis-${n.id}`}
            type="button"
            className="flex h-7 items-center rounded-full border border-phosphor/50 bg-surface-alt px-2 font-mono text-[9px] text-phosphor"
            title={`Unify visibility with ${n.name || n.kind}: ${label}`}
            aria-label={`Unify visibility with ${n.name || n.kind}: ${label}`}
            onClick={() => updateNodes(ids, { visible: n.visible }, true)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function MixedLockChips({ nodes }: { nodes: DesignNode[] }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  const ids = nodes.map((n) => n.id);
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {nodes.map((n) => {
        const label = lockChipLabel(n.locked);
        return (
          <button
            key={`lock-${n.id}`}
            type="button"
            className="flex h-7 items-center rounded-full border border-phosphor/50 bg-surface-alt px-2 font-mono text-[9px] text-phosphor"
            title={`Unify lock with ${n.name || n.kind}: ${label}`}
            aria-label={`Unify lock with ${n.name || n.kind}: ${label}`}
            onClick={() => updateNodes(ids, { locked: n.locked }, true)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
