import { useRef } from "react";
import { nextPathAxis } from "@/lib/design/path-point-tab";
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

function focusPathCoord(from: HTMLElement, neighbor: -1 | 0 | 1, axis: "x" | "y") {
  const row = from.closest("[data-point]");
  const list = row?.parentElement;
  if (!(row instanceof HTMLElement) || !list) return false;
  const rows = [...list.querySelectorAll<HTMLElement>(":scope > [data-point]")];
  const i = rows.indexOf(row);
  const target = neighbor === 0 ? row : rows[i + neighbor];
  const input = target?.querySelector(`input[data-path-axis="${axis}"]`);
  if (input instanceof HTMLInputElement) {
    input.focus();
    input.select();
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
