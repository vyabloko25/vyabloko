export async function onRequestGet(context) {
  const { request, env, params } = context;
  const key = Array.isArray(params.key) ? params.key.join("/") : params.key;

  // Header-independent cache key (a plain URL string) so even a hard refresh
  // (Cache-Control: no-cache) is still served from the edge cache, not R2.
  const cacheKey = new URL(request.url).toString();
  const cache = caches.default;
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  const obj = await env.BUCKET.get(key);
  if (!obj) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  headers.set("content-type", (obj.httpMetadata && obj.httpMetadata.contentType) || "application/octet-stream");
  headers.set("cache-control", "public, max-age=31536000, immutable");
  if (obj.httpEtag) headers.set("etag", obj.httpEtag);

  const resp = new Response(obj.body, { headers });
  context.waitUntil(cache.put(cacheKey, resp.clone()));
  return resp;
}
