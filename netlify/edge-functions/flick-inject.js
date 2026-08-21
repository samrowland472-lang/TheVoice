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

  const html = await res.text();
  const injected = html.includes("/js/flick.js")
    ? html
    : html.replace(
        "</body>",
        '<script src="/js/flick.js" data-name="Flick" data-site="The Voice" defer></script>\n</body>',
      );

  return new Response(injected, {
    status: res.status,
    headers: res.headers,
  });
};
