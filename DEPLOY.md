# Deploy — No Money (Cloudflare Pages + KV)

The front end is built with **Vite** (`npm run build` → `dist/`). Short links + social (OG)
previews + the message wall are **Cloudflare Pages Functions** in `/functions` (NOT touched by
the Vite build), backed by one **KV namespace**.

> **Cloudflare Pages build settings (required for the Git deploy):**
> Settings → Builds & deployments → **Build command: `npm run build`**, **Build output directory: `dist`**,
> Framework preset: None. (Functions are still auto-detected from `/functions`.)
> Without these, the Git build would serve the unbuilt source and break — set them before pushing.

- `POST /api/save` → stores the page JSON + the browser-generated share PNG, returns a vanity `slug`
                      (derived from the user's handle; reserved names / collisions get a short `-suffix`)
- `GET /<handle>`  → (`functions/[id].js`) serves the page with server-injected `og:*` tags + embedded
                      data. Falls through to static files for names with a `.`, reserved words, or non-slugs.
- `GET /og/:id`    → serves the stored PNG (used as the OG image). Served `immutable` for a year,
                      so `[id].js` appends `?v=<updatedAt>` — re-publishing must move the URL or every
                      edge and browser keeps serving the OLD share image forever.
- `POST /api/delete` → the page owner removes their own page (needs the `editToken`). Wipes the page,
                      its avatar, share image, messages and counters. Admin takedown is `POST /api/wall {delete}`.

`create.html` requires this backend (KV + the `/api/save` Function) to publish — there is no
static fallback. If publishing fails it shows a retry toast. The landing page and `?demo=`
example pages are still fully static.

## One-time setup

1. **Install + log in**
   ```sh
   npm i -g wrangler
   wrangler login
   ```

2. **Create the KV namespace** and copy the printed `id` into `wrangler.toml`
   (replace `REPLACE_WITH_KV_NAMESPACE_ID`):
   ```sh
   wrangler kv namespace create PAGES
   ```

3. **Create the Pages project** (first deploy):
   ```sh
   wrangler pages project create nomoney --production-branch main
   ```

## Deploy

```sh
wrangler pages deploy .
```

After the first deploy, bind KV to the Pages project so the Functions can see it
(Dashboard → Workers & Pages → nomoney → Settings → Functions → KV namespace bindings:
add **Variable name `PAGES`** → your `PAGES` namespace, for **both** Production and Preview).
`wrangler.toml` covers `wrangler pages dev`, but the dashboard binding is what production uses.

## Custom domain

Dashboard → the `nomoney` Pages project → Custom domains → add `no.money`
(Cloudflare auto-manages DNS if the domain is on your Cloudflare account).

## Local development

- **Static only** (no short links — uses the long fallback URL):
  ```sh
  python3 -m http.server 8765
  ```
- **With Functions + KV emulation:**
  ```sh
  wrangler pages dev .
  ```
- **Quick mock** (no wrangler needed — in-memory KV, mirrors the Functions):
  ```sh
  node devserver.mjs    # http://localhost:8766
  ```
  `devserver.mjs` is a test-only helper; it is not part of the deploy.

## Notes / next

- **Abuse / rate limits** (all per-IP, best-effort KV counters — eventual consistency lets a tight
  burst slip; they're abuse caps, not security boundaries). Raise the ceiling with Cloudflare WAF
  rate-limit rules or Turnstile if any of them start getting hit by real traffic:
  | Endpoint | Cap | Also |
  |---|---|---|
  | `POST /api/save` | 30 creates/IP/day | JSON ≤ 8 KB, PNG ≤ ~0.9 MB, avatar ≤ ~0.2 MB; edits are exempt (they need the token) |
  | `POST /api/msgs` | 40 posts/IP/day | duplicate text rejected (409); links in text rejected |
  | `POST /api/hit`  | 40 events/IP/day | slug must be an existing page |
  | `POST /api/ai`   | `AI_RL_PER_MIN`/`AI_RL_PER_DAY` (default 8/min, 80/day) | protects Workers AI spend |
- **Write budget:** free KV is ~1000 writes/day and a counted analytics event costs 2 of them
  (counter + IP budget). Past ~500 engaged visits/day, move `/api/hit` to Workers Analytics Engine.
- **Reports:** public pages link to `abuse@no.money` (`REPORT_EMAIL` in `src/p.js`) — point it at a real
  inbox before launch, or reports go nowhere.
- **Slugs are vanity**: `no.money/<handle>` from the user's handle; reserved names and collisions get a
  short random `-suffix` (account-less, so handles aren't owned/reserved — locking a handle is a future paid feature).
- KV is eventually consistent (writes propagate in seconds) — fine for create-then-share.
