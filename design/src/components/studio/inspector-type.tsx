import { CANVAS_FONTS } from "@/lib/design/fonts";
import { paletteFromSrc, paletteName } from "@/lib/design/palette";
import { bestInk, contrastRatio, solidHex, wcagLevel } from "@/lib/design/contrast";
import { useDesign } from "@/lib/design/store";
import type { Align, DesignNode, ImageNode, TextNode } from "@/lib/design/types";
import { cn } from "@/lib/utils";
import { Field } from "./inspector-parts";

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
      <div className="grid grid-cols-2 gap-2">
        <Field label="Size">
          <input className="field font-mono" type="number" value={Math.round(node.fontSize)} onChange={(e) => updateNodes([node.id], { fontSize: Number(e.target.value) } as Partial<DesignNode>, true)} />
        </Field>
        <Field label="Weight">
          <select className="field" value={node.fontWeight} onChange={(e) => updateNodes([node.id], { fontWeight: Number(e.target.value) } as Partial<DesignNode>, true)}>
            {[400, 500, 600, 700, 800].map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label={`Tracking ${node.letterSpacing}`}>
        <input type="range" className="range-phosphor w-full" min={-8} max={40} value={node.letterSpacing} onChange={(e) => updateNodes([node.id], { letterSpacing: Number(e.target.value) } as Partial<DesignNode>)} />
      </Field>
      <Field label={`Leading ${node.lineHeight.toFixed(2)}`}>
        <input type="range" className="range-phosphor w-full" min={0.7} max={2} step={0.02} value={node.lineHeight} onChange={(e) => updateNodes([node.id], { lineHeight: Number(e.target.value) } as Partial<DesignNode>)} />
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
  const updateNodes = useDesign((s) => s.updateNodes);
  if (!doc) return null;
  const fg = solidHex(node.fill, "#d9f5e3");
  const idx = doc.nodes.findIndex((n) => n.id === node.id);
  let bg = solidHex(doc.artboard.background, "#0a0d0c");
  let vs = "artboard";
  for (let i = idx - 1; i >= 0; i--) {
    const n = doc.nodes[i]!;
    if (!n.visible || n.kind === "text" || n.kind === "paint" || n.kind === "image") continue;
    const overlap = node.x < n.x + n.w && node.x + node.w > n.x && node.y < n.y + n.h && node.y + node.h > n.y;
    if (!overlap) continue;
    const hex = solidHex(n.fill, "");
    if (!hex) continue;
    bg = hex;
    vs = n.name || n.kind;
    break;
  }
  const ratio = contrastRatio(fg, bg);
  if (ratio == null) return null;
  const large = node.fontSize >= 24 || node.fontWeight >= 700;
  const level = wcagLevel(ratio, large);
  const pass = level !== "fail";
  return (
    <div className="rounded-[12px] border border-border bg-surface-alt px-2 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] tracking-[0.16em] text-ink-faint uppercase">Contrast</span>
        <span className={cn("font-mono text-[11px]", pass ? "text-phosphor" : "text-alert")}>
          {ratio.toFixed(1)}:1 · {level === "fail" ? "fail" : level}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-[10px] text-ink-dim">
        <span className="size-3 rounded-sm border border-border" style={{ background: fg }} />
        <span>on</span>
        <span className="size-3 rounded-sm border border-border" style={{ background: bg }} />
        <span className="truncate">{vs}</span>
        {!pass && (
          <button type="button" className="ml-auto text-phosphor" onClick={() => {
            const ink = bestInk(bg, brand.colors.map((c) => c.hex));
            updateNodes([node.id], { fill: ink } as Partial<DesignNode>, true);
          }}>Fix</button>
        )}
      </div>
    </div>
  );
}

