// Single source of truth for handles that can't become a vanity slug
// (would shadow routes/static files, or are kept for brand/future use).
// Note: single-character handles are already blocked elsewhere by a min-length-2 rule.
// `_`-prefixed file = not a route; it's imported by save.js, [id].js and devserver.mjs.
export const RESERVED = new Set([
  // routes / static / infra
  "create", "index", "p", "s", "og", "api", "assets", "static", "public",
  "robots", "sitemap", "favicon", "www",
  // common app pages
  "about", "terms", "privacy", "new", "edit", "settings", "help",
  "login", "signup", "admin", "webmaster", "app", "blog", "docs",
  // brand / reserved words
  "you", "money", "cash", "coffee", "cafe", "show", "ai", "ok",

  // payment / creator platforms (highest impersonation risk on a tipping site)
  "paypal", "stripe", "venmo", "cashapp", "zelle", "square", "kofi", "ko-fi",
  "patreon", "gofundme", "kickstarter", "indiegogo", "buymeacoffee", "bmc",
  "coinbase", "binance", "kraken", "visa", "mastercard", "amex", "revolut",
  "wise", "klarna", "alipay", "wechatpay",

  // crypto
  "bitcoin", "ethereum", "solana", "dogecoin", "tether", "usdt", "usdc", "metamask",

  // big tech
  "apple", "google", "microsoft", "amazon", "meta", "tesla", "dell", "hp",
  "lenovo", "samsung", "sony", "intel", "amd", "nvidia", "ibm", "oracle",
  "adobe", "salesforce", "shopify", "dropbox", "slack", "zoom", "notion",
  "figma", "canva", "openai", "anthropic", "claude", "chatgpt", "gemini",
  "nintendo", "xbox", "playstation",

  // social / platforms
  "facebook", "instagram", "twitter", "tiktok", "youtube", "reddit", "discord",
  "telegram", "whatsapp", "snapchat", "linkedin", "pinterest", "twitch",
  "github", "gitlab", "medium", "substack", "threads", "wechat",

  // big consumer brands
  "nike", "adidas", "gucci", "rolex", "starbucks", "mcdonalds", "pepsi",
  "cocacola", "coca-cola", "redbull", "disney", "marvel", "netflix", "spotify",
  "uber", "lyft", "airbnb", "doordash", "walmart", "target", "ikea",
  "toyota", "honda", "bmw", "mercedes", "ford", "ferrari", "porsche", "lamborghini",

  // premium / generic words held back for future PAID handles (sell these later, don't give away)
  "chat", "pay", "payment", "payments", "finance", "financial", "chain", "line", "online",
  "tip", "tips", "tipjar", "donate", "donation", "fund", "support", "wallet", "bank",
  "crypto", "nft", "web", "net", "link", "bio", "store", "shop", "buy",
  "vip", "pro", "premium", "official", "verified", "broke", "rich", "poor", "me", "go",
  "free", "domain", "site", "live", "space", "cloud", "club", "digital", "news",
  "love", "life", "best", "now", "hello", "ask", "market", "cart", "car", "store",
  "sakura", "nomad", "fax", "cv", "ac",
  "handle", "fit", "sale", "top", "loan", "center", "media", "press", "foundation",
  "trade", "code", "tax", "email", "job", "work", "de", "cn", "eu",
  "plus", "social", "photo",

  // platform / safety — block to prevent impersonating No Money itself (phishing risk)
  "account", "accounts", "billing", "security", "staff", "mod", "moderator",
  "root", "system", "abuse", "report", "dashboard", "info", "contact", "team",

  // common 2-letter words / abbreviations — short = premium, held for future paid sale
  // (single chars are already blocked by the min-length-2 rule; ai/ok/me/go are above)
  "am", "an", "as", "at", "be", "by", "do", "he", "hi", "if", "in", "is", "it",
  "my", "no", "of", "oh", "on", "or", "so", "to", "up", "us", "we", "ha", "ho",
  "ah", "ya", "yo", "ex", "ox", "pa", "ma", "yes",
  "tv", "pc", "vr", "ar", "ml", "io", "ui", "ux", "qa", "hr", "pr", "vp",
  "dj", "mc", "dm", "ig", "fb", "db", "os", "ev", "dr", "mr", "ms", "gg", "gm", "pm", "op", "id", "ad",
]);
