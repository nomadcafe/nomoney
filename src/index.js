import "../assets/core.js"; // sets window.NM + window.I18N + loads the stylesheet

const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`; };
const t = (k) => window.I18N.t(k);
const isZh = () => window.I18N.lang === "zh";

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
    const label = (i === 0 && isZh()) ? (base.zhcta || NM.payLabel(l.kind)) : (isZh() ? NM.payLabel(l.kind) : (l.label || k.label));
    return `<a class="${k.cls}">${label}</a>`;
  }).join("");
  const raised = isZh() ? `已筹 $${base.raised} / 目标 $${base.goal} 生存基金` : `$${base.raised} raised of $${base.goal} survival fund`;
  el.innerHTML = `
    <div class="avatar">${st.emoji}</div>
    <div class="status-pill"><span class="dot"></span>${st.label}</div>
    <div class="page-name">${base.name}</div>
    <div class="page-handle">no.money/${base.handle}</div>
    <div class="page-story">${st.tagline || st.story.split("\n")[0]}</div>
    <div class="goal-wrap">
      <div class="goal-row"><span class="label">${t("card.goal")}</span><span class="pct">${isZh() ? `${t("card.lessbroke")} ${pct}%` : `${pct}% ${t("card.lessbroke")}`}</span></div>
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
    const cta = isZh() ? (d.zhcta || (fk ? NM.payLabel(fl.kind) : "🍜 请我吃泡面"))
                       : (fl ? (fl.label || fk.label) : "🍜 Buy me ramen");
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
        <div class="goal-row"><span class="label">${t("card.goal")}</span><span class="pct">${isZh() ? `${t("card.lessbroke")} ${pct}%` : `${pct}% ${t("card.lessbroke")}`}</span></div>
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

function renderAll() { renderHero(); renderDemos(); }

window.I18N.apply();                       // translate static [data-i18n] text
renderAll();                               // render dynamic cards in the current language
document.getElementById("langToggle").onclick = () => window.I18N.setLang(isZh() ? "en" : "zh");
window.addEventListener("langchange", renderAll);  // setLang already re-applied static text
