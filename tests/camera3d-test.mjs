const { createCamera, rotatePoint, toCameraSpace, project, projectPoint,
        depthSort, orbit, dolly, distanceTo, CAMERA_PRESETS }
  = await import('../js/camera3d.js');

let pass=0,fail=0;
const ok=(n,c,x='')=>{c?(pass++,console.log(`  PASS  ${n}`)):(fail++,console.log(`  FAIL  ${n} ${x}`))};
const near=(a,b,t=1e-6)=>Math.abs(a-b)<t;
const W=640,H=360;

console.log('--- rotation is a rigid motion ---');
{
  const p = { x: 3, y: -4, z: 12 };
  const len = (q) => Math.hypot(q.x, q.y, q.z);
  for (const [rx,ry,rz] of [[30,0,0],[0,45,0],[0,0,90],[17,-33,101]]) {
    const r = rotatePoint(p, rx, ry, rz);
    ok(`length preserved (${rx},${ry},${rz})`, near(len(r), len(p), 1e-9),
       `${len(p)} -> ${len(r)}`);
  }
  ok('zero rotation is identity',
     JSON.stringify(rotatePoint(p,0,0,0)) === JSON.stringify(p));
  const there = rotatePoint(p, 25, 40, 15);
  const back = rotatePoint(rotatePoint(rotatePoint(there, -25, 0, 0), 0, -40, 0), 0, 0, -15);
  ok('rotation is invertible in reverse order',
     near(back.x,p.x,1e-9) && near(back.y,p.y,1e-9) && near(back.z,p.z,1e-9),
     JSON.stringify(back));
}

console.log('--- known rotations ---');
{
  const r = rotatePoint({x:1,y:0,z:0}, 0, 90, 0);
  ok('90° about Y sends +x to -z', near(r.x,0,1e-9) && near(r.z,-1,1e-9), JSON.stringify(r));
  const r2 = rotatePoint({x:1,y:0,z:0}, 0, 0, 90);
  ok('90° about Z sends +x to +y', near(r2.x,0,1e-9) && near(r2.y,1,1e-9), JSON.stringify(r2));
  const r3 = rotatePoint({x:0,y:1,z:0}, 90, 0, 0);
  ok('90° about X sends +y to +z', near(r3.y,0,1e-9) && near(r3.z,1,1e-9), JSON.stringify(r3));
}

console.log('--- perspective ---');
{
  const cam = createCamera();
  const centre = projectPoint({ x: cam.x, y: cam.y, z: 0 }, cam, W, H);
  ok('a point on the axis lands at the centre',
     near(centre.x, W/2, 1e-6) && near(centre.y, H/2, 1e-6), JSON.stringify(centre));
  ok('it is visible', centre.visible);

  const nearP = projectPoint({ x: cam.x + 100, y: cam.y, z: 0 }, cam, W, H);
  const farP  = projectPoint({ x: cam.x + 100, y: cam.y, z: 500 }, cam, W, H);
  ok('a further point is drawn smaller', farP.scale < nearP.scale,
     `${nearP.scale.toFixed(4)} vs ${farP.scale.toFixed(4)}`);
  ok('and closer to the centre horizontally',
     Math.abs(farP.x - W/2) < Math.abs(nearP.x - W/2),
     `${nearP.x.toFixed(1)} vs ${farP.x.toFixed(1)}`);
  ok('depth is reported', farP.depth > nearP.depth);

  // The bug this guard exists for: dividing by a negative z flips a point
  // through the origin, so something behind the camera appears in front of
  // it, upside down.
  const behind = projectPoint({ x: cam.x + 100, y: cam.y, z: cam.z - 100 }, cam, W, H);
  ok('a point behind the camera is not visible', !behind.visible, JSON.stringify(behind));
  ok('and is not silently projected', behind.scale === 0);
  const atNear = project({ x: 10, y: 0, z: cam.near }, cam, W, H);
  ok('exactly on the near plane is excluded', !atNear.visible);
  const justPast = project({ x: 10, y: 0, z: cam.near + 0.01 }, cam, W, H);
  ok('just past it is included', justPast.visible);
}

