import "../assets/core.js"; // sets window.NM + window.I18N + loads the stylesheet
const $ = s => document.querySelector(s);
const t = (k) => window.I18N.t(k);
const lang = () => window.I18N.lang;
const mustMatch = (host) => t("link.must_match").replace("{host}", host);
let status = "ramen";
let storyTouched = false; // becomes true once the user types their own story — then we never auto-overwrite it
let handleTouched = false; // once the user edits the handle, stop auto-deriving it from the name
let emoji = "";           // custom avatar emoji; "" = use the broke status' default
let editingSlug = null;   // when set, publishing UPDATES this slug instead of creating a new page
let editToken = null;     // capability token proving edit rights for editingSlug
let avatarData = null;    // a freshly picked photo as a JPEG data URL, queued to upload
let avatarExisting = "";  // URL of an already-saved photo (edit mode) — for preview only
let avatarRemoved = false; // user cleared a saved photo (so publish sends avatar:null)

const AVATAR_PX = 256;    // exported avatar is a 256px square JPEG (~20–40 KB)
// what the card should show right now: a new pick wins, else the saved one (unless cleared)
const avatarSrc = () => avatarData || (avatarRemoved ? "" : avatarExisting);

/* ---------- avatar crop modal: pan + zoom, dependency-free ----------
   The user drags to move and zooms to frame the part of the photo they want
   inside a circular guide; on confirm the visible square is exported to a
   256px JPEG. Geometry is tracked in "stage px"; `eff` maps natural px → stage px. */
const cropStage = $("#cropStage"), cropImg = $("#cropImg"), cropZoom = $("#cropZoom");
let crop = null;          // { url, w, h, cover, eff, zoom, ox, oy } while the modal is open
const stageSize = () => cropStage.clientWidth || 280;

