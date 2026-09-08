import { useRef } from "react";
import {
  tagHolePointTabCrossing,
  labelPathInspectorControl,
  nextPathAxis,
  pathInspectorExitStatus,
  pathTabExitsAtEdge,
  pickPathInspectorExitTarget,
  pickNextHoleHeaderTabTarget,
  pickSameHoleHeaderTabTarget,
  pickRoundTabTarget,
  pickSimplifyTabTarget,
  shouldShiftTabFromFirstOuterToRound,
  shouldShiftTabFromFirstOuterToSimplify,
  shouldShiftTabToSameHoleHeader,
  shouldTabToNextHoleHeader,
} from "@/lib/design/path-point-tab";
import { holdStudioStatus, releaseStudioStatus } from "@/lib/design/studio-status";
import {
  deletePathPoint,
  selectPathPoint,
  setPathPointPosition,
  setPathPointSmooth,
} from "@/lib/design/path-actions";
import type { PathPoint } from "@/lib/design/types";
import { cn } from "@/lib/utils";
import { NumField } from "./num-field";

function ringLabel(hole?: number) {
  return hole == null ? "Path" : `Hole ${hole + 1}`;
}

function pathListRows(from: HTMLElement) {
  const row = from.closest("[data-point]");
  const list = row?.parentElement;
  if (!(row instanceof HTMLElement) || !list) return null;
  const rows = [...list.querySelectorAll<HTMLElement>(":scope > [data-point]")];
  const i = rows.indexOf(row);
  if (i < 0) return null;
  return { row, list, rows, index: i };
}

const FOCUSABLE =
  'input:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])';

function isShown(el: HTMLElement) {
  return el.offsetParent !== null || el === document.activeElement;
}

