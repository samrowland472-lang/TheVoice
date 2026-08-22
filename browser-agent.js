const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ colorScheme: 'dark' });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  let pass = 0, fail = 0;
  const ok = (n, c, x = '') => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n} ${x}`)); };

  await page.route('**/@supabase/supabase-js@2*', r => r.fulfill({ status: 200, contentType: 'application/javascript',
    body: 'export function createClient(){return{auth:{getSession:async()=>({data:{session:{access_token:"jwt",user:{id:"u1"}}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signOut:async()=>({}),refreshSession:async()=>({data:{session:null}})},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:null})})})})}}' }));
  await page.route('**/auth/v1/settings*', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"external":{}}' }));

  // Stand in for the edge function.
  let agentCalls = 0, lastBody = null;
  await page.route('**/functions/v1/scene-agent', async (route) => {
    agentCalls++;
    lastBody = JSON.parse(route.request().postData() || '{}');
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      scene: { duration: 6, fps: 30, background: '#101010', summary: 'A slow orbit of three amber dots.',
        shapes: [1,2,3].map(i => ({ type: 'circle', label: `Orb ${i}`, reactive: false, keyframes: [
          { time: 0, x: 20*i, y: 50, scale: 0.4, rotation: 0, opacity: 0, color: '#f5b301', ease: 'backOut' },
          { time: 6, x: 20*i, y: 30, scale: 1.2, rotation: 180, opacity: 1, color: '#f5b301' }] })) },
      usage: { input_tokens: 900, output_tokens: 700 } }) });
  });

  await page.goto('http://localhost:8952/speakscape-standalone.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1400);
  await page.evaluate(() => { document.getElementById('gate').hidden = true; document.getElementById('app-shell').hidden = false; });
  await page.click('[data-section="animate"]'); await page.waitForTimeout(400);

  const shapeCount = () => page.$$eval('.anim-shape-item', s => s.length);
  const status = () => page.$eval('#agent-status', e => e.textContent);
  // Count pixels that differ from the background. Alpha is useless here —
  // the background is drawn opaque, so every pixel reads 255 and the count
  // is always the full canvas.
  const painted = () => page.evaluate(() => {
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
    let n = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (Math.abs(d[i]-bg[0]) + Math.abs(d[i+1]-bg[1]) + Math.abs(d[i+2]-bg[2]) > 24) n++;
    }
    return n;
  });

  console.log('--- the box is there and suggests things ---');
  ok('prompt box exists', await page.$('#agent-prompt') !== null);
  ok('example chips are offered', await page.$$eval('.agent-example', e => e.length) >= 4);
  await page.click('.agent-example');
  ok('clicking a chip fills the box', (await page.$eval('#agent-prompt', e => e.value)).length > 5);

  console.log('--- local engine: free, instant, no network ---');
  await page.fill('#agent-prompt', 'three blue circles that fade in and pulse');
  await page.click('#agent-go-btn');
  await page.waitForTimeout(700);
  ok('three shapes appear', await shapeCount() === 3, String(await shapeCount()));
  ok('it says it built them locally', /on the spot/i.test(await status()), await status());
  ok('the model was NOT called', agentCalls === 0, String(agentCalls));
  const seek = async (t) => {
    await page.evaluate((tt) => {
      const el = document.getElementById('anim-time');
      el.value = String(tt); el.dispatchEvent(new Event('input', { bubbles: true }));
    }, t);
    await page.waitForTimeout(120);
  };
  await seek(2.5);
  ok('shapes are actually painted', await painted() > 200, String(await painted()));
  await seek(0);

  console.log('--- the motion is real, not just shapes on screen ---');
  const frameAt = async (t) => { await seek(t); return painted(); };
  const early = await frameAt(0.05);
  const mid = await frameAt(2.5);
  ok('a fade-in means almost nothing at the start', early < mid, `${early} vs ${mid}`);

  console.log('--- Enter submits ---');
  await page.fill('#agent-prompt', 'a red square spinning');
  await page.press('#agent-prompt', 'Enter');
  await page.waitForTimeout(700);
  ok('one shape now', await shapeCount() === 1, String(await shapeCount()));
  ok('still no model call', agentCalls === 0, String(agentCalls));

  console.log('--- anything the patterns cannot parse goes to the model ---');
  await page.fill('#agent-prompt', 'evoke the feeling of a rainy Tokyo street at midnight');
  await page.click('#agent-go-btn');
  await page.waitForTimeout(2000);
  ok('the model was called', agentCalls === 1, String(agentCalls));
  ok('the request carried the prompt', /Tokyo/.test(lastBody.prompt), JSON.stringify(lastBody).slice(0,120));
  ok('and the current scene, for follow-ups', lastBody.scene && lastBody.scene.shapes.length >= 1);
  ok('the returned scene is applied', await shapeCount() === 3, String(await shapeCount()));
  ok('the summary is shown', /orbit/i.test(await status()), await status());

  console.log('--- a hostile response cannot reach the renderer ---');
  await page.route('**/functions/v1/scene-agent', r => r.fulfill({ status: 200, contentType: 'application/json',
    body: JSON.stringify({ scene: { duration: 1e9, fps: 1e6, background: 'nope', shapes: [
      { type: 'circle', label: 'x', keyframes: [
        { time: -9, x: 1e9, y: 1e9, scale: 1e9, rotation: 1e9, opacity: 99, color: 'nope' },
        { time: 4, x: 50, y: 50, scale: 1, rotation: 0, opacity: 1, color: '#ffffff' }] }] } }) }));
  await page.fill('#agent-prompt', 'something abstract and unparseable by patterns');
  await page.click('#agent-go-btn');
  await page.waitForTimeout(1800);
  const clamped = await page.evaluate(() => {
    const el = document.getElementById('anim-time');
    return { max: parseFloat(el.max) };
  });
  ok('the duration is clamped, not a billion', clamped.max <= 60, String(clamped.max));
  ok('the page survives', errs.length === 0, errs.join('; '));
  await seek(2);
  ok('and still renders', await painted() > 0, String(await painted()));

  console.log('--- a failing agent explains itself ---');
  await page.route('**/functions/v1/scene-agent', r => r.fulfill({ status: 429, contentType: 'application/json',
    body: JSON.stringify({ error: 'That is a lot of scenes in one hour. Try again shortly.' }) }));
  await page.fill('#agent-prompt', 'another abstract unparseable request entirely');
  await page.click('#agent-go-btn');
  await page.waitForTimeout(1500);
  ok('the server message is surfaced', /lot of scenes/i.test(await status()), await status());
  ok('the button is usable again', await page.$eval('#agent-go-btn', e => !e.disabled));

  console.log('--- with no agent configured, local still works ---');
  await page.evaluate(() => { localStorage.removeItem('thevoice_supabase_config');
                              localStorage.removeItem('thevoice_agent_endpoint'); });
  await page.fill('#agent-prompt', 'four green triangles bouncing');
  await page.click('#agent-go-btn');
  await page.waitForTimeout(700);
  ok('the local engine still builds it', await shapeCount() === 4, String(await shapeCount()));

  console.log('\nerrors:', errs.join(' | ') || '(none)');
  ok('no uncaught page errors', errs.length === 0, errs.join('; '));
  console.log(`${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
