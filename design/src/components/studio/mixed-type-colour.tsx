import { cloneFill, fillChipLabel, fillKey, solidOf } from "@/lib/design/ink";
import { useDesign } from "@/lib/design/store";
import type { DesignNode, TextNode } from "@/lib/design/types";
import { cn } from "@/lib/utils";
import { Field, Swatches } from "./inspector-parts";

export function MixedTypeColour({
  nodes,
  brandColors,
  ink,
}: {
  nodes: TextNode[];
  brandColors: { name: string; hex: string }[];
  ink: string;
}) {
  const updateNodes = useDesign((s) => s.updateNodes);
  if (nodes.length < 1) return null;
  const ids = nodes.map((n) => n.id);
  const key = nodes[nodes.length - 1]!;
  const hex = solidOf(key.fill, ink);
  const mixed = new Set(nodes.map((n) => fillKey(n.fill))).size > 1;
  function writeFill(fill: DesignNode["fill"]) {
    updateNodes(ids, { fill: cloneFill(fill) } as Partial<DesignNode>, true);
  }
  return (
    <section className="border-b border-border py-3">
      <div className="mb-2 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">
        Type colour · {nodes.length}
      </div>
      <p className="mb-2 text-[10px] text-ink-dim">
        Writes onto type only — shapes in the same selection keep their own fill.
      </p>
      <Field label={mixed ? "Type colour · mixed" : "Type colour"}>
        <div className="flex gap-2">
          <input
            type="color"
            className={cn("h-8 w-12 shrink-0 rounded-[8px] border border-border", mixed && "opacity-60")}
            value={hex === "transparent" ? "#3fc6ff" : hex}
            aria-label={mixed ? "type colour mixed" : "type colour"}
            onChange={(e) => writeFill(e.target.value)}
          />
          <input
            className="field font-mono flex-1"
            value={mixed ? "" : hex}
            placeholder={mixed ? "\u2014" : undefined}
            aria-label={mixed ? "type colour hex mixed" : "type colour hex"}
            onChange={(e) => {
              const raw = e.target.value.trim();
              if (/^#([0-9a-fA-F]{6})$/.test(raw)) writeFill(raw);
            }}
            onBlur={(e) => {
              const raw = e.target.value.trim();
              if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(raw)) {
                const next =
                  raw.length === 4
                    ? `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`
                    : raw;
                writeFill(next);
              }
            }}
          />
        </div>
        <Swatches colors={brandColors} onPick={(picked) => writeFill(picked)} />
        <button
          type="button"
          className="mt-1 text-[10px] text-phosphor"
          onClick={() => writeFill(key.fill)}
        >
          Apply key type colour to all type
        </button>
        {mixed && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {nodes.map((n) => (
              <button
                key={`type-fill-${n.id}`}
                type="button"
                className="flex h-7 items-center rounded-full border border-phosphor/50 bg-surface-alt px-2 font-mono text-[9px] text-phosphor"
                title={`Unify type colour with ${n.name || "text"}: ${fillChipLabel(n.fill)}`}
                aria-label={`Unify type colour with ${n.name || "text"}: ${fillChipLabel(n.fill)}`}
                onClick={() => writeFill(n.fill)}
              >
                {fillChipLabel(n.fill)}
              </button>
            ))}
          </div>
        )}
      </Field>
    </section>
  );
}
