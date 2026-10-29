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
import type { PathNode, PathPoint } from "@/lib/design/types";
import { mirrorHandle } from "@/lib/design/path-curve";
import { cn } from "@/lib/utils";
import { Section } from "./inspector-parts";
import { NumField } from "./num-field";
import { PointRow } from "./path-point-row";


function collectHandleLengths(pts: PathPoint[]): number[] {
  const lengths: number[] = [];
  for (const p of pts) {
    if (p.in) lengths.push(Math.hypot(p.in.x, p.in.y));
    if (p.out) lengths.push(Math.hypot(p.out.x, p.out.y));
  }
  return lengths;
}

function avgHandleLength(node: PathNode): number {
  const lengths = [
    ...collectHandleLengths(node.points),
    ...(node.holes ?? []).flatMap(collectHandleLengths),
  ];
  if (lengths.length === 0) return 0;
  return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
}

function avgHandleLengthForSelected(node: PathNode, selected: { index: number; hole?: number }[]): number {
  const lengths: number[] = [];
  for (const sel of selected) {
    const pts = sel.hole == null ? node.points : (node.holes?.[sel.hole] ?? []);
    const p = pts[sel.index];
    if (!p) continue;
    if (p.in) lengths.push(Math.hypot(p.in.x, p.in.y));
    if (p.out) lengths.push(Math.hypot(p.out.x, p.out.y));
  }
  if (lengths.length === 0) return 0;
  return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
}

function avgHandleLengthForRing(node: PathNode, hole: number | null): number {
  const pts = hole == null ? node.points : (node.holes?.[hole] ?? []);
  const lengths = collectHandleLengths(pts);
  if (lengths.length === 0) return 0;
  return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
}

function bulkSetHandleLength(node: PathNode, target: number, scope: "all" | "outer" | number | { index: number; hole?: number }[] = "all") {
  const len = Math.max(0, Math.round(target));
  const s = useDesign.getState();
  const mirrorPoints = s.mirrorPoints ?? {};
  const applyToRing = (pts: PathPoint[], hole?: number, onlyIndices?: Set<number>) =>
    pts.map((p, index) => {
      if (onlyIndices && !onlyIndices.has(index)) return p;
      const mirrorKey = `${node.id}:${hole ?? ""}:${index}`;
      const mir = !!mirrorPoints[mirrorKey];
      const scaleOrSeed = (h: { x: number; y: number } | null | undefined) => {
        if (!h || Math.hypot(h.x, h.y) < 0.001) return { x: len, y: 0 };
        const cur = Math.hypot(h.x, h.y);
        const scale = len / cur;
        return { x: h.x * scale, y: h.y * scale };
      };
      let nextIn = p.in;
      let nextOut = p.out;
      if (mir) {
        const src = p.in || p.out;
        const seeded = scaleOrSeed(src);
        nextIn = seeded;
        nextOut = mirrorHandle(seeded);
      } else {
        if (p.in) nextIn = scaleOrSeed(p.in);
        if (p.out) nextOut = scaleOrSeed(p.out);
        if (!p.in && !p.out && len > 0) {
          nextIn = { x: len, y: 0 };
          nextOut = { x: -len, y: 0 };
        }
      }
      return { ...p, in: nextIn, out: nextOut };
    });
  if (Array.isArray(scope)) {
    const byHole = new Map<number | null, Set<number>>();
    for (const p of scope) {
      const h = p.hole ?? null;
      if (!byHole.has(h)) byHole.set(h, new Set());
      byHole.get(h)!.add(p.index);
    }
    const nextPoints = byHole.has(null) ? applyToRing(node.points, undefined, byHole.get(null)) : node.points;
    const nextHoles = (node.holes ?? []).map((ring, h) =>
      byHole.has(h) ? applyToRing(ring, h, byHole.get(h)) : ring
    );
    s.commit();
    s.replaceNode(node.id, { ...node, points: nextPoints, holes: nextHoles.length ? nextHoles : node.holes }, false);
    return;
  }
  const applyOuter = scope === "all" || scope === "outer";
  const nextPoints = applyOuter ? applyToRing(node.points) : node.points;
  const nextHoles = (node.holes ?? []).map((ring, h) => {
    const apply = scope === "all" || scope === h;
    return apply ? applyToRing(ring, h) : ring;
  });
  s.commit();
  s.replaceNode(node.id, { ...node, points: nextPoints, holes: nextHoles.length ? nextHoles : node.holes }, false);
}

