import { Link, useRouterState } from "@tanstack/react-router";
import { Layers, Palette, SwatchBook } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const inStudio = pathname.startsWith("/studio");

  return (
    <div className="flex h-dvh overflow-hidden bg-ground text-ink">
      {!inStudio && (
        <aside className="hidden w-[220px] shrink-0 flex-col border-r border-border bg-surface/60 md:flex">
          <Link to="/" className="flex items-center gap-2 px-5 py-5">
            <span className="size-2.5 rounded-full bg-phosphor shadow-[0_0_12px_var(--color-phosphor)]" />
            <span className="text-sm font-semibold tracking-[0.18em] uppercase">The Voice</span>
          </Link>
          <nav className="flex flex-1 flex-col gap-0.5 px-3" aria-label="Sections">
            <NavItem active={!inStudio} to="/" icon={Layers} label="Design" />
            <a
              href="/#brand"
              className="flex h-11 items-center gap-3 rounded-[12px] px-3 text-sm text-ink-dim transition-colors duration-150 hover:bg-surface-alt hover:text-ink"
            >
              <SwatchBook className="size-4" strokeWidth={1.75} />
              Brand
            </a>
          </nav>
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] text-ink-faint uppercase">
              <span className="size-1.5 rounded-full bg-phosphor" />
              Loop live
            </div>
          </div>
        </aside>
      )}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

function NavItem({
  to,
  icon: Icon,
  label,
  active,
}: {
  to: string;
  icon: typeof Palette;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex h-11 items-center gap-3 rounded-[12px] px-3 text-sm transition-colors duration-150",
        active ? "bg-phosphor/10 text-phosphor" : "text-ink-dim hover:bg-surface-alt hover:text-ink",
      )}
    >
      <Icon className="size-4" strokeWidth={1.75} />
      {label}
    </Link>
  );
}
