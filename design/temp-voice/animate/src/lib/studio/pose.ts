import * as THREE from "three";
import { evalNode } from "./eval";
import { applyIk } from "./ik";
import { objectRegistry } from "./registry";
import { useStudio } from "./store";
import type { SceneNode } from "./types";

export function applyEvaluatedPose(t: number, skipId?: string | null) {
  const s = useStudio.getState();
  for (const [id, obj] of objectRegistry) {
    if (skipId && id === skipId) continue;
    const node = s.nodes[id];
    if (!node) continue;
    const ev = evalNode(node, s.tracks, t);
    obj.position.set(ev.position.x, ev.position.y, ev.position.z);
    obj.rotation.set(ev.rotation.x, ev.rotation.y, ev.rotation.z);
    obj.scale.set(ev.scale.x, ev.scale.y, ev.scale.z);
    if (node.kind === "light") {
      const intensity = ev.intensity ?? node.light?.intensity ?? 1;
      obj.traverse((child) => {
        const l = child as THREE.Light;
        if (l.isLight) l.intensity = intensity;
      });
    }
    if (node.material && ev.emissiveIntensity !== undefined) {
      obj.traverse((child) => {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial | undefined;
        if (mat && mat.isMeshStandardMaterial) {
          mat.emissiveIntensity = ev.emissiveIntensity ?? mat.emissiveIntensity;
          if (ev.opacity !== undefined) {
            mat.opacity = ev.opacity;
            mat.transparent = ev.opacity < 1;
          }
        }
      });
    }
  }
  applyIk(s.nodes, s.ikChains);
}

export function applyShotCamera(camera: THREE.Camera, t: number, camNode: SceneNode) {
  const s = useStudio.getState();
  const ev = evalNode(camNode, s.tracks, t);
  camera.position.set(ev.position.x, ev.position.y, ev.position.z);
  const aim = camNode.camera?.aim ?? "free";
  if (aim === "origin") {
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 1.05, 0);
  } else {
    camera.rotation.order = "YXZ";
    camera.rotation.set(ev.rotation.x, ev.rotation.y, ev.rotation.z);
  }
  const persp = camera as THREE.PerspectiveCamera;
  if (persp.isPerspectiveCamera) {
    persp.fov = ev.fov ?? camNode.camera?.fov ?? 35;
    persp.updateProjectionMatrix();
  }
}
