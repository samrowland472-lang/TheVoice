const { gizmoHandles, pickHandle, distanceToPath, axisMoveAmount, axisParameter,
        screenRay, rotationForDrag, rotationSign, turnAbout, scaleForDrag,
        worldPerPixel, AXES, GIZMO_MODES, GIZMO_INNER,
        GIZMO_PIXELS, AXIS_ROTATION_CHANNEL } = await import('../js/gizmo.js');
const { createCamera, projectPoint, rotatePoint, framingDistance }
  = await import('../js/camera3d.js');

let pass = 0, fail = 0;
const ok = (n, c, x = '') => { c ? (pass++, console.log(`  PASS  ${n}`))
                                 : (fail++, console.log(`  FAIL  ${n} ${x}`)); };
const W = 640, H = 360;
const CENTRE = { x: 50, y: 50, z: 0 };
const cam = () => createCamera();

/** Cameras looking at the stage from a spread of angles. */
function cameras() {
  const out = [];
  for (const rotY of [0, 40, -65, 155]) {
    for (const rotX of [0, 30, -25]) {
      const d = framingDistance(50);
      // Place the camera back along its own view direction so the stage
      // stays framed however it is turned.
      const back = rotatePoint({ x: 0, y: 0, z: -d }, rotX, rotY, 0);
      out.push({ ...createCamera(), rotX, rotY,
                 x: 50 + back.x, y: 50 + back.y, z: back.z });
    }
  }
  return out;
}

console.log('--- the gizmo is the same size on screen at any depth ---');
{
  const camera = cam();
  const nearHandles = gizmoHandles('move', { ...CENTRE, z: -30 }, camera, W, H);
  const farHandles = gizmoHandles('move', { ...CENTRE, z: 140 }, camera, W, H);
  const armLength = (hs) => {
    const h = hs.find((x) => x.axis === 'x');
    return h ? Math.hypot(h.points[1][0] - h.points[0][0], h.points[1][1] - h.points[0][1]) : 0;
  };
  ok('a near object gets a gizmo', armLength(nearHandles) > 10, String(armLength(nearHandles)));
  ok('a far one gets the same size',
     Math.abs(armLength(nearHandles) - armLength(farHandles)) < 2,
     `${armLength(nearHandles).toFixed(1)} vs ${armLength(farHandles).toFixed(1)}`);
  // The drawn arm is the outer part only — its inner end is left alone so
  // the middle of the object stays free to drag.
  ok('and it reaches the declared size',
     Math.abs(armLength(nearHandles) - GIZMO_PIXELS * (1 - GIZMO_INNER)) < 3,
     String(armLength(nearHandles)));

  // Every arm, from every camera, must leave the object's middle free.
  let worstGap = Infinity;
  for (const camera of cameras()) {
    for (const h of gizmoHandles('move', CENTRE, camera, W, H)) {
      worstGap = Math.min(worstGap,
        Math.hypot(h.points[0][0] - h.centre[0], h.points[0][1] - h.centre[1]));
    }
  }
  ok('no arm anywhere reaches the object\u2019s centre', worstGap >= 14,
     `closest ${worstGap.toFixed(1)}px`);
}

console.log('--- move mode offers one handle per axis ---');
{
  // Looking straight down Z, the Z arm projects to a stub nobody could aim
  // at, and it is deliberately withheld. A turned camera is where all
  // three are actually usable.
  const turned = cameras().find((c) => c.rotY === 40 && c.rotX === 30);
  const hs = gizmoHandles('move', CENTRE, turned, W, H);
  ok('three axes from a turned camera', hs.length === 3, String(hs.length));
  ok('each is a line', hs.every((h) => h.points.length === 2));
  ok('they are distinctly coloured', new Set(hs.map((h) => h.color)).size === 3);
  ok('all point away from the same object centre', hs.every((h) =>
    Math.abs(h.centre[0] - hs[0].centre[0]) < 0.001
    && Math.abs(h.centre[1] - hs[0].centre[1]) < 0.001));
  // The inner end of every arm is clear of the object's middle, which is
  // what keeps free dragging possible once the gizmo is on screen.
  // Measured in pixels, not as a fraction: a foreshortened arm's quarter
  // is a few pixels, which puts its grabbable end back on the object.
  ok('and none of them is grabbable at the centre', hs.every((h) =>
    Math.hypot(h.points[0][0] - h.centre[0], h.points[0][1] - h.centre[1]) >= 14),
    hs.map((h) => Math.hypot(h.points[0][0] - h.centre[0],
                             h.points[0][1] - h.centre[1]).toFixed(1)).join());
  ok('the head-on Z arm is withheld rather than offered as a stub',
     !gizmoHandles('move', CENTRE, cam(), W, H).some((h) => h.axis === 'z'));

  const flat = gizmoHandles('move', CENTRE, null, W, H);
  ok('a 2D scene gets no depth handle', flat.length === 2, String(flat.length));
  ok('and never offers Z', !flat.some((h) => h.axis === 'z'));
}

