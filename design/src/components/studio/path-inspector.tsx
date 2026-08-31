import { autoSmoothPoint, smoothPathCorners } from "@/lib/design/path-curve";
import { setPathEditHit } from "@/lib/design/path-actions";
import { useDesign } from "@/lib/design/store";
import type { PathNode, PathPoint } from "@/lib/design/types";
import { cn } from "@/lib/utils";
import { Field, Section } from "./inspector-parts";
import { NumField } from "./num-field";

function writePoints(node: PathNode, points: PathPoint[], extra: Partial<PathNode> = {}) {
  useDesign.getState().replaceNode(node.id, { ...node, points, ...extra }, true);
}

export function PathInspector({ node }: { node: PathNode }) {
  const hit = useDesign((s) => s.pathEditHit);
  const active = hit && hit.hole == null ? hit.index : -1;

  const setClosed = (closed: boolean) => {
    if (closed && node.points.length < 3) return;
    writePoints(node, node.points, { closed });
  };

  const smoothAll = () => {
    writePoints(node, smoothPathCorners(node.points, node.closed));
  };

  const cornerAll = () => {
    writePoints(
      node,
      node.points.map((p) => ({ ...p, in: null, out: null, smooth: false })),
    );
  };

  const patchPoint = (index: number, next: PathPoint) => {
    writePoints(
      node,
      node.points.map((p, i) => (i === index ? next : p)),
    );
  };

  const deletePoint = (index: number) => {
    if (node.points.length <= 1) {
      useDesign.getState().removeSelected();
      return;
    }
    const points = node.points.filter((_, i) => i !== index);
    const closed = points.length >= 3 ? node.closed : false;
    writePoints(node, points, { closed });
    setPathEditHit(null);
  };

  const toggleSmooth = (index: number) => {
    const p = node.points[index];
    if (!p) return;
    if (p.smooth !== false && (p.in || p.out)) {
      patchPoint(index, { ...p, in: null, out: null, smooth: false });
      return;
    }
    patchPoint(index, autoSmoothPoint(node.points, index, node.closed));
  };

  return (
    <Section title="Path">
      <div className="flex items-center justify-between text-[11px] text-ink-dim">
        <span>
          {node.points.length} point{node.points.length === 1 ? "" : "s"}
        </span>
        <span className="font-mono text-[10px]">{node.closed ? "closed" : "open"}</span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <button
          type="button"
          disabled={node.points.length < 3}
          className={cn(
            "h-8 rounded-[8px] text-[10px]",
            node.closed ? "bg-phosphor/15 text-phosphor" : "border border-border text-ink-dim",
            node.points.length < 3 && "opacity-40",
          )}
          onClick={() => setClosed(!node.closed)}
        >
          {node.closed ? "Open" : "Close"}
        </button>
        <button
          type="button"
          className="h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
          onClick={smoothAll}
        >
          Smooth
        </button>
        <button
          type="button"
          className="h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
          onClick={cornerAll}
        >
          Corner
        </button>
        <button
          type="button"
          className="h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
          onClick={() => useDesign.getState().popLastPathPoint()}
        >
          Drop last
        </button>
      </div>
      <Field label="Points">
        <ul className="max-h-56 space-y-1 overflow-auto scrollbar-thin">
          {node.points.map((pt, i) => {
            const selected = active === i;
            return (
              <li
                key={i}
                className={cn(
                  "rounded-[8px] border px-2 py-1.5",
                  selected ? "border-phosphor/60 bg-phosphor/10" : "border-border",
                )}
              >
                <button
                  type="button"
                  className="mb-1 flex w-full items-center justify-between text-left text-[10px] text-ink-dim"
                  onClick={() => setPathEditHit({ index: i, arm: "anchor" })}
                >
                  <span className="font-mono text-ink">{String(i + 1).padStart(2, "0")}</span>
                  <span>{pt.smooth !== false ? "smooth" : "corner"}</span>
                </button>
                <div className="grid grid-cols-2 gap-1">
                  <NumField
                    className="field font-mono"
                    value={Math.round(pt.x)}
                    aria-label={`point ${i + 1} x`}
                    onCommit={(n) => patchPoint(i, { ...pt, x: n })}
                  />
                  <NumField
                    className="field font-mono"
                    value={Math.round(pt.y)}
                    aria-label={`point ${i + 1} y`}
                    onCommit={(n) => patchPoint(i, { ...pt, y: n })}
                  />
                </div>
                <div className="mt-1 grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    className={cn(
                      "h-7 rounded-[8px] text-[10px]",
                      pt.smooth !== false ? "bg-phosphor/15 text-phosphor" : "border border-border text-ink-dim",
                    )}
                    onClick={() => toggleSmooth(i)}
                  >
                    {pt.smooth !== false ? "Corner" : "Smooth"}
                  </button>
                  <button
                    type="button"
                    className="h-7 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
                    onClick={() => deletePoint(i)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </Field>
    </Section>
  );
}
