import { nid } from "./ids";
import {
  DEFAULT_MATERIAL,
  TWO_HUNDRED_HOURS,
  type Channel,
  type Interp,
  type IkChain,
  type Key,
  type MaterialProps,
  type MeshShape,
  type ProjectSnapshot,
  type SceneNode,
  type Track,
  vec3,
} from "./types";

function mat(partial: Partial<MaterialProps> = {}): MaterialProps {
  return { ...DEFAULT_MATERIAL, ...partial };
}

function node(
  partial: Omit<SceneNode, "visible" | "locked" | "castShadow" | "receiveShadow" | "position" | "rotation" | "scale"> &
    Partial<SceneNode>,
): SceneNode {
  return {
    visible: true,
    locked: false,
    castShadow: partial.kind === "mesh",
    receiveShadow: partial.kind === "mesh",
    position: vec3(),
    rotation: vec3(),
    scale: vec3(1, 1, 1),
    ...partial,
  };
}

function keys(pairs: Array<[number, number]>, interp: Interp = "easeInOut"): Key[] {
  return pairs.map(([t, v]) => ({ t, v, interp }));
}

function track(objectId: string, channel: Channel, opts: Partial<Track> = {}): Track {
  return {
    id: nid("tr"),
    objectId,
    channel,
    keys: opts.keys ?? [],
    cycle: opts.cycle ?? true,
    expr: opts.expr,
  };
}

function walk(id: string, channel: Channel, samples: Array<[number, number]>): Track {
  return track(id, channel, { cycle: true, keys: keys(samples, "smooth") });
}

export function emptyProject(): ProjectSnapshot {
  const key = node({
    id: "key_light",
    name: "Key Light",
    kind: "light",
    parentId: null,
    position: vec3(4.5, 6.5, 3.5),
    light: {
      type: "directional",
      color: "#fff4e8",
      intensity: 2.1,
      distance: 0,
      angle: 0.4,
      penumbra: 0.3,
    },
  });
  const hemi = node({
    id: "hemi",
    name: "Sky Light",
    kind: "light",
    parentId: null,
    position: vec3(0, 4, 0),
    light: {
      type: "hemisphere",
      color: "#9aabc0",
      intensity: 0.38,
      distance: 0,
      angle: 0,
      penumbra: 0,
    },
  });
  const cam = node({
    id: "shot_cam",
    name: "Shot Camera",
    kind: "camera",
    parentId: null,
    position: vec3(5.2, 2.6, 6.1),
    rotation: vec3(-0.28, 0.7, 0),
    camera: { fov: 35, near: 0.05, far: 200, aim: "origin" },
  });
  return {
    v: 1,
    name: "Untitled",
    nodes: { [key.id]: key, [hemi.id]: hemi, [cam.id]: cam },
    tracks: [],
    duration: 8,
    playbackStart: 0,
    playbackEnd: 8,
    fps: 24,
  };
}

