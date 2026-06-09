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
    es: { label: "Modo Ramen", tagline: "Gasté mi fondo de emergencia en cosas nada urgentes.", story: "Gasté mi fondo de emergencia en cosas que no eran emergencias.\nAhora sobrevivo a base de fideos instantáneos. Manda ayuda (o condimento).", risk: "Puede comer el mismo sabor 9 días seguidos" },
    ja: { label: "ラーメンモード", tagline: "緊急用の貯金を緊急じゃないものに使った。", story: "緊急用の貯金を、まったく緊急じゃないものに使った。\n今はインスタント麺で生きてる。助けを（または調味料を）送って。", risk: "同じ味を9日連続で食べる恐れあり" },
    msgs: [["Stay strong, soup soldier.", "anon"], ["Adding an egg = luxury. Treat yourself.", "kev"]],
    zhmsgs: [["撑住，泡面战士。", "anon"], ["加个蛋 = 奢侈，宠宠自己。", "kev"]],
    esmsgs: [["Mantente fuerte, soldado de sopa.", "anon"], ["Añadir un huevo = lujo. Date un capricho.", "kev"]],
    jamsgs: [["がんばれ、スープ戦士。", "anon"], ["卵をのせる＝贅沢。自分にご褒美を。", "kev"]],
  },
  rent: {
    label: "Rent Panic", emoji: "🏚️", accent: "#ff5468", base: 84, theme: "dark",
    tagline: "Rent is due. My bank account disagrees.",
    story: "Rent is due. My bank account disagrees.\nI'm bridging the gap between 'broke' and 'boxes by the curb'.",
    risk: "Negotiating with a landlord and losing",
    zh: { label: "房租恐慌", tagline: "房租到期了。我的余额不同意。", story: "房租到期了，我的银行余额表示不同意。\n我正在「破产」和「睡天桥」之间艰难过渡。", risk: "正在和房东谈判，且节节败退" },
    es: { label: "Pánico del Alquiler", tagline: "Toca pagar el alquiler. Mi cuenta no está de acuerdo.", story: "Toca pagar el alquiler. Mi cuenta bancaria no está de acuerdo.\nEstoy salvando la distancia entre «sin dinero» y «cajas en la acera».", risk: "Negociando con el casero y perdiendo" },
    ja: { label: "家賃パニック", tagline: "家賃の支払日。でも口座が反対している。", story: "家賃の支払日。でも銀行口座は反対している。\n「金欠」と「路上に段ボール」の間をなんとか埋めてる。", risk: "大家と交渉して負けつつある" },
    msgs: [["The floor is technically a bed too. Hang in there.", "anon"], ["Been there. Sending vibes + $.", "mara"]],
    zhmsgs: [["地板严格来说也算床，撑住。", "anon"], ["懂的都懂，给你打钱 + 打气。", "mara"]],
    esmsgs: [["El suelo técnicamente también es cama. Aguanta.", "anon"], ["He pasado por eso. Te mando vibras y $.", "mara"]],
    jamsgs: [["床も厳密にはベッド。耐えて。", "anon"], ["わかる。気持ちと$を送るよ。", "mara"]],
  },
  laidoff: {
    label: "Laid Off", emoji: "📦", accent: "#00d563", base: 83, theme: "clean",
    tagline: "Company said 'tough decision'. My rent agreed.",
    story: "I got 'impacted by a restructure'.\nTranslation: lots of free time, zero income.\nLinkedIn says I'm Open To Work. So is my wallet.",
    risk: "Refreshes job boards more often than their pulse",
    zh: { label: "被裁了", tagline: "公司说「这是个艰难的决定」，我的房租表示同意。", story: "我被「优化」了。\n翻译一下：时间大把，收入为零。\n领英写着「正在找工作」，我的钱包也是。", risk: "刷招聘软件比刷自己心跳还勤" },
    es: { label: "Despedido", tagline: "La empresa dijo «decisión difícil». Mi alquiler estuvo de acuerdo.", story: "Me «afectó una reestructuración».\nTraducción: mucho tiempo libre, cero ingresos.\nLinkedIn dice que estoy Abierto A Trabajar. Mi cartera también.", risk: "Refresca los portales de empleo más que su propio pulso" },
    ja: { label: "解雇された", tagline: "会社は「苦渋の決断」と言った。家賃も同意した。", story: "「組織再編の影響を受けた」。\n訳：自由時間たっぷり、収入ゼロ。\nLinkedInには「求職中」。財布も求職中。", risk: "求人サイトを脈拍より頻繁に更新する" },
    msgs: [["'Open to work' but make it iconic. You got this.", "anon"], ["Severance is just a long coffee break. Hang in.", "mei"], ["Their loss, literally. Sending $.", "dev_jen"]],
    zhmsgs: [["「正在找工作」也要找得体面，你可以的。", "anon"], ["遣散费就是一段很长的咖啡时间，挺住。", "mei"], ["是他们的损失，真的。打钱。", "dev_jen"]],
    esmsgs: [["«Abierto a trabajar» pero con estilo. Tú puedes.", "anon"], ["La indemnización es solo un café largo. Aguanta.", "mei"], ["Su pérdida, literalmente. Te mando $.", "dev_jen"]],
    jamsgs: [["「求職中」も堂々と。きっといける。", "anon"], ["退職金は長い休憩みたいなもの。耐えて。", "mei"], ["文字通り向こうの損失。$送る。", "dev_jen"]],
  },
  crypto: {
    label: "Crypto Damage", emoji: "📉", accent: "#ff5468", base: 81, theme: "gradient",
    tagline: "I was early. I was also catastrophically wrong.",
    story: "I was early. I was also catastrophically wrong.\nNow I'm funding my recovery arc one ramen at a time.\nNot financial advice — clearly.",
    risk: "Still insists 'it'll bounce back'",
    zh: { label: "币圈重创", tagline: "我入场很早。也错得很彻底。", story: "我入场很早，也错得很彻底。\n如今靠泡面一口一口走回血路。\n这显然不构成投资建议。", risk: "还在嘴硬「它会反弹的」" },
    es: { label: "Daño Cripto", tagline: "Llegué pronto. También me equivoqué catastróficamente.", story: "Llegué pronto. También me equivoqué catastróficamente.\nAhora financio mi recuperación, un ramen a la vez.\nNo es consejo financiero — obviamente.", risk: "Sigue insistiendo en que «va a remontar»" },
    ja: { label: "仮想通貨ダメージ", tagline: "参入は早かった。そして壊滅的に間違っていた。", story: "参入は早かった。そして壊滅的に間違っていた。\n今はラーメン一杯ずつ立て直し中。\n投資助言ではない——言うまでもなく。", risk: "いまだに「また上がる」と言い張る" },
    msgs: [["WAGMI. eventually. maybe.", "anon"], ["HODL your dignity at least.", "satoshi_lite"]],
    zhmsgs: [["WAGMI，迟早的，也许吧。", "anon"], ["至少把尊严 HODL 住。", "satoshi_lite"]],
    esmsgs: [["WAGMI. al final. quizás.", "anon"], ["Al menos haz HODL de tu dignidad.", "satoshi_lite"]],
    jamsgs: [["WAGMI。いつか。たぶん。", "anon"], ["せめて尊厳はHODLして。", "satoshi_lite"]],
  },
  student: {
    label: "Student Mode", emoji: "🎓", accent: "#00d563", base: 68, theme: "mono",
    tagline: "Studying hard. Eating soft.",
    story: "Studying hard. Eating soft.\nTuition took everything, including my will to cook.\nEvery coffee keeps me conscious in lectures.",
    risk: "Sustained entirely by free campus pizza events",
    zh: { label: "学生模式", tagline: "学得很努力，吃得很清淡。", story: "学得很努力，吃得很清淡。\n学费掏空了我，连做饭的心气也一起掏空。\n每杯咖啡都让我在课上多撑一会儿。", risk: "全靠蹭学校免费披萨续命" },
    es: { label: "Modo Estudiante", tagline: "Estudiando duro. Comiendo blando.", story: "Estudiando duro. Comiendo blando.\nLa matrícula se llevó todo, incluidas mis ganas de cocinar.\nCada café me mantiene consciente en clase.", risk: "Se sostiene solo con la pizza gratis del campus" },
    ja: { label: "学生モード", tagline: "勉強はハード。食事はソフト。", story: "勉強はハード、食事はソフト。\n学費が全部持っていった、料理する気力まで。\nコーヒーだけが講義中の意識を保ってる。", risk: "学内の無料ピザイベントだけで生き延びている" },
    msgs: [["Future you will pay it forward.", "anon"], ["Ace those finals, broke legend.", "prof_no"]],
    zhmsgs: [["未来的你会把这份好传下去的。", "anon"], ["期末加油，破产传奇。", "prof_no"]],
    esmsgs: [["El tú del futuro lo devolverá con creces.", "anon"], ["Arrasa en los finales, leyenda pobre.", "prof_no"]],
    jamsgs: [["未来の君がきっと恩を返す。", "anon"], ["期末を制覇しろ、破産の伝説。", "prof_no"]],
  },
  startup: {
    label: "Startup Broke", emoji: "🚀", accent: "#00d563", base: 76, theme: "gradient",
    tagline: "Pre-revenue, pre-funding, pre-lunch.",
    story: "We're pre-revenue, pre-funding, and pre-lunch.\nRunway is short. Vibes are immaculate.\nHelp us reach ramen profitability.",
    risk: "Will pivot before paying themselves",
    zh: { label: "创业破产", tagline: "没收入、没融资、没午饭。", story: "我们没收入、没融资、还没吃午饭。\n现金跑道很短，氛围感很足。\n帮我们撑到「泡面级盈利」。", risk: "会先转型，再考虑给自己发工资" },
    es: { label: "Startup en Quiebra", tagline: "Sin ingresos, sin financiación, sin almuerzo.", story: "Estamos sin ingresos, sin financiación y sin almuerzo.\nLa pista es corta. Las vibras, inmaculadas.\nAyúdanos a llegar a la rentabilidad ramen.", risk: "Hará pivote antes de pagarse un sueldo" },
    ja: { label: "スタートアップ破産", tagline: "売上前、資金調達前、昼飯前。", story: "売上ゼロ、資金調達ゼロ、まだ昼飯も食べてない。\nランウェイは短い。雰囲気は最高。\n「ラーメン黒字」まで助けて。", risk: "自分に給料を払う前にピボットする" },
    msgs: [["To the moon (economy class).", "anon"], ["Default alive starts with a coffee.", "yc_reject"]],
    zhmsgs: [["奔向月球（经济舱）。", "anon"], ["活下去，从一杯咖啡开始。", "yc_reject"]],
    esmsgs: [["A la luna (en clase turista).", "anon"], ["Seguir vivo empieza con un café.", "yc_reject"]],
    jamsgs: [["月へ（エコノミークラスで）。", "anon"], ["生き残りはコーヒー一杯から。", "yc_reject"]],
  },
  freelance: {
    label: "Freelancer Drought", emoji: "💼", accent: "#ff8a3d", base: 74, theme: "tint",
    tagline: "Invoices sent. Payments pending. Spirit broken.",
    story: "Invoices sent. Payments pending. Spirit broken.\nClients say 'the check is coming'. It is not coming.\nBridge me to net-30.",
    risk: "Owed money by 4 people, none replying",
    zh: { label: "自由职业旱季", tagline: "发票发了，钱没到，心碎了。", story: "发票发了，款项待付，人快碎了。\n客户说「钱马上到」。钱不会到。\n帮我撑过这个回款周期。", risk: "四个人欠我钱，零个人回我消息" },
    es: { label: "Sequía Freelance", tagline: "Facturas enviadas. Pagos pendientes. Ánimo roto.", story: "Facturas enviadas. Pagos pendientes. Ánimo roto.\nLos clientes dicen «el cheque ya va». No va.\nLlévame hasta el pago a 30 días.", risk: "Cuatro personas le deben dinero; ninguna responde" },
    ja: { label: "フリーランスの干ばつ", tagline: "請求書は送った。入金は保留。心は折れた。", story: "請求書は送った。入金は保留中。心は折れた。\nクライアントは「もうすぐ振り込む」と言う。振り込まれない。\n30日後の入金まで繋いで。", risk: "4人が金を借りていて、誰も返信しない" },
    msgs: [["Net-30 is a personality test. You're passing.", "anon"], ["Chasing that invoice for you in spirit.", "rin"]],
    zhmsgs: [["回款周期是场人格测试，你正在通过。", "anon"], ["精神上替你催着那张发票。", "rin"]],
    esmsgs: [["El pago a 30 días es un test de personalidad. Lo estás aprobando.", "anon"], ["Persigo esa factura por ti, en espíritu.", "rin"]],
    jamsgs: [["入金待ちは人格テスト。君は合格しつつある。", "anon"], ["その請求書、気持ちだけ一緒に追いかけてる。", "rin"]],
  },
  pet: {
    label: "Pet's Employee", emoji: "🐱", accent: "#ff8a3d", base: 75, theme: "mono",
    tagline: "I have a job: serving a cat who doesn't pay me.",
    story: "I don't have a pet. I have a tiny landlord with fur.\nVet bills, imported kibble, a $40 toy ignored for the box.\nI just work here now. Tips fund the snacks.",
    risk: "Will spend rent on a fountain the cat refuses to drink from",
    zh: { label: "给猫主子打工", tagline: "我有份工作：伺候一只不给我发工资的猫。", story: "我养的不是宠物，是一位带毛的房东。\n看病、进口猫粮、四十块的玩具——它只玩盒子。\n我现在是这儿的打工人，打赏都拿去进贡零食。", risk: "会拿房租给主子买它根本不喝的饮水机" },
    es: { label: "Empleado del Gato", tagline: "Tengo un trabajo: servir a un gato que no me paga.", story: "No tengo una mascota. Tengo un casero diminuto con pelo.\nFacturas del veterinario, pienso importado, un juguete de 40$ ignorado por la caja.\nSolo trabajo aquí. Las propinas pagan las chuches.", risk: "Se gastará el alquiler en una fuente de la que el gato se niega a beber" },
    ja: { label: "猫の従業員", tagline: "仕事がある：給料をくれない猫に仕える。", story: "ペットを飼ってるんじゃない。毛の生えた小さな大家がいる。\n獣医代、輸入カリカリ、40ドルのおもちゃは無視され箱で遊ぶ。\nもう私はただの従業員。投げ銭はおやつ代に。", risk: "猫が飲もうとしない給水器に家賃を使う" },
    msgs: [["Give the tiny landlord a raise. Sending $.", "anon"], ["The box was the real gift. Stay strong.", "lee"]],
    zhmsgs: [["给带毛的房东涨涨工资吧，打钱。", "anon"], ["盒子才是真正的礼物，撑住。", "lee"]],
    esmsgs: [["Súbele el sueldo al casero diminuto. Te mando $.", "anon"], ["La caja era el verdadero regalo. Aguanta.", "lee"]],
    jamsgs: [["毛の生えた大家に昇給を。$送る。", "anon"], ["箱こそが本当の贈り物。耐えて。", "lee"]],
  },
};

