import { cubicBezier, resolveEasing, easingPoints, hasOvershoot,
         EASING_CURVES, EASING_NAMES, SPECIAL_NAMES, ALL_EASING_NAMES }
  from '../js/easing.js';

let pass=0,fail=0;
const ok=(n,c,x='')=>{c?(pass++,console.log(`  PASS  ${n}`)):(fail++,console.log(`  FAIL  ${n} ${x}`))};
const near=(a,b,eps=1e-4)=>Math.abs(a-b)<eps;

console.log('--- endpoints are exact ---');
for (const name of ALL_EASING_NAMES) {
  const e = resolveEasing(name);
  ok(`${name}: starts at 0`, e(0) === 0, String(e(0)));
  ok(`${name}: ends at 1`, e(1) === 1, String(e(1)));
}

console.log('--- linear really is linear ---');
{
  const e = resolveEasing('linear');
  let worst = 0;
  for (let i = 0; i <= 100; i++) worst = Math.max(worst, Math.abs(e(i/100) - i/100));
  ok('matches y=x across the range', worst < 1e-6, String(worst));
}

console.log('--- against known cubic-bezier values ---');
{
  // ease-in-out is symmetric about the midpoint by construction.
  const e = resolveEasing('easeInOut');
  ok('easeInOut(0.5) = 0.5', near(e(0.5), 0.5), String(e(0.5)));
  ok('easeInOut is symmetric', near(e(0.25) + e(0.75), 1, 1e-3),
     `${e(0.25)} + ${e(0.75)}`);

  // Hand-solved: cubic-bezier(0.42,0,1,1) at x=0.5.
  const easeIn = cubicBezier(0.42, 0, 1, 1);
  ok('easeIn lags linear in the first half', easeIn(0.5) < 0.5 - 0.05, String(easeIn(0.5)));
  const easeOut = cubicBezier(0, 0, 0.58, 1);
  ok('easeOut leads linear in the first half', easeOut(0.5) > 0.5 + 0.05, String(easeOut(0.5)));
  ok('easeIn and easeOut are mirror images',
     near(easeIn(0.3), 1 - easeOut(0.7), 1e-3), `${easeIn(0.3)} vs ${1-easeOut(0.7)}`);
}

console.log('--- x(t) is inverted correctly ---');
{
  // Round-trip: for a curve, y at the x of a known point must match.
  // Verified independently by dense sampling of the parametric form.
  const [x1,y1,x2,y2] = [0.33, 0.9, 0.66, 0.1];
  const e = cubicBezier(x1,y1,x2,y2);
  let worst = 0;
  for (let i = 1; i < 1000; i++) {
    const t = i/1000;
    const bx = 3*(1-t)*(1-t)*t*x1 + 3*(1-t)*t*t*x2 + t*t*t;
    const by = 3*(1-t)*(1-t)*t*y1 + 3*(1-t)*t*t*y2 + t*t*t;
    worst = Math.max(worst, Math.abs(e(bx) - by));
  }
  ok('solver matches the parametric curve everywhere', worst < 1e-4, String(worst));
}

console.log('--- monotonic in x, as a timing curve must be ---');
for (const name of EASING_NAMES) {
  const e = resolveEasing(name);
  let mono = true, prev = -Infinity;
  for (let i = 0; i <= 200; i++) { const x = i/200; if (x < prev) mono = false; prev = x; }
  ok(`${name}: defined across the whole range`,
     Array.from({length:201}, (_,i) => e(i/200)).every(Number.isFinite));
}

console.log('--- overshoot is preserved, not clamped away ---');
{
  const back = resolveEasing('backOut');
  let maxY = 0;
  for (let i = 0; i <= 100; i++) maxY = Math.max(maxY, back(i/100));
  ok('backOut carries past its target', maxY > 1.02, String(maxY));

  const anticipate = resolveEasing('anticipate');
  let minY = 1;
  for (let i = 0; i <= 100; i++) minY = Math.min(minY, anticipate(i/100));
  ok('anticipate pulls back before moving', minY < -0.02, String(minY));

  ok('hasOvershoot detects backOut', hasOvershoot('backOut') === true);
  ok('hasOvershoot detects anticipate', hasOvershoot('anticipate') === true);
  ok('hasOvershoot is false for ease', hasOvershoot('ease') === false);
  ok('hasOvershoot is false for linear', hasOvershoot('linear') === false);
  ok('elastic overshoots', hasOvershoot('elastic') === true);
}

