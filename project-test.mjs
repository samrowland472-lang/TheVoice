import { loopToLength, composeAudio, fadeOut, describeProject }
  from '../js/project.js';

let pass=0,fail=0;
const ok=(n,c,x='')=>{c?(pass++,console.log(`  PASS  ${n}`)):(fail++,console.log(`  FAIL  ${n} ${x}`))};
const peak=(a)=>{let m=0;for(let i=0;i<a.length;i++)m=Math.max(m,Math.abs(a[i]));return m};
const SR = 100; // small rate keeps the arithmetic checkable by hand

console.log('--- loopToLength ---');
{
  const p = Float32Array.from([1,2,3]);
  const l = loopToLength(p, 8);
  ok('length is exact', l.length===8, String(l.length));
  ok('repeats the pattern', Array.from(l).join()==='1,2,3,1,2,3,1,2', Array.from(l).join());
  ok('truncates when target is shorter', Array.from(loopToLength(p,2)).join()==='1,2');
  ok('empty pattern gives silence', Array.from(loopToLength(new Float32Array(0),4)).every(v=>v===0));
}

console.log('--- voice alone ---');
{
  const voice = Float32Array.from({length:50}, ()=>0.5);
  const out = composeAudio({ voice, sampleRate: SR });
  ok('length matches voice', out.length===50, String(out.length));
  ok('level preserved at gain 1', Math.abs(out[0]-0.5)<1e-6, String(out[0]));
  const half = composeAudio({ voice, sampleRate: SR, voiceGain: 0.5 });
  ok('voiceGain scales', Math.abs(half[0]-0.25)<1e-6, String(half[0]));
}

console.log('--- beat alone ---');
{
  const beat = Float32Array.from({length:40}, ()=>1);
  const out = composeAudio({ beat, sampleRate: SR, beatGain: 0.7 });
  ok('length matches beat', out.length===40, String(out.length));
  ok('beatGain applied', Math.abs(out[0]-0.7)<1e-6, String(out[0]));
  ok('short beat is not looped past its own end', out.length===beat.length);
}

console.log('--- voice over beat ---');
{
  const voice = Float32Array.from({length:20}, ()=>0.4);
  const beat  = Float32Array.from({length:20}, ()=>0.2);
  const out = composeAudio({ voice, beat, sampleRate: SR, voiceGain: 1, beatGain: 0.5 });
  ok('sums both sources', Math.abs(out[0]-(0.4+0.1))<1e-6, String(out[0]));
  ok('no NaN', !Array.from(out).some(Number.isNaN));
}

console.log('--- voiceOffsetSec ---');
{
  // Levels chosen so the sum stays under 1 and normalisation cannot mask a
  // placement error.
  const voice = Float32Array.from({length:20}, ()=>0.5);
  const beat  = Float32Array.from({length:20}, ()=>0.2);
  const out = composeAudio({ voice, beat, sampleRate: SR, beatGain: 1, voiceOffsetSec: 0.1 });
  // 0.1s at SR=100 is 10 samples of beat before the voice arrives.
  ok('beat plays alone before the voice', Math.abs(out[0]-0.2)<1e-6, String(out[0]));
  ok('last sample before entry is beat only', Math.abs(out[9]-0.2)<1e-6, String(out[9]));
  ok('voice enters exactly at the offset', Math.abs(out[10]-(0.5+0.2))<1e-6, String(out[10]));
  ok('length runs to the later of the two', out.length===30, String(out.length));
  ok('beat loops under the voice tail', Math.abs(out[29]-(0.5+0.2))<1e-6, String(out[29]));

  const noLoopTail = composeAudio({ voice, beat, sampleRate: SR, beatGain: 1,
                                    voiceOffsetSec: 0.1, loopBeat: false });
  ok('unlooped tail is voice only', Math.abs(noLoopTail[29]-0.5)<1e-6, String(noLoopTail[29]));

  // The realistic case: offset material that does clip is scaled as a whole,
  // so the balance between the parts survives.
  const loud = composeAudio({ voice: Float32Array.from({length:20},()=>1),
                              beat: Float32Array.from({length:20},()=>0.2),
                              sampleRate: SR, beatGain: 1, voiceOffsetSec: 0.1 });
  ok('clipped mix keeps its balance', Math.abs(loud[0]/loud[10] - 0.2/1.2) < 1e-6,
     String(loud[0]/loud[10]));
  ok('clipped mix peaks at 1', Math.abs(peak(loud)-1)<1e-6, String(peak(loud)));

  ok('negative offset is treated as zero',
     Math.abs(composeAudio({voice, sampleRate:SR, voiceOffsetSec:-5})[0]-0.5)<1e-6);
}

