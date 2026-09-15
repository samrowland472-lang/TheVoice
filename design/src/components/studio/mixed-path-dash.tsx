import { useDesign } from "@/lib/design/store";
import type { DesignNode } from "@/lib/design/types";
import { cn } from "@/lib/utils";
import { Field } from "./inspector-parts";
import { NumField } from "./num-field";

const CAPS: CanvasLineCap[] = ["butt", "round", "square"];
const JOINS: CanvasLineJoin[] = ["miter", "round", "bevel"];

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

export function MixedPathDash({ nodes }: { nodes: DesignNode[] }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  if (nodes.length < 1) return null;
  const ids = nodes.map((n) => n.id);
  const mixed = new Set(nodes.map(dashKey)).size > 1;
  const mixedWidth = new Set(nodes.map(widthKey)).size > 1;
  const mixedOffset = new Set(nodes.map(offsetKey)).size > 1;
  const mixedCap = new Set(nodes.map((n) => n.lineCap ?? "round")).size > 1;
  const mixedJoin = new Set(nodes.map((n) => n.lineJoin ?? "round")).size > 1;
  const mixedMiter = new Set(nodes.map(miterKey)).size > 1;
  const first = nodes[nodes.length - 1]!;
  const value = first.strokeDash ?? 0;
  const width = first.strokeWidth ?? 1;
  const offset = first.strokeDashOffset ?? 0;
  const cap = first.lineCap ?? "round";
  const join = first.lineJoin ?? "round";
  const miter = first.miterLimit ?? 4;

  return (
    <section className="border-b border-border py-3">
      <div className="mb-2 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">
        Stroke · {nodes.length}
      </div>
      <p className="mb-2 text-[10px] text-ink-dim">
        Dash, cap, and join write onto selected outlines — paths, rectangles, ellipses, and lines.
        Zero dash is a solid stroke.
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
    </section>
  );
}
