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
import type { DesignNode } from "@/lib/design/types";

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

export function MixedShadowBlurChips({ nodes }: { nodes: DesignNode[] }) {
  const mapNodes = useDesign((s) => s.mapNodes);
  const ids = nodes.map((n) => n.id);
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {nodes.map((n) => {
        const blur = n.shadow?.blur ?? DEFAULT_SHADOW.blur;
        const label = `b${blur}`;
        return (
          <button
            key={`sh-blur-${n.id}`}
            type="button"
            className="flex h-7 items-center rounded-full border border-phosphor/50 bg-surface-alt px-2 font-mono text-[9px] text-phosphor"
            title={`Unify shadow blur with ${n.name || n.kind}: ${label}`}
            aria-label={`Unify shadow blur with ${n.name || n.kind}: ${label}`}
            onClick={() => {
              mapNodes(
                ids,
                (layer: DesignNode) => ({
                  ...layer,
                  shadow: stampShadowBlur(layer.shadow, blur),
                }),
                true,
              );
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function MixedShadowOffsetChips({
  nodes,
  axis,
}: {
  nodes: DesignNode[];
  axis: "ox" | "oy";
}) {
  const mapNodes = useDesign((s) => s.mapNodes);
  const ids = nodes.map((n) => n.id);
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {nodes.map((n) => {
        const label = shadowOffsetChipLabel(axis, n.shadow);
        return (
          <button
            key={`${axis}-${n.id}`}
            type="button"
            className="flex h-7 items-center rounded-full border border-phosphor/50 bg-surface-alt px-2 font-mono text-[9px] text-phosphor"
            title={`Unify shadow ${axis} with ${n.name || n.kind}: ${label}`}
            aria-label={`Unify shadow ${axis} with ${n.name || n.kind}: ${label}`}
            onClick={() => {
              const value = n.shadow ? n.shadow[axis] : DEFAULT_SHADOW[axis];
              mapNodes(
                ids,
                (layer: DesignNode) => ({
                  ...layer,
                  shadow: stampShadowOffset(layer.shadow, axis, value),
                }),
                true,
              );
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function MixedShadowSpreadChips({ nodes }: { nodes: DesignNode[] }) {
  const mapNodes = useDesign((s) => s.mapNodes);
  const ids = nodes.map((n) => n.id);
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {nodes.map((n) => {
        const spread = n.shadow?.spread ?? DEFAULT_SHADOW.spread ?? 0;
        const label = shadowSpreadLabel(spread);
        return (
          <button
            key={`sh-spread-${n.id}`}
            type="button"
            className="flex h-7 items-center rounded-full border border-phosphor/50 bg-surface-alt px-2 font-mono text-[9px] text-phosphor"
            title={`Unify shadow spread with ${n.name || n.kind}: ${label}`}
            aria-label={`Unify shadow spread with ${n.name || n.kind}: ${label}`}
            onClick={() => {
              mapNodes(
                ids,
                (layer: DesignNode) => ({
                  ...layer,
                  shadow: stampShadowSpread(layer.shadow, spread),
                }),
                true,
              );
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function MixedShadowInsetChips({ nodes }: { nodes: DesignNode[] }) {
  const mapNodes = useDesign((s) => s.mapNodes);
  const ids = nodes.map((n) => n.id);
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {nodes.map((n) => {
        const inset = Boolean(n.shadow?.inset);
        const label = shadowInsetLabel(inset);
        return (
          <button
            key={`sh-inset-${n.id}`}
            type="button"
            className="flex h-7 items-center rounded-full border border-phosphor/50 bg-surface-alt px-2 font-mono text-[9px] text-phosphor"
            title={`Unify shadow inset with ${n.name || n.kind}: ${label}`}
            aria-label={`Unify shadow inset with ${n.name || n.kind}: ${label}`}
            onClick={() => {
              mapNodes(
                ids,
                (layer: DesignNode) => ({
                  ...layer,
                  shadow: stampShadowInset(layer.shadow, inset),
                }),
                true,
              );
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
