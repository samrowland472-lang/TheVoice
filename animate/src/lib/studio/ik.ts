import * as THREE from "three";
import { objectRegistry } from "./registry";
import type { IkChain, SceneNode, Vec3 } from "./types";

const BONE = new THREE.Vector3(0, -1, 0);
const _a = new THREE.Vector3();
const _t = new THREE.Vector3();
const _p = new THREE.Vector3();
const _axis = new THREE.Vector3();
const _n = new THREE.Vector3();
const _bend = new THREE.Vector3();
const _upperDir = new THREE.Vector3();
const _lowerDir = new THREE.Vector3();
const _mid = new THREE.Vector3();
const _qp = new THREE.Quaternion();
const _e = new THREE.Euler();

export function boneLength(node: SceneNode): number {
  const sh = node.shape;
  if (sh?.type === "capsule") return sh.h + sh.r * 2;
  if (sh?.type === "box") return sh.h;
  if (sh?.type === "cylinder" || sh?.type === "cone") return sh.h;
  const d = Math.hypot(node.position.x, node.position.y, node.position.z);
  return d > 0.05 ? d : 0.25;
}

export function upperLength(upper: SceneNode, lower: SceneNode): number {
  const d = Math.hypot(lower.position.x, lower.position.y, lower.position.z);
  return d > 0.01 ? d : boneLength(upper);
}

function quatAim(dir: THREE.Vector3, poleHint: THREE.Vector3): THREE.Quaternion {
  const nd = dir.clone().normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(BONE, nd);
  const localZ = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
  const desired = poleHint.clone().addScaledVector(nd, -poleHint.dot(nd));
  if (desired.lengthSq() < 1e-8) return q;
  desired.normalize();
  const twist = new THREE.Quaternion().setFromUnitVectors(localZ, desired);
  return twist.multiply(q);
}

function setWorldRotation(obj: THREE.Object3D, worldQuat: THREE.Quaternion) {
  const parent = obj.parent;
  if (parent) {
    parent.updateWorldMatrix(true, false);
    parent.getWorldQuaternion(_qp);
    obj.quaternion.copy(_qp.invert().multiply(worldQuat));
  } else {
    obj.quaternion.copy(worldQuat);
  }
  _e.setFromQuaternion(obj.quaternion, "YXZ");
  obj.rotation.set(_e.x, _e.y, _e.z);
}

export function applyIk(nodes: Record<string, SceneNode>, chains: IkChain[]) {
  if (!chains.length) return;
  for (const chain of chains) {
    if (!chain.enabled) continue;
    const upperN = nodes[chain.upperId];
    const lowerN = nodes[chain.lowerId];
    const upper = objectRegistry.get(chain.upperId);
    const lower = objectRegistry.get(chain.lowerId);
    const target = objectRegistry.get(chain.targetId);
    const pole = objectRegistry.get(chain.poleId);
    if (!upperN || !lowerN || !upper || !lower || !target) continue;

    upper.updateWorldMatrix(true, false);
    target.updateWorldMatrix(true, false);
    pole?.updateWorldMatrix(true, false);

    upper.getWorldPosition(_a);
    target.getWorldPosition(_t);
    if (pole) pole.getWorldPosition(_p);
    else _p.copy(_a).add(new THREE.Vector3(0, 0, 1));

    const L1 = upperLength(upperN, lowerN);
    const L2 = boneLength(lowerN);
    _axis.copy(_t).sub(_a);
    let d = _axis.length();
    if (d < 1e-5) continue;
    const maxD = L1 + L2 - 1e-4;
    const minD = Math.abs(L1 - L2) + 1e-4;
    if (d > maxD) {
      _axis.multiplyScalar(maxD / d);
      d = maxD;
    } else if (d < minD) {
      _axis.multiplyScalar(minD / d);
      d = minD;
    }
    _axis.normalize();

    const poleHint = _p.clone().sub(_a);
    _n.crossVectors(_axis, poleHint);
    if (_n.lengthSq() < 1e-10) _n.crossVectors(_axis, new THREE.Vector3(0, 1, 0));
    if (_n.lengthSq() < 1e-10) _n.set(1, 0, 0);
    _n.normalize();
    _bend.crossVectors(_n, _axis).normalize();

    const cosA = THREE.MathUtils.clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1);
    const angA = Math.acos(cosA);
    _upperDir.copy(_axis).multiplyScalar(Math.cos(angA)).addScaledVector(_bend, Math.sin(angA));
    _mid.copy(_a).addScaledVector(_upperDir, L1);
    _lowerDir.copy(_t).sub(_mid);
    if (_lowerDir.lengthSq() < 1e-10) continue;
    _lowerDir.normalize();

    setWorldRotation(upper, quatAim(_upperDir, poleHint));
    upper.updateMatrixWorld(true);
    setWorldRotation(lower, quatAim(_lowerDir, poleHint));
  }
}

export function worldEndOf(chain: IkChain, nodes: Record<string, SceneNode>): THREE.Vector3 | null {
  const lowerN = nodes[chain.lowerId];
  const lower = objectRegistry.get(chain.lowerId);
  if (!lowerN || !lower) return null;
  lower.updateWorldMatrix(true, false);
  const end = new THREE.Vector3(0, -boneLength(lowerN), 0);
  lower.localToWorld(end);
  return end;
}

export function worldToLocal(obj: THREE.Object3D, world: THREE.Vector3): Vec3 {
  const parent = obj.parent;
  const local = world.clone();
  if (parent) {
    parent.updateWorldMatrix(true, false);
    parent.worldToLocal(local);
  }
  return { x: local.x, y: local.y, z: local.z };
}

export function chainForNode(chains: IkChain[], id: string | null): IkChain | undefined {
  if (!id) return undefined;
  return chains.find((c) => c.upperId === id || c.lowerId === id || c.targetId === id || c.poleId === id);
}

export function isIkDriven(chains: IkChain[], id: string | null): boolean {
  if (!id) return false;
  return chains.some((c) => c.enabled && (c.upperId === id || c.lowerId === id));
}

export function isIkHandle(chains: IkChain[], id: string | null): boolean {
  if (!id) return false;
  return chains.some((c) => c.targetId === id || c.poleId === id);
}

export function snapHandlesToFk(
  chain: IkChain,
  nodes: Record<string, SceneNode>,
): { target?: Vec3; pole?: Vec3 } {
  const end = worldEndOf(chain, nodes);
  const target = objectRegistry.get(chain.targetId);
  const pole = objectRegistry.get(chain.poleId);
  const upper = objectRegistry.get(chain.upperId);
  const lower = objectRegistry.get(chain.lowerId);
  if (!end || !target) return {};
  const out: { target?: Vec3; pole?: Vec3 } = { target: worldToLocal(target, end) };
  if (pole && upper && lower) {
    const A = new THREE.Vector3();
    const M = new THREE.Vector3();
    upper.updateWorldMatrix(true, false);
    lower.updateWorldMatrix(true, false);
    upper.getWorldPosition(A);
    lower.getWorldPosition(M);
    const hint = M.clone().sub(A.clone().lerp(end, 0.5));
    if (hint.lengthSq() < 0.01) hint.set(0, 0, 0.4);
    else hint.normalize().multiplyScalar(0.4);
    out.pole = worldToLocal(pole, M.clone().add(hint));
  }
  return out;
}
