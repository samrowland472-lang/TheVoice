(function () {
  if (window.__voiceDawAi) return;
  window.__voiceDawAi = true;

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }
  function clickEl(node) {
    if (!node) return false;
    node.click();
    return true;
  }
  function setRange(node, value) {
    if (!node) return false;
    node.value = String(value);
    node.dispatchEvent(new Event('input', { bubbles: true }));
    node.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  function goMusic() {
    var btn = document.querySelector('.sidebar-item[data-section="music"]');
    if (btn) btn.click();
  }
  function host() {
    return window.TheVoiceDAW || {};
  }
  function stripOf(name) {
    var id = String(name || '').toLowerCase().trim();
    var aliases = { drums: 'kick', drum: 'kick', hat: 'hihat', hats: 'hihat', key: 'keys', synth: 'keys' };
    if (aliases[id]) id = aliases[id];
    var strips = $all('#abl-mixer .abl-strip[data-strip]');
    for (var i = 0; i < strips.length; i++) {
      var s = strips[i];
      var tid = (s.getAttribute('data-strip') || '').toLowerCase();
      var lab = ((s.querySelector('span') || {}).textContent || '').toLowerCase();
      if (tid === id || lab === id || lab.indexOf(id) !== -1 || tid.indexOf(id) !== -1) return s;
    }
    return null;
  }

  var api = {
    play: function () {
      goMusic();
      if (typeof host().play === 'function' && host().play !== api.play) {
        host().play();
        return { ok: true, op: 'play' };
      }
      return { ok: clickEl($('#abl-play')), op: 'play' };
    },
    stop: function () {
      goMusic();
      if (typeof host().stop === 'function' && host().stop !== api.stop) {
        host().stop();
        return { ok: true, op: 'stop' };
      }
      var play = $('#abl-play');
      if (play && play.classList.contains('playing')) return { ok: clickEl(play), op: 'stop' };
      return { ok: clickEl($('#abl-stop-clips')), op: 'stop' };
    },
    record: function () {
      goMusic();
      return { ok: clickEl($('#abl-rec')), op: 'record' };
    },
    metro: function () {
      goMusic();
      return { ok: clickEl($('#abl-metro')), op: 'metro' };
    },
    tap: function () {
      goMusic();
      return { ok: clickEl($('#abl-tap')), op: 'tap' };
    },
    setBpm: function (n) {
      goMusic();
      var bpm = Math.min(240, Math.max(40, Number(n) || 120));
      if (typeof host().setBpm === 'function' && host().setBpm !== api.setBpm) {
        host().setBpm(bpm);
        return { ok: true, op: 'setBpm', bpm: bpm };
      }
      return { ok: setRange($('#abl-bpm'), bpm), op: 'setBpm', bpm: bpm };
    },
    xfade: function (v) {
      goMusic();
      var x = Math.max(0, Math.min(1, Number(v)));
      if (typeof host().xfade === 'function' && host().xfade !== api.xfade) {
        host().xfade(x);
        return { ok: true, op: 'xfade', value: x };
      }
      return { ok: setRange($('#daw-xfade, .daw-xfade, [data-xfade]'), x), op: 'xfade', value: x };
    },
    mute: function (track) {
      goMusic();
      var s = stripOf(track);
      if (!s) return { ok: false, error: 'no track ' + track };
      return { ok: clickEl(s.querySelector('[data-mute]')), op: 'mute', track: track };
    },
    solo: function (track) {
      goMusic();
      var s = stripOf(track);
      if (!s) return { ok: false, error: 'no track ' + track };
      return { ok: clickEl(s.querySelector('[data-solo]')), op: 'solo', track: track };
    },
    arm: function (track) {
      return { ok: true, op: 'arm', track: track };
    },
    volume: function (track, value) {
      goMusic();
      var s = stripOf(track);
      if (!s) return { ok: false, error: 'no track ' + track };
      return { ok: setRange(s.querySelector('[data-vol]'), value), op: 'volume', track: track, value: Number(value) };
    },
    pan: function (track, value) {
      goMusic();
      var s = stripOf(track);
      if (!s) return { ok: false, error: 'no track ' + track };
      return { ok: setRange(s.querySelector('[data-pan]'), value), op: 'pan', track: track, value: Number(value) };
    },
    sendDelay: function (track, value) {
      return { ok: true, op: 'sendDelay', track: track, value: Number(value) };
    },
    sendHall: function (track, value) {
      return { ok: true, op: 'sendHall', track: track, value: Number(value) };
    },
    launchScene: function (scene) {
      goMusic();
      var i = Number(scene) || 0;
      if (typeof host().launchScene === 'function' && host().launchScene !== api.launchScene) {
        host().launchScene(i);
        return { ok: true, op: 'launchScene', scene: i };
      }
      var b = $('#daw-session .abl-clip[data-scene="' + i + '"]') || $all('#daw-session .abl-clip')[i];
      return { ok: clickEl(b), op: 'launchScene', scene: i };
    },
    launchClip: function (track, scene) {
      return api.launchScene(scene);
    },
    view: function (id) {
      goMusic();
      var name = String(id || 'session');
      if (name === 'arrangement') name = 'arrange';
      if (name === 'piano' || name === 'roll') name = 'arrange';
      if (name === 'dj' || name === 'live') {
        var dj = $('[data-daw-mode="dj"]');
        return { ok: clickEl(dj), op: 'view', id: 'dj' };
      }
      var btn = $('[data-prod-view="' + name + '"]');
      if (typeof host().view === 'function' && host().view !== api.view && !btn) host().view(name);
      return { ok: clickEl(btn) || true, op: 'view', id: name };
    },
    list: function () {
      var tracks = $all('#abl-mixer .abl-strip[data-strip]').map(function (s) {
        return {
          id: s.getAttribute('data-strip'),
          name: (s.querySelector('span') || {}).textContent || '',
        };
      });
      var bpm = $('#abl-bpm');
      return { ok: true, op: 'list', bpm: bpm ? Number(bpm.value) : null, tracks: tracks };
    },
  };

  function exec(cmd) {
    if (!cmd) return { ok: false, error: 'empty' };
    if (typeof cmd === 'string') {
      try { cmd = JSON.parse(cmd); } catch (e) { return parseNL(cmd); }
    }
    var op = cmd.op || cmd.action;
    if (!op) return { ok: false, error: 'no op' };
    if (op === 'setBpm' || op === 'bpm') return api.setBpm(cmd.bpm || cmd.value);
    if (op === 'xfade' || op === 'crossfader') return api.xfade(cmd.value);
    if (op === 'volume') return api.volume(cmd.track, cmd.value);
    if (op === 'pan') return api.pan(cmd.track, cmd.value);
    if (op === 'sendDelay' || op === 'delay') return api.sendDelay(cmd.track, cmd.value);
    if (op === 'sendHall' || op === 'hall' || op === 'reverb') return api.sendHall(cmd.track, cmd.value);
    if (op === 'launchScene' || op === 'scene') return api.launchScene(cmd.scene == null ? cmd.value : cmd.scene);
    if (op === 'launchClip' || op === 'clip') return api.launchClip(cmd.track, cmd.scene);
    if (op === 'view') return api.view(cmd.id || cmd.value);
    if (typeof api[op] === 'function') {
      if (op === 'mute' || op === 'solo' || op === 'arm') return api[op](cmd.track);
      return api[op]();
    }
    return { ok: false, error: 'unknown op ' + op };
  }

  function parseNL(text) {
    var t = String(text || '').trim();
    if (!t) return { ok: false };
    var low = t.toLowerCase();
    if (/^stop\b|\bstop (the )?(playback|transport|set)\b/.test(low)) return api.stop();
    if (/\b(play|start playback|start the set)\b/.test(low) && !/playlist/.test(low)) return api.play();
    if (/\brecord\b/.test(low)) return api.record();
    if (/\bmetro(nome)?\b/.test(low)) return api.metro();
    var bpm = low.match(/\b(?:bpm|tempo)\s*(?:to\s*)?(\d{2,3})\b/) || low.match(/\b(\d{2,3})\s*bpm\b/);
    if (bpm) return api.setBpm(bpm[1]);
    var xf = low.match(/\b(?:crossfader|xfade|x-fade)\s*(?:to\s*)?(0?\.\d+|1(?:\.0+)?|0)\b/);
    if (xf) return api.xfade(xf[1]);
    var scene = low.match(/\b(?:launch\s*)?scene\s*(\d+)\b/);
    if (scene) return api.launchScene(Math.max(0, Number(scene[1]) - 1));
    var view = low.match(/\b(session|arrange|arrangement|roll|piano|rack|devices?|dj|live)\s*view\b/)
      || low.match(/\bshow (session|arrange|roll|rack|dj|live)\b/);
    if (view) {
      var id = view[1];
      if (id === 'arrangement' || id === 'arrange') id = 'arrange';
      if (id === 'piano') id = 'roll';
      if (id === 'live') id = 'dj';
      return api.view(id);
    }
    var mix = low.match(/\b(mute|solo|arm)\s+([a-z0-9 ]{1,24})\b/);
    if (mix) return api[mix[1]](mix[2].trim());
    var vol = low.match(/\b(?:volume|level|gain)\s+(?:of\s+)?([a-z0-9 ]{1,18}?)\s*(?:to\s*)?(\d(?:\.\d+)?|0?\.\d+)\b/);
    if (vol) {
      var v = Number(vol[2]);
      if (v > 1.2) v = v / 100;
      return api.volume(vol[1].trim(), v);
    }
    return { ok: false, error: 'unparsed' };
  }

  function applyText(text) {
    var results = [];
    var re = /DAW:\s*(\{[^\n]+\})/g;
    var m;
    var src = String(text || '');
    while ((m = re.exec(src))) {
      try { results.push(exec(JSON.parse(m[1]))); }
      catch (e) { results.push({ ok: false, error: 'bad json' }); }
    }
    if (!results.length) {
      var local = parseNL(text);
      if (local && local.ok) results.push(local);
    }
    return results;
  }

  function stripDaw(text) {
    return String(text || '').replace(/DAW:\s*\{[^\n]+\}\s*/g, '').trim();
  }

  function injectBar() {
    var root = document.getElementById('abl-transport');
    if (!root || document.getElementById('daw-cmd')) return;
    var bar = document.createElement('form');
    bar.id = 'daw-cmd';
    bar.setAttribute('role', 'search');
    bar.innerHTML =
      '<label class="daw-cmd-lab" for="daw-cmd-input">Ask</label>' +
      '<input id="daw-cmd-input" type="search" autocomplete="off" spellcheck="false" placeholder="play · 128 bpm · mute kick · scene 1 · arrange">' +
      '<button type="submit" class="abl-bounce">Do</button>' +
      '<span id="daw-cmd-status" role="status"></span>';
    root.appendChild(bar);
    bar.addEventListener('submit', function (e) {
      e.preventDefault();
      var inp = document.getElementById('daw-cmd-input');
      var st = document.getElementById('daw-cmd-status');
      var res = exec(inp.value);
      if (st) st.textContent = res.ok ? res.op || 'ok' : res.error || 'no';
      if (res.ok) inp.value = '';
    });
  }

  function injectCss() {
    if (document.getElementById('daw-ai-css')) return;
    var s = document.createElement('style');
    s.id = 'daw-ai-css';
    s.textContent =
      '#daw-cmd{display:flex;align-items:center;gap:8px;flex:1 1 280px;min-width:200px}' +
      '#daw-cmd-input{flex:1;min-height:36px;background:#050706;border:1px solid #24332c;color:#d9f5e3;font-family:"Share Tech Mono",ui-monospace,monospace;font-size:12px;padding:6px 10px;border-radius:8px}' +
      '#daw-cmd-input:focus{outline:2px solid var(--phosphor,#3fc6ff);outline-offset:1px}' +
      '.daw-cmd-lab{font-family:"Share Tech Mono",ui-monospace,monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#4c5f56}' +
      '#daw-cmd-status{font-family:"Share Tech Mono",ui-monospace,monospace;font-size:10px;color:var(--phosphor,#3fc6ff);min-width:48px}';
    document.head.appendChild(s);
  }

  var prev = window.TheVoiceDAW || {};
  window.TheVoiceDAW = Object.assign(prev, {
    exec: exec,
    parse: parseNL,
    applyText: applyText,
    strip: stripDaw,
    api: api,
  });

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      var music = document.getElementById('music-view');
      if (music && music.hidden) return;
      var inp = document.getElementById('daw-cmd-input');
      if (!inp) return;
      e.preventDefault();
      inp.focus();
    }
  });

  function boot() {
    injectCss();
    injectBar();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  var n = 0;
  var t = window.setInterval(function () {
    n += 1;
    boot();
    if (n > 60) window.clearInterval(t);
  }, 300);
})();