export function PathFields({ node }: { node: PathNode }) {
  const pointListRef = useRef<HTMLDivElement>(null);
  const holeListRef = useRef<HTMLDivElement>(null);
  const hit = useDesign((s) => s.pathEditHit);
  const pointSel = useDesign((s) => s.pathPointSelection ?? []);
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

  useEffect(() => {
    if (pointSel.length < 2) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown" && e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const step = e.shiftKey ? 10 : 1;
      const dir = e.key === "ArrowUp" || e.key === "ArrowRight" ? 1 : -1;
      const cur = avgHandleLengthForSelected(node, pointSel);
      const next = Math.max(0, cur + dir * step);
      bulkSetHandleLength(node, next, pointSel);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [pointSel, node]);

  const activeOuter = hit && hit.hole == null ? hit.index : -1;
  const isSelected = (index: number, hole?: number) =>
    pointSel.some((p) => p.index === index && (p.hole ?? null) === (hole ?? null));

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
        <div className="flex items-center gap-2 text-[10px] text-ink-dim">
          <span title="Average length of all existing handles">All</span>
          <span className="font-mono text-phosphor tabular-nums">{avgHandleLength(node)}</span>
          <span title="Set every handle length to this value. Direction is preserved; zero handles seed a horizontal arm. Mirror is honored.">
            <NumField
              className="field font-mono text-[11px] w-14"
              value={avgHandleLength(node)}
              min={0}
              aria-label="bulk handle length all"
              onCommit={(n) => bulkSetHandleLength(node, n)}
            />
          </span>
          <span className="text-[9px] text-ink-dim/70">bulk</span>
        </div>
        {pointSel.length > 1 && (
          <div className="flex items-center gap-2 text-[10px] text-ink-dim">
            <span title="Average length of handles on multi-selected points (Shift-click points to select). Arrow keys nudge bulk length by 1 (Shift for 10) when not typing.">Sel</span>
            <span className="font-mono text-phosphor tabular-nums">{avgHandleLengthForSelected(node, pointSel)}</span>
            <span title="Set handle lengths on the selected points only. Direction is preserved; zero handles seed a horizontal arm. Mirror is honored. Shift-click points to multi-select. Arrow keys nudge the bulk length by 1 (Shift for 10).">
              <NumField
                className="field font-mono text-[11px] w-14"
                value={avgHandleLengthForSelected(node, pointSel)}
                min={0}
                aria-label="bulk handle length selected"
                onCommit={(n) => bulkSetHandleLength(node, n, pointSel)}
              />
            </span>
            <span className="text-[9px] text-phosphor/80">{pointSel.length}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-[10px] text-ink-dim">
          <span title="Average length of outer path handles">Outer</span>
          <span className="font-mono text-phosphor tabular-nums">{avgHandleLengthForRing(node, null)}</span>
          <span title="Set outer path handle lengths. Direction is preserved; zero handles seed a horizontal arm. Mirror is honored.">
            <NumField
              className="field font-mono text-[11px] w-14"
              value={avgHandleLengthForRing(node, null)}
              min={0}
              aria-label="bulk handle length outer"
              onCommit={(n) => bulkSetHandleLength(node, n, "outer")}
            />
          </span>
          <span className="text-[9px] text-ink-dim/70">ring</span>
        </div>
        <div ref={pointListRef} data-point-list className="max-h-56 space-y-1 overflow-auto scrollbar-thin">
          {node.points.map((pt, i) => (
            <PointRow key={`p-${i}`} nodeId={node.id} index={i} point={pt} active={activeOuter === i || isSelected(i)} />
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
                  <span className="font-mono text-[10px] text-phosphor tabular-nums" title="Average handle length for this hole">
                    {avgHandleLengthForRing(node, h)}
                  </span>
                  <span title="Set this hole's handle lengths. Direction is preserved; zero handles seed a horizontal arm. Mirror is honored.">
                    <NumField
                      className="field font-mono text-[11px] w-12"
                      value={avgHandleLengthForRing(node, h)}
                      min={0}
                      aria-label={`bulk handle length hole ${h + 1}`}
                      onCommit={(n) => bulkSetHandleLength(node, n, h)}
                    />
                  </span>
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
                    active={hit?.hole === h && hit.index === i || isSelected(i, h)}
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
