import { CANVAS_FONTS } from "@/lib/design/fonts";
import { paletteFromSrc, paletteName } from "@/lib/design/palette";
import { bestInk, contrastRatio, solidHex, wcagLevel } from "@/lib/design/contrast";
import {
  DEFAULT_SHADOW,
  shadowInset,
  shadowPreviewCss,
  shadowSpread,
  stampShadowBlur,
  stampShadowColor,
  stampShadowInset,
  stampShadowOx,
  stampShadowOy,
  stampShadowSpread,
} from "@/lib/design/shadow";
import { useDesign } from "@/lib/design/store";
import type { Align, DesignNode, GradientFill, ImageNode, TextNode } from "@/lib/design/types";
import { isGradient } from "@/lib/design/types";
import { cn } from "@/lib/utils";

export function FillEditor({ node }: { node: DesignNode }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  const fill = node.fill;
  const gradient = isGradient(fill);

  function toggle() {
    if (gradient) {
      updateNodes([node.id], { fill: fill.stops[0]?.color ?? "#d9f5e3" }, true);
    } else {
      const c = typeof fill === "string" && fill !== "transparent" ? fill : "#3fc6ff";
      updateNodes(
        [node.id],
        {
          fill: {
            type: "linear",
            angle: 180,
            stops: [
              { offset: 0, color: c },
              { offset: 1, color: "#0a0d0c" },
            ],
          } satisfies GradientFill,
        },
        true,
      );
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-ink-dim">Fill</span>
        <button type="button" className="text-[10px] text-phosphor" onClick={toggle}>
          {gradient ? "Solid" : "Gradient"}
        </button>
      </div>
      {!gradient && (
        <input
          type="color"
          className="h-8 w-full rounded-[8px] border border-border"
          value={typeof fill === "string" && fill !== "transparent" ? fill : "#d9f5e3"}
          onChange={(e) => updateNodes([node.id], { fill: e.target.value }, true)}
        />
      )}
      {gradient && (
        <div className="flex flex-col gap-2">
          <Field label={`Angle ${fill.angle}°`}>
            <input
              type="range"
              className="range-phosphor w-full"
              min={0}
              max={360}
              value={fill.angle}
              onChange={(e) =>
                updateNodes([node.id], { fill: { ...fill, angle: Number(e.target.value) } }, false)
              }
            />
          </Field>
          {fill.stops.map((stop, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="color"
                className="h-8 w-12 rounded-[8px] border border-border"
                value={stop.color}
                onChange={(e) => {
                  const stops = fill.stops.map((s, j) => (j === i ? { ...s, color: e.target.value } : s));
                  updateNodes([node.id], { fill: { ...fill, stops } }, true);
                }}
              />
              <input
                type="range"
                className="range-phosphor flex-1"
                min={0}
                max={1}
                step={0.01}
                value={stop.offset}
                onChange={(e) => {
                  const stops = fill.stops.map((s, j) => (j === i ? { ...s, offset: Number(e.target.value) } : s));
                  updateNodes([node.id], { fill: { ...fill, stops } }, false);
                }}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export function ShadowEditor({ nodes }: { nodes: DesignNode[] }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  const mapNodes = useDesign((s) => s.mapNodes);
  const commit = () => useDesign.getState().commit();
  const node = nodes[nodes.length - 1];
  if (!node) return null;
  const ids = nodes.map((n) => n.id);
  const multi = nodes.length > 1;
  const sh = node.shadow;
  const ghost = sh ?? DEFAULT_SHADOW;
  const inset = shadowInset(sh);
  const spread = shadowSpread(sh);
  const mixedOn = multi && new Set(nodes.map((n) => Boolean(n.shadow))).size > 1;
  const mixedColor =
    multi && new Set(nodes.map((n) => n.shadow?.color ?? DEFAULT_SHADOW.color)).size > 1;
  const mixedBlur =
    multi && new Set(nodes.map((n) => n.shadow?.blur ?? DEFAULT_SHADOW.blur)).size > 1;
  const mixedOx =
    multi && new Set(nodes.map((n) => n.shadow?.ox ?? DEFAULT_SHADOW.ox)).size > 1;
  const mixedOy =
    multi && new Set(nodes.map((n) => n.shadow?.oy ?? DEFAULT_SHADOW.oy)).size > 1;
  const mixedSpread = multi && new Set(nodes.map((n) => shadowSpread(n.shadow))).size > 1;
  const mixedInset = multi && new Set(nodes.map((n) => shadowInset(n.shadow))).size > 1;
  const anyOn = nodes.some((n) => n.shadow);

  function stampAll(map: (shadow: DesignNode["shadow"]) => NonNullable<DesignNode["shadow"]>, commitNow = false) {
    mapNodes(
      ids,
      (layer) => ({
        ...layer,
        shadow: map(layer.shadow),
      }),
      commitNow,
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-ink-dim">
          {mixedOn
            ? "Shadow \u00b7 mixed"
            : sh
              ? inset
                ? "Shadow \u00b7 inset"
                : "Shadow \u00b7 drop"
              : "Shadow off"}
        </span>
        <div className="flex items-center gap-2">
          {(sh || mixedOn) && (
            <span
              aria-hidden="true"
              title={inset ? "Inset preview" : "Drop preview"}
              className="inline-block size-7 shrink-0 rounded-[6px] border border-border bg-surface-alt"
              data-shadow-preview={inset ? "inset" : "drop"}
              style={{ boxShadow: shadowPreviewCss(ghost) }}
            />
          )}
          <button
            type="button"
            className="text-[10px] text-phosphor"
            onClick={() => updateNodes(ids, { shadow: anyOn ? null : { ...DEFAULT_SHADOW } }, true)}
          >
            {anyOn ? "Clear" : "Add"}
          </button>
        </div>
      </div>
      {(sh || multi) && (
        <div className="mt-2 flex flex-col gap-2">
          <Field label={mixedColor ? "Colour \u00b7 mixed" : "Colour"}>
            <input
              type="color"
              className={cn("h-8 w-full rounded-[8px] border border-border", mixedColor && "opacity-70")}
              value={ghost.color}
              aria-label={mixedColor ? "layer shadow colour mixed" : "layer shadow colour"}
              onChange={(e) => stampAll((cur) => stampShadowColor(cur, e.target.value))}
              onPointerUp={commit}
            />
          </Field>
          <Field label={mixedBlur ? "Blur \u00b7 mixed" : `Blur ${ghost.blur}`}>
            <input
              type="range"
              className={cn("range-phosphor w-full", mixedBlur && "opacity-70")}
              min={0}
              max={80}
              value={mixedBlur ? 0 : ghost.blur}
              aria-label={mixedBlur ? "layer shadow blur mixed" : "layer shadow blur"}
              onChange={(e) => stampAll((cur) => stampShadowBlur(cur, Number(e.target.value)))}
              onPointerUp={commit}
            />
          </Field>
          <Field label={mixedOx ? "X \u00b7 mixed" : `X ${ghost.ox}`}>
            <input
              type="range"
              className={cn("range-phosphor w-full", mixedOx && "opacity-70")}
              min={-40}
              max={40}
              value={mixedOx ? 0 : ghost.ox}
              aria-label={mixedOx ? "layer shadow x mixed" : "layer shadow x"}
              onChange={(e) => stampAll((cur) => stampShadowOx(cur, Number(e.target.value)))}
              onPointerUp={commit}
            />
          </Field>
          <Field label={mixedOy ? "Y \u00b7 mixed" : `Y ${ghost.oy}`}>
            <input
              type="range"
              className={cn("range-phosphor w-full", mixedOy && "opacity-70")}
              min={-40}
              max={40}
              value={mixedOy ? 0 : ghost.oy}
              aria-label={mixedOy ? "layer shadow y mixed" : "layer shadow y"}
              onChange={(e) => stampAll((cur) => stampShadowOy(cur, Number(e.target.value)))}
              onPointerUp={commit}
            />
          </Field>
          <Field label={mixedSpread ? "Spread \u00b7 mixed" : `Spread ${spread}`}>
            <input
              type="range"
              className={cn("range-phosphor w-full", mixedSpread && "opacity-70")}
              min={0}
              max={40}
              value={mixedSpread ? 0 : spread}
              aria-label={mixedSpread ? "layer shadow spread mixed" : "layer shadow spread"}
              onChange={(e) => stampAll((cur) => stampShadowSpread(cur, Number(e.target.value)))}
              onPointerUp={commit}
            />
          </Field>
          <Field label={mixedInset ? "Inset \u00b7 mixed" : inset ? "Inset" : "Drop"}>
            <label className="flex items-center gap-2 text-[11px] text-ink-dim">
              <input
                type="checkbox"
                checked={mixedInset ? false : inset}
                aria-label={mixedInset ? "layer shadow inset mixed" : "layer shadow inset"}
                onChange={(e) => stampAll((cur) => stampShadowInset(cur, e.target.checked), true)}
              />
              Inset
            </label>
          </Field>
        </div>
      )}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-[11px] text-ink-dim">
      <span className="mb-1 block">{label}</span>
      {children}
    </label>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border py-3">
      <div className="mb-2 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">{title}</div>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

export function Swatches({ colors, onPick }: { colors: { name: string; hex: string }[]; onPick: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {colors.map((c) => (
        <button
          key={c.hex}
          type="button"
          className="size-6 rounded-full border border-border"
          style={{ background: c.hex }}
          onClick={() => onPick(c.hex)}
          aria-label={c.name}
          title={c.name}
        />
      ))}
    </div>
  );
}
