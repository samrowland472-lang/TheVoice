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
      "body.voice-chrome .sidebar{border-right:1px solid #1c2a24}" +
      "body.voice-chrome .sidebar-item[aria-current=page]{box-shadow:inset 3px 0 0 var(--phosphor,#3fc6ff)}" +
      "body.voice-chrome .main-area{padding-inline:clamp(12px,2vw,28px)}" +
      "body.voice-chrome #main-content:focus{outline:none}" +
      "body.voice-chrome #main-content:focus-visible{outline:2px solid var(--phosphor,#3fc6ff);outline-offset:4px}" +
      "body.voice-chrome .kbd-hint{position:fixed;right:12px;bottom:12px;z-index:9000;max-width:min(320px,92vw);padding:10px 12px;background:#0a0d0c;border:1px solid #263029;color:#7d9689;font-family:Share Tech Mono,ui-monospace,monospace;font-size:11px;line-height:1.45;border-radius:2px;box-shadow:0 8px 24px rgba(0,0,0,.45)}" +
      "body.voice-chrome .kbd-hint[hidden]{display:none!important}" +
      "body.voice-chrome .kbd-hint kbd{display:inline-block;padding:1px 5px;border:1px solid #263029;border-radius:2px;color:var(--phosphor,#3fc6ff);background:#121816;font:inherit}" +
      "@media (prefers-reduced-motion: reduce){html{scroll-behavior:auto}* {animation-duration:.01ms!important;transition-duration:.01ms!important}}" +
      /* Never restyle Animate — Claude owns #animate-view */
      "#animate-view .voice-chrome-ignore{display:none}";
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
    if (id === "animate") return; // Claude owns Animate
    var btn = document.querySelector('.sidebar-item[data-section="' + id + '"]');
    if (btn) btn.click();
  }

  function ensureLandmarks() {
    var main = document.getElementById("main-content");
    if (main && !main.getAttribute("role")) main.setAttribute("role", "main");
    var nav = document.querySelector(".sidebar-nav");
    if (nav && !nav.getAttribute("role")) nav.setAttribute("role", "navigation");
    if (nav && !nav.getAttribute("aria-label")) nav.setAttribute("aria-label", "Primary");
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
      "<kbd>Alt</kbd>+<kbd>1</kbd>–<kbd>8</kbd> sections (skips Animate)<br>" +
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
    ensureKbdHint();
    markCurrent();

    if (!document.body._chromeObs) {
      document.body._chromeObs = new MutationObserver(function () {
        markCurrent();
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
