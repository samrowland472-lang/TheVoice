// The agent working on the scene you already have, through the real page.
//
// The casting suite proves the matching and the staging. This proves the
// agent box reaches them: that naming an object you imported animates that
// object rather than building a fresh primitive beside it.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const FIXTURES = path.join(__dirname, 'fixtures', 'gltf');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ colorScheme: 'dark', viewport: { width: 1280, height: 1400 } });
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  let pass = 0, fail = 0;
  const ok = (n, c, x = '') => { c ? (pass++, console.log(`  PASS  ${n}`))
                                   : (fail++, console.log(`  FAIL  ${n} ${x}`)); };

  await page.route('**/@supabase/supabase-js@2*', (r) => r.fulfill({ status: 200,
    contentType: 'application/javascript',
    body: 'export function createClient(){return{auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signOut:async()=>({}),refreshSession:async()=>({data:{session:null}})},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:null})})})})}}' }));
  await page.route('**supabase.co/**', (r) => r.fulfill({ status: 200,
    contentType: 'application/json', body: '{"external":{}}' }));
  await page.goto('http://localhost:8952/speakscape-standalone.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1400);
  await page.evaluate(() => {
    document.getElementById('gate').hidden = true;
    document.getElementById('app-shell').hidden = false;
  });
  await page.click('[data-section="animate"]'); await page.waitForTimeout(400);

  const rows = () => page.$$eval('#anim-shape-list .anim-shape-item',
    (els) => els.map((e) => e.textContent));
  const status = () => page.$eval('#agent-status', (e) => e.textContent);
  const ask = async (text) => {
    await page.fill('#agent-prompt', text);
    await page.click('#agent-go-btn');
    await page.waitForTimeout(900);
  };
  const rename = async (row, name) => {
    await page.$$eval('#anim-shape-list .anim-shape-item', (els, n) => els[n].click(), row);
    await page.waitForTimeout(200);
    await page.fill('#anim-label', name);
    await page.waitForTimeout(250);
  };
  const painted = () => page.evaluate(() => {
    const vis = [...document.querySelectorAll('#anim-canvas, #anim-canvas-gl')]
      .find((e) => !e.hidden && e.offsetParent !== null) || document.getElementById('anim-canvas');
    const c = document.createElement('canvas');
    c.width = vis.width; c.height = vis.height;
    const ctx = c.getContext('2d'); ctx.drawImage(vis, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    const bg = [d[0], d[1], d[2]];
    let n = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (Math.abs(d[i]-bg[0]) + Math.abs(d[i+1]-bg[1]) + Math.abs(d[i+2]-bg[2]) > 24) n++;
    }
    return n;
  });
  const seek = async (t) => {
    await page.evaluate((tt) => {
      const el = document.getElementById('anim-time');
      el.value = String(tt); el.dispatchEvent(new Event('input', { bubbles: true }));
    }, t);
    await page.waitForTimeout(180);
  };

  console.log('--- an empty scene still gets built from scratch ---');
  await ask('three blue circles that fade in');
  ok('it built something', (await rows()).length === 3, String((await rows()).length));
  ok('and said so', /Built here/.test(await status()), await status());

  console.log('--- naming objects in the scene animates those objects ---');
  await page.click('#anim-new-btn').catch(() => {});
  await page.waitForTimeout(300);
  await page.click('#anim-add-btn'); await page.waitForTimeout(250);
  await page.click('#anim-add-btn'); await page.waitForTimeout(250);
  await rename(0, 'Boulder');
  await rename(1, 'Tower');
  ok('two named objects', (await rows()).length === 2, String((await rows()).length));

  await ask('the boulder smashes into the tower');
  const after = await rows();
  ok('the named objects are still there',
     after.some((r) => /Boulder/.test(r)) && after.some((r) => /Tower/.test(r)),
     after.join(' | '));
  ok('debris was added', after.some((r) => /Debris/.test(r)), after.join(' | '));
  ok('the status names the actual objects',
     /Boulder/.test(await status()) && /Tower/.test(await status()), await status());
  ok('and reports the action', /smash/i.test(await status()), await status());

  console.log('--- and the smash actually happens on screen ---');
  {
    await seek(0.1); const early = await painted();
    await seek(3.2); const late = await painted();
    ok('something is drawn at the start', early > 100, String(early));
    ok('and the picture changes', Math.abs(late - early) > 30, `${early} -> ${late}`);
  }

  console.log('--- an unrecognised sentence leaves the scene alone ---');
  {
    const before = await rows();
    await ask('the aeroplane performs photosynthesis');
    ok('nothing was added or removed', (await rows()).length === before.length,
       `${before.length} -> ${(await rows()).length}`);
    ok('and it says it could not', (await status()).length > 0, await status());
  }

  console.log('--- an imported model can be named and animated ---');
  if (fs.existsSync(path.join(FIXTURES, 'cube.glb'))) {
    await page.click('#anim-new-btn').catch(() => {});
    await page.waitForTimeout(300);
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click('#anim-import-model-btn'),
    ]);
    await chooser.setFiles(path.join(FIXTURES, 'cube.glb'));
    await page.waitForTimeout(800);
    const imported = await rows();
    ok('the model arrived', imported.length >= 1, imported.join(' | '));

    await ask('the cube spins');
    ok('no new object was created for it', (await rows()).length === imported.length,
       `${imported.length} -> ${(await rows()).length}`);
    ok('the status names the imported object', /Cube/i.test(await status()), await status());

    await seek(0.1); const a = await painted();
    await seek(2.5); const b = await painted();
    ok('and it is moving', Math.abs(b - a) > 10, `${a} -> ${b}`);
  } else {
    console.log('  (skipped: run `node tests/make-gltf-fixtures.mjs`)');
  }

  ok('no script errors throughout', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
