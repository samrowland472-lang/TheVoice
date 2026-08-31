import { useEffect, useState } from "react";
import { CANVAS_FONTS } from "@/lib/design/fonts";
import { paletteFromSrc, paletteName } from "@/lib/design/palette";
import { bestInk, contrastRatio, solidHex, wcagLevel } from "@/lib/design/contrast";
import { useDesign } from "@/lib/design/store";
import type { Align, DesignNode, ImageNode, TextNode } from "@/lib/design/types";
import { Field } from "./inspector-parts";
import { NumField } from "./num-field";

export function TextFields({ node }: { node: TextNode }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  const brand = useDesign((s) => s.brand);
  const display = brand.displayFont || "Chakra Petch";
  const body = brand.bodyFont || "Outfit";
  return (
    <>
      <Field label="Copy">
        <textarea
          className="field min-h-20"
          value={node.text}
          onChange={(e) => updateNodes([node.id], { text: e.target.value } as Partial<DesignNode>)}
        />
      </Field>
      <div className="flex gap-1">
        <button
          type="button"
          className="h-8 flex-1 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
          onClick={() => updateNodes([node.id], { fontFamily: display, fontWeight: 600, fontSize: Math.max(node.fontSize, 40) } as Partial<DesignNode>, true)}
        >
          Display
        </button>
        <button
          type="button"
          className="h-8 flex-1 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
          onClick={() => updateNodes([node.id], { fontFamily: body, fontWeight: 400, fontSize: Math.min(node.fontSize, 28) } as Partial<DesignNode>, true)}
        >
          Body
        </button>
      </div>
      <ContrastMeter node={node} />
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
      <Field label={`Size ${Math.round(node.fontSize)}`}>
        <div className="flex items-center gap-2">
          <input type="range" className="range-phosphor min-w-0 flex-1" min={6} max={400} step={1} aria-label="type size" value={node.fontSize} onChange={(e) => updateNodes([node.id], { fontSize: Number(e.target.value) } as Partial<DesignNode>)} onPointerUp={() => useDesign.getState().commit()} />
          <NumField className="field w-16 font-mono" value={node.fontSize} min={6} max={400} aria-label="type size" onCommit={(n) => updateNodes([node.id], { fontSize: n } as Partial<DesignNode>, true)} />
        </div>
      </Field>
      <Field label={`Weight ${node.fontWeight}`}>
        <div className="flex items-center gap-2">
          <input type="range" className="range-phosphor min-w-0 flex-1" min={400} max={800} step={100} aria-label="type weight" value={node.fontWeight} onChange={(e) => updateNodes([node.id], { fontWeight: Math.min(800, Math.max(400, Math.round(Number(e.target.value) / 100) * 100)) } as Partial<DesignNode>)} onPointerUp={() => useDesign.getState().commit()} />
          <NumField className="field w-16 font-mono" value={node.fontWeight} min={400} max={800} aria-label="type weight" onCommit={(n) => updateNodes([node.id], { fontWeight: Math.min(800, Math.max(400, Math.round(n / 100) * 100)) } as Partial<DesignNode>, true)} />
        </div>
      </Field>
      <Field label={`Tracking ${node.letterSpacing}`}>
        <div className="flex items-center gap-2">
          <input type="range" className="range-phosphor min-w-0 flex-1" min={-8} max={40} step={0.25} aria-label="type tracking" value={node.letterSpacing} onChange={(e) => updateNodes([node.id], { letterSpacing: Number(e.target.value) } as Partial<DesignNode>)} onPointerUp={() => useDesign.getState().commit()} />
          <NumField className="field w-16 font-mono" value={node.letterSpacing} min={-8} max={40} aria-label="type tracking" onCommit={(n) => updateNodes([node.id], { letterSpacing: n } as Partial<DesignNode>, true)} />
        </div>
      </Field>
      <Field label={`Leading ${node.lineHeight.toFixed(2)}`}>
        <div className="flex items-center gap-2">
          <input type="range" className="range-phosphor min-w-0 flex-1" min={0.7} max={2} step={0.02} aria-label="type leading" value={node.lineHeight} onChange={(e) => updateNodes([node.id], { lineHeight: Number(e.target.value) } as Partial<DesignNode>)} onPointerUp={() => useDesign.getState().commit()} />
          <NumField className="field w-16 font-mono" value={node.lineHeight} min={0.7} max={2} aria-label="type leading" onCommit={(n) => updateNodes([node.id], { lineHeight: n } as Partial<DesignNode>, true)} />
        </div>
      </Field>
      <Field label="Align">
        <div className="flex gap-1">
          {(["left", "center", "right"] as Align[]).map((a) => (
            <button key={a} type="button" className={`h-8 flex-1 rounded-[8px] border text-xs capitalize ${node.align === a ? "border-phosphor text-phosphor" : "border-border text-ink-dim"}`} onClick={() => updateNodes([node.id], { align: a } as Partial<DesignNode>, true)}>
              {a}
            </button>
          ))}
        </div>
      </Field>
      <label className="flex items-center gap-2 text-xs text-ink-dim">
        <input type="checkbox" checked={node.uppercase} onChange={(e) => updateNodes([node.id], { uppercase: e.target.checked } as Partial<DesignNode>, true)} />
        Uppercase
      </label>
    </>
  );
}

