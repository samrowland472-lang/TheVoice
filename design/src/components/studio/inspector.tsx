import { useDesign } from "@/lib/design/store";
import type { BlendMode, TextNode } from "@/lib/design/types";
import { NumField } from "./num-field";
import { MixedInk } from "./mixed-ink";
import { MixedType } from "./mixed-type";
import { FillEditor, Field, ShadowEditor } from "./inspector-parts";

const BLENDS: { id: BlendMode; label: string }[] = [
  { id: "source-over", label: "Normal" },
  { id: "multiply", label: "Multiply" },
  { id: "screen", label: "Screen" },
  { id: "overlay", label: "Overlay" },
  { id: "darken", label: "Darken" },
  { id: "lighten", label: "Lighten" },
  { id: "soft-light", label: "Soft light" },
  { id: "hard-light", label: "Hard light" },
  { id: "color-dodge", label: "Color dodge" },
  { id: "color-burn", label: "Color burn" },
];

export function Inspector() {
  const doc = useDesign((s) => s.doc);
  const selection = useDesign((s) => s.selection);
  const updateNodes = useDesign((s) => s.updateNodes);
  const setArtboardBg = useDesign((s) => s.setArtboardBg);
  const brand = useDesign((s) => s.brand);
  const color = useDesign((s) => s.color);

  if (!doc) return null;

  const selectedNodes = selection
    .map((id) => doc.nodes.find((n) => n.id === id))
    .filter((n): n is NonNullable<typeof n> => Boolean(n));
  const node = selectedNodes[selectedNodes.length - 1] ?? null;
  const ids = selectedNodes.map((n) => n.id);
  const texts = selectedNodes.filter((n): n is TextNode => n.kind === "text");
  const bg = typeof doc.artboard.background === "string" ? doc.artboard.background : "#ffffff";
  const mixedOpacity = new Set(selectedNodes.map((n) => n.opacity)).size > 1;
  const mixedBlend = new Set(selectedNodes.map((n) => n.blend)).size > 1;

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col overflow-y-auto border-l border-border bg-surface">
      <div className="border-b border-border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">
        Inspector
      </div>
      <section className="space-y-2 border-b border-border px-3 py-3">
        <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">Board</div>
        <label className="flex items-center justify-between gap-2 font-mono text-[10px] text-ink-dim">
          Background
          <input type="color" value={bg} aria-label="Artboard background" className="h-6 w-8 cursor-pointer border border-border bg-transparent" onChange={(e) => setArtboardBg(e.target.value)} />
        </label>
      </section>
      {!node ? (
        <p className="px-3 py-4 font-mono text-[11px] text-ink-faint">Select a layer to inspect.</p>
      ) : (
        <>
          <section className="space-y-2 border-b border-border px-3 py-3">
            <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
              {selectedNodes.length > 1 ? `${selectedNodes.length} layers` : node.name}
            </div>
            <label className="block font-mono text-[10px] text-ink-dim">
              Name
              <input className="mt-1 w-full border border-border bg-ground px-2 py-1 font-mono text-[11px] text-ink" value={node.name} onChange={(e) => updateNodes(ids, { name: e.target.value })} />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <NumField aria-label="X" value={node.x} onCommit={(x) => updateNodes(ids, { x })} />
              <NumField aria-label="Y" value={node.y} onCommit={(y) => updateNodes(ids, { y })} />
              <NumField aria-label="W" value={node.w} onCommit={(w) => updateNodes(ids, { w })} />
              <NumField aria-label="H" value={node.h} onCommit={(h) => updateNodes(ids, { h })} />
              <NumField aria-label="Rotation" value={Math.round(node.rotation)} onCommit={(rotation) => updateNodes(ids, { rotation })} />
              <NumField aria-label="Radius" value={node.radius} onCommit={(radius) => updateNodes(ids, { radius })} />
            </div>
          </section>
          <section className="space-y-2 border-b border-border px-3 py-3">
            <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">Layer</div>
            <Field label={mixedOpacity ? "Opacity · mixed" : `Opacity ${Math.round(node.opacity * 100)}%`}>
              <input
                type="range"
                className="range-phosphor w-full"
                min={0}
                max={1}
                step={0.01}
                value={node.opacity}
                aria-label="Layer opacity"
                onChange={(e) => updateNodes(ids, { opacity: Number(e.target.value) })}
                onPointerUp={() => useDesign.getState().commit()}
              />
            </Field>
            <Field label={mixedBlend ? "Blend · mixed" : "Blend"}>
              <select
                className="field w-full font-mono text-[11px]"
                aria-label="Layer blend mode"
                value={mixedBlend ? "" : node.blend}
                onChange={(e) => {
                  const next = e.target.value as BlendMode;
                  if (BLENDS.some((b) => b.id === next)) updateNodes(ids, { blend: next }, true);
                }}
              >
                {mixedBlend && <option value="">Mixed</option>}
                {BLENDS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex gap-1">
              <button
                type="button"
                className="h-7 flex-1 rounded-[8px] border border-border px-2 text-[10px] text-ink-dim"
                onClick={() => updateNodes(ids, { visible: !node.visible }, true)}
              >
                {node.visible ? "Hide" : "Show"}
              </button>
              <button
                type="button"
                className="h-7 flex-1 rounded-[8px] border border-border px-2 text-[10px] text-ink-dim"
                onClick={() => updateNodes(ids, { locked: !node.locked }, true)}
              >
                {node.locked ? "Unlock" : "Lock"}
              </button>
            </div>
          </section>
          {selectedNodes.length === 1 && (
            <section className="space-y-2 border-b border-border px-3 py-3">
              <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">Ink</div>
              <FillEditor node={node} />
              <ShadowEditor nodes={selectedNodes} />
            </section>
          )}
          {selectedNodes.length > 1 && (
            <section className="border-b border-border px-3 py-3">
              <MixedInk nodes={selectedNodes} brandColors={brand.colors} ink={color} />
            </section>
          )}
          {texts.length > 0 && (
            <section className="border-b border-border px-3 py-3">
              <MixedType nodes={texts} />
            </section>
          )}
        </>
      )}
    </aside>
  );
}
