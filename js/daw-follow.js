(function () {
  if (window.__voiceDawFollow) return;
  window.__voiceDawFollow = true;

  var ACTIONS = [
    ["off", "Off"],
    ["next", "Next"],
    ["prev", "Prev"],
    ["first", "First"],
    ["last", "Last"],
    ["any", "Any"],
    ["other", "Other"],
    ["stop", "Stop"],
  ];
  var map = {};
  var selected = null;
  var playKey = "";
  var barsLeft = {};
  var lastBar = -1;
  var firing = false;
  var ui = null;

  function load() {
    try {
      map = JSON.parse(localStorage.getItem("voice-daw-follow") || "{}") || {};
    } catch (e) {
      map = {};
    }
  }
  function save() {
    try {
      localStorage.setItem("voice-daw-follow", JSON.stringify(map));
    } catch (e) {}
  }
  function k(tr, sc) {
    return tr + ":" + sc;
  }
  function cfgOf(tr, sc) {
    return map[k(tr, sc)] || { action: "off", chance: 1, times: 1 };
  }

  function injectCss() {
    if (document.getElementById("daw-follow-css")) return;
    var s = document.createElement("style");
    s.id = "daw-follow-css";
    s.textContent =
      "#daw-session .daw-follow{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:6px 8px;border-bottom:1px solid #1c2a24;grid-column:1/-1;font-family:Share Tech Mono,ui-monospace,monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#7d9689}" +
      "#daw-session .daw-follow .daw-btn{min-height:32px;min-width:40px;padding:4px 8px;font-size:10px}" +
      "#daw-session .daw-cell[data-follow]:not([data-follow=off])::after{content:attr(data-follow);position:absolute;left:6px;bottom:4px;font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:#06170f;opacity:.8}" +
      "#daw-session .daw-cell.follow-sel{outline:1px dashed var(--phosphor,#3fc6ff);outline-offset:-1px}";
    document.head.appendChild(s);
  }

  function grid() {
    return document.querySelector("#daw-session .daw-grid");
  }

  function filledScenes(tr) {
    var g = grid();
    if (!g) return [];
    var out = [];
    g.querySelectorAll('[data-tr="' + tr + '"][data-sc]').forEach(function (b) {
      if (b.classList.contains("filled")) out.push(Number(b.dataset.sc));
    });
    out.sort(function (a, b) {
      return a - b;
    });
    return out;
  }

  function pick(tr, sc, action) {
    var filled = filledScenes(tr);
    if (action === "stop") return { stop: true };
    if (!action || action === "off" || !filled.length) return null;
    var i = filled.indexOf(sc);
    if (action === "next") return { sc: filled[(i < 0 ? 0 : i + 1) % filled.length] };
    if (action === "prev") return { sc: filled[(i < 0 ? filled.length - 1 : i - 1 + filled.length) % filled.length] };
    if (action === "first") return { sc: filled[0] };
    if (action === "last") return { sc: filled[filled.length - 1] };
    if (action === "any") return { sc: filled[Math.floor(Math.random() * filled.length)] };
    if (action === "other") {
      var others = filled.filter(function (x) {
        return x !== sc;
      });
      if (!others.length) return null;
      return { sc: others[Math.floor(Math.random() * others.length)] };
    }
    return null;
  }

  function clickClip(tr, sc, stop) {
    var g = grid();
    if (!g) return;
    firing = true;
    try {
      if (stop) {
        var stops = g.querySelectorAll(".daw-stop-clip");
        if (stops[tr]) stops[tr].click();
        return;
      }
      var btn = g.querySelector('[data-tr="' + tr + '"][data-sc="' + sc + '"]');
      if (btn) btn.click();
    } finally {
      window.setTimeout(function () {
        firing = false;
      }, 0);
    }
  }

  function markCells() {
    var g = grid();
    if (!g) return;
    g.querySelectorAll("[data-tr][data-sc]").forEach(function (b) {
      var c = cfgOf(b.dataset.tr, b.dataset.sc);
      if (c.action && c.action !== "off") b.setAttribute("data-follow", c.action);
      else b.removeAttribute("data-follow");
      var on = selected && Number(b.dataset.tr) === selected.tr && Number(b.dataset.sc) === selected.sc;
      b.classList.toggle("follow-sel", !!on);
    });
  }

  function paintUi() {
    if (!ui) return;
    var c = selected ? cfgOf(selected.tr, selected.sc) : { action: "off", chance: 1, times: 1 };
    ui.querySelectorAll("[data-fa]").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-fa") === c.action);
    });
    var ch = ui.querySelector("[data-fa-chance]");
    var tm = ui.querySelector("[data-fa-times]");
    var lab = ui.querySelector("[data-fa-lab]");
    if (ch) ch.value = String(Math.round((c.chance == null ? 1 : c.chance) * 100));
    if (tm) tm.value = String(c.times || 1);
    if (lab) {
      lab.textContent = selected
        ? "T" + (selected.tr + 1) + " S" + (selected.sc + 1)
        : "Clip";
    }
    markCells();
  }

  function setAction(action) {
    if (!selected) return;
    var c = cfgOf(selected.tr, selected.sc);
    c.action = action;
    map[k(selected.tr, selected.sc)] = c;
    save();
    paintUi();
  }

  function buildUi(root) {
    if (root.querySelector(".daw-follow")) return;
    ui = document.createElement("div");
    ui.className = "daw-follow";
    ui.setAttribute("aria-label", "Clip follow actions");
    var lab = document.createElement("span");
    lab.setAttribute("data-fa-lab", "1");
    lab.textContent = "Follow";
    ui.appendChild(lab);
    ACTIONS.forEach(function (pair) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "daw-btn";
      b.setAttribute("data-fa", pair[0]);
      b.setAttribute("aria-label", "Follow " + pair[1]);
      b.textContent = pair[1];
      b.addEventListener("click", function () {
        setAction(pair[0]);
      });
      ui.appendChild(b);
    });
    var chance = document.createElement("label");
    chance.className = "daw-ctl";
    chance.appendChild(document.createTextNode("Chance"));
    var cr = document.createElement("input");
    cr.type = "range";
    cr.min = "0";
    cr.max = "100";
    cr.step = "5";
    cr.value = "100";
    cr.setAttribute("data-fa-chance", "1");
    cr.setAttribute("aria-label", "Follow chance");
    cr.addEventListener("input", function () {
      if (!selected) return;
      var c = cfgOf(selected.tr, selected.sc);
      c.chance = Number(cr.value) / 100;
      map[k(selected.tr, selected.sc)] = c;
      save();
    });
    chance.appendChild(cr);
    ui.appendChild(chance);
    var times = document.createElement("label");
    times.className = "daw-ctl";
    times.appendChild(document.createTextNode("Bars"));
    var tn = document.createElement("input");
    tn.type = "number";
    tn.min = "1";
    tn.max = "16";
    tn.value = "1";
    tn.setAttribute("data-fa-times", "1");
    tn.setAttribute("aria-label", "Follow after bars");
    tn.addEventListener("change", function () {
      if (!selected) return;
      var c = cfgOf(selected.tr, selected.sc);
      c.times = Math.max(1, Math.min(16, Number(tn.value) || 1));
      map[k(selected.tr, selected.sc)] = c;
      save();
    });
    times.appendChild(tn);
    ui.appendChild(times);
    var top = root.querySelector(".daw-top");
    if (top && top.nextSibling) root.insertBefore(ui, top.nextSibling);
    else root.appendChild(ui);
    paintUi();
  }

  function onClipClick(ev) {
    if (firing) return;
    var btn = ev.target && ev.target.closest && ev.target.closest("[data-tr][data-sc]");
    if (!btn) return;
    selected = { tr: Number(btn.dataset.tr), sc: Number(btn.dataset.sc) };
    paintUi();
  }

  function parseBar() {
    var pos = document.querySelector("#daw-session .daw-pos");
    if (!pos) return -1;
    var t = pos.textContent || "";
    if (t.indexOf("CNT") === 0) return -1;
    var n = parseInt(t.split(".")[0], 10);
    return isNaN(n) ? -1 : n;
  }

  function watchPlay() {
    var cells = Array.prototype.slice.call(
      document.querySelectorAll("#daw-session .daw-cell.playing[data-tr][data-sc]"),
    );
    var sig = cells
      .map(function (c) {
        return c.dataset.tr + ":" + c.dataset.sc;
      })
      .join(",");
    var bar = parseBar();
    if (sig !== playKey) {
      playKey = sig;
      barsLeft = {};
      cells.forEach(function (c) {
        var cfg = cfgOf(c.dataset.tr, c.dataset.sc);
        barsLeft[k(c.dataset.tr, c.dataset.sc)] = cfg.times || 1;
      });
      lastBar = bar;
      markCells();
      return;
    }
    if (bar < 0 || lastBar < 0 || bar === lastBar) {
      if (bar >= 0) lastBar = lastBar < 0 ? bar : lastBar;
      return;
    }
    lastBar = bar;
    cells.forEach(function (c) {
      var tr = Number(c.dataset.tr);
      var sc = Number(c.dataset.sc);
      var id = k(tr, sc);
      var cfg = cfgOf(tr, sc);
      if (!cfg.action || cfg.action === "off") return;
      barsLeft[id] = (barsLeft[id] || cfg.times || 1) - 1;
      if (barsLeft[id] > 0) return;
      barsLeft[id] = cfg.times || 1;
      if (Math.random() > (cfg.chance == null ? 1 : cfg.chance)) return;
      var tgt = pick(tr, sc, cfg.action);
      if (!tgt) return;
      if (tgt.stop) {
        clickClip(tr, sc, true);
        return;
      }
      if (tgt.sc === sc) return;
      clickClip(tr, tgt.sc, false);
    });
  }

  function boot() {
    var root = document.getElementById("daw-session");
    if (!root) return;
    injectCss();
    buildUi(root);
    if (!root._followWired) {
      root._followWired = true;
      root.addEventListener("click", onClipClick, true);
    }
    markCells();
  }

  load();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  window.setInterval(function () {
    boot();
    watchPlay();
  }, 200);
})();
