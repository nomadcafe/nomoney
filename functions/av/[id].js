// GET /av/:id — return the stored avatar photo (JPEG) for a page, for the card.
// Mirrors /og/:id; the bytes live at KV key "avatar:"+slug (the page JSON is too
// small to hold them). Immutable cache — data.av on the page busts it on replace.

export async function onRequestGet({ params, env }) {
  const id = params.id;
  if (!env.PAGES || !/^[a-z0-9-]{2,40}$/.test(id || "")) return new Response("not found", { status: 404 });

  const buf = await env.PAGES.get("avatar:" + id, { type: "arrayBuffer" });
  if (!buf) return new Response("not found", { status: 404 });

  return new Response(buf, {
    headers: {
      "content-type": "image/jpeg",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
