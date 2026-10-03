import { useEffect, useSyncExternalStore } from "react";
import { useDesign } from "@/lib/design/store";
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
import { MixedInk } from "./mixed-ink";
import { MixedType } from "./mixed-type";
import { MixedPathDash } from "./mixed-path-dash";
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
  const mixedBlend = new Set(selectedNodes.map((n) => n.blend)).size > 1;

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
        <p className="px-3 py-4 font-mono text-[11px] text-ink-faint">Select a layer to inspect.</p>
      ) : (
        <>
          <section className="space-y-2 border-b border-border px-3 py-3">
            <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
              {selectedNodes.length > 1 ? `${selectedNodes.length} layers` : node.name}
            </div>
            <DistributeChrome />
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
            <Field label={mixedOpacity ? "Opacity \u00b7 mixed" : `Opacity ${Math.round(node.opacity * 100)}%`}>
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
          {selectedNodes.length > 1 && (
            <section className="border-b border-border px-3 py-3" title="Unify radius with mixed geometry">
              <MixedGeometry nodes={selectedNodes} />
            </section>
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
          >
            {echo.fadePill
              ? `${echo.fadePill} · ${echo.moveCount} move`
              : `${echo.chipLabel} · ${echo.moveCount} move`}
          </p>
          <p className="font-mono text-[10px] leading-snug text-ink-faint">
            {echo.fadePill
              ? "Fade pill. Status strip keeps the solid lead and appends this pill with the same move count. Esc clears it early."
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
