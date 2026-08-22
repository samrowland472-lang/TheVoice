// The file the user actually deploys.
//
// Everything else in this directory tests the build tree. This tests the
// zip — the single artefact that gets dragged onto Netlify — by unpacking
// it, serving it over HTTP the way a host would, and driving the agent
// through it. The failure it exists to catch is a stale drop: a zip that
// lags the source by a fortnight looks fine on disk and reports itself
// only as "it's now not working".
//
// It serves itself on an ephemeral port, so it needs no running server.
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ZIP = path.join(ROOT, 'NETLIFY-DROP-THIS-FOLDER.zip');

const TYPES = { '.html': 'text/html', '.js': 'application/javascript',
                '.css': 'text/css', '.json': 'application/json' };

(async () => {
  let pass = 0, fail = 0;
  const ok = (n, c, x = '') => { c ? (pass++, console.log(`  PASS  ${n}`))
                                   : (fail++, console.log(`  FAIL  ${n} ${x}`)); };

  if (!fs.existsSync(ZIP)) {
    console.log('  FAIL  the drop zip exists (run `python3 build.py`)');
    console.log('\n0 passed, 1 failed');
    process.exit(1);
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'drop-'));
  execFileSync('unzip', ['-q', ZIP, '-d', tmp]);
  const site = path.join(tmp, 'the-voice-site');

  // The zip must carry the build that is on disk right now, not an older
  // one. This is the check that would have caught the stale drop.
  const shipped = fs.readFileSync(path.join(site, 'index.html'));
  const built = path.join(ROOT, 'build', 'speakscape-standalone.html');
  ok('the zip carries the current build',
     fs.existsSync(built) && shipped.equals(fs.readFileSync(built)),
     fs.existsSync(built) ? `${shipped.length} vs ${fs.statSync(built).size} bytes`
                          : 'no build/ — run python3 build.py');
  for (const f of ['index.html', 'netlify.toml', '_headers', '_redirects']) {
    ok(`it ships ${f}`, fs.existsSync(path.join(site, f)));
  }

  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]);
    const file = path.join(site, rel === '/' ? 'index.html' : rel);
    // The host rewrites unknown paths to index.html; mirror that so a
    // missing asset shows up as a script error rather than a silent 404.
    const target = fs.existsSync(file) && fs.statSync(file).isFile()
      ? file : path.join(site, 'index.html');
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(target)] || 'text/plain' });
    fs.createReadStream(target).pipe(res);
  });
  await new Promise((r) => server.listen(0, r));
  const base = `http://localhost:${server.address().port}`;

  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ colorScheme: 'dark', viewport: { width: 1280, height: 1400 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));

  await page.goto(`${base}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  ok('the page loads with no script errors', errs.length === 0, errs.slice(0, 3).join(' | '));

  await page.evaluate(() => {
    document.getElementById('gate').hidden = true;
    document.getElementById('app-shell').hidden = false;
  });
  await page.click('[data-section="animate"]');
  await page.waitForTimeout(500);

  // Read whichever canvas is on screen: turning on 3D swaps the 2D canvas
  // for the WebGL one and hides the loser, which keeps its last frame.
  const painted = () => page.evaluate(() => {
    const vis = [...document.querySelectorAll('#anim-canvas, #anim-canvas-gl')]
      .find((e) => !e.hidden && e.offsetParent !== null)
      || document.getElementById('anim-canvas');
    const c = document.createElement('canvas');
    c.width = vis.width; c.height = vis.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(vis, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    const bg = [d[0], d[1], d[2]];
    let n = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (Math.abs(d[i]-bg[0]) + Math.abs(d[i+1]-bg[1]) + Math.abs(d[i+2]-bg[2]) > 24) n++;
    }
    return n;
  });
  const seek = async (t) => {
    await page.evaluate((tt) => {
      const el = document.getElementById('anim-time');
      el.value = String(tt);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, t);
    await page.waitForTimeout(200);
  };

  for (const phrase of [
    'a sphere smashing into a cube',
    'a cylinder obliterating a cube',
    'a cube blowing up',
    'five circles fading in',
    'a title saying "THE VOICE" that zooms in',
  ]) {
    await page.fill('#agent-prompt', phrase);
    await page.click('#agent-go-btn');
    await page.waitForTimeout(900);
    await seek(0.2); const early = await painted();
    await seek(3.0); const late = await painted();
    ok(`"${phrase}" paints something`, early > 20 || late > 20, `${early} / ${late}`);
    ok(`"${phrase}" moves rather than sitting still`, Math.abs(late - early) > 5,
       `${early} -> ${late}`);
  }
  ok('still no script errors after all that', errs.length === 0, errs.slice(0, 3).join(' | '));

  await browser.close();
  server.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
