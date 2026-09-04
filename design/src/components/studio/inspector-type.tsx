import { useEffect, useState } from "react";
import { CANVAS_FONTS, clampAxis, faceAxis } from "@/lib/design/fonts";
import { paletteFromSrc, paletteName } from "@/lib/design/palette";
import { bestInk, contrastRatio, solidHex, wcagLevel } from "@/lib/design/contrast";
import { useDesign } from "@/lib/design/store";
import type { Align, DesignNode, ImageNode, TextNode } from "@/lib/design/types";
import { Field } from "./inspector-parts";
import { NumField } from "./num-field";

export function TextFields({ node, hideType = false }: { node: TextNode; hideType?: boolean }) {
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
      {hideType ? null : (
      <>
      <div className="flex gap-1">
        <button type="button" className="h-8 flex-1 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink" onClick={() => updateNodes([node.id], { fontFamily: display, fontWeight: 600, fontSize: Math.max(node.fontSize, 40) } as Partial<DesignNode>, true)}>Display</button>
        <button type="button" className="h-8 flex-1 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink" onClick={() => updateNodes([node.id], { fontFamily: body, fontWeight: 400, fontSize: Math.min(node.fontSize, 28) } as Partial<DesignNode>, true)}>Body</button>
      </div>
      <ContrastMeter node={node} />
      <Field label="Font">
        <select className="field" value={node.fontFamily} onChange={(e) => updateNodes([node.id], { fontFamily: e.target.value } as Partial<DesignNode>, true)}>
          {CANVAS_FONTS.map((f) => (<option key={f.id} value={f.family}>{f.family}</option>))}
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
            <button key={a} type="button" className={`h-8 flex-1 rounded-[8px] border text-xs capitalize ${node.align === a ? "border-phosphor text-phosphor" : "border-border text-ink-dim"}`} onClick={() => updateNodes([node.id], { align: a } as Partial<DesignNode>, true)}>{a}</button>
          ))}
        </div>
      </Field>
      <label className="flex items-center gap-2 text-xs text-ink-dim">
        <input type="checkbox" checked={node.uppercase} onChange={(e) => updateNodes([node.id], { uppercase: e.target.checked } as Partial<DesignNode>, true)} />
        Uppercase
      </label>
      <TypeAxes node={node} />
      </>
      )}
    </>
  );
}

export function TypeAxes({ node }: { node: TextNode }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  const opsz = faceAxis(node.fontFamily, "opsz");
  const wdth = faceAxis(node.fontFamily, "wdth");
  if (!opsz && !wdth) return null;
  const opszValue = opsz ? clampAxis(opsz, node.opticalSize, node.fontSize) : 0;
  const wdthValue = wdth ? clampAxis(wdth, node.fontWidth) : 0;
  return (
    <>
      {opsz && (
        <Field label={`Optical ${Math.round(opszValue)}${node.opticalSize == null ? " · auto" : ""}`}>
          <div className="flex items-center gap-2">
            <input
              type="range"
              className="range-phosphor min-w-0 flex-1"
              min={opsz.min}
              max={opsz.max}
              step={1}
              aria-label="type optical size"
              value={opszValue}
              onChange={(e) => updateNodes([node.id], { opticalSize: Number(e.target.value) } as Partial<DesignNode>)}
              onPointerUp={() => useDesign.getState().commit()}
            />
            <NumField
              className="field w-16 font-mono"
              value={opszValue}
              min={opsz.min}
              max={opsz.max}
              aria-label="type optical size"
              onCommit={(n) => updateNodes([node.id], { opticalSize: n } as Partial<DesignNode>, true)}
            />
          </div>
          <button
            type="button"
            className="mt-1 h-7 rounded-[8px] border border-border px-2 text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
            onClick={() => {
              useDesign.getState().commit();
              const doc = useDesign.getState().doc;
              if (!doc) return;
              useDesign.setState({
                doc: {
                  ...doc,
                  nodes: doc.nodes.map((n) => {
                    if (n.id !== node.id || n.kind !== "text") return n;
                    const next = { ...n };
                    delete next.opticalSize;
                    return next;
                  }),
                },
                dirty: true,
              });
            }}
          >
            Auto from size
          </button>
        </Field>
      )}
      {wdth && (
        <Field label={`Width ${Math.round(wdthValue)}`}>
          <div className="flex items-center gap-2">
            <input
              type="range"
              className="range-phosphor min-w-0 flex-1"
              min={wdth.min}
              max={wdth.max}
              step={1}
              aria-label="type width"
              value={wdthValue}
              onChange={(e) => updateNodes([node.id], { fontWidth: Number(e.target.value) } as Partial<DesignNode>)}
              onPointerUp={() => useDesign.getState().commit()}
            />
            <NumField
              className="field w-16 font-mono"
              value={wdthValue}
              min={wdth.min}
              max={wdth.max}
              aria-label="type width"
              onCommit={(n) => updateNodes([node.id], { fontWidth: n } as Partial<DesignNode>, true)}
            />
          </div>
        </Field>
      )}
    </>
  );
}
