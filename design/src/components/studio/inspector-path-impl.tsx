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
  pickRoundTabTarget,
  pickSimplifyTabTarget,
  pickNextHolePointTabTarget,
  pickSameHoleFirstPointTabTarget,
  pickSameHoleLastPointTabTarget,
  shouldHoldHoleListScroll,
  shouldHoldPointListScroll,
  shouldTabFromClosedToOffset,
  shouldTabFromOffsetToFirstOuterPoint,
  shouldTabFromOffsetToOutline,
  shouldTabFromOutlineToRound,
  shouldTabFromRoundToSimplify,
  shouldTabFromSimplifyToFirstOuterPoint,
  shouldTabToSameHoleFirstPoint,
  tagHoleHeaderTabCrossing,
  tagHolePointTabCrossing,
  pickNextHoleTabTarget,
  pickPreviousHoleTabTarget,
  shouldShiftTabFromNextHoleHeaderToLastHoleX,
  pickLastHoleLastPointXTabTarget,
  shouldShiftTabFromNextHoleHeaderToLastHoleY,
  pickLastHoleLastPointYTabTarget,
  shouldTabFromLastHoleHeaderToNextFirstX,
  pickNextHoleFirstPointXFromHeaderTabTarget,
  shouldTabFromLastHoleHeaderToNextFirstY,
  pickNextHoleFirstPointYFromHeaderTabTarget,
  shouldTabFromLastHoleHeaderToNextHeader,
  pickNextHoleHeaderFromHeaderTabTarget,
  shouldShiftTabFromNextHoleHeaderToLastHoleHeader,
  pickLastHoleHeaderFromHeaderTabTarget,
  focusHold,
  holdExitHop,
  shouldShiftTabFromFirstHoleHeaderToLastOuterX,
  shouldShiftTabFromFirstHoleHeaderToLastOuterY,
  pickLastOuterLastPointXTabTarget,
  pickLastOuterLastPointYTabTarget,
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

