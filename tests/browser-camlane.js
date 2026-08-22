const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ colorScheme: 'dark', viewport: { width: 1280, height: 1400 } });
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

  const tlHeight = () => page.$eval('#anim-timeline', e => e.getBoundingClientRect().height);
  const seek = async (t) => { await page.evaluate((tt) => {
      const el = document.getElementById('anim-time');
      el.value = String(tt); el.dispatchEvent(new Event('input', { bubbles: true })); }, t);
    await page.waitForTimeout(150); };

  await page.click('#anim-add-btn'); await page.waitForTimeout(300);
  const h2d = await tlHeight();

  console.log('--- the camera lane appears with 3D ---');
  await page.click('#anim-3d'); await page.waitForTimeout(400);
  const h3d = await tlHeight();
  ok('the timeline grows a lane', h3d > h2d + 15, `${h2d} -> ${h3d}`);

  console.log('--- camera keys land in the lane and drag ---');
  await seek(0); await page.click('#anim-camkey-btn');
  await seek(4); await page.click('#anim-camkey-btn');
  await page.waitForTimeout(300);
  const keys = () => page.evaluate(() =>
    JSON.parse(localStorage.getItem('x') || 'null') ) ;
  const camTimes = () => page.evaluate(() => {
    // Read straight out of the saved scene via the save path (no globals
    // are exposed) — serialize through a download would be heavy, so poke
    // the DOM-adjacent state: the count label plus a fresh save file.
    return document.getElementById('anim-camkey-count').textContent;
  });
  ok('two keys recorded', (await camTimes()).includes('2'), await camTimes());

  // Drag the camera key at t=4 back to ~2. The lane is row 0.
  await page.$eval('#anim-timeline', e => e.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(200);
  const box = await page.$eval('#anim-timeline', e => { const r = e.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width }; });
  const dur = await page.$eval('#anim-time', e => parseFloat(e.max));
  const xFor = t => box.x + 96 + (t / dur) * (box.w - 96 - 12);
  const laneY = box.y + 22 + 13;  // ruler + half a row: the camera lane
  await page.mouse.move(xFor(4), laneY);
  await page.mouse.down();
  await page.mouse.move(xFor(2), laneY, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(400);

  // Prove the drag moved the actual data: save and read the file.
  const dl = page.waitForEvent('download');
  await page.click('#anim-save-btn');
  const file = '/tmp/camlane-scene.json';
  await (await dl).saveAs(file);
  const saved = JSON.parse(require('fs').readFileSync(file, 'utf8'));
  const times = saved.cameraKeyframes.map(k => k.time);
  ok('the dragged key really moved', times.some(t => Math.abs(t - 2) < 0.3), times.join());
  ok('the other key stayed put', times.some(t => t < 0.1), times.join());
  ok('still two keys, not a duplicate', times.length === 2, String(times.length));

  console.log('--- dragging a camera key does not steal the selection ---');
  const sel = await page.$$eval('.anim-shape-item', els =>
    els.map(e => e.getAttribute('aria-pressed')));
  ok('the shape stays selected', sel.includes('true'), sel.join());

  console.log('--- shape keyframes still drag beneath the camera lane ---');
  await seek(1);
  await page.click('#anim-key-btn'); await page.waitForTimeout(200);
  const shapeLaneY = box.y + 22 + 26 + 13;  // second row now
  await page.mouse.move(xFor(1), shapeLaneY);
  await page.mouse.down();
  await page.mouse.move(xFor(3), shapeLaneY, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  const chips = await page.$$eval('.anim-kf-chip', c => c.map(x => parseFloat(x.textContent)));
  ok('the shape key moved to ~3s', chips.some(t => Math.abs(t - 3) < 0.3), chips.join());

  console.log('--- turning 3D off removes the lane ---');
  await page.click('#anim-3d'); await page.waitForTimeout(400);
  ok('the timeline shrinks back', Math.abs(await tlHeight() - h2d) < 2,
     `${await tlHeight()} vs ${h2d}`);

  console.log('\nerrors:', errs.join(' | ') || '(none)');
  ok('no uncaught page errors', errs.length === 0, errs.join('; '));
  console.log(`${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
