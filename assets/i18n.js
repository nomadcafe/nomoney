// Tiny i18n runtime. Lang = saved choice → else browser (zh* → zh) → else en.
// Static text: tag elements with data-i18n / data-i18n-ph / data-i18n-html.
// Dynamic text: I18N.t(key). On language change, a "langchange" event fires so pages re-render.

const STR = {
  en: {
    "lang.other": "中文",
    "nav.examples": "Examples", "nav.how": "How it works", "nav.create": "Create my page",
    "hero.kicker": "💸 the only flex is having none",
    "hero.h1": "No Money?<br><span class=\"green\">Make it official.</span>",
    "hero.sub": "Create a funny support page when you're broke. Add your tip links. Share it. Become slightly less broke.",
    "hero.cta1": "Create my broke page →", "hero.cta2": "See an example",
    "hero.note": "no signup · free · ready in 60 seconds",
    "demos.eyebrow": "Certified broke", "demos.h2": "Pages people actually made up",
    "demos.p": "Every kind of broke deserves representation. Pick your financial trauma.",
    "card.goal": "Goal", "card.lessbroke": "less broke", "card.broke_score": "Broke Score",
    "card.status": "Status", "card.risk": "Risk level",
    "how.eyebrow": "Painfully simple", "how.h2": "Broke in four steps",
    "how.p": "No signup, no nonsense — broke and shareable in about a minute.",
    "how.s1t": "Pick your broke", "how.s1d": "Ramen Mode? Rent Panic? Domain Debt? Choose the status that hurts most.",
    "how.s2t": "Add your links", "how.s2d": "PayPal, Ko-fi, crypto wallet — whatever catches money. We never touch it.",
    "how.s3t": "Get your share image", "how.s3d": "One tap makes a meme-ready image for X, Reddit & Telegram. This is the whole point.",
    "how.s4t": "Become less broke", "how.s4d": "Post it. Watch your Broke Score drop as the internet pities you (financially).",
    "faq.eyebrow": "FAQ", "faq.h2": "Questions broke people ask",
    "faq.q1": "What even is this?",
    "faq.a1": "No Money turns \"I'm broke\" into a shareable page. Pick your broke status, drop your tip links, and post a meme-ready card with a Broke Score. People pity you (financially).",
    "faq.q2": "Is it free?", "faq.a2": "Yes — creating and sharing a page is free, no signup.",
    "faq.q3": "Do you take a cut of my tips?", "faq.a3": "Never. Your links (PayPal, Ko-fi, crypto…) go straight to you — No Money never touches the money.",
    "faq.q4": "Do I need an account?", "faq.a4": "Nope. Your page is just a shareable link — no login, no password to forget.",
    "faq.q5": "Is this a real fundraising or charity thing?", "faq.a5": "No. It's for personal support pages, creator tips and internet jokes — not charity or fundraising. Be broke responsibly.",
    "cta.stamp": "💸 Certified Broke", "cta.h2": "I'm broke,<br>but make it <span class=\"green\">funny.</span>",
    "cta.p": "That's the whole product. Free, no signup, slightly less broke in 60 seconds.",
    "cta.btn": "Create my broke page →",
    "foot.tagline": "Make being broke official.",
    "foot.disclaimer": "<b>No Money</b> is for personal support pages and internet jokes — not a charity or fundraising platform. Be broke responsibly.",
    "foot.made": "made with 💸 no money", "foot.copy": "© no.money — be broke responsibly",
  },
  zh: {
    "lang.other": "EN",
    "nav.examples": "例子", "nav.how": "怎么玩", "nav.create": "做我的破产页",
    "hero.kicker": "💸 唯一的凡尔赛是没钱",
    "hero.h1": "没钱了？<br><span class=\"green\">那就官宣吧。</span>",
    "hero.sub": "破产时，做一个搞笑的求打赏页。放上收款链接，发出去，变得没那么穷一点。",
    "hero.cta1": "做我的破产页 →", "hero.cta2": "看个例子",
    "hero.note": "免注册 · 免费 · 60 秒搞定",
    "demos.eyebrow": "认证破产", "demos.h2": "大家真的会做的页面",
    "demos.p": "每一种穷都值得被看见。挑一个你的财务创伤。",
    "card.goal": "目标", "card.lessbroke": "脱贫", "card.broke_score": "破产分",
    "card.status": "状态", "card.risk": "风险等级",
    "how.eyebrow": "简单到心痛", "how.h2": "四步破产",
    "how.p": "免注册、不啰嗦——一分钟做出能发的破产页。",
    "how.s1t": "选你的穷法", "how.s1d": "泡面模式？房租恐慌？域名负债？选最扎心的那个。",
    "how.s2t": "放上收款链接", "how.s2d": "PayPal、Ko-fi、加密钱包——能收钱的都行。钱我们一分不碰。",
    "how.s3t": "生成分享图", "how.s3d": "一键生成可发 X / Reddit / 微信的梗图。这才是重点。",
    "how.s4t": "变得没那么穷", "how.s4d": "发出去。看着网友（在经济上）可怜你，破产分一点点往下掉。",
    "faq.eyebrow": "常见问题", "faq.h2": "穷人常问",
    "faq.q1": "这到底是啥？",
    "faq.a1": "No Money 把「我破产了」变成一个能转发的页面。选个破产状态、放上收款链接，生成带「破产分」的梗图卡片。让网友（在经济上）可怜你。",
    "faq.q2": "免费吗？", "faq.a2": "免费——创建和分享页面都免费，免注册。",
    "faq.q3": "你们抽成吗？", "faq.a3": "绝不。你的链接（PayPal、Ko-fi、加密钱包…）的钱直接进你口袋——No Money 一分不碰。",
    "faq.q4": "需要注册账号吗？", "faq.a4": "不用。你的页面就是一条可分享的链接——不用登录，没有密码要记。",
    "faq.q5": "这是真的募捐/慈善吗？", "faq.a5": "不是。它是个人求打赏页、创作者打赏和网络玩笑——不是慈善或募捐。请理性破产。",
    "cta.stamp": "💸 认证破产", "cta.h2": "我破产了，<br>但要破产得<span class=\"green\">好笑。</span>",
    "cta.p": "这就是全部功能。免费、免注册，60 秒变得没那么穷。",
    "cta.btn": "做我的破产页 →",
    "foot.tagline": "把破产，正式官宣。",
    "foot.disclaimer": "<b>No Money</b> 只是个人求打赏页和网络玩笑——不是慈善或募捐平台。请理性破产。",
    "foot.made": "用 💸 no money 制作", "foot.copy": "© no.money — 请理性破产",
  },
};

