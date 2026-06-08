/* No Money — core: broke-status presets, broke score, share-image renderer, sharing helpers.
   Zero runtime deps. Pages are stored server-side via short links (see /functions); no signup. */
import "./style.css"; // bundled + hashed by Vite (loaded on every page that imports core)
import "./i18n.js";   // window.I18N (lang + t)

/* ---------------- broke statuses ---------------- */
const STATUSES = {
  ramen: {
    label: "Ramen Mode", emoji: "🍜", accent: "#ff8a3d", base: 72, theme: "tint",
    tagline: "I spent my emergency fund on non-emergencies.",
    story: "I spent my emergency fund on things that were not emergencies.\nNow I'm surviving on instant noodles. Send help (or seasoning).",
    risk: "May eat the same flavor 9 days straight",
    zh: { label: "泡面模式", tagline: "应急基金花在了不应急的地方。", story: "我把应急基金花在了根本不算应急的东西上。\n现在靠泡面续命。求支援（或者一包调料）。", risk: "可能连吃同一种口味九天" },
    msgs: [["Stay strong, soup soldier.", "anon"], ["Adding an egg = luxury. Treat yourself.", "kev"]],
  },
  rent: {
    label: "Rent Panic", emoji: "🏚️", accent: "#ff5468", base: 84, theme: "dark",
    tagline: "Rent is due. My bank account disagrees.",
    story: "Rent is due. My bank account disagrees.\nI'm bridging the gap between 'broke' and 'boxes by the curb'.",
    risk: "Negotiating with a landlord and losing",
    zh: { label: "房租恐慌", tagline: "房租到期了。我的余额不同意。", story: "房租到期了，我的银行余额表示不同意。\n我正在「破产」和「睡天桥」之间艰难过渡。", risk: "正在和房东谈判，且节节败退" },
    msgs: [["The floor is technically a bed too. Hang in there.", "anon"], ["Been there. Sending vibes + $.", "mara"]],
  },
  domain: {
    label: "Domain Debt", emoji: "🌐", accent: "#00d563", base: 79, theme: "clean",
    tagline: "I bought domains instead of food. Again.",
    story: "I came here to build wealth.\nUnfortunately, I discovered premium domains.\nMy portfolio is strong. My fridge is empty.",
    risk: "May buy another domain instead of dinner",
    zh: { label: "域名负债", tagline: "又把买饭钱拿去买域名了。", story: "我本是来搞钱的。\n结果发现了高价域名。\n我的资产很雄厚，我的冰箱很空。", risk: "可能又拿买菜钱去抢注域名" },
    msgs: [["Please stop checking ExpiredDomains.", "anon"], ["One more .io and you're done.", "ty"], ["Stay strong, investor.", "dev_jen"]],
  },
  crypto: {
    label: "Crypto Damage", emoji: "📉", accent: "#ff5468", base: 81, theme: "gradient",
    tagline: "I was early. I was also catastrophically wrong.",
    story: "I was early. I was also catastrophically wrong.\nNow I'm funding my recovery arc one ramen at a time.\nNot financial advice — clearly.",
    risk: "Still insists 'it'll bounce back'",
    zh: { label: "币圈重创", tagline: "我入场很早。也错得很彻底。", story: "我入场很早，也错得很彻底。\n如今靠泡面一口一口走回血路。\n这显然不构成投资建议。", risk: "还在嘴硬「它会反弹的」" },
    msgs: [["WAGMI. eventually. maybe.", "anon"], ["HODL your dignity at least.", "satoshi_lite"]],
  },
  student: {
    label: "Student Mode", emoji: "🎓", accent: "#00d563", base: 68, theme: "mono",
    tagline: "Studying hard. Eating soft.",
    story: "Studying hard. Eating soft.\nTuition took everything, including my will to cook.\nEvery coffee keeps me conscious in lectures.",
    risk: "Sustained entirely by free campus pizza events",
    zh: { label: "学生模式", tagline: "学得很努力，吃得很清淡。", story: "学得很努力，吃得很清淡。\n学费掏空了我，连做饭的心气也一起掏空。\n每杯咖啡都让我在课上多撑一会儿。", risk: "全靠蹭学校免费披萨续命" },
    msgs: [["Future you will pay it forward.", "anon"], ["Ace those finals, broke legend.", "prof_no"]],
  },
  startup: {
    label: "Startup Broke", emoji: "🚀", accent: "#00d563", base: 76, theme: "gradient",
    tagline: "Pre-revenue, pre-funding, pre-lunch.",
    story: "We're pre-revenue, pre-funding, and pre-lunch.\nRunway is short. Vibes are immaculate.\nHelp us reach ramen profitability.",
    risk: "Will pivot before paying themselves",
    zh: { label: "创业破产", tagline: "没收入、没融资、没午饭。", story: "我们没收入、没融资、还没吃午饭。\n现金跑道很短，氛围感很足。\n帮我们撑到「泡面级盈利」。", risk: "会先转型，再考虑给自己发工资" },
    msgs: [["To the moon (economy class).", "anon"], ["Default alive starts with a coffee.", "yc_reject"]],
  },
  freelance: {
    label: "Freelancer Drought", emoji: "💼", accent: "#ff8a3d", base: 74, theme: "tint",
    tagline: "Invoices sent. Payments pending. Spirit broken.",
    story: "Invoices sent. Payments pending. Spirit broken.\nClients say 'the check is coming'. It is not coming.\nBridge me to net-30.",
    risk: "Owed money by 4 people, none replying",
    zh: { label: "自由职业旱季", tagline: "发票发了，钱没到，心碎了。", story: "发票发了，款项待付，人快碎了。\n客户说「钱马上到」。钱不会到。\n帮我撑过这个回款周期。", risk: "四个人欠我钱，零个人回我消息" },
    msgs: [["Net-30 is a personality test. You're passing.", "anon"], ["Chasing that invoice for you in spirit.", "rin"]],
  },
};

