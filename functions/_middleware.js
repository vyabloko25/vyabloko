// Injects title + Open Graph/Twitter meta into HTML responses, read from D1,
// so link previews in messengers (which read raw HTML, not JS) work and stay editable.

function attr(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function onRequest(context) {
  const { request, next, env } = context;
  const res = await next();
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("text/html")) return res;

  let s = null, works = [];
  try {
    const row = await env.DB.prepare("SELECT json FROM site WHERE id=1").first();
    if (row && row.json) {
      const doc = JSON.parse(row.json);
      s = doc.settings || {};
      works = doc.works || [];
    }
  } catch (e) {}
  if (!s) return res;

  const origin = new URL(request.url).origin;
  const title = s.siteName || "Portfolio";
  const desc = s.subtitle || (s.about && s.about.intro) || s.role || "";
  let img = (s.about && s.about.photo) || (works[0] && works[0].image) || "";
  if (img && img.charAt(0) === "/") img = origin + img;

  const tags =
    '<meta property="og:title" content="' + attr(title) + '">' +
    '<meta property="og:type" content="website">' +
    '<meta property="og:site_name" content="' + attr(title) + '">' +
    '<meta property="og:url" content="' + attr(origin + "/") + '">' +
    (desc ? '<meta property="og:description" content="' + attr(desc) + '">' : "") +
    (img ? '<meta property="og:image" content="' + attr(img) + '">' : "") +
    '<meta name="twitter:card" content="' + (img ? "summary_large_image" : "summary") + '">' +
    '<meta name="twitter:title" content="' + attr(title) + '">' +
    (desc ? '<meta name="twitter:description" content="' + attr(desc) + '">' : "") +
    (img ? '<meta name="twitter:image" content="' + attr(img) + '">' : "");

  return new HTMLRewriter()
    .on("title", { element(e) { e.setInnerContent(title); } })
    .on('meta[name="description"]', { element(e) { if (desc) e.setAttribute("content", desc); } })
    .on("head", { element(e) { e.append(tags, { html: true }); } })
    .transform(res);
}
