// POST /api/save — create OR edit a broke page + its share image.
// Create body: { data, img?, meta? } -> derives a vanity slug, returns { slug, editToken }.
// Edit body:   { data, img?, meta?, slug, editToken } -> overwrites that slug if the token matches.
// KV layout:  slug -> JSON.stringify({ d: data, m: meta, t: editToken }) ;  "img:"+slug -> PNG bytes
// The editToken is never exposed by the public GET routes — only returned here to the creator.

import { RESERVED } from "../_reserved.js";
import { indexEntry } from "../_page.js";
import { sanitizeLinks } from "../_links.js";

const SUFFIX_CHARS = "abcdefghijkmnpqrstuvwxyz23456789"; // no 0/o/1/l ambiguity
const TOKEN_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
const MAX_JSON = 8000;        // page JSON cap
const MAX_PNG = 900_000;      // ~0.9 MB share image cap
const MAX_AVATAR = 200_000;   // ~0.2 MB avatar cap (client downscales to a 256px JPEG)
const MAX_HANDLE = 30;
const SLUG_RE = /^[a-z0-9-]{2,40}$/;
const CREATE_PER_DAY = 30;    // per-IP daily create cap — generous: catches scripted
                              // abuse without ever touching real users or event wifi
const RL_TTL = 172800;        // counters self-expire after 2 days

// magic-byte sniff so a hand-crafted API call can't store non-image bytes that we'd
// then serve from our own domain (the browser-canvas flows always produce these)
const isJPEG = (b) => b && b.length > 3 && b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF;
const isPNG  = (b) => b && b.length > 7 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47;

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
    if (png && !isPNG(png)) return json({ error: "bad image" }, 415);
  }

  let slug, token, prevMeta = null, prevData = null;
  const isEdit = !!(body.slug && body.editToken);

  // rate-limit creation only — edits need a capability token, so they're not a spam
  // vector. Best-effort KV counter per IP per day; eventual consistency lets a tight
  // burst slip, which is fine for a generous abuse cap (not a security boundary).
  if (!isEdit) {
    const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
    const rlKey = `rl:${ip}:${new Date().toISOString().slice(0, 10)}`;
    let n = 0;
    try { n = +(await env.PAGES.get(rlKey)) || 0; } catch {}
    if (n >= CREATE_PER_DAY) return json({ error: "rate limited" }, 429);
    try { await env.PAGES.put(rlKey, String(n + 1), { expirationTtl: RL_TTL }); } catch {}
  }

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
    prevData = (prev.d && typeof prev.d === "object") ? prev.d : null;
  } else {
    // CREATE mode — vanity slug from the handle; suffix if reserved or taken
    let root = cleanHandle(data.handle);
    if (root.length < 2) root = "broke";
    const taken = async (s) => RESERVED.has(s) || !!(await env.PAGES.get(s));
    slug = root;
    if (await taken(slug)) {
      let free = false;
      for (let i = 0; i < 8; i++) {
        slug = `${root}-${suffix(i < 4 ? 3 : 5)}`;
        if (!(await taken(slug))) { free = true; break; }
      }
      // every candidate collided — falling through here would PUT over a stranger's
      // page and hand its slug a new edit token. Astronomically unlikely, silently
      // destructive; fail loudly instead.
      if (!free) return json({ error: "slug unavailable" }, 503);
    }
    token = newToken();
  }

  // the handle shown on the page always matches the real URL (slug)
  data.handle = slug;

  // clean the support links: safe schemes, ≤5, and no branded button (PayPal,
  // Ko-fi, …) pointing off-brand — that would let a page spoof a payment provider
  data.links = sanitizeLinks(data.links);
  // tipping is the whole point — a page with no working link is a wasted share. require one.
  if (!data.links.length) return json({ error: "no links" }, 400);

  // avatar photo — image bytes can't live in the 8 KB page JSON, so they're stored
  // out-of-band at "avatar:"+slug (like the share image at "img:"+slug) and served
  // by /av/:slug. data.av is a server-owned version flag (a cache-buster for the
  // immutable /av response); never trust a client-supplied one.
  delete data.av;
  const AV_PREFIX = "data:image/jpeg;base64,";
  let avatarBytes = null, removeAvatar = false;
  if (typeof body.avatar === "string" && body.avatar.startsWith(AV_PREFIX)) {
    try {
      const bin = atob(body.avatar.slice(AV_PREFIX.length));
      if (bin.length > MAX_AVATAR) return json({ error: "avatar too large" }, 413);
      avatarBytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) avatarBytes[i] = bin.charCodeAt(i);
    } catch { avatarBytes = null; }
    if (avatarBytes && !isJPEG(avatarBytes)) return json({ error: "bad image" }, 415);
  } else if (body.avatar === null) {
    removeAvatar = true;                       // explicit "remove my photo"
  }
  const prevAv = (prevData && typeof prevData.av === "string") ? prevData.av : "";
  if (avatarBytes) data.av = suffix(6);        // new photo → fresh version
  else if (!removeAvatar && prevAv) data.av = prevAv;  // untouched on edit → keep it

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
  if (avatarBytes) await env.PAGES.put("avatar:" + slug, avatarBytes);
  else if (removeAvatar) await env.PAGES.delete("avatar:" + slug);

  // viral-loop output: count every NEW page (not edits). Cold path — creates are
  // rare next to views, so this single global counter is fine here. Best-effort.
  if (!isEdit) {
    try {
      const n = (+(await env.PAGES.get("stat:creates")) || 0) + 1;
      await env.PAGES.put("stat:creates", String(n));
    } catch (e) { /* counter is best-effort */ }
  }

  // maintain the recent/activity index for /admin — on create AND edit, so the
  // index reflects real activity. Best-effort; admin can also rebuild from KV.
  try {
    // carry over the page's message count (only edits can have any; new pages have 0)
    let msgCount = 0;
    if (isEdit) {
      try { const ma = JSON.parse((await env.PAGES.get("msg:" + slug)) || "[]"); msgCount = Array.isArray(ma) ? ma.length : 0; } catch {}
    }
    let recent = [];
    try { recent = JSON.parse((await env.PAGES.get("pages:recent")) || "[]"); } catch {}
    recent = (Array.isArray(recent) ? recent : []).filter(r => r && r.slug !== slug);
    recent.unshift(indexEntry(slug, data, meta, msgCount));   // newest activity first
    if (recent.length > 1000) recent = recent.slice(0, 1000);
    await env.PAGES.put("pages:recent", JSON.stringify(recent));
  } catch (e) { /* index is best-effort */ }

  return json({ slug, editToken: token, av: data.av || null });
}
