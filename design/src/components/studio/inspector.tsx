import { CANVAS_FONTS } from "@/lib/design/fonts";
import { useDesign } from "@/lib/design/store";
import type { Align, BlendMode, DesignNode, GradientFill, ImageNode, TextNode } from "@/lib/design/types";
import { isGradient, isImage } from "@/lib/design/types";

const BLENDS: BlendMode[] = [
  "source-over",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "soft-light",
];

export function Inspector() {
  const doc = useDesign((s) => s.doc);
  const selection = useDesign((s) => s.selection);
  const updateNodes = useDesign((s) => s.updateNodes);
  const setArtboardBg = useDesign((s) => s.setArtboardBg);
  const brand = useDesign((s) => s.brand);
  const color = useDesign((s) => s.color);
  const setColor = useDesign((s) => s.setColor);
  const flipSelected = useDesign((s) => s.flipSelected);
  const rotateSelected = useDesign((s) => s.rotateSelected);
  const distributeSelected = useDesign((s) => s.distributeSelected);
  const alignSelected = useDesign((s) => s.alignSelected);

  if (!doc) return null;
  const node = selection[0] ? doc.nodes.find((n) => n.id === selection[0]) : null;
  const bg = typeof doc.artboard.background === "string" ? doc.artboard.background : "#ffffff";

  return (
    <div className="overflow-auto px-3 pb-4 scrollbar-thin">
      <Section title="Artboard">
        <label className="text-[11px] text-ink-dim">
          Ground
          <input
            type="color"
            className="mt-1 h-8 w-full rounded-[8px] border border-border bg-surface-alt"
            value={bg}
            onChange={(e) => setArtboardBg(e.target.value)}
          />
        </label>
        <Swatches colors={brand.colors} onPick={setArtboardBg} />
      </Section>

      <Section title="Ink">
        <input
          type="color"
          className="h-8 w-full rounded-[8px] border border-border bg-surface-alt"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
        <Swatches colors={brand.colors} onPick={setColor} />
      </Section>

      {node && (
        <Section title={node.name || node.kind}>
          <Field label="Name">
            <input
              className="field"
              value={node.name}
              onChange={(e) => updateNodes([node.id], { name: e.target.value }, true)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            {(["x", "y", "w", "h"] as const).map((k) => (
              <Field key={k} label={k.toUpperCase()}>
                <input
                  className="field font-mono"
                  type="number"
                  value={Math.round(node[k])}
                  onChange={(e) => updateNodes([node.id], { [k]: Number(e.target.value) }, true)}
                />
              </Field>
            ))}
          </div>
          <Field label={`Rotate ${Math.round(node.rotation)}°`}>
            <input
              type="range"
              className="range-phosphor w-full"
              min={-180}
              max={180}
              value={node.rotation}
              onChange={(e) => updateNodes([node.id], { rotation: Number(e.target.value) })}
            />
          </Field>
          <Field label={`Opacity ${Math.round(node.opacity * 100)}%`}>
            <input
              type="range"
              className="range-phosphor w-full"
              min={0}
              max={1}
              step={0.01}
              value={node.opacity}
              onChange={(e) => updateNodes([node.id], { opacity: Number(e.target.value) })}
            />
          </Field>

          <FillEditor node={node} />

          <Field label="Stroke">
            <div className="flex gap-2">
              <input
                type="color"
                className="h-8 flex-1 rounded-[8px] border border-border"
                value={node.stroke === "transparent" ? "#3fc6ff" : node.stroke}
                onChange={(e) => updateNodes([node.id], { stroke: e.target.value, strokeWidth: Math.max(node.strokeWidth, 1) }, true)}
              />
              <input
                className="field w-16 font-mono"
                type="number"
                min={0}
                value={node.strokeWidth}
                onChange={(e) => updateNodes([node.id], { strokeWidth: Number(e.target.value) }, true)}
              />
            </div>
          </Field>
          {node.kind === "rect" && (
            <Field label={`Radius ${node.radius}`}>
              <input
                type="range"
                className="range-phosphor w-full"
                min={0}
                max={Math.min(node.w, node.h) / 2}
                value={node.radius}
                onChange={(e) => updateNodes([node.id], { radius: Number(e.target.value) })}
              />
            </Field>
          )}
          <Field label="Blend">
            <select
              className="field"
              value={node.blend}
              onChange={(e) => updateNodes([node.id], { blend: e.target.value as BlendMode }, true)}
            >
              {BLENDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </Field>

          <ShadowEditor node={node} />

          {node.kind === "text" && <TextFields node={node} />}
          {isImage(node) && <ImageFields node={node} />}

          <Field label={selection.length > 1 ? "Align selection" : "Align to artboard"}>
            <div className="grid grid-cols-3 gap-1">
              {(["left", "center", "right", "top", "middle", "bottom"] as const).map((edge) => (
                <button
                  key={edge}
                  type="button"
                  className="h-8 rounded-[8px] border border-border text-[10px] text-ink-dim capitalize hover:border-phosphor hover:text-ink"
                  onClick={() => alignSelected(edge)}
                >
                  {edge}
                </button>
              ))}
            </div>
          </Field>
          {selection.length >= 3 && (
            <Field label="Distribute">
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  className="h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
                  onClick={() => distributeSelected("h")}
                >
                  Horizontal
                </button>
                <button
                  type="button"
                  className="h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
                  onClick={() => distributeSelected("v")}
                >
                  Vertical
                </button>
              </div>
            </Field>
          )}
          <Field label="Transform">
            <div className="grid grid-cols-2 gap-1">
              <button type="button" className="h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink" onClick={() => flipSelected("h")}>
                Flip H
              </button>
              <button type="button" className="h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink" onClick={() => flipSelected("v")}>
                Flip V
              </button>
              <button type="button" className="h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink" onClick={() => rotateSelected(-90)}>
                −90°
              </button>
              <button type="button" className="h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink" onClick={() => rotateSelected(90)}>
                +90°
              </button>
            </div>
          </Field>
        </Section>
      )}
    </div>
  );
}

function FillEditor({ node }: { node: DesignNode }) {
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

function ShadowEditor({ node }: { node: DesignNode }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  const sh = node.shadow;
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-ink-dim">Shadow</span>
        <button
          type="button"
          className="text-[10px] text-phosphor"
          onClick={() =>
            updateNodes(
              [node.id],
              { shadow: sh ? null : { color: "#000000", blur: 28, ox: 0, oy: 18 } },
              true,
            )
          }
        >
          {sh ? "Clear" : "Add"}
        </button>
      </div>
      {sh && (
        <div className="mt-2 flex flex-col gap-2">
          <input
            type="color"
            className="h-8 w-full rounded-[8px] border border-border"
            value={sh.color}
            onChange={(e) => updateNodes([node.id], { shadow: { ...sh, color: e.target.value } }, true)}
          />
          <Field label={`Blur ${sh.blur}`}>
            <input
              type="range"
              className="range-phosphor w-full"
              min={0}
              max={80}
              value={sh.blur}
              onChange={(e) => updateNodes([node.id], { shadow: { ...sh, blur: Number(e.target.value) } })}
            />
          </Field>
          <Field label={`Y ${sh.oy}`}>
            <input
              type="range"
              className="range-phosphor w-full"
              min={-40}
              max={40}
              value={sh.oy}
              onChange={(e) => updateNodes([node.id], { shadow: { ...sh, oy: Number(e.target.value) } })}
            />
          </Field>
        </div>
      )}
    </div>
  );
}

function TextFields({ node }: { node: TextNode }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  return (
    <>
      <Field label="Copy">
        <textarea
          className="field min-h-20"
          value={node.text}
          onChange={(e) => updateNodes([node.id], { text: e.target.value } as Partial<DesignNode>)}
        />
      </Field>
      <Field label="Font">
        <select
          className="field"
          value={node.fontFamily}
          onChange={(e) => updateNodes([node.id], { fontFamily: e.target.value } as Partial<DesignNode>, true)}
        >
          {CANVAS_FONTS.map((f) => (
            <option key={f.id} value={f.family}>
              {f.family}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Size">
          <input
            className="field font-mono"
            type="number"
            value={Math.round(node.fontSize)}
            onChange={(e) => updateNodes([node.id], { fontSize: Number(e.target.value) } as Partial<DesignNode>, true)}
          />
        </Field>
        <Field label="Weight">
          <select
            className="field"
            value={node.fontWeight}
            onChange={(e) => updateNodes([node.id], { fontWeight: Number(e.target.value) } as Partial<DesignNode>, true)}
          >
            {[400, 500, 600, 700, 800].map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label={`Tracking ${node.letterSpacing}`}>
        <input
          type="range"
          className="range-phosphor w-full"
          min={-8}
          max={40}
          value={node.letterSpacing}
          onChange={(e) => updateNodes([node.id], { letterSpacing: Number(e.target.value) } as Partial<DesignNode>)}
        />
      </Field>
      <Field label={`Leading ${node.lineHeight.toFixed(2)}`}>
        <input
          type="range"
          className="range-phosphor w-full"
          min={0.7}
          max={2}
          step={0.02}
          value={node.lineHeight}
          onChange={(e) => updateNodes([node.id], { lineHeight: Number(e.target.value) } as Partial<DesignNode>)}
        />
      </Field>
      <Field label="Align">
        <div className="flex gap-1">
          {(["left", "center", "right"] as Align[]).map((a) => (
            <button
              key={a}
              type="button"
              className={`h-8 flex-1 rounded-[8px] border text-xs capitalize ${node.align === a ? "border-phosphor text-phosphor" : "border-border text-ink-dim"}`}
              onClick={() => updateNodes([node.id], { align: a } as Partial<DesignNode>, true)}
            >
              {a}
            </button>
          ))}
        </div>
      </Field>
      <label className="flex items-center gap-2 text-xs text-ink-dim">
        <input
          type="checkbox"
          checked={node.uppercase}
          onChange={(e) => updateNodes([node.id], { uppercase: e.target.checked } as Partial<DesignNode>, true)}
        />
        Uppercase
      </label>
    </>
  );
}

function ImageFields({ node }: { node: ImageNode }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  const f = node.filters;
  function set(partial: Partial<ImageNode["filters"]>) {
    updateNodes([node.id], { filters: { ...f, ...partial } } as Partial<DesignNode>);
  }
  return (
    <>
      <Field label={`Brightness ${f.brightness.toFixed(2)}`}>
        <input type="range" className="range-phosphor w-full" min={0.2} max={2} step={0.02} value={f.brightness} onChange={(e) => set({ brightness: Number(e.target.value) })} />
      </Field>
      <Field label={`Contrast ${f.contrast.toFixed(2)}`}>
        <input type="range" className="range-phosphor w-full" min={0.2} max={2} step={0.02} value={f.contrast} onChange={(e) => set({ contrast: Number(e.target.value) })} />
      </Field>
      <Field label={`Saturate ${f.saturate.toFixed(2)}`}>
        <input type="range" className="range-phosphor w-full" min={0} max={2} step={0.02} value={f.saturate} onChange={(e) => set({ saturate: Number(e.target.value) })} />
      </Field>
      <Field label={`Blur ${f.blur}`}>
        <input type="range" className="range-phosphor w-full" min={0} max={24} value={f.blur} onChange={(e) => set({ blur: Number(e.target.value) })} />
      </Field>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border py-3">
      <div className="mb-2 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">{title}</div>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-[11px] text-ink-dim">
      <span className="mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function Swatches({ colors, onPick }: { colors: string[]; onPick: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          className="size-6 rounded-full border border-border"
          style={{ background: c }}
          onClick={() => onPick(c)}
          aria-label={c}
        />
      ))}
    </div>
  );
}