const STATUS_ORDER = ["ramen", "rent", "laidoff", "crypto", "student", "startup", "freelance", "pet"];

/* full demo pages used on the landing page (p.html?demo=key).
   curated funny button labels — the buttons ARE part of the joke. */
const DEMOS = {
  ramen:   { name: "Mika",  handle: "ramen",         status: "ramen",  goal: 200, raised: 74, zhcta: "🍜 给我加个蛋", escta: "🍜 Ponme un huevo", jacta: "🍜 卵をのせて",
    links: [{ kind: "ramen", url: "#", label: "🍜 Add an egg to my life", zh: "🍜 给我的泡面加个蛋", es: "🍜 Añade un huevo a mi vida", ja: "🍜 人生に卵を一つ" }, { kind: "coffee", url: "#" }, { kind: "paypal", url: "#" }] },
  rent:    { name: "Devon", handle: "rent",          status: "rent",   goal: 850, raised: 310, zhcta: "🏚️ 别让我露宿", escta: "🏚️ Que no acabe en la calle", jacta: "🏚️ 路上に出さないで",
    links: [{ kind: "custom", url: "#", label: "🏚️ Keep me indoors", zh: "🏚️ 别让我露宿街头", es: "🏚️ Que no acabe en la calle", ja: "🏚️ 路上に出さないで" }, { kind: "paypal", url: "#" }, { kind: "coffee", url: "#" }] },
  laidoff: { name: "Mira",  handle: "laidoff",      status: "laidoff", goal: 500, raised: 210, zhcta: "📦 资助我待业", escta: "📦 Financia mi paro", jacta: "📦 無職を支援",
    links: [{ kind: "custom", url: "#", label: "📦 Fund my funemployment", zh: "📦 赞助我的待业人生", es: "📦 Financia mi paro divertido", ja: "📦 楽しい無職生活を支援" }, { kind: "coffee", url: "#" }, { kind: "paypal", url: "#", label: "💸 Bridge me to the next offer", zh: "💸 撑我到下一个 offer", es: "💸 Llévame hasta la próxima oferta", ja: "💸 次のオファーまで繋いで" }] },
  crypto:  { name: "Sol",   handle: "crypto-loss",   status: "crypto", goal: 1000, raised: 137, zhcta: "📉 资助我的回血", escta: "📉 Financia mi remontada", jacta: "📉 回復を支援",
    links: [{ kind: "custom", url: "#", label: "📉 Fund my recovery arc", zh: "📉 资助我回血", es: "📉 Financia mi remontada", ja: "📉 立て直しを支援" }, { kind: "crypto", url: "#", label: "🪙 Send a coin that won't crash", zh: "🪙 给我个不会崩的币", es: "🪙 Mándame una moneda que no se hunda", ja: "🪙 暴落しないコインを" }, { kind: "paypal", url: "#" }] },
  student: { name: "Aria",  handle: "student",       status: "student", goal: 300, raised: 189, zhcta: "☕ 给我的期末续命", escta: "☕ Cafeína para finales", jacta: "☕ 期末に延命を",
    links: [{ kind: "coffee", url: "#", label: "☕ Caffeinate my finals", zh: "☕ 给我的期末续咖啡", es: "☕ Cafeína para mis exámenes", ja: "☕ 期末にカフェインを" }, { kind: "custom", url: "#", label: "🍕 Diversify my pizza diet", zh: "🍕 让我的披萨换换口味", es: "🍕 Diversifica mi dieta de pizza", ja: "🍕 ピザ食生活に多様性を" }, { kind: "paypal", url: "#" }] },
  pet:     { name: "Tess",  handle: "catstaff",      status: "pet",    goal: 300, raised: 96, zhcta: "🐱 给主子进贡", escta: "🐱 Tributo al gato", jacta: "🐱 猫様に貢ぐ",
    links: [{ kind: "custom", url: "#", label: "🐱 Fund the tiny landlord", zh: "🐱 给带毛房东进贡", es: "🐱 Financia al casero diminuto", ja: "🐱 小さな大家を支援" }, { kind: "coffee", url: "#" }, { kind: "paypal", url: "#", label: "💸 Pay the cat's bills", zh: "💸 替猫主子还账单", es: "💸 Paga las facturas del gato", ja: "💸 猫の請求書を払って" }] },
};

