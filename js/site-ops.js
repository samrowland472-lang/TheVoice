(function () {
  if (window.__voiceSiteOps) return;
  window.__voiceSiteOps = true;

  var WORD_CAP = 20000;

  function injectCss() {
    if (document.getElementById("site-ops-css")) return;
    var s = document.createElement("style");
    s.id = "site-ops-css";
    s.textContent =
      "body.voice-ops #console-view .tab-panel.active{gap:16px}" +
      "body.voice-ops #console-view #text-input{min-height:140px;line-height:1.5}" +
      "body.voice-ops #console-view .buttons-row{flex-wrap:wrap;gap:8px}" +
      "body.voice-ops #console-view .btn,body.voice-ops #modulate-view .btn,body.voice-ops #project-view .btn,body.voice-ops #library-view .btn,body.voice-ops #settings-view .btn,body.voice-ops #longform-view .btn,body.voice-ops #plans-view .btn,body.voice-ops #account-view .btn{min-height:44px}" +
      "body.voice-ops #library-search,body.voice-ops #library-engine-filter,body.voice-ops #api-key-input,body.voice-ops #link-studio-input,body.voice-ops #link-pro-input{min-height:44px;width:100%;max-width:520px}" +
      "body.voice-ops #library-view .library-filters{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:12px 0}" +
      "body.voice-ops #modulate-view,body.voice-ops #project-view,body.voice-ops #library-view,body.voice-ops #settings-view,body.voice-ops #longform-view,body.voice-ops #plans-view,body.voice-ops #account-view{max-width:920px}" +
      "body.voice-ops #settings-view input[type=password]{font-family:Share Tech Mono,ui-monospace,monospace;letter-spacing:.08em}" +
      "body.voice-ops .drop-ok{outline:2px dashed var(--phosphor,#3fc6ff);outline-offset:2px}" +
      "body.voice-ops #console-view [data-panel=speak] .field-label::after{content:'  Ctrl+Enter to speak';font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#4c5f56;margin-left:8px}" +
      "body.voice-ops #word-cap{font-family:Share Tech Mono,ui-monospace,monospace;font-size:11px;color:#7d9689;letter-spacing:.04em}" +
      "body.voice-ops #word-cap.warn{color:#ffb238}" +
      "body.voice-ops #word-cap.full{color:#ff4d4d}";
    document.head.appendChild(s);
  }

  function wordsOf(s) {
    var m = String(s || "").trim().match(/\S+/g);
    return m ? m.length : 0;
  }

  function trimWords(s, n) {
    var parts = String(s || "").match(/\S+\s*/g);
    if (!parts || parts.length <= n) return s;
    return parts.slice(0, n).join("").replace(/\s+$/, "");
  }

  function click(id) {
    var b = document.getElementById(id);
    if (b && !b.disabled) b.click();
  }

  function ensureMeter(ta) {
    var id = "word-cap";
    var el = document.getElementById(id);
    if (el) return el;
    el = document.createElement("div");
    el.id = id;
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    var stats = document.getElementById("text-stats");
    if (stats && stats.parentNode) stats.parentNode.insertBefore(el, stats.nextSibling);
    else ta.parentNode.insertBefore(el, ta.nextSibling);
    return el;
  }

  function paintMeter(n) {
    var el = document.getElementById("word-cap");
    if (!el) return;
    el.textContent = n.toLocaleString() + " / 20,000 words";
    el.classList.toggle("warn", n >= 18000 && n < WORD_CAP);
    el.classList.toggle("full", n >= WORD_CAP);
  }

  function capText() {
    var ids = ["text-input"];
    var lf = document.querySelector("#longform-view textarea");
    if (lf && lf.id) ids.push(lf.id);
    ids.forEach(function (id) {
      var ta = document.getElementById(id);
      if (!ta || ta._opsCap) return;
      ta._opsCap = true;
      ta.removeAttribute("maxlength");
      function apply() {
        var n = wordsOf(ta.value);
        if (n > WORD_CAP) {
          ta.value = trimWords(ta.value, WORD_CAP);
          n = WORD_CAP;
        }
        if (ta.id === "text-input") paintMeter(n);
      }
      if (ta.id === "text-input") ensureMeter(ta);
      ta.addEventListener("input", apply);
      ta.addEventListener("paste", function () {
        window.setTimeout(apply, 0);
      });
      apply();
    });
  }

  function hardenSettings() {
    var key = document.getElementById("api-key-input");
    if (key && !key._ops) {
      key._ops = true;
      key.setAttribute("autocomplete", "off");
      key.setAttribute("spellcheck", "false");
      key.setAttribute("autocapitalize", "off");
      key.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          click("save-key-btn");
        }
      });
    }
    ["link-studio-input", "link-pro-input"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el || el._ops) return;
      el._ops = true;
      el.setAttribute("autocomplete", "off");
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          click("save-links-btn");
        }
      });
    });
  }

  function focusSection(id) {
    if (id === "animate") return;
    var map = {
      speak: "text-input",
      studio: "record-btn",
      longform: null,
      modulate: "mod-pitch",
      music: null,
      project: "project-voice",
      library: "library-search",
      settings: "api-key-input",
      plans: "plans-refresh-btn",
      account: "signout-btn",
    };
    var fid = map[id];
    if (!fid) return;
    var el = document.getElementById(fid);
    if (el && typeof el.focus === "function") {
      try {
        el.focus({ preventScroll: true });
      } catch (e) {
        el.focus();
      }
    }
  }

  function currentSection() {
    var on = document.querySelector(".sidebar-item.active[data-section]");
    return on ? on.getAttribute("data-section") : "";
  }

  function activate(id) {
    if (id === "animate") return;
    var btn = document.querySelector('.sidebar-item[data-section="' + id + '"]');
    if (btn) btn.click();
  }

  function onKey(e) {
    var t = e.target;
    var tag = (t && t.tagName) || "";
    var typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    var sec = currentSection();
    if (sec === "animate") return;

    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      if (t && t.id === "text-input") {
        e.preventDefault();
        click("play-btn");
        return;
      }
      if (t && t.id === "transcript-box") {
        e.preventDefault();
        click("use-transcript-btn");
        return;
      }
      if (sec === "modulate") {
        e.preventDefault();
        click("mod-apply-btn");
        return;
      }
      if (sec === "project") {
        e.preventDefault();
        click("project-build-btn");
        return;
      }
      if (sec === "longform") {
        var lf = document.querySelector("#longform-view .btn-primary, #longform-view [id$=generate], #longform-view [id$=play]");
        if (lf && !lf.disabled) {
          e.preventDefault();
          lf.click();
        }
        return;
      }
    }

    if (e.key === "Escape" && (sec === "speak" || sec === "studio")) {
      var stop = document.getElementById("stop-btn");
      if (stop && !stop.disabled) {
        e.preventDefault();
        stop.click();
        return;
      }
    }

    if (!typing && e.key === "/" && sec === "library") {
      e.preventDefault();
      var search = document.getElementById("library-search");
      if (search) search.focus();
      return;
    }

    if (!typing && (e.altKey || e.metaKey) && !e.shiftKey) {
      if (e.code === "Digit9") {
        e.preventDefault();
        activate("plans");
        return;
      }
      if (e.code === "Digit0") {
        e.preventDefault();
        activate("account");
        return;
      }
    }
  }

  function watchNav() {
    document.querySelectorAll(".sidebar-item[data-section]").forEach(function (btn) {
      if (btn._opsNav) return;
      btn._opsNav = true;
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-section");
        if (id === "animate") return;
        window.setTimeout(function () {
          focusSection(id);
        }, 30);
      });
    });
  }

  function boot() {
    document.body.classList.add("voice-ops");
    injectCss();
    capText();
    hardenSettings();
    watchNav();
    var lib = document.getElementById("library-search");
    if (lib) lib.setAttribute("aria-label", "Search clips");
    var consoleView = document.getElementById("console-view");
    if (consoleView && !consoleView.getAttribute("aria-label")) {
      consoleView.setAttribute("role", "region");
      consoleView.setAttribute("aria-label", "Speak and Voice Studio");
    }
  }

  document.addEventListener("keydown", onKey, true);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  var n = 0;
  var t = window.setInterval(function () {
    n += 1;
    boot();
    if (n > 40) window.clearInterval(t);
  }, 250);
})();
