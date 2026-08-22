const WINDOW_MS = 60_000;
const MAX_HITS = 24;
const MAX_BODY = 32_000;
const hits = new Map();

function clientIp(request) {
  return (
    request.headers.get("x-nf-client-connection-ip") ||
    (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    "unknown"
  );
}

function limited(ip) {
  const now = Date.now();
  const prev = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (prev.length >= MAX_HITS) {
    hits.set(ip, prev);
    return true;
  }
  prev.push(now);
  hits.set(ip, prev);
  return false;
}

function json(status, error) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

export default async (request, context) => {
  const url = new URL(request.url);
  if (url.pathname.includes("..") || url.pathname.includes("%2e%2e")) {
    return json(400, "Blocked.");
  }

  if (!url.pathname.startsWith("/api/")) {
    return context.next();
  }

  if (request.method === "OPTIONS") {
    return new Response("", { status: 204, headers: { "cache-control": "no-store" } });
  }
  if (request.method !== "POST") {
    return json(405, "POST only.");
  }

  const len = Number(request.headers.get("content-length") || 0);
  if (len > MAX_BODY) return json(413, "Payload too large.");

  const ip = clientIp(request);
  if (limited(ip)) return json(429, "Slow down.");

  const ct = (request.headers.get("content-type") || "").toLowerCase();
  if (ct && !ct.includes("application/json")) {
    return json(415, "JSON only.");
  }

  return context.next();
};
