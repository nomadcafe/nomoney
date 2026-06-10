// Shared helpers for turning a stored page into a lightweight admin/index entry.
// Used by save.js (maintain the recent index) and wall.js (rebuild it from KV).

// An "empty" page is a registered handle that never got real content —
// no story and no support links. The squatter signal for reclaiming.
export function isEmptyPage(d) {
  if (!d || typeof d !== "object") return true;
  const story = String(d.story || "").trim();
  const hasLinks = Array.isArray(d.links) && d.links.length > 0;
  return !(story || hasLinks);
}

// The compact record stored per page in the "pages:recent" index.
// createdAt/updatedAt are null for legacy pages saved before timestamps existed.
// msgs is the support-message count — the only organic "this page has traction" signal.
export function indexEntry(slug, d, m, msgs = 0) {
  d = d || {};
  m = m || {};
  return {
    slug,
    name: typeof d.name === "string" ? d.name : "",
    status: d.status || "ramen",
    emoji: typeof d.emoji === "string" ? d.emoji : "",
    createdAt: m.createdAt || null,
    updatedAt: m.updatedAt || null,
    empty: isEmptyPage(d),
    msgs: Number(msgs) || 0,
  };
}

// Best-effort patch of one page's index entry in place (no full rebuild).
// Keeps the live message count fresh as messages are posted/deleted.
export async function patchIndexEntry(env, slug, patch) {
  try {
    const recent = JSON.parse((await env.PAGES.get("pages:recent")) || "[]");
    if (!Array.isArray(recent)) return;
    const i = recent.findIndex(r => r && r.slug === slug);
    if (i < 0) return;                    // page not in the index — skip (rebuild will catch it)
    recent[i] = { ...recent[i], ...patch };
    await env.PAGES.put("pages:recent", JSON.stringify(recent));
  } catch (e) { /* index is best-effort */ }
}
