// The transform gizmo, through the real page.
//
// The gizmo suite proves the maths; this proves the tool is wired to it —
// that the mode buttons and their keys switch it, that grabbing an arm
// constrains the drag to that axis, that a ring turns the object and the
// scale handle sizes it.
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

  const val = (id) => page.$eval(`#${id}`, (e) => parseFloat(e.value));
  const mode = () => page.$eval('.anim-tool.selected', (e) => e.dataset.mode);
  const stageBox = () => page.$eval('#anim-overlay', (e) => {
    const r = e.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height,
             cw: e.width, ch: e.height };
  });
  const toPage = async (cx, cy) => {
    const b = await stageBox();
    return { x: b.left + (cx / b.cw) * b.width, y: b.top + (cy / b.ch) * b.height };
  };
  /** Coloured pixels on the overlay, grouped by hue family. */
  const gizmoColours = () => page.evaluate(() => {
    const c = document.getElementById('anim-overlay');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    const seen = new Map();
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 40) continue;
      const key = `${d[i] >> 6},${d[i + 1] >> 6},${d[i + 2] >> 6}`;
      seen.set(key, (seen.get(key) || 0) + 1);
    }
    return [...seen.entries()].filter(([, n]) => n > 25).map(([k]) => k);
  });
  /**
   * Find a gizmo arm on the overlay by its colour, and return a point part
   * way along it — a place the pointer can grab.
   */
  const armPoint = (rgb, frac = 0.85, toward = null) => page.evaluate(([want, f, dir]) => {
    const c = document.getElementById('anim-overlay');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    const pts = [];
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 40) continue;
      if (Math.abs(d[i] - want[0]) > 60) continue;
      if (Math.abs(d[i + 1] - want[1]) > 60) continue;
      if (Math.abs(d[i + 2] - want[2]) > 60) continue;
      pts.push([(i / 4) % c.width, Math.floor((i / 4) / c.width)]);
    }
    if (pts.length < 4) return null;
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    let far = pts[0], best = -Infinity;
    for (const p of pts) {
      // With a direction given, the grabbable end is the extreme along it.
      // Without one, it is the point furthest from the ink's centroid —
      // fine for a thin arm, but wrong for a handle with a blob on one
      // end, where the centroid sits nearer that blob and the "furthest"
      // point comes out as the other end entirely.
      const score = dir
        ? p[0] * dir[0] + p[1] * dir[1]
        : (p[0] - cx) ** 2 + (p[1] - cy) ** 2;
      if (score > best) { best = score; far = p; }
    }
    return { x: cx + (far[0] - cx) * f, y: cy + (far[1] - cy) * f,
             tip: { x: far[0], y: far[1] }, count: pts.length };
  }, [rgb, frac, toward]);

  const drag = async (fromCanvas, dx, dy) => {
    const from = await toPage(fromCanvas.x, fromCanvas.y);
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + dx, from.y + dy, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(300);
  };

  console.log('--- the tool has three modes ---');
  await page.click('#anim-add-btn'); await page.waitForTimeout(300);
  await page.click('#anim-3d'); await page.waitForTimeout(500);
  ok('move is the default', await mode() === 'move', await mode());
  await page.click('#anim-tool-rotate'); await page.waitForTimeout(200);
  ok('the rotate button switches to it', await mode() === 'rotate', await mode());
  await page.keyboard.press('s'); await page.waitForTimeout(200);
  ok('S switches to scale', await mode() === 'scale', await mode());
  await page.keyboard.press('g'); await page.waitForTimeout(200);
  ok('G switches back to move', await mode() === 'move', await mode());
  ok('and the button follows the key',
     await page.$eval('#anim-tool-move', (e) => e.getAttribute('aria-pressed')) === 'true');

  console.log('--- move mode draws axis arms ---');
  {
    const colours = await gizmoColours();
    ok('more than one colour is on the overlay', colours.length >= 2, colours.join(' | '));
    const red = await armPoint([228, 72, 61]);
    const green = await armPoint([63, 191, 114]);
    ok('there is a red X arm', red && red.count > 40, JSON.stringify(red));
    ok('and a green Y arm', green && green.count > 40, JSON.stringify(green));
  }

  console.log('--- grabbing an arm constrains the drag to that axis ---');
  {
    const beforeX = await val('anim-x');
    const beforeY = await val('anim-y');
    const red = await armPoint([228, 72, 61]);
    // Drag diagonally: only the X channel may respond.
    await drag(red, 70, 55);
    const afterX = await val('anim-x');
    const afterY = await val('anim-y');
    ok('X changed', Math.abs(afterX - beforeX) > 3, `${beforeX} -> ${afterX}`);
    ok('Y did not, despite the diagonal drag', Math.abs(afterY - beforeY) < 0.6,
       `${beforeY} -> ${afterY}`);
  }

  console.log('--- and the other arm constrains to its own ---');
  {
    const beforeX = await val('anim-x');
    const beforeY = await val('anim-y');
    const green = await armPoint([63, 191, 114]);
    await drag(green, 60, 60);
    ok('Y changed', Math.abs(await val('anim-y') - beforeY) > 3,
       `${beforeY} -> ${await val('anim-y')}`);
    ok('X did not', Math.abs(await val('anim-x') - beforeX) < 0.6,
       `${beforeX} -> ${await val('anim-x')}`);
  }

  console.log('--- rotate mode turns the object ---');
  {
    await page.keyboard.press('r'); await page.waitForTimeout(300);
    const before = await val('anim-rotation');
    // The Z ring is the in-plane one, drawn in the same blue as the Z axis.
    const ring = await armPoint([63, 198, 255], 1);
    ok('a ring is drawn', ring && ring.count > 60, JSON.stringify(ring));
    await drag(ring, 40, 40);
    const after = await val('anim-rotation');
    ok('the rotation changed', Math.abs(after - before) > 2, `${before} -> ${after}`);
  }

  console.log('--- scale mode sizes it ---');
  {
    await page.keyboard.press('s'); await page.waitForTimeout(300);
    const before = await val('anim-scale');
    // The scale handle runs up and to the right from the object, and its
    // grabbable end is the far corner.
    const handle = await armPoint([245, 179, 1], 1, [1, -1]);
    ok('a scale handle is drawn', handle && handle.count > 20, JSON.stringify(handle));
    // Further out from the object grows it.
    await drag(handle.tip, 70, -70);
    const after = await val('anim-scale');
    ok('the object grew', after > before + 0.05, `${before} -> ${after}`);
    ok('and it never went negative', after > 0);
  }

  console.log('--- a gizmo drag is one undo step ---');
  {
    await page.keyboard.press('g'); await page.waitForTimeout(300);
    const before = await val('anim-x');
    const red = await armPoint([228, 72, 61]);
    await drag(red, 80, 0);
    const moved = await val('anim-x');
    ok('the drag moved it', Math.abs(moved - before) > 3, `${before} -> ${moved}`);
    await page.keyboard.press('Control+z');
    await page.waitForTimeout(400);
    ok('one undo puts it back', Math.abs(await val('anim-x') - before) < 1,
       `${before} -> ${await val('anim-x')}`);
  }

  console.log('--- the gizmo is an editor guide, not part of the picture ---');
  {
    // Nothing on the overlay reaches an export: exports capture the render
    // canvas. Confirm the render canvas has no gizmo colours in it.
    const onRender = await page.evaluate(() => {
      const vis = [...document.querySelectorAll('#anim-canvas, #anim-canvas-gl')]
        .find((e) => !e.hidden && e.offsetParent !== null);
      const c = document.createElement('canvas');
      c.width = vis.width; c.height = vis.height;
      const ctx = c.getContext('2d'); ctx.drawImage(vis, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let reds = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] > 190 && d[i + 1] < 110 && d[i + 2] < 100) reds++;
      }
      return reds;
    });
    ok('no gizmo red on the render canvas', onRender < 50, String(onRender));
  }

  ok('no script errors throughout', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
