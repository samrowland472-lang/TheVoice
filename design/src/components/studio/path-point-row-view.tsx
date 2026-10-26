import { type KeyboardEvent } from "react";
import { useDesign } from "@/lib/design/store";
import { setPathEditHit, setPathPointPosition, setPathPointHandles, setPathPointSmooth, deletePathPoint } from "@/lib/design/path-actions";
import { mirrorHandle } from "@/lib/design/path-curve";
import {
  pickNextHoleFirstPointXTabTarget,
  pickNextHoleHeaderTabTarget,
  pickOffsetTabTarget,
  pickOutlineTabTarget,
  pickPrevHoleHeaderTabTarget,
  pickPrevHoleLastPointXTabTarget,
  pickPrevHoleLastPointYTabTarget,
  pickLastHoleLastPointYTabTarget,
  pickLastHoleLastPointXTabTarget,
  pickLastHoleHeaderTabTarget,
  shouldShiftTabFromNextHoleFirstYToLastHoleY,
  shouldShiftTabFromNextHoleFirstXToLastHoleY,
  shouldShiftTabFromNextHoleFirstXToLastHoleX,
  shouldShiftTabFromNextHoleFirstYToLastHoleX,
  shouldShiftTabFromNextHoleFirstYToLastHoleHeader,
  shouldShiftTabFromNextHoleFirstXToLastHoleHeader,
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
  shouldTabFromLastOuterYToFirstHoleX,
  shouldTabFromLastOuterYToFirstHoleY,
  shouldTabFromLastOuterYToFirstHoleHeader,
  shouldTabFromLastOuterXToFirstHoleHeader,
  shouldTabFromLastOuterXToFirstHoleY,
  shouldTabFromLastOuterXToFirstHoleX,
  shouldShiftTabFromFirstHoleXToLastOuterY,
  shouldShiftTabFromFirstHoleXToLastOuterX,
  shouldShiftTabFromFirstHoleYToLastOuterX,
  shouldShiftTabFromFirstHoleYToLastOuterY,
  pickLastOuterLastPointYTabTarget,
  pickLastOuterLastPointXTabTarget,
  pickFirstHoleFirstPointXTabTarget,
  pickFirstHoleFirstPointYTabTarget,
  pickFirstHoleHeaderTabTarget,
  shouldTabToNextHoleHeader,
  tagHolePointTabCrossing,
  focusHoldEl,
} from "@/lib/design/path-point-tab";
import { pickClosedTabTarget } from "@/lib/design/path-point-tab-closed";
import type { PathPoint } from "@/lib/design/types";
import { cn } from "@/lib/utils";
import { NumField } from "./num-field";

function focusPrevHoleLastY(from: HTMLElement): boolean {
  if (
    !shouldShiftTabFromNextHoleFirstYToLastHoleY(from, true) &&
    !shouldShiftTabFromNextHoleFirstXToLastHoleY(from, true) &&
    !shouldShiftTabFromFirstHoleYToPrevLastY(from, true) &&
    !shouldShiftTabFromFirstHoleXToPrevLastY(from, true)
  ) return false;
  const lastY = pickLastHoleLastPointYTabTarget(from) ?? pickPrevHoleLastPointYTabTarget(from);
  if (!lastY) return false;
  tagHolePointTabCrossing(from, lastY, lastY);
  focusHoldEl(lastY, from);
  return true;
}

function focusPrevHoleLastX(from: HTMLElement): boolean {
  if (
    !shouldShiftTabFromNextHoleFirstYToLastHoleX(from, true) &&
    !shouldShiftTabFromNextHoleFirstXToLastHoleX(from, true) &&
    !shouldShiftTabFromFirstHoleXToPrevLastX(from, true) &&
    !shouldShiftTabFromFirstHoleYToPrevLastX(from, true)
  ) return false;
  const lastX = pickLastHoleLastPointXTabTarget(from) ?? pickPrevHoleLastPointXTabTarget(from);
  if (!lastX) return false;
  tagHolePointTabCrossing(from, lastX, lastX);
  focusHoldEl(lastX, from);
  return true;
}

