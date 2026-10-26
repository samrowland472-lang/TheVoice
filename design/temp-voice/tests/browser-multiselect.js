// Selecting and working on more than one object, through the real page.
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

  const rows = () => page.$$eval('#anim-shape-list .anim-shape-item', (els) =>
    els.map((e) => ({
      label: e.textContent,
      depth: e.dataset.depth,
      active: e.classList.contains('selected'),
      inSelection: e.getAttribute('aria-pressed') === 'true',
    })));
  const chosen = async () => (await rows()).filter((r) => r.inSelection).length;
  const active = async () => (await rows()).findIndex((r) => r.active);
  const clickRow = async (i, mods = []) => {
    await page.$$eval('#anim-shape-list .anim-shape-item',
      (els, [n, shift]) => {
        els[n].dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: shift }));
      }, [i, mods.includes('shift')]);
    await page.waitForTimeout(200);
  };
  const setSlider = async (id, v) => {
    await page.evaluate(([i, val]) => {
      const el = document.getElementById(i);
      el.value = String(val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, [id, v]);
    await page.waitForTimeout(200);
  };
  const xOf = async (row) => {
    await clickRow(row);
    return page.$eval('#anim-x', (e) => parseFloat(e.value));
  };

  console.log('--- shift-click builds a selection ---');
  for (let i = 0; i < 3; i++) { await page.click('#anim-add-btn'); await page.waitForTimeout(250); }
  ok('three objects', (await rows()).length === 3, String((await rows()).length));
  await clickRow(0);
  ok('a plain click selects one', await chosen() === 1, String(await chosen()));
  await clickRow(1, ['shift']);
  ok('shift-click adds a second', await chosen() === 2, String(await chosen()));
  await clickRow(2, ['shift']);
  ok('and a third', await chosen() === 3, String(await chosen()));
  ok('the last clicked is the active one', await active() === 2, String(await active()));
  await clickRow(2, ['shift']);
  ok('shift-clicking it again removes it', await chosen() === 2, String(await chosen()));
  ok('and the active role moves to a survivor', await active() !== 2 && await active() >= 0,
     String(await active()));
  await clickRow(0);
  ok('a plain click collapses back to one', await chosen() === 1, String(await chosen()));

  console.log('--- moving a selection moves all of it ---');
  {
    await clickRow(0);
    await setSlider('anim-x', 20);
    await clickRow(1);
    await setSlider('anim-x', 60);
    await clickRow(2);
    await setSlider('anim-x', 80);

    const before = [await xOf(0), await xOf(1), await xOf(2)];
    await clickRow(0);
    await clickRow(1, ['shift']);
    ok('two are selected', await chosen() === 2, String(await chosen()));

    // Drag the active object in the viewport; both must move together.
    const box = await page.$eval('#anim-overlay', (e) => {
      const r = e.getBoundingClientRect();
      return { left: r.left, top: r.top, w: r.width, h: r.height, cw: e.width, ch: e.height };
    });
    // The active object sits at x=60 of 100, vertically centred.
    const from = { x: box.left + box.w * 0.6, y: box.top + box.h * 0.5 };
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + 90, from.y, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(400);

    const after = [await xOf(0), await xOf(1), await xOf(2)];
    ok('the dragged one moved', Math.abs(after[1] - before[1]) > 3,
       `${before[1]} -> ${after[1]}`);
    ok('so did the other selected one', Math.abs(after[0] - before[0]) > 3,
       `${before[0]} -> ${after[0]}`);
    ok('by the same amount',
       Math.abs((after[0] - before[0]) - (after[1] - before[1])) < 0.6,
       `${(after[0] - before[0]).toFixed(2)} vs ${(after[1] - before[1]).toFixed(2)}`);
    ok('and the unselected one stayed put', Math.abs(after[2] - before[2]) < 0.6,
       `${before[2]} -> ${after[2]}`);
  }

  console.log('--- duplicating ---');
  {
    const before = (await rows()).length;
    await clickRow(0);
    await page.keyboard.press('Control+d');
    await page.waitForTimeout(400);
    const now = await rows();
    ok('one more object', now.length === before + 1, `${before} -> ${now.length}`);
    ok('the copy is selected', await chosen() === 1, String(await chosen()));
    ok('and its name is not identical to the original',
       new Set(now.map((r) => r.label)).size === now.length,
       now.map((r) => r.label).join(' | '));
    await page.keyboard.press('Control+z');
    await page.waitForTimeout(400);
    ok('undo removes the copy', (await rows()).length === before,
       String((await rows()).length));
  }

  console.log('--- duplicating a parent brings its children ---');
  {
    // Parent row 1 to row 0, then duplicate row 0.
    await clickRow(1);
    const parentId = await page.$eval('#anim-parent', (el) => el.options[1].value);
    await page.selectOption('#anim-parent', parentId);
    await page.waitForTimeout(300);
    const nested = (await rows()).some((r) => r.depth === '1');
    ok('the hierarchy is set up', nested, (await rows()).map((r) => r.depth).join());

    const before = (await rows()).length;
    // Select the parent — the row at depth 0 that has a child under it.
    const idx = (await rows()).findIndex((r, i, all) =>
      r.depth === '0' && all[i + 1] && all[i + 1].depth === '1');
    await clickRow(idx);
    await page.keyboard.press('Control+d');
    await page.waitForTimeout(400);
    const now = await rows();
    ok('two objects were copied, not one', now.length === before + 2,
       `${before} -> ${now.length}`);
    ok('and the copy is itself a hierarchy',
       now.filter((r) => r.depth === '1').length === 2,
       now.map((r) => r.depth).join());
  }

  console.log('--- deleting a selection deletes all of it ---');
  {
    const before = (await rows()).length;
    await clickRow(0);
    await clickRow(1, ['shift']);
    await page.click('#anim-delete-btn');
    await page.waitForTimeout(400);
    const now = (await rows()).length;
    ok('both went', now <= before - 2, `${before} -> ${now}`);
    ok('and something is still selected or the scene is empty',
       now === 0 || await chosen() >= 1, String(await chosen()));
  }

  ok('no script errors throughout', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
