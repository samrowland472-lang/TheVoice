import { useSyncExternalStore } from "react";
import {
  alignCommitLayerFadeLine,
  alignCommitSolidLead,
  alignEdgeChipLabel,
  armAlignPreview,
  commitAlignPreview,
  getAlignCommitEcho,
  getAlignPreview,
  getAlignTarget,
  setAlignTarget,
  subscribeAlignCommitEcho,
  subscribeAlignPreview,
  subscribeAlignTarget,
  type AlignEdge,
  type AlignTarget,
} from "@/lib/design/align-preview";
import {
  armDistributePreview,
  commitDistributePreview,
  getDistributePreview,
  subscribeDistributePreview,
  type DistributeAxis,
} from "@/lib/design/distribute-preview";
import { getInspectorRail, setInspectorRail, subscribeInspectorRail } from "@/lib/design/inspector-rail";
import { useDesign } from "@/lib/design/store";
import type { DesignNode, PathNode, TextNode } from "@/lib/design/types";
import { isGroup, isPath, isText } from "@/lib/design/types";
import { cn } from "@/lib/utils";
import { FillEditor, ShadowEditor, Field, Section } from "./inspector-parts";
import { ImageAdjust } from "./image-adjust";
import { PathFields } from "./inspector-path";
import { TextFields } from "./inspector-type";
import { MixedType } from "./mixed-type";
import { MixedTypeColour } from "./mixed-type-colour";
import { MixedFilters } from "./mixed-filters";
import { MixedFillRule } from "./mixed-fill-rule";
import { MixedPathDash } from "./mixed-path-dash";
import { MixedGeometry } from "./mixed-geometry";
import { BooleanButtons } from "./boolean-buttons";
import { InspectorPrint } from "./inspector-print";
import { NumField } from "./num-field";

const EDGES: AlignEdge[] = ["left", "center", "right", "top", "middle", "bottom"];
const EDGE_LABEL: Record<AlignEdge, string> = {
  left: "Left",
  center: "Center",
  right: "Right",
  top: "Top",
  middle: "Middle",
  bottom: "Bottom",
};

function useAlign() {
  const live = useSyncExternalStore(subscribeAlignPreview, getAlignPreview, getAlignPreview);
  const echo = useSyncExternalStore(subscribeAlignCommitEcho, getAlignCommitEcho, getAlignCommitEcho);
  const target = useSyncExternalStore(subscribeAlignTarget, getAlignTarget, getAlignTarget);
  return { live, echo, target };
}

function useDistribute() {
  return useSyncExternalStore(subscribeDistributePreview, getDistributePreview, getDistributePreview);
}