function clampCrop() {     // the photo must always cover the whole stage (no gaps)
  const S = stageSize();
  crop.ox = Math.min(0, Math.max(S - crop.w * crop.eff, crop.ox));
  crop.oy = Math.min(0, Math.max(S - crop.h * crop.eff, crop.oy));
}
function applyCrop() {
  cropImg.style.width = (crop.w * crop.eff) + "px";
  cropImg.style.height = (crop.h * crop.eff) + "px";
  cropImg.style.left = crop.ox + "px";
  cropImg.style.top = crop.oy + "px";
}
function setZoom(z, fx, fy) {   // zoom around a focal point (slider → center; wheel → cursor)
  const S = stageSize();
  fx = fx == null ? S / 2 : fx; fy = fy == null ? S / 2 : fy;
  const old = crop.eff;
  crop.zoom = Math.min(3, Math.max(1, z));
  crop.eff = crop.cover * crop.zoom;
  crop.ox = fx - (fx - crop.ox) * (crop.eff / old);
  crop.oy = fy - (fy - crop.oy) * (crop.eff / old);
  clampCrop(); applyCrop();
}
function openCropper(file) {
  if (!file || !/^image\//.test(file.type)) { toast(t("toast.avatar_big")); return; }
  const url = URL.createObjectURL(file);
  const im = new Image();
  im.onload = () => {
    if (crop && crop.url) URL.revokeObjectURL(crop.url);
    $("#cropModal").classList.add("open");     // open first so the stage is measurable
    const S = stageSize();
    const cover = S / Math.min(im.width, im.height);
    crop = { url, w: im.width, h: im.height, cover, eff: cover, zoom: 1,
             ox: (S - im.width * cover) / 2, oy: (S - im.height * cover) / 2 };
    cropImg.src = url; cropZoom.value = "1"; applyCrop();
  };
  im.onerror = () => { URL.revokeObjectURL(url); toast(t("toast.avatar_big")); };
  im.src = url;
}
function closeCropper() {
  $("#cropModal").classList.remove("open");
  if (crop && crop.url) URL.revokeObjectURL(crop.url);
  crop = null;
}
function exportCrop() {     // visible stage square → 256px JPEG (source rect in natural px)
  const S = stageSize();
  const c = document.createElement("canvas");
  c.width = c.height = AVATAR_PX;
  c.getContext("2d").drawImage(cropImg, -crop.ox / crop.eff, -crop.oy / crop.eff, S / crop.eff, S / crop.eff, 0, 0, AVATAR_PX, AVATAR_PX);
  return c.toDataURL("image/jpeg", 0.82);
}
// drag to pan
let cropDrag = false, cropLX = 0, cropLY = 0;
cropStage.addEventListener("pointerdown", (e) => {
  if (!crop) return;
  cropDrag = true; cropLX = e.clientX; cropLY = e.clientY;
  try { cropStage.setPointerCapture(e.pointerId); } catch {}
});
cropStage.addEventListener("pointermove", (e) => {
  if (!cropDrag || !crop) return;
  crop.ox += e.clientX - cropLX; crop.oy += e.clientY - cropLY;
  cropLX = e.clientX; cropLY = e.clientY;
  clampCrop(); applyCrop();
});
const cropEnd = (e) => { if (cropDrag) { cropDrag = false; try { cropStage.releasePointerCapture(e.pointerId); } catch {} } };
cropStage.addEventListener("pointerup", cropEnd);
cropStage.addEventListener("pointercancel", cropEnd);
cropZoom.addEventListener("input", () => { if (crop) setZoom(parseFloat(cropZoom.value)); });
cropStage.addEventListener("wheel", (e) => {
  if (!crop) return;
  e.preventDefault();
  const r = cropStage.getBoundingClientRect();
  setZoom(crop.zoom * (e.deltaY < 0 ? 1.08 : 0.92), e.clientX - r.left, e.clientY - r.top);
  cropZoom.value = String(crop.zoom);
}, { passive: false });
$("#cropUse").onclick = () => {
  if (!crop) return;
  const data = exportCrop();             // export before close (revoke would free the image)
  closeCropper();
  avatarData = data; avatarRemoved = false;
  syncAvatarUI(); render();
};
$("#cropCancel").onclick = closeCropper;
$("#cropModal").onclick = (e) => { if (e.target === $("#cropModal")) closeCropper(); };

function syncAvatarUI() {
  const src = avatarSrc(), thumb = $("#avatarThumb"), im = $("#avatarImg");
  if (src) { im.src = src; thumb.hidden = false; } else { im.removeAttribute("src"); thumb.hidden = true; }
}

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
  if (bad) el.textContent = mustMatch(host);
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
      `<option value="${k}" ${k === l.kind ? "selected" : ""}>${NM.payLabel(k).replace(/^[^ ]+ /, "")}</option>`).join("");

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
      ? `<p class="link-warn">${mustMatch(host)}</p>`
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

// avatar photo: pick → frame it in the crop modal → preview (upload happens on publish)
$("#avatarFile").onchange = (e) => {
  const f = e.target.files && e.target.files[0];
  e.target.value = "";                                  // allow re-picking the same file
  if (f) openCropper(f);
};
$("#avatarRemove").onclick = () => {
  avatarData = null;
  if (avatarExisting) avatarRemoved = true;             // tell publish to clear the saved one
  syncAvatarUI(); render();
};

