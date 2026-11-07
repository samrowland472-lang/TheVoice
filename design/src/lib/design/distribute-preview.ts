import type { DesignNode } from "./types";

export type DistributeAxis = "h" | "v";

export type DistributeTick = {
  axis: "x" | "y";
  a: number;
  b: number;
  mid: number;
  size: number;
};

export type DistributeGhost = { x: number; y: number; w: number; h: number; stay: boolean };

export type DistributePlan = {
  axis: DistributeAxis;
  gap: number;
  ids: string[];
  deltas: { id: string; dx: number; dy: number }[];
  ghosts: DistributeGhost[];
  ticks: DistributeTick[];
};

/** Selected unlocked layers, skipping anything nested inside another selection. */
export function distributeRoots(_nodes: DesignNode[], _ids: string[]): DesignNode[] {
  return [];
}

export function formatDistributeGap(size: number): string {
  const rounded = Math.round(size * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function planDistributeWithGap(
  _nodes: DesignNode[],
  _ids: string[],
  _axis: DistributeAxis,
  _gap: number,
): DistributePlan | null {
  return null;
}

export function setLiveDistributePreview(_axis: DistributeAxis, _gap: number): DistributePlan | null {
  return null;
}

export function planDistribute(
  _nodes: DesignNode[],
  _ids: string[],
  _axis: DistributeAxis,
): DistributePlan | null {
  return null;
}

export function commitDistributePreview(): boolean {
  return false;
}

export function cancelDistributePreview(): void {}

export function getDistributePreview(): DistributePlan | null {
  return null;
}

export function subscribeDistributePreview(_fn: () => void): () => void {
  return () => {};
}

export function drawDistributePreview(
  _ctx: CanvasRenderingContext2D,
  _z: number,
): void {}
