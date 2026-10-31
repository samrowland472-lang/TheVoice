import { nextFromRangeKey } from "./range-keys";
import { useEffect, useRef, useSyncExternalStore, type CSSProperties } from "react";
import { useDesign } from "@/lib/design/store";
import { cn } from "@/lib/utils";
import { formatEqualGapHold, getEqualGapHold, subscribeEqualGapHold } from "@/lib/design/group-transform";
import { getInspectorRail, setInspectorRail, subscribeInspectorRail } from "@/lib/design/inspector-rail";
import {
  clearDistributePreview,
  distributeRoots,
  distributeMoveCount,
  formatDistributeGap,
  getDistributePreview,
  subscribeDistributePreview,
  toggleDistributePreview,
  type DistributeAxis,
} from "@/lib/design/distribute-preview";
import {
  alignCommitLayerFadeLine,
  alignCommitSolidLead,
  alignEdgeChipLabel,
  alignKey,
  alignMoveCount,
  alignRoots,
  armAlignPreview,
  clearAlignPreview,
  getAlignCommitEcho,
  getAlignPreview,
  getAlignTarget,
  setAlignTarget,
  subscribeAlignCommitEcho,
  subscribeAlignPreview,
  subscribeAlignTarget,
  toggleAlignPreview,
  type AlignEdge,
  type AlignTarget,
} from "@/lib/design/align-preview";
import type { BlendMode, TextNode } from "@/lib/design/types";
import { NumField } from "./num-field";
import { BrushTipPreview } from "./brush-preview";
import { getStrokeLiveKey, subscribeStrokeLive } from "@/lib/design/paint-stroke";
import { MixedInk } from "./mixed-ink";
import { MixedBlendLegend } from "./mixed-ink-chips";
import { MixedType } from "./mixed-type";
import { MixedPathDash } from "./mixed-path-dash";
import { PathFields } from "./inspector-path";
import type { PathNode } from "@/lib/design/types";
import { MixedGeometry } from "./mixed-geometry";
import { FillEditor, Field, ShadowEditor } from "./inspector-parts";
import { TextFields } from "./inspector-type";
import { ImageAdjust } from "./image-adjust";
import { MixedFilters } from "./mixed-filters";

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
  const opacityClipboard = useDesign((s) => s.opacityClipboard);
  const opacityRangeRef = useRef<HTMLInputElement>(null);

  if (!doc) return null;

  const selectedNodes = selection
    .map((id) => doc.nodes.find((n) => n.id === id))
    .filter((n): n is NonNullable<typeof n> => Boolean(n));
  const node = selectedNodes[selectedNodes.length - 1] ?? null;
  const ids = selectedNodes.map((n) => n.id);
  const texts = selectedNodes.filter((n): n is TextNode => n.kind === "text");
  const outlines = selectedNodes.filter(
    (n) =>
      n.kind === "path" ||
      n.kind === "rect" ||
      n.kind === "ellipse" ||
      n.kind === "line" ||
      n.kind === "polygon" ||
      n.kind === "star" ||
      n.kind === "arrow",
  );
  const bg = typeof doc.artboard.background === "string" ? doc.artboard.background : "#ffffff";
  const mixedOpacity = new Set(selectedNodes.map((n) => n.opacity)).size > 1;
  const opacityPercents = selectedNodes.map((n) => Math.round(n.opacity * 100));
  const opacityMin = opacityPercents.length ? Math.min(...opacityPercents) : 0;
  const opacityMax = opacityPercents.length ? Math.max(...opacityPercents) : 0;
  const opacityTicks = mixedOpacity
    ? (() => {
        const map = opacityPercents.reduce((m, pct) => {
          m.set(pct, (m.get(pct) ?? 0) + 1);
          return m;
        }, new Map<number, number>());
        return Array.from(map, ([pct, count]) => ({ pct, count })).sort((a, b) => a.pct - b.pct);
      })()
    : [];
  const mixedBlend = new Set(selectedNodes.map((n) => n.blend)).size > 1;
  const mixedName = selectedNodes.length > 1 && new Set(selectedNodes.map((n) => n.name)).size > 1;
  const mixedX = selectedNodes.length > 1 && new Set(selectedNodes.map((n) => n.x)).size > 1;
  const mixedY = selectedNodes.length > 1 && new Set(selectedNodes.map((n) => n.y)).size > 1;
  const mixedW = selectedNodes.length > 1 && new Set(selectedNodes.map((n) => n.w)).size > 1;
  const mixedH = selectedNodes.length > 1 && new Set(selectedNodes.map((n) => n.h)).size > 1;
  const mixedRot = selectedNodes.length > 1 && new Set(selectedNodes.map((n) => Math.round(n.rotation))).size > 1;
  const mixedRad = selectedNodes.length > 1 && new Set(selectedNodes.map((n) => n.radius)).size > 1;

  const rail = useSyncExternalStore(subscribeInspectorRail, getInspectorRail, getInspectorRail);
  const selectionKey = selection.join("|");
  const docId = doc.id;

  useEffect(() => {
    if (getDistributePreview()) clearDistributePreview();
    if (getAlignPreview()) clearAlignPreview();
  }, [selectionKey, docId]);

  return (
    <aside
      className="flex h-full w-[260px] shrink-0 flex-col overflow-y-auto border-l border-border bg-surface"
      data-inspector-rail={rail ? "1" : "0"}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">Inspector</div>
        <button
          type="button"
          className="h-6 rounded-[6px] border border-border px-1.5 font-mono text-[9px] tracking-wide text-ink-dim hover:border-phosphor hover:text-ink"
          aria-pressed={rail}
          aria-label={rail ? "expand inspector" : "collapse inspector to rail"}
          onClick={() => setInspectorRail(!rail)}
        >
          {rail ? "Open" : "Rail"}
        </button>
      </div>
      {rail ? (
        <div className="space-y-3 px-3 py-3">
          <p className="font-mono text-[10px] leading-snug text-ink-faint">
            Equal gap size stays on the canvas spacing tick. A distribute preview pins first and last. Align uses one edge row. The chip flips key or board.
          </p>
          <AlignChrome />
          <DistributeChrome />
        </div>
      ) : (
        <>
      <EqualGapHold />
      <section className="border-b border-border px-3 py-3">
        <AlignChrome />
      </section>
      <section className="space-y-2 border-b border-border px-3 py-3">
        <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">Board</div>
        <label className="flex items-center justify-between gap-2 font-mono text-[10px] text-ink-dim">
          Background
          <input type="color" value={bg} aria-label="Artboard background" className="h-6 w-8 cursor-pointer border border-border bg-transparent" onChange={(e) => setArtboardBg(e.target.value)} />
        </label>
      </section>
      {!node ? (
        <div className="space-y-2 px-3 py-4">
          <p className="font-mono text-[11px] text-ink-faint">Select a layer to inspect.</p>
          <p className="font-mono text-[10px] leading-snug text-ink-faint">
            Board {doc.artboard.width}×{doc.artboard.height}. {doc.nodes.length} layer{doc.nodes.length === 1 ? "" : "s"}.
          </p>
        </div>
      ) : (
        <>
          <section className="space-y-2 border-b border-border px-3 py-3">
            <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
              {selectedNodes.length > 1 ? `${selectedNodes.length} layers` : node.name}
            </div>
            <DistributeChrome />
            <label className="block font-mono text-[10px] text-ink-dim">
              {mixedName ? "Name · mixed" : "Name"}
              <input
                className="mt-1 w-full border border-border bg-ground px-2 py-1 font-mono text-[11px] text-ink placeholder:text-ink-faint"
                value={mixedName ? "" : node.name}
                placeholder={mixedName ? "Mixed" : undefined}
                aria-label={mixedName ? "Name mixed" : "Name"}
                onChange={(e) => updateNodes(ids, { name: e.target.value })}
              />
            </label>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
              <GeoField label="X" mixed={mixedX} value={node.x} onCommit={(x) => updateNodes(ids, { x })} />
              <GeoField label="Y" mixed={mixedY} value={node.y} onCommit={(y) => updateNodes(ids, { y })} />
              <GeoField label="W" mixed={mixedW} value={node.w} onCommit={(w) => updateNodes(ids, { w })} />
              <GeoField label="H" mixed={mixedH} value={node.h} onCommit={(h) => updateNodes(ids, { h })} />
              <GeoField label="R" mixed={mixedRot} value={Math.round(node.rotation)} onCommit={(rotation) => updateNodes(ids, { rotation })} />
              <GeoField label="Rad" mixed={mixedRad} value={node.radius} onCommit={(radius) => updateNodes(ids, { radius })} />
            </div>
          </section>
          <section className="space-y-2 border-b border-border px-3 py-3">
            <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">Layer</div>
            <Field
              label={
                mixedOpacity
                  ? `Opacity \u00b7 ${opacityMin}\u2013${opacityMax}%`
                  : "Opacity"
              }
            >
              <div className="flex items-center gap-2">
                <div className={cn("relative min-w-0 flex-1", mixedOpacity && "mb-2")}>
                  <input
                    ref={opacityRangeRef}
                    type="range"
                    className="range-phosphor w-full"
                    min={0}
                    max={1}
                    step={0.01}
                    value={node.opacity}
                    aria-label="Layer opacity"
                    data-opacity-range="inspector"
                    title="Arrow keys step opacity · PageUp/PageDown coarse · Home/End jump 0–100% · from the percent field, arrows focus here"
                    style={{ "--fill-opacity": String(node.opacity) } as CSSProperties}
                    onChange={(e) => updateNodes(ids, { opacity: Number(e.target.value) })}
                    onPointerUp={() => useDesign.getState().commit()}
                    onKeyDown={(e) => {
                      const next = nextFromRangeKey(e, node.opacity, 0, 1, 0.01);
                      if (next != null) updateNodes(ids, { opacity: next });
                    }}
                    onKeyUp={(e) => {
                      if (
                        e.key === "ArrowUp" ||
                        e.key === "ArrowDown" ||
                        e.key === "ArrowLeft" ||
                        e.key === "ArrowRight" ||
                        e.key === "Home" ||
                        e.key === "End" ||
                        e.key === "PageUp" ||
                        e.key === "PageDown"
                      ) {
                        useDesign.getState().commit();
                      }
                    }}
                  />
                  {mixedOpacity && opacityTicks.length > 0 && (
                    <div
                      className="absolute inset-x-0 top-full mt-px h-2"
                    >
                      {opacityTicks.map(({ pct, count }) => (
                        <button
                          key={pct}
                          type="button"
                          className="absolute bottom-0 w-1.5 -translate-x-1/2 cursor-pointer bg-phosphor/80 hover:bg-phosphor focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-phosphor"
                          style={{
                            left: `${pct}%`,
                            height: `${Math.min(10, 2 + count * 2)}px`,
                          }}
                          title={`${count} layer${count === 1 ? "" : "s"} at ${pct}% · click to set all`}
                          aria-label={`Set opacity to ${pct}%`}
                          onClick={() => {
                            const opacity = Math.max(0, Math.min(1, pct / 100));
                            updateNodes(ids, { opacity });
                            useDesign.getState().commit();
                          }}
                        >
                          {count > 1 && (
                            <span className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 font-mono text-[8px] leading-none text-phosphor">
                              {count}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <NumField
                  aria-label="Layer opacity percent"
                  mixed={mixedOpacity}
                  value={Math.round(node.opacity * 100)}
                  min={0}
                  max={100}
                  className="h-6 w-12 shrink-0 rounded-[6px] border border-border bg-surface-alt px-1 font-mono text-[10px] text-right text-ink"
                  onCommit={(pct) => {
                    const opacity = Math.max(0, Math.min(1, pct / 100));
                    updateNodes(ids, { opacity });
                    useDesign.getState().commit();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Home" || e.key === "End") {
                      e.preventDefault();
                      const pct = e.key === "Home" ? 0 : 100;
                      const opacity = pct / 100;
                      updateNodes(ids, { opacity });
                      useDesign.getState().commit();
                      opacityRangeRef.current?.focus();
                      return;
                    }
                    const vertical = e.key === "ArrowUp" || e.key === "ArrowDown";
                    const start = e.currentTarget.selectionStart ?? 0;
                    const end = e.currentTarget.selectionEnd ?? 0;
                    const collapsed = start === end;
                    const atStart = collapsed && start === 0;
                    const atEnd = collapsed && start === e.currentTarget.value.length;
                    const toRange =
                      vertical ||
                      (e.key === "ArrowLeft" && atStart) ||
                      (e.key === "ArrowRight" && atEnd);
                    if (!toRange) return;
                    e.preventDefault();
                    const step = e.shiftKey ? 10 : 1;
                    const dir = e.key === "ArrowUp" || e.key === "ArrowRight" ? 1 : -1;
                    const pct = Math.max(
                      0,
                      Math.min(100, Math.round(node.opacity * 100) + dir * step),
                    );
                    const opacity = pct / 100;
                    updateNodes(ids, { opacity });
                    useDesign.getState().commit();
                    opacityRangeRef.current?.focus();
                  }}
                />
                <span className="shrink-0 font-mono text-[9px] text-ink-faint">%</span>
                <button
                  type="button"
                  className="h-6 shrink-0 rounded-[6px] border border-border px-1.5 font-mono text-[9px] tracking-wide text-ink-dim hover:border-phosphor hover:text-ink"
                  title="Set opacity to 100% · Alt+Shift+0"
                  onClick={() => {
                    updateNodes(ids, { opacity: 1 });
                    useDesign.getState().commit();
                  }}
                >
                  100%
                </button>
                {opacityClipboard != null && (
                  <button
                    type="button"
                    className="h-6 shrink-0 rounded-[6px] border border-phosphor/60 bg-surface-alt px-1.5 font-mono text-[9px] tracking-wide text-phosphor hover:border-phosphor hover:text-ink"
                    title={`Paste opacity ${Math.round(opacityClipboard * 100)}% · Cmd+Shift+V`}
                    onClick={() => useDesign.getState().pasteOpacity()}
                  >
                    Paste {Math.round(opacityClipboard * 100)}%
                  </button>
                )}
              </div>
              {mixedOpacity && opacityTicks.length > 0 && (
                <div className="mt-1.5 font-mono text-[8px] leading-none text-ink-faint" aria-label="Opacity histogram legend">
                  {opacityTicks.map(({ pct, count }, i) => (
                    <span key={pct}>
                      {i > 0 && <span className="text-ink-faint/60"> · </span>}
                      <span className="text-phosphor">{count}×</span>{pct}%
                    </span>
                  ))}
                </div>
              )}
            </Field>
            <Field label={mixedBlend ? "Blend \u00b7 mixed" : "Blend"}>
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
              {mixedBlend && <MixedBlendLegend nodes={selectedNodes} />}
            </Field>
            {node.kind === "group" && (
              <p className="font-mono text-[10px] leading-snug text-ink-faint">
                {!node.visible
                  ? "Hidden groups hoist on the board, PNG, and SVG and do not paint a box. Opacity and blend still wrap that nest."
                  : node.blend && node.blend !== "source-over"
                    ? "The board, PNG, and SVG isolates this group, then blend the nest as one unit against the artboard. Each layer still keeps its own opacity."
                    : "The board, PNG, and SVG put this opacity on the group so nested layers inherit it. Each layer still keeps its own opacity."}
                {node.rotation
                  ? " Rotation rides the group on the board, PNG, and SVG, so the nest turns as one unit. Edge handles scale one local axis and keep the opposite edge pinned in world space. Corner handles keep the opposite corner pinned in world space."
                  : ""}
              </p>
            )}
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
          {outlines.length > 0 && (
            <section className="border-b border-border px-3 py-3">
              <MixedPathDash nodes={outlines} />
            </section>
          )}
          {selectedNodes.length === 1 && node.kind === "path" && (
            <section className="border-b border-border px-3 py-3" data-path-inspector>
              <PathFields node={node as PathNode} />
            </section>
          )}
          {selectedNodes.length > 1 && (
            <section className="border-b border-border px-3 py-3" title="Unify radius with mixed geometry">
              <MixedGeometry nodes={selectedNodes} />
            </section>
          )}
          {selectedNodes.length === 1 && node.kind === "paint" && (
            <PaintBrushControls />
          )}
          {selectedNodes.length === 1 && <ImageAdjust node={node} />}
          {selectedNodes.length > 1 && <MixedFilters nodes={selectedNodes} />}
          {texts.length === 1 && (
            <section className="space-y-2 border-b border-border px-3 py-3">
              <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">Type</div>
              <TextFields node={texts[0]!} />
            </section>
          )}
          {texts.length > 1 && (
            <section className="border-b border-border px-3 py-3">
              <MixedType nodes={texts} />
            </section>
          )}
        </>
      )}
        </>
      )}
    </aside>
  );
}

function GeoField({
  label,
  mixed,
  value,
  onCommit,
}: {
  label: string;
  mixed: boolean;
  value: number;
  onCommit: (n: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-0.5 block font-mono text-[9px] uppercase tracking-[0.12em] text-ink-faint">
        {mixed ? `${label} · mixed` : label}
      </span>
      <NumField
        aria-label={mixed ? `${label} mixed` : label}
        mixed={mixed}
        value={value}
        onCommit={onCommit}
      />
    </label>
  );
}

function EqualGapHold() {
  const gaps = useSyncExternalStore(subscribeEqualGapHold, getEqualGapHold, getEqualGapHold);
  if (!gaps.length) return null;
  const label = formatEqualGapHold(gaps);
  return (
    <section className="space-y-1 border-b border-border bg-ground px-3 py-3" data-equal-gap-hold={label}>
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-phosphor">Equal gap</div>
      <p className="font-mono text-[12px] text-ink">{label}</p>
      <p className="font-mono text-[10px] leading-snug text-ink-faint">
        Matched spacing while a drag or arrow holds the snap. Releasing clears this readout.
      </p>
    </section>
  );
}


const ALIGN_EDGES: { edge: AlignEdge; label: string; commit: string }[] = [
  { edge: "left", label: "Left", commit: "Commit left" },
  { edge: "center", label: "Center", commit: "Commit center" },
  { edge: "right", label: "Right", commit: "Commit right" },
  { edge: "top", label: "Top", commit: "Commit top" },
  { edge: "middle", label: "Middle", commit: "Commit middle" },
  { edge: "bottom", label: "Bottom", commit: "Commit bottom" },
];

function AlignChrome() {
  const doc = useDesign((s) => s.doc);
  const selection = useDesign((s) => s.selection);
  const plan = useSyncExternalStore(subscribeAlignPreview, getAlignPreview, getAlignPreview);
  const echo = useSyncExternalStore(subscribeAlignCommitEcho, getAlignCommitEcho, getAlignCommitEcho);
  const target = useSyncExternalStore(subscribeAlignTarget, getAlignTarget, getAlignTarget);
  const roots = doc ? alignRoots(doc.nodes, selection) : [];
  const key = doc ? alignKey(doc.nodes, selection) : null;
  const keyReady = Boolean(key);
  const boardReady = roots.length >= 1;
  const ready = target === "board" ? boardReady : keyReady;
  const live = plan?.target === target ? plan : null;
  const stay = live ? live.ghosts.filter((g) => g.stay).length : 0;
  const keyName = key?.name?.trim() || "key";

  return (
    <div className="space-y-1.5" data-align-ready={keyReady ? "1" : "0"} data-align-board-ready={boardReady ? "1" : "0"} data-align-target={target}>
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">Align</div>
        <div className="flex gap-1" role="group" aria-label="Align target">
          <AlignTargetChip target="key" current={target} label={keyReady ? keyName : "Key"} disabled={false} />
          <AlignTargetChip target="board" current={target} label="Board" disabled={false} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {ALIGN_EDGES.map(({ edge, label, commit }) => (
          <AlignButton
            key={edge}
            edge={edge}
            target={target}
            label={live?.edge === edge ? commit : label}
            pressed={live?.edge === edge}
            disabled={!ready}
          />
        ))}
      </div>
      {live ? (
        <div
          className="space-y-1.5"
          data-align-edge={live.edge}
          data-align-stay={stay}
          data-align-move={alignMoveCount(live)}
          data-align-key={live.keyId}
          data-align-key-name={live.keyName}
          data-align-preview-chip={alignEdgeChipLabel(live)}
        >
          <p className="font-mono text-[12px] text-phosphor" data-align-preview-line="">
            {alignEdgeChipLabel(live)}
          </p>
          <p className="font-mono text-[10px] leading-snug text-ink-faint">
            {`Preview only. Same chip as the layers row: ${alignEdgeChipLabel(live)}. Long key names trim at 16. ${stay} stay. ${alignMoveCount(live)} move. Enter or the lit button commits. Esc clears it.`}
          </p>
          <button
            type="button"
            className="h-7 w-full rounded-[8px] border border-border font-mono text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
            onClick={() => clearAlignPreview()}
          >
            Cancel preview
          </button>
        </div>
      ) : echo ? (
        <div className="space-y-1">
          <p
            className="font-mono text-[12px] text-phosphor"
            data-align-commit-line=""
            data-align-commit-edge={echo.edge}
            data-align-commit-move={echo.moveCount}
            data-align-commit-chip={echo.chipLabel}
            data-align-commit-pill={echo.fadePill ?? ""}
            title={echo.fadePill
              ? alignCommitLayerFadeLine(echo.chipLabel, echo.fadePill, echo.moveCount)
              : alignCommitSolidLead(echo.chipLabel, echo.moveCount)}
          >
            {echo.fadePill
              ? alignCommitLayerFadeLine(echo.chipLabel, echo.fadePill, echo.moveCount)
              : alignCommitSolidLead(echo.chipLabel, echo.moveCount)}
          </p>
          <p className="font-mono text-[10px] leading-snug text-ink-faint">
            {echo.fadePill
              ? "Fade line. Keeps the solid lead and appends the cropped pill with the same move count the layers row and status strip show. Esc clears it early."
              : "Solid beat. Same truncated chip and move count the status strip leads with. The fade pill can still append after it. Esc clears it early."}
          </p>
        </div>
      ) : (
        <p className="font-mono text-[10px] leading-snug text-ink-faint">
          {target === "board"
            ? boardReady
              ? "Board chip. First click draws the artboard edge. Layers already on it stay. Enter commits."
              : "Select an unlocked layer to align to the artboard."
            : keyReady
              ? `${keyName} is the key. First click draws its edge. Enter commits.`
              : "Select two unlocked layers, or flip the chip to Board."}
        </p>
      )}
    </div>
  );
}

function AlignTargetChip({
  target,
  current,
  label,
  disabled,
}: {
  target: AlignTarget;
  current: AlignTarget;
  label: string;
  disabled: boolean;
}) {
  const pressed = current === target;
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={pressed}
      data-align-target-chip={target}
      aria-label={target === "key" ? "Align to key" : "Align to board"}
      title={target === "key" ? "Align to the last selected layer" : "Align to the artboard"}
      className={`h-6 max-w-[92px] truncate rounded-[6px] border px-1.5 font-mono text-[9px] tracking-wide ${
        pressed ? "border-phosphor text-phosphor" : "border-border text-ink-dim"
      } hover:border-phosphor hover:text-ink disabled:opacity-40`}
      onClick={() => {
        setAlignTarget(target);
        const plan = getAlignPreview();
        if (plan && plan.target !== target) armAlignPreview(plan.edge, target);
      }}
    >
      {label}
    </button>
  );
}

function AlignButton({
  edge,
  label,
  pressed,
  disabled,
  target = "key",
}: {
  edge: AlignEdge;
  label: string;
  pressed: boolean;
  disabled: boolean;
  target?: AlignTarget;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={pressed}
      data-align={target === "key" ? edge : undefined}
      data-align-board={target === "board" ? edge : undefined}
      className={`h-8 rounded-[8px] border font-mono text-[10px] tracking-wide ${
        pressed ? "border-phosphor text-phosphor" : "border-border text-ink-dim"
      } hover:border-phosphor hover:text-ink disabled:opacity-40`}
      onClick={() => {
        clearDistributePreview(true);
        toggleAlignPreview(edge, target);
      }}
    >
      {label}
    </button>
  );
}

function DistributeChrome() {
  const doc = useDesign((s) => s.doc);
  const selection = useDesign((s) => s.selection);
  const plan = useSyncExternalStore(subscribeDistributePreview, getDistributePreview, getDistributePreview);
  const roots = doc ? distributeRoots(doc.nodes, selection) : [];
  const ready = roots.length >= 3;

  return (
    <div className="space-y-1.5" data-distribute-ready={ready ? "1" : "0"}>
      <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">Distribute</div>
      <div className="flex gap-1">
        <DistributeButton axis="h" label={plan?.axis === "h" ? "Commit across" : "Across"} pressed={plan?.axis === "h"} disabled={!ready} />
        <DistributeButton axis="v" label={plan?.axis === "v" ? "Commit down" : "Down"} pressed={plan?.axis === "v"} disabled={!ready} />
      </div>
      {plan ? (
        <div className="space-y-1.5" data-distribute-gap={formatDistributeGap(plan.gap)} data-distribute-stay="2" data-distribute-move={distributeMoveCount(plan)}>
          <p className="font-mono text-[12px] text-phosphor">
            {formatDistributeGap(plan.gap)} px {plan.axis === "h" ? "across" : "down"}
          </p>
          <p className="font-mono text-[10px] leading-snug text-ink-faint">
            Preview only. First and last stay. {distributeMoveCount(plan)} move. Enter or the lit button commits.
          </p>
          <button
            type="button"
            className="h-7 w-full rounded-[8px] border border-border font-mono text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
            onClick={() => clearDistributePreview()}
          >
            Cancel preview
          </button>
        </div>
      ) : (
        <p className="font-mono text-[10px] leading-snug text-ink-faint">
          {ready
            ? "First click shows the even gap on the board. First and last stay. Enter commits."
            : "Select three unlocked layers to space them."}
        </p>
      )}
    </div>
  );
}

function DistributeButton({
  axis,
  label,
  pressed,
  disabled,
}: {
  axis: DistributeAxis;
  label: string;
  pressed: boolean;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={pressed}
      data-distribute={axis}
      className={`h-8 flex-1 rounded-[8px] border font-mono text-[10px] tracking-wide ${
        pressed ? "border-phosphor text-phosphor" : "border-border text-ink-dim"
      } hover:border-phosphor hover:text-ink disabled:opacity-40`}
      onClick={() => {
        clearAlignPreview(true);
        toggleDistributePreview(axis);
      }}
    >
      {label}
    </button>
  );
}

function useStrokeLive() {
  const key = useSyncExternalStore(subscribeStrokeLive, getStrokeLiveKey, getStrokeLiveKey);
  const parts = key.split("|");
  return {
    painting: parts[0] === "1",
    pressure: Number(parts[1]) || 1,
    tiltX: Number(parts[2]) || 0,
    tiltY: Number(parts[3]) || 0,
  };
}

function PaintBrushControls() {
  const color = useDesign((s) => s.color);
  const brush = useDesign((s) => s.brush);
  const setBrush = useDesign((s) => s.setBrush);
  const hardness = brush.hardness ?? 0.5;
  const spacing = brush.spacing ?? 0.12;
  const hardPct = Math.round(hardness * 100);
  const spacePct = Math.round(spacing * 100);
  const live = useStrokeLive();

  return (
    <section className="space-y-2 border-b border-border px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">Brush</div>
        <div className="flex items-center gap-2">
          <div className="text-right leading-tight">
            <div className="font-mono text-[9px] uppercase tracking-wide text-ink-faint">Space</div>
            <div className="font-mono text-[13px] text-phosphor tabular-nums" data-brush-space-readout="">
              {spacePct}%
            </div>
          </div>
          <BrushTipPreview
            brush={{ ...brush, color: brush.color || color || "#0a0d0c" }}
            pressure={live.pressure}
            tiltX={live.tiltX}
            tiltY={live.tiltY}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-[11px] text-ink-dim">
        Hard {hardPct}
        <input
          type="range"
          className="range-phosphor flex-1"
          min={0.05}
          max={1}
          step={0.05}
          value={hardness}
          aria-label="Brush hardness"
          onChange={(e) => setBrush({ hardness: Number(e.target.value) })}
        />
      </label>
      <label className="flex items-center gap-2 text-[11px] text-ink-dim">
        Space {spacePct}
        <input
          type="range"
          className="range-phosphor flex-1"
          min={0.04}
          max={0.5}
          step={0.02}
          value={spacing}
          aria-label="Brush spacing"
          onChange={(e) => setBrush({ spacing: Number(e.target.value) })}
        />
      </label>
      <LivePressureTilt />
    </section>
  );
}

function LivePressureTilt() {
  const live = useStrokeLive();
  const painting = live.painting;
  const press = Math.round(live.pressure * 100);
  const tilt = Math.round(Math.min(90, Math.hypot(live.tiltX, live.tiltY)));
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-t border-border/60 pt-2 font-mono text-[10px] tabular-nums tracking-wide",
        painting ? "text-phosphor" : "text-ink-faint",
      )}
      data-brush-live=""
    >
      <span className="uppercase">Stroke</span>
      <span>press {painting ? `${press}%` : "—"}</span>
      <span>tilt {painting ? `${tilt}°` : "—"}</span>
    </div>
  );
}
