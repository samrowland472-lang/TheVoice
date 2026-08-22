// Flick's hands on The Voice.
//
// flick.js is the mouth. This module is the rest of the body: it opens
// Speak, Clone, Animate, Music, Library, Project — anything the
// sidebar can reach — and presses the same buttons a person would.

import { parseVoiceLines, parseNL, stripVoice, sectionFor, SECTIONS } from './flick-cmd.js';

const ALLOWED = new Set(SECTIONS);

function $(sel, root) {
  return (root || document).querySelector(sel);
}

function clickEl(node) {
  if (!node) return false;
  node.click();
  return true;
}

function click(sel) {
  return clickEl(typeof sel === 'string' ? $(sel) : sel);
}

function setVal(sel, value) {
  const n = $(sel);
  if (!n) return false;
  n.value = String(value);
  n.dispatchEvent(new Event('input', { bubbles: true }));
  n.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

function enterStudio() {
  const shell = document.getElementById('app-shell');
  if (shell && !shell.hidden) return true;
  return click('#gate-guest-btn');
}

function go(section) {
  const id = sectionFor(section) || String(section || '').toLowerCase();
  enterStudio();
  const btn = document.querySelector('.sidebar-item[data-section="' + id + '"]');
  if (btn) {
    btn.click();
    return { ok: true, op: 'go', section: id };
  }
  if (window.TheVoice && typeof window.TheVoice.go === 'function') {
    window.TheVoice.go(id);
    return { ok: true, op: 'go', section: id };
  }
  if (!ALLOWED.has(id)) return { ok: false, error: 'unknown section ' + section };
  return { ok: false, error: 'no section ' + id };
}

function currentSection() {
  const b = document.querySelector('.sidebar-item.active');
  return (b && b.dataset.section) || 'clone';
}

function speak(cmd) {
  go('speak');
  if (cmd.engine) click('.engine-btn[data-engine="' + cmd.engine + '"]');
  if (cmd.text) setVal('#text-input', String(cmd.text).slice(0, 20000));
  if (cmd.rate != null) setVal('#rate-range', cmd.rate);
  click('#play-btn');
  return { ok: true, op: 'speak' };
}

function exec(cmd) {
  if (!cmd || typeof cmd !== 'object') return { ok: false, error: 'empty' };
  const app = cmd.app || 'nav';
  const op = cmd.op;

  if (app === 'nav' || op === 'go') return go(cmd.section || cmd.id);

  if (app === 'speak') {
    if (op === 'stop') { go('speak'); click('#stop-btn'); return { ok: true, op: 'stop' }; }
    if (op === 'pause') { go('speak'); click('#pause-btn'); return { ok: true, op: 'pause' }; }
    if (op === 'engine') {
      go('speak');
      click('.engine-btn[data-engine="' + (cmd.id || cmd.engine) + '"]');
      return { ok: true, op: 'engine', id: cmd.id || cmd.engine };
    }
    return speak(cmd);
  }

  if (app === 'studio' || app === 'clone') {
    go('clone');
    if (op === 'record' || op === 'start') click('#record-btn');
    if (op === 'pause') click('#studio-pause-btn');
    return { ok: true, op: op || 'record' };
  }

  if (app === 'longform') {
    go('longform');
    if (cmd.text) setVal('#longform-input', cmd.text);
    if (op === 'split' || op === 'analyze') click('#longform-analyze-btn');
    if (op === 'generate') click('#longform-generate-btn');
    return { ok: true, op: op || 'setText' };
  }

  if (app === 'modulate' || app === 'shape') {
    go('shape');
    if (op === 'apply') click('#mod-apply-btn');
    return { ok: true, op: op || 'go' };
  }

  if (app === 'animate') {
    go('animate');
    if (op === 'create' || cmd.prompt || cmd.text) {
      setVal('#agent-prompt', cmd.prompt || cmd.text || '');
      click('#agent-go-btn');
    }
    if (op === 'play') click('#anim-play-btn');
    return { ok: true, op: op || 'create' };
  }

  if (app === 'music' || app === 'daw' || app === 'dj') {
    go(app === 'dj' ? 'dj' : 'music');
    const daw = window.TheVoiceDAW;
    const payload = cmd.daw || (op ? cmd : null);
    if (payload && daw && typeof daw.exec === 'function') return daw.exec(payload);
    return { ok: true, op: 'go', section: app === 'dj' ? 'dj' : 'music' };
  }

  if (app === 'library') {
    go('library');
    if (cmd.q || cmd.query) setVal('#library-search', cmd.q || cmd.query);
    return { ok: true, op: cmd.q || cmd.query ? 'search' : 'go' };
  }

  if (app === 'project') {
    go('project');
    if (op === 'build') click('#project-build-btn');
    return { ok: true, op: op || 'go' };
  }

  if (app === 'settings' || app === 'plans' || app === 'account') return go(app);

  return { ok: false, error: 'unknown app ' + app };
}

function applyText(text) {
  const src = String(text || '');
  const lines = parseVoiceLines(src);
  if (lines.length) return lines.map(exec);
  const local = parseNL(src);
  if (local.length) return local.map(exec);
  if (window.TheVoiceDAW && typeof window.TheVoiceDAW.applyText === 'function') {
    return window.TheVoiceDAW.applyText(src) || [];
  }
  return [];
}

const prev = window.TheVoiceFlick || {};
window.TheVoiceFlick = Object.assign(prev, {
  go,
  exec,
  applyText,
  strip: stripVoice,
  parse: parseNL,
  currentSection,
  enterStudio,
  sectionFor,
});
