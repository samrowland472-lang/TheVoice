import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { campaignPages } from "@/lib/design/campaign";
import {
  exitPresentFullscreen,
  presentRootIsFullscreen,
  togglePresentFullscreen,
} from "@/lib/design/present-fullscreen";
import {
  PRESENT_IDLE_MS,
  isQuietPresentNavKey,
  shouldHidePresentChrome,
  shouldShowPresentPeek,
} from "@/lib/design/present-idle";
import { screenToDoc } from "@/lib/design/render";
import { useDesign } from "@/lib/design/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CanvasStage } from "./canvas-stage";
import { PresentChipRail } from "./present-chip-menu";
import { PresentNotesJump } from "./present-notes-jump";

const NOTES_PREF = "voice-design-present-notes";

function readNotesPref(): boolean {
  try {
    const raw = localStorage.getItem(NOTES_PREF);
    if (raw === "0") return false;
    if (raw === "1") return true;
  } catch {
    /* blocked */
  }
  return false;
}

function writeNotesPref(open: boolean) {
  try {
    localStorage.setItem(NOTES_PREF, open ? "1" : "0");
  } catch {
    /* blocked */
  }
}

export function PresentView() {
  const navigate = useNavigate();
  const doc = useDesign((s) => s.doc);
  const index = useDesign((s) => s.index);
  const save = useDesign((s) => s.save);
  const setPresent = useDesign((s) => s.setPresent);
  const setNotes = useDesign((s) => s.setNotes);
  const [hot, setHot] = useState<{
    label: string;
    x: number;
    y: number;
    w: number;
    h: number;
    rotation: number;
  } | null>(null);
  const [notesOpen, setNotesOpen] = useState(readNotesPref);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(false);
  const [idle, setIdle] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [peekIndexHover, setPeekIndexHover] = useState(false);
  const [shiftHeld, setShiftHeld] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewport = useDesign((s) => s.viewport);

  const bumpIdle = useCallback(() => {
    setIdle(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), PRESENT_IDLE_MS);
  }, []);

  useEffect(() => {
    bumpIdle();
    const onActivity = () => bumpIdle();
    const onKeyActivity = (e: KeyboardEvent) => {
      if (isQuietPresentNavKey(e.key)) return;
      bumpIdle();
    };
    window.addEventListener("pointermove", onActivity);
    window.addEventListener("pointerdown", onActivity);
    window.addEventListener("keydown", onKeyActivity);
    window.addEventListener("wheel", onActivity, { passive: true });
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      window.removeEventListener("pointermove", onActivity);
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onKeyActivity);
      window.removeEventListener("wheel", onActivity);
    };
  }, [bumpIdle]);
  if (!doc) return null;
  const live = doc;
  const pages = (
    live.campaignId
      ? campaignPages(index as { id: string; name?: string; formatId?: string; campaignId?: string; campaignOrder?: number }[], live.campaignId)
      : [{ id: live.id, name: live.name, formatId: live.artboard.formatId }]
  ).map((p) => ({
    id: p.id,
    name: p.name ?? live.name,
    formatId: p.formatId ?? live.artboard.formatId,
  }));
  const i = Math.max(0, pages.findIndex((p) => p.id === live.id));
  const hideChrome = shouldHidePresentChrome({ idle, notesOpen, menuOpen });
  const showPeek = shouldShowPresentPeek({ hideChrome, pageCount: pages.length });

  function goTo(id: string) {
    if (!id || id === live.id) return;
    save();
    void navigate({ to: "/studio/$id", params: { id } });
  }

  function go(delta: number) {
    const next = pages[i + delta];
    if (!next) return;
    save();
    void navigate({ to: "/studio/$id", params: { id: next.id } });
  }

  function follow(href: string) {
    if (href.startsWith("doc:")) {
      const id = href.slice(4);
      if (!id || id === live.id) return;
      save();
      void navigate({ to: "/studio/$id", params: { id } });
      return;
    }
    if (href.startsWith("https://") || href.startsWith("http://")) {
      window.open(href, "_blank", "noopener");
    }
  }

  function hotspotAt(e: MouseEvent<HTMLButtonElement>) {
    const viewport = useDesign.getState().viewport;
    const rect = e.currentTarget.getBoundingClientRect();
    const d = screenToDoc(e.clientX - rect.left, e.clientY - rect.top, viewport);
    for (let n = live.nodes.length - 1; n >= 0; n--) {
      const node = live.nodes[n]!;
      if (!node.visible || !node.href) continue;
      if (d.x >= node.x && d.x <= node.x + node.w && d.y >= node.y && d.y <= node.y + node.h) return node;
    }
    return null;
  }

  function hotspotLabel(href: string) {
    if (href.startsWith("doc:")) {
      const id = href.slice(4);
      return index.find((p) => p.id === id)?.name ?? "Frame";
    }
    try {
      return new URL(href).hostname.replace(/^www\./, "");
    } catch {
      return href;
    }
  }

  function onStageClick(e: MouseEvent<HTMLButtonElement>) {
    const node = hotspotAt(e);
    if (node?.href) {
      follow(node.href);
      return;
    }
    go(1);
  }

  function onStageMove(e: MouseEvent<HTMLButtonElement>) {
    const node = hotspotAt(e);
    const next = node?.href
      ? { label: hotspotLabel(node.href), x: node.x, y: node.y, w: node.w, h: node.h, rotation: node.rotation }
      : null;
    e.currentTarget.style.cursor = next ? "pointer" : "default";
    setHot((cur) => (cur?.label === next?.label && cur?.x === next?.x && cur?.y === next?.y ? cur : next));
  }

  function toggleNotes() {
    setNotesOpen((open) => {
      const next = !open;
      writeNotesPref(next);
      if (next) {
        requestAnimationFrame(() => notesRef.current?.focus());
      } else {
        notesRef.current?.blur();
      }
      return next;
    });
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement;
      if (e.key === "Escape") {
        e.preventDefault();
        if (typing && notesOpen) {
          toggleNotes();
          return;
        }
        if (notesOpen) {
          toggleNotes();
          return;
        }
        void exitPresentFullscreen();
        setPresent(false);
        return;
      }
      if (e.key === "Shift") {
        setShiftHeld(true);
        return;
      }
      if (typing) return;
      if (e.key.toLowerCase() === "f" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        bumpIdle();
        void togglePresentFullscreen(rootRef.current).then(() => {
          setFull(presentRootIsFullscreen(rootRef.current));
        });
        return;
      }
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        go(1);
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(-1);
      }
      if (e.key.toLowerCase() === "n" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        toggleNotes();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") setShiftHeld(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  });

  useEffect(() => {
    const sync = () => setFull(presentRootIsFullscreen(rootRef.current));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  useEffect(() => {
    return () => {
      void exitPresentFullscreen();
    };
  }, []);

  return (
    <div ref={rootRef} className="relative flex min-h-0 flex-1 flex-col bg-ground">
      <div
        className={cn(
          "flex h-12 shrink-0 items-center gap-3 border-b border-border px-3 transition-opacity duration-500",
          hideChrome ? "pointer-events-none opacity-0" : "opacity-100",
        )}
        aria-hidden={hideChrome}
      >
        <Button
          size="sm"
          onClick={() => {
            void exitPresentFullscreen();
            setPresent(false);
          }}
        >
          Exit
        </Button>
        <span className="truncate text-sm text-ink">{doc.name}</span>
        {pages.length > 1 && (
          <span className="font-mono text-[10px] text-ink-faint">
            {i + 1} / {pages.length}
          </span>
        )}
        {pages.length > 1 && (
          <div className="ml-2 flex items-center gap-1">
            <Button size="sm" variant="ghost" disabled={i <= 0} onClick={() => go(-1)}>
              Prev
            </Button>
            <PresentChipRail pages={pages} liveId={live.id} onGo={goTo} onMenuOpenChange={setMenuOpen} />
            <Button size="sm" variant="ghost" disabled={i >= pages.length - 1} onClick={() => go(1)}>
              Next
            </Button>
          </div>
        )}
        <button
          type="button"
          className={cn(
            "ml-auto font-mono text-[10px] uppercase tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-phosphor focus-visible:ring-offset-2 focus-visible:ring-offset-ground",
            full ? "text-phosphor" : "text-ink-faint hover:text-ink",
          )}
          onClick={() => {
            void togglePresentFullscreen(rootRef.current).then(() => {
              setFull(presentRootIsFullscreen(rootRef.current));
            });
          }}
          aria-pressed={full}
          aria-label={full ? "Exit fullscreen" : "Enter fullscreen"}
          title="Fullscreen present (F) — campaign rail stays"
        >
          Full {full ? "on" : "off"} · F
        </button>
        <button
          type="button"
          className={cn(
            "font-mono text-[10px] uppercase tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-phosphor focus-visible:ring-offset-2 focus-visible:ring-offset-ground",
            notesOpen ? "text-phosphor" : "text-ink-faint hover:text-ink-dim",
          )}
          onClick={toggleNotes}
          aria-pressed={notesOpen}
          aria-label={notesOpen ? "Hide speaker notes" : "Show speaker notes"}
          title="Toggle speaker notes (N)"
        >
          Notes {notesOpen ? "on" : "off"} · N
        </button>
        <span className={cn("font-mono text-[10px] uppercase", hot ? "text-phosphor" : "text-ink-faint")}>
          {hot ? hot.label : "Click or \u2192"}
        </span>
      </div>
      <div className="relative min-h-0 flex-1">
        <CanvasStage />
        {hot && (
          <div
            className="pointer-events-none absolute border border-phosphor"
            style={{
              left: hot.x * viewport.zoom + viewport.x,
              top: hot.y * viewport.zoom + viewport.y,
              width: hot.w * viewport.zoom,
              height: hot.h * viewport.zoom,
              transform: hot.rotation ? `rotate(${hot.rotation}deg)` : undefined,
              transformOrigin: "center center",
              boxShadow: "0 0 0 1px rgba(63,198,255,0.35), 0 0 12px rgba(63,198,255,0.25)",
            }}
          />
        )}
        <button
          type="button"
          className="absolute inset-0 bg-transparent"
          style={{ cursor: hot ? "pointer" : "default" }}
          aria-label={hot ? `Open ${hot.label}` : "Next frame"}
          onClick={onStageClick}
          onMouseMove={onStageMove}
          onMouseLeave={() => setHot(null)}
          onContextMenu={(e) => {
            e.preventDefault();
            go(-1);
          }}
        />
        {notesOpen && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center p-4">
            <div className="pointer-events-auto w-full max-w-3xl rounded-[12px] border border-phosphor/40 bg-ground/92 shadow-[0_0_0_1px_rgba(63,198,255,0.12),0_16px_40px_rgba(0,0,0,0.45)] backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-phosphor">Speaker notes</span>
                <PresentNotesJump
                  last={null}
                  liveId={live.id}
                  pageIds={pages.map((p) => p.id)}
                  onJump={goTo}
                  fallback={`${i + 1}/${Math.max(pages.length, 1)}`}
                />
              </div>
              <textarea
                ref={notesRef}
                className="field min-h-24 max-h-40 w-full resize-y rounded-none border-0 bg-transparent px-3 py-2 text-sm text-ink-dim placeholder:text-ink-faint"
                placeholder="Talking points for this frame — saved with the artboard"
                value={doc.notes ?? ""}
                onChange={(e) => setNotes(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleNotes();
                    return;
                  }
                  e.stopPropagation();
                }}
                aria-label="Speaker notes"
              />
            </div>
          </div>
        )}
        {showPeek && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col items-center">
            <div
              className="h-px w-full bg-phosphor/55 shadow-[0_-3px_6px_rgba(63,198,255,0.35)]"
              aria-hidden
            />
            <div
              className="pointer-events-auto mt-2 flex max-w-[min(90vw,40rem)] flex-wrap items-center justify-center gap-1.5 overflow-x-auto"
              role="navigation"
              aria-label={`Frame ${i + 1} of ${pages.length}`}
            >
              {pages.map((p, n) => (
                <button
                  key={p.id}
                  type="button"
                  className={cn(
                    "block h-2 w-2 rounded-full border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-phosphor focus-visible:ring-offset-2 focus-visible:ring-offset-ground",
                    n === i
                      ? "border-phosphor bg-phosphor shadow-[0_0_8px_rgba(63,198,255,0.7)]"
                      : "border-ink-faint/70 bg-transparent hover:border-phosphor/80",
                  )}
                  title={p.name}
                  aria-label={`Go to ${p.name}`}
                  aria-current={n === i ? "page" : undefined}
                  onMouseEnter={() => {
                    if (n === i) setPeekIndexHover(true);
                  }}
                  onMouseLeave={() => setPeekIndexHover(false)}
                  onFocus={() => {
                    if (n === i) setPeekIndexHover(true);
                  }}
                  onBlur={() => setPeekIndexHover(false)}
                  onClick={(e) => {
                    e.stopPropagation();
                    goTo(p.id);
                  }}
                />
              ))}
              {(peekIndexHover || shiftHeld) && (
                <span className="ml-1 max-w-[14rem] truncate text-[10px] font-medium tracking-wide text-ink-faint/80">
                  {i + 1}/{Math.max(pages.length, 1)}
                  {shiftHeld && pages[i + 1] ? ` \u00b7 ${pages[i + 1]!.name}` : ""}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
