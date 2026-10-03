import { useRef, useState, useSyncExternalStore } from "react";
import { ChevronDown, ChevronRight, ChevronUp, Eye, EyeOff, GripVertical, Link2, Lock, Search, Unlock, X } from "lucide-react";
import { useDesign } from "@/lib/design/store";
import { flattenLayers, layerDropLegal, type LayerDrop } from "@/lib/design/groups";
import { isGroup } from "@/lib/design/types";
import { cn } from "@/lib/utils";
import { getAlignCommitEcho, subscribeAlignCommitEcho } from "@/lib/design/align-preview";

type DropHint = LayerDrop;

export function LayersPanel() {
  const doc = useDesign((s) => s.doc);
  const selection = useDesign((s) => s.selection);
  const alignEcho = useSyncExternalStore(subscribeAlignCommitEcho, getAlignCommitEcho, getAlignCommitEcho);
  const alignPill = alignEcho?.fadePill ?? null;
  const select = useDesign((s) => s.select);
  const updateNodes = useDesign((s) => s.updateNodes);
  const toggleIsolate = useDesign((s) => s.toggleIsolate);
  const isolateSnapshot = useDesign((s) => s.isolateSnapshot);
  const reorder = useDesign((s) => s.reorder);
  const dropLayers = useDesign((s) => s.dropLayers);
  const groupSelection = useDesign((s) => s.groupSelection);
  const ungroupSelection = useDesign((s) => s.ungroupSelection);
  const listRef = useRef<HTMLUListElement>(null);
  const dragIdsRef = useRef<string[] | null>(null);
  const dwellRef = useRef<number | null>(null);
  const [dragIds, setDragIds] = useState<string[] | null>(null);
  const [dropHint, setDropHint] = useState<DropHint | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [query, setQuery] = useState("");

  if (!doc) return null;
  const needle = query.trim().toLowerCase();
  const filtering = needle.length > 0;
  const tree = flattenLayers(doc.nodes);
  const layers = filtering
    ? [...doc.nodes]
        .reverse()
        .filter((n) => {
          const name = (n.name || "").toLowerCase();
          const kind = (n.kind || "").toLowerCase();
          return name.includes(needle) || kind.includes(needle);
        })
        .map((node) => ({ node, depth: 0 }))
    : tree;
  const draggingSet = dragIds ? new Set(dragIds) : null;
  const canGroup = selection.length >= 2;

  const hintFromY = (clientY: number): DropHint | null => {
    const items = listRef.current?.querySelectorAll<HTMLElement>("[data-layer-id]");
    if (!items?.length) return null;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item) continue;
      const r = item.getBoundingClientRect();
      const id = item.dataset.layerId;
      if (!id) continue;
      if (clientY < r.top) return { mode: "before", anchorId: id };
      if (clientY <= r.bottom) {
        const y = (clientY - r.top) / Math.max(1, r.height);
        if (item.dataset.layerKind === "group" && y > 0.28 && y < 0.72) return { mode: "into", groupId: id };
        return y < 0.5 ? { mode: "before", anchorId: id } : { mode: "after", anchorId: id };
      }
    }
    const last = items[items.length - 1];
    const id = last?.dataset.layerId;
    return id ? { mode: "after", anchorId: id } : null;
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

  const clearDwell = () => {
    if (dwellRef.current != null) {
      window.clearTimeout(dwellRef.current);
      dwellRef.current = null;
    }
  };

  const armDwell = (hint: DropHint | null) => {
    clearDwell();
    if (hint?.mode !== "into") return;
    const group = doc.nodes.find((n) => n.id === hint.groupId);
    if (!group || !isGroup(group) || !group.collapsed) return;
    const id = group.id;
    dwellRef.current = window.setTimeout(() => {
      dwellRef.current = null;
      updateNodes([id], { collapsed: false }, true);
    }, 420);
  };

  const finish = (clientY: number) => {
    const ids = dragIdsRef.current;
    const hint = hintFromY(clientY);
    const live = useDesign.getState().doc;
    if (ids?.length && hint && live && layerDropLegal(live.nodes, ids, hint)) dropLayers(ids, hint);
    clearDwell();
    dragIdsRef.current = null;
    setDragIds(null);
    setDropHint(null);
  };

  return (
    <div className="flex min-h-0 flex-col">
      <div className="px-3 py-2 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">Layers</div>
      <div className="px-2 pb-2">
        <label className="relative flex h-8 items-center">
          <Search className="pointer-events-none absolute left-2 size-3.5 text-ink-faint" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter layers"
            aria-label="Filter layers"
            className="field h-8 w-full pl-7 pr-7 text-xs"
          />
          {query && (
            <button
              type="button"
              className="absolute right-1 grid size-6 place-items-center rounded-[6px] text-ink-faint hover:text-ink"
              aria-label="Clear filter"
              onClick={() => setQuery("")}
            >
              <X className="size-3.5" />
            </button>
          )}
        </label>
        <div className="mt-1.5 flex gap-1">
          <button
            type="button"
            className="h-7 flex-1 rounded-[6px] border border-border font-mono text-[10px] tracking-[0.14em] text-ink-dim uppercase hover:border-phosphor hover:text-ink disabled:opacity-30"
            disabled={!canGroup}
            onClick={() => groupSelection()}
          >
            Group
          </button>
          <button
            type="button"
            className="h-7 flex-1 rounded-[6px] border border-border font-mono text-[10px] tracking-[0.14em] text-ink-dim uppercase hover:border-phosphor hover:text-ink"
            onClick={() => ungroupSelection()}
          >
            Ungroup
          </button>
        </div>
        {isolateSnapshot ? (
          <button
            type="button"
            className="mt-1.5 h-7 w-full rounded-[6px] bg-phosphor/10 px-2 font-mono text-[10px] tracking-[0.16em] text-phosphor uppercase hover:bg-phosphor/20"
            onClick={() => toggleIsolate(selection.length ? selection : doc.nodes.map((n) => n.id))}
          >
            Show all
          </button>
        ) : null}
        {filtering && (
          <p className="mt-1 px-1 font-mono text-[10px] tracking-wide text-ink-faint">
            {layers.length} match{layers.length === 1 ? "" : "es"}
          </p>
        )}
        {dragIds && !filtering && (
          <p className="mt-1 px-1 font-mono text-[10px] tracking-wide text-ink-faint">
            Centre nests. Edge keeps that row's parent.
          </p>
        )}
      </div>
      <ul ref={listRef} className="min-h-0 flex-1 overflow-auto px-2 pb-2 scrollbar-thin">
        {layers.map(({ node: n, depth }) => {
          const active = selection.includes(n.id);
          const isKey = selection.length >= 2 && selection[selection.length - 1] === n.id;
          const dragging = draggingSet?.has(n.id) ?? false;
          const into = dropHint?.mode === "into" && dropHint.groupId === n.id;
          const before = dropHint?.mode === "before" && dropHint.anchorId === n.id;
          const after = dropHint?.mode === "after" && dropHint.anchorId === n.id;
          const group = isGroup(n);
          const blocked =
            !!dropHint && !!dragIds && (into || before || after) && !layerDropLegal(doc.nodes, dragIds, dropHint);
          const barLeft = 8 + depth * 12;
          return (
            <li key={n.id} data-layer-id={n.id} data-layer-kind={n.kind} className="relative">
              {before && (
                <span
                  className={cn("pointer-events-none absolute -top-px z-10 h-0.5 rounded-full", blocked ? "bg-ink-faint" : "bg-phosphor")}
                  style={{ left: barLeft, right: 8 }}
                />
              )}
              {after && (
                <span
                  className={cn("pointer-events-none absolute -bottom-px z-10 h-0.5 rounded-full", blocked ? "bg-ink-faint" : "bg-phosphor")}
                  style={{ left: barLeft, right: 8 }}
                />
              )}
              <div
                className={cn(
                  "flex h-9 items-center gap-0.5 rounded-[8px] px-0.5 text-xs",
                  active ? "bg-phosphor/10 text-ink" : "text-ink-dim hover:bg-surface-alt",
                  dragging && "opacity-40",
                  into && !blocked && "ring-1 ring-phosphor",
                  into && blocked && "ring-1 ring-ink-faint",
                )}
                style={{ paddingLeft: depth * 12 }}
              >
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center text-ink-faint touch-none select-none",
                    filtering ? "cursor-default opacity-40" : "cursor-grab active:cursor-grabbing",
                  )}
                  aria-label="Reorder layer"
                  onPointerDown={(e) => {
                    if (e.button !== 0 || filtering) return;
                    e.currentTarget.setPointerCapture(e.pointerId);
                    const sel = useDesign.getState().selection;
                    const groupIds = sel.includes(n.id) && sel.length > 1 ? sel : [n.id];
                    dragIdsRef.current = groupIds;
                    setDragIds(groupIds);
                    setDropHint({ mode: "before", anchorId: n.id });
                    if (!sel.includes(n.id)) select([n.id]);
                  }}
                  onPointerMove={(e) => {
                    if (!dragIdsRef.current) return;
                    autoScroll(e.clientY);
                    const hint = hintFromY(e.clientY);
                    setDropHint(hint);
                    armDwell(hint);
                  }}
                  onPointerUp={(e) => {
                    if (!dragIdsRef.current) return;
                    finish(e.clientY);
                  }}
                  onPointerCancel={() => {
                    clearDwell();
                    dragIdsRef.current = null;
                    setDragIds(null);
                    setDropHint(null);
                  }}
                >
                  <GripVertical className="size-3.5" />
                </span>
                {group ? (
                  <button
                    type="button"
                    className="grid size-6 shrink-0 place-items-center rounded-[6px] text-ink-faint hover:text-ink"
                    aria-label={n.collapsed ? "Expand group" : "Collapse group"}
                    onClick={() => updateNodes([n.id], { collapsed: !n.collapsed }, true)}
                  >
                    <ChevronRight className={cn("size-3.5 transition-transform", !n.collapsed && "rotate-90")} />
                  </button>
                ) : null}
                {editingId === n.id ? (
                  <input
                    className="field mx-1 h-7 min-w-0 flex-1 px-1.5 font-sans text-xs"
                    value={draftName}
                    autoFocus
                    aria-label="Layer name"
                    onChange={(e) => setDraftName(e.target.value)}
                    onBlur={() => {
                      const next = draftName.trim();
                      if (next && next !== n.name) updateNodes([n.id], { name: next }, true);
                      setEditingId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.currentTarget.blur();
                      }
                      if (e.key === "Escape") {
                        e.preventDefault();
                        setDraftName(n.name);
                        setEditingId(null);
                      }
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    className="min-w-0 flex-1 truncate px-1 text-left"
                    onClick={(e) => select([n.id], e.shiftKey)}
                    onDoubleClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      select([n.id]);
                      setDraftName(n.name || n.kind);
                      setEditingId(n.id);
                    }}
                  >
                    {n.linkId && <Link2 className="mr-1 inline size-3 text-phosphor" />}
                    {n.name || n.kind}
                    {isKey && (
                      <span className="ml-1.5 inline-block rounded-[4px] bg-phosphor/20 px-1 py-px font-mono text-[9px] tracking-[0.14em] text-phosphor uppercase">
                        Key
                      </span>
                    )}
                    {alignPill && alignEcho?.moverIds.includes(n.id) && (
                      <span
                        className="ml-1.5 inline-block rounded-[4px] bg-phosphor/15 px-1 py-px font-mono text-[9px] tracking-[0.04em] text-phosphor"
                        data-layer-align-pill={alignPill}
                        data-layer-align-mover=""
                        title="Matched edge while the commit caption eases"
                      >
                        {alignPill}
                      </span>
                    )}
                    {into && (
                      <span
                        className={cn(
                          "ml-1.5 font-mono text-[9px] tracking-[0.14em] uppercase",
                          blocked ? "text-ink-faint" : "text-phosphor",
                        )}
                      >
                        {blocked ? "No" : "Into"}
                      </span>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  className="size-7 rounded-[6px] hover:bg-ground"
                  title="Alt-click isolates this layer"
                  onClick={(e) => {
                    if (e.altKey) {
                      const sel = useDesign.getState().selection;
                      const keep = sel.includes(n.id) && sel.length > 1 ? sel : [n.id];
                      toggleIsolate(keep);
                      return;
                    }
                    updateNodes([n.id], { visible: !n.visible }, true);
                  }}
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
                  className="grid size-7 place-items-center rounded-[6px] text-ink-faint hover:text-ink"
                  onClick={() => reorder(n.id, "up")}
                  aria-label="Bring forward"
                >
                  <ChevronUp className="size-3.5" />
                </button>
                <button
                  type="button"
                  className="grid size-7 place-items-center rounded-[6px] text-ink-faint hover:text-ink"
                  onClick={() => reorder(n.id, "down")}
                  aria-label="Send back"
                >
                  <ChevronDown className="size-3.5" />
                </button>
              </div>
            </li>
          );
        })}
        {layers.length === 0 && (
          <li className="px-2 py-6 text-center text-xs text-ink-faint">
            {filtering ? "No layers match" : "Empty artboard"}
          </li>
        )}
      </ul>
      <HistoryList />
    </div>
  );
}

