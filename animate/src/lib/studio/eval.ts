import type { AnimExpr, Channel, Interp, Key, SceneNode, Track, Vec3 } from "./types";

export function ease(u: number, interp: Interp): number {
  const t = Math.min(1, Math.max(0, u));
  switch (interp) {
    case "step":
      return t < 1 ? 0 : 1;
    case "linear":
      return t;
    case "easeIn":
      return t * t;
    case "easeOut":
      return 1 - (1 - t) * (1 - t);
    case "easeInOut":
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    case "smooth": {
      return t * t * (3 - 2 * t);
    }
    case "bounce": {
      const n1 = 7.5625;
      const d1 = 2.75;
      let p = t;
      if (p < 1 / d1) return n1 * p * p;
      if (p < 2 / d1) {
        p -= 1.5 / d1;
        return n1 * p * p + 0.75;
      }
      if (p < 2.5 / d1) {
        p -= 2.25 / d1;
        return n1 * p * p + 0.9375;
      }
      p -= 2.625 / d1;
      return n1 * p * p + 0.984375;
    }
    default:
      return t;
  }
}

export function cubic1d(p0: number, p1: number, p2: number, p3: number, u: number): number {
  const t = Math.min(1, Math.max(0, u));
  const iu = 1 - t;
  return iu * iu * iu * p0 + 3 * iu * iu * t * p1 + 3 * iu * t * t * p2 + t * t * t * p3;
}

export function segmentUsesBezier(a: Key, b: Key): boolean {
  return a.interp === "bezier" || Boolean(a.tanOut) || Boolean(b.tanIn);
}

export function resolveHandles(a: Key, b: Key): { x1: number; y1: number; x2: number; y2: number } {
  const span = Math.max(b.t - a.t, 1e-6);
  const dv = b.v - a.v;
  const outDx = Math.max(1e-4, Math.min(span * 0.99, a.tanOut?.dx ?? span / 3));
  const outDy = a.tanOut?.dy ?? dv / 3;
  const inDx = Math.max(1e-4, Math.min(span * 0.99, b.tanIn?.dx ?? span / 3));
  const inDy = b.tanIn?.dy ?? -dv / 3;
  return {
    x1: a.t + outDx,
    y1: a.v + outDy,
    x2: b.t - inDx,
    y2: b.v + inDy,
  };
}

export function evalBezierSegment(a: Key, b: Key, t: number): number {
  const span = b.t - a.t;
  if (span <= 0) return a.v;
  const { x1, y1, x2, y2 } = resolveHandles(a, b);
  let lo = 0;
  let hi = 1;
  let u = Math.min(1, Math.max(0, (t - a.t) / span));
  for (let i = 0; i < 20; i++) {
    const x = cubic1d(a.t, x1, x2, b.t, u);
    if (x < t) lo = u;
    else hi = u;
    u = (lo + hi) / 2;
  }
  return cubic1d(a.v, y1, y2, b.v, u);
}

/** Catmull-style auto handles around `index`. Leaves step keys alone. */
export function ensureBezierTangents(keys: Key[], index: number): Key[] {
  if (index < 0 || index >= keys.length) return keys;
  return keys.map((k, i) => {
    if (i !== index && i !== index - 1 && i !== index + 1) return k;
    if (k.interp === "step") return k;
    const prev = keys[i - 1];
    const next = keys[i + 1];
    const spanIn = prev ? Math.max(k.t - prev.t, 1e-4) : next ? Math.max(next.t - k.t, 1e-4) : 1;
    const spanOut = next ? Math.max(next.t - k.t, 1e-4) : spanIn;
    const slopeIn = prev ? (k.v - prev.v) / spanIn : next ? (next.v - k.v) / spanOut : 0;
    const slopeOut = next ? (next.v - k.v) / spanOut : slopeIn;
    const slope = (slopeIn + slopeOut) / 2;
    const autoIn = k.tanIn ?? { dx: spanIn / 3, dy: -slope * (spanIn / 3) };
    const autoOut = k.tanOut ?? { dx: spanOut / 3, dy: slope * (spanOut / 3) };
    if (i === index) {
      return { ...k, interp: "bezier" as Interp, tanIn: autoIn, tanOut: autoOut };
    }
    return { ...k, tanIn: autoIn, tanOut: autoOut };
  });
}

export function evalExpr(expr: AnimExpr, t: number): number {
  if (expr.kind === "sin") {
    return (
      expr.offset +
      expr.amp * Math.sin((t / Math.max(expr.period, 1e-6)) * Math.PI * 2 + expr.phase)
    );
  }
  if (expr.kind === "cos") {
    return (
      expr.offset +
      expr.amp * Math.cos((t / Math.max(expr.period, 1e-6)) * Math.PI * 2 + expr.phase)
    );
  }
  return expr.offset + expr.rate * t;
}

