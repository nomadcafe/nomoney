// Public "wall of broke" — a hand-curated showcase of real pages.
//
// GET  /api/wall            -> { cards: [{ slug, name, handle, status, emoji, goal, raised, link }] }
//   Reads the curated slug list (KV key "wall:featured") and returns trimmed,
//   public card data for each. Never exposes the edit token (stored.t).
//
// POST /api/wall            -> curate the list (requires WALL_ADMIN_TOKEN env)
//   body: { token, set?: [slugs] } | { token, add?: slug } | { token, remove?: slug }
//   Curation is account-less but admin-gated; if WALL_ADMIN_TOKEN is unset, POST is disabled
//   (manage the list with `wrangler kv key put wall:featured '[...]'` instead).

import { indexEntry } from "../_page.js";

const KEY = "wall:featured";
const SLUG_RE = /^[a-z0-9-]{2,40}$/;
const MAX_FEATURED = 24;

function json(obj, status = 200, cache = "no-store") {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "cache-control": cache } });
}

async function readList(env) {
  try { const raw = await env.PAGES.get(KEY); const a = raw ? JSON.parse(raw) : []; return Array.isArray(a) ? a : []; }
  catch { return []; }
}

// Fold the per-page viral-loop counters (stat:<slug> -> {v,c}) onto each index
// entry so /admin can show them and sum the funnel. Reads are cheap on KV (the
// scarce resource is writes); we parallelize and only read indexed (real) pages.
async function attachStats(env, recent) {
  await Promise.all(recent.map(async (r) => {
    if (!r || !r.slug) return;
    try { const raw = await env.PAGES.get("stat:" + r.slug); const o = raw ? JSON.parse(raw) : null; r.v = +(o && o.v) || 0; r.c = +(o && o.c) || 0; }
    catch { r.v = 0; r.c = 0; }
  }));
  return recent;
}

export async function onRequestGet({ env }) {
  if (!env.PAGES) return json({ error: "storage not configured" }, 500);
  const slugs = await readList(env);

  const cards = [];
  for (const slug of slugs) {
    if (!SLUG_RE.test(slug)) continue;
    const raw = await env.PAGES.get(slug);
    if (!raw) continue;                       // page was deleted — skip it silently
    let d; try { d = JSON.parse(raw).d; } catch { d = null; }
    if (!d) continue;
    const first = Array.isArray(d.links) && d.links[0] ? d.links[0] : null;
    cards.push({
      slug,
      name: d.name || "Someone broke",
      handle: d.handle || slug,
      status: d.status || "ramen",
      emoji: typeof d.emoji === "string" ? d.emoji : "",
      goal: Number(d.goal) || 0,
      raised: Number(d.raised) || 0,
      link: first ? { kind: first.kind || "custom", label: first.label || "" } : null,
    });
  }
  // short edge cache — the wall changes rarely and tolerates being a minute stale
  return json({ cards }, 200, "public, max-age=60");
}

export async function onRequestPost({ request, env }) {
  if (!env.PAGES) return json({ error: "storage not configured" }, 500);
  const admin = env.WALL_ADMIN_TOKEN;
  if (!admin) return json({ error: "curation disabled" }, 403);

  let body;
  try { body = await request.json(); } catch { return json({ error: "bad json" }, 400); }
  if (!body.token || body.token !== admin) return json({ error: "forbidden" }, 403);

  // admin: list current featured + recent/activity index (for the /admin picker)
  if (body.list) {
    let recent = [];
    try { recent = JSON.parse((await env.PAGES.get("pages:recent")) || "[]"); } catch {}
    recent = Array.isArray(recent) ? recent : [];
    await attachStats(env, recent);
    const creates = +(await env.PAGES.get("stat:creates")) || 0;
    return json({ featured: await readList(env), recent, creates });
  }

  // admin: rebuild the index by scanning every page in KV. Surfaces pages that
  // predate the index or fell off the cap, including their (legacy-null) timestamps.
  if (body.rebuild) {
    const entries = [];
    let cursor;
    do {
      const res = await env.PAGES.list({ limit: 1000, cursor });
      for (const k of res.keys) {
        const slug = k.name;
        if (slug.includes(":") || !SLUG_RE.test(slug)) continue; // skip img:/msg:/pages:/wall: + bad
        const raw = await env.PAGES.get(slug);
        if (!raw) continue;
        let st; try { st = JSON.parse(raw); } catch { continue; }
        let msgs = 0;
        try { const ma = JSON.parse((await env.PAGES.get("msg:" + slug)) || "[]"); msgs = Array.isArray(ma) ? ma.length : 0; } catch {}
        entries.push(indexEntry(slug, st.d || {}, st.m || {}, msgs));
      }
      cursor = res.list_complete ? null : res.cursor;
    } while (cursor);
    // newest activity first; pages with unknown timestamps sink to the bottom
    entries.sort((a, b) => (b.updatedAt || b.createdAt || "").localeCompare(a.updatedAt || a.createdAt || ""));
    const capped = entries.slice(0, 1000);
    await env.PAGES.put("pages:recent", JSON.stringify(capped));
    await attachStats(env, capped);
    const creates = +(await env.PAGES.get("stat:creates")) || 0;
    return json({ rebuilt: capped.length, featured: await readList(env), recent: capped, creates });
  }

  let list = await readList(env);
  const clean = s => (typeof s === "string" && SLUG_RE.test(s)) ? s : null;

  // admin: permanently delete a page and everything attached to it (violations,
  // dead shells). Irreversible — the slug becomes free to register again.
  if (body.delete) {
    const s = clean(body.delete);
    if (!s) return json({ error: "bad slug" }, 400);
    await env.PAGES.delete(s);             // the page itself
    await env.PAGES.delete("img:" + s);    // its share image
    await env.PAGES.delete("avatar:" + s); // its avatar photo
    await env.PAGES.delete("msg:" + s);    // its support messages
    try {                                  // drop from the activity index
      const recent = JSON.parse((await env.PAGES.get("pages:recent")) || "[]");
      if (Array.isArray(recent)) await env.PAGES.put("pages:recent", JSON.stringify(recent.filter(r => r && r.slug !== s)));
    } catch {}
    list = list.filter(x => x !== s);      // and from the featured wall if present
    await env.PAGES.put(KEY, JSON.stringify(list));
    return json({ deleted: s, featured: list });
  }

  if (Array.isArray(body.set)) {
    list = body.set.map(clean).filter(Boolean);
  } else if (body.add) {
    const s = clean(body.add);
    if (!s) return json({ error: "bad slug" }, 400);
    list = [s, ...list.filter(x => x !== s)];          // newest first, no dupes
  } else if (body.remove) {
    list = list.filter(x => x !== body.remove);
  } else {
    return json({ error: "nothing to do" }, 400);
  }

  list = list.slice(0, MAX_FEATURED);
  await env.PAGES.put(KEY, JSON.stringify(list));
  return json({ featured: list });
}