console.log('--- field of view ---');
{
  const wide = { ...createCamera(), fov: 100 };
  const tight = { ...createCamera(), fov: 20 };
  const p = { x: wide.x + 80, y: wide.y, z: 0 };
  const w = projectPoint(p, wide, W, H);
  const t = projectPoint(p, tight, W, H);
  ok('a narrow lens magnifies', t.scale > w.scale, `${w.scale.toFixed(3)} vs ${t.scale.toFixed(3)}`);
  ok('both remain visible', w.visible && t.visible);
}

console.log('--- y runs down, matching the screen ---');
{
  const cam = createCamera();
  const below = projectPoint({ x: cam.x, y: cam.y + 100, z: 0 }, cam, W, H);
  ok('a larger y is further down the screen', below.y > H/2, String(below.y));
}

console.log('--- camera movement ---');
{
  const cam = createCamera();
  const target = { x: 50, y: 50, z: 0 };
  const r0 = distanceTo(cam, target);

  const o = orbit(cam, target, 40, 0);
  ok('orbiting keeps the distance', near(distanceTo(o, target), r0, 1e-6),
     `${r0.toFixed(3)} -> ${distanceTo(o, target).toFixed(3)}`);
  ok('and actually moves the camera', Math.abs(o.x - cam.x) > 1 || Math.abs(o.z - cam.z) > 1);

  let c = cam;
  for (let i = 0; i < 9; i++) c = orbit(c, target, 40, 0);
  ok('nine 40° steps come back round', near(distanceTo(c, target), r0, 1e-5),
     `${distanceTo(c, target).toFixed(4)}`);

  const up = orbit(cam, target, 0, 200);
  ok('pitch is clamped below vertical', up.rotX <= 89 + 1e-9, String(up.rotX));
  const down = orbit(cam, target, 0, -200);
  ok('and above it', down.rotX >= -89 - 1e-9, String(down.rotX));
  ok('a clamped orbit still keeps its radius', near(distanceTo(up, target), r0, 1e-6),
     String(distanceTo(up, target)));

  const closer = dolly(cam, 100);
  ok('dollying forward reduces the distance', distanceTo(closer, target) < r0,
     `${r0.toFixed(1)} -> ${distanceTo(closer, target).toFixed(1)}`);
  const back = dolly(closer, -100);
  ok('and reverses exactly', near(back.z, cam.z, 1e-9), `${cam.z} vs ${back.z}`);
  const turned = { ...cam, rotY: 90 };
  const strafed = dolly(turned, 100);
  ok('dolly follows where the camera looks', Math.abs(strafed.x - cam.x) > 50,
     `${cam.x} -> ${strafed.x}`);
}

console.log('--- an orbited camera still looks at its target ---');
{
  // This is the property that matters and the one that broke: the camera
  // position can be perfectly correct while the rotation faces the wrong
  // way, which puts the subject BEHIND the camera — where it vanishes
  // rather than merely looking wrong.
  const cam = createCamera();
  const target = { x: 50, y: 50, z: 0 };
  let worst = 0, behind = 0;
  for (const yaw of [0, 15, 45, 90, 137, 180, 270, -37, -150]) {
    for (const pitch of [0, 20, -20, 45, -45, 60, -89, 89]) {
      const o = orbit(cam, target, yaw, pitch);
      const p = projectPoint(target, o, W, H);
      if (!p.visible) { behind++; continue; }
      worst = Math.max(worst, Math.hypot(p.x - W/2, p.y - H/2));
    }
  }
  ok('the target is never behind the camera', behind === 0, `${behind} of 72`);
  ok('and always projects to dead centre', worst < 1e-6, `worst ${worst}`);

  // Repeated orbits compose without drifting off target.
  let c = cam;
  for (let i = 0; i < 12; i++) c = orbit(c, target, 31, 7);
  const p = projectPoint(target, c, W, H);
  ok('twelve chained orbits stay locked on',
     p.visible && Math.hypot(p.x - W/2, p.y - H/2) < 1e-6,
     p.visible ? String(Math.hypot(p.x - W/2, p.y - H/2)) : 'BEHIND');

  const dollied = dolly(orbit(cam, target, 60, 25), 20);
  ok('dolly moves toward what the camera looks at',
     distanceTo(dollied, target) < distanceTo(orbit(cam, target, 60, 25), target));
}

