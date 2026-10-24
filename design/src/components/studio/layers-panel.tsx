import { useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { ChevronDown, ChevronRight, ChevronUp, Eye, EyeOff, GripVertical, Link2, Lock, Search, Unlock, X } from "lucide-react";
import { useDesign } from "@/lib/design/store";
import { flattenLayers, layerDropLegal, type LayerDrop } from "@/lib/design/groups";
import { isGroup, isText, type DesignNode } from "@/lib/design/types";
import { CANVAS_FONTS } from "@/lib/design/fonts";
import { cn } from "@/lib/utils";
import { NumField } from "./num-field";
import { nextFromRangeKey } from "./range-keys";
import {
  alignCommitLayerFadeLine,
  alignCommitSolidLead,
  alignEdgeChipLabel,
  alignPreviewMoverIds,
  getAlignCommitEcho,
  getAlignPreview,
  subscribeAlignCommitEcho,
  subscribeAlignPreview,
} from "@/lib/design/align-preview";

type DropHint = LayerDrop;

export function LayersPanel() {
  const doc = useDesign((s) => s.doc);
  const selection = useDesign((s) => s.selection);
  const alignEcho = useSyncExternalStore(subscribeAlignCommitEcho, getAlignCommitEcho, getAlignCommitEcho);
  const alignPill = alignEcho?.fadePill ?? null;
  const alignSolid = alignEcho ? alignCommitSolidLead(alignEcho.chipLabel, alignEcho.moveCount) : null;
  const alignFade = alignEcho && alignPill
    ? alignCommitLayerFadeLine(alignEcho.chipLabel, alignPill, alignEcho.moveCount)
    : null;
  const alignPreview = useSyncExternalStore(subscribeAlignPreview, getAlignPreview, getAlignPreview);
  const previewChip = alignPreview ? alignEdgeChipLabel(alignPreview) : null;
  const previewMovers = alignPreview ? alignPreviewMoverIds(alignPreview) : [];
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
  const [editingOpacityId, setEditingOpacityId] = useState<string | null>(null);
  const [opacityDraft, setOpacityDraft] = useState("");
  const [editingSizeId, setEditingSizeId] = useState<string | null>(null);
  const [sizeDraft, setSizeDraft] = useState("");
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [trackDraft, setTrackDraft] = useState("");
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [leadDraft, setLeadDraft] = useState("");
  const [editingWeightId, setEditingWeightId] = useState<string | null>(null);
  const [weightDraft, setWeightDraft] = useState("");
  const [editingFamilyId, setEditingFamilyId] = useState<string | null>(null);
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
    <div data-layers-panel className="flex min-h-0 flex-col">
      <div className="flex items-baseline justify-between px-3 py-2">
        <div className="font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">Layers</div>
        <div className="font-mono text-[10px] tracking-wide text-ink-faint">
          {doc.nodes.length}
          {selection.length > 0 ? ` · ${selection.length} selected` : ""}
        </div>
      </div>
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
          <button
            type="button"
            className="h-7 flex-1 rounded-[6px] border border-border font-mono text-[10px] tracking-[0.14em] text-ink-dim uppercase hover:border-phosphor hover:text-ink disabled:opacity-30"
            disabled={!selection.length}
            onClick={() => useDesign.getState().duplicateSelected()}
            title="Duplicate selection (Cmd+D)"
          >
            Duplicate
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
        <OpacityQuickStrip />
        <TypeQuickStrip />
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
                  "group flex h-9 items-center gap-0.5 rounded-[8px] px-0.5 text-xs",
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
                    {n.opacity < 0.999 && (
                      <button
                        type="button"
                        className="ml-1.5 inline-block rounded-[4px] bg-surface-alt px-1 py-px font-mono text-[9px] tracking-wide text-ink-faint hover:bg-phosphor/15 hover:text-phosphor"
                        title="Edit opacity · Alt+0–9 tenths · Alt+Arrow 1% · Alt+Shift+0 full"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!selection.includes(n.id)) select([n.id]);
                          requestAnimationFrame(() => {
                            const el = (document.querySelector("[data-opacity-range='inspector']") ||
                              document.querySelector("[data-opacity-range]")) as HTMLInputElement | null;
                            el?.focus();
                          });
                        }}
                      >
                        {Math.round(n.opacity * 100)}%
                      </button>
                    )}
                    {isText(n) && editingSizeId !== n.id && (
                      <button
                        type="button"
                        className="ml-1.5 inline-block rounded-[4px] bg-surface-alt px-1 py-px font-mono text-[9px] tracking-wide text-ink-faint hover:bg-phosphor/15 hover:text-phosphor"
                        title="Click to edit type size"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!selection.includes(n.id)) select([n.id]);
                          setSizeDraft(String(Math.round(n.fontSize)));
                          setEditingSizeId(n.id);
                        }}
                      >
                        {Math.round(n.fontSize)}
                      </button>
                    )}
                    {isText(n) && editingSizeId === n.id && (
                      <input
                        type="number"
                        min={6}
                        max={400}
                        step={1}
                        value={sizeDraft}
                        autoFocus
                        aria-label={`${n.name || n.kind} type size`}
                        className="ml-1.5 inline-block h-5 w-10 rounded-[4px] border border-phosphor bg-surface px-1 font-mono text-[9px] text-ink"
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setSizeDraft(e.target.value)}
                        onBlur={() => {
                          const next = Math.max(6, Math.min(400, Number(sizeDraft) || n.fontSize));
                          updateNodes([n.id], { fontSize: next } as Partial<DesignNode>, true);
                          setEditingSizeId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const next = Math.max(6, Math.min(400, Number(sizeDraft) || n.fontSize));
                            updateNodes([n.id], { fontSize: next } as Partial<DesignNode>, true);
                            setEditingSizeId(null);
                          } else if (e.key === "Escape") {
                            setEditingSizeId(null);
                          }
                        }}
                      />
                    )}
                    {isText(n) && editingTrackId !== n.id && (
                      <button
                        type="button"
                        className="ml-1.5 inline-block rounded-[4px] bg-surface-alt px-1 py-px font-mono text-[9px] tracking-wide text-ink-faint hover:bg-phosphor/15 hover:text-phosphor"
                        title="Click to edit tracking"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!selection.includes(n.id)) select([n.id]);
                          setTrackDraft(String(n.letterSpacing));
                          setEditingTrackId(n.id);
                        }}
                      >
                        {Number.isInteger(n.letterSpacing) ? n.letterSpacing : Number(n.letterSpacing.toFixed(2))}
                      </button>
                    )}
                    {isText(n) && editingTrackId === n.id && (
                      <input
                        type="number"
                        min={-8}
                        max={40}
                        step={0.25}
                        value={trackDraft}
                        autoFocus
                        aria-label={`${n.name || n.kind} tracking`}
                        className="ml-1.5 inline-block h-5 w-12 rounded-[4px] border border-phosphor bg-surface px-1 font-mono text-[9px] text-ink"
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setTrackDraft(e.target.value)}
                        onBlur={() => {
                          const next = Math.max(-8, Math.min(40, Number(trackDraft) || n.letterSpacing));
                          updateNodes([n.id], { letterSpacing: next } as Partial<DesignNode>, true);
                          setEditingTrackId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const next = Math.max(-8, Math.min(40, Number(trackDraft) || n.letterSpacing));
                            updateNodes([n.id], { letterSpacing: next } as Partial<DesignNode>, true);
                            setEditingTrackId(null);
                          } else if (e.key === "Escape") {
                            setEditingTrackId(null);
                          }
                        }}
                      />
                    )}
                    {isText(n) && editingLeadId !== n.id && (
                      <button
                        type="button"
                        className="ml-1.5 inline-block rounded-[4px] bg-surface-alt px-1 py-px font-mono text-[9px] tracking-wide text-ink-faint hover:bg-phosphor/15 hover:text-phosphor"
                        title="Click to edit leading"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!selection.includes(n.id)) select([n.id]);
                          setLeadDraft(n.lineHeight.toFixed(2));
                          setEditingLeadId(n.id);
                        }}
                      >
                        {n.lineHeight.toFixed(2)}
                      </button>
                    )}
                    {isText(n) && editingLeadId === n.id && (
                      <input
                        type="number"
                        min={0.7}
                        max={2}
                        step={0.02}
                        value={leadDraft}
                        autoFocus
                        aria-label={`${n.name || n.kind} leading`}
                        className="ml-1.5 inline-block h-5 w-12 rounded-[4px] border border-phosphor bg-surface px-1 font-mono text-[9px] text-ink"
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setLeadDraft(e.target.value)}
                        onBlur={() => {
                          const next = Math.max(0.7, Math.min(2, Number(leadDraft) || n.lineHeight));
                          updateNodes([n.id], { lineHeight: next } as Partial<DesignNode>, true);
                          setEditingLeadId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const next = Math.max(0.7, Math.min(2, Number(leadDraft) || n.lineHeight));
                            updateNodes([n.id], { lineHeight: next } as Partial<DesignNode>, true);
                            setEditingLeadId(null);
                          } else if (e.key === "Escape") {
                            setEditingLeadId(null);
                          }
                        }}
                      />
                    )}
                    {isText(n) && editingWeightId !== n.id && (
                      <button
                        type="button"
                        className="ml-1.5 inline-block rounded-[4px] bg-surface-alt px-1 py-px font-mono text-[9px] tracking-wide text-ink-faint hover:bg-phosphor/15 hover:text-phosphor"
                        title="Click to edit weight"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!selection.includes(n.id)) select([n.id]);
                          setWeightDraft(String(Math.round(n.fontWeight)));
                          setEditingWeightId(n.id);
                        }}
                      >
                        {Math.round(n.fontWeight)}
                      </button>
                    )}
                    {isText(n) && editingWeightId === n.id && (
                      <input
                        type="number"
                        min={100}
                        max={900}
                        step={100}
                        value={weightDraft}
                        autoFocus
                        aria-label={`${n.name || n.kind} weight`}
                        className="ml-1.5 inline-block h-5 w-10 rounded-[4px] border border-phosphor bg-surface px-1 font-mono text-[9px] text-ink"
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setWeightDraft(e.target.value)}
                        onBlur={() => {
                          const next = Math.max(100, Math.min(900, Math.round(Number(weightDraft) || n.fontWeight)));
                          updateNodes([n.id], { fontWeight: next } as Partial<DesignNode>, true);
                          setEditingWeightId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const next = Math.max(100, Math.min(900, Math.round(Number(weightDraft) || n.fontWeight)));
                            updateNodes([n.id], { fontWeight: next } as Partial<DesignNode>, true);
                            setEditingWeightId(null);
                          } else if (e.key === "Escape") {
                            setEditingWeightId(null);
                          }
                        }}
                      />
                    )}
                    {isText(n) && editingFamilyId !== n.id && (
                      <button
                        type="button"
                        className="ml-1.5 inline-block max-w-[5.5rem] truncate rounded-[4px] bg-surface-alt px-1 py-px font-mono text-[9px] tracking-wide text-ink-faint hover:bg-phosphor/15 hover:text-phosphor"
                        title={`Click to change font family · ${n.fontFamily}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!selection.includes(n.id)) select([n.id]);
                          setEditingFamilyId(n.id);
                        }}
                      >
                        {n.fontFamily.split(" ")[0] || n.fontFamily}
                      </button>
                    )}
                    {isText(n) && editingFamilyId === n.id && (
                      <select
                        className="ml-1.5 inline-block h-5 max-w-[7rem] rounded-[4px] border border-phosphor bg-surface px-0.5 font-mono text-[9px] text-ink"
                        value={n.fontFamily}
                        autoFocus
                        aria-label={`${n.name || n.kind} font family`}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          updateNodes([n.id], { fontFamily: e.target.value } as Partial<DesignNode>, true);
                          setEditingFamilyId(null);
                        }}
                        onBlur={() => setEditingFamilyId(null)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setEditingFamilyId(null);
                        }}
                      >
                        {CANVAS_FONTS.map((f) => (
                          <option key={f.id} value={f.family}>{f.family}</option>
                        ))}
                      </select>
                    )}
                    {isKey && (
                      <span className="ml-1.5 inline-block rounded-[4px] bg-phosphor/20 px-1 py-px font-mono text-[9px] tracking-[0.14em] text-phosphor uppercase">
                        Key
                      </span>
                    )}
                    {previewChip && previewMovers.includes(n.id) && (
                      <span
                        className="ml-1.5 inline-block rounded-[4px] bg-phosphor/15 px-1 py-px font-mono text-[9px] tracking-[0.04em] text-phosphor"
                        data-layer-align-preview={previewChip}
                        data-layer-align-preview-mover=""
                        title="Edge chip while align preview is armed"
                      >
                        {previewChip}
                      </span>
                    )}
                    {alignSolid && !alignFade && alignEcho?.moverIds.includes(n.id) && (
                      <span
                        className="ml-1.5 inline-block rounded-[4px] bg-phosphor/15 px-1 py-px font-mono text-[9px] tracking-[0.04em] text-phosphor"
                        data-layer-align-solid={alignSolid}
                        data-layer-align-mover=""
                        title="Same truncated chip and move count as the inspector solid beat"
                      >
                        {alignSolid}
                      </span>
                    )}
                    {alignFade && alignEcho?.moverIds.includes(n.id) && (
                      <span
                        className="ml-1.5 inline-block max-w-[16rem] truncate rounded-[4px] bg-phosphor/15 px-1 py-px align-bottom font-mono text-[9px] tracking-[0.04em] text-phosphor"
                        data-layer-align-fade={alignFade}
                        data-layer-align-solid={alignSolid ?? ""}
                        data-layer-align-pill={alignPill ?? ""}
                        data-layer-align-mover=""
                        title={alignFade}
                      >
                        {alignFade}
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
                <div className={cn(
                  "flex items-center gap-1 px-1 -mx-1 transition-opacity duration-150",
                  active ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                )}>
                  {editingOpacityId === n.id ? (
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={opacityDraft}
                      autoFocus
                      aria-label={`${n.name || n.kind} opacity percent`}
                      className="field h-6 w-12 px-1 font-mono text-[10px]"
                      onChange={(e) => setOpacityDraft(e.target.value)}
                      onBlur={() => {
                        const pct = Math.max(0, Math.min(100, Number(opacityDraft) || 0));
                        updateNodes([n.id], { opacity: pct / 100 }, true);
                        setEditingOpacityId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const pct = Math.max(0, Math.min(100, Number(opacityDraft) || 0));
                          updateNodes([n.id], { opacity: pct / 100 }, true);
                          setEditingOpacityId(null);
                        } else if (e.key === "Escape") {
                          setEditingOpacityId(null);
                        }
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <button
                      type="button"
                      className="min-w-[2.5rem] rounded-[4px] bg-surface-alt px-1 py-px font-mono text-[9px] tracking-wide text-ink-faint hover:bg-phosphor/15 hover:text-phosphor"
                      title="Click to type opacity percent · Alt+0–9 tenths · Alt+Arrow 1% · Alt+Shift+0 full"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!selection.includes(n.id)) select([n.id]);
                        setOpacityDraft(String(Math.round(n.opacity * 100)));
                        setEditingOpacityId(n.id);
                      }}
                    >
                      {Math.round(n.opacity * 100)}%
                    </button>
                  )}
                  <input
                    type="range"
                    className="range-phosphor h-5 w-16 shrink-0"
                    min={0}
                    max={1}
                    step={0.01}
                    value={n.opacity}
                    aria-label={`${n.name || n.kind} opacity`}
                    data-opacity-range="row"
                    style={{ "--fill-opacity": String(n.opacity) } as CSSProperties}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      updateNodes([n.id], { opacity: next });
                    }}
                    onPointerUp={() => useDesign.getState().commit()}
                    onPointerDown={(e) => e.stopPropagation()}
                    title="Scrub layer opacity"
                  />
                </div>
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
            {filtering
              ? `No layers match “${needle}”`
              : "Empty artboard — pick a tool and draw"}
          </li>
        )}
      </ul>
      <HistoryList />
    </div>
  );
}


function TypeQuickStrip() {
  const selection = useDesign((s) => s.selection);
  const doc = useDesign((s) => s.doc);
  const updateNodes = useDesign((s) => s.updateNodes);
  const [editingWeight, setEditingWeight] = useState(false);
  const [weightDraft, setWeightDraft] = useState("");
  const [editingFamily, setEditingFamily] = useState(false);
  const [editingSize, setEditingSize] = useState(false);
  const [sizeDraft, setSizeDraft] = useState("");
  const [editingTrack, setEditingTrack] = useState(false);
  const [trackDraft, setTrackDraft] = useState("");
  const [editingLead, setEditingLead] = useState(false);
  const [leadDraft, setLeadDraft] = useState("");
  if (!doc || selection.length === 0) return null;
  const textNodes = selection
    .map((id) => doc.nodes.find((n) => n.id === id))
    .filter((n): n is NonNullable<typeof n> => Boolean(n) && isText(n));
  if (textNodes.length === 0) return null;
  const sizeMixed = new Set(textNodes.map((n) => Math.round(n.fontSize))).size > 1;
  const trackMixed = new Set(textNodes.map((n) => Math.round(n.letterSpacing * 4) / 4)).size > 1;
  const leadMixed = new Set(textNodes.map((n) => Math.round(n.lineHeight * 50) / 50)).size > 1;
  const weightMixed = new Set(textNodes.map((n) => Math.round(n.fontWeight))).size > 1;
  const familyMixed = new Set(textNodes.map((n) => n.fontFamily)).size > 1;
  const size = sizeMixed ? textNodes[textNodes.length - 1].fontSize : textNodes[0].fontSize;
  const tracking = trackMixed ? textNodes[textNodes.length - 1].letterSpacing : textNodes[0].letterSpacing;
  const leading = leadMixed ? textNodes[textNodes.length - 1].lineHeight : textNodes[0].lineHeight;
  const weight = weightMixed ? textNodes[textNodes.length - 1].fontWeight : textNodes[0].fontWeight;
  const family = familyMixed ? textNodes[textNodes.length - 1].fontFamily : textNodes[0].fontFamily;
  const ids = textNodes.map((n) => n.id);
  const clearGhost = () => {
    const s = useDesign.getState();
    if (s.typeGhost) {
      s.setTypeGhost(null);
      s.commit();
    }
  };
  const mixedAny = sizeMixed || trackMixed || leadMixed || weightMixed || familyMixed;
  return (
    <div className="mt-2 rounded-[8px] border border-border bg-surface px-2 py-1.5">
      <div className="mb-1 flex items-center justify-between font-mono text-[10px] tracking-[0.14em] text-ink-faint uppercase">
        <span>Type</span>
        <div className="flex items-center gap-0.5 text-[9px]">
          {mixedAny ? (
            <span className="text-phosphor">Mixed</span>
          ) : (
            <>
              {!editingSize ? (
                <button
                  type="button"
                  className="rounded-[3px] bg-surface-alt px-1 py-px tracking-wide text-ink-faint hover:bg-phosphor/15 hover:text-phosphor"
                  title="Click to edit size"
                  onClick={() => {
                    setSizeDraft(String(Math.round(size)));
                    setEditingSize(true);
                  }}
                >
                  {Math.round(size)}
                </button>
              ) : (
                <input
                  type="number"
                  min={8}
                  max={160}
                  step={1}
                  value={sizeDraft}
                  autoFocus
                  aria-label="Type size"
                  className="h-4 w-9 rounded-[3px] border border-phosphor bg-surface px-0.5 text-ink"
                  onChange={(e) => setSizeDraft(e.target.value)}
                  onBlur={() => {
                    const next = Math.max(8, Math.min(160, Math.round(Number(sizeDraft) || size)));
                    updateNodes(ids, { fontSize: next } as Partial<DesignNode>, true);
                    setEditingSize(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const next = Math.max(8, Math.min(160, Math.round(Number(sizeDraft) || size)));
                      updateNodes(ids, { fontSize: next } as Partial<DesignNode>, true);
                      setEditingSize(false);
                    } else if (e.key === "Escape") {
                      setEditingSize(false);
                    }
                  }}
                />
              )}
              <span className="text-ink-faint">/</span>
              {!editingWeight ? (
                <button
                  type="button"
                  className="rounded-[3px] bg-surface-alt px-1 py-px tracking-wide text-ink-faint hover:bg-phosphor/15 hover:text-phosphor"
                  title="Click to edit weight"
                  onClick={() => {
                    setWeightDraft(String(Math.round(weight)));
                    setEditingWeight(true);
                  }}
                >
                  {Math.round(weight)}
                </button>
              ) : (
                <input
                  type="number"
                  min={100}
                  max={900}
                  step={100}
                  value={weightDraft}
                  autoFocus
                  aria-label="Type weight"
                  className="h-4 w-9 rounded-[3px] border border-phosphor bg-surface px-0.5 text-ink"
                  onChange={(e) => setWeightDraft(e.target.value)}
                  onBlur={() => {
                    const next = Math.max(100, Math.min(900, Math.round(Number(weightDraft) || weight)));
                    updateNodes(ids, { fontWeight: next } as Partial<DesignNode>, true);
                    setEditingWeight(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const next = Math.max(100, Math.min(900, Math.round(Number(weightDraft) || weight)));
                      updateNodes(ids, { fontWeight: next } as Partial<DesignNode>, true);
                      setEditingWeight(false);
                    } else if (e.key === "Escape") {
                      setEditingWeight(false);
                    }
                  }}
                />
              )}
              <span className="text-ink-faint">/</span>
              {!editingTrack ? (
                <button
                  type="button"
                  className="rounded-[3px] bg-surface-alt px-1 py-px tracking-wide text-ink-faint hover:bg-phosphor/15 hover:text-phosphor"
                  title="Click to edit tracking"
                  onClick={() => {
                    setTrackDraft(String(tracking));
                    setEditingTrack(true);
                  }}
                >
                  {tracking}
                </button>
              ) : (
                <input
                  type="number"
                  min={-8}
                  max={40}
                  step={0.25}
                  value={trackDraft}
                  autoFocus
                  aria-label="Type tracking"
                  className="h-4 w-9 rounded-[3px] border border-phosphor bg-surface px-0.5 text-ink"
                  onChange={(e) => setTrackDraft(e.target.value)}
                  onBlur={() => {
                    const next = Math.max(-8, Math.min(40, Number(trackDraft) || tracking));
                    updateNodes(ids, { letterSpacing: next } as Partial<DesignNode>, true);
                    setEditingTrack(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const next = Math.max(-8, Math.min(40, Number(trackDraft) || tracking));
                      updateNodes(ids, { letterSpacing: next } as Partial<DesignNode>, true);
                      setEditingTrack(false);
                    } else if (e.key === "Escape") {
                      setEditingTrack(false);
                    }
                  }}
                />
              )}
              <span className="text-ink-faint">/</span>
              {!editingLead ? (
                <button
                  type="button"
                  className="rounded-[3px] bg-surface-alt px-1 py-px tracking-wide text-ink-faint hover:bg-phosphor/15 hover:text-phosphor"
                  title="Click to edit leading"
                  onClick={() => {
                    setLeadDraft(leading.toFixed(2));
                    setEditingLead(true);
                  }}
                >
                  {leading.toFixed(2)}
                </button>
              ) : (
                <input
                  type="number"
                  min={0.7}
                  max={2}
                  step={0.02}
                  value={leadDraft}
                  autoFocus
                  aria-label="Type leading"
                  className="h-4 w-9 rounded-[3px] border border-phosphor bg-surface px-0.5 text-ink"
                  onChange={(e) => setLeadDraft(e.target.value)}
                  onBlur={() => {
                    const next = Math.max(0.7, Math.min(2, Number(leadDraft) || leading));
                    updateNodes(ids, { lineHeight: next } as Partial<DesignNode>, true);
                    setEditingLead(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const next = Math.max(0.7, Math.min(2, Number(leadDraft) || leading));
                      updateNodes(ids, { lineHeight: next } as Partial<DesignNode>, true);
                      setEditingLead(false);
                    } else if (e.key === "Escape") {
                      setEditingLead(false);
                    }
                  }}
                />
              )}
              <span className="mx-0.5 text-ink-faint">·</span>
              {!editingFamily ? (
                <button
                  type="button"
                  className="max-w-[3.8rem] truncate rounded-[3px] bg-surface-alt px-1 py-px tracking-wide text-ink-faint hover:bg-phosphor/15 hover:text-phosphor"
                  title={`Click to change font family · ${family}`}
                  onClick={() => setEditingFamily(true)}
                >
                  {family.split(" ")[0] || family}
                </button>
              ) : (
                <select
                  className="h-4 max-w-[5.5rem] rounded-[3px] border border-phosphor bg-surface px-0.5 text-ink"
                  value={family}
                  autoFocus
                  aria-label="Type family"
                  onChange={(e) => {
                    updateNodes(ids, { fontFamily: e.target.value } as Partial<DesignNode>, true);
                    setEditingFamily(false);
                  }}
                  onBlur={() => setEditingFamily(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setEditingFamily(false);
                  }}
                >
                  {CANVAS_FONTS.map((f) => (
                    <option key={f.id} value={f.family}>{f.family}</option>
                  ))}
                </select>
              )}
            </>
          )}
        </div>
      </div>
      <div className="mb-1.5 flex items-center gap-2">
        <span className="w-10 shrink-0 font-mono text-[9px] text-ink-faint">Size</span>
        <input
          type="range"
          className="range-phosphor min-w-0 flex-1"
          min={8}
          max={160}
          step={1}
          value={size}
          aria-label="Type size"
          data-type-range="size"
          style={{ "--fill-percent": String(Math.max(0, Math.min(1, (size - 8) / (160 - 8)))) } as CSSProperties}
          onChange={(e) => {
            const next = Number(e.target.value);
            useDesign.getState().setTypeGhost({ fontSize: next });
            updateNodes(ids, { fontSize: next } as Partial<DesignNode>);
          }}
          onPointerUp={clearGhost}
          onKeyUp={clearGhost}
          onBlur={clearGhost}
          onKeyDown={(e) => {
            const next = nextFromRangeKey(e, size, 8, 160, 1);
            if (next != null) {
              useDesign.getState().setTypeGhost({ fontSize: next });
              updateNodes(ids, { fontSize: next } as Partial<DesignNode>);
            }
          }}
        />
        <NumField
          aria-label="Type size"
          mixed={sizeMixed}
          value={Math.round(size)}
          min={8}
          max={160}
          className="h-6 w-12 shrink-0 rounded-[6px] border border-border bg-surface-alt px-1 font-mono text-[10px] text-right text-ink"
          onCommit={(n) => {
            updateNodes(ids, { fontSize: n } as Partial<DesignNode>);
            useDesign.getState().commit();
          }}
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="w-10 shrink-0 font-mono text-[9px] text-ink-faint">Track</span>
        <input
          type="range"
          className="range-phosphor min-w-0 flex-1"
          min={-8}
          max={40}
          step={0.25}
          value={tracking}
          aria-label="Type tracking"
          data-type-range="tracking"
          style={{ "--fill-percent": String(Math.max(0, Math.min(1, (tracking - (-8)) / (40 - (-8))))) } as CSSProperties}
          onChange={(e) => {
            const next = Number(e.target.value);
            useDesign.getState().setTypeGhost({ letterSpacing: next });
            updateNodes(ids, { letterSpacing: next } as Partial<DesignNode>);
          }}
          onPointerUp={clearGhost}
          onKeyUp={clearGhost}
          onBlur={clearGhost}
          onKeyDown={(e) => {
            const next = nextFromRangeKey(e, tracking, -8, 40, 0.25);
            if (next != null) {
              useDesign.getState().setTypeGhost({ letterSpacing: next });
              updateNodes(ids, { letterSpacing: next } as Partial<DesignNode>);
            }
          }}
        />
        <NumField
          aria-label="Type tracking"
          mixed={trackMixed}
          value={tracking}
          min={-8}
          max={40}
          className="h-6 w-12 shrink-0 rounded-[6px] border border-border bg-surface-alt px-1 font-mono text-[10px] text-right text-ink"
          onCommit={(n) => {
            updateNodes(ids, { letterSpacing: n } as Partial<DesignNode>);
            useDesign.getState().commit();
          }}
        />
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="w-10 shrink-0 font-mono text-[9px] text-ink-faint">Lead</span>
        <input
          type="range"
          className="range-phosphor min-w-0 flex-1"
          min={0.7}
          max={2}
          step={0.02}
          value={leading}
          aria-label="Type leading"
          data-type-range="leading"
          style={{ "--fill-percent": String(Math.max(0, Math.min(1, (leading - 0.7) / (2 - 0.7)))) } as CSSProperties}
          onChange={(e) => {
            const next = Number(e.target.value);
            useDesign.getState().setTypeGhost({ lineHeight: next });
            updateNodes(ids, { lineHeight: next } as Partial<DesignNode>);
          }}
          onPointerUp={clearGhost}
          onKeyUp={clearGhost}
          onBlur={clearGhost}
          onKeyDown={(e) => {
            const next = nextFromRangeKey(e, leading, 0.7, 2, 0.02);
            if (next != null) {
              useDesign.getState().setTypeGhost({ lineHeight: next });
              updateNodes(ids, { lineHeight: next } as Partial<DesignNode>);
            }
          }}
        />
        <NumField
          aria-label="Type leading"
          mixed={leadMixed}
          value={Number(leading.toFixed(2))}
          min={0.7}
          max={2}
          className="h-6 w-12 shrink-0 rounded-[6px] border border-border bg-surface-alt px-1 font-mono text-[10px] text-right text-ink"
          onCommit={(n) => {
            updateNodes(ids, { lineHeight: n } as Partial<DesignNode>);
            useDesign.getState().commit();
          }}
        />
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="w-10 shrink-0 font-mono text-[9px] text-ink-faint">Weight</span>
        <input
          type="range"
          className="range-phosphor min-w-0 flex-1"
          min={100}
          max={900}
          step={100}
          value={weight}
          aria-label="Type weight"
          data-type-range="weight"
          style={{ "--fill-percent": String(Math.max(0, Math.min(1, (weight - 100) / (900 - 100)))) } as CSSProperties}
          onChange={(e) => {
            const next = Number(e.target.value);
            useDesign.getState().setTypeGhost({ fontWeight: next });
            updateNodes(ids, { fontWeight: next } as Partial<DesignNode>);
          }}
          onPointerUp={clearGhost}
          onKeyUp={clearGhost}
          onBlur={clearGhost}
          onKeyDown={(e) => {
            const next = nextFromRangeKey(e, weight, 100, 900, 100);
            if (next != null) {
              useDesign.getState().setTypeGhost({ fontWeight: next });
              updateNodes(ids, { fontWeight: next } as Partial<DesignNode>);
            }
          }}
        />
        <NumField
          aria-label="Type weight"
          mixed={weightMixed}
          value={Math.round(weight)}
          min={100}
          max={900}
          className="h-6 w-12 shrink-0 rounded-[6px] border border-border bg-surface-alt px-1 font-mono text-[10px] text-right text-ink"
          onCommit={(n) => {
            updateNodes(ids, { fontWeight: n } as Partial<DesignNode>);
            useDesign.getState().commit();
          }}
        />
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="w-10 shrink-0 font-mono text-[9px] text-ink-faint">Family</span>
        <select
          className="h-6 min-w-0 flex-1 rounded-[6px] border border-border bg-surface-alt px-1 font-mono text-[10px] text-ink"
          value={family}
          aria-label="Type family"
          onChange={(e) => {
            updateNodes(ids, { fontFamily: e.target.value } as Partial<DesignNode>, true);
          }}
        >
          {familyMixed && <option value={family}>Mixed</option>}
          {CANVAS_FONTS.map((f) => (
            <option key={f.id} value={f.family}>{f.family}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function OpacityQuickStrip() {
  const selection = useDesign((s) => s.selection);
  const doc = useDesign((s) => s.doc);
  const updateNodes = useDesign((s) => s.updateNodes);
  if (!doc || selection.length === 0) return null;
  const nodes = selection
    .map((id) => doc.nodes.find((n) => n.id === id))
    .filter((n): n is NonNullable<typeof n> => Boolean(n));
  if (nodes.length === 0) return null;
  const mixed = new Set(nodes.map((n) => Math.round(n.opacity * 100))).size > 1;
  const value = mixed ? nodes[nodes.length - 1].opacity : nodes[0].opacity;
  return (
    <div className="mt-2 rounded-[8px] border border-border bg-surface px-2 py-1.5">
      <div className="mb-1 flex items-center justify-between font-mono text-[10px] tracking-[0.14em] text-ink-faint uppercase">
        <span>Opacity</span>
        <span className={mixed ? "text-phosphor" : "text-ink-dim"}>{mixed ? "Mixed" : `${Math.round(value * 100)}%`}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          className="range-phosphor min-w-0 flex-1"
          min={0}
          max={1}
          step={0.01}
          value={value}
          aria-label="Layer opacity"
          data-opacity-range="layers"
          style={{ "--fill-opacity": String(value) } as CSSProperties}
          onChange={(e) => {
            const next = Number(e.target.value);
            updateNodes(selection, { opacity: next });
          }}
          onPointerUp={() => useDesign.getState().commit()}
        />
        <NumField
          aria-label="Layer opacity percent"
          mixed={mixed}
          value={Math.round(value * 100)}
          min={0}
          max={100}
          className="h-6 w-12 shrink-0 rounded-[6px] border border-border bg-surface-alt px-1 font-mono text-[10px] text-right text-ink"
          onCommit={(pct) => {
            const opacity = Math.max(0, Math.min(1, pct / 100));
            updateNodes(selection, { opacity });
            useDesign.getState().commit();
          }}
        />
        <span className="shrink-0 font-mono text-[9px] text-ink-faint">%</span>
        <button
          type="button"
          className="h-6 shrink-0 rounded-[6px] border border-border px-1.5 font-mono text-[9px] tracking-wide text-ink-dim hover:border-phosphor hover:text-ink"
          title="Set opacity to 100% · Alt+Shift+0 · Alt+Arrow 1% steps"
          onClick={() => {
            updateNodes(selection, { opacity: 1 });
            useDesign.getState().commit();
          }}
        >
          100%
        </button>
      </div>
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
