import { json, requireAuth } from "../_shared.js";
async function ensure(env){ await env.DB.prepare("CREATE TABLE IF NOT EXISTS subscribers (email TEXT PRIMARY KEY, created_at INTEGER)").run(); }
export async function onRequestGet({ request, env }) {
  if (!(await requireAuth(request, env))) return json({ error: "auth" }, 401);
  try { await ensure(env); const rs = await env.DB.prepare("SELECT * FROM subscribers ORDER BY created_at DESC LIMIT 5000").all(); return json({ subscribers: rs.results || [] }); }
  catch (e) { return json({ subscribers: [] }); }
}
export async function onRequestDelete({ request, env }) {
  if (!(await requireAuth(request, env))) return json({ error: "auth" }, 401);
  const email = new URL(request.url).searchParams.get("email");
  if (email) { try { await ensure(env); await env.DB.prepare("DELETE FROM subscribers WHERE email=?").bind(email).run(); } catch (e) {} }
  return json({ ok: true });
}