console.log('--- rotate mode offers a ring per axis ---');
{
  const hs = gizmoHandles('rotate', CENTRE, cam(), W, H);
  ok('three rings', hs.length === 3, String(hs.length));
  ok('each is a closed loop', hs.every((h) => h.closed && h.points.length > 20));
  // A ring seen edge-on has almost no width but its full length, so the
  // size check has to be on its largest extent rather than on x.
  ok('and roughly the gizmo size', hs.every((h) => {
    const xs = h.points.map((p) => p[0]);
    const ys = h.points.map((p) => p[1]);
    const span = Math.max(Math.max(...xs) - Math.min(...xs),
                          Math.max(...ys) - Math.min(...ys));
    return span > GIZMO_PIXELS && span < GIZMO_PIXELS * 2.4;
  }), hs.map((h) => {
    const xs = h.points.map((p) => p[0]);
    return (Math.max(...xs) - Math.min(...xs)).toFixed(0);
  }).join());
}

console.log('--- scale is one uniform handle, honestly ---');
{
  // A shape carries one scale, not three. An axis handle here would be a
  // control that cannot do what it looks like it does.
  const hs = gizmoHandles('scale', CENTRE, cam(), W, H);
  ok('exactly one handle', hs.length === 1, String(hs.length));
  ok('with no axis', hs[0].axis === null);
  ok('offset from the centre so it is reachable',
     Math.hypot(hs[0].points[1][0] - hs[0].centre[0],
                hs[0].points[1][1] - hs[0].centre[1]) > 20);
  ok('and not grabbable at the centre either',
     Math.hypot(hs[0].points[0][0] - hs[0].centre[0],
                hs[0].points[0][1] - hs[0].centre[1]) >= 14);
}

console.log('--- an object behind the camera has no gizmo ---');
{
  const camera = cam();
  for (const mode of GIZMO_MODES) {
    ok(`${mode} produces nothing rather than NaN`,
       gizmoHandles(mode, { x: 50, y: 50, z: -100000 }, camera, W, H).length === 0);
  }
}

console.log('--- picking a handle ---');
{
  const hs = gizmoHandles('move', CENTRE, cam(), W, H);
  const x = hs.find((h) => h.axis === 'x');
  const mid = [(x.points[0][0] + x.points[1][0]) / 2, (x.points[0][1] + x.points[1][1]) / 2];
  ok('pointing at an arm picks it', (pickHandle(hs, mid[0], mid[1]) || {}).axis === 'x');
  ok('pointing well away picks nothing', pickHandle(hs, 5, 5) === null);
  ok('a near miss still picks it', (pickHandle(hs, mid[0], mid[1] + 6) || {}).axis === 'x');
  ok('a far miss does not', pickHandle(hs, mid[0], mid[1] + 40) === null);

  // Where two rings cross, the nearer one must win rather than the first
  // in the list, or one axis becomes unreachable wherever they overlap.
  const rings = gizmoHandles('rotate', CENTRE, cam(), W, H);
  const z = rings.find((h) => h.axis === 'z');
  const onZ = z.points[10];
  const hit = pickHandle(rings, onZ[0], onZ[1]);
  ok('a point on a ring picks that ring', hit && hit.axis === 'z', hit ? hit.axis : 'nothing');
}

