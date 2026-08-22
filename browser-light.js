const { chromium } = require('playwright');
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

  // Mean colour of the drawn pixels: the light moving shifts it.
  const meanColor = () => page.evaluate(() => {
    const src = !document.getElementById('anim-canvas-gl').hidden
      ? document.getElementById('anim-canvas-gl') : document.getElementById('anim-canvas');
    const c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    const scratch = c.getContext('2d');
    scratch.drawImage(src, 0, 0);
    const d = scratch.getImageData(0, 0, c.width, c.height).data;
    const bg = [d[0], d[1], d[2]];
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (Math.abs(d[i]-bg[0]) + Math.abs(d[i+1]-bg[1]) + Math.abs(d[i+2]-bg[2]) > 24) {
        r += d[i]; g += d[i+1]; b += d[i+2]; n++;
      }
    }
    return n ? { r: r/n, g: g/n, b: b/n, n } : { r:0,g:0,b:0,n:0 };
  });
  const seek = async (t) => { await page.evaluate((tt) => {
      const el = document.getElementById('anim-time');
      el.value = String(tt); el.dispatchEvent(new Event('input', { bubbles: true })); }, t);
    await page.waitForTimeout(150); };
  const setSlider = async (id, v) => { await page.evaluate(([i, val]) => {
      const el = document.getElementById(i);
      el.value = String(val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, [id, v]); await page.waitForTimeout(250); };

  console.log('--- the light panel arrives with 3D ---');
  await page.selectOption('#anim-shape-type', 'cube');
  await page.click('#anim-add-btn'); await page.waitForTimeout(300);
  ok('hidden in 2D', await page.$eval('#light-controls', e => e.hidden));
  await page.click('#anim-3d'); await page.waitForTimeout(400);
  ok('shown in 3D', !(await page.$eval('#light-controls', e => e.hidden)));
  await setSlider('anim-rotx', 25); await setSlider('anim-roty', 40);

  console.log('--- warmth changes the colour of the light ---');
  const neutral = await meanColor();
  await setSlider('anim-light-warm', 1);
  const warm = await meanColor();
  ok('warm shifts red up and blue down', warm.r > neutral.r + 2 && warm.b < neutral.b - 2,
     `r ${neutral.r.toFixed(0)}->${warm.r.toFixed(0)}, b ${neutral.b.toFixed(0)}->${warm.b.toFixed(0)}`);
  await setSlider('anim-light-warm', 0);
  const cold = await meanColor();
  ok('cold shifts the other way', cold.b > warm.b + 2, `${warm.b.toFixed(0)} -> ${cold.b.toFixed(0)}`);
  await setSlider('anim-light-warm', 0.5);

  console.log('--- moving the light re-shades the object ---');
  const before = await meanColor();
  await setSlider('anim-light-az', -140);
  const after = await meanColor();
  ok('the mean brightness changes as the light swings',
     Math.abs((after.r+after.g+after.b) - (before.r+before.g+before.b)) > 4,
     `${(before.r+before.g+before.b).toFixed(0)} -> ${(after.r+after.g+after.b).toFixed(0)}`);
  await setSlider('anim-light-az', 40);

  console.log('--- a keyed sunrise plays ---');
  await seek(0);
  await setSlider('anim-light-el', -30);   // low sun
  await setSlider('anim-light-warm', 1);   // warm
  await page.click('#anim-lightkey-btn'); await page.waitForTimeout(200);
  await seek(4);
  await setSlider('anim-light-el', 80);    // high sun — auto-keys, since keys exist
  await setSlider('anim-light-warm', 0.5);
  await page.waitForTimeout(250);
  ok('editing with keys present auto-keyed the second moment',
     (await page.$eval('#anim-lightkey-count', e => e.textContent)).includes('2'),
     await page.$eval('#anim-lightkey-count', e => e.textContent));
  await seek(0); const dawn = await meanColor();
  await seek(4); const noon = await meanColor();
  ok('dawn is warmer than noon', dawn.r / Math.max(1, dawn.b) > noon.r / Math.max(1, noon.b) + 0.05,
     `dawn r/b ${(dawn.r/dawn.b).toFixed(2)} vs noon ${(noon.r/noon.b).toFixed(2)}`);

  console.log('--- the light lane appears on the timeline ---');
  const tlh = await page.$eval('#anim-timeline', e => e.getBoundingClientRect().height);
  ok('three lanes now (camera, light, cube)', tlh >= 22 + 3 * 26 - 2, String(tlh));

  console.log('--- the sunrise survives save and reopen ---');
  const dl = page.waitForEvent('download');
  await page.click('#anim-save-btn');
  const file = '/tmp/sunrise.json';
  await (await dl).saveAs(file);
  const saved = JSON.parse(require('fs').readFileSync(file, 'utf8'));
  ok('the light is in the file', !!saved.light, JSON.stringify(Object.keys(saved)));
  ok('with both keys', Array.isArray(saved.lightKeyframes) && saved.lightKeyframes.length === 2);
  ok('no function leaked', !JSON.stringify(saved).includes('easeFn'));

  await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1400);
  await page.evaluate(() => { document.getElementById('gate').hidden = true; document.getElementById('app-shell').hidden = false; });
  await page.click('[data-section="animate"]'); await page.waitForTimeout(400);
  const [ch] = await Promise.all([page.waitForEvent('filechooser'), page.click('#anim-open-btn')]);
  await ch.setFiles(file); await page.waitForTimeout(1200);
  ok('the key count is restored',
     (await page.$eval('#anim-lightkey-count', e => e.textContent)).includes('2'),
     await page.$eval('#anim-lightkey-count', e => e.textContent));
  await seek(0); const rDawn = await meanColor();
  await seek(4); const rNoon = await meanColor();
  ok('and the sunrise still plays',
     rDawn.r / Math.max(1, rDawn.b) > rNoon.r / Math.max(1, rNoon.b) + 0.05,
     `${(rDawn.r/rDawn.b).toFixed(2)} vs ${(rNoon.r/rNoon.b).toFixed(2)}`);

  console.log('--- undo covers light edits ---');
  await page.click('#anim-lightclear-btn'); await page.waitForTimeout(300);
  ok('clear empties the keys', await page.$eval('#anim-lightkey-count', e => e.hidden));
  await page.keyboard.press('Control+z'); await page.waitForTimeout(400);
  ok('undo brings them back',
     (await page.$eval('#anim-lightkey-count', e => e.textContent)).includes('2'),
     await page.$eval('#anim-lightkey-count', e => e.textContent));

  console.log('\nerrors:', errs.join(' | ') || '(none)');
  ok('no uncaught page errors', errs.length === 0, errs.join('; '));
  console.log(`${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
