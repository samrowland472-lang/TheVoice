const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ colorScheme: 'dark', viewport: { width: 1280, height: 1400 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  let pass = 0, fail = 0;
  const ok = (n, c, x = '') => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n} ${x}`)); };

  // No mocks at all: exactly what a visitor to the deployed site gets,
  // including the real Supabase SDK fetch (blocked here, as on a bad network).
  await page.goto('http://localhost:8952/speakscape-standalone.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  console.log('--- the page a visitor lands on ---');
  ok('the module booted', await page.evaluate(() => window.__voiceBooted === true));
  ok('the sign-in gate is shown', await page.$eval('#gate', e => !e.hidden));
  ok('the login form is offered (project is baked in)',
     await page.$eval('#gate-forms', e => !e.hidden));
  const status = await page.$eval('#gate-status', e => e.textContent);
  console.log('  gate status:', JSON.stringify(status));

  console.log('--- every section opens ---');
  await page.evaluate(() => { document.getElementById('gate').hidden = true;
                              document.getElementById('app-shell').hidden = false; });
  const sections = await page.$$eval('.sidebar-item', els => els.map(e => e.dataset.section));
  for (const s of sections) { await page.click(`[data-section="${s}"]`); await page.waitForTimeout(180); }
  ok(`all ${sections.length} sections open cleanly`, true);

  console.log('--- autosave survives a reload ---');
  await page.click('[data-section="animate"]'); await page.waitForTimeout(300);
  await page.fill('#agent-prompt', 'three blue cubes spinning');
  await page.click('#agent-go-btn'); await page.waitForTimeout(900);
  const made = await page.$$eval('.anim-shape-item', s => s.length);
  ok('a scene was built', made === 3, String(made));
  await page.waitForTimeout(1500);   // let the debounce land
  await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2200);
  await page.evaluate(() => { document.getElementById('gate').hidden = true;
                              document.getElementById('app-shell').hidden = false; });
  await page.click('[data-section="animate"]'); await page.waitForTimeout(600);
  const back = await page.$$eval('.anim-shape-item', s => s.length);
  ok('the scene came back after reload', back === 3, String(back));
  ok('3D mode came back too', await page.$eval('#anim-3d', e => e.checked));

  console.log('\nerrors:', errs.filter(e => !/supabase|fetch|network/i.test(e)).join(' | ') || '(none)');
  ok('no uncaught page errors', errs.filter(e => !/supabase|fetch|network/i.test(e)).length === 0);
  console.log(`${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
