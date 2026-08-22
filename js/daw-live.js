(function () {
  if (window.__voiceDawLive) return;
  window.__voiceDawLive = true;

  function injectCss() {
    if (document.getElementById("daw-live-css")) return;
    var s = document.createElement("style");
    s.id = "daw-live-css";
    s.textContent =
      "#daw-session.show-browser{grid-template-columns:minmax(168px,200px) 1fr}" +
      "#daw-session:not(.show-browser){grid-template-columns:1fr}" +
      "#daw-session:not(.show-browser) .daw-browser{display:none}" +
      "#daw-session:not(.show-mix) .daw-mixer{display:none}" +
      "#daw-session .daw-session-panel{min-height:0;overflow:hidden;display:flex;flex-direction:column;height:100%}" +
      "#daw-session .daw-grid-wrap{flex:1;overflow:auto;padding:6px 8px 12px}" +
      "#daw-session .daw-grid{gap:3px;min-width:0}" +
      "#daw-session .daw-cell{min-height:62px;border-radius:1px}" +
      "#daw-session .daw-scene{min-height:62px;border-radius:1px}" +
      "#daw-session .daw-stop-clip{min-height:36px;color:var(--alert,#ff4d4d)}" +
      "#daw-session .daw-hint{display:none}" +
      "#daw-session .daw-track{text-align:center;padding:8px 4px;border-bottom:1px solid #1c2a24}" +
      "body.is-music-daw #app-shell{height:100vh;overflow:hidden}" +
      "body.is-music-daw .main-area{height:100vh;max-width:none;padding:0;overflow:hidden}" +
      "body.is-music-daw #main-content,#music-view.is-daw,#daw-session{height:100%;min-height:0}";
    document.head.appendChild(s);
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function layoutGrid(grid) {
    var cells = Array.prototype.slice.call(grid.querySelectorAll("[data-tr][data-sc]"));
    if (!cells.length) return;
    var nTracks = 0;
    var nScenes = 0;
    cells.forEach(function (c) {
      nTracks = Math.max(nTracks, Number(c.dataset.tr) + 1);
      nScenes = Math.max(nScenes, Number(c.dataset.sc) + 1);
    });
    var sig = nTracks + "x" + nScenes + ":" + cells.length;
    if (grid._laying || grid.dataset.liveCols === sig) return;
    grid._laying = true;

    var by = {};
    cells.forEach(function (c) {
      by[c.dataset.tr + ":" + c.dataset.sc] = c;
    });
    var labels = Array.prototype.slice.call(grid.querySelectorAll(".daw-track"));
    var scenes = Array.prototype.slice.call(grid.querySelectorAll(".daw-scene"));
    var stops = Array.prototype.slice.call(grid.querySelectorAll(".daw-cell")).filter(function (n) {
      return !n.dataset.tr && n.textContent.indexOf("\u25a0") !== -1;
    });
    stops.forEach(function (n) {
      n.classList.add("daw-stop-clip");
    });

    grid.style.gridTemplateColumns = "repeat(" + nTracks + ", minmax(92px, 1fr)) 52px";
    var frag = document.createDocumentFragment();
    for (var t = 0; t < nTracks; t++) {
      frag.appendChild(labels[t] || el("div", "daw-track", "Track"));
    }
    frag.appendChild(el("div", "daw-head", "Go"));
    for (var sc = 0; sc < nScenes; sc++) {
      for (var tr = 0; tr < nTracks; tr++) {
        var cell = by[tr + ":" + sc];
        if (cell) frag.appendChild(cell);
      }
      frag.appendChild(scenes[sc] || el("button", "daw-scene", "\u25b6"));
    }
    for (var s = 0; s < nTracks; s++) {
      frag.appendChild(stops[s] || el("div", "", ""));
    }
    frag.appendChild(el("div", "", ""));
    grid.replaceChildren();
    grid.appendChild(frag);
    grid.dataset.liveCols = sig;
    grid._laying = false;
  }

  function wireToggles(root) {
    if (root.dataset.liveChrome) return;
    root.dataset.liveChrome = "1";
    root.classList.add("show-browser");
    var top = root.querySelector(".daw-top");
    if (!top) return;
    if (!top.querySelector("[data-browse]")) {
      var browse = el("button", "daw-btn on", "Browse");
      browse.type = "button";
      browse.setAttribute("data-browse", "1");
      browse.setAttribute("aria-label", "Toggle browser");
      browse.addEventListener("click", function () {
        root.classList.toggle("show-browser");
        browse.classList.toggle("on", root.classList.contains("show-browser"));
      });
      top.appendChild(browse);
    }
    if (!top.querySelector("[data-mix]")) {
      var mix = el("button", "daw-btn", "Mix");
      mix.type = "button";
      mix.setAttribute("data-mix", "1");
      mix.setAttribute("aria-label", "Toggle mixer");
      mix.addEventListener("click", function () {
        root.classList.toggle("show-mix");
        mix.classList.toggle("on", root.classList.contains("show-mix"));
      });
      top.appendChild(mix);
    }
  }

  function watch(root) {
    var grid = root.querySelector(".daw-grid");
    if (grid) layoutGrid(grid);
    wireToggles(root);
    if (root._liveObs) return;
    root._liveObs = new MutationObserver(function () {
      var g = root.querySelector(".daw-grid");
      if (g) layoutGrid(g);
    });
    root._liveObs.observe(root, { childList: true, subtree: true });
  }

  function boot() {
    injectCss();
    var root = document.getElementById("daw-session");
    if (root) watch(root);
  }

  document.addEventListener(
    "keydown",
    function (e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      var btn = e.target;
      if (!btn || btn.dataset.tr == null || btn.dataset.sc == null) return;
      var grid = btn.closest(".daw-grid");
      if (!grid) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      var tr = Number(btn.dataset.tr);
      var sc = Number(btn.dataset.sc);
      if (e.key === "ArrowLeft") tr -= 1;
      if (e.key === "ArrowRight") tr += 1;
      if (e.key === "ArrowUp") sc -= 1;
      if (e.key === "ArrowDown") sc += 1;
      var next = grid.querySelector('[data-tr="' + tr + '"][data-sc="' + sc + '"]');
      if (next) next.focus();
    },
    true,
  );

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
  var tries = 0;
  var t = window.setInterval(function () {
    tries += 1;
    boot();
    if (document.getElementById("daw-session") || tries > 80) window.clearInterval(t);
  }, 250);
})();
