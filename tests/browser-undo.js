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

  const shapes = () => page.$$eval('.anim-shape-item', s => s.length);
  const undoOn = () => page.$eval('#anim-undo-btn', e => !e.disabled);
  const redoOn = () => page.$eval('#anim-redo-btn', e => !e.disabled);

  console.log('--- sliders still work (the shadowing bug) ---');
  await page.click('#anim-add-btn'); await page.waitForTimeout(300);
  const keysBefore = await page.$$eval('.anim-kf-chip', c => c.length);
  await page.evaluate(() => {
    const el = document.getElementById('anim-time');
    el.value = '2'; el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    const el = document.getElementById('anim-x');
    el.value = '80';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(300);
  const keysAfter = await page.$$eval('.anim-kf-chip', c => c.length);
  ok('moving a slider writes a keyframe', keysAfter > keysBefore, `${keysBefore} -> ${keysAfter}`);
  ok('Set keyframe button works too', await page.$eval('#anim-key-btn', e => !e.disabled));

  console.log('--- undo/redo buttons track availability ---');
  ok('undo is enabled after edits', await undoOn());
  ok('redo is disabled with nothing ahead', !(await redoOn()));

  console.log('--- undo an added shape ---');
  const n0 = await shapes();
  await page.click('#anim-add-btn'); await page.waitForTimeout(300);
  ok('a shape was added', await shapes() === n0 + 1, String(await shapes()));
  await page.click('#anim-undo-btn'); await page.waitForTimeout(400);
  ok('undo removes it', await shapes() === n0, String(await shapes()));
  ok('redo is now offered', await redoOn());
  await page.click('#anim-redo-btn'); await page.waitForTimeout(400);
  ok('redo brings it back', await shapes() === n0 + 1, String(await shapes()));

  console.log('--- undo a deletion ---');
  const beforeDelete = await shapes();
  await page.click('#anim-delete-btn'); await page.waitForTimeout(300);
  ok('the shape is gone', await shapes() === beforeDelete - 1, String(await shapes()));
  await page.keyboard.press('Control+z'); await page.waitForTimeout(400);
  ok('ctrl+z restores it', await shapes() === beforeDelete, String(await shapes()));

  console.log('--- keyboard redo, all three bindings ---');
  await page.keyboard.press('Control+Shift+z'); await page.waitForTimeout(350);
  ok('ctrl+shift+z redoes', await shapes() === beforeDelete - 1, String(await shapes()));
  await page.keyboard.press('Control+z'); await page.waitForTimeout(350);
  await page.keyboard.press('Control+y'); await page.waitForTimeout(350);
  ok('ctrl+y also redoes', await shapes() === beforeDelete - 1, String(await shapes()));
  await page.keyboard.press('Control+z'); await page.waitForTimeout(350);

  console.log('--- a whole generated scene is one step ---');
  await page.fill('#agent-prompt', 'five green triangles bouncing');
  await page.click('#agent-go-btn'); await page.waitForTimeout(800);
  ok('five shapes', await shapes() === 5, String(await shapes()));
  await page.keyboard.press('Control+z'); await page.waitForTimeout(450);
  ok('one undo reverts the entire scene', await shapes() !== 5, String(await shapes()));

  console.log('--- a keyframe drag is one step, not fifty ---');
  await page.fill('#agent-prompt', 'two blue circles that fade in');
  await page.click('#agent-go-btn'); await page.waitForTimeout(800);
  await page.$eval('#anim-timeline', e => e.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(200);
  const box = await page.$eval('#anim-timeline', e => { const r = e.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width }; });
  const dur = await page.$eval('#anim-time', e => parseFloat(e.max));
  const xFor = t => box.x + 96 + (t / dur) * (box.w - 96 - 12);
  const rowY = box.y + 22 + 13;
  const times = () => page.$$eval('.anim-kf-chip', c => c.map(x => parseFloat(x.textContent)));

  await page.mouse.click(box.x + 40, rowY); await page.waitForTimeout(250);
  const t0 = await times();
  const last = Math.max(...t0);
  await page.mouse.move(xFor(last), rowY);
  await page.mouse.down();
  // Many small moves — each one mutates the scene.
  for (let i = 1; i <= 20; i++) await page.mouse.move(xFor(last - (last * 0.4 * i) / 20), rowY);
  await page.mouse.up();
  await page.waitForTimeout(400);
  const t1 = await times();
  ok('the drag moved it', Math.max(...t1) < last - 0.3, `${last} -> ${Math.max(...t1)}`);
  await page.keyboard.press('Control+z'); await page.waitForTimeout(450);
  const t2 = await times();
  ok('ONE undo restores the whole drag', Math.abs(Math.max(...t2) - last) < 0.05,
     `${Math.max(...t1)} -> ${Math.max(...t2)}, wanted ${last}`);

  console.log('--- typing is not hijacked ---');
  await page.click('#agent-prompt');
  await page.fill('#agent-prompt', 'hello');
  const shapesNow = await shapes();
  await page.keyboard.press('Control+z');
  await page.waitForTimeout(350);
  ok('ctrl+z in a text box does not revert the scene', await shapes() === shapesNow,
     `${shapesNow} -> ${await shapes()}`);

  console.log('--- undo does not apply outside the animate panel ---');
  await page.click('[data-section="music"]'); await page.waitForTimeout(300);
  const before = await page.evaluate(() => document.querySelectorAll('.seq-cell.on').length);
  await page.keyboard.press('Control+z'); await page.waitForTimeout(300);
  ok('the music panel is untouched',
     await page.evaluate(() => document.querySelectorAll('.seq-cell.on').length) === before);

  console.log('\nerrors:', errs.join(' | ') || '(none)');
  ok('no uncaught page errors', errs.length === 0, errs.join('; '));
  console.log(`${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
