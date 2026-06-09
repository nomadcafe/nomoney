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
let onWall = new Set();

async function api(body) {
  const r = await fetch("/api/wall", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, ...body }) });
  return { ok: r.ok, status: r.status, json: await r.json().catch(() => ({})) };
}

function showTokenBox(msg) {
  $("#tokenBox").style.display = ""; $("#adminBody").style.display = "none";
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
  onWall = new Set(featured);
  renderRecent();
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
  const sort = $("#sortBy").value;
  const key = sort === "created" ? "createdAt" : "updatedAt";
  // unknown timestamps sort to the bottom regardless of direction
  const val = p => p[key] ? Date.parse(p[key]) : (sort === "stale" ? Infinity : -Infinity);
  list.sort((a, b) => sort === "stale" ? val(a) - val(b) : val(b) - val(a));
  return list;
}

function renderRecent() {
  const el = $("#recentList");
  const list = sortedFiltered();
  $("#recentCount").textContent = allRecent.length ? `(${list.length}${list.length !== allRecent.length ? ` of ${allRecent.length}` : ""})` : "";
  if (!list.length) { el.innerHTML = `<p class="admin-muted">${allRecent.length ? "Nothing matches this filter." : "No pages yet — try Rebuild."}</p>`; return; }
  el.innerHTML = list.map(p => {
    const edited = daysSince(p.updatedAt);
    const stale = edited != null && edited >= STALE_DAYS;
    const badges =
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
        <a class="btn btn-ghost btn-sm" href="/${esc(p.slug)}" target="_blank" rel="noopener" title="open">↗</a>
        ${onWall.has(p.slug) ? `<button class="btn btn-ghost btn-sm" disabled>On wall ✓</button>` : `<button class="btn btn-primary btn-sm" data-add="${esc(p.slug)}">Add</button>`}
      </span>
    </div>`;
  }).join("");
  el.querySelectorAll("[data-add]").forEach(b => b.onclick = () => act({ add: b.dataset.add }));
}

async function act(body) {
  const res = await api(body);
  if (res.status === 403) { showTokenBox("Token rejected"); return; }
  if (!res.ok) { toast("Failed — try again"); return; }
  toast("Saved");
  load();
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
  $("#addSlug").value = "";
  act({ add: v });
};
$("#addSlug").addEventListener("keydown", e => { if (e.key === "Enter") $("#addSlugBtn").click(); });
$("#logout").onclick = () => { token = ""; try { localStorage.removeItem(TOKEN_KEY); } catch (e) {} $("#adminToken").value = ""; showTokenBox("Token forgotten"); };
$("#sortBy").onchange = renderRecent;
$("#onlyEmpty").onchange = renderRecent;
$("#rebuild").onclick = async () => {
  const btn = $("#rebuild"); btn.disabled = true; btn.textContent = "Scanning…";
  const res = await api({ rebuild: true });
  btn.disabled = false; btn.textContent = "↻ Rebuild";
  if (res.status === 403) { showTokenBox("Token rejected"); return; }
  if (!res.ok) { toast("Rebuild failed"); return; }
  allRecent = res.json.recent || [];
  onWall = new Set(res.json.featured || []);
  renderRecent();
  toast(`Indexed ${res.json.rebuilt ?? allRecent.length} pages`);
};

load();
