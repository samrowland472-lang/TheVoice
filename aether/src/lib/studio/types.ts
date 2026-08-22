export type Vec3 = { x: number; y: number; z: number };

export type MeshShape =
  | { type: "box"; w: number; h: number; d: number }
  | { type: "sphere"; r: number }
  | { type: "cylinder"; rt: number; rb: number; h: number }
  | { type: "cone"; r: number; h: number }
  | { type: "torus"; r: number; tube: number }
  | { type: "plane"; w: number; h: number }
  | { type: "capsule"; r: number; h: number }
  | { type: "disk"; r: number; h: number };

export type ObjectKind = "mesh" | "light" | "camera" | "group";

export type LightKind = "directional" | "point" | "spot" | "hemisphere";

export type MaterialProps = {
  color: string;
  roughness: number;
  metalness: number;
  emissive: string;
  emissiveIntensity: number;
  opacity: number;
};

export type LightProps = {
  type: LightKind;
  color: string;
  intensity: number;
  distance: number;
  angle: number;
  penumbra: number;
};

export type CameraAim = "free" | "origin";

export type CameraProps = {
  fov: number;
  near: number;
  far: number;
  aim?: CameraAim;
};

export type SceneNode = {
  id: string;
  name: string;
  kind: ObjectKind;
  parentId: string | null;
  visible: boolean;
  locked: boolean;
  castShadow: boolean;
  receiveShadow: boolean;
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
  shape?: MeshShape;
  material?: MaterialProps;
  light?: LightProps;
  camera?: CameraProps;
  /** Geometry offset so rotation pivots from the top of a limb. */
  anchor?: "center" | "top";
};

export type Interp =
  | "linear"
  | "step"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "smooth"
  | "bounce"
  | "bezier";

export const INTERPS: Interp[] = [
  "linear",
  "step",
  "easeIn",
  "easeOut",
  "easeInOut",
  "smooth",
  "bounce",
  "bezier",
];

export type Channel =
  | "position.x"
  | "position.y"
  | "position.z"
  | "rotation.x"
  | "rotation.y"
  | "rotation.z"
  | "scale.x"
  | "scale.y"
  | "scale.z"
  | "intensity"
  | "emissiveIntensity"
  | "opacity"
  | "fov";

export type AnimExpr =
  | {
      kind: "sin";
      amp: number;
      period: number;
      phase: number;
      offset: number;
    }
  | {
      kind: "cos";
      amp: number;
      period: number;
      phase: number;
      offset: number;
    }
  | { kind: "ramp"; rate: number; offset: number };

export type Tangent = { dx: number; dy: number };

export type Key = {
  t: number;
  v: number;
  interp: Interp;
  tanIn?: Tangent;
  tanOut?: Tangent;
  /** Independent in/out handles. Default is unified (mirrored slope). */
  broken?: boolean;
};

export type Track = {
  id: string;
  objectId: string;
  channel: Channel;
  keys: Key[];
  cycle: boolean;
  expr?: AnimExpr;
};

export type Tool = "select" | "translate" | "rotate" | "scale";
export type Shading = "wire" | "solid" | "material" | "rendered";
export type BottomTab = "dope" | "curves" | "cycles";
export type TransformSpace = "world" | "local";

export type PoseClipboard = {
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
};

export type ProjectSnapshot = {
  v: 1;
  name: string;
  nodes: Record<string, SceneNode>;
  tracks: Track[];
  duration: number;
  playbackStart: number;
  playbackEnd: number;
  fps: number;
};

export const CHANNELS: Channel[] = [
  "position.x",
  "position.y",
  "position.z",
  "rotation.x",
  "rotation.y",
  "rotation.z",
  "scale.x",
  "scale.y",
  "scale.z",
  "intensity",
  "emissiveIntensity",
  "opacity",
  "fov",
];

export const TRANSFORM_CHANNELS: Channel[] = [
  "position.x",
  "position.y",
  "position.z",
  "rotation.x",
  "rotation.y",
  "rotation.z",
  "scale.x",
  "scale.y",
  "scale.z",
];

export function vec3(x = 0, y = 0, z = 0): Vec3 {
  return { x, y, z };
}

export const DEFAULT_MATERIAL: MaterialProps = {
  color: "#d8d2c8",
  roughness: 0.42,
  metalness: 0.08,
  emissive: "#000000",
  emissiveIntensity: 0,
  opacity: 1,
};

export const TWO_HUNDRED_HOURS = 200 * 3600;
