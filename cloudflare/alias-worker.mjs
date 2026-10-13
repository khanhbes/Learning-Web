export async function proxy(request, env, fetcher = fetch) {
  const incoming = new URL(request.url);
  if (!/^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/.test(env.UPSTREAM ?? ""))
    return new Response("BytePath upstream is not configured.", {
      status: 503,
    });
  if (env.PUBLIC_ORIGIN && incoming.origin !== env.PUBLIC_ORIGIN)
    return new Response("Unknown BytePath hostname.", { status: 403 });
  const origin = request.headers.get("Origin");
  if (origin && origin !== incoming.origin)
    return new Response(JSON.stringify({ error: "Origin không được phép." }), {
      status: 403,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  const upstream = new URL(env.UPSTREAM);
  const target = new URL(request.url);
  target.host = upstream.host;
  target.protocol = upstream.protocol;
  const headers = new Headers(request.headers);
  headers.delete("Host");
  try {
    const response = await fetcher(
      new Request(target, {
        method: request.method,
        headers,
        body: ["GET", "HEAD"].includes(request.method)
          ? undefined
          : request.body,
        redirect: "manual",
        duplex: "half",
      }),
      { cf: { cacheTtl: 0, cacheEverything: false } },
    );
    const outgoing = new Headers(response.headers);
    if (
      incoming.pathname.startsWith("/api/") ||
      incoming.pathname.startsWith("/sources/")
    )
      outgoing.set("Cache-Control", "private, no-store");
    const location = outgoing.get("Location");
    if (location) {
      const redirect = new URL(location, env.UPSTREAM);
      if (redirect.origin === env.UPSTREAM)
        outgoing.set(
          "Location",
          incoming.origin + redirect.pathname + redirect.search + redirect.hash,
        );
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: outgoing,
    });
  } catch {
    return new Response(
      JSON.stringify({
        error:
          "BytePath trên máy đang offline. Bật máy và chạy Start Public BytePath.cmd.",
      }),
      {
        status: 503,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
export default {
  fetch(request, env) {
    return proxy(request, env);
  },
};
