import { json, requireAuth } from "../_shared.js";

async function ensure(env) {
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, subject TEXT, message TEXT, contact TEXT, created_at INTEGER)").run();
}

export async function onRequestGet({ request, env }) {
  if (!(await requireAuth(request, env))) return json({ error: "auth" }, 401);
  try { await ensure(env); const rs = await env.DB.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 500").all(); return json({ orders: rs.results || [] }); }
  catch (e) { return json({ orders: [] }); }
}

export async function onRequestDelete({ request, env }) {
  if (!(await requireAuth(request, env))) return json({ error: "auth" }, 401);
  const id = new URL(request.url).searchParams.get("id");
  if (id) { try { await ensure(env); await env.DB.prepare("DELETE FROM orders WHERE id=?").bind(id).run(); } catch (e) {} }
  return json({ ok: true });
}
