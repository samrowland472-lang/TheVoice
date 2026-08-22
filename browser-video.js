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

  console.log('--- the button exists and gates on content ---');
  ok('export video button is present', await page.$('#anim-video-btn') !== null);
  ok('disabled with an empty scene', await page.$eval('#anim-video-btn', e => e.disabled));

  await page.fill('#agent-prompt', 'two blue cubes spinning for 2 seconds');
  await page.click('#agent-go-btn'); await page.waitForTimeout(900);
  ok('enabled once there is a scene', await page.$eval('#anim-video-btn', e => !e.disabled));

  console.log('--- recording produces a real video file ---');
  const support = await page.evaluate(() => ({
    recorder: typeof MediaRecorder !== 'undefined',
    capture: !!HTMLCanvasElement.prototype.captureStream,
    webm: typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/webm'),
  }));
  console.log('  browser support:', JSON.stringify(support));

  if (!support.recorder || !support.capture) {
    await page.click('#anim-video-btn'); await page.waitForTimeout(600);
    ok('unsupported browsers are told to use frames',
       /frames instead|cannot record/i.test(await page.$eval('#anim-hint', e => e.textContent)),
       await page.$eval('#anim-hint', e => e.textContent));
  } else {
    // A long scene, so the in-progress state exists for long enough to
    // observe — a two-second export finishes faster than a fixed wait.
    await page.evaluate(() => {
      const el = document.getElementById('anim-time');
      el.max = '20';
    });
    await page.fill('#agent-prompt', 'two blue cubes spinning for 20 seconds');
    await page.click('#agent-go-btn'); await page.waitForTimeout(900);

    const dl = page.waitForEvent('download', { timeout: 120000 });
    await page.click('#anim-video-btn');

    // Poll rather than sample: catching a transient state at one fixed
    // instant is a race the test loses on a fast machine.
    let sawProgress = false, sawCancel = false;
    for (let i = 0; i < 60 && !(sawProgress && sawCancel); i++) {
      const hint = await page.$eval('#anim-hint', e => e.textContent);
      const btn = await page.$eval('#anim-video-btn', e => e.textContent);
      if (/Recording frame/i.test(hint)) sawProgress = true;
      if (btn.toLowerCase().includes('cancel')) sawCancel = true;
      await page.waitForTimeout(50);
    }
    ok('it shows progress while recording', sawProgress);
    ok('the button becomes a cancel', sawCancel);

    const download = await dl;
    const file = '/tmp/exported-animation';
    await download.saveAs(file);
    const fs = require('fs');
    const size = fs.statSync(file).size;
    ok('a video file is produced', size > 2000, `${size} bytes`);
    const name = download.suggestedFilename();
    ok('with a video extension', /\.(webm|mp4)$/.test(name), name);

    // Verify the container really is what it claims, by magic bytes.
    const head = fs.readFileSync(file).slice(0, 12);
    const isWebm = head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3;
    const isMp4 = head.slice(4, 8).toString() === 'ftyp';
    ok('the file is a genuine container, not an empty blob', isWebm || isMp4,
       head.toString('hex'));

    await page.waitForTimeout(600);
    ok('the button returns to normal',
       (await page.$eval('#anim-video-btn', e => e.textContent)).toLowerCase().includes('video'));
    ok('the hint clears', (await page.$eval('#anim-hint', e => e.textContent)) === '',
       await page.$eval('#anim-hint', e => e.textContent));
    ok('the preview still renders after export',
       await page.evaluate(() => {
         const src = !document.getElementById('anim-canvas-gl').hidden
           ? document.getElementById('anim-canvas-gl') : document.getElementById('anim-canvas');
         const c = document.createElement('canvas');
         c.width = src.width; c.height = src.height;
         const ctx = c.getContext('2d'); ctx.drawImage(src, 0, 0);
         const d = ctx.getImageData(0, 0, c.width, c.height).data;
         const bg = [d[0], d[1], d[2]];
         let n = 0;
         for (let i = 0; i < d.length; i += 4) {
           if (Math.abs(d[i]-bg[0]) + Math.abs(d[i+1]-bg[1]) + Math.abs(d[i+2]-bg[2]) > 24) n++;
         }
         return n > 200;
       }));
  }

  console.log('\nerrors:', errs.filter(e => !/supabase|fetch/i.test(e)).join(' | ') || '(none)');
  ok('no uncaught page errors', errs.filter(e => !/supabase|fetch/i.test(e)).length === 0,
     errs.join('; '));
  console.log(`${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