const urlLang = (() => { try { return new URLSearchParams(location.search).get("lang"); } catch (e) { return null; } })();
let lang = (urlLang === "en" || urlLang === "zh") ? urlLang
  : (localStorage.getItem("nm:lang") || ((navigator.language || "").toLowerCase().startsWith("zh") ? "zh" : "en"));
if (urlLang === "en" || urlLang === "zh") { try { localStorage.setItem("nm:lang", urlLang); } catch (e) {} }

function t(key) {
  const l = STR[lang] || STR.en;
  return (key in l ? l[key] : (STR.en[key] != null ? STR.en[key] : key));
}

function applyI18n(root = document) {
  root.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.getAttribute("data-i18n")); });
  root.querySelectorAll("[data-i18n-html]").forEach(el => { el.innerHTML = t(el.getAttribute("data-i18n-html")); });
  root.querySelectorAll("[data-i18n-ph]").forEach(el => { el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph"))); });
}

function setLang(l) {
  if (l !== "en" && l !== "zh") return;
  lang = l;
  try { localStorage.setItem("nm:lang", l); } catch (e) {}
  document.documentElement.lang = l === "zh" ? "zh-CN" : "en";
  applyI18n();
  window.dispatchEvent(new CustomEvent("langchange", { detail: { lang: l } }));
}

document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
window.I18N = { t, get lang() { return lang; }, setLang, apply: applyI18n };
