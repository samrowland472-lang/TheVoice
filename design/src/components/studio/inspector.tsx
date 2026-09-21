import { useDesign } from "@/lib/design/store";
import type { BlendMode, TextNode } from "@/lib/design/types";
import { NumField } from "./num-field";
import { MixedInk } from "./mixed-ink";
import { MixedType } from "./mixed-type";

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
  const flipSelected = useDesign((s) => s.flipSelected);
  const rotateSelected = useDesign((s) => s.rotateSelected);
  const alignSelected = useDesign((s) => s.alignSelected);

  if (!doc) return null;

  const selectedNodes = selection
    .map((id) => doc.nodes.find((n) => n.id === id))
    .filter((n): n is NonNullable<typeof n> => Boolean(n));
  const node = selectedNodes[selectedNodes.length - 1] ?? null;
  const ids = selectedNodes.map((n) => n.id);
  const texts = selectedNodes.filter((n): n is TextNode => n.kind === "text");
  const bg = typeof doc.artboard.background === "string" ? doc.artboard.background : "#ffffff";

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
          <section className="border-b border-border px-3 py-3">
            <MixedInk nodes={selectedNodes} brandColors={brand.colors} ink={color} />
          </section>
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
