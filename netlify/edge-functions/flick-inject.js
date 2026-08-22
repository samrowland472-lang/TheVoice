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
  const scripts = [
    ["/js/flick.js", '<script src="/js/flick.js" data-name="Flick" data-site="The Voice" defer></script>'],
    ["/js/daw-session.js", '<script src="/js/daw-session.js" defer></script>'],
    ["/js/daw-live.js", '<script src="/js/daw-live.js" defer></script>'],
    ["/js/daw-follow.js", '<script src="/js/daw-follow.js" defer></script>'],
    ["/js/daw-cue.js", '<script src="/js/daw-cue.js" defer></script>'],
    ["/js/site-chrome.js", '<script src="/js/site-chrome.js" defer></script>'],
    ["/js/site-ops.js", '<script src="/js/site-ops.js" defer></script>'],
    ["/js/site-studio.js", '<script src="/js/site-studio.js" defer></script>'],
  ];
  scripts.forEach(function (pair) {
    if (!html.includes(pair[0])) {
      html = html.replace("</body>", pair[1] + "\n</body>");
    }
  });

  return new Response(html, {
    status: res.status,
    headers: res.headers,
  });
};
