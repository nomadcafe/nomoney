// Local dev/test server — mirrors the Cloudflare Pages Functions (KV = in-memory Map).
// NOT deployed. Test the vanity short-link + OG flow locally:  node devserver.mjs
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const ROOT = process.cwd();
const PORT = 8766;
const KV = new Map(); // slug -> jsonStr ;  "img:"+slug -> Buffer(png)
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".json": "application/json" };
const SUFFIX_CHARS = "abcdefghijkmnpqrstuvwxyz23456789";
const RESERVED = new Set(["create", "index", "p", "s", "og", "api", "assets", "about", "terms", "privacy", "robots", "sitemap", "favicon", "admin", "static", "public", "new", "edit", "settings", "help", "login", "signup", "you", "www", "app", "blog", "docs"]);
const SLUG_RE = /^[a-z0-9-]{2,40}$/;

const cleanHandle = h => String(h || "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30).replace(/-+$/, "");
const suffix = n => { let s = ""; const b = new Uint8Array(n); crypto.getRandomValues(b); for (const x of b) s += SUFFIX_CHARS[x % SUFFIX_CHARS.length]; return s; };
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const send = (res, status, body, headers = {}) => { res.writeHead(status, headers); res.end(body); };

function renderPage(html, id, host) {
  const stored = JSON.parse(KV.get(id)), data = stored.d || {}, meta = stored.m || {};
  const origin = `http://${host}`, ogImg = `${origin}/og/${id}`, pageUrl = `${origin}/${id}`;
  const title = meta.title || `${data.name || "Someone"} is broke · No Money`;
  const desc = meta.desc || "Help them become slightly less broke.";
  html = html.replace("<head>", '<head><base href="/">');
  html = html.replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>`);
  const inject = `<link rel="canonical" href="${esc(pageUrl)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${esc(ogImg)}"><meta property="og:url" content="${esc(pageUrl)}"><meta property="og:type" content="profile"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(ogImg)}"><script>window.__PAGE__=${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
  return html.replace("</head>", inject + "</head>");
}

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  let m;

  if (path === "/api/save" && req.method === "POST") {
    const chunks = []; for await (const c of req) chunks.push(c);
    let body; try { body = JSON.parse(Buffer.concat(chunks).toString()); } catch { return send(res, 400, '{"error":"bad json"}', { "content-type": "application/json" }); }
    const data = body && body.data;
    if (!data || typeof data !== "object" || Array.isArray(data)) return send(res, 400, '{"error":"no data"}', { "content-type": "application/json" });
    let root = cleanHandle(data.handle); if (root.length < 2) root = "broke";
    const taken = s => RESERVED.has(s) || KV.has(s);
    let slug = root;
    if (taken(slug)) { for (let i = 0; i < 8; i++) { slug = `${root}-${suffix(i < 4 ? 3 : 5)}`; if (!taken(slug)) break; } }
    data.handle = slug; // keep the displayed handle == the real URL
    KV.set(slug, JSON.stringify({ d: data, m: body.meta || {} }));
    const PRE = "data:image/png;base64,";
    if (typeof body.img === "string" && body.img.startsWith(PRE)) KV.set("img:" + slug, Buffer.from(body.img.slice(PRE.length), "base64"));
    return send(res, 200, JSON.stringify({ slug }), { "content-type": "application/json" });
  }

  if ((m = path.match(/^\/og\/([a-z0-9-]{2,40})$/)) && req.method === "GET") {
    const png = KV.get("img:" + m[1]); if (!png) return send(res, 404, "not found");
    return send(res, 200, png, { "content-type": "image/png" });
  }

  // vanity slug /<handle>  (falls through to static if not a stored slug)
  if (req.method === "GET") {
    const seg = path.slice(1);
    if (seg && !seg.includes("/") && !seg.includes(".") && !RESERVED.has(seg) && SLUG_RE.test(seg) && KV.has(seg)) {
      const tpl = await readFile(join(ROOT, "p.html"), "utf8");
      return send(res, 200, renderPage(tpl, seg, req.headers.host), { "content-type": "text/html; charset=utf-8" });
    }
  }

  // static files
  let fp = path === "/" ? "/index.html" : path;
  fp = normalize(fp).replace(/^(\.\.[/\\])+/, "");
  try { const buf = await readFile(join(ROOT, fp)); send(res, 200, buf, { "content-type": TYPES[extname(fp)] || "application/octet-stream" }); }
  catch { send(res, 404, "not found"); }
}).listen(PORT, () => console.log(`dev server on http://localhost:${PORT}`));
