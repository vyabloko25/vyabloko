import { json } from "../_shared.js";

export async function onRequestPost({ request, env }) {
  const b = await request.json().catch(() => ({}));
  const email = String(b.email || "").trim().slice(0, 200);
  if (email.indexOf("@") < 1) return json({ error: "bad email" }, 400);
  try {
    await env.DB.prepare("CREATE TABLE IF NOT EXISTS subscribers (email TEXT PRIMARY KEY, created_at INTEGER)").run();
    await env.DB.prepare("INSERT OR IGNORE INTO subscribers (email, created_at) VALUES (?,?)").bind(email, Date.now()).run();
  } catch (e) { return json({ error: "save failed" }, 500); }
  return json({ ok: true });
}