function HistoryList() {
  const past = useDesign((s) => s.past);
  const future = useDesign((s) => s.future);
  const restoreHistory = useDesign((s) => s.restoreHistory);
  const undo = useDesign((s) => s.undo);
  const redo = useDesign((s) => s.redo);

  return (
    <div className="shrink-0 border-t border-border">
      <div className="px-3 py-2 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">History</div>
      <ul className="max-h-36 overflow-auto px-2 pb-2 scrollbar-thin">
        {future
          .map((_, i) => i)
          .reverse()
          .map((idx) => (
            <li key={`f${idx}`}>
              <button
                type="button"
                className="flex h-8 w-full items-center rounded-[8px] px-2 text-left text-[11px] text-ink-faint hover:bg-surface-alt hover:text-ink"
                onClick={() => restoreHistory("future", idx)}
              >
                Redo {idx + 1}
              </button>
            </li>
          ))}
        <li>
          <span className="flex h-8 items-center rounded-[8px] bg-phosphor/10 px-2 text-[11px] text-phosphor">Now</span>
        </li>
        {past
          .map((_, i) => i)
          .reverse()
          .map((idx) => (
            <li key={`p${idx}`}>
              <button
                type="button"
                className="flex h-8 w-full items-center rounded-[8px] px-2 text-left text-[11px] text-ink-dim hover:bg-surface-alt hover:text-ink"
                onClick={() => restoreHistory("past", idx)}
              >
                Step {idx + 1}
              </button>
            </li>
          ))}
        {past.length === 0 && future.length === 0 && (
          <li className="px-2 py-3 text-center text-[11px] text-ink-faint">Undo stack is empty</li>
        )}
      </ul>
      {(past.length > 0 || future.length > 0) && (
        <div className="flex gap-1 px-2 pb-2">
          <button
            type="button"
            className="h-7 flex-1 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink disabled:opacity-30"
            disabled={!past.length}
            onClick={undo}
          >
            Undo
          </button>
          <button
            type="button"
            className="h-7 flex-1 rounded-[8px] border border-border text-[10px] text-ink-dim hover:border-phosphor hover:text-ink disabled:opacity-30"
            disabled={!future.length}
            onClick={redo}
          >
            Redo
          </button>
        </div>
      )}
    </div>
  );
}