export function PathFields({ node }: { node: PathNode }) {
  const pointListRef = useRef<HTMLDivElement>(null);
  const holeListRef = useRef<HTMLDivElement>(null);
  const hit = useDesign((s) => s.pathEditHit);
  const holes = node.holes ?? [];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const from = e.target;
      if (!(from instanceof Element)) return;
      const list = pointListRef.current;

      if (e.shiftKey) {
        if (shouldShiftTabFromNextHoleHeaderToLastHoleY(from, true)) {
          const lastY = pickLastHoleLastPointYTabTarget(from);
          if (!lastY) return;
          e.preventDefault();
          tagHolePointTabCrossing(from, lastY, lastY);
          focusHold(lastY, "[data-point-list]", from);
          return;
        }
        if (shouldShiftTabFromNextHoleHeaderToLastHoleX(from, true)) {
          const lastX = pickLastHoleLastPointXTabTarget(from);
          if (!lastX) return;
          e.preventDefault();
          tagHolePointTabCrossing(from, lastX, lastX);
          focusHold(lastX, "[data-point-list]", from);
          return;
        }
        if (shouldShiftTabFromNextHoleHeaderToLastHoleHeader(from, true)) {
          const prevHeader = pickLastHoleHeaderFromHeaderTabTarget(from);
          if (!prevHeader) return;
          e.preventDefault();
          tagHoleHeaderTabCrossing(from, prevHeader, prevHeader);
          focusHold(prevHeader, "[data-hole-list]", from);
          return;
        }
        if (shouldShiftTabFromFirstHoleHeaderToLastOuterY(from, true)) {
          const lastY = pickLastOuterLastPointYTabTarget(from);
          if (!lastY) return;
          e.preventDefault();
          tagHolePointTabCrossing(from, lastY, lastY);
          focusHold(lastY, "[data-point-list]", from);
          return;
        }
        if (shouldShiftTabFromFirstHoleHeaderToLastOuterX(from, true)) {
          const lastX = pickLastOuterLastPointXTabTarget(from);
          if (!lastX) return;
          e.preventDefault();
          tagHolePointTabCrossing(from, lastX, lastX);
          focusHold(lastX, "[data-point-list]", from);
          return;
        }
        if (shouldShiftTabToPrevHoleLastPoint(from, true)) {
          const last = pickPrevHoleLastPointTabTarget(from);
          if (!last) return;
          e.preventDefault();
          tagHolePointTabCrossing(from, last, last);
          focusHold(last, "[data-point-list]", from);
          return;
        }
        const prevHole = pickPreviousHoleTabTarget(from);
        if (prevHole && shouldHoldHoleListScroll(from)) {
          e.preventDefault();
          tagHoleHeaderTabCrossing(from, prevHole, prevHole);
          focusHold(prevHole, "[data-hole-list]", from);
        }
        return;
      }

      if (shouldTabFromClosedToOffset(from, false)) {
        const offset = pickOffsetTabTarget(from);
        if (!offset) return;
        e.preventDefault();
        tagHolePointTabCrossing(from, offset, offset);
        holdExitHop(from, offset, list);
        return;
      }
      if (shouldTabFromOffsetToOutline(from, false)) {
        const outline = pickOutlineTabTarget(from);
        if (!outline) return;
        e.preventDefault();
        tagHolePointTabCrossing(from, outline, outline);
        holdExitHop(from, outline, list);
        return;
      }
      if (shouldTabFromOutlineToRound(from, false)) {
        const round = pickRoundTabTarget(from);
        if (!round) return;
        e.preventDefault();
        tagHolePointTabCrossing(from, round, round);
        holdExitHop(from, round, list);
        return;
      }
      if (shouldTabFromRoundToSimplify(from, false)) {
        const simplify = pickSimplifyTabTarget(from);
        if (!simplify) return;
        e.preventDefault();
        tagHolePointTabCrossing(from, simplify, simplify);
        holdExitHop(from, simplify, list);
        return;
      }
      if (shouldTabFromOffsetToFirstOuterPoint(from, false) || shouldTabFromSimplifyToFirstOuterPoint(from, false)) {
        const first = pickFirstOuterPointTabTarget(from);
        if (!first) return;
        e.preventDefault();
        tagHolePointTabCrossing(from, first, first);
        holdExitHop(from, first, list);
        return;
      }
      if (shouldTabToSameHoleFirstPoint(from, false)) {
        const first = pickSameHoleFirstPointTabTarget(from);
        if (!first) return;
        e.preventDefault();
        tagHolePointTabCrossing(from, first, first);
        focusHold(first, "[data-point-list]", from);
        return;
      }
      if (shouldTabFromLastHoleHeaderToNextFirstX(from, false)) {
        const nextX = pickNextHoleFirstPointXFromHeaderTabTarget(from);
        if (!nextX) return;
        e.preventDefault();
        tagHolePointTabCrossing(from, nextX, nextX);
        focusHold(nextX, "[data-point-list]", from);
        return;
      }
      if (shouldTabFromLastHoleHeaderToNextFirstY(from, false)) {
        const nextY = pickNextHoleFirstPointYFromHeaderTabTarget(from);
        if (!nextY) return;
        e.preventDefault();
        tagHolePointTabCrossing(from, nextY, nextY);
        focusHold(nextY, "[data-point-list]", from);
        return;
      }
      if (shouldTabFromLastHoleHeaderToNextHeader(from, false)) {
        const nextHeader = pickNextHoleHeaderFromHeaderTabTarget(from);
        if (!nextHeader) return;
        e.preventDefault();
        tagHoleHeaderTabCrossing(from, nextHeader, nextHeader);
        focusHold(nextHeader, "[data-hole-list]", from);
        return;
      }
      const nextHole = pickNextHoleTabTarget(from) ?? pickNextHolePointTabTarget(from) ?? pickSameHoleLastPointTabTarget(from);
      if (nextHole && (shouldHoldHoleListScroll(from) || shouldHoldPointListScroll(from))) {
        e.preventDefault();
        tagHolePointTabCrossing(from, nextHole, nextHole);
        focusHold(nextHole, "[data-point-list]", from);
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, []);

  const activeOuter = hit && hit.hole == null ? hit.index : -1;

  return (
    <Section title="Path">
      <div data-path-inspector className="space-y-2">
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            data-path-exit="Closed"
            className={cn(
              "h-8 rounded-[8px] px-2 text-[10px]",
              node.closed ? "bg-phosphor/15 text-phosphor" : "border border-border text-ink-dim",
            )}
            onClick={() => setPathClosed(node.id, !node.closed)}
          >
            {node.closed ? "Closed" : "Open"}
          </button>
          <button
            type="button"
            data-path-exit="Offset"
            className="h-8 rounded-[8px] border border-border px-2 text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
            onClick={() => offsetSelectedPath("out")}
          >
            Offset
          </button>
          <button
            type="button"
            data-path-exit="Outline"
            className="h-8 rounded-[8px] border border-border px-2 text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
            onClick={() => outlineSelectedStroke()}
          >
            Outline
          </button>
          <button
            type="button"
            data-path-exit="Round"
            className="h-8 rounded-[8px] border border-border px-2 text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
            onClick={() => roundSelectedPathCorners()}
          >
            Round
          </button>
          <button
            type="button"
            data-path-exit="Simplify"
            className="h-8 rounded-[8px] border border-border px-2 text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
            onClick={() => simplifySelectedPath()}
          >
            Simplify
          </button>
        </div>
        <div ref={pointListRef} data-point-list className="max-h-56 space-y-1 overflow-auto scrollbar-thin">
          {node.points.map((pt, i) => (
            <PointRow key={`p-${i}`} nodeId={node.id} index={i} point={pt} active={activeOuter === i} />
          ))}
        </div>
        {holes.length > 0 && (
          <div ref={holeListRef} data-hole-list className="max-h-48 space-y-2 overflow-auto scrollbar-thin">
            {holes.map((ring, h) => (
              <div key={`h-${h}`} className="space-y-1 rounded-[8px] border border-border p-1.5">
                <div className="flex items-center justify-between gap-1">
                  <button
                    type="button"
                    data-select-hole={h}
                    className="text-left text-[10px] text-ink"
                    onClick={() => selectPathHole(h)}
                  >
                    Hole {h + 1}
                  </button>
                  <button
                    type="button"
                    data-hole-fill
                    className="text-[10px] text-ink-dim"
                    onClick={() =>
                      setHoleFillRule(node.id, h, holeFillRule(node, h) === "evenodd" ? "nonzero" : "evenodd")
                    }
                  >
                    {holeFillRule(node, h)}
                  </button>
                  <button
                    type="button"
                    data-delete-hole
                    className="text-[10px] text-ink-dim"
                    onClick={() => deletePathHole(node.id, h)}
                  >
                    Delete
                  </button>
                </div>
                {ring.map((pt, i) => (
                  <PointRow
                    key={`h-${h}-${i}`}
                    nodeId={node.id}
                    index={i}
                    point={pt}
                    hole={h}
                    active={hit?.hole === h && hit.index === i}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