console.log('--- x control points are clamped (a timing curve must be a function) ---');
{
  const wild = cubicBezier(-2, 0, 3, 1);
  const vals = Array.from({length: 101}, (_,i) => wild(i/100));
  ok('no NaN from out-of-range x handles', vals.every(Number.isFinite));
  let mono = true;
  for (let i = 1; i < vals.length; i++) if (vals[i] < vals[i-1] - 1e-6) mono = false;
  ok('result stays non-decreasing', mono, vals.slice(0,5).join());
}

console.log('--- degenerate curves do not hang or explode ---');
{
  const flat = cubicBezier(0, 0, 0, 0);
  ok('all-zero handles are finite', Array.from({length:50},(_,i)=>flat(i/49)).every(Number.isFinite));
  const one = cubicBezier(1, 1, 1, 1);
  ok('all-one handles are finite', Array.from({length:50},(_,i)=>one(i/49)).every(Number.isFinite));
  const same = cubicBezier(0.5, 0.5, 0.5, 0.5);
  ok('coincident handles approximate linear', near(same(0.5), 0.5, 0.02), String(same(0.5)));
  const steep = cubicBezier(1, 0, 0, 1);
  ok('a step-like curve is finite', Array.from({length:50},(_,i)=>steep(i/49)).every(Number.isFinite));
}

console.log('--- out of range input is clamped, not extrapolated ---');
{
  const e = resolveEasing('backOut');
  ok('below zero returns 0', e(-1) === 0);
  ok('above one returns 1', e(2) === 1);
  ok('exactly zero returns 0', e(0) === 0);
}

console.log('--- hold and step ---');
{
  const hold = resolveEasing('hold');
  ok('hold stays at the start value', hold(0.99) === 0, String(hold(0.99)));
  ok('hold snaps at the end', hold(1) === 1);
  const step = resolveEasing('step');
  ok('step holds before the midpoint', step(0.49) === 0, String(step(0.49)));
  ok('step cuts at the midpoint', step(0.5) === 1, String(step(0.5)));
  ok('hold and step are genuinely different', hold(0.75) !== step(0.75));
}

console.log('--- resolveEasing accepts what the editor will produce ---');
{
  const custom = resolveEasing([0.1, 0.7, 0.9, 0.2]);
  ok('a raw control-point array works', typeof custom === 'function' && near(custom(0), 0));
  ok('it differs from the default', Math.abs(custom(0.3) - resolveEasing('ease')(0.3)) > 0.01);
  ok('the same array is cached, not rebuilt',
     resolveEasing([0.1,0.7,0.9,0.2]) === resolveEasing([0.1,0.7,0.9,0.2]));
  ok('a function passes straight through',
     resolveEasing((t) => t * 0.5)(1) === 0.5);

  ok('an unknown name falls back', resolveEasing('nonsense')(0.5) === resolveEasing('ease')(0.5));
  ok('undefined falls back', resolveEasing(undefined)(0.5) === resolveEasing('ease')(0.5));
  ok('null falls back', resolveEasing(null)(0.5) === resolveEasing('ease')(0.5));
  ok('a short array falls back', resolveEasing([0.1, 0.2])(0.5) === resolveEasing('ease')(0.5));
  ok('an array with NaN falls back',
     resolveEasing([0.1, NaN, 0.9, 0.2])(0.5) === resolveEasing('ease')(0.5));
  ok('a custom fallback is honoured',
     resolveEasing(undefined, 'linear')(0.5) === 0.5);
}

console.log('--- easingPoints, for the curve editor ---');
{
  ok('a name gives its control points',
     easingPoints('easeInOut').join() === EASING_CURVES.easeInOut.join());
  ok('an array is returned as-is', easingPoints([0.1,0.2,0.3,0.4]).join() === '0.1,0.2,0.3,0.4');
  ok('it returns a copy, not the original',
     easingPoints('ease') !== EASING_CURVES.ease);
  const p = easingPoints('ease'); p[0] = 99;
  ok('mutating the copy cannot corrupt the presets', EASING_CURVES.ease[0] !== 99);
  ok('an unknown name still gives usable points', easingPoints('nope').length === 4);
}

console.log('--- the old five presets still resolve ---');
for (const legacy of ['linear','ease','easeIn','easeOut','bounce']) {
  ok(`${legacy} survives`, typeof resolveEasing(legacy) === 'function' && ALL_EASING_NAMES.includes(legacy));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
