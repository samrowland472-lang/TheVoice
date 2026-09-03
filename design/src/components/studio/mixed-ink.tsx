import { useDesign } from "@/lib/design/store";
import type { BlendMode, DesignNode, Shadow } from "@/lib/design/types";
import { cn } from "@/lib/utils";

const BLENDS: BlendMode[] = [
  "source-over",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "soft-light",
];

const DEFAULT_SHADOW: Shadow = { color: "#000000", blur: 28, ox: 0, oy: 18 };

function shadowKey(shadow: Shadow | null): string {
  if (!shadow) return "off";
  return `on:${shadow.color}:${shadow.blur}:${shadow.ox}:${shadow.oy}`;
}

function fillKey(fill: DesignNode["fill"]): string {
  if (typeof fill === "string") return fill;
  return `g:${fill.angle}:${fill.stops.map((s) => `${s.offset}:${s.color}`).join("|")}`;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function solidOf(fill: DesignNode["fill"], fallback: string): string {
  if (typeof fill === "string" && fill !== "transparent") return fill;
  if (fill && typeof fill !== "string") return fill.stops[0]?.color ?? fallback;
  return fallback;
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
  const blends = unique(nodes.map((n) => n.blend));
  const shadows = unique(nodes.map((n) => shadowKey(n.shadow)));
  const mixedFill = fills.length > 1;
  const mixedStroke = strokes.length > 1;
  const mixedWidth = widths.length > 1;
  const mixedOpacity = opacities.length > 1;
  const mixedBlend = blends.length > 1;
  const mixedShadow = shadows.length > 1;
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
          Mixed ink writes fill, stroke, opacity, blend, and shadow onto every selected layer.
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
          {mixedFill && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {nodes.map((n) => {
                const hex = solidOf(n.fill, ink);
                return (
                  <button
                    key={n.id}
                    type="button"
                    className="size-6 rounded-full border border-phosphor/50"
                    style={{ background: hex }}
                    title={`Unify with ${n.name || n.kind}`}
                    aria-label={`Unify fill with ${n.name || n.kind}`}
                    onClick={() => updateNodes(ids, { fill: n.fill }, true)}
                  />
                );
              })}
            </div>
          )}
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
          {mixedStroke && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {nodes.map((n) => (
                <button
                  key={`stroke-${n.id}`}
                  type="button"
                  className="size-6 rounded-full border border-phosphor/50"
                  style={{
                    background: n.stroke === "transparent" ? "transparent" : n.stroke,
                    boxShadow: n.stroke === "transparent" ? "inset 0 0 0 1px rgba(63,198,255,0.45)" : undefined,
                  }}
                  title={`Unify stroke with ${n.name || n.kind}`}
                  aria-label={`Unify stroke with ${n.name || n.kind}`}
                  onClick={() =>
                    updateNodes(ids, { stroke: n.stroke, strokeWidth: Math.max(n.strokeWidth, firstWidth) }, true)
                  }
                />
              ))}
            </div>
          )}
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
            aria-label="selection opacity"
            value={firstOpacity}
            onChange={(e) => updateNodes(ids, { opacity: Number(e.target.value) })}
            onPointerUp={() => useDesign.getState().commit()}
          />
        </label>
        <label className="block text-[11px] text-ink-dim">
          <span className="mb-1 block">{mixedBlend ? "Blend · mixed" : "Blend"}</span>
          <select
            className={cn("field", mixedBlend && "opacity-70")}
            aria-label={mixedBlend ? "selection blend mixed" : "selection blend"}
            value={mixedBlend ? "" : (nodes[0]?.blend ?? "source-over")}
            onChange={(e) => updateNodes(ids, { blend: e.target.value as BlendMode }, true)}
          >
            {mixedBlend && <option value="">mixed</option>}
            {BLENDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-ink-dim">
              {mixedShadow ? "Shadow · mixed" : nodes.some((n) => n.shadow) ? "Shadow" : "Shadow · off"}
            </span>
            <button
              type="button"
              className="text-[10px] text-phosphor"
              onClick={() => {
                const anyOn = nodes.some((n) => n.shadow);
                updateNodes(ids, { shadow: anyOn ? null : DEFAULT_SHADOW }, true);
              }}
            >
              {nodes.every((n) => n.shadow) ? "Clear all" : "Add all"}
            </button>
          </div>
          {mixedShadow && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {nodes.map((n) => (
                <button
                  key={`sh-${n.id}`}
                  type="button"
                  className="h-6 rounded-full border border-phosphor/50 px-2 font-mono text-[9px] text-phosphor"
                  title={`Unify shadow with ${n.name || n.kind}`}
                  aria-label={`Unify shadow with ${n.name || n.kind}`}
                  onClick={() => updateNodes(ids, { shadow: n.shadow }, true)}
                >
                  {n.shadow ? n.shadow.color : "off"}
                </button>
              ))}
            </div>
          )}
          {nodes[0]?.shadow && !mixedShadow && (
            <div className="mt-2 flex flex-col gap-2">
              <input
                type="color"
                className="h-8 w-full rounded-[8px] border border-border"
                value={nodes[0].shadow.color}
                aria-label="selection shadow color"
                onChange={(e) =>
                  updateNodes(ids, { shadow: { ...nodes[0].shadow!, color: e.target.value } }, true)
                }
              />
              <label className="block text-[11px] text-ink-dim">
                <span className="mb-1 block">Blur {nodes[0].shadow.blur}</span>
                <input
                  type="range"
                  className="range-phosphor w-full"
                  min={0}
                  max={80}
                  aria-label="selection shadow blur"
                  value={nodes[0].shadow.blur}
                  onChange={(e) =>
                    updateNodes(ids, { shadow: { ...nodes[0].shadow!, blur: Number(e.target.value) } })
                  }
                  onPointerUp={() => useDesign.getState().commit()}
                />
              </label>
              <label className="block text-[11px] text-ink-dim">
                <span className="mb-1 block">Y {nodes[0].shadow.oy}</span>
                <input
                  type="range"
                  className="range-phosphor w-full"
                  min={-40}
                  max={40}
                  aria-label="selection shadow y"
                  value={nodes[0].shadow.oy}
                  onChange={(e) =>
                    updateNodes(ids, { shadow: { ...nodes[0].shadow!, oy: Number(e.target.value) } })
                  }
                  onPointerUp={() => useDesign.getState().commit()}
                />
              </label>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            className="h-8 rounded-[8px] border border-phosphor/40 text-[10px] text-phosphor hover:bg-phosphor/10"
            onClick={() => updateNodes(ids, { fill: ink }, true)}
          >
            Fill all with ink
          </button>
          <button
            type="button"
            className="h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
            onClick={() => updateNodes(ids, { stroke: "transparent", strokeWidth: 0 }, true)}
          >
            Clear strokes
          </button>
        </div>
      </div>
    </section>
  );
}
