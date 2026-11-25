import { rememberColor } from "@/lib/design/persist";
import { useRef, useState, type CSSProperties } from "react";
import {
  cloneShadow,
  DEFAULT_SHADOW,
  shadowChipLabel,
  shadowInset,
  shadowKey,
  shadowSpread,
  stampShadowBlur,
  stampShadowColor,
  stampShadowInset,
  stampShadowOx,
  stampShadowOy,
  stampShadowSpread,
} from "@/lib/design/shadow";
import { cloneFill, fillChipLabel, solidOf } from "@/lib/design/ink";
import { useDesign } from "@/lib/design/store";
import type { DesignNode, GradientFill, Shadow } from "@/lib/design/types";
import { isGradient } from "@/lib/design/types";
import { cn } from "@/lib/utils";
import { BrandSwatches, Field, HexColorField, RecentSwatches } from "./inspector-parts";
import { NumField } from "./num-field";
import {
  MixedBlendChips,
  MixedBlendLegend,
  MixedFillChips,
  MixedLockChips,
  MixedOpacityChips,
  MixedStrokeChips,
  MixedVisibilityChips,
} from "./mixed-ink-chips";
import {
  MixedShadowBlurChips,
  MixedShadowColorChips,
  MixedShadowInsetChips,
  MixedShadowOffsetChips,
  MixedShadowSpreadChips,
} from "./mixed-shadow-chips";

function mapShadows(map: (sh: Shadow | null) => Shadow | null, commit = false) {
  const state = useDesign.getState();
  state.mapNodes(state.selection, (layer) => ({ ...layer, shadow: map(layer.shadow) }), commit);
}

function gradientPreviewCss(g: GradientFill): string {
  const stops = g.stops.slice().sort((a, b) => a.offset - b.offset);
  if (g.type === "radial") {
    const cx = ((g.cx ?? 0.5) * 100).toFixed(1);
    const cy = ((g.cy ?? 0.5) * 100).toFixed(1);
    const r0 = Math.max(0, Math.min(0.95, g.r0 ?? 0));
    const remapped = stops.map((s) => {
      const off = r0 + (1 - r0) * s.offset;
      return `${s.color} ${(off * 100).toFixed(1)}%`;
    });
    const parts = remapped.join(", ");
    return `radial-gradient(circle at ${cx}% ${cy}%, ${parts})`;
  }
  const parts = stops.map((s) => `${s.color} ${(s.offset * 100).toFixed(1)}%`).join(", ");
  return `linear-gradient(${g.angle}deg, ${parts})`;
}

function MixedHexField({
  value,
  mixed,
  ariaLabel,
  onCommit,
}: {
  value: string;
  mixed: boolean;
  ariaLabel: string;
  onCommit: (hex: string) => void;
}) {
  const hex = value.startsWith("#") ? value : "#000000";
  return (
    <div className="flex gap-2">
      <input
        type="color"
        className={cn("h-8 w-12 shrink-0 rounded-[8px] border border-border", mixed && "opacity-60")}
        value={hex === "transparent" ? "#3fc6ff" : hex}
        aria-label={mixed ? `${ariaLabel} mixed` : ariaLabel}
        onChange={(e) => onCommit(e.target.value)}
      />
      <input
        className="field font-mono flex-1"
        value={mixed ? "" : hex}
        placeholder={mixed ? "\u2014" : undefined}
        aria-label={mixed ? `${ariaLabel} hex mixed` : `${ariaLabel} hex`}
        onChange={(e) => {
          const raw = e.target.value.trim();
          if (/^#([0-9a-fA-F]{6})$/.test(raw)) onCommit(raw);
        }}
        onBlur={(e) => {
          const raw = e.target.value.trim();
          if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(raw)) {
            const next =
              raw.length === 4
                ? `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`
                : raw;
            onCommit(next);
          }
        }}
      />
    </div>
  );
}

