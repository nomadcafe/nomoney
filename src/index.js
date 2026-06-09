import "../assets/core.js"; // sets window.NM + window.I18N + loads the stylesheet

const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`; };
const t = (k) => window.I18N.t(k);
const lang = () => window.I18N.lang;

function setAccent(el, accent) {
  el.style.setProperty("--accent", accent);
  el.style.setProperty("--accent-soft", hexA(accent, 0.12));
  el.style.setProperty("--accent-line", hexA(accent, 0.4));
  el.style.setProperty("--accent-glow", hexA(accent, 0.16));
}

// hero floating preview card
function renderHero() {
  const base = { ...NM.DEMOS.ramen, name: "Mira", handle: "mira" };
  const st = NM.locStatus(NM.STATUSES[base.status]);
  const bs = NM.brokeScore(base), pct = NM.pctOf(base);
  const el = document.getElementById("heroCard");
  el.className = "page-card mock theme-" + (st.theme || "clean");
  setAccent(el, st.accent);
  const links = (base.links || []).slice(0, 2).map((l, i) => {
    const k = NM.PAYMENT_KINDS[l.kind] || NM.PAYMENT_KINDS.custom;
    const label = lang() === "en"
      ? (l.label || k.label)
      : (i === 0 ? (base[lang() + "cta"] || NM.payLabel(l.kind)) : NM.payLabel(l.kind));
    return `<a class="${k.cls}">${label}</a>`;
  }).join("");
  const raised = NM.raisedLine(base.raised, base.goal);
  el.innerHTML = `
    <div class="avatar">${st.emoji}</div>
    <div class="status-pill"><span class="dot"></span>${st.label}</div>
    <div class="page-name">${base.name}</div>
    <div class="page-handle">no.money/${base.handle}</div>
    <div class="page-story">${st.tagline || st.story.split("\n")[0]}</div>
    <div class="goal-wrap">
      <div class="goal-row"><span class="label">${t("card.goal")}</span><span class="pct">${NM.pctLine(pct)}</span></div>
      <div class="goal-bar"><i style="width:${pct}%"></i></div>
      <div class="goal-sub">${raised}</div>
    </div>
    <div class="support-btns">${links}</div>
    <div class="broke-score">
      <div class="bs-top"><span class="bs-label">${t("card.broke_score")}</span><span class="bs-num">${bs.score}<span>/100</span></span></div>
      <div class="bs-meter"><i style="width:${bs.score}%"></i></div>
    </div>`;
}

// demo cards (mini real cards)
function renderDemos() {
  const grid = document.getElementById("demoGrid");
  grid.innerHTML = "";
  Object.entries(NM.DEMOS).forEach(([key, d]) => {
    const st = NM.locStatus(NM.STATUSES[d.status]);
    const bs = NM.brokeScore(d), pct = NM.pctOf(d);
    const fl = (d.links && d.links[0]) || null;
    const fk = fl ? (NM.PAYMENT_KINDS[fl.kind] || NM.PAYMENT_KINDS.custom) : null;
    const cta = d[lang() + "cta"]
      || (lang() === "en" ? (fl ? (fl.label || fk.label) : NM.payLabel("ramen"))
                          : (fl ? NM.payLabel(fl.kind) : NM.payLabel("ramen")));
    const a = document.createElement("a");
    a.className = "page-card demo-card theme-" + (st.theme || "clean");
    a.href = "p.html?demo=" + key;
    setAccent(a, st.accent);
    a.innerHTML = `
      <div class="avatar">${st.emoji}</div>
      <div class="status-pill"><span class="dot"></span>${st.label}</div>
      <div class="page-name">${d.name}</div>
      <div class="page-handle">no.money/${d.handle}</div>
      <div class="page-story">${st.tagline || st.story.split("\n")[0]}</div>
      <div class="goal-wrap">
        <div class="goal-row"><span class="label">${t("card.goal")}</span><span class="pct">${NM.pctLine(pct)}</span></div>
        <div class="goal-bar"><i style="width:${pct}%"></i></div>
      </div>
      <div class="demo-cta">${cta}</div>
      <div class="broke-score">
        <div class="bs-top"><span class="bs-label">${t("card.broke_score")}</span><span class="bs-num">${bs.score}<span>/100</span></span></div>
        <div class="bs-meter"><i style="width:${bs.score}%"></i></div>
      </div>`;
    grid.appendChild(a);
  });
}

// public "wall of broke" — hand-curated real pages (GET /api/wall). Hidden until populated.
let wallCards = null;   // cached after first fetch so langchange re-renders without refetching
function renderWall() {
  const section = document.getElementById("wall");
  const grid = document.getElementById("wallGrid");
  if (!wallCards || !wallCards.length) { section.style.display = "none"; return; }
  section.style.display = "";
  grid.innerHTML = "";
  wallCards.forEach(c => {
    const sp = NM.STATUSES[c.status] ? c.status : "ramen";
    const st = NM.locStatus(NM.STATUSES[sp]);
    const bs = NM.brokeScore({ status: sp, goal: c.goal, raised: c.raised });
    const pct = NM.pctOf({ goal: c.goal, raised: c.raised });
    const cta = lang() === "en"
      ? (c.link && c.link.label ? c.link.label : (c.link ? NM.payLabel(c.link.kind) : NM.payLabel("ramen")))
      : (c.link && c.link.kind ? NM.payLabel(c.link.kind) : NM.payLabel("ramen"));
    const a = document.createElement("a");
    a.className = "page-card demo-card theme-" + (st.theme || "clean");
    a.href = "/" + c.slug;
    setAccent(a, st.accent);
    a.innerHTML = `
      <div class="avatar">${c.emoji || st.emoji}</div>
      <div class="status-pill"><span class="dot"></span>${st.label}</div>
      <div class="page-name">${esc(c.name)}</div>
      <div class="page-handle">no.money/${esc(c.handle)}</div>
      <div class="page-story">${st.tagline || st.story.split("\n")[0]}</div>
      <div class="goal-wrap">
        <div class="goal-row"><span class="label">${t("card.goal")}</span><span class="pct">${NM.pctLine(pct)}</span></div>
        <div class="goal-bar"><i style="width:${pct}%"></i></div>
      </div>
      <div class="demo-cta">${esc(cta)}</div>
      <div class="broke-score">
        <div class="bs-top"><span class="bs-label">${t("card.broke_score")}</span><span class="bs-num">${bs.score}<span>/100</span></span></div>
        <div class="bs-meter"><i style="width:${bs.score}%"></i></div>
      </div>`;
    grid.appendChild(a);
  });
}
function esc(s) { return String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch])); }
async function loadWall() {
  try { const r = await fetch("/api/wall"); if (r.ok) wallCards = (await r.json()).cards || []; } catch (e) { wallCards = []; }
  renderWall();
}

function renderAll() { renderHero(); renderDemos(); renderWall(); }

window.I18N.apply();                       // translate static [data-i18n] text
document.title = t("title.index");
renderAll();                               // render dynamic cards in the current language
loadWall();                                // fetch + reveal the curated wall (no-op on static/local)
window.addEventListener("langchange", () => { document.title = t("title.index"); renderAll(); });  // setLang already re-applied static text; lang picker is wired in i18n.js
