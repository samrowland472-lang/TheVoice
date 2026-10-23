import { cloneFill, fillChipLabel, solidOf, strokeChipLabel } from "@/lib/design/ink";
import { DEFAULT_SHADOW, shadowOffsetChipLabel, stampShadowOffset } from "@/lib/design/shadow";
import { useDesign } from "@/lib/design/store";
import type { BlendMode, DesignNode } from "@/lib/design/types";

export function MixedFillChips({ nodes, ink }: { nodes: DesignNode[]; ink: string }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  const ids = nodes.map((n) => n.id);
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {nodes.map((n) => {
        const hex = solidOf(n.fill, ink);
        const label = fillChipLabel(n.fill);
        return (
          <button
            key={n.id}
            type="button"
            className="flex h-6 items-center gap-1 rounded-full border border-phosphor/40 bg-surface-alt px-1.5 font-mono text-[8px] text-phosphor max-w-[120px] truncate"
            title={`Unify fill with ${n.name || n.kind}: ${label}`}
            aria-label={`Unify fill with ${n.name || n.kind}: ${label}`}
            onClick={() => updateNodes(ids, { fill: cloneFill(n.fill) }, true)}
          >
            <span
              className="size-3 shrink-0 rounded-full border border-phosphor/30"
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
    <div className="mt-1 flex flex-wrap gap-1">
      {nodes.map((n) => {
        const label = strokeChipLabel(n.stroke, n.strokeWidth);
        return (
          <button
            key={`stroke-${n.id}`}
            type="button"
            className="flex h-6 items-center gap-1 rounded-full border border-phosphor/40 bg-surface-alt px-1.5 font-mono text-[8px] text-phosphor max-w-[120px] truncate"
            title={`Unify stroke with ${n.name || n.kind}: ${label}`}
            aria-label={`Unify stroke with ${n.name || n.kind}: ${label}`}
            onClick={() => updateNodes(ids, { stroke: n.stroke, strokeWidth: n.strokeWidth }, true)}
          >
            <span
              className="size-3 shrink-0 rounded-full border border-phosphor/30"
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
    <div className="mt-1 flex flex-wrap gap-1">
      {nodes.map((n) => {
        const label = `${Math.round(n.opacity * 100)}%`;
        return (
          <button
            key={`op-${n.id}`}
            type="button"
            className="flex h-6 items-center rounded-full border border-phosphor/40 bg-surface-alt px-1.5 font-mono text-[8px] text-phosphor max-w-[120px] truncate"
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

const BLEND_ORDER: BlendMode[] = [
  "source-over",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "soft-light",
  "hard-light",
  "color-dodge",
  "color-burn",
];

const BLEND_LABEL: Record<BlendMode, string> = {
  "source-over": "Normal",
  multiply: "Multiply",
  screen: "Screen",
  overlay: "Overlay",
  darken: "Darken",
  lighten: "Lighten",
  "soft-light": "Soft light",
  "hard-light": "Hard light",
  "color-dodge": "Color dodge",
  "color-burn": "Color burn",
};

export function blendLegendEntries(nodes: DesignNode[]) {
  const map = new Map<BlendMode, number>();
  for (const n of nodes) {
    const id = (n.blend || "source-over") as BlendMode;
    map.set(id, (map.get(id) ?? 0) + 1);
  }
  return BLEND_ORDER.filter((id) => map.has(id)).map((id) => ({
    id,
    label: BLEND_LABEL[id],
    count: map.get(id) ?? 0,
  }));
}

export function MixedBlendChips({ nodes }: { nodes: DesignNode[] }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  const ids = nodes.map((n) => n.id);
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {nodes.map((n) => (
        <button
          key={`blend-${n.id}`}
          type="button"
          className="flex h-6 items-center rounded-full border border-phosphor/40 bg-surface-alt px-1.5 font-mono text-[8px] text-phosphor max-w-[120px] truncate"
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

/** Compact unique-mode legend. Click unifies the selection to that mode. */
export function MixedBlendLegend({ nodes }: { nodes: DesignNode[] }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  const ids = nodes.map((n) => n.id);
  const entries = blendLegendEntries(nodes);
  if (entries.length < 2) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1" aria-label="mixed blend legend">
      {entries.map(({ id, label, count }) => (
        <button
          key={id}
          type="button"
          className="flex h-6 items-center gap-1 rounded-full border border-phosphor/40 bg-surface-alt px-1.5 font-mono text-[8px] text-phosphor"
          title={`Unify blend to ${label} · ${count} layer${count === 1 ? "" : "s"}`}
          aria-label={`Set blend to ${label}`}
          onClick={() => updateNodes(ids, { blend: id }, true)}
        >
          <span>{label}</span>
          <span className="text-phosphor/70">{count}</span>
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
    <div className="mt-1 flex flex-wrap gap-1">
      {nodes.map((n) => {
        const label = visibilityChipLabel(n.visible);
        return (
          <button
            key={`vis-${n.id}`}
            type="button"
            className="flex h-6 items-center rounded-full border border-phosphor/40 bg-surface-alt px-1.5 font-mono text-[8px] text-phosphor max-w-[120px] truncate"
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

export function MixedShadowOffsetChips({
  nodes,
  axis,
}: {
  nodes: DesignNode[];
  axis: "ox" | "oy";
}) {
  const mapNodes = useDesign((s) => s.mapNodes);
  const ids = nodes.map((n) => n.id);
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {nodes.map((n) => {
        const label = shadowOffsetChipLabel(axis, n.shadow);
        return (
          <button
            key={`${axis}-${n.id}`}
            type="button"
            className="flex h-6 items-center rounded-full border border-phosphor/40 bg-surface-alt px-1.5 font-mono text-[8px] text-phosphor max-w-[120px] truncate"
            title={`Unify shadow ${axis} with ${n.name || n.kind}: ${label}`}
            aria-label={`Unify shadow ${axis} with ${n.name || n.kind}: ${label}`}
            onClick={() => {
              const value = n.shadow ? n.shadow[axis] : DEFAULT_SHADOW[axis];
              mapNodes(
                ids,
                (layer: DesignNode) => ({
                  ...layer,
                  shadow: stampShadowOffset(layer.shadow, axis, value),
                }),
                true,
              );
            }}
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
    <div className="mt-1 flex flex-wrap gap-1">
      {nodes.map((n) => {
        const label = lockChipLabel(n.locked);
        return (
          <button
            key={`lock-${n.id}`}
            type="button"
            className="flex h-6 items-center rounded-full border border-phosphor/40 bg-surface-alt px-1.5 font-mono text-[8px] text-phosphor max-w-[120px] truncate"
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
