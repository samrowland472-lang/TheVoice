import { useRef } from "react";
import {
  tagHolePointTabCrossing,
  pickPrevHoleLastPointXTabTarget,
  shouldShiftTabFromFirstHoleXToPrevLastX,
} from "@/lib/design/path-point-tab";
import { releaseStudioStatus } from "@/lib/design/studio-status";
import {
  deletePathPoint,
  selectPathPoint,
  setPathPointPosition,
  setPathPointSmooth,
} from "@/lib/design/path-actions";
import type { PathPoint } from "@/lib/design/types";
import { cn } from "@/lib/utils";
import { NumField } from "./num-field";

function focusPrevHoleLastX(from: HTMLElement) {
  if (!shouldShiftTabFromFirstHoleXToPrevLastX(from, true)) return false;
  const lastX = pickPrevHoleLastPointXTabTarget(from);
  if (!lastX) return false;
  const list = from.closest("[data-point-list]");
  const saved = list instanceof HTMLElement ? list.scrollTop : 0;
  tagHolePointTabCrossing(from, lastX, lastX);
  lastX.focus({ preventScroll: true });
  if (lastX instanceof HTMLInputElement) lastX.select();
  if (list instanceof HTMLElement) {
    list.scrollTop = saved;
    requestAnimationFrame(() => {
      list.scrollTop = saved;
      requestAnimationFrame(() => {
        list.scrollTop = saved;
      });
    });
  }
  return true;
}

export function PointRow({
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
      <button type="button" tabIndex={-1} className="mb-1 flex w-full items-center justify-between text-left" aria-label={`select point ${index + 1}`} onClick={() => revealAndSelect()}>
        <span className="font-mono text-[10px] text-ink-dim">{hole == null ? "Path" : `Hole ${hole + 1}`} · {index + 1}</span>
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
            if (e.shiftKey && focusPrevHoleLastX(e.currentTarget)) {
              e.preventDefault();
            }
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
          onCommit={(n) => {
            revealAndSelect();
            setPathPointPosition(nodeId, index, point.x, n, hole);
          }}
        />
      </div>
      <div className="mt-1 flex gap-1">
        <button type="button" tabIndex={-1} className={cn("h-7 flex-1 rounded-[8px] text-[10px]", point.smooth !== false ? "bg-phosphor/15 text-phosphor" : "border border-border text-ink-dim")} aria-label={`smooth point ${index + 1}`} onClick={() => setPathPointSmooth(nodeId, index, true, hole)}>Smooth</button>
        <button type="button" tabIndex={-1} className={cn("h-7 flex-1 rounded-[8px] text-[10px]", point.smooth === false ? "bg-phosphor/15 text-phosphor" : "border border-border text-ink-dim")} aria-label={`corner point ${index + 1}`} onClick={() => setPathPointSmooth(nodeId, index, false, hole)}>Corner</button>
        <button type="button" tabIndex={-1} className="h-7 rounded-[8px] border border-border px-2 text-[10px] text-ink-dim hover:border-phosphor hover:text-ink" aria-label={`delete point ${index + 1}`} onClick={() => deletePathPoint(nodeId, index, hole)}>Del</button>
      </div>
    </div>
  );
}
