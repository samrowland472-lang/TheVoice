import * as THREE from "three";
import { objectRegistry } from "./registry";
import type { SceneNode, Vec3 } from "./types";

const pos = new THREE.Vector3();
const quat = new THREE.Quaternion();
const scl = new THREE.Vector3();
const euler = new THREE.Euler();
const inv = new THREE.Matrix4();
const pPos = new THREE.Vector3();
const pQuat = new THREE.Quaternion();
const pScl = new THREE.Vector3();

export function wouldCycle(
  nodes: Record<string, SceneNode>,
  id: string,
  newParent: string | null,
): boolean {
  let p = newParent;
  const seen = new Set<string>();
  while (p) {
    if (p === id) return true;
    if (seen.has(p)) return true;
    seen.add(p);
    p = nodes[p]?.parentId ?? null;
  }
  return false;
}

/** World transform of `id`, expressed in `parentId`'s local space (or world). */
export function captureAsChildOf(
  id: string,
  parentId: string | null,
): { position: Vec3; rotation: Vec3; scale: Vec3 } | null {
  const obj = objectRegistry.get(id);
  if (!obj) return null;
  obj.updateWorldMatrix(true, false);
  obj.matrixWorld.decompose(pos, quat, scl);
  if (parentId) {
    const parent = objectRegistry.get(parentId);
    if (parent) {
      parent.updateWorldMatrix(true, false);
      parent.matrixWorld.decompose(pPos, pQuat, pScl);
      inv.copy(parent.matrixWorld).invert();
      pos.applyMatrix4(inv);
      quat.premultiply(pQuat.clone().invert());
      scl.set(
        scl.x / Math.max(Math.abs(pScl.x), 1e-6),
        scl.y / Math.max(Math.abs(pScl.y), 1e-6),
        scl.z / Math.max(Math.abs(pScl.z), 1e-6),
      );
    }
  }
  euler.setFromQuaternion(quat, "XYZ");
  return {
    position: { x: pos.x, y: pos.y, z: pos.z },
    rotation: { x: euler.x, y: euler.y, z: euler.z },
    scale: { x: scl.x, y: scl.y, z: scl.z },
  };
}
