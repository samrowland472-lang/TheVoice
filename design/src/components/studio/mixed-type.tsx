import { CANVAS_FONTS } from "@/lib/design/fonts";
import { useDesign } from "@/lib/design/store";
import type { Align, DesignNode, TextNode } from "@/lib/design/types";
import { NumField } from "./num-field";

const WEIGHTS = [400, 500, 600, 700, 800];
const ALIGNS: Align[] = ["left", "center", "right"];

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
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
  const first = nodes[0]!;
  const display = brand.displayFont || "Chakra Petch";
  const body = brand.bodyFont || "Outfit";

  function patch(partial: Partial<TextNode>, commit = true) {
    updateNodes(ids, partial as Partial<DesignNode>, commit);
  }

  return (
    <section className="border-b border-border py-3">
      <div className="mb-2 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">
        Type · {nodes.length} layers
      </div>
      <p className="mb-2 text-[10px] text-ink-dim">
        Family, size, weight, tracking, leading and align write onto every selected text layer. Mixed
        values show an em dash or Mixed until you set one.
      </p>
      <div className="mb-2 flex gap-1">
        <button
          type="button"
          className="h-8 flex-1 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
          onClick={() =>
            patch({
              fontFamily: display,
              fontWeight: 600,
              fontSize: Math.max(...nodes.map((n) => n.fontSize), 40),
            })
          }
        >
          Display
        </button>
        <button
          type="button"
          className="h-8 flex-1 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink"
          onClick={() =>
            patch({
              fontFamily: body,
              fontWeight: 400,
              fontSize: Math.min(...nodes.map((n) => n.fontSize), 28),
            })
          }
        >
          Body
        </button>
      </div>
      <label className="mb-2 block text-[11px] text-ink-dim">
        <span className="mb-1 block">{mixedFamily ? "Family · mixed" : "Family"}</span>
        <select
          className="field"
          aria-label={mixedFamily ? "type family mixed" : "type family"}
          value={mixedFamily ? "" : first.fontFamily}
          onChange={(e) => {
            const family = e.target.value;
            if (!family) return;
            patch({ fontFamily: family });
          }}
        >
          {mixedFamily && (
            <option value="" disabled>
              Mixed
            </option>
          )}
          {CANVAS_FONTS.map((f) => (
            <option key={f.id} value={f.family}>
              {f.family}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-[11px] text-ink-dim">
          <span className="mb-1 block">{mixedSize ? "Size · mixed" : "Size"}</span>
          <NumField
            value={first.fontSize}
            mixed={mixedSize}
            min={6}
            max={400}
            aria-label="type size"
            onCommit={(n) => patch({ fontSize: n })}
          />
        </label>
        <label className="block text-[11px] text-ink-dim">
          <span className="mb-1 block">{mixedWeight ? "Weight · mixed" : "Weight"}</span>
          <select
            className="field"
            aria-label={mixedWeight ? "type weight mixed" : "type weight"}
            value={mixedWeight ? "" : String(first.fontWeight)}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (!Number.isFinite(n)) return;
              patch({ fontWeight: n });
            }}
          >
            {mixedWeight && (
              <option value="" disabled>
                Mixed
              </option>
            )}
            {WEIGHTS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[11px] text-ink-dim">
          <span className="mb-1 block">{mixedTracking ? "Tracking · mixed" : "Tracking"}</span>
          <NumField
            value={first.letterSpacing}
            mixed={mixedTracking}
            min={-8}
            max={40}
            aria-label="type tracking"
            onCommit={(n) => patch({ letterSpacing: n })}
          />
        </label>
        <label className="block text-[11px] text-ink-dim">
          <span className="mb-1 block">{mixedLeading ? "Leading · mixed" : "Leading"}</span>
          <NumField
            value={first.lineHeight}
            mixed={mixedLeading}
            min={0.7}
            max={2}
            aria-label="type leading"
            onCommit={(n) => patch({ lineHeight: n })}
          />
        </label>
      </div>
      <div className="mt-2">
        <div className="mb-1 text-[11px] text-ink-dim">{mixedAlign ? "Align · mixed" : "Align"}</div>
        <div className="flex gap-1" role="group" aria-label={mixedAlign ? "type align mixed" : "type align"}>
          {ALIGNS.map((a) => (
            <button
              key={a}
              type="button"
              className={`h-8 flex-1 rounded-[8px] border text-xs capitalize ${
                !mixedAlign && first.align === a ? "border-phosphor text-phosphor" : "border-border text-ink-dim"
              }`}
              onClick={() => patch({ align: a })}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
