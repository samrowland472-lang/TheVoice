import { useDesign } from "@/lib/design/store";
import type { PathNode } from "@/lib/design/types";
import { cn } from "@/lib/utils";
import { Field } from "./inspector-parts";
import { NumField } from "./num-field";

function dashKey(n: PathNode) {
  return Math.round((n.strokeDash ?? 0) * 100) / 100;
}

export function MixedPathDash({ nodes }: { nodes: PathNode[] }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  if (nodes.length < 1) return null;
  const ids = nodes.map((n) => n.id);
  const mixed = new Set(nodes.map(dashKey)).size > 1;
  const first = nodes[nodes.length - 1]!;
  const value = first.strokeDash ?? 0;

  return (
    <section className="border-b border-border py-3">
      <div className="mb-2 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">
        Path stroke · {nodes.length}
      </div>
      <p className="mb-2 text-[10px] text-ink-dim">
        Dash writes onto path layers only. Zero is a solid stroke.
      </p>
      <Field label={mixed ? "Dash · mixed" : `Dash ${Math.round(value)}`}>
        <div className="flex items-center gap-2">
          <input
            type="range"
            className={cn("range-phosphor min-w-0 flex-1", mixed && "opacity-70")}
            min={0}
            max={48}
            step={1}
            aria-label={mixed ? "path stroke dash mixed" : "path stroke dash"}
            value={mixed ? 0 : value}
            onChange={(e) => updateNodes(ids, { strokeDash: Number(e.target.value) })}
            onPointerUp={() => useDesign.getState().commit()}
          />
          <NumField
            className="field w-16 font-mono"
            value={value}
            mixed={mixed}
            min={0}
            max={96}
            aria-label="path stroke dash"
            onCommit={(n) => updateNodes(ids, { strokeDash: n }, true)}
          />
        </div>
      </Field>
    </section>
  );
}
