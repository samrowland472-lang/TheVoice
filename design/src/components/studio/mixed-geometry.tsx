import { radiusChipLabel, radiusKey, rotationChipLabel, rotationKey } from "@/lib/design/geometry-chips";
import { useDesign } from "@/lib/design/store";
import type { DesignNode } from "@/lib/design/types";
import { cn } from "@/lib/utils";
import { Field } from "./inspector-parts";
import { NumField } from "./num-field";

export function MixedGeometry({ nodes }: { nodes: DesignNode[] }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  if (nodes.length < 2) return null;

  const ids = nodes.map((n) => n.id);
  const mixedRotation = new Set(nodes.map((n) => rotationKey(n.rotation))).size > 1;
  const mixedRadius = new Set(nodes.map((n) => radiusKey(n.radius))).size > 1;
  const first = nodes[0];
  const maxRadius = Math.max(
    0,
    ...nodes.map((n) => Math.min(n.w, n.h) / 2),
  );

  return (
    <section className="border-b border-border py-3">
      <div className="mb-2 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">
        Geometry · {nodes.length}
      </div>
      <p className="mb-2 text-[10px] text-ink-dim">
        Mixed rotation and radius write onto every selected layer. A chip stamps that
        layer’s angle or corner.
      </p>
      <Field label={mixedRotation ? "Rotate · mixed" : `Rotate ${Math.round(first.rotation)}°`}>
        <div className="flex items-center gap-2">
          <input
            type="range"
            className={cn("range-phosphor min-w-0 flex-1", mixedRotation && "opacity-70")}
            min={-180}
            max={180}
            aria-label={mixedRotation ? "selection rotate mixed" : "selection rotate"}
            value={first.rotation}
            onChange={(e) => updateNodes(ids, { rotation: Number(e.target.value) })}
            onPointerUp={() => useDesign.getState().commit()}
          />
          <NumField
            className="field w-16 font-mono"
            value={first.rotation}
            min={-180}
            max={180}
            aria-label="selection rotate"
            onCommit={(n) => updateNodes(ids, { rotation: n }, true)}
          />
        </div>
      </Field>
      {mixedRotation && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {nodes.map((n) => {
            const label = rotationChipLabel(n.rotation);
            return (
              <button
                key={`rot-${n.id}`}
                type="button"
                className="flex h-7 items-center rounded-full border border-phosphor/50 bg-surface-alt px-2 font-mono text-[9px] text-phosphor"
                title={`Unify rotation with ${n.name || n.kind}: ${label}`}
                aria-label={`Unify rotation with ${n.name || n.kind}: ${label}`}
                onClick={() => updateNodes(ids, { rotation: n.rotation }, true)}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
      <Field label={mixedRadius ? "Radius · mixed" : `Radius ${Math.round(first.radius)}`}>
        <div className="flex items-center gap-2">
          <input
            type="range"
            className={cn("range-phosphor min-w-0 flex-1", mixedRadius && "opacity-70")}
            min={0}
            max={Math.max(1, maxRadius)}
            aria-label={mixedRadius ? "selection radius mixed" : "selection radius"}
            value={first.radius}
            onChange={(e) => updateNodes(ids, { radius: Number(e.target.value) })}
            onPointerUp={() => useDesign.getState().commit()}
          />
          <NumField
            className="field w-16 font-mono"
            value={first.radius}
            min={0}
            max={Math.max(1, maxRadius)}
            aria-label="selection radius"
            onCommit={(n) => updateNodes(ids, { radius: n }, true)}
          />
        </div>
      </Field>
      {mixedRadius && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {nodes.map((n) => {
            const label = radiusChipLabel(n.radius);
            return (
              <button
                key={`rad-${n.id}`}
                type="button"
                className="flex h-7 items-center rounded-full border border-phosphor/50 bg-surface-alt px-2 font-mono text-[9px] text-phosphor"
                title={`Unify radius with ${n.name || n.kind}: ${label}`}
                aria-label={`Unify radius with ${n.name || n.kind}: ${label}`}
                onClick={() => updateNodes(ids, { radius: n.radius }, true)}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
