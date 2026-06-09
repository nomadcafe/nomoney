/* No Money — core: broke-status presets, broke score, share-image renderer, sharing helpers.
   Zero runtime deps. Pages are stored server-side via short links (see /functions); no signup. */
import "./style.css"; // bundled + hashed by Vite (loaded on every page that imports core)
import "./i18n.js";   // window.I18N (lang + t)
import { brandMismatch, brandHostFor } from "../functions/_links.js"; // shared anti-spoof rule

/* ---------------- broke statuses ---------------- */
const STATUSES = {
  ramen: {
    label: "Ramen Mode", emoji: "🍜", accent: "#ff8a3d", base: 72, theme: "tint",
    tagline: "I spent my emergency fund on non-emergencies.",
    story: "I spent my emergency fund on things that were not emergencies.\nNow I'm surviving on instant noodles. Send help (or seasoning).",
    risk: "May eat the same flavor 9 days straight",
    zh: { label: "泡面模式", tagline: "应急基金花在了不应急的地方。", story: "我把应急基金花在了根本不算应急的东西上。\n现在靠泡面续命。求支援（或者一包调料）。", risk: "可能连吃同一种口味九天" },
    msgs: [["Stay strong, soup soldier.", "anon"], ["Adding an egg = luxury. Treat yourself.", "kev"]],
    zhmsgs: [["撑住，泡面战士。", "anon"], ["加个蛋 = 奢侈，宠宠自己。", "kev"]],
  },
  rent: {
    label: "Rent Panic", emoji: "🏚️", accent: "#ff5468", base: 84, theme: "dark",
    tagline: "Rent is due. My bank account disagrees.",
    story: "Rent is due. My bank account disagrees.\nI'm bridging the gap between 'broke' and 'boxes by the curb'.",
    risk: "Negotiating with a landlord and losing",
    zh: { label: "房租恐慌", tagline: "房租到期了。我的余额不同意。", story: "房租到期了，我的银行余额表示不同意。\n我正在「破产」和「睡天桥」之间艰难过渡。", risk: "正在和房东谈判，且节节败退" },
    msgs: [["The floor is technically a bed too. Hang in there.", "anon"], ["Been there. Sending vibes + $.", "mara"]],
    zhmsgs: [["地板严格来说也算床，撑住。", "anon"], ["懂的都懂，给你打钱 + 打气。", "mara"]],
  },
  laidoff: {
    label: "Laid Off", emoji: "📦", accent: "#00d563", base: 83, theme: "clean",
    tagline: "Company said 'tough decision'. My rent agreed.",
    story: "I got 'impacted by a restructure'.\nTranslation: lots of free time, zero income.\nLinkedIn says I'm Open To Work. So is my wallet.",
    risk: "Refreshes job boards more often than their pulse",
    zh: { label: "被裁了", tagline: "公司说「这是个艰难的决定」，我的房租表示同意。", story: "我被「优化」了。\n翻译一下：时间大把，收入为零。\n领英写着「正在找工作」，我的钱包也是。", risk: "刷招聘软件比刷自己心跳还勤" },
    msgs: [["'Open to work' but make it iconic. You got this.", "anon"], ["Severance is just a long coffee break. Hang in.", "mei"], ["Their loss, literally. Sending $.", "dev_jen"]],
    zhmsgs: [["「正在找工作」也要找得体面，你可以的。", "anon"], ["遣散费就是一段很长的咖啡时间，挺住。", "mei"], ["是他们的损失，真的。打钱。", "dev_jen"]],
  },
  crypto: {
    label: "Crypto Damage", emoji: "📉", accent: "#ff5468", base: 81, theme: "gradient",
    tagline: "I was early. I was also catastrophically wrong.",
    story: "I was early. I was also catastrophically wrong.\nNow I'm funding my recovery arc one ramen at a time.\nNot financial advice — clearly.",
    risk: "Still insists 'it'll bounce back'",
    zh: { label: "币圈重创", tagline: "我入场很早。也错得很彻底。", story: "我入场很早，也错得很彻底。\n如今靠泡面一口一口走回血路。\n这显然不构成投资建议。", risk: "还在嘴硬「它会反弹的」" },
    msgs: [["WAGMI. eventually. maybe.", "anon"], ["HODL your dignity at least.", "satoshi_lite"]],
    zhmsgs: [["WAGMI，迟早的，也许吧。", "anon"], ["至少把尊严 HODL 住。", "satoshi_lite"]],
  },
  student: {
    label: "Student Mode", emoji: "🎓", accent: "#00d563", base: 68, theme: "mono",
    tagline: "Studying hard. Eating soft.",
    story: "Studying hard. Eating soft.\nTuition took everything, including my will to cook.\nEvery coffee keeps me conscious in lectures.",
    risk: "Sustained entirely by free campus pizza events",
    zh: { label: "学生模式", tagline: "学得很努力，吃得很清淡。", story: "学得很努力，吃得很清淡。\n学费掏空了我，连做饭的心气也一起掏空。\n每杯咖啡都让我在课上多撑一会儿。", risk: "全靠蹭学校免费披萨续命" },
    msgs: [["Future you will pay it forward.", "anon"], ["Ace those finals, broke legend.", "prof_no"]],
    zhmsgs: [["未来的你会把这份好传下去的。", "anon"], ["期末加油，破产传奇。", "prof_no"]],
  },
  startup: {
    label: "Startup Broke", emoji: "🚀", accent: "#00d563", base: 76, theme: "gradient",
    tagline: "Pre-revenue, pre-funding, pre-lunch.",
    story: "We're pre-revenue, pre-funding, and pre-lunch.\nRunway is short. Vibes are immaculate.\nHelp us reach ramen profitability.",
    risk: "Will pivot before paying themselves",
    zh: { label: "创业破产", tagline: "没收入、没融资、没午饭。", story: "我们没收入、没融资、还没吃午饭。\n现金跑道很短，氛围感很足。\n帮我们撑到「泡面级盈利」。", risk: "会先转型，再考虑给自己发工资" },
    msgs: [["To the moon (economy class).", "anon"], ["Default alive starts with a coffee.", "yc_reject"]],
    zhmsgs: [["奔向月球（经济舱）。", "anon"], ["活下去，从一杯咖啡开始。", "yc_reject"]],
  },
  freelance: {
    label: "Freelancer Drought", emoji: "💼", accent: "#ff8a3d", base: 74, theme: "tint",
    tagline: "Invoices sent. Payments pending. Spirit broken.",
    story: "Invoices sent. Payments pending. Spirit broken.\nClients say 'the check is coming'. It is not coming.\nBridge me to net-30.",
    risk: "Owed money by 4 people, none replying",
    zh: { label: "自由职业旱季", tagline: "发票发了，钱没到，心碎了。", story: "发票发了，款项待付，人快碎了。\n客户说「钱马上到」。钱不会到。\n帮我撑过这个回款周期。", risk: "四个人欠我钱，零个人回我消息" },
    msgs: [["Net-30 is a personality test. You're passing.", "anon"], ["Chasing that invoice for you in spirit.", "rin"]],
    zhmsgs: [["回款周期是场人格测试，你正在通过。", "anon"], ["精神上替你催着那张发票。", "rin"]],
  },
  pet: {
    label: "Pet's Employee", emoji: "🐱", accent: "#ff8a3d", base: 75, theme: "mono",
    tagline: "I have a job: serving a cat who doesn't pay me.",
    story: "I don't have a pet. I have a tiny landlord with fur.\nVet bills, imported kibble, a $40 toy ignored for the box.\nI just work here now. Tips fund the snacks.",
    risk: "Will spend rent on a fountain the cat refuses to drink from",
    zh: { label: "给猫主子打工", tagline: "我有份工作：伺候一只不给我发工资的猫。", story: "我养的不是宠物，是一位带毛的房东。\n看病、进口猫粮、四十块的玩具——它只玩盒子。\n我现在是这儿的打工人，打赏都拿去进贡零食。", risk: "会拿房租给主子买它根本不喝的饮水机" },
    msgs: [["Give the tiny landlord a raise. Sending $.", "anon"], ["The box was the real gift. Stay strong.", "lee"]],
    zhmsgs: [["给带毛的房东涨涨工资吧，打钱。", "anon"], ["盒子才是真正的礼物，撑住。", "lee"]],
  },
};

