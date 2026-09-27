import { json, requireAuth, currentPasswordOK, sha256hex, randHex } from "../_shared.js";

export async function onRequestPost({ request, env }) {
  if (!(await requireAuth(request, env))) return json({ error: "auth" }, 401);
  const b = await request.json().catch(() => ({}));
  const oldp = (b && b.oldPassword) || "";
  const newp = (b && b.newPassword) || "";
  if (newp.length < 4) return json({ error: "New password too short (min 4)." }, 400);
  if (!(await currentPasswordOK(oldp, env))) return json({ error: "Current password is wrong." }, 401);
  const salt = randHex(16);
  const hash = await sha256hex(salt + ":" + newp);
  await env.DB.prepare("INSERT INTO site (id, json) VALUES (2, ?) ON CONFLICT(id) DO UPDATE SET json=excluded.json")
    .bind(JSON.stringify({ salt, hash })).run();
  return json({ ok: true });
}
