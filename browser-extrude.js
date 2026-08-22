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

  const analyse = () => page.evaluate(() => {
    const src = !document.getElementById('anim-canvas-gl').hidden
      ? document.getElementById('anim-canvas-gl') : document.getElementById('anim-canvas');
    const c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    const scratch = c.getContext('2d');
    scratch.drawImage(src, 0, 0);
    const d = scratch.getImageData(0, 0, c.width, c.height).data;
    const bg = [d[0], d[1], d[2]];
    const colors = new Map();
    let n = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (Math.abs(d[i]-bg[0]) + Math.abs(d[i+1]-bg[1]) + Math.abs(d[i+2]-bg[2]) > 24) {
        n++;
        const key = `${d[i]>>4},${d[i+1]>>4},${d[i+2]>>4}`;
        colors.set(key, (colors.get(key) || 0) + 1);
      }
    }
    let major = 0;
    for (const count of colors.values()) if (count > 40) major++;
    return { n, major };
  });
  const setSlider = async (id, v) => { await page.evaluate(([i, val]) => {
      const el = document.getElementById(i);
      el.value = String(val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, [id, v]); await page.waitForTimeout(250); };

  console.log('--- the extrude slider appears for text in 3D ---');
  await page.selectOption('#anim-shape-type', 'text');
  await page.click('#anim-add-btn'); await page.waitForTimeout(300);
  ok('hidden in 2D', await page.$eval('#anim-extrude-row', e => e.hidden));
  await page.click('#anim-3d'); await page.waitForTimeout(400);
  await page.click('.anim-shape-item'); await page.waitForTimeout(200);
  ok('shown for text in 3D', !(await page.$eval('#anim-extrude-row', e => e.hidden)));

  console.log('--- extrusion adds real bulk, turned it adds a flank ---');
  await setSlider('anim-extrude', 0);
  await setSlider('anim-roty', 45);
  const flatTurned = await analyse();
  await setSlider('anim-extrude', 30);
  const deepTurned = await analyse();
  ok('a turned extruded title covers clearly more pixels',
     deepTurned.n > flatTurned.n * 1.25, `${flatTurned.n} -> ${deepTurned.n}`);
  ok('and shows the darker flank as a second colour',
     deepTurned.major > flatTurned.major, `${flatTurned.major} -> ${deepTurned.major}`);

  console.log('--- a cube in the same scene still renders ---');
  await page.selectOption('#anim-shape-type', 'cube');
  await page.click('#anim-add-btn'); await page.waitForTimeout(300);
  const both = await analyse();
  ok('both objects on screen', both.n > deepTurned.n, `${deepTurned.n} -> ${both.n}`);

  console.log('--- extrusion survives save and reopen ---');
  const dl = page.waitForEvent('download');
  await page.click('#anim-save-btn');
  const file = '/tmp/extrude-scene.json';
  await (await dl).saveAs(file);
  const saved = JSON.parse(require('fs').readFileSync(file, 'utf8'));
  ok('the depth is in the file', saved.shapes.some(s => s.extrude === 30),
     JSON.stringify(saved.shapes.map(s => s.extrude)));
  await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1400);
  await page.evaluate(() => { document.getElementById('gate').hidden = true; document.getElementById('app-shell').hidden = false; });
  await page.click('[data-section="animate"]'); await page.waitForTimeout(400);
  const [ch] = await Promise.all([page.waitForEvent('filechooser'), page.click('#anim-open-btn')]);
  await ch.setFiles(file); await page.waitForTimeout(1200);
  await page.click('.anim-shape-item'); await page.waitForTimeout(200);
  ok('the slider shows the saved depth',
     (await page.$eval('#anim-extrude', e => e.value)) === '30',
     await page.$eval('#anim-extrude', e => e.value));
  const reopened = await analyse();
  ok('and the extruded title renders', reopened.n > 400, String(reopened.n));

  console.log('\nerrors:', errs.join(' | ') || '(none)');
  ok('no uncaught page errors', errs.length === 0, errs.join('; '));
  console.log(`${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
