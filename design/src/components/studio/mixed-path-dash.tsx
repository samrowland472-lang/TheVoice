import {
  capChipLabel,
  dashChipLabel,
  dashOffsetChipLabel,
  headScaleChipLabel,
  joinChipLabel,
  miterChipLabel,
  sidesChipLabel,
  strokeRhythmChipLabel,
} from "@/lib/design/geometry-chips";
import { setStudioStatus } from "@/lib/design/studio-status";
import { useDesign } from "@/lib/design/store";
import type { DesignNode } from "@/lib/design/types";
import { cn } from "@/lib/utils";
import { Field } from "./inspector-parts";
import { NumField } from "./num-field";

const WIDTH_PRESETS = [
  { id: 1, label: "Hair" },
  { id: 2, label: "Fine" },
  { id: 4, label: "Medium" },
  { id: 8, label: "Bold" },
] as const;
const WIDTH_NUMERIC = [0.5, 1.5, 3, 6] as const;
const OFFSET_NUMERIC = [0, 2, 4, 8, -4] as const;
const CAPS: CanvasLineCap[] = ["butt", "round", "square"];
const JOINS: CanvasLineJoin[] = ["miter", "round", "bevel"];
const OUTLINE_KINDS = new Set(["path", "rect", "ellipse", "line", "polygon", "star", "arrow"]);

function dashKey(n: DesignNode) {
  return Math.round((n.strokeDash ?? 0) * 100) / 100;
}

function widthKey(n: DesignNode) {
  return Math.round((n.strokeWidth ?? 0) * 100) / 100;
}

function offsetKey(n: DesignNode) {
  return Math.round((n.strokeDashOffset ?? 0) * 100) / 100;
}

function miterKey(n: DesignNode) {
  return Math.round((n.miterLimit ?? 4) * 100) / 100;
}

function chipClass() {
  return "flex h-6 items-center rounded-full border border-phosphor/40 bg-surface-alt px-1.5 font-mono text-[8px] text-phosphor max-w-[120px] truncate";
}

function ghostStroke(
  patch: {
    strokeWidth?: number;
    lineCap?: CanvasLineCap;
    lineJoin?: CanvasLineJoin;
    strokeDash?: number;
    strokeDashOffset?: number;
    miterLimit?: number;
    sides?: number;
    headScale?: number;
  } | null,
) {
  useDesign.getState().setStrokeGhost(patch);
}

function CapIcon({ cap }: { cap: CanvasLineCap }) {
  const common = "stroke-phosphor fill-none";
  if (cap === "round") {
    return (
      <svg width="16" height="8" viewBox="0 0 16 8" className={common} aria-hidden>
        <line x1="2" y1="4" x2="14" y2="4" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }
  if (cap === "square") {
    return (
      <svg width="16" height="8" viewBox="0 0 16 8" className={common} aria-hidden>
        <line x1="2" y1="4" x2="14" y2="4" strokeWidth="3" strokeLinecap="square" />
      </svg>
    );
  }
  return (
    <svg width="16" height="8" viewBox="0 0 16 8" className={common} aria-hidden>
      <line x1="3" y1="4" x2="13" y2="4" strokeWidth="3" strokeLinecap="butt" />
    </svg>
  );
}

function JoinIcon({ join }: { join: CanvasLineJoin }) {
  const common = "stroke-phosphor fill-none";
  if (join === "round") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" className={common} aria-hidden>
        <path d="M2 12 L7 2 L12 12" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
    );
  }
  if (join === "bevel") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" className={common} aria-hidden>
        <path d="M2 12 L7 2 L12 12" strokeWidth="2.5" strokeLinejoin="bevel" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className={common} aria-hidden>
      <path d="M2 12 L7 2 L12 12" strokeWidth="2.5" strokeLinejoin="miter" />
    </svg>
  );
}


export function capLegendEntries(outlines: DesignNode[]) {
  const map = new Map<CanvasLineCap, number>();
  for (const n of outlines) {
    const id = n.lineCap ?? "round";
    map.set(id, (map.get(id) ?? 0) + 1);
  }
  return CAPS.filter((id) => map.has(id)).map((id) => ({
    id,
    label: capChipLabel(id),
    count: map.get(id) ?? 0,
  }));
}

