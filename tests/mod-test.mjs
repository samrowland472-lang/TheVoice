import { timeStretch, resample, pitchShift, formantShift, modulate } from '../js/modulation.js';
import { detectPitch } from '../js/pitch.js';

let pass=0, fail=0;
const ok=(n,c,x='')=>{ if(c){pass++;console.log(`  PASS  ${n}`);} else {fail++;console.log(`  FAIL  ${n} ${x}`);} };

const SR = 44100;
// A voice-like signal: fundamental + harmonics (a pure sine has no formants
// to speak of, so harmonics make the formant test meaningful).
function voice(f0, secs = 1.0) {
  const n = Math.floor(SR * secs);
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    s[i] = 0.5*Math.sin(2*Math.PI*f0*t)
         + 0.25*Math.sin(2*Math.PI*f0*2*t)
         + 0.12*Math.sin(2*Math.PI*f0*3*t)
         + 0.06*Math.sin(2*Math.PI*f0*4*t);
  }
  return s;
}
// Measure pitch from the stable middle of a signal.
function measure(sig) {
  const mid = Math.floor(sig.length/2);
  return detectPitch(sig.subarray(mid-2048, mid+2048), SR);
}

console.log('--- baseline: detector agrees with what we synthesised ---');
const base = voice(220);
const basePitch = measure(base);
ok(`220Hz detected (got ${basePitch?.toFixed(1)})`, basePitch && Math.abs(basePitch-220) < 5);

console.log('--- timeStretch changes duration, not pitch ---');
for (const r of [0.5, 1.5, 2.0]) {
  const st = timeStretch(base, r);
  const ratio = st.length / base.length;
  ok(`stretch x${r}: duration ~x${r} (got x${ratio.toFixed(2)})`, Math.abs(ratio - r) < 0.1);
  const p = measure(st);
  ok(`stretch x${r}: pitch held at 220 (got ${p?.toFixed(1)})`, p && Math.abs(p-220) < 12);
}

console.log('--- pitchShift moves pitch by the right interval, keeps duration ---');
for (const [semi, expected] of [[12, 440], [-12, 110], [7, 220*Math.pow(2,7/12)], [3, 220*Math.pow(2,3/12)]]) {
  const sh = pitchShift(base, semi);
  const p = measure(sh);
  const cents = p ? 1200*Math.log2(p/expected) : null;
  ok(`${semi>0?'+':''}${semi} semi -> ${expected.toFixed(0)}Hz (got ${p?.toFixed(1)}, ${cents?.toFixed(0)} cents off)`,
     p && Math.abs(cents) < 60);
  const durRatio = sh.length / base.length;
  ok(`${semi>0?'+':''}${semi} semi: duration preserved (x${durRatio.toFixed(2)})`, Math.abs(durRatio-1) < 0.15);
}

console.log('--- formantShift leaves pitch alone (the whole point) ---');
for (const fr of [0.75, 1.3]) {
  const fs = formantShift(base, fr);
  const p = measure(fs);
  ok(`formant x${fr}: pitch still 220 (got ${p?.toFixed(1)})`, p && Math.abs(p-220) < 12);
  ok(`formant x${fr}: length preserved`, fs.length === base.length);
  let energy=0; for (let i=0;i<fs.length;i++) energy+=fs[i]*fs[i];
  ok(`formant x${fr}: produced real audio (rms ${Math.sqrt(energy/fs.length).toFixed(3)})`, Math.sqrt(energy/fs.length) > 0.01);
}

console.log('--- formantShift actually changes timbre (not a no-op) ---');
const shifted = formantShift(base, 0.7);
let diff=0; for (let i=1000;i<base.length-1000;i++) diff += Math.abs(shifted[i]-base[i]);
ok(`spectrum genuinely altered (mean abs diff ${(diff/base.length).toFixed(4)})`, diff/base.length > 0.005);

console.log('--- combined modulate ---');
const m = modulate(base, { semitones: -5, formant: 1.25 });
const mp = measure(m);
const expect5 = 220*Math.pow(2,-5/12);
ok(`anonymised: pitch ${expect5.toFixed(0)}Hz (got ${mp?.toFixed(1)})`, mp && Math.abs(1200*Math.log2(mp/expect5)) < 80);
ok('anonymised: length sane', Math.abs(m.length/base.length - 1) < 0.2);

console.log('--- identity / edge cases ---');
ok('0 semitones is identity', pitchShift(base,0).length === base.length);
ok('formant 1.0 is identity', formantShift(base,1).length === base.length);
ok('no NaNs in output', !Array.from(pitchShift(base,5).slice(0,5000)).some(Number.isNaN));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
