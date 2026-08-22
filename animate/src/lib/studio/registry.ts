import type { Object3D } from "three";

export const objectRegistry = new Map<string, Object3D>();

export function registerObject(id: string, obj: Object3D | null) {
  if (obj) objectRegistry.set(id, obj);
  else objectRegistry.delete(id);
}
