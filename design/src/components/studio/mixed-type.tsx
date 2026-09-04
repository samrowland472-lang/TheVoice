import { CANVAS_FONTS, anyFaceHasAxis, clampAxis, faceAxis } from "@/lib/design/fonts";
import { useDesign } from "@/lib/design/store";
import {
  clampTypeSize,
  cloneType,
  scaledTypeSizes,
  typeChipLabel,
  typeKey,
  type TypeStyle,
} from "@/lib/design/text-style";
import type { Align, DesignNode, TextNode } from "@/lib/design/types";
import { NumField } from "./num-field";
import { MixedAxisSliders } from "./mixed-type-axes";

const ALIGNS: Align[] = ["left", "center", "right"];

// MixedAxisSliders exposes "type optical size mixed" and "type width mixed".

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function formatNum(n: number) {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

function faceSupports(family: string, tag: "opsz" | "wdth") {
  return Boolean(faceAxis(family, tag));
}

export function MixedType({ nodes }: { nodes: TextNode[] }) {
  const updateNodes = useDesign((s) => s.updateNodes);
  const brand = useDesign((s) => s.brand);
  const ids = nodes.map((n) => n.id);
  const sizes = unique(nodes.map((n) => Math.round(n.fontSize)));
  const weights = unique(nodes.map((n) => n.fontWeight));
  const families = unique(nodes.map((n) => n.fontFamily));
  const trackings = unique(nodes.map((n) => Math.round(n.letterSpacing * 100) / 100));
  const leadings = unique(nodes.map((n) => Math.round(n.lineHeight * 100) / 100));
  const aligns = unique(nodes.map((n) => n.align));
  const mixedSize = sizes.length > 1;
  const mixedWeight = weights.length > 1;
  const mixedFamily = families.length > 1;
  const mixedTracking = trackings.length > 1;
  const mixedLeading = leadings.length > 1;
  const mixedAlign = aligns.length > 1;
  const mixedCase = unique(nodes.map((n) => Boolean(n.uppercase))).length > 1;
  const mixedStack = new Set(nodes.map((n) => typeKey(n))).size > 1;
  const keyNode = nodes[nodes.length - 1]!;
  const display = brand.displayFont || "Chakra Petch";
  const body = brand.bodyFont || "Outfit";

  function patch(partial: Partial<TextNode>, commit = true) {
    updateNodes(ids, partial as Partial<DesignNode>, commit);
  }

  function stampType(style: TypeStyle, commit = true) {
    patch(cloneType(style), commit);
  }

  function writeAxis(tag: "opsz" | "wdth", value: number | undefined, commit = true) {
    const idsForAxis = new Set(nodes.filter((n) => faceSupports(n.fontFamily, tag)).map((n) => n.id));
    if (!idsForAxis.size) return;
    if (value != null) {
      const partial = tag === "opsz" ? { opticalSize: value } : { fontWidth: value };
      updateNodes([...idsForAxis], partial as Partial<DesignNode>, commit);
      return;
    }
    if (commit) useDesign.getState().commit();
    const doc = useDesign.getState().doc;
    if (!doc) return;
    useDesign.setState({
      doc: {
        ...doc,
        nodes: doc.nodes.map((n) => {
          if (!idsForAxis.has(n.id) || n.kind !== "text") return n;
          const next = { ...n };
          if (tag === "opsz") delete next.opticalSize;
          else delete next.fontWidth;
          return next;
        }),
      },
      dirty: true,
    });
  }

  function writeSize(nextKeySize: number, commit: boolean, flatten: boolean) {
    const size = clampTypeSize(nextKeySize);
    if (flatten || !mixedSize) {
      patch({ fontSize: size }, commit);
      return;
    }
    const scaled = scaledTypeSizes(nodes, keyNode.id, size);
    if (commit) useDesign.getState().commit();
    const doc = useDesign.getState().doc;
    if (!doc) return;
    useDesign.setState({
      doc: {
        ...doc,
        nodes: doc.nodes.map((n) => {
          const next = scaled.get(n.id);
          return next == null ? n : { ...n, fontSize: next };
        }),
      },
      dirty: true,
    });
  }

  function patchAxes(partial: Partial<TextNode>, commit = true) {
    if ("opticalSize" in partial) {
      writeAxis("opsz", partial.opticalSize, commit);
      return;
    }
    if ("fontWidth" in partial) {
      writeAxis("wdth", partial.fontWidth, commit);
      return;
    }
    patch(partial, commit);
  }

  return (
    <section className="border-b border-border py-3">
      <div className="mb-2 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">Type · {nodes.length} layers</div>
      <p className="mb-2 text-[10px] text-ink-dim">Family, weight, tracking, leading and align write onto every selected text layer. A mixed size slider scales from the key so the stack keeps its steps; type a size to flatten.</p>
      <div className="mb-2 flex gap-1">
        <button type="button" className="h-8 flex-1 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink" onClick={() => patch({ fontFamily: display, fontWeight: 600, fontSize: Math.max(...nodes.map((n) => n.fontSize), 40) })}>Display</button>
        <button type="button" className="h-8 flex-1 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink" onClick={() => patch({ fontFamily: body, fontWeight: 400, fontSize: Math.min(...nodes.map((n) => n.fontSize), 28) })}>Body</button>
      </div>
      <label className="mb-2 block text-[11px] text-ink-dim">
        <span className="mb-1 block">{mixedFamily ? "Family · mixed" : "Family"}</span>
        <select className="field" aria-label={mixedFamily ? "type family mixed" : "type family"} value={mixedFamily ? "" : keyNode.fontFamily} onChange={(e) => { const family = e.target.value; if (!family) return; patch({ fontFamily: family }); }}>
          {mixedFamily && (<option value="" disabled>Mixed</option>)}
          {CANVAS_FONTS.map((f) => (<option key={f.id} value={f.family}>{f.family}</option>))}
        </select>
      </label>
      <label className="block text-[11px] text-ink-dim">
        <span className="mb-1 block">{mixedSize ? "Size · mixed · scale from key" : `Size ${formatNum(keyNode.fontSize)}`}</span>
        <div className="flex items-center gap-2">
          <input type="range" className="range-phosphor min-w-0 flex-1" min={6} max={400} step={1} aria-label={mixedSize ? "type size mixed" : "type size"} value={keyNode.fontSize} onChange={(e) => writeSize(Number(e.target.value), false, false)} onPointerUp={() => useDesign.getState().commit()} />
          <NumField className="field w-16 font-mono" value={keyNode.fontSize} mixed={mixedSize} min={6} max={400} aria-label="type size" onCommit={(n) => writeSize(n, true, true)} />
        </div>
      </label>
      <label className="mt-2 block text-[11px] text-ink-dim">
        <span className="mb-1 block">{mixedWeight ? "Weight · mixed" : `Weight ${formatNum(keyNode.fontWeight)}`}</span>
        <div className="flex items-center gap-2">
          <input type="range" className="range-phosphor min-w-0 flex-1" min={400} max={800} step={100} aria-label={mixedWeight ? "type weight mixed" : "type weight"} value={keyNode.fontWeight} onChange={(e) => patch({ fontWeight: Math.min(800, Math.max(400, Math.round(Number(e.target.value) / 100) * 100)) }, false)} onPointerUp={() => useDesign.getState().commit()} />
          <NumField className="field w-16 font-mono" value={keyNode.fontWeight} mixed={mixedWeight} min={400} max={800} aria-label="type weight" onCommit={(n) => patch({ fontWeight: Math.min(800, Math.max(400, Math.round(n / 100) * 100)) })} />
        </div>
      </label>
      <label className="mt-2 block text-[11px] text-ink-dim">
        <span className="mb-1 block">{mixedTracking ? "Tracking · mixed" : `Tracking ${formatNum(keyNode.letterSpacing)}`}</span>
        <div className="flex items-center gap-2">
          <input type="range" className="range-phosphor min-w-0 flex-1" min={-8} max={40} step={0.25} aria-label={mixedTracking ? "type tracking mixed" : "type tracking"} value={keyNode.letterSpacing} onChange={(e) => patch({ letterSpacing: Number(e.target.value) }, false)} onPointerUp={() => useDesign.getState().commit()} />
          <NumField className="field w-16 font-mono" value={keyNode.letterSpacing} mixed={mixedTracking} min={-8} max={40} aria-label="type tracking" onCommit={(n) => patch({ letterSpacing: n })} />
        </div>
      </label>
      <label className="mt-2 block text-[11px] text-ink-dim">
        <span className="mb-1 block">{mixedLeading ? "Leading · mixed" : `Leading ${formatNum(keyNode.lineHeight)}`}</span>
        <div className="flex items-center gap-2">
          <input type="range" className="range-phosphor min-w-0 flex-1" min={0.7} max={2} step={0.02} aria-label={mixedLeading ? "type leading mixed" : "type leading"} value={keyNode.lineHeight} onChange={(e) => patch({ lineHeight: Number(e.target.value) }, false)} onPointerUp={() => useDesign.getState().commit()} />
          <NumField className="field w-16 font-mono" value={keyNode.lineHeight} mixed={mixedLeading} min={0.7} max={2} aria-label="type leading" onCommit={(n) => patch({ lineHeight: n })} />
        </div>
      </label>
      <MixedAxisSliders nodes={nodes} patch={patchAxes} />
      <div className="mt-2">
        <div className="mb-1 text-[11px] text-ink-dim">{mixedAlign ? "Align · mixed" : "Align"}</div>
        <div className="flex gap-1" role="group" aria-label={mixedAlign ? "type align mixed" : "type align"}>
          {ALIGNS.map((a) => (
            <button key={a} type="button" className={`h-8 flex-1 rounded-[8px] border text-xs capitalize ${!mixedAlign && keyNode.align === a ? "border-phosphor text-phosphor" : "border-border text-ink-dim"}`} onClick={() => patch({ align: a })}>{a}</button>
          ))}
        </div>
      </div>
      <label className="mt-2 flex items-center gap-2 text-xs text-ink-dim">
        <input type="checkbox" aria-label={mixedCase ? "type uppercase mixed" : "type uppercase"} checked={!mixedCase && keyNode.uppercase} onChange={(e) => patch({ uppercase: e.target.checked })} />
        {mixedCase ? "Uppercase · mixed" : "Uppercase"}
      </label>
      {mixedStack && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {nodes.map((n) => (
            <button key={n.id} type="button" className="flex h-7 items-center rounded-full border border-phosphor/50 bg-surface-alt px-2 font-mono text-[9px] text-phosphor" title={`Unify full type with ${n.name || "text"}: ${typeChipLabel(n)}`} aria-label={`Unify full type with ${n.name || "text"}: ${typeChipLabel(n)}`} onClick={() => stampType(n)}>{typeChipLabel(n)}</button>
          ))}
        </div>
      )}
      <div className="mt-2 grid grid-cols-2 gap-1">
        <button type="button" className="h-8 rounded-[8px] border border-phosphor/40 text-[10px] text-phosphor hover:bg-phosphor/10" onClick={() => stampType(keyNode)}>Match key</button>
        <button type="button" className="h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink" onClick={() => patch({ fontFamily: "Chakra Petch", fontWeight: 600, fontSize: 48, letterSpacing: 0, lineHeight: 1.1, align: "left", uppercase: false, opticalSize: undefined, fontWidth: undefined })}>Reset type</button>
      </div>
    </section>
  );
}
