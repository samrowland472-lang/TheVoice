const { createLight, lightDirection, lightTint, sampleLight,
        setLightKeyframe, removeLightKeyframe } = await import('../js/light3d.js');
const { lambert, renderMesh, AMBIENT } = await import('../js/mesh3d.js');
const { createCamera } = await import('../js/camera3d.js');

let pass=0,fail=0;
const ok=(n,c,x='')=>{c?(pass++,console.log(`  PASS  ${n}`)):(fail++,console.log(`  FAIL  ${n} ${x}`))};
const near=(a,b,t=1e-9)=>Math.abs(a-b)<t;

console.log('--- direction from angles ---');
{
  const noon = lightDirection({ azimuth: 0, elevation: 89 });
  ok('high noon travels almost straight down', noon.y > 0.99, JSON.stringify(noon));
  const front = lightDirection({ azimuth: 0, elevation: 0 });
  ok('level and centred travels straight into the scene',
     near(front.z, 1, 1e-9) && near(front.x, 0, 1e-9), JSON.stringify(front));
  const left = lightDirection({ azimuth: 90, elevation: 0 });
  ok('azimuth 90 travels rightward (source at the viewer left)',
     near(left.x, 1, 1e-9), JSON.stringify(left));
  for (const az of [0, 45, 137, -60]) for (const el of [-45, 0, 30, 80]) {
    const d = lightDirection({ azimuth: az, elevation: el });
    if (!near(Math.hypot(d.x, d.y, d.z), 1, 1e-9)) { ok(`unit at ${az}/${el}`, false); }
  }
  ok('every direction is unit length', true);
  ok('extreme elevation is clamped short of the pole',
     Number.isFinite(lightDirection({ azimuth: 0, elevation: 500 }).y));
}

console.log('--- warmth tint ---');
{
  const neutral = lightTint(0.5);
  ok('neutral is exactly identity', neutral.r === 1 && neutral.g === 1 && neutral.b === 1,
     JSON.stringify(neutral));
  const warm = lightTint(1);
  ok('warm boosts red and cuts blue', warm.r > 1 && warm.b < 1, JSON.stringify(warm));
  const cold = lightTint(0);
  ok('cold does the opposite', cold.r < 1 && cold.b > 1, JSON.stringify(cold));
  ok('out-of-range input is clamped', lightTint(99).r === lightTint(1).r);
  ok('the excursion is gentle, not a recolour', warm.r < 1.4 && cold.b < 1.4,
     JSON.stringify({ warm, cold }));
}

console.log('--- the default matches the old fixed light ---');
{
  // Switching a scene to 3D must look identical before and after scene
  // lighting existed. The old light vector was (0.5, 0.62, 0.6) normalised.
  const d = lightDirection(createLight());
  const L = { x: 0.5, y: 0.62, z: 0.6 };
  const len = Math.hypot(L.x, L.y, L.z);
  const dot = d.x * L.x / len + d.y * L.y / len + d.z * L.z / len;
  ok('the default direction is the old key light (within a degree)',
     dot > Math.cos(1.5 * Math.PI / 180), String(Math.acos(Math.min(1, dot)) * 180 / Math.PI));
  ok('the default ambient matches', near(createLight().ambient, AMBIENT));
  ok('the default warmth is neutral', createLight().warmth === 0.5);
}

console.log('--- sampling through keyframes ---');
{
  const base = createLight();
  ok('no keys returns the base untouched', sampleLight(null, 2, base) === base);

  let keys = setLightKeyframe([], 0, { azimuth: -90, elevation: 5, ambient: 0.2, warmth: 1 });
  keys = setLightKeyframe(keys, 4, { azimuth: 0, elevation: 80, ambient: 0.4, warmth: 0.5 });
  const mid = sampleLight(keys, 2, base);
  ok('azimuth sweeps', near(mid.azimuth, -45), String(mid.azimuth));
  ok('elevation climbs', near(mid.elevation, 42.5), String(mid.elevation));
  ok('warmth cools', near(mid.warmth, 0.75), String(mid.warmth));
  ok('ambient rises', near(mid.ambient, 0.3), String(mid.ambient));
  ok('before the first key clamps', near(sampleLight(keys, -1, base).azimuth, -90));
  ok('after the last clamps', near(sampleLight(keys, 99, base).elevation, 80));

  // The seam: 170 to -170 is a 20-degree move, not a 340-degree one.
  let wrap = setLightKeyframe([], 0, { azimuth: 170, elevation: 0, ambient: 0.3, warmth: 0.5 });
  wrap = setLightKeyframe(wrap, 2, { azimuth: -170, elevation: 0, ambient: 0.3, warmth: 0.5 });
  ok('azimuth crosses the seam the short way',
     Math.abs(Math.abs(sampleLight(wrap, 1, base).azimuth) - 180) < 1e-9,
     String(sampleLight(wrap, 1, base).azimuth));

  keys = setLightKeyframe(keys, 2, { azimuth: 10, elevation: 10, ambient: 0.3, warmth: 0.5 });
  ok('re-keying a time replaces', keys.length === 3);
  removeLightKeyframe(keys, 2);
  ok('removal works', keys.length === 2);

  keys[0].easeFn = (t) => t * t;
  ok('easing paces the sweep', sampleLight(keys, 2, base).elevation < 42.5,
     String(sampleLight(keys, 2, base).elevation));
  const round = JSON.parse(JSON.stringify(keys));
  ok('easeFn never reaches a saved file', round[0].easeFn === undefined);
}

console.log('--- the light actually changes what renders ---');
{
  const cam = createCamera();
  const inst = { x: 50, y: 50, z: 0, size: 20, rotX: 25, rotY: 40, rotZ: 0, color: '#8899aa' };
  const plain = renderMesh('cube', inst, cam, 640, 360);
  const warm = renderMesh('cube', inst, cam, 640, 360,
    { dir: lightDirection(createLight()), ambient: 0.35, tint: lightTint(1) });
  ok('same faces either way', plain.length === warm.length);
  const channel = (hex, i) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  ok('a warm light shifts faces toward red',
     warm.every((f, i) => channel(f.color, 0) >= channel(plain[i].color, 0)
                       && channel(f.color, 2) <= channel(plain[i].color, 2)),
     `${plain[0].color} -> ${warm[0].color}`);
  const swung = renderMesh('cube', inst, cam, 640, 360,
    { dir: lightDirection({ azimuth: -120, elevation: 10 }), ambient: 0.35, tint: lightTint(0.5) });
  ok('moving the light re-shades the faces',
     swung.some((f, i) => f.color !== plain[i].color),
     swung.map(f => f.color).join());
  const brightAmbient = renderMesh('cube', inst, cam, 640, 360,
    { dir: lightDirection(createLight()), ambient: 0.85, tint: lightTint(0.5) });
  ok('raising ambient lifts the darkest face',
     Math.min(...brightAmbient.map(f => channel(f.color, 1)))
       > Math.min(...plain.map(f => channel(f.color, 1))));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
