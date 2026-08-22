import { useRef, useState } from "react";
import { Eye, EyeOff, GripVertical, Lock, Unlock } from "lucide-react";
import { useDesign } from "@/lib/design/store";
import { cn } from "@/lib/utils";

export function LayersPanel() {
  const doc = useDesign((s) => s.doc);
  const selection = useDesign((s) => s.selection);
  const select = useDesign((s) => s.select);
  const updateNodes = useDesign((s) => s.updateNodes);
  const reorder = useDesign((s) => s.reorder);
  const reorderInsert = useDesign((s) => s.reorderInsert);
  const listRef = useRef<HTMLUListElement>(null);
  const dragIdsRef = useRef<string[] | null>(null);
  const [dragIds, setDragIds] = useState<string[] | null>(null);
  const [dropAt, setDropAt] = useState<number | null>(null);

  if (!doc) return null;
  const layers = [...doc.nodes].reverse();
  const draggingSet = dragIds ? new Set(dragIds) : null;

  const indexFromY = (clientY: number) => {
    const items = listRef.current?.querySelectorAll<HTMLElement>("[data-layer-id]");
    if (!items?.length) return 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item) continue;
      const r = item.getBoundingClientRect();
      if (clientY < r.top + r.height / 2) return i;
    }
    return items.length;
  };

  const autoScroll = (clientY: number) => {
    const list = listRef.current;
    if (!list || list.scrollHeight <= list.clientHeight + 1) return;
    const r = list.getBoundingClientRect();
    if (clientY < r.top || clientY > r.bottom) return;
    const edge = 16;
    if (clientY < r.top + edge) list.scrollTop -= 8;
    else if (clientY > r.bottom - edge) list.scrollTop += 8;
  };

  const finish = (clientY: number) => {
    const ids = dragIdsRef.current;
    if (ids?.length) reorderInsert(ids, indexFromY(clientY));
    dragIdsRef.current = null;
    setDragIds(null);
    setDropAt(null);
  };

  return (
    <div className="flex min-h-0 flex-col">
      <div className="px-3 py-2 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">Layers</div>
      <ul ref={listRef} className="min-h-0 flex-1 overflow-auto px-2 pb-2 scrollbar-thin">
        {layers.map((n, i) => {
          const active = selection.includes(n.id);
          const dragging = draggingSet?.has(n.id) ?? false;
          return (
            <li key={n.id} data-layer-id={n.id} className="relative">
              {dropAt === i && (
                <span className="pointer-events-none absolute inset-x-1 -top-px z-10 h-0.5 rounded-full bg-phosphor" />
              )}
              <div
                className={cn(
                  "flex h-9 items-center gap-0.5 rounded-[8px] px-0.5 text-xs",
                  active ? "bg-phosphor/10 text-ink" : "text-ink-dim hover:bg-surface-alt",
                  dragging && "opacity-40",
                )}
              >
                <span
                  className="grid size-7 shrink-0 cursor-grab place-items-center text-ink-faint touch-none select-none active:cursor-grabbing"
                  aria-label="Reorder layer"
                  onPointerDown={(e) => {
                    if (e.button !== 0) return;
                    e.currentTarget.setPointerCapture(e.pointerId);
                    const sel = useDesign.getState().selection;
                    const group = sel.includes(n.id) && sel.length > 1 ? sel : [n.id];
                    dragIdsRef.current = group;
                    setDragIds(group);
                    setDropAt(i);
                    if (!sel.includes(n.id)) select([n.id]);
                  }}
                  onPointerMove={(e) => {
                    if (!dragIdsRef.current) return;
                    autoScroll(e.clientY);
                    setDropAt(indexFromY(e.clientY));
                  }}
                  onPointerUp={(e) => {
                    if (!dragIdsRef.current) return;
                    finish(e.clientY);
                  }}
                  onPointerCancel={() => {
                    dragIdsRef.current = null;
                    setDragIds(null);
                    setDropAt(null);
                  }}
                >
                  <GripVertical className="size-3.5" />
                </span>
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate px-1 text-left"
                  onClick={(e) => select([n.id], e.shiftKey)}
                >
                  {n.name || n.kind}
                </button>
                <button
                  type="button"
                  className="size-7 rounded-[6px] hover:bg-ground"
                  onClick={() => updateNodes([n.id], { visible: !n.visible }, true)}
                  aria-label={n.visible ? "Hide" : "Show"}
                >
                  {n.visible ? <Eye className="mx-auto size-3.5" /> : <EyeOff className="mx-auto size-3.5" />}
                </button>
                <button
                  type="button"
                  className="size-7 rounded-[6px] hover:bg-ground"
                  onClick={() => updateNodes([n.id], { locked: !n.locked }, true)}
                  aria-label={n.locked ? "Unlock" : "Lock"}
                >
                  {n.locked ? <Lock className="mx-auto size-3.5" /> : <Unlock className="mx-auto size-3.5" />}
                </button>
                <button
                  type="button"
                  className="size-7 font-mono text-[10px] hover:text-ink"
                  onClick={() => reorder(n.id, "up")}
                  aria-label="Bring forward"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="size-7 font-mono text-[10px] hover:text-ink"
                  onClick={() => reorder(n.id, "down")}
                  aria-label="Send back"
                >
                  ↓
                </button>
              </div>
            </li>
          );
        })}
        {dropAt === layers.length && layers.length > 0 && (
          <li className="relative h-2">
            <span className="pointer-events-none absolute inset-x-1 top-0 h-0.5 rounded-full bg-phosphor" />
          </li>
        )}
        {layers.length === 0 && <li className="px-2 py-6 text-center text-xs text-ink-faint">Empty artboard</li>}
      </ul>
    </div>
  );
}
