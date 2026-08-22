(function () {
  if (window.__voiceSiteStudio) return;
  window.__voiceSiteStudio = true;

  var WORD_CAP = 20000;

  function injectCss() {
    if (document.getElementById("site-studio-css")) return;
    var s = document.createElement("style");
    s.id = "site-studio-css";
    s.textContent =
      "body.voice-studio #longform-view{max-width:960px}" +
      "body.voice-studio #longform-input{min-height:280px;line-height:1.55}" +
      "body.voice-studio #longform-view .btn{min-height:44px}" +
      "body.voice-studio #lf-word-cap{font-family:Share Tech Mono,ui-monospace,monospace;font-size:11px;color:#7d9689;margin:6px 0 10px}" +
      "body.voice-studio #lf-word-cap.warn{color:#ffb238}" +
      "body.voice-studio #lf-word-cap.full{color:#ff4d4d}" +
      "body.voice-studio #longform-view.drop-ok{outline:2px dashed var(--phosphor,#3fc6ff);outline-offset:4px}" +
      "body.voice-studio .chapter-item{cursor:pointer}" +
      "body.voice-studio .chapter-item:focus-visible{outline:2px solid var(--phosphor,#3fc6ff);outline-offset:2px}" +
      "body.voice-studio .chapter-send{margin-left:8px;min-height:32px;padding:4px 10px;font-size:11px}" +
      "body.voice-studio #plans-view .plan-card{min-height:44px}" +
      "body.voice-studio #plans-view .plan-card:focus-visible{outline:2px solid var(--phosphor,#3fc6ff);outline-offset:3px}" +
      "body.voice-studio #account-view .btn{min-height:44px;margin-right:8px}" +
      "body.voice-studio #account-plan-line{font-family:Share Tech Mono,ui-monospace,monospace;font-size:12px;color:#7d9689;margin:0 0 14px}";
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

  function el(id) {
    return document.getElementById(id);
  }

  function click(id) {
    var b = el(id);
    if (b && !b.disabled) b.click();
  }

  function ensureToolbar() {
    var view = el("longform-view");
    if (!view || el("lf-import-btn")) return;
    var row = view.querySelector(".buttons-row");
    if (!row) return;
    var imp = document.createElement("button");
    imp.id = "lf-import-btn";
    imp.className = "btn";
    imp.type = "button";
    imp.textContent = "Import text…";
    var stop = document.createElement("button");
    stop.id = "lf-stop-btn";
    stop.className = "btn";
    stop.type = "button";
    stop.textContent = "Stop playback";
    row.appendChild(imp);
    row.appendChild(stop);
    var file = document.createElement("input");
    file.type = "file";
    file.accept = ".txt,.md,.html,.csv,text/plain";
    file.hidden = true;
    file.id = "lf-file";
    view.appendChild(file);
    imp.addEventListener("click", function () {
      file.click();
    });
    file.addEventListener("change", function () {
      if (file.files && file.files[0]) readTextFile(file.files[0]);
      file.value = "";
    });
    stop.addEventListener("click", function () {
      var a = el("longform-audio");
      if (a) {
        a.pause();
        a.currentTime = 0;
      }
    });
  }

  function ensureMeter() {
    var ta = el("longform-input");
    if (!ta || el("lf-word-cap")) return el("lf-word-cap");
    var m = document.createElement("div");
    m.id = "lf-word-cap";
    m.setAttribute("role", "status");
    ta.parentNode.insertBefore(m, ta.nextSibling);
    return m;
  }

  function paintMeter() {
    var ta = el("longform-input");
    var m = el("lf-word-cap");
    if (!ta || !m) return;
    var n = wordsOf(ta.value);
    m.textContent = n.toLocaleString() + " / 20,000 words · paste a script or drop a .txt";
    m.classList.toggle("warn", n >= 18000 && n < WORD_CAP);
    m.classList.toggle("full", n >= WORD_CAP);
    var chars = el("longform-stat-chars");
    var wordsEl = el("longform-stat-words");
    if (!wordsEl && chars && chars.parentNode && chars.parentNode.parentNode) {
      var tile = document.createElement("div");
      tile.className = "readout-item";
      tile.innerHTML = '<div class="readout-label">Words</div><div class="readout-value" id="longform-stat-words">0</div>';
      chars.parentNode.parentNode.appendChild(tile);
      wordsEl = el("longform-stat-words");
    }
    if (wordsEl) wordsEl.textContent = n.toLocaleString();
    var stats = el("longform-stats");
    if (stats && n > 0) stats.hidden = false;
    var dur = el("longform-stat-duration");
    if (dur && n > 0) {
      var sec = Math.round((n / 150) * 60);
      var mm = Math.floor(sec / 60);
      var ss = String(sec % 60).padStart(2, "0");
      if (!el("longform-audio") || el("longform-audio").hidden) dur.textContent = mm + ":" + ss;
    }
  }

  function readTextFile(file) {
    if (!file) return;
    var name = file.name || "";
    var type = file.type || "";
    var ok =
      /text|json|markdown|html|xml|csv/.test(type) || /\.(txt|md|html|htm|csv|rtf)$/i.test(name);
    if (!ok) {
      var hint = el("longform-hint");
      if (hint) hint.textContent = "Drop a .txt or .md script.";
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      var h = el("longform-hint");
      if (h) h.textContent = "File is too large (8 MB cap)." ;
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      var ta = el("longform-input");
      if (!ta) return;
      var text = String(reader.result || "");
      if (/<html/i.test(text)) text = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
      if (wordsOf(text) > WORD_CAP) text = trimWords(text, WORD_CAP);
      ta.value = text;
      ta.dispatchEvent(new Event("input", { bubbles: true }));
      paintMeter();
    };
    reader.readAsText(file);
  }

  function wireDrop() {
    var view = el("longform-view");
    if (!view || view._lfDrop) return;
    view._lfDrop = true;
    view.addEventListener("dragover", function (e) {
      if (![].some.call(e.dataTransfer.types || [], function (t) {
        return t === "Files";
      })) return;
      e.preventDefault();
      view.classList.add("drop-ok");
    });
    view.addEventListener("dragleave", function () {
      view.classList.remove("drop-ok");
    });
    view.addEventListener("drop", function (e) {
      view.classList.remove("drop-ok");
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (!f) return;
      e.preventDefault();
      e.stopPropagation();
      readTextFile(f);
    });
  }

  function raiseChunks() {
    var sl = el("longform-chunk");
    var lab = el("longform-chunk-value");
    if (!sl || sl._raised) return;
    sl._raised = true;
    sl.min = "200";
    sl.max = "4000";
    sl.step = "100";
    function relabel() {
      var n = parseInt(sl.value, 10) || 0;
      if (lab) lab.textContent = n + " chars (~" + Math.round(n / 6) + " w)";
    }
    sl.addEventListener("input", relabel);
    relabel();
  }

  function decorateChapters() {
    var list = el("chapter-list");
    if (!list) return;
    list.querySelectorAll(".chapter-item").forEach(function (li) {
      li.setAttribute("tabindex", "0");
      if (li.querySelector(".chapter-send")) return;
      var btn = document.createElement("button");
      btn.className = "btn chapter-send";
      btn.type = "button";
      btn.textContent = "Send to Speak";
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        sendChapter(li);
      });
      li.appendChild(btn);
    });
  }

  function sendChapter(li) {
    var textEl = li.querySelector(".chapter-text");
    var speak = el("text-input");
    if (!textEl || !speak) return;
    speak.value = textEl.textContent || "";
    speak.dispatchEvent(new Event("input", { bubbles: true }));
    var nav = document.querySelector('.sidebar-item[data-section="speak"]');
    if (nav) nav.click();
  }

  function wireChapters() {
    var list = el("chapter-list");
    if (!list || list._wired) return;
    list._wired = true;
    list.addEventListener("keydown", function (e) {
      var li = e.target.closest(".chapter-item");
      if (!li) return;
      if (e.key === "Enter") {
        e.preventDefault();
        sendChapter(li);
      }
    });
    var obs = new MutationObserver(decorateChapters);
    obs.observe(list, { childList: true });
  }

  function polishAccount() {
    var email = el("account-email-display");
    var view = el("account-view");
    if (!email || !view) return;
    if (!el("account-copy-btn")) {
      var btn = document.createElement("button");
      btn.id = "account-copy-btn";
      btn.className = "btn";
      btn.type = "button";
      btn.textContent = "Copy email";
      btn.addEventListener("click", function () {
        var t = (email.textContent || "").trim();
        if (!t) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(t);
          btn.textContent = "Copied";
          window.setTimeout(function () {
            btn.textContent = "Copy email";
          }, 1200);
        }
      });
      var sign = el("signout-btn");
      view.insertBefore(btn, sign || null);
    }
    if (!el("account-plan-line")) {
      var line = document.createElement("p");
      line.id = "account-plan-line";
      line.textContent = (el("plans-current") && el("plans-current").textContent) || "Open Plans to confirm your subscription.";
      view.insertBefore(line, el("account-copy-btn"));
    } else {
      var src = el("plans-current");
      if (src && src.textContent) el("account-plan-line").textContent = src.textContent;
    }
  }

  function polishPlans() {
    var grid = el("plan-grid");
    if (!grid) return;
    grid.querySelectorAll(".plan-card").forEach(function (card) {
      if (!card.hasAttribute("tabindex")) card.setAttribute("tabindex", "0");
      if (card._keys) return;
      card._keys = true;
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          var b = card.querySelector("button.btn");
          if (b && !b.disabled) {
            e.preventDefault();
            b.click();
          }
        }
      });
    });
  }

  function onKey(e) {
    var view = el("longform-view");
    if (!view || view.hidden) return;
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) click("longform-generate-btn");
      else click("longform-analyze-btn");
    }
  }

  function boot() {
    document.body.classList.add("voice-studio");
    injectCss();
    ensureToolbar();
    ensureMeter();
    wireDrop();
    raiseChunks();
    wireChapters();
    decorateChapters();
    polishAccount();
    polishPlans();
    var ta = el("longform-input");
    if (ta && !ta._lfLive) {
      ta._lfLive = true;
      ta.addEventListener("input", paintMeter);
      paintMeter();
    }
    var view = el("longform-view");
    if (view && !view.getAttribute("aria-label")) {
      view.setAttribute("role", "region");
      view.setAttribute("aria-label", "Long-form Studio");
    }
    var acc = el("account-view");
    if (acc && !acc.getAttribute("aria-label")) {
      acc.setAttribute("role", "region");
      acc.setAttribute("aria-label", "Account");
    }
    var plans = el("plans-view");
    if (plans && !plans.getAttribute("aria-label")) {
      plans.setAttribute("role", "region");
      plans.setAttribute("aria-label", "Plans");
    }
  }

  document.addEventListener("keydown", onKey);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  var n = 0;
  var t = window.setInterval(function () {
    n += 1;
    boot();
    if (n > 48) window.clearInterval(t);
  }, 250);
})();
