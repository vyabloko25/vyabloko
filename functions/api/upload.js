import { json, requireAuth } from "../_shared.js";

export async function onRequestPost({ request, env }) {
  if (!(await requireAuth(request, env))) return json({ error: "auth" }, 401);
  const body = await request.json().catch(() => null);
  if (!body || !body.dataUrl) return json({ error: "no data" }, 400);
  const m = /^data:([^;]+);base64,(.*)$/s.exec(body.dataUrl);
  if (!m) return json({ error: "bad data url" }, 400);
  const mime = m[1];
  const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
  const ext = mime.indexOf("png") > -1 ? "png" : mime.indexOf("webp") > -1 ? "webp" : mime.indexOf("svg") > -1 ? "svg" : "jpg";
  const key = "w/" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8) + "." + ext;
  await env.BUCKET.put(key, bytes, { httpMetadata: { contentType: mime } });
  return json({ key, url: "/img/" + key });
}
