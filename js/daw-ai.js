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
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }
  function goMusic() {
    var btn = document.querySelector('.sidebar-item[data-section="music"]');
    if (btn) btn.click();
  }
  function trackStrip(name) {
    var id = String(name || "").toLowerCase();
    var strips = $all("#daw-session .daw-strip[data-mix-id]");
    for (var i = 0; i < strips.length; i++) {
      var s = strips[i];
      var tid = (s.getAttribute("data-mix-id") || "").toLowerCase();
      var lab = ((s.querySelector(".daw-strip-name") || {}).textContent || "").toLowerCase();
      if (tid === id || lab === id || lab.indexOf(id) !== -1 || tid.indexOf(id) !== -1) return s;
    }
    return null;
  }
  function stripAct(name, act) {
    var s = trackStrip(name);
    if (!s) return { ok: false, error: "no track " + name };
    var b = s.querySelector('[data-act="' + act + '"]');
    if (!clickEl(b)) return { ok: false, error: "no " + act };
    return { ok: true, op: act, track: name };
  }
  function stripFader(name, ariaPart, value) {
    var s = trackStrip(name);
    if (!s) return { ok: false, error: "no track " + name };
    var inp = s.querySelector('input[aria-label*="' + ariaPart + '"]') || s.querySelector(".daw-fader");
    if (!setRange(inp, value)) return { ok: false, error: "no fader" };
    return { ok: true, track: name, value: Number(value) };
  }

  var api = {
    play: function () {
      goMusic();
      return { ok: clickEl($("#daw-session [data-play]")), op: "play" };
    },
    stop: function () {
      goMusic();
      return { ok: clickEl($("#daw-session .daw-btn.stop")), op: "stop" };
    },
    record: function () {
      goMusic();
      return { ok: clickEl($("#daw-session [data-record]")), op: "record" };
    },
    metro: function () {
      goMusic();
      return { ok: clickEl($("#daw-session [data-metro]")), op: "metro" };
    },
    tap: function () {
      goMusic();
      var b = $all("#daw-session .daw-btn").filter(function (x) {
        return /tap/i.test(x.getAttribute("aria-label") || x.textContent || "");
      })[0];
      return { ok: clickEl(b), op: "tap" };
    },
    setBpm: function (n) {
      goMusic();
      var bpm = Math.min(240, Math.max(40, Number(n) || 120));
      var inp = $("#daw-session .daw-ctl input[type=number]");
      if (!inp) return { ok: false, error: "no bpm" };
      setRange(inp, bpm);
      return { ok: true, op: "setBpm", bpm: bpm };
    },
    xfade: function (v) {
      goMusic();
      var x = Math.max(0, Math.min(1, Number(v)));
      return { ok: setRange($("#daw-session .daw-xfade"), x), op: "xfade", value: x };
    },
    mute: function (track) {
      goMusic();
      return stripAct(track, "mute");
    },
    solo: function (track) {
      goMusic();
      return stripAct(track, "solo");
    },
    arm: function (track) {
      goMusic();
      return stripAct(track, "arm");
    },
    volume: function (track, value) {
      goMusic();
      return stripFader(track, "volume", value);
    },
    pan: function (track, value) {
      goMusic();
      return stripFader(track, "Pan", value);
    },
    sendDelay: function (track, value) {
      goMusic();
      return stripFader(track, "Delay", value);
    },
    sendHall: function (track, value) {
      goMusic();
      return stripFader(track, "Hall", value);
    },
    launchScene: function (scene) {
      goMusic();
      var i = Number(scene) || 0;
      var scenes = $all("#daw-session .daw-scene, #daw-session [data-scene]");
      var b = scenes[i];
      return { ok: clickEl(b), op: "launchScene", scene: i };
    },
    launchClip: function (track, scene) {
      goMusic();
      var s = trackStrip(track);
      var cells = $all("#daw-session .daw-cell.filled");
      var hit = null;
      if (s) {
        var id = s.getAttribute("data-mix-id");
        hit = cells.filter(function (c) {
          return (c.getAttribute("data-track") || "") === id;
        })[Number(scene) || 0];
      }
      if (!hit) hit = cells[0];
      return { ok: clickEl(hit), op: "launchClip" };
    },
    view: function (id) {
      goMusic();
      var b = $('#daw-session [data-view="' + id + '"]');
      return { ok: clickEl(b), op: "view", id: id };
    },
    list: function () {
      var tracks = $all("#daw-session .daw-strip[data-mix-id]").map(function (s) {
        return {
          id: s.getAttribute("data-mix-id"),
          name: (s.querySelector(".daw-strip-name") || {}).textContent || "",
        };
      });
      var bpm = $("#daw-session .daw-ctl input[type=number]");
      return { ok: true, op: "list", bpm: bpm ? Number(bpm.value) : null, tracks: tracks };
    },
  };

  function exec(cmd) {
    if (!cmd) return { ok: false, error: "empty" };
    if (typeof cmd === "string") {
      try {
        cmd = JSON.parse(cmd);
      } catch (e) {
        return parseNL(cmd);
      }
    }
    var op = cmd.op || cmd.action;
    if (!op) return { ok: false, error: "no op" };
    if (op === "setBpm" || op === "bpm") return api.setBpm(cmd.bpm || cmd.value);
    if (op === "xfade" || op === "crossfader") return api.xfade(cmd.value);
    if (op === "volume") return api.volume(cmd.track, cmd.value);
    if (op === "pan") return api.pan(cmd.track, cmd.value);
    if (op === "sendDelay" || op === "delay") return api.sendDelay(cmd.track, cmd.value);
    if (op === "sendHall" || op === "hall" || op === "reverb") return api.sendHall(cmd.track, cmd.value);
    if (op === "launchScene" || op === "scene") return api.launchScene(cmd.scene == null ? cmd.value : cmd.scene);
    if (op === "launchClip" || op === "clip") return api.launchClip(cmd.track, cmd.scene);
    if (op === "view") return api.view(cmd.id || cmd.value);
    if (typeof api[op] === "function") {
      if (op === "mute" || op === "solo" || op === "arm") return api[op](cmd.track);
      return api[op]();
    }
    return { ok: false, error: "unknown op " + op };
  }

  function parseNL(text) {
    var t = String(text || "").trim();
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
    var view = low.match(/\b(session|arrange|arrangement|roll|piano|rack|devices?|warp)\s*view\b/) || low.match(/\bshow (session|arrange|roll|rack|devices?|warp)\b/);
    if (view) {
      var id = view[1];
      if (id === "arrangement" || id === "arrange") id = "arrange";
      if (id === "piano") id = "roll";
      if (id.indexOf("device") === 0) id = "dev";
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
    return { ok: false, error: "unparsed" };
  }

  function applyText(text) {
    var results = [];
    var re = /DAW:\s*(\{[^\n]+\})/g;
    var m;
    var src = String(text || "");
    while ((m = re.exec(src))) {
      try {
        results.push(exec(JSON.parse(m[1])));
      } catch (e) {
        results.push({ ok: false, error: "bad json" });
      }
    }
    if (!results.length) {
      var local = parseNL(text);
      if (local && local.ok) results.push(local);
    }
    return results;
  }

  function stripDaw(text) {
    return String(text || "").replace(/DAW:\s*\{[^\n]+\}\s*/g, "").trim();
  }

  function injectBar() {
    var root = document.getElementById("daw-session");
    if (!root || document.getElementById("daw-cmd")) return;
    var bar = document.createElement("form");
    bar.id = "daw-cmd";
    bar.setAttribute("role", "search");
    bar.innerHTML =
      '<label class="daw-cmd-lab" for="daw-cmd-input">Ask</label>' +
      '<input id="daw-cmd-input" type="search" autocomplete="off" spellcheck="false" placeholder="Ask the set — play, 128 bpm, mute drums, scene 1">' +
      '<button type="submit" class="daw-btn">Do</button>' +
      '<span id="daw-cmd-status" role="status"></span>';
    var top = root.querySelector(".daw-top");
    if (top) top.appendChild(bar);
    else root.insertBefore(bar, root.firstChild);
    bar.addEventListener("submit", function (e) {
      e.preventDefault();
      var inp = document.getElementById("daw-cmd-input");
      var st = document.getElementById("daw-cmd-status");
      var res = exec(inp.value);
      if (st) st.textContent = res.ok ? res.op || "ok" : res.error || "no";
      if (res.ok) inp.value = "";
    });
  }

  function injectCss() {
    if (document.getElementById("daw-ai-css")) return;
    var s = document.createElement("style");
    s.id = "daw-ai-css";
    s.textContent =
      "#daw-cmd{display:flex;align-items:center;gap:6px;flex:1 1 280px;min-width:220px;margin-left:8px}" +
      "#daw-cmd-input{flex:1;min-height:32px;background:#050706;border:1px solid #24332c;color:#d9f5e3;font-family:Share Tech Mono,ui-monospace,monospace;font-size:11px;padding:4px 8px;border-radius:2px}" +
      "#daw-cmd-input:focus{outline:2px solid var(--phosphor,#3fc6ff);outline-offset:1px}" +
      ".daw-cmd-lab{font-family:Share Tech Mono,ui-monospace,monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#4c5f56}" +
      "#daw-cmd-status{font-family:Share Tech Mono,ui-monospace,monospace;font-size:10px;color:var(--phosphor,#3fc6ff);min-width:48px}";
    document.head.appendChild(s);
  }

  window.TheVoiceDAW = { exec: exec, parse: parseNL, applyText: applyText, strip: stripDaw, api: api };

  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      var music = document.getElementById("music-view");
      if (music && music.hidden) return;
      var inp = document.getElementById("daw-cmd-input");
      if (!inp) return;
      e.preventDefault();
      inp.focus();
    }
  });

  function boot() {
    injectCss();
    injectBar();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  var n = 0;
  var t = window.setInterval(function () {
    n += 1;
    boot();
    if (n > 60) window.clearInterval(t);
  }, 300);
})();
