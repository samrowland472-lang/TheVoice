import { Eye, EyeOff, Lock, Unlock } from "lucide-react";
import { useDesign } from "@/lib/design/store";
import { cn } from "@/lib/utils";

export function LayersPanel() {
  const doc = useDesign((s) => s.doc);
  const selection = useDesign((s) => s.selection);
  const select = useDesign((s) => s.select);
  const updateNodes = useDesign((s) => s.updateNodes);
  const reorder = useDesign((s) => s.reorder);

  if (!doc) return null;
  const layers = [...doc.nodes].reverse();

  return (
    <div className="flex min-h-0 flex-col">
      <div className="px-3 py-2 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">Layers</div>
      <ul className="min-h-0 flex-1 overflow-auto px-2 pb-2 scrollbar-thin">
        {layers.map((n) => {
          const active = selection.includes(n.id);
          return (
            <li key={n.id}>
              <div
                className={cn(
                  "flex h-9 items-center gap-1 rounded-[8px] px-1 text-xs",
                  active ? "bg-phosphor/10 text-ink" : "text-ink-dim hover:bg-surface-alt",
                )}
              >
                <button type="button" className="min-w-0 flex-1 truncate px-1 text-left" onClick={() => select([n.id])}>
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