// `prefix` marks a kind whose URL is just "<prefix><handle>", so the create form can ask
// for the handle alone (see splitHandle/joinHandle). Each prefix host MUST be listed in
// BRAND_HOSTS (functions/_links.js) so the URL we build passes the anti-spoof check.
const PAYMENT_KINDS = {
  ramen:   { label: "🍜 Buy me ramen",        zh: "🍜 请我吃泡面",      es: "🍜 Cómprame ramen",        ja: "🍜 ラーメンをおごって",      cls: "",    ex: "https://your-tip-link.com" },
  coffee:  { label: "☕ Send emergency coffee", zh: "☕ 来杯救命咖啡",    es: "☕ Mándame un café de emergencia", ja: "☕ 緊急コーヒーを送って", cls: "alt", prefix: "buymeacoffee.com/",   ex: "https://buymeacoffee.com/you" },
  paypal:  { label: "💸 PayPal me",            zh: "💸 用 PayPal 打赏",  es: "💸 Págame por PayPal",     ja: "💸 PayPalで送って",          cls: "alt", prefix: "paypal.me/",          ex: "https://paypal.me/you" },
  venmo:   { label: "📲 Venmo",                zh: "📲 Venmo",           cls: "alt", prefix: "venmo.com/u/",        ex: "https://venmo.com/u/you" },
  cashapp: { label: "💵 Cash App",             zh: "💵 Cash App",        cls: "alt", prefix: "cash.app/$",          ex: "https://cash.app/$you" },
  kofi:    { label: "❤️ Ko-fi",                zh: "❤️ Ko-fi",           cls: "alt", prefix: "ko-fi.com/",          ex: "https://ko-fi.com/you" },
  patreon: { label: "🧡 Patreon",              zh: "🧡 Patreon",         cls: "alt", prefix: "patreon.com/",        ex: "https://patreon.com/you" },
  ghspon:  { label: "💖 GitHub Sponsors",      zh: "💖 GitHub 赞助",     cls: "alt", prefix: "github.com/sponsors/", ex: "https://github.com/sponsors/you" },
  stripe:  { label: "💳 Card / Stripe",        zh: "💳 刷卡 / Stripe",   es: "💳 Tarjeta / Stripe",      ja: "💳 カード / Stripe",         cls: "alt", ex: "https://buy.stripe.com/xxxxxx" },
  crypto:  { label: "🪙 Crypto wallet",         zh: "🪙 加密钱包",        es: "🪙 Monedero cripto",       ja: "🪙 暗号資産ウォレット",       cls: "alt", ex: "0x… or your wallet address" },
  wise:    { label: "🌍 Wise",                 zh: "🌍 Wise",            cls: "alt", prefix: "wise.com/pay/me/",     ex: "https://wise.com/pay/me/you" },
  revolut: { label: "💱 Revolut",              zh: "💱 Revolut",         cls: "alt", prefix: "revolut.me/",         ex: "https://revolut.me/you" },
  monzo:   { label: "💷 Monzo",                zh: "💷 Monzo",           cls: "alt", prefix: "monzo.me/",           ex: "https://monzo.me/you" },
  alipay:  { label: "💙 Alipay",               zh: "💙 支付宝",          cls: "alt", ex: "https://qr.alipay.com/xxxxxx" },
  custom:  { label: "🔗 Support link",          zh: "🔗 打赏链接",        es: "🔗 Enlace de apoyo",       ja: "🔗 応援リンク",              cls: "alt", ex: "https://your-link.com" },
};

