import { json } from "../_shared.js";

function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

export async function onRequestPost(context) {
  const { request, env } = context;
  const b = await request.json().catch(() => ({}));
  const subject = String(b.subject || "").slice(0, 200);
  const message = String(b.message || "").slice(0, 4000);
  const contact = String(b.contact || "").slice(0, 300);
  if (!message.trim() || !contact.trim()) return json({ error: "message and contact required" }, 400);

  let saved = false;
  try {
    await env.DB.prepare("CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, subject TEXT, message TEXT, contact TEXT, created_at INTEGER)").run();
    const id = "o_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    await env.DB.prepare("INSERT INTO orders (id, subject, message, contact, created_at) VALUES (?,?,?,?,?)").bind(id, subject, message, contact, Date.now()).run();
    saved = true;
  } catch (e) {}

  // Optional email notification via Resend
  if (env.RESEND_API_KEY) {
    let to = env.NOTIFY_EMAIL || "";
    if (!to) { try { const row = await env.DB.prepare("SELECT json FROM site WHERE id=1").first(); if (row && row.json) { const d = JSON.parse(row.json); to = (d.settings && d.settings.contact && d.settings.contact.email) || ""; } } catch (e) {} }
    if (to) {
      const html = "<p><b>Topic:</b> " + esc(subject || "\u2014") + "</p><p><b>Message:</b><br>" + esc(message).replace(/\n/g, "<br>") + "</p><p><b>Contact:</b> " + esc(contact) + "</p>";
      const payload = { from: "vyabloko.art <onboarding@resend.dev>", to: [to], subject: "New request from vyabloko.art" + (subject ? (" \u2014 " + subject) : ""), html };
      if (contact.indexOf("@") > -1) payload.reply_to = contact;
      const send = fetch("https://api.resend.com/emails", { method: "POST", headers: { "Authorization": "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (context.waitUntil) context.waitUntil(send.catch(() => {})); else try { await send; } catch (e) {}
    }
  }

  if (!saved) return json({ error: "save failed" }, 500);
  return json({ ok: true });
}
