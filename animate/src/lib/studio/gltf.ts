import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { nid, uniqueName } from "./ids";
import {
  DEFAULT_MATERIAL,
  type LightKind,
  type MeshGeometry,
  type SceneNode,
  vec3,
} from "./types";

const MAX_VERTS = 120_000;
const MAX_NODES = 120;
const STAGE = 3.4;

function roundArr(src: ArrayLike<number>, digits = 4): number[] {
  const m = 10 ** digits;
  const out = new Array<number>(src.length);
  for (let i = 0; i < src.length; i++) out[i] = Math.round(src[i]! * m) / m;
  return out;
}

export function bufferFromMeshGeometry(geo: MeshGeometry): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(geo.position, 3));
  if (geo.normal && geo.normal.length === geo.position.length) {
    g.setAttribute("normal", new THREE.Float32BufferAttribute(geo.normal, 3));
  } else {
    g.computeVertexNormals();
  }
  if (geo.uv && geo.uv.length === (geo.position.length / 3) * 2) {
    g.setAttribute("uv", new THREE.Float32BufferAttribute(geo.uv, 2));
  }
  if (geo.index && geo.index.length) {
    g.setIndex(geo.index);
  }
  return g;
}

function extractGeometry(mesh: THREE.Mesh): MeshGeometry | null {
  const src = mesh.geometry;
  const pos = src.getAttribute("position");
  if (!pos || pos.count < 3) return null;
  const geometry: MeshGeometry = { position: roundArr(pos.array) };
  const nrm = src.getAttribute("normal");
  if (nrm && nrm.count === pos.count) geometry.normal = roundArr(nrm.array);
  const uv = src.getAttribute("uv");
  if (uv && uv.count === pos.count) geometry.uv = roundArr(uv.array, 5);
  if (src.index && src.index.count) {
    geometry.index = Array.from(src.index.array as ArrayLike<number>);
  }
  return geometry;
}

function colorHex(c: THREE.Color): string {
  return `#${c.getHexString()}`;
}

function materialFrom(mesh: THREE.Mesh): SceneNode["material"] {
  const raw = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
  const mat = raw as THREE.MeshStandardMaterial | undefined;
  if (!mat) return { ...DEFAULT_MATERIAL };
  const color = mat.color ? colorHex(mat.color) : DEFAULT_MATERIAL.color;
  const emissive = mat.emissive ? colorHex(mat.emissive) : "#000000";
  return {
    color,
    roughness: typeof mat.roughness === "number" ? mat.roughness : 0.42,
    metalness: typeof mat.metalness === "number" ? mat.metalness : 0.08,
    emissive,
    emissiveIntensity: typeof mat.emissiveIntensity === "number" ? mat.emissiveIntensity : 0,
    opacity: typeof mat.opacity === "number" ? mat.opacity : 1,
  };
}

function lightKind(light: THREE.Light): LightKind | null {
  if ((light as THREE.DirectionalLight).isDirectionalLight) return "directional";
  if ((light as THREE.PointLight).isPointLight) return "point";
  if ((light as THREE.SpotLight).isSpotLight) return "spot";
  if ((light as THREE.HemisphereLight).isHemisphereLight) return "hemisphere";
  return null;
}

function eulerYxz(obj: THREE.Object3D) {
  const e = new THREE.Euler().setFromQuaternion(obj.quaternion, "YXZ");
  return vec3(e.x, e.y, e.z);
}

function stem(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[_\-]+/g, " ").trim() || "Import";
}

