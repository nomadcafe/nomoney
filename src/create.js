import "../assets/core.js"; // sets window.NM + window.I18N + loads the stylesheet
const $ = s => document.querySelector(s);
const t = (k) => window.I18N.t(k);
const isZh = () => window.I18N.lang === "zh";
let status = "ramen";
let storyTouched = false; // becomes true once the user types their own story — then we never auto-overwrite it
let handleTouched = false; // once the user edits the handle, stop auto-deriving it from the name
let emoji = "";           // custom avatar emoji; "" = use the broke status' default
let editingSlug = null;   // when set, publishing UPDATES this slug instead of creating a new page
let editToken = null;     // capability token proving edit rights for editingSlug

const slugify = s => (s || "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");

const EMOJIS = ["", "😭", "🥲", "😅", "💀", "🤡", "🐀", "☕", "🍜", "💸", "📉", "🚀", "🎓"];
function buildEmoji() {
  const wrap = $("#emojiPick");
  wrap.innerHTML = "";
  EMOJIS.forEach(e => {
    const b = document.createElement("button");
    b.className = "emoji-btn" + (e === emoji ? " on" : "");
    b.textContent = e === "" ? t("emoji.auto") : e;
    if (e === "") b.style.fontSize = "12px";
    b.title = e === "" ? t("emoji.auto") : e;
    b.setAttribute("aria-pressed", e === emoji);
    b.onclick = () => { emoji = e; buildEmoji(); render(); };
    wrap.appendChild(b);
  });
}

const AI_LINES = {
  laidoff: [
    "I got 'impacted by a restructure'.\nTranslation: free time, zero income.\nLinkedIn says Open To Work. So is my wallet.",
    "Company had a 'tough year'. So did my fridge.\nNow I'm funemployed and accepting tips.\nBridge me to the next offer.",
    "I was 'let go'. My rent was not.\nFunding the gap between severance and the next yes.",
  ],
  ramen: [
    "I spent my emergency fund on non-emergencies.\nNow I negotiate with instant noodles.\nAn egg would change everything.",
    "Breakfast: ramen. Lunch: ramen's cousin.\nDinner: aspiration.\nHelp me afford a vegetable.",
  ],
  rent: [
    "Rent is due. My bank account is in denial.\nBridging the gap between 'broke' and 'boxes by the curb'.",
    "My landlord and I disagree on the definition of 'soon'.\nHelp me win the argument with money.",
  ],
  crypto: [
    "I was early. I was also catastrophically wrong.\nFunding my recovery arc, one ramen at a time.",
    "Bought high. Panicked. Sold low. Repeat.\nThis is not financial advice — obviously.",
  ],
  student: [
    "Studying hard. Eating soft.\nTuition took my savings and my will to cook.\nCoffee keeps me conscious in lectures.",
    "Sustained entirely by free campus pizza and spite.\nA coffee would diversify my diet.",
  ],
  startup: [
    "Pre-revenue, pre-funding, pre-lunch.\nRunway: short. Vibes: immaculate.\nHelp us reach ramen profitability.",
    "We will change the world right after we afford coffee.\nDefault alive starts with a tip.",
  ],
  freelance: [
    "Invoices sent. Payments pending. Spirit broken.\n'The check is coming.' It is not coming.\nBridge me to net-30.",
    "Owed money by four people. Replied to by zero.\nYour tip clears faster than my invoices.",
  ],
  pet: [
    "I don't have a pet. I have a tiny landlord with fur.\nVet bills, fancy kibble, a toy ignored for the box.\nTips fund the snacks.",
    "My cat doesn't pay rent but somehow I work for it.\nFund the imported treats. It deserves nothing and gets everything.",
  ],
};
const aiIdx = {};

