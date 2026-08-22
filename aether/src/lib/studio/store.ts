import { create } from "zustand";
import { evalNode, ensureBezierTangents, getChannelValue } from "./eval";
import { captureAsChildOf, wouldCycle } from "./hierarchy";
import { nid, uniqueName } from "./ids";
import { twoHundredHourLoop } from "./presets";
import {
  CHANNELS,
  DEFAULT_MATERIAL,
  TRANSFORM_CHANNELS,
  type AnimExpr,
  type BottomTab,
  type CameraAim,
  type Channel,
  type Interp,
  type MeshShape,
  type PoseClipboard,
  type ProjectSnapshot,
  type SceneNode,
  type Shading,
  type Tool,
  type Track,
  type TransformSpace,
  type Vec3,
  vec3,
} from "./types";

const STORAGE_KEY = "aether-project-v1";

type HistoryEntry = {
  nodes: Record<string, SceneNode>;
  tracks: Track[];
};

export type StudioState = {
  name: string;
  nodes: Record<string, SceneNode>;
  tracks: Track[];
  selectedId: string | null;
  selectedTrackId: string | null;
  selectedKeyIndex: number | null;
  tool: Tool;
  shading: Shading;
  currentTime: number;
  duration: number;
  playbackStart: number;
  playbackEnd: number;
  fps: number;
  playing: boolean;
  loop: boolean;
  speed: number;
  autoKey: boolean;
  snap: boolean;
  grid: boolean;
  showGizmos: boolean;
  lookThrough: boolean;
  transforming: boolean;
  bottomTab: BottomTab;
  viewStart: number;
  viewEnd: number;
  commandOpen: boolean;
  helpOpen: boolean;
  welcomeOpen: boolean;
  mobilePanel: "none" | "outliner" | "inspector" | "timeline";
  history: HistoryEntry[];
  future: HistoryEntry[];
  hydrated: boolean;
  transformSpace: TransformSpace;
  onionSkin: boolean;
  poseClipboard: PoseClipboard | null;
};

type StudioActions = {
  hydrate: () => void;
  persist: () => void;
  loadSnapshot: (snap: ProjectSnapshot, welcome?: boolean) => void;
  snapshot: () => ProjectSnapshot;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  setTime: (t: number) => void;
  setPlaying: (v: boolean) => void;
  togglePlay: () => void;
  stop: () => void;
  setLoop: (v: boolean) => void;
  setSpeed: (v: number) => void;
  setTool: (t: Tool) => void;
  setShading: (s: Shading) => void;
  setSelected: (id: string | null) => void;
  setBottomTab: (t: BottomTab) => void;
  setViewRange: (start: number, end: number) => void;
  setPlaybackRange: (start: number, end: number) => void;
  setDuration: (d: number) => void;
  setAutoKey: (v: boolean) => void;
  setGrid: (v: boolean) => void;
  setSnap: (v: boolean) => void;
  setLookThrough: (v: boolean) => void;
  setTransforming: (v: boolean) => void;
  setCommandOpen: (v: boolean) => void;
  setHelpOpen: (v: boolean) => void;
  setWelcomeOpen: (v: boolean) => void;
  setMobilePanel: (v: StudioState["mobilePanel"]) => void;
  setTransformSpace: (v: TransformSpace) => void;
  setOnionSkin: (v: boolean) => void;
  stepFrame: (dir: 1 | -1) => void;
  shuttle: (dir: 1 | -1) => void;
  setInPoint: () => void;
  setOutPoint: () => void;
  addMesh: (shape: MeshShape, name: string) => string;
  addLight: (type: NonNullable<SceneNode["light"]>["type"]) => string;
  addCamera: () => string;
  addGroup: () => string;
  duplicateSelected: () => void;
  deleteSelected: () => void;
  renameNode: (id: string, name: string) => void;
  setNodeVisible: (id: string, visible: boolean) => void;
  setNodeLocked: (id: string, locked: boolean) => void;
  setParent: (id: string, parentId: string | null) => void;
  updateTransform: (id: string, t: { position?: Vec3; rotation?: Vec3; scale?: Vec3 }) => void;
  updateMaterial: (id: string, patch: Partial<NonNullable<SceneNode["material"]>>) => void;
  updateLight: (id: string, patch: Partial<NonNullable<SceneNode["light"]>>) => void;
  updateCamera: (id: string, patch: Partial<NonNullable<SceneNode["camera"]>>) => void;
  setChannelRest: (id: string, channel: Channel, value: number) => void;
  insertKey: (objectId: string, channel: Channel, t?: number, value?: number) => void;
  insertKeysForSelection: () => void;
  moveKey: (trackId: string, index: number, t: number) => void;
  setKeyValue: (trackId: string, index: number, v: number) => void;
  deleteSelectedKey: () => void;
  selectKey: (trackId: string | null, index: number | null) => void;
  toggleTrackCycle: (trackId: string) => void;
  setKeyInterp: (trackId: string, index: number, interp: Interp) => void;
  setKeyTangent: (
    trackId: string,
    index: number,
    side: "in" | "out",
    dx: number,
    dy: number,
    opts?: { broken?: boolean },
  ) => void;
  setKeyBroken: (trackId: string, index: number, broken: boolean) => void;
  insertCurveKey: (trackId: string, t: number, v: number) => void;
  addExpression: (objectId: string, channel: Channel, kind: AnimExpr["kind"]) => void;
  updateExpr: (trackId: string, patch: Partial<AnimExpr>) => void;
  clearExpression: (trackId: string) => void;
  copyPose: () => void;
  pastePose: () => void;
  frameSelection: () => void;
  frameAll: () => void;
};

