// POST /api/hit  { slug, ev }  ->  { ok: true }
//   ev is either a legacy single event string ("view" | "cta"), or a batch:
//   { v?, c?, s?, o? } — the shape the client sends now, one beacon per session.
//
// Viral-loop instrumentation. The ONLY metric that matters here (per ROADMAP) is
// shareability, so we count, per page and once per tab-session per event:
//   v = human visits          (page load, NOT demos, NOT the owner)
//   c = "Make mine →" clicks  (the loop's trigger — a visitor becoming a creator)
//   s = share acts            (share image opened / link copied / image downloaded /
//                              an X/Reddit/Telegram intent clicked) — the literal
//                              "would you send this to someone?" moment
//   o = tip-link clicks       (someone actually heading for the payment page — the
//                              only signal that a tipping page produces tips)
// Creates (the loop's output) are counted separately in save.js (stat:creates).
//
// KV layout:  "stat:"+slug -> JSON {v,c,s,o}
//
// Why one BATCHED beacon instead of one request per event:
//   KV's scarce resource is writes, so the unit of cost has to be the session, not
//   the event. The client accumulates what happened and flushes once (see hit() in
//   src/p.js), which is how this went from 2 event types to 4 while *lowering* the
//   per-visitor write count. Adding a 5th event type is now free.
// Honest limits, unchanged:
//   - Read-modify-write with no atomic increment: concurrent hits on the same page
//     can lose a count. DIRECTIONAL data, not billing.
//   - Hot path writes ONE key per flush, keyed by slug, so load spreads across pages
//     instead of hammering a single global counter (KV caps ~1 write/sec/key).
//   - Free KV is ~1000 writes/day and a flush costs 2 (counter + the per-IP budget
//     below) → ~500 engaged visits/day. Past that, Workers Analytics Engine.
// NOT measured here on purpose: landing-page → editor traffic. Cloudflare's own
// request analytics already counts hits on "/" and "/create.html" for free; spending
// our write budget to re-count what the dashboard shows would be waste.

const SLUG_RE = /^[a-z0-9-]{2,40}$/;
const FIELDS = ["v", "c", "s", "o"];
const LEGACY = { view: "v", cta: "c" };   // pre-batch clients still in someone's open tab
const MAX_PER_FIELD = 5;                  // a session can't plausibly report more; caps injection

// Per-IP daily flush budget. These numbers are what the roadmap says the decision to
// build paid features hangs on, and an open counter endpoint is a number generator,
// not a measurement — anyone could curl the funnel into any shape they liked. 40/day
// is far above a real visitor (a session flushes once or twice) and far below anything
// useful for faking traction.
const HITS_PER_DAY = 40;
const RL_TTL = 172800;   // counters self-expire after 2 days

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}

// normalize either shape into { field: count }, dropping anything unrecognized
function parseEvents(ev) {
  const out = {};
  if (typeof ev === "string") {
    const f = LEGACY[ev];
    if (f) out[f] = 1;
    return out;
  }
  if (!ev || typeof ev !== "object" || Array.isArray(ev)) return out;
  for (const f of FIELDS) {
    const n = Math.floor(Number(ev[f]) || 0);
    if (n > 0) out[f] = Math.min(n, MAX_PER_FIELD);
  }
  return out;
}

export async function onRequestPost({ request, env }) {
  if (!env.PAGES) return json({ error: "storage not configured" }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ error: "bad json" }, 400); }

  const slug = String(body.slug || "");
  if (!SLUG_RE.test(slug)) return json({ error: "bad slug" }, 400);
  const events = parseEvents(body.ev);
  if (!Object.keys(events).length) return json({ error: "bad event" }, 400);

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

  // read-modify-write the per-slug counter — every field in this batch, one write
  let stat = {};
  try { const raw = await env.PAGES.get("stat:" + slug); if (raw) stat = JSON.parse(raw) || {}; } catch {}
  const next = {};
  for (const f of FIELDS) next[f] = Math.max(0, Math.floor(Number(stat[f]) || 0)) + (events[f] || 0);

  await Promise.all([
    env.PAGES.put("stat:" + slug, JSON.stringify(next)),
    env.PAGES.put(rlKey, String(sent + 1), { expirationTtl: RL_TTL }),
  ]);

  return json({ ok: true });
}