export function joinLegendEntries(outlines: DesignNode[]) {
  const map = new Map<CanvasLineJoin, number>();
  for (const n of outlines) {
    const id = n.lineJoin ?? "round";
    map.set(id, (map.get(id) ?? 0) + 1);
  }
  return JOINS.filter((id) => map.has(id)).map((id) => ({
    id,
    label: joinChipLabel(id),
    count: map.get(id) ?? 0,
  }));
}

/** Compact unique-cap legend. Click unifies the selection to that cap. */
export function MixedCapLegend({ outlines }: { outlines: DesignNode[] }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  const ids = outlines.map((n) => n.id);
  const entries = capLegendEntries(outlines);
  if (entries.length < 2) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1" aria-label="mixed line cap legend">
      {entries.map(({ id, label, count }) => (
        <button
          key={id}
          type="button"
          className="flex h-7 items-center gap-1.5 rounded-full border border-phosphor/40 bg-surface-alt px-2 font-mono text-[8px] text-phosphor hover:bg-phosphor/10"
          title={`Unify line cap to ${label} · ${count} layer${count === 1 ? "" : "s"}`}
          aria-label={`Set line cap to ${label}`}
          onMouseEnter={() => ghostStroke({ lineCap: id })}
          onFocus={() => ghostStroke({ lineCap: id })}
          onMouseLeave={() => ghostStroke(null)}
          onBlur={() => ghostStroke(null)}
          onClick={() => updateNodes(ids, { lineCap: id }, true)}
        >
          <CapIcon cap={id} />
          <span>{label}</span>
          <span className="rounded-full bg-phosphor/20 px-1 text-phosphor/90">{count}</span>
        </button>
      ))}
    </div>
  );
}

/** Compact unique-join legend. Click unifies the selection to that join. */
export function MixedJoinLegend({ outlines }: { outlines: DesignNode[] }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  const ids = outlines.map((n) => n.id);
  const entries = joinLegendEntries(outlines);
  if (entries.length < 2) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1" aria-label="mixed line join legend">
      {entries.map(({ id, label, count }) => (
        <button
          key={id}
          type="button"
          className="flex h-7 items-center gap-1.5 rounded-full border border-phosphor/40 bg-surface-alt px-2 font-mono text-[8px] text-phosphor hover:bg-phosphor/10"
          title={`Unify line join to ${label} · ${count} layer${count === 1 ? "" : "s"}`}
          aria-label={`Set line join to ${label}`}
          onMouseEnter={() => ghostStroke({ lineJoin: id })}
          onFocus={() => ghostStroke({ lineJoin: id })}
          onMouseLeave={() => ghostStroke(null)}
          onBlur={() => ghostStroke(null)}
          onClick={() => updateNodes(ids, { lineJoin: id }, true)}
        >
          <JoinIcon join={id} />
          <span>{label}</span>
          <span className="rounded-full bg-phosphor/20 px-1 text-phosphor/90">{count}</span>
        </button>
      ))}
    </div>
  );
}



