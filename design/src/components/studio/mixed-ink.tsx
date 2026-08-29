import { useDesign } from "@/lib/design/store";
import type { DesignNode } from "@/lib/design/types";
import { cn } from "@/lib/utils";

function fillKey(fill: DesignNode["fill"]): string {
  if (typeof fill === "string") return fill;
  return `g:${fill.angle}:${fill.stops.map((s) => `${s.offset}:${s.color}`).join("|")}`;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export function MixedInk({
  nodes,
  brandColors,
  ink,
}: {
  nodes: DesignNode[];
  brandColors: { name: string; hex: string }[];
  ink: string;
}) {
  const updateNodes = useDesign((s) => s.updateNodes);
  const ids = nodes.map((n) => n.id);
  const fills = unique(nodes.map((n) => fillKey(n.fill)));
  const strokes = unique(nodes.map((n) => n.stroke));
  const widths = unique(nodes.map((n) => n.strokeWidth));
  const opacities = unique(nodes.map((n) => Math.round(n.opacity * 100)));
  const mixedFill = fills.length > 1;
  const mixedStroke = strokes.length > 1;
  const mixedWidth = widths.length > 1;
  const mixedOpacity = opacities.length > 1;
  const firstSolid = (() => {
    const f = nodes[0]?.fill;
    if (typeof f === "string" && f !== "transparent") return f;
    if (f && typeof f !== "string") return f.stops[0]?.color ?? ink;
    return ink;
  })();
  const firstStroke = nodes[0]?.stroke === "transparent" ? "#3fc6ff" : (nodes[0]?.stroke ?? ink);
  const firstWidth = nodes[0]?.strokeWidth ?? 0;
  const firstOpacity = nodes[0]?.opacity ?? 1;

  return (
    <section className="border-b border-border py-3">
      <div className="mb-2 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">
        Selection · {nodes.length} layers
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-[10px] text-ink-dim">
          Mixed ink writes the same fill, stroke, or opacity onto every selected layer.
        </p>
        <label className="block text-[11px] text-ink-dim">
          <span className="mb-1 block">{mixedFill ? "Fill · mixed" : "Fill"}</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              className={cn(
                "h-8 flex-1 rounded-[8px] border border-border bg-surface-alt",
                mixedFill && "opacity-70",
              )}
              value={firstSolid}
              onChange={(e) => updateNodes(ids, { fill: e.target.value }, true)}
            />
            {mixedFill && (
              <span className="font-mono text-[10px] text-phosphor">{fills.length} values</span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {brandColors.map((c) => (
              <button
                key={c.hex}
                type="button"
                className="size-6 rounded-full border border-border"
                style={{ background: c.hex }}
                onClick={() => updateNodes(ids, { fill: c.hex }, true)}
                aria-label={c.name}
                title={c.name}
              />
            ))}
          </div>
        </label>
        <label className="block text-[11px] text-ink-dim">
          <span className="mb-1 block">{mixedStroke ? "Stroke · mixed" : "Stroke"}</span>
          <div className="flex gap-2">
            <input
              type="color"
              className={cn("h-8 flex-1 rounded-[8px] border border-border", mixedStroke && "opacity-70")}
              value={firstStroke}
              onChange={(e) =>
                updateNodes(ids, { stroke: e.target.value, strokeWidth: Math.max(firstWidth, 1) }, true)
              }
            />
            <input
              className="field w-16 font-mono"
              type="number"
              min={0}
              value={mixedWidth ? "" : firstWidth}
              placeholder="—"
              onChange={(e) => updateNodes(ids, { strokeWidth: Number(e.target.value) }, true)}
            />
          </div>
        </label>
        <label className="block text-[11px] text-ink-dim">
          <span className="mb-1 block">
            {mixedOpacity ? "Opacity · mixed" : `Opacity ${Math.round(firstOpacity * 100)}%`}
          </span>
          <input
            type="range"
            className="range-phosphor w-full"
            min={0}
            max={1}
            step={0.01}
            value={firstOpacity}
            onChange={(e) => updateNodes(ids, { opacity: Number(e.target.value) })}
          />
        </label>
        <button
          type="button"
          className="h-8 rounded-[8px] border border-phosphor/40 text-[10px] text-phosphor hover:bg-phosphor/10"
          onClick={() => updateNodes(ids, { fill: ink }, true)}
        >
          Fill all with ink
        </button>
      </div>
    </section>
  );
}
