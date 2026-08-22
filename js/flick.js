(function () {
  if (window.__flickVoiceLoaded) return;
  window.__flickVoiceLoaded = true;

  var script = document.currentScript;
  var endpoint =
    (script && script.getAttribute("data-endpoint")) || "/api/flick-chat";
  var name = (script && script.getAttribute("data-name")) || "Flick";
  var welcome =
    (script && script.getAttribute("data-welcome")) ||
    "I'm Flick — built into The Voice, not a separate app. Ask me to clone a voice, speak a line, build a scene, drive Music, open Library, or mix a Project.";
  var starters = [
    "Speak this: The night is a river",
    "Animate a blue sphere orbiting a cube",
    "Open Clone and record",
    "Play the set at 128 BPM",
  ];

  var host = document.createElement("div");
  host.setAttribute("data-flick-host", "1");
  host.style.cssText =
    "all:initial;position:fixed;right:16px;bottom:16px;z-index:2147483000;";
  document.documentElement.appendChild(host);

  var root = host.attachShadow({ mode: "open" });
  root.innerHTML =
    '<style>' +
    ':host, * { box-sizing: border-box; }' +
    '.wrap { font-family: "Chakra Petch", ui-sans-serif, system-ui, sans-serif; color: var(--ink, #d9f5e3); }' +
    '.panel { display: none; width: min(380px, calc(100vw - 24px)); height: min(620px, 72vh); margin-bottom: 12px; overflow: hidden; border: 1px solid var(--glass-border, rgba(63,198,255,.14)); border-radius: 18px; background: var(--surface, #121613); box-shadow: 0 24px 60px var(--shadow, rgba(0,0,0,.6)); flex-direction: column; }' +
    '.panel.open { display: flex; }' +
    '.head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; border-bottom: 1px solid var(--border, #263029); }' +
    '.title { font-size: 18px; letter-spacing: .02em; }' +
    '.sub { margin-top: 2px; font-family: "Share Tech Mono", ui-monospace, monospace; font-size: 11px; color: var(--ink-dim, #7d9689); }' +
    '.icon-btn { width: 44px; height: 44px; border: 0; border-radius: 10px; background: transparent; color: var(--ink-dim, #7d9689); cursor: pointer; }' +
    '.icon-btn:hover { color: var(--ink, #d9f5e3); background: var(--surface-alt, #1a201c); }' +
    '.thread { flex: 1; overflow: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }' +
    '.msg { max-width: 92%; font-size: 14px; line-height: 1.5; white-space: pre-wrap; }' +
    '.msg.user { align-self: flex-end; color: var(--phosphor, #3fc6ff); }' +
    '.who { font-family: "Share Tech Mono", ui-monospace, monospace; font-size: 10px; letter-spacing: .16em; text-transform: uppercase; color: var(--ink-faint, #4c5f56); margin-bottom: 4px; }' +
    '.empty { color: var(--ink-dim, #7d9689); font-size: 14px; line-height: 1.5; }' +
    '.chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }' +
    '.chip { min-height: 40px; padding: 8px 12px; border: 1px solid var(--border, #263029); border-radius: 999px; background: transparent; color: var(--ink, #d9f5e3); font: inherit; font-size: 13px; text-align: left; cursor: pointer; }' +
    '.chip:hover { border-color: var(--phosphor, #3fc6ff); color: var(--phosphor, #3fc6ff); }' +
    '.wait { font-family: "Share Tech Mono", ui-monospace, monospace; font-size: 12px; color: var(--phosphor, #3fc6ff); letter-spacing: .12em; text-transform: uppercase; }' +
    '.err { color: var(--alert, #ff4d4d); font-size: 13px; }' +
    '.composer { display: flex; gap: 8px; padding: 10px; border-top: 1px solid var(--border, #263029); }' +
    'textarea { flex: 1; min-height: 44px; max-height: 120px; resize: none; padding: 10px 12px; border: 1px solid var(--border, #263029); border-radius: 12px; background: var(--ground, #0a0d0c); color: var(--ink, #d9f5e3); font: inherit; font-size: 14px; }' +
    'textarea:focus { outline: 2px solid var(--phosphor, #3fc6ff); outline-offset: 1px; }' +
    '.send { width: 44px; height: 44px; border: 0; border-radius: 12px; background: var(--phosphor, #3fc6ff); color: var(--phosphor-ink, #06170f); cursor: pointer; }' +
    '.send:disabled { opacity: .4; cursor: not-allowed; }' +
    '.fab { display: flex; align-items: center; justify-content: center; width: 56px; height: 56px; margin-left: auto; border: 0; border-radius: 999px; background: var(--phosphor, #3fc6ff); color: var(--phosphor-ink, #06170f); cursor: pointer; box-shadow: 0 16px 40px var(--shadow, rgba(0,0,0,.6)); }' +
    '.fab:hover { filter: brightness(1.08); }' +
    '@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }' +
    '</style>' +
    '<div class="wrap">' +
    '  <div class="panel" role="dialog" aria-label="' +
    name +
    ' chat">' +
    '    <div class="head">' +
    '      <div><div class="title"></div><div class="sub">Built into The Voice</div></div>' +
    '      <button class="icon-btn" type="button" aria-label="Close chat">×</button>' +
    "    </div>" +
    '    <div class="thread"></div>' +
    '    <div class="composer">' +
    '      <textarea rows="1" maxlength="4000" placeholder="Ask Flick to speak, animate, record, play…"></textarea>' +
    '      <button class="send" type="button" aria-label="Send">↑</button>' +
    "    </div>" +
    "  </div>" +
    '  <button class="fab" type="button" aria-label="Open ' +
    name +
    '" aria-expanded="false">' +
    '    <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16 4 L18.1 13.4 L28 16 L18.1 18.6 L16 28 L13.9 18.6 L4 16 L13.9 13.4 Z"></path></svg>' +
    "  </button>" +
    "</div>";

  var panel = root.querySelector(".panel");
  var thread = root.querySelector(".thread");
  var input = root.querySelector("textarea");
  var sendBtn = root.querySelector(".send");
  var fab = root.querySelector(".fab");
  var closeBtn = root.querySelector(".icon-btn");
  root.querySelector(".title").textContent = name;

  var messages = [];
  var busy = false;
  var open = false;

  function studio() {
    return window.TheVoiceFlick || null;
  }
  function daw() {
    return window.TheVoiceDAW || null;
  }
  function runStudio(text) {
    var s = studio();
    if (s && typeof s.applyText === "function") {
      try { s.applyText(text); return; } catch (e) {}
    }
    var d = daw();
    if (d && typeof d.applyText === "function") {
      try { d.applyText(text); } catch (e2) {}
    }
  }
  function showText(text) {
    var s = studio();
    if (s && s.strip) return s.strip(text) || text;
    var d = daw();
    if (d && d.strip) return d.strip(text) || text;
    return String(text || "")
      .replace(/\b(VOICE|DAW|SPEAK|ANIM|APP|STUDIO|LONG|MOD|LIB|PROJ):\s*\{[^\n]+\}\s*/g, "")
      .trim();
  }
  function currentSection() {
    var s = studio();
    if (s && typeof s.currentSection === "function") return s.currentSection();
    var b = document.querySelector(".sidebar-item.active");
    return (b && b.getAttribute("data-section")) || "speak";
  }

  function setOpen(next) {
    open = next;
    panel.classList.toggle("open", open);
    fab.setAttribute("aria-expanded", open ? "true" : "false");
    fab.setAttribute("aria-label", open ? "Close " + name : "Open " + name);
    if (open) input.focus();
  }

  function render() {
    thread.replaceChildren();
    if (!messages.length) {
      var empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = welcome;
      var chips = document.createElement("div");
      chips.className = "chips";
      starters.forEach(function (s) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "chip";
        b.textContent = s;
        b.addEventListener("click", function () {
          send(s);
        });
        chips.appendChild(b);
      });
      empty.appendChild(chips);
      thread.appendChild(empty);
      return;
    }
    messages.forEach(function (m) {
      var wrap = document.createElement("div");
      wrap.className = "msg " + m.role;
      var who = document.createElement("div");
      who.className = "who";
      who.textContent = m.role === "user" ? "You" : name;
      var body = document.createElement("div");
      body.textContent = m.role === "assistant" ? showText(m.content) : m.content;
      wrap.appendChild(who);
      wrap.appendChild(body);
      thread.appendChild(wrap);
    });
    if (busy) {
      var wait = document.createElement("div");
      wait.className = "wait";
      wait.textContent = "On it";
      thread.appendChild(wait);
    }
    thread.scrollTop = thread.scrollHeight;
  }

  function send(text) {
    var value = (text || input.value || "").trim();
    if (!value || busy) return;
    if (value.length > 4000) value = value.slice(0, 4000);
    input.value = "";
    messages.push({ role: "user", content: value });
    if (messages.length > 24) messages = messages.slice(-24);
    runStudio(value);
    busy = true;
    sendBtn.disabled = true;
    render();

    var payload = messages
      .filter(function (m) {
        return m.content;
      })
      .slice(-12)
      .map(function (m) {
        return { role: m.role, content: m.content };
      });

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: payload,
        context: { section: currentSection() },
      }),
    })
      .then(function (res) {
        return res.json().then(function (body) {
          return { ok: res.ok, body: body };
        });
      })
      .then(function (out) {
        busy = false;
        sendBtn.disabled = false;
        if (!out.ok || !out.body || !out.body.text) {
          messages.push({
            role: "assistant",
            content:
              (out.body && out.body.error) ||
              "Flick could not reach the studio just now. Try again in a moment.",
          });
          render();
          return;
        }
        var reply = String(out.body.text);
        runStudio(reply);
        messages.push({ role: "assistant", content: reply });
        render();
      })
      .catch(function () {
        busy = false;
        sendBtn.disabled = false;
        messages.push({
          role: "assistant",
          content:
            "Flick is offline on this deploy until the site owner connects an API key. Local studio commands still run.",
        });
        render();
      });
  }

  fab.addEventListener("click", function () {
    setOpen(!open);
  });
  closeBtn.addEventListener("click", function () {
    setOpen(false);
  });
  sendBtn.addEventListener("click", function () {
    send();
  });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });

  render();
})();
