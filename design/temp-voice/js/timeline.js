// The timeline: where in time things happen.
//
// The curve editor made it possible to shape *how* a movement is paced, but
// *when* it happens was still a list of chips you could only click. Timing
// is half of animation — a move that lands two frames late reads as wrong
// long before anyone can say why — so keyframes need to be dragged against
// a ruler, not retyped.
//
// The geometry and the keyframe arithmetic live here, separate from the
// canvas that draws them, because they are the parts that can be wrong in
// ways a screenshot will not reveal.

export const ROW_HEIGHT = 26;
export const RULER_HEIGHT = 22;
export const GUTTER = 96;      // room for shape labels
export const RIGHT_PAD = 12;

/** Where the plotting area starts and ends, in pixels. */
export function trackBounds(width) {
  return { left: GUTTER, right: Math.max(GUTTER + 1, width - RIGHT_PAD) };
}

export function timeToX(time, duration, width) {
  const { left, right } = trackBounds(width);
  if (duration <= 0) return left;
  const t = Math.min(duration, Math.max(0, time));
  return left + (t / duration) * (right - left);
}

export function xToTime(x, duration, width) {
  const { left, right } = trackBounds(width);
  if (right <= left) return 0;
  const ratio = (x - left) / (right - left);
  return Math.min(duration, Math.max(0, ratio * duration));
}

export function rowY(index) {
  return RULER_HEIGHT + index * ROW_HEIGHT;
}

export function rowAt(y) {
  if (y < RULER_HEIGHT) return -1;   // the ruler, not a track
  return Math.floor((y - RULER_HEIGHT) / ROW_HEIGHT);
}

export function timelineHeight(shapeCount) {
  return RULER_HEIGHT + Math.max(1, shapeCount) * ROW_HEIGHT;
}

/**
 * Find the keyframe under a pointer.
 *
 * The tolerance is generous because a keyframe is a small diamond and a
 * near miss that silently scrubs the playhead instead of grabbing the
 * keyframe is a much worse outcome than a slightly sticky hit box.
 */
export function hitTestKeyframe(shapes, x, y, duration, width, tolerance = 9) {
  const row = rowAt(y);
  if (row < 0 || row >= shapes.length) return null;
  const shape = shapes[row];
  let best = null;
  let bestDist = tolerance;
  for (let i = 0; i < shape.keyframes.length; i++) {
    const kx = timeToX(shape.keyframes[i].time, duration, width);
    const d = Math.abs(x - kx);
    if (d <= bestDist) {
      bestDist = d;
      best = { shapeIndex: row, keyframeIndex: i, shape, keyframe: shape.keyframes[i] };
    }
  }
  return best;
}

/** The smallest gap allowed between two keyframes, in seconds. */
export const MIN_GAP = 0.02;

/**
 * Move a keyframe to a new time.
 *
 * Two keyframes at the same instant give a zero-length segment, which makes
 * the interpolation divide by zero and the easing meaningless — so a move
 * that would land on top of a neighbour is blocked at a minimum gap rather
 * than allowed and then producing NaN positions. Returns the time actually
 * used, which is not always the one asked for.
 */
export function moveKeyframe(shape, index, toTime, duration) {
  const kfs = shape.keyframes;
  if (index < 0 || index >= kfs.length) return null;

  const lower = index > 0 ? kfs[index - 1].time + MIN_GAP : 0;
  const upper = index < kfs.length - 1 ? kfs[index + 1].time - MIN_GAP : duration;

  // A shape whose neighbours are already closer together than the minimum
  // gap has nowhere legal to go; leave it where it is rather than shuffling
  // the neighbours out of the way behind the user's back.
  if (upper < lower) return kfs[index].time;

  const clamped = Math.min(upper, Math.max(lower, toTime));
  kfs[index].time = Math.round(clamped * 1000) / 1000;
  return kfs[index].time;
}

/**
 * Snap a time to a frame boundary.
 *
 * Animation is sampled per frame, so a keyframe at 1.007s and one at 1.000s
 * are the same picture. Snapping keeps the data honest about that and makes
 * keyframes line up across shapes, which is most of what makes a sequence
 * feel deliberate.
 */
export function snapToFrame(time, fps) {
  if (!fps || fps <= 0) return time;
  return Math.round(time * fps) / fps;
}

/** Nicely spaced ruler ticks — about one every 60px, on a 1/2/5 scale. */
export function rulerTicks(duration, width) {
  const { left, right } = trackBounds(width);
  const span = right - left;
  // A track too narrow to fit even one label should draw no ruler at all,
  // rather than a lone "0s" or a row of overlapping numbers.
  if (span < 40 || duration <= 0) return [];
  const target = duration / (span / 60);
  const magnitude = Math.pow(10, Math.floor(Math.log10(Math.max(target, 1e-6))));
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= target) || magnitude * 10;
  const ticks = [];
  for (let t = 0; t <= duration + 1e-9; t += step) {
    ticks.push(Math.round(t * 1000) / 1000);
    if (ticks.length > 200) break; // never let a bad duration spin here
  }
  return ticks;
}
