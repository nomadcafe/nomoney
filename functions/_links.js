// Support-link rules, shared by the browser (assets/core.js, src/create.js, src/p.js)
// and the server (functions/api/save.js) so the anti-spoof rule can never drift.
//
// A "branded" kind renders a specific company's name + styling (e.g. "☕ Buy Me a
// Coffee"). If we let the URL point anywhere, the button lies about where it goes —
// a phishing vector. So branded kinds must link to that brand's own hosts. Generic
// kinds (ramen/custom) and non-URL kinds (crypto wallet) stay free-form.

export const KNOWN_KINDS = ["ramen", "coffee", "paypal", "venmo", "cashapp", "kofi", "patreon", "ghspon", "stripe", "crypto", "wise", "revolut", "monzo", "alipay", "custom"];

// retired kinds → canonical replacement (mirrors canonKind in assets/core.js)
const KIND_ALIAS = { bmc: "coffee" };

export const BRAND_HOSTS = {
  coffee:  ["buymeacoffee.com"],    // "☕ Buy Me a Coffee" button must link there
  paypal:  ["paypal.me", "paypal.com"],
  venmo:   ["venmo.com"],
  cashapp: ["cash.app"],
  kofi:    ["ko-fi.com"],
  patreon: ["patreon.com"],
  ghspon:  ["github.com"],
  stripe:  ["stripe.com"],          // also covers buy./checkout. subdomains
  wise:    ["wise.com"],
  revolut: ["revolut.me", "revolut.com"],
  monzo:   ["monzo.me"],
  alipay:  ["alipay.com"],          // covers qr.alipay.com personal receive links
};

const SAFE_SCHEMES = ["http", "https", "mailto", "bitcoin", "ethereum", "lightning", "monero", "solana"];

// Kinds whose value is an address, not a URL (a wallet string has no host and never will).
const ADDRESS_KINDS = new Set(["crypto"]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/* ---- is this value actually a destination? ----
   Live data says 22% of tip links went nowhere: people type their *username*
   ("ZAMZAM123", "Help Nicole Eichel") or their *email* into a field labelled with a
   URL placeholder. A username has no scheme and no dot, so it rendered as a RELATIVE
   href and sent supporters to no.money/ZAMZAM123 → 404. An email got "https://"
   prepended, which parses as userinfo + host and sent them to gmail.com's homepage —
   one of them to "gmai.com", a typosquat.
   A tip button that goes nowhere is worse than no page at all, so this is the single
   rule both the editor and the server run before a link is allowed to exist. */
export function normalizeTipUrl(kind, raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  if (ADDRESS_KINDS.has(kind)) return s;              // wallet address — not a URL, by design

  const scheme = s.match(/^([a-z][a-z0-9+.\-]*):/i);
  if (scheme) {
    if (!SAFE_SCHEMES.includes(scheme[1].toLowerCase())) return "";
    if (!/^https?:/i.test(s)) return s;               // mailto:, bitcoin:, … pass through
    const authority = s.replace(/^https?:\/\//i, "").split(/[/?#]/)[0];
    if (authority.includes("@")) {
      // "https://name@gmail.com" — almost always a typed email, never an intended link.
      // Recover it as mailto: when the whole thing is just an address; otherwise it's
      // the userinfo spoof shape (real host hides after the @) and has to go.
      const rest = s.replace(/^https?:\/\//i, "");
      return (rest === authority && EMAIL_RE.test(authority)) ? "mailto:" + authority : "";
    }
    return authority.includes(".") ? s : "";          // "https://localhost" etc. — no host
  }

  if (EMAIL_RE.test(s)) return "mailto:" + s;         // bare email → the thing they meant
  if (/^[^\s/]+\.[^\s]/.test(s)) return "https://" + s;   // bare domain/path → a real URL
  return "";                                          // a username, not a destination
}

// UI helper: why the editor should complain about what's currently typed.
// "" = fine. Kept here so the warning and the save rule can never disagree.
export function tipUrlProblem(kind, raw) {
  const s = String(raw || "").trim();
  if (!s || ADDRESS_KINDS.has(kind)) return "";
  if (normalizeTipUrl(kind, s)) return "";
  return /^https?:\/\/[^/]*@/i.test(s) ? "spoof" : "notlink";
}

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
    const raw = String(l.url || "").trim();
    if (!raw || !safeScheme(raw)) continue;
    const aliased = KIND_ALIAS[l.kind] || l.kind;
    let kind = KNOWN_KINDS.includes(aliased) ? aliased : "custom";
    // a button that can't reach a destination is worse than no button — drop it
    const url = normalizeTipUrl(kind, raw);
    if (!url) continue;
    if (brandMismatch(kind, url)) kind = "custom";   // can't wear a brand it doesn't link to
    const link = { kind, url };
    if (typeof l.label === "string" && l.label.trim()) link.label = l.label.trim().slice(0, 40);
    if (typeof l.zh === "string" && l.zh.trim()) link.zh = l.zh.trim().slice(0, 40);
    out.push(link);
    if (out.length >= 5) break;
  }
  return out;
}