function gather() {
  const handle = ($("#f-handle").value.trim() || "you").toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "you";
  return {
    name: $("#f-name").value.trim() || "Someone broke",
    handle,
    status,
    ...(emoji ? { emoji } : {}),
    story: $("#f-story").value.trim(),
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

  $("#preview").className = "page-card theme-" + (st.theme || "clean");
  const avatar = avatarSrc() ? `<img src="${esc(avatarSrc())}" alt="" />` : esc(data.emoji || st.emoji);
  $("#preview").innerHTML = `
    <div class="avatar">${avatar}</div>
    <div class="status-pill"><span class="dot"></span>${st.label}</div>
    <div class="page-name">${esc(data.name)}</div>
    <div class="page-handle">no.money/${esc(data.handle)}</div>
    <div class="page-story">${esc(data.story || st.story)}</div>
    <div class="support-btns">${linkHtml}</div>
    <div class="broke-score">
      <div class="bs-top"><span class="bs-label">${t("card.broke_score")}</span><span class="bs-num">${bs.score}<span>/100</span></span></div>
      <div class="bs-meter"><i style="width:${bs.score}%"></i></div>
      <div class="bs-row"><span class="k">${t("card.status")}</span><span class="v">${esc(bs.band)}</span></div>
      <div class="bs-row"><span class="k">${t("card.risk")}</span><span class="v">${esc(bs.risk)}</span></div>
    </div>`;
  saveDraft();
}

// keep the in-progress page in localStorage so a refresh / accidental close doesn't lose it.
// debounced: render() runs every keystroke, and the draft can carry a ~30 KB avatar JPEG —
// serializing + writing it synchronously on each keypress is needless jank.
let draftT = 0;
function saveDraft() { clearTimeout(draftT); draftT = setTimeout(writeDraft, 250); }
function writeDraft() {
  draftT = 0;
  // edit mode = a page that already exists server-side (reachable via the resume bar / edit
  // link). the draft slot is only for an unsaved NEW page, so don't let an edit clobber it.
  if (editingSlug) return;
  try {
    localStorage.setItem("nm:draft", JSON.stringify({
      name: $("#f-name").value, handle: $("#f-handle").value, status, emoji,
      story: $("#f-story").value,
      links, storyTouched, handleTouched,
      avatar: avatarData,   // a freshly picked photo survives a refresh (small JPEG data URL)
    }));
  } catch (e) { /* private mode / quota — ignore */ }
}
// flush a pending draft if the tab is closing/backgrounded before the debounce fires
addEventListener("pagehide", () => { if (draftT) writeDraft(); });
document.addEventListener("visibilitychange", () => { if (draftT && document.visibilityState === "hidden") writeDraft(); });
function restoreDraft() {
  try {
    const d = JSON.parse(localStorage.getItem("nm:draft") || "null");
    if (!d || typeof d !== "object") return;
    if (d.name != null) $("#f-name").value = d.name;
    if (d.handle != null) $("#f-handle").value = d.handle;
    if (d.story != null) $("#f-story").value = d.story;
    if (Object.prototype.hasOwnProperty.call(NM.STATUSES, d.status)) status = d.status;
    if (typeof d.emoji === "string") emoji = d.emoji;
    if (typeof d.avatar === "string" && d.avatar.startsWith("data:image/")) avatarData = d.avatar;
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
  } else if (lang() !== "en") {     // non-en: no curated EN rotation — fall back to the localized status story
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

// 🎲 roll a fresh broke persona — lowers the blank-page barrier
const PERSONA_EMOJIS = ["", "😭", "🥲", "💀", "🤡", "🐀", "💸", "📉"];
const PERSONA_NAMES = ["Mira", "Kai", "Sol", "Devon", "Aria", "Remy", "Nico", "Tess", "Jules", "Ezra", "Quinn", "Ash"];
const pick = a => a[Math.floor(Math.random() * a.length)];
$("#surprise").onclick = () => {
  status = pick(NM.STATUS_ORDER);
  $("#f-story").value = lang() !== "en" ? NM.locStatus(NM.STATUSES[status]).story : pick(AI_LINES[status] || AI_LINES.ramen);
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

  // tipping is the whole point — block publishing a page nobody can actually tip on
  if (!data.links.length) {
    toast(t("toast.tip_add_link"));
    buildLinks();           // surface the (empty) links section so they know where to act
    publishing = false;
    return;
  }

  // a branded button (PayPal, Ko-fi, …) must actually link to that brand — no spoofing
  const offBrand = data.links.find(l => NM.brandMismatch(l.kind, l.url));
  if (offBrand) {
    const host = NM.brandHostFor(offBrand.kind);
    toast(mustMatch(host));
    buildLinks();           // surface the inline warning on the offending row
    publishing = false;
    return;
  }

  NM.drawShareImage($("#shareCanvas"), data);

  // create a new page, or UPDATE the one we're editing
  const editing = !!(editingSlug && editToken);
  const btn = $("#publish"), prev = btn.textContent;
  btn.textContent = editing ? t("create.updating") : t("create.publishing"); btn.disabled = true;
  let result = null, errStatus = 0;
  try {
    const img = $("#shareCanvas").toDataURL("image/png");
    const score = NM.brokeScore(data).score;
    const title = NM.pageTitle(data.name, score);
    const meta = { title, desc: NM.shareText(data) };
    const payload = { data, img, meta };
    if (avatarData) payload.avatar = avatarData;          // new photo to store
    else if (avatarRemoved) payload.avatar = null;        // clear the saved photo
    if (editing) { payload.slug = editingSlug; payload.editToken = editToken; }
    const res = await fetch(base + "api/save", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) result = await res.json();
    else errStatus = res.status;
  } catch (e) { /* errStatus stays 0 → treated as a connection failure below */ }
  btn.textContent = prev; btn.disabled = false; publishing = false;

  if (!result || !result.slug) {
    // tell the truth about WHY it failed instead of always blaming the connection
    const msg = errStatus === 403 ? t("toast.edit_invalid")
              : errStatus === 429 ? t("toast.rate_limited")
              : errStatus === 413 ? t("toast.too_large")
              : errStatus === 415 ? t("toast.bad_image")
              : (editing ? null : t("toast.publish_fail")); // editing keeps its old quiet-on-generic-error behavior
    if (msg) toast(msg);
    return;
  }

  // reconcile local avatar state with what's now stored, so a later Remove in the
  // same session knows there's a saved photo to clear
  if (avatarData) {
    avatarExisting = result.av ? ("/av/" + result.slug + "?v=" + encodeURIComponent(result.av)) : ("/av/" + result.slug);
    avatarData = null;
  }
  avatarRemoved = false;
  syncAvatarUI();

  const url = location.origin + base + result.slug;
  // remember edit rights + switch into edit mode so further saves update the same page
  if (result.editToken) {
    try { localStorage.setItem("nm:edit:" + result.slug, result.editToken); localStorage.setItem("nm:last", result.slug); } catch (e) {}
    $("#editUrl").value = location.origin + base + "create.html?edit=" + result.slug + "&t=" + encodeURIComponent(result.editToken);
    enterEditMode(result.slug, result.editToken);
  }

  // a freshly created page is now persisted — it's a real page, no longer a draft. drop the
  // stored draft (and cancel any pending write) so the next clean visit starts blank, not on
  // top of the page you just made. (enterEditMode above already set editingSlug, so future
  // renders won't re-write it — this just clears the stale one.)
  if (!editing) { clearTimeout(draftT); draftT = 0; try { localStorage.removeItem("nm:draft"); } catch (e) {} }

  $(".live-badge").textContent = editing ? t("modal.updated_badge") : t("modal.badge");
  document.querySelector(".modal-live h3").textContent = editing ? t("modal.updated_h3") : t("modal.live_h3");
  $("#resultUrl").value = url;
  $("#openPage").href = url;
  NM.renderShareRow($("#shareRow"), url, data);
  $("#modal").classList.add("open");
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
  if (Object.prototype.hasOwnProperty.call(NM.STATUSES, d.status)) status = d.status;
  emoji = typeof d.emoji === "string" ? d.emoji : "";
  avatarData = null; avatarRemoved = false;
  avatarExisting = d.av ? ("/av/" + slug + "?v=" + encodeURIComponent(d.av)) : "";
  if (Array.isArray(d.links) && d.links.length) links = d.links.map(l => ({ kind: NM.canonKind(l.kind), url: l.url || "", ...(l.label ? { label: l.label } : {}) }));
  storyTouched = true;
  let token = t2; try { token = token || localStorage.getItem("nm:edit:" + slug); } catch (e) {}
  enterEditMode(slug, token);
  if (!token) toast(t("toast.no_edit_access"));
  buildChips(); buildEmoji(); buildLinks(); render(); syncAvatarUI();
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
  buildChips(); buildEmoji(); buildLinks(); render(); syncAvatarUI();    // render defaults/draft first (no blank flash)
  if (willEdit) loadForEdit(editSlug, qp.get("t")); // then override async (clears loading-edit when done)
  else showResumeBar();                                  // surface an existing page to keep editing
})();

// re-render dynamic content on language switch (the picker itself is wired in i18n.js)
window.addEventListener("langchange", () => {
  if (!storyTouched && !editingSlug) $("#f-story").value = NM.locStatus(NM.STATUSES[status]).story;
  buildChips(); buildEmoji(); buildLinks(); render(); syncAvatarUI();
  applyEditModeText();   // setLang re-applied [data-i18n], which would reset edit-mode header/button
  document.title = t("title.create");
  if ($("#resumeBar").style.display !== "none") showResumeBar();   // refresh banner text in new language
});
