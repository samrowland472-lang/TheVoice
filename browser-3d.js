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

  // The centroid of the drawn pixels: moves when the camera moves.
  const centroid = () => page.evaluate(() => {
    // The viewport swaps between the 2D canvas and the WebGL one when 3D
    // is turned on; the hidden one keeps its last frame, so reading it by
    // name measures a still image. Read whichever is on screen, through a
    // scratch 2D canvas so the same code works for both.
    const vis = [...document.querySelectorAll('#anim-canvas, #anim-canvas-gl')]
      .find((el) => !el.hidden && el.offsetParent !== null)
      || document.getElementById('anim-canvas');
    const c = document.createElement('canvas');
    c.width = vis.width; c.height = vis.height;
    const sctx = c.getContext('2d');
    sctx.drawImage(vis, 0, 0);
    const d = sctx.getImageData(0, 0, c.width, c.height).data;
    const bg = [d[0], d[1], d[2]];
    let sx = 0, sy = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (Math.abs(d[i]-bg[0]) + Math.abs(d[i+1]-bg[1]) + Math.abs(d[i+2]-bg[2]) > 24) {
        const px = (i / 4) % c.width, py = Math.floor((i / 4) / c.width);
        sx += px; sy += py; n++;
      }
    }
    return n ? { x: sx/n, y: sy/n, n } : { x: 0, y: 0, n: 0 };
  });
  const seek = async (t) => { await page.evaluate((tt) => {
      const el = document.getElementById('anim-time');
      el.value = String(tt); el.dispatchEvent(new Event('input', { bubbles: true })); }, t);
    await page.waitForTimeout(150); };

  await page.click('#anim-add-btn'); await page.waitForTimeout(300);

  console.log('--- 3D is off by default ---');
  ok('the toggle is off', !(await page.$eval('#anim-3d', e => e.checked)));
  ok('camera controls are hidden', await page.$eval('#camera-controls', e => e.hidden));
  ok('depth sliders are hidden',
     await page.$eval('#anim-z', e => e.offsetParent === null));
  const flat = await centroid();
  ok('the shape is drawn', flat.n > 100, JSON.stringify(flat));

  console.log('--- turning 3D on does not move anything at depth zero ---');
  await page.click('#anim-3d'); await page.waitForTimeout(500);
  ok('camera controls appear', !(await page.$eval('#camera-controls', e => e.hidden)));
  ok('depth sliders appear', await page.$eval('#anim-z', e => e.offsetParent !== null));
  const on = await centroid();
  ok('a centred shape stays put', Math.abs(on.x - flat.x) < 2 && Math.abs(on.y - flat.y) < 2,
     `${JSON.stringify(flat)} -> ${JSON.stringify(on)}`);
  ok('and stays the same size', Math.abs(on.n - flat.n) / flat.n < 0.05,
     `${flat.n} -> ${on.n}`);

  console.log('--- depth changes size ---');
  const setSlider = async (id, v) => { await page.evaluate(([i, val]) => {
      const el = document.getElementById(i);
      el.value = String(val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, [id, v]); await page.waitForTimeout(300); };

  await setSlider('anim-z', 150);
  const far = await centroid();
  ok('pushing it back makes it smaller', far.n < on.n * 0.8, `${on.n} -> ${far.n}`);
  await setSlider('anim-z', -50);
  const nearer = await centroid();
  ok('pulling it forward makes it bigger', nearer.n > on.n * 1.2, `${on.n} -> ${nearer.n}`);
  await setSlider('anim-z', 0);

  console.log('--- tilting foreshortens ---');
  await setSlider('anim-roty', 70);
  const turned = await centroid();
  ok('turning it away narrows it', turned.n < on.n * 0.75, `${on.n} -> ${turned.n}`);
  await setSlider('anim-roty', 0);

  console.log('--- the camera can be orbited by dragging ---');
  await setSlider('anim-z', 0);
  await page.evaluate(() => {
    // Put a second shape off to one side so an orbit is visible.
    document.getElementById('anim-x').value = '20';
    document.getElementById('anim-x').dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('anim-x').dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(300);
  const beforeOrbit = await centroid();
  // Same swap applies to hit-testing: the hidden canvas has a zero-sized
  // box, so a drag aimed at it lands nowhere.
  const cbox = await page.evaluate(() => {
    const el = [...document.querySelectorAll('#anim-canvas, #anim-canvas-gl, #anim-overlay')]
      .find((e) => !e.hidden && e.offsetParent !== null);
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await page.mouse.move(cbox.x, cbox.y);
  await page.mouse.down();
  await page.mouse.move(cbox.x + 140, cbox.y, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  const afterOrbit = await centroid();
  ok('orbiting moves the shape on screen', Math.abs(afterOrbit.x - beforeOrbit.x) > 8,
     `${beforeOrbit.x.toFixed(1)} -> ${afterOrbit.x.toFixed(1)}`);
  ok('and it is still on screen', afterOrbit.n > 50, String(afterOrbit.n));

  console.log('--- undo covers camera moves ---');
  await page.keyboard.press('Control+z'); await page.waitForTimeout(500);
  const undone = await centroid();
  ok('undo restores the camera', Math.abs(undone.x - beforeOrbit.x) < 8,
     `${afterOrbit.x.toFixed(1)} -> ${undone.x.toFixed(1)}, wanted ${beforeOrbit.x.toFixed(1)}`);

  console.log('--- camera presets frame the subject ---');
  for (const preset of ['threeQuarter', 'top', 'low', 'front']) {
    await page.selectOption('#anim-camera-preset', preset);
    await page.waitForTimeout(400);
    const c = await centroid();
    ok(`${preset} keeps the subject visible`, c.n > 30, `${c.n} px`);
  }

  console.log('--- the lens changes perspective ---');
  await page.selectOption('#anim-camera-preset', 'front'); await page.waitForTimeout(350);
  const normal = await centroid();
  await setSlider('anim-fov', 100);
  const wide = await centroid();
  ok('a wide lens changes the framing', Math.abs(wide.n - normal.n) > 20,
     `${normal.n} -> ${wide.n}`);

  console.log('--- turning 3D off returns to the flat render ---');
  await setSlider('anim-fov', 55);
  await page.click('#anim-3d'); await page.waitForTimeout(400);
  ok('controls hide again', await page.$eval('#camera-controls', e => e.hidden));
  ok('depth sliders hide', await page.$eval('#anim-z', e => e.offsetParent === null));
  ok('it still renders', (await centroid()).n > 50);

  console.log('--- a 3D scene survives save and reopen ---');
  await page.click('#anim-3d'); await page.waitForTimeout(300);
  await setSlider('anim-z', 90);
  const dl = page.waitForEvent('download');
  await page.click('#anim-save-btn');
  const file = '/tmp/scene3d.json';
  await (await dl).saveAs(file);
  const saved = JSON.parse(require('fs').readFileSync(file, 'utf8'));
  ok('the camera is in the file', !!saved.camera, JSON.stringify(Object.keys(saved)));
  ok('depth is in the keyframes',
     saved.shapes.some(s => s.keyframes.some(k => k.z === 90)),
     JSON.stringify(saved.shapes[0].keyframes));

  await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1400);
  await page.evaluate(() => { document.getElementById('gate').hidden = true; document.getElementById('app-shell').hidden = false; });
  await page.click('[data-section="animate"]'); await page.waitForTimeout(400);
  const [ch] = await Promise.all([page.waitForEvent('filechooser'), page.click('#anim-open-btn')]);
  await ch.setFiles(file); await page.waitForTimeout(1200);
  ok('reopening restores 3D mode', await page.$eval('#anim-3d', e => e.checked));
  ok('and the camera controls', !(await page.$eval('#camera-controls', e => e.hidden)));
  ok('and it renders', (await centroid()).n > 20, String((await centroid()).n));

  console.log('\nerrors:', errs.join(' | ') || '(none)');
  ok('no uncaught page errors', errs.length === 0, errs.join('; '));
  console.log(`${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
