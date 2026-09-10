import type { KeyboardEvent } from "react";
import { setPathEditHit, setPathPointPosition } from "@/lib/design/path-actions";
import {
  pickNextHoleFirstPointXTabTarget,
  pickNextHoleHeaderTabTarget,
  pickOffsetTabTarget,
  pickOutlineTabTarget,
  pickPrevHoleHeaderTabTarget,
  pickPrevHoleLastPointXTabTarget,
  pickPrevHoleLastPointYTabTarget,
  pickRoundTabTarget,
  pickSameHoleHeaderTabTarget,
  pickSimplifyTabTarget,
  shouldShiftTabFromFirstHoleXToPrevLastX,
  shouldShiftTabFromFirstHoleXToPrevLastY,
  shouldShiftTabFromFirstHoleYToPrevLastX,
  shouldShiftTabFromFirstHoleYToPrevLastY,
  shouldShiftTabFromFirstOuterToClosed,
  shouldShiftTabFromFirstOuterToOffset,
  shouldShiftTabFromFirstOuterToOutline,
  shouldShiftTabFromFirstOuterToRound,
  shouldShiftTabFromFirstOuterToSimplify,
  shouldShiftTabToPrevHoleHeader,
  shouldShiftTabToSameHoleHeader,
  pickNextHoleFirstPointYTabTarget,
  shouldTabFromLastHoleXToNextFirstX,
  shouldTabFromLastHoleXToNextFirstY,
  shouldTabFromLastHoleXToNextHeader,
  shouldTabFromLastHoleYToNextFirstX,
  shouldTabFromLastHoleYToNextFirstY,
  shouldTabToNextHoleHeader,
  tagHolePointTabCrossing,
} from "@/lib/design/path-point-tab";
import { pickClosedTabTarget } from "@/lib/design/path-point-tab-closed";
import type { PathPoint } from "@/lib/design/types";
import { cn } from "@/lib/utils";
import { NumField } from "./num-field";

function restoreListScroll(list: Element | null | undefined, saved: number) {
  if (!(list instanceof HTMLElement)) return;
  list.scrollTop = saved;
  requestAnimationFrame(() => {
    list.scrollTop = saved;
    requestAnimationFrame(() => {
      list.scrollTop = saved;
    });
  });
}

function snapshotLists(from: Element) {
  const inspector = from.closest("[data-path-inspector]");
  const points = from.closest("[data-point-list]") ?? inspector?.querySelector("[data-point-list]");
  const holes = inspector?.querySelector("[data-hole-list]");
  return {
    points,
    holes,
    ps: points instanceof HTMLElement ? points.scrollTop : 0,
    hs: holes instanceof HTMLElement ? holes.scrollTop : 0,
  };
}

function focusHoldEl(el: HTMLElement, from: Element) {
  const snap = snapshotLists(from);
  el.focus({ preventScroll: true });
  if (el instanceof HTMLInputElement) el.select();
  restoreListScroll(snap.points, snap.ps);
  restoreListScroll(snap.holes, snap.hs);
}

function focusPrevHoleLastY(from: HTMLElement): boolean {
  if (!shouldShiftTabFromFirstHoleYToPrevLastY(from, true) && !shouldShiftTabFromFirstHoleXToPrevLastY(from, true)) return false;
  const lastY = pickPrevHoleLastPointYTabTarget(from);
  if (!lastY) return false;
  tagHolePointTabCrossing(from, lastY, lastY);
  focusHoldEl(lastY, from);
  return true;
}

function focusPrevHoleLastX(from: HTMLElement): boolean {
  if (!shouldShiftTabFromFirstHoleXToPrevLastX(from, true) && !shouldShiftTabFromFirstHoleYToPrevLastX(from, true)) return false;
  const lastX = pickPrevHoleLastPointXTabTarget(from);
  if (!lastX) return false;
  tagHolePointTabCrossing(from, lastX, lastX);
  focusHoldEl(lastX, from);
  return true;
}

function focusNextHoleFirstY(from: HTMLElement): boolean {
  if (!shouldTabFromLastHoleYToNextFirstY(from, false) && !shouldTabFromLastHoleXToNextFirstY(from, false)) return false;
  const nextY = pickNextHoleFirstPointYTabTarget(from);
  if (!nextY) return false;
  tagHolePointTabCrossing(from, nextY, nextY);
  focusHoldEl(nextY, from);
  return true;
}

function focusNextHoleFirstX(from: HTMLElement): boolean {
  if (!shouldTabFromLastHoleXToNextFirstX(from, false) && !shouldTabFromLastHoleYToNextFirstX(from, false)) return false;
  const nextX = pickNextHoleFirstPointXTabTarget(from);
  if (!nextX) return false;
  tagHolePointTabCrossing(from, nextX, nextX);
  focusHoldEl(nextX, from);
  return true;
}

