// POST /api/delete  { slug, editToken }  ->  { deleted: <slug> }
// The page owner takes their own page down. There are no accounts, so the edit
// token IS the identity: whoever holds it created the page (or was handed the
// private edit link). Same capability that already lets them rewrite every word
// on the page — so it's also enough to remove it.
//
// Why this exists at all: people put a photo of their face and "I'm broke" on a
// public URL. Being able to un-publish that is a floor, not a feature — and until
// now only the site admin could do it.
// Irreversible; the slug goes back into the pool.

import { deletePage } from "../_page.js";

const SLUG_RE = /^[a-z0-9-]{2,40}$/;

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}

export async function onRequestPost({ request, env }) {
  if (!env.PAGES) return json({ error: "storage not configured" }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ error: "bad json" }, 400); }

  const slug = String(body.slug || "");
  if (!SLUG_RE.test(slug)) return json({ error: "bad slug" }, 400);

  const raw = await env.PAGES.get(slug);
  if (!raw) return json({ error: "not found" }, 404);
  let stored; try { stored = JSON.parse(raw); } catch { stored = null; }
  if (!stored || !stored.t || stored.t !== body.editToken) return json({ error: "forbidden" }, 403);

  await deletePage(env, slug);
  return json({ deleted: slug });
}
