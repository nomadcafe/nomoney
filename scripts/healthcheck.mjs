#!/usr/bin/env node
/* No Money — production health check.   node scripts/healthcheck.mjs [origin]
 *
 * Written after /api/ai spent an unknown number of days returning 502 for every
 * user without anyone noticing: the model slug had been retired from Workers AI,
 * and the editor's fallback quietly served canned lines instead. Nothing was on
 * fire, no error surfaced, the feature was simply gone.
 *
 * So the rule here is: assert on MEANING, never on the status code alone. Every
 * check below targets a failure that the product hides from you:
 *   /api/wall  — if it breaks, the homepage wall just sets display:none and the
 *                whole "Wall of Broke" silently disappears (src/index.js).
 *   /api/ai    — falls back to canned lines, so the button looks like it works.
 *   /api/hit   — a fire-and-forget beacon. A broken one reads as "nobody shares",
 *                which is exactly the conclusion the roadmap acts on. Worst case.
 *   /og/:id    — social previews break where you can't see them.
 *   /api/save  — validation regressions here ship pages with dead tip buttons.
 *
 * Read-only by design: it creates nothing, so it can't skew stat:creates or the
 * activity index. Known gap, stated rather than hidden: a KV *write* outage
 * (e.g. the free 1000/day budget exhausted) is NOT detected — writes only happen
 * on real user actions. That shows up as frozen numbers in /admin instead.
 */

const ORIGIN = (process.argv[2] || process.env.NM_ORIGIN || "https://no.money").replace(/\/+$/, "");
const results = [];
let probeSlug = null;

const get = (path, init) => fetch(ORIGIN + path, { redirect: "follow", ...init });
const post = (path, body) => get(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

async function check(name, fn) {
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail: detail || "" });
  } catch (e) {
    results.push({ name, ok: false, detail: e && e.message ? e.message : String(e) });
  }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

/* ---------- the checks ---------- */

await check("landing page renders", async () => {
  const r = await get("/");
  assert(r.status === 200, `status ${r.status}`);
  const html = await r.text();
  assert(html.includes("no.money"), "page body is missing the brand — served a placeholder?");
  assert(!html.includes("<script type=\"module\" src=\"/src/"), "serving UNBUILT sources — deployed the repo root instead of dist/");
  return `${html.length} bytes`;
});

await check("KV is bound + wall has cards", async () => {
  const r = await get("/api/wall");
  assert(r.status === 200, `status ${r.status}`);
  const j = await r.json();
  assert(!j.error, `api error: ${j.error}`);          // "storage not configured" = KV binding gone
  assert(Array.isArray(j.cards), "no cards array");
  assert(j.cards.length > 0, "wall is EMPTY — the homepage hides the section silently when this happens");
  probeSlug = j.cards[0].slug;
  return `${j.cards.length} cards, probing "${probeSlug}"`;
});

await check("a real page serves its data", async () => {
  assert(probeSlug, "no probe slug (wall check failed)");
  const r = await get(`/api/get?slug=${encodeURIComponent(probeSlug)}`);
  assert(r.status === 200, `status ${r.status}`);
  const j = await r.json();
  assert(j.data && typeof j.data === "object", "no data");
  assert(!("t" in j.data), "EDIT TOKEN LEAKED in the public GET response");
  return "data ok, token not exposed";
});

// The wall is the homepage showcase for a TIPPING product. A featured page with no
// working button demonstrates the opposite of the product. These pages predate the
// rule that a page must ship at least one link, so curation is the only thing keeping
// them off the wall — which is exactly why this is worth a daily assertion.
await check("featured pages can actually receive money", async () => {
  const r = await get("/api/wall");
  const cards = (await r.json()).cards || [];
  assert(cards.length, "no cards");
  const broken = [];
  for (const c of cards) {
    const d = await (await get(`/api/get?slug=${encodeURIComponent(c.slug)}`)).json().catch(() => ({}));
    const links = (d.data && d.data.links) || [];
    if (!links.length) broken.push(c.slug);
  }
  assert(!broken.length,
    `on the wall with NO tip button: ${broken.join(", ")} — unfeature them in /admin, or the showcase for a tipping product shows pages nobody can tip`);
  return `${cards.length}/${cards.length} can be tipped`;
});