export function ContrastMeter({ node }: { node: TextNode }) {
  const doc = useDesign((s) => s.doc);
  const brand = useDesign((s) => s.brand);
  if (!doc) return null;
  const ink = solidHex(node.fill, "#d9f5e3");
  const ground = solidHex(doc.artboard.background, "#0a0d0c");
  const ratio = contrastRatio(ink, ground);
  const large = node.fontSize >= 24 || (node.fontSize >= 18 && node.fontWeight >= 700);
  const level = ratio == null ? "fail" : wcagLevel(ratio, large);
  const suggested = bestInk(ground, brand.colors.map((c) => c.hex));
  return (
    <div className="flex items-center justify-between gap-2 text-[10px] text-ink-dim">
      <span>
        Contrast {ratio == null ? "\u2014" : ratio.toFixed(1)} \u00b7 {level.toUpperCase()}
      </span>
      {level === "fail" && (
        <button
          type="button"
          className="text-phosphor"
          onClick={() => useDesign.getState().updateNodes([node.id], { fill: suggested } as Partial<DesignNode>, true)}
        >
          Fix ink
        </button>
      )}
    </div>
  );
}

export function LinkedRow({ nodeId, linkId }: { nodeId: string; linkId?: string }) {
  const unlinkSelected = useDesign((s) => s.unlinkSelected);
  const duplicateLinked = useDesign((s) => s.duplicateLinked);
  const select = useDesign((s) => s.select);
  const doc = useDesign((s) => s.doc);
  const siblings = (doc?.nodes ?? []).filter((n) => linkId && n.linkId === linkId);
  return (
    <div className="flex items-center justify-between gap-2 text-[11px] text-ink-dim">
      <span>{linkId ? `Linked \u00b7 ${siblings.length}` : "Standalone"}</span>
      <div className="flex gap-1">
        {linkId && siblings.length > 1 && (
          <button
            type="button"
            className="h-7 rounded-[8px] border border-border px-2 text-[10px] hover:border-phosphor hover:text-ink"
            onClick={() => select(siblings.map((n) => n.id))}
          >
            Select all
          </button>
        )}
        {linkId ? (
          <button
            type="button"
            className="h-7 rounded-[8px] border border-border px-2 text-[10px] hover:border-phosphor hover:text-ink"
            onClick={() => {
              select([nodeId]);
              unlinkSelected();
            }}
          >
            Unlink
          </button>
        ) : (
          <button
            type="button"
            className="h-7 rounded-[8px] border border-border px-2 text-[10px] hover:border-phosphor hover:text-ink"
            onClick={() => {
              select([nodeId]);
              duplicateLinked();
            }}
          >
            Instance
          </button>
        )}
      </div>
    </div>
  );
}

