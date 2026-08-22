(function () {
  if (window.__voiceDawCue) return;
  window.__voiceDawCue = true;

  var cueOn = false;
  var ctx = null;
  var bus = null;
  var voices = [];

  function ensure() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    bus = ctx.createGain();
    bus.gain.value = 0.7;
    bus.connect(ctx.destination);
    return ctx;
  }

  function stopCue() {
    var t = ctx ? ctx.currentTime : 0;
    voices.forEach(function (v) {
      try {
        if (v.g) {
          v.g.gain.cancelScheduledValues(t);
          v.g.gain.setValueAtTime(Math.max(0.0001, v.g.gain.value || 0.0001), t);
          v.g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
        }
        if (v.o && v.o.stop) v.o.stop(t + 0.05);
        if (v.s && v.s.stop) v.s.stop(t + 0.05);
      } catch (e) {}
    });
    voices = [];
  }

  function env(dest, t0, peak, a, d) {
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
    g.connect(dest);
    voices.push({ g: g });
    return g;
  }

  function osc(type, freq, dest, t0, dur) {
    var o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    o.connect(dest);
    o.start(t0);
    o.stop(t0 + dur);
    voices.push({ o: o });
  }

  function noise(dest, t0, dur, hz) {
    var len = Math.floor(ctx.sampleRate * dur);
    var buf = ctx.createBuffer(1, Math.max(64, len), ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var f = ctx.createBiquadFilter();
    f.type = hz > 3000 ? "highpass" : "bandpass";
    f.frequency.value = hz;
    src.connect(f);
    f.connect(dest);
    src.start(t0);
    src.stop(t0 + dur);
    voices.push({ s: src });
  }

  function kindOf(tr) {
    var g = document.querySelector("#daw-session .daw-grid");
    if (!g) return "midi";
    var labs = g.querySelectorAll(".daw-track");
    var name = ((labs[tr] && labs[tr].textContent) || "").toLowerCase();
    if (name.indexOf("drum") >= 0) return "drums";
    if (name.indexOf("bass") >= 0) return "bass";
    if (name.indexOf("key") >= 0) return "keys";
    if (name.indexOf("lead") >= 0) return "lead";
    if (name.indexOf("pad") >= 0) return "pad";
    if (name.indexOf("perc") >= 0) return "perc";
    if (name.indexOf("audio") >= 0) return "audio";
    return "midi";
  }

  function preview(tr) {
    if (!ensure()) return;
    ctx.resume();
    stopCue();
    var t0 = ctx.currentTime + 0.01;
    var kind = kindOf(tr);
    var dest = bus;
    if (kind === "drums") {
      osc("sine", 150, env(dest, t0, 0.9, 0.004, 0.22), t0, 0.24);
      noise(env(dest, t0 + 0.12, 0.35, 0.001, 0.08), t0 + 0.12, 0.09, 1800);
      noise(env(dest, t0 + 0.24, 0.18, 0.001, 0.05), t0 + 0.24, 0.06, 7000);
    } else if (kind === "bass") {
      var f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 420;
      f.connect(dest);
      osc("sawtooth", 55, env(f, t0, 0.4, 0.01, 0.28), t0, 0.32);
    } else if (kind === "keys" || kind === "midi") {
      [220, 261.6, 329.6].forEach(function (hz, i) {
        osc("triangle", hz, env(dest, t0, 0.14 / (i + 1), 0.02, 0.28), t0, 0.3);
      });
    } else if (kind === "lead") {
      osc("square", 440, env(dest, t0, 0.16, 0.008, 0.2), t0, 0.22);
      osc("square", 554, env(dest, t0 + 0.16, 0.14, 0.008, 0.18), t0 + 0.16, 0.2);
    } else if (kind === "pad") {
      [174, 220, 261].forEach(function (hz) {
        osc("sine", hz, env(dest, t0, 0.08, 0.08, 0.55), t0, 0.62);
      });
    } else if (kind === "perc") {
      noise(env(dest, t0, 0.22, 0.001, 0.07), t0, 0.08, 2400);
      noise(env(dest, t0 + 0.1, 0.16, 0.001, 0.05), t0 + 0.1, 0.06, 5000);
    } else {
      osc("sine", 110, env(dest, t0, 0.22, 0.01, 0.35), t0, 0.38);
    }
    flash(tr);
  }

  function flash(tr) {
    var cells = document.querySelectorAll('#daw-session [data-tr="' + tr + '"].daw-cell');
    cells.forEach(function (c) {
      c.classList.add("cue-hit");
      window.setTimeout(function () {
        c.classList.remove("cue-hit");
      }, 220);
    });
  }

  function injectCss() {
    if (document.getElementById("daw-cue-css")) return;
    var s = document.createElement("style");
    s.id = "daw-cue-css";
    s.textContent =
      "#daw-session .daw-btn[data-cue].on{background:#ffb238;color:#06170f;border-color:#ffb238}" +
      "#daw-session .daw-cell.cue-hit{outline:2px solid #ffb238;outline-offset:-1px}" +
      "#daw-session.cue-mode .daw-cell.filled{cursor:help}";
    document.head.appendChild(s);
  }

  function wireBtn(root) {
    var top = root.querySelector(".daw-top");
    if (!top || top.querySelector("[data-cue]")) return;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "daw-btn";
    b.setAttribute("data-cue", "1");
    b.setAttribute("aria-pressed", "false");
    b.setAttribute("aria-label", "Cue preview mode");
    b.textContent = "Cue";
    b.addEventListener("click", function () {
      cueOn = !cueOn;
      b.classList.toggle("on", cueOn);
      b.setAttribute("aria-pressed", cueOn ? "true" : "false");
      root.classList.toggle("cue-mode", cueOn);
      if (!cueOn) stopCue();
    });
    top.appendChild(b);
  }

  function isCueEvent(ev) {
    if (cueOn) return true;
    if (ev.ctrlKey || ev.metaKey) return true;
    if (ev.type === "contextmenu") return true;
    return false;
  }

  function onPointer(ev) {
    var btn = ev.target && ev.target.closest && ev.target.closest("#daw-session [data-tr][data-sc]");
    if (!btn) return;
    if (!btn.classList.contains("filled") && ev.type !== "contextmenu") return;
    if (!isCueEvent(ev)) return;
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    preview(Number(btn.dataset.tr));
  }

  function boot() {
    var root = document.getElementById("daw-session");
    if (!root) return;
    injectCss();
    wireBtn(root);
    if (!root._cueWired) {
      root._cueWired = true;
      root.addEventListener("click", onPointer, true);
      root.addEventListener("contextmenu", onPointer, true);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  var n = 0;
  var t = window.setInterval(function () {
    n += 1;
    boot();
    if (document.getElementById("daw-session") || n > 80) window.clearInterval(t);
  }, 250);
})();