console.log('--- distance to a path ---');
{
  const line = [[0, 0], [100, 0]];
  ok('a point on the line is at zero', distanceToPath(line, 50, 0) === 0);
  ok('a point above it is its height', distanceToPath(line, 50, 12) === 12);
  ok('past the end measures from the end', distanceToPath(line, 130, 0) === 30);
  ok('an empty path is infinitely far', distanceToPath([], 0, 0) === Infinity);
  ok('a single point measures to it', distanceToPath([[3, 4]], 0, 0) === 5);
  const square = [[0, 0], [10, 0], [10, 10], [0, 10]];
  ok('an open path ignores the closing edge', distanceToPath(square, 0, 5) === 5);
  ok('a closed one does not', distanceToPath(square, 0, 5, true) === 0);
}

console.log('--- an axis drag keeps the handle under the pointer ---');
{
  // The real requirement: grab a point on the arm, drag the pointer, and
  // the grabbed point of the arm ends up under the pointer — not near it,
  // and not only for short drags. A screen-direction approximation passes
  // for ten pixels and is twenty pixels out by fifty.
  let worst = 0;
  let checked = 0;
  for (const camera of cameras()) {
    for (const axis of AXES) {
      const handles = gizmoHandles('move', CENTRE, camera, W, H);
      const handle = handles.find((h) => h.axis === axis.id);
      if (!handle) continue;   // withheld: pointing at the camera
      const grab = { x: handle.points[1][0], y: handle.points[1][1] };

      for (const [dx, dy] of [[50, 0], [0, 40], [-35, 22], [120, -80]]) {
        const to = { x: grab.x + dx, y: grab.y + dy };
        const amount = axisMoveAmount(axis.vec, CENTRE, camera, W, H, grab, to);
        const moved = {
          x: CENTRE.x + axis.vec.x * amount,
          y: CENTRE.y + axis.vec.y * amount,
          z: CENTRE.z + axis.vec.z * amount,
        };
        // Where the grabbed point of the arm now sits: the arm keeps its
        // length, so the tip follows the object.
        const c = projectPoint(moved, camera, W, H);
        if (!c.visible) continue;
        const tipWorld = {
          x: moved.x + (handle.tipOffset ? 0 : 0), y: moved.y, z: moved.z,
        };
        void tipWorld;
        // The pointer's ray must pass through the moved object's axis
        // point — measured as the screen distance from the pointer to the
        // projected position, along the axis only.
        const t0 = axisParameter(axis.vec, CENTRE, camera, W, H, to.x, to.y);
        if (t0 === null) continue;
        worst = Math.max(worst, Math.abs(t0 - (
          axisParameter(axis.vec, CENTRE, camera, W, H, grab.x, grab.y) + amount)));
        checked++;
      }
    }
  }
  ok('checked a real spread of cameras and axes', checked > 40, String(checked));
  ok('the amount is exactly the change in the pointer\u2019s axis parameter',
     worst < 1e-9, `worst ${worst}`);
}

console.log('--- and the amount is the true closest approach ---');
{
  // The pointer's ray and the handle's axis are skew lines in general —
  // they do not meet — so "the object is on the ray" is the wrong
  // invariant. The right one is the definition of closest approach: the
  // line joining the two closest points is perpendicular to both.
  let worst = 0;
  let checked = 0;
  for (const camera of cameras()) {
    for (const axis of AXES) {
      const handles = gizmoHandles('move', CENTRE, camera, W, H);
      const handle = handles.find((h) => h.axis === axis.id);
      if (!handle) continue;
      const grab = { x: handle.points[1][0], y: handle.points[1][1] };
      for (const [dx, dy] of [[60, 0], [-90, 45], [140, 90]]) {
        const to = { x: grab.x + dx, y: grab.y + dy };
        const t1 = axisParameter(axis.vec, CENTRE, camera, W, H, to.x, to.y);
        if (t1 === null) continue;
        const onAxis = {
          x: CENTRE.x + axis.vec.x * t1,
          y: CENTRE.y + axis.vec.y * t1,
          z: CENTRE.z + axis.vec.z * t1,
        };
        const ray = screenRay(to.x, to.y, camera, W, H);
        const w = { x: onAxis.x - ray.origin.x, y: onAxis.y - ray.origin.y,
                    z: onAxis.z - ray.origin.z };
        const along = w.x * ray.dir.x + w.y * ray.dir.y + w.z * ray.dir.z;
        const join = { x: w.x - ray.dir.x * along, y: w.y - ray.dir.y * along,
                       z: w.z - ray.dir.z * along };
        // When the ray actually crosses the axis the join has zero length
        // and no direction, so there is nothing to be perpendicular to.
        const joinLen = Math.hypot(join.x, join.y, join.z);
        if (joinLen < 1e-6) continue;
        // Perpendicular to the axis is the condition that pins t1.
        const err = Math.abs(join.x * axis.vec.x + join.y * axis.vec.y + join.z * axis.vec.z)
                  / joinLen;
        worst = Math.max(worst, err);
        checked++;
      }
    }
  }
  ok('checked a useful number of cases', checked > 25, String(checked));
  ok('the closest point really is the closest point', worst < 1e-9,
     `worst ${worst.toExponential(2)}`);
}