function buildChips() {
  const c = $("#chips");
  c.innerHTML = "";   // clear first — buildChips is called again on Surprise / edit-load
  NM.STATUS_ORDER.forEach(k => {
    const st = NM.STATUSES[k];
    const b = document.createElement("button");
    b.className = "chip" + (k === status ? " on" : "");
    b.textContent = `${st.emoji} ${NM.locStatus(st).label}`;
    b.setAttribute("aria-pressed", k === status);
    b.onclick = () => {
      status = k;
      document.querySelectorAll(".chip").forEach(x => { x.classList.remove("on"); x.setAttribute("aria-pressed", "false"); });
      b.classList.add("on");
      b.setAttribute("aria-pressed", "true");
      // only swap in this status' default story if the user hasn't written their own
      if (!storyTouched) $("#f-story").value = NM.locStatus(NM.STATUSES[k]).story;
      render();
    };
    c.appendChild(b);
  });
}

let links = [{ kind: "ramen", url: "" }];
// live-toggle the "must link to <brand>" warning under a row as the URL is typed
function updateLinkWarn(row, l) {
  const host = NM.brandHostFor(l.kind);
  const bad = host && l.url && l.url.trim() && NM.brandMismatch(l.kind, l.url);
  let el = row.querySelector(".link-warn");
  if (bad && !el) { el = document.createElement("p"); el.className = "link-warn"; row.appendChild(el); }
  if (bad) el.textContent = isZh() ? `这个按钮的链接必须指向 ${host}` : `This button must link to ${host}`;
  else if (el) el.remove();
}
function buildLinks() {
  const wrap = $("#links");
  wrap.innerHTML = "";
  links.forEach((l, i) => {
    const kindMeta = NM.PAYMENT_KINDS[l.kind] || NM.PAYMENT_KINDS.custom;
    const defLabel = NM.payLabel(l.kind);
    const sp = NM.splitHandle(l.kind, l.url || "");   // {mode:"handle"|"full", value}
    const prefix = NM.payPrefix(l.kind);
    const row = document.createElement("div");
    row.className = "link-edit";
    const opts = Object.entries(NM.PAYMENT_KINDS).map(([k, v]) =>
      `<option value="${k}" ${k === l.kind ? "selected" : ""}>${(isZh() && v.zh ? v.zh : v.label).replace(/^[^ ]+ /, "")}</option>`).join("");

    let urlField;
    if (sp.mode === "handle") {
      // ask for the handle only; the prefix is shown as a fixed adornment
      const exHandle = NM.splitHandle(l.kind, kindMeta.ex || "").value || "you";
      urlField =
        `<div class="link-handle"><span class="link-prefix">${esc(prefix)}</span>` +
        `<input class="link-url" type="text" autocapitalize="none" autocomplete="off" spellcheck="false" placeholder="${esc(exHandle)}" value="${esc(sp.value)}" /></div>`;
    } else {
      urlField = `<input class="link-url" type="text" placeholder="${esc(kindMeta.ex || "https://your-link.com")}" value="${esc(l.url || "")}" />`;
    }

    // a branded full-URL must match its brand; handle mode can't mismatch (we build the URL)
    const host = NM.brandHostFor(l.kind);
    const mism = sp.mode === "full" && host && l.url && l.url.trim() && NM.brandMismatch(l.kind, l.url);
    const warn = mism
      ? `<p class="link-warn">${isZh() ? `这个按钮的链接必须指向 ${host}` : `This button must link to ${host}`}</p>`
      : "";

    row.innerHTML =
      `<div class="link-top"><select>${opts}</select><button class="link-del" title="remove" aria-label="Remove link">×</button></div>` +
      `<input class="link-label" type="text" maxlength="40" placeholder="${esc(t("link.btn_text_ph") + defLabel)}" value="${esc(l.label || "")}" />` +
      urlField + warn;

    row.querySelector("select").onchange = e => {
      const newKind = e.target.value;
      const prev = NM.splitHandle(l.kind, links[i].url || "");
      links[i].kind = newKind;
      // carry a plain handle across handle-kinds (coffee/you → kofi/you); drop a now-off-brand URL
      if (NM.payPrefix(newKind)) {
        if (prev.mode === "handle" && prev.value) links[i].url = NM.joinHandle(newKind, prev.value);
        else if (prev.mode === "full" && NM.brandMismatch(newKind, links[i].url)) links[i].url = "";
      }
      buildLinks(); render();
    };
    row.querySelector(".link-label").oninput = e => { links[i].label = e.target.value; render(); };
    const urlInput = row.querySelector(".link-url");
    urlInput.oninput = e => {
      if (sp.mode === "handle") {
        links[i].url = NM.joinHandle(l.kind, e.target.value);
        // pasting a full alternate-host link (paypal.com/…) flips this row to a URL field
        if (NM.splitHandle(l.kind, links[i].url).mode === "full") buildLinks();
      } else {
        links[i].url = e.target.value;
        updateLinkWarn(row, links[i]);
      }
      render();
    };
    row.querySelector(".link-del").onclick = () => { links.splice(i, 1); buildLinks(); render(); };
    wrap.appendChild(row);
  });
}
$("#addLink").onclick = () => { if (links.length < 5) { links.push({ kind: "custom", url: "" }); buildLinks(); render(); } else toast(t("toast.links_max")); };