function cloneNodes(nodes: Record<string, SceneNode>): Record<string, SceneNode> {
  return JSON.parse(JSON.stringify(nodes)) as Record<string, SceneNode>;
}

function cloneTracks(tracks: Track[]): Track[] {
  return JSON.parse(JSON.stringify(tracks)) as Track[];
}

function clampTime(t: number, duration: number) {
  return Math.min(duration, Math.max(0, t));
}

function descendants(nodes: Record<string, SceneNode>, id: string): string[] {
  const out: string[] = [];
  const walk = (pid: string) => {
    for (const n of Object.values(nodes)) {
      if (n.parentId === pid) {
        out.push(n.id);
        walk(n.id);
      }
    }
  };
  walk(id);
  return out;
}

function applyChannel(node: SceneNode, channel: Channel, value: number): SceneNode {
  const next = { ...node, position: { ...node.position }, rotation: { ...node.rotation }, scale: { ...node.scale } };
  switch (channel) {
    case "position.x":
      next.position.x = value;
      break;
    case "position.y":
      next.position.y = value;
      break;
    case "position.z":
      next.position.z = value;
      break;
    case "rotation.x":
      next.rotation.x = value;
      break;
    case "rotation.y":
      next.rotation.y = value;
      break;
    case "rotation.z":
      next.rotation.z = value;
      break;
    case "scale.x":
      next.scale.x = value;
      break;
    case "scale.y":
      next.scale.y = value;
      break;
    case "scale.z":
      next.scale.z = value;
      break;
    case "intensity":
      if (next.light) next.light = { ...next.light, intensity: value };
      break;
    case "emissiveIntensity":
      if (next.material) next.material = { ...next.material, emissiveIntensity: value };
      break;
    case "opacity":
      if (next.material) next.material = { ...next.material, opacity: value };
      break;
    case "fov":
      if (next.camera) next.camera = { ...next.camera, fov: value };
      break;
  }
  return next;
}

const initial = twoHundredHourLoop();

