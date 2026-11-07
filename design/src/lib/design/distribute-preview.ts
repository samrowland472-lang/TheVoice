import { geometryBox } from "./align";
// TEMP minimal stub - will replace
export type DistributeAxis = "h" | "v";
export type DistributePlan = { axis: DistributeAxis; gap: number; ids: string[]; deltas: { id: string; dx: number; dy: number }[]; ghosts: any[]; ticks: any[] };
export function distributeRoots() { return []; }
export function formatDistributeGap(n: number) { return String(n); }
export function planDistributeWithGap() { return null; }
export function setLiveDistributePreview() { return null; }
export function planDistribute() { return null; }
export function commitDistributePreview() { return false; }
export function cancelDistributePreview() {}
export function getDistributePreview() { return null; }
export function subscribeDistributePreview() { return () => {}; }
export function drawDistributePreview() {}
