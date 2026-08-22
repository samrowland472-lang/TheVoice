import {
  Aperture,
  Box,
  Camera,
  ChevronLeft,
  ChevronRight,
  Circle,
  Cone,
  Cylinder,
  Download,
  Eye,
  Film,
  Ghost,
  Grid3x3,
  HelpCircle,
  Lightbulb,
  Magnet,
  Maximize2,
  MousePointer2,
  Pause,
  Play,
  Redo2,
  RotateCw,
  SkipBack,
  Square,
  Undo2,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { formatDuration, formatFrame, formatTimecode } from "@/lib/studio/format";
import { parseGltfFile } from "@/lib/studio/gltf";
import { PRESETS } from "@/lib/studio/presets";
import { useStudio } from "@/lib/studio/store";
import type { MeshShape, ProjectSnapshot, Shading, Tool } from "@/lib/studio/types";
import { cn } from "@/lib/utils";

function IconBtn({
  label,
  active,
  onClick,
  children,
  className,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "grid size-8 place-items-center rounded-sm text-muted transition-colors duration-150 hover:text-fg",
        active && "bg-surface-2 text-fg",
        className,
      )}
    >
      {children}
    </button>
  );
}

function exportProject() {
  const snap = useStudio.getState().snapshot();
  const blob = new Blob([JSON.stringify(snap, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${snap.name.replace(/[^\w]+/g, "-").toLowerCase() || "the-voice"}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importProject(file: File) {
  file.text().then((text) => {
    try {
      const data = JSON.parse(text) as ProjectSnapshot;
      if (data?.v === 1 && data.nodes) useStudio.getState().loadSnapshot(data, false);
    } catch {
      /* ignore */
    }
  });
}

export function Menubar() {
  const name = useStudio((s) => s.name);
  const [open, setOpen] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const gltfRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div className="flex h-9 items-center gap-1 border-b border-border bg-bg px-2">
      <div className="mr-2 flex items-center gap-2 px-1">
        <span className="font-display text-sm font-semibold tracking-tight text-fg">The Voice</span>
        <span className="hidden text-2xs text-subtle sm:inline">{name}</span>
        {notice ? <span className="hidden text-2xs text-key sm:inline">{notice}</span> : null}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) importProject(f);
          e.target.value = "";
        }}
      />
      <input
        ref={gltfRef}
        type="file"
        accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          void parseGltfFile(f)
            .then(({ nodes, rootId }) => {
              useStudio.getState().addImported(nodes, rootId);
              setNotice(null);
            })
            .catch((err: unknown) => {
              setNotice(err instanceof Error ? err.message : "glTF import failed");
              window.setTimeout(() => setNotice(null), 5000);
            });
        }}
      />
      <Menu
        label="File"
        open={open}
        setOpen={setOpen}
        items={[
          {
            label: "New Nested Cycles",
            action: () => useStudio.getState().loadSnapshot(PRESETS[0].factory(), true),
          },
          {
            label: "New Ball Bounce",
            action: () => useStudio.getState().loadSnapshot(PRESETS[1].factory(), false),
          },
          {
            label: "New Empty Stage",
            action: () => useStudio.getState().loadSnapshot(PRESETS[2].factory(), false),
          },
          {
            label: "Save locally",
            action: () => useStudio.getState().persist(),
          },
          {
            label: "Export JSON",
            action: exportProject,
          },
          {
            label: "Import JSON",
            action: () => fileRef.current?.click(),
          },
          {
            label: "Import glTF…",
            action: () => gltfRef.current?.click(),
          },
          {
            label: "Playblast…",
            action: () => useStudio.getState().setPlayblastOpen(true),
          },
        ]}
      />
      <Menu
        label="Edit"
        open={open}
        setOpen={setOpen}
        items={[
          { label: "Undo", action: () => useStudio.getState().undo() },
          { label: "Redo", action: () => useStudio.getState().redo() },
          { label: "Duplicate", action: () => useStudio.getState().duplicateSelected() },
          { label: "Copy pose", action: () => useStudio.getState().copyPose() },
          { label: "Paste pose", action: () => useStudio.getState().pastePose() },
          { label: "Delete", action: () => useStudio.getState().deleteSelected() },
        ]}
      />
      <Menu
        label="Create"
        open={open}
        setOpen={setOpen}
        items={[
          { label: "Cube", action: () => useStudio.getState().addMesh({ type: "box", w: 1, h: 1, d: 1 }, "Cube") },
          { label: "Sphere", action: () => useStudio.getState().addMesh({ type: "sphere", r: 0.5 }, "Sphere") },
          { label: "Cylinder", action: () => useStudio.getState().addMesh({ type: "cylinder", rt: 0.45, rb: 0.45, h: 1.2 }, "Cylinder") },
          { label: "Cone", action: () => useStudio.getState().addMesh({ type: "cone", r: 0.45, h: 1.1 }, "Cone") },
          { label: "Torus", action: () => useStudio.getState().addMesh({ type: "torus", r: 0.55, tube: 0.16 }, "Torus") },
          { label: "Point Light", action: () => useStudio.getState().addLight("point") },
          { label: "Camera", action: () => useStudio.getState().addCamera() },
          { label: "Null", action: () => useStudio.getState().addGroup() },
        ]}
      />
      <button
        type="button"
        className="h-7 rounded-sm px-2 text-xs text-muted hover:text-fg"
        onClick={() => useStudio.getState().setCommandOpen(true)}
      >
        Command
        <span className="ml-1.5 hidden font-mono text-2xs text-subtle sm:inline">⌘K</span>
      </button>
      <button
        type="button"
        className="ml-auto grid size-8 place-items-center text-muted hover:text-fg"
        aria-label="Shortcuts"
        onClick={() => useStudio.getState().setHelpOpen(true)}
      >
        <HelpCircle className="size-4" />
      </button>
    </div>
  );
}

