// Design-only chrome: avenue hub, guest enter, theme switching.
// Does not modify engines. Drives the existing sidebar via clicks.

const AVENUES = {
  music: { section: 'music', group: 'music' },
  animation: { section: 'animate', group: 'animation' },
  design: { section: 'animate', group: 'design', threeD: true },
  voice: { section: 'clone', group: 'voice' },
  flick: { section: 'project', group: 'flick' },
};

let guestHeld = false;

function params() {
  return new URLSearchParams(window.location.search);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForBoot() {
  for (let i = 0; i < 200; i++) {
    if (window.__voiceBooted) break;
    await sleep(25);
  }
}

function enterAsGuest() {
  guestHeld = true;
  try { sessionStorage.setItem('voice-guest', '1'); } catch { /* ignore */ }
  const gate = document.getElementById('gate');
  const shell = document.getElementById('app-shell');
  if (gate) gate.hidden = true;
  if (shell) shell.hidden = false;
}

function showHub(show) {
  const hub = document.getElementById('avenue-hub');
  if (!hub) return;
  hub.hidden = !show;
  document.body.classList.toggle('hub-open', show);
}

function setAvenue(name, { persist = true } = {}) {
  const spec = AVENUES[name];
  if (!spec) return;
  document.documentElement.dataset.avenue = name;
  document.body.dataset.avenue = name;
  showHub(false);

  const btn = document.querySelector(`.sidebar-item[data-group="${spec.group}"][data-section="${spec.section}"]`)
    || document.querySelector(`.sidebar-item[data-section="${spec.section}"]`);
  if (btn) btn.click();

  if (spec.threeD) {
    const box = document.getElementById('anim-3d');
    if (box && !box.checked) box.click();
  }

  document.querySelectorAll('.sidebar-item[data-section="animate"]').forEach((b) => {
    const on = spec.section === 'animate' && (
      name === 'design' ? b.dataset.group === 'design' : b.dataset.group === 'animation'
    );
    b.classList.toggle('active', on);
  });

  document.querySelectorAll('.avenue-pill').forEach((p) => {
    p.classList.toggle('active', p.dataset.enterAvenue === name);
  });

  if (persist) {
    try { sessionStorage.setItem('creative-avenue', name); } catch { /* ignore */ }
    const url = new URL(window.location.href);
    url.searchParams.set('avenue', name);
    url.searchParams.set('guest', '1');
    url.searchParams.delete('hub');
    history.replaceState({}, '', url);
  }
}

function bindChrome() {
  document.querySelectorAll('[data-enter-avenue]').forEach((el) => {
    el.addEventListener('click', () => {
      enterAsGuest();
      setAvenue(el.dataset.enterAvenue);
    });
  });

  const home = document.getElementById('avenue-home');
  if (home) {
    home.addEventListener('click', () => {
      showHub(true);
      document.querySelectorAll('.avenue-pill').forEach((p) => p.classList.remove('active'));
    });
  }

  const brand = document.querySelector('.sidebar-brand');
  if (brand) {
    brand.addEventListener('click', () => showHub(true));
    brand.style.cursor = 'pointer';
  }

  const guest = document.getElementById('gate-guest-btn');
  if (guest) {
    guest.addEventListener('click', () => {
      enterAsGuest();
      showHub(true);
    });
  }

  const gate = document.getElementById('gate');
  if (gate) {
    new MutationObserver(() => {
      if (guestHeld && gate && !gate.hidden) enterAsGuest();
    }).observe(gate, { attributes: true, attributeFilter: ['hidden'] });
  }
}

async function waitForShell(forceGuest) {
  for (let i = 0; i < 50; i++) {
    const gate = document.getElementById('gate');
    const shell = document.getElementById('app-shell');
    if (forceGuest && gate && !gate.hidden) enterAsGuest();
    if (shell && !shell.hidden) {
      await sleep(150);
      if (forceGuest && gate && !gate.hidden) enterAsGuest();
      return 'shell';
    }
    if (!forceGuest && gate && !gate.hidden && i >= 10) return 'gate';
    await sleep(50);
  }
  const shell = document.getElementById('app-shell');
  return shell && !shell.hidden ? 'shell' : 'gate';
}

async function start() {
  bindChrome();
  await waitForBoot();
  const q = params();
  const forceGuest = q.has('guest') || q.has('avenue') || q.has('hub');
  const wanted = q.get('avenue') || (!q.has('hub') && (() => {
    try { return sessionStorage.getItem('creative-avenue'); } catch { return null; }
  })());

  if (forceGuest) enterAsGuest();

  const phase = await waitForShell(forceGuest);
  if (phase !== 'shell') {
    showHub(false);
    return;
  }

  if (q.has('hub')) showHub(true);
  else if (wanted && AVENUES[wanted]) {
    setAvenue(wanted, { persist: true });
    await sleep(200);
    if (document.documentElement.dataset.avenue !== wanted) {
      setAvenue(wanted, { persist: false });
    }
  } else {
    showHub(true);
  }
}

start().catch((err) => console.warn('ui-shell', err));
