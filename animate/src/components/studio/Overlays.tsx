import { useStudio } from "@/lib/studio/store";

export function Welcome() {
  const open = useStudio((s) => s.welcomeOpen);
  if (!open) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-end justify-start p-3 sm:items-start sm:p-5">
      <div className="pointer-events-auto w-[min(100%,380px)] rounded-lg border border-border bg-surface-2 p-4 shadow-panel">
        <p className="font-display text-lg font-semibold tracking-tight text-fg">The Voice</p>
        <p className="mt-2 text-pretty text-sm leading-relaxed text-muted">
          Pose with W E R, key with S, play with Space. J K L shuttle. Shift-click or Q-drag to
          multi-select. Graph: double-click to insert a key, drag bezier handles. Nested Cycles is
          walking — periods that never quite line up.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="h-9 rounded-md bg-fg px-3 text-sm font-medium text-bg"
            onClick={() => useStudio.getState().setWelcomeOpen(false)}
          >
            Start animating
          </button>
          <button
            type="button"
            className="h-9 rounded-md px-3 text-sm text-muted hover:text-fg"
            onClick={() => {
              useStudio.getState().setWelcomeOpen(false);
              useStudio.getState().setHelpOpen(true);
            }}
          >
            Shortcuts
          </button>
        </div>
      </div>
    </div>
  );
}

export function HelpOverlay() {
  const open = useStudio((s) => s.helpOpen);
  if (!open) return null;
  const rows = [
    ["Space", "Play / pause"],
    ["J K L", "Reverse / pause / forward (tap to speed)"],
    [", .  or arrows", "Step one frame"],
    ["I / O", "Set in / out. Shift jumps there"],
    ["Q W E R", "Select / Move / Rotate / Scale"],
    ["Shift-click", "Add objects or keys to the selection"],
    ["Q-drag / dope-drag", "Box-select objects (viewport) or keys (timeline)"],
    ["X", "World / local gizmo"],
    ["N", "Onion skin"],
    ["S", "Keyframe selected transform"],
    ["⌘C / ⌘V", "Copy / paste pose"],
    ["F", "Frame playback range"],
    ["Delete", "Delete object or key"],
    ["⌘Z / ⌘⇧Z", "Undo / Redo"],
    ["⌘D", "Duplicate"],
    ["⌘A", "Select all"],
    ["⌘K", "Command palette"],
    ["1–4", "Wire / Solid / Material / Rendered"],
    ["Scroll timeline", "Zoom time. Over labels: scroll tracks"],
    ["Curves", "Double-click or ⌘-click inserts a key. Drag handles; Alt breaks"],
  ];
  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-bg/70 p-4"
      onClick={() => useStudio.getState().setHelpOpen(false)}
    >
      <div
        className="w-[min(100%,440px)] rounded-lg border border-border bg-surface p-5 shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-display text-lg font-semibold text-fg">Shortcuts</p>
        <ul className="mt-3 max-h-[50vh] space-y-1.5 overflow-y-auto">
          {rows.map(([k, v]) => (
            <li key={k} className="flex items-baseline justify-between gap-4 text-sm">
              <span className="font-mono text-xs text-accent">{k}</span>
              <span className="text-muted">{v}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-4 h-9 w-full rounded-md bg-fg text-sm font-medium text-bg"
          onClick={() => useStudio.getState().setHelpOpen(false)}
        >
          Close
        </button>
      </div>
    </div>
  );
}