console.log('--- an axis pointing at the camera is refused, not divided by ---');
{
  // Looking straight down Z: the Z arm has no screen direction at all.
  const camera = { ...createCamera(), x: 50, y: 50, z: -framingDistance(50),
                   rotX: 0, rotY: 0 };
  const amount = axisMoveAmount({ x: 0, y: 0, z: 1 }, CENTRE, camera, W, H,
                                { x: 320, y: 180 }, { x: 360, y: 180 });
  ok('it returns zero rather than infinity', amount === 0 || Number.isFinite(amount),
     String(amount));
  ok('and the parallel case is reported as undetermined',
     axisParameter({ x: 0, y: 0, z: 1 }, CENTRE, camera, W, H, 320, 180) === null);
  ok('and no Z handle is offered to grab',
     !gizmoHandles('move', CENTRE, camera, W, H).some((h) => h.axis === 'z'));
}

console.log('--- a rotate drag turns the object the way the pointer went ---');
{
  // Closed loop: take a marker point on the ring, apply the rotation the
  // drag asks for, and check its screen angle followed the pointer. Sign
  // errors here make the object fight the cursor.
  let wrongSign = 0;
  let checked = 0;
  for (const camera of cameras()) {
    for (const axis of AXES) {
      const c = projectPoint(CENTRE, camera, W, H);
      if (!c.visible) continue;
      // A marker offset perpendicular to the axis, so it actually moves.
      const off = axis.id === 'x' ? { x: 0, y: 12, z: 0 }
                : axis.id === 'y' ? { x: 12, y: 0, z: 0 }
                : { x: 12, y: 0, z: 0 };
      const marker = { x: CENTRE.x + off.x, y: CENTRE.y + off.y, z: CENTRE.z + off.z };
      const m0 = projectPoint(marker, camera, W, H);
      if (!m0.visible) continue;
      const startAngle = Math.atan2(m0.y - c.y, m0.x - c.x);

      // Drag the pointer twenty degrees anticlockwise on screen, starting
      // from where the marker is.
      const r = Math.hypot(m0.x - c.x, m0.y - c.y);
      if (r < 8) continue;
      // A ring seen edge-on projects to a line: the marker slides back and
      // forth through the centre and "which way it went round" has no
      // answer at all. Skip those rather than assert a direction that does
      // not exist — they are also the rings a person cannot aim at.
      const ring = gizmoHandles('rotate', CENTRE, camera, W, H)
        .find((h) => h.axis === axis.id);
      if (!ring) continue;
      const rx = ring.points.map((p) => p[0]);
      const ry = ring.points.map((p) => p[1]);
      const spanX = Math.max(...rx) - Math.min(...rx);
      const spanY = Math.max(...ry) - Math.min(...ry);
      if (Math.min(spanX, spanY) / Math.max(spanX, spanY) < 0.25) continue;
      const dragged = 20 * Math.PI / 180;
      const from = { x: m0.x, y: m0.y };
      const to = { x: c.x + Math.cos(startAngle + dragged) * r,
                   y: c.y + Math.sin(startAngle + dragged) * r };

      const deg = rotationForDrag(axis.id, CENTRE, camera, W, H, from, to);
      // Apply it about that axis and see where the marker went.
      const turned = turnAbout(off, axis.id, deg);
      const m1 = projectPoint({
        x: CENTRE.x + turned.x, y: CENTRE.y + turned.y, z: CENTRE.z + turned.z,
      }, camera, W, H);
      if (!m1.visible) continue;
      let moved = Math.atan2(m1.y - c.y, m1.x - c.x) - startAngle;
      while (moved > Math.PI) moved -= Math.PI * 2;
      while (moved < -Math.PI) moved += Math.PI * 2;
      checked++;
      if (moved * dragged <= 0) wrongSign++;
    }
  }
  ok('checked every ring a person could actually aim at', checked > 12, String(checked));
  ok('the object never turns against the pointer', wrongSign === 0,
     `${wrongSign} of ${checked} went the wrong way`);
}