function focusOutsidePathList(from: HTMLElement, shift: boolean) {
  const ctx = pathListRows(from);
  if (!ctx) return false;
  const panel = from.closest("[data-path-inspector]");
  const scope = panel instanceof HTMLElement ? panel : document.body;
  const inspector = [...scope.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(isShown);
  const listMembers = new Set(
    inspector.filter((el) => ctx.list.contains(el)),
  );
  const target = pickPathInspectorExitTarget(inspector, listMembers, from, shift);
  if (!target || ctx.list.contains(target)) {
    from.blur();
    return true;
  }
  target.focus();
  if (target instanceof HTMLInputElement) target.select();
  const label = labelPathInspectorControl(target);
  holdStudioStatus(pathInspectorExitStatus(label));
  return true;
}

function focusPathCoord(from: HTMLElement, neighbor: -1 | 0 | 1, axis: "x" | "y") {
  const ctx = pathListRows(from);
  if (!ctx) return false;
  const nextIndex = ctx.index + neighbor;
  if (neighbor !== 0 && (nextIndex < 0 || nextIndex >= ctx.rows.length)) return false;
  const target = neighbor === 0 ? ctx.row : ctx.rows[nextIndex];
  const input = target?.querySelector(`input[data-path-axis="${axis}"]`);
  if (input instanceof HTMLInputElement) {
    const list = from.closest("[data-point-list]");
    const saved = list instanceof HTMLElement ? list.scrollTop : 0;
    const crossing = tagHolePointTabCrossing(from, target, input);
    input.focus();
    input.select();
    if (crossing && list instanceof HTMLElement) {
      list.scrollTop = saved;
      requestAnimationFrame(() => {
        list.scrollTop = saved;
      });
    }
    return true;
  }
  return false;
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
    releaseStudioStatus();
    selectPathPoint(index, hole);
    const row = rowRef.current;
    if (row?.hasAttribute("data-hole-point")) return;
    row?.scrollIntoView({ block: "nearest", inline: "nearest" });
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
        tabIndex={-1}
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
          data-path-axis="x"
          onFocus={revealAndSelect}
          onKeyDown={(e) => {
            if (e.key !== "Tab") return;
            if (shouldShiftTabFromFirstOuterToRound(e.currentTarget, e.shiftKey)) {
              const round = pickRoundTabTarget(e.currentTarget);
              if (round) {
                const list = e.currentTarget.closest("[data-point-list]");
                const saved = list instanceof HTMLElement ? list.scrollTop : 0;
                e.preventDefault();
                tagHolePointTabCrossing(e.currentTarget, round, round);
                round.focus();
                if (list instanceof HTMLElement) {
                  list.scrollTop = saved;
                  requestAnimationFrame(() => {
                    list.scrollTop = saved;
                  });
                }
                return;
              }
            }
            if (shouldShiftTabFromFirstOuterToSimplify(e.currentTarget, e.shiftKey)) {
              const simplify = pickSimplifyTabTarget(e.currentTarget);
              if (simplify) {
                const list = e.currentTarget.closest("[data-point-list]");
                const saved = list instanceof HTMLElement ? list.scrollTop : 0;
                e.preventDefault();
                tagHolePointTabCrossing(e.currentTarget, simplify, simplify);
                simplify.focus();
                if (list instanceof HTMLElement) {
                  list.scrollTop = saved;
                  requestAnimationFrame(() => {
                    list.scrollTop = saved;
                  });
                }
                return;
              }
            }
            if (shouldShiftTabToSameHoleHeader(e.currentTarget, e.shiftKey)) {
              const header = pickSameHoleHeaderTabTarget(e.currentTarget);
              if (header) {
                const list = e.currentTarget.closest("[data-point-list]");
                const saved = list instanceof HTMLElement ? list.scrollTop : 0;
                e.preventDefault();
                tagHolePointTabCrossing(e.currentTarget, header, header);
                header.focus();
                if (list instanceof HTMLElement) {
                  list.scrollTop = saved;
                  requestAnimationFrame(() => {
                    list.scrollTop = saved;
                  });
                }
                return;
              }
            }
            const ctx = pathListRows(e.currentTarget);
            if (ctx && pathTabExitsAtEdge(ctx.index, ctx.rows.length, "x", e.shiftKey)) {
              if (focusOutsidePathList(e.currentTarget, e.shiftKey)) e.preventDefault();
              return;
            }
            const step = nextPathAxis("x", e.shiftKey);
            if (focusPathCoord(e.currentTarget, step.neighbor, step.axis)) e.preventDefault();
          }}
          onCommit={(n) => {
            revealAndSelect();
            setPathPointPosition(nodeId, index, n, point.y, hole);
          }}
        />
        <NumField
          className="field font-mono text-[11px]"
          value={point.y}
          aria-label={`point ${index + 1} y`}
          data-path-axis="y"
          onFocus={revealAndSelect}
          onKeyDown={(e) => {
            if (e.key !== "Tab") return;
            if (shouldTabToNextHoleHeader(e.currentTarget, e.shiftKey)) {
              const header = pickNextHoleHeaderTabTarget(e.currentTarget);
              if (header) {
                const list = e.currentTarget.closest("[data-point-list]");
                const saved = list instanceof HTMLElement ? list.scrollTop : 0;
                e.preventDefault();
                tagHolePointTabCrossing(e.currentTarget, header, header);
                header.focus();
                if (list instanceof HTMLElement) {
                  list.scrollTop = saved;
                  requestAnimationFrame(() => {
                    list.scrollTop = saved;
                  });
                }
                return;
              }
            }
            const ctx = pathListRows(e.currentTarget);
            if (ctx && pathTabExitsAtEdge(ctx.index, ctx.rows.length, "y", e.shiftKey)) {
              if (focusOutsidePathList(e.currentTarget, e.shiftKey)) e.preventDefault();
              return;
            }
            const step = nextPathAxis("y", e.shiftKey);
            if (focusPathCoord(e.currentTarget, step.neighbor, step.axis)) e.preventDefault();
          }}
          onCommit={(n) => {
            revealAndSelect();
            setPathPointPosition(nodeId, index, point.x, n, hole);
          }}
        />
      </div>
      <div className="mt-1 flex gap-1">
        <button
          type="button"
          tabIndex={-1}
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
          tabIndex={-1}
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
          tabIndex={-1}
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

export { PointRow };
