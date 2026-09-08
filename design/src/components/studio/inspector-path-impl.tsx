import { useEffect, useRef } from "react";
import { holeFillRule } from "@/lib/design/fill-rule";
import {
  deletePathHole,
  selectPathHole,
  setHoleFillRule,
  setPathClosed,
} from "@/lib/design/path-actions";
import {
  offsetSelectedPath,
  outlineSelectedStroke,
  roundSelectedPathCorners,
  simplifySelectedPath,
} from "@/lib/design/offset-actions";
import {
  pickFirstOuterPointTabTarget,
  pickOffsetTabTarget,
  pickOutlineTabTarget,
  pickNextHolePointTabTarget,
  pickSameHoleFirstPointTabTarget,
  pickSameHoleLastPointTabTarget,
  shouldHoldHoleListScroll,
  shouldHoldPointListScroll,
  shouldTabFromClosedToOffset,
  shouldTabFromOffsetToFirstOuterPoint,
  shouldTabFromOffsetToOutline,
  shouldTabToSameHoleFirstPoint,
  tagHoleHeaderTabCrossing,
  tagHolePointTabCrossing,
  pickNextHoleTabTarget,
  pickPreviousHoleTabTarget,
} from "@/lib/design/path-point-tab";
import {
  pickPrevHoleLastPointTabTarget,
  shouldShiftTabToPrevHoleLastPoint,
} from "@/lib/design/path-prev-hole-tab";
import { useDesign } from "@/lib/design/store";
import type { PathNode } from "@/lib/design/types";
import { cn } from "@/lib/utils";
import { Section } from "./inspector-parts";
import { PointRow } from "./path-point-row";

function holdListScroll(list: Element | null, saved: number) {
  if (!(list instanceof HTMLElement)) return;
  list.scrollTop = saved;
  requestAnimationFrame(() => {
    list.scrollTop = saved;
  });
}

function focusHold(el: HTMLElement, listSel: string, from: Element) {
  const list = from.closest(listSel);
  const saved = list instanceof HTMLElement ? list.scrollTop : 0;
  el.focus();
  if (el instanceof HTMLInputElement) el.select();
  holdListScroll(list, saved);
}

