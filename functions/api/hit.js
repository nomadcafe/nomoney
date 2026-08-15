// POST /api/hit  { slug, ev }  ev ∈ "view" | "cta"  ->  { ok: true }
// Viral-loop instrumentation. The ONLY metric that matters here (per ROADMAP) is
// shareability, and at the no-account stage we otherwise have no way to see it.
// We count, per page (deduped client-side to once per tab-session per event, so v/c
// read ~per-visit rather than raw pageviews — see hit() in src/p.js):
//   v = human visits                  (fired on load from /<slug>, NOT demos, NOT the owner)
//   c = "Make mine →" CTA clicks      (the viral-loop trigger)
// Creates (the loop's output) are counted separately in save.js (stat:creates).
//
// KV layout:  "stat:"+slug -> JSON {v,c}
// Design notes (honest about KV's limits at this stage):
//  - Hot path writes ONE key per hit, keyed by slug, so load spreads across pages
//    instead of hammering a single global counter (KV caps ~1 write/sec/key).
//  - It's read-modify-write with no atomic increment, so concurrent hits on the
//    same page can lose a count. This is DIRECTIONAL data, not billing — exact
//    enough to answer "does the loop work?", not exact to the unit.
//  - Free KV is ~1000 writes/day, and a counted event now costs 2 (the counter +
//    the per-IP budget below) → ~500 engaged visits/day before the cap. By the time
//    you're past that the loop has already proven itself — move to Workers Analytics
//    Engine (no per-key limit, no write budget, built for exactly this) at that point.

const SLUG_RE = /^[a-z0-9-]{2,40}$/;

// Per-IP daily event budget. These three numbers are what the roadmap says the
// decision to build paid features hangs on, and an open counter endpoint is a
// number generator, not a measurement — anyone could curl the funnel into any
// shape they liked. 40/day is far above a real visitor (one "view" per page per
// tab-session) and far below anything useful for faking traction.
// Cost: one extra small KV write per counted event, halving the free-tier
// headroom noted below. Non-forgeable data at half the ceiling beats forgeable
// data at the full one — and past that ceiling the answer is Analytics Engine.
const HITS_PER_DAY = 40;
const RL_TTL = 172800;   // counters self-expire after 2 days

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}

export async function onRequestPost({ request, env }) {
  if (!env.PAGES) return json({ error: "storage not configured" }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ error: "bad json" }, 400); }

  const slug = String(body.slug || "");
  const ev = String(body.ev || "");
  if (!SLUG_RE.test(slug)) return json({ error: "bad slug" }, 400);
  const field = ev === "view" ? "v" : ev === "cta" ? "c" : null;
  if (!field) return json({ error: "bad event" }, 400);

  // the slug must be a real page. Without this, any string becomes a permanent
  // "stat:<junk>" key in the same namespace the pages live in — unbounded garbage
  // written by anyone. Cached at the edge so the check costs ~nothing on the hot path.
  const exists = await env.PAGES.get(slug, { cacheTtl: 3600 });
  if (!exists) return json({ error: "no such page" }, 404);

  // per-IP daily budget (best-effort KV counter, same shape as save.js). Once an IP
  // is over its budget we return before writing anything, so a flood costs us nothing.
  const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
  const rlKey = `hrl:${ip}:${new Date().toISOString().slice(0, 10)}`;
  let sent = 0;
  try { sent = +(await env.PAGES.get(rlKey)) || 0; } catch {}
  if (sent >= HITS_PER_DAY) return json({ ok: true, skipped: true });   // silent: it's a beacon

  // read-modify-write the per-slug counter
  let stat = { v: 0, c: 0 };
  try { const raw = await env.PAGES.get("stat:" + slug); if (raw) { const o = JSON.parse(raw); stat = { v: +o.v || 0, c: +o.c || 0 }; } } catch {}
  stat[field] = (stat[field] || 0) + 1;
  await Promise.all([
    env.PAGES.put("stat:" + slug, JSON.stringify(stat)),
    env.PAGES.put(rlKey, String(sent + 1), { expirationTtl: RL_TTL }),
  ]);

  return json({ ok: true });
}
