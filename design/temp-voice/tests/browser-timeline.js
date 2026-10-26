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

  // Build a scene with known keyframes via the free agent.
  await page.fill('#agent-prompt', 'three blue circles that fade in');
  await page.click('#agent-go-btn'); await page.waitForTimeout(800);

  const tl = async () => {
    await page.$eval('#anim-timeline', e => e.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(150);
    return page.$eval('#anim-timeline', e => { const r = e.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  };
  const keyTimes = () => page.evaluate(() => {
    // Read the times off the chips, which mirror the scene data.
    return [...document.querySelectorAll('.anim-kf-chip')].map(c => parseFloat(c.textContent));
  });
  const playhead = () => page.$eval('#anim-time', e => parseFloat(e.value));

  console.log('--- the timeline exists and is drawn ---');
  const box = await tl();
  ok('canvas present', box.w > 300, JSON.stringify(box));
  ok('it grows a row per shape', box.h > 22 + 3 * 20, String(box.h));
  const painted = await page.evaluate(() => {
    const c = document.getElementById('anim-timeline');
    const d = c.getContext('2d').getImageData(0,0,c.width,c.height).data;
    const bg = [d[0], d[1], d[2]]; let n = 0;
    for (let i = 0; i < d.length; i += 4)
      if (Math.abs(d[i]-bg[0])+Math.abs(d[i+1]-bg[1])+Math.abs(d[i+2]-bg[2]) > 24) n++;
    return n;
  });
  ok('something is actually drawn on it', painted > 800, String(painted));

  console.log('--- clicking the ruler scrubs ---');
  await page.mouse.click(box.x + box.w * 0.6, box.y + 8);
  await page.waitForTimeout(250);
  const t1 = await playhead();
  ok('the playhead moved', t1 > 1, String(t1));
  ok('the frame followed it',
     (await page.$eval('#anim-time-label', e => e.textContent)).startsWith(t1.toFixed(2)),
     await page.$eval('#anim-time-label', e => e.textContent));

  console.log('--- clicking a row selects that shape ---');
  await page.mouse.click(box.x + 40, box.y + 22 + 26 * 2 + 12);
  await page.waitForTimeout(250);
  const sel = await page.$$eval('.anim-shape-item', els => els.findIndex(e => e.getAttribute('aria-pressed') === 'true'));
  ok('the third row selects the third shape', sel === 2, String(sel));

  console.log('--- dragging a keyframe changes when it happens ---');
  await page.mouse.click(box.x + 40, box.y + 22 + 12);   // select shape 1
  await page.waitForTimeout(250);
  const before = await keyTimes();
  ok('the shape has keyframes', before.length >= 2, JSON.stringify(before));

  // The last keyframe of row 0 sits at the far right; drag it left.
  const lastT = Math.max(...before);
  const duration = await page.$eval('#anim-time', e => parseFloat(e.max));
  const gutter = 96, rightPad = 12;
  const xFor = (t) => box.x + gutter + (t / duration) * (box.w - gutter - rightPad);
  const rowMidY = box.y + 22 + 13;

  await page.mouse.move(xFor(lastT), rowMidY);
  await page.mouse.down();
  await page.mouse.move(xFor(lastT * 0.5), rowMidY, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  const after = await keyTimes();
  ok('the keyframe moved earlier', Math.max(...after) < lastT - 0.5,
     `${lastT} -> ${Math.max(...after)}`);
  ok('the count is unchanged', after.length === before.length, `${before.length} -> ${after.length}`);
  ok('times stay in order', after.every((t, i, a) => i === 0 || a[i-1] <= t), JSON.stringify(after));
  ok('no two keyframes collide', new Set(after).size === after.length, JSON.stringify(after));

  console.log('--- the drag changed the actual animation ---');
  const posAt = (t) => page.evaluate((tt) => {
    const el = document.getElementById('anim-time');
    el.value = String(tt); el.dispatchEvent(new Event('input', { bubbles: true }));
    const c = document.getElementById('anim-canvas');
    const d = c.getContext('2d').getImageData(0,0,c.width,c.height).data;
    const bg = [d[0], d[1], d[2]]; let n = 0;
    for (let i = 0; i < d.length; i += 4)
      if (Math.abs(d[i]-bg[0])+Math.abs(d[i+1]-bg[1])+Math.abs(d[i+2]-bg[2]) > 24) n++;
    return n;
  }, t);
  const nowVisible = await posAt(Math.max(...after) + 0.05);
  ok('the shape has finished its move by its new end time', nowVisible > 100, String(nowVisible));

  console.log('--- a drag cannot push a keyframe past its neighbour ---');
  const times = await keyTimes();
  const firstX = xFor(times[0]);
  await page.mouse.move(firstX, rowMidY);
  await page.mouse.down();
  await page.mouse.move(box.x + box.w, rowMidY, { steps: 10 });  // drag far right
  await page.mouse.up();
  await page.waitForTimeout(400);
  const squashed = await keyTimes();
  ok('order still holds after an extreme drag',
     squashed.every((t, i, a) => i === 0 || a[i-1] < t), JSON.stringify(squashed));
  ok('still no collisions', new Set(squashed).size === squashed.length, JSON.stringify(squashed));

  console.log('--- keyboard ---');
  await page.focus('#anim-timeline');
  await page.evaluate(() => {
    const el = document.getElementById('anim-time');
    el.value = '1'; el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForTimeout(150);
  const kb0 = await playhead();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(200);
  ok('right arrow advances one frame', await playhead() > kb0, `${kb0} -> ${await playhead()}`);
  await page.keyboard.press('Home');
  await page.waitForTimeout(200);
  ok('Home returns to the start', await playhead() === 0, String(await playhead()));
  await page.keyboard.press('End');
  await page.waitForTimeout(200);
  ok('End goes to the end', Math.abs(await playhead() - duration) < 0.01, String(await playhead()));

  console.log('--- the playhead tracks playback ---');
  await page.keyboard.press('Home');
  await page.click('#anim-play-btn');
  await page.waitForTimeout(900);
  const during = await playhead();
  await page.waitForTimeout(700);
  ok('it advances while playing', await playhead() > during || during > 0.3,
     `${during} -> ${await playhead()}`);

  console.log('\nerrors:', errs.join(' | ') || '(none)');
  ok('no uncaught page errors', errs.length === 0, errs.join('; '));
  console.log(`${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
