import { json, requireAuth } from "../_shared.js";
function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!(await requireAuth(request, env))) return json({ error: "auth" }, 401);
  const b = await request.json().catch(() => ({}));
  const subject = String(b.subject || "").slice(0, 200) || "New work — vyabloko.art";
  const message = String(b.message || "").slice(0, 8000);
  if (!message.trim()) return json({ error: "message required" }, 400);
  if (!env.RESEND_API_KEY) return json({ error: "Email not configured: add RESEND_API_KEY (and verify a domain in Resend to send to others)." }, 400);
  const from = env.FROM_EMAIL || "";
  if (!from) return json({ error: "Set FROM_EMAIL to a verified Resend sender (e.g. Vasily <hello@vyabloko.art>). onboarding@resend.dev can only email your own account, not subscribers." }, 400);

  let subs = [];
  try { await env.DB.prepare("CREATE TABLE IF NOT EXISTS subscribers (email TEXT PRIMARY KEY, created_at INTEGER)").run(); const rs = await env.DB.prepare("SELECT email FROM subscribers LIMIT 2000").all(); subs = (rs.results || []).map(function(r){ return r.email; }); } catch (e) {}
  if (!subs.length) return json({ error: "No subscribers yet." }, 400);

  const html = "<div style='font-family:Arial,sans-serif;font-size:15px;line-height:1.6'>" + esc(message).replace(/\n/g, "<br>") + "<p style='color:#888;font-size:12px;margin-top:24px'>You get this because you subscribed at vyabloko.art.</p></div>";
  let sent = 0;
  for (let i = 0; i < subs.length; i++) {
    try {
      const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { "Authorization": "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ from: from, to: [subs[i]], subject: subject, html: html }) });
      if (r.ok) sent++;
    } catch (e) {}
  }
  return json({ ok: true, sent: sent, total: subs.length });
}