function MixedGradientStopBar({
  fill,
  ids,
  updateNodes,
}: {
  fill: GradientFill;
  ids: string[];
  updateNodes: (ids: string[], patch: Partial<DesignNode>, commit?: boolean) => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const [hoverStop, setHoverStop] = useState<number | null>(null);
  const [dragStop, setDragStop] = useState<number | null>(null);

  return (
    <div
      ref={barRef}
      className="relative mb-2 h-8 w-full rounded-[8px] border border-border"
      style={{ background: gradientPreviewCss(fill) }}
      title={fillChipLabel(fill)}
    >
      {fill.stops.map((stop, i) => (
        <button
          key={i}
          type="button"
          className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-sm border-2 border-phosphor shadow-[0_0_0_1px_#000]"
          style={{ left: `${stop.offset * 100}%`, backgroundColor: stop.color }}
          onMouseEnter={() => setHoverStop(i)}
          onMouseLeave={() => setHoverStop(null)}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragStop(i);
            const bar = barRef.current;
            if (!bar) return;
            const rect = bar.getBoundingClientRect();
            const startX = e.clientX;
            const startOffset = stop.offset;
            const onMove = (ev: PointerEvent) => {
              const dx = ev.clientX - startX;
              const newOff = Math.max(0, Math.min(1, startOffset + dx / rect.width));
              const stops = fill.stops.map((s, j) => (j === i ? { ...s, offset: newOff } : s));
              updateNodes(ids, { fill: { ...fill, stops } }, false);
            };
            const onUp = () => {
              window.removeEventListener("pointermove", onMove);
              window.removeEventListener("pointerup", onUp);
              setDragStop(null);
              useDesign.getState().commit();
            };
            window.addEventListener("pointermove", onMove);
            window.addEventListener("pointerup", onUp);
          }}
          aria-label={`Drag gradient stop ${i + 1}`}
        />
      ))}
      {(dragStop ?? hoverStop) != null && fill.stops[dragStop ?? hoverStop!] && (
        <div
          className="pointer-events-none absolute -top-5 z-10 -translate-x-1/2 rounded-sm border border-phosphor bg-surface px-1 py-0.5 text-[9px] font-mono text-phosphor shadow-[0_0_0_1px_#000]"
          style={{ left: `${fill.stops[dragStop ?? hoverStop!].offset * 100}%` }}
        >
          {Math.round(fill.stops[dragStop ?? hoverStop!].offset * 100)}%
        </div>
      )}
    </div>
  );
}