/* retired kinds → their canonical replacement, so old pages keep a sensible button.
   "bmc" was a duplicate of "coffee" (same icon + buymeacoffee.com) and was removed. */
const KIND_ALIAS = { bmc: "coffee" };
const canonKind = k => KIND_ALIAS[k] || k || "custom";

/* active UI language (defaults to en outside the browser / before i18n loads) */
function curLang() { return (typeof window !== "undefined" && window.I18N && window.I18N.lang) || "en"; }
const num = n => (Number(n) || 0).toLocaleString();

/* localize a status to the current language (a per-lang object overrides label/tagline/story/risk) */
function locStatus(st) {
  if (!st) return st;
  const o = st[curLang()];
  return o ? { ...st, ...o } : st;
}
/* localized payment-kind label (falls back to the English label for brand-only kinds) */
function payLabel(kind) {
  const k = PAYMENT_KINDS[kind] || PAYMENT_KINDS.custom;
  return k[curLang()] || k.label;
}
/* ---- handle ⇄ full-URL for branded kinds with a fixed URL prefix ----
   Many branded links are just "<prefix><handle>" (buymeacoffee.com/you). The create
   form asks only for the handle, but the stored link.url stays the full URL so that
   page rendering, sharing and the server-side anti-spoof check never have to know. */
