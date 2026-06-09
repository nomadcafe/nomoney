// Support-link rules, shared by the browser (assets/core.js, src/create.js, src/p.js)
// and the server (functions/api/save.js) so the anti-spoof rule can never drift.
//
// A "branded" kind renders a specific company's name + styling (e.g. "☕ Buy Me a
// Coffee"). If we let the URL point anywhere, the button lies about where it goes —
// a phishing vector. So branded kinds must link to that brand's own hosts. Generic
// kinds (ramen/coffee/custom) and non-URL kinds (crypto wallet) stay free-form.

export const KNOWN_KINDS = ["ramen", "coffee", "paypal", "kofi", "stripe", "crypto", "wise", "alipay", "custom"];

// retired kinds → canonical replacement (mirrors canonKind in assets/core.js)
const KIND_ALIAS = { bmc: "coffee" };

export const BRAND_HOSTS = {
  paypal: ["paypal.me", "paypal.com"],
  kofi:   ["ko-fi.com"],
  stripe: ["stripe.com"],          // also covers buy./checkout. subdomains
  wise:   ["wise.com"],
  alipay: ["alipay.com"],          // covers qr.alipay.com personal receive links
};

const SAFE_SCHEMES = ["http", "https", "mailto", "bitcoin", "ethereum", "lightning", "monero", "solana"];

// Parse the registrable host from a user-entered URL (bare domains get https://).
// URL parsing defeats the userinfo trick: "buymeacoffee.com@evil.com" → host "evil.com".
function linkHost(u) {
  try {
    let s = String(u || "").trim();
    if (!/^[a-z][a-z0-9+.\-]*:/i.test(s)) s = "https://" + s;
    return new URL(s).hostname.toLowerCase().replace(/^www\./, "");
  } catch { return ""; }
}

// First allowed host for a branded kind (for UI hints), or "" if the kind is free-form.
export function brandHostFor(kind) {
  const a = BRAND_HOSTS[kind];
  return a ? a[0] : "";
}

// True when a branded kind's URL points somewhere off-brand (or has no parseable host).
export function brandMismatch(kind, url) {
  const allowed = BRAND_HOSTS[kind];
  if (!allowed) return false;                 // not a branded kind → anything goes
  const h = linkHost(url);
  if (!h) return true;
  return !allowed.some(a => h === a || h.endsWith("." + a));
}

function safeScheme(u) {
  const probe = String(u || "").replace(/[\x00-\x20]+/g, "").toLowerCase();
  const m = probe.match(/^([a-z][a-z0-9+.\-]*):/);
  return !m || SAFE_SCHEMES.includes(m[1]);
}

// Authoritative server-side cleanup of the links array: drop empties/unsafe schemes,
// cap the count, unknown kinds → "custom", and strip a brand off any off-brand link.
export function sanitizeLinks(links) {
  if (!Array.isArray(links)) return [];
  const out = [];
  for (const l of links) {
    if (!l || typeof l !== "object") continue;
    const url = String(l.url || "").trim();
    if (!url || !safeScheme(url)) continue;
    const aliased = KIND_ALIAS[l.kind] || l.kind;
    let kind = KNOWN_KINDS.includes(aliased) ? aliased : "custom";
    if (brandMismatch(kind, url)) kind = "custom";   // can't wear a brand it doesn't link to
    const link = { kind, url };
    if (typeof l.label === "string" && l.label.trim()) link.label = l.label.trim().slice(0, 40);
    if (typeof l.zh === "string" && l.zh.trim()) link.zh = l.zh.trim().slice(0, 40);
    out.push(link);
    if (out.length >= 5) break;
  }
  return out;
}
