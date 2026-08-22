import { BRUSHES } from "@/lib/design/brushes";
import { useDesign } from "@/lib/design/store";
import { cn } from "@/lib/utils";

export function PaintDock() {
  const tool = useDesign((s) => s.tool);
  const brush = useDesign((s) => s.brush);
  const setBrush = useDesign((s) => s.setBrush);

  if (tool !== "brush" && tool !== "eraser") return null;

  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-border bg-surface px-3 py-2">
      <div className="flex gap-1 overflow-x-auto">
        {BRUSHES.filter((b) => (tool === "eraser" ? b.id === "eraser" : b.id !== "eraser")).map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setBrush({ id: b.id })}
            className={cn(
              "h-8 rounded-[8px] px-3 text-xs",
              brush.id === b.id ? "bg-phosphor text-phosphor-ink" : "text-ink-dim hover:bg-surface-alt hover:text-ink",
            )}
          >
            {b.name}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-[11px] text-ink-dim">
        Size {brush.size}
        <input
          type="range"
          className="range-phosphor w-24"
          min={2}
          max={120}
          value={brush.size}
          onChange={(e) => setBrush({ size: Number(e.target.value) })}
        />
      </label>
      <label className="flex items-center gap-2 text-[11px] text-ink-dim">
        Flow {Math.round(brush.opacity * 100)}
        <input
          type="range"
          className="range-phosphor w-20"
          min={0.05}
          max={1}
          step={0.05}
          value={brush.opacity}
          onChange={(e) => setBrush({ opacity: Number(e.target.value) })}
        />
      </label>
      <label className="flex items-center gap-2 text-[11px] text-ink-dim">
        Mirror
        <select
          className="h-8 rounded-[8px] border border-border bg-surface-alt px-2 text-xs text-ink"
          value={brush.symmetry}
          onChange={(e) => setBrush({ symmetry: e.target.value as typeof brush.symmetry })}
        >
          <option value="none">Off</option>
          <option value="x">Vertical</option>
          <option value="y">Horizontal</option>
          <option value="xy">Quad</option>
          <option value="radial">Radial</option>
        </select>
      </label>
    </div>
  );
}