export function HotspotField({ node }: { node: DesignNode }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  const index = useDesign((s) => s.index);
  const doc = useDesign((s) => s.doc);
  const pages = index.filter((p) => p.id !== doc?.id);
  return (
    <Field label="Hotspot">
      <input
        className="field"
        placeholder="https:// or pick a page"
        value={node.href ?? ""}
        onChange={(e) => updateNodes([node.id], { href: e.target.value || undefined }, true)}
      />
      {pages.length > 0 && (
        <select
          className="field mt-1"
          value={node.href?.startsWith("doc:") ? node.href : ""}
          onChange={(e) => updateNodes([node.id], { href: e.target.value || undefined }, true)}
        >
          <option value="">Page link</option>
          {pages.map((p) => (
            <option key={p.id} value={`doc:${p.id}`}>
              {p.name}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function ImageFields({ node }: { node: ImageNode }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  const addBrandColor = useDesign((s) => s.addBrandColor);
  const [swatches, setSwatches] = useState<string[]>([]);
  const filters = node.filters ?? { brightness: 1, contrast: 1, saturate: 1, blur: 0 };

  useEffect(() => {
    let alive = true;
    void paletteFromSrc(node.src)
      .then((colors) => {
        if (alive) setSwatches(colors);
      })
      .catch(() => {
        if (alive) setSwatches([]);
      });
    return () => {
      alive = false;
    };
  }, [node.src]);

  function patchFilter(key: keyof ImageNode["filters"], value: number) {
    updateNodes([node.id], { filters: { ...filters, [key]: value } } as Partial<DesignNode>, true);
  }

  function liveFilter(key: keyof ImageNode["filters"], value: number) {
    updateNodes([node.id], { filters: { ...filters, [key]: value } } as Partial<DesignNode>);
  }

  return (
    <>
      {swatches.length > 0 && (
        <Field label="Sampled ink">
          <div className="flex flex-wrap gap-1.5">
            {swatches.map((hex, i) => (
              <button
                key={hex + i}
                type="button"
                className="size-6 rounded-full border border-border"
                style={{ background: hex }}
                title={paletteName(hex, i)}
                aria-label={paletteName(hex, i)}
                onClick={() => addBrandColor(hex)}
              />
            ))}
          </div>
        </Field>
      )}
      <Field label="Crop">
        <div className="flex gap-1">
          <button
            type="button"
            className="h-8 flex-1 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
            onClick={() => updateNodes([node.id], { crop: null } as Partial<DesignNode>, true)}
          >
            Full frame
          </button>
          <button
            type="button"
            className="h-8 flex-1 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
            onClick={() =>
              updateNodes([node.id], { crop: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 } } as Partial<DesignNode>, true)
            }
          >
            Inset
          </button>
        </div>
      </Field>
      {(
        [
          { key: "brightness" as const, label: "Brightness", min: 0, max: 2, step: 0.01 },
          { key: "contrast" as const, label: "Contrast", min: 0, max: 2, step: 0.01 },
          { key: "saturate" as const, label: "Saturate", min: 0, max: 2, step: 0.01 },
          { key: "blur" as const, label: "Blur", min: 0, max: 24, step: 0.25 },
        ] as const
      ).map((f) => (
        <Field key={f.key} label={`${f.label} ${f.key === "blur" ? filters[f.key] : Math.round(filters[f.key] * 100)}`}>
          <div className="flex items-center gap-2">
            <input
              type="range"
              className="range-phosphor min-w-0 flex-1"
              min={f.min}
              max={f.max}
              step={f.step}
              aria-label={f.label.toLowerCase()}
              value={filters[f.key]}
              onChange={(e) => liveFilter(f.key, Number(e.target.value))}
              onPointerUp={() => useDesign.getState().commit()}
            />
            <NumField
              className="field w-16 font-mono"
              value={f.key === "blur" ? filters[f.key] : Math.round(filters[f.key] * 100)}
              min={0}
              max={f.key === "blur" ? 24 : 200}
              aria-label={f.label.toLowerCase()}
              onCommit={(n) => patchFilter(f.key, f.key === "blur" ? n : n / 100)}
            />
          </div>
        </Field>
      ))}
    </>
  );
}