console.log('--- framing distance frames exactly ---');
{
  const cam = createCamera();
  const top = projectPoint({ x: 50, y: 0, z: 0 }, cam, W, H);
  const bottom = projectPoint({ x: 50, y: 100, z: 0 }, cam, W, H);
  ok('world y=0 lands on the top edge', near(top.y, 0, 1e-9), String(top.y));
  ok('world y=100 lands on the bottom edge', near(bottom.y, H, 1e-9), String(bottom.y));
  const big = projectPoint({ x: 50, y: 100, z: 0 }, cam, 1920, 1080);
  ok('framing is independent of canvas size', near(big.y / 1080, bottom.y / H, 1e-12),
     `${bottom.y / H} vs ${big.y / 1080}`);
  const wide = createCamera(100);
  const w = projectPoint({ x: 50, y: 100, z: 0 }, wide, W, H);
  ok('a different lens still frames exactly', near(w.y, H, 1e-9), String(w.y));
}

console.log('--- depth sorting (painter algorithm) ---');
{
  const cam = createCamera();
  const items = [
    { name: 'near', x: 50, y: 50, z: -100 },
    { name: 'far',  x: 50, y: 50, z: 400 },
    { name: 'mid',  x: 50, y: 50, z: 100 },
  ];
  const order = depthSort(items, cam).map(i => i.name);
  ok('furthest is drawn first', order[0] === 'far', order.join());
  ok('nearest is drawn last', order[order.length-1] === 'near', order.join());
  ok('nothing is lost', order.length === 3);

  const coplanar = [{n:'a',x:0,y:0,z:0},{n:'b',x:0,y:0,z:0},{n:'c',x:0,y:0,z:0}];
  ok('equal depths keep authored order',
     depthSort(coplanar, cam).map(i=>i.n).join() === 'a,b,c');
  ok('sorting twice is stable',
     depthSort(depthSort(coplanar, cam), cam).map(i=>i.n).join() === 'a,b,c');
  ok('a missing z is treated as zero',
     depthSort([{n:'x',x:0,y:0}], cam).length === 1);
  ok('an empty list does not throw', depthSort([], cam).length === 0);
}

console.log('--- the camera turning moves the world the other way ---');
{
  const cam = createCamera();
  const p = { x: cam.x + 60, y: cam.y, z: 0 };
  const straight = projectPoint(p, cam, W, H);
  const turnedRight = projectPoint(p, { ...cam, rotY: 15 }, W, H);
  ok('turning right moves the point left on screen', turnedRight.x < straight.x,
     `${straight.x.toFixed(1)} -> ${turnedRight.x.toFixed(1)}`);
}

console.log('--- presets are usable ---');
{
  ok('every preset has three angles',
     Object.values(CAMERA_PRESETS).every(p => ['rotX','rotY','rotZ'].every(k => Number.isFinite(p[k]))));
  const cam = createCamera();
  for (const [name, preset] of Object.entries(CAMERA_PRESETS)) {
    const c = { ...cam, ...preset };
    const p = projectPoint({ x: cam.x, y: cam.y, z: 0 }, c, W, H);
    ok(`${name} produces finite coordinates`, Number.isFinite(p.x) && Number.isFinite(p.y),
       JSON.stringify(p));
  }
}

console.log('--- nothing produces NaN ---');
{
  const cam = createCamera();
  const weird = [{x:0,y:0,z:0},{x:1e6,y:-1e6,z:1e6},{x:-1e-9,y:0,z:0.5}];
  ok('extreme points stay finite or are marked invisible', weird.every(p => {
    const r = projectPoint(p, cam, W, H);
    return !r.visible || (Number.isFinite(r.x) && Number.isFinite(r.y) && Number.isFinite(r.scale));
  }));
  ok('a zero-size viewport does not divide by zero',
     Number.isFinite(projectPoint({x:0,y:0,z:100}, cam, 0, 0).x));
}


