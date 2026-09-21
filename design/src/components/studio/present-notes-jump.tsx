import { cn } from "@/lib/utils";
import type { LastNotesEdit } from "@/lib/design/present-notes-pref";

export function PresentNotesJump(props: {
  last: LastNotesEdit | null;
  liveId: string;
  pageIds: string[];
  onJump: (id: string) => void;
  fallback: string;
}) {
  const show = Boolean(props.last && props.last.pageId !== props.liveId && props.pageIds.includes(props.last.pageId));
  if (!show || !props.last) {
    return <span className="font-mono text-[10px] text-ink-faint">{props.fallback}</span>;
  }
  return (
    <button
      type="button"
      className={cn(
        "font-mono text-[10px] uppercase tracking-wide text-ink-dim hover:text-phosphor",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-phosphor",
      )}
      onClick={() => onJump(props.last!.pageId)}
      title="Open the frame whose notes you last edited"
    >
      Jump to last · {props.last.name}
    </button>
  );
}
