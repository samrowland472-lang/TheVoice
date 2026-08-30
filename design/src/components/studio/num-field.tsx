import { useEffect, useState } from "react";

function formatNum(n: number) {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

export function NumField({
  value,
  mixed = false,
  onCommit,
  min,
  max,
  className = "field font-mono",
  "aria-label": ariaLabel = "numeric",
}: {
  value: number;
  mixed?: boolean;
  onCommit: (n: number) => void;
  min?: number;
  max?: number;
  className?: string;
  "aria-label"?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(mixed ? "" : formatNum(value));

  useEffect(() => {
    if (!focused) setDraft(mixed ? "" : formatNum(value));
  }, [value, mixed, focused]);

  function commit(raw: string) {
    if (raw.trim() === "") {
      setDraft(mixed ? "" : formatNum(value));
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      setDraft(mixed ? "" : formatNum(value));
      return;
    }
    let next = n;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    setDraft(formatNum(next));
    onCommit(next);
  }

  return (
    <input
      className={className}
      type="text"
      inputMode="decimal"
      value={draft}
      placeholder={mixed && !focused ? "\u2014" : undefined}
      aria-label={mixed ? `${ariaLabel} mixed` : ariaLabel}
      onFocus={(e) => {
        setFocused(true);
        e.currentTarget.select();
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={(e) => {
        setFocused(false);
        commit(e.target.value);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit(draft);
          e.currentTarget.blur();
        }
        if (e.key === "Escape") {
          setDraft(mixed ? "" : formatNum(value));
          e.currentTarget.blur();
        }
      }}
    />
  );
}
