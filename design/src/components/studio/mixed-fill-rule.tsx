import { fillRuleChipLabel } from "@/lib/design/geometry-chips";
import { pathFillRule } from "@/lib/design/fill-rule";
import { useDesign } from "@/lib/design/store";
import type { DesignNode, PathNode } from "@/lib/design/types";
import { isPath } from "@/lib/design/types";
import { Field } from "./inspector-parts";

function ghostFillRule(rule: "evenodd" | "nonzero" | null) {
  useDesign.getState().setStrokeGhost(rule == null ? null : { fillRule: rule });
}

function holedPaths(nodes: DesignNode[]): PathNode[] {
  return nodes.filter((n): n is PathNode => isPath(n) && (n.holes?.length ?? 0) > 0);
}


const FILL_RULE_ORDER: ("evenodd" | "nonzero")[] = ["evenodd", "nonzero"];

export function fillRuleLegendEntries(paths: PathNode[]) {
  const map = new Map<"evenodd" | "nonzero", number>();
  for (const n of paths) {
    const id = pathFillRule(n);
    map.set(id, (map.get(id) ?? 0) + 1);
  }
  return FILL_RULE_ORDER.filter((id) => map.has(id)).map((id) => ({
    id,
    label: fillRuleChipLabel(id),
    count: map.get(id) ?? 0,
  }));
}

/** Compact unique-rule legend. Click unifies the selection to that rule. */
export function MixedFillRuleLegend({ paths }: { paths: PathNode[] }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  const ids = paths.map((n) => n.id);
  const entries = fillRuleLegendEntries(paths);
  if (entries.length < 2) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1" aria-label="mixed fill rule legend">
      {entries.map(({ id, label, count }) => (
        <button
          key={id}
          type="button"
          className="flex h-6 items-center gap-1 rounded-full border border-phosphor/40 bg-surface-alt px-1.5 font-mono text-[8px] text-phosphor"
          title={`Unify fill rule to ${label} · ${count} layer${count === 1 ? "" : "s"}`}
          aria-label={`Set fill rule to ${label}`}
          onMouseEnter={() => ghostFillRule(id)}
          onFocus={() => ghostFillRule(id)}
          onMouseLeave={() => ghostFillRule(null)}
          onBlur={() => ghostFillRule(null)}
          onClick={() => updateNodes(ids, { fillRule: id }, true)}
        >
          <span>{label}</span>
          <span className="text-phosphor/70">{count}</span>
        </button>
      ))}
    </div>
  );
}

export function MixedFillRule({ nodes }: { nodes: DesignNode[] }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  const paths = holedPaths(nodes);
  if (paths.length < 2) return null;
  const ids = paths.map((n) => n.id);
  const mixed = new Set(paths.map((n) => pathFillRule(n))).size > 1;
  const first = paths[paths.length - 1]!;
  const value = pathFillRule(first);

  return (
    <section className="border-b border-border py-3">
      <div className="mb-2 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">
        Fill rule · {paths.length}
      </div>
      <p className="mb-2 text-[10px] text-ink-dim">
        Even-odd punches holes. Nonzero keeps overlapping rings as islands. Hover a chip to
        ghost the rule on the artboard.
      </p>
      <Field label={mixed ? "Rule · mixed" : `Rule ${fillRuleChipLabel(value)}`}>
        <select
          className="field"
          value={mixed ? "" : value}
          aria-label={mixed ? "path fill rule mixed" : "path fill rule"}
          onChange={(e) => {
            const rule = e.target.value as "evenodd" | "nonzero";
            if (rule !== "evenodd" && rule !== "nonzero") return;
            updateNodes(ids, { fillRule: rule }, true);
          }}
        >
          {mixed && (
            <option value="" disabled>
              —
            </option>
          )}
          <option value="evenodd">even-odd</option>
          <option value="nonzero">nonzero</option>
        </select>
      </Field>
      {mixed && <MixedFillRuleLegend paths={paths} />}
      {mixed && (
        <div className="mt-1 flex flex-wrap gap-1">
          {paths.map((n) => {
            const rule = pathFillRule(n);
            const label = fillRuleChipLabel(rule);
            return (
              <button
                key={`fill-rule-${n.id}`}
                type="button"
                className="flex h-6 items-center rounded-full border border-phosphor/40 bg-surface-alt px-1.5 font-mono text-[8px] text-phosphor max-w-[120px] truncate"
                title={`Unify fill rule with ${n.name || n.kind}: ${label}`}
                aria-label={`Unify fill rule with ${n.name || n.kind}: ${label}`}
                onMouseEnter={() => ghostFillRule(rule)}
                onFocus={() => ghostFillRule(rule)}
                onMouseLeave={() => ghostFillRule(null)}
                onBlur={() => ghostFillRule(null)}
                onClick={() => updateNodes(ids, { fillRule: rule }, true)}
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
