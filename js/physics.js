// Turning an action into motion.
//
// "Smashing" is not a preset. It is: one object accelerates toward another,
// they meet at a specific instant, and at that instant the target stops
// existing and is replaced by pieces that fly outward along ballistic arcs
// and fall. Every number in that sentence is derived — the impact time from
// the distance and the speed, the fragment velocities from the impact
// direction, the arcs from gravity — which is why it looks like something
// happening rather than something being played back.
//
// Everything here produces keyframes, so the result is an ordinary editable
// scene: the shapes it makes can be dragged, re-timed and re-eased like any
// other. A generator that produced an opaque special effect would be worse,
// because the first thing anyone wants after "nearly" is to adjust it.


/** World units per second squared. Tuned to look right at this scale. */
export const GRAVITY = 62;

/**
 * Air resistance, per second.
 *
 * Chosen from the geometry rather than by eye: displacement under drag
 * tends to velocity/DRAG, so at the speeds used here a fragment settles
 * around thirty to fifty units from the impact — comfortably inside the
 * hundred-unit frame, which is where an aftermath has to happen to count.
 */
export const DRAG = 1.35;

const rand = (seed) => {
  // Deterministic: the same sentence must produce the same scene, or
  // undo/redo and reload would quietly change someone's work.
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

export function seedFrom(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Ballistic keyframes: launched with a velocity, pulled down by gravity.
 *
 * Sampled rather than solved because the renderer interpolates between
 * keyframes — too few samples and a parabola becomes a visible polyline.
 * Eight is enough for the arcs this produces at this duration.
 */
export function ballistic({
  from, velocity, startTime, endTime, gravity = GRAVITY,
  spin = { x: 0, y: 0, z: 0 }, samples = 8, colour = '#ffffff',
  startScale = 1, endScale = 1, fadeOut = true, fadePower = 2.2,
  drag = DRAG,
}) {
  const keys = [];
  const span = Math.max(0.001, endTime - startTime);

  // Drag is not decoration: without it a fragment travels v·t forever, and
  // over the three-odd seconds of an aftermath that carries it far outside a
  // hundred-unit frame — the whole consequence of the impact plays
  // off-screen. With it, a piece bursts out fast and settles, which is both
  // what real debris does and what keeps the action where it can be seen.
  // Total displacement tends to v/k, so the drag coefficient is really a
  // statement about how far things are allowed to get.
  const k = Math.max(0.0001, drag);
  const displace = (v0, g, t) => {
    const decay = 1 - Math.exp(-k * t);
    // Velocity term, damped, plus gravity settling toward terminal speed.
    return ((v0 + g / k) / k) * decay - (g / k) * t;
  };

  for (let i = 0; i <= samples; i++) {
    const f = i / samples;
    const t = f * span;
    keys.push({
      time: startTime + t,
      x: from.x + displace(velocity.x, 0, t),
      // Gravity acts along +y, because y runs down the screen.
      y: from.y + displace(velocity.y, -gravity, t),
      z: (from.z || 0) + displace(velocity.z || 0, 0, t),
      scale: startScale + (endScale - startScale) * f,
      rotation: spin.z * t,
      rotX: spin.x * t,
      rotY: spin.y * t,
      opacity: fadeOut ? Math.max(0, 1 - Math.pow(f, fadePower)) : 1,
      color: colour,
      // Linear: the arc is already in the positions, so easing them again
      // would apply the acceleration twice and the curve would look wrong.
      ease: 'linear',
    });
  }
  return keys;
}

/**
 * Debris from an object breaking apart.
 *
 * Directions are spread over a sphere rather than randomly sampled, so the
 * pieces never clump on one side — random directions look like a mistake
 * about a third of the time, which is exactly often enough to notice.
 * A component along the impact direction carries the momentum through.
 */
export function shatter({
  centre, count = 10, impact = { x: 1, y: 0, z: 0 }, force = 1,
  startTime, endTime, colour = '#ffffff', type = 'cube', seed = 1,
  parentScale = 1, profile = {},
}) {
  const random = rand(seed);
  const pieces = [];

  // The profile is what makes a smash and an obliteration different
  // events rather than the same one under two names.
  const speedScale = profile.speed === undefined ? 1 : profile.speed;
  const gravityScale = profile.gravity === undefined ? 1 : profile.gravity;
  const radial = profile.radial === undefined ? 0.75 : profile.radial;
  const pieceScale = profile.pieceScale === undefined ? 1 : profile.pieceScale;
  const fade = profile.fade === undefined ? 2.2 : profile.fade;
  const lift = profile.lift || 0;
  const speed = 45 * force * speedScale;
  // A directional event keeps the aggressor's momentum; a radial one
  // (exploding from within) has none to keep.
  const carry = Math.max(0, 1 - radial * 0.85);

  for (let i = 0; i < count; i++) {
    // Fibonacci-ish spiral over the sphere: even coverage, no clumping.
    const y = 1 - (2 * (i + 0.5)) / count;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const phi = i * 2.399963;
    const dir = { x: Math.cos(phi) * r, y, z: Math.sin(phi) * r };

    const jitter = 0.55 + random() * 0.9;
    const velocity = {
      x: (dir.x * radial + impact.x * carry * 1.1) * speed * jitter,
      y: (dir.y * radial + impact.y * carry * 0.6) * speed * jitter
         - (18 + 42 * lift) * force,
      z: (dir.z * radial + (impact.z || 0) * carry * 0.8) * speed * jitter,
    };

    pieces.push({
      type,
      // Fragments are small: a "piece" the size of the original reads as a
      // duplicate, not a shard.
      scale: parentScale * pieceScale * (0.14 + random() * 0.16),
      colour,
      keys: ballistic({
        from: centre,
        velocity,
        startTime,
        endTime,
        colour,
        gravity: GRAVITY * gravityScale,
        fadePower: fade,
        // Vaporising shrinks its pieces to nothing instead of dropping
        // them: dispersal without debris.
        endScale: profile.dissolve ? 0.05 : 1,
        spin: {
          x: (random() - 0.5) * 900 * force * speedScale,
          y: (random() - 0.5) * 900 * force * speedScale,
          z: (random() - 0.5) * 900 * force * speedScale,
        },
      }),
    });
  }
  return pieces;
}

/**
 * When a moving object reaches a stationary one.
 *
 * The impact is deliberately placed at a fraction of the timeline rather
 * than at the end: an impact with no aftermath is not an impact, it is a
 * stop. Roughly a third leaves two thirds for the consequences.
 */
export function impactTime(duration, share = 0.34) {
  return Math.max(0.2, duration * share);
}

/** A unit vector from a toward b. */
export function directionTo(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = (b.z || 0) - (a.z || 0);
  const len = Math.hypot(dx, dy, dz) || 1;
  return { x: dx / len, y: dy / len, z: dz / len };
}

/**
 * An approach that accelerates.
 *
 * A constant-speed approach reads as a conveyor belt; things that are about
 * to hit something speed up. The easing does that without moving where the
 * impact lands, because the last keyframe is pinned to the contact point.
 */
export function approach({ from, to, startTime, endTime, colour, scale = 1 }) {
  return [
    { time: startTime, x: from.x, y: from.y, z: from.z || 0, scale,
      rotation: 0, rotX: 0, rotY: 0, opacity: 1, color: colour, ease: 'quartIn' },
    { time: endTime, x: to.x, y: to.y, z: to.z || 0, scale,
      rotation: 0, rotX: 0, rotY: 0, opacity: 1, color: colour, ease: 'linear' },
  ];
}

/** Circular motion around a point, sampled finely enough to look round. */
export function orbitKeys({
  centre, radius, revolutions = 1, duration, startTime = 0,
  colour = '#ffffff', scale = 1, phase = 0, tilt = 0.35, samples = 24,
}) {
  const keys = [];
  for (let i = 0; i <= samples; i++) {
    const f = i / samples;
    const angle = phase + f * revolutions * Math.PI * 2;
    keys.push({
      time: startTime + f * duration,
      x: centre.x + Math.cos(angle) * radius,
      // A flat circle reads as a ring; tilting it reads as an orbit.
      y: centre.y + Math.sin(angle) * radius * tilt,
      z: (centre.z || 0) + Math.sin(angle) * radius,
      scale,
      rotation: 0, rotX: 0, rotY: 0,
      opacity: 1,
      color: colour,
      ease: 'linear',
    });
  }
  return keys;
}

/**
 * Rapid irregular displacement — "going crazy".
 *
 * Irregular on purpose: a sine wobble reads as a machine, and the word
 * people use when they say "crazy" means the opposite of predictable.
 */
export function shakeKeys({
  centre, duration, amplitude = 6, startTime = 0, colour = '#ffffff',
  scale = 1, seed = 1, rate = 14,
}) {
  const random = rand(seed);
  const steps = Math.max(4, Math.round(duration * rate));
  const keys = [];
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const settle = 1 - f * 0.15;
    keys.push({
      time: startTime + f * duration,
      x: centre.x + (random() - 0.5) * 2 * amplitude * settle,
      y: centre.y + (random() - 0.5) * 2 * amplitude * settle,
      z: (centre.z || 0) + (random() - 0.5) * amplitude * settle,
      scale: scale * (1 + (random() - 0.5) * 0.16),
      rotation: (random() - 0.5) * 30 * settle,
      rotX: (random() - 0.5) * 40 * settle,
      rotY: (random() - 0.5) * 40 * settle,
      opacity: 1,
      color: colour,
      ease: 'linear',
    });
  }
  return keys;
}
