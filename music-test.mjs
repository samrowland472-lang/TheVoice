import { createPattern, renderPattern, applyPreset, mixTracks, stepDuration,
         TRACKS, STEPS, PRESET_PATTERNS } from '../js/music.js';
import { countSyllables, countLineSyllables, rhymeKey, doesRhyme, rhymeScheme,
         scaleChords, progressionInKey, PROGRESSIONS } from '../js/songcraft.js';
import { detectPitch } from '../js/pitch.js';

let pass=0,fail=0;
const ok=(n,c,x='')=>{c?(pass++,console.log(`  PASS  ${n}`)):(fail++,console.log(`  FAIL  ${n} ${x}`))};
const rms=(a)=>{let s=0;for(let i=0;i<a.length;i++)s+=a[i]*a[i];return Math.sqrt(s/a.length)};

console.log('--- pattern basics ---');
const p = createPattern();
ok('all tracks present', TRACKS.every(t=>p.grid[t.id].length===STEPS));
ok('starts empty', TRACKS.every(t=>p.grid[t.id].every(v=>v===false)));
ok('120bpm step = 0.125s', Math.abs(stepDuration(120)-0.125)<1e-9, String(stepDuration(120)));

console.log('--- silence in, silence out ---');
ok('empty pattern renders silence', rms(renderPattern(p,44100,1))===0);

console.log('--- each voice makes sound ---');
for (const t of TRACKS) {
  const one = createPattern();
  one.grid[t.id][0] = true;
  const audio = renderPattern(one, 44100, 1);
  const r = rms(audio);
  ok(`${t.name} produces audio (rms ${r.toFixed(4)})`, r > 0.001, String(r));
  ok(`${t.name} has no NaN`, !audio.some(Number.isNaN));
  ok(`${t.name} stays in range`, audio.every(v=>v>=-1.001&&v<=1.001));
}

console.log('--- bass plays the requested pitch ---');
for (const [semi, expected] of [[0,110],[12,220],[7,110*Math.pow(2,7/12)]]) {
  const b = createPattern();
  b.grid.bass[0]=true; b.bassNotes[0]=semi;
  const audio = renderPattern(b,44100,1);
  const detected = detectPitch(audio.subarray(500,4596),44100);
  const cents = detected ? 1200*Math.log2(detected/expected) : null;
  ok(`bass +${semi} -> ${expected.toFixed(0)}Hz (got ${detected?.toFixed(1)})`,
     detected && Math.abs(cents)<70, `${cents?.toFixed(0)} cents`);
}

console.log('--- timing: hits land on the right steps ---');
const t2 = createPattern(); t2.bpm=120;
t2.grid.kick[0]=true; t2.grid.kick[8]=true;
const timed = renderPattern(t2,44100,1);
const energyAt=(step)=>{const s=Math.floor(step*0.125*44100);let e=0;
  for(let i=s;i<s+2000&&i<timed.length;i++)e+=Math.abs(timed[i]);return e};
ok('energy at step 0', energyAt(0)>1, String(energyAt(0)));
ok('energy at step 8', energyAt(8)>1, String(energyAt(8)));
ok('quiet at step 4 (no hit)', energyAt(4)<energyAt(0)*0.25,
   `${energyAt(4).toFixed(1)} vs ${energyAt(0).toFixed(1)}`);

console.log('--- swing displaces off-beats ---');
const sw = createPattern(); sw.bpm=120; sw.grid.hihat[1]=true;
const noSwing = renderPattern(sw,44100,1);
sw.swing = 0.6;
const swung = renderPattern(sw,44100,1);
const firstHit=(a)=>{for(let i=0;i<a.length;i++) if(Math.abs(a[i])>0.01) return i; return -1};
ok(`swing delays the off-beat (${firstHit(noSwing)} -> ${firstHit(swung)})`,
   firstHit(swung) > firstHit(noSwing));

console.log('--- presets ---');
for (const name of Object.keys(PRESET_PATTERNS)) {
  const pp = applyPreset(createPattern(), name);
  const hits = TRACKS.reduce((n,t)=>n+pp.grid[t.id].filter(Boolean).length,0);
  ok(`${name}: has hits (${hits})`, hits>0);
  ok(`${name}: renders audio`, rms(renderPattern(pp,44100,1))>0.001);
}
let threw=false; try{applyPreset(createPattern(),'nope')}catch{threw=true}
ok('unknown preset throws', threw);

console.log('--- bars multiply length ---');
const one=renderPattern(applyPreset(createPattern(),'Trap'),44100,1);
const two=renderPattern(applyPreset(createPattern(),'Trap'),44100,2);
ok(`2 bars ~2x of 1 bar (${one.length} -> ${two.length})`, two.length>one.length*1.7);

console.log('--- mixing ---');
const a=new Float32Array([0.5,0.5,0.5]), b2=new Float32Array([0.5,0.5]);
const mixed=mixTracks(a,b2);
ok('takes the longer length', mixed.length===3);
ok('sums where both exist', Math.abs(mixed[0]-1)<0.01, String(mixed[0]));
ok('never clips past 1', mixed.every(v=>Math.abs(v)<=1.0001));

console.log('\n=== SONGCRAFT ===');
console.log('--- syllables ---');
for (const [w,n] of [['cat',1],['water',2],['beautiful',3],['the',1],['stone',1],
                     ['candle',2],['walked',1],['wanted',2],['every',3],['love',1],
                     ['computer',3],['rhythm',2]]) {
  const got=countSyllables(w);
  ok(`${w} = ${n} (got ${got})`, got===n);
}
ok('line total', countLineSyllables('the cat sat on the mat')===6,
   String(countLineSyllables('the cat sat on the mat')));
ok('empty line = 0', countLineSyllables('')===0);

console.log('--- rhyme ---');
ok('cat/hat rhyme', doesRhyme('cat','hat'));
ok('nation/station rhyme', doesRhyme('nation','station'));
ok('cat/dog do not', !doesRhyme('cat','dog'));
ok('a word does not rhyme with itself', !doesRhyme('cat','cat'));
ok('rhymeKey(cat)=at', rhymeKey('cat')==='at', rhymeKey('cat'));
const scheme = rhymeScheme(['I saw a cat','out in the rain','wearing a hat','right down the lane']);
ok(`ABAB detected (got ${scheme.join('')})`, scheme.join('')==='ABAB');

console.log('--- chord theory ---');
const cmaj = scaleChords('C','major');
ok('C major = C Dm Em F G Am Bdim',
   cmaj.map(c=>c.name).join(' ')==='C Dm Em F G Am Bdim', cmaj.map(c=>c.name).join(' '));
const amin = scaleChords('A','minor');
ok('A minor = Am Bdim C Dm Em F G',
   amin.map(c=>c.name).join(' ')==='Am Bdim C Dm Em F G', amin.map(c=>c.name).join(' '));
const gmaj = scaleChords('G','major');
ok('G major has F# (correct key signature)',
   gmaj.map(c=>c.name).join(' ')==='G Am Bm C D Em F#dim', gmaj.map(c=>c.name).join(' '));
const pop = progressionInKey(PROGRESSIONS[0],'C','major');
ok('I-V-vi-IV in C = C G Am F', pop.map(c=>c.name).join(' ')==='C G Am F', pop.map(c=>c.name).join(' '));
const popG = progressionInKey(PROGRESSIONS[0],'G','major');
ok('same progression transposes to G = G D Em C',
   popG.map(c=>c.name).join(' ')==='G D Em C', popG.map(c=>c.name).join(' '));
let t3=false; try{scaleChords('H')}catch{t3=true}
ok('unknown key throws', t3);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
