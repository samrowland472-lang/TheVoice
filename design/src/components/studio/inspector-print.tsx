import { BLEED_PRESETS, resolveBleed, uniformBleed } from "@/lib/design/print-marks";
import { useDesign } from "@/lib/design/store";
import { cn } from "@/lib/utils";
import { Field, Section } from "./inspector-parts";
import { NumField } from "./num-field";

export function InspectorPrint() {
  const doc = useDesign((s) => s.doc);
  const printMarks = useDesign((s) => s.printMarks);
  const togglePrintMarks = useDesign((s) => s.togglePrintMarks);
  const setBleed = useDesign((s) => s.setBleed);
  const setBleedEdges = useDesign((s) => s.setBleedEdges);
  const addGuide = useDesign((s) => s.addGuide);
  const moveGuide = useDesign((s) => s.moveGuide);
  const removeGuide = useDesign((s) => s.removeGuide);
  const clearGuides = useDesign((s) => s.clearGuides);

  if (!doc) return null;
  const edges = resolveBleed(doc);
  const uniform = uniformBleed(edges);
  const guides = doc.guides ?? [];

  return (
    <>
      <Section title="Print">
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
        <div className="grid grid-cols-2 gap-2">
          {([
            ["top", "T"],
            ["right", "R"],
            ["bottom", "B"],
            ["left", "L"],
          ] as const).map(([edge, label]) => (
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
      </Section>
      <Section title="Guides">
        <div className="mb-2 grid grid-cols-3 gap-1">
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
        </div>
        {guides.length === 0 ? (
          <p className="text-[10px] text-ink-dim">Drag a ruler onto the board, or add a guide here.</p>
        ) : (
          <ul className="space-y-1">
            {guides.map((g) => (
              <li key={g.id} className="flex items-center gap-1">
                <span className="w-4 shrink-0 text-[10px] text-phosphor">{g.axis === "x" ? "V" : "H"}</span>
                <NumField
                  className="field min-w-0 flex-1 font-mono"
                  value={g.pos}
                  aria-label={`${g.axis === "x" ? "vertical" : "horizontal"} guide`}
                  onCommit={(n) => moveGuide(g.id, n)}
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