export function PathFields({ node }: { node: PathNode }) {
  const hit = useDesign((s) => s.pathEditHit);
  const holes = node.holes ?? [];
  const activeHole = hit?.hole ?? null;
  const holePointIndex = activeHole != null ? hit?.index ?? 0 : 0;
  const holePointCount = activeHole != null ? (holes[activeHole]?.length ?? 0) : 0;
  const holeListRef = useRef<HTMLDivElement | null>(null);
  const pointListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeHole == null) return;
    const list = holeListRef.current;
    const card = list?.querySelector(`[data-hole="${activeHole}"]`);
    const active = document.activeElement;
    if (card instanceof HTMLElement && !shouldHoldHoleListScroll(active)) {
      card.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [activeHole]);

  useEffect(() => {
    const list = pointListRef.current;
    const active = document.activeElement;
    if (!list || shouldHoldPointListScroll(active)) return;
    const row = list.querySelector("[data-point].border-phosphor\\/60");
    if (row instanceof HTMLElement) row.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [hit?.index, hit?.hole]);

  return (
    <div data-path-inspector="">
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
            data-path-exit="Closed"
            disabled={node.points.length < 3}
            className={cn(
              "h-8 rounded-[8px] text-[10px]",
              node.closed ? "bg-phosphor/15 text-phosphor" : "border border-border text-ink-dim",
              node.points.length < 3 && "opacity-40",
            )}
            aria-label="closed path"
            onClick={() => setPathClosed(node.id, !node.closed)}
            onKeyDown={(e) => {
              if (e.key !== "Tab" || e.shiftKey) return;
              const from = e.currentTarget;
              if (!shouldTabFromClosedToOffset(from, false)) return;
              const offset = pickOffsetTabTarget(from);
              if (!offset) return;
              e.preventDefault();
              tagHolePointTabCrossing(from, offset, offset);
              const list = pointListRef.current;
              const saved = list instanceof HTMLElement ? list.scrollTop : 0;
              offset.focus();
              holdListScroll(list, saved);
            }}
          >
            {node.closed ? "Open" : "Close"}
          </button>
          <button
            type="button"
            data-path-exit="Offset"
            className="h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
            aria-label="offset path"
            onClick={() => offsetSelectedPath("out")}
            onKeyDown={(e) => {
              if (e.key !== "Tab" || e.shiftKey) return;
              const from = e.currentTarget;
              if (shouldTabFromOffsetToOutline(from, false)) {
                const outline = pickOutlineTabTarget(from);
                if (outline) {
                  e.preventDefault();
                  tagHolePointTabCrossing(from, outline, outline);
                  const list = pointListRef.current;
                  const saved = list instanceof HTMLElement ? list.scrollTop : 0;
                  outline.focus();
                  holdListScroll(list, saved);
                  return;
                }
              }
              if (!shouldTabFromOffsetToFirstOuterPoint(from, false)) return;
              const first = pickFirstOuterPointTabTarget(from);
              if (!first) return;
              e.preventDefault();
              tagHolePointTabCrossing(from, first, first);
              const list = pointListRef.current;
              const saved = list instanceof HTMLElement ? list.scrollTop : 0;
              first.focus();
              if (first instanceof HTMLInputElement) first.select();
              holdListScroll(list, saved);
            }}
          >
            Offset
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          <button type="button" data-path-exit="Outline" className="h-7 rounded-[8px] border border-border text-[10px] text-ink-dim" aria-label="outline stroke" onClick={() => outlineSelectedStroke()}>
            Outline
          </button>
          <button type="button" data-path-exit="Round" className="h-7 rounded-[8px] border border-border text-[10px] text-ink-dim" aria-label="round corners" onClick={() => roundSelectedPathCorners()}>
            Round
          </button>
          <button type="button" data-path-exit="Simplify" className="h-7 rounded-[8px] border border-border text-[10px] text-ink-dim" aria-label="simplify path" onClick={() => simplifySelectedPath()}>
            Simplify
          </button>
        </div>
      </Section>

      {holes.length > 0 && (
        <Section title="Holes">
          <div className="mb-1 text-[10px] text-ink-dim">
            {activeHole != null && holePointCount > 0
              ? `Holes · ${holes.length} · pt ${holePointIndex + 1}/${holePointCount}`
              : `Holes · ${holes.length}  ↑↓ ←→ Home End`}
          </div>
          <div className="mb-1 font-mono text-[9px] text-ink-dim">↑↓ ←→ Home End ⇧Home ⇧End</div>
          <div ref={holeListRef} data-hole-list="" className="max-h-40 space-y-1 overflow-y-auto">
            {holes.map((ring, h) => {
              const rule = holeFillRule(node, h);
              return (
                <div
                  key={h}
                  data-hole={h}
                  className={cn(
                    "rounded-[8px] border px-2 py-1.5",
                    activeHole === h ? "border-phosphor/60 bg-phosphor/10" : "border-border",
                  )}
                >
                  <button
                    type="button"
                    data-select-hole={h}
                    className="mb-1 flex w-full items-center justify-between text-left"
                    aria-label={`select hole ${h + 1}`}
                    onClick={() => selectPathHole(h)}
                    onKeyDown={(e) => {
                      if (e.key !== "Tab") return;
                      const from = e.currentTarget;
                      if (e.shiftKey && shouldShiftTabToPrevHoleLastPoint(from, true)) {
                        const last = pickPrevHoleLastPointTabTarget(from);
                        if (last) {
                          e.preventDefault();
                          tagHolePointTabCrossing(from, last, last);
                          focusHold(last, "[data-point-list]", from);
                          return;
                        }
                      }
                      if (!e.shiftKey && shouldTabToSameHoleFirstPoint(from, false)) {
                        const first = pickSameHoleFirstPointTabTarget(from) ?? pickSameHoleLastPointTabTarget(from) ?? pickNextHolePointTabTarget(from);
                        if (first) {
                          e.preventDefault();
                          tagHolePointTabCrossing(from, first, first);
                          focusHold(first, "[data-point-list]", from);
                          return;
                        }
                      }
                      if (e.shiftKey) {
                        const prev = pickPreviousHoleTabTarget(from);
                        if (prev) {
                          e.preventDefault();
                          tagHoleHeaderTabCrossing(from, prev, prev);
                          focusHold(prev, "[data-hole-list]", from);
                        }
                      }
                    }}
                  >
                    <span className="font-mono text-[10px] text-ink-dim">Hole {h + 1}</span>
                    <span className="text-[10px] text-ink-dim">{ring.length} pts</span>
                  </button>
                  <div className="grid grid-cols-2 gap-1">
                    {(["evenodd", "nonzero"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        data-hole-fill={r}
                        className={cn(
                          "h-7 rounded-[8px] text-[10px]",
                          rule === r ? "bg-phosphor/15 text-phosphor" : "border border-border text-ink-dim",
                        )}
                        aria-label={`hole ${h + 1} fill rule ${r === "evenodd" ? "even-odd" : "nonzero"}`}
                        onClick={() => setHoleFillRule(node.id, h, r)}
                      >
                        {r === "evenodd" ? "Even-odd" : "Nonzero"}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    data-delete-hole={h}
                    className="mt-1 h-7 w-full rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
                    aria-label={`delete hole ${h + 1}`}
                    onClick={() => deletePathHole(node.id, h)}
                    onKeyDown={(e) => {
                      if (e.key !== "Tab" || e.shiftKey) return;
                      const next = pickNextHoleTabTarget(e.currentTarget);
                      if (!next) return;
                      e.preventDefault();
                      tagHoleHeaderTabCrossing(e.currentTarget, next, next);
                      focusHold(next, "[data-hole-list]", e.currentTarget);
                    }}
                  >
                    Delete hole
                  </button>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      <Section title="Points">
        <div ref={pointListRef} data-point-list="" className="max-h-56 space-y-1 overflow-y-auto">
          {node.points.map((p, i) => (
            <PointRow
              key={`p-${i}`}
              nodeId={node.id}
              index={i}
              point={p}
              active={hit != null && hit.hole == null && hit.index === i}
            />
          ))}
          {holes.map((ring, h) =>
            ring.map((p, i) => (
              <PointRow
                key={`h-${h}-${i}`}
                nodeId={node.id}
                index={i}
                point={p}
                hole={h}
                active={hit != null && hit.hole === h && hit.index === i}
              />
            )),
          )}
        </div>
      </Section>
    </div>
  );
}
