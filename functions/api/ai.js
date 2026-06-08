// POST /api/ai  { label, story? }  ->  { text }
// Rewrites / generates a funny broke "sob story" via Cloudflare Workers AI.
// Client falls back to local curated lines if this fails.

const MODEL = "@cf/meta/llama-3.1-8b-instruct";
const MAX_OUT = 240;

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}

const SYSTEM =
  "You write the short 'sob story' shown on funny broke-creator support pages (a site called No Money). " +
  "Voice: self-deprecating, dramatic-but-lighthearted, genuinely funny. " +
  "2–3 short lines, first person, UNDER 240 characters total. " +
  "No hashtags, no links, no surrounding quotes, at most one emoji. " +
  "Output ONLY the story text — no preamble, no explanation.";

const PER_MIN = 8;   // AI rewrites per IP per minute
const PER_DAY = 80;  // ... per day (cost backstop)

export async function onRequestPost({ request, env }) {
  if (!env.AI) return json({ error: "ai not configured" }, 500);

  // simple per-IP rate limit (KV counters) to protect Workers AI cost
  if (env.PAGES) {
    const ip = request.headers.get("CF-Connecting-IP") || "anon";
    const now = Date.now();
    const mKey = `airl:m:${ip}:${Math.floor(now / 60000)}`;
    const dKey = `airl:d:${ip}:${Math.floor(now / 86400000)}`;
    const [m, d] = await Promise.all([env.PAGES.get(mKey), env.PAGES.get(dKey)]);
    if ((+m || 0) >= PER_MIN || (+d || 0) >= PER_DAY) return json({ error: "rate limited" }, 429);
    // count the attempt up front so failed calls still consume quota (can't be spammed)
    await Promise.all([
      env.PAGES.put(mKey, String((+m || 0) + 1), { expirationTtl: 120 }),
      env.PAGES.put(dKey, String((+d || 0) + 1), { expirationTtl: 90000 }),
    ]);
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: "bad json" }, 400); }

  const label = String(body.label || "").trim().slice(0, 40) || "broke";
  const story = String(body.story || "").trim().slice(0, 240);

  const user = story
    ? `My broke status is "${label}". Rewrite this sob story to be funnier, keep the same vibe:\n\n${story}`
    : `My broke status is "${label}". Write a funny sob story for it.`;

  let out;
  try {
    const res = await env.AI.run(MODEL, {
      messages: [{ role: "system", content: SYSTEM }, { role: "user", content: user }],
      max_tokens: 160,
      temperature: 0.9,
    });
    out = (res && (res.response || res.result || "")) + "";
  } catch (e) {
    return json({ error: "ai failed" }, 502);
  }

  // tidy: strip wrapping quotes / preamble, cap length
  let text = out.trim().replace(/^["“']|["”']$/g, "").trim();
  if (text.length > MAX_OUT) text = text.slice(0, MAX_OUT).replace(/\s+\S*$/, "").trim();
  if (!text) return json({ error: "empty" }, 502);

  return json({ text });
}