export function MixedInk({ nodes, ink }: { nodes: DesignNode[]; ink: string }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  const setOpacityScrubId = useDesign((s) => s.setOpacityScrubId);
  if (nodes.length < 2) return null;
  const ids = nodes.map((n) => n.id);
  const first = nodes[0]!;
  const ghost = first.shadow ?? DEFAULT_SHADOW;
  const fillHex = solidOf(first.fill, ink);
  const mixedFill = new Set(nodes.map((n) => JSON.stringify(n.fill))).size > 1;
  const keyIsGradient = isGradient(first.fill);
  const uniformGradient = !mixedFill && keyIsGradient;
  const fillLabel = mixedFill ? "Fill · mixed" : keyIsGradient ? `Fill · ${fillChipLabel(first.fill)}` : "Fill";
  const mixedStrokeColor = new Set(nodes.map((n) => n.stroke)).size > 1;
  const mixedStrokeWidth = new Set(nodes.map((n) => n.strokeWidth)).size > 1;
  const mixedStroke = mixedStrokeColor || mixedStrokeWidth;
  const mixedOpacity = new Set(nodes.map((n) => n.opacity)).size > 1;
  const mixedBlend = new Set(nodes.map((n) => n.blend)).size > 1;
  const mixedVis = new Set(nodes.map((n) => n.visible)).size > 1;
  const mixedLock = new Set(nodes.map((n) => n.locked)).size > 1;
  const mixedShadow = new Set(nodes.map((n) => shadowKey(n.shadow))).size > 1;
  const mixedColor = new Set(nodes.map((n) => n.shadow?.color ?? DEFAULT_SHADOW.color)).size > 1;
  const mixedBlur = new Set(nodes.map((n) => n.shadow?.blur ?? DEFAULT_SHADOW.blur)).size > 1;
  const mixedOx = new Set(nodes.map((n) => n.shadow?.ox ?? DEFAULT_SHADOW.ox)).size > 1;
  const mixedOy = new Set(nodes.map((n) => n.shadow?.oy ?? DEFAULT_SHADOW.oy)).size > 1;
  const mixedSpread = new Set(nodes.map((n) => shadowSpread(n.shadow))).size > 1;
  const mixedInset = new Set(nodes.map((n) => shadowInset(n.shadow))).size > 1;
  return (
    <section className="border-b border-border py-3">
      <div className="mb-2 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">Ink · {nodes.length}</div>
      <p className="mb-2 text-[10px] text-ink-dim">Mixed sliders stay live — they ghost the first drop and write only the field you drag.</p>
      <Field label={fillLabel}>
        {keyIsGradient && (
          <MixedGradientStopBar
            fill={first.fill as GradientFill}
            ids={ids}
            updateNodes={updateNodes}
          />
        )}
        <MixedHexField
          value={fillHex}
          mixed={mixedFill}
          ariaLabel="selection fill"
          onCommit={(hex) => { rememberColor(hex); updateNodes(ids, { fill: hex }, true); }}
        />
        <BrandSwatches onPick={(hex) => { rememberColor(hex); updateNodes(ids, { fill: hex }, true); }} />
        <RecentSwatches onPick={(hex) => { rememberColor(hex); updateNodes(ids, { fill: hex }, true); }} />
        <div className="mt-1 flex flex-wrap gap-1">
          <button
            type="button"
            className="text-[10px] text-phosphor"
            onClick={() => updateNodes(ids, { fill: cloneFill(first.fill) }, true)}
          >
            Apply key fill to all
          </button>
          {keyIsGradient && (
            <button
              type="button"
              className="text-[10px] text-ink-dim hover:text-phosphor"
              onClick={() => updateNodes(ids, { fill: fillHex }, true)}
            >
              Make all solid
            </button>
          )}
        </div>
        {uniformGradient && (() => {
          const g = first.fill as GradientFill;
          return (
          <div className="mt-2 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <button type="button" className={cn("flex-1 rounded-[6px] border px-2 py-1 text-[10px] transition-colors", g.type !== "radial" ? "border-phosphor bg-phosphor/10 text-phosphor" : "border-border text-ink-dim hover:text-ink")} onClick={() => updateNodes(ids, { fill: { ...g, type: "linear" } }, true)}>Linear</button>
              <button type="button" className={cn("flex-1 rounded-[6px] border px-2 py-1 text-[10px] transition-colors", g.type === "radial" ? "border-phosphor bg-phosphor/10 text-phosphor" : "border-border text-ink-dim hover:text-ink")} onClick={() => updateNodes(ids, { fill: { ...g, type: "radial" } }, true)}>Radial</button>
            </div>
            {g.type !== "radial" && (
              <>
              <div className="flex items-center gap-2">
                <input type="range" className="range-phosphor min-w-0 flex-1" min={0} max={360} value={Math.round(g.angle)} onChange={(e) => updateNodes(ids, { fill: { ...g, angle: Number(e.target.value) } }, false)} onPointerUp={() => useDesign.getState().commit()} />
                <NumField value={Math.round(g.angle)} min={0} max={360} className="field w-12 font-mono text-[11px] text-right" aria-label="Gradient angle degrees" onDraft={(n) => { if (n == null || !Number.isFinite(n)) return; updateNodes(ids, { fill: { ...g, angle: Math.max(0, Math.min(360, n)) } }, false); }} onCommit={(n) => { updateNodes(ids, { fill: { ...g, angle: Math.max(0, Math.min(360, n)) } }, true); }} />
                <span className="shrink-0 text-[10px] text-ink-dim">°</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-8 shrink-0 text-[10px] text-ink-dim">Len</span>
                <input type="range" className="range-phosphor min-w-0 flex-1" min={20} max={300} value={Math.round((g.llen ?? 1) * 100)} onChange={(e) => updateNodes(ids, { fill: { ...g, llen: Number(e.target.value) / 100 } }, false)} onPointerUp={() => useDesign.getState().commit()} />
                <NumField value={Math.round((g.llen ?? 1) * 100)} min={20} max={300} className="field w-12 font-mono text-[11px] text-right" aria-label="Linear gradient length percent" onDraft={(n) => { if (n == null || !Number.isFinite(n)) return; updateNodes(ids, { fill: { ...g, llen: Math.max(20, Math.min(300, n)) / 100 } }, false); }} onCommit={(n) => { updateNodes(ids, { fill: { ...g, llen: Math.max(20, Math.min(300, n)) / 100 } }, true); }} />
                <span className="shrink-0 text-[10px] text-ink-dim">%</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1"><span className="text-[10px] text-ink-dim">OX</span><NumField value={Math.round((g.lox ?? 0.5) * 100)} min={0} max={100} className="field w-12 font-mono text-[11px] text-right" aria-label="Linear offset X percent" onDraft={(n) => { if (n == null || !Number.isFinite(n)) return; updateNodes(ids, { fill: { ...g, lox: Math.max(0, Math.min(100, n)) / 100 } }, false); }} onCommit={(n) => { updateNodes(ids, { fill: { ...g, lox: Math.max(0, Math.min(100, n)) / 100 } }, true); }} /><span className="text-[10px] text-ink-dim">%</span></div>
                <div className="flex items-center gap-1"><span className="text-[10px] text-ink-dim">OY</span><NumField value={Math.round((g.loy ?? 0.5) * 100)} min={0} max={100} className="field w-12 font-mono text-[11px] text-right" aria-label="Linear offset Y percent" onDraft={(n) => { if (n == null || !Number.isFinite(n)) return; updateNodes(ids, { fill: { ...g, loy: Math.max(0, Math.min(100, n)) / 100 } }, false); }} onCommit={(n) => { updateNodes(ids, { fill: { ...g, loy: Math.max(0, Math.min(100, n)) / 100 } }, true); }} /><span className="text-[10px] text-ink-dim">%</span></div>
              </div>
              </>
            )}
            {g.type === "radial" && (
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1"><span className="text-[10px] text-ink-dim">CX</span><NumField value={Math.round((g.cx ?? 0.5) * 100)} min={0} max={100} className="field w-12 font-mono text-[11px] text-right" aria-label="Radial centre X percent" onDraft={(n) => { if (n == null || !Number.isFinite(n)) return; updateNodes(ids, { fill: { ...g, cx: Math.max(0, Math.min(100, n)) / 100 } }, false); }} onCommit={(n) => { updateNodes(ids, { fill: { ...g, cx: Math.max(0, Math.min(100, n)) / 100 } }, true); }} /></div>
                <div className="flex items-center gap-1"><span className="text-[10px] text-ink-dim">CY</span><NumField value={Math.round((g.cy ?? 0.5) * 100)} min={0} max={100} className="field w-12 font-mono text-[11px] text-right" aria-label="Radial centre Y percent" onDraft={(n) => { if (n == null || !Number.isFinite(n)) return; updateNodes(ids, { fill: { ...g, cy: Math.max(0, Math.min(100, n)) / 100 } }, false); }} onCommit={(n) => { updateNodes(ids, { fill: { ...g, cy: Math.max(0, Math.min(100, n)) / 100 } }, true); }} /></div>
                <div className="flex items-center gap-1"><span className="text-[10px] text-ink-dim">FX</span><NumField value={Math.round((g.fx ?? g.cx ?? 0.5) * 100)} min={0} max={100} className="field w-12 font-mono text-[11px] text-right" aria-label="Radial focal X percent" onDraft={(n) => { if (n == null || !Number.isFinite(n)) return; updateNodes(ids, { fill: { ...g, fx: Math.max(0, Math.min(100, n)) / 100 } }, false); }} onCommit={(n) => { updateNodes(ids, { fill: { ...g, fx: Math.max(0, Math.min(100, n)) / 100 } }, true); }} /></div>
                <div className="flex items-center gap-1"><span className="text-[10px] text-ink-dim">FY</span><NumField value={Math.round((g.fy ?? g.cy ?? 0.5) * 100)} min={0} max={100} className="field w-12 font-mono text-[11px] text-right" aria-label="Radial focal Y percent" onDraft={(n) => { if (n == null || !Number.isFinite(n)) return; updateNodes(ids, { fill: { ...g, fy: Math.max(0, Math.min(100, n)) / 100 } }, false); }} onCommit={(n) => { updateNodes(ids, { fill: { ...g, fy: Math.max(0, Math.min(100, n)) / 100 } }, true); }} /></div>
                <div className="col-span-2 flex items-center gap-1"><span className="text-[10px] text-ink-dim">R0</span><NumField value={Math.round((g.r0 ?? 0) * 100)} min={0} max={95} className="field w-12 font-mono text-[11px] text-right" aria-label="Radial inner radius percent" onDraft={(n) => { if (n == null || !Number.isFinite(n)) return; updateNodes(ids, { fill: { ...g, r0: Math.max(0, Math.min(95, n)) / 100 } }, false); }} onCommit={(n) => { updateNodes(ids, { fill: { ...g, r0: Math.max(0, Math.min(95, n)) / 100 } }, true); }} /><span className="text-[10px] text-ink-dim">%</span></div>
              </div>
            )}
            <div className="mt-2 flex flex-col gap-1.5 border-t border-border pt-2">
              <div className="text-[10px] text-ink-dim">Stops</div>
              {g.stops.map((stop, i) => ({ stop, i })).sort((a, b) => a.stop.offset - b.stop.offset).map(({ stop, i }) => (
                <div key={i} className="flex flex-col gap-1">
                  <HexColorField label={`Stop ${i + 1}`} value={stop.color} onChange={(hex) => { rememberColor(hex); const stops = g.stops.map((s, j) => (j === i ? { ...s, color: hex } : s)); updateNodes(ids, { fill: { ...g, stops } }, true); }} />
                  <div className="flex items-center gap-2">
                    <NumField value={Math.round(stop.offset * 100)} min={0} max={100} className="field w-12 font-mono text-[11px] text-right" aria-label={`Stop ${i + 1} offset percent`} onDraft={(n) => { if (n == null || !Number.isFinite(n)) return; const off = Math.max(0, Math.min(1, n / 100)); const stops = g.stops.map((s, j) => (j === i ? { ...s, offset: off } : s)); updateNodes(ids, { fill: { ...g, stops } }, false); }} onCommit={(n) => { const off = Math.max(0, Math.min(1, n / 100)); const stops = g.stops.map((s, j) => (j === i ? { ...s, offset: off } : s)); updateNodes(ids, { fill: { ...g, stops } }, true); }} />
                    <span className="text-[10px] text-ink-dim">%</span>
                    <button type="button" className="text-[10px] text-ink-dim hover:text-phosphor disabled:opacity-30" disabled={g.stops.length <= 2} onClick={() => { if (g.stops.length <= 2) return; const stops = g.stops.filter((_, j) => j !== i); updateNodes(ids, { fill: { ...g, stops } }, true); }} aria-label="Remove stop">Remove</button>
                  </div>
                </div>
              ))}
              <button type="button" className="self-start text-[10px] text-phosphor" onClick={() => { const sorted = [...g.stops].sort((a, b) => a.offset - b.offset); let at = 0.5; let maxGap = 0; for (let k = 0; k < sorted.length - 1; k++) { const gap = sorted[k + 1].offset - sorted[k].offset; if (gap > maxGap) { maxGap = gap; at = (sorted[k].offset + sorted[k + 1].offset) / 2; } } const color = sorted[0]?.color ?? "#d9f5e3"; const stops = [...g.stops, { offset: at, color }].sort((a, b) => a.offset - b.offset); updateNodes(ids, { fill: { ...g, stops } }, true); }}>Add stop</button>
            </div>
          </div>
          );
        })()}
        {mixedFill && <MixedFillChips nodes={nodes} ink={ink} />}
      </Field>
      <Field label={mixedStroke ? "Stroke · mixed" : "Stroke"}>
        <MixedHexField value={first.stroke === "transparent" ? "#3fc6ff" : first.stroke} mixed={mixedStrokeColor} ariaLabel="selection stroke" onCommit={(hex) => { rememberColor(hex); updateNodes(ids, { stroke: hex, strokeWidth: Math.max(first.strokeWidth, 1) }, true); }} />
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-[10px] text-ink-dim">{mixedStrokeWidth ? "Width · mixed" : "Width"}</span>
          <NumField className="field w-16 font-mono" value={first.strokeWidth} mixed={mixedStrokeWidth} min={0} max={64} aria-label="selection stroke width" onDraft={(n) => { if (n == null || !Number.isFinite(n)) return; updateNodes(ids, { strokeWidth: Math.max(0, n) }, false); }} onCommit={(n) => { updateNodes(ids, { strokeWidth: Math.max(0, n) }, true); }} />
        </div>
        {mixedStroke && <MixedStrokeChips nodes={nodes} />}
      </Field>
      <Field label={mixedOpacity ? "Opacity · mixed" : "Opacity"}>
        <input type="range" className={cn("range-phosphor w-full", mixedOpacity && "ghost opacity-70")} min={0} max={100} value={Math.round(first.opacity * 100)} aria-label={mixedOpacity ? "selection opacity mixed ghost" : "selection opacity"} onChange={(e) => { const opacity = Number(e.target.value) / 100; updateNodes(ids, { opacity }, false); }} onPointerDown={() => setOpacityScrubId(nodes[0]?.id ?? null)} onPointerUp={() => { setOpacityScrubId(null); useDesign.getState().commit(); }} onPointerCancel={() => setOpacityScrubId(null)} onLostPointerCapture={() => setOpacityScrubId(null)} />
        {mixedOpacity && <MixedOpacityChips nodes={nodes} />}
      </Field>
      <Field label={mixedBlend ? "Blend · mixed" : "Blend"}>
        <MixedBlendLegend nodes={nodes} />
        {mixedBlend && <MixedBlendChips nodes={nodes} />}
      </Field>
      <div className="mt-2 flex flex-wrap gap-2">
        <Field label={mixedVis ? "Visible · mixed" : "Visible"}>
          <label className="flex items-center gap-2 text-[11px] text-ink-dim">
            <input type="checkbox" className={cn(mixedVis && "ghost")} checked={first.visible} aria-label={mixedVis ? "selection visible mixed ghost" : "selection visible"} onChange={(e) => updateNodes(ids, { visible: e.target.checked }, true)} />
            Show
          </label>
          {mixedVis && <MixedVisibilityChips nodes={nodes} />}
        </Field>
        <Field label={mixedLock ? "Lock · mixed" : "Lock"}>
          <label className="flex items-center gap-2 text-[11px] text-ink-dim">
            <input type="checkbox" className={cn(mixedLock && "ghost")} checked={first.locked} aria-label={mixedLock ? "selection locked mixed ghost" : "selection locked"} onChange={(e) => updateNodes(ids, { locked: e.target.checked }, true)} />
            Lock
          </label>
          {mixedLock && <MixedLockChips nodes={nodes} />}
        </Field>
      </div>
      <div className="mt-2 border-t border-border pt-2">
        <div className="mb-1 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">Shadow</div>
        {mixedShadow && (
          <div className="mb-2 flex flex-wrap gap-1">
            {nodes.map((n) => (
              <button key={`full-sh-${n.id}`} type="button" className="flex h-6 items-center rounded-full border border-phosphor/40 bg-surface-alt px-1.5 font-mono text-[8px] text-phosphor max-w-[120px] truncate" title={`Unify full shadow with ${n.name || n.kind}: ${shadowChipLabel(n.shadow)}`} aria-label={`Unify full shadow with ${n.name || n.kind}: ${shadowChipLabel(n.shadow)}`} onClick={() => mapShadows(() => cloneShadow(n.shadow), true)}>{shadowChipLabel(n.shadow)}</button>
            ))}
          </div>
        )}
        <Field label={mixedColor ? "Colour · mixed" : "Colour"}>
          <input type="color" className={cn("h-8 w-full rounded-[8px] border border-border", mixedColor && "ghost")} value={ghost.color} title="Unify shadow colour" aria-label={mixedColor ? "selection shadow colour mixed ghost" : "selection shadow colour"} onChange={(e) => { const color = e.target.value; rememberColor(color); mapShadows((sh) => stampShadowColor(sh, color)); }} onPointerUp={() => useDesign.getState().commit()} />
          {mixedColor && <MixedShadowColorChips nodes={nodes} />}
        </Field>
        <Field label={mixedBlur ? "Blur · mixed" : `Blur ${ghost.blur}`}>
          <input type="range" className={cn("range-phosphor w-full", mixedBlur && "ghost opacity-70")} min={0} max={40} value={ghost.blur} aria-label={mixedBlur ? "selection shadow blur mixed ghost" : "selection shadow blur"} onChange={(e) => { const blur = Number(e.target.value); mapShadows((sh) => stampShadowBlur(sh, blur)); }} onPointerDown={() => useDesign.getState().setShadowBlurScrubId(nodes[0]?.id ?? null)} onPointerUp={() => { useDesign.getState().setShadowBlurScrubId(null); useDesign.getState().commit(); }} onPointerCancel={() => useDesign.getState().setShadowBlurScrubId(null)} onLostPointerCapture={() => useDesign.getState().setShadowBlurScrubId(null)} />
          {mixedBlur && <MixedShadowBlurChips nodes={nodes} />}
        </Field>
        <Field label={mixedOx ? "Offset X · mixed" : `Offset X ${ghost.ox}`}>
          <input type="range" className={cn("range-phosphor w-full", mixedOx && "ghost opacity-70")} min={-40} max={40} value={ghost.ox} aria-label={mixedOx ? "selection shadow ox mixed ghost" : "selection shadow ox"} onChange={(e) => { const ox = Number(e.target.value); mapShadows((sh) => stampShadowOx(sh, ox)); }} onPointerDown={() => useDesign.getState().setShadowOxScrubId(nodes[0]?.id ?? null)} onPointerUp={() => { useDesign.getState().setShadowOxScrubId(null); useDesign.getState().commit(); }} onPointerCancel={() => useDesign.getState().setShadowOxScrubId(null)} onLostPointerCapture={() => useDesign.getState().setShadowOxScrubId(null)} />
          {mixedOx && <MixedShadowOffsetChips nodes={nodes} axis="ox" />}
        </Field>
        <Field label={mixedOy ? "Offset Y · mixed" : `Offset Y ${ghost.oy}`}>
          <input type="range" className={cn("range-phosphor w-full", mixedOy && "ghost opacity-70")} min={-40} max={40} value={ghost.oy} aria-label={mixedOy ? "selection shadow oy mixed ghost" : "selection shadow oy"} onChange={(e) => { const oy = Number(e.target.value); mapShadows((sh) => stampShadowOy(sh, oy)); }} onPointerDown={() => useDesign.getState().setShadowOyScrubId(nodes[0]?.id ?? null)} onPointerUp={() => { useDesign.getState().setShadowOyScrubId(null); useDesign.getState().commit(); }} onPointerCancel={() => useDesign.getState().setShadowOyScrubId(null)} onLostPointerCapture={() => useDesign.getState().setShadowOyScrubId(null)} />
          {mixedOy && <MixedShadowOffsetChips nodes={nodes} axis="oy" />}
        </Field>
        <Field label={mixedSpread ? "Spread · mixed" : `Spread ${shadowSpread(ghost)}`}>
          <input type="range" className={cn("range-phosphor w-full", mixedSpread && "ghost opacity-70")} min={0} max={40} value={shadowSpread(ghost)} aria-label={mixedSpread ? "selection shadow spread mixed ghost" : "selection shadow spread"} onChange={(e) => { const spread = Number(e.target.value); mapShadows((sh) => stampShadowSpread(sh, spread)); }} onPointerDown={() => useDesign.getState().setShadowSpreadScrubId(nodes[0]?.id ?? null)} onPointerUp={() => { useDesign.getState().setShadowSpreadScrubId(null); useDesign.getState().commit(); }} onPointerCancel={() => useDesign.getState().setShadowSpreadScrubId(null)} onLostPointerCapture={() => useDesign.getState().setShadowSpreadScrubId(null)} />
          {mixedSpread && <MixedShadowSpreadChips nodes={nodes} />}
        </Field>
        <Field label={mixedInset ? "Inset · mixed" : shadowInset(ghost) ? "Inset" : "Drop"}>
          <label className="flex items-center gap-2 text-[11px] text-ink-dim">
            <input type="checkbox" className={cn(mixedInset && "ghost")} checked={shadowInset(ghost)} aria-label={mixedInset ? "selection shadow inset mixed ghost" : "selection shadow inset"} onMouseEnter={() => useDesign.getState().setStrokeGhost({ shadowInset: shadowInset(ghost) })} onFocus={() => useDesign.getState().setStrokeGhost({ shadowInset: shadowInset(ghost) })} onMouseLeave={() => useDesign.getState().setStrokeGhost(null)} onBlur={() => useDesign.getState().setStrokeGhost(null)} onChange={(e) => { const inset = e.target.checked; mapShadows((sh) => stampShadowInset(sh, inset), true); }} />
            Inset
          </label>
          {mixedInset && <MixedShadowInsetChips nodes={nodes} />}
        </Field>
      </div>
    </section>
  );
}
