// Timing curves.
//
// This is the part that decides whether motion looks designed or computed.
// A move from A to B is arithmetic; how it accelerates out of A and settles
// into B is the whole craft, which is why every professional animation tool
// puts a draggable bezier handle in front of it.
//
// Two things here that the previous five fixed presets could not express:
//
//   - Arbitrary cubic-bezier curves, the same primitive CSS and After
//     Effects use, so a curve can be authored rather than chosen.
//   - Overshoot. A curve whose control points sit outside 0..1 carries the
//     value past its target and lets it settle back — anticipation and
//     follow-through, the thing that reads as "alive" rather than "moved".

/**
 * Solve a cubic bezier of the CSS form: fixed endpoints at (0,0) and (1,1),
 * with two control points.
 *
 * The curve is parametric — x and y are both functions of an internal t —
 * so finding y for a given x means first solving x(t) = x. Newton-Raphson
 * converges in a handful of steps for the well-behaved curves that make up
 * almost all real input; bisection is the fallback for the rest, because
 * Newton can wander off a curve with a near-zero derivative and returning a
 * wrong answer silently would be worse than being slow.
 */
export function cubicBezier(x1, y1, x2, y2) {
  // Coefficients of the polynomial form, so each sample is a few multiplies
  // rather than a de Casteljau subdivision.
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  const sampleX = (t) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t) => ((ay * t + by) * t + cy) * t;
  const slopeX = (t) => (3 * ax * t + 2 * bx) * t + cx;

  // x control points outside 0..1 would make x(t) non-monotonic, meaning one
  // x maps to several t and the curve stops being a function of time. CSS
  // forbids it for the same reason. y is deliberately unclamped — that is
  // what allows overshoot.
  const px1 = Math.min(1, Math.max(0, x1));
  const px2 = Math.min(1, Math.max(0, x2));
  const linear = px1 === x1 && px2 === x2 ? null : cubicBezier(px1, y1, px2, y2);
  if (linear) return linear;

  function solveT(x) {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = sampleX(t) - x;
      if (Math.abs(err) < 1e-7) return t;
      const d = slopeX(t);
      if (Math.abs(d) < 1e-7) break; // flat here: Newton has nothing to follow
      t -= err / d;
    }
    // Bisection always converges on a monotonic curve, just less quickly.
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < 40; i++) {
      const v = sampleX(t);
      if (Math.abs(v - x) < 1e-7) return t;
      if (v > x) hi = t;
      else lo = t;
      t = (lo + hi) / 2;
    }
    return t;
  }

  return function ease(x) {
    // Outside the segment the curve is not defined; clamping keeps a
    // rounding error at a keyframe boundary from producing a wild value.
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    return sampleY(solveT(x));
  };
}

/**
 * The named curves, as bezier control points.
 *
 * Naming them after what they do to a movement, rather than after the maths,
 * is deliberate: someone choosing how a title should arrive is thinking
 * "settle", not "cubic-bezier(0.22, 1, 0.36, 1)".
 */
export const EASING_CURVES = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  easeIn: [0.42, 0, 1, 1],
  easeOut: [0, 0, 0.58, 1],
  easeInOut: [0.42, 0, 0.58, 1],
  // Sharper versions — the difference between "moves" and "snaps".
  quadIn: [0.11, 0, 0.5, 0],
  quadOut: [0.5, 1, 0.89, 1],
  quartIn: [0.5, 0, 0.75, 0],
  quartOut: [0.25, 1, 0.5, 1],
  expoIn: [0.7, 0, 0.84, 0],
  expoOut: [0.16, 1, 0.3, 1],
  // Settle: fast away, long glide in. The workhorse of interface motion.
  settle: [0.22, 1, 0.36, 1],
  // Overshoot: control points outside 0..1 on the y axis, so the value
  // passes its target and comes back.
  anticipate: [0.68, -0.6, 0.32, 1.6],
  backIn: [0.36, 0, 0.66, -0.56],
  backOut: [0.34, 1.56, 0.64, 1],
};

export const EASING_NAMES = Object.keys(EASING_CURVES);

// Curves that cannot be expressed as a single cubic bezier, because they
// change direction more than once.
const SPECIAL = {
  // A real bounce: successive impacts, each smaller, each faster.
  bounce(t) {
    const n = 7.5625;
    const d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) { const u = t - 1.5 / d; return n * u * u + 0.75; }
    if (t < 2.5 / d) { const u = t - 2.25 / d; return n * u * u + 0.9375; }
    const u = t - 2.625 / d;
    return n * u * u + 0.984375;
  },
  // A damped spring — overshoots, reverses, settles.
  elastic(t) {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  },
  // No interpolation at all: hold the value, then cut. Essential for
  // anything that should read as a switch rather than a movement.
  // `hold` keeps the old value right up to the next keyframe; `step` cuts
  // halfway between the two, for a change that lands between the beats.
  hold(t) {
    return t >= 1 ? 1 : 0;
  },
  step(t) {
    return t >= 0.5 ? 1 : 0;
  },
};

export const SPECIAL_NAMES = Object.keys(SPECIAL);
export const ALL_EASING_NAMES = [...EASING_NAMES, ...SPECIAL_NAMES];

// Solving a bezier is cheap but not free, and playback asks for the same
// handful of curves sixty times a second.
const cache = new Map();

/**
 * Resolve whatever a keyframe carries into a function of 0..1.
 *
 * Accepts a preset name, a four-number array of control points, or nothing —
 * so old scenes, hand-edited files and the curve editor all feed the same
 * path, and anything unrecognisable degrades to a sensible default rather
 * than throwing mid-render.
 */
export function resolveEasing(spec, fallback = 'ease') {
  if (typeof spec === 'function') return spec;

  if (Array.isArray(spec) && spec.length === 4 && spec.every((n) => Number.isFinite(n))) {
    const key = spec.join(',');
    if (!cache.has(key)) cache.set(key, cubicBezier(spec[0], spec[1], spec[2], spec[3]));
    return cache.get(key);
  }

  const name = typeof spec === 'string' && (SPECIAL[spec] || EASING_CURVES[spec]) ? spec : fallback;
  if (SPECIAL[name]) return SPECIAL[name];

  const points = EASING_CURVES[name] || EASING_CURVES.ease;
  const key = points.join(',');
  if (!cache.has(key)) cache.set(key, cubicBezier(points[0], points[1], points[2], points[3]));
  return cache.get(key);
}

/** The control points behind a name, for drawing it in a curve editor. */
export function easingPoints(spec) {
  if (Array.isArray(spec) && spec.length === 4) return spec.slice();
  if (typeof spec === 'string' && EASING_CURVES[spec]) return EASING_CURVES[spec].slice();
  return EASING_CURVES.ease.slice();
}

/** Whether a curve leaves the 0..1 range — i.e. whether it overshoots. */
export function hasOvershoot(spec) {
  const ease = resolveEasing(spec);
  for (let i = 1; i < 100; i++) {
    const y = ease(i / 100);
    if (y < -0.001 || y > 1.001) return true;
  }
  return false;
}
