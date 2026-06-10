import "../assets/core.js"; // sets window.NM + loads the stylesheet
const t = (k) => window.I18N.t(k);
const lang = () => window.I18N.lang;
const params = new URLSearchParams(location.search);
let data = null;
if (window.__PAGE__ && typeof window.__PAGE__ === "object") {
  data = window.__PAGE__;                         // injected by the /s/:id short-link function
} else if (params.get("demo") && NM.DEMOS[params.get("demo")]) {
  data = { ...NM.DEMOS[params.get("demo")] };
}
if (!data) { location.href = "index.html"; }

// fill defaults from status preset
const st = (Object.prototype.hasOwnProperty.call(NM.STATUSES, data.status) && NM.STATUSES[data.status]) || NM.STATUSES.ramen;
data.links = data.links || defaultLinks(data.status);
data.msgs = data.msgs || st.msgs;

function defaultLinks(status) {
  const base = [{ kind: "ramen", url: "#" }, { kind: "coffee", url: "#" }];
  base.push({ kind: "paypal", url: "#" });
  return base;
}

function render() {
  const ls = NM.locStatus(st);
  const bs = NM.brokeScore(data);
  document.documentElement.style.setProperty("--accent", st.accent);
  document.documentElement.style.setProperty("--accent-soft", hexA(st.accent, 0.1));
  document.documentElement.style.setProperty("--accent-line", hexA(st.accent, 0.45));
  document.documentElement.style.setProperty("--accent-glow", hexA(st.accent, 0.18));

  const story = data.story || ls.story;
  document.title = NM.pageTitle(data.name, bs.score);

  const links = data.links.map(l => {
    // never show a brand the link doesn't actually go to (protects pages saved before
    // the rule existed, or via a hand-crafted API call) — fall back to a generic button
    const k0 = NM.canonKind(l.kind);
    const kind = NM.brandMismatch(k0, l.url) ? "custom" : k0;
    const k = NM.PAYMENT_KINDS[kind] || NM.PAYMENT_KINDS.custom;
    const label = (lang() !== "en" && l[lang()]) ? l[lang()] : (l.label || NM.payLabel(kind));   // demos carry localized labels; user pages keep their own
    // these are visitor-clickable, user-submitted outbound links: nofollow+ugc so public
    // pages can't be farmed for SEO backlinks; noreferrer hides where the tipper came from
    const a = `<a class="${k.cls}" href="${esc(NM.safeUrl(l.url))}" target="_blank" rel="noopener noreferrer nofollow ugc">${esc(label)}</a>`;
    // for free-form buttons, show the real destination host so a deceptive label can't hide it
    const host = NM.freeFormHost(kind, l.url);
    return host ? a + `<p class="link-host">→ ${esc(host)}</p>` : a;
  }).join("");

  document.getElementById("card").className = "page-card theme-" + (st.theme || "clean");
  // emoji stays under the photo as a fallback: if /av 404s (e.g. KV not yet
  // propagated right after publish, or the photo was pulled), the img removes
  // itself and the broke-status emoji shows through — never a broken-image icon.
  const emoji = esc(data.emoji || st.emoji);
  const avatar = data.av
    ? `${emoji}<img src="/av/${encodeURIComponent(data.handle)}?v=${encodeURIComponent(data.av)}" alt="" onerror="this.remove()" />`
    : emoji;
  document.getElementById("card").innerHTML = `
    <div class="avatar">${avatar}</div>
    <div class="status-pill"><span class="dot"></span>${esc(ls.label)}</div>
    <div class="page-name">${esc(data.name || NM.someone())}</div>
    <div class="page-handle">no.money/${esc(data.handle || "you")}</div>
    <div class="page-story">${esc(story)}</div>

    <div class="support-btns">${links}</div>

    <div class="broke-score">
      <div class="bs-top">
        <span class="bs-label">${t("card.broke_score")}</span>
        <span class="bs-num">${bs.score}<span>${t("card.score_of")}</span></span>
      </div>
      <div class="bs-meter"><i style="width:${bs.score}%"></i></div>
      <div class="bs-row"><span class="k">${t("card.status")}</span><span class="v">${esc(bs.band)}</span></div>
      <div class="bs-row"><span class="k">${t("card.risk")}</span><span class="v">${esc(bs.risk)}</span></div>
    </div>
  `;
}

