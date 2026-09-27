export async function onRequest(context) {
  const { request, env, next } = context;
  const res = await next();
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("text/html")) return res;

  let s = {}, works = [];
  try {
    const row = await env.DB.prepare("SELECT json FROM site WHERE id=1").first();
    if (row && row.json) {
      const d = JSON.parse(row.json);
      s = d.settings || {};
      works = (d.works || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
    }
  } catch (e) {}

  const origin = new URL(request.url).origin;
  const base = "https://img.vyabloko.art";
  const t = s.theme || {};
  const hid = t.heroWorkId || "";
  const feat = (hid && works.find((w) => w.id === hid)) || works[0];
  let img = (feat && feat.image) || (s.about && s.about.photo) || "";
  if (img) {
    if (img.indexOf("/img/") === 0) img = base + img.slice(4);
    else if (img.charAt(0) === "/") img = origin + img;
  }
  const title = s.siteName || "Vasily Yablokov";
  const desc = s.subtitle || "";
  const esc = (x) => String(x == null ? "" : x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  let tags =
    '<meta property="og:type" content="website">' +
    '<meta property="og:site_name" content="' + esc(title) + '">' +
    '<meta property="og:title" content="' + esc(title) + '">' +
    (desc ? '<meta property="og:description" content="' + esc(desc) + '">' : "") +
    (img ? '<meta property="og:image" content="' + esc(img) + '">' : "") +
    '<meta property="og:url" content="' + esc(origin) + '">' +
    '<meta name="twitter:card" content="summary_large_image">' +
    '<meta name="twitter:title" content="' + esc(title) + '">' +
    (desc ? '<meta name="twitter:description" content="' + esc(desc) + '">' : "") +
    (img ? '<meta name="twitter:image" content="' + esc(img) + '">' : "");

  return new HTMLRewriter()
    .on('meta[property^="og:"]', { element(el) { el.remove(); } })
    .on('meta[name^="twitter:"]', { element(el) { el.remove(); } })
    .on("head", { element(el) { el.append(tags, { html: true }); } })
    .transform(res);
}