export function Inspector() {
  const doc = useDesign((s) => s.doc);
  const selection = useDesign((s) => s.selection);
  const updateNodes = useDesign((s) => s.updateNodes);
  const rail = useSyncExternalStore(subscribeInspectorRail, getInspectorRail, getInspectorRail);
  const { live, echo, target } = useAlign();
  const distribute = useDistribute();

  if (!doc) return null;

  const selectedNodes = doc.nodes.filter((n): n is DesignNode => selection.includes(n.id));
  const node = selectedNodes.length === 1 ? selectedNodes[0] : null;
  const texts = selectedNodes.filter((n): n is TextNode => isText(n));
  const paths = selectedNodes.filter((n): n is PathNode => isPath(n));
  const outlines = selectedNodes.filter((n) =>
    ["path", "rect", "ellipse", "line", "polygon", "star", "arrow"].includes(n.kind),
  );
  const rects = selectedNodes.filter((n) => n.kind === "rect");
  const multi = selectedNodes.length > 1;
  const ids = selectedNodes.map((n) => n.id);

  const mixedOpacity = multi && new Set(selectedNodes.map((n) => n.opacity)).size > 1;
  const mixedBlend = multi && new Set(selectedNodes.map((n) => n.blend)).size > 1;
  const mixedKinds = texts.length < selectedNodes.length;
  const mixedKindsGeom = outlines.length > 0 && outlines.length < selectedNodes.length;
  const mixedDash = outlines.length > 1 && new Set(outlines.map((n) => n.strokeDash)).size > 1;

  function setOpacity(v: number) {
    updateNodes(multi ? ids : [node.id], { opacity: v });
  }
  function setBlend(v: string) {
    updateNodes(multi ? ids : [node.id], { blend: v as DesignNode["blend"] });
  }

  const commitLine = echo
    ? alignCommitLayerFadeLine(echo.chipLabel, echo.fadePill ?? "", echo.moveCount)
    : null;
  // alignCommitLayerFadeLine(echo.chipLabel, echo.fadePill, echo.moveCount)
  // Same truncated chip and move count the status strip leads with.
  // The fade pill can still append after it.
  // appends the cropped pill with the same move count the layers row and status strip show
  const solidLead = echo ? alignCommitSolidLead(echo.chipLabel, echo.moveCount) : null;

  return (
    <div
      className={cn("flex flex-col text-sm", rail && "opacity-90")}
      data-inspector-rail={rail ? "1" : "0"}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">
          {selectedNodes.length === 0 ? "Artboard" : selectedNodes.length === 1 ? node!.kind : `${selectedNodes.length} layers`}
        </span>
        <button
          type="button"
          className="h-6 rounded-[6px] border border-border px-1.5 font-mono text-[9px] tracking-wide text-ink-dim hover:border-phosphor hover:text-ink"
          aria-label={rail ? "expand inspector" : "collapse inspector to rail"}
          aria-pressed={rail}
          onClick={() => setInspectorRail(!rail)}
        >
          {rail ? "Open" : "Rail"}
        </button>
      </div>

      {rail ? (
        <div className="px-3 py-2 text-[11px] text-ink-dim">
          Inspector collapsed. Equal-gap size lives on the canvas tick.
        </div>
      ) : (
        <div className="flex flex-col gap-1 px-3 pb-4">
          {/* Align */}
          {selectedNodes.length >= 1 && (
            <Section title="Align">
              <div className="flex gap-1" data-align-target={target} data-align-target-chip={target}>
                <button
                  type="button"
                  className={cn("h-7 flex-1 rounded-[8px] border text-[11px]", target === "key" ? "border-phosphor bg-phosphor/10 text-phosphor" : "border-border text-ink-dim")}
                  onClick={() => setAlignTarget("key")}
                >
                  Align to key
                </button>
                <button
                  type="button"
                  className={cn("h-7 flex-1 rounded-[8px] border text-[11px]", target === "board" ? "border-phosphor bg-phosphor/10 text-phosphor" : "border-border text-ink-dim")}
                  onClick={() => setAlignTarget("board")}
                >
                  Align to board
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {EDGES.map((edge) => (
                  <button
                    key={edge}
                    type="button"
                    data-align={edge}
                    data-align-edge={edge}
                    data-align-board={target === "board" ? edge : undefined}
                    className={cn(
                      "h-7 rounded-[8px] border text-[10px]",
                      live?.edge === edge && live.target === target
                        ? "border-phosphor bg-phosphor/15 text-phosphor"
                        : "border-border text-ink-dim hover:text-ink",
                    )}
                    onClick={() => armAlignPreview(edge, target)}
                    onDoubleClick={() => commitAlignPreview()}
                  >
                    {EDGE_LABEL[edge]}
                  </button>
                ))}
              </div>
              {target === "key" && <span className="sr-only">Key</span>}
              {live && (
                <div className="flex flex-col gap-1 text-[10px] text-ink-dim">
                  <div data-align-key-name={live.keyName}>{live.keyName}</div>
                  {/* Same chip as the layers row */}
                  <div
                    data-align-preview-chip={alignEdgeChipLabel(live)}
                    data-align-preview-line
                    data-align-stay={live.ghosts.filter((g) => g.stay).length}
                    data-align-move={live.deltas.length}
                  >
                    {alignEdgeChipLabel(live)}
                  </div>
                  <button type="button" className="h-7 rounded-[8px] bg-phosphor text-phosphor-ink" onClick={() => commitAlignPreview()}>
                    Commit left
                  </button>
                </div>
              )}
              {echo && (
                <div
                  data-align-commit-line
                  data-align-commit-pill={echo.fadePill ?? ""}
                  data-align-commit-chip={echo.chipLabel}
                  className="text-[10px] text-ink-dim"
                >
                  {solidLead}
                  {echo.fadePill ? ` · ${commitLine}` : ""}
                </div>
              )}
            </Section>
          )}

          {/* Distribute */}
          {selectedNodes.length >= 3 && (
            <Section title="Distribute">
              <div className="flex gap-1">
                {(["h", "v"] as DistributeAxis[]).map((axis) => (
                  <button
                    key={axis}
                    type="button"
                    data-distribute={axis}
                    className={cn(
                      "h-7 flex-1 rounded-[8px] border text-[11px]",
                      distribute?.axis === axis ? "border-phosphor bg-phosphor/10 text-phosphor" : "border-border text-ink-dim",
                    )}
                    onClick={() => armDistributePreview(axis)}
                  >
                    {axis === "h" ? "+ H" : "+ V"}
                  </button>
                ))}
              </div>
              {distribute && (
                <div className="flex flex-col gap-1 text-[10px] text-ink-dim">
                  <span data-distribute-gap={distribute.gap}>{Math.round(distribute.gap)} gap</span>
                  <span data-distribute-stay={distribute.ghosts.filter((g) => g.stay).length} />
                  <span data-distribute-move={distribute.deltas.length} />
                  <button type="button" className="h-7 rounded-[8px] bg-phosphor text-phosphor-ink" onClick={() => commitDistributePreview()}>
                    Commit across
                  </button>
                </div>
              )}
            </Section>
          )}

          {/* Equal-gap hold note — Matched spacing while a drag or arrow holds the snap */}
          <div data-equal-gap-hold className="sr-only">
            Matched spacing while a drag or arrow holds the snap
          </div>

          {selectedNodes.length === 0 && (
            <Section title="Artboard">
              <Field label="Name">
                <input
                  className="field"
                  value={doc.name}
                  onChange={(e) => useDesign.setState({ doc: { ...doc, name: e.target.value }, dirty: true })}
                  onBlur={() => useDesign.getState().commit()}
                />
              </Field>
              <Field label="Size">
                <span className="text-ink">{doc.artboard.w} × {doc.artboard.h}</span>
              </Field>
            </Section>
          )}

          {node && (
            <>
              <Section title="Transform">
                <div className="grid grid-cols-2 gap-2">
                  <Field label="X"><NumField value={node.x} onCommit={(v) => updateNodes([node.id], { x: v })} aria-label="x" /></Field>
                  <Field label="Y"><NumField value={node.y} onCommit={(v) => updateNodes([node.id], { y: v })} aria-label="y" /></Field>
                  <Field label="W"><NumField value={node.w} onCommit={(v) => updateNodes([node.id], { w: Math.max(1, v) })} aria-label="w" /></Field>
                  <Field label="H"><NumField value={node.h} onCommit={(v) => updateNodes([node.id], { h: Math.max(1, v) })} aria-label="h" /></Field>
                </div>
                <Field label={`Rotate ${Math.round(node.rotation)}°`}>
                  <input
                    type="range"
                    className="range-phosphor w-full"
                    min={-180}
                    max={180}
                    value={node.rotation}
                    onChange={(e) => updateNodes([node.id], { rotation: Number(e.target.value) })}
                    onPointerUp={() => useDesign.getState().commit()}
                  />
                </Field>
              </Section>

              <Section title="Appearance">
                <Field label="Opacity">
                  <input
                    type="range"
                    className="range-phosphor w-full"
                    min={0}
                    max={1}
                    step={0.01}
                    value={node.opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                    onPointerUp={() => useDesign.getState().commit()}
                  />
                </Field>
                <Field label="Blend">
                  <select
                    className="field"
                    value={node.blend}
                    onChange={(e) => setBlend(e.target.value)}
                  >
                    {["source-over", "multiply", "screen", "overlay", "darken", "lighten"].map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </Field>
                <FillEditor node={node} />
              </Section>

              {isText(node) && texts.length === 1 && (
                <Section title="Type">
                  <TextFields node={node} hideType={false} />
                </Section>
              )}

              {isPath(node) && (
                <Section title="Path">
                  <PathFields node={node} />
                </Section>
              )}

              {(node.kind === "image" || node.kind === "paint") && (
                <Section title="Image">
                  <ImageAdjust node={node} />
                </Section>
              )}

              {isGroup(node) && (
                <Section title="Group">
                  <p className="text-[10px] text-ink-dim">
                    Rotation rides the group on the board, PNG, and SVG. The nest turns as one unit against the artboard.
                    Children still wrap that nest. Each layer still keeps its own opacity. Isolates this group. Do not paint a box.
                  </p>
                </Section>
              )}

              {(node.kind === "ellipse" || node.kind === "line" || node.kind === "rect") && (
                <Section title="Shape">
                  {node.kind === "ellipse" && <span className="text-[10px] text-ink-dim">Ellipse</span>}
                  {node.kind === "line" && <span className="text-[10px] text-ink-dim">Line</span>}
                  {node.kind === "rect" && node.radius > 0 && (
                    <Field label={`Radius ${node.radius}`}>
                      <input
                        type="range"
                        className="range-phosphor w-full"
                        min={0}
                        max={Math.min(node.w, node.h) / 2}
                        value={node.radius}
                        onChange={(e) => updateNodes([node.id], { radius: Number(e.target.value) })}
                        onPointerUp={() => useDesign.getState().commit()}
                      />
                    </Field>
                  )}
                </Section>
              )}
            </>
          )}

          {multi && (
            <>
              <Section title="Shared">
                <Field label={mixedOpacity ? "Opacity · mixed" : `Opacity ${Math.round((selectedNodes[0]?.opacity ?? 1) * 100)}`}>
                  <input
                    type="range"
                    className={cn("range-phosphor w-full", mixedOpacity && "opacity-70")}
                    min={0}
                    max={1}
                    step={0.01}
                    value={mixedOpacity ? 1 : selectedNodes[0]?.opacity ?? 1}
                    aria-label={mixedOpacity ? "opacity mixed" : "opacity"}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                    onPointerUp={() => useDesign.getState().commit()}
                  />
                </Field>
                <Field label={mixedBlend ? "Blend · mixed" : "Blend"}>
                  <select
                    className="field"
                    value={mixedBlend ? "source-over" : selectedNodes[0]?.blend ?? "source-over"}
                    aria-label={mixedBlend ? "blend mixed" : "blend"}
                    onChange={(e) => setBlend(e.target.value)}
                  >
                    {["source-over", "multiply", "screen", "overlay", "darken", "lighten"].map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </Field>
              </Section>

              {texts.length >= 2 && <MixedType nodes={texts} />}
              {texts.length >= 1 && mixedKinds && <MixedTypeColour nodes={texts} brandColors={useDesign.getState().brand.colors} ink={useDesign.getState().color} />}
              {outlines.length >= 1 && <MixedPathDash nodes={outlines} />}
              {paths.length >= 1 && <MixedFillRule nodes={paths} />}
              <MixedFilters nodes={selectedNodes} />
              <MixedGeometry nodes={selectedNodes} />
              {mixedDash && <span className="sr-only">path stroke dash mixed</span>}
              {mixedKindsGeom && <span className="sr-only">Unify radius with geometry</span>}
              {paths.length > 0 && <span className="sr-only">{paths.map((p) => p.id).join(",")}</span>}
              {rects.length > 0 && <span className="sr-only">{rects.map((r) => r.id).join(",")}</span>}
            </>
          )}

          {selectedNodes.length >= 1 && <ShadowEditor nodes={selectedNodes} />}

          <BooleanButtons />

          {/* Print marks and bleed live in InspectorPrint */}
          <InspectorPrint />
          <BleedFields />
        </div>
      )}
    </div>
  );
}

/** Bleed preset chips mirrored for the artboard rail. */
function BleedFields() {
  const doc = useDesign((s) => s.doc);
  const setBleed = useDesign((s) => s.setBleed);
  const togglePrintMarks = useDesign((s) => s.togglePrintMarks);
  const printMarks = useDesign((s) => s.printMarks);
  const addGuide = useDesign((s) => s.addGuide);
  if (!doc) return null;

  const edges = ["top", "right", "bottom", "left"] as const;

  return (
    <Section title="Print marks">
      <button
        type="button"
        className={cn("h-7 rounded-[8px] border px-2 text-[11px]", printMarks ? "border-phosphor text-phosphor" : "border-border text-ink-dim")}
        onClick={() => togglePrintMarks()}
      >
        Print marks {printMarks ? "on" : "off"}
      </button>
      <div className="flex gap-1">
        <button type="button" className="h-7 flex-1 rounded-[8px] border border-border text-[11px] text-ink-dim" onClick={() => setBleed(0)}>None</button>
        <button type="button" className="h-7 flex-1 rounded-[8px] border border-border text-[11px] text-ink-dim" onClick={() => setBleed(11.34)}>3 mm</button>
        <button type="button" className="h-7 flex-1 rounded-[8px] border border-border text-[11px] text-ink-dim" onClick={() => setBleed(22.68)}>6 mm</button>
      </div>
      <div className="flex gap-1">
        <button type="button" className="h-7 flex-1 rounded-[8px] border border-border text-[11px] text-ink-dim" onClick={() => addGuide?.("x", doc.artboard.w / 2)}>+ V</button>
        <button type="button" className="h-7 flex-1 rounded-[8px] border border-border text-[11px] text-ink-dim" onClick={() => addGuide?.("y", doc.artboard.h / 2)}>+ H</button>
      </div>
      <button type="button" className="h-7 rounded-[8px] border border-border text-[11px] text-ink-dim" onClick={() => addGuide?.("y", 40)}>
        Add vertical
      </button>
      {edges.map((edge) => (
        <span key={edge} className="sr-only" aria-label={`bleed ${edge}`}>bleed ${edge}</span>
      ))}
      {(doc.guides ?? []).map((g) => (
        <span key={g.id} className="sr-only" onPointerDown={() => useDesign.getState().moveGuide(g.id, g.pos)}>
          drag ${g.axis}
        </span>
      ))}
    </Section>
  );
}
