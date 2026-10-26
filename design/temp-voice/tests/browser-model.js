// Importing a 3D model, through the real page and the real file input.
//
// The parser has its own suite; this proves the whole path — picker,
// reader, mesh registry, scene graph, both renderers, save and reopen —
// works on the file a person would actually drop in.
const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');

const FIXTURES = path.join(__dirname, 'fixtures', 'gltf');

(async () => {
  let pass = 0, fail = 0;
  const ok = (n, c, x = '') => { c ? (pass++, console.log(`  PASS  ${n}`))
                                   : (fail++, console.log(`  FAIL  ${n} ${x}`)); };

  if (!fs.existsSync(path.join(FIXTURES, 'cube.glb'))) {
    console.log('  FAIL  fixtures are missing — run `node tests/make-gltf-fixtures.mjs`');
    console.log('\n0 passed, 1 failed');
    process.exit(1);
  }

  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ colorScheme: 'dark', viewport: { width: 1280, height: 1400 } });
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));

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
    (els) => els.map((e) => ({ depth: e.dataset.depth, label: e.getAttribute('aria-label') })));
  const hint = () => page.$eval('#anim-hint', (e) => e.textContent);
  const painted = () => page.evaluate(() => {
    const vis = [...document.querySelectorAll('#anim-canvas, #anim-canvas-gl')]
      .find((e) => !e.hidden && e.offsetParent !== null) || document.getElementById('anim-canvas');
    const c = document.createElement('canvas');
    c.width = vis.width; c.height = vis.height;
    const ctx = c.getContext('2d'); ctx.drawImage(vis, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    const bg = [d[0], d[1], d[2]];
    const seen = new Map();
    let n = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (Math.abs(d[i]-bg[0]) + Math.abs(d[i+1]-bg[1]) + Math.abs(d[i+2]-bg[2]) > 24) {
        n++;
        const key = `${d[i] >> 5},${d[i+1] >> 5},${d[i+2] >> 5}`;
        seen.set(key, (seen.get(key) || 0) + 1);
      }
    }
    return { n, hues: [...seen.entries()].filter(([, c2]) => c2 > 40).length };
  });

  // The picker creates its input on demand and never attaches it to the
  // document, so it cannot be targeted by selector. Intercepting the
  // chooser is how Playwright drives that same code path a user does.
  const importFile = async (buttonId, file) => {
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click(buttonId),
    ]);
    await chooser.setFiles(path.join(FIXTURES, file));
    await page.waitForTimeout(700);
  };

  console.log('--- a .glb becomes objects in the scene ---');
  await importFile('#anim-import-model-btn', 'cube.glb');
  let r = await rows();
  ok('one object appears', r.length === 1, String(r.length));
  ok('named from the model', /Cube/.test(r[0].label), r[0].label);
  ok('the hint reports what came in', /Imported .*mesh/.test(await hint()), await hint());
  ok('3D turned itself on', await page.$eval('#anim-3d', (e) => e.checked));
  const first = await painted();
  ok('and it renders', first.n > 200, JSON.stringify(first));

  console.log('--- its material colour survives ---');
  {
    // The fixture cube is pure red. Shaded it stays in the red family, so
    // the red channel must dominate across the painted pixels.
    const reddish = await page.evaluate(() => {
      const vis = [...document.querySelectorAll('#anim-canvas, #anim-canvas-gl')]
        .find((e) => !e.hidden && e.offsetParent !== null);
      const c = document.createElement('canvas');
      c.width = vis.width; c.height = vis.height;
      const ctx = c.getContext('2d'); ctx.drawImage(vis, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      const bg = [d[0], d[1], d[2]];
      let red = 0, total = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (Math.abs(d[i]-bg[0]) + Math.abs(d[i+1]-bg[1]) + Math.abs(d[i+2]-bg[2]) > 24) {
          total++;
          if (d[i] > d[i+1] + 20 && d[i] > d[i+2] + 20) red++;
        }
      }
      return total ? red / total : 0;
    });
    ok('the imported model is red, not the default blue', reddish > 0.8,
       `${(reddish * 100).toFixed(0)}% of painted pixels`);
  }

  console.log('--- a model with a node tree arrives parented ---');
  await page.click('#anim-new-btn').catch(() => {});
  await page.waitForTimeout(300);
  await importFile('#anim-import-model-btn', 'hierarchy.glb');
  r = await rows();
  ok('both parts appear', r.length >= 2, String(r.length));
  ok('the arm is indented under the torso', r.some((x) => x.depth === '1'),
     r.map((x) => x.depth).join());
  ok('and the outliner says so', r.some((x) => /child of /.test(x.label)),
     r.map((x) => x.label).join(' | '));

  console.log('--- two materials paint two colours ---');
  {
    const shot = await painted();
    ok('more than one colour family is on screen', shot.hues >= 2, JSON.stringify(shot));
  }

  console.log('--- moving the parent moves the part ---');
  {
    const centroid = () => page.evaluate(() => {
      const vis = [...document.querySelectorAll('#anim-canvas, #anim-canvas-gl')]
        .find((e) => !e.hidden && e.offsetParent !== null);
      const c = document.createElement('canvas');
      c.width = vis.width; c.height = vis.height;
      const ctx = c.getContext('2d'); ctx.drawImage(vis, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      const bg = [d[0], d[1], d[2]];
      let sx = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (Math.abs(d[i]-bg[0]) + Math.abs(d[i+1]-bg[1]) + Math.abs(d[i+2]-bg[2]) > 24) {
          sx += (i / 4) % c.width; n++;
        }
      }
      return n ? sx / n : 0;
    });
    // Select the root and slide it; the child must come with it.
    await page.$$eval('#anim-shape-list .anim-shape-item', (els) => els[0].click());
    await page.waitForTimeout(200);
    const before = await centroid();
    await page.evaluate(() => {
      const el = document.getElementById('anim-x');
      el.value = '75';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(300);
    const after = await centroid();
    ok('the whole model slides together', after - before > 30,
       `${before.toFixed(1)} -> ${after.toFixed(1)}`);
  }

  console.log('--- geometry survives a save and reopen ---');
  {
    // The real round trip: save the scene to a file, wipe the page, and
    // open it again. Imported geometry lives in a session-scoped registry,
    // so a scene that only referred to it by name would open with every
    // model missing — which is the whole reason the mesh travels inside
    // the saved file.
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#anim-save-btn'),
    ]);
    const saved = path.join(os.tmpdir(), `scene-${Date.now()}.json`);
    await download.saveAs(saved);
    const text = fs.readFileSync(saved, 'utf8');
    ok('the saved file carries the geometry', /"vertices"/.test(text) && /"faces"/.test(text),
       `${(text.length / 1024).toFixed(1)}KB`);
    ok('and the material colours', /"faceColours"/.test(text));

    // A fresh page has an empty mesh registry — the state a recipient of
    // the file would be in.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1400);
    await page.evaluate(() => {
      document.getElementById('gate').hidden = true;
      document.getElementById('app-shell').hidden = false;
    });
    await page.click('[data-section="animate"]'); await page.waitForTimeout(400);

    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click('#anim-open-btn'),
    ]);
    await chooser.setFiles(saved);
    await page.waitForTimeout(900);

    const reopened = await rows();
    ok('the objects come back', reopened.length >= 2, String(reopened.length));
    ok('still parented', reopened.some((x) => x.depth === '1'),
       reopened.map((x) => x.depth).join());
    const shot = await painted();
    ok('and the model still draws in a session that never imported it',
       shot.n > 200, JSON.stringify(shot));
    ok('with its materials intact', shot.hues >= 2, JSON.stringify(shot));
    fs.unlinkSync(saved);
  }

  console.log('--- a damaged file is refused, and the scene survives ---');
  const before = (await rows()).length;
  await importFile('#anim-import-model-btn', 'truncated.glb');
  ok('nothing was added', (await rows()).length === before, String((await rows()).length));
  ok('and the reason is on screen', /truncat|past the end/i.test(await hint()), await hint());
  ok('the scene still draws', (await painted()).n > 200);

  console.log('--- an external-buffer .gltf says what to re-export ---');
  await importFile('#anim-import-model-btn', 'external.gltf');
  ok('it names the missing file', /separate file/i.test(await hint()), await hint());
  ok('and tells you the fix', /\.glb|embedded/i.test(await hint()), await hint());

  ok('no script errors throughout', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
