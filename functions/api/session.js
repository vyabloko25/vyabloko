import { json, requireAuth } from "../_shared.js";

export async function onRequestGet({ request, env }) {
  return json({ auth: await requireAuth(request, env) });
}
