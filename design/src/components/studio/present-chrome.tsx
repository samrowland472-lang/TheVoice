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
  isQuietPresentPeekTarget,
  peekAfterLostCapture,
  peekCaptionAfterQuietHomeEnd,
  peekCaptionAfterMutedPointerUp,
  peekCaptionAfterShiftRelease,
  peekCaptionNameId,
  peekTickAfterMutedPointerUp,
  peekTickAfterQuietHomeEnd,
  peekTickFadeShouldRestartAfterLostCapture,
  peekScrubIndex,
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
import {
  applyWindowBlur,
  peekCaptionAfterLostCaptureCurrentHover,
  peekCaptionAfterQuietEscapeAfterKeepClear,
  peekCaptionAfterQuietEscapeAfterKeepClearShiftHeld,
  peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftRelease,
  peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseWindowBlur,
  peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerCancel,
  peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseLostPointerCapture,
  peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerUp,
  peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerLeave,
  peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerOut,
  peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerEnter,
  peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerOver,
  peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerMove,
} from "@/lib/design/present-lost-capture";

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
  const [hot, setHot] = useState<{ label: string; x: number; y: number; w: number; h: number; rotation: number } | null>(null);
  const [notesOpen, setNotesOpen] = useState(readNotesPref);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(false);
  const [idle, setIdle] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [peekIndexHover, setPeekIndexHover] = useState(false);
  const [shiftHeld, setShiftHeld] = useState(false);
  const [peekNamedId, setPeekNamedId] = useState<string | null>(null);
  const [peekMuted, setPeekMuted] = useState(false);
  const [peekTickId, setPeekTickId] = useState<string | null>(null);
  const peekStripRef = useRef<HTMLDivElement>(null);
  const peekScrubbing = useRef(false);
  const mutedPointerUpKeep = useRef(false);
  const quietKeepClearShiftHeld = useRef(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewport = useDesign((s) => s.viewport);
  const bumpIdle = useCallback(() => {
    setIdle(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), PRESENT_IDLE_MS);
  }, []);
  useEffect(() => {
    bumpIdle();
    const onActivity = (e: Event) => {
      if (isQuietPresentPeekTarget(e.target)) return;
      bumpIdle();
    };
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
  ).map((p) => ({ id: p.id, name: p.name ?? live.name, formatId: p.formatId ?? live.artboard.formatId }));
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
    if (href.startsWith("https://") || href.startsWith("http://")) window.open(href, "_blank", "noopener");
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
    if (href.startsWith("doc:")) return index.find((p) => p.id === href.slice(4))?.name ?? "Frame";
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
      if (next) requestAnimationFrame(() => notesRef.current?.focus());
      else notesRef.current?.blur();
      return next;
    });
  }
  function applyLostCapture() {
    if (!peekScrubbing.current) return;
    peekScrubbing.current = false;
    const prevTick = peekTickId;
    const lost = peekAfterLostCapture({
      muted: peekMuted,
      namedId: peekNamedId,
      tickId: peekTickId,
      landedId: live.id,
    });
    setPeekMuted(lost.muted);
    setPeekNamedId(lost.namedId);
    setPeekTickId(lost.tickId);
    void peekTickFadeShouldRestartAfterLostCapture(prevTick, lost.tickId);
    void applyWindowBlur({ scrubbing: true });
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement;
      if (e.key === "Escape") {
        e.preventDefault();
        if (notesOpen) {
          toggleNotes();
          return;
        }
        const quiet = shiftHeld
          ? peekCaptionAfterQuietEscapeAfterKeepClearShiftHeld({
              key: e.key,
              muted: peekMuted,
              namedId: peekNamedId,
              mutedPointerUpKeep: mutedPointerUpKeep.current,
            })
          : peekCaptionAfterQuietEscapeAfterKeepClear({
              key: e.key,
              shiftHeld,
              muted: peekMuted,
              namedId: peekNamedId,
              mutedPointerUpKeep: mutedPointerUpKeep.current,
            });
        quietKeepClearShiftHeld.current = shiftHeld && e.key === "Escape";
        mutedPointerUpKeep.current = quiet.mutedPointerUpKeep;
        setPeekNamedId(quiet.namedId);
        setPeekMuted(quiet.muted);
        if (quiet.stayInPresent) return;
        void exitPresentFullscreen();
        setPresent(false);
        return;
      }
      if (e.key === "Shift") {
        setShiftHeld(true);
        return;
      }
      if (typing) return;
      if (e.key === "Home") {
        e.preventDefault();
        const cap = peekCaptionAfterQuietHomeEnd({
          namedId: peekNamedId,
          key: "Home",
          shiftHeld,
          muted: peekMuted,
        });
        setPeekNamedId(cap.namedId);
        setPeekMuted(cap.muted);
        setPeekTickId(peekTickAfterQuietHomeEnd({ tickId: peekTickId, key: "Home", muted: peekMuted || cap.muted }));
        if (pages[0]) goTo(pages[0].id);
        return;
      }
      if (e.key === "End") {
        e.preventDefault();
        const cap = peekCaptionAfterQuietHomeEnd({
          namedId: peekNamedId,
          key: "End",
          shiftHeld,
          muted: peekMuted,
        });
        setPeekNamedId(cap.namedId);
        setPeekMuted(cap.muted);
        setPeekTickId(peekTickAfterQuietHomeEnd({ tickId: peekTickId, key: "End", muted: peekMuted || cap.muted }));
        const last = pages[pages.length - 1];
        if (last) goTo(last.id);
        return;
      }
      if (e.key.toLowerCase() === "f" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        bumpIdle();
        void togglePresentFullscreen(rootRef.current).then(() => setFull(presentRootIsFullscreen(rootRef.current)));
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
    const applyMutedKeepClearRelease = (
      helper: typeof peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftRelease,
    ) => {
      const next = helper({
        muted: peekMuted,
        namedId: peekNamedId,
        fallbackId: pages[i + 1]?.id ?? null,
      });
      mutedPointerUpKeep.current = next.mutedPointerUpKeep;
      setPeekNamedId(next.namedId);
      setPeekMuted(next.muted);
    };
    const applyShiftRelease = () => {
      applyLostCapture();
      setShiftHeld(false);
      if (quietKeepClearShiftHeld.current) {
        applyMutedKeepClearRelease(peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftRelease);
        return;
      }
      const next = peekCaptionAfterShiftRelease({
        shiftHeld: false,
        scrubbing: peekScrubbing.current,
        namedId: peekNamedId,
        muted: peekMuted,
      });
      setPeekNamedId(next.namedId);
      setPeekMuted(next.muted);
    };
    const applyQuietKeepClearWindowBlur = () => {
      applyLostCapture();
      setShiftHeld(false);
      if (quietKeepClearShiftHeld.current) {
        applyMutedKeepClearRelease(peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseWindowBlur);
        return;
      }
      applyShiftRelease();
    };
    const applyQuietKeepClearPointerCancel = () => {
      applyLostCapture();
      if (quietKeepClearShiftHeld.current) {
        applyMutedKeepClearRelease(peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerCancel);
      }
    };
    const applyQuietKeepClearLostPointerCapture = () => {
      applyQuietKeepClearPointerCancel();
      if (quietKeepClearShiftHeld.current) {
        applyMutedKeepClearRelease(peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseLostPointerCapture);
      }
    };
    const applyQuietKeepClearPointerUp = () => {
      applyQuietKeepClearLostPointerCapture();
      if (quietKeepClearShiftHeld.current) {
        applyMutedKeepClearRelease(peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerUp);
      }
    };
    const applyQuietKeepClearPointerLeave = () => {
      applyQuietKeepClearPointerUp();
      if (quietKeepClearShiftHeld.current) {
        applyMutedKeepClearRelease(peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerLeave);
      }
    };
    const applyQuietKeepClearPointerOut = () => {
      applyQuietKeepClearPointerLeave();
      if (quietKeepClearShiftHeld.current) {
        applyMutedKeepClearRelease(peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerOut);
      }
    };
    const applyQuietKeepClearPointerEnter = () => {
      applyQuietKeepClearPointerOut();
      if (quietKeepClearShiftHeld.current) {
        applyMutedKeepClearRelease(peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerEnter);
      }
    };
    const applyQuietKeepClearPointerOver = () => {
      applyQuietKeepClearPointerEnter();
      if (quietKeepClearShiftHeld.current) {
        applyMutedKeepClearRelease(peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerOver);
      }
    };
    const applyQuietKeepClearPointerMove = () => {
      applyQuietKeepClearPointerOver();
      if (quietKeepClearShiftHeld.current) {
        applyMutedKeepClearRelease(peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerMove);
      }
    };
    const onPointerUp = () => {
      applyQuietKeepClearPointerUp();
    };
    const onPointerCancel = () => {
      applyQuietKeepClearPointerCancel();
    };
    const onPointerLeave = () => {
      applyQuietKeepClearPointerLeave();
    };
    const onPointerOut = () => {
      applyQuietKeepClearPointerOut();
    };
    const onPointerEnter = () => {
      applyQuietKeepClearPointerEnter();
    };
    const onPointerOver = () => {
      applyQuietKeepClearPointerOver();
    };
    const onPointerMove = () => {
      applyQuietKeepClearPointerMove();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") applyShiftRelease();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", applyQuietKeepClearWindowBlur);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
    window.addEventListener("lostpointercapture", applyQuietKeepClearLostPointerCapture);
    document.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("pointerout", onPointerOut);
    document.addEventListener("pointerenter", onPointerEnter);
    document.addEventListener("pointerover", onPointerOver);
    document.addEventListener("pointermove", onPointerMove);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", applyQuietKeepClearWindowBlur);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      window.removeEventListener("lostpointercapture", applyQuietKeepClearLostPointerCapture);
      document.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("pointerout", onPointerOut);
      document.removeEventListener("pointerenter", onPointerEnter);
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointermove", onPointerMove);
    };
  });
  useEffect(() => {
    const sync = () => setFull(presentRootIsFullscreen(rootRef.current));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  useEffect(() => () => void exitPresentFullscreen(), []);
  const captionId = peekCaptionNameId({
    muted: peekMuted,
    namedId: peekNamedId,
    fallbackId: pages[i + 1]?.id ?? null,
  });
  return (
    <div ref={rootRef} className="relative flex min-h-0 flex-1 flex-col bg-ground">
      <div className={cn("flex h-12 shrink-0 items-center gap-3 border-b border-border px-3 transition-opacity duration-500", hideChrome ? "pointer-events-none opacity-0" : "opacity-100")} aria-hidden={hideChrome}>
        <Button size="sm" onClick={() => { void exitPresentFullscreen(); setPresent(false); }}>Exit</Button>
        <span className="truncate text-sm text-ink">{doc.name}</span>
        {pages.length > 1 && <span className="font-mono text-[10px] text-ink-faint">{i + 1} / {pages.length}</span>}
        {pages.length > 1 && (
          <div className="ml-2 flex items-center gap-1">
            <Button size="sm" variant="ghost" disabled={i <= 0} onClick={() => go(-1)}>Prev</Button>
            <PresentChipRail pages={pages} liveId={live.id} onGo={goTo} onMenuOpenChange={setMenuOpen} />
            <Button size="sm" variant="ghost" disabled={i >= pages.length - 1} onClick={() => go(1)}>Next</Button>
          </div>
        )}
        <button type="button" className={cn("ml-auto font-mono text-[10px] uppercase tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-phosphor focus-visible:ring-offset-2 focus-visible:ring-offset-ground", full ? "text-phosphor" : "text-ink-faint hover:text-ink")} onClick={() => { void togglePresentFullscreen(rootRef.current).then(() => setFull(presentRootIsFullscreen(rootRef.current))); }} aria-pressed={full} aria-label={full ? "Exit fullscreen" : "Enter fullscreen"} title="Fullscreen present (F) — campaign rail stays">Full {full ? "on" : "off"} · F</button>
        <button type="button" className={cn("font-mono text-[10px] uppercase tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-phosphor focus-visible:ring-offset-2 focus-visible:ring-offset-ground", notesOpen ? "text-phosphor" : "text-ink-faint hover:text-ink-dim")} onClick={toggleNotes} aria-pressed={notesOpen} aria-label={notesOpen ? "Hide speaker notes" : "Show speaker notes"} title="Toggle speaker notes (N)">Notes {notesOpen ? "on" : "off"} · N</button>
        <span className={cn("font-mono text-[10px] uppercase", hot ? "text-phosphor" : "text-ink-faint")}>{hot ? hot.label : "Click or \u2192"}</span>
      </div>
      <div className="relative min-h-0 flex-1">
        <CanvasStage />
      </div>
    </div>
  );
}
