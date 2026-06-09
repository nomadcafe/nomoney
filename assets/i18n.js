// Tiny i18n runtime. Lang = saved choice → else browser (zh* → zh) → else en.
// Static text: tag elements with data-i18n / data-i18n-ph / data-i18n-html.
// Dynamic text: I18N.t(key). On language change, a "langchange" event fires so pages re-render.

const STR = {
  en: {
    "lang.other": "Español",
    "nav.examples": "Examples", "nav.how": "How it works", "nav.create": "Create my page",
    "hero.kicker": "💸 the only flex is having none",
    "hero.h1": "No Money?<br><span class=\"green\">Make it official.</span>",
    "hero.sub": "Create a funny support page when you're broke. Add your tip links. Share it. Become slightly less broke.",
    "hero.cta1": "Create my broke page →", "hero.cta2": "See an example",
    "hero.note": "no signup · free · ready in 60 seconds",
    "demos.eyebrow": "Certified broke", "demos.h2": "Pages people actually made up",
    "demos.p": "Every kind of broke deserves representation. Pick your financial trauma.",
    "wall.eyebrow": "Wall of broke", "wall.h2": "Real people, recently certified broke",
    "wall.p": "Actual pages people made and shared. Yes, you can be on this wall.",
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
    "foot.made": "made with 💸 no money", "foot.copy": "© no.money — be broke responsibly", "foot.source": "Open source ↗",
    "nf.title": "Too broke to exist · No Money", "nf.stamp": "💸 404 · Insufficient funds",
    "nf.h2": "This page is<br>too <span class=\"green\">broke</span> to exist.",
    "nf.p": "It spent its last byte. But you can always make a fresh one.", "nf.home": "Back home",
    "create.head_h1": "Build your broke page", "create.head_p": "No signup — it lives in a shareable link. About 60 seconds.",
    "create.surprise": "🎲 Surprise me", "create.name": "Your name",
    "create.avatar": "Avatar", "create.avatar_hint": "(optional — defaults to your broke status)",
    "create.handle": "Your handle", "create.editnote": "Editing — the URL stays the same.",
    "create.status_q": "What kind of broke are you?", "create.story": "Your sob story",
    "create.story_ph": "Make it funny. Self-pity sells.",
    "create.name_ph": "e.g. Mira", "create.handle_ph": "your-handle",
    "title.index": "No Money — funny support pages for broke creators", "title.create": "Create your broke page · No Money",
    "create.ai_btn": "✨ Rewrite it funnier (AI)", "create.ai_hint": "Rewrites your story with AI — falls back to curated punch-ups if AI is busy.",
    "create.goal": "Goal & progress", "create.goal_hint": "survival goal", "create.raised_hint": "raised so far",
    "create.links": "Support links", "create.links_note": "(money goes straight to you)", "create.add_link": "+ Add support link",
    "create.publish": "Get my broke page →", "create.publish_note": "No signup. Your page lives in a shareable link.",
    "create.preview_label": "Live preview", "create.publishtop": "Get my page →",
    "resume.has": "You already have a page:", "resume.edit": "Edit it", "resume.new": "Start a new one",
    "create.publishing": "Publishing…", "create.updating": "Updating…", "create.update_btn": "Update my page →",
    "create.edit_h1": "Edit your page", "create.thinking": "✨ Thinking…", "create.loading": "Loading your page…",
    "emoji.auto": "Auto", "link.btn_text_ph": "Button text — e.g. ", "link.url_ph": "https://your-link.com",
    "modal.badge": "💸 You're officially broke", "modal.live_h3": "Your page is live 🎉",
    "modal.updated_badge": "✅ Updated", "modal.updated_h3": "Your page is updated 🎉",
    "modal.copy": "Copy link", "modal.share_label": "Share it — the image does the begging",
    "btn.copied": "Copied ✓",
    "modal.open": "Open my page ↗", "modal.download": "⬇ Download image",
    "modal.editlink": "Private link to edit this page later", "modal.edithint_tail": "— anyone with it can edit, keep it to yourself.",
    "modal.edit_title": "Save your private edit link",
    "modal.edit_warn": "This is the only way to edit this page later — there are no accounts. Clearing your browser data loses access. Anyone with the link can edit, so keep it private.",
    "modal.edit_copy": "Copy edit link",
    "card.score_of": "/100", "card.survival": "raised of",
    "p.share_btn": "📸 Get share image", "p.copy_btn": "🔗 Copy link",
    "p.remix_strong": "Broke too?", "p.remix_span": "Make your own broke page in 60 seconds. No signup.", "p.remix_btn": "Make mine →",
    "p.foot": "made with <b>no.money</b>",
    "p.modal_h3": "Your share image is ready 📸", "p.modal_p": "Post it on X, Reddit or Telegram. The image does the begging for you.",
    "p.modal_download": "⬇ Download image", "p.modal_close": "Close",
    "msg.title": "Support messages", "msg.name_ph": "Your name (optional)", "msg.text_ph": "Cheer them on — or roast them. Keep it funny.",
    "msg.post": "Post message", "msg.empty": "No messages yet — be the first to pity them (financially).",
    "toast.link_copied": "Link copied 🔗", "toast.copy_manual": "Press ⌘/Ctrl+C to copy", "toast.copy_fail": "Copy failed — select the URL bar",
    "toast.tip_add_link": "Tip: add a support link so people can actually tip you 💸",
    "toast.publish_fail": "Couldn't publish — check your connection and try again",
    "toast.edit_invalid": "This edit link is invalid — can't update", "toast.no_edit_access": "No edit access on this device — changes won't save",
    "toast.load_fail": "Couldn't load that page", "toast.ai_done": "✨ Rewritten by AI",
    "toast.ai_rate": "Too many AI rewrites — here's a curated one", "toast.ai_punch": "✨ Punched up",
    "toast.surprise": "🎲 Rolled a fresh broke persona", "toast.links_max": "Free plan: 5 links max",
    "toast.write_first": "Write something first", "toast.posted": "Posted 🎉",
    "toast.no_links_msg": "Links aren't allowed", "toast.post_fail": "Couldn't post — try again",
    "toast.deleted": "Deleted", "toast.delete_fail": "Couldn't delete",
    "toast.edit_copied": "Edit link copied — save it somewhere safe 🔒",
    "link.must_match": "This button must link to {host}",
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
    "wall.eyebrow": "破产墙", "wall.h2": "真实用户，刚刚认证破产",
    "wall.p": "都是大家真做出来、发出去的页面。对，你也能上墙。",
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
    "foot.made": "用 💸 no money 制作", "foot.copy": "© no.money — 请理性破产", "foot.source": "开源 ↗",
    "nf.title": "穷到不存在 · No Money", "nf.stamp": "💸 404 · 余额不足",
    "nf.h2": "这个页面<br>穷到<span class=\"green\">不存在</span>了。",
    "nf.p": "它花光了最后一个字节。不过你随时能做一个新的。", "nf.home": "返回首页",
    "create.head_h1": "做你的破产页", "create.head_p": "免注册——它就是一条可分享的链接。约 60 秒。",
    "create.surprise": "🎲 随机来一个", "create.name": "你的名字",
    "create.avatar": "头像", "create.avatar_hint": "（可选——默认用你的破产状态）",
    "create.handle": "你的 handle", "create.editnote": "编辑中——网址不变。",
    "create.status_q": "你是哪种穷？", "create.story": "你的卖惨故事",
    "create.story_ph": "写得好笑点。卖惨好使。",
    "create.name_ph": "例如 Mira", "create.handle_ph": "你的-handle",
    "title.index": "No Money — 给破产创作者的搞笑求打赏页", "title.create": "做你的破产页 · No Money",
    "create.ai_btn": "✨ 用 AI 写得更惨更好笑", "create.ai_hint": "用 AI 帮你重写——AI 忙时回退到精选文案。",
    "create.goal": "目标 & 进度", "create.goal_hint": "生存目标", "create.raised_hint": "已筹到",
    "create.links": "收款链接", "create.links_note": "（钱直接进你口袋）", "create.add_link": "+ 添加收款链接",
    "create.publish": "生成我的破产页 →", "create.publish_note": "免注册。你的页面就是一条可分享的链接。",
    "create.preview_label": "实时预览", "create.publishtop": "生成页面 →",
    "resume.has": "你已经有一个页面：", "resume.edit": "编辑它", "resume.new": "新建一个",
    "create.publishing": "发布中…", "create.updating": "更新中…", "create.update_btn": "更新我的页面 →",
    "create.edit_h1": "编辑你的页面", "create.thinking": "✨ 思考中…", "create.loading": "正在加载你的页面…",
    "emoji.auto": "默认", "link.btn_text_ph": "按钮文字——例如 ", "link.url_ph": "https://你的链接.com",
    "modal.badge": "💸 你已正式破产", "modal.live_h3": "你的页面上线了 🎉",
    "modal.updated_badge": "✅ 已更新", "modal.updated_h3": "你的页面已更新 🎉",
    "modal.copy": "复制链接", "modal.share_label": "发出去——让图替你卖惨",
    "btn.copied": "已复制 ✓",
    "modal.open": "打开我的页面 ↗", "modal.download": "⬇ 下载图片",
    "modal.editlink": "以后编辑此页的私密链接", "modal.edithint_tail": "——有此链接的人都能编辑，请自己保管。",
    "modal.edit_title": "保存你的私密编辑链接",
    "modal.edit_warn": "这是以后编辑此页的唯一方式——本站没有账户。清除浏览器数据就会失去编辑权。有此链接的人都能编辑，请自己保管。",
    "modal.edit_copy": "复制编辑链接",
    "card.score_of": "/100", "card.survival": "已筹",
    "p.share_btn": "📸 生成分享图", "p.copy_btn": "🔗 复制链接",
    "p.remix_strong": "你也破产了？", "p.remix_span": "60 秒做你自己的破产页。免注册。", "p.remix_btn": "做我的 →",
    "p.foot": "用 <b>no.money</b> 制作",
    "p.modal_h3": "分享图好了 📸", "p.modal_p": "发到 X / Reddit / 微信。让图替你卖惨。",
    "p.modal_download": "⬇ 下载图片", "p.modal_close": "关闭",
    "msg.title": "支持留言", "msg.name_ph": "你的名字（可选）", "msg.text_ph": "给 TA 打气——或者吐槽。保持好笑。",
    "msg.post": "发布留言", "msg.empty": "还没有留言——来当第一个（在经济上）可怜 TA 的人。",
    "toast.link_copied": "链接已复制 🔗", "toast.copy_manual": "按 ⌘/Ctrl+C 复制", "toast.copy_fail": "复制失败——请选中地址栏",
    "toast.tip_add_link": "提示：加个收款链接，别人才打赏得了你 💸",
    "toast.publish_fail": "发布失败——检查网络后重试",
    "toast.edit_invalid": "编辑链接无效——无法更新", "toast.no_edit_access": "本设备无编辑权限——更改不会保存",
    "toast.load_fail": "无法加载该页面", "toast.ai_done": "✨ AI 已重写",
    "toast.ai_rate": "AI 改写太频繁——给你一条精选的", "toast.ai_punch": "✨ 已润色",
    "toast.surprise": "🎲 随机生成了一个破产人设", "toast.links_max": "免费版：最多 5 个链接",
    "toast.write_first": "先写点东西", "toast.posted": "已发布 🎉",
    "toast.no_links_msg": "不能带链接", "toast.post_fail": "发布失败——重试",
    "toast.deleted": "已删除", "toast.delete_fail": "删除失败",
    "toast.edit_copied": "编辑链接已复制——请妥善保存 🔒",
    "link.must_match": "这个按钮的链接必须指向 {host}",
  },
  es: {
    "lang.other": "日本語",
    "nav.examples": "Ejemplos", "nav.how": "Cómo funciona", "nav.create": "Crear mi página",
    "hero.kicker": "💸 el único flex es no tener nada",
    "hero.h1": "¿Sin dinero?<br><span class=\"green\">Hazlo oficial.</span>",
    "hero.sub": "Crea una página de apoyo graciosa cuando estás sin un duro. Añade tus enlaces de propina. Compártela. Sé un poco menos pobre.",
    "hero.cta1": "Crear mi página de pobre →", "hero.cta2": "Ver un ejemplo",
    "hero.note": "sin registro · gratis · listo en 60 segundos",
    "demos.eyebrow": "Pobreza certificada", "demos.h2": "Páginas que la gente de verdad inventó",
    "demos.p": "Cada tipo de pobreza merece representación. Elige tu trauma financiero.",
    "wall.eyebrow": "Muro de los pobres", "wall.h2": "Gente real, recién certificada como pobre",
    "wall.p": "Páginas reales que la gente creó y compartió. Sí, tú también puedes estar en este muro.",
    "card.goal": "Meta", "card.lessbroke": "menos pobre", "card.broke_score": "Nivel de quiebra",
    "card.status": "Estado", "card.risk": "Nivel de riesgo",
    "how.eyebrow": "Dolorosamente simple", "how.h2": "Pobre en cuatro pasos",
    "how.p": "Sin registro, sin tonterías — pobre y compartible en un minuto.",
    "how.s1t": "Elige tu pobreza", "how.s1d": "¿Modo ramen? ¿Pánico del alquiler? ¿Deuda de dominio? Elige el estado que más duela.",
    "how.s2t": "Añade tus enlaces", "how.s2d": "PayPal, Ko-fi, monedero cripto — lo que sea que reciba dinero. Nosotros nunca lo tocamos.",
    "how.s3t": "Consigue tu imagen", "how.s3d": "Un toque crea una imagen lista para memes en X, Reddit y Telegram. De esto se trata todo.",
    "how.s4t": "Vuélvete menos pobre", "how.s4d": "Publícala. Mira cómo baja tu Nivel de quiebra mientras internet se apiada de ti (económicamente).",
    "faq.eyebrow": "Preguntas frecuentes", "faq.h2": "Preguntas que hacen los pobres",
    "faq.q1": "¿Qué es esto exactamente?",
    "faq.a1": "No Money convierte «estoy sin dinero» en una página para compartir. Elige tu estado de pobreza, pon tus enlaces de propina y publica una tarjeta lista para memes con un Nivel de quiebra. La gente se apiada de ti (económicamente).",
    "faq.q2": "¿Es gratis?", "faq.a2": "Sí — crear y compartir una página es gratis, sin registro.",
    "faq.q3": "¿Os quedáis una parte de mis propinas?", "faq.a3": "Nunca. Tus enlaces (PayPal, Ko-fi, cripto…) van directos a ti — No Money nunca toca el dinero.",
    "faq.q4": "¿Necesito una cuenta?", "faq.a4": "No. Tu página es solo un enlace para compartir — sin login, sin contraseña que olvidar.",
    "faq.q5": "¿Esto es una recaudación o algo de caridad de verdad?", "faq.a5": "No. Es para páginas de apoyo personal, propinas a creadores y bromas de internet — no caridad ni recaudación. Sé pobre con responsabilidad.",
    "cta.stamp": "💸 Pobre certificado", "cta.h2": "Estoy sin dinero,<br>pero que sea <span class=\"green\">gracioso.</span>",
    "cta.p": "Ese es todo el producto. Gratis, sin registro, un poco menos pobre en 60 segundos.",
    "cta.btn": "Crear mi página de pobre →",
    "foot.tagline": "Haz oficial tu pobreza.",
    "foot.disclaimer": "<b>No Money</b> es para páginas de apoyo personal y bromas de internet — no es una plataforma de caridad ni de recaudación. Sé pobre con responsabilidad.",
    "foot.made": "hecho con 💸 no money", "foot.copy": "© no.money — sé pobre con responsabilidad", "foot.source": "Código abierto ↗",
    "nf.title": "Demasiado pobre para existir · No Money", "nf.stamp": "💸 404 · Fondos insuficientes",
    "nf.h2": "Esta página está<br>demasiado <span class=\"green\">pobre</span> para existir.",
    "nf.p": "Gastó su último byte. Pero siempre puedes crear una nueva.", "nf.home": "Volver al inicio",
    "create.head_h1": "Construye tu página de pobre", "create.head_p": "Sin registro — vive en un enlace para compartir. Unos 60 segundos.",
    "create.surprise": "🎲 Sorpréndeme", "create.name": "Tu nombre",
    "create.avatar": "Avatar", "create.avatar_hint": "(opcional — por defecto, tu estado de pobreza)",
    "create.handle": "Tu handle", "create.editnote": "Editando — la URL no cambia.",
    "create.status_q": "¿Qué tipo de pobre eres?", "create.story": "Tu historia lacrimógena",
    "create.story_ph": "Hazlo gracioso. La autocompasión vende.",
    "create.name_ph": "p. ej. Mira", "create.handle_ph": "tu-handle",
    "title.index": "No Money — páginas de apoyo graciosas para creadores sin dinero", "title.create": "Crea tu página de pobre · No Money",
    "create.ai_btn": "✨ Reescríbelo más gracioso (IA)", "create.ai_hint": "Reescribe tu historia con IA — si la IA está ocupada, usa frases seleccionadas.",
    "create.goal": "Meta y progreso", "create.goal_hint": "meta de supervivencia", "create.raised_hint": "recaudado hasta ahora",
    "create.links": "Enlaces de apoyo", "create.links_note": "(el dinero va directo a ti)", "create.add_link": "+ Añadir enlace de apoyo",
    "create.publish": "Obtener mi página de pobre →", "create.publish_note": "Sin registro. Tu página vive en un enlace para compartir.",
    "create.preview_label": "Vista previa en vivo", "create.publishtop": "Obtener mi página →",
    "resume.has": "Ya tienes una página:", "resume.edit": "Editarla", "resume.new": "Crear una nueva",
    "create.publishing": "Publicando…", "create.updating": "Actualizando…", "create.update_btn": "Actualizar mi página →",
    "create.edit_h1": "Edita tu página", "create.thinking": "✨ Pensando…", "create.loading": "Cargando tu página…",
    "emoji.auto": "Auto", "link.btn_text_ph": "Texto del botón — p. ej. ", "link.url_ph": "https://tu-enlace.com",
    "modal.badge": "💸 Eres oficialmente pobre", "modal.live_h3": "Tu página está en línea 🎉",
    "modal.updated_badge": "✅ Actualizada", "modal.updated_h3": "Tu página se ha actualizado 🎉",
    "modal.copy": "Copiar enlace", "modal.share_label": "Compártela — la imagen mendiga por ti",
    "btn.copied": "Copiado ✓",
    "modal.open": "Abrir mi página ↗", "modal.download": "⬇ Descargar imagen",
    "modal.editlink": "Enlace privado para editar esta página después", "modal.edithint_tail": "— cualquiera que lo tenga puede editar, guárdalo para ti.",
    "modal.edit_title": "Guarda tu enlace de edición privado",
    "modal.edit_warn": "Esta es la única forma de editar esta página después — no hay cuentas. Si borras los datos del navegador, pierdes el acceso. Cualquiera con el enlace puede editar, así que mantenlo en privado.",
    "modal.edit_copy": "Copiar enlace de edición",
    "card.score_of": "/100", "card.survival": "recaudado de",
    "p.share_btn": "📸 Obtener imagen", "p.copy_btn": "🔗 Copiar enlace",
    "p.remix_strong": "¿Tú también sin dinero?", "p.remix_span": "Crea tu propia página de pobre en 60 segundos. Sin registro.", "p.remix_btn": "Crear la mía →",
    "p.foot": "hecho con <b>no.money</b>",
    "p.modal_h3": "Tu imagen para compartir está lista 📸", "p.modal_p": "Publícala en X, Reddit o Telegram. La imagen mendiga por ti.",
    "p.modal_download": "⬇ Descargar imagen", "p.modal_close": "Cerrar",
    "msg.title": "Mensajes de apoyo", "msg.name_ph": "Tu nombre (opcional)", "msg.text_ph": "Anímale — o búrlate. Que sea gracioso.",
    "msg.post": "Publicar mensaje", "msg.empty": "Aún no hay mensajes — sé el primero en apiadarte (económicamente).",
    "toast.link_copied": "Enlace copiado 🔗", "toast.copy_manual": "Pulsa ⌘/Ctrl+C para copiar", "toast.copy_fail": "Error al copiar — selecciona la barra de URL",
    "toast.tip_add_link": "Consejo: añade un enlace de apoyo para que de verdad puedan darte propina 💸",
    "toast.publish_fail": "No se pudo publicar — revisa tu conexión e inténtalo de nuevo",
    "toast.edit_invalid": "Este enlace de edición no es válido — no se puede actualizar", "toast.no_edit_access": "Sin acceso de edición en este dispositivo — los cambios no se guardarán",
    "toast.load_fail": "No se pudo cargar esa página", "toast.ai_done": "✨ Reescrito por IA",
    "toast.ai_rate": "Demasiadas reescrituras con IA — aquí tienes una seleccionada", "toast.ai_punch": "✨ Mejorado",
    "toast.surprise": "🎲 Nuevo personaje pobre generado", "toast.links_max": "Plan gratis: máximo 5 enlaces",
    "toast.write_first": "Escribe algo primero", "toast.posted": "Publicado 🎉",
    "toast.no_links_msg": "No se permiten enlaces", "toast.post_fail": "No se pudo publicar — inténtalo de nuevo",
    "toast.deleted": "Eliminado", "toast.delete_fail": "No se pudo eliminar",
    "toast.edit_copied": "Enlace de edición copiado — guárdalo en un lugar seguro 🔒",
    "link.must_match": "Este botón debe enlazar a {host}",
  },
  ja: {
    "lang.other": "中文",
    "nav.examples": "例", "nav.how": "使い方", "nav.create": "ページを作る",
    "hero.kicker": "💸 唯一の自慢は無一文",
    "hero.h1": "お金がない？<br><span class=\"green\">公式にしよう。</span>",
    "hero.sub": "金欠のときに笑える応援ページを作ろう。投げ銭リンクを貼って、シェアして、ちょっとだけ救われよう。",
    "hero.cta1": "破産ページを作る →", "hero.cta2": "例を見る",
    "hero.note": "登録不要 · 無料 · 60秒で完成",
    "demos.eyebrow": "公認・破産", "demos.h2": "みんなが実際に作ったページ",
    "demos.p": "どんな金欠にも居場所がある。あなたの金銭的トラウマを選ぼう。",
    "wall.eyebrow": "破産の壁", "wall.h2": "リアルな人々、最近破産認定",
    "wall.p": "実際に作られシェアされたページ。そう、あなたもこの壁に載れる。",
    "card.goal": "目標", "card.lessbroke": "回復", "card.broke_score": "破産スコア",
    "card.status": "ステータス", "card.risk": "リスクレベル",
    "how.eyebrow": "痛いほど簡単", "how.h2": "4ステップで破産",
    "how.p": "登録なし、面倒なし——1分で破産してシェアできる。",
    "how.s1t": "金欠タイプを選ぶ", "how.s1d": "ラーメンモード？家賃パニック？ドメイン負債？一番刺さるステータスを選ぼう。",
    "how.s2t": "リンクを追加", "how.s2d": "PayPal、Ko-fi、暗号資産ウォレット——お金が受け取れるなら何でも。私たちは一切触れません。",
    "how.s3t": "シェア画像を取得", "how.s3d": "ワンタップでX・Reddit・Telegram用のミーム画像が完成。これこそが本題。",
    "how.s4t": "ちょっと救われる", "how.s4d": "投稿しよう。ネットに（経済的に）同情されるたび、破産スコアが下がっていく。",
    "faq.eyebrow": "よくある質問", "faq.h2": "金欠の人がよく聞くこと",
    "faq.q1": "そもそもこれ何？",
    "faq.a1": "No Money は「金欠です」をシェアできるページに変える。破産ステータスを選んで投げ銭リンクを貼り、破産スコア付きのミーム画像を投稿。みんなが（経済的に）同情してくれる。",
    "faq.q2": "無料？", "faq.a2": "うん——ページの作成もシェアも無料、登録不要。",
    "faq.q3": "投げ銭から手数料を取る？", "faq.a3": "絶対に取らない。あなたのリンク（PayPal、Ko-fi、暗号資産…）はすべて直接あなたへ——No Money はお金に一切触れない。",
    "faq.q4": "アカウントは必要？", "faq.a4": "不要。あなたのページはただのシェア用リンク——ログインも、忘れるパスワードもなし。",
    "faq.q5": "これって本物の募金や慈善活動？", "faq.a5": "違う。個人的な応援ページ、クリエイターへの投げ銭、ネタのためのもの——慈善でも募金でもない。責任を持って破産しよう。",
    "cta.stamp": "💸 公認・破産", "cta.h2": "金欠だけど、<br><span class=\"green\">笑えるやつにする。</span>",
    "cta.p": "それがこのサービスのすべて。無料、登録不要、60秒でちょっと救われる。",
    "cta.btn": "破産ページを作る →",
    "foot.tagline": "破産を公式に。",
    "foot.disclaimer": "<b>No Money</b> は個人的な応援ページとネタのためのもの——慈善や募金のプラットフォームではありません。責任を持って破産しよう。",
    "foot.made": "💸 no money で制作", "foot.copy": "© no.money — 責任を持って破産しよう", "foot.source": "オープンソース ↗",
    "nf.title": "貧しすぎて存在できない · No Money", "nf.stamp": "💸 404 · 残高不足",
    "nf.h2": "このページは<br><span class=\"green\">貧しすぎて</span>存在できない。",
    "nf.p": "最後の1バイトまで使い果たした。でも新しいのはいつでも作れる。", "nf.home": "ホームに戻る",
    "create.head_h1": "破産ページを作る", "create.head_p": "登録不要——シェア用リンクの中に存在。約60秒。",
    "create.surprise": "🎲 おまかせ", "create.name": "あなたの名前",
    "create.avatar": "アバター", "create.avatar_hint": "（任意——未指定なら破産ステータスを使用）",
    "create.handle": "ハンドル名", "create.editnote": "編集中——URLは変わりません。",
    "create.status_q": "どんな金欠タイプ？", "create.story": "あなたの泣ける話",
    "create.story_ph": "笑えるやつにしよう。自虐は売れる。",
    "create.name_ph": "例：Mira", "create.handle_ph": "your-handle",
    "title.index": "No Money — 金欠クリエイターのための笑える応援ページ", "title.create": "破産ページを作る · No Money",
    "create.ai_btn": "✨ もっと笑えるAIリライト", "create.ai_hint": "AIが話をリライト——AIが混雑時は厳選フレーズに切り替え。",
    "create.goal": "目標と進捗", "create.goal_hint": "生存目標", "create.raised_hint": "現在の達成額",
    "create.links": "応援リンク", "create.links_note": "（お金は直接あなたへ）", "create.add_link": "+ 応援リンクを追加",
    "create.publish": "破産ページを公開 →", "create.publish_note": "登録不要。ページはシェア用リンクの中に。",
    "create.preview_label": "ライブプレビュー", "create.publishtop": "ページを公開 →",
    "resume.has": "すでにページがあります：", "resume.edit": "編集する", "resume.new": "新しく作る",
    "create.publishing": "公開中…", "create.updating": "更新中…", "create.update_btn": "ページを更新 →",
    "create.edit_h1": "ページを編集", "create.thinking": "✨ 考え中…", "create.loading": "ページを読み込み中…",
    "emoji.auto": "自動", "link.btn_text_ph": "ボタンの文字——例： ", "link.url_ph": "https://your-link.com",
    "modal.badge": "💸 公式に破産しました", "modal.live_h3": "ページが公開されました 🎉",
    "modal.updated_badge": "✅ 更新済み", "modal.updated_h3": "ページを更新しました 🎉",
    "modal.copy": "リンクをコピー", "modal.share_label": "シェアしよう——画像が代わりに物乞いする",
    "btn.copied": "コピー完了 ✓",
    "modal.open": "ページを開く ↗", "modal.download": "⬇ 画像を保存",
    "modal.editlink": "あとでこのページを編集する非公開リンク", "modal.edithint_tail": "——持っている人は誰でも編集可能、自分だけで保管を。",
    "modal.edit_title": "非公開の編集リンクを保存",
    "modal.edit_warn": "あとでこのページを編集する唯一の方法です——アカウントはありません。ブラウザのデータを消すとアクセスできなくなります。リンクを持つ人は誰でも編集できるので、非公開に。",
    "modal.edit_copy": "編集リンクをコピー",
    "card.score_of": "/100", "card.survival": "達成 /",
    "p.share_btn": "📸 シェア画像を取得", "p.copy_btn": "🔗 リンクをコピー",
    "p.remix_strong": "あなたも金欠？", "p.remix_span": "60秒で自分の破産ページを作ろう。登録不要。", "p.remix_btn": "自分のを作る →",
    "p.foot": "<b>no.money</b> で制作",
    "p.modal_h3": "シェア画像ができました 📸", "p.modal_p": "X・Reddit・Telegramに投稿。画像が代わりに物乞いする。",
    "p.modal_download": "⬇ 画像を保存", "p.modal_close": "閉じる",
    "msg.title": "応援メッセージ", "msg.name_ph": "あなたの名前（任意）", "msg.text_ph": "応援しよう——いじってもOK。笑える感じで。",
    "msg.post": "メッセージを送る", "msg.empty": "まだメッセージなし——最初に（経済的に）同情しよう。",
    "toast.link_copied": "リンクをコピーしました 🔗", "toast.copy_manual": "⌘/Ctrl+C でコピー", "toast.copy_fail": "コピー失敗——URLバーを選択して",
    "toast.tip_add_link": "ヒント：応援リンクを追加すれば実際に投げ銭してもらえる 💸",
    "toast.publish_fail": "公開できませんでした——接続を確認して再試行",
    "toast.edit_invalid": "この編集リンクは無効です——更新できません", "toast.no_edit_access": "この端末に編集権限がありません——変更は保存されません",
    "toast.load_fail": "そのページを読み込めませんでした", "toast.ai_done": "✨ AIがリライトしました",
    "toast.ai_rate": "AIリライトが多すぎ——厳選版をどうぞ", "toast.ai_punch": "✨ パンチを追加",
    "toast.surprise": "🎲 新しい破産キャラを生成", "toast.links_max": "無料プラン：リンクは最大5つ",
    "toast.write_first": "まず何か書いて", "toast.posted": "投稿しました 🎉",
    "toast.no_links_msg": "リンクは使えません", "toast.post_fail": "投稿できませんでした——再試行",
    "toast.deleted": "削除しました", "toast.delete_fail": "削除できませんでした",
    "toast.edit_copied": "編集リンクをコピー——安全な場所に保管を 🔒",
    "link.must_match": "このボタンは {host} にリンクする必要があります",
  },
};

