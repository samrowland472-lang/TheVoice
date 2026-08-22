// The scene's light.
//
// A fixed key light made solids readable; making the light a property of
// the scene makes it a storytelling tool — a sunrise is nothing but a light
// keyframed from low-and-warm to high-and-neutral.
//
// The light is authored as angles, not as a vector. A person thinks "from
// the left, low, warm", which is azimuth, elevation and warmth; the unit
// vector the shading needs is derived. Angles also interpolate correctly
// through keyframes with the same shortest-arc rule the camera uses.

import { lerpAngle } from './camera3d.js';

const TO_RAD = Math.PI / 180;

export function createLight() {
  // Matches the old fixed light, so switching a scene to 3D looks the same
  // before and after this feature existed.
  return { azimuth: 40, elevation: 38, ambient: 0.35, warmth: 0.5 };
}

/**
 * The direction the light TRAVELS, as a unit vector.
 *
 * Azimuth 0 shines straight into the scene from behind the viewer;
 * positive azimuth swings the source toward the viewer's left, so the
 * beam travels rightward (+x). Elevation raises the source, so the beam
 * travels downward — +y, since y runs down the screen. Elevation 90 is
 * noon: straight down.
 */
export function lightDirection({ azimuth = 40, elevation = 38 } = {}) {
  const el = Math.max(-89, Math.min(89, elevation)) * TO_RAD;
  const az = azimuth * TO_RAD;
  const v = {
    x: Math.sin(az) * Math.cos(el),
    y: Math.sin(el),
    z: Math.cos(az) * Math.cos(el),
  };
  const len = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

/**
 * Per-channel multipliers for the light's colour temperature.
 *
 * 0 is cold (blue-leaning), 1 is warm (orange-leaning), 0.5 is neutral —
 * exactly {1,1,1}, so a scene that never touches warmth renders exactly as
 * it did before warmth existed. The excursions are deliberately gentle: a
 * light that can turn a face fully orange stops reading as lighting and
 * starts reading as recolouring.
 */
export function lightTint(warmth = 0.5) {
  const w = Math.max(0, Math.min(1, warmth)) - 0.5; // -0.5 .. 0.5
  return {
    r: 1 + w * 0.5,
    g: 1 + w * 0.08,
    b: 1 - w * 0.55,
  };
}

/** The light at a moment in time, sampled through its keyframes. */
export function sampleLight(keyframes, time, fallback) {
  if (!Array.isArray(keyframes) || keyframes.length === 0) return fallback;
  if (keyframes.length === 1) return { ...fallback, ...stripMeta(keyframes[0]) };

  const sorted = keyframes;
  if (time <= sorted[0].time) return { ...fallback, ...stripMeta(sorted[0]) };
  const last = sorted[sorted.length - 1];
  if (time >= last.time) return { ...fallback, ...stripMeta(last) };

  let i = 0;
  while (i < sorted.length - 1 && sorted[i + 1].time <= time) i++;
  const a = sorted[i];
  const b = sorted[i + 1];
  const span = b.time - a.time;
  const raw = span > 0 ? (time - a.time) / span : 0;
  const t = typeof a.easeFn === 'function' ? a.easeFn(raw) : raw;

  const num = (key) => {
    const av = a[key] === undefined ? fallback[key] : a[key];
    const bv = b[key] === undefined ? fallback[key] : b[key];
    return av + (bv - av) * t;
  };
  return {
    ...fallback,
    // Azimuth wraps like any heading; elevation and the scalars do not.
    azimuth: lerpAngle(
      a.azimuth === undefined ? fallback.azimuth : a.azimuth,
      b.azimuth === undefined ? fallback.azimuth : b.azimuth,
      t,
    ),
    elevation: num('elevation'),
    ambient: num('ambient'),
    warmth: num('warmth'),
  };
}

function stripMeta(k) {
  const { time, ease, easeFn, ...rest } = k;
  return rest;
}

export function setLightKeyframe(keyframes, time, light, ease = 'ease') {
  const list = Array.isArray(keyframes) ? keyframes : [];
  const existing = list.find((k) => Math.abs(k.time - time) < 0.001);
  const values = {
    time,
    azimuth: light.azimuth,
    elevation: light.elevation,
    ambient: light.ambient,
    warmth: light.warmth,
    ease,
  };
  if (existing) {
    Object.assign(existing, values);
    return list;
  }
  list.push(values);
  list.sort((a, b) => a.time - b.time);
  return list;
}

export function removeLightKeyframe(keyframes, time) {
  if (!Array.isArray(keyframes)) return [];
  const i = keyframes.findIndex((k) => Math.abs(k.time - time) < 0.001);
  if (i !== -1) keyframes.splice(i, 1);
  return keyframes;
}
