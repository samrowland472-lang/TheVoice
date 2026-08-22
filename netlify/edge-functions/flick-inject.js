export default async (request, context) => {
  const { pathname } = new URL(request.url);
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/js/") ||
    pathname.startsWith("/.netlify/")
  ) {
    return context.next();
  }

  const res = await context.next();
  const type = res.headers.get("content-type") || "";
  if (!type.includes("text/html")) return res;

  let html = await res.text();
  if (!html.includes("/js/flick.js")) {
    html = html.replace(
      "</body>",
      '<script src="/js/flick.js" data-name="Flick" data-site="The Voice" defer></script>\n</body>',
    );
  }
  if (!html.includes("/js/daw-session.js")) {
    html = html.replace(
      "</body>",
      '<script src="/js/daw-session.js" defer></script>\n</body>',
    );
  }
  if (!html.includes("/js/daw-live.js")) {
    html = html.replace(
      "</body>",
      '<script src="/js/daw-live.js" defer></script>\n</body>',
    );
  }
  if (!html.includes("/js/site-chrome.js")) {
    html = html.replace(
      "</body>",
      '<script src="/js/site-chrome.js" defer></script>\n</body>',
    );
  }

  return new Response(html, {
    status: res.status,
    headers: res.headers,
  });
};
