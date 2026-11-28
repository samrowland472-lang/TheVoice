import { useRef, useState } from "react";
import { useDesign } from "@/lib/design/store";
import type { DesignNode } from "@/lib/design/types";
import { Field } from "./inspector-parts";

export function ScaleScrub({ nodes }: { nodes: DesignNode[] }) {
  const [pct, setPct] = useState(100);
  const origin = useRef<Map<string, { x: number; y: number; w: number; h: number }>>(new Map());
  if (nodes.length === 0) return null;
  const first = nodes[0];

  function begin() {
    const m = new Map<string, { x: number; y: number; w: number; h: number }>();
    for (const n of nodes) m.set(n.id, { x: n.x, y: n.y, w: n.w, h: n.h });
    origin.current = m;
    setPct(100);
    useDesign.getState().setSizeScrubId(first.id);
  }
  function apply(nextPct: number) {
    const s = nextPct / 100;
    const map = origin.current;
    if (!map.size) return;
    useDesign.getState().mapNodes(
      nodes.map((n) => n.id),
      (n) => {
        const o = map.get(n.id);
        if (!o) return n;
        const nw = Math.max(1, o.w * s);
        const nh = Math.max(1, o.h * s);
        const nx = o.x + (o.w - nw) / 2;
        const ny = o.y + (o.h - nh) / 2;
        return { ...n, x: nx, y: ny, w: nw, h: nh };
      },
    );
    setPct(nextPct);
  }
  function end() {
    useDesign.getState().setSizeScrubId(null);
    useDesign.getState().commit();
    setPct(100);
    origin.current = new Map();
  }

  const label = nodes.length > 1 ? `Scale · ${nodes.length}` : `Scale ${Math.round(pct)}%`;
  return (
    <Field label={label}>
      <input
        type="range"
        className="range-phosphor w-full"
        min={10}
        max={400}
        step={1}
        value={pct}
        aria-label={nodes.length > 1 ? "selection scale" : "scale"}
        onPointerDown={begin}
        onChange={(e) => apply(Number(e.target.value))}
        onPointerUp={end}
        onPointerCancel={end}
        onLostPointerCapture={end}
      />
    </Field>
  );
}
