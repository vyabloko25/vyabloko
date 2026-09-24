export async function onRequestGet({ params, env }) {
  const key = Array.isArray(params.key) ? params.key.join("/") : params.key;
  const obj = await env.BUCKET.get(key);
  if (!obj) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  headers.set("content-type", (obj.httpMetadata && obj.httpMetadata.contentType) || "application/octet-stream");
  headers.set("cache-control", "public, max-age=31536000, immutable");
  if (obj.httpEtag) headers.set("etag", obj.httpEtag);
  return new Response(obj.body, { headers });
}
