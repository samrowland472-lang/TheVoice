import { useState } from "react";
import { cancelPlayblast, runPlayblast, type PlayblastFormat, type PlayblastRange, type PlayblastSize } from "@/lib/studio/playblast";
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
    ["File → Import glTF", "Bring a .glb into the stage (fits to view)"],
    ["Create → IK Handle", "Two-bone IK on two selected joints (or toggle on a limb)"],
    ["File → Playblast", "WebM movie or PNG sequence of the I/O range"],
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

export function PlayblastDialog() {
  const open = useStudio((s) => s.playblastOpen);
  const blasting = useStudio((s) => s.playblasting);
  const hasCamera = useStudio((s) => Object.values(s.nodes).some((n) => n.kind === "camera"));
  const [format, setFormat] = useState<PlayblastFormat>("webm");
  const [size, setSize] = useState<PlayblastSize>("viewport");
  const [range, setRange] = useState<PlayblastRange>("playback");
  const [shotCamera, setShotCamera] = useState(false);
  const [hideGrid, setHideGrid] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const close = () => {
    if (blasting) return;
    useStudio.getState().setPlayblastOpen(false);
  };

  const run = async () => {
    setError(null);
    setBusy(true);
    try {
      await runPlayblast({ format, size, range, shotCamera: shotCamera && hasCamera, hideGrid });
      useStudio.getState().setPlayblastOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Playblast failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-bg/70 p-4" onClick={close}>
      <div
        className="w-[min(100%,400px)] rounded-lg border border-border bg-surface p-5 shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-display text-lg font-semibold text-fg">Playblast</p>
        <p className="mt-1 text-sm text-muted">
          Capture the viewport, frame-accurate across the work range. Gizmos stay off.
        </p>
        <label className="mt-4 block text-2xs font-medium uppercase tracking-wider text-subtle">
          Format
        </label>
        <div className="mt-1 flex gap-1">
          {(
            [
              ["webm", "WebM movie"],
              ["png", "PNG sequence (zip)"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`h-8 rounded-sm px-2 text-xs ${
                format === id ? "bg-surface-2 text-fg" : "text-muted hover:text-fg"
              }`}
              onClick={() => setFormat(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="mt-3 block text-2xs font-medium uppercase tracking-wider text-subtle">
          Size
        </label>
        <div className="mt-1 flex gap-1">
          {(
            [
              ["viewport", "Viewport"],
              ["720", "1280×720"],
              ["1080", "1920×1080"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`h-8 rounded-sm px-2 text-xs ${
                size === id ? "bg-surface-2 text-fg" : "text-muted hover:text-fg"
              }`}
              onClick={() => setSize(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="mt-3 block text-2xs font-medium uppercase tracking-wider text-subtle">
          Range
        </label>
        <div className="mt-1 flex gap-1">
          {(
            [
              ["playback", "In–out"],
              ["full", "Full duration"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`h-8 rounded-sm px-2 text-xs ${
                range === id ? "bg-surface-2 text-fg" : "text-muted hover:text-fg"
              }`}
              onClick={() => setRange(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="mt-3 flex h-8 items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={hideGrid}
            onChange={(e) => setHideGrid(e.target.checked)}
          />
          Hide grid
        </label>
        {hasCamera ? (
          <label className="flex h-8 items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={shotCamera}
              onChange={(e) => setShotCamera(e.target.checked)}
            />
            Look through shot camera
          </label>
        ) : null}
        {error ? <p className="mt-2 text-xs text-key">{error}</p> : null}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="h-9 flex-1 rounded-md bg-fg text-sm font-medium text-bg disabled:opacity-50"
            disabled={busy || blasting}
            onClick={() => void run()}
          >
            {busy ? "Capturing…" : "Playblast"}
          </button>
          <button
            type="button"
            className="h-9 rounded-md px-3 text-sm text-muted hover:text-fg"
            onClick={close}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function PlayblastProgress() {
  const blasting = useStudio((s) => s.playblasting);
  const frame = useStudio((s) => s.playblastFrame);
  const total = useStudio((s) => s.playblastTotal);
  if (!blasting) return null;
  const pct = total > 0 ? Math.round((frame / total) * 100) : 0;
  return (
    <div className="pointer-events-auto absolute bottom-3 left-3 z-30 w-[min(100%-24px,280px)] rounded-md border border-border bg-surface-2 p-3 shadow-panel">
      <p className="text-xs font-medium text-fg">Playblast {frame} / {total}</p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface">
        <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
      <button
        type="button"
        className="mt-2 text-2xs text-muted hover:text-fg"
        onClick={() => cancelPlayblast()}
      >
        Cancel (Esc)
      </button>
    </div>
  );
}
