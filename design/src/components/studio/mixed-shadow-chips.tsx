import {
  DEFAULT_SHADOW,
  shadowOffsetChipLabel,
  stampShadowBlur,
  stampShadowColor,
  stampShadowOffset,
  stampShadowSpread,
  stampShadowInset,
  shadowSpreadLabel,
  shadowInsetLabel,
} from "@/lib/design/shadow";
import { useDesign } from "@/lib/design/store";
import type { StrokeGhost } from "@/lib/design/stroke-ghost";
import type { DesignNode } from "@/lib/design/types";

function ghostShadow(patch: StrokeGhost) {
  useDesign.getState().setStrokeGhost(patch);
}

export function MixedShadowColorChips({ nodes }: { nodes: DesignNode[] }) {
  const mapNodes = useDesign((s) => s.mapNodes);
  const ids = nodes.map((n) => n.id);
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {nodes.map((n) => {
        const color = n.shadow?.color ?? DEFAULT_SHADOW.color;
        return (
          <button
            key={`sh-color-${n.id}`}
            type="button"
            className="flex h-7 items-center gap-1.5 rounded-full border border-phosphor/50 bg-surface-alt px-2 font-mono text-[9px] text-phosphor"
            title={`Unify shadow color with ${n.name || n.kind}: ${color}`}
            aria-label={`Unify shadow color with ${n.name || n.kind}: ${color}`}
            onMouseEnter={() => ghostShadow({ shadowColor: color })}
            onFocus={() => ghostShadow({ shadowColor: color })}
            onMouseLeave={() => ghostShadow(null)}
            onBlur={() => ghostShadow(null)}
            onClick={() => {
              mapNodes(
                ids,
                (layer: DesignNode) => ({
                  ...layer,
                  shadow: stampShadowColor(layer.shadow, color),
                }),
                true,
              );
            }}
          >
            <span
              className="size-3.5 shrink-0 rounded-full border border-phosphor/40"
              style={{ background: color }}
            />
            {color}
          </button>
        );
      })}
    </div>
  );
}