// Supported languages, in the order the toggle button cycles through them.
// Each table's "lang.other" label names the NEXT language in this cycle.
const LANGS = ["en", "es", "ja", "zh"];
const HTML_LANG = { en: "en", es: "es", ja: "ja", zh: "zh-CN" };
const has = l => LANGS.indexOf(l) !== -1;

function detect() {
  const n = (navigator.language || "").toLowerCase();
  if (n.startsWith("zh")) return "zh";
  if (n.startsWith("es")) return "es";
  if (n.startsWith("ja")) return "ja";
  return "en";
}

const urlLang = (() => { try { return new URLSearchParams(location.search).get("lang"); } catch (e) { return null; } })();
const saved = (() => { try { return localStorage.getItem("nm:lang"); } catch (e) { return null; } })();
let lang = has(urlLang) ? urlLang : (has(saved) ? saved : detect());
if (has(urlLang)) { try { localStorage.setItem("nm:lang", urlLang); } catch (e) {} }

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
  if (!has(l)) return;
  lang = l;
  try { localStorage.setItem("nm:lang", l); } catch (e) {}
  document.documentElement.lang = HTML_LANG[l] || "en";
  applyI18n();
  window.dispatchEvent(new CustomEvent("langchange", { detail: { lang: l } }));
}

// advance to the next language in the cycle (en → es → ja → zh → en)
function cycleLang() { setLang(LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length]); }

