#!/usr/bin/env node
// Foundations gate: modules, HTML, injectors, and rooms must agree.
// Run from repo root or tests/: `node tests/harmony-test.mjs`

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const JS = join(ROOT, 'js');

let pass = 0;
let fail = 0;
const ok = (n, c, x = '') => {
  c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n} ${x}`));
};

const exportRe =
  /export\s+(?:async\s+)?function\s+(\w+)|export\s+const\s+(\w+)|export\s+let\s+(\w+)|export\s+class\s+(\w+)|export\s+\{([^}]+)\}/g;

function exportsOf(src) {
  const out = new Set();
  let m;
  const re = new RegExp(exportRe.source, 'g');
  while ((m = re.exec(src))) {
    if (m[1] || m[2] || m[3] || m[4]) out.add(m[1] || m[2] || m[3] || m[4]);
    if (m[5]) {
      for (const p of m[5].split(',')) {
        const bit = p.trim();
        if (!bit) continue;
        const as = bit.split(/\s+as\s+/);
        out.add((as[1] || as[0]).trim());
      }
    }
  }
  return out;
}

console.log('--- named imports ---');
const files = readdirSync(JS).filter((f) => f.endsWith('.js'));
ok('js/ is not empty', files.length > 10, String(files.length));
const importRe = /import\s+\{([^}]+)\}\s+from\s+['"](\.[^'"]+)['"]/g;
let missing = [];
let checked = 0;
for (const f of files) {
  const src = readFileSync(join(JS, f), 'utf8');
  let m;
  const re = new RegExp(importRe.source, 'g');
  while ((m = re.exec(src))) {
    const spec = m[2];
    const names = m[1]
      .split(',')
      .map((s) => s.trim().split(/\s+as\s+/)[0].trim())
      .filter(Boolean);
    const dest = join(JS, spec);
    if (!existsSync(dest)) {
      missing.push(`${f} -> missing ${spec}`);
      continue;
    }
    const ex = exportsOf(readFileSync(dest, 'utf8'));
    for (const n of names) {
      checked++;
      if (!ex.has(n)) missing.push(`${f} imports ${n} from ${spec}`);
    }
  }
}
ok(`all ${checked} named imports resolve`, missing.length === 0, missing.slice(0, 8).join('; '));

console.log('--- html assets ---');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const refs = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map((m) => m[1]);
const local = refs.filter((r) => !/^(https?:)?\/\//.test(r) && !r.startsWith('data:') && !r.startsWith('#'));
const missingAssets = [];
for (const r of local) {
  const path = r.replace(/^\//, '').split('?')[0];
  if (!path || path.endsWith('/')) continue;
  if (!existsSync(join(ROOT, path))) missingAssets.push(path);
}
ok('every local src/href exists', missingAssets.length === 0, missingAssets.join(', '));
ok('boot + app + ui-shell load', html.includes('js/boot.js') && html.includes('js/app.js') && html.includes('ui-shell.js'));
ok('no inline module (CSP)', !/<script(?![^>]*src=)[^>]*>\s*\S/.test(html));

console.log('--- rooms ---');
for (const section of ['clone', 'dub', 'shape', 'speak', 'talk', 'signal', 'animate', 'music', 'dj', 'project', 'library']) {
  ok(`sidebar ${section}`, html.includes(`data-section="${section}"`));
}
for (const avenue of ['music', 'animation', 'design', 'voice', 'flick']) {
  ok(`hub ${avenue}`, html.includes(`data-enter-avenue="${avenue}"`));
}
const shell = readFileSync(join(ROOT, 'ui-shell.js'), 'utf8');
ok('ui-shell knows five avenues', ['music', 'animation', 'design', 'voice', 'flick'].every((a) => shell.includes(`${a}:`)));

console.log('--- bus ---');
const bus = readFileSync(join(JS, 'bus.js'), 'utf8');
const app = readFileSync(join(JS, 'app.js'), 'utf8');
const daw = readFileSync(join(JS, 'daw-studio.js'), 'utf8');
ok('bus exports emit/on', bus.includes('export function emitVoice') && bus.includes('export function onVoice'));
ok('Speak emits clips', app.includes("emitVoice('clip'"));
ok('DAW listens on the bus', daw.includes("onVoice('clip'") && daw.includes("from './bus.js'"));
ok('Flick drives the studio', existsSync(join(JS, 'flick-studio.js')) && existsSync(join(JS, 'flick-cmd.js')));

console.log('--- inject / phantom scripts ---');
const inject = readFileSync(join(ROOT, 'netlify/edge-functions/flick-inject.js'), 'utf8');
const injected = [...inject.matchAll(/["']js\/([\w.-]+\.js)["']/g)].map((m) => m[1]);
ok('inject lists at least flick + daw-ai', injected.includes('flick.js') && injected.includes('daw-ai.js'));
const phantoms = injected.filter((f) => !existsSync(join(JS, f)));
ok('inject never names a missing file', phantoms.length === 0, phantoms.join(', '));
const banned = ['daw-session.js', 'daw-live.js', 'site-chrome.js', 'site-ops.js', 'site-studio.js'];
ok('legacy loop leftovers stay out', banned.every((f) => !inject.includes(f) && !html.includes(f)));

console.log('--- firewall ---');
const toml = readFileSync(join(ROOT, 'netlify.toml'), 'utf8');
ok('missing /js 404s', toml.includes('from = "/js/*"') && toml.includes('status = 404'));
ok('CSP present', toml.includes('Content-Security-Policy'));
ok('frame-ancestors allows Grok', toml.includes('grok.com') && !toml.includes("frame-ancestors 'none'"));
ok('no X-Frame-Options DENY on pages', !toml.includes('X-Frame-Options'));
ok('nested studios 404', toml.includes('/aether/*') && toml.includes('/animate/*') && toml.includes('/design/*'));
const shield = readFileSync(join(ROOT, 'netlify/edge-functions/shield.js'), 'utf8');
ok('API shield rate-limits', shield.includes('MAX_HITS') && shield.includes('MAX_BODY'));
ok('API shield allows Grok origins', shield.includes('grok.com'));

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
