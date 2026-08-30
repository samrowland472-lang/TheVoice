import { canBoolean, type BooleanOp } from "@/lib/design/boolean-ops";
import { applyBoolean, setBooleanPreview } from "@/lib/design/boolean-actions";
import { useDesign } from "@/lib/design/store";
import { cn } from "@/lib/utils";

const OPS: { op: BooleanOp; label: string }[] = [
  { op: "union", label: "Union" },
  { op: "subtract", label: "Subtract" },
  { op: "intersect", label: "Intersect" },
  { op: "exclude", label: "Exclude" },
];

export function BooleanButtons() {
  const doc = useDesign((s) => s.doc);
  const selection = useDesign((s) => s.selection);
  const booleanPreview = useDesign((s) => s.booleanPreview ?? null);
  if (!doc) return null;
  const count = selection.filter((id) => {
    const n = doc.nodes.find((x) => x.id === id);
    return n ? canBoolean(n) : false;
  }).length;
  if (count < 2) return null;
  return (
    <div className="mt-2 px-3">
      <div className="mb-1 text-[10px] uppercase tracking-wide text-ink-dim">Boolean</div>
      <div className="grid grid-cols-2 gap-1">
        {OPS.map(({ op, label }) => (
          <button
            key={op}
            type="button"
            className={cn(
              "h-8 rounded-[8px] border text-[10px]",
              booleanPreview === op
                ? "border-phosphor bg-phosphor/15 text-phosphor"
                : "border-border text-ink-dim hover:border-phosphor hover:text-ink",
            )}
            onMouseEnter={() => setBooleanPreview(op)}
            onMouseLeave={() => setBooleanPreview(null)}
            onFocus={() => setBooleanPreview(op)}
            onBlur={() => setBooleanPreview(null)}
            onClick={() => applyBoolean(op)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