export const useStudio = create<StudioState & StudioActions>((set, get) => ({
  name: initial.name,
  nodes: initial.nodes,
  tracks: initial.tracks,
  selectedId: "figure",
  selectedTrackId: null,
  selectedKeyIndex: null,
  tool: "translate",
  shading: "rendered",
  currentTime: 0,
  duration: initial.duration,
  playbackStart: initial.playbackStart,
  playbackEnd: initial.playbackEnd,
  fps: initial.fps,
  playing: true,
  loop: true,
  speed: 1,
  autoKey: true,
  snap: false,
  grid: true,
  showGizmos: true,
  lookThrough: false,
  transforming: false,
  bottomTab: "dope",
  viewStart: 0,
  viewEnd: 8,
  commandOpen: false,
  helpOpen: false,
  welcomeOpen: true,
  mobilePanel: "none",
  history: [],
  future: [],
  hydrated: false,
  transformSpace: "local",
  onionSkin: false,
  poseClipboard: null,

  hydrate: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as ProjectSnapshot & { currentTime?: number };
        if (data?.v === 1 && data.nodes) {
          get().loadSnapshot(data, false);
          if (typeof data.currentTime === "number") {
            set({ currentTime: data.currentTime, playing: false, welcomeOpen: false });
          } else {
            set({ welcomeOpen: false });
          }
        }
      }
    } catch {
      /* keep default */
    }
    set({ hydrated: true });
  },

  persist: () => {
    if (typeof window === "undefined") return;
    try {
      const snap = get().snapshot();
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...snap, currentTime: get().currentTime }),
      );
    } catch {
      /* quota */
    }
  },

  loadSnapshot: (snap, welcome = false) => {
    const end = snap.playbackEnd || Math.min(8, snap.duration);
    set({
      name: snap.name,
      nodes: snap.nodes,
      tracks: snap.tracks,
      duration: snap.duration,
      playbackStart: snap.playbackStart,
      playbackEnd: end,
      fps: snap.fps,
      currentTime: snap.playbackStart,
      viewStart: snap.playbackStart,
      viewEnd: end,
      selectedId: Object.keys(snap.nodes)[0] ?? null,
      selectedTrackId: null,
      selectedKeyIndex: null,
      history: [],
      future: [],
      welcomeOpen: welcome,
      playing: true,
    });
  },

  snapshot: () => {
    const s = get();
    return {
      v: 1 as const,
      name: s.name,
      nodes: s.nodes,
      tracks: s.tracks,
      duration: s.duration,
      playbackStart: s.playbackStart,
      playbackEnd: s.playbackEnd,
      fps: s.fps,
    };
  },

  pushHistory: () => {
    const { nodes, tracks, history } = get();
    set({
      history: [...history.slice(-47), { nodes: cloneNodes(nodes), tracks: cloneTracks(tracks) }],
      future: [],
    });
  },

  undo: () => {
    const { history, future, nodes, tracks } = get();
    const prev = history[history.length - 1];
    if (!prev) return;
    set({
      nodes: prev.nodes,
      tracks: prev.tracks,
      history: history.slice(0, -1),
      future: [...future, { nodes: cloneNodes(nodes), tracks: cloneTracks(tracks) }],
    });
  },

  redo: () => {
    const { history, future, nodes, tracks } = get();
    const next = future[future.length - 1];
    if (!next) return;
    set({
      nodes: next.nodes,
      tracks: next.tracks,
      future: future.slice(0, -1),
      history: [...history, { nodes: cloneNodes(nodes), tracks: cloneTracks(tracks) }],
    });
  },

  setTime: (t) => {
    const { duration } = get();
    set({ currentTime: clampTime(t, duration) });
  },
  setPlaying: (v) => set({ playing: v }),
  togglePlay: () => set((s) => ({ playing: !s.playing, speed: s.playing ? s.speed : Math.abs(s.speed) || 1 })),
  stop: () =>
    set((s) => ({
      playing: false,
      currentTime: s.playbackStart,
      speed: Math.abs(s.speed) || 1,
    })),
  setLoop: (v) => set({ loop: v }),
  setSpeed: (v) => set({ speed: v }),
  setTool: (t) => set({ tool: t }),
  setShading: (s) => set({ shading: s }),
  setSelected: (id) => set({ selectedId: id, selectedTrackId: null, selectedKeyIndex: null }),
  setBottomTab: (t) => set({ bottomTab: t }),
  setViewRange: (start, end) => {
    const a = Math.max(0, Math.min(start, end));
    const b = Math.max(a + 0.05, end);
    set({ viewStart: a, viewEnd: b });
  },
  setPlaybackRange: (start, end) => {
    const a = Math.max(0, Math.min(start, end));
    const b = Math.max(a + 0.05, end);
    set({ playbackStart: a, playbackEnd: b });
  },
  setDuration: (d) => set({ duration: Math.max(0.5, d) }),
  setAutoKey: (v) => set({ autoKey: v }),
  setGrid: (v) => set({ grid: v }),
  setSnap: (v) => set({ snap: v }),
  setLookThrough: (v) => set({ lookThrough: v }),
  setTransforming: (v) => set({ transforming: v }),
  setCommandOpen: (v) => set({ commandOpen: v }),
  setHelpOpen: (v) => set({ helpOpen: v }),
  setWelcomeOpen: (v) => set({ welcomeOpen: v }),
  setMobilePanel: (v) => set({ mobilePanel: v }),
  setTransformSpace: (v) => set({ transformSpace: v }),
  setOnionSkin: (v) => set({ onionSkin: v }),

  stepFrame: (dir) => {
    const { currentTime, fps, playbackStart, playbackEnd, loop, duration } = get();
    const dt = 1 / Math.max(1, fps);
    let t = currentTime + dir * dt;
    if (loop) {
      const span = Math.max(dt, playbackEnd - playbackStart);
      if (t >= playbackEnd) t = playbackStart;
      if (t < playbackStart) t = playbackEnd - dt;
    }
    set({ currentTime: clampTime(t, duration), playing: false });
  },

  shuttle: (dir) => {
    const { playing, speed } = get();
    if (!playing || Math.sign(speed) !== dir) {
      set({ playing: true, speed: dir });
      return;
    }
    const mag = Math.abs(speed);
    const next = mag >= 4 ? 0.25 : mag >= 2 ? 4 : mag >= 1 ? 2 : 1;
    set({ speed: next * dir });
  },

  setInPoint: () => {
    const { currentTime, playbackEnd } = get();
    get().setPlaybackRange(currentTime, Math.max(currentTime + 0.05, playbackEnd));
  },
  setOutPoint: () => {
    const { currentTime, playbackStart } = get();
    get().setPlaybackRange(Math.min(playbackStart, currentTime - 0.05), currentTime);
  },

  addMesh: (shape, name) => {
    get().pushHistory();
    const id = nid("mesh");
    const { nodes } = get();
    const n: SceneNode = {
      id,
      name: uniqueName(nodes, name),
      kind: "mesh",
      parentId: null,
      visible: true,
      locked: false,
      castShadow: true,
      receiveShadow: true,
      position: vec3(0, shape.type === "plane" || shape.type === "disk" ? 0 : 0.5, 0),
      rotation: vec3(),
      scale: vec3(1, 1, 1),
      shape,
      material: { ...DEFAULT_MATERIAL },
    };
    set({ nodes: { ...nodes, [id]: n }, selectedId: id });
    return id;
  },

  addLight: (type) => {
    get().pushHistory();
    const id = nid("light");
    const { nodes } = get();
    const n: SceneNode = {
      id,
      name: uniqueName(nodes, type === "point" ? "Point Light" : type === "spot" ? "Spot Light" : type === "hemisphere" ? "Sky Light" : "Key Light"),
      kind: "light",
      parentId: null,
      visible: true,
      locked: false,
      castShadow: false,
      receiveShadow: false,
      position: vec3(2, 4, 2),
      rotation: vec3(),
      scale: vec3(1, 1, 1),
      light: {
        type,
        color: "#fff4e8",
        intensity: type === "hemisphere" ? 0.4 : 1.6,
        distance: type === "point" || type === "spot" ? 12 : 0,
        angle: 0.4,
        penumbra: 0.3,
      },
    };
    set({ nodes: { ...nodes, [id]: n }, selectedId: id });
    return id;
  },

  addCamera: () => {
    get().pushHistory();
    const id = nid("cam");
    const { nodes } = get();
    const n: SceneNode = {
      id,
      name: uniqueName(nodes, "Camera"),
      kind: "camera",
      parentId: null,
      visible: true,
      locked: false,
      castShadow: false,
      receiveShadow: false,
      position: vec3(4, 2.4, 5),
      rotation: vec3(-0.3, 0.6, 0),
      scale: vec3(1, 1, 1),
      camera: { fov: 35, near: 0.05, far: 200, aim: "free" },
    };
    set({ nodes: { ...nodes, [id]: n }, selectedId: id });
    return id;
  },

  addGroup: () => {
    get().pushHistory();
    const id = nid("grp");
    const { nodes } = get();
    const n: SceneNode = {
      id,
      name: uniqueName(nodes, "Null"),
      kind: "group",
      parentId: null,
      visible: true,
      locked: false,
      castShadow: false,
      receiveShadow: false,
      position: vec3(),
      rotation: vec3(),
      scale: vec3(1, 1, 1),
    };
    set({ nodes: { ...nodes, [id]: n }, selectedId: id });
    return id;
  },

  duplicateSelected: () => {
    const { selectedId, nodes } = get();
    if (!selectedId) return;
    const src = nodes[selectedId];
    if (!src) return;
    get().pushHistory();
    const ids = [selectedId, ...descendants(nodes, selectedId)];
    const map = new Map<string, string>();
    for (const oldId of ids) map.set(oldId, nid("dup"));
    const next = { ...nodes };
    for (const oldId of ids) {
      const orig = nodes[oldId]!;
      const newId = map.get(oldId)!;
      next[newId] = {
        ...JSON.parse(JSON.stringify(orig)) as SceneNode,
        id: newId,
        name: uniqueName(next, orig.name),
        parentId: orig.parentId && map.has(orig.parentId) ? map.get(orig.parentId)! : orig.parentId,
        position:
          oldId === selectedId
            ? { x: orig.position.x + 0.6, y: orig.position.y, z: orig.position.z }
            : { ...orig.position },
      };
    }
    const tracks = get().tracks.map((tr) => {
      const mapped = map.get(tr.objectId);
      if (!mapped) return tr;
      return { ...tr, id: nid("tr"), objectId: mapped, keys: tr.keys.map((k) => ({ ...k })) };
    });
    set({ nodes: next, tracks, selectedId: map.get(selectedId)! });
  },

  deleteSelected: () => {
    const { selectedId, nodes, tracks } = get();
    if (!selectedId) return;
    const src = nodes[selectedId];
    if (!src || src.locked) return;
    get().pushHistory();
    const kill = new Set([selectedId, ...descendants(nodes, selectedId)]);
    const next = { ...nodes };
    for (const id of kill) delete next[id];
    set({
      nodes: next,
      tracks: tracks.filter((t) => !kill.has(t.objectId)),
      selectedId: null,
    });
  },

  renameNode: (id, name) => {
    const n = get().nodes[id];
    if (!n) return;
    set({ nodes: { ...get().nodes, [id]: { ...n, name } } });
  },

  setNodeVisible: (id, visible) => {
    const n = get().nodes[id];
    if (!n) return;
    set({ nodes: { ...get().nodes, [id]: { ...n, visible } } });
  },

  setNodeLocked: (id, locked) => {
    const n = get().nodes[id];
    if (!n) return;
    set({ nodes: { ...get().nodes, [id]: { ...n, locked } } });
  },

  setParent: (id, parentId) => {
    const { nodes } = get();
    const n = nodes[id];
    if (!n || n.locked) return;
    if (parentId === id) return;
    if (parentId && !nodes[parentId]) return;
    if (wouldCycle(nodes, id, parentId)) return;
    get().pushHistory();
    const captured = captureAsChildOf(id, parentId);
    set({
      nodes: {
        ...nodes,
        [id]: {
          ...n,
          parentId,
          position: captured?.position ?? n.position,
          rotation: captured?.rotation ?? n.rotation,
          scale: captured?.scale ?? n.scale,
        },
      },
    });
  },

  updateTransform: (id, t) => {
    const n = get().nodes[id];
    if (!n || n.locked) return;
    const next: SceneNode = {
      ...n,
      position: t.position ?? n.position,
      rotation: t.rotation ?? n.rotation,
      scale: t.scale ?? n.scale,
    };
    const { tracks, autoKey, currentTime } = get();
    let nextTracks = tracks;
    const maybeKey = (channel: Channel, value: number, restChanged: boolean) => {
      const existing = nextTracks.find((tr) => tr.objectId === id && tr.channel === channel);
      if (existing || (autoKey && restChanged)) {
        nextTracks = upsertKey(nextTracks, id, channel, currentTime, value);
      }
    };
    if (t.position) {
      maybeKey("position.x", t.position.x, t.position.x !== n.position.x);
      maybeKey("position.y", t.position.y, t.position.y !== n.position.y);
      maybeKey("position.z", t.position.z, t.position.z !== n.position.z);
    }
    if (t.rotation) {
      maybeKey("rotation.x", t.rotation.x, t.rotation.x !== n.rotation.x);
      maybeKey("rotation.y", t.rotation.y, t.rotation.y !== n.rotation.y);
      maybeKey("rotation.z", t.rotation.z, t.rotation.z !== n.rotation.z);
    }
    if (t.scale) {
      maybeKey("scale.x", t.scale.x, t.scale.x !== n.scale.x);
      maybeKey("scale.y", t.scale.y, t.scale.y !== n.scale.y);
      maybeKey("scale.z", t.scale.z, t.scale.z !== n.scale.z);
    }
    set({ nodes: { ...get().nodes, [id]: next }, tracks: nextTracks });
  },

  updateMaterial: (id, patch) => {
    const n = get().nodes[id];
    if (!n?.material) return;
    get().pushHistory();
    set({
      nodes: {
        ...get().nodes,
        [id]: { ...n, material: { ...n.material, ...patch } },
      },
    });
  },

  updateLight: (id, patch) => {
    const n = get().nodes[id];
    if (!n?.light) return;
    get().pushHistory();
    set({
      nodes: {
        ...get().nodes,
        [id]: { ...n, light: { ...n.light, ...patch } },
      },
    });
  },

  updateCamera: (id, patch) => {
    const n = get().nodes[id];
    if (!n?.camera) return;
    get().pushHistory();
    set({
      nodes: {
        ...get().nodes,
        [id]: { ...n, camera: { ...n.camera, ...patch } },
      },
    });
  },

  setChannelRest: (id, channel, value) => {
    const n = get().nodes[id];
    if (!n || n.locked) return;
    const { tracks, autoKey, currentTime } = get();
    const existing = tracks.find((tr) => tr.objectId === id && tr.channel === channel);
    if (existing?.expr) {
      const expr = existing.expr;
      if (expr.kind === "ramp") {
        get().updateExpr(existing.id, { offset: value } as Partial<AnimExpr>);
        return;
      }
      get().updateExpr(existing.id, { offset: value } as Partial<AnimExpr>);
      return;
    }
    if (existing || autoKey) {
      set({ tracks: upsertKey(tracks, id, channel, currentTime, value) });
      return;
    }
    set({ nodes: { ...get().nodes, [id]: applyChannel(n, channel, value) } });
  },

  insertKey: (objectId, channel, t, value) => {
    get().pushHistory();
    const time = t ?? get().currentTime;
    const node = get().nodes[objectId];
    if (!node) return;
    const evaluated = evalNode(node, get().tracks, time);
    const v =
      value ??
      (channel.startsWith("position")
        ? evaluated.position[channel.split(".")[1] as keyof Vec3]
        : channel.startsWith("rotation")
          ? evaluated.rotation[channel.split(".")[1] as keyof Vec3]
          : channel.startsWith("scale")
            ? evaluated.scale[channel.split(".")[1] as keyof Vec3]
            : channel === "intensity"
              ? (evaluated.intensity ?? getChannelValue(node, channel))
              : getChannelValue(node, channel));
    set({ tracks: upsertKey(get().tracks, objectId, channel, time, v) });
  },

  insertKeysForSelection: () => {
    const { selectedId, nodes, currentTime, tracks } = get();
    if (!selectedId) return;
    const node = nodes[selectedId];
    if (!node) return;
    get().pushHistory();
    let next = tracks;
    const evaluated = evalNode(node, tracks, currentTime);
    for (const ch of TRANSFORM_CHANNELS) {
      const v = getChannelValue(
        {
          ...node,
          position: evaluated.position,
          rotation: evaluated.rotation,
          scale: evaluated.scale,
        },
        ch,
      );
      next = upsertKey(next, selectedId, ch, currentTime, v);
    }
    set({ tracks: next });
  },

  moveKey: (trackId, index, t) => {
    const tracks = get().tracks.map((tr) => {
      if (tr.id !== trackId) return tr;
      const keys = tr.keys.map((k, i) => (i === index ? { ...k, t: Math.max(0, t) } : k));
      keys.sort((a, b) => a.t - b.t);
      return { ...tr, keys };
    });
    set({ tracks });
  },

  setKeyValue: (trackId, index, v) => {
    set({
      tracks: get().tracks.map((tr) =>
        tr.id === trackId
          ? { ...tr, keys: tr.keys.map((k, i) => (i === index ? { ...k, v } : k)) }
          : tr,
      ),
    });
  },

  deleteSelectedKey: () => {
    const { selectedTrackId, selectedKeyIndex, tracks } = get();
    if (!selectedTrackId || selectedKeyIndex === null) return;
    get().pushHistory();
    set({
      tracks: tracks.map((tr) =>
        tr.id === selectedTrackId
          ? { ...tr, keys: tr.keys.filter((_, i) => i !== selectedKeyIndex) }
          : tr,
      ),
      selectedKeyIndex: null,
    });
  },

  selectKey: (trackId, index) => set({ selectedTrackId: trackId, selectedKeyIndex: index }),

  toggleTrackCycle: (trackId) => {
    set({
      tracks: get().tracks.map((tr) =>
        tr.id === trackId ? { ...tr, cycle: !tr.cycle } : tr,
      ),
    });
  },

  setKeyInterp: (trackId, index, interp) => {
    set({
      tracks: get().tracks.map((tr) => {
        if (tr.id !== trackId) return tr;
        let keys = tr.keys.map((k, i) => (i === index ? { ...k, interp } : k));
        if (interp === "bezier") keys = ensureBezierTangents(keys, index);
        if (interp !== "bezier") {
          keys = keys.map((k, i) =>
            i === index ? { ...k, tanIn: undefined, tanOut: undefined, broken: undefined } : k,
          );
        }
        return { ...tr, keys };
      }),
    });
  },

  setKeyTangent: (trackId, index, side, dx, dy, opts) => {
    const clampDx = Math.max(0.01, dx);
    set({
      tracks: get().tracks.map((tr) => {
        if (tr.id !== trackId) return tr;
        const keys = tr.keys.map((k, i) => {
          if (i !== index) return k;
          const broken = opts?.broken ?? k.broken ?? false;
          const next = {
            ...k,
            interp: "bezier" as Interp,
            broken,
            tanIn: k.tanIn ?? { dx: 0.25, dy: 0 },
            tanOut: k.tanOut ?? { dx: 0.25, dy: 0 },
          };
          if (side === "out") {
            next.tanOut = { dx: clampDx, dy };
            if (!broken && next.tanIn) {
              next.tanIn = { dx: next.tanIn.dx, dy: -(dy / clampDx) * next.tanIn.dx };
            }
          } else {
            next.tanIn = { dx: clampDx, dy };
            if (!broken && next.tanOut) {
              next.tanOut = { dx: next.tanOut.dx, dy: -(dy / clampDx) * next.tanOut.dx };
            }
          }
          return next;
        });
        return { ...tr, keys };
      }),
    });
  },

  setKeyBroken: (trackId, index, broken) => {
    set({
      tracks: get().tracks.map((tr) => {
        if (tr.id !== trackId) return tr;
        return {
          ...tr,
          keys: tr.keys.map((k, i) => {
            if (i !== index) return k;
            if (!broken && k.tanOut && k.tanIn) {
              const slope = k.tanOut.dy / Math.max(k.tanOut.dx, 1e-6);
              return {
                ...k,
                broken: false,
                tanIn: { dx: k.tanIn.dx, dy: -slope * k.tanIn.dx },
              };
            }
            return { ...k, broken };
          }),
        };
      }),
    });
  },

  insertCurveKey: (trackId, t, v) => {
    const tr = get().tracks.find((x) => x.id === trackId);
    if (!tr || tr.expr) return;
    get().pushHistory();
    const snapped = Math.round(t * 1000) / 1000;
    const next = upsertKey(get().tracks, tr.objectId, tr.channel, snapped, v);
    const idx = next.findIndex((x) => x.objectId === tr.objectId && x.channel === tr.channel);
    if (idx < 0) return;
    const track = next[idx]!;
    const ki = track.keys.findIndex((k) => Math.abs(k.t - snapped) < 1 / 120);
    const keys = ki >= 0 ? ensureBezierTangents(track.keys, ki) : track.keys;
    const patched = next.slice();
    patched[idx] = { ...track, keys };
    set({
      tracks: patched,
      selectedTrackId: track.id,
      selectedKeyIndex: ki >= 0 ? ki : null,
      selectedId: tr.objectId,
    });
  },

  addExpression: (objectId, channel, kind) => {
    const node = get().nodes[objectId];
    if (!node) return;
    get().pushHistory();
    const rest = getChannelValue(node, channel);
    const expr: AnimExpr =
      kind === "ramp"
        ? { kind: "ramp", rate: Math.PI / 4, offset: rest }
        : { kind, amp: channel.startsWith("rotation") ? 0.4 : 0.5, period: 2, phase: 0, offset: rest };
    const tracks = get().tracks;
    const idx = tracks.findIndex((t) => t.objectId === objectId && t.channel === channel);
    if (idx >= 0) {
      const next = tracks.slice();
      next[idx] = { ...next[idx]!, expr, cycle: true };
      set({ tracks: next, selectedTrackId: next[idx]!.id });
      return;
    }
    const tr: Track = { id: nid("tr"), objectId, channel, keys: [], cycle: true, expr };
    set({ tracks: [...tracks, tr], selectedTrackId: tr.id });
  },

  updateExpr: (trackId, patch) => {
    set({
      tracks: get().tracks.map((tr) => {
        if (tr.id !== trackId || !tr.expr) return tr;
        return { ...tr, expr: { ...tr.expr, ...patch } as AnimExpr };
      }),
    });
  },

  clearExpression: (trackId) => {
    get().pushHistory();
    set({
      tracks: get().tracks.map((tr) =>
        tr.id === trackId ? { ...tr, expr: undefined } : tr,
      ),
    });
  },

  copyPose: () => {
    const { selectedId, nodes, tracks, currentTime } = get();
    if (!selectedId) return;
    const node = nodes[selectedId];
    if (!node) return;
    const ev = evalNode(node, tracks, currentTime);
    set({
      poseClipboard: {
        position: { ...ev.position },
        rotation: { ...ev.rotation },
        scale: { ...ev.scale },
      },
    });
  },

  pastePose: () => {
    const { selectedId, poseClipboard } = get();
    if (!selectedId || !poseClipboard) return;
    get().pushHistory();
    get().updateTransform(selectedId, {
      position: { ...poseClipboard.position },
      rotation: { ...poseClipboard.rotation },
      scale: { ...poseClipboard.scale },
    });
  },

  frameSelection: () => {
    const { playbackStart, playbackEnd } = get();
    set({ viewStart: playbackStart, viewEnd: playbackEnd });
  },
  frameAll: () => {
    const { duration, playbackEnd } = get();
    const end = duration > 120 ? Math.max(playbackEnd, 24) : duration;
    set({ viewStart: 0, viewEnd: end });
  },
}));

