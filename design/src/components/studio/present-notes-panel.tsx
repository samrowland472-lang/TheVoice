import {
  clampCaret,
  readCaretMap,
  readLastNotesEdit,
  writeCaretMap,
  writeLastNotesEdit,
  type LastNotesEdit,
} from "@/lib/design/present-notes-pref";
import { PresentNotesJump } from "./present-notes-jump";
import type { RefObject } from "react";

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
  if (!props.open) return null;
  const last: LastNotesEdit | null = readLastNotesEdit();
  return (
    <div className="flex h-40 shrink-0 flex-col border-t border-border bg-ground px-3 py-2">
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
      </div>
      <textarea
        ref={props.notesRef}
        className="min-h-0 flex-1 resize-none bg-transparent font-mono text-sm text-ink outline-none"
        value={props.notes}
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