const STATUS_ORDER = ["ramen", "rent", "laidoff", "crypto", "student", "startup", "freelance", "pet"];

/* full demo pages used on the landing page (p.html?demo=key).
   curated funny button labels — the buttons ARE part of the joke. */
const DEMOS = {
  ramen:   { name: "Mika",  handle: "ramen",         status: "ramen",  goal: 200, raised: 74, zhcta: "🍜 给我加个蛋",
    links: [{ kind: "ramen", url: "#", label: "🍜 Add an egg to my life", zh: "🍜 给我的泡面加个蛋" }, { kind: "coffee", url: "#" }, { kind: "paypal", url: "#" }] },
  rent:    { name: "Devon", handle: "rent",          status: "rent",   goal: 850, raised: 310, zhcta: "🏚️ 别让我露宿",
    links: [{ kind: "custom", url: "#", label: "🏚️ Keep me indoors", zh: "🏚️ 别让我露宿街头" }, { kind: "paypal", url: "#" }, { kind: "coffee", url: "#" }] },
  laidoff: { name: "Mira",  handle: "laidoff",      status: "laidoff", goal: 500, raised: 210, zhcta: "📦 资助我待业",
    links: [{ kind: "custom", url: "#", label: "📦 Fund my funemployment", zh: "📦 赞助我的待业人生" }, { kind: "coffee", url: "#" }, { kind: "paypal", url: "#", label: "💸 Bridge me to the next offer", zh: "💸 撑我到下一个 offer" }] },
  crypto:  { name: "Sol",   handle: "crypto-loss",   status: "crypto", goal: 1000, raised: 137, zhcta: "📉 资助我的回血",
    links: [{ kind: "custom", url: "#", label: "📉 Fund my recovery arc", zh: "📉 资助我回血" }, { kind: "crypto", url: "#", label: "🪙 Send a coin that won't crash", zh: "🪙 给我个不会崩的币" }, { kind: "paypal", url: "#" }] },
  student: { name: "Aria",  handle: "student",       status: "student", goal: 300, raised: 189, zhcta: "☕ 给我的期末续命",
    links: [{ kind: "coffee", url: "#", label: "☕ Caffeinate my finals", zh: "☕ 给我的期末续咖啡" }, { kind: "custom", url: "#", label: "🍕 Diversify my pizza diet", zh: "🍕 让我的披萨换换口味" }, { kind: "paypal", url: "#" }] },
  pet:     { name: "Tess",  handle: "catstaff",      status: "pet",    goal: 300, raised: 96, zhcta: "🐱 给主子进贡",
    links: [{ kind: "custom", url: "#", label: "🐱 Fund the tiny landlord", zh: "🐱 给带毛房东进贡" }, { kind: "coffee", url: "#" }, { kind: "paypal", url: "#", label: "💸 Pay the cat's bills", zh: "💸 替猫主子还账单" }] },
};

