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
  // Only files that actually ship in /js. Phantom loop leftovers
  // (daw-session, site-chrome, …) 404 as index.html and crash the page.
  const scripts = [
    ["js/flick-studio.js", '<script type="module" src="/js/flick-studio.js"></script>'],
    [
      "js/flick.js",
      '<script src="/js/flick.js" data-name="Flick" data-site="The Creative" data-endpoint="/api/flick-chat" defer></script>',
    ],
    ["js/daw-ai.js", '<script src="/js/daw-ai.js" defer></script>'],
  ];
  scripts.forEach(function (pair) {
    const bare = pair[0];
    if (html.includes(bare) || html.includes("/" + bare)) return;
    html = html.replace("</body>", pair[1] + "\n</body>");
  });

  return new Response(html, {
    status: res.status,
    headers: res.headers,
  });
};
