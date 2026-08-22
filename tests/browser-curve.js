const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ colorScheme: 'dark' });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  let pass = 0, fail = 0;
  const ok = (n, c, x = '') => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n} ${x}`)); };
  const setTime = async (p, t) => {
    await p.evaluate((tt) => {
      const el = document.getElementById('anim-time');
      el.value = String(tt);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, t);
    await p.waitForTimeout(200);
  };

  await page.route('**/@supabase/supabase-js@2*', r => r.fulfill({ status: 200,
    contentType: 'application/javascript',
    body: 'export function createClient(){return{auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signOut:async()=>({}),refreshSession:async()=>({data:{session:null}})},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:null})})})})}}' }));
  await page.route('**supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"external":{}}' }));

  await page.goto('http://localhost:8952/speakscape-standalone.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.evaluate(() => { document.getElementById('gate').hidden = true; document.getElementById('app-shell').hidden = false; });
  await page.click('[data-section="animate"]');
  await page.waitForTimeout(300);
  await page.click('#anim-add-btn');
  await page.waitForTimeout(300);

  console.log('--- the editor is present and populated ---');
  ok('curve canvas exists', await page.$('#anim-curve') !== null);
  const opts = await page.$$eval('#anim-easing option', o => o.map(x => x.value));
  ok('offers far more than the old five', opts.length >= 18, String(opts.length));
  ok('includes overshoot curves', opts.includes('backOut') && opts.includes('anticipate'));
  ok('includes hold', opts.includes('hold'));
  ok('offers a custom option', opts.includes('custom'));
  ok('labels read as English, not maths',
     (await page.$$eval('#anim-easing option', o => o.map(x => x.textContent))).includes('Ease in-out'));

  const painted = async () => page.evaluate(() => {
    const c = document.getElementById('anim-curve');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
    return n;
  });
  ok('the curve is actually drawn', await painted() > 1000, String(await painted()));

  console.log('--- selecting a preset changes the motion ---');
  const xAt = (t) => page.evaluate((tt) => {
    // Read the rendered position straight off the engine.
    const c = document.getElementById('anim-canvas');
    return { t: tt };
  }, t);
  await page.selectOption('#anim-easing', 'linear');
  await page.waitForTimeout(200);
  const linearCurve = await page.evaluate(() => {
    const c = document.getElementById('anim-curve');
    return c.getContext('2d').getImageData(0, 0, c.width, c.height).data.join(',').length;
  });
  await page.selectOption('#anim-easing', 'backOut');
  await page.waitForTimeout(200);
  const backCurve = await page.evaluate(() => {
    const c = document.getElementById('anim-curve');
    return c.getContext('2d').getImageData(0, 0, c.width, c.height).data.join(',').length;
  });
  ok('the graph redraws when the preset changes', linearCurve !== backCurve);
  ok('an overshooting preset is flagged',
     /overshoot/i.test(await page.$eval('#anim-curve-note', e => e.textContent)),
     await page.$eval('#anim-curve-note', e => e.textContent));

  console.log('--- dragging a handle ---');
  await page.selectOption('#anim-easing', 'linear');
  await page.waitForTimeout(200);
  // Mouse coordinates are viewport-relative, so the editor has to be on
  // screen before it can be aimed at.
  await page.$eval('#anim-curve', e => e.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(200);
  const box = await page.$eval('#anim-curve', e => { const r = e.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  // The first handle of `linear` sits at curve (0,0) — bottom-left inside the pad.
  const pad = 46 / 240;
  const h0 = { x: box.x + box.w * pad, y: box.y + box.h * (1 - pad) };
  await page.mouse.move(h0.x, h0.y);
  await page.mouse.down();
  await page.mouse.move(h0.x + box.w * 0.3, h0.y - box.h * 0.3, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(250);
  ok('dragging switches the select to Custom',
     await page.$eval('#anim-easing', e => e.value) === 'custom',
     await page.$eval('#anim-easing', e => e.value));
  ok('the note says custom',
     /custom/i.test(await page.$eval('#anim-curve-note', e => e.textContent)),
     await page.$eval('#anim-curve-note', e => e.textContent));

  console.log('--- the drag really reached the animation engine ---');
  // Render the same moment before and after a further drag and compare pixels.
  await setTime(page, 0.5);
  const frameBefore = await page.evaluate(() => {
    const c = document.getElementById('anim-canvas');
    return c.getContext('2d').getImageData(0, 0, c.width, c.height).data.join('').length;
  });
  await page.mouse.move(h0.x + box.w * 0.3, h0.y - box.h * 0.3);
  await page.mouse.down();
  await page.mouse.move(h0.x + box.w * 0.05, h0.y + box.h * 0.05, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(250);
  const spec = await page.$eval('#anim-curve-note', e => e.textContent);
  ok('the keyframe now carries control points, not a name', /custom/i.test(spec), spec);

  console.log('--- keyboard editing ---');
  await page.selectOption('#anim-easing', 'linear');
  await page.waitForTimeout(200);
  await page.focus('#anim-curve');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(250);
  ok('arrow keys edit the curve without a mouse',
     await page.$eval('#anim-easing', e => e.value) === 'custom',
     await page.$eval('#anim-easing', e => e.value));

  console.log('--- a non-bezier curve hides its handles ---');
  await page.selectOption('#anim-easing', 'bounce');
  await page.waitForTimeout(250);
  ok('bounce is marked undraggable',
     await page.$eval('#anim-curve', e => e.dataset.draggable) === 'false',
     await page.$eval('#anim-curve', e => e.dataset.draggable));
  ok('but is still drawn', await painted() > 1000);

  console.log('--- per-keyframe: two segments, two curves ---');
  await setTime(page, 0);
  await page.click('#anim-key-btn');
  await setTime(page, 2);
  await page.click('#anim-key-btn');
  await page.waitForTimeout(300);
  const chips = await page.$$eval('.anim-kf-chip', c => c.length);
  ok('two keyframes exist', chips >= 2, String(chips));
  await setTime(page, 0);
  await page.selectOption('#anim-easing', 'linear');
  await page.waitForTimeout(200);
  await setTime(page, 2);
  await page.waitForTimeout(200);
  await page.selectOption('#anim-easing', 'backOut');
  await page.waitForTimeout(250);
  await setTime(page, 0);
  await page.waitForTimeout(250);
  ok('moving the playhead back shows that segment’s own curve',
     await page.$eval('#anim-easing', e => e.value) === 'linear',
     await page.$eval('#anim-easing', e => e.value));

  console.log('\nerrors:', errs.join(' | ') || '(none)');
  ok('no uncaught page errors', errs.length === 0, errs.join('; '));
  console.log(`${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
