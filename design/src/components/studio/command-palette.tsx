import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface CommandItem {
  id: string;
  label: string;
  group: string;
  hint?: string;
  run: () => void;
}

interface ShortcutItem {
  keys: string;
  label: string;
}

const SHORTCUT_GROUPS: { group: string; items: ShortcutItem[] }[] = [
  {
    group: "Tools",
    items: [
      { keys: "V", label: "Select" },
      { keys: "H", label: "Hand" },
      { keys: "R", label: "Rectangle" },
      { keys: "O", label: "Ellipse" },
      { keys: "L", label: "Line" },
      { keys: "G", label: "Polygon" },
      { keys: "S", label: "Star" },
      { keys: "A", label: "Arrow" },
      { keys: "T", label: "Text" },
      { keys: "P", label: "Pen" },
      { keys: "K", label: "Knife" },
      { keys: "B", label: "Brush" },
      { keys: "E", label: "Eraser" },
      { keys: "M", label: "Image" },
      { keys: "I", label: "Eyedropper" },
      { keys: "F", label: "Frame" },
    ],
  },
  {
    group: "Edit",
    items: [
      { keys: "Cmd+Z", label: "Undo" },
      { keys: "Cmd+Shift+Z", label: "Redo" },
      { keys: "Cmd+S", label: "Save" },
      { keys: "Cmd+D", label: "Duplicate" },
      { keys: "Cmd+Shift+D", label: "Duplicate linked" },
      { keys: "Cmd+A", label: "Select all" },
      { keys: "Cmd+C", label: "Copy" },
      { keys: "Cmd+X", label: "Cut" },
      { keys: "Cmd+V", label: "Paste" },
      { keys: "Cmd+Shift+C", label: "Copy opacity" },
      { keys: "Cmd+Shift+V", label: "Paste opacity" },
      { keys: "Cmd+Alt+C", label: "Copy style" },
      { keys: "Cmd+Alt+V", label: "Paste style" },
      { keys: "Delete", label: "Delete selection" },
    ],
  },
  {
    group: "View",
    items: [
      { keys: "0", label: "Fit artboard" },
      { keys: "Shift+0", label: "Fit selection" },
      { keys: "1", label: "Zoom to 100%" },
      { keys: "2", label: "Zoom to 200%" },
      { keys: "+", label: "Zoom in" },
      { keys: "−", label: "Zoom out" },
      { keys: "Shift+P", label: "Present" },
      { keys: "Cmd+K / ?", label: "Command palette" },
    ],
  },
  {
    group: "Path",
    items: [
      { keys: "Enter", label: "Finish pen path" },
      { keys: "Alt", label: "Corner pen point (hold)" },
      { keys: "[", label: "Send backward" },
      { keys: "]", label: "Bring forward" },
      { keys: "Shift+S", label: "Smooth path" },
    ],
  },
  {
    group: "Nudge",
    items: [
      { keys: "Arrows", label: "Nudge 1px" },
      { keys: "Shift+Arrows", label: "Nudge 10px" },
      { keys: "Alt+Arrows", label: "Nudge 0.5px" },
    ],
  },
];

export function CommandPalette({
  open,
  onClose,
  commands,
  placeholder = "Search tools, actions, templates…",
}: {
  open: boolean;
  onClose: () => void;
  commands: CommandItem[];
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const [mode, setMode] = useState<"commands" | "shortcuts">("commands");
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return commands;
    return commands.filter((c) => `${c.group} ${c.label} ${c.hint ?? ""}`.toLowerCase().includes(s));
  }, [commands, q]);

  const filteredShortcuts = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return SHORTCUT_GROUPS;
    return SHORTCUT_GROUPS.map((g) => ({
      group: g.group,
      items: g.items.filter((item) => `${g.group} ${item.label} ${item.keys}`.toLowerCase().includes(s)),
    })).filter((g) => g.items.length > 0);
  }, [q]);

  useEffect(() => {
    if (open) {
      setQ("");
      setI(0);
      setMode("commands");
      const t = window.setTimeout(() => inputRef.current?.focus(), 20);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    setI(0);
  }, [q, mode]);

  if (!open) return null;
  const active = filtered[i];

  function run(cmd?: CommandItem) {
    if (!cmd) return;
    onClose();
    cmd.run();
  }

  const groups = [...new Set(filtered.map((c) => c.group))];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ground/70 px-3 pt-[12vh] backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-label="Command palette"
        className="w-full max-w-lg overflow-hidden rounded-[20px] border border-border bg-surface shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      >
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={mode === "shortcuts" ? "Filter shortcuts…" : placeholder}
          className="h-12 w-full border-b border-border bg-transparent px-4 text-sm text-ink outline-none placeholder:text-ink-faint"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              if (mode === "shortcuts") {
                setMode("commands");
                setQ("");
              } else {
                onClose();
              }
            } else if (mode === "commands") {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setI((n) => Math.min(filtered.length - 1, n + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setI((n) => Math.max(0, n - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                run(active);
              }
            }
          }}
        />
        <div className="max-h-[min(52vh,420px)] overflow-auto py-2 scrollbar-thin">
          {mode === "commands" ? (
            <>
              {groups.map((g) => (
                <div key={g} className="px-2 pb-2">
                  <div className="px-2 py-1 font-mono text-[10px] tracking-[0.18em] text-ink-faint uppercase">{g}</div>
                  {filtered
                    .filter((c) => c.group === g)
                    .map((c) => {
                      const idx = filtered.indexOf(c);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onMouseEnter={() => setI(idx)}
                          onClick={() => run(c)}
                          className={cn(
                            "flex h-9 w-full items-center justify-between rounded-[10px] px-3 text-left text-sm",
                            idx === i ? "bg-phosphor/10 text-ink" : "text-ink-dim hover:bg-surface-alt hover:text-ink",
                          )}
                        >
                          <span>{c.label}</span>
                          {c.hint && <span className="font-mono text-[10px] text-ink-faint">{c.hint}</span>}
                        </button>
                      );
                    })}
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-ink-faint">Nothing matches.</p>
              )}
            </>
          ) : (
            <>
              {filteredShortcuts.map((g) => (
                <div key={g.group} className="px-2 pb-2">
                  <div className="px-2 py-1 font-mono text-[10px] tracking-[0.18em] text-ink-faint uppercase">{g.group}</div>
                  {g.items.map((item) => (
                    <div
                      key={item.keys + item.label}
                      className="flex h-9 w-full items-center justify-between rounded-[10px] px-3 text-sm text-ink-dim"
                    >
                      <span>{item.label}</span>
                      <span className="font-mono text-[10px] text-phosphor">{item.keys}</span>
                    </div>
                  ))}
                </div>
              ))}
              {filteredShortcuts.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-ink-faint">No matching shortcuts.</p>
              )}
            </>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-2 font-mono text-[10px] text-ink-faint uppercase">
          <span>
            {mode === "commands" ? "↑↓ Move · Enter run" : "Filter above"}
          </span>
          <div className="flex gap-3">
            {mode === "commands" ? (
              <button
                type="button"
                onClick={() => {
                  setMode("shortcuts");
                  setQ("");
                  inputRef.current?.focus();
                }}
                className="text-phosphor hover:text-ink"
              >
                Shortcuts
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMode("commands");
                  setQ("");
                  inputRef.current?.focus();
                }}
                className="text-phosphor hover:text-ink"
              >
                Back
              </button>
            )}
            <span>Esc close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
