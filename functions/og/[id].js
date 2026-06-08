// GET /og/:id — return the stored share image (PNG) for a short link, for social previews.

export async function onRequestGet({ params, env }) {
  const id = params.id;
  if (!env.PAGES || !/^[a-z0-9-]{2,40}$/.test(id || "")) return new Response("not found", { status: 404 });

  const png = await env.PAGES.get("img:" + id, { type: "arrayBuffer" });
  if (!png) return new Response("not found", { status: 404 });

  return new Response(png, {
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
