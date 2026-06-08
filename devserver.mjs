// Local dev/test server — mirrors the Cloudflare Pages Functions (KV = in-memory Map).
// NOT deployed. Test the vanity short-link + OG flow locally:  node devserver.mjs
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { RESERVED } from "./functions/_reserved.js";

const ROOT = process.cwd();
const PORT = 8766;
const KV = new Map(); // slug -> jsonStr ;  "img:"+slug -> Buffer(png)
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".json": "application/json" };
const SUFFIX_CHARS = "abcdefghijkmnpqrstuvwxyz23456789";
const SLUG_RE = /^[a-z0-9-]{2,40}$/;

const cleanHandle = h => String(h || "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30).replace(/-+$/, "");
const suffix = n => { let s = ""; const b = new Uint8Array(n); crypto.getRandomValues(b); for (const x of b) s += SUFFIX_CHARS[x % SUFFIX_CHARS.length]; return s; };
const newToken = () => { let s = ""; const c = "abcdefghijklmnopqrstuvwxyz0123456789", b = new Uint8Array(24); crypto.getRandomValues(b); for (const x of b) s += c[x % c.length]; return s; };
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
    let slug, token;
    if (body.slug && body.editToken) {
      if (!SLUG_RE.test(body.slug)) return send(res, 400, '{"error":"bad slug"}', { "content-type": "application/json" });
      const existing = KV.get(body.slug); if (!existing) return send(res, 404, '{"error":"not found"}', { "content-type": "application/json" });
      const prev = JSON.parse(existing); if (prev.t !== body.editToken) return send(res, 403, '{"error":"forbidden"}', { "content-type": "application/json" });
      slug = body.slug; token = prev.t;
    } else {
      let root = cleanHandle(data.handle); if (root.length < 2) root = "broke";
      const taken = s => RESERVED.has(s) || KV.has(s);
      slug = root;
      if (taken(slug)) { for (let i = 0; i < 8; i++) { slug = `${root}-${suffix(i < 4 ? 3 : 5)}`; if (!taken(slug)) break; } }
      token = newToken();
    }
    data.handle = slug; // keep the displayed handle == the real URL
    KV.set(slug, JSON.stringify({ d: data, m: body.meta || {}, t: token }));
    const PRE = "data:image/png;base64,";
    if (typeof body.img === "string" && body.img.startsWith(PRE)) KV.set("img:" + slug, Buffer.from(body.img.slice(PRE.length), "base64"));
    return send(res, 200, JSON.stringify({ slug, editToken: token }), { "content-type": "application/json" });
  }

  if (path === "/api/msgs") {
    const sp = new URL(req.url, "http://localhost").searchParams;
    if (req.method === "GET") {
      const slug = sp.get("slug") || ""; if (!SLUG_RE.test(slug)) return send(res, 400, '{"error":"bad slug"}', { "content-type": "application/json" });
      let arr = []; try { arr = JSON.parse(KV.get("msg:" + slug) || "[]"); } catch {}
      return send(res, 200, JSON.stringify({ messages: Array.isArray(arr) ? arr : [] }), { "content-type": "application/json" });
    }
    if (req.method === "POST") {
      const chunks = []; for await (const c of req) chunks.push(c);
      let body; try { body = JSON.parse(Buffer.concat(chunks).toString()); } catch { return send(res, 400, '{"error":"bad json"}', { "content-type": "application/json" }); }
      const slug = String(body.slug || ""); if (!SLUG_RE.test(slug)) return send(res, 400, '{"error":"bad slug"}', { "content-type": "application/json" });
      const pageRaw = KV.get(slug); if (!pageRaw) return send(res, 404, '{"error":"no such page"}', { "content-type": "application/json" });
      const key = "msg:" + slug; let arr = []; try { arr = JSON.parse(KV.get(key) || "[]"); if (!Array.isArray(arr)) arr = []; } catch {}
      if (body.del != null) {
        const page = JSON.parse(pageRaw); if (page.t !== body.editToken) return send(res, 403, '{"error":"forbidden"}', { "content-type": "application/json" });
        arr = arr.filter(x => x.id !== String(body.del)); KV.set(key, JSON.stringify(arr));
        return send(res, 200, JSON.stringify({ ok: true, messages: arr }), { "content-type": "application/json" });
      }
      const text = String(body.text || "").trim().slice(0, 140); if (!text) return send(res, 400, '{"error":"empty"}', { "content-type": "application/json" });
      if (/https?:\/\/|www\./i.test(text)) return send(res, 400, '{"error":"no links allowed"}', { "content-type": "application/json" });
      const name = String(body.name || "").trim().slice(0, 24) || "anon";
      const c = "abcdefghijkmnpqrstuvwxyz23456789", b = new Uint8Array(6); crypto.getRandomValues(b); let mid = ""; for (const x of b) mid += c[x % c.length];
      const msg = { id: mid, n: name, t: text }; arr.unshift(msg); if (arr.length > 100) arr = arr.slice(0, 100);
      KV.set(key, JSON.stringify(arr));
      return send(res, 200, JSON.stringify({ ok: true, message: msg }), { "content-type": "application/json" });
    }
  }

  if (path === "/api/ai" && req.method === "POST") {
    // mock (no Workers AI locally) — real model runs on Cloudflare / via `wrangler pages dev`
    return send(res, 200, JSON.stringify({ text: "I had a budget. The budget had other plans.\nNow I'm rich in regret and ramen. (mock AI)" }), { "content-type": "application/json" });
  }

  if (path === "/api/get" && req.method === "GET") {
    const slug = new URL(req.url, "http://localhost").searchParams.get("slug") || "";
    if (!SLUG_RE.test(slug)) return send(res, 400, '{"error":"bad slug"}', { "content-type": "application/json" });
    const raw = KV.get(slug); if (!raw) return send(res, 404, '{"error":"not found"}', { "content-type": "application/json" });
    return send(res, 200, JSON.stringify({ data: JSON.parse(raw).d || null }), { "content-type": "application/json" });
  }

  if (path === "/api/wall") {
    const readList = () => { try { const a = JSON.parse(KV.get("wall:featured") || "[]"); return Array.isArray(a) ? a : []; } catch { return []; } };
    if (req.method === "GET") {
      const cards = [];
      for (const slug of readList()) {
        const raw = KV.get(slug); if (!raw) continue;
        let d; try { d = JSON.parse(raw).d; } catch { d = null; } if (!d) continue;
        const first = Array.isArray(d.links) && d.links[0] ? d.links[0] : null;
        cards.push({ slug, name: d.name || "Someone broke", handle: d.handle || slug, status: d.status || "ramen", emoji: typeof d.emoji === "string" ? d.emoji : "", goal: Number(d.goal) || 0, raised: Number(d.raised) || 0, link: first ? { kind: first.kind || "custom", label: first.label || "" } : null });
      }
      return send(res, 200, JSON.stringify({ cards }), { "content-type": "application/json" });
    }
    if (req.method === "POST") {
      let body = {}; try { body = JSON.parse(await new Promise(r => { let s = ""; req.on("data", c => s += c); req.on("end", () => r(s || "{}")); })); } catch {}
      if (body.token !== "dev") return send(res, 403, '{"error":"forbidden (dev token: dev)"}', { "content-type": "application/json" });
      let list = readList();
      if (Array.isArray(body.set)) list = body.set.filter(s => SLUG_RE.test(s));
      else if (body.add && SLUG_RE.test(body.add)) list = [body.add, ...list.filter(x => x !== body.add)];
      else if (body.remove) list = list.filter(x => x !== body.remove);
      KV.set("wall:featured", JSON.stringify(list.slice(0, 24)));
      return send(res, 200, JSON.stringify({ featured: list }), { "content-type": "application/json" });
    }
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
