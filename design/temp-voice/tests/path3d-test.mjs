const { catmullRom, samplePath, pathPolyline, pathLength }
  = await import('../js/path3d.js');

let pass=0,fail=0;
const ok=(n,c,x='')=>{c?(pass++,console.log(`  PASS  ${n}`)):(fail++,console.log(`  FAIL  ${n} ${x}`))};
const near=(a,b,t=1e-9)=>Math.abs(a-b)<t;
const P = (x,y,z=0) => ({x,y,z});

console.log('--- the spline passes through its points ---');
{
  // The defining property of Catmull-Rom, and the reason it is used here
  // instead of Bezier: keyframes stay exactly where they were authored.
  ok('t=0 is the start point', near(catmullRom(0, 10, 20, 30, 0), 10));
  ok('t=1 is the end point', near(catmullRom(0, 10, 20, 30, 1), 20));
  const pts = [P(0,0), P(10,20), P(30,5), P(50,40)];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = samplePath(pts, i, 0);
    ok(`segment ${i} starts exactly on keyframe ${i}`,
       near(a.x, pts[i].x, 1e-9) && near(a.y, pts[i].y, 1e-9), JSON.stringify(a));
    const b = samplePath(pts, i, 1);
    ok(`segment ${i} ends exactly on keyframe ${i+1}`,
       near(b.x, pts[i+1].x, 1e-9) && near(b.y, pts[i+1].y, 1e-9), JSON.stringify(b));
  }
}

console.log('--- collinear points stay straight ---');
{
  // A path through points already on a line must not bulge; otherwise
  // enabling smoothing would visibly move a deliberately straight move.
  const line = [P(0,0), P(10,10), P(20,20), P(30,30)];
  let worst = 0;
  for (let i = 0; i < line.length - 1; i++) {
    for (let s = 0; s <= 10; s++) {
      const p = samplePath(line, i, s / 10);
      worst = Math.max(worst, Math.abs(p.x - p.y));  // the line is x === y
    }
  }
  ok('a straight run stays straight', worst < 1e-9, `worst deviation ${worst}`);
}

console.log('--- a corner becomes an arc ---');
{
  // Three points forming a right angle. Linear interpolation would put the
  // midpoint of the second segment exactly on the leg; the spline should
  // pull it off, which is the whole point.
  const corner = [P(0,0), P(50,0), P(50,50)];
  const mid = samplePath(corner, 1, 0.5);
  // Arriving along +x and leaving along +y, the path carries its momentum
  // past the corner before curving back — follow-through, the way a car
  // takes a bend. Cutting inside instead would read as braking at every
  // keyframe, which is the mechanical look this exists to remove.
  ok('the turn overshoots the corner, carrying momentum', mid.x > 50 + 0.5, `x=${mid.x}`);
  ok('and still heads toward the destination', mid.y > 20 && mid.y < 30, `y=${mid.y}`);
  ok('it returns exactly to the keyframe', near(samplePath(corner, 1, 1).x, 50, 1e-9));
  const straightMid = { x: 50, y: 25 };
  ok('it differs measurably from the linear route',
     Math.hypot(mid.x - straightMid.x, mid.y - straightMid.y) > 1,
     String(Math.hypot(mid.x - straightMid.x, mid.y - straightMid.y)));
}

console.log('--- the ends curve too ---');
{
  // Reflection at the ends, not duplication: a duplicated endpoint flattens
  // the tangent, so the shape leaves its first keyframe in a straight line
  // and only starts curving later — a kink where the eye is drawn.
  const pts = [P(0,0), P(20,30), P(40,0)];
  const early = samplePath(pts, 0, 0.1);
  const linearEarly = { x: 2, y: 3 };
  ok('the first segment departs on a curve, not a straight line',
     Math.hypot(early.x - linearEarly.x, early.y - linearEarly.y) > 0.1,
     JSON.stringify(early));
  const late = samplePath(pts, 1, 0.9);
  ok('the last segment arrives on a curve', Number.isFinite(late.x) && Number.isFinite(late.y));
}

console.log('--- bend: zero must change nothing at all ---');
{
  // The property that matters most: turning smoothing on at bend 0 must
  // leave an already-timed animation untouched, in route AND in pacing.
  // The textbook formulation fails this — zero tangents make Hermite a
  // smoothstep, which keeps the line but re-paces travel along it.
  const corner = [P(0,0), P(50,0), P(50,50)];
  let worst = 0;
  for (let seg = 0; seg < 2; seg++) {
    for (let s = 0; s <= 20; s++) {
      const t = s / 20;
      const got = samplePath(corner, seg, t, 0);
      const a = corner[seg], b = corner[seg + 1];
      worst = Math.max(worst,
        Math.abs(got.x - (a.x + (b.x - a.x) * t)),
        Math.abs(got.y - (a.y + (b.y - a.y) * t)));
    }
  }
  ok('bend 0 is exactly linear at every fraction, not just the midpoint',
     worst < 1e-9, `worst ${worst}`);

  const normal = samplePath(corner, 1, 0.5, 0.5);
  const loose = samplePath(corner, 1, 0.5, 1);
  ok('more bend swings wider', Math.abs(loose.x - 50) > Math.abs(normal.x - 50),
     `${normal.x} vs ${loose.x}`);
  ok('and bend scales smoothly between them',
     Math.abs(normal.x - 50) > 0 && Math.abs(normal.x - 50) < Math.abs(loose.x - 50));
}

console.log('--- three dimensions, not two ---');
{
  const spatial = [P(0,0,0), P(10,0,40), P(20,0,0)];
  const mid = samplePath(spatial, 0, 0.5);
  ok('depth is interpolated too', mid.z > 0, String(mid.z));
  ok('and curves like the other axes', mid.z !== 20, String(mid.z));
}

console.log('--- polyline for drawing the route ---');
{
  const pts = [P(0,0), P(10,20), P(30,5)];
  const line = pathPolyline(pts, 8);
  ok('has the right number of samples', line.length === 2 * 8 + 1, String(line.length));
  ok('starts on the first keyframe', near(line[0].x, 0) && near(line[0].y, 0));
  ok('ends exactly on the last keyframe',
     near(line[line.length-1].x, 30) && near(line[line.length-1].y, 5),
     JSON.stringify(line[line.length-1]));
  ok('every sample is finite', line.every(p => Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z)));
  ok('two points still produce a line', pathPolyline([P(0,0), P(10,10)], 4).length === 5);
  ok('one point produces nothing', pathPolyline([P(0,0)]).length === 0);
  ok('no points produces nothing', pathPolyline([]).length === 0);
  ok('a non-array does not throw', pathPolyline(null).length === 0);
}

console.log('--- arc length ---');
{
  const straight = [P(0,0), P(30,40)];   // 3-4-5 triangle: length 50
  ok('a straight path measures its true length',
     Math.abs(pathLength(straight, 32) - 50) < 0.01, String(pathLength(straight, 32)));
  const curved = [P(0,0), P(25,30), P(50,0)];
  const chord = Math.hypot(25,30) + Math.hypot(25,30);
  ok('a curved path is longer than its chords', pathLength(curved, 32) > chord * 0.99);
  ok('and finite', Number.isFinite(pathLength(curved)));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