console.log('--- angle interpolation takes the short way round ---');
{
  const { normalizeAngle, lerpAngle } = await import('../js/camera3d.js');
  ok('350 folds to -10', normalizeAngle(350) === -10, String(normalizeAngle(350)));
  ok('-190 folds to 170', normalizeAngle(-190) === 170, String(normalizeAngle(-190)));
  ok('180 stays put', Math.abs(normalizeAngle(180)) === 180);
  ok('0 -> 90 halfway is 45', near(lerpAngle(0, 90, 0.5), 45));
  // The case that matters: 170 and -170 are 20 degrees apart, and a naive
  // lerp sweeps 340 degrees backwards through zero instead.
  ok('170 -> -170 crosses the seam, not the scene',
     Math.abs(Math.abs(lerpAngle(170, -170, 0.5)) - 180) < 1e-9,
     String(lerpAngle(170, -170, 0.5)));
  ok('and lands exactly', near(normalizeAngle(lerpAngle(170, -170, 1)), -170));
  ok('the reverse crossing too',
     Math.abs(Math.abs(lerpAngle(-170, 170, 0.5)) - 180) < 1e-9);
  ok('t=0 returns the start', near(lerpAngle(37, -152, 0), 37));
}

console.log('--- sampling an animated camera ---');
{
  const { sampleCamera, setCameraKeyframe, removeCameraKeyframe } = await import('../js/camera3d.js');
  const base = createCamera();

  ok('no keyframes returns the static camera untouched',
     sampleCamera(null, 2, base) === base);
  ok('an empty list too', sampleCamera([], 2, base) === base);

  let keys = setCameraKeyframe([], 0, { ...base, z: -100 });
  keys = setCameraKeyframe(keys, 4, { ...base, z: -40, rotY: 30 });
  ok('two keys stored', keys.length === 2);

  const mid = sampleCamera(keys, 2, base);
  ok('position interpolates', near(mid.z, -70), String(mid.z));
  ok('rotation interpolates', near(mid.rotY, 15), String(mid.rotY));
  ok('fov carries through', near(mid.fov, base.fov));

  ok('before the first key clamps', near(sampleCamera(keys, -1, base).z, -100));
  ok('after the last key clamps', near(sampleCamera(keys, 99, base).z, -40));

  const single = sampleCamera(setCameraKeyframe([], 1, { ...base, z: -55 }), 3, base);
  ok('a single key holds its value everywhere', near(single.z, -55));

  keys = setCameraKeyframe(keys, 2, { ...base, z: -200 });
  ok('inserting keeps time order', keys.map(k => k.time).join() === '0,2,4',
     keys.map(k => k.time).join());
  keys = setCameraKeyframe(keys, 2, { ...base, z: -150 });
  ok('re-keying the same time replaces, not duplicates', keys.length === 3);
  ok('with the new value', near(sampleCamera(keys, 2, base).z, -150));

  removeCameraKeyframe(keys, 2);
  ok('removal works', keys.length === 2 && near(sampleCamera(keys, 2, base).z, -70));
  ok('removing a missing time is harmless', removeCameraKeyframe(keys, 9.7).length === 2);

  // Easing on a camera key paces the move like any shape keyframe.
  keys[0].easeFn = (t) => t * t;
  const eased = sampleCamera(keys, 2, base);
  ok('an easing function shapes the sweep', eased.z < -70, String(eased.z));
}

console.log('--- camera keys survive JSON (easeFn must not leak) ---');
{
  const { setCameraKeyframe, sampleCamera } = await import('../js/camera3d.js');
  const base = createCamera();
  let keys = setCameraKeyframe([], 0, base, 'settle');
  keys[0].easeFn = (t) => t;
  const round = JSON.parse(JSON.stringify(keys));
  ok('the ease name survives', round[0].ease === 'settle');
  ok('the attached function does not pollute the file', round[0].easeFn === undefined);
  ok('the round-tripped keys still sample', near(sampleCamera(round, 0, base).z, base.z));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
