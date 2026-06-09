// Shared helpers for turning a stored page into a lightweight admin/index entry.
// Used by save.js (maintain the recent index) and wall.js (rebuild it from KV).

// An "empty" page is a registered handle that never got real content —
// no story, no support links, no goal. The squatter signal for reclaiming.
export function isEmptyPage(d) {
  if (!d || typeof d !== "object") return true;
  const story = String(d.story || "").trim();
  const hasLinks = Array.isArray(d.links) && d.links.length > 0;
  const hasGoal = Number(d.goal) > 0 || Number(d.raised) > 0;
  return !(story || hasLinks || hasGoal);
}

// The compact record stored per page in the "pages:recent" index.
// createdAt/updatedAt are null for legacy pages saved before timestamps existed.
export function indexEntry(slug, d, m) {
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
  };
}
