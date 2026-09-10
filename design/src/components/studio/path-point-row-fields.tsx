import { useRef } from "react";
import {
  nextPathAxis,
  pathTabExitsAtEdge,
  pickNextHoleHeaderTabTarget,
  pickPrevHoleHeaderTabTarget,
  pickSameHoleHeaderTabTarget,
  shouldShiftTabToPrevHoleHeader,
  shouldShiftTabToSameHoleHeader,
  shouldTabToNextHoleHeader,
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
        <NumField className="field font-mono text-[11px]" value={point.x} aria-label={`point ${index + 1} x`} data-path-axis="x" onFocus={revealAndSelect} onCommit={(n) => { revealAndSelect(); setPathPointPosition(nodeId, index, n, point.y, hole); }} />
        <NumField className="field font-mono text-[11px]" value={point.y} aria-label={`point ${index + 1} y`} data-path-axis="y" onFocus={revealAndSelect} onCommit={(n) => { revealAndSelect(); setPathPointPosition(nodeId, index, point.x, n, hole); }} />
      </div>
    </div>
  );
}
