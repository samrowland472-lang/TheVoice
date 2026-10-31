import { autoSmoothPoint, smoothPathCorners } from "@/lib/design/path-curve";
import { setPathEditHit } from "@/lib/design/path-actions";
import { dropHole, holeFillRule, pathFillRule, setHoleFillRule, type PathFillRule } from "@/lib/design/fill-rule";
import { useDesign } from "@/lib/design/store";
import type { PathNode, PathPoint } from "@/lib/design/types";
import { cn } from "@/lib/utils";
import { Field, Section } from "./inspector-parts";
import { NumField } from "./num-field";

function writeNode(node: PathNode, next: PathNode) {
  useDesign.getState().replaceNode(node.id, next, true);
}

function writePoints(node: PathNode, points: PathPoint[], extra: Partial<PathNode> = {}) {
  writeNode(node, { ...node, points, ...extra });
}

function ringBounds(points: PathPoint[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  if (!Number.isFinite(minX)) return { cx: 0, cy: 0, w: 40, h: 40 };
  return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, w: Math.max(8, maxX - minX), h: Math.max(8, maxY - minY) };
}

export function PathInspector({ node }: { node: PathNode }) {
  const hit = useDesign((s) => s.pathEditHit);
  const outerActive = hit && hit.hole == null ? hit.index : -1;
  const holes = node.holes ?? [];

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

  const addHole = () => {
    const b = ringBounds(node.points);
    const hw = Math.max(12, b.w * 0.25);
    const hh = Math.max(12, b.h * 0.25);
    const cx = b.cx;
    const cy = b.cy;
    const ring: PathPoint[] = [
      { x: cx - hw, y: cy - hh, smooth: false },
      { x: cx + hw, y: cy - hh, smooth: false },
      { x: cx + hw, y: cy + hh, smooth: false },
      { x: cx - hw, y: cy + hh, smooth: false },
    ];
    const nextHoles = [...holes, ring];
    const nextRules = [...(node.holeFillRules ?? [])];
    while (nextRules.length < nextHoles.length) nextRules.push(pathFillRule(node));
    writeNode(node, { ...node, holes: nextHoles, holeFillRules: nextRules, closed: true });
    setPathEditHit({ index: 0, arm: "anchor", hole: nextHoles.length - 1 });
  };

  const removeHole = (index: number) => {
    writeNode(node, dropHole(node, index));
    setPathEditHit(null);
  };

  const setHoleRule = (index: number, rule: PathFillRule) => {
    writeNode(node, setHoleFillRule(node, index, rule));
  };

  const patchHolePoint = (h: number, index: number, next: PathPoint) => {
    const nextHoles = holes.map((ring, i) =>
      i === h ? ring.map((p, j) => (j === index ? next : p)) : ring,
    );
    writeNode(node, { ...node, holes: nextHoles });
  };

  const deleteHolePoint = (h: number, index: number) => {
    const ring = holes[h];
    if (!ring) return;
    if (ring.length <= 3) {
      removeHole(h);
      return;
    }
    const nextRing = ring.filter((_, i) => i !== index);
    const nextHoles = holes.map((r, i) => (i === h ? nextRing : r));
    writeNode(node, { ...node, holes: nextHoles });
    setPathEditHit(null);
  };

  const toggleHoleSmooth = (h: number, index: number) => {
    const ring = holes[h];
    const p = ring?.[index];
    if (!ring || !p) return;
    if (p.smooth !== false && (p.in || p.out)) {
      patchHolePoint(h, index, { ...p, in: null, out: null, smooth: false });
      return;
    }
    patchHolePoint(h, index, autoSmoothPoint(ring, index, true));
  };

  return (
    <Section title="Path">
      <div data-path-inspector className="space-y-2">
        <div className="flex items-center justify-between text-[11px] text-ink-dim">
          <span>
            {node.points.length} point{node.points.length === 1 ? "" : "s"}
            {holes.length ? ` · ${holes.length} hole${holes.length === 1 ? "" : "s"}` : ""}
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
              const selected = outerActive === i;
              return (
                <li
                  key={i}
                  data-point={`path-${i}`}
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
                      data-path-axis="x"
                      onCommit={(n) => patchPoint(i, { ...pt, x: n })}
                    />
                    <NumField
                      className="field font-mono"
                      value={Math.round(pt.y)}
                      aria-label={`point ${i + 1} y`}
                      data-path-axis="y"
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

        <Field label="Holes">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] text-ink-dim">
              {holes.length ? `${holes.length} cutout${holes.length === 1 ? "" : "s"}` : "none"}
            </span>
            <button
              type="button"
              className="h-7 rounded-[8px] border border-border px-2 text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
              onClick={addHole}
            >
              Add hole
            </button>
          </div>
          {holes.length === 0 ? null : (
            <ul className="max-h-64 space-y-2 overflow-auto scrollbar-thin">
              {holes.map((ring, h) => {
                const rule = holeFillRule(node, h);
                const holeHit = hit && hit.hole === h ? hit.index : -1;
                return (
                  <li key={h} className="rounded-[8px] border border-border p-1.5">
                    <div
                      data-select-hole={h}
                      data-hole={h}
                      className="mb-1 flex items-center justify-between gap-1"
                    >
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 items-center justify-between text-left text-[10px] text-ink-dim"
                        onClick={() => setPathEditHit({ index: 0, arm: "anchor", hole: h })}
                      >
                        <span className="font-mono text-ink">Hole {String(h + 1).padStart(2, "0")}</span>
                        <span>{ring.length} pts</span>
                      </button>
                      <button
                        type="button"
                        data-delete-hole
                        className="h-6 rounded-[6px] border border-border px-1.5 text-[9px] text-ink-dim hover:border-phosphor hover:text-ink"
                        onClick={() => removeHole(h)}
                      >
                        Delete
                      </button>
                    </div>
                    <div data-hole-fill className="mb-1 grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        className={cn(
                          "h-6 rounded-[6px] text-[9px]",
                          rule === "evenodd" ? "bg-phosphor/15 text-phosphor" : "border border-border text-ink-dim",
                        )}
                        onClick={() => setHoleRule(h, "evenodd")}
                      >
                        Even-odd
                      </button>
                      <button
                        type="button"
                        className={cn(
                          "h-6 rounded-[6px] text-[9px]",
                          rule === "nonzero" ? "bg-phosphor/15 text-phosphor" : "border border-border text-ink-dim",
                        )}
                        onClick={() => setHoleRule(h, "nonzero")}
                      >
                        Nonzero
                      </button>
                    </div>
                    <ul className="space-y-1">
                      {ring.map((pt, i) => {
                        const selected = holeHit === i;
                        return (
                          <li
                            key={i}
                            data-point={`hole-${h}-${i}`}
                            className={cn(
                              "rounded-[6px] border px-1.5 py-1",
                              selected ? "border-phosphor/60 bg-phosphor/10" : "border-border/70",
                            )}
                          >
                            <div className="mb-0.5 flex items-center justify-between text-[9px] text-ink-dim">
                              <span className="font-mono">{String(i + 1).padStart(2, "0")}</span>
                              <span>{pt.smooth !== false ? "smooth" : "corner"}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                              <NumField
                                className="field font-mono text-[10px]"
                                value={Math.round(pt.x)}
                                aria-label={`hole ${h + 1} point ${i + 1} x`}
                                data-path-axis="x"
                                onCommit={(n) => patchHolePoint(h, i, { ...pt, x: n })}
                              />
                              <NumField
                                className="field font-mono text-[10px]"
                                value={Math.round(pt.y)}
                                aria-label={`hole ${h + 1} point ${i + 1} y`}
                                data-path-axis="y"
                                onCommit={(n) => patchHolePoint(h, i, { ...pt, y: n })}
                              />
                            </div>
                            <div className="mt-0.5 grid grid-cols-2 gap-1">
                              <button
                                type="button"
                                className={cn(
                                  "h-6 rounded-[6px] text-[9px]",
                                  pt.smooth !== false ? "bg-phosphor/15 text-phosphor" : "border border-border text-ink-dim",
                                )}
                                onClick={() => toggleHoleSmooth(h, i)}
                              >
                                {pt.smooth !== false ? "Corner" : "Smooth"}
                              </button>
                              <button
                                type="button"
                                className="h-6 rounded-[6px] border border-border text-[9px] text-ink-dim hover:border-phosphor hover:text-ink"
                                onClick={() => deleteHolePoint(h, i)}
                              >
                                Delete
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}
        </Field>
      </div>
    </Section>
  );
}
