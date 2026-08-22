// Motion paths.
//
// Interpolating position linearly between keyframes means a shape travels in
// straight lines and changes direction with a visible corner at every key.
// Real motion curves through its waypoints — a ball arcs, a camera sweeps,
// a title swings in. That difference is spatial interpolation, and it is
// independent of the easing curve, which controls *pacing* along the path
// rather than the shape of the path itself. A scene can have a beautifully
// eased move that still looks mechanical because the route is a polyline.
//
// Catmull-Rom is the right spline here because it passes *through* every
// control point. A Bezier would require authoring off-curve handles for each
// keyframe; Catmull-Rom takes the keyframe positions the user already set
// and produces the natural curve through them, so smoothing is a toggle
// rather than a new authoring burden.

/**
 * Hermite interpolation on one axis, blending from straight to Catmull-Rom.
 *
 * `bend` 0 must leave the motion *exactly* as it was — same route and same
 * timing — or turning smoothing on would silently alter animations someone
 * had already timed. That rules out the textbook formulation, where zero
 * tension means zero tangents: Hermite with zero tangents is a smoothstep,
 * so it traces the same straight line but re-paces the travel along it,
 * double-applying easing.
 *
 * The fix is to blend the *tangents* rather than scale them. Linear motion
 * is Hermite with both tangents equal to (p2 - p1); Catmull-Rom is Hermite
 * with tangents from the neighbouring points. Interpolating between those
 * two gives exact linear at 0, the standard curve at 1, and a continuous
 * dial in between.
 */
export function catmullRom(p0, p1, p2, p3, t, bend = 1) {
  const t2 = t * t;
  const t3 = t2 * t;
  const chord = p2 - p1;
  const m1 = chord + bend * (0.5 * (p2 - p0) - chord);
  const m2 = chord + bend * (0.5 * (p3 - p1) - chord);
  return (2 * p1 - 2 * p2 + m1 + m2) * t3
       + (-3 * p1 + 3 * p2 - 2 * m1 - m2) * t2
       + m1 * t
       + p1;
}

/**
 * Position along a smoothed path through `points` at segment `i`, fraction
 * `t`.
 *
 * The ends are handled by reflecting the neighbouring point rather than
 * duplicating it. Duplicating flattens the tangent at the endpoint, which
 * makes a shape leave its first keyframe in a straight line and only start
 * curving afterwards — a visible kink exactly where the eye is drawn.
 * Reflection keeps the curvature continuous right to the ends.
 */
export function samplePath(points, i, t, bend = 1) {
  const n = points.length;
  const at = (k) => {
    if (k < 0) {
      // Reflect the second point through the first.
      const a = points[0];
      const b = points[Math.min(1, n - 1)];
      return { x: 2 * a.x - b.x, y: 2 * a.y - b.y, z: 2 * a.z - b.z };
    }
    if (k > n - 1) {
      const a = points[n - 1];
      const b = points[Math.max(0, n - 2)];
      return { x: 2 * a.x - b.x, y: 2 * a.y - b.y, z: 2 * a.z - b.z };
    }
    return points[k];
  };

  const p0 = at(i - 1);
  const p1 = at(i);
  const p2 = at(i + 1);
  const p3 = at(i + 2);
  return {
    x: catmullRom(p0.x, p1.x, p2.x, p3.x, t, bend),
    y: catmullRom(p0.y, p1.y, p2.y, p3.y, t, bend),
    z: catmullRom(p0.z, p1.z, p2.z, p3.z, t, bend),
  };
}

/**
 * The whole path as a polyline, for drawing it in the editor.
 *
 * Seeing the route is most of the value of having one: a path you cannot
 * see is a path you cannot correct.
 */
export function pathPolyline(points, stepsPerSegment = 12, bend = 1) {
  if (!Array.isArray(points) || points.length < 2) return [];
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    for (let s = 0; s < stepsPerSegment; s++) {
      out.push(samplePath(points, i, s / stepsPerSegment, bend));
    }
  }
  out.push({ ...points[points.length - 1] });
  return out;
}

/** Approximate arc length, for reporting how far a move travels. */
export function pathLength(points, stepsPerSegment = 12, bend = 1) {
  const line = pathPolyline(points, stepsPerSegment, bend);
  let total = 0;
  for (let i = 1; i < line.length; i++) {
    total += Math.hypot(
      line[i].x - line[i - 1].x,
      line[i].y - line[i - 1].y,
      line[i].z - line[i - 1].z,
    );
  }
  return total;
}