function upsertKey(
  tracks: Track[],
  objectId: string,
  channel: Channel,
  t: number,
  value: number,
): Track[] {
  const idx = tracks.findIndex((tr) => tr.objectId === objectId && tr.channel === channel);
  const snapped = Math.round(t * 1000) / 1000;
  if (idx === -1) {
    return [
      ...tracks,
      {
        id: nid("tr"),
        objectId,
        channel,
        cycle: false,
        keys: [{ t: snapped, v: value, interp: "easeInOut" }],
      },
    ];
  }
  const tr = tracks[idx]!;
  if (tr.expr) {
    return tracks;
  }
  const existing = tr.keys.findIndex((k) => Math.abs(k.t - snapped) < 1 / 120);
  const keys =
    existing >= 0
      ? tr.keys.map((k, i) => (i === existing ? { ...k, v: value } : k))
      : [...tr.keys, { t: snapped, v: value, interp: "easeInOut" as Interp }].sort(
          (a, b) => a.t - b.t,
        );
  const next = tracks.slice();
  next[idx] = { ...tr, keys };
  return next;
}

export function rootIds(nodes: Record<string, SceneNode>): string[] {
  return Object.values(nodes)
    .filter((n) => n.parentId === null)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((n) => n.id);
}

export function childIds(nodes: Record<string, SceneNode>, parentId: string): string[] {
  return Object.values(nodes)
    .filter((n) => n.parentId === parentId)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((n) => n.id);
}

export { CHANNELS, wouldCycle };
export type { CameraAim };
