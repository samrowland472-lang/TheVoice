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
import { cloneFill, solidOf } from "@/lib/design/ink";
import { useDesign } from "@/lib/design/store";
import type { DesignNode, Shadow } from "@/lib/design/types";
import { cn } from "@/lib/utils";
import { Field, Swatches } from "./inspector-parts";
import { NumField } from "./num-field";
import {
  MixedBlendChips,
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

export function MixedInk({ nodes, brandColors, ink }: { nodes: DesignNode[]; brandColors: { name: string; hex: string }[]; ink: string }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  if (nodes.length < 2) return null;
  const ids = nodes.map((n) => n.id);
  const first = nodes[0]!;
  const ghost = first.shadow ?? DEFAULT_SHADOW;
  const fillHex = solidOf(first.fill, ink);
  const mixedFill = new Set(nodes.map((n) => JSON.stringify(n.fill))).size > 1;
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
      <Field label={mixedFill ? "Fill · mixed" : "Fill"}>
        <MixedHexField
          value={fillHex}
          mixed={mixedFill}
          ariaLabel="selection fill"
          onCommit={(hex) => updateNodes(ids, { fill: hex }, true)}
        />
        <Swatches colors={brandColors} onPick={(hex) => updateNodes(ids, { fill: hex }, true)} />
        <button
          type="button"
          className="mt-1 text-[10px] text-phosphor"
          onClick={() => updateNodes(ids, { fill: cloneFill(first.fill) }, true)}
        >
          Apply key fill to all
        </button>
        {mixedFill && <MixedFillChips nodes={nodes} ink={ink} />}
      </Field>
      <Field label={mixedStroke ? "Stroke · mixed" : "Stroke"}>
        <MixedHexField
          value={first.stroke === "transparent" ? "#3fc6ff" : first.stroke}
          mixed={mixedStrokeColor}
          ariaLabel="selection stroke"
          onCommit={(hex) => updateNodes(ids, { stroke: hex, strokeWidth: Math.max(first.strokeWidth, 1) }, true)}
        />
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-[10px] text-ink-dim">{mixedStrokeWidth ? "Width · mixed" : "Width"}</span>
          <NumField
            className="field w-16 font-mono"
            value={first.strokeWidth}
            mixed={mixedStrokeWidth}
            min={0}
            aria-label="selection stroke width"
            onCommit={(n) => updateNodes(ids, { strokeWidth: n }, true)}
          />
        </div>
        <button
          type="button"
          className="mt-1 text-[10px] text-phosphor"
          onClick={() => updateNodes(ids, { stroke: first.stroke, strokeWidth: first.strokeWidth }, true)}
        >
          Apply key stroke to all
        </button>
        {mixedStroke && <MixedStrokeChips nodes={nodes} />}
      </Field>
      <Field label={mixedOpacity ? "Opacity · mixed" : `Opacity ${Math.round(first.opacity * 100)}%`}>
        <input type="range" className={cn("range-phosphor w-full", mixedOpacity && "opacity-70")} min={0} max={1} step={0.01} value={first.opacity} onChange={(e) => updateNodes(ids, { opacity: Number(e.target.value) })} onPointerUp={() => useDesign.getState().commit()} />
        {mixedOpacity && <MixedOpacityChips nodes={nodes} />}
      </Field>
      <Field label={mixedBlend ? "Blend · mixed" : "Blend"}>{mixedBlend && <MixedBlendChips nodes={nodes} />}</Field>
      <Field label={mixedVis ? "Visibility · mixed" : "Visibility"}>
        <div className="flex gap-1">
          <button type="button" className="h-7 rounded-[8px] border border-border px-2 text-[10px] text-ink-dim" onClick={() => updateNodes(ids, { visible: true }, true)}>Show all</button>
          <button type="button" className="h-7 rounded-[8px] border border-border px-2 text-[10px] text-ink-dim" onClick={() => updateNodes(ids, { visible: false }, true)}>Hide all</button>
        </div>
        {mixedVis && <MixedVisibilityChips nodes={nodes} />}
      </Field>
      <Field label={mixedLock ? "Lock · mixed" : "Lock"}>
        <div className="flex gap-1">
          <button type="button" className="h-7 rounded-[8px] border border-border px-2 text-[10px] text-ink-dim" onClick={() => updateNodes(ids, { locked: true }, true)}>Lock all</button>
          <button type="button" className="h-7 rounded-[8px] border border-border px-2 text-[10px] text-ink-dim" onClick={() => updateNodes(ids, { locked: false }, true)}>Unlock all</button>
        </div>
        {mixedLock && <MixedLockChips nodes={nodes} />}
      </Field>
      <div className="mt-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-ink-dim">{mixedShadow ? "Shadow · mixed" : first.shadow ? "Shadow" : "Shadow off"}</span>
          <button type="button" className="text-[10px] text-phosphor" onClick={() => mapShadows((sh) => (sh ? null : { ...DEFAULT_SHADOW }), true)}>{nodes.every((n) => n.shadow) ? "Clear" : "Add"}</button>
        </div>
        <p className="mt-1 text-[10px] text-ink-faint">selection shadow x / y stay independent</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {nodes.map((n) => (
            <button key={`full-sh-${n.id}`} type="button" className="flex h-7 items-center rounded-full border border-phosphor/50 bg-surface-alt px-2 font-mono text-[9px] text-phosphor" title={`Unify full shadow with ${n.name || n.kind}: ${shadowChipLabel(n.shadow)}`} aria-label={`Unify full shadow with ${n.name || n.kind}: ${shadowChipLabel(n.shadow)}`} onClick={() => mapShadows(() => cloneShadow(n.shadow), true)}>{shadowChipLabel(n.shadow)}</button>
          ))}
        </div>
        <Field label={mixedColor ? "Colour · mixed" : "Colour"}>
          <input type="color" className={cn("h-8 w-full rounded-[8px] border border-border", mixedColor && "ghost")} value={ghost.color} title="Unify shadow ox" aria-label={mixedColor ? "selection shadow colour mixed ghost" : "selection shadow colour"} onChange={(e) => { const color = e.target.value; mapShadows((sh) => stampShadowColor(sh, color)); }} onPointerUp={() => useDesign.getState().commit()} />
          {mixedColor && <MixedShadowColorChips nodes={nodes} />}
        </Field>
        <Field label={mixedBlur ? "Blur · mixed" : `Blur ${ghost.blur}`}>
          <input type="range" className={cn("range-phosphor w-full", mixedBlur && "ghost opacity-70")} min={0} max={80} value={ghost.blur} aria-label={mixedBlur ? "selection shadow blur mixed ghost" : "selection shadow blur"} onChange={(e) => { const blur = Number(e.target.value); mapShadows((sh) => stampShadowBlur(sh, blur)); }} onPointerUp={() => useDesign.getState().commit()} />
          {mixedBlur && <MixedShadowBlurChips nodes={nodes} />}
        </Field>
        <Field label={mixedOx ? "X · mixed" : `X ${ghost.ox}`}>
          <input type="range" className={cn("range-phosphor w-full", mixedOx && "ghost opacity-70")} min={-40} max={40} value={ghost.ox} title="Unify shadow ox" aria-label={mixedOx ? "selection shadow x mixed ghost" : "selection shadow x"} onChange={(e) => { const ox = Number(e.target.value); mapShadows((sh) => stampShadowOx(sh, ox)); }} onPointerUp={() => useDesign.getState().commit()} />
          {mixedOx && <MixedShadowOffsetChips nodes={nodes} axis="ox" />}
        </Field>
        <Field label={mixedOy ? "Y · mixed" : `Y ${ghost.oy}`}>
          <input type="range" className={cn("range-phosphor w-full", mixedOy && "ghost opacity-70")} min={-40} max={40} value={ghost.oy} title="Unify shadow oy" aria-label={mixedOy ? "selection shadow y mixed ghost" : "selection shadow y"} onChange={(e) => { const oy = Number(e.target.value); mapShadows((sh) => stampShadowOy(sh, oy)); }} onPointerUp={() => useDesign.getState().commit()} />
          {mixedOy && <MixedShadowOffsetChips nodes={nodes} axis="oy" />}
        </Field>
        <Field label={mixedSpread ? "Spread · mixed" : `Spread ${shadowSpread(ghost)}`}>
          <input type="range" className={cn("range-phosphor w-full", mixedSpread && "ghost opacity-70")} min={0} max={40} value={shadowSpread(ghost)} aria-label={mixedSpread ? "selection shadow spread mixed ghost" : "selection shadow spread"} onChange={(e) => { const spread = Number(e.target.value); mapShadows((sh) => stampShadowSpread(sh, spread)); }} onPointerUp={() => useDesign.getState().commit()} />
          {mixedSpread && <MixedShadowSpreadChips nodes={nodes} />}
        </Field>
        <Field label={mixedInset ? "Inset · mixed" : shadowInset(ghost) ? "Inset" : "Drop"}>
          <label className="flex items-center gap-2 text-[11px] text-ink-dim">
            <input type="checkbox" className={cn(mixedInset && "ghost")} checked={shadowInset(ghost)} aria-label={mixedInset ? "selection shadow inset mixed ghost" : "selection shadow inset"} onChange={(e) => { const inset = e.target.checked; mapShadows((sh) => stampShadowInset(sh, inset), true); }} />
            Inset
          </label>
          {mixedInset && <MixedShadowInsetChips nodes={nodes} />}
        </Field>
      </div>
    </section>
  );
}