console.log('--- beat looping ---');
{
  const voice = Float32Array.from({length:50}, ()=>0);
  const beat  = Float32Array.from([1,0,0,0]);
  const out = composeAudio({ voice, beat, sampleRate: SR, beatGain: 1, loopBeat: true });
  ok('output covers the voice', out.length===50, String(out.length));
  const hits = Array.from(out).filter(v=>v>0.5).length;
  ok('beat repeats to fill (12 hits + 1 at 48)', hits===13, String(hits));
  ok('loop lands on the grid', out[48]>0.5 && out[49]<0.5);

  const noLoop = composeAudio({ voice, beat, sampleRate: SR, beatGain: 1, loopBeat: false });
  ok('loopBeat:false leaves silence after the beat', noLoop.slice(4).every(v=>v===0));
  ok('loopBeat:false still runs the full voice length', noLoop.length===50, String(noLoop.length));
}

console.log('--- normalisation ---');
{
  const loud = composeAudio({
    voice: Float32Array.from({length:10},()=>0.9),
    beat:  Float32Array.from({length:10},()=>0.9),
    sampleRate: SR, voiceGain: 1, beatGain: 1,
  });
  ok('clipping sum is pulled back to 1', Math.abs(peak(loud)-1)<1e-6, String(peak(loud)));

  const quiet = composeAudio({ voice: Float32Array.from({length:10},()=>0.1), sampleRate: SR });
  ok('quiet material is left quiet', Math.abs(peak(quiet)-0.1)<1e-6, String(peak(quiet)));

  const exact = composeAudio({ voice: Float32Array.from({length:10},()=>1), sampleRate: SR });
  ok('peak of exactly 1 is untouched', Math.abs(peak(exact)-1)<1e-9, String(peak(exact)));
}

console.log('--- empty project ---');
{
  const out = composeAudio({ sampleRate: SR });
  ok('never returns a zero-length buffer', out.length>=1, String(out.length));
  ok('empty project is silent', out.every(v=>v===0));
  ok('defaults do not throw', composeAudio().length>=1);
}

console.log('--- fadeOut ---');
{
  const s = Float32Array.from({length:100}, ()=>1);
  fadeOut(s, SR, 0.2); // last 20 samples
  ok('body untouched', s.slice(0,80).every(v=>v===1));
  ok('fade starts at full', Math.abs(s[80]-1)<1e-9, String(s[80]));
  ok('fade ends at silence', Math.abs(s[99])<0.06, String(s[99]));
  let mono = true;
  for (let i=81;i<100;i++) if (s[i] > s[i-1]) mono = false;
  ok('fade decreases monotonically', mono);

  ok('fade ends at exact silence', s[99]===0, String(s[99]));

  const short = Float32Array.from({length:5}, ()=>1);
  fadeOut(short, SR, 10); // longer than the buffer
  ok('fade longer than buffer spans the whole buffer',
     short.length===5 && short[0]===1 && short[4]===0, Array.from(short).join());
  const one = Float32Array.from([1]);
  fadeOut(one, SR, 10);
  ok('single-sample buffer does not divide by zero', one[0]===0, String(one[0]));
  const zero = fadeOut(new Float32Array(0), SR);
  ok('empty buffer does not throw', zero.length===0);
  ok('returns the same array', (()=>{const a=Float32Array.from([1,1]);return fadeOut(a,SR)===a})());
}

console.log('--- describeProject ---');
{
  ok('empty reads plainly', describeProject({})==='Nothing added yet.', describeProject({}));
  const d = describeProject({
    voice: new Float32Array(SR*2), beat: new Float32Array(SR),
    scene: { shapes: [1,2,3] }, sampleRate: SR,
  });
  ok('lists voice duration', d.includes('voice 2.0s'), d);
  ok('lists beat duration', d.includes('beat 1.0s'), d);
  ok('lists shape count', d.includes('3 shapes'), d);
  const one = describeProject({ scene: { shapes: [1] }, sampleRate: SR });
  ok('singular shape', one==='1 shape', one);
  ok('empty scene is not listed', describeProject({ scene: { shapes: [] } })==='Nothing added yet.');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
