import { useEffect, useState } from "react";

function formatNum(n: number) {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

export function NumField({
  value,
  onCommit,
  min,
  max,
  className = "field font-mono",
}: {
  value: number;
  onCommit: (n: number) => void;
  min?: number;
  max?: number;
  className?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(formatNum(value));

  useEffect(() => {
    if (!focused) setDraft(formatNum(value));
  }, [value, focused]);

  function commit(raw: string) {
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      setDraft(formatNum(value));
      return;
    }
    let next = n;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    setDraft(formatNum(next));
    if (next !== value) onCommit(next);
  }

  return (
    <input
      className={className}
      type="text"
      inputMode="decimal"
      value={draft}
      aria-label="numeric"
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
          setDraft(formatNum(value));
          e.currentTarget.blur();
        }
      }}
    />
  );
}