const STATUS_ORDER = ["ramen", "rent", "domain", "crypto", "student", "startup", "freelance"];

/* full demo pages used on the landing page (p.html?demo=key).
   curated funny button labels — the buttons ARE part of the joke. */
const DEMOS = {
  ramen:   { name: "Mika",  handle: "ramen",         status: "ramen",  goal: 200, raised: 74, zhcta: "🍜 给我加个蛋",
    links: [{ kind: "ramen", url: "#", label: "🍜 Add an egg to my life" }, { kind: "coffee", url: "#" }, { kind: "paypal", url: "#" }] },
  rent:    { name: "Devon", handle: "rent",          status: "rent",   goal: 850, raised: 310, zhcta: "🏚️ 别让我露宿",
    links: [{ kind: "custom", url: "#", label: "🏚️ Keep me indoors" }, { kind: "paypal", url: "#" }, { kind: "coffee", url: "#" }] },
  domain:  { name: "Mira",  handle: "domain-addict", status: "domain", goal: 500, raised: 210, zhcta: "🍜 请我吃泡面",
    links: [{ kind: "ramen", url: "#", label: "🍜 Buy me ramen" }, { kind: "custom", url: "#", label: "🛑 Stop my next domain purchase" }, { kind: "paypal", url: "#", label: "💸 Fund my recovery arc" }] },
  crypto:  { name: "Sol",   handle: "crypto-loss",   status: "crypto", goal: 1000, raised: 137, zhcta: "📉 资助我的回血",
    links: [{ kind: "custom", url: "#", label: "📉 Fund my recovery arc" }, { kind: "crypto", url: "#", label: "🪙 Send a coin that won't crash" }, { kind: "paypal", url: "#" }] },
  student: { name: "Aria",  handle: "student",       status: "student", goal: 300, raised: 189, zhcta: "☕ 给我的期末续命",
    links: [{ kind: "coffee", url: "#", label: "☕ Caffeinate my finals" }, { kind: "custom", url: "#", label: "🍕 Diversify my pizza diet" }, { kind: "paypal", url: "#" }] },
};

