// The outliner and parenting, driven through the real page.
//
// The unit tests prove the maths; this proves the panel is wired to it —
// that a parent chosen in the picker indents the row, moves the child when
// the parent moves, and does not move it at the moment of parenting.
const { chromium } = require('playwright');
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
    (els) => els.map((e) => ({ text: e.textContent, depth: e.dataset.depth,
                               level: e.getAttribute('aria-level'),
                               label: e.getAttribute('aria-label') })));
  const centroid = () => page.evaluate(() => {
    const vis = [...document.querySelectorAll('#anim-canvas, #anim-canvas-gl')]
      .find((e) => !e.hidden && e.offsetParent !== null) || document.getElementById('anim-canvas');
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
    return n ? { x: sx / n, n } : { x: 0, n: 0 };
  });
  const seek = async (t) => {
    await page.evaluate((tt) => {
      const el = document.getElementById('anim-time');
      el.value = String(tt); el.dispatchEvent(new Event('input', { bubbles: true }));
    }, t);
    await page.waitForTimeout(150);
  };
  const setSlider = async (id, v) => {
    await page.evaluate(([i, val]) => {
      const el = document.getElementById(i);
      el.value = String(val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, [id, v]);
    await page.waitForTimeout(200);
  };
  const selectRow = async (i) => {
    await page.$$eval('#anim-shape-list .anim-shape-item', (els, n) => els[n].click(), i);
    await page.waitForTimeout(200);
  };

  console.log('--- a flat scene reads as a flat list ---');
  await page.click('#anim-add-btn'); await page.waitForTimeout(250);
  await page.click('#anim-add-btn'); await page.waitForTimeout(250);
  let r = await rows();
  ok('two objects', r.length === 2, String(r.length));
  ok('both at the root', r.every((x) => x.depth === '0'), r.map((x) => x.depth).join());
  ok('and announced as top level', r.every((x) => x.level === '1'));

  console.log('--- the picker offers the other objects ---');
  await selectRow(1);
  const opts = await page.$$eval('#anim-parent option',
    (els) => els.map((e) => ({ value: e.value, text: e.textContent })));
  ok('scene root is always offered', opts[0].value === '');
  ok('and the other object, but not itself', opts.length === 2, String(opts.length));

  console.log('--- parenting indents the row without moving anything ---');
  // Move the first object so parent and child are clearly apart, and give
  // it motion so following it is observable.
  await selectRow(0);
  await setSlider('anim-x', 20);
  await page.click('#anim-key-btn'); await page.waitForTimeout(200);
  await seek(4);
  // 20 -> 50 rather than 20 -> 80: the child sits at 50 and inherits the
  // same +30, so it lands at 80 and stays on canvas where it can be
  // measured. A larger move carries it off the right edge — correctly, but
  // invisibly.
  await setSlider('anim-x', 50);
  await page.click('#anim-key-btn'); await page.waitForTimeout(200);
  await seek(0);

  await selectRow(1);
  const beforeParent = await centroid();
  const parentId = await page.$eval('#anim-parent', (el) => el.options[1].value);
  await page.selectOption('#anim-parent', parentId);
  await page.waitForTimeout(300);
  const afterParent = await centroid();
  ok('the picture does not jump when you parent',
     Math.abs(afterParent.x - beforeParent.x) < 2,
     `${beforeParent.x.toFixed(1)} -> ${afterParent.x.toFixed(1)}`);

  r = await rows();
  ok('the child is indented', r.some((x) => x.depth === '1'), r.map((x) => x.depth).join());
  ok('and announced one level down', r.some((x) => x.level === '2'));
  ok('the parent row says it has a child',
     r.some((x) => /1 child\b/.test(x.label)), r.map((x) => x.label).join(' | '));
  ok('the child row names its parent', r.some((x) => /child of /.test(x.label)));

  console.log('--- and the child now follows its parent ---');
  await seek(0); const at0 = await centroid();
  await seek(4); const at4 = await centroid();
  ok('it moves when the parent moves', at4.x - at0.x > 20,
     `${at0.x.toFixed(1)} -> ${at4.x.toFixed(1)}`);

  console.log('--- the picker refuses to build a loop ---');
  await selectRow(0);  // the parent
  const parentOpts = await page.$$eval('#anim-parent option', (els) => els.map((e) => e.value));
  ok('its own child is not offered as its parent', parentOpts.length === 1, parentOpts.join());

  console.log('--- deleting a parent keeps its children ---');
  // At t=4 the parent has moved 20 -> 50, so the child sitting at its own
  // 50 has been carried to 80 — four fifths across the canvas. That is the
  // position it must keep once the parent is gone. Measuring the centroid
  // before the delete would average both shapes together, so the check is
  // against the arithmetic rather than against the two-shape picture.
  await seek(4);
  const width = await page.$eval('#anim-canvas', (c) => c.width);
  const expected = width * 0.8;
  await selectRow(0);
  await page.click('#anim-delete-btn'); await page.waitForTimeout(300);
  r = await rows();
  ok('the child survives', r.length === 1, String(r.length));
  ok('back at the root', r[0].depth === '0');
  const afterDelete = await centroid();
  ok('it is still on screen', afterDelete.n > 50, String(afterDelete.n));
  ok('and stays exactly where its parent had carried it',
     Math.abs(afterDelete.x - expected) < 6,
     `${afterDelete.x.toFixed(1)}, expected ${expected.toFixed(1)}`);

  ok('no script errors throughout', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