function gather() {
  const handle = ($("#f-handle").value.trim() || "you").toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "you";
  return {
    name: $("#f-name").value.trim() || "Someone broke",
    handle,
    status,
    ...(emoji ? { emoji } : {}),
    story: $("#f-story").value.trim(),
    goal: Number($("#f-goal").value) || 0,
    raised: Number($("#f-raised").value) || 0,
    links: links.map(l => {
      const label = (l.label || "").trim();
      return label ? { kind: l.kind, url: l.url, label } : { kind: l.kind, url: l.url };
    }),
  };
}

function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function num(n) { return (Number(n) || 0).toLocaleString(); }
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`; }
function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("show"); setTimeout(() => el.classList.remove("show"), 1800); }

function render() {
  const data = gather();
  $("#handlePrev").textContent = data.handle;
  $("#storyCount").textContent = $("#f-story").value.length + "/240";
  const st = NM.locStatus(NM.STATUSES[data.status]);
  const bs = NM.brokeScore(data);
  const pct = NM.pctOf(data);
  const root = document.documentElement;
  root.style.setProperty("--accent", st.accent);
  root.style.setProperty("--accent-soft", hexA(st.accent, 0.1));
  root.style.setProperty("--accent-line", hexA(st.accent, 0.45));
  root.style.setProperty("--accent-glow", hexA(st.accent, 0.18));

  const linkHtml = data.links.map(l => {
    const k = NM.PAYMENT_KINDS[l.kind] || NM.PAYMENT_KINDS.custom;
    const label = (l.label && l.label.trim()) || NM.payLabel(l.kind);
    const a = `<a class="${k.cls}" href="${esc(NM.safeUrl(l.url))}">${esc(label)}</a>`;
    const host = NM.freeFormHost(l.kind, l.url);   // preview the destination hint visitors will see
    return host ? a + `<p class="link-host">→ ${esc(host)}</p>` : a;
  }).join("");

  const pctLine = isZh() ? `${t("card.lessbroke")} ${pct}%` : `${pct}% ${t("card.lessbroke")}`;
  const raisedLine = isZh() ? `已筹 $${num(data.raised)} / 目标 $${num(data.goal)} 生存基金`
                            : `$${num(data.raised)} raised of $${num(data.goal)} survival fund`;
  $("#preview").className = "page-card theme-" + (st.theme || "clean");
  $("#preview").innerHTML = `
    <div class="avatar">${esc(data.emoji || st.emoji)}</div>
    <div class="status-pill"><span class="dot"></span>${st.label}</div>
    <div class="page-name">${esc(data.name)}</div>
    <div class="page-handle">no.money/${esc(data.handle)}</div>
    <div class="page-story">${esc(data.story || st.story)}</div>
    <div class="goal-wrap">
      <div class="goal-row"><span class="label">${t("card.goal")}</span><span class="pct">${pctLine}</span></div>
      <div class="goal-bar"><i style="width:${pct}%"></i></div>
      <div class="goal-sub">${raisedLine}</div>
    </div>
    <div class="support-btns">${linkHtml}</div>
    <div class="broke-score">
      <div class="bs-top"><span class="bs-label">${t("card.broke_score")}</span><span class="bs-num">${bs.score}<span>/100</span></span></div>
      <div class="bs-meter"><i style="width:${bs.score}%"></i></div>
      <div class="bs-row"><span class="k">${t("card.status")}</span><span class="v">${esc(bs.band)}</span></div>
      <div class="bs-row"><span class="k">${t("card.risk")}</span><span class="v">${esc(bs.risk)}</span></div>
    </div>`;
  saveDraft();
}

// keep the in-progress page in localStorage so a refresh / accidental close doesn't lose it
function saveDraft() {
  try {
    localStorage.setItem("nm:draft", JSON.stringify({
      name: $("#f-name").value, handle: $("#f-handle").value, status, emoji,
      story: $("#f-story").value, goal: $("#f-goal").value, raised: $("#f-raised").value,
      links, storyTouched, handleTouched,
    }));
  } catch (e) { /* private mode / quota — ignore */ }
}
function restoreDraft() {
  try {
    const d = JSON.parse(localStorage.getItem("nm:draft") || "null");
    if (!d || typeof d !== "object") return;
    if (d.name != null) $("#f-name").value = d.name;
    if (d.handle != null) $("#f-handle").value = d.handle;
    if (d.story != null) $("#f-story").value = d.story;
    if (d.goal != null) $("#f-goal").value = d.goal;
    if (d.raised != null) $("#f-raised").value = d.raised;
    if (Object.prototype.hasOwnProperty.call(NM.STATUSES, d.status)) status = d.status;
    if (typeof d.emoji === "string") emoji = d.emoji;
    if (Array.isArray(d.links) && d.links.length) {
      links = d.links.map(l => ({ kind: NM.canonKind(l.kind), url: l.url || "", ...(l.label ? { label: l.label } : {}) }));
    }
    storyTouched = !!d.storyTouched;
    handleTouched = !!d.handleTouched;
  } catch (e) { /* corrupt draft — ignore */ }
}

$("#aiBtn").onclick = async (e) => {
  e.preventDefault();
  const btn = $("#aiBtn"), prev = btn.textContent;
  btn.disabled = true; btn.textContent = t("create.thinking");
  let text = null, limited = false;
  try {
    const res = await fetch("/api/ai", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ label: NM.locStatus(NM.STATUSES[status] || {}).label || status, story: $("#f-story").value.trim(), lang: window.I18N.lang }),
    });
    if (res.ok) { const j = await res.json(); if (j && j.text) text = j.text; }
    else if (res.status === 429) limited = true;
  } catch (err) { /* fall back below */ }

  if (text) {
    $("#f-story").value = text.slice(0, 240);
    storyTouched = true;            // keep the AI line; don't let a status switch overwrite it
    toast(t("toast.ai_done"));
  } else if (isZh()) {              // zh: no curated EN rotation — fall back to the localized status story
    $("#f-story").value = NM.locStatus(NM.STATUSES[status]).story;
    toast(limited ? t("toast.ai_rate") : t("toast.ai_punch"));
  } else {
    const arr = AI_LINES[status] || AI_LINES.ramen;   // rate-limited / offline → curated rotation
    aiIdx[status] = ((aiIdx[status] ?? -1) + 1) % arr.length;
    $("#f-story").value = arr[aiIdx[status]];
    toast(limited ? t("toast.ai_rate") : t("toast.ai_punch"));
  }
  btn.disabled = false; btn.textContent = prev;
  render();
};

$("#f-story").addEventListener("input", () => { storyTouched = true; render(); });
$("#f-name").addEventListener("input", () => {
  if (!handleTouched) $("#f-handle").value = slugify($("#f-name").value); // handle follows the name until edited
  render();
});
$("#f-handle").addEventListener("input", () => { handleTouched = true; render(); });
["#f-goal", "#f-raised"].forEach(s => { $(s).addEventListener("input", render); });

// 🎲 roll a fresh broke persona — lowers the blank-page barrier
const PERSONA_EMOJIS = ["", "😭", "🥲", "💀", "🤡", "🐀", "💸", "📉"];
const PERSONA_NAMES = ["Mira", "Kai", "Sol", "Devon", "Aria", "Remy", "Nico", "Tess", "Jules", "Ezra", "Quinn", "Ash"];
const pick = a => a[Math.floor(Math.random() * a.length)];
$("#surprise").onclick = () => {
  status = pick(NM.STATUS_ORDER);
  $("#f-story").value = isZh() ? NM.locStatus(NM.STATUSES[status]).story : pick(AI_LINES[status] || AI_LINES.ramen);
  storyTouched = true;
  const nm = pick(PERSONA_NAMES);
  $("#f-name").value = nm;
  handleTouched = false;                       // let the handle follow the new name again
  $("#f-handle").value = slugify(nm);
  emoji = pick(PERSONA_EMOJIS);
  buildChips(); buildEmoji(); render();
  toast(t("toast.surprise"));
};

// turn "paypal.me/you" into "https://paypal.me/you", but leave real schemes (http:, bitcoin:) and raw crypto addresses alone
function normUrl(u) {
  u = (u || "").trim();
  if (!u || /^[a-z][a-z0-9+.-]*:/i.test(u)) return u;     // already has a scheme
  if (/^[^\s]+\.[^\s]+/.test(u)) return "https://" + u;   // looks like a bare domain/path
  return u;                                                // raw token (e.g. wallet address)
}

// publish
const base = location.pathname.replace(/[^/]*$/, "");  // directory, ends with "/"
let publishing = false;

async function publish() {
  if (publishing) return;            // guard against double-clicks (both buttons)
  publishing = true;
  const data = gather();
  data.links = data.links
    .filter(l => l.url && l.url.trim())                       // don't ship dead buttons (no URL)
    .map(l => ({ ...l, url: NM.safeUrl(normUrl(l.url)) }));   // fix missing https:// + strip unsafe schemes

  // a branded button (PayPal, Ko-fi, …) must actually link to that brand — no spoofing
  const offBrand = data.links.find(l => NM.brandMismatch(l.kind, l.url));
  if (offBrand) {
    const host = NM.brandHostFor(offBrand.kind);
    toast(isZh() ? `这个按钮的链接必须指向 ${host}` : `That button must link to ${host}`);
    buildLinks();           // surface the inline warning on the offending row
    publishing = false;
    return;
  }

  NM.drawShareImage($("#shareCanvas"), data);

  // create a new page, or UPDATE the one we're editing
  const editing = !!(editingSlug && editToken);
  const btn = $("#publish"), prev = btn.textContent;
  btn.textContent = editing ? t("create.updating") : t("create.publishing"); btn.disabled = true;
  let result = null;
  try {
    const img = $("#shareCanvas").toDataURL("image/png");
    const score = NM.brokeScore(data).score;
    const title = isZh() ? `${data.name} 破产 ${score}% · No Money` : `${data.name} is ${score}% broke · No Money`;
    const meta = { title, desc: NM.shareText(data) };
    const payload = { data, img, meta };
    if (editing) { payload.slug = editingSlug; payload.editToken = editToken; }
    const res = await fetch(base + "api/save", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) result = await res.json();
    else if (res.status === 403) toast(t("toast.edit_invalid"));
  } catch (e) { /* handled below */ }
  btn.textContent = prev; btn.disabled = false; publishing = false;

  if (!result || !result.slug) { if (!editing) toast(t("toast.publish_fail")); return; }

  const url = location.origin + base + result.slug;
  // remember edit rights + switch into edit mode so further saves update the same page
  if (result.editToken) {
    try { localStorage.setItem("nm:edit:" + result.slug, result.editToken); localStorage.setItem("nm:last", result.slug); } catch (e) {}
    $("#editUrl").value = location.origin + base + "create.html?edit=" + result.slug + "&t=" + encodeURIComponent(result.editToken);
    enterEditMode(result.slug, result.editToken);
  }

  $(".live-badge").textContent = editing ? t("modal.updated_badge") : t("modal.badge");
  document.querySelector(".modal-live h3").textContent = editing ? t("modal.updated_h3") : t("modal.live_h3");
  $("#resultUrl").value = url;
  $("#openPage").href = url;
  NM.renderShareRow($("#shareRow"), url, data);
  $("#modal").classList.add("open");
  if (!data.links.length) toast(t("toast.tip_add_link"));
}

// switch the editor into "update this page" mode (after creating, or when opened via an edit link)
function enterEditMode(slug, token) {
  editingSlug = slug; editToken = token;
  const h = $("#f-handle"); h.value = slug; h.readOnly = true; handleTouched = true;
  $("#editNote").style.display = "";
  applyEditModeText();
}
// edit-mode header/button text — re-applied after a language switch (which resets [data-i18n])
function applyEditModeText() {
  if (!editingSlug) return;
  $("#publish").textContent = t("create.update_btn");
  document.querySelector(".create-head h1").textContent = t("create.edit_h1");
}

// load an existing page into the editor (opened via ?edit=<slug>&t=<token>)
async function loadForEdit(slug, t2) {
  let d = null;
  try { const res = await fetch(base + "api/get?slug=" + encodeURIComponent(slug)); if (res.ok) d = (await res.json()).data; } catch (e) {}
  if (!d) { document.documentElement.classList.remove("loading-edit"); toast(t("toast.load_fail")); return; }
  $("#f-name").value = d.name || "";
  $("#f-handle").value = d.handle || slug;
  $("#f-story").value = d.story || "";
  $("#f-goal").value = d.goal != null ? d.goal : "";
  $("#f-raised").value = d.raised != null ? d.raised : "";
  if (Object.prototype.hasOwnProperty.call(NM.STATUSES, d.status)) status = d.status;
  emoji = typeof d.emoji === "string" ? d.emoji : "";
  if (Array.isArray(d.links) && d.links.length) links = d.links.map(l => ({ kind: NM.canonKind(l.kind), url: l.url || "", ...(l.label ? { label: l.label } : {}) }));
  storyTouched = true;
  let token = t2; try { token = token || localStorage.getItem("nm:edit:" + slug); } catch (e) {}
  enterEditMode(slug, token);
  if (!token) toast(t("toast.no_edit_access"));
  buildChips(); buildEmoji(); buildLinks(); render();
  document.documentElement.classList.remove("loading-edit"); // reveal the populated form (no default-content flash)
}
$("#publish").onclick = publish;
$("#publishTop").onclick = (e) => { e.preventDefault(); publish(); };
$("#closeModal").onclick = () => $("#modal").classList.remove("open");
$("#modal").onclick = e => { if (e.target === $("#modal")) $("#modal").classList.remove("open"); };
function flashCopied(btn) {
  if (btn._t) { clearTimeout(btn._t); } else { btn._label = btn.textContent; }
  btn.textContent = t("btn.copied"); btn.classList.add("copied");
  btn._t = setTimeout(() => { btn.textContent = btn._label; btn.classList.remove("copied"); btn._t = null; }, 1400);
}
$("#copyResult").onclick = async () => {
  try { await navigator.clipboard.writeText($("#resultUrl").value); toast(t("toast.link_copied")); flashCopied($("#copyResult")); }
  catch { $("#resultUrl").select(); toast(t("toast.copy_manual")); }
};
$("#copyEdit").onclick = async () => {
  try { await navigator.clipboard.writeText($("#editUrl").value); toast(t("toast.edit_copied")); flashCopied($("#copyEdit")); }
  catch { $("#editUrl").select(); toast(t("toast.copy_manual")); }
};
$("#downloadBtn").onclick = () => {
  const a = document.createElement("a");
  a.download = `no-money-${gather().handle}.png`;
  a.href = $("#shareCanvas").toDataURL("image/png");
  a.click();
};

// pages this device can still edit (capability tokens kept in localStorage)
function listEditablePages() {
  const out = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("nm:edit:")) out.push({ slug: k.slice(8), token: localStorage.getItem(k) });
    }
  } catch (e) {}
  return out;
}
// banner offering to resume editing an existing page (so "Create my page" doesn't silently orphan it)
function showResumeBar() {
  if (editingSlug) return;                       // already editing — nothing to resume
  const pages = listEditablePages();
  if (!pages.length) { $("#resumeBar").style.display = "none"; return; }
  let last = null; try { last = localStorage.getItem("nm:last"); } catch (e) {}
  const pick = pages.find(p => p.slug === last) || pages[0];
  const extra = pages.length > 1 ? ` (+${pages.length - 1})` : "";
  const bar = $("#resumeBar");
  bar.innerHTML =
    `<span class="resume-txt">💸 ${t("resume.has")} <b>no.money/${esc(pick.slug)}</b>${extra}</span>` +
    `<span class="resume-actions"><button class="btn btn-primary" id="resumeEdit">${t("resume.edit")}</button>` +
    `<button class="btn btn-ghost" id="resumeNew">${t("resume.new")}</button></span>`;
  bar.style.display = "";
  $("#resumeEdit").onclick = () => { bar.style.display = "none"; loadForEdit(pick.slug, pick.token); };
  $("#resumeNew").onclick = () => { bar.style.display = "none"; };
}

// init: ?edit=<slug> loads a page for editing; else ?status= themed fresh start; else restore draft
(function init() {
  const qp = new URLSearchParams(location.search);
  const editSlug = qp.get("edit");
  const willEdit = editSlug && /^[a-z0-9-]{2,40}$/.test(editSlug);
  if (!willEdit) document.documentElement.classList.remove("loading-edit"); // clear stray loading state (e.g. bad ?edit=)
  if (!editSlug) {
    const s = qp.get("status");
    if (s && Object.prototype.hasOwnProperty.call(NM.STATUSES, s)) {
      status = s; $("#f-story").value = NM.locStatus(NM.STATUSES[s]).story;
    } else {
      restoreDraft();
    }
    if (!storyTouched) $("#f-story").value = NM.locStatus(NM.STATUSES[status]).story; // default story in active language
  }
  window.I18N.apply();                                   // translate static [data-i18n] text
  document.title = t("title.create");
  buildChips(); buildEmoji(); buildLinks(); render();    // render defaults/draft first (no blank flash)
  if (willEdit) loadForEdit(editSlug, qp.get("t")); // then override async (clears loading-edit when done)
  else showResumeBar();                                  // surface an existing page to keep editing
})();

// language toggle + re-render dynamic content on switch
$("#langToggle").onclick = () => window.I18N.setLang(isZh() ? "en" : "zh");
window.addEventListener("langchange", () => {
  if (!storyTouched && !editingSlug) $("#f-story").value = NM.locStatus(NM.STATUSES[status]).story;
  buildChips(); buildEmoji(); buildLinks(); render();
  applyEditModeText();   // setLang re-applied [data-i18n], which would reset edit-mode header/button
  document.title = t("title.create");
  if ($("#resumeBar").style.display !== "none") showResumeBar();   // refresh banner text in new language
});