export function PointRow({
  nodeId, index, point, hole, active,
}: {
  nodeId: string; index: number; point: PathPoint; hole?: number; active?: boolean;
}) {
  const key = hole == null ? `path-${index}` : `hole-${hole}-${index}`;
  const label = hole == null ? `point ${index + 1}` : `hole ${hole + 1} point ${index + 1}`;
  const onAxis = (e: KeyboardEvent<HTMLInputElement>, axis: "x" | "y") => {
    if (e.key !== "Tab") return;
    const from = e.currentTarget;
    if (e.shiftKey) {
      if (focusPrevHoleLastY(from)) { e.preventDefault(); return; }
      if (focusPrevHoleLastX(from)) { e.preventDefault(); return; }
      if (shouldShiftTabToSameHoleHeader(from, true)) {
        const header = pickSameHoleHeaderTabTarget(from);
        if (header) { e.preventDefault(); tagHolePointTabCrossing(e.currentTarget, header, header); header.focus({ preventScroll: true }); return; }
      }
      if (shouldShiftTabToPrevHoleHeader(from, true)) {
        const header = pickPrevHoleHeaderTabTarget(from);
        if (header) { e.preventDefault(); tagHolePointTabCrossing(e.currentTarget, header, header); header.focus({ preventScroll: true }); return; }
      }
      if (shouldShiftTabFromFirstOuterToOutline(from, true)) {
        const outline = pickOutlineTabTarget(from);
        if (outline) { e.preventDefault(); tagHolePointTabCrossing(e.currentTarget, outline, outline); outline.focus({ preventScroll: true }); return; }
      }
      if (shouldShiftTabFromFirstOuterToOffset(from, true)) {
        const offset = pickOffsetTabTarget(from);
        if (offset) { e.preventDefault(); tagHolePointTabCrossing(e.currentTarget, offset, offset); offset.focus({ preventScroll: true }); return; }
      }
      if (shouldShiftTabFromFirstOuterToClosed(from, true)) {
        const closed = pickClosedTabTarget(from);
        if (closed) { e.preventDefault(); tagHolePointTabCrossing(e.currentTarget, closed, closed); closed.focus({ preventScroll: true }); return; }
      }
      if (shouldShiftTabFromFirstOuterToRound(from, true)) {
        const round = pickRoundTabTarget(from);
        if (round) { e.preventDefault(); tagHolePointTabCrossing(e.currentTarget, round, round); round.focus({ preventScroll: true }); return; }
      }
      if (shouldShiftTabFromFirstOuterToSimplify(from, true)) {
        const simplify = pickSimplifyTabTarget(from);
        if (simplify) { e.preventDefault(); tagHolePointTabCrossing(e.currentTarget, simplify, simplify); simplify.focus({ preventScroll: true }); return; }
      }
      return;
    }
    if (focusNextHoleFirstY(from)) { e.preventDefault(); return; }
    if (focusNextHoleFirstX(from)) { e.preventDefault(); return; }
    if (axis === "x" && shouldTabFromLastHoleXToNextHeader(from, false)) {
      const header = pickNextHoleHeaderTabTarget(from);
      if (header) { e.preventDefault(); tagHolePointTabCrossing(e.currentTarget, header, header); header.focus({ preventScroll: true }); }
    }
    if (axis === "y" && shouldTabToNextHoleHeader(from, false)) {
      const header = pickNextHoleHeaderTabTarget(from);
      if (header) { e.preventDefault(); tagHolePointTabCrossing(e.currentTarget, header, header); header.focus({ preventScroll: true }); }
    }
  };
  return (
    <div data-point={key} className={cn("rounded-[8px] border px-2 py-1.5", active ? "border-phosphor/60 bg-phosphor/10" : "border-border")}>
      <button type="button" className="mb-1 flex w-full items-center justify-between text-left text-[10px] text-ink-dim" onClick={() => setPathEditHit({ index, arm: "anchor", hole })}>
        <span className="font-mono text-ink">{String(index + 1).padStart(2, "0")}</span>
        <span>{hole == null ? "outer" : `hole ${hole + 1}`}</span>
      </button>
      <div className="grid grid-cols-2 gap-1">
        <NumField className="field font-mono" value={Math.round(point.x)} aria-label={`${label} x`} data-path-axis="x" onFocus={() => setPathEditHit({ index, arm: "anchor", hole })} onCommit={(n) => setPathPointPosition(nodeId, index, n, point.y, hole)} onKeyDown={(e) => onAxis(e, "x")} />
        {/* focusPrevHoleLastY focusPrevHoleLastX */}
        <NumField className="field font-mono" value={Math.round(point.y)} aria-label={`${label} y`} data-path-axis="y" onFocus={() => setPathEditHit({ index, arm: "anchor", hole })} onCommit={(n) => setPathPointPosition(nodeId, index, point.x, n, hole)} onKeyDown={(e) => onAxis(e, "y")} />
      </div>
    </div>
  );
}
