import { useEffect, useRef } from "react";
import { smoothSelectedPath } from "@/lib/design/boolean-actions";
import { holeFillRule } from "@/lib/design/fill-rule";
import {
  offsetSelectedPath,
  outlineSelectedStroke,
  roundSelectedPathCorners,
  simplifySelectedPath,
} from "@/lib/design/offset-actions";
import { deletePathHole, selectPathHole, setHoleFillRule, setPathClosed } from "@/lib/design/path-actions";
import {
  restoreHoleListScroll,
  restorePointListScroll,
  shouldHoldHoleListScroll,
  shouldHoldPointListScroll,
} from "@/lib/design/path-point-tab";
import { useDesign } from "@/lib/design/store";
import { releaseStudioStatus } from "@/lib/design/studio-status";
import type { PathNode } from "@/lib/design/types";
import { cn } from "@/lib/utils";
import { Field } from "./inspector-parts";
import { PointRow } from "./path-point-row";

export function PathFields({ node }: { node: PathNode }) {
  const hit = useDesign((s) => s.pathEditHit);
  const closeSelectedPath = useDesign((s) => s.closeSelectedPath);
  const popLastPathPoint = useDesign((s) => s.popLastPathPoint);
  const holes = node.holes ?? [];
  const holeListRef = useRef<HTMLDivElement | null>(null);
  const pointListRef = useRef<HTMLDivElement | null>(null);
  const pointListScrollRef = useRef(0);
  const holeListScrollRef = useRef(0);

  const rememberPointListScroll = () => {
    const list = pointListRef.current;
    if (list) pointListScrollRef.current = list.scrollTop;
  };

  const rememberHoleListScroll = () => {
    const list = holeListRef.current;
    if (list) holeListScrollRef.current = list.scrollTop;
  };

  const holdPointListScroll = () => {
    const list = pointListRef.current;
    if (!list) return;
    restorePointListScroll(list, pointListScrollRef.current);
  };

  const holdHoleListScroll = () => {
    const list = holeListRef.current;
    if (!list) return;
    restoreHoleListScroll(list, holeListScrollRef.current);
  };
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
    if (shouldHoldHoleListScroll(document.activeElement)) {
      holdHoleListScroll();
      return;
    }
    if (activeHole == null) return;
    const row = holeListRef.current?.querySelector(`[data-hole="${activeHole}"]`);
    if (row instanceof HTMLElement) {
      row.scrollIntoView({ block: "nearest", inline: "nearest" });
      rememberHoleListScroll();
    }
  }, [activeHole, node.id, node.holeFillRules]);

  useEffect(() => {
    if (!shouldHoldHoleListScroll(document.activeElement)) return;
    holdHoleListScroll();
  }, [node.holeFillRules, holes.length]);

  useEffect(() => {
    if (activeIndex == null) return;
    if (shouldHoldPointListScroll(document.activeElement)) {
      holdPointListScroll();
      return;
    }
    const key =
      activeHole == null ? `path-${activeIndex}` : `hole-${activeHole}-${activeIndex}`;
    const row = pointListRef.current?.querySelector(`[data-point="${key}"]`);
    if (row instanceof HTMLElement) {
      row.scrollIntoView({ block: "nearest", inline: "nearest" });
      rememberPointListScroll();
    }
  }, [activeHole, activeIndex, node.id, node.closed, node.holeFillRules]);

  useEffect(() => {
    if (!shouldHoldPointListScroll(document.activeElement)) return;
    holdPointListScroll();
  }, [node.closed, node.points.length, node.holeFillRules, holes.length]);

  return (
    <div
      className="space-y-2"
      data-path-inspector
      onClickCapture={(e) => {
        const t = e.target;
        if (t instanceof HTMLElement && t.closest("button")) releaseStudioStatus();
      }}
    >
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
            data-path-exit="Closed"
            onFocus={holdPointListScroll}
            onClick={() => {
              rememberPointListScroll();
              setPathClosed(node.id, !node.closed);
              requestAnimationFrame(holdPointListScroll);
            }}
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
            data-path-exit="Offset"
            onFocus={holdPointListScroll}
            onClick={() => {
              rememberPointListScroll();
              outlineSelectedStroke();
              requestAnimationFrame(holdPointListScroll);
            }}
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
          <div
            ref={holeListRef}
            data-hole-list
            className="max-h-40 space-y-1 overflow-auto scrollbar-thin"
            onScroll={rememberHoleListScroll}
          >
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
                    data-select-hole={h}
                    onFocus={holdPointListScroll}
                    onClick={() => {
                      rememberPointListScroll();
                      selectPathHole(h);
                      requestAnimationFrame(holdPointListScroll);
                    }}
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
                      data-hole-fill="evenodd"
                      onFocus={() => {
                        holdHoleListScroll();
                        holdPointListScroll();
                      }}
                      onClick={() => {
                        rememberHoleListScroll();
                        rememberPointListScroll();
                        setHoleFillRule(node.id, h, "evenodd");
                        requestAnimationFrame(() => {
                          holdHoleListScroll();
                          holdPointListScroll();
                        });
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
                      data-hole-fill="nonzero"
                      onFocus={() => {
                        holdHoleListScroll();
                        holdPointListScroll();
                      }}
                      onClick={() => {
                        rememberHoleListScroll();
                        rememberPointListScroll();
                        setHoleFillRule(node.id, h, "nonzero");
                        requestAnimationFrame(() => {
                          holdHoleListScroll();
                          holdPointListScroll();
                        });
                      }}
                    >
                      Nonzero
                    </button>
                  </div>
                  <button
                    type="button"
                    className="mt-1 h-7 w-full rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
                    aria-label={`delete hole ${h + 1}`}
                    data-delete-hole={h}
                    onFocus={() => {
                      holdHoleListScroll();
                      holdPointListScroll();
                    }}
                    onClick={() => {
                      rememberHoleListScroll();
                      rememberPointListScroll();
                      deletePathHole(node.id, h);
                      requestAnimationFrame(() => {
                        holdHoleListScroll();
                        holdPointListScroll();
                      });
                    }}
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
        <div
          ref={pointListRef}
          data-point-list
          className="max-h-64 space-y-1.5 overflow-auto scrollbar-thin"
          onScroll={rememberPointListScroll}
        >
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