const PAYMENT_KINDS = {
  ramen:   { label: "🍜 Buy me ramen",        zh: "🍜 请我吃泡面",      cls: "",    ex: "https://your-tip-link.com" },
  coffee:  { label: "☕ Send emergency coffee", zh: "☕ 来杯救命咖啡",    cls: "alt", ex: "https://buymeacoffee.com/you" },
  paypal:  { label: "💸 PayPal me",            zh: "💸 用 PayPal 打赏",  cls: "alt", ex: "https://paypal.me/you" },
  kofi:    { label: "❤️ Ko-fi",                zh: "❤️ Ko-fi",           cls: "alt", ex: "https://ko-fi.com/you" },
  bmc:     { label: "☕ Buy Me a Coffee",       zh: "☕ Buy Me a Coffee", cls: "alt", ex: "https://buymeacoffee.com/you" },
  stripe:  { label: "💳 Card / Stripe",        zh: "💳 刷卡 / Stripe",   cls: "alt", ex: "https://buy.stripe.com/xxxxxx" },
  crypto:  { label: "🪙 Crypto wallet",         zh: "🪙 加密钱包",        cls: "alt", ex: "0x… or your wallet address" },
  wise:    { label: "🌍 Wise",                 zh: "🌍 Wise",            cls: "alt", ex: "https://wise.com/pay/me/you" },
  custom:  { label: "🔗 Support link",          zh: "🔗 打赏链接",        cls: "alt", ex: "https://your-link.com" },
};

/* localize a status to the current language (zh overrides label/tagline/story/risk) */
function locStatus(st) {
  if (!st) return st;
  const zh = (typeof window !== "undefined" && window.I18N && window.I18N.lang === "zh" && st.zh) ? st.zh : null;
  return zh ? { ...st, ...zh } : st;
}
/* localized payment-kind label */
function payLabel(kind) {
  const k = PAYMENT_KINDS[kind] || PAYMENT_KINDS.custom;
  return (typeof window !== "undefined" && window.I18N && window.I18N.lang === "zh" && k.zh) ? k.zh : k.label;
}
const BANDS_ZH = {
  "Financially dramatic": "财务戏精", "Critically broke": "重度破产",
  "Aggressively broke": "激进破产", "Casually broke": "轻度破产", "Suspiciously fine": "可疑地还行",
};

/* ---------------- broke score ---------------- */
function brokeScore(data) {
  const st = STATUSES[data.status] || STATUSES.ramen;
  let s = st.base;
  const goal = Number(data.goal) || 0;
  // bigger ask = more dramatic
  s += Math.min(14, Math.log10(Math.max(goal, 1)) * 4.2);
  // a longer sob story scores higher
  s += Math.min(6, ((data.story || "").length / 80));
  // visible progress makes you slightly less broke
  const pct = goal > 0 ? Math.min(1, (Number(data.raised) || 0) / goal) : 0;
  s -= pct * 16;
  s = Math.max(31, Math.min(99, Math.round(s)));

  let band;
  if (s >= 90) band = "Financially dramatic";
  else if (s >= 78) band = "Critically broke";
  else if (s >= 64) band = "Aggressively broke";
  else if (s >= 48) band = "Casually broke";
  else band = "Suspiciously fine";

  const zh = (typeof window !== "undefined" && window.I18N && window.I18N.lang === "zh");
  return { score: s, band: zh ? (BANDS_ZH[band] || band) : band, risk: locStatus(st).risk };
}

function pctOf(data) {
  const goal = Number(data.goal) || 0;
  if (goal <= 0) return 0;
  return Math.min(100, Math.round(((Number(data.raised) || 0) / goal) * 100));
}

/* ---------------- url safety ---------------- */
/* page data comes from the URL (attacker-controllable), so support-link hrefs must be
   scheme-checked — esc() stops attribute breakout but NOT javascript:/data: execution. */
