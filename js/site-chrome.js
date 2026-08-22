(function () {
  if (window.__voiceSiteChrome) return;
  window.__voiceSiteChrome = true;

  function injectCss() {
    if (document.getElementById("site-chrome-css")) return;
    var s = document.createElement("style");
    s.id = "site-chrome-css";
    s.textContent =
      ".skip-link{position:absolute;left:12px;top:-48px;z-index:10000;padding:10px 14px;background:var(--phosphor,#3fc6ff);color:var(--phosphor-ink,#06170f);font-family:Share Tech Mono,ui-monospace,monospace;font-size:12px;letter-spacing:.06em;text-decoration:none;border-radius:2px}" +
      ".skip-link:focus{top:12px;outline:2px solid #fff;outline-offset:2px}" +
      ".sidebar-item:focus-visible,.btn:focus-visible,.mode-btn:focus-visible,select:focus-visible,input:focus-visible,textarea:focus-visible,button:focus-visible{outline:2px solid var(--phosphor,#3fc6ff);outline-offset:2px}" +
      ".sidebar-nav .sidebar-item{min-height:44px}" +
      "body.voice-chrome .sidebar{border-right:1px solid #1c2a24;position:sticky;top:0;align-self:start;max-height:100vh;overflow:auto}" +
      "body.voice-chrome .sidebar-item[aria-current=page]{box-shadow:inset 3px 0 0 var(--phosphor,#3fc6ff);background:color-mix(in srgb,var(--phosphor,#3fc6ff) 10%, transparent)}" +
      "body.voice-chrome .main-area{padding-inline:clamp(12px,2vw,28px)}" +
      "body.voice-chrome #main-content:focus{outline:none}" +
      "body.voice-chrome #main-content:focus-visible{outline:2px solid var(--phosphor,#3fc6ff);outline-offset:4px}" +
      /* Section spacing — never #animate-view */
      "body.voice-chrome #speak-view,body.voice-chrome #studio-view,body.voice-chrome #longform-view,body.voice-chrome #modulate-view,body.voice-chrome #project-view,body.voice-chrome #library-view,body.voice-chrome #settings-view{padding-block:clamp(12px,2vh,24px);gap:clamp(12px,2vh,20px)}" +
      "body.voice-chrome #speak-view h1,body.voice-chrome #studio-view h1,body.voice-chrome #longform-view h1,body.voice-chrome #modulate-view h1,body.voice-chrome #project-view h1,body.voice-chrome #library-view h1,body.voice-chrome #settings-view h1{letter-spacing:.06em;margin-bottom:.35em}" +
      "body.voice-chrome #speak-view .btn,body.voice-chrome #studio-view .btn,body.voice-chrome #settings-view .btn,body.voice-chrome #library-view .btn,body.voice-chrome #project-view .btn,body.voice-chrome #modulate-view .btn,body.voice-chrome #longform-view .btn{min-height:44px}" +
      "body.voice-chrome #speak-view textarea,body.voice-chrome #studio-view textarea,body.voice-chrome #longform-view textarea,body.voice-chrome #modulate-view textarea{line-height:1.45}" +
      /* Gate / auth chrome */
      "body.voice-chrome .auth-gate,body.voice-chrome #auth-gate,body.voice-chrome .gate-panel,body.voice-chrome [data-gate]{border:1px solid #263029;border-radius:2px}" +
      "body.voice-chrome .auth-gate input,body.voice-chrome #auth-gate input,body.voice-chrome .gate-panel input{min-height:44px}" +
      "body.voice-chrome .kbd-hint{position:fixed;right:12px;bottom:12px;z-index:9000;max-width:min(320px,92vw);padding:10px 12px;background:#0a0d0c;border:1px solid #263029;color:#7d9689;font-family:Share Tech Mono,ui-monospace,monospace;font-size:11px;line-height:1.45;border-radius:2px;box-shadow:0 8px 24px rgba(0,0,0,.45)}" +
      "body.voice-chrome .kbd-hint[hidden]{display:none!important}" +
      "body.voice-chrome .kbd-hint kbd{display:inline-block;padding:1px 5px;border:1px solid #263029;border-radius:2px;color:var(--phosphor,#3fc6ff);background:#121816;font:inherit}" +
      "@media (prefers-reduced-motion: reduce){html{scroll-behavior:auto}* {animation-duration:.01ms!important;transition-duration:.01ms!important}}" +
      "@media (max-width:780px){body.voice-chrome .sidebar{position:static;max-height:none}}";
    document.head.appendChild(s);
  }

  function ensureSkipLink() {
    var skip = document.querySelector(".skip-link");
    if (!skip) {
      skip = document.createElement("a");
      skip.className = "skip-link";
      skip.href = "#main-content";
      skip.textContent = "Skip to content";
      document.body.insertBefore(skip, document.body.firstChild);
    }
    if (skip._wired) return;
    skip._wired = true;
    skip.addEventListener("click", function (e) {
      e.preventDefault();
      var main = document.getElementById("main-content");
      if (!main) return;
      main.setAttribute("tabindex", "-1");
      main.focus();
      try {
        main.scrollIntoView({ block: "start" });
      } catch (err) {}
    });
  }

  function markCurrent() {
    var items = document.querySelectorAll(".sidebar-item[data-section]");
    items.forEach(function (btn) {
      var id = btn.getAttribute("data-section");
      var view = document.getElementById(id + "-view");
      var on = view && !view.hidden;
      if (on) btn.setAttribute("aria-current", "page");
      else btn.removeAttribute("aria-current");
    });
  }

  function activate(id) {
    if (id === "animate") return;
    var btn = document.querySelector('.sidebar-item[data-section="' + id + '"]');
    if (btn) btn.click();
  }

  function ensureLandmarks() {
    var main = document.getElementById("main-content");
    if (main && !main.getAttribute("role")) main.setAttribute("role", "main");
    var nav = document.querySelector(".sidebar-nav");
    if (nav && !nav.getAttribute("role")) nav.setAttribute("role", "navigation");
    if (nav && !nav.getAttribute("aria-label")) nav.setAttribute("aria-label", "Primary");

    [
      ["speak-view", "Speak"],
      ["studio-view", "Voice Studio"],
      ["longform-view", "Long-form Studio"],
      ["modulate-view", "Modulate"],
      ["music-view", "Music"],
      ["project-view", "Project"],
      ["library-view", "Library"],
      ["settings-view", "Settings"],
    ].forEach(function (row) {
      var el = document.getElementById(row[0]);
      if (!el) return;
      if (!el.getAttribute("role")) el.setAttribute("role", "region");
      if (!el.getAttribute("aria-label")) el.setAttribute("aria-label", row[1]);
    });
    // Do not touch #animate-view
  }

  function polishGate() {
    var gates = document.querySelectorAll(".auth-gate, #auth-gate, .gate-panel, [data-gate]");
    gates.forEach(function (g) {
      if (!g.getAttribute("role")) g.setAttribute("role", "dialog");
      if (!g.getAttribute("aria-label") && !g.getAttribute("aria-labelledby"))
        g.setAttribute("aria-label", "Account");
    });
  }

  function ensureKbdHint() {
    if (document.getElementById("voice-kbd-hint")) return;
    var box = document.createElement("div");
    box.id = "voice-kbd-hint";
    box.className = "kbd-hint";
    box.hidden = true;
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Keyboard shortcuts");
    box.innerHTML =
      "<strong style=\"color:var(--phosphor,#3fc6ff)\">Shortcuts</strong><br>" +
      "<kbd>Alt</kbd>+<kbd>1</kbd>–<kbd>8</kbd> sections<br>" +
      "<kbd>?</kbd> toggle this help<br>" +
      "<kbd>Esc</kbd> close panels / stop transport in Music";
    document.body.appendChild(box);
  }

  function toggleHint() {
    var box = document.getElementById("voice-kbd-hint");
    if (!box) return;
    box.hidden = !box.hidden;
  }

  function boot() {
    document.body.classList.add("voice-chrome");
    injectCss();
    ensureSkipLink();
    ensureLandmarks();
    polishGate();
    ensureKbdHint();
    markCurrent();

    if (!document.body._chromeObs) {
      document.body._chromeObs = new MutationObserver(function () {
        markCurrent();
        polishGate();
      });
      document.body._chromeObs.observe(document.body, {
        attributes: true,
        subtree: true,
        attributeFilter: ["hidden", "class"],
      });
    }
  }

  document.addEventListener("keydown", function (e) {
    var tag = (e.target && e.target.tagName) || "";
    var typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    if (typing) return;

    if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      toggleHint();
      return;
    }
    if (e.key === "Escape") {
      var box = document.getElementById("voice-kbd-hint");
      if (box && !box.hidden) {
        box.hidden = true;
        return;
      }
    }

    if (!(e.altKey || e.metaKey) || e.shiftKey) return;
    var map = {
      Digit1: "speak",
      Digit2: "studio",
      Digit3: "longform",
      Digit4: "modulate",
      Digit5: "music",
      Digit6: "project",
      Digit7: "library",
      Digit8: "settings",
    };
    var id = map[e.code];
    if (!id) return;
    e.preventDefault();
    activate(id);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
