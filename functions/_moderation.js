// Content rules, shared by the editor (src/create.js) and the server (api/save.js)
// so a page can never be published past a rule the editor didn't show.
//
// THE DESIGN TENSION, because it decides every pattern below:
// This is a self-deprecating meme site. "I lost my rent gambling", "Bought high.
// Panicked. Sold low." and "I was early. I was also catastrophically wrong." are not
// violations — they're the product. "Crypto Damage" is a built-in broke status and
// those exact lines ship as preset copy. A keyword blocklist on "bet"/"casino"/"赌"
// would delete the most on-brand content on the site.
//
// So nothing here fires on someone CONFESSING a loss. Every rule targets someone
// SELLING something to the reader:
//   - a link to a bookmaker/casino (a confession doesn't need one)
//   - tipster idiom that offers picks ("sure odds", "fixed match", "straight win")
//   - a promise of returns ("double your money", "稳赚不赔", "日入过万")
// First person + past tense + loss = allowed. Second person + future tense + profit
// = blocked. That's the line.

// Bookmakers, casinos and the domains scam pages actually use. A self-deprecating
// story never links to one; a tipster page always does.
const BLOCKED_HOSTS = [
  "1xbet.com", "22bet.com", "bet9ja.com", "sportybet.com", "melbet.com", "betway.com",
  "betwinner.com", "1win.com", "parimatch.com", "bovada.lv", "stake.com", "roobet.com",
  "casino.com", "bet365.com", "williamhill.com", "ladbrokes.com", "pinnacle.com",
  "betfair.com", "unibet.com", "888casino.com", "paripesa.com", "msport.com",
];

// Each rule needs the pattern to be unambiguous on its own — if a phrase has an
// innocent reading in a broke joke, it does not belong here.
const RULES = [
  // ---- gambling promotion (selling picks, not admitting losses) ----
  { reason: "gambling", re: /\b(sure|banker)\s*(odds|win|bet|tip)s?\b/i },
  { reason: "gambling", re: /\bfixed\s+match(es)?\b/i },
  { reason: "gambling", re: /\bstraight\s+win\b/i },
  { reason: "gambling", re: /\bdem\s+go\s+win\b/i },
  { reason: "gambling", re: /\b(odds|tips)\s+(for\s+)?(today|tomorrow)\b/i },
  { reason: "gambling", re: /\b(vip|premium)\s+(odds|tips|picks)\b/i },
  { reason: "gambling", re: /\b(over|under)\s*[12]\.5\b.*\b(odds|bet|tip)/i },
  { reason: "gambling", re: /(博彩|菠菜|六合彩|时时彩|北京赛车|百家乐|网赌|包中|包赢|必中)/ },
  { reason: "gambling", re: /(彩票|赌球|外围)\s*(推荐|计划|群|带|回血)/ },

  // ---- promised returns / money-flipping / recovery scams ----
  { reason: "scam", re: /\b(double|triple|10x)\s+(your\s+)?(money|btc|bitcoin|investment|funds)\b/i },
  { reason: "scam", re: /\b(guaranteed|100%)\s+(profit|returns?|roi|win)/i },
  { reason: "scam", re: /\b(money|cash|btc|bitcoin)\s*flip(ping|s)?\b/i },
  { reason: "scam", re: /\binvest\s+\$?\d+\s*(and\s+)?(get|earn|receive)\b/i },
  { reason: "scam", re: /\b(recover(y)?\s+(of\s+)?(lost|stolen)\s+(crypto|bitcoin|funds|wallet))/i },
  { reason: "scam", re: /\b(binary\s+options?|forex\s+signals?)\b.*\b(join|dm|signup|profit)/i },
  { reason: "scam", re: /\b(hire|contact)\s+a?\s*(hacker|recovery\s+expert)\b/i },
  { reason: "scam", re: /(稳赚不赔|保本保息|躺赚|日入过万|日赚|刷单|返利|杀猪盘|代充|洗钱)/ },
  { reason: "scam", re: /(投资|理财|炒股|带单)\s*(回报|收益|包赚|翻倍|导师|老师|群)/ },
];

const host = (u) => {
  try {
    let s = String(u || "").trim();
    if (!/^[a-z][a-z0-9+.\-]*:/i.test(s)) s = "https://" + s;
    return new URL(s).hostname.toLowerCase().replace(/^www\./, "");
  } catch { return ""; }
};

// Everything a visitor can read on the page, as one haystack. Button labels matter as
// much as the story — "VIP odds 👑" as a button text is the whole pitch.
function surfaceText(d) {
  if (!d || typeof d !== "object") return "";
  const parts = [d.name, d.story, d.handle];
  for (const l of (Array.isArray(d.links) ? d.links : [])) {
    if (!l || typeof l !== "object") continue;
    parts.push(l.label, l.zh);
  }
  return parts.filter(x => typeof x === "string").join("\n");
}

// "" = publishable. Otherwise a reason key the UI turns into a sentence.
export function moderate(d) {
  for (const l of (d && Array.isArray(d.links) ? d.links : [])) {
    const h = host(l && l.url);
    if (h && BLOCKED_HOSTS.some(b => h === b || h.endsWith("." + b))) return "gambling";
  }
  const text = surfaceText(d);
  if (!text.trim()) return "";
  for (const r of RULES) if (r.re.test(text)) return r.reason;
  return "";
}
