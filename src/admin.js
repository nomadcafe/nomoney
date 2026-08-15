import "../assets/core.js"; // window.NM (status emoji/labels) + styles
const $ = s => document.querySelector(s);
const TOKEN_KEY = "nm:admin";
let token = "";
try { token = localStorage.getItem(TOKEN_KEY) || ""; } catch (e) {}

function toast(m) { const e = $("#toast"); e.textContent = m; e.classList.add("show"); setTimeout(() => e.classList.remove("show"), 1800); }
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
const emojiOf = st => (NM.STATUSES[st] ? NM.STATUSES[st].emoji : "💸");
const labelOf = st => (NM.STATUSES[st] ? NM.STATUSES[st].label : st);
const STALE_DAYS = 30; // not touched in this many days → flagged as a reclaim candidate
const DAY = 86400e3;

// rates, clamped. The client excludes the page's own author, but counts are
// non-atomic and pages predate some fields — never render a nonsense "250%".
const pct = (a, b) => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0);
function daysSince(iso) { if (!iso) return null; const t = Date.parse(iso); return isNaN(t) ? null : Math.floor((Date.now() - t) / DAY); }
function relTime(iso) {
  const d = daysSince(iso);
  if (d == null) return "unknown";
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 30) return `${d}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

let allRecent = [];   // last loaded index
let creates = 0;      // global pages-created counter (stat:creates)
let onWall = new Set();

async function api(body) {
  // never let a network blip become an unhandled rejection — callers only check .ok/.status,
  // so a thrown fetch would otherwise fail silently (and strand the Rebuild button on "Scanning…").
  try {
    const r = await fetch("/api/wall", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, ...body }) });
    return { ok: r.ok, status: r.status, json: await r.json().catch(() => ({})) };
  } catch (e) {
    return { ok: false, status: 0, json: {} };
  }
}

function showTokenBox(msg) {
  $("#tokenBox").style.display = ""; $("#adminBody").style.display = "none";
  $("#adminToken").focus();
  if (msg) toast(msg);
}

async function load() {
  if (!token) { showTokenBox(); return; }
  const res = await api({ list: true });
  if (res.status === 403) { token = ""; try { localStorage.removeItem(TOKEN_KEY); } catch (e) {} showTokenBox("Wrong or missing token"); return; }
  if (!res.ok) { toast("Couldn't load"); return; }
  $("#tokenBox").style.display = "none"; $("#adminBody").style.display = "";
  const featured = res.json.featured || [];
  renderFeatured(featured);
  allRecent = res.json.recent || [];
  creates = res.json.creates || 0;
  onWall = new Set(featured);
  renderFunnel();
  renderRecent();
}

// The headline funnel, in the order the loop actually runs:
//   visits → shared → "Make mine" → pages created, plus tip clicks off to the side.
// SHARE RATE is the number the roadmap says to optimize; make-mine is the loop closing;
// tips are the only evidence the product's premise (a tipping page) works at all.
// Counts are directional (see functions/api/hit.js), not exact — read the ratios.
function renderFunnel() {
  const sum = f => allRecent.reduce((n, p) => n + (p[f] || 0), 0);
  const v = sum("v"), c = sum("c"), sh = sum("s"), o = sum("o");
  const box = $("#funnel");
  if (!v && !c && !sh && !o && !creates) { box.style.display = "none"; return; }
  box.style.display = "";
  // momentum: pages created in the last 7 days (legacy pages without a timestamp are skipped)
  const new7 = allRecent.filter(p => { const d = daysSince(p.createdAt); return d != null && d < 7; }).length;
  const chip = (n, label, hot) => `<span class="funnel-chip${hot ? " funnel-chip-hot" : ""}"><b>${n.toLocaleString()}</b><span>${label}</span></span>`;
  $("#funnelRow").innerHTML =
    chip(v, "visits") +
    chip(sh, `shared · ${pct(sh, v)}%`, true) +
    chip(c, `“Make mine” · ${pct(c, v)}%`) +
    chip(creates, "pages created") +
    chip(o, `tip clicks · ${pct(o, v)}%`) +
    chip(new7, "new · last 7d");

  // surface what's actually spreading, so you know which page to amplify/feature
  const top = allRecent.filter(p => (p.v || 0) > 0).sort((a, b) => (b.s || 0) - (a.s || 0) || (b.v || 0) - (a.v || 0))[0];
  $("#funnelBest").innerHTML = top
    ? `🔥 Most shared: <b>${esc(top.name || top.slug)}</b> <span class="admin-muted">no.money/${esc(top.slug)}</span> — ${top.v} visits · ${pct(top.s || 0, top.v)}% shared · ${pct(top.c || 0, top.v)}% make-mine`
    : "";
  $("#funnelHint").textContent =
    "Share rate is the metric — it answers “is this page worth sending on?”. Make-mine is the loop closing; tip clicks say whether tipping pages actually get tipped. " +
    "All per visit, once per session, directional not exact. Landing-page traffic isn't here — read it off Cloudflare's own request analytics.";
}

function renderFeatured(featured) {
  $("#wallCount").textContent = featured.length ? `(${featured.length})` : "(empty — wall is hidden)";
  const el = $("#featuredList");
  if (!featured.length) { el.innerHTML = `<p class="admin-muted">Nothing featured yet — add pages from Recent below.</p>`; return; }
  el.innerHTML = featured.map((slug, i) => `
    <div class="admin-item">
      <span class="admin-slug">${i + 1}. no.money/${esc(slug)}</span>
      <span class="admin-acts">
        <button class="btn btn-ghost btn-sm" data-up="${i}" ${i === 0 ? "disabled" : ""} title="move up">↑</button>
        <button class="btn btn-ghost btn-sm" data-down="${i}" ${i === featured.length - 1 ? "disabled" : ""} title="move down">↓</button>
        <a class="btn btn-ghost btn-sm" href="/${esc(slug)}" target="_blank" rel="noopener" title="open">↗</a>
        <button class="btn btn-ghost btn-sm" data-remove="${esc(slug)}" title="remove from wall">✕</button>
      </span>
    </div>`).join("");
  el.querySelectorAll("[data-remove]").forEach(b => b.onclick = () => act({ remove: b.dataset.remove }));
  el.querySelectorAll("[data-up]").forEach(b => b.onclick = () => reorder(+b.dataset.up, -1, featured));
  el.querySelectorAll("[data-down]").forEach(b => b.onclick = () => reorder(+b.dataset.down, 1, featured));
}

function sortedFiltered() {
  let list = allRecent.slice();
  if ($("#onlyEmpty").checked) list = list.filter(p => p.empty);
  const q = $("#searchBox").value.trim().toLowerCase();
  if (q) list = list.filter(p => (p.name || "").toLowerCase().includes(q) || (p.slug || "").toLowerCase().includes(q));
  const sort = $("#sortBy").value;
  if (sort === "views") {
    list.sort((a, b) => (b.v || 0) - (a.v || 0));
  } else if (sort === "shared") {
    list.sort((a, b) => (b.s || 0) - (a.s || 0) || (b.v || 0) - (a.v || 0));
  } else if (sort === "msgs") {
    list.sort((a, b) => (b.msgs || 0) - (a.msgs || 0));
  } else {
    const key = sort === "created" ? "createdAt" : "updatedAt";
    // unknown timestamps sort to the bottom regardless of direction
    const val = p => p[key] ? Date.parse(p[key]) : (sort === "stale" ? Infinity : -Infinity);
    list.sort((a, b) => sort === "stale" ? val(a) - val(b) : val(b) - val(a));
  }
  return list;
}

function renderSummary() {
  const el = $("#recentSummary");
  const n = allRecent.length;
  if (!n) { el.textContent = ""; return; }
  const empty = allRecent.filter(p => p.empty).length;
  const stale = allRecent.filter(p => { const d = daysSince(p.updatedAt); return d != null && d >= STALE_DAYS; }).length;
  const alive = allRecent.filter(p => (p.msgs || 0) > 0).length;
  el.textContent = `${n} pages · ${alive} with messages · ${empty} empty · ${stale} dormant (${STALE_DAYS}d+) · ${onWall.size} on wall`;
}

function renderRecent() {
  renderSummary();
  const el = $("#recentList");
  const list = sortedFiltered();
  $("#recentCount").textContent = allRecent.length ? `(${list.length}${list.length !== allRecent.length ? ` of ${allRecent.length}` : ""})` : "";
  if (!list.length) { el.innerHTML = `<p class="admin-muted">${allRecent.length ? "Nothing matches this filter." : "No pages yet — try Rebuild."}</p>`; return; }
  el.innerHTML = list.map(p => {
    const edited = daysSince(p.updatedAt);
    const stale = edited != null && edited >= STALE_DAYS;
    const rate = n => ((p.v || 0) > 0 ? ` · ${pct(n, p.v)}%` : "");
    const badges =
      ((p.v || 0) > 0 ? `<span class="admin-tag" title="visits">👁 ${p.v}</span>` : "") +
      ((p.s || 0) > 0 ? `<span class="admin-tag admin-tag-live" title="share acts · share rate per visit">📤 ${p.s}${rate(p.s)}</span>` : "") +
      ((p.c || 0) > 0 ? `<span class="admin-tag admin-tag-live" title="“Make mine” clicks · click-through">↗ ${p.c}${rate(p.c)}</span>` : "") +
      ((p.o || 0) > 0 ? `<span class="admin-tag admin-tag-live" title="tip-link clicks · per visit">💸 ${p.o}${rate(p.o)}</span>` : "") +
      ((p.msgs || 0) > 0 ? `<span class="admin-tag admin-tag-live">💬 ${p.msgs}</span>` : "") +
      (p.empty ? `<span class="admin-tag admin-tag-warn">empty</span>` : "") +
      (stale ? `<span class="admin-tag">stale ${relTime(p.updatedAt)}</span>` : "");
    const meta = p.createdAt || p.updatedAt
      ? `created ${relTime(p.createdAt)} · edited ${relTime(p.updatedAt)}`
      : `no timestamps (pre-dates tracking)`;
    return `
    <div class="admin-item${stale || p.empty ? " admin-item-flag" : ""}">
      <span class="admin-slug">
        <span class="admin-emoji">${esc(p.emoji || emojiOf(p.status))}</span> ${esc(p.name || "—")} ${badges}
        <span class="admin-muted">no.money/${esc(p.slug)} · ${esc(labelOf(p.status))}</span>
        <span class="admin-meta">${esc(meta)}</span>
      </span>
      <span class="admin-acts">
        <button class="btn btn-ghost btn-sm" data-copy="${esc(p.slug)}" title="copy link">🔗</button>
        <a class="btn btn-ghost btn-sm" href="/${esc(p.slug)}" target="_blank" rel="noopener" title="open">↗</a>
        ${onWall.has(p.slug) ? `<button class="btn btn-ghost btn-sm" disabled>On wall ✓</button>` : `<button class="btn btn-primary btn-sm" data-add="${esc(p.slug)}">Add</button>`}
        <button class="btn btn-ghost btn-sm admin-del" data-del="${esc(p.slug)}" title="delete page permanently">🗑</button>
      </span>
    </div>`;
  }).join("");
  el.querySelectorAll("[data-add]").forEach(b => b.onclick = () => act({ add: b.dataset.add }));
  el.querySelectorAll("[data-del]").forEach(b => b.onclick = () => del(b.dataset.del));
  el.querySelectorAll("[data-copy]").forEach(b => b.onclick = async () => {
    try { await navigator.clipboard.writeText(`${location.origin}/${b.dataset.copy}`); toast("Link copied"); }
    catch { toast("Copy failed"); }
  });
}

async function del(slug) {
  if (!confirm(`Permanently delete no.money/${slug}?\n\nThis removes the page, its share image and all messages. It cannot be undone, and old shared links will 404.`)) return;
  const res = await api({ delete: slug });
  if (res.status === 403) { showTokenBox("Token rejected"); return; }
  if (!res.ok) { toast("Delete failed"); return; }
  toast(`Deleted ${slug}`);
  // drop it locally rather than refetching the whole index; the funnel totals are summed
  // from allRecent, so re-render those too.
  allRecent = allRecent.filter(p => p.slug !== slug);
  const featured = Array.isArray(res.json.featured) ? res.json.featured : [...onWall].filter(x => x !== slug);
  onWall = new Set(featured);
  renderFeatured(featured);
  renderFunnel();
  renderRecent();
}

async function act(body) {
  const res = await api(body);
  if (res.status === 403) { showTokenBox("Token rejected"); return; }
  if (!res.ok) { toast("Failed — try again"); return; }
  toast("Saved");
  // add/remove/reorder only touch the featured list, and the response already carries the
  // new one — re-render from it instead of refetching the whole index + stats on every click.
  const featured = res.json.featured || [];
  onWall = new Set(featured);
  renderFeatured(featured);
  renderRecent();            // flip the affected row's Add ⇄ "On wall ✓"
}

function reorder(i, dir, featured) {
  const arr = [...featured], j = i + dir;
  if (j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  act({ set: arr });
}

$("#unlock").onclick = () => {
  const v = $("#adminToken").value.trim();
  if (!v) { toast("Enter the token"); return; }
  token = v; try { localStorage.setItem(TOKEN_KEY, v); } catch (e) {}
  load();
};
$("#adminToken").addEventListener("keydown", e => { if (e.key === "Enter") $("#unlock").click(); });
$("#addSlugBtn").onclick = () => {
  const v = $("#addSlug").value.trim().toLowerCase();
  if (!/^[a-z0-9-]{2,40}$/.test(v)) { toast("Enter a valid slug"); return; }
  // the server only checks slug *format*, not existence — a typo becomes a phantom
  // wall entry that silently shows nothing. warn if it's not a page we know about.
  if (!allRecent.some(p => p.slug === v) &&
      !confirm(`no.money/${v} isn't in the index.\n\nAdd it anyway? (If the page doesn't exist it just won't appear on the public wall.)`)) return;
  $("#addSlug").value = "";
  act({ add: v });
};
$("#addSlug").addEventListener("keydown", e => { if (e.key === "Enter") $("#addSlugBtn").click(); });
$("#logout").onclick = () => { token = ""; try { localStorage.removeItem(TOKEN_KEY); } catch (e) {} $("#adminToken").value = ""; showTokenBox("Token forgotten"); };
$("#sortBy").onchange = renderRecent;
$("#onlyEmpty").onchange = renderRecent;
let searchT;
$("#searchBox").oninput = () => { clearTimeout(searchT); searchT = setTimeout(renderRecent, 120); };
$("#refresh").onclick = () => { toast("Refreshing…"); load(); };
$("#rebuild").onclick = async () => {
  const btn = $("#rebuild"); btn.disabled = true; btn.textContent = "Scanning…";
  const res = await api({ rebuild: true });
  btn.disabled = false; btn.textContent = "⟳ Rebuild";
  if (res.status === 403) { showTokenBox("Token rejected"); return; }
  if (!res.ok) { toast("Rebuild failed"); return; }
  allRecent = res.json.recent || [];
  creates = res.json.creates || 0;
  onWall = new Set(res.json.featured || []);
  renderFunnel();
  renderRecent();
  toast(`Indexed ${res.json.rebuilt ?? allRecent.length} pages`);
};

load();
