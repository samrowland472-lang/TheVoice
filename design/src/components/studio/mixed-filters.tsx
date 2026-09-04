import { cloneFilters, DEFAULT_FILTERS, filterChipLabel, filterKey, normalizeFilters } from "@/lib/design/image-filters";
import { useDesign } from "@/lib/design/store";
import type { DesignNode, ImageNode } from "@/lib/design/types";
import { isImage } from "@/lib/design/types";
import { cn } from "@/lib/utils";
import { Field } from "./inspector-parts";

const SLIDERS = [
  { key: "brightness" as const, label: "Brightness", min: 0, max: 2, step: 0.01 },
  { key: "contrast" as const, label: "Contrast", min: 0, max: 2, step: 0.01 },
  { key: "saturate" as const, label: "Saturate", min: 0, max: 2, step: 0.01 },
  { key: "blur" as const, label: "Blur", min: 0, max: 24, step: 0.25 },
];

function patchImageFilters(
  ids: string[],
  patch: Partial<ImageNode["filters"]>,
  commit = false,
) {
  const state = useDesign.getState();
  const doc = state.doc;
  if (!doc) return;
  if (commit) state.commit();
  const idset = new Set(ids);
  useDesign.setState({
    doc: {
      ...doc,
      nodes: doc.nodes.map((n: DesignNode) => {
        if (!idset.has(n.id) || n.kind !== "image") return n;
        return { ...n, filters: { ...normalizeFilters(n.filters), ...patch } };
      }),
    },
    dirty: true,
  });
}

export function MixedFilters({ nodes }: { nodes: DesignNode[] }) {
  const photos = nodes.filter(isImage);
  if (photos.length < 2) return null;

  const ids = photos.map((n) => n.id);
  const first = normalizeFilters(photos[0].filters);
  const mixedAll = new Set(photos.map((n) => filterKey(n.filters))).size > 1;

  return (
    <section className="border-b border-border py-3">
      <div className="mb-2 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">
        Photos · {photos.length}
      </div>
      <p className="mb-2 text-[10px] text-ink-dim">
        Mixed filters write brightness, contrast, saturate, and blur onto every selected photo. A
        chip stamps that layer’s full stack.
      </p>
      {SLIDERS.map((f) => {
        const mixed = new Set(photos.map((n) => normalizeFilters(n.filters)[f.key])).size > 1;
        const value = first[f.key];
        const shown = f.key === "blur" ? value : Math.round(value * 100);
        return (
          <Field
            key={f.key}
            label={mixed ? `${f.label} · mixed` : `${f.label} ${shown}`}
          >
            <input
              type="range"
              className={cn("range-phosphor w-full", mixed && "opacity-70")}
              min={f.min}
              max={f.max}
              step={f.step}
              aria-label={mixed ? `selection ${f.label.toLowerCase()} mixed` : `selection ${f.label.toLowerCase()}`}
              value={value}
              onChange={(e) => patchImageFilters(ids, { [f.key]: Number(e.target.value) })}
              onPointerUp={() => useDesign.getState().commit()}
            />
          </Field>
        );
      })}
      {mixedAll && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {photos.map((n: ImageNode) => (
            <button
              key={n.id}
              type="button"
              className="flex h-7 items-center rounded-full border border-phosphor/50 bg-surface-alt px-2 font-mono text-[9px] text-phosphor"
              title={`Unify full filters with ${n.name || "photo"}: ${filterChipLabel(n.filters)}`}
              aria-label={`Unify full filters with ${n.name || "photo"}: ${filterChipLabel(n.filters)}`}
              onClick={() => patchImageFilters(ids, cloneFilters(n.filters), true)}
            >
              {filterChipLabel(n.filters)}
            </button>
          ))}
        </div>
      )}
      <div className="mt-2 grid grid-cols-2 gap-1">
        <button
          type="button"
          className="h-8 rounded-[8px] border border-phosphor/40 text-[10px] text-phosphor hover:bg-phosphor/10"
          onClick={() => patchImageFilters(ids, cloneFilters(photos[photos.length - 1].filters), true)}
        >
          Match key
        </button>
        <button
          type="button"
          className="h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
          onClick={() => patchImageFilters(ids, { ...DEFAULT_FILTERS }, true)}
        >
          Reset all
        </button>
      </div>
    </section>
  );
}
