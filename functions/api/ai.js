// POST /api/ai  { label, story? }  ->  { text }
// Rewrites / generates a funny broke "sob story" via Cloudflare Workers AI.
// Client falls back to local curated lines if this fails.

// Workers AI retires model slugs without notice — "@cf/meta/llama-3.1-8b-instruct"
// silently disappeared from the catalogue and this endpoint 502'd for every user
// until someone checked. Keep it overridable from the dashboard (env AI_MODEL) so
// the next retirement is a variable edit, not a redeploy, and check the current
// list with `wrangler ai models` when it breaks again.
const DEFAULT_MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8";   // the drop-in successor
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

const SYSTEM_ZH =
  "你为一个搞笑的「破产创作者」求打赏页面（网站叫 No Money）撰写简短的「卖惨故事」。" +
  "语气：自嘲、戏剧化但轻松、真的好笑，要地道的中文网络口吻，别像翻译腔。" +
  "2–3 行短句，第一人称，总共不超过 120 个汉字。" +
  "不要话题标签、不要链接、不要外层引号，最多一个 emoji。" +
  "只输出故事本身——不要任何前言或解释。";

const SYSTEM_ES =
  "Escribes la breve «historia lacrimógena» que aparece en páginas de apoyo graciosas para creadores sin dinero (un sitio llamado No Money). " +
  "Tono: autocrítico, dramático pero ligero, genuinamente gracioso, en español natural (no suene a traducción). " +
  "2–3 líneas cortas, en primera persona, MENOS de 240 caracteres en total. " +
  "Sin hashtags, sin enlaces, sin comillas externas, como mucho un emoji. " +
  "Devuelve SOLO el texto de la historia — sin preámbulo ni explicación.";

const SYSTEM_JA =
  "あなたは、金欠クリエイター向けの笑える応援ページ（No Money というサイト）に表示される短い「泣ける話」を書きます。" +
  "トーン：自虐的で、大げさだけど軽く、本当に面白い、自然な日本語（翻訳調にしない）。" +
  "一人称で2〜3行の短文、合計120文字以内。" +
  "ハッシュタグ・リンク・外側の引用符は禁止、絵文字は最大1つ。" +
  "物語本文だけを出力——前置きや説明は不要。";

// per-language system prompt + user-prompt builders, keyed by the 2-letter lang code
const PROMPTS = {
  zh: { system: SYSTEM_ZH,
    rewrite: (label, story) => `我的破产状态是「${label}」。把这段卖惨故事改写得更好笑，保持同样的调调：\n\n${story}`,
    fresh: (label) => `我的破产状态是「${label}」。给它写一段好笑的卖惨故事。` },
  es: { system: SYSTEM_ES,
    rewrite: (label, story) => `Mi estado de pobreza es «${label}». Reescribe esta historia lacrimógena para que sea más graciosa, manteniendo el mismo tono:\n\n${story}`,
    fresh: (label) => `Mi estado de pobreza es «${label}». Escríbele una historia lacrimógena graciosa.` },
  ja: { system: SYSTEM_JA,
    rewrite: (label, story) => `私の破産ステータスは「${label}」です。この泣ける話を、同じトーンのままもっと面白く書き直して：\n\n${story}`,
    fresh: (label) => `私の破産ステータスは「${label}」です。面白い泣ける話を書いて。` },
  en: { system: SYSTEM,
    rewrite: (label, story) => `My broke status is "${label}". Rewrite this sob story to be funnier, keep the same vibe:\n\n${story}`,
    fresh: (label) => `My broke status is "${label}". Write a funny sob story for it.` },
};

// Cost-protection backstop. Defaults are deliberately conservative; override in
// production via env vars (AI_RL_PER_MIN / AI_RL_PER_DAY) so the public ceiling
// isn't your real one. The WAF rate-limit rule is the hard cap; this is best-effort.
const DEFAULT_PER_MIN = 8;   // AI rewrites per IP per minute
const DEFAULT_PER_DAY = 80;  // ... per day

export async function onRequestPost({ request, env }) {
  if (!env.AI) return json({ error: "ai not configured" }, 500);

  const model = String(env.AI_MODEL || "").trim() || DEFAULT_MODEL;
  const perMin = Number(env.AI_RL_PER_MIN) || DEFAULT_PER_MIN;
  const perDay = Number(env.AI_RL_PER_DAY) || DEFAULT_PER_DAY;

  // simple per-IP rate limit (KV counters) to protect Workers AI cost
  if (env.PAGES) {
    const ip = request.headers.get("CF-Connecting-IP") || "anon";
    const now = Date.now();
    const mKey = `airl:m:${ip}:${Math.floor(now / 60000)}`;
    const dKey = `airl:d:${ip}:${Math.floor(now / 86400000)}`;
    const [m, d] = await Promise.all([env.PAGES.get(mKey), env.PAGES.get(dKey)]);
    if ((+m || 0) >= perMin || (+d || 0) >= perDay) return json({ error: "rate limited" }, 429);
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
  const code = String(body.lang || "").toLowerCase().slice(0, 2);
  const p = PROMPTS[code] || PROMPTS.en;

  const user = story ? p.rewrite(label, story) : p.fresh(label);

  let out;
  try {
    const res = await env.AI.run(model, {
      messages: [{ role: "system", content: p.system }, { role: "user", content: user }],
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
