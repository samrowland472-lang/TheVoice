import {
  cssFilterStyle,
  DEFAULT_FILTERS,
  normalizeCrop,
  normalizeFilters,
} from "@/lib/design/image-filters";
import { useDesign } from "@/lib/design/store";
import type { DesignNode, ImageNode } from "@/lib/design/types";
import { Field } from "./inspector-parts";

const FILTERS = [
  { key: "brightness" as const, label: "Brightness", min: 0, max: 2, step: 0.01 },
  { key: "contrast" as const, label: "Contrast", min: 0, max: 2, step: 0.01 },
  { key: "saturate" as const, label: "Saturate", min: 0, max: 2, step: 0.01 },
  { key: "blur" as const, label: "Blur", min: 0, max: 24, step: 0.25 },
];

function patchImage(id: string, patch: Partial<ImageNode>, commit = false) {
  const state = useDesign.getState();
  const doc = state.doc;
  if (!doc) return;
  if (commit) state.commit();
  useDesign.setState({
    doc: {
      ...doc,
      nodes: doc.nodes.map((n: DesignNode) => (n.id === id && n.kind === "image" ? { ...n, ...patch } : n)),
    },
    dirty: true,
  });
}

export function ImageAdjust({ node }: { node: DesignNode }) {
  if (node.kind !== "image") return null;
  const img = node as ImageNode;
  const filters = normalizeFilters(img.filters);
  const crop = normalizeCrop(img.crop) ?? { x: 0, y: 0, w: 1, h: 1 };
  const css = cssFilterStyle(filters);

  return (
    <section className="space-y-2 border-b border-border px-3 py-3">
      <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">Photo</div>
      {FILTERS.map((f) => {
        const value = filters[f.key];
        const shown = f.key === "blur" ? value : Math.round(value * 100);
        return (
          <Field key={f.key} label={`${f.label} ${shown}`}>
            <input
              type="range"
              className="range-phosphor w-full"
              min={f.min}
              max={f.max}
              step={f.step}
              aria-label={f.label}
              value={value}
              onChange={(e) =>
                patchImage(img.id, { filters: { ...filters, [f.key]: Number(e.target.value) } })
              }
              onPointerUp={() => useDesign.getState().commit()}
            />
          </Field>
        );
      })}
      <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">Crop</div>
      <p className="font-mono text-[9px] text-ink-faint">Drag the photo corners on the board to crop the frame.</p>
      {(
        [
          ["x", crop.x],
          ["y", crop.y],
          ["w", crop.w],
          ["h", crop.h],
        ] as const
      ).map(([key, value]) => (
        <Field key={key} label={`Crop ${key} ${Math.round(value * 100)}`}>
          <input
            type="range"
            className="range-phosphor w-full"
            min={0.01}
            max={1}
            step={0.01}
            aria-label={`Crop ${key}`}
            value={value}
            onChange={(e) =>
              patchImage(img.id, { crop: normalizeCrop({ ...crop, [key]: Number(e.target.value) }) })
            }
            onPointerUp={() => useDesign.getState().commit()}
          />
        </Field>
      ))}
      <div className="grid grid-cols-2 gap-1">
        <button
          type="button"
          className="h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
          onClick={() => patchImage(img.id, { filters: { ...DEFAULT_FILTERS }, crop: null }, true)}
        >
          Reset photo
        </button>
        <button
          type="button"
          className="h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
          onClick={() => patchImage(img.id, { crop: null }, true)}
        >
          Full frame
        </button>
      </div>
      {css ? <p className="font-mono text-[9px] text-ink-faint">{css}</p> : null}
    </section>
  );
}