function Menu({
  label,
  open,
  setOpen,
  items,
}: {
  label: string;
  open: string | null;
  setOpen: (v: string | null) => void;
  items: { label: string; action: () => void }[];
}) {
  const shown = open === label;
  return (
    <div className="relative">
      <button
        type="button"
        className={cn("h-7 rounded-sm px-2 text-xs text-muted hover:text-fg", shown && "bg-surface-2 text-fg")}
        onClick={() => setOpen(shown ? null : label)}
      >
        {label}
      </button>
      {shown ? (
        <div className="absolute left-0 top-full z-40 mt-1 min-w-44 rounded-md border border-border bg-surface-2 py-1 shadow-panel">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              className="flex h-8 w-full items-center px-3 text-left text-xs text-fg hover:bg-surface"
              onClick={() => {
                item.action();
                setOpen(null);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const SHAPES: { name: string; shape: MeshShape; icon: typeof Box }[] = [
  { name: "Cube", shape: { type: "box", w: 1, h: 1, d: 1 }, icon: Box },
  { name: "Sphere", shape: { type: "sphere", r: 0.5 }, icon: Circle },
  { name: "Cylinder", shape: { type: "cylinder", rt: 0.45, rb: 0.45, h: 1.2 }, icon: Cylinder },
  { name: "Cone", shape: { type: "cone", r: 0.45, h: 1.1 }, icon: Cone },
  { name: "Torus", shape: { type: "torus", r: 0.55, tube: 0.16 }, icon: Circle },
];

export function Toolbar() {
  const tool = useStudio((s) => s.tool);
  const shading = useStudio((s) => s.shading);
  const playing = useStudio((s) => s.playing);
  const loop = useStudio((s) => s.loop);
  const autoKey = useStudio((s) => s.autoKey);
  const snap = useStudio((s) => s.snap);
  const grid = useStudio((s) => s.grid);
  const lookThrough = useStudio((s) => s.lookThrough);
  const speed = useStudio((s) => s.speed);
  const onionSkin = useStudio((s) => s.onionSkin);
  const transformSpace = useStudio((s) => s.transformSpace);
  const fileRef = useRef<HTMLInputElement>(null);

  const setTool = (t: Tool) => useStudio.getState().setTool(t);

  return (
    <div className="flex h-10 items-center gap-0.5 overflow-x-auto border-b border-border bg-surface px-1.5">
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) importProject(f);
          e.target.value = "";
        }}
      />
      <IconBtn label="Select (Q)" active={tool === "select"} onClick={() => setTool("select")}>
        <MousePointer2 className="size-3.5" />
      </IconBtn>
      <IconBtn label="Move (W)" active={tool === "translate"} onClick={() => setTool("translate")}>
        <Maximize2 className="size-3.5 rotate-45" />
      </IconBtn>
      <IconBtn label="Rotate (E)" active={tool === "rotate"} onClick={() => setTool("rotate")}>
        <RotateCw className="size-3.5" />
      </IconBtn>
      <IconBtn label="Scale (R)" active={tool === "scale"} onClick={() => setTool("scale")}>
        <Square className="size-3.5" />
      </IconBtn>
      <button
        type="button"
        title="Gizmo space (X)"
        className={cn(
          "hidden h-7 rounded-sm px-2 font-mono text-2xs sm:inline",
          transformSpace === "world" ? "bg-surface-2 text-fg" : "text-muted hover:text-fg",
        )}
        onClick={() =>
          useStudio.getState().setTransformSpace(transformSpace === "world" ? "local" : "world")
        }
      >
        {transformSpace === "world" ? "World" : "Local"}
      </button>
      <span className="mx-1 h-5 w-px bg-border" />
      <IconBtn label="Undo" onClick={() => useStudio.getState().undo()}>
        <Undo2 className="size-3.5" />
      </IconBtn>
      <IconBtn label="Redo" onClick={() => useStudio.getState().redo()}>
        <Redo2 className="size-3.5" />
      </IconBtn>
      <span className="mx-1 hidden h-5 w-px bg-border md:block" />
      {SHAPES.map(({ name, shape, icon: Icon }) => (
        <span key={name} className="hidden md:inline-flex">
          <IconBtn
            label={`Create ${name}`}
            onClick={() => useStudio.getState().addMesh(shape, name)}
          >
            <Icon className="size-3.5" />
          </IconBtn>
        </span>
      ))}
      <span className="hidden md:inline-flex">
        <IconBtn label="Point light" onClick={() => useStudio.getState().addLight("point")}>
          <Lightbulb className="size-3.5" />
        </IconBtn>
      </span>
      <span className="hidden md:inline-flex">
        <IconBtn label="Camera" onClick={() => useStudio.getState().addCamera()}>
          <Camera className="size-3.5" />
        </IconBtn>
      </span>
      <span className="mx-1 h-5 w-px bg-border" />
      <IconBtn label="Previous frame (,)" onClick={() => useStudio.getState().stepFrame(-1)}>
        <ChevronLeft className="size-3.5" />
      </IconBtn>
      <IconBtn
        label={playing ? "Pause (Space / K)" : "Play (Space / L)"}
        active={playing}
        onClick={() => useStudio.getState().togglePlay()}
      >
        {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5 translate-x-px" />}
      </IconBtn>
      <IconBtn label="Next frame (.)" onClick={() => useStudio.getState().stepFrame(1)}>
        <ChevronRight className="size-3.5" />
      </IconBtn>
      <IconBtn label="Stop" onClick={() => useStudio.getState().stop()}>
        <SkipBack className="size-3.5" />
      </IconBtn>
      <IconBtn label="Loop playback" active={loop} onClick={() => useStudio.getState().setLoop(!loop)}>
        <Aperture className="size-3.5" />
      </IconBtn>
      <button
        type="button"
        className="h-7 rounded-sm px-2 font-mono text-2xs text-muted hover:text-fg"
        aria-label="Playback speed"
        onClick={() => {
          const speeds = [0.25, 0.5, 1, 2, 4];
          const i = speeds.indexOf(Math.abs(speed));
          const next = speeds[(i + 1) % speeds.length]!;
          useStudio.getState().setSpeed(Math.sign(speed) * next || next);
        }}
      >
        {speed}×
      </button>
      <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
      <div className="hidden items-center sm:flex">
        {(["wire", "solid", "material", "rendered"] as Shading[]).map((mode) => (
          <button
            key={mode}
            type="button"
            className={cn(
              "h-7 rounded-sm px-2 text-2xs capitalize",
              shading === mode ? "bg-surface-2 text-fg" : "text-muted hover:text-fg",
            )}
            onClick={() => useStudio.getState().setShading(mode)}
          >
            {mode}
          </button>
        ))}
      </div>
      <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
      <IconBtn label="Auto-key" active={autoKey} onClick={() => useStudio.getState().setAutoKey(!autoKey)}>
        <span className="font-mono text-2xs">AK</span>
      </IconBtn>
      <IconBtn label="Snap" active={snap} onClick={() => useStudio.getState().setSnap(!useStudio.getState().snap)}>
        <Magnet className="size-3.5" />
      </IconBtn>
      <IconBtn label="Grid" active={grid} onClick={() => useStudio.getState().setGrid(!grid)}>
        <Grid3x3 className="size-3.5" />
      </IconBtn>
      <IconBtn
        label="Onion skin"
        active={onionSkin}
        onClick={() => useStudio.getState().setOnionSkin(!onionSkin)}
      >
        <Ghost className="size-3.5" />
      </IconBtn>
      <IconBtn
        label="Look through shot camera"
        active={lookThrough}
        onClick={() => useStudio.getState().setLookThrough(!lookThrough)}
      >
        <Eye className="size-3.5" />
      </IconBtn>
      <span className="mx-1 hidden h-5 w-px bg-border lg:block" />
      <span className="hidden lg:inline-flex">
        <IconBtn label="Playblast" onClick={() => useStudio.getState().setPlayblastOpen(true)}>
          <Film className="size-3.5" />
        </IconBtn>
      </span>
      <span className="hidden lg:inline-flex">
        <IconBtn label="Export JSON" onClick={exportProject}>
          <Download className="size-3.5" />
        </IconBtn>
      </span>
      <span className="hidden lg:inline-flex">
        <IconBtn label="Import JSON" onClick={() => fileRef.current?.click()}>
          <Upload className="size-3.5" />
        </IconBtn>
      </span>
      <PlayheadReadout />
    </div>
  );
}

function PlayheadReadout() {
  const [label, setLabel] = useState("0f  0.00s");
  const [loopLabel, setLoopLabel] = useState("");
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const s = useStudio.getState();
      setLabel(`${formatFrame(s.currentTime, s.fps)}  ${formatTimecode(s.currentTime, s.duration >= 3600)}`);
      setLoopLabel(`${formatDuration(s.playbackEnd - s.playbackStart)} in–out`);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="ml-auto flex items-center gap-2 pr-1">
      <span className="font-mono text-xs tabular-nums text-fg">{label}</span>
      <span className="hidden font-mono text-2xs text-subtle sm:inline">{loopLabel}</span>
    </div>
  );
}

export function StatusBar() {
  const selected = useStudio((s) => {
    if (s.selectedIds.length > 1) return `${s.selectedIds.length} selected`;
    const n = s.selectedId ? s.nodes[s.selectedId] : null;
    return n?.name ?? "Nothing selected";
  });
  const fps = useStudio((s) => s.fps);
  const duration = useStudio((s) => s.duration);
  const tracks = useStudio((s) => s.tracks.length);
  const space = useStudio((s) => s.transformSpace);
  return (
    <div className="flex h-7 items-center gap-3 border-t border-border bg-bg px-3 font-mono text-2xs text-subtle">
      <span className="text-muted">{selected}</span>
      <span className="ml-auto">{fps} fps</span>
      <span className="capitalize">{space}</span>
      <span>{tracks} tracks</span>
      <span>Duration {formatDuration(duration)}</span>
    </div>
  );
}

export function MobileDock() {
  const panel = useStudio((s) => s.mobilePanel);
  const playing = useStudio((s) => s.playing);
  const toggle = (v: typeof panel) =>
    useStudio.getState().setMobilePanel(panel === v ? "none" : v);
  return (
    <div className="studio-mobile-dock h-12 items-center justify-around border-t border-border bg-surface px-2">
      <button type="button" className="text-xs text-muted" onClick={() => toggle("outliner")}>
        Scene
      </button>
      <button
        type="button"
        className="grid size-10 place-items-center rounded-full bg-fg text-bg"
        onClick={() => useStudio.getState().togglePlay()}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause className="size-4" /> : <Play className="size-4 translate-x-px" />}
      </button>
      <button type="button" className="text-xs text-muted" onClick={() => toggle("inspector")}>
        Channels
      </button>
      <button type="button" className="text-xs text-muted" onClick={() => toggle("timeline")}>
        Time
      </button>
    </div>
  );
}
