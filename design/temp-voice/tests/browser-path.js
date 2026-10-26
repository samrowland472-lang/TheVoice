const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ colorScheme: 'dark', viewport: { width: 1280, height: 1400 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  let pass = 0, fail = 0;
  const ok = (n, c, x = '') => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n} ${x}`)); };

  await page.goto('http://localhost:8952/speakscape-standalone.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.evaluate(() => { document.getElementById('gate').hidden = true;
                              document.getElementById('app-shell').hidden = false; });
  await page.click('[data-section="animate"]'); await page.waitForTimeout(400);

  const seek = async (t) => { await page.evaluate((tt) => {
      const el = document.getElementById('anim-time');
      el.value = String(tt); el.dispatchEvent(new Event('input', { bubbles: true })); }, t);
    await page.waitForTimeout(150); };
  const setSlider = async (id, v) => { await page.evaluate(([i, val]) => {
      const el = document.getElementById(i);
      el.value = String(val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, [id, v]); await page.waitForTimeout(200); };
  // Where the shape actually is on screen, from the render canvas.
  const centre = () => page.evaluate(() => {
    const src = !document.getElementById('anim-canvas-gl').hidden
      ? document.getElementById('anim-canvas-gl') : document.getElementById('anim-canvas');
    const c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    const ctx = c.getContext('2d'); ctx.drawImage(src, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    const bg = [d[0], d[1], d[2]];
    let sx = 0, sy = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (Math.abs(d[i]-bg[0]) + Math.abs(d[i+1]-bg[1]) + Math.abs(d[i+2]-bg[2]) > 24) {
        sx += (i/4) % c.width; sy += Math.floor((i/4) / c.width); n++;
      }
    }
    return n ? { x: sx/n, y: sy/n, n } : { x: 0, y: 0, n: 0 };
  });
  const overlayPixels = () => page.evaluate(() => {
    const c = document.getElementById('anim-overlay');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 20) n++;
    return n;
  });

  console.log('--- the control only offers itself when it means something ---');
  await page.click('#anim-add-btn'); await page.waitForTimeout(300);
  ok('curved path exists', await page.$('#anim-smooth') !== null);
  ok('disabled with one keyframe', await page.$eval('#anim-smooth', e => e.disabled));

  // Three keyframes forming a right-angle corner.
  await seek(0); await setSlider('anim-x', 15); await setSlider('anim-y', 80);
  await seek(2); await setSlider('anim-x', 85); await setSlider('anim-y', 80);
  await seek(4); await setSlider('anim-x', 85); await setSlider('anim-y', 20);
  await page.waitForTimeout(200);
  ok('enabled once there are three', !(await page.$eval('#anim-smooth', e => e.disabled)));

  // Trace the whole move rather than one instant.
  const trace = async () => {
    const out = [];
    for (const t of [0.5, 1, 1.5, 2.5, 3, 3.5]) { await seek(t); out.push(await centre()); }
    return out;
  };
  const maxShift = (a, b) => Math.max(...a.map((p, i) => Math.hypot(p.x - b[i].x, p.y - b[i].y)));

  console.log('--- straight vs curved is a real difference on screen ---');
  const straightTrace = await trace();
  await page.click('#anim-smooth'); await page.waitForTimeout(400);
  const curvedTrace = await trace();
  ok('the shape follows a different route',
     maxShift(straightTrace, curvedTrace) > 5,
     `max shift ${maxShift(straightTrace, curvedTrace).toFixed(1)} px`);

  console.log('--- but it still hits every keyframe exactly ---');
  for (const [t, wx, wy] of [[0, 15, 80], [2, 85, 80], [4, 85, 20]]) {
    await seek(t);
    const c = await centre();
    const ex = (wx / 100) * 640, ey = (wy / 100) * 360;
    ok(`at ${t}s it is on its keyframe`, Math.hypot(c.x - ex, c.y - ey) < 12,
       `got ${c.x.toFixed(0)},${c.y.toFixed(0)} want ${ex},${ey}`);
  }

  console.log('--- bend strength ---');
  await seek(3);
  const bendField = await page.$eval('.path-tension', e => !e.hidden);
  ok('the bend control appears with smoothing', bendField);
  await setSlider('anim-tension', 0);
  const flatTrace = await trace();
  await setSlider('anim-tension', 1);
  const looseTrace = await trace();
  ok('zero bend leaves the motion exactly as it was',
     maxShift(flatTrace, straightTrace) < 2,
     `max shift ${maxShift(flatTrace, straightTrace).toFixed(1)} px`);
  ok('more bend swings wider', maxShift(looseTrace, flatTrace) > 5,
     `max shift ${maxShift(looseTrace, flatTrace).toFixed(1)} px`);
  await setSlider('anim-tension', 1);

  console.log('--- the route is drawn so it can be corrected ---');
  const guides = await overlayPixels();
  ok('the path is visible on the overlay', guides > 200, `${guides} px`);
  ok('the overlay is a separate canvas from the render',
     await page.evaluate(() => document.getElementById('anim-overlay')
       !== document.getElementById('anim-canvas')));

  console.log('--- guides never reach the artwork ---');
  await page.click('#anim-play-btn'); await page.waitForTimeout(500);
  ok('guides hide during playback', (await overlayPixels()) === 0, String(await overlayPixels()));
  await page.click('#anim-play-btn'); await page.waitForTimeout(400);
  ok('and come back when paused', (await overlayPixels()) > 100);

  console.log('--- it survives save and reopen ---');
  const dl = page.waitForEvent('download');
  await page.click('#anim-save-btn');
  const file = '/tmp/curved-scene.json';
  await (await dl).saveAs(file);
  const saved = JSON.parse(require('fs').readFileSync(file, 'utf8'));
  ok('smoothPath is in the file', saved.shapes[0].smoothPath === true);
  await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2000);
  await page.evaluate(() => { document.getElementById('gate').hidden = true;
                              document.getElementById('app-shell').hidden = false; });
  await page.click('[data-section="animate"]'); await page.waitForTimeout(400);
  const [ch] = await Promise.all([page.waitForEvent('filechooser'), page.click('#anim-open-btn')]);
  await ch.setFiles(file); await page.waitForTimeout(1200);
  ok('the toggle comes back on', await page.$eval('#anim-smooth', e => e.checked));
  const reopenedTrace = await trace();
  ok('and the curve still plays', maxShift(reopenedTrace, straightTrace) > 5,
     `max shift ${maxShift(reopenedTrace, straightTrace).toFixed(1)} px`);

  console.log('\nerrors:', errs.filter(e => !/supabase|fetch/i.test(e)).join(' | ') || '(none)');
  ok('no uncaught page errors', errs.filter(e => !/supabase|fetch/i.test(e)).length === 0,
     errs.join('; '));
  console.log(`${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