function payPrefix(kind) { return (PAYMENT_KINDS[kind] || {}).prefix || ""; }

// registrable host of a user-entered URL (bare domains get https://); "" if unparseable
function urlHost(u) {
  try {
    let s = String(u || "").trim();
    if (!s) return "";
    if (!/^[a-z][a-z0-9+.\-]*:/i.test(s)) s = "https://" + s;
    return new URL(s).hostname.toLowerCase().replace(/^www\./, "");
  } catch { return ""; }
}

// strip "<scheme>://", "www.", the prefix host and its path marker (/u/, /sponsors/, $)
// off whatever was typed or pasted, leaving just the bare handle
function stripToHandle(prefix, s) {
  s = String(s || "").trim().replace(/^[a-z][a-z0-9+.\-]*:\/\//i, "").replace(/^www\./i, "");
  const host = prefix.split("/")[0];
  if (s.toLowerCase().startsWith(host.toLowerCase())) {
    s = s.slice(host.length).replace(/^\/+/, "");
    const marker = prefix.slice(host.length).replace(/^\/+/, "");   // "u/", "sponsors/", "pay/me/", "$"
    if (marker && s.toLowerCase().startsWith(marker.toLowerCase())) s = s.slice(marker.length);
  }
  return s.replace(/^[@$/]+/, "").split(/[/?#\s]/)[0];
}

// How the form should show a stored URL:
//   { mode:"handle", value:<handle> } — on the prefix host (or empty)
//   { mode:"full",   value:<url> }    — a non-handle kind, or an alternate host (paypal.com)
function splitHandle(kind, url) {
  const prefix = payPrefix(kind);
  const u = String(url || "").trim();
  if (!prefix) return { mode: "full", value: u };
  if (!u) return { mode: "handle", value: "" };
  const host = urlHost(u);
  if (host && host !== prefix.split("/")[0].toLowerCase()) return { mode: "full", value: u };
  return { mode: "handle", value: stripToHandle(prefix, u) };
}

// Build the full URL to store from the handle box. Paste-tolerant: a full URL on a
// *different* allowed host (a paypal.com business link) is kept verbatim; a bare dotted
// handle (john.doe) is NOT mistaken for a domain because we require a path slash.
function joinHandle(kind, input) {
  const prefix = payPrefix(kind);
  let s = String(input || "").trim();
  if (!prefix) return s;
  if (!s) return "";
  const hasScheme = /^[a-z][a-z0-9+.\-]*:\/\//i.test(s);
  const hasHostPath = /^[\w.\-]+\.[a-z]{2,}\//i.test(s);   // host + path → a real URL
  if ((hasScheme || hasHostPath) && urlHost(s) !== prefix.split("/")[0].toLowerCase()) {
    return hasScheme ? s : "https://" + s;
  }
  const handle = stripToHandle(prefix, s);
  return handle ? "https://" + prefix + handle : "";
}

// Destination host to surface under a free-form button (custom/ramen/crypto), so a
// deceptive custom label ("💳 PayPal" → evil.ru) can't hide where the link really goes.
// Branded kinds are host-locked → no hint; wallet addresses / non-web schemes get none.
function freeFormHost(kind, url) {
  if (brandHostFor(kind)) return "";                                      // branded → locked to its host
  const s = String(url || "").trim();
  if (!s) return "";
  if (/^[a-z][a-z0-9+.\-]*:/i.test(s) && !/^https?:/i.test(s)) return ""; // bitcoin:, mailto:, …
  // the authority must literally contain a dot — guards bare tokens / hex wallet addrs
  // that the URL parser would otherwise coerce into a numeric IP host (0x1234abcd → an IP)
  const authority = s.replace(/^https?:\/\//i, "").split(/[/?#]/)[0];
  return authority.includes(".") ? urlHost(s) : "";
}

const BANDS = {
  zh: {
    "Financially dramatic": "财务戏精", "Critically broke": "重度破产",
    "Aggressively broke": "激进破产", "Casually broke": "轻度破产", "Suspiciously fine": "可疑地还行",
  },
  es: {
    "Financially dramatic": "Dramáticamente arruinado", "Critically broke": "Pobreza crítica",
    "Aggressively broke": "Pobreza agresiva", "Casually broke": "Pobreza casual", "Suspiciously fine": "Sospechosamente bien",
  },
  ja: {
    "Financially dramatic": "財政ドラマクイーン", "Critically broke": "重度の破産",
    "Aggressively broke": "本格的に破産", "Casually broke": "軽めの破産", "Suspiciously fine": "怪しいほど無事",
  },
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

  const map = BANDS[curLang()];
  return { score: s, band: map ? (map[band] || band) : band, risk: locStatus(st).risk };
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
/* ---------------- localized dynamic copy ----------------
   Strings that interpolate live data (name, score, $) — kept here as per-language
   builders so pages and the share-image renderer stay language-agnostic. */
const LEX = {
  en: {
    someoneName: "Someone", someoneCard: "Someone broke",
    title: (n, s) => `${n} is ${s}% broke · No Money`,
    share: (n, s) => `${n} is ${s}% broke 💸`,
    raised: (r, g) => `$${num(r)} raised of $${num(g)} survival fund`,
    img: { score: s => `BROKE SCORE  ${s}/100`, h1: n => `${n} is`, h2: s => `${s}% broke.`,
           quote: "Help me become slightly less broke.", prog: (p, g) => `${p}% to $${num(g)} survival goal` },
  },
  zh: {
    someoneName: "某人", someoneCard: "某破产人士",
    title: (n, s) => `${n} 破产 ${s}% · No Money`,
    share: (n, s) => `${n} 破产 ${s}% 💸`,
    raised: (r, g) => `已筹 $${num(r)} / 目标 $${num(g)} 生存基金`,
    img: { score: s => `破产分  ${s}/100`, h1: n => `${n}`, h2: s => `破产 ${s}%`,
           quote: "帮我变得没那么穷一点。", prog: (p, g) => `已达成 ${p}% · 生存目标 $${num(g)}` },
  },
  es: {
    someoneName: "Alguien", someoneCard: "Alguien sin dinero",
    title: (n, s) => `${n} está ${s}% en quiebra · No Money`,
    share: (n, s) => `${n} está ${s}% en quiebra 💸`,
    raised: (r, g) => `$${num(r)} recaudados de $${num(g)} para sobrevivir`,
    img: { score: s => `NIVEL DE QUIEBRA  ${s}/100`, h1: n => `${n} está`, h2: s => `${s}% en quiebra`,
           quote: "Ayúdame a estar un poco menos pobre.", prog: (p, g) => `${p}% de $${num(g)} para sobrevivir` },
  },
  ja: {
    someoneName: "誰か", someoneCard: "無一文の誰か",
    title: (n, s) => `${n} は ${s}% 破産 · No Money`,
    share: (n, s) => `${n} は ${s}% 破産 💸`,
    raised: (r, g) => `生存資金 $${num(g)} のうち $${num(r)} 達成`,
    img: { score: s => `破産スコア  ${s}/100`, h1: n => `${n} は`, h2: s => `${s}% 破産`,
           quote: "ちょっとだけ救ってください。", prog: (p, g) => `生存目標 $${num(g)} の ${p}%` },
  },
};
function lx() { return LEX[curLang()] || LEX.en; }

/* default display name when the page left it blank */
function someone() { return lx().someoneCard; }
/* localized "$X raised of $Y survival fund" line under the goal bar */
function raisedLine(raised, goal) { return lx().raised(raised, goal); }
/* "X% less broke" — number-first everywhere except zh, which leads with the label */
function pctLine(pct) {
  const lab = (window.I18N && window.I18N.t("card.lessbroke")) || "less broke";
  return curLang() === "zh" ? `${lab} ${pct}%` : `${pct}% ${lab}`;
}
/* localized document title for a page (name + broke score) */
function pageTitle(name, score) { return lx().title(name, score); }

/* a funny, ready-to-post caption built from the page data */
function shareText(data) {
  const st = locStatus(STATUSES[data.status] || STATUSES.ramen);
  const bs = brokeScore(data);
  const line = (data.story || "").split("\n")[0].trim() || st.tagline || "";
  const L = lx();
  return L.share(data.name || L.someoneName, bs.score) + (line ? " — " + line : "");
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

  const L = lx();
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
  const scoreTxt = L.img.score(bs.score);
  const sw = ctx.measureText(scoreTxt).width + 52;
  roundRect(ctx, W - 72 - sw, 72, sw, 50, 25); ctx.fillStyle = "#ffffff"; ctx.fill();
  ctx.strokeStyle = "#e7e0d3"; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = "#18191c"; ctx.fillText(scoreTxt, W - 72 - sw + 26, 104);

  // headline: "X is 87% broke."
  ctx.fillStyle = "#18191c";
  ctx.font = "800 90px -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.fillText(L.img.h1(data.name || L.someoneName), 72, 232);
  ctx.fillStyle = deep;
  ctx.fillText(L.img.h2(bs.score), 72, 330);

  // the punchline — first line of their story (or status tagline)
  const quote = (data.story || "").split("\n")[0].trim() || st.tagline || L.img.quote;
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
  ctx.fillText(L.img.prog(pct, data.goal), 72, barY + 44);
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
window.NM = { STATUSES, STATUS_ORDER, DEMOS, PAYMENT_KINDS, locStatus, payLabel, canonKind, payPrefix, splitHandle, joinHandle, freeFormHost, brokeScore, pctOf, safeUrl, brandMismatch, brandHostFor, drawShareImage, shareText, shareIntents, renderShareRow, raisedLine, pctLine, pageTitle, someone };