function focusPrevHoleLastHeader(from: HTMLElement): boolean {
  if (
    !shouldShiftTabFromNextHoleFirstYToLastHoleHeader(from, true) &&
    !shouldShiftTabFromNextHoleFirstXToLastHoleHeader(from, true)
  ) return false;
  const header = pickLastHoleHeaderTabTarget(from);
  if (!header) return false;
  tagHolePointTabCrossing(from, header, header);
  focusHoldEl(header, from);
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

function focusFirstHoleFirstX(from: HTMLElement): boolean {
  if (!shouldTabFromLastOuterYToFirstHoleX(from, false) && !shouldTabFromLastOuterXToFirstHoleX(from, false)) return false;
  const firstX = pickFirstHoleFirstPointXTabTarget(from);
  if (!firstX) return false;
  tagHolePointTabCrossing(from, firstX, firstX);
  focusHoldEl(firstX, from);
  return true;
}

function focusFirstHoleFirstY(from: HTMLElement): boolean {
  if (!shouldTabFromLastOuterXToFirstHoleY(from, false) && !shouldTabFromLastOuterYToFirstHoleY(from, false)) return false;
  const firstY = pickFirstHoleFirstPointYTabTarget(from);
  if (!firstY) return false;
  tagHolePointTabCrossing(from, firstY, firstY);
  focusHoldEl(firstY, from);
  return true;
}

function focusFirstHoleHeader(from: HTMLElement): boolean {
  if (
    !shouldTabFromLastOuterYToFirstHoleHeader(from, false) &&
    !shouldTabFromLastOuterXToFirstHoleHeader(from, false)
  ) return false;
  const header = pickFirstHoleHeaderTabTarget(from);
  if (!header) return false;
  tagHolePointTabCrossing(from, header, header);
  focusHoldEl(header, from);
  return true;
}

function focusLastOuterLastY(from: HTMLElement): boolean {
  if (!shouldShiftTabFromFirstHoleXToLastOuterY(from, true) && !shouldShiftTabFromFirstHoleYToLastOuterY(from, true)) return false;
  const lastY = pickLastOuterLastPointYTabTarget(from);
  if (!lastY) return false;
  tagHolePointTabCrossing(from, lastY, lastY);
  focusHoldEl(lastY, from);
  return true;
}

function focusLastOuterLastX(from: HTMLElement): boolean {
  if (!shouldShiftTabFromFirstHoleXToLastOuterX(from, true) && !shouldShiftTabFromFirstHoleYToLastOuterX(from, true)) return false;
  const lastX = pickLastOuterLastPointXTabTarget(from);
  if (!lastX) return false;
  tagHolePointTabCrossing(from, lastX, lastX);
  focusHoldEl(lastX, from);
  return true;
}

export function PointRow({
  nodeId, index, point, hole, active,
}: {
  nodeId: string; index: number; point: PathPoint; hole?: number; active?: boolean;
}) {
  const key = hole == null ? `path-${index}` : `hole-${hole}-${index}`;
  const label = hole == null ? `point ${index + 1}` : `hole ${hole + 1} point ${index + 1}`;
  const mirrorKey = `${nodeId}:${hole ?? ""}:${index}`;
  const mirror = useDesign((s) => !!(s.mirrorPoints && s.mirrorPoints[mirrorKey]));
  const setMirrorPoint = useDesign((s) => s.setMirrorPoint);
  const showTangentLengths = useDesign((s) => s.showTangentLengths);
  const setShowTangentLengths = useDesign((s) => s.setShowTangentLengths);

  function highlightArm(arm: "in" | "out" | "anchor") {
    setPathEditHit({ index, arm, hole });
  }

  function commitHandle(
    arm: "in" | "out",
    axis: "x" | "y",
    n: number,
  ) {
    const cur = arm === "in" ? (point.in ?? { x: 0, y: 0 }) : (point.out ?? { x: 0, y: 0 });
    const next = { ...cur, [axis]: n };
    if (mirror) {
      const mirrored = mirrorHandle(next);
      if (arm === "in") {
        setPathPointHandles(nodeId, index, { in: next, out: mirrored }, hole);
      } else {
        setPathPointHandles(nodeId, index, { out: next, in: mirrored }, hole);
      }
    } else {
      setPathPointHandles(nodeId, index, arm === "in" ? { in: next } : { out: next }, hole);
    }
    highlightArm(arm);
  }

  function toggleMirror() {
    const next = !mirror;
    setMirrorPoint(mirrorKey, next);
    if (!next) return;
    const src = point.in ?? point.out;
    if (!src) return;
    const mirrored = mirrorHandle(src);
    if (point.in) {
      setPathPointHandles(nodeId, index, { out: mirrored }, hole);
    } else if (point.out) {
      setPathPointHandles(nodeId, index, { in: mirrored }, hole);
    }
    highlightArm("anchor");
  }
  const onAxis = (e: KeyboardEvent<HTMLInputElement>, axis: "x" | "y") => {
    if (e.key !== "Tab") return;
    const from = e.currentTarget;
    if (e.shiftKey) {
      if (focusLastOuterLastY(from)) { e.preventDefault(); return; }
      if (focusLastOuterLastX(from)) { e.preventDefault(); return; }
      if (focusPrevHoleLastY(from)) { e.preventDefault(); return; }
      if (focusPrevHoleLastX(from)) { e.preventDefault(); return; }
      if (focusPrevHoleLastHeader(from)) { e.preventDefault(); return; }
      if (shouldShiftTabToSameHoleHeader(from, true)) {
        const header = pickSameHoleHeaderTabTarget(from);
        if (header) { e.preventDefault(); tagHolePointTabCrossing(e.currentTarget, header, header); focusHoldEl(header, from); return; }
      }
      if (shouldShiftTabToPrevHoleHeader(from, true)) {
        const header = pickPrevHoleHeaderTabTarget(from);
        if (header) { e.preventDefault(); tagHolePointTabCrossing(e.currentTarget, header, header); focusHoldEl(header, from); return; }
      }
      if (shouldShiftTabFromFirstOuterToOutline(from, true)) {
        const outline = pickOutlineTabTarget(from);
        if (outline) { e.preventDefault(); tagHolePointTabCrossing(e.currentTarget, outline, outline); focusHoldEl(outline, from); return; }
      }
      if (shouldShiftTabFromFirstOuterToOffset(from, true)) {
        const offset = pickOffsetTabTarget(from);
        if (offset) { e.preventDefault(); tagHolePointTabCrossing(e.currentTarget, offset, offset); focusHoldEl(offset, from); return; }
      }
      if (shouldShiftTabFromFirstOuterToClosed(from, true)) {
        const closed = pickClosedTabTarget(from);
        if (closed) { e.preventDefault(); tagHolePointTabCrossing(e.currentTarget, closed, closed); focusHoldEl(closed, from); return; }
      }
      if (shouldShiftTabFromFirstOuterToRound(from, true)) {
        const round = pickRoundTabTarget(from);
        if (round) { e.preventDefault(); tagHolePointTabCrossing(e.currentTarget, round, round); focusHoldEl(round, from); return; }
      }
      if (shouldShiftTabFromFirstOuterToSimplify(from, true)) {
        const simplify = pickSimplifyTabTarget(from);
        if (simplify) { e.preventDefault(); tagHolePointTabCrossing(e.currentTarget, simplify, simplify); focusHoldEl(simplify, from); return; }
      }
      return;
    }
    if (focusNextHoleFirstY(from)) { e.preventDefault(); return; }
    if (focusNextHoleFirstX(from)) { e.preventDefault(); return; }
    if (focusFirstHoleFirstY(from)) { e.preventDefault(); return; }
    if (focusFirstHoleFirstX(from)) { e.preventDefault(); return; }
    if (shouldTabFromLastOuterYToFirstHoleHeader(from, false) || shouldTabFromLastOuterXToFirstHoleHeader(from, false)) {
      const header = pickFirstHoleHeaderTabTarget(from);
      if (header) {
        e.preventDefault();
        tagHolePointTabCrossing(e.currentTarget, header, header);
        focusHoldEl(header, from);
        return;
      }
    }
    if (focusFirstHoleHeader(from)) { e.preventDefault(); return; }
    if (axis === "x" && shouldTabFromLastHoleXToNextHeader(from, false)) {
      const header = pickNextHoleHeaderTabTarget(from);
      if (header) { e.preventDefault(); tagHolePointTabCrossing(e.currentTarget, header, header); focusHoldEl(header, from); return; }
    }
    if (axis === "y" && shouldTabToNextHoleHeader(from, false)) {
      const header = pickNextHoleHeaderTabTarget(from);
      if (header) { e.preventDefault(); tagHolePointTabCrossing(e.currentTarget, header, header); focusHoldEl(header, from); return; }
    }
  };
  const hasHandles = Boolean(point.in || point.out);
  return (
    <div data-point={key} className={cn("rounded-[8px] border px-2 py-1.5", active ? "border-phosphor/60 bg-phosphor/10" : "border-border")}>
      <button type="button" className="mb-1 flex w-full items-center justify-between text-left text-[10px] text-ink-dim" onClick={() => setPathEditHit({ index, arm: "anchor", hole })}>
        <span className="font-mono text-ink">{String(index + 1).padStart(2, "0")}</span>
        <span>{hole == null ? "outer" : `hole ${hole + 1}`} · {point.smooth === false ? "corner" : "smooth"}</span>
      </button>
      <div className="grid grid-cols-2 gap-1">
        <NumField className="field font-mono" value={Math.round(point.x)} aria-label={`${label} x`} data-path-axis="x" onFocus={() => setPathEditHit({ index, arm: "anchor", hole })} onCommit={(n) => setPathPointPosition(nodeId, index, n, point.y, hole)} onKeyDown={(e) => onAxis(e, "x")} />
        <NumField className="field font-mono" value={Math.round(point.y)} aria-label={`${label} y`} data-path-axis="y" onFocus={() => setPathEditHit({ index, arm: "anchor", hole })} onCommit={(n) => setPathPointPosition(nodeId, index, point.x, n, hole)} onKeyDown={(e) => onAxis(e, "y")} />
      </div>
      {hasHandles && (
        <div className="mt-1 space-y-1 text-[9px] text-ink-dim">
          <div className="font-mono uppercase tracking-wide">Handles</div>
          <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-1">
            <span className="font-mono">In</span>
            <NumField
              className="field font-mono text-[11px]"
              value={Math.round(point.in?.x ?? 0)}
              aria-label={`${label} in x`}
              tabIndex={-1}
              onFocus={() => highlightArm("in")}
              onCommit={(n) => commitHandle("in", "x", n)}
            />
            <NumField
              className="field font-mono text-[11px]"
              value={Math.round(point.in?.y ?? 0)}
              aria-label={`${label} in y`}
              tabIndex={-1}
              onFocus={() => highlightArm("in")}
              onCommit={(n) => commitHandle("in", "y", n)}
            />
          </div>
          <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-1">
            <span className="font-mono">Out</span>
            <NumField
              className="field font-mono text-[11px]"
              value={Math.round(point.out?.x ?? 0)}
              aria-label={`${label} out x`}
              tabIndex={-1}
              onFocus={() => highlightArm("out")}
              onCommit={(n) => commitHandle("out", "x", n)}
            />
            <NumField
              className="field font-mono text-[11px]"
              value={Math.round(point.out?.y ?? 0)}
              aria-label={`${label} out y`}
              tabIndex={-1}
              onFocus={() => highlightArm("out")}
              onCommit={(n) => commitHandle("out", "y", n)}
            />
          </div>
        </div>
      )}
      <div className="mt-1 flex gap-1">
        <button type="button" tabIndex={-1} className={cn("h-7 flex-1 rounded-[8px] text-[10px]", point.smooth !== false ? "bg-phosphor/15 text-phosphor" : "border border-border text-ink-dim")} aria-label={`${label} smooth`} onClick={() => setPathPointSmooth(nodeId, index, true, hole)}>Smooth</button>
        <button type="button" tabIndex={-1} className={cn("h-7 flex-1 rounded-[8px] text-[10px]", point.smooth === false ? "bg-phosphor/15 text-phosphor" : "border border-border text-ink-dim")} aria-label={`${label} corner`} onClick={() => setPathPointSmooth(nodeId, index, false, hole)}>Corner</button>
        <button type="button" tabIndex={-1} className={cn("h-7 flex-1 rounded-[8px] text-[10px]", mirror ? "bg-phosphor/15 text-phosphor" : "border border-border text-ink-dim")} aria-label={`${label} mirror handles`} aria-pressed={mirror} title="Mirror in/out handles (remembered for this point)" onClick={toggleMirror}>Mirror</button>
        <button type="button" tabIndex={-1} className={cn("h-7 flex-1 rounded-[8px] text-[10px]", showTangentLengths ? "bg-phosphor/15 text-phosphor" : "border border-border text-ink-dim")} aria-label="show tangent lengths" aria-pressed={showTangentLengths} title="Show live tangent length numbers on the canvas" onClick={() => setShowTangentLengths(!showTangentLengths)}>Len</button>
        <button type="button" tabIndex={-1} className="h-7 rounded-[8px] border border-border px-2 text-[10px] text-ink-dim hover:border-phosphor hover:text-ink" aria-label={`${label} delete`} onClick={() => deletePathPoint(nodeId, index, hole)}>Del</button>
      </div>
    </div>
  );
}
