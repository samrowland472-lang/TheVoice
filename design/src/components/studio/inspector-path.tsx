import { useEffect, useRef } from "react";
import { smoothSelectedPath } from "@/lib/design/boolean-actions";
import { holeFillRule } from "@/lib/design/fill-rule";
import {
  offsetSelectedPath,
  outlineSelectedStroke,
  roundSelectedPathCorners,
  simplifySelectedPath,
} from "@/lib/design/offset-actions";
import {
  deletePathHole,
  deletePathPoint,
  selectPathHole,
  selectPathPoint,
  setHoleFillRule,
  setPathClosed,
  setPathPointPosition,
  setPathPointSmooth,
} from "@/lib/design/path-actions";
import { useDesign } from "@/lib/design/store";
import type { PathNode, PathPoint } from "@/lib/design/types";
import { cn } from "@/lib/utils";
import { Field } from "./inspector-parts";
import { NumField } from "./num-field";

function ringLabel(hole?: number) {
  return hole == null ? "Path" : `Hole ${hole + 1}`;
}

function PointRow({
  nodeId,
  index,
  point,
  hole,
  active,
}: {
  nodeId: string;
  index: number;
  point: PathPoint;
  hole?: number;
  active: boolean;
}) {
  const rowRef = useRef<HTMLDivElement | null>(null);

  function revealAndSelect() {
    selectPathPoint(index, hole);
    rowRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  return (
    <div
      ref={rowRef}
      data-point={hole == null ? `path-${index}` : `hole-${hole}-${index}`}
      className={cn(
        "rounded-[8px] border px-2 py-1.5",
        active ? "border-phosphor/60 bg-phosphor/10" : "border-border",
      )}
    >
      <button
        type="button"
        className="mb-1 flex w-full items-center justify-between text-left"
        aria-label={`select point ${index + 1}`}
        onClick={() => revealAndSelect()}
      >
        <span className="font-mono text-[10px] text-ink-dim">
          {ringLabel(hole)} · {index + 1}
        </span>
        <span className="text-[10px] text-ink-dim">{point.smooth === false ? "corner" : "smooth"}</span>
      </button>
      <div className="grid grid-cols-2 gap-1">
        <NumField
          className="field font-mono text-[11px]"
          value={point.x}
          aria-label={`point ${index + 1} x`}
          onFocus={revealAndSelect}
          onCommit={(n) => {
            revealAndSelect();
            setPathPointPosition(nodeId, index, n, point.y, hole);
          }}
        />
        <NumField
          className="field font-mono text-[11px]"
          value={point.y}
          aria-label={`point ${index + 1} y`}
          onFocus={revealAndSelect}
          onCommit={(n) => {
            revealAndSelect();
            setPathPointPosition(nodeId, index, point.x, n, hole);
          }}
        />
      </div>
      <div className="mt-1 flex gap-1">
        <button
          type="button"
          className={cn(
            "h-7 flex-1 rounded-[8px] text-[10px]",
            point.smooth !== false ? "bg-phosphor/15 text-phosphor" : "border border-border text-ink-dim",
          )}
          aria-label={`smooth point ${index + 1}`}
          onClick={() => setPathPointSmooth(nodeId, index, true, hole)}
        >
          Smooth
        </button>
        <button
          type="button"
          className={cn(
            "h-7 flex-1 rounded-[8px] text-[10px]",
            point.smooth === false ? "bg-phosphor/15 text-phosphor" : "border border-border text-ink-dim",
          )}
          aria-label={`corner point ${index + 1}`}
          onClick={() => setPathPointSmooth(nodeId, index, false, hole)}
        >
          Corner
        </button>
        <button
          type="button"
          className="h-7 rounded-[8px] border border-border px-2 text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
          aria-label={`delete point ${index + 1}`}
          onClick={() => deletePathPoint(nodeId, index, hole)}
        >
          Del
        </button>
      </div>
    </div>
  );
}

export function PathFields({ node }: { node: PathNode }) {
  const hit = useDesign((s) => s.pathEditHit);
  const closeSelectedPath = useDesign((s) => s.closeSelectedPath);
  const popLastPathPoint = useDesign((s) => s.popLastPathPoint);
  const holes = node.holes ?? [];
  const holeListRef = useRef<HTMLDivElement | null>(null);
  const pointListRef = useRef<HTMLDivElement | null>(null);
  const activeHole = hit?.hole;
  const activeIndex = hit?.index;
  const activeRing = activeHole != null ? holes[activeHole] : undefined;
  const holePointCount = activeRing?.length ?? 0;
  const holePointIndex =
    activeHole != null && hit && holePointCount > 0
      ? ((hit.index % holePointCount) + holePointCount) % holePointCount
      : null;
  const holesHeader =
    holePointIndex != null
      ? `Holes · ${holes.length} · pt ${holePointIndex + 1}/${holePointCount}  ↑↓ ←→ Home End ⇧Home ⇧End`
      : `Holes · ${holes.length}  ↑↓ ←→ Home End`;

  useEffect(() => {
    if (activeHole == null) return;
    const row = holeListRef.current?.querySelector(`[data-hole="${activeHole}"]`);
    if (row instanceof HTMLElement) {
      row.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [activeHole, node.id]);

  useEffect(() => {
    if (activeIndex == null) return;
    const key =
      activeHole == null ? `path-${activeIndex}` : `hole-${activeHole}-${activeIndex}`;
    const row = pointListRef.current?.querySelector(`[data-point="${key}"]`);
    if (row instanceof HTMLElement) {
      row.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [activeHole, activeIndex, node.id]);

  return (
    <div className="space-y-2">
      <Field label={`Path · ${node.points.length} pts${holes.length ? ` · ${holes.length} holes` : ""}`}>
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            disabled={node.points.length < 3 && !node.closed}
            className={cn(
              "h-8 rounded-[8px] text-[10px]",
              node.closed ? "bg-phosphor/15 text-phosphor" : "border border-border text-ink-dim",
              node.points.length < 3 && !node.closed && "opacity-40",
            )}
            aria-label="close path"
            onClick={() => setPathClosed(node.id, !node.closed)}
          >
            {node.closed ? "Closed" : "Open"}
          </button>
          <button
            type="button"
            className="h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
            aria-label="smooth path"
            onClick={() => smoothSelectedPath()}
          >
            Smooth all
          </button>
        </div>
        <div className="mt-1 grid grid-cols-2 gap-1">
          <button
            type="button"
            className="h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
            aria-label="close or reopen path"
            onClick={() => closeSelectedPath()}
          >
            Toggle close
          </button>
          <button
            type="button"
            className="h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
            aria-label="delete last point"
            onClick={() => popLastPathPoint()}
          >
            Pop last
          </button>
        </div>
      </Field>
      <Field label="Offset">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            className="h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
            aria-label="outline stroke"
            onClick={() => outlineSelectedStroke()}
          >
            Outline stroke
          </button>
          <button
            type="button"
            className="h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
            aria-label="round offset corners"
            onClick={() => roundSelectedPathCorners()}
          >
            Round corners
          </button>
          <button
            type="button"
            className="h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
            aria-label="offset path outward"
            onClick={() => offsetSelectedPath("out")}
          >
            Offset out
          </button>
          <button
            type="button"
            className="h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
            aria-label="offset path inward"
            onClick={() => offsetSelectedPath("in")}
          >
            Offset in
          </button>
          <button
            type="button"
            className="col-span-2 h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
            aria-label="simplify path"
            onClick={() => simplifySelectedPath()}
          >
            Simplify
          </button>
        </div>
      </Field>
      {holes.length > 0 ? (
        <Field label={holesHeader}>
          <div ref={holeListRef} className="max-h-40 space-y-1 overflow-auto scrollbar-thin">
            {holes.map((ring, h) => {
              const rule = holeFillRule(node, h);
              return (
                <div
                  key={`hole-${h}`}
                  data-hole={h}
                  className={cn(
                    "rounded-[8px] border px-2 py-1.5",
                    activeHole === h ? "border-phosphor/60 bg-phosphor/10" : "border-border",
                  )}
                >
                  <button
                    type="button"
                    className="mb-1 flex w-full items-center justify-between text-left"
                    aria-label={`select hole ${h + 1}`}
                    onClick={() => selectPathHole(h)}
                  >
                    <span className="font-mono text-[10px] text-ink">Hole {h + 1}</span>
                    <span className="text-[10px] text-ink-dim">{ring.length} pts</span>
                  </button>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      className={cn(
                        "h-7 rounded-[8px] text-[10px]",
                        rule === "evenodd" ? "bg-phosphor/15 text-phosphor" : "border border-border text-ink-dim",
                      )}
                      aria-label={`hole ${h + 1} fill rule evenodd`}
                      onClick={() => {
                        const rule = "evenodd" as const;
                        setHoleFillRule(node.id, h, rule);
                      }}
                    >
                      Even-odd
                    </button>
                    <button
                      type="button"
                      className={cn(
                        "h-7 rounded-[8px] text-[10px]",
                        rule === "nonzero" ? "bg-phosphor/15 text-phosphor" : "border border-border text-ink-dim",
                      )}
                      aria-label={`hole ${h + 1} fill rule nonzero`}
                      onClick={() => {
                        const rule = "nonzero" as const;
                        setHoleFillRule(node.id, h, rule);
                      }}
                    >
                      Nonzero
                    </button>
                  </div>
                  <button
                    type="button"
                    className="mt-1 h-7 w-full rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
                    aria-label={`delete hole ${h + 1}`}
                    onClick={() => deletePathHole(node.id, h)}
                  >
                    Delete hole
                  </button>
                </div>
              );
            })}
          </div>
        </Field>
      ) : null}
      <Field label="Points">
        <div ref={pointListRef} className="max-h-64 space-y-1.5 overflow-auto scrollbar-thin">
          {node.points.map((pt, i) => (
            <PointRow
              key={`p-${i}`}
              nodeId={node.id}
              index={i}
              point={pt}
              active={Boolean(hit && hit.hole == null && hit.index === i)}
            />
          ))}
          {holes.map((ring, h) =>
            ring.map((pt, i) => (
              <PointRow
                key={`h-${h}-${i}`}
                nodeId={node.id}
                index={i}
                point={pt}
                hole={h}
                active={Boolean(hit && hit.hole === h && hit.index === i)}
              />
            )),
          )}
        </div>
      </Field>
    </div>
  );
}
