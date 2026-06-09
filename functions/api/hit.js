// POST /api/hit  { slug, ev }  ev ∈ "view" | "cta"  ->  { ok: true }
// Viral-loop instrumentation. The ONLY metric that matters here (per ROADMAP) is
// shareability, and at the no-account stage we otherwise have no way to see it.
// We count, per page:
//   v = real human page views        (fired on load from /<slug>, NOT demos, NOT the owner)
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
//  - Free KV is ~1000 writes/day. That's ~1000 engaged visits/day before the cap;
//    by the time you're past it the loop has already proven itself — move to
//    Workers Analytics Engine (no per-key limit, built for this) at that point.

const SLUG_RE = /^[a-z0-9-]{2,40}$/;

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

  // read-modify-write the per-slug counter. Stats for a slug that doesn't exist
  // just sit unused — the admin only ever sums over indexed (real) pages, so a
  // garbage slug can't poison the global totals. No existence check needed.
  let stat = { v: 0, c: 0 };
  try { const raw = await env.PAGES.get("stat:" + slug); if (raw) { const o = JSON.parse(raw); stat = { v: +o.v || 0, c: +o.c || 0 }; } } catch {}
  stat[field] = (stat[field] || 0) + 1;
  await env.PAGES.put("stat:" + slug, JSON.stringify(stat));

  return json({ ok: true });
}