const PAYMENT_KINDS = {
  ramen:   { label: "🍜 Buy me ramen",        zh: "🍜 请我吃泡面",      cls: "",    ex: "https://your-tip-link.com" },
  coffee:  { label: "☕ Send emergency coffee", zh: "☕ 来杯救命咖啡",    cls: "alt", ex: "https://buymeacoffee.com/you" },
  paypal:  { label: "💸 PayPal me",            zh: "💸 用 PayPal 打赏",  cls: "alt", ex: "https://paypal.me/you" },
  kofi:    { label: "❤️ Ko-fi",                zh: "❤️ Ko-fi",           cls: "alt", ex: "https://ko-fi.com/you" },
  stripe:  { label: "💳 Card / Stripe",        zh: "💳 刷卡 / Stripe",   cls: "alt", ex: "https://buy.stripe.com/xxxxxx" },
  crypto:  { label: "🪙 Crypto wallet",         zh: "🪙 加密钱包",        cls: "alt", ex: "0x… or your wallet address" },
  wise:    { label: "🌍 Wise",                 zh: "🌍 Wise",            cls: "alt", ex: "https://wise.com/pay/me/you" },
  alipay:  { label: "💙 Alipay",               zh: "💙 支付宝",          cls: "alt", ex: "https://qr.alipay.com/xxxxxx" },
  custom:  { label: "🔗 Support link",          zh: "🔗 打赏链接",        cls: "alt", ex: "https://your-link.com" },
};

/* retired kinds → their canonical replacement, so old pages keep a sensible button.
   "bmc" was a duplicate of "coffee" (same icon + buymeacoffee.com) and was removed. */
const KIND_ALIAS = { bmc: "coffee" };
const canonKind = k => KIND_ALIAS[k] || k || "custom";

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
window.NM = { STATUSES, STATUS_ORDER, DEMOS, PAYMENT_KINDS, locStatus, payLabel, canonKind, brokeScore, pctOf, safeUrl, brandMismatch, brandHostFor, drawShareImage, shareText, shareIntents, renderShareRow };