export function bounceProject(): ProjectSnapshot {
  const base = emptyProject();
  const floor = node({
    id: "floor",
    name: "Floor",
    kind: "mesh",
    parentId: null,
    shape: { type: "disk", r: 5, h: 0.08 } satisfies MeshShape,
    material: mat({ color: "#1c1f25", roughness: 0.86, metalness: 0.04 }),
    receiveShadow: true,
    castShadow: false,
  });
  const ball = node({
    id: "ball",
    name: "Ball",
    kind: "mesh",
    parentId: null,
    position: vec3(0, 0.42, 0),
    shape: { type: "sphere", r: 0.42 },
    material: mat({ color: "#c9b8a0", roughness: 0.28, metalness: 0.12 }),
  });
  const fill = node({
    id: "fill",
    name: "Fill Light",
    kind: "light",
    parentId: null,
    position: vec3(-4, 3, -2),
    light: {
      type: "directional",
      color: "#c5d6ea",
      intensity: 0.55,
      distance: 0,
      angle: 0,
      penumbra: 0,
    },
  });
  return {
    v: 1,
    name: "Ball Bounce",
    nodes: { ...base.nodes, [floor.id]: floor, [ball.id]: ball, [fill.id]: fill },
    tracks: [
      track("ball", "position.y", {
        cycle: true,
        keys: keys([
          [0, 0.42],
          [0.45, 2.15],
          [0.9, 0.42],
          [1.35, 1.55],
          [1.8, 0.42],
          [2.15, 1.05],
          [2.5, 0.42],
        ]),
      }),
      track("ball", "scale.y", {
        cycle: true,
        keys: keys(
          [
            [0, 0.72],
            [0.08, 1.12],
            [0.45, 1],
            [0.82, 1.1],
            [0.9, 0.72],
            [1.0, 1.1],
            [1.8, 0.76],
            [2.5, 0.72],
          ],
          "smooth",
        ),
      }),
      track("ball", "scale.x", {
        cycle: true,
        keys: keys(
          [
            [0, 1.18],
            [0.08, 0.94],
            [0.45, 1],
            [0.9, 1.18],
            [1.8, 1.14],
            [2.5, 1.18],
          ],
          "smooth",
        ),
      }),
      track("ball", "scale.z", {
        cycle: true,
        keys: keys(
          [
            [0, 1.18],
            [0.08, 0.94],
            [0.45, 1],
            [0.9, 1.18],
            [1.8, 1.14],
            [2.5, 1.18],
          ],
          "smooth",
        ),
      }),
    ],
    duration: 2.5,
    playbackStart: 0,
    playbackEnd: 2.5,
    fps: 24,
  };
}

