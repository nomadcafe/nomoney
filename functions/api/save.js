// POST /api/save — create OR edit a broke page + its share image.
// Create body: { data, img?, meta? } -> derives a vanity slug, returns { slug, editToken }.
// Edit body:   { data, img?, meta?, slug, editToken } -> overwrites that slug if the token matches.
// KV layout:  slug -> JSON.stringify({ d: data, m: meta, t: editToken }) ;  "img:"+slug -> PNG bytes
// The editToken is never exposed by the public GET routes — only returned here to the creator.

import { RESERVED } from "../_reserved.js";
import { indexEntry } from "../_page.js";

const SUFFIX_CHARS = "abcdefghijkmnpqrstuvwxyz23456789"; // no 0/o/1/l ambiguity
const TOKEN_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
const MAX_JSON = 8000;        // page JSON cap
const MAX_PNG = 900_000;      // ~0.9 MB share image cap
const MAX_HANDLE = 30;
const SLUG_RE = /^[a-z0-9-]{2,40}$/;

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}

function cleanHandle(h) {
  return String(h || "").toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_HANDLE)
    .replace(/-+$/, "");
}

function randStr(chars, n) {
  const buf = new Uint8Array(n);
  crypto.getRandomValues(buf);
  let s = "";
  for (let i = 0; i < n; i++) s += chars[buf[i] % chars.length];
  return s;
}
const suffix = n => randStr(SUFFIX_CHARS, n);
const newToken = () => randStr(TOKEN_CHARS, 24); // ~124 bits, unguessable

export async function onRequestPost({ request, env }) {
  if (!env.PAGES) return json({ error: "storage not configured" }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ error: "bad json" }, 400); }

  const data = body && body.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return json({ error: "no data" }, 400);

  // optional share image (PNG data URL produced by the browser canvas)
  let png = null;
  const PREFIX = "data:image/png;base64,";
  if (typeof body.img === "string" && body.img.startsWith(PREFIX)) {
    try {
      const bin = atob(body.img.slice(PREFIX.length));
      if (bin.length > MAX_PNG) return json({ error: "image too large" }, 413);
      png = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) png[i] = bin.charCodeAt(i);
    } catch { png = null; }
  }

  let slug, token, prevMeta = null;
  const isEdit = !!(body.slug && body.editToken);

  if (isEdit) {
    // EDIT mode — keep the same slug; require a matching token
    if (!SLUG_RE.test(body.slug)) return json({ error: "bad slug" }, 400);
    const existing = await env.PAGES.get(body.slug);
    if (!existing) return json({ error: "not found" }, 404);
    let prev; try { prev = JSON.parse(existing); } catch { prev = null; }
    if (!prev || prev.t !== body.editToken) return json({ error: "forbidden" }, 403);
    slug = body.slug;
    token = prev.t;            // keep the original token
    prevMeta = (prev.m && typeof prev.m === "object") ? prev.m : null;
  } else {
    // CREATE mode — vanity slug from the handle; suffix if reserved or taken
    let root = cleanHandle(data.handle);
    if (root.length < 2) root = "broke";
    const taken = async (s) => RESERVED.has(s) || !!(await env.PAGES.get(s));
    slug = root;
    if (await taken(slug)) {
      for (let i = 0; i < 8; i++) {
        slug = `${root}-${suffix(i < 4 ? 3 : 5)}`;
        if (!(await taken(slug))) break;
      }
    }
    token = newToken();
  }

  // the handle shown on the page always matches the real URL (slug)
  data.handle = slug;

  // timestamps are server-owned (never trusted from the client). createdAt is set
  // once and preserved across edits; updatedAt moves every save.
  const now = new Date().toISOString();
  const meta = (body.meta && typeof body.meta === "object") ? body.meta : {};
  meta.createdAt = (prevMeta && prevMeta.createdAt) || now;
  meta.updatedAt = now;

  const jsonStr = JSON.stringify({ d: data, m: meta, t: token });
  if (jsonStr.length > MAX_JSON) return json({ error: "too large" }, 413);

  await env.PAGES.put(slug, jsonStr);
  if (png) await env.PAGES.put("img:" + slug, png);

  // maintain the recent/activity index for /admin — on create AND edit, so the
  // index reflects real activity. Best-effort; admin can also rebuild from KV.
  try {
    let recent = [];
    try { recent = JSON.parse((await env.PAGES.get("pages:recent")) || "[]"); } catch {}
    recent = (Array.isArray(recent) ? recent : []).filter(r => r && r.slug !== slug);
    recent.unshift(indexEntry(slug, data, meta));   // newest activity first
    if (recent.length > 1000) recent = recent.slice(0, 1000);
    await env.PAGES.put("pages:recent", JSON.stringify(recent));
  } catch (e) { /* index is best-effort */ }

  return json({ slug, editToken: token });
}
