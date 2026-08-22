import { useEffect } from "react";

export interface MenuItem {
  id: string;
  label: string;
  hint?: string;
  danger?: boolean;
  run: () => void;
}

export function CanvasMenu({
  x,
  y,
  items,
  onClose,
}: {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}) {
  useEffect(() => {
    const close = () => onClose();
    window.addEventListener("mousedown", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [onClose]);

  const left = Math.min(x, window.innerWidth - 220);
  const top = Math.min(y, window.innerHeight - items.length * 36 - 16);

  return (
    <ul
      role="menu"
      className="fixed z-50 min-w-[200px] overflow-hidden rounded-[12px] border border-border bg-surface py-1 shadow-[0_16px_48px_rgba(0,0,0,0.45)]"
      style={{ left, top }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            role="menuitem"
            className={`flex h-9 w-full items-center justify-between px-3 text-left text-sm ${
              item.danger ? "text-alert hover:bg-alert/10" : "text-ink hover:bg-surface-alt"
            }`}
            onClick={() => {
              onClose();
              item.run();
            }}
          >
            <span>{item.label}</span>
            {item.hint && <span className="font-mono text-[10px] text-ink-faint">{item.hint}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}
