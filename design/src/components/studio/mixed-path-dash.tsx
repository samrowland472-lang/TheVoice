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
import { useDesign } from "@/lib/design/store";
import type { DesignNode } from "@/lib/design/types";
import { cn } from "@/lib/utils";
import { Field } from "./inspector-parts";
import { NumField } from "./num-field";

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
  return "flex h-7 items-center rounded-full border border-phosphor/50 bg-surface-alt px-2 font-mono text-[9px] text-phosphor";
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
        Dash, cap, and join write onto selected outlines — paths, rectangles, ellipses, lines,
        polygons, stars, and arrows. Zero dash is a solid stroke. A chip stamps that outline’s
        dash, cap, or join onto the rest of the pick.
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
            onChange={(e) => updateNodes(ids, { strokeWidth: Number(e.target.value) })}
            onPointerUp={() => useDesign.getState().commit()}
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
            onChange={(e) => updateNodes(ids, { strokeDash: Number(e.target.value) })}
            onPointerUp={() => useDesign.getState().commit()}
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
      {mixed && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
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
            onChange={(e) => updateNodes(ids, { strokeDashOffset: Number(e.target.value) })}
            onPointerUp={() => useDesign.getState().commit()}
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
        <div className="mt-1.5 flex flex-wrap gap-1.5">
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
      <Field label={mixedCap ? "Cap · mixed" : "Cap"}>
        <select
          className="field"
          value={mixedCap ? "" : cap}
          aria-label={mixedCap ? "path line cap mixed" : "path line cap"}
          onChange={(e) => updateNodes(ids, { lineCap: e.target.value as CanvasLineCap }, true)}
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
      {mixedCap && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
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
          onChange={(e) => updateNodes(ids, { lineJoin: e.target.value as CanvasLineJoin }, true)}
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
      {mixedJoin && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
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
        <div className="mt-1.5 flex flex-wrap gap-1.5">
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
              onChange={(e) => updateNodes(ids, { miterLimit: Number(e.target.value) })}
              onPointerUp={() => useDesign.getState().commit()}
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
      {mixedMiter && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
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
              onChange={(e) => updateNodes(polyIds, { sides: Number(e.target.value) })}
              onPointerUp={() => useDesign.getState().commit()}
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
        <div className="mt-1.5 flex flex-wrap gap-1.5">
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
              onChange={(e) => updateNodes(arrowIds, { headScale: Number(e.target.value) })}
              onPointerUp={() => useDesign.getState().commit()}
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
        <div className="mt-1.5 flex flex-wrap gap-1.5">
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
