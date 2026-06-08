// GET /<handle> — vanity short link. Renders the broke page with server-injected OG tags
// + embedded data. Falls through (next()) for static files and reserved names.

import { RESERVED } from "./_reserved.js";

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export async function onRequestGet(context) {
  const { params, env, request, next } = context;
  const id = params.id;

  // not a vanity slug → let static assets / reserved routes handle it
  if (!id || id.includes(".") || RESERVED.has(id) || !/^[a-z0-9-]{2,40}$/.test(id)) return next();
  if (!env.PAGES) return next();

  const raw = await env.PAGES.get(id);
  if (!raw) return next();

  let stored;
  try { stored = JSON.parse(raw); } catch { return next(); }
  const data = stored.d || {};
  const meta = stored.m || {};

  const origin = new URL(request.url).origin;
  const ogImg = `${origin}/og/${id}`;
  const pageUrl = `${origin}/${id}`;
  const title = meta.title || `${data.name || "Someone"} is broke · No Money`;
  const desc = meta.desc || "Help them become slightly less broke.";

  const assetRes = await env.ASSETS.fetch(new URL("/p.html", request.url));
  let html = await assetRes.text();
  html = html.replace("<head>", '<head><base href="/">'); // resolve relative asset paths from root
  html = html.replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>`); // real title for crawlers/tab

  const inject =
    `<link rel="canonical" href="${esc(pageUrl)}">` +
    `<meta property="og:title" content="${esc(title)}">` +
    `<meta property="og:description" content="${esc(desc)}">` +
    `<meta property="og:image" content="${esc(ogImg)}">` +
    `<meta property="og:url" content="${esc(pageUrl)}">` +
    `<meta property="og:type" content="profile">` +
    `<meta name="twitter:card" content="summary_large_image">` +
    `<meta name="twitter:title" content="${esc(title)}">` +
    `<meta name="twitter:description" content="${esc(desc)}">` +
    `<meta name="twitter:image" content="${esc(ogImg)}">` +
    `<script>window.__PAGE__=${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;

  html = html.replace("</head>", inject + "</head>");

  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" },
  });
}