export async function parseGltfFile(file: File): Promise<{ nodes: SceneNode[]; rootId: string }> {
  const loader = new GLTFLoader();
  const gltf = await new Promise<{ scene: THREE.Group }>((resolve, reject) => {
    const fail = (err: unknown) =>
      reject(
        err instanceof Error
          ? err
          : new Error("Could not parse glTF. Use a .glb so buffers travel with the file."),
      );
    if (file.name.toLowerCase().endsWith(".gltf")) {
      void file.text().then((text) => loader.parse(text, "", resolve, fail));
    } else {
      void file.arrayBuffer().then((buf) => loader.parse(buf, "", resolve, fail));
    }
  });

  const scene = gltf.scene;
  scene.updateWorldMatrix(true, true);

  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z, 1e-4);
  const fit = STAGE / maxDim;
  const center = new THREE.Vector3();
  box.getCenter(center);

  const existing: Record<string, SceneNode> = {};
  const nodes: SceneNode[] = [];
  let verts = 0;
  let count = 0;

  const rootId = nid("imp");
  const root: SceneNode = {
    id: rootId,
    name: uniqueName(existing, stem(file.name)),
    kind: "group",
    parentId: null,
    visible: true,
    locked: false,
    castShadow: false,
    receiveShadow: false,
    position: vec3(-center.x * fit, -box.min.y * fit, -center.z * fit),
    rotation: vec3(),
    scale: vec3(fit, fit, fit),
  };
  existing[rootId] = root;
  nodes.push(root);

  const walk = (obj: THREE.Object3D, parentId: string) => {
    if (count >= MAX_NODES) return;
    if ((obj as THREE.Bone).isBone) {
      for (const child of obj.children) walk(child, parentId);
      return;
    }

    const mesh = obj as THREE.Mesh;
    const light = obj as THREE.Light;
    const cam = obj as THREE.PerspectiveCamera;
    const isMesh = mesh.isMesh === true;
    const isLight = light.isLight === true;
    const isCamera = cam.isPerspectiveCamera === true && obj.parent !== null;
    const hasKids = obj.children.length > 0;
    if (!isMesh && !isLight && !isCamera && !hasKids) return;

    let geometry: MeshGeometry | undefined;
    if (isMesh) {
      const extracted = extractGeometry(mesh);
      if (extracted) {
        const n = extracted.position.length / 3;
        if (verts + n > MAX_VERTS) return;
        verts += n;
        geometry = extracted;
      }
    }

    count += 1;
    const id = nid("imp");
    const node: SceneNode = {
      id,
      name: uniqueName(existing, obj.name || (isMesh ? "Mesh" : isLight ? "Light" : isCamera ? "Camera" : "Group")),
      kind: isMesh ? "mesh" : isLight ? "light" : isCamera ? "camera" : "group",
      parentId,
      visible: obj.visible,
      locked: false,
      castShadow: isMesh ? mesh.castShadow : false,
      receiveShadow: isMesh ? mesh.receiveShadow : false,
      position: vec3(obj.position.x, obj.position.y, obj.position.z),
      rotation: eulerYxz(obj),
      scale: vec3(obj.scale.x, obj.scale.y, obj.scale.z),
    };

    if (isMesh) {
      node.geometry = geometry;
      node.material = materialFrom(mesh);
      node.castShadow = true;
      node.receiveShadow = true;
    } else if (isLight) {
      const kind = lightKind(light) ?? "point";
      const spot = light as THREE.SpotLight;
      node.light = {
        type: kind,
        color: colorHex(light.color),
        intensity: light.intensity || 1,
        distance: "distance" in light ? (light as THREE.PointLight).distance || 12 : 0,
        angle: kind === "spot" ? spot.angle || 0.4 : 0.4,
        penumbra: kind === "spot" ? spot.penumbra || 0.3 : 0.3,
      };
    } else if (isCamera) {
      node.camera = { fov: cam.fov || 35, near: cam.near || 0.05, far: cam.far || 200, aim: "free" };
    }

    existing[id] = node;
    nodes.push(node);
    for (const child of obj.children) walk(child, id);
  };

  for (const child of scene.children) walk(child, rootId);

  if (nodes.length <= 1) {
    throw new Error("No meshes found in that glTF.");
  }

  return { nodes, rootId };
}