function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function num(n) { return (Number(n) || 0).toLocaleString(); }
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`; }

function toast(msg) { const el = document.getElementById("toast"); el.textContent = msg; el.classList.add("show"); setTimeout(() => el.classList.remove("show"), 1800); }

window.I18N.apply();
render();

/* ---------- support messages (wall of pity) ---------- */
// vanity pages live at /<slug>; demos at /p.html?demo= (read-only static msgs)
const slug = (window.__PAGE__ ? decodeURIComponent(location.pathname).replace(/^\/+|\/+$/g, "") : "");
const isVanity = /^[a-z0-9-]{2,40}$/.test(slug);
const ownerToken = isVanity ? (() => { try { return localStorage.getItem("nm:edit:" + slug); } catch (e) { return null; } })() : null;
let messages = [];

async function initMessages() {
  if (isVanity) {
    try { const r = await fetch("/api/msgs?slug=" + encodeURIComponent(slug)); if (r.ok) messages = (await r.json()).messages || []; } catch (e) {}
  } else {
    const seed = st[lang() + "msgs"] || data.msgs || []; // demo: static, read-only; localized seed where available
    messages = seed.map(m => ({ n: m[1] || "anon", t: m[0] }));
  }
  renderMsgSection();
}

function renderMsgSection() {
  const el = document.getElementById("msgSection");
  const form = isVanity ? `
    <div class="msg-form">
      <input id="mName" maxlength="24" placeholder="${esc(t("msg.name_ph"))}" />
      <textarea id="mText" maxlength="140" placeholder="${esc(t("msg.text_ph"))}"></textarea>
      <button class="btn btn-primary btn-block" id="mSend">${esc(t("msg.post"))}</button>
    </div>` : "";
  el.innerHTML = `<h4 class="msg-title">${esc(t("msg.title"))}${messages.length ? ` (${messages.length})` : ""}</h4>${form}<div class="msg-wall" id="msgWall"></div>`;
  if (isVanity) document.getElementById("mSend").onclick = postMsg;
  renderWall();
}

function renderWall() {
  const w = document.getElementById("msgWall");
  if (!messages.length) { w.innerHTML = `<p class="msg-empty">${esc(t("msg.empty"))}</p>`; return; }
  w.innerHTML = messages.map(m =>
    `<div class="msg">${esc(m.t)}<div class="who">— ${esc(m.n || "anon")}${(ownerToken && m.id) ? ` <button class="msg-del" data-id="${esc(m.id)}" title="delete">×</button>` : ""}</div></div>`).join("");
  if (ownerToken) w.querySelectorAll(".msg-del").forEach(b => b.onclick = () => deleteMsg(b.dataset.id));
}

async function postMsg() {
  const btn = document.getElementById("mSend"), prev = btn.textContent;
  const name = document.getElementById("mName").value;
  const text = document.getElementById("mText").value.trim();
  if (!text) { toast(t("toast.write_first")); return; }
  btn.disabled = true; btn.textContent = t("create.publishing");
  try {
    const r = await fetch("/api/msgs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, name, text }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.message) { messages.unshift(j.message); document.getElementById("mText").value = ""; renderMsgSection(); toast(t("toast.posted")); }
    else toast(j.error === "no links allowed" ? t("toast.no_links_msg") : t("toast.post_fail"));
  } catch (e) { toast(t("toast.post_fail")); }
  btn.disabled = false; btn.textContent = prev;
}

async function deleteMsg(id) {
  try {
    const r = await fetch("/api/msgs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, editToken: ownerToken, del: id }) });
    if (r.ok) { messages = messages.filter(m => m.id !== id); renderMsgSection(); toast(t("toast.deleted")); }
    else toast(t("toast.delete_fail"));
  } catch (e) { toast(t("toast.delete_fail")); }
}

initMessages();

/* ---------- viral-loop instrumentation ---------- */
// directional analytics only; the only metric the product optimizes is shareability.
// fire-and-forget beacon so it never blocks render or the CTA's navigation.
function hit(ev) {
  if (!isVanity) return;               // demos have no slug — nothing to attribute
  // once per tab-session per page+event: a refresh / back-button / double-click doesn't
  // re-count, so the funnel reads ~per-session (closer to a real conversion rate) rather
  // than raw pageviews. Pure client-side — costs no KV write. If storage is blocked we
  // fall through and still send (slight over-count beats losing the signal entirely).
  try { const k = "nm:hit:" + ev + ":" + slug; if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, "1"); } catch (e) {}
  try {
    const body = JSON.stringify({ slug, ev });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/hit", new Blob([body], { type: "application/json" }));
    else fetch("/api/hit", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch (e) {}
}
if (!ownerToken) hit("view");          // skip the owner's own views so they don't inflate the count

// viral loop: "make mine" starts a fresh page themed to the same broke status
const remixBtn = document.getElementById("remixBtn");
remixBtn.href = "create.html?status=" + encodeURIComponent(data.status || "");
remixBtn.addEventListener("click", () => hit("cta"));

// share image
const modal = document.getElementById("modal");
document.getElementById("shareBtn").onclick = () => {
  NM.drawShareImage(document.getElementById("shareCanvas"), data);
  NM.renderShareRow(document.getElementById("shareRow"), location.href, data);
  modal.classList.add("open");
};
document.getElementById("closeModal").onclick = () => modal.classList.remove("open");
modal.onclick = (e) => { if (e.target === modal) modal.classList.remove("open"); };
document.getElementById("downloadBtn").onclick = () => {
  const a = document.createElement("a");
  a.download = `no-money-${data.handle || "page"}.png`;
  a.href = document.getElementById("shareCanvas").toDataURL("image/png");
  a.click();
};
function flashCopied(btn) {
  if (btn._t) { clearTimeout(btn._t); } else { btn._label = btn.textContent; }
  btn.textContent = t("btn.copied"); btn.classList.add("copied");
  btn._t = setTimeout(() => { btn.textContent = btn._label; btn.classList.remove("copied"); btn._t = null; }, 1400);
}
document.getElementById("copyBtn").onclick = async () => {
  try { await navigator.clipboard.writeText(location.href); toast(t("toast.link_copied")); flashCopied(document.getElementById("copyBtn")); }
  catch { toast(t("toast.copy_fail")); }
};

// re-render dynamic content on language change (the picker itself is wired in i18n.js)
window.addEventListener("langchange", () => { render(); initMessages(); window.I18N.apply(); }); // initMessages re-seeds demo msgs in the new language
