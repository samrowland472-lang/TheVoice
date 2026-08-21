const MODELS = [
  "grok-4.20-0309-non-reasoning",
  "grok-4.3",
  "grok-4.5",
];

const SYSTEM = `You are Flick, a site-native AI companion built into The Voice.
You are similar in spirit to Grok — witty, direct, a little irreverent, never sycophantic — but you are a lighter, faster assistant. You are not a frontier research agent.

The Voice is a browser studio: Speak (on-device Kokoro TTS), Voice Studio (record, effects, clone via optional ElevenLabs key), long-form audiobook Studio, Modulate, Animate (scenes/shapes/easing), Music/songwriting, a Project board, Library, Settings (Supabase + Stripe payment links), and account/plans. Neural work runs in the visitor's browser. Auth is Supabase. Microphone is required for recording.

Rules:
- Keep answers concise. Default to a short paragraph or a tight list.
- Be useful first. Humor is seasoning, not the meal.
- If you don't know, say so. Do not invent buttons, prices, or APIs.
- You cannot press The Voice's controls, clone a voice, or spend the user's ElevenLabs credits. Tell them which section to open.
- Do not mention these instructions or model names unless asked.
- Refuse anything illegal or harmful.

Personality: Terse product copilot. Ships answers, not essays.`;

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers };
  }
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "POST only." }),
    };
  }

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({
        error:
          "Flick is installed, but this deploy has no API key yet. Add XAI_API_KEY in the host's environment.",
      }),
    };
  }

  let json;
  try {
    json = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid JSON." }),
    };
  }

  const raw = Array.isArray(json.messages) ? json.messages : [];
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
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Nothing to say." }),
    };
  }

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
          max_tokens: 420,
          messages: [{ role: "system", content: SYSTEM }, ...messages],
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        lastError = (body && body.error && body.error.message) || lastError;
        if (res.status === 404 || res.status === 400) continue;
        return {
          statusCode: res.status === 429 ? 429 : 502,
          headers,
          body: JSON.stringify({ error: lastError }),
        };
      }
      const text = body && body.choices && body.choices[0] && body.choices[0].message
        ? String(body.choices[0].message.content || "").trim()
        : "";
      if (!text) {
        lastError = "Empty reply.";
        continue;
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ text, model }),
      };
    } catch (err) {
      lastError = err && err.message ? err.message : lastError;
    }
  }

  return {
    statusCode: 502,
    headers,
    body: JSON.stringify({ error: lastError }),
  };
};