await check("page HTML: OG tags, versioned image, noindex", async () => {
  assert(probeSlug, "no probe slug");
  const r = await get(`/${probeSlug}`);
  assert(r.status === 200, `status ${r.status}`);
  const html = await r.text();
  assert(/<meta name="robots" content="noindex/.test(html), "noindex missing — user pages are being indexed");
  assert(/og:image" content="[^"]+/.test(html), "og:image missing — shares render as a bare link");
  assert(/window\.__PAGE__=/.test(html), "page data not injected — the page would redirect home");
  return "ok";
});

await check("share image bytes are served", async () => {
  assert(probeSlug, "no probe slug");
  const r = await get(`/og/${probeSlug}`);
  assert(r.status === 200, `status ${r.status}`);
  assert((r.headers.get("content-type") || "").includes("image/png"), "not a PNG");
  const buf = new Uint8Array(await r.arrayBuffer());
  assert(buf.length > 1000, `suspiciously small (${buf.length} bytes)`);
  assert(buf[0] === 0x89 && buf[1] === 0x50, "not actually PNG bytes");
  return `${Math.round(buf.length / 1024)} KB`;
});

await check("AI writes real copy (not a silent fallback)", async () => {
  const r = await post("/api/ai", { label: "Ramen Mode", lang: "en" });
  if (r.status === 429) return "rate limited — skipped";      // not a failure, just noisy neighbours
  assert(r.status === 200, `status ${r.status} — the model slug was probably retired again; run \`wrangler ai models\` and set AI_MODEL`);
  const j = await r.json();
  assert(j.text && j.text.trim().length > 20, `returned no usable text: ${JSON.stringify(j).slice(0, 120)}`);
  return `"${j.text.replace(/\s+/g, " ").slice(0, 60)}…"`;
});

await check("analytics beacon is alive and validating", async () => {
  const r = await post("/api/hit", { slug: "zz-not-a-real-page-healthcheck", ev: { v: 1 } });
  assert(r.status === 404, `expected 404 for an unknown slug, got ${r.status} — either the endpoint is down or it stopped checking, which lets anyone forge the funnel`);
  return "rejects unknown slugs";
});

await check("publish rejects a link that goes nowhere", async () => {
  const r = await post("/api/save", { data: { handle: "zz-healthcheck", name: "hc", status: "ramen", story: "hc", links: [{ kind: "custom", url: "NotAUrlJustAUsername" }] } });
  const j = await r.json().catch(() => ({}));
  assert(r.status === 400 && j.error === "no links",
    `expected 400/"no links", got ${r.status}/${JSON.stringify(j)} — if this SAVED, a page with a dead tip button was just created; delete it`);
  return "dead links blocked";
});

await check("publish rejects a brand-spoofing link", async () => {
  const r = await post("/api/save", { data: { handle: "zz-healthcheck", name: "hc", status: "ramen", story: "hc", links: [{ kind: "paypal", url: "https://paypal.me@evil.example/pay" }] } });
  const j = await r.json().catch(() => ({}));
  assert(r.status === 400 && j.error === "no links", `expected the spoof to be stripped, got ${r.status}/${JSON.stringify(j)}`);
  return "userinfo spoof blocked";
});

await check("content rules block gambling promotion", async () => {
  const r = await post("/api/save", { data: { handle: "zz-healthcheck", name: "hc", status: "ramen",
    story: "Sure odds today, fixed matches available. DM for VIP tips.",
    links: [{ kind: "cashapp", url: "https://cash.app/$hc" }] } });
  const j = await r.json().catch(() => ({}));
  assert(r.status === 422 && j.reason === "gambling",
    `expected 422/gambling, got ${r.status}/${JSON.stringify(j)} — if this SAVED, a tipster page was just published; delete it`);
  return "tipster pages blocked";
});

/* ---------- report ---------- */
const failed = results.filter(r => !r.ok);
const pad = Math.max(...results.map(r => r.name.length));
console.log(`\nNo Money health check — ${ORIGIN}\n`);
for (const r of results) console.log(`  ${r.ok ? "✅" : "❌"} ${r.name.padEnd(pad)}  ${r.detail}`);
console.log(`\n${results.length - failed.length}/${results.length} passed\n`);
if (failed.length) {
  console.error(`FAILING: ${failed.map(f => f.name).join(", ")}`);
  process.exit(1);
}