export function twoHundredHourLoop(): ProjectSnapshot {
  const ceramic = mat({ color: "#e8e0d4", roughness: 0.38, metalness: 0.06 });
  const charcoal = mat({ color: "#2a2e36", roughness: 0.55, metalness: 0.18 });
  const steel = mat({ color: "#8aa4b8", roughness: 0.32, metalness: 0.62 });
  const stageMat = mat({ color: "#16181d", roughness: 0.78, metalness: 0.12 });

  const stage = node({
    id: "stage",
    name: "Stage",
    kind: "mesh",
    parentId: null,
    shape: { type: "disk", r: 4.4, h: 0.1 },
    material: stageMat,
    receiveShadow: true,
    castShadow: false,
  });
  const ring = node({
    id: "ring",
    name: "Stage Ring",
    kind: "mesh",
    parentId: null,
    position: vec3(0, 0.08, 0),
    rotation: vec3(Math.PI / 2, 0, 0),
    shape: { type: "torus", r: 4.35, tube: 0.035 },
    material: steel,
    castShadow: false,
  });

  const sculpture = node({
    id: "sculpture",
    name: "Sculpture",
    kind: "group",
    parentId: null,
  });
  const plinth = node({
    id: "plinth",
    name: "Plinth",
    kind: "mesh",
    parentId: "sculpture",
    position: vec3(0, 0.28, 0),
    shape: { type: "cylinder", rt: 0.55, rb: 0.62, h: 0.56 },
    material: charcoal,
  });
  const core = node({
    id: "core",
    name: "Core",
    kind: "mesh",
    parentId: "sculpture",
    position: vec3(0, 1.05, 0),
    shape: { type: "box", w: 0.55, h: 0.55, d: 0.55 },
    material: ceramic,
  });
  const orb = node({
    id: "orb",
    name: "Orb",
    kind: "mesh",
    parentId: "sculpture",
    position: vec3(0, 1.62, 0),
    shape: { type: "sphere", r: 0.28 },
    material: mat({
      color: "#c5d2de",
      roughness: 0.18,
      metalness: 0.4,
      emissive: "#8aa4b8",
      emissiveIntensity: 0.35,
    }),
  });
  const halo = node({
    id: "halo",
    name: "Halo",
    kind: "mesh",
    parentId: "sculpture",
    position: vec3(0, 1.62, 0),
    rotation: vec3(Math.PI / 2.4, 0.4, 0),
    shape: { type: "torus", r: 0.52, tube: 0.03 },
    material: steel,
  });

  const figure = node({
    id: "figure",
    name: "Figure",
    kind: "group",
    parentId: null,
    position: vec3(2.4, 0, 0),
  });
  const hips = node({
    id: "hips",
    name: "Hips",
    kind: "mesh",
    parentId: "figure",
    position: vec3(0, 1.02, 0),
    shape: { type: "capsule", r: 0.11, h: 0.08 },
    material: ceramic,
  });
  const torso = node({
    id: "torso",
    name: "Torso",
    kind: "mesh",
    parentId: "hips",
    position: vec3(0, 0.22, 0),
    shape: { type: "capsule", r: 0.145, h: 0.3 },
    material: ceramic,
  });
  const head = node({
    id: "head",
    name: "Head",
    kind: "mesh",
    parentId: "torso",
    position: vec3(0, 0.38, 0.02),
    shape: { type: "sphere", r: 0.125 },
    material: ceramic,
  });

  const limb = (
    id: string,
    name: string,
    parentId: string,
    pos: ReturnType<typeof vec3>,
    r: number,
    h: number,
    rot = vec3(),
  ) =>
    node({
      id,
      name,
      kind: "mesh",
      parentId,
      position: pos,
      rotation: rot,
      anchor: "top",
      shape: { type: "capsule", r, h },
      material: ceramic,
    });

  const armL = limb("armL", "Arm L", "torso", vec3(-0.2, 0.14, 0), 0.045, 0.26, vec3(0, 0, 0.12));
  const forearmL = limb("forearmL", "Forearm L", "armL", vec3(0, -0.35, 0), 0.04, 0.24);
  const armR = limb("armR", "Arm R", "torso", vec3(0.2, 0.14, 0), 0.045, 0.26, vec3(0, 0, -0.12));
  const forearmR = limb("forearmR", "Forearm R", "armR", vec3(0, -0.35, 0), 0.04, 0.24);
  const thighL = limb("thighL", "Thigh L", "hips", vec3(-0.09, -0.06, 0), 0.06, 0.34);
  const shinL = limb("shinL", "Shin L", "thighL", vec3(0, -0.46, 0), 0.05, 0.34);
  const thighR = limb("thighR", "Thigh R", "hips", vec3(0.09, -0.06, 0), 0.06, 0.34);
  const shinR = limb("shinR", "Shin R", "thighR", vec3(0, -0.46, 0), 0.05, 0.34);

  const ikLoc = (id: string, name: string, pos: ReturnType<typeof vec3>) =>
    node({
      id,
      name,
      kind: "group",
      parentId: "figure",
      position: pos,
    });
  const ikHandL = ikLoc("ik_handL", "IK Hand L", vec3(-0.42, 0.82, 0.02));
  const ikHandR = ikLoc("ik_handR", "IK Hand R", vec3(0.42, 0.82, 0.02));
  const ikFootL = ikLoc("ik_footL", "IK Foot L", vec3(-0.12, 0.06, 0.02));
  const ikFootR = ikLoc("ik_footR", "IK Foot R", vec3(0.12, 0.06, 0.02));
  const ikPoleArmL = ikLoc("ik_poleArmL", "Pole Elbow L", vec3(-0.55, 1.15, -0.38));
  const ikPoleArmR = ikLoc("ik_poleArmR", "Pole Elbow R", vec3(0.55, 1.15, -0.38));
  const ikPoleLegL = ikLoc("ik_poleLegL", "Pole Knee L", vec3(-0.22, 0.52, 0.42));
  const ikPoleLegR = ikLoc("ik_poleLegR", "Pole Knee R", vec3(0.22, 0.52, 0.42));

  const ikChains: IkChain[] = [
    { id: "ik_armL", name: "Arm L", upperId: "armL", lowerId: "forearmL", targetId: "ik_handL", poleId: "ik_poleArmL", enabled: false },
    { id: "ik_armR", name: "Arm R", upperId: "armR", lowerId: "forearmR", targetId: "ik_handR", poleId: "ik_poleArmR", enabled: false },
    { id: "ik_legL", name: "Leg L", upperId: "thighL", lowerId: "shinL", targetId: "ik_footL", poleId: "ik_poleLegL", enabled: false },
    { id: "ik_legR", name: "Leg R", upperId: "thighR", lowerId: "shinR", targetId: "ik_footR", poleId: "ik_poleLegR", enabled: false },
  ];

  const key = node({
    id: "key_light",
    name: "Key Light",
    kind: "light",
    parentId: null,
    position: vec3(5.2, 7.2, 4.1),
    light: {
      type: "directional",
      color: "#fff1dd",
      intensity: 2.35,
      distance: 0,
      angle: 0.35,
      penumbra: 0.4,
    },
  });
  const fill = node({
    id: "fill_light",
    name: "Fill Light",
    kind: "light",
    parentId: null,
    position: vec3(-5.4, 3.8, -1.5),
    light: {
      type: "directional",
      color: "#9bb4c9",
      intensity: 0.55,
      distance: 0,
      angle: 0,
      penumbra: 0,
    },
  });
  const rim = node({
    id: "rim_light",
    name: "Rim Light",
    kind: "light",
    parentId: null,
    position: vec3(-1.2, 4.8, -6.2),
    light: {
      type: "directional",
      color: "#d7e4f0",
      intensity: 1.35,
      distance: 0,
      angle: 0,
      penumbra: 0,
    },
  });
  const hemi = node({
    id: "hemi",
    name: "Sky Light",
    kind: "light",
    parentId: null,
    position: vec3(0, 6, 0),
    light: {
      type: "hemisphere",
      color: "#8ea0b5",
      intensity: 0.32,
      distance: 0,
      angle: 0,
      penumbra: 0,
    },
  });
  const spark = node({
    id: "spark",
    name: "Spark",
    kind: "light",
    parentId: null,
    position: vec3(1.6, 2.4, 1.2),
    light: {
      type: "point",
      color: "#e8e0d4",
      intensity: 1.8,
      distance: 8,
      angle: 0,
      penumbra: 0,
    },
  });
  const cam = node({
    id: "shot_cam",
    name: "Shot Camera",
    kind: "camera",
    parentId: null,
    position: vec3(6.2, 3.1, 7.4),
    rotation: vec3(-0.32, 0.68, 0),
    camera: { fov: 32, near: 0.05, far: 200, aim: "origin" },
  });

  const nodes: Record<string, SceneNode> = {
    [stage.id]: stage,
    [ring.id]: ring,
    [sculpture.id]: sculpture,
    [plinth.id]: plinth,
    [core.id]: core,
    [orb.id]: orb,
    [halo.id]: halo,
    [figure.id]: figure,
    [hips.id]: hips,
    [torso.id]: torso,
    [head.id]: head,
    [armL.id]: armL,
    [forearmL.id]: forearmL,
    [armR.id]: armR,
    [forearmR.id]: forearmR,
    [thighL.id]: thighL,
    [shinL.id]: shinL,
    [thighR.id]: thighR,
    [shinR.id]: shinR,
    [ikHandL.id]: ikHandL,
    [ikHandR.id]: ikHandR,
    [ikFootL.id]: ikFootL,
    [ikFootR.id]: ikFootR,
    [ikPoleArmL.id]: ikPoleArmL,
    [ikPoleArmR.id]: ikPoleArmR,
    [ikPoleLegL.id]: ikPoleLegL,
    [ikPoleLegR.id]: ikPoleLegR,
    [key.id]: key,
    [fill.id]: fill,
    [rim.id]: rim,
    [hemi.id]: hemi,
    [spark.id]: spark,
    [cam.id]: cam,
  };

  const W = 1;
  const tracks: Track[] = [
    track("figure", "position.x", {
      expr: { kind: "cos", amp: 2.4, period: 7, phase: 0, offset: 0 },
    }),
    track("figure", "position.z", {
      expr: { kind: "sin", amp: 2.4, period: 7, phase: 0, offset: 0 },
    }),
    track("figure", "rotation.y", {
      expr: { kind: "ramp", rate: (-Math.PI * 2) / 7, offset: 0 },
    }),
    walk("thighL", "rotation.x", [
      [0, -0.55],
      [0.25, 0.08],
      [0.5, 0.52],
      [0.75, 0.06],
      [W, -0.55],
    ]),
    walk("thighR", "rotation.x", [
      [0, 0.52],
      [0.25, 0.06],
      [0.5, -0.55],
      [0.75, 0.08],
      [W, 0.52],
    ]),
    walk("shinL", "rotation.x", [
      [0, 0.12],
      [0.2, 0.18],
      [0.38, 0.92],
      [0.55, 0.22],
      [0.78, 0.1],
      [W, 0.12],
    ]),
    walk("shinR", "rotation.x", [
      [0, 0.22],
      [0.28, 0.1],
      [0.5, 0.12],
      [0.7, 0.18],
      [0.88, 0.92],
      [W, 0.22],
    ]),
    walk("armL", "rotation.x", [
      [0, 0.48],
      [0.5, -0.42],
      [W, 0.48],
    ]),
    walk("armR", "rotation.x", [
      [0, -0.42],
      [0.5, 0.48],
      [W, -0.42],
    ]),
    walk("forearmL", "rotation.x", [
      [0, 0.22],
      [0.5, 0.55],
      [W, 0.22],
    ]),
    walk("forearmR", "rotation.x", [
      [0, 0.55],
      [0.5, 0.22],
      [W, 0.55],
    ]),
    walk("hips", "position.y", [
      [0, 1.02],
      [0.25, 1.055],
      [0.5, 1.02],
      [0.75, 1.055],
      [W, 1.02],
    ]),
    walk("hips", "rotation.z", [
      [0, 0.04],
      [0.5, -0.04],
      [W, 0.04],
    ]),
    walk("torso", "rotation.y", [
      [0, 0.06],
      [0.5, -0.06],
      [W, 0.06],
    ]),
    walk("head", "rotation.y", [
      [0, -0.08],
      [0.5, 0.08],
      [W, -0.08],
    ]),
    track("sculpture", "rotation.y", {
      expr: { kind: "ramp", rate: (Math.PI * 2) / 23, offset: 0 },
    }),
    track("halo", "rotation.z", {
      expr: { kind: "ramp", rate: (Math.PI * 2) / 13, offset: 0 },
    }),
    track("orb", "emissiveIntensity", {
      expr: { kind: "sin", amp: 0.28, period: 11, phase: 0, offset: 0.4 },
    }),
    track("core", "rotation.y", {
      expr: { kind: "ramp", rate: (-Math.PI * 2) / 19, offset: 0.4 },
    }),
    track("key_light", "intensity", {
      expr: { kind: "sin", amp: 0.35, period: 11, phase: 0.4, offset: 2.35 },
    }),
    track("fill_light", "intensity", {
      expr: { kind: "sin", amp: 0.18, period: 13, phase: 1.2, offset: 0.55 },
    }),
    track("rim_light", "intensity", {
      expr: { kind: "sin", amp: 0.4, period: 19, phase: 0.2, offset: 1.35 },
    }),
    track("spark", "position.x", {
      expr: { kind: "cos", amp: 2.1, period: 17, phase: 0.5, offset: 0 },
    }),
    track("spark", "position.z", {
      expr: { kind: "sin", amp: 2.1, period: 17, phase: 0.5, offset: 0 },
    }),
    track("spark", "position.y", {
      expr: { kind: "sin", amp: 0.55, period: 17, phase: 1.4, offset: 2.3 },
    }),
    track("spark", "intensity", {
      expr: { kind: "sin", amp: 0.7, period: 17, phase: 0, offset: 1.6 },
    }),
    track("shot_cam", "position.x", {
      expr: { kind: "cos", amp: 7.4, period: 17, phase: 0.2, offset: 0 },
    }),
    track("shot_cam", "position.z", {
      expr: { kind: "sin", amp: 7.4, period: 17, phase: 0.2, offset: 0 },
    }),
    track("shot_cam", "position.y", {
      expr: { kind: "sin", amp: 0.45, period: 17, phase: 1.1, offset: 3.15 },
    }),
    track("shot_cam", "rotation.y", {
      expr: { kind: "ramp", rate: (-Math.PI * 2) / 17, offset: Math.PI },
    }),
  ];

  return {
    v: 1,
    name: "Nested Cycles",
    nodes,
    tracks,
    duration: TWO_HUNDRED_HOURS,
    playbackStart: 0,
    playbackEnd: 8,
    fps: 24,
    ikChains,
  };
}

export const PRESETS = [
  { id: "loop", label: "Nested Cycles", factory: twoHundredHourLoop },
  { id: "bounce", label: "Ball Bounce", factory: bounceProject },
  { id: "empty", label: "Empty Stage", factory: emptyProject },
] as const;