export function MixedPathDash({ nodes }: { nodes: DesignNode[] }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  const outlines = nodes.filter((n) => OUTLINE_KINDS.has(n.kind));
  if (outlines.length < 1) return null;
  const ids = outlines.map((n) => n.id);
  const mixed = new Set(outlines.map(dashKey)).size > 1;
  const mixedWidth = new Set(outlines.map(widthKey)).size > 1;
  const mixedOffset = new Set(outlines.map(offsetKey)).size > 1;
  const mixedCap = new Set(outlines.map((n) => n.lineCap ?? "round")).size > 1;
  const mixedJoin = new Set(outlines.map((n) => n.lineJoin ?? "round")).size > 1;
  const mixedMiter = new Set(outlines.map(miterKey)).size > 1;
  const mixedRhythm = mixed || mixedCap || mixedJoin;
  const first = outlines[outlines.length - 1]!;
  const value = first.strokeDash ?? 0;
  const width = first.strokeWidth ?? 1;
  const offset = first.strokeDashOffset ?? 0;
  const cap = first.lineCap ?? "round";
  const join = first.lineJoin ?? "round";
  const miter = first.miterLimit ?? 4;

  const polygons = outlines.filter((n) => n.kind === "polygon" || n.kind === "star");
  const arrows = outlines.filter((n) => n.kind === "arrow");
  const polyIds = polygons.map((n) => n.id);
  const arrowIds = arrows.map((n) => n.id);
  const mixedSides =
    polygons.length > 1 &&
    new Set(polygons.map((n) => Math.max(3, Math.round(("sides" in n ? n.sides : undefined) ?? 5)))).size > 1;
  const mixedHead =
    arrows.length > 1 &&
    new Set(arrows.map((n) => Math.round((("headScale" in n ? n.headScale : undefined) ?? 1) * 100) / 100)).size > 1;
  const sidesValue = Math.max(3, Math.round(("sides" in first ? first.sides : undefined) ?? 5));
  const headValue = ("headScale" in first ? first.headScale : undefined) ?? 1;

  return (
    <section className="border-b border-border py-3">
      <div className="mb-2 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">
        Stroke · {outlines.length}
      </div>
      <p className="mb-2 text-[10px] text-ink-dim">
        Width, dash, cap, join, miter, sides, and arrow head write onto selected outlines — paths, rectangles, ellipses, lines,
        polygons, stars, and arrows. Scrub any of those for a live phosphor overlay. Zero dash is a solid stroke. A chip stamps that outline’s
        values onto the rest of the pick.
      </p>
      <Field label={mixedWidth ? "Width · mixed" : `Width ${Math.round(width)}`}>
        <div className="flex items-center gap-2">
          <input
            type="range"
            className={cn("range-phosphor min-w-0 flex-1", mixedWidth && "opacity-70")}
            min={0}
            max={48}
            step={1}
            aria-label={mixedWidth ? "path stroke width mixed" : "path stroke width"}
            value={mixedWidth ? 0 : width}
            onChange={(e) => {
              const v = Number(e.target.value);
              updateNodes(ids, { strokeWidth: v });
              ghostStroke({ strokeWidth: v });
            }}
            onPointerDown={() => useDesign.getState().setStrokeWidthScrubId(first.id)}
            onPointerUp={() => {
              useDesign.getState().setStrokeWidthScrubId(null);
              useDesign.getState().commit();
              ghostStroke(null);
            }}
            onPointerCancel={() => useDesign.getState().setStrokeWidthScrubId(null)}
            onLostPointerCapture={() => useDesign.getState().setStrokeWidthScrubId(null)}
          />
          <NumField
            className="field w-16 font-mono"
            value={width}
            mixed={mixedWidth}
            min={0}
            max={96}
            aria-label="path stroke width"
            onCommit={(n) => updateNodes(ids, { strokeWidth: n }, true)}
          />
        </div>
      </Field>
      <div className="mt-1 flex flex-wrap gap-1" aria-label="stroke width presets">
        {WIDTH_PRESETS.map((preset) => {
          const active = !mixedWidth && Math.abs(width - preset.id) < 0.05;
          return (
            <button
              key={preset.id}
              type="button"
              className={cn(
                "flex h-7 items-center gap-1 rounded border px-2 text-[10px] transition-colors",
                active
                  ? "border-phosphor bg-phosphor/15 text-phosphor"
                  : "border-border text-ink-dim hover:bg-surface hover:text-ink",
              )}
              title={`Apply ${preset.label} stroke width (${preset.id}) to selected outlines`}
              aria-label={`Apply ${preset.label} stroke width`}
              aria-pressed={active}
              onClick={() => {
                updateNodes(ids, { strokeWidth: preset.id }, true);
                ghostStroke(null);
                setStudioStatus(`Width · ${preset.label}`);
              }}
              onMouseEnter={() => ghostStroke({ strokeWidth: preset.id })}
              onMouseLeave={() => ghostStroke(null)}
              onFocus={() => ghostStroke({ strokeWidth: preset.id })}
              onBlur={() => ghostStroke(null)}
            >
              <span className="font-mono">{preset.id}</span>
              <span>{preset.label}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-1 flex flex-wrap gap-1" aria-label="stroke width numeric chips">
        {WIDTH_NUMERIC.map((w) => {
          const active = !mixedWidth && Math.abs(width - w) < 0.05;
          return (
            <button
              key={w}
              type="button"
              className={cn(
                "flex h-7 items-center justify-center rounded border px-2 font-mono text-[10px] transition-colors",
                active
                  ? "border-phosphor bg-phosphor/15 text-phosphor"
                  : "border-border text-ink-dim hover:bg-surface hover:text-ink",
              )}
              title={`Apply stroke width ${w} to selected outlines`}
              aria-label={`Apply stroke width ${w}`}
              aria-pressed={active}
              onClick={() => {
                updateNodes(ids, { strokeWidth: w }, true);
                ghostStroke(null);
                setStudioStatus(`Width · ${w}`);
              }}
              onMouseEnter={() => ghostStroke({ strokeWidth: w })}
              onMouseLeave={() => ghostStroke(null)}
              onFocus={() => ghostStroke({ strokeWidth: w })}
              onBlur={() => ghostStroke(null)}
            >
              {w}
            </button>
          );
        })}
      </div>
      <Field label={mixed ? "Dash · mixed" : `Dash ${Math.round(value)}`}>
        <div className="flex items-center gap-2">
          <input
            type="range"
            className={cn("range-phosphor min-w-0 flex-1", mixed && "opacity-70")}
            min={0}
            max={48}
            step={1}
            aria-label={mixed ? "path stroke dash mixed" : "path stroke dash"}
            value={mixed ? 0 : value}
            onChange={(e) => {
              const v = Number(e.target.value);
              updateNodes(ids, { strokeDash: v });
              ghostStroke({ strokeDash: v });
            }}
            onPointerDown={() => useDesign.getState().setStrokeDashScrubId(first.id)}
            onPointerUp={() => {
              useDesign.getState().setStrokeDashScrubId(null);
              useDesign.getState().commit();
              ghostStroke(null);
            }}
            onPointerCancel={() => useDesign.getState().setStrokeDashScrubId(null)}
            onLostPointerCapture={() => useDesign.getState().setStrokeDashScrubId(null)}
          />
          <NumField
            className="field w-16 font-mono"
            value={value}
            mixed={mixed}
            min={0}
            max={96}
            aria-label="path stroke dash"
            onCommit={(n) => updateNodes(ids, { strokeDash: n }, true)}
          />
        </div>
      </Field>
      <div className="mt-1 flex flex-wrap gap-1">
        {[
          { label: "Solid", dash: 0, offset: 0 },
          { label: "Dash", dash: 8, offset: 0 },
          { label: "Dot", dash: 2, offset: 0 },
          { label: "Long", dash: 16, offset: 0 },
          { label: "Gap", dash: 4, offset: 4 },
        ].map((preset) => {
          const active = !mixed && Math.abs(value - preset.dash) < 0.05 && Math.abs(offset - preset.offset) < 0.05;
          return (
            <button
              key={preset.label}
              type="button"
              className={cn(
                "rounded border px-1.5 py-0.5 text-[10px] transition-colors",
                active
                  ? "border-phosphor bg-phosphor/15 text-phosphor"
                  : "border-border text-ink-dim hover:bg-surface hover:text-ink",
              )}
              title={`Apply ${preset.label} dash to selected outlines`}
              aria-label={`Apply ${preset.label} dash preset`}
              aria-pressed={active}
              onClick={() => {
                updateNodes(ids, { strokeDash: preset.dash, strokeDashOffset: preset.offset }, true);
                ghostStroke(null);
                setStudioStatus(`${preset.label} dash`);
              }}
              onMouseEnter={() => ghostStroke({ strokeDash: preset.dash, strokeDashOffset: preset.offset })}
              onMouseLeave={() => ghostStroke(null)}
              onFocus={() => ghostStroke({ strokeDash: preset.dash, strokeDashOffset: preset.offset })}
              onBlur={() => ghostStroke(null)}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      {mixed && (
        <div className="mt-1 flex flex-wrap gap-1">
          {outlines.map((n) => {
            const d = n.strokeDash ?? 0;
            const label = dashChipLabel(d);
            return (
              <button
                key={`dash-${n.id}`}
                type="button"
                className={chipClass()}
                title={`Unify dash with ${n.name || n.kind}: ${label}`}
                aria-label={`Unify dash with ${n.name || n.kind}: ${label}`}
                onClick={() => updateNodes(ids, { strokeDash: d }, true)}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
      <Field label={mixedOffset ? "Offset · mixed" : `Offset ${Math.round(offset)}`}>
        <div className="flex items-center gap-2">
          <input
            type="range"
            className={cn("range-phosphor min-w-0 flex-1", mixedOffset && "opacity-70")}
            min={-48}
            max={48}
            step={1}
            aria-label={mixedOffset ? "path dash offset mixed" : "path dash offset"}
            value={mixedOffset ? 0 : offset}
            onChange={(e) => {
              const v = Number(e.target.value);
              updateNodes(ids, { strokeDashOffset: v });
              ghostStroke({ strokeDashOffset: v });
            }}
            onPointerDown={() => useDesign.getState().setStrokeDashOffsetScrubId(first.id)}
            onPointerUp={() => {
              useDesign.getState().setStrokeDashOffsetScrubId(null);
              useDesign.getState().commit();
              ghostStroke(null);
            }}
            onPointerCancel={() => useDesign.getState().setStrokeDashOffsetScrubId(null)}
            onLostPointerCapture={() => useDesign.getState().setStrokeDashOffsetScrubId(null)}
            onMouseEnter={() => useDesign.getState().setPathDashHoverKey("offset")}
            onFocus={() => useDesign.getState().setPathDashHoverKey("offset")}
            onMouseLeave={() => { if (!useDesign.getState().strokeDashOffsetScrubId) useDesign.getState().setPathDashHoverKey(null); }}
            onBlur={() => useDesign.getState().setPathDashHoverKey(null)}
          />
          <NumField
            className="field w-16 font-mono"
            value={offset}
            mixed={mixedOffset}
            min={-96}
            max={96}
            aria-label="path dash offset"
            onCommit={(n) => updateNodes(ids, { strokeDashOffset: n }, true)}
          />
        </div>
      </Field>
      {mixedOffset && (
        <div className="mt-1 flex flex-wrap gap-1">
          {outlines.map((n) => {
            const off = n.strokeDashOffset ?? 0;
            const label = dashOffsetChipLabel(off);
            return (
              <button
                key={`off-${n.id}`}
                type="button"
                className={chipClass()}
                title={`Unify dash offset with ${n.name || n.kind}: ${label}`}
                aria-label={`Unify dash offset with ${n.name || n.kind}: ${label}`}
                onClick={() => updateNodes(ids, { strokeDashOffset: off }, true)}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
      <div className="mt-1 flex flex-wrap gap-1" aria-label="dash offset numeric chips">
        {OFFSET_NUMERIC.map((o) => {
          const active = !mixedOffset && Math.abs(offset - o) < 0.05;
          return (
            <button
              key={o}
              type="button"
              className={cn(
                "flex h-7 items-center justify-center rounded border px-2 font-mono text-[10px] transition-colors",
                active
                  ? "border-phosphor bg-phosphor/15 text-phosphor"
                  : "border-border text-ink-dim hover:bg-surface hover:text-ink",
              )}
              title={`Apply dash offset ${o} to selected outlines`}
              aria-label={`Apply dash offset ${o}`}
              aria-pressed={active}
              onClick={() => {
                updateNodes(ids, { strokeDashOffset: o }, true);
                ghostStroke(null);
                setStudioStatus(`Offset · ${o}`);
              }}
              onMouseEnter={() => ghostStroke({ strokeDashOffset: o })}
              onMouseLeave={() => ghostStroke(null)}
              onFocus={() => ghostStroke({ strokeDashOffset: o })}
              onBlur={() => ghostStroke(null)}
            >
              {o}
            </button>
          );
        })}
      </div>
      <Field label={mixedCap ? "Cap · mixed" : "Cap"}>
        <select
          className="field"
          value={mixedCap ? "" : cap}
          aria-label={mixedCap ? "path line cap mixed" : "path line cap"}
          onMouseEnter={() => ghostStroke({ lineCap: (mixedCap ? "round" : cap) as CanvasLineCap })}
          onFocus={() => ghostStroke({ lineCap: (mixedCap ? "round" : cap) as CanvasLineCap })}
          onMouseLeave={() => ghostStroke(null)}
          onBlur={() => ghostStroke(null)}
          onChange={(e) => {
            const v = e.target.value as CanvasLineCap;
            updateNodes(ids, { lineCap: v }, true);
            ghostStroke({ lineCap: v });
          }}
        >
          {mixedCap && (
            <option value="" disabled>
              —
            </option>
          )}
          {CAPS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
      <div className="mt-1 flex flex-wrap gap-1" aria-label="line cap presets">
        {([
          { id: "butt" as const, label: "Butt" },
          { id: "round" as const, label: "Round" },
          { id: "square" as const, label: "Square" },
        ] as const).map((preset) => {
          const active = !mixedCap && cap === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              className={cn(
                "flex h-7 items-center gap-1 rounded border px-1.5 text-[10px] transition-colors",
                active
                  ? "border-phosphor bg-phosphor/15 text-phosphor"
                  : "border-border text-ink-dim hover:bg-surface hover:text-ink",
              )}
              title={`Apply ${preset.label} line cap to selected outlines`}
              aria-label={`Apply ${preset.label} line cap`}
              aria-pressed={active}
              onClick={() => {
                updateNodes(ids, { lineCap: preset.id }, true);
                ghostStroke(null);
                setStudioStatus(`Cap · ${preset.label}`);
              }}
              onMouseEnter={() => ghostStroke({ lineCap: preset.id })}
              onMouseLeave={() => ghostStroke(null)}
              onFocus={() => ghostStroke({ lineCap: preset.id })}
              onBlur={() => ghostStroke(null)}
            >
              <CapIcon cap={preset.id} />
              <span>{preset.label}</span>
            </button>
          );
        })}
      </div>
      {mixedCap && <MixedCapLegend outlines={outlines} />}
      {mixedCap && (
        <div className="mt-1 flex flex-wrap gap-1">
          {outlines.map((n) => {
            const c = n.lineCap ?? "round";
            const label = capChipLabel(c);
            return (
              <button
                key={`cap-${n.id}`}
                type="button"
                className={chipClass()}
                title={`Unify cap with ${n.name || n.kind}: ${label}`}
                aria-label={`Unify cap with ${n.name || n.kind}: ${label}`}
                onClick={() => updateNodes(ids, { lineCap: c }, true)}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
      <Field label={mixedJoin ? "Join · mixed" : "Join"}>
        <select
          className="field"
          value={mixedJoin ? "" : join}
          aria-label={mixedJoin ? "path line join mixed" : "path line join"}
          onMouseEnter={() => ghostStroke({ lineJoin: (mixedJoin ? "round" : join) as CanvasLineJoin })}
          onFocus={() => ghostStroke({ lineJoin: (mixedJoin ? "round" : join) as CanvasLineJoin })}
          onMouseLeave={() => ghostStroke(null)}
          onBlur={() => ghostStroke(null)}
          onChange={(e) => {
            const v = e.target.value as CanvasLineJoin;
            updateNodes(ids, { lineJoin: v }, true);
            ghostStroke({ lineJoin: v });
          }}
        >
          {mixedJoin && (
            <option value="" disabled>
              —
            </option>
          )}
          {JOINS.map((j) => (
            <option key={j} value={j}>
              {j}
            </option>
          ))}
        </select>
      </Field>
      <div className="mt-1 flex flex-wrap gap-1" aria-label="line join presets">
        {([
          { id: "miter" as const, label: "Miter" },
          { id: "round" as const, label: "Round" },
          { id: "bevel" as const, label: "Bevel" },
        ] as const).map((preset) => {
          const active = !mixedJoin && join === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              className={cn(
                "flex h-7 items-center gap-1 rounded border px-1.5 text-[10px] transition-colors",
                active
                  ? "border-phosphor bg-phosphor/15 text-phosphor"
                  : "border-border text-ink-dim hover:bg-surface hover:text-ink",
              )}
              title={`Apply ${preset.label} line join to selected outlines`}
              aria-label={`Apply ${preset.label} line join`}
              aria-pressed={active}
              onClick={() => {
                updateNodes(ids, { lineJoin: preset.id }, true);
                ghostStroke(null);
                setStudioStatus(`Join · ${preset.label}`);
              }}
              onMouseEnter={() => ghostStroke({ lineJoin: preset.id })}
              onMouseLeave={() => ghostStroke(null)}
              onFocus={() => ghostStroke({ lineJoin: preset.id })}
              onBlur={() => ghostStroke(null)}
            >
              <JoinIcon join={preset.id} />
              <span>{preset.label}</span>
            </button>
          );
        })}
      </div>
      {mixedJoin && <MixedJoinLegend outlines={outlines} />}
      {mixedJoin && (
        <div className="mt-1 flex flex-wrap gap-1">
          {outlines.map((n) => {
            const j = n.lineJoin ?? "round";
            const label = joinChipLabel(j);
            return (
              <button
                key={`join-${n.id}`}
                type="button"
                className={chipClass()}
                title={`Unify join with ${n.name || n.kind}: ${label}`}
                aria-label={`Unify join with ${n.name || n.kind}: ${label}`}
                onClick={() => updateNodes(ids, { lineJoin: j }, true)}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
      {mixedRhythm && (
        <div className="mt-1 flex flex-wrap gap-1">
          {outlines.map((n) => {
            const d = n.strokeDash ?? 0;
            const c = n.lineCap ?? "round";
            const j = n.lineJoin ?? "round";
            const label = strokeRhythmChipLabel(d, c, j);
            return (
              <button
                key={`rhythm-${n.id}`}
                type="button"
                className={chipClass()}
                title={`Unify dash / cap / join with ${n.name || n.kind}: ${label}`}
                aria-label={`Unify dash / cap / join with ${n.name || n.kind}: ${label}`}
                onClick={() => updateNodes(ids, { strokeDash: d, lineCap: c, lineJoin: j }, true)}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
      {(mixedJoin || join === "miter") && (
        <Field label={mixedMiter ? "Miter · mixed" : `Miter ${Math.round(miter)}`}>
          <div className="flex items-center gap-2">
            <input
              type="range"
              className={cn("range-phosphor min-w-0 flex-1", mixedMiter && "opacity-70")}
              min={1}
              max={20}
              step={0.5}
              aria-label={mixedMiter ? "path miter limit mixed" : "path miter limit"}
              value={mixedMiter ? 4 : miter}
              onChange={(e) => {
                const v = Number(e.target.value);
                updateNodes(ids, { miterLimit: v });
                ghostStroke({ miterLimit: v });
              }}
              onPointerDown={() => useDesign.getState().setMiterLimitScrubId(first.id)}
              onMouseEnter={() => useDesign.getState().setPathDashHoverKey("miter")}
              onFocus={() => useDesign.getState().setPathDashHoverKey("miter")}
              onMouseLeave={() => { if (!useDesign.getState().miterLimitScrubId) useDesign.getState().setPathDashHoverKey(null); }}
              onBlur={() => useDesign.getState().setPathDashHoverKey(null)}
              onPointerUp={() => {
                useDesign.getState().setMiterLimitScrubId(null);
                useDesign.getState().commit();
                ghostStroke(null);
              }}
              onPointerCancel={() => useDesign.getState().setMiterLimitScrubId(null)}
              onLostPointerCapture={() => useDesign.getState().setMiterLimitScrubId(null)}
            />
            <NumField
              className="field w-16 font-mono"
              value={miter}
              mixed={mixedMiter}
              min={1}
              max={40}
              aria-label="path miter limit"
              onCommit={(n) => updateNodes(ids, { miterLimit: n }, true)}
            />
          </div>
        </Field>
      )}
      {(mixedJoin || join === "miter") && (
        <div className="mt-1 flex flex-wrap gap-1" aria-label="miter limit presets">
          {[
            { label: "Soft", value: 2 },
            { label: "Default", value: 4 },
            { label: "Sharp", value: 10 },
            { label: "Hard", value: 20 },
          ].map((preset) => {
            const active = !mixedMiter && Math.abs(miter - preset.value) < 0.05;
            return (
              <button
                key={preset.label}
                type="button"
                className={cn(
                  "rounded border px-1.5 py-0.5 text-[10px] transition-colors",
                  active
                    ? "border-phosphor bg-phosphor/15 text-phosphor"
                    : "border-border text-ink-dim hover:bg-surface hover:text-ink",
                )}
                title={`Apply ${preset.label} miter limit (${preset.value}) to selected outlines`}
                aria-label={`Apply ${preset.label} miter limit`}
                aria-pressed={active}
                onClick={() => {
                  updateNodes(ids, { miterLimit: preset.value, lineJoin: "miter" }, true);
                  ghostStroke(null);
                  setStudioStatus(`${preset.label} miter · ${preset.value}`);
                }}
                onMouseEnter={() => ghostStroke({ miterLimit: preset.value, lineJoin: "miter" })}
                onMouseLeave={() => ghostStroke(null)}
                onFocus={() => ghostStroke({ miterLimit: preset.value, lineJoin: "miter" })}
                onBlur={() => ghostStroke(null)}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      )}
      {mixedMiter && (
        <div className="mt-1 flex flex-wrap gap-1">
          {outlines.map((n) => {
            const m = n.miterLimit ?? 4;
            const label = miterChipLabel(m);
            return (
              <button
                key={`mit-${n.id}`}
                type="button"
                className={chipClass()}
                title={`Unify miter with ${n.name || n.kind}: ${label}`}
                aria-label={`Unify miter with ${n.name || n.kind}: ${label}`}
                onClick={() => updateNodes(ids, { miterLimit: m }, true)}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
      {polygons.length > 0 && (
        <Field label={mixedSides ? "Sides · mixed" : `Sides ${sidesValue}`}>
          <div className="flex items-center gap-2">
            <input
              type="range"
              className={cn("range-phosphor min-w-0 flex-1", mixedSides && "opacity-70")}
              min={3}
              max={16}
              step={1}
              aria-label={mixedSides ? "polygon sides mixed" : "polygon sides"}
              value={mixedSides ? 5 : sidesValue}
              onChange={(e) => {
                const v = Number(e.target.value);
                updateNodes(polyIds, { sides: v });
                ghostStroke({ sides: v });
              }}
              onPointerDown={() => useDesign.getState().setSidesScrubId(first.id)}
              onMouseEnter={() => useDesign.getState().setPathDashHoverKey("sides")}
              onFocus={() => useDesign.getState().setPathDashHoverKey("sides")}
              onMouseLeave={() => { if (!useDesign.getState().sidesScrubId) useDesign.getState().setPathDashHoverKey(null); }}
              onBlur={() => useDesign.getState().setPathDashHoverKey(null)}
              onPointerUp={() => {
                useDesign.getState().setSidesScrubId(null);
                useDesign.getState().commit();
                ghostStroke(null);
              }}
              onPointerCancel={() => useDesign.getState().setSidesScrubId(null)}
              onLostPointerCapture={() => useDesign.getState().setSidesScrubId(null)}
            />
            <NumField
              className="field w-16 font-mono"
              value={sidesValue}
              mixed={mixedSides}
              min={3}
              max={24}
              aria-label="polygon sides"
              onCommit={(n) => updateNodes(polyIds, { sides: n }, true)}
            />
          </div>
        </Field>
      )}
      {mixedSides && (
        <div className="mt-1 flex flex-wrap gap-1">
          {polygons.map((n) => {
            const s = Math.max(3, Math.round(("sides" in n ? n.sides : undefined) ?? 5));
            const label = sidesChipLabel(s, n.kind);
            return (
              <button
                key={`sides-${n.id}`}
                type="button"
                className={chipClass()}
                title={`Unify sides with ${n.name || n.kind}: ${label}`}
                aria-label={`Unify sides with ${n.name || n.kind}: ${label}`}
                onClick={() => updateNodes(polyIds, { sides: s }, true)}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
      {arrows.length > 0 && (
        <Field label={mixedHead ? "Head · mixed" : `Head ${Math.round(headValue * 100)}%`}>
          <div className="flex items-center gap-2">
            <input
              type="range"
              className={cn("range-phosphor min-w-0 flex-1", mixedHead && "opacity-70")}
              min={0.4}
              max={2.4}
              step={0.05}
              aria-label={mixedHead ? "arrow head scale mixed" : "arrow head scale"}
              value={mixedHead ? 1 : headValue}
              onChange={(e) => {
                const v = Number(e.target.value);
                updateNodes(arrowIds, { headScale: v });
                ghostStroke({ headScale: v });
              }}
              onPointerDown={() => useDesign.getState().setHeadScaleScrubId(first.id)}
              onMouseEnter={() => useDesign.getState().setPathDashHoverKey("headScale")}
              onFocus={() => useDesign.getState().setPathDashHoverKey("headScale")}
              onMouseLeave={() => { if (!useDesign.getState().headScaleScrubId) useDesign.getState().setPathDashHoverKey(null); }}
              onBlur={() => useDesign.getState().setPathDashHoverKey(null)}
              onPointerUp={() => {
                useDesign.getState().setHeadScaleScrubId(null);
                useDesign.getState().commit();
                ghostStroke(null);
              }}
              onPointerCancel={() => useDesign.getState().setHeadScaleScrubId(null)}
              onLostPointerCapture={() => useDesign.getState().setHeadScaleScrubId(null)}
            />
            <NumField
              className="field w-16 font-mono"
              value={Math.round(headValue * 100)}
              mixed={mixedHead}
              min={20}
              max={300}
              aria-label="arrow head scale"
              onCommit={(n) => updateNodes(arrowIds, { headScale: n / 100 }, true)}
            />
          </div>
        </Field>
      )}
      {mixedHead && (
        <div className="mt-1 flex flex-wrap gap-1">
          {arrows.map((n) => {
            const h = ("headScale" in n ? n.headScale : undefined) ?? 1;
            const label = headScaleChipLabel(h);
            return (
              <button
                key={`head-${n.id}`}
                type="button"
                className={chipClass()}
                title={`Unify arrowhead with ${n.name || n.kind}: ${label}`}
                aria-label={`Unify arrowhead with ${n.name || n.kind}: ${label}`}
                onClick={() => updateNodes(arrowIds, { headScale: h }, true)}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
