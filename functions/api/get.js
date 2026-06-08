// GET /api/get?slug=<slug> — return a page's data so the editor can load it.
// Returns only the public page data (never the edit token).

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}

export async function onRequestGet({ request, env }) {
  if (!env.PAGES) return json({ error: "storage not configured" }, 500);
  const slug = new URL(request.url).searchParams.get("slug") || "";
  if (!/^[a-z0-9-]{2,40}$/.test(slug)) return json({ error: "bad slug" }, 400);

  const raw = await env.PAGES.get(slug);
  if (!raw) return json({ error: "not found" }, 404);

  let stored;
  try { stored = JSON.parse(raw); } catch { return json({ error: "corrupt" }, 500); }
  return json({ data: stored.d || null }); // token (stored.t) intentionally omitted
}
