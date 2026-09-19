import { useEffect, useRef, useState } from "react";
import { BLEED_PRESETS, resolveBleed, uniformBleed } from "@/lib/design/print-marks";
import {
  formatGuidePair,
  formatGuideProbe,
  guidePairs,
  guideProbe,
  snapGuideToObjects,
} from "@/lib/design/snap-guide";
import { canDistributeGuides } from "@/lib/design/guide-select";
import { useDesign } from "@/lib/design/store";
import "@/lib/design/guide-live";
import "@/lib/design/guide-distribute";
import { cn } from "@/lib/utils";
import { Field, Section } from "./inspector-parts";
import { NumField } from "./num-field";

const PRINT_RAIL_KEY = "the-voice-design-print-rail";

function loadPrintRail(): boolean {
  try {
    return window.localStorage.getItem(PRINT_RAIL_KEY) === "1";
  } catch {
    return false;
  }
}

function savePrintRail(rail: boolean) {
  try {
    window.localStorage.setItem(PRINT_RAIL_KEY, rail ? "1" : "0");
  } catch {
    /* blocked */
  }
}

const EDGE_CHIPS = [
  ["top", "T"],
  ["right", "R"],
  ["bottom", "B"],
  ["left", "L"],
] as const;

export function InspectorPrint() {
  const doc = useDesign((s) => s.doc);
  const printMarks = useDesign((s) => s.printMarks);
  const togglePrintMarks = useDesign((s) => s.togglePrintMarks);
  const setBleed = useDesign((s) => s.setBleed);
  const setBleedEdges = useDesign((s) => s.setBleedEdges);
  const [rail, setRail] = useState(false);

  useEffect(() => {
    setRail(loadPrintRail());
  }, []);

  function setRailMode(next: boolean) {
    setRail(next);
    savePrintRail(next);
  }
  const addGuide = useDesign((s) => s.addGuide);
  const moveGuide = useDesign((s) => s.moveGuide);
  const removeGuide = useDesign((s) => s.removeGuide);
  const clearGuides = useDesign((s) => s.clearGuides);
  const guideSelection = useDesign((s) => s.guideSelection) as string[] | undefined;
  const selectGuides = useDesign((s) => s.selectGuides);
  const distributeSelectedGuides = useDesign((s) => s.distributeSelectedGuides);
  const probe = useDesign((s) => s.guideProbe);

  if (!doc) return null;
  const edges = resolveBleed(doc);
  const uniform = uniformBleed(edges);
  const guides = doc.guides ?? [];

  const bleedChips = (
    <div className="flex flex-wrap gap-1" data-testid="bleed-edge-chips">
      {EDGE_CHIPS.map(([edge, label]) => (
        <button
          key={edge}
          type="button"
          className={cn(
            "inline-flex h-7 min-w-0 items-center gap-1 rounded-[8px] border px-1.5 font-mono text-[10px]",
            edges[edge] > 0
              ? "border-phosphor/40 bg-phosphor/10 text-phosphor"
              : "border-border text-ink-dim",
          )}
          aria-label={`bleed ${edge} ${edges[edge]}`}
          title={`${label} bleed ${edges[edge]} px — click to cycle 0 / 3 mm / 6 mm`}
          onClick={() => {
            const cur = edges[edge];
            const steps = BLEED_PRESETS.map((p) => p.px);
            const i = steps.findIndex((px) => px === cur);
            const next = steps[(i + 1) % steps.length] ?? 0;
            setBleedEdges({ [edge]: next });
          }}
        >
          <span>{label}</span>
          <span>{edges[edge]}</span>
        </button>
      ))}
    </div>
  );

  return (
    <>
      <section className="border-b border-border py-3" data-print-rail={rail ? "1" : "0"}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">Print</div>
          <button
            type="button"
            className="h-6 rounded-[6px] border border-border px-1.5 font-mono text-[9px] tracking-wide text-ink-dim hover:border-phosphor hover:text-ink"
            aria-pressed={rail}
            aria-label={rail ? "expand print panel" : "collapse print panel to rail"}
            onClick={() => setRailMode(!rail)}
          >
            {rail ? "Open" : "Rail"}
          </button>
        </div>
        {rail ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={cn(
                  "h-7 shrink-0 rounded-[8px] border px-2 text-[10px]",
                  printMarks ? "border-phosphor/40 bg-phosphor/10 text-phosphor" : "border-border text-ink-dim",
                )}
                aria-pressed={Boolean(printMarks)}
                onClick={togglePrintMarks}
              >
                Marks
              </button>
              {bleedChips}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-[11px] text-ink-dim">
              <input type="checkbox" checked={Boolean(printMarks)} onChange={togglePrintMarks} />
              Print marks
            </label>
            <Field label="Bleed">
              <div className="grid grid-cols-3 gap-1">
                {BLEED_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={cn(
                      "h-7 rounded-[8px] text-[10px]",
                      uniform === p.px ? "bg-phosphor/15 text-phosphor" : "border border-border text-ink-dim",
                    )}
                    onClick={() => setBleed(p.px)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </Field>
            {bleedChips}
            <div className="grid grid-cols-2 gap-2">
              {EDGE_CHIPS.map(([edge, label]) => (
                <Field key={edge} label={label}>
                  <NumField
                    value={edges[edge]}
                    min={0}
                    aria-label={`bleed ${edge}`}
                    onCommit={(n) => setBleedEdges({ [edge]: n })}
                  />
                </Field>
              ))}
            </div>
          </div>
        )}
      </section>
      <Section title="Guides">
        <div className="mb-2 grid grid-cols-4 gap-1">
          <button
            type="button"
            className="h-7 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
            onClick={() => addGuide("x", Math.round(doc.artboard.width / 2))}
          >
            Add V
          </button>
          <button
            type="button"
            className="h-7 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
            onClick={() => addGuide("y", Math.round(doc.artboard.height / 2))}
          >
            Add H
          </button>
          <button
            type="button"
            disabled={!guides.length}
            className={cn(
              "h-7 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink",
              !guides.length && "opacity-40",
            )}
            onClick={() => clearGuides()}
          >
            Clear
          </button>
          <button
            type="button"
            disabled={!canDistributeGuides(guides, guideSelection ?? [])}
            className={cn(
              "h-7 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink",
              !canDistributeGuides(guides, guideSelection ?? []) && "opacity-40",
            )}
            title="Space selected guides of the same axis evenly between the first and last"
            onClick={() => distributeSelectedGuides()}
          >
            Even
          </button>
        </div>
        {probe ? (
          <p className="mb-1 font-mono text-[10px] text-phosphor">{formatGuideProbe(probe)}</p>
        ) : null}
        {guidePairs(guides).length ? (
          <p className="mb-1 font-mono text-[10px] text-ink-dim">
            {guidePairs(guides).map(formatGuidePair).join("  ·  ")}
          </p>
        ) : null}
        {guides.length === 0 ? (
          <p className="text-[10px] text-ink-dim">Drag a ruler onto the board, or add a guide here.</p>
        ) : (
          <ul className="space-y-1">
            {guides.map((g) => (
              <li
                key={g.id}
                className={cn(
                  "flex items-center gap-1 rounded-[6px] px-0.5",
                  (guideSelection ?? []).includes(g.id) && "bg-phosphor/10",
                )}
                onClick={(e) => selectGuides?.([g.id], e.shiftKey)}
              >
                <GuideDragHandle guide={g} />
                <NumField
                  className="field min-w-0 flex-1 font-mono"
                  value={g.pos}
                  aria-label={`${g.axis === "x" ? "vertical" : "horizontal"} guide`}
                  onCommit={(n) => {
                    const s = useDesign.getState();
                    if (!s.doc) return;
                    const next = s.snap
                      ? snapGuideToObjects(g.axis, n, s.doc.nodes, s.doc.artboard).pos
                      : n;
                    moveGuide(g.id, next);
                  }}
                />
                <button
                  type="button"
                  className="h-7 shrink-0 rounded-[8px] border border-border px-1.5 text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
                  aria-label="remove guide"
                  onClick={() => removeGuide(g.id)}
                >
                  Del
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}

function GuideDragHandle({ guide }: { guide: { id: string; axis: "x" | "y"; pos: number } }) {
  const drag = useRef<{ start: number; origin: number } | null>(null);

  return (
    <button
      type="button"
      className="w-5 shrink-0 cursor-grab rounded-[6px] text-[10px] text-phosphor active:cursor-grabbing"
      aria-label={`drag ${guide.axis === "x" ? "vertical" : "horizontal"} guide`}
      title="Drag to move — snaps to objects"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = {
          start: guide.axis === "x" ? e.clientX : e.clientY,
          origin: guide.pos,
        };
      }}
      onPointerMove={(e) => {
        const live = drag.current;
        if (!live) return;
        const s = useDesign.getState();
        if (!s.doc) return;
        const zoom = s.viewport.zoom || 1;
        const raw =
          live.origin + ((guide.axis === "x" ? e.clientX : e.clientY) - live.start) / zoom;
        const next =
          s.snap && !e.altKey
            ? snapGuideToObjects(guide.axis, raw, s.doc.nodes, s.doc.artboard).pos
            : raw;
        s.moveGuide(guide.id, Math.round(next * 10) / 10);
        const others = (s.doc.guides ?? [])
          .filter((g: { id: string; axis: "x" | "y"; pos: number }) => g.axis === guide.axis && g.id !== guide.id)
          .map((g: { pos: number }) => g.pos);
        s.setGuideProbe(guideProbe(guide.axis, next, s.doc.nodes, s.doc.artboard, others));
      }}
      onPointerUp={() => {
        drag.current = null;
        useDesign.getState().setGuideProbe(null);
      }}
      onPointerCancel={() => {
        drag.current = null;
        useDesign.getState().setGuideProbe(null);
      }}
    >
      {guide.axis === "x" ? "V" : "H"}
    </button>
  );
}