export function evalKeys(keys: Key[], t: number, cycle: boolean): number | undefined {
  if (keys.length === 0) return undefined;
  if (keys.length === 1) return keys[0]!.v;
  const sorted = keys.slice().sort((a, b) => a.t - b.t);
  const t0 = sorted[0]!.t;
  const t1 = sorted[sorted.length - 1]!.t;
  let time = t;
  if (cycle && t1 > t0) {
    const span = t1 - t0;
    time = t0 + ((((t - t0) % span) + span) % span);
  }
  if (time <= sorted[0]!.t) return sorted[0]!.v;
  const last = sorted[sorted.length - 1]!;
  if (time >= last.t) return last.v;
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]!;
    const b = sorted[i + 1]!;
    if (time >= a.t && time <= b.t) {
      if (a.interp === "step") return time < b.t ? a.v : b.v;
      if (segmentUsesBezier(a, b)) return evalBezierSegment(a, b, time);
      const span = b.t - a.t;
      const u = span === 0 ? 0 : (time - a.t) / span;
      return a.v + (b.v - a.v) * ease(u, a.interp);
    }
  }
  return last.v;
}

export function evalTrack(track: Track, t: number): number | undefined {
  if (track.expr) return evalExpr(track.expr, t);
  return evalKeys(track.keys, t, track.cycle);
}

export function sampleCurve(track: Track, t0: number, t1: number, steps: number): number[] {
  const out: number[] = [];
  const span = t1 - t0;
  for (let i = 0; i <= steps; i++) {
    const t = t0 + (span * i) / steps;
    const v = evalTrack(track, t);
    out.push(v ?? 0);
  }
  return out;
}

type Animated = {
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
  intensity?: number;
  emissiveIntensity?: number;
  opacity?: number;
  fov?: number;
};

function setChannel(target: Animated, channel: Channel, value: number) {
  switch (channel) {
    case "position.x":
      target.position.x = value;
      break;
    case "position.y":
      target.position.y = value;
      break;
    case "position.z":
      target.position.z = value;
      break;
    case "rotation.x":
      target.rotation.x = value;
      break;
    case "rotation.y":
      target.rotation.y = value;
      break;
    case "rotation.z":
      target.rotation.z = value;
      break;
    case "scale.x":
      target.scale.x = value;
      break;
    case "scale.y":
      target.scale.y = value;
      break;
    case "scale.z":
      target.scale.z = value;
      break;
    case "intensity":
      target.intensity = value;
      break;
    case "emissiveIntensity":
      target.emissiveIntensity = value;
      break;
    case "opacity":
      target.opacity = value;
      break;
    case "fov":
      target.fov = value;
      break;
  }
}

export function getChannelValue(node: SceneNode, channel: Channel): number {
  switch (channel) {
    case "position.x":
      return node.position.x;
    case "position.y":
      return node.position.y;
    case "position.z":
      return node.position.z;
    case "rotation.x":
      return node.rotation.x;
    case "rotation.y":
      return node.rotation.y;
    case "rotation.z":
      return node.rotation.z;
    case "scale.x":
      return node.scale.x;
    case "scale.y":
      return node.scale.y;
    case "scale.z":
      return node.scale.z;
    case "intensity":
      return node.light?.intensity ?? 0;
    case "emissiveIntensity":
      return node.material?.emissiveIntensity ?? 0;
    case "opacity":
      return node.material?.opacity ?? 1;
    case "fov":
      return node.camera?.fov ?? 35;
  }
}

export function evalNode(
  node: SceneNode,
  tracks: Track[],
  time: number,
): Animated {
  const result: Animated = {
    position: { ...node.position },
    rotation: { ...node.rotation },
    scale: { ...node.scale },
    intensity: node.light?.intensity,
    emissiveIntensity: node.material?.emissiveIntensity,
    opacity: node.material?.opacity,
    fov: node.camera?.fov,
  };
  for (const track of tracks) {
    if (track.objectId !== node.id) continue;
    const v = evalTrack(track, time);
    if (v === undefined) continue;
    setChannel(result, track.channel, v);
  }
  return result;
}

export function collectCycles(tracks: Track[]): { label: string; period: number }[] {
  const seen = new Map<number, string>();
  for (const track of tracks) {
    if (track.expr && (track.expr.kind === "sin" || track.expr.kind === "cos")) {
      const p = track.expr.period;
      if (!seen.has(p)) seen.set(p, `${track.channel} · ${p}s`);
    } else if (track.cycle && track.keys.length >= 2) {
      const sorted = track.keys.slice().sort((a, b) => a.t - b.t);
      const p = sorted[sorted.length - 1]!.t - sorted[0]!.t;
      if (p > 0 && !seen.has(p)) seen.set(p, `${track.channel} · ${p}s`);
    } else if (track.expr?.kind === "ramp") {
      const p = Math.abs((Math.PI * 2) / Math.max(Math.abs(track.expr.rate), 1e-6));
      if (!seen.has(p)) seen.set(p, `spin · ${p.toFixed(1)}s`);
    }
  }
  return [...seen.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([period, label]) => ({ period, label }));
}
