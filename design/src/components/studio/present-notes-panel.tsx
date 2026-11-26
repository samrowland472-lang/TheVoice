import {
  clampCaret,
  readCaretMap,
  readLastNotesEdit,
  readNotesHeight,
  speakingTimeLabel,
  writeCaretMap,
  writeLastNotesEdit,
  writeNotesHeight,
  type LastNotesEdit,
} from "@/lib/design/present-notes-pref";
import { PresentNotesJump } from "./present-notes-jump";
import { useCallback, useEffect, useRef, useState, type PointerEvent, type RefObject } from "react";

export function persistNotesCaret(pageId: string, el: HTMLTextAreaElement | null) {
  if (!el) return;
  const map = readCaretMap();
  map[pageId] = { start: el.selectionStart, end: el.selectionEnd };
  writeCaretMap(map);
}

export function restoreNotesCaret(pageId: string, textLen: number, el: HTMLTextAreaElement | null) {
  if (!el) return;
  const { start, end } = clampCaret(readCaretMap()[pageId], textLen);
  try {
    el.setSelectionRange(start, end);
  } catch {
    /* not focused yet */
  }
}

/** Jump lands on a new frame while the drawer already has focus — restore without a second focus tick. */
export function restoreCaretIfFocused(pageId: string, textLen: number, el: HTMLTextAreaElement | null) {
  if (!el) return false;
  if (typeof document !== "undefined" && document.activeElement !== el) return false;
  restoreNotesCaret(pageId, textLen, el);
  return true;
}

export function PresentNotesPanel(props: {
  open: boolean;
  liveId: string;
  liveName: string;
  notes: string;
  pageIds: string[];
  notesRef: RefObject<HTMLTextAreaElement | null>;
  onChange: (value: string) => void;
  onJump: (id: string) => void;
}) {
  const [height, setHeight] = useState(() => readNotesHeight());
  const dragRef = useRef<{ startY: number; startH: number; currentH?: number } | null>(null);

  useEffect(() => {
    restoreCaretIfFocused(props.liveId, props.notes.length, props.notesRef.current);
  }, [props.liveId, props.notes, props.notesRef]);

  const onPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragRef.current = { startY: e.clientY, startH: height };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [height]);

  const onPointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    // Dragging up increases height (drawer grows from bottom)
    const next = drag.startH + (drag.startY - e.clientY);
    const clamped = Math.min(420, Math.max(120, next));
    setHeight(clamped);
    drag.currentH = clamped;
  }, []);

  const onPointerUp = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const finalH = drag.currentH ?? height;
    dragRef.current = null;
    writeNotesHeight(finalH);
    setHeight(finalH);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  }, [height]);

  if (!props.open) return null;
  const last: LastNotesEdit | null = readLastNotesEdit();
  const text = props.notes;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const speak = speakingTimeLabel(words);

  return (
    <div
      className="relative flex shrink-0 flex-col border-t border-border bg-ground px-3 py-2"
      style={{ height }}
    >
      <div
        className="absolute left-0 right-0 -mt-1.5 h-2 cursor-ns-resize touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize speaker notes"
        title="Drag to resize notes"
      >
        <div className="mx-auto h-0.5 w-10 rounded-full bg-phosphor/40" />
      </div>
      <div className="mb-1 flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wide text-ink-dim">Speaker notes</span>
        <PresentNotesJump
          last={last}
          liveId={props.liveId}
          pageIds={props.pageIds}
          onJump={(id) => {
            persistNotesCaret(props.liveId, props.notesRef.current);
            props.onJump(id);
          }}
          fallback={props.liveName}
        />
        <span className="ml-auto font-mono text-[10px] text-ink-faint">
          {words}w · {chars}c{speak ? ` · ${speak}` : ""}
        </span>
      </div>
      <textarea
        ref={props.notesRef}
        className="min-h-0 flex-1 resize-none bg-transparent font-mono text-sm text-ink outline-none placeholder:text-ink-faint"
        value={props.notes}
        placeholder="Speaker notes for this frame…"
        aria-label="Speaker notes"
        onChange={(e) => {
          props.onChange(e.target.value);
          writeLastNotesEdit({ pageId: props.liveId, name: props.liveName, at: Date.now() });
          persistNotesCaret(props.liveId, e.currentTarget);
        }}
        onSelect={(e) => persistNotesCaret(props.liveId, e.currentTarget)}
        onFocus={(e) => restoreNotesCaret(props.liveId, e.currentTarget.value.length, e.currentTarget)}
      />
    </div>
  );
}
