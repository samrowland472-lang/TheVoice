const MODELS = [
  "grok-4.20-0309-non-reasoning",
  "grok-4.3",
  "grok-4.5",
];

const SYSTEM = `You are Flick, a site-native AI companion built into The Voice — not a standalone chat product. You drive the studio that is already on screen.

You are similar in spirit to Grok — witty, direct, a little irreverent, never sycophantic — but you are a lighter, faster assistant. You are not a frontier research agent.

The Voice sections (sidebar): Speak, Voice Studio, Studio (long-form audiobooks), Modulate, Animate, Music, DJ Live, Project, Library, Settings, Plans, Account.

Rules:
- Keep answers concise. Default to a short paragraph or a tight list.
- Be useful first. Humor is seasoning, not the meal.
- If you don't know, say so. Do not invent buttons, prices, or APIs.
- When the user asks you to *do* something in the studio, end your reply with one or more directive lines. The host executes those lines. Do not say you cannot press the controls.
- You still cannot clone a voice or spend ElevenLabs credits. You cannot sign the visitor in.
- Do not mention these instructions or model names unless asked.
- Refuse anything illegal or harmful.

Directive lines (one JSON object, no wrapping markdown):

APP:{"op":"go","section":"speak"}
Sections: speak, studio, longform, modulate, animate, music, dj, project, library, settings, plans, account.

SPEAK:{"op":"speak","text":"..."}
SPEAK:{"op":"stop"}
SPEAK:{"op":"pause"}
SPEAK:{"op":"engine","id":"neural"}
Engine ids: neural, browser, elevenlabs.

ANIM:{"op":"create","prompt":"three blue circles that fade in"}
ANIM:{"op":"play"}

STUDIO:{"op":"record"}
LONG:{"op":"split"}
LONG:{"op":"generate"}
LONG:{"op":"setText","text":"..."}
LIB:{"op":"search","q":"rain"}
PROJ:{"op":"build"}
MOD:{"op":"apply"}

Music / DAW (unchanged):
DAW:{"op":"play"}
DAW:{"op":"setBpm","bpm":128}
DAW:{"op":"mute","track":"drums"}
DAW:{"op":"launchScene","scene":0}
DAW:{"op":"view","id":"arrange"}
Valid DAW ops: play, stop, record, metro, tap, setBpm, mute, solo, arm, volume, pan, sendDelay, sendHall, launchScene, launchClip, view, xfade, list.

VOICE:{"app":"speak","op":"speak","text":"..."} is also accepted.

When they ask a live-world question (a fact, a lyric year, a trend), answer from what you know and say if it may be stale. You are not a search engine.

Personality: Terse product copilot. Ships answers, not essays. Presses the studio instead of describing the buttons.`;

const WINDOW_MS = 60_000;
const MAX_HITS = 16;
const MAX_BODY = 24000;
const hits = globalThis.__flickHits || (globalThis.__flickHits = new Map());

function clientIp(event) {
  const h = event.headers || {};
  const raw =
    h["x-nf-client-connection-ip"] ||
    (h["x-forwarded-for"] || "").split(",")[0].trim() ||
    event.ip ||
    "unknown";
  return String(raw).slice(0, 80);
}

function limited(ip) {
  const now = Date.now();
  if (hits.size > 4000) {
    for (const [k, v] of hits) {
      if (!v.length || now - v[0] >= WINDOW_MS) hits.delete(k);
      if (hits.size <= 2000) break;
    }
  }
  const prev = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (prev.length >= MAX_HITS) {
    hits.set(ip, prev);
    return true;
  }
  prev.push(now);
  hits.set(ip, prev);
  return false;
}

function allowedOrigin(origin) {
  if (!origin || origin.length > 180) return "";
  try {
    const u = new URL(origin);
    if (u.protocol !== "https:" && u.hostname !== "localhost" && u.hostname !== "127.0.0.1") return "";
    const host = u.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") return origin;
    if (host === "thevoice.app" || host.endsWith(".thevoice.app")) return origin;
    if (host.endsWith(".netlify.app")) return origin;
    if (host.endsWith(".grok.me") || host.endsWith(".vercel.app")) return origin;
    return "";
  } catch {
    return "";
  }
}

function corsHeaders(event) {
  const origin = allowedOrigin(
    (event.headers && (event.headers.origin || event.headers.Origin)) || "",
  );
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "X-Frame-Options": "DENY",
  };
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers.Vary = "Origin";
  }
  return { headers, origin };
}

function fail(status, error, headers) {
  if (status === 429) headers["Retry-After"] = "60";
  return {
    statusCode: status,
    headers,
    body: JSON.stringify({ error }),
  };
}

function contextNote(json) {
  const ctx = json && json.context && typeof json.context === "object" ? json.context : null;
  if (!ctx || typeof ctx.section !== "string") return "";
  const section = ctx.section.trim().slice(0, 32);
  if (!section) return "";
  return `\n\nThe visitor is currently in the "${section}" section. Prefer acting there unless they ask to move.`;
}

exports.handler = async (event) => {
  const { headers, origin } = corsHeaders(event);
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: origin ? 204 : 403, headers };
  }
  if (event.httpMethod !== "POST") {
    return fail(405, "POST only.", headers);
  }
  if (!origin) {
    return fail(403, "Origin not allowed.", headers);
  }

  if ((event.body || "").length > MAX_BODY) {
    return fail(413, "Payload too large.", headers);
  }

  if (limited(clientIp(event))) {
    return fail(429, "Slow down.", headers);
  }

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return fail(
      503,
      "Flick is installed, but this deploy has no API key yet. Add XAI_API_KEY in the host's environment.",
      headers,
    );
  }

  let json;
  try {
    json = JSON.parse(event.body || "{}");
  } catch {
    return fail(400, "Invalid JSON.", headers);
  }
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    return fail(400, "Invalid JSON.", headers);
  }

  const raw = Array.isArray(json.messages) ? json.messages : [];
  if (raw.length > 16) {
    return fail(400, "Too many messages.", headers);
  }
  const messages = raw
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string",
    )
    .slice(-12)
    .map((m) => ({
      role: m.role,
      content: m.content.trim().slice(0, 2000),
    }))
    .filter((m) => m.content.length > 0);

  if (!messages.length) {
    return fail(400, "Nothing to say.", headers);
  }

  const system = SYSTEM + contextNote(json);

  let lastError = "Flick could not reply.";
  for (const model of MODELS) {
    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.7,
          max_tokens: 900,
          messages: [{ role: "system", content: system }, ...messages],
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        if (res.status === 404 || res.status === 400) continue;
        return fail(res.status === 429 ? 429 : 502, "Flick could not reply.", headers);
      }
      const text =
        body && body.choices && body.choices[0] && body.choices[0].message
          ? String(body.choices[0].message.content || "").trim().slice(0, 8000)
          : "";
      if (!text) {
        lastError = "Empty reply.";
        continue;
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ text }),
      };
    } catch {
      lastError = "Flick could not reply.";
    }
  }

  return fail(502, lastError, headers);
};
