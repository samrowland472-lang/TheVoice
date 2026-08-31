import { NumField } from "./num-field";
import { useDesign } from "@/lib/design/store";
import type { DesignNode, TextNode } from "@/lib/design/types";

const WEIGHTS = [400, 500, 600, 700, 800];

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export function MixedType({ nodes }: { nodes: TextNode[] }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  const ids = nodes.map((n) => n.id);
  const sizes = unique(nodes.map((n) => Math.round(n.fontSize)));
  const weights = unique(nodes.map((n) => n.fontWeight));
  const mixedSize = sizes.length > 1;
  const mixedWeight = weights.length > 1;
  const first = nodes[0]!;

  return (
    <section className="border-b border-border py-3">
      <div className="mb-2 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">
        Type · {nodes.length} layers
      </div>
      <p className="mb-2 text-[10px] text-ink-dim">
        Size and weight write onto every selected text layer. Mixed values show an em dash until you set one.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-[11px] text-ink-dim">
          <span className="mb-1 block">{mixedSize ? "Size · mixed" : "Size"}</span>
          <NumField
            value={first.fontSize}
            mixed={mixedSize}
            min={6}
            max={400}
            aria-label="type size"
            onCommit={(n) => updateNodes(ids, { fontSize: n } as Partial<DesignNode>, true)}
          />
        </label>
        <label className="block text-[11px] text-ink-dim">
          <span className="mb-1 block">{mixedWeight ? "Weight · mixed" : "Weight"}</span>
          <select
            className="field"
            aria-label={mixedWeight ? "type weight mixed" : "type weight"}
            value={mixedWeight ? "" : String(first.fontWeight)}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (!Number.isFinite(n)) return;
              updateNodes(ids, { fontWeight: n } as Partial<DesignNode>, true);
            }}
          >
            {mixedWeight && (
              <option value="" disabled>
                Mixed
              </option>
            )}
            {WEIGHTS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
