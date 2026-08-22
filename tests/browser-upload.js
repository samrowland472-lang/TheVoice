const { chromium } = require('playwright');
const path = require('path');
const F = (n) => path.resolve(__dirname, 'fixtures', n);

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ colorScheme: 'dark' });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  let pass = 0, fail = 0;
  const ok = (n, c, x = '') => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n} ${x}`)); };

  await page.route('**/@supabase/supabase-js@2*', r => r.fulfill({ status: 200, contentType: 'application/javascript',
    body: 'export function createClient(){return{auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signOut:async()=>({}),refreshSession:async()=>({data:{session:null}})},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:null})})})})}}' }));
  await page.route('**supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"external":{}}' }));
  await page.goto('http://localhost:8952/speakscape-standalone.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1300);
  await page.evaluate(() => { document.getElementById('gate').hidden = true; document.getElementById('app-shell').hidden = false; });

  // Import buttons open a picker; Playwright intercepts it with filechooser.
  const upload = async (selector, file) => {
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click(selector),
    ]);
    await chooser.setFiles(F(file));
    await page.waitForTimeout(1400);
  };

  console.log('--- every section now has an import control ---');
  for (const [section, id] of [
    ['studio', '#studio-import-btn'], ['modulate', '#mod-import-btn'],
    ['music', '#music-import-btn'], ['project', '#project-import-btn'],
    ['animate', '#anim-import-audio-btn'], ['library', '#library-import-btn'],
  ]) ok(`${section} has one`, await page.$(id) !== null, id);
  ok('animate can import images', await page.$('#anim-import-image-btn') !== null);
  ok('animate can open a saved scene', await page.$('#anim-open-btn') !== null);

  console.log('--- voice: import audio into the studio ---');
  await page.click('[data-section="clone"]'); await page.waitForTimeout(400);
  await upload('#studio-import-btn', 'tone.wav');
  ok('the playback panel appears', await page.$eval('#recording-result', e => !e.hidden));
  ok('audio is loaded', (await page.$eval('#playback-audio', e => e.src)).startsWith('blob:'));
  ok('no error hint', (await page.$eval('#mic-hint', e => e.textContent)) === '',
     await page.$eval('#mic-hint', e => e.textContent));

  console.log('--- it reached the library like a recording would ---');
  await page.click('[data-section="library"]'); await page.waitForTimeout(900);
  const clips = await page.$$eval('.clip-card', c => c.length).catch(() => 0);
  ok('the imported clip is stored', clips >= 1, String(clips));

  console.log('--- modulate: import becomes the source ---');
  await page.click('[data-section="shape"]'); await page.waitForTimeout(400);
  await upload('#mod-import-btn', 'tone.wav');
  const modLabel = await page.$eval('#mod-source-label', e => e.textContent);
  ok('the source label updates', !/no clip/i.test(modLabel), modLabel);
  ok('apply becomes available', await page.$eval('#mod-apply-btn', e => !e.disabled));

  console.log('--- music: import audio to layer over a beat ---');
  await page.click('[data-section="music"]'); await page.waitForTimeout(400);
  await upload('#music-import-btn', 'tone.wav');
  ok('no error', (await page.$eval('#music-hint', e => e.textContent)) === '',
     await page.$eval('#music-hint', e => e.textContent));
  await page.selectOption('#music-preset', { index: 1 }); await page.waitForTimeout(300);
  await page.click('#music-voice-btn'); await page.waitForTimeout(3000);
  ok('the imported clip mixes over the beat',
     await page.$eval('#music-audio', e => !e.hidden && e.src.startsWith('blob:')));

  console.log('--- animate: import an image as a shape ---');
  await page.click('[data-section="animate"]'); await page.waitForTimeout(400);
  await upload('#anim-import-image-btn', 'logo.png');
  const shapes = await page.$$eval('.anim-shape-item', s => s.length);
  ok('a shape was added', shapes === 1, String(shapes));
  ok('it is named after the file',
     (await page.$eval('.anim-shape-item', e => e.textContent)).includes('logo'),
     await page.$eval('.anim-shape-item', e => e.textContent));
  const drawn = await page.evaluate(() => {
    const c = document.getElementById('anim-canvas');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let red = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] > 150 && d[i+1] < 90) red++;
    return red;
  });
  ok('the image is actually painted to the canvas', drawn > 50, `${drawn} red pixels`);

  console.log('--- animate: save a scene and open it again ---');
  const dl = page.waitForEvent('download');
  await page.click('#anim-save-btn');
  const download = await dl;
  const saved = path.join('/tmp', 'roundtrip-scene.json');
  await download.saveAs(saved);
  ok('a scene file is produced', require('fs').existsSync(saved));
  const savedJson = JSON.parse(require('fs').readFileSync(saved, 'utf8'));
  ok('it contains the image shape', savedJson.shapes.some(s => s.type === 'image'));
  ok('the image travels inside the file, not as a path',
     savedJson.shapes.some(s => String(s.src || '').startsWith('data:image/')));

  // This test is about opening a scene file into an EMPTY editor, and
  // autosave would otherwise (correctly) restore the scene. Clearing it
  // with evaluate() is not enough — the beforeunload flush writes it back
  // during the reload — so clear it before page scripts run instead.
  await page.addInitScript(() => {
    try { localStorage.removeItem('thevoice_workspace_v2'); } catch {}
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1300);
  await page.evaluate(() => { document.getElementById('gate').hidden = true; document.getElementById('app-shell').hidden = false; });
  await page.click('[data-section="animate"]'); await page.waitForTimeout(400);
  ok('the fresh session starts empty', await page.$$eval('.anim-shape-item', s => s.length) === 0,
     String(await page.$$eval('.anim-shape-item', s => s.length)));
  const [ch] = await Promise.all([page.waitForEvent('filechooser'), page.click('#anim-open-btn')]);
  await ch.setFiles(saved);
  await page.waitForTimeout(1500);
  ok('the scene reopens', await page.$$eval('.anim-shape-item', s => s.length) === 1,
     String(await page.$$eval('.anim-shape-item', s => s.length)));
  const redrawn = await page.evaluate(() => {
    const c = document.getElementById('anim-canvas');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let red = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] > 150 && d[i+1] < 90) red++;
    return red;
  });
  ok('and the image is re-decoded and drawn', redrawn > 50, `${redrawn} red pixels`);

  console.log('--- bad files are refused with a reason ---');
  await upload('#anim-import-image-btn', 'notes.txt');
  const hint = await page.$eval('#anim-hint', e => e.textContent);
  ok('a text file is not accepted as an image', hint.length > 0, hint);
  ok('the message names the file', hint.includes('notes.txt'), hint);
  ok('shape count is unchanged', await page.$$eval('.anim-shape-item', s => s.length) === 1);

  const [ch2] = await Promise.all([page.waitForEvent('filechooser'), page.click('#anim-open-btn')]);
  await ch2.setFiles(F('broken.json'));
  await page.waitForTimeout(900);
  const badHint = await page.$eval('#anim-hint', e => e.textContent);
  ok('damaged JSON is reported clearly', /valid JSON|damaged/i.test(badHint), badHint);
  ok('the existing scene survives a failed open',
     await page.$$eval('.anim-shape-item', s => s.length) === 1);

  console.log('--- drop zones are wired ---');
  const zones = await page.$$eval('[data-drop-zone]', z => z.length);
  ok('several panels accept drops', zones >= 6, String(zones));

  console.log('\nerrors:', errs.join(' | ') || '(none)');
  ok('no uncaught page errors', errs.length === 0, errs.join('; '));
  console.log(`${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