console.log('--- and turns by roughly the angle you swept ---');
{
  // Face-on, where perspective does not skew the ring, the match should be
  // close to exact — that is the case worth pinning a number to.
  const camera = { ...createCamera(), x: 50, y: 50, z: -framingDistance(50),
                   rotX: 0, rotY: 0 };
  const c = projectPoint(CENTRE, camera, W, H);
  const r = 60;
  for (const sweep of [15, -40, 90]) {
    const a0 = 0.3;
    const from = { x: c.x + Math.cos(a0) * r, y: c.y + Math.sin(a0) * r };
    const a1 = a0 + sweep * Math.PI / 180;
    const to = { x: c.x + Math.cos(a1) * r, y: c.y + Math.sin(a1) * r };
    const deg = rotationForDrag('z', CENTRE, camera, W, H, from, to);
    ok(`a ${sweep} degree sweep turns ${sweep} degrees`, Math.abs(deg - sweep) < 0.01,
       String(deg));
  }
}

console.log('--- a drag across the seam is a small turn, not a revolution ---');
{
  const camera = { ...createCamera(), x: 50, y: 50, z: -framingDistance(50) };
  const c = projectPoint(CENTRE, camera, W, H);
  const r = 60;
  // From just below the -180 line to just above it.
  const from = { x: c.x - r, y: c.y - 2 };
  const to = { x: c.x - r, y: c.y + 2 };
  const deg = rotationForDrag('z', CENTRE, camera, W, H, from, to);
  ok('it is a few degrees, not three hundred and sixty', Math.abs(deg) < 20,
     String(deg));
}

console.log('--- scaling ---');
{
  const centre = [320, 180];
  ok('dragging away doubles it',
     Math.abs(scaleForDrag(centre, { x: 370, y: 180 }, { x: 420, y: 180 }) - 2) < 1e-9);
  ok('dragging back halves it',
     Math.abs(scaleForDrag(centre, { x: 420, y: 180 }, { x: 370, y: 180 }) - 0.5) < 1e-9);
  ok('no movement is no change',
     scaleForDrag(centre, { x: 400, y: 180 }, { x: 400, y: 180 }) === 1);
  ok('starting on the centre is refused rather than dividing by zero',
     scaleForDrag(centre, { x: 321, y: 180 }, { x: 500, y: 180 }) === 1);
  ok('it cannot reach zero', scaleForDrag(centre, { x: 500, y: 180 }, centre[0], 180) !== 0);
  ok('it cannot go negative and turn geometry inside out',
     scaleForDrag(centre, { x: 500, y: 180 }, { x: 320, y: 180 }) > 0);
  ok('and it is capped', scaleForDrag(centre, { x: 321, y: 181 }, { x: 9999, y: 9999 }) <= 20);
}

console.log('--- pixels to world units ---');
{
  const camera = cam();
  const near = worldPerPixel({ x: 50, y: 50, z: -40 }, camera, H);
  const far = worldPerPixel({ x: 50, y: 50, z: 140 }, camera, H);
  ok('a pixel covers more world further away', far > near * 1.3,
     `${near.toFixed(4)} vs ${far.toFixed(4)}`);
  ok('a point at the camera does not divide by zero',
     Number.isFinite(worldPerPixel({ x: 50, y: 50, z: camera.z }, camera, H)));
  ok('a 2D scene has a fixed rate', worldPerPixel(CENTRE, null, H) === 100 / H);
}

console.log('--- axes map to the channels the renderer actually stores ---');
{
  ok('X turns rotX', AXIS_ROTATION_CHANNEL.x === 'rotX');
  ok('Y turns rotY', AXIS_ROTATION_CHANNEL.y === 'rotY');
  // The flat renderer's spin channel is called `rotation`, not `rotZ`, and
  // writing rotZ would silently do nothing.
  ok('Z turns the in-plane rotation', AXIS_ROTATION_CHANNEL.z === 'rotation');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
