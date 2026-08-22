// Selecting and moving objects by pointing at them.
//
// The picking suite proves the maths. This proves the viewport is wired to
// it: that clicking an object selects it, dragging it moves it, dragging
// the background still orbits, and none of it fights the panel.
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

  const selected = () => page.$$eval('#anim-shape-list .anim-shape-item',
    (els) => { const i = els.findIndex((e) => e.classList.contains('selected'));
               return { index: i, label: i === -1 ? null : els[i].textContent }; });
  const rowCount = () => page.$$eval('#anim-shape-list .anim-shape-item', (e) => e.length);
  const sliderX = () => page.$eval('#anim-x', (e) => parseFloat(e.value));
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

  // Where an object sits on screen, in page coordinates, so the mouse can
  // be pointed at it. The overlay is the topmost canvas and shares the
  // render canvas's box, so it gives the mapping.
  const stageBox = () => page.$eval('#anim-overlay', (e) => {
    const r = e.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height,
             cw: e.width, ch: e.height };
  });
  // Where the *selected* object is, in render-canvas pixels.
  //
  // A centroid of the whole render canvas averages every object together,
  // so with two shapes on screen it cannot say where either one is. The
  // overlay draws an outline around the selection and nothing else when a
  // shape has a single keyframe, so its painted centre is that object's
  // position — measured through a real feature rather than a back door.
  const centroid = () => page.evaluate(() => {
    const c = document.getElementById('anim-overlay');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let sx = 0, sy = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] <= 30) continue;
      // The overlay also carries the gizmo, whose arms radiate one way and
      // would drag the centroid off the object. The outline is the neutral
      // near-white one; the gizmo is red, green, blue and yellow.
      const near = d[i] > 200 && d[i + 1] > 200 && d[i + 2] > 200;
      if (!near) continue;
      sx += (i / 4) % c.width; sy += Math.floor((i / 4) / c.width); n++;
    }
    return n ? { x: sx / n, y: sy / n, n } : { x: 0, y: 0, n: 0 };
  });

  // Everything painted on the render canvas, for the checks that are about
  // the picture as a whole rather than one object.
  const allPainted = () => page.evaluate(() => {
    const vis = [...document.querySelectorAll('#anim-canvas, #anim-canvas-gl')]
      .find((e) => !e.hidden && e.offsetParent !== null) || document.getElementById('anim-canvas');
    const c = document.createElement('canvas');
    c.width = vis.width; c.height = vis.height;
    const ctx = c.getContext('2d'); ctx.drawImage(vis, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    const bg = [d[0], d[1], d[2]];
    let sx = 0, sy = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (Math.abs(d[i]-bg[0]) + Math.abs(d[i+1]-bg[1]) + Math.abs(d[i+2]-bg[2]) > 24) {
        sx += (i / 4) % c.width; sy += Math.floor((i / 4) / c.width); n++;
      }
    }
    return n ? { x: sx / n, y: sy / n, n } : { x: 0, y: 0, n: 0 };
  });
  /** Page coordinates for a point in render-canvas pixels. */
  const toPage = async (cx, cy) => {
    const b = await stageBox();
    return { x: b.left + (cx / b.cw) * b.width, y: b.top + (cy / b.ch) * b.height };
  };

  console.log('--- clicking an object selects it ---');
  await page.click('#anim-add-btn'); await page.waitForTimeout(300);
  await page.click('#anim-3d'); await page.waitForTimeout(500);
  await selectRow(0);
  await setSlider('anim-x', 30);
  await page.click('#anim-add-btn'); await page.waitForTimeout(300);
  await setSlider('anim-x', 72);
  ok('two objects in the scene', await rowCount() === 2, String(await rowCount()));
  ok('the second is selected after adding it', (await selected()).index === 1);

  {
    // Click where the first object is. Selecting it from the viewport must
    // move the panel's selection with it.
    await selectRow(0);
    const first = await centroid();
    await selectRow(1);
    const second = await centroid();
    ok('the two objects sit apart on screen', Math.abs(second.x - first.x) > 30,
       `${first.x.toFixed(0)} vs ${second.x.toFixed(0)}`);

    const p = await toPage(first.x, first.y);
    await page.mouse.click(p.x, p.y);
    await page.waitForTimeout(300);
    ok('clicking the left object selects it', (await selected()).index === 0,
       JSON.stringify(await selected()));
  }

  console.log('--- and dragging it moves it ---');
  {
    const before = await sliderX();
    const start = await centroid();
    const from = await toPage(start.x, start.y);
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + 120, from.y, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    const after = await sliderX();
    ok('the object moved right', after > before + 5, `${before} -> ${after}`);
    ok('the panel followed the drag', Math.abs(after - before) > 5);
    const moved = await centroid();
    ok('and it moved on screen too', moved.x > start.x + 20,
       `${start.x.toFixed(0)} -> ${moved.x.toFixed(0)}`);
  }

  console.log('--- the object lands where the pointer went ---');
  {
    // The whole point of the depth-aware drag maths: the thing you are
    // dragging stays under the cursor rather than lagging or overshooting.
    const start = await centroid();
    const from = await toPage(start.x, start.y);
    const b = await stageBox();
    const pagePixels = 90;
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x - pagePixels, from.y, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    const end = await centroid();
    const expected = start.x - pagePixels * (b.cw / b.width);
    ok('it tracks the pointer within a few pixels', Math.abs(end.x - expected) < 12,
       `${end.x.toFixed(0)}, expected ${expected.toFixed(0)}`);
  }

  console.log('--- a click is a select, not a nudge ---');
  {
    await selectRow(1);
    const before = await sliderX();
    const spot = await centroid();
    const p = await toPage(spot.x, spot.y);
    // A real click always carries a pixel or two of pointer travel.
    await page.mouse.move(p.x, p.y);
    await page.mouse.down();
    await page.mouse.move(p.x + 1, p.y + 1);
    await page.mouse.up();
    await page.waitForTimeout(300);
    ok('a one-pixel wobble does not move the object', await sliderX() === before,
       `${before} -> ${await sliderX()}`);
  }

  console.log('--- and the drag is one undo step ---');
  {
    // Before the camera moves: once the view has been orbited the two
    // objects can overlap, and a drag would then legitimately grab the
    // other one — leaving the check comparing two different objects'
    // positions rather than one object before and after.
    const who = (await selected()).index;
    const before = await sliderX();
    const spot = await centroid();
    const from = await toPage(spot.x, spot.y);
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + 90, from.y, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    ok('the drag stayed on the same object', (await selected()).index === who,
       `${who} -> ${(await selected()).index}`);
    const moved = await sliderX();
    // Report every channel on failure: a drag that grabbed a gizmo arm by
    // accident moves a different one, and "x did not change" alone does
    // not say which.
    const others = await page.evaluate(() => ({
      y: document.getElementById('anim-y').value,
      z: document.getElementById('anim-z').value,
      scale: document.getElementById('anim-scale').value,
      rot: document.getElementById('anim-rotation').value,
    }));
    ok('the drag moved it', Math.abs(moved - before) > 3,
       `${before} -> ${moved}; others ${JSON.stringify(others)}`);
    await page.keyboard.press('Control+z');
    await page.waitForTimeout(400);
    ok('one undo puts it back', Math.abs(await sliderX() - before) < 2,
       `${before} -> ${await sliderX()}`);
  }

  console.log('--- dragging the background still orbits ---');
  {
    const before = await allPainted();
    // A corner, far from either object.
    const b = await stageBox();
    const corner = await toPage(b.cw * 0.06, b.ch * 0.9);
    await page.mouse.move(corner.x, corner.y);
    await page.mouse.down();
    await page.mouse.move(corner.x + 150, corner.y, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(400);
    const after = await allPainted();
    ok('the camera moved', Math.abs(after.x - before.x) > 8,
       `${before.x.toFixed(0)} -> ${after.x.toFixed(0)}`);
    ok('and nothing was deselected by it', (await selected()).index !== -1);
  }

  console.log('--- alt-drag orbits even over an object ---');
  {
    const spot = await centroid();
    const p = await toPage(spot.x, spot.y);
    const before = await sliderX();
    await page.keyboard.down('Alt');
    await page.mouse.move(p.x, p.y);
    await page.mouse.down();
    await page.mouse.move(p.x + 100, p.y, { steps: 10 });
    await page.mouse.up();
    await page.keyboard.up('Alt');
    await page.waitForTimeout(400);
    ok('the object itself did not move', await sliderX() === before,
       `${before} -> ${await sliderX()}`);
  }

  console.log('--- the selection is visible ---');
  {
    const outline = await page.evaluate(() => {
      const c = document.getElementById('anim-overlay');
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 30) n++;
      return n;
    });
    ok('an outline is drawn on the overlay', outline > 50, String(outline));
  }


  ok('no script errors throughout', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