// each language's name in its own script, shown in the picker
const NATIVE = { en: "English", es: "Español", ja: "日本語", zh: "中文" };

// Upgrade the #langToggle button into a dropdown listing every language, so users
// can see all options (not just the next one). Centralized here → every page gets it.
function mountLangPicker() {
  const btn = document.getElementById("langToggle");
  if (!btn || btn.dataset.lpMounted) return;
  btn.dataset.lpMounted = "1";
  btn.removeAttribute("data-i18n");          // picker manages the label, not applyI18n
  btn.setAttribute("aria-haspopup", "listbox");
  btn.setAttribute("aria-expanded", "false");

  const wrap = document.createElement("span");
  wrap.className = "lang-picker";
  if (btn.classList.contains("lang-fixed")) { wrap.classList.add("lang-fixed"); btn.classList.remove("lang-fixed"); }
  btn.parentNode.insertBefore(wrap, btn);
  wrap.appendChild(btn);

  const menu = document.createElement("div");
  menu.className = "lang-menu";
  menu.setAttribute("role", "listbox");
  LANGS.forEach(l => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "lang-item";
    item.dataset.lang = l;
    item.setAttribute("role", "option");
    item.textContent = NATIVE[l] || l;
    item.addEventListener("click", () => { setLang(l); close(); });
    menu.appendChild(item);
  });
  wrap.appendChild(menu);

  const close = () => { wrap.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); };
  const toggle = () => {
    const open = wrap.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  };
  btn.addEventListener("click", (e) => { e.stopPropagation(); toggle(); });
  document.addEventListener("click", (e) => { if (!wrap.contains(e.target)) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

  const refresh = () => {
    btn.textContent = "🌐 " + (NATIVE[lang] || lang);
    menu.querySelectorAll(".lang-item").forEach(it => it.classList.toggle("active", it.dataset.lang === lang));
  };
  refresh();
  window.addEventListener("langchange", refresh);
}

document.documentElement.lang = HTML_LANG[lang] || "en";
window.I18N = { t, get lang() { return lang; }, langs: LANGS, setLang, cycleLang, apply: applyI18n };

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountLangPicker);
else mountLangPicker();
