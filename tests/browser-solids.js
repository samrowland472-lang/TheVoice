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

  // Distinct non-background colours: a lit solid shows several, a flat
  // billboard exactly one.
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
    let n = 0, sx = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (Math.abs(d[i]-bg[0]) + Math.abs(d[i+1]-bg[1]) + Math.abs(d[i+2]-bg[2]) > 24) {
        n++; sx += (i / 4) % c.width;
        const key = `${d[i]>>4},${d[i+1]>>4},${d[i+2]>>4}`;
        colors.set(key, (colors.get(key) || 0) + 1);
      }
    }
    // Ignore antialiasing fringes: only colours covering real area count.
    let major = 0;
    for (const count of colors.values()) if (count > 40) major++;
    return { n, cx: n ? sx / n : 0, major };
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

  console.log('--- a cube is a solid, not a card ---');
  await page.selectOption('#anim-shape-type', 'cube');
  await page.click('#anim-add-btn'); await page.waitForTimeout(300);
  await page.click('#anim-3d'); await page.waitForTimeout(400);
  const faceOn = await analyse();
  ok('face-on it is drawn', faceOn.n > 300, JSON.stringify(faceOn));
  await setSlider('anim-rotx', 30);
  await setSlider('anim-roty', 40);
  const tilted = await analyse();
  ok('tilted it shows several distinctly-lit faces', tilted.major >= 3, `major colours: ${tilted.major}`);
  ok('still substantial on screen', tilted.n > 300, String(tilted.n));

  console.log('--- a sphere reads as shaded, not flat ---');
  await page.click('#anim-delete-btn'); await page.waitForTimeout(200);
  await page.selectOption('#anim-shape-type', 'sphere');
  await page.click('#anim-add-btn'); await page.waitForTimeout(300);
  const sphere = await analyse();
  ok('the sphere is drawn', sphere.n > 300, String(sphere.n));
  ok('with graded shading across its surface', sphere.major >= 4, `major colours: ${sphere.major}`);

  console.log('--- solids fall back to silhouettes without 3D ---');
  await page.click('#anim-3d'); await page.waitForTimeout(300);
  const flat = await analyse();
  ok('the sphere still renders as a flat circle', flat.n > 300, String(flat.n));
  ok('as one colour', flat.major <= 2, `major colours: ${flat.major}`);
  await page.click('#anim-3d'); await page.waitForTimeout(300);

  console.log('--- camera keyframes animate the shot ---');
  await seek(0);
  await page.click('#anim-camkey-btn'); await page.waitForTimeout(200);
  ok('the key count appears', !(await page.$eval('#anim-camkey-count', e => e.hidden)));
  await seek(4);
  // Dolly in hard at t=4 by wheeling on the canvas.
  const cbox = await page.$eval('#anim-stage', e => { const r = e.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await page.mouse.move(cbox.x, cbox.y);
  for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, -120); await page.waitForTimeout(60); }
  await page.waitForTimeout(300);
  ok('dollying with keys present auto-keys this moment',
     (await page.$eval('#anim-camkey-count', e => e.textContent)).includes('2'),
     await page.$eval('#anim-camkey-count', e => e.textContent));
  const atEnd = await analyse();
  await seek(0);
  const atStart = await analyse();
  await seek(2);
  const atMid = await analyse();
  ok('the start frame shows the wide shot', atStart.n < atMid.n && atMid.n < atEnd.n,
     `${atStart.n} -> ${atMid.n} -> ${atEnd.n}`);

  console.log('--- the camera move survives save and reopen ---');
  const dl = page.waitForEvent('download');
  await page.click('#anim-save-btn');
  const file = '/tmp/camkeys-scene.json';
  await (await dl).saveAs(file);
  const saved = JSON.parse(require('fs').readFileSync(file, 'utf8'));
  ok('camera keys are in the file', Array.isArray(saved.cameraKeyframes) && saved.cameraKeyframes.length === 2,
     String(saved.cameraKeyframes && saved.cameraKeyframes.length));
  ok('no function leaked into the file', !JSON.stringify(saved).includes('easeFn'));
  await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1400);
  await page.evaluate(() => { document.getElementById('gate').hidden = true; document.getElementById('app-shell').hidden = false; });
  await page.click('[data-section="animate"]'); await page.waitForTimeout(400);
  const [ch] = await Promise.all([page.waitForEvent('filechooser'), page.click('#anim-open-btn')]);
  await ch.setFiles(file); await page.waitForTimeout(1200);
  ok('reopening restores the key count',
     (await page.$eval('#anim-camkey-count', e => e.textContent)).includes('2'),
     await page.$eval('#anim-camkey-count', e => e.textContent));
  await seek(0); const rStart = await analyse();
  await seek(4); const rEnd = await analyse();
  ok('and the dolly still plays', rEnd.n > rStart.n * 1.3, `${rStart.n} -> ${rEnd.n}`);

  console.log('--- the agent builds solids and switches 3D on itself ---');
  await page.fill('#agent-prompt', 'three red cubes spinning');
  await page.click('#agent-go-btn'); await page.waitForTimeout(900);
  ok('three shapes', await page.$$eval('.anim-shape-item', s => s.length) === 3);
  ok('3D switched itself on', await page.$eval('#anim-3d', e => e.checked));
  await seek(1);
  const agentCubes = await analyse();
  ok('lit cubes on screen', agentCubes.n > 300 && agentCubes.major >= 3,
     JSON.stringify(agentCubes));
  const before = agentCubes.cx;
  await seek(2.2);
  const during = await analyse();
  ok('the spin actually turns them', Math.abs(during.n - agentCubes.n) > 40 || Math.abs(during.cx - before) > 2,
     `${agentCubes.n}px -> ${during.n}px`);

  console.log('\nerrors:', errs.join(' | ') || '(none)');
  ok('no uncaught page errors', errs.length === 0, errs.join('; '));
  console.log(`${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
