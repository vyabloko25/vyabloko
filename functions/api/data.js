import { json, requireAuth, DEFAULT_DOC } from "../_shared.js";

export async function onRequestGet({ env }) {
  try {
    const row = await env.DB.prepare("SELECT json FROM site WHERE id=1").first();
    if (row && row.json) return json(JSON.parse(row.json), 200, { "cache-control": "no-store" });
  } catch (e) {}
  return json(DEFAULT_DOC(), 200, { "cache-control": "no-store" });
}

export async function onRequestPut({ request, env }) {
  if (!(await requireAuth(request, env))) return json({ error: "auth" }, 401);
  const body = await request.json().catch(() => null);
  if (!body || !body.settings) return json({ error: "bad body" }, 400);
  const str = JSON.stringify(body);
  await env.DB.prepare(
    "INSERT INTO site (id, json) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET json=excluded.json"
  ).bind(str).run();
  return json({ ok: true });
}
