import { json, makeToken } from "../_shared.js";

export async function onRequestPost({ request, env }) {
  const b = await request.json().catch(() => ({}));
  const pw = (b && b.password) || "";
  if (!env.ADMIN_PASSWORD || pw !== env.ADMIN_PASSWORD) return json({ ok: false }, 401);
  const token = await makeToken(env.AUTH_SECRET || "dev-secret");
  return json({ ok: true }, 200, {
    "Set-Cookie": `session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`,
  });
}