export function ImageFields({ node }: { node: ImageNode }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  const setBrand = useDesign((s) => s.setBrand);
  const f = node.filters;
  const crop = node.crop ?? { x: 0, y: 0, w: 1, h: 1 };
  const left = crop.x;
  const top = crop.y;
  const right = Math.max(0, 1 - crop.x - crop.w);
  const bottom = Math.max(0, 1 - crop.y - crop.h);
  function set(partial: Partial<ImageNode["filters"]>) {
    updateNodes([node.id], { filters: { ...f, ...partial } } as Partial<DesignNode>);
  }
  function setInsets(next: { left?: number; top?: number; right?: number; bottom?: number }) {
    const L = next.left ?? left;
    const T = next.top ?? top;
    const R = next.right ?? right;
    const B = next.bottom ?? bottom;
    const w = Math.max(0.08, 1 - L - R);
    const h = Math.max(0.08, 1 - T - B);
    const full = L === 0 && T === 0 && R === 0 && B === 0;
    updateNodes([node.id], { crop: full ? null : { x: L, y: T, w, h } } as Partial<DesignNode>);
  }
  return (
    <>
      <button type="button" className="h-8 w-full rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink" onClick={() => {
        void paletteFromSrc(node.src, 6).then((hexes) => {
          const cur = useDesign.getState().brand;
          const extra = hexes.filter((hex) => !cur.colors.some((c) => c.hex.toLowerCase() === hex)).map((hex, i) => ({ name: paletteName(hex, i), hex }));
          if (extra.length) setBrand({ ...cur, colors: [...cur.colors, ...extra].slice(0, 12) });
        });
      }}>Palette to brand</button>
      <Field label="Crop">
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[10px] text-ink-faint">Left {Math.round(left * 100)}%<input type="range" className="range-phosphor w-full" min={0} max={0.4} step={0.01} value={left} onChange={(e) => setInsets({ left: Number(e.target.value) })} /></label>
          <label className="text-[10px] text-ink-faint">Right {Math.round(right * 100)}%<input type="range" className="range-phosphor w-full" min={0} max={0.4} step={0.01} value={right} onChange={(e) => setInsets({ right: Number(e.target.value) })} /></label>
          <label className="text-[10px] text-ink-faint">Top {Math.round(top * 100)}%<input type="range" className="range-phosphor w-full" min={0} max={0.4} step={0.01} value={top} onChange={(e) => setInsets({ top: Number(e.target.value) })} /></label>
          <label className="text-[10px] text-ink-faint">Bottom {Math.round(bottom * 100)}%<input type="range" className="range-phosphor w-full" min={0} max={0.4} step={0.01} value={bottom} onChange={(e) => setInsets({ bottom: Number(e.target.value) })} /></label>
        </div>
        <button type="button" className="mt-1 h-7 w-full rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink" onClick={() => updateNodes([node.id], { crop: null } as Partial<DesignNode>, true)}>Reset crop</button>
      </Field>
      <Field label={`Mask radius ${Math.round(node.radius)}`}>
        <input type="range" className="range-phosphor w-full" min={0} max={Math.round(Math.min(node.w, node.h) / 2)} value={node.radius} onChange={(e) => updateNodes([node.id], { radius: Number(e.target.value) })} />
      </Field>
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

export function HotspotField({ node }: { node: DesignNode }) {
  const doc = useDesign((s) => s.doc);
  const index = useDesign((s) => s.index);
  const updateNodes = useDesign((s) => s.updateNodes);
  if (!doc) return null;
  const pages = doc.campaignId ? index.filter((p) => p.campaignId === doc.campaignId && p.id !== doc.id) : [];
  const href = node.href ?? "";
  const isUrl = href.startsWith("http://") || href.startsWith("https://");
  const selectValue = !href ? "" : href.startsWith("doc:") ? href : "url";
  return (
    <Field label="Hotspot">
      <select className="field" value={selectValue} onChange={(e) => {
        const v = e.target.value;
        if (v === "url") updateNodes([node.id], { href: "https://" } as Partial<DesignNode>, true);
        else updateNodes([node.id], { href: v || undefined } as Partial<DesignNode>, true);
      }}>
        <option value="">None</option>
        {pages.map((p) => (
          <option key={p.id} value={`doc:${p.id}`}>{p.name}</option>
        ))}
        <option value="url">URL…</option>
      </select>
      {isUrl || selectValue === "url" ? (
        <input className="field mt-1" placeholder="https://" value={isUrl ? href : ""} onChange={(e) => updateNodes([node.id], { href: e.target.value } as Partial<DesignNode>)} />
      ) : null}
    </Field>
  );
}

export function LinkedRow({ nodeId, linkId }: { nodeId: string; linkId?: string }) {
  const doc = useDesign((s) => s.doc);
  const duplicateLinked = useDesign((s) => s.duplicateLinked);
  const unlinkSelected = useDesign((s) => s.unlinkSelected);
  const select = useDesign((s) => s.select);
  const count = linkId && doc ? doc.nodes.filter((n) => n.linkId === linkId).length : 0;
  return (
    <div className="flex items-center gap-1">
      <button type="button" className="h-8 flex-1 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink" onClick={() => duplicateLinked()}>
        Linked copy
      </button>
      {count > 1 && (
        <>
          <button type="button" className="h-8 rounded-[8px] border border-phosphor/40 px-2 font-mono text-[10px] text-phosphor" onClick={() => {
            if (!doc || !linkId) return;
            select(doc.nodes.filter((n) => n.linkId === linkId).map((n) => n.id));
          }}>{count}</button>
          <button type="button" className="h-8 rounded-[8px] border border-border px-2 text-[10px] text-ink-dim hover:text-ink" onClick={() => {
            select([nodeId]);
            unlinkSelected();
          }}>Unlink</button>
        </>
      )}
    </div>
  );
}
