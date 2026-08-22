(function () {
  if (window.__voiceSiteChrome) return;
  window.__voiceSiteChrome = true;

  function injectCss() {
    if (document.getElementById("site-chrome-css")) return;
    var s = document.createElement("style");
    s.id = "site-chrome-css";
    s.textContent =
      ".skip-link{position:absolute;left:12px;top:-40px;z-index:10000;padding:8px 12px;background:var(--phosphor,#3fc6ff);color:var(--phosphor-ink,#06170f);font-family:Share Tech Mono,ui-monospace,monospace;font-size:12px}" +
      ".skip-link:focus{top:12px}" +
      ".sidebar-item:focus-visible,.btn:focus-visible,.mode-btn:focus-visible,select:focus-visible,input:focus-visible,textarea:focus-visible{outline:2px solid var(--phosphor,#3fc6ff);outline-offset:2px}" +
      ".sidebar-nav .sidebar-item{min-height:44px}" +
      "@media (prefers-reduced-motion: reduce){html{scroll-behavior:auto}}";
    document.head.appendChild(s);
  }

  function activate(id) {
    var btn = document.querySelector('.sidebar-item[data-section="' + id + '"]');
    if (btn) btn.click();
  }

  function boot() {
    injectCss();
    var skip = document.querySelector(".skip-link");
    if (skip && !skip._wired) {
      skip._wired = true;
      skip.addEventListener("click", function () {
        var main = document.getElementById("main-content");
        if (main) {
          main.setAttribute("tabindex", "-1");
          main.focus();
        }
      });
    }
  }

  document.addEventListener("keydown", function (e) {
    var tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
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