function safeUrl(u) {
  u = (u || "").trim();
  if (!u) return "#";
  // strip control chars/whitespace browsers ignore inside a scheme, then check
  const probe = u.replace(/[\x00-\x20]+/g, "").toLowerCase();
  const m = probe.match(/^([a-z][a-z0-9+.\-]*):/);
  if (m) {
    const allowed = ["http", "https", "mailto", "bitcoin", "ethereum", "lightning", "monero", "solana"];
    if (!allowed.includes(m[1])) return "#";
  }
  return u; // no scheme = relative/handle, harmless as href
}

/* ---------------- sharing ---------------- */
/* a funny, ready-to-post caption built from the page data */
function isZhLang() { return !!(window.I18N && window.I18N.lang === "zh"); }
function shareText(data) {
  const st = locStatus(STATUSES[data.status] || STATUSES.ramen);
  const bs = brokeScore(data);
  const line = (data.story || "").split("\n")[0].trim() || st.tagline || "";
  if (isZhLang()) return `${data.name || "某人"} 破产 ${bs.score}% 💸${line ? " — " + line : ""}`;
  return `${data.name || "Someone"} is ${bs.score}% broke 💸${line ? " — " + line : ""}`;
}

/* prefilled share-intent URLs for each platform */
function shareIntents(url, data) {
  const text = shareText(data);
  const u = encodeURIComponent(url), t = encodeURIComponent(text);
  return {
    text,
    x: `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
    reddit: `https://www.reddit.com/submit?url=${u}&title=${t}`,
    telegram: `https://t.me/share/url?url=${u}&text=${t}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
  };
}

/* populate a container with one-tap share buttons (+ native share sheet where available) */
function renderShareRow(el, url, data) {
  if (!el) return;
  const i = shareIntents(url, data);
  const native = (typeof navigator !== "undefined" && navigator.share)
    ? `<button class="share-btn" data-share="native">📤 Share…</button>` : "";
  el.innerHTML = native +
    `<a class="share-btn xbtn" href="${i.x}" target="_blank" rel="noopener">𝕏 Post</a>` +
    `<a class="share-btn" href="${i.reddit}" target="_blank" rel="noopener">👽 Reddit</a>` +
    `<a class="share-btn" href="${i.telegram}" target="_blank" rel="noopener">✈️ Telegram</a>`;
  const nb = el.querySelector('[data-share="native"]');
  if (nb) nb.onclick = () => { navigator.share({ title: "No Money", text: i.text, url }).catch(() => {}); };
}

/* ---------------- share image (1200x630 OG) ---------------- */
function drawShareImage(canvas, data) {
  const W = 1200, H = 630;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  const st = locStatus(STATUSES[data.status] || STATUSES.ramen);
  const bs = brokeScore(data);
  const pct = pctOf(data);

  const zh = isZhLang();
  const deep = mixHex(st.accent, "#18191c", 0.42); // accent darkened so it's legible as text on light

  // bg — warm light, matching the page cards
  ctx.fillStyle = "#faf7f2"; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W * 0.82, -60, 0, W * 0.82, -60, 760);
  g.addColorStop(0, hexA(st.accent, 0.16)); g.addColorStop(1, "rgba(250,247,242,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // frame
  ctx.strokeStyle = "#e7e0d3"; ctx.lineWidth = 2; ctx.strokeRect(24, 24, W - 48, H - 48);

  // giant faint emoji watermark (bottom-right)
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.font = "360px -apple-system, Segoe UI, sans-serif";
  ctx.textAlign = "right"; ctx.textBaseline = "alphabetic";
  ctx.fillText(data.emoji || st.emoji, W - 20, H + 70);
  ctx.restore();
  ctx.textAlign = "left";

  // status pill (top-left)
  ctx.font = "600 24px ui-monospace, Menlo, monospace";
  const pillTxt = `${st.emoji}  ${st.label.toUpperCase()}`;
  const pw = ctx.measureText(pillTxt).width + 52;
  roundRect(ctx, 72, 72, pw, 50, 25); ctx.fillStyle = hexA(st.accent, 0.14); ctx.fill();
  ctx.strokeStyle = hexA(st.accent, 0.4); ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = deep; ctx.fillText(pillTxt, 98, 104);

  // broke score chip (top-right)
  ctx.font = "700 24px ui-monospace, Menlo, monospace";
  const scoreTxt = zh ? `破产分  ${bs.score}/100` : `BROKE SCORE  ${bs.score}/100`;
  const sw = ctx.measureText(scoreTxt).width + 52;
  roundRect(ctx, W - 72 - sw, 72, sw, 50, 25); ctx.fillStyle = "#ffffff"; ctx.fill();
  ctx.strokeStyle = "#e7e0d3"; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = "#18191c"; ctx.fillText(scoreTxt, W - 72 - sw + 26, 104);

  // headline: "X is 87% broke."
  ctx.fillStyle = "#18191c";
  ctx.font = "800 90px -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.fillText(zh ? `${data.name || "某人"}` : `${data.name || "Someone"} is`, 72, 232);
  ctx.fillStyle = deep;
  ctx.fillText(zh ? `破产 ${bs.score}%` : `${bs.score}% broke.`, 72, 330);

  // the punchline — first line of their story (or status tagline)
  const quote = (data.story || "").split("\n")[0].trim() || st.tagline || (zh ? "帮我变得没那么穷一点。" : "Help me become slightly less broke.");
  ctx.fillStyle = "#565961";
  ctx.font = "italic 400 34px -apple-system, Segoe UI, Roboto, sans-serif";
  const qLines = wrapText(ctx, `“${quote}”`, W - 144).slice(0, 2);
  qLines.forEach((ln, i) => ctx.fillText(ln, 72, 404 + i * 44));
  const afterQuote = 404 + qLines.length * 44;

  // progress bar
  const barY = Math.max(afterQuote + 18, 478), barW = W - 144;
  roundRect(ctx, 72, barY, barW, 14, 7); ctx.fillStyle = "#e9e3d8"; ctx.fill();
  roundRect(ctx, 72, barY, Math.max(14, barW * pct / 100), 14, 7); ctx.fillStyle = st.accent; ctx.fill();
  ctx.fillStyle = "#6f6a61"; ctx.font = "500 22px ui-monospace, Menlo, monospace";
  ctx.fillText(zh ? `已达成 ${pct}% · 生存目标 $${(Number(data.goal) || 0).toLocaleString()}` : `${pct}% to $${(Number(data.goal) || 0).toLocaleString()} survival goal`, 72, barY + 44);
  ctx.textAlign = "right";
  ctx.fillStyle = deep; ctx.fillText(bs.band, W - 72, barY + 44);
  ctx.textAlign = "left";

  // footer url
  ctx.fillStyle = "#18191c"; ctx.font = "700 30px ui-monospace, Menlo, monospace";
  ctx.fillText("no.money/", 72, 596);
  ctx.fillStyle = deep;
  ctx.fillText(data.handle || "you", 72 + ctx.measureText("no.money/").width, 596);
}

/* wrap text to a max pixel width, returns array of lines (uses current ctx.font) */
function wrapText(ctx, text, maxW) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
/* mix hex toward another hex by t (0..1) — used to darken the accent so it's legible as text on light */
function mixHex(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 255, ag = (pa >> 8) & 255, ab = pa & 255;
  const br = (pb >> 16) & 255, bg = (pb >> 8) & 255, bb = pb & 255;
  return `rgb(${Math.round(ar + (br - ar) * t)}, ${Math.round(ag + (bg - ag) * t)}, ${Math.round(ab + (bb - ab) * t)})`;
}

/* expose */
window.NM = { STATUSES, STATUS_ORDER, DEMOS, PAYMENT_KINDS, locStatus, payLabel, brokeScore, pctOf, safeUrl, drawShareImage, shareText, shareIntents, renderShareRow };
