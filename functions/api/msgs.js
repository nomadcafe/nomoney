// Support messages ("wall of pity") for a page.
//   GET  /api/msgs?slug=<slug>                      -> { messages: [{id,n,t}] }
//   POST /api/msgs  { slug, name, text }            -> add a message
//   POST /api/msgs  { slug, editToken, del: <id> }  -> owner deletes a message
// KV: "msg:"+slug -> JSON array (newest first). Page must exist.

import { patchIndexEntry } from "../_page.js";

const SLUG_RE = /^[a-z0-9-]{2,40}$/;
const MAX_TEXT = 140;
const MAX_NAME = 24;
const MAX_MSGS = 100;

// Per-IP daily cap on posting. Without one the wall is a free defacement tool:
// MAX_MSGS + unshift means 100 posts silently push every real message off someone's
// page, and each post costs KV writes we can't spare.
// Deliberately loose. Mobile carriers put thousands of people behind one egress IP,
// and the moment this cap matters most is a page going viral on phones — blocking real
// supporters there costs more than letting a vandal through, whose damage is repairable
// (the owner can delete any message, and duplicates are rejected outright).
const POST_PER_DAY = 40;
const RL_TTL = 172800;        // counters self-expire after 2 days

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}
const id6 = () => {
  const c = "abcdefghijkmnpqrstuvwxyz23456789", b = new Uint8Array(6);
  crypto.getRandomValues(b); let s = ""; for (const x of b) s += c[x % c.length]; return s;
};

export async function onRequestGet({ request, env }) {
  if (!env.PAGES) return json({ error: "storage not configured" }, 500);
  const slug = new URL(request.url).searchParams.get("slug") || "";
  if (!SLUG_RE.test(slug)) return json({ error: "bad slug" }, 400);
  let arr = [];
  try { arr = JSON.parse(await env.PAGES.get("msg:" + slug) || "[]"); } catch { arr = []; }
  return json({ messages: Array.isArray(arr) ? arr : [] });
}

export async function onRequestPost({ request, env }) {
  if (!env.PAGES) return json({ error: "storage not configured" }, 500);
  let body;
  try { body = await request.json(); } catch { return json({ error: "bad json" }, 400); }

  const slug = String(body.slug || "");
  if (!SLUG_RE.test(slug)) return json({ error: "bad slug" }, 400);

  const pageRaw = await env.PAGES.get(slug);
  if (!pageRaw) return json({ error: "no such page" }, 404);

  const key = "msg:" + slug;
  let arr = [];
  try { arr = JSON.parse(await env.PAGES.get(key) || "[]"); if (!Array.isArray(arr)) arr = []; } catch { arr = []; }

  // owner deletes a message (needs the page's edit token)
  if (body.del != null) {
    let page; try { page = JSON.parse(pageRaw); } catch { page = null; }
    if (!page || page.t !== body.editToken) return json({ error: "forbidden" }, 403);
    arr = arr.filter(m => m.id !== String(body.del));
    await env.PAGES.put(key, JSON.stringify(arr));
    await patchIndexEntry(env, slug, { msgs: arr.length });   // keep admin count live
    return json({ ok: true, messages: arr });
  }

  // add a message
  const text = String(body.text || "").trim().slice(0, MAX_TEXT);
  if (!text) return json({ error: "empty" }, 400);
  if (/https?:\/\/|www\./i.test(text)) return json({ error: "no links allowed" }, 400); // anti-spam
  const name = String(body.name || "").trim().slice(0, MAX_NAME) || "anon";

  // don't let the same line be posted twice — kills the cheapest flood (repeat-send)
  // and the double-submit from an impatient tap, at zero extra cost (arr is in hand)
  const norm = text.toLowerCase();
  if (arr.some(m => String(m.t || "").toLowerCase() === norm)) return json({ error: "duplicate" }, 409);

  // per-IP daily cap (deletes are exempt — they need the owner's token). Best-effort
  // KV counter like save.js: eventual consistency lets a tight burst slip, which is
  // fine for an abuse cap that no real signer will ever reach.
  const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
  const rlKey = `mrl:${ip}:${new Date().toISOString().slice(0, 10)}`;
  let sent = 0;
  try { sent = +(await env.PAGES.get(rlKey)) || 0; } catch {}
  if (sent >= POST_PER_DAY) return json({ error: "rate limited" }, 429);

  const msg = { id: id6(), n: name, t: text };
  arr.unshift(msg);                 // newest first
  if (arr.length > MAX_MSGS) arr = arr.slice(0, MAX_MSGS);
  await env.PAGES.put(key, JSON.stringify(arr));
  try { await env.PAGES.put(rlKey, String(sent + 1), { expirationTtl: RL_TTL }); } catch {}
  // Only refresh the admin index on the 1st message and every 5th after. patchIndexEntry
  // rewrites the whole pages:recent array (up to 1000 entries) on a single hot key that
  // KV caps at ~1 write/sec — doing it per message made the busiest page the bottleneck
  // for every page. The count is a traction signal, not a ledger; Rebuild makes it exact.
  if (arr.length === 1 || arr.length % 5 === 0) await patchIndexEntry(env, slug, { msgs: arr.length });
  return json({ ok: true, message: msg });
}
