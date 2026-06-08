// POST /api/save — store a broke page + its share image under a vanity slug (no.money/<handle>).
// Body: { data: <pageObject>, img?: "data:image/png;base64,...", meta?: { title, desc } }
// KV layout:  slug -> JSON.stringify({ d: data, m: meta }) ;  "img:"+slug -> PNG bytes

import { RESERVED } from "../_reserved.js";

const SUFFIX_CHARS = "abcdefghijkmnpqrstuvwxyz23456789"; // no 0/o/1/l ambiguity
const MAX_JSON = 8000;        // page JSON cap
const MAX_PNG = 900_000;      // ~0.9 MB share image cap
const MAX_HANDLE = 30;

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

function suffix(n) {
  const buf = new Uint8Array(n);
  crypto.getRandomValues(buf);
  let s = "";
  for (let i = 0; i < n; i++) s += SUFFIX_CHARS[buf[i] % SUFFIX_CHARS.length];
  return s;
}

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

  // vanity slug from the handle; append a short suffix if reserved or taken
  let root = cleanHandle(data.handle);
  if (root.length < 2) root = "broke";

  const taken = async (s) => RESERVED.has(s) || !!(await env.PAGES.get(s));
  let slug = root;
  if (await taken(slug)) {
    for (let i = 0; i < 8; i++) {
      slug = `${root}-${suffix(i < 4 ? 3 : 5)}`;
      if (!(await taken(slug))) break;
    }
  }

  // make the handle shown on the page match the real URL (it may have gained a -suffix)
  data.handle = slug;

  const jsonStr = JSON.stringify({ d: data, m: (body.meta && typeof body.meta === "object") ? body.meta : {} });
  if (jsonStr.length > MAX_JSON) return json({ error: "too large" }, 413);

  await env.PAGES.put(slug, jsonStr);
  if (png) await env.PAGES.put("img:" + slug, png);

  return json({ slug });
}
