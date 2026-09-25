// Shared helpers for Pages Functions (Cloudflare Workers runtime)

export function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...extra },
  });
}

function b64url(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return b64url(new Uint8Array(sig));
}

export async function makeToken(secret) {
  const exp = Date.now() + 2592000000; // 30 days
  const sig = await hmac(secret, String(exp));
  return exp + "." + sig;
}

function safeEq(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function verifyToken(secret, token) {
  if (!token) return false;
  const i = token.indexOf(".");
  if (i < 1) return false;
  const exp = token.slice(0, i);
  const sig = token.slice(i + 1);
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  const good = await hmac(secret, exp);
  return safeEq(sig, good);
}

function cookie(req, name) {
  const c = req.headers.get("Cookie") || "";
  const m = c.match(new RegExp("(?:^|; )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[1]) : null;
}

export async function requireAuth(req, env) {
  return await verifyToken(env.AUTH_SECRET || "dev-secret", cookie(req, "session"));
}

// Default document returned when the database is still empty.
export function DEFAULT_DOC() {
  return {
    settings: {
      siteName: "Vasily Yablokov",
      role: "Artist",
      subtitle: "Experimental artist from Berlin",
      domain: "vyabloko.art",
      labels: { work: "Work", about: "About", contact: "Contact", signup: "Get updates by email" },
      theme: { accent: "#3B5C4A", columns: 3, showSignup: true, textSize: "M", font: "editorial", logo: "\uD83C\uDF4F", favicon: "\uD83C\uDF4F", faviconImg: "" },
      about: {
        photo: "",
        photoPos: { x: 50, y: 50 },
        intro: "Hi! I'm Vasily. This is where I keep my work \u2014 what I'm making now, and what has already found its viewers.",
        body: "I work with form, colour and everyday subjects. If something here speaks to you, write to me.\n\n(Placeholder text \u2014 edit it from the cabinet.)",
      },
      cv: {
        exhibitions: [{ year: "2025", text: "Solo exhibition \u2014 Title, City" }],
        press: [],
        teaching: [],
        collectives: [],
      },
      tags: ["Portrait", "Landscape", "Still life", "Abstract"],
      mediums: ["Oil", "Acrylic", "Gouache", "Watercolour", "Ink", "Coloured pencil", "Graphite", "Charcoal", "Linocut", "Mixed media"],
      supports: ["Canvas", "Linen canvas", "Unstretched canvas", "Paper", "Wood panel", "Board", "Ceramic", "Wall"],
      contact: {
        instagram: "vyabloko.art",
        instagramUrl: "https://instagram.com/vyabloko.art",
        email: "vasily.yablokov@gmail.com",
        note: "Get in touch about a piece, a commission or a show \u2014 or follow along on Instagram.",
      },
    },
    works: [],
  };
}
