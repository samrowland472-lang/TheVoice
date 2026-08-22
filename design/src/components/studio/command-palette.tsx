import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface CommandItem {
  id: string;
  label: string;
  group: string;
  hint?: string;
  run: () => void;
}

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
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return commands;
    return commands.filter((c) => `${c.group} ${c.label} ${c.hint ?? ""}`.toLowerCase().includes(s));
  }, [commands, q]);

  useEffect(() => {
    if (open) {
      setQ("");
      setI(0);
      const t = window.setTimeout(() => inputRef.current?.focus(), 20);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    setI(0);
  }, [q]);

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
          placeholder={placeholder}
          className="h-12 w-full border-b border-border bg-transparent px-4 text-sm text-ink outline-none placeholder:text-ink-faint"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              onClose();
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              setI((n) => Math.min(filtered.length - 1, n + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setI((n) => Math.max(0, n - 1));
            } else if (e.key === "Enter") {
              e.preventDefault();
              run(active);
            }
          }}
        />
        <div className="max-h-[min(52vh,420px)] overflow-auto py-2 scrollbar-thin">
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
        </div>
        <div className="flex justify-between border-t border-border px-4 py-2 font-mono text-[10px] text-ink-faint uppercase">
          <span>↑↓ Move · Enter run</span>
          <span>Esc close</span>
        </div>
      </div>
    </div>
  );
}
