const WINDOW_MS = 60_000;
const MAX_HITS = 20;
const MAX_BODY = 24_000;
const MAX_KEYS = 4000;
const hits = new Map();

function clientIp(request) {
  const raw =
    request.headers.get("x-nf-client-connection-ip") ||
    (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    "unknown";
  return raw.slice(0, 80);
}

function allowedOrigin(origin) {
  if (!origin || origin.length > 180) return "";
  try {
    const u = new URL(origin);
    if (u.protocol !== "https:") return "";
    const host = u.hostname.toLowerCase();
    if (host === "thevoice.app" || host.endsWith(".thevoice.app")) return origin;
    if (host.endsWith(".netlify.app")) return origin;
    return "";
  } catch {
    return "";
  }
}

function limited(ip) {
  const now = Date.now();
  if (hits.size > MAX_KEYS) {
    for (const [k, v] of hits) {
      if (!v.length || now - v[0] >= WINDOW_MS) hits.delete(k);
      if (hits.size <= MAX_KEYS / 2) break;
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

function json(status, error, extra) {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    "x-frame-options": "DENY",
  };
  if (extra) Object.assign(headers, extra);
  if (status === 429) headers["retry-after"] = "60";
  return new Response(JSON.stringify({ error }), { status, headers });
}

export default async (request, context) => {
  const url = new URL(request.url);
  const path = decodeURIComponent(url.pathname || "");
  if (path.includes("..") || path.includes("\\")) {
    return json(400, "Blocked.");
  }

  if (!path.startsWith("/api/")) {
    return context.next();
  }

  const origin = allowedOrigin(request.headers.get("origin") || "");

  if (request.method === "OPTIONS") {
    const headers = {
      "cache-control": "no-store",
      "access-control-max-age": "600",
    };
    if (origin) {
      headers["access-control-allow-origin"] = origin;
      headers["access-control-allow-methods"] = "POST, OPTIONS";
      headers["access-control-allow-headers"] = "content-type";
      headers.vary = "Origin";
    }
    return new Response("", { status: origin ? 204 : 403, headers });
  }

  if (request.method !== "POST") {
    return json(405, "POST only.");
  }

  if (!origin) {
    return json(403, "Origin not allowed.");
  }

  const len = Number(request.headers.get("content-length") || 0);
  if (len > MAX_BODY) return json(413, "Payload too large.");

  const ct = (request.headers.get("content-type") || "").toLowerCase();
  if (!ct.includes("application/json")) {
    return json(415, "JSON only.");
  }

  if (limited(clientIp(request))) return json(429, "Slow down.");

  return context.next();
};
