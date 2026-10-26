import { Group, Panel, Separator } from "react-resizable-panels";
import { useEffect, useState, type ReactNode } from "react";
import { cancelPlayblast } from "@/lib/studio/playblast";
import { useStudio } from "@/lib/studio/store";
import { CommandPalette } from "./CommandPalette";
import { Menubar, MobileDock, StatusBar, Toolbar } from "./Chrome";
import { Inspector } from "./Inspector";
import { HelpOverlay, PlayblastDialog, PlayblastProgress, Welcome } from "./Overlays";
import { Outliner } from "./Outliner";
import { Timeline } from "./Timeline";
import { Viewport } from "./Viewport";

function useDesktopLayout() {
  const [desktop, setDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return desktop;
}

export function StudioApp() {
  const desktop = useDesktopLayout();

  useEffect(() => {
    useStudio.getState().hydrate();
    const id = window.setInterval(() => useStudio.getState().persist(), 4000);
    const onHide = () => useStudio.getState().persist();
    document.addEventListener("visibilitychange", onHide);

    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable || t.tagName === "SELECT");
      const s = useStudio.getState();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        s.setCommandOpen(!s.commandOpen);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) s.redo();
        else s.undo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        s.duplicateSelected();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        s.persist();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "c") {
        if (typing) return;
        e.preventDefault();
        if (s.selectedKeys.length || s.selectedKeyIndex !== null) s.copyKeys();
        else s.copyPose();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "v") {
        if (typing) return;
        e.preventDefault();
        if (s.keyClipboard?.items.length) s.pasteKeys();
        else s.pastePose();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a") {
        if (typing) return;
        e.preventDefault();
        if (s.bottomTab === "dope" || s.bottomTab === "curves") s.selectAllKeys();
        else s.setSelectedIds(Object.keys(s.nodes));
        return;
      }
      if (typing) return;
      if (e.key === " ") {
        e.preventDefault();
        s.togglePlay();
      } else if (e.key === "q" || e.key === "Q") s.setTool("select");
      else if (e.key === "w" || e.key === "W") s.setTool("translate");
      else if (e.key === "e" || e.key === "E") s.setTool("rotate");
      else if (e.key === "r" || e.key === "R") s.setTool("scale");
      else if (e.key === "s" || e.key === "S") s.insertKeysForSelection();
      else if (e.key === "f" || e.key === "F") s.frameSelection();
      else if (e.key === "x" || e.key === "X")
        s.setTransformSpace(s.transformSpace === "world" ? "local" : "world");
      else if (e.key === "n" || e.key === "N") s.setOnionSkin(!s.onionSkin);
      else if (e.key === "j" || e.key === "J") s.shuttle(-1);
      else if (e.key === "k" || e.key === "K") s.setPlaying(false);
      else if (e.key === "l" || e.key === "L") s.shuttle(1);
      else if (e.key === "," || e.key === "ArrowLeft") {
        e.preventDefault();
        s.stepFrame(-1);
      } else if (e.key === "." || e.key === "ArrowRight") {
        e.preventDefault();
        s.stepFrame(1);
      } else if (e.key === "i" || e.key === "I") {
        if (e.shiftKey) s.setTime(s.playbackStart);
        else s.setInPoint();
      } else if (e.key === "o" || e.key === "O") {
        if (e.shiftKey) s.setTime(s.playbackEnd);
        else s.setOutPoint();
      } else if (e.key === "Home") {
        e.preventDefault();
        s.setTime(s.playbackStart);
      } else if (e.key === "End") {
        e.preventDefault();
        s.setTime(s.playbackEnd);
      } else if (e.key === "1") s.setShading("wire");
      else if (e.key === "2") s.setShading("solid");
      else if (e.key === "3") s.setShading("material");
      else if (e.key === "4") s.setShading("rendered");
      else if (e.key === "?" || e.key === "F1") s.setHelpOpen(true);
      else if (e.key === "Escape") {
        if (s.playblasting) {
          cancelPlayblast();
          return;
        }
        s.setCommandOpen(false);
        s.setHelpOpen(false);
        s.setWelcomeOpen(false);
        s.setPlayblastOpen(false);
        s.setMobilePanel("none");
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (s.selectedKeys.length || s.selectedKeyIndex !== null) {
          if (e.shiftKey) s.rippleDeleteKeys();
          else s.deleteSelectedKey();
        } else s.deleteSelected();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const mobilePanel = useStudio((s) => s.mobilePanel);

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-bg text-fg">
      <Menubar />
      <Toolbar />
      <div className="relative min-h-0 flex-1">
        {desktop ? (
          <div className="h-full">
            <Group orientation="vertical" className="h-full">
              <Panel minSize="40%" defaultSize="72%">
                <Group orientation="horizontal" className="h-full">
                  <Panel defaultSize={220} minSize={160} maxSize={360} id="outliner">
                    <Outliner />
                  </Panel>
                  <Separator className="w-1 bg-border hover:bg-accent" />
                  <Panel id="viewport" minSize="30%">
                    <div className="relative h-full">
                      <Viewport />
                      <div className="pointer-events-none absolute inset-0 z-30">
                        <Welcome />
                        <PlayblastProgress />
                      </div>
                    </div>
                  </Panel>
                  <Separator className="w-1 bg-border hover:bg-accent" />
                  <Panel defaultSize={260} minSize={200} maxSize={420} id="inspector">
                    <Inspector />
                  </Panel>
                </Group>
              </Panel>
              <Separator className="h-1 bg-border hover:bg-accent" />
              <Panel defaultSize={220} minSize={140} maxSize={420} id="timeline">
                <Timeline />
              </Panel>
            </Group>
          </div>
        ) : (
          <div className="flex h-full min-h-0 flex-col">
            <div className="relative min-h-0 flex-1">
              <div className="absolute inset-0">
                <Viewport />
                <Welcome />
                <PlayblastProgress />
              </div>
              {mobilePanel === "outliner" ? (
                <Drawer onClose={() => useStudio.getState().setMobilePanel("none")}>
                  <Outliner />
                </Drawer>
              ) : null}
              {mobilePanel === "inspector" ? (
                <Drawer onClose={() => useStudio.getState().setMobilePanel("none")}>
                  <Inspector />
                </Drawer>
              ) : null}
            </div>
            <div
              className={
                mobilePanel === "timeline"
                  ? "h-52 shrink-0 border-t border-border"
                  : "h-28 shrink-0 border-t border-border"
              }
            >
              <Timeline />
            </div>
          </div>
        )}
      </div>
      <StatusBar />
      {desktop ? null : <MobileDock />}
      <CommandPalette />
      <HelpOverlay />
      <PlayblastDialog />
    </div>
  );
}

function Drawer({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-30 flex bg-bg/50" onClick={onClose}>
      <div
        className="h-full w-[min(100%,320px)] border-r border-border bg-surface shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
