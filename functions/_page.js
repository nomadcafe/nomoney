// Shared helpers for turning a stored page into a lightweight admin/index entry.
// Used by save.js (maintain the recent index) and wall.js (rebuild it from KV).

import { normalizeTipUrl } from "./_links.js";

// An "empty" page is a registered handle that never got real content —
// no story and no support links. The squatter signal for reclaiming.
export function isEmptyPage(d) {
  if (!d || typeof d !== "object") return true;
  const story = String(d.story || "").trim();
  const hasLinks = Array.isArray(d.links) && d.links.length > 0;
  return !(story || hasLinks);
}

// A page whose every tip button is dead (or that has none). Live data found 18% of
// pages in this state — a username or an email typed into the URL box. The editor now
// blocks it at publish, but pages saved before that rule still exist, so /admin needs
// to be able to see and act on them.
export function hasDeadLinks(d) {
  const links = (d && Array.isArray(d.links)) ? d.links : [];
  if (!links.length) return true;
  return !links.some(l => l && normalizeTipUrl(l && l.kind, l && l.url));
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
    dead: hasDeadLinks(d),
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

// Permanently remove a page and everything attached to it. Shared by the owner's
// own delete (api/delete.js, gated by the edit token) and admin takedowns (api/wall.js).
// The slug becomes free to register again. Callers must have authorized the delete.
export async function deletePage(env, slug) {
  await Promise.all([
    env.PAGES.delete(slug),              // the page itself
    env.PAGES.delete("img:" + slug),     // its share image
    env.PAGES.delete("avatar:" + slug),  // its avatar photo
    env.PAGES.delete("msg:" + slug),     // its support messages
    env.PAGES.delete("stat:" + slug),    // its view/CTA counters
  ]);
  try {                                  // drop from the activity index
    const recent = JSON.parse((await env.PAGES.get("pages:recent")) || "[]");
    if (Array.isArray(recent)) await env.PAGES.put("pages:recent", JSON.stringify(recent.filter(r => r && r.slug !== slug)));
  } catch (e) { /* index is best-effort */ }
}
