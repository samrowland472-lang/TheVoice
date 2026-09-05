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

export function ShadowEditor({ node }: { node: DesignNode }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  const commit = () => useDesign.getState().commit();
  const sh = node.shadow;
  const inset = shadowInset(sh);
  const spread = shadowSpread(sh);

  function write(next: NonNullable<DesignNode["shadow"]>, commitNow = false) {
    updateNodes([node.id], { shadow: next }, commitNow);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-ink-dim">{sh ? (inset ? "Shadow · inset" : "Shadow · drop") : "Shadow off"}</span>
        <div className="flex items-center gap-2">
          {sh && (
            <span
              aria-hidden="true"
              title={inset ? "Inset preview" : "Drop preview"}
              className="inline-block size-7 shrink-0 rounded-[6px] border border-border bg-surface-alt"
              data-shadow-preview={inset ? "inset" : "drop"}
              style={{ boxShadow: shadowPreviewCss(sh) }}
            />
          )}
          <button
            type="button"
            className="text-[10px] text-phosphor"
            onClick={() => updateNodes([node.id], { shadow: sh ? null : { ...DEFAULT_SHADOW } }, true)}
          >
            {sh ? "Clear" : "Add"}
          </button>
        </div>
      </div>
      {sh && (
        <div className="mt-2 flex flex-col gap-2">
          <Field label="Colour">
            <input
              type="color"
              className="h-8 w-full rounded-[8px] border border-border"
              value={sh.color}
              aria-label="layer shadow colour"
              onChange={(e) => write(stampShadowColor(sh, e.target.value))}
              onPointerUp={commit}
            />
          </Field>
          <Field label={`Blur ${sh.blur}`}>
            <input
              type="range"
              className="range-phosphor w-full"
              min={0}
              max={80}
              value={sh.blur}
              aria-label="layer shadow blur"
              onChange={(e) => write(stampShadowBlur(sh, Number(e.target.value)))}
              onPointerUp={commit}
            />
          </Field>
          <Field label={`X ${sh.ox}`}>
            <input
              type="range"
              className="range-phosphor w-full"
              min={-40}
              max={40}
              value={sh.ox}
              aria-label="layer shadow x"
              onChange={(e) => write(stampShadowOx(sh, Number(e.target.value)))}
              onPointerUp={commit}
            />
          </Field>
          <Field label={`Y ${sh.oy}`}>
            <input
              type="range"
              className="range-phosphor w-full"
              min={-40}
              max={40}
              value={sh.oy}
              aria-label="layer shadow y"
              onChange={(e) => write(stampShadowOy(sh, Number(e.target.value)))}
              onPointerUp={commit}
            />
          </Field>
          <Field label={`Spread ${spread}`}>
            <input
              type="range"
              className="range-phosphor w-full"
              min={0}
              max={40}
              value={spread}
              aria-label="layer shadow spread"
              onChange={(e) => write(stampShadowSpread(sh, Number(e.target.value)))}
              onPointerUp={commit}
            />
          </Field>
          <Field label={inset ? "Inset" : "Drop"}>
            <label className="flex items-center gap-2 text-[11px] text-ink-dim">
              <input
                type="checkbox"
                checked={inset}
                aria-label="layer shadow inset"
                onChange={(e) => write(stampShadowInset(sh, e.target.checked), true)}
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
