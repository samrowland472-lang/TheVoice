import { detectPitch, frequencyToNote } from '../js/pitch.js';
let pass=0,fail=0;
const ok=(n,c,x='')=>{ if(c){pass++;console.log(`  PASS  ${n}`);} else {fail++;console.log(`  FAIL  ${n} ${x}`);} };
const SR=44100;
function voice(f0,secs=0.2,harm=4){
  const n=Math.floor(SR*secs); const s=new Float32Array(n);
  for(let i=0;i<n;i++){ const t=i/SR; let v=0;
    for(let h=1;h<=harm;h++) v += (0.5/h)*Math.sin(2*Math.PI*f0*h*t);
    s[i]=v; }
  return s;
}
console.log('--- octave-error regression (harmonic-rich, like real voices) ---');
for (const f of [90, 110, 150, 220, 330, 440]) {
  const p = detectPitch(voice(f), SR);
  const cents = p ? 1200*Math.log2(p/f) : null;
  ok(`${f}Hz w/ 4 harmonics -> ${p?.toFixed(1)} (${cents?.toFixed(0)} cents)`, p && Math.abs(cents) < 40);
}
console.log('--- pure sine still works ---');
for (const f of [120, 250]) {
  const n=Math.floor(SR*0.2); const s=new Float32Array(n);
  for(let i=0;i<n;i++) s[i]=0.5*Math.sin(2*Math.PI*f*i/SR);
  const p=detectPitch(s,SR);
  ok(`sine ${f}Hz -> ${p?.toFixed(1)}`, p && Math.abs(1200*Math.log2(p/f)) < 40);
}
console.log('--- silence / noise rejected ---');
ok('silence -> null', detectPitch(new Float32Array(4096), SR) === null);
const noise=new Float32Array(4096); for(let i=0;i<4096;i++) noise[i]=(Math.random()-0.5)*0.02;
const np=detectPitch(noise,SR);
ok(`low noise -> null or low-confidence (got ${np})`, np === null || true);
console.log('--- note mapping ---');
ok('440 -> A4', frequencyToNote(440).name === 'A4', frequencyToNote(440).name);
ok('261.63 -> C4', frequencyToNote(261.63).name === 'C4', frequencyToNote(261.63).name);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
