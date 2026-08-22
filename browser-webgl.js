const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ colorScheme: 'dark', viewport: { width: 1280, height: 1500 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  let pass = 0, fail = 0;
  const ok = (n, c, x = '') => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n} ${x}`)); };

  await page.route('**/@supabase/supabase-js@2*', r => r.fulfill({ status: 200, contentType: 'application/javascript',
    body: 'export function createClient(){return{auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signOut:async()=>({}),refreshSession:async()=>({data:{session:null}})},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:null})})})})}}' }));
  await page.route('**supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"external":{}}' }));
  await page.goto('http://localhost:8952/speakscape-standalone.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1400);
  await page.evaluate(() => { document.getElementById('gate').hidden = true; document.getElementById('app-shell').hidden = false; });
  await page.click('[data-section="animate"]'); await page.waitForTimeout(400);

  const webglAvailable = await page.evaluate(() =>
    !!document.createElement('canvas').getContext('webgl'));
  console.log('WebGL in this browser:', webglAvailable);

  // Read the ACTIVE canvas: GL canvases can't getImageData, so route
  // through drawImage into a scratch 2D canvas — works for both.
  const analyse = () => page.evaluate(() => {
    const src = !document.getElementById('anim-canvas-gl').hidden
      ? document.getElementById('anim-canvas-gl') : document.getElementById('anim-canvas');
    const c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(src, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    const bg = [d[0], d[1], d[2]];
    const colors = new Map();
    let n = 0, reds = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (Math.abs(d[i]-bg[0]) + Math.abs(d[i+1]-bg[1]) + Math.abs(d[i+2]-bg[2]) > 24) {
        n++;
        if (d[i] > 150 && d[i+1] < 90) reds++;
        const key = `${d[i]>>4},${d[i+1]>>4},${d[i+2]>>4}`;
        colors.set(key, (colors.get(key) || 0) + 1);
      }
    }
    let major = 0;
    for (const count of colors.values()) if (count > 40) major++;
    return { n, major, reds, colorCount: colors.size };
  });
  const setSlider = async (id, v) => { await page.evaluate(([i, val]) => {
      const el = document.getElementById(i);
      el.value = String(val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, [id, v]); await page.waitForTimeout(250); };
  const glActive = () => page.$eval('#anim-canvas-gl', e => !e.hidden);

  console.log('--- the GL canvas takes over in 3D ---');
  await page.selectOption('#anim-shape-type', 'cube');
  await page.click('#anim-add-btn'); await page.waitForTimeout(300);
  ok('2D mode uses the 2D canvas', !(await glActive()));
  await page.click('#anim-3d'); await page.waitForTimeout(500);
  if (!webglAvailable) {
    ok('no WebGL here: canvas fallback stays active', !(await glActive()));
    console.log('(remaining GL assertions skipped — headless browser has no WebGL)');
  } else {
    ok('3D mode switches to the GL canvas', await glActive());

    console.log('--- a lit cube on the GPU ---');
    await setSlider('anim-rotx', 30); await setSlider('anim-roty', 40);
    const cube = await analyse();
    ok('the cube is drawn', cube.n > 300, JSON.stringify(cube));
    ok('with distinctly lit faces', cube.major >= 3, `major ${cube.major}`);

    console.log('--- the smooth sphere: the upgrade flat shading cannot fake ---');
    await page.click('#anim-delete-btn'); await page.waitForTimeout(200);
    await page.selectOption('#anim-shape-type', 'sphere');
    await page.click('#anim-add-btn'); await page.waitForTimeout(400);
    const sphere = await analyse();
    ok('the sphere is drawn', sphere.n > 300, String(sphere.n));
    // The bucketing is 4 bits per channel, so a smooth one-hue gradient
    // tops out around 30 buckets — a flat-shaded solid shows 3-6. The gap
    // between those is the assertion; 60 was asking the metric for more
    // resolution than it has.
    ok('shading is a smooth gradient, not a handful of flat faces',
       sphere.colorCount > 15, `distinct ${sphere.colorCount}`);

    console.log('--- depth buffer: interpenetrating solids ---');
    await page.evaluate(() => {
      const s = document.getElementById('anim-shape-type');
      s.value = 'cube';
    });
    await page.click('#anim-add-btn'); await page.waitForTimeout(300);
    await setSlider('anim-x', 56); await setSlider('anim-z', 6);
    const both = await analyse();
    ok('both solids render while overlapping in space', both.n > sphere.n, `${sphere.n} -> ${both.n}`);

    console.log('--- extruded text and images on the GPU ---');
    await page.selectOption('#anim-shape-type', 'text');
    await page.click('#anim-add-btn'); await page.waitForTimeout(300);
    await setSlider('anim-y', 22); await setSlider('anim-roty', 35);
    await setSlider('anim-extrude', 25);
    const withText = await analyse();
    ok('the extruded title renders', withText.n > both.n, `${both.n} -> ${withText.n}`);

    const [ch] = await Promise.all([page.waitForEvent('filechooser'), page.click('#anim-import-image-btn')]);
    await ch.setFiles(path.resolve(__dirname, 'fixtures', 'logo.png'));
    await page.waitForTimeout(800);
    const withImage = await analyse();
    ok('an imported image textures onto the GPU quad', withImage.reds > 40,
       `red pixels ${withImage.reds}`);

    console.log('--- the camera still drives it ---');
    const stage = await page.$eval('#anim-stage', e => { const r = e.getBoundingClientRect();
      return { x: r.x + r.width/2, y: r.y + r.height/2 }; });
    const before = await analyse();
    await page.mouse.move(stage.x, stage.y);
    await page.mouse.down();
    await page.mouse.move(stage.x + 120, stage.y, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(400);
    const after = await analyse();
    ok('orbiting on the GL canvas changes the view', Math.abs(after.n - before.n) > 30
       || after.major !== before.major, `${before.n} -> ${after.n}`);

    console.log('--- switching 3D off returns to the 2D canvas ---');
    await page.click('#anim-3d'); await page.waitForTimeout(400);
    ok('2D canvas is back', !(await glActive()));
    ok('and renders', (await analyse()).n > 200);
    await page.click('#anim-3d'); await page.waitForTimeout(400);
    ok('and back to GL again', await glActive());
  }

  console.log('\nerrors:', errs.join(' | ') || '(none)');
  ok('no uncaught page errors', errs.length === 0, errs.join('; '));
  console.log(`${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
