import "../assets/core.js"; // sets window.NM + loads the stylesheet
const $ = s => document.querySelector(s);
let status = "domain";
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
    b.textContent = e === "" ? "Auto" : e;
    if (e === "") b.style.fontSize = "12px";
    b.title = e === "" ? "Use your status emoji" : e;
    b.setAttribute("aria-pressed", e === emoji);
    b.onclick = () => { emoji = e; buildEmoji(); render(); };
    wrap.appendChild(b);
  });
}

const AI_LINES = {
  domain: [
    "I came here to build wealth.\nUnfortunately, I discovered premium domains.\nMy portfolio is strong. My fridge is empty.",
    "Net worth: 47 domains.\nLiquid cash: a single expired coupon.\nFund my intervention.",
    "I don't have a spending problem.\nI have a 'this name will definitely flip' problem.\nIt has not flipped.",
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
};
const aiIdx = {};

function buildChips() {
  const c = $("#chips");
  c.innerHTML = "";   // clear first — buildChips is called again on Surprise / edit-load
  NM.STATUS_ORDER.forEach(k => {
    const st = NM.STATUSES[k];
    const b = document.createElement("button");
    b.className = "chip" + (k === status ? " on" : "");
    b.textContent = `${st.emoji} ${st.label}`;
    b.setAttribute("aria-pressed", k === status);
    b.onclick = () => {
      status = k;
      document.querySelectorAll(".chip").forEach(x => { x.classList.remove("on"); x.setAttribute("aria-pressed", "false"); });
      b.classList.add("on");
      b.setAttribute("aria-pressed", "true");
      // only swap in this status' default story if the user hasn't written their own
      if (!storyTouched) $("#f-story").value = NM.STATUSES[k].story;
      render();
    };
    c.appendChild(b);
  });
}

let links = [{ kind: "ramen", url: "" }];
function buildLinks() {
  const wrap = $("#links");
  wrap.innerHTML = "";
  links.forEach((l, i) => {
    const kind = NM.PAYMENT_KINDS[l.kind] || NM.PAYMENT_KINDS.custom;
    const defLabel = kind.label;
    const row = document.createElement("div");
    row.className = "link-edit";
    const opts = Object.entries(NM.PAYMENT_KINDS).map(([k, v]) =>
      `<option value="${k}" ${k === l.kind ? "selected" : ""}>${v.label.replace(/^[^ ]+ /, "")}</option>`).join("");
    row.innerHTML =
      `<div class="link-top"><select>${opts}</select><button class="link-del" title="remove" aria-label="Remove link">×</button></div>` +
      `<input class="link-label" type="text" maxlength="40" placeholder="Button text — e.g. ${esc(defLabel)}" value="${esc(l.label || "")}" />` +
      `<input class="link-url" type="text" placeholder="${esc(kind.ex || "https://your-link.com")}" value="${esc(l.url || "")}" />`;
    row.querySelector("select").onchange = e => { links[i].kind = e.target.value; buildLinks(); render(); };
    row.querySelector(".link-label").oninput = e => { links[i].label = e.target.value; render(); };
    row.querySelector(".link-url").oninput = e => { links[i].url = e.target.value; render(); };
    row.querySelector(".link-del").onclick = () => { links.splice(i, 1); buildLinks(); render(); };
    wrap.appendChild(row);
  });
}
$("#addLink").onclick = () => { if (links.length < 5) { links.push({ kind: "custom", url: "" }); buildLinks(); render(); } else toast("Free plan: 5 links max"); };

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
  const st = NM.STATUSES[data.status];
  const bs = NM.brokeScore(data);
  const pct = NM.pctOf(data);
  const root = document.documentElement;
  root.style.setProperty("--accent", st.accent);
  root.style.setProperty("--accent-soft", hexA(st.accent, 0.1));
  root.style.setProperty("--accent-line", hexA(st.accent, 0.45));
  root.style.setProperty("--accent-glow", hexA(st.accent, 0.18));

  const linkHtml = data.links.map(l => {
    const k = NM.PAYMENT_KINDS[l.kind] || NM.PAYMENT_KINDS.custom;
    const label = (l.label && l.label.trim()) || k.label;
    return `<a class="${k.cls}" href="${esc(NM.safeUrl(l.url))}">${esc(label)}</a>`;
  }).join("");

  $("#preview").className = "page-card theme-" + (st.theme || "clean");
  $("#preview").innerHTML = `
    <div class="avatar">${esc(data.emoji || st.emoji)}</div>
    <div class="status-pill"><span class="dot"></span>${st.label}</div>
    <div class="page-name">${esc(data.name)}</div>
    <div class="page-handle">no.money/${esc(data.handle)}</div>
    <div class="page-story">${esc(data.story || st.story)}</div>
    <div class="goal-wrap">
      <div class="goal-row"><span class="label">Goal</span><span class="pct">${pct}% less broke</span></div>
      <div class="goal-bar"><i style="width:${pct}%"></i></div>
      <div class="goal-sub">$${num(data.raised)} raised of $${num(data.goal)} survival fund</div>
    </div>
    <div class="support-btns">${linkHtml}</div>
    <div class="broke-score">
      <div class="bs-top"><span class="bs-label">Broke Score</span><span class="bs-num">${bs.score}<span>/100</span></span></div>
      <div class="bs-meter"><i style="width:${bs.score}%"></i></div>
      <div class="bs-row"><span class="k">Status</span><span class="v">${esc(bs.band)}</span></div>
      <div class="bs-row"><span class="k">Risk level</span><span class="v">${esc(bs.risk)}</span></div>
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
      links = d.links.map(l => ({ kind: l.kind || "custom", url: l.url || "", ...(l.label ? { label: l.label } : {}) }));
    }
    storyTouched = !!d.storyTouched;
    handleTouched = !!d.handleTouched;
  } catch (e) { /* corrupt draft — ignore */ }
}

$("#aiBtn").onclick = (e) => {
  e.preventDefault();
  const arr = AI_LINES[status] || AI_LINES.domain;
  aiIdx[status] = ((aiIdx[status] ?? -1) + 1) % arr.length;
  $("#f-story").value = arr[aiIdx[status]];
  render();
  toast("✨ Punched up");
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
  $("#f-story").value = pick(AI_LINES[status] || AI_LINES.domain);
  storyTouched = true;
  const nm = pick(PERSONA_NAMES);
  $("#f-name").value = nm;
  handleTouched = false;                       // let the handle follow the new name again
  $("#f-handle").value = slugify(nm);
  emoji = pick(PERSONA_EMOJIS);
  buildChips(); buildEmoji(); render();
  toast("🎲 Rolled a fresh broke persona");
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

  NM.drawShareImage($("#shareCanvas"), data);

  // create a new page, or UPDATE the one we're editing
  const editing = !!(editingSlug && editToken);
  const btn = $("#publish"), prev = btn.textContent;
  btn.textContent = editing ? "Updating…" : "Publishing…"; btn.disabled = true;
  let result = null;
  try {
    const img = $("#shareCanvas").toDataURL("image/png");
    const meta = { title: `${data.name} is ${NM.brokeScore(data).score}% broke · No Money`, desc: NM.shareText(data) };
    const payload = { data, img, meta };
    if (editing) { payload.slug = editingSlug; payload.editToken = editToken; }
    const res = await fetch(base + "api/save", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) result = await res.json();
    else if (res.status === 403) toast("This edit link is invalid — can't update");
  } catch (e) { /* handled below */ }
  btn.textContent = prev; btn.disabled = false; publishing = false;

  if (!result || !result.slug) { if (!editing) toast("Couldn't publish — check your connection and try again"); return; }

  const url = location.origin + base + result.slug;
  // remember edit rights + switch into edit mode so further saves update the same page
  if (result.editToken) {
    try { localStorage.setItem("nm:edit:" + result.slug, result.editToken); } catch (e) {}
    $("#editLink").href = location.origin + base + "create.html?edit=" + result.slug + "&t=" + encodeURIComponent(result.editToken);
    enterEditMode(result.slug, result.editToken);
  }

  $(".live-badge").textContent = editing ? "✅ Updated" : "💸 You're officially broke";
  document.querySelector(".modal-live h3").textContent = editing ? "Your page is updated 🎉" : "Your page is live 🎉";
  $("#resultUrl").value = url;
  $("#openPage").href = url;
  NM.renderShareRow($("#shareRow"), url, data);
  $("#modal").classList.add("open");
  if (!data.links.length) toast("Tip: add a support link so people can actually tip you 💸");
}

// switch the editor into "update this page" mode (after creating, or when opened via an edit link)
function enterEditMode(slug, token) {
  editingSlug = slug; editToken = token;
  const h = $("#f-handle"); h.value = slug; h.readOnly = true; handleTouched = true;
  $("#editNote").style.display = "";
  $("#publish").textContent = "Update my page →";
  document.querySelector(".create-head h1").textContent = "Edit your page";
}

// load an existing page into the editor (opened via ?edit=<slug>&t=<token>)
async function loadForEdit(slug, t) {
  let d = null;
  try { const res = await fetch(base + "api/get?slug=" + encodeURIComponent(slug)); if (res.ok) d = (await res.json()).data; } catch (e) {}
  if (!d) { toast("Couldn't load that page"); return; }
  $("#f-name").value = d.name || "";
  $("#f-handle").value = d.handle || slug;
  $("#f-story").value = d.story || "";
  $("#f-goal").value = d.goal != null ? d.goal : "";
  $("#f-raised").value = d.raised != null ? d.raised : "";
  if (Object.prototype.hasOwnProperty.call(NM.STATUSES, d.status)) status = d.status;
  emoji = typeof d.emoji === "string" ? d.emoji : "";
  if (Array.isArray(d.links) && d.links.length) links = d.links.map(l => ({ kind: l.kind || "custom", url: l.url || "", ...(l.label ? { label: l.label } : {}) }));
  storyTouched = true;
  let token = t; try { token = token || localStorage.getItem("nm:edit:" + slug); } catch (e) {}
  enterEditMode(slug, token);
  if (!token) toast("No edit access on this device — changes won't save");
  buildChips(); buildEmoji(); buildLinks(); render();
}
$("#publish").onclick = publish;
$("#publishTop").onclick = (e) => { e.preventDefault(); publish(); };
$("#closeModal").onclick = () => $("#modal").classList.remove("open");
$("#modal").onclick = e => { if (e.target === $("#modal")) $("#modal").classList.remove("open"); };
$("#copyResult").onclick = async () => {
  try { await navigator.clipboard.writeText($("#resultUrl").value); toast("Link copied 🔗"); }
  catch { $("#resultUrl").select(); toast("Press ⌘/Ctrl+C to copy"); }
};
$("#downloadBtn").onclick = () => {
  const a = document.createElement("a");
  a.download = `no-money-${gather().handle}.png`;
  a.href = $("#shareCanvas").toDataURL("image/png");
  a.click();
};

// init: ?edit=<slug> loads a page for editing; else ?status= themed fresh start; else restore draft
(function init() {
  const qp = new URLSearchParams(location.search);
  const editSlug = qp.get("edit");
  if (!editSlug) {
    const s = qp.get("status");
    if (s && Object.prototype.hasOwnProperty.call(NM.STATUSES, s)) {
      status = s; $("#f-story").value = NM.STATUSES[s].story;
    } else {
      restoreDraft();
    }
  }
  buildChips(); buildEmoji(); buildLinks(); render();   // render defaults/draft first (no blank flash)
  if (editSlug && /^[a-z0-9-]{2,40}$/.test(editSlug)) loadForEdit(editSlug, qp.get("t")); // then override async
})();
