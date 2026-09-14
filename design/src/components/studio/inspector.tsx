import { countIslandItems } from "@/lib/design/align";
import { useDesign } from "@/lib/design/store";
import type { BlendMode, TextNode } from "@/lib/design/types";
import { isImage, isPath } from "@/lib/design/types";
import { cn } from "@/lib/utils";
import { NumField } from "./num-field";
import { FillEditor, Section, ShadowEditor, Swatches, Field } from "./inspector-parts";
import { MixedInk } from "./mixed-ink";
import { MixedFilters } from "./mixed-filters";
import { MixedType } from "./mixed-type";
import { MixedTypeColour } from "./mixed-type-colour";
import { PathFields } from "./inspector-path";
import { HotspotField, ImageFields, LinkedRow, TextFields } from "./inspector-type";

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
  const safeArea = useDesign((s) => s.safeArea);
  const toggleSafeArea = useDesign((s) => s.toggleSafeArea);
  const setBleed = useDesign((s) => s.setBleed);
  const brand = useDesign((s) => s.brand);
  const color = useDesign((s) => s.color);
  const setColor = useDesign((s) => s.setColor);
  const flipSelected = useDesign((s) => s.flipSelected);
  const rotateSelected = useDesign((s) => s.rotateSelected);
  const distributeSelected = useDesign((s) => s.distributeSelected);
  const alignSelected = useDesign((s) => s.alignSelected);
  const alignTarget = useDesign((s) => s.alignTarget) as string;
  const setAlignTarget = useDesign((s) => s.setAlignTarget);
  const setAlignHoverEdge = useDesign((s) => s.setAlignHoverEdge);

  if (!doc) return null;
  const islandItems = countIslandItems(doc.nodes, selection);
  const selectedNodes = selection
    .map((id) => doc.nodes.find((n) => n.id === id))
    .filter((n): n is NonNullable<typeof n> => Boolean(n));
  const node = selectedNodes[selectedNodes.length - 1] ?? null;
  const multi = selectedNodes.length > 1;
  const ids = selectedNodes.map((n) => n.id);
  const mixedName = multi && new Set(selectedNodes.map((n) => n.name)).size > 1;
  const mixedGeom = {
    x: multi && new Set(selectedNodes.map((n) => n.x)).size > 1,
    y: multi && new Set(selectedNodes.map((n) => n.y)).size > 1,
    w: multi && new Set(selectedNodes.map((n) => n.w)).size > 1,
    h: multi && new Set(selectedNodes.map((n) => n.h)).size > 1,
  };
  const mixedRotation = multi && new Set(selectedNodes.map((n) => Math.round(n.rotation * 100) / 100)).size > 1;
  const rects = selectedNodes.filter((n) => n.kind === "rect");
  const texts = selectedNodes.filter((n): n is TextNode => n.kind === "text");
  const mixedKinds = texts.length >= 1 && texts.length < selectedNodes.length;
  const mixedRadius = rects.length > 1 && new Set(rects.map((n) => Math.round(n.radius * 100) / 100)).size > 1;
  const bg = typeof doc.artboard.background === "string" ? doc.artboard.background : "#ffffff";

  return (
    <div className="overflow-auto px-3 pb-4 scrollbar-thin">
      <Section title="Artboard">
        <label className="text-[11px] text-ink-dim">
          Ground
          <input type="color" className="mt-1 h-8 w-full rounded-[8px] border border-border bg-surface-alt" value={bg} onChange={(e) => setArtboardBg(e.target.value)} />
        </label>
        <Swatches colors={brand.colors} onPick={setArtboardBg} />
        <label className="flex items-center gap-2 text-[11px] text-ink-dim">
          <input type="checkbox" checked={safeArea} onChange={toggleSafeArea} />
          Safe area
        </label>
        <Field label={`Bleed ${doc.artboard.bleed ?? 0}px`}>
          <input type="range" className="range-phosphor w-full" min={0} max={72} step={6} value={doc.artboard.bleed ?? 0} onChange={(e) => setBleed(Number(e.target.value))} />
        </Field>
        <Field label="Speaker notes">
          <textarea className="field min-h-16" placeholder="Shown in present mode" value={doc.notes ?? ""} onChange={(e) => useDesign.getState().setNotes(e.target.value)} />
        </Field>
      </Section>

      <Section title="Ink">
        <input type="color" className="h-8 w-full rounded-[8px] border border-border bg-surface-alt" value={color} onChange={(e) => setColor(e.target.value)} />
        <Swatches colors={brand.colors} onPick={setColor} />
      </Section>

      {multi && (
        <MixedInk nodes={selectedNodes} brandColors={brand.colors} ink={color} />
      )}
      {multi && <MixedFilters nodes={selectedNodes} />}
      {mixedKinds && (
        <MixedTypeColour nodes={texts} brandColors={brand.colors} ink={color} />
      )}
      {texts.length >= 2 && <MixedType nodes={texts} />}

      {node && (
        <Section title={multi ? `Key · ${node.name || node.kind}` : node.name || node.kind}>
          <Field label={mixedName ? "Name · mixed" : "Name"}>
            <input
              className="field"
              value={mixedName ? "" : node.name}
              placeholder={mixedName ? "\u2014" : undefined}
              aria-label={mixedName ? "name mixed" : "name"}
              onChange={(e) => updateNodes(multi ? ids : [node.id], { name: e.target.value }, true)}
            />
          </Field>
          {multi && (
            <p className="mb-2 text-[10px] text-ink-dim">
              A dash means the selection disagrees. Edit applies to all {selectedNodes.length} layers.
            </p>
          )}
          <LinkedRow nodeId={node.id} linkId={node.linkId} />
          <HotspotField node={node} />
          <div className="grid grid-cols-2 gap-2">
            {(["x", "y", "w", "h"] as const).map((k) => (
              <Field key={k} label={mixedGeom[k] ? `${k.toUpperCase()} · mixed` : k.toUpperCase()}>
                <NumField
                  value={node[k]}
                  mixed={mixedGeom[k]}
                  min={k === "w" || k === "h" ? 1 : undefined}
                  aria-label={`geometry ${k}`}
                  onCommit={(n) => updateNodes(multi ? ids : [node.id], { [k]: n }, true)}
                />
              </Field>
            ))}
          </div>
          <Field label={mixedRotation ? "Rotate · mixed" : `Rotate ${Math.round(node.rotation)}°`}>
            <div className="flex items-center gap-2">
              <input
                type="range"
                className={cn("range-phosphor min-w-0 flex-1", mixedRotation && "opacity-70")}
                min={-180}
                max={180}
                aria-label={mixedRotation ? "rotate mixed" : "rotate"}
                value={mixedRotation ? 0 : node.rotation}
                onChange={(e) => updateNodes(multi ? ids : [node.id], { rotation: Number(e.target.value) })}
                onPointerUp={() => useDesign.getState().commit()}
              />
              <NumField
                className="field w-16 font-mono"
                value={node.rotation}
                mixed={mixedRotation}
                min={-180}
                max={180}
                aria-label="rotate"
                onCommit={(n) => updateNodes(multi ? ids : [node.id], { rotation: n }, true)}
              />
            </div>
          </Field>
          {!multi && <Field label={`Opacity ${Math.round(node.opacity * 100)}%`}>
            <div className="flex items-center gap-2">
              <input
                type="range"
                className="range-phosphor min-w-0 flex-1"
                min={0}
                max={1}
                step={0.01}
                aria-label="opacity"
                value={node.opacity}
                onChange={(e) => updateNodes([node.id], { opacity: Number(e.target.value) })}
                onPointerUp={() => useDesign.getState().commit()}
              />
              <NumField
                className="field w-16 font-mono"
                value={Math.round(node.opacity * 100)}
                min={0}
                max={100}
                aria-label="opacity"
                onCommit={(n) => updateNodes([node.id], { opacity: n / 100 }, true)}
              />
            </div>
          </Field>}
          {!multi && <FillEditor node={node} />}
          {!multi && <Field label="Stroke">
            <div className="flex gap-2">
              <input type="color" className="h-8 flex-1 rounded-[8px] border border-border" value={node.stroke === "transparent" ? "#3fc6ff" : node.stroke} onChange={(e) => updateNodes([node.id], { stroke: e.target.value, strokeWidth: Math.max(node.strokeWidth, 1) }, true)} />
              <NumField
                className="field w-16 font-mono"
                value={node.strokeWidth}
                min={0}
                aria-label="stroke width"
                onCommit={(n) => updateNodes([node.id], { strokeWidth: n }, true)}
              />
            </div>
          </Field>}
          {(node.kind === "rect" || rects.length > 0) && (
            <Field label={mixedRadius ? "Radius · mixed" : `Radius ${Math.round(node.kind === "rect" ? node.radius : (rects[0]?.radius ?? 0))}`}>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  className={cn("range-phosphor min-w-0 flex-1", mixedRadius && "opacity-70")}
                  min={0}
                  max={Math.max(0, Math.min(node.w, node.h) / 2)}
                  aria-label={mixedRadius ? "corner radius mixed" : "corner radius"}
                  value={mixedRadius ? 0 : node.kind === "rect" ? node.radius : (rects[0]?.radius ?? 0)}
                  onChange={(e) =>
                    updateNodes(
                      multi ? rects.map((r) => r.id) : [node.id],
                      { radius: Number(e.target.value) },
                    )
                  }
                  onPointerUp={() => useDesign.getState().commit()}
                />
                <NumField
                  className="field w-16 font-mono"
                  value={node.kind === "rect" ? node.radius : (rects[0]?.radius ?? 0)}
                  mixed={mixedRadius}
                  min={0}
                  max={Math.max(0, Math.min(node.w, node.h) / 2)}
                  aria-label="corner radius"
                  onCommit={(n) =>
                    updateNodes(multi ? rects.map((r) => r.id) : [node.id], { radius: n }, true)
                  }
                />
              </div>
            </Field>
          )}
          {!multi && (
            <Field label="Blend">
              <select className="field" value={node.blend} onChange={(e) => updateNodes([node.id], { blend: e.target.value as BlendMode }, true)}>
                {BLENDS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </Field>
          )}
          {!multi && <ShadowEditor node={node} />}
          {node.kind === "text" && <TextFields node={node} hideType={selectedNodes.filter((n) => n.kind === "text").length >= 2} />}
          {isImage(node) && (
            <ImageFields
              node={node}
              hideFilters={selectedNodes.filter(isImage).length > 1}
            />
          )}
          {isPath(node) && <PathFields node={node} />}
          <Field label="Align">
            <div className="mb-1 grid grid-cols-3 gap-1">
              <button type="button" disabled={islandItems < 2} className={cn("h-7 rounded-[8px] text-[10px]", islandItems >= 2 && alignTarget === "selection" ? "bg-phosphor/15 text-phosphor" : "border border-border text-ink-dim", islandItems < 2 && "opacity-40")} onClick={() => setAlignTarget("selection")}>Selection</button>
              <button type="button" disabled={islandItems < 2} className={cn("h-7 rounded-[8px] text-[10px]", islandItems >= 2 && alignTarget === "key" ? "bg-phosphor/15 text-phosphor" : "border border-border text-ink-dim", islandItems < 2 && "opacity-40")} onClick={() => setAlignTarget("key")}>Key</button>
              <button type="button" className={cn("h-7 rounded-[8px] text-[10px]", alignTarget === "artboard" || islandItems < 2 ? "bg-phosphor/15 text-phosphor" : "border border-border text-ink-dim")} onClick={() => setAlignTarget("artboard")}>Artboard</button>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(["left", "center", "right", "top", "middle", "bottom"] as const).map((edge) => (
                <button
                  key={edge}
                  type="button"
                  className="h-8 rounded-[8px] border border-border text-[10px] text-ink-dim capitalize hover:border-phosphor hover:text-ink"
                  onPointerEnter={() => setAlignHoverEdge(edge)}
                  onPointerLeave={() => setAlignHoverEdge(null)}
                  onClick={() => alignSelected(edge, islandItems > 1 ? alignTarget : "artboard")}
                >{edge}</button>
              ))}
            </div>
          </Field>
          {islandItems >= 3 && (
            <Field label="Distribute">
              <div className="grid grid-cols-2 gap-1">
                <button type="button" className="h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink" onClick={() => distributeSelected("h")}>Horizontal</button>
                <button type="button" className="h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink" onClick={() => distributeSelected("v")}>Vertical</button>
              </div>
            </Field>
          )}
          <Field label="Transform">
            <div className="grid grid-cols-2 gap-1">
              <button type="button" className="h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink" onClick={() => flipSelected("h")}>Flip H</button>
              <button type="button" className="h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink" onClick={() => flipSelected("v")}>Flip V</button>
              <button type="button" className="h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink" onClick={() => rotateSelected(-90)}>−90°</button>
              <button type="button" className="h-8 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink" onClick={() => rotateSelected(90)}>+90°</button>
            </div>
          </Field>
        </Section>
      )}
    </div>
  );
}
