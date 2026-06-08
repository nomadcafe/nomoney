import "../assets/core.js"; // sets window.NM + loads the stylesheet

const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`; };

// hero floating preview card — rendered from a real demo so it always matches the product
(function heroCard() {
  const d = { ...NM.DEMOS.ramen, name: "Mira", handle: "mira" }, st = NM.STATUSES[d.status], bs = NM.brokeScore(d), pct = NM.pctOf(d);
  const el = document.getElementById("heroCard");
  el.className = "page-card mock theme-" + (st.theme || "clean");
  el.style.setProperty("--accent", st.accent);
  el.style.setProperty("--accent-soft", hexA(st.accent, 0.1));
  el.style.setProperty("--accent-line", hexA(st.accent, 0.45));
  el.style.setProperty("--accent-glow", hexA(st.accent, 0.18));
  const links = (d.links || []).slice(0, 2).map(l => {
    const k = NM.PAYMENT_KINDS[l.kind] || NM.PAYMENT_KINDS.custom;
    return `<a class="${k.cls}">${l.label || k.label}</a>`;
  }).join("");
  el.innerHTML = `
    <div class="avatar">${st.emoji}</div>
    <div class="status-pill"><span class="dot"></span>${st.label}</div>
    <div class="page-name">${d.name}</div>
    <div class="page-handle">no.money/${d.handle}</div>
    <div class="page-story">${st.tagline || st.story.split("\n")[0]}</div>
    <div class="goal-wrap">
      <div class="goal-row"><span class="label">Goal</span><span class="pct">${pct}% less broke</span></div>
      <div class="goal-bar"><i style="width:${pct}%"></i></div>
      <div class="goal-sub">$${d.raised} raised of $${d.goal} survival fund</div>
    </div>
    <div class="support-btns">${links}</div>
    <div class="broke-score">
      <div class="bs-top"><span class="bs-label">Broke Score</span><span class="bs-num">${bs.score}<span>/100</span></span></div>
      <div class="bs-meter"><i style="width:${bs.score}%"></i></div>
    </div>`;
})();

// render demo cards from DEMOS (each is a mini real card)
const grid = document.getElementById("demoGrid");
Object.entries(NM.DEMOS).forEach(([key, d]) => {
  const st = NM.STATUSES[d.status];
  const bs = NM.brokeScore(d);
  const pct = NM.pctOf(d);
  const fl = (d.links && d.links[0]) || null;
  const fk = fl ? (NM.PAYMENT_KINDS[fl.kind] || NM.PAYMENT_KINDS.custom) : null;
  const cta = fl ? (fl.label || fk.label) : "🍜 Buy me ramen";
  const a = document.createElement("a");
  a.className = "page-card demo-card theme-" + (st.theme || "clean");
  a.href = "p.html?demo=" + key;
  a.style.setProperty("--accent", st.accent);
  a.style.setProperty("--accent-soft", hexA(st.accent, 0.12));
  a.style.setProperty("--accent-line", hexA(st.accent, 0.4));
  a.style.setProperty("--accent-glow", hexA(st.accent, 0.16));
  a.innerHTML = `
    <div class="avatar">${st.emoji}</div>
    <div class="status-pill"><span class="dot"></span>${st.label}</div>
    <div class="page-name">${d.name}</div>
    <div class="page-handle">no.money/${d.handle}</div>
    <div class="page-story">${st.tagline || st.story.split("\n")[0]}</div>
    <div class="goal-wrap">
      <div class="goal-row"><span class="label">Goal</span><span class="pct">${pct}% less broke</span></div>
      <div class="goal-bar"><i style="width:${pct}%"></i></div>
    </div>
    <div class="demo-cta">${cta}</div>
    <div class="broke-score">
      <div class="bs-top"><span class="bs-label">Broke Score</span><span class="bs-num">${bs.score}<span>/100</span></span></div>
      <div class="bs-meter"><i style="width:${bs.score}%"></i></div>
    </div>`;
  grid.appendChild(a);
});
