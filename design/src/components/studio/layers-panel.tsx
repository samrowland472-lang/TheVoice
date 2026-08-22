import { useState } from "react";
import { Eye, EyeOff, Lock, Unlock } from "lucide-react";
import { useDesign } from "@/lib/design/store";
import { cn } from "@/lib/utils";

export function LayersPanel() {
  const doc = useDesign((s) => s.doc);
  const selection = useDesign((s) => s.selection);
  const select = useDesign((s) => s.select);
  const updateNodes = useDesign((s) => s.updateNodes);
  const reorder = useDesign((s) => s.reorder);
  const reorderToIndex = useDesign((s) => s.reorderToIndex);

  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  if (!doc) return null;
  // Visual list: top of panel = top of z-order = last in nodes[]
  const layers = [...doc.nodes].reverse();

  const onDragStart = (e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const onDragEnd = () => {
    setDragId(null);
    setOverId(null);
  };

  const onDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (id !== overId) setOverId(id);
  };

  const onDragLeave = (e: React.DragEvent, id: string) => {
    if (e.currentTarget === e.target && overId === id) setOverId(null);
  };

  const onDrop = (e: React.DragEvent, targetId: string, targetVisualIndex: number) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || dragId;
    if (!id || id === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    // nodes[]: 0 = bottom, length-1 = top. Visual index 0 = top.
    const toIndex = doc.nodes.length - 1 - targetVisualIndex;
    reorderToIndex(id, toIndex);
    setDragId(null);
    setOverId(null);
  };

  return (
    <div className="flex min-h-0 flex-col">
      <div className="px-3 py-2 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">Layers</div>
      <ul className="min-h-0 flex-1 overflow-auto px-2 pb-2 scrollbar-thin">
        {layers.map((n, visualIndex) => {
          const active = selection.includes(n.id);
          const isDragging = dragId === n.id;
          const isOver = overId === n.id && dragId !== n.id;
          return (
            <li key={n.id}>
              <div
                onDragOver={(e) => onDragOver(e, n.id)}
                onDragLeave={(e) => onDragLeave(e, n.id)}
                onDrop={(e) => onDrop(e, n.id, visualIndex)}
                className={cn(
                  "flex h-9 items-center gap-1 rounded-[8px] px-1 text-xs",
                  active ? "bg-phosphor/10 text-ink" : "text-ink-dim hover:bg-surface-alt",
                  isDragging && "opacity-40",
                  isOver && "ring-1 ring-phosphor/50 bg-phosphor/5",
                )}
              >
                <span
                  draggable
                  onDragStart={(e) => onDragStart(e, n.id)}
                  onDragEnd={onDragEnd}
                  className="flex size-5 shrink-0 cursor-grab items-center justify-center text-ink-faint active:cursor-grabbing"
                  aria-label="Drag to reorder"
                  title="Drag to reorder"
                >
                  <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden>
                    <circle cx="3" cy="3" r="1.2" />
                    <circle cx="7" cy="3" r="1.2" />
                    <circle cx="3" cy="7" r="1.2" />
                    <circle cx="7" cy="7" r="1.2" />
                    <circle cx="3" cy="11" r="1.2" />
                    <circle cx="7" cy="11" r="1.2" />
                  </svg>
                </span>
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate px-1 text-left"
                  onClick={() => select([n.id])}
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
        {layers.length === 0 && <li className="px-2 py-6 text-center text-xs text-ink-faint">Empty artboard</li>}
      </ul>
    </div>
  );
}
