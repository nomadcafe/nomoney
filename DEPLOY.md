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
npm run build && wrangler pages deploy
```

**Not `wrangler pages deploy .`** — the positional argument overrides
`pages_build_output_dir = "dist"` in `wrangler.toml` and uploads the repo root instead,
which ships unbuilt `src/` modules (the browser can't run them: `core.js` imports CSS)
and everything else in the directory. With no argument, wrangler uses `dist/`.

After the first deploy, bind KV to the Pages project so the Functions can see it
(Dashboard → Workers & Pages → nomoney → Settings → Functions → KV namespace bindings:
add **Variable name `PAGES`** → your `PAGES` namespace, for **both** Production and Preview).
`wrangler.toml` covers `wrangler pages dev`, but the dashboard binding is what production uses.

## Environment variables

Set these on the Pages project (Dashboard → Workers & Pages → nomoney → Settings →
Variables and Secrets), for **Production and Preview**:

| Name | Required | What breaks without it |
|---|---|---|
| `WALL_ADMIN_TOKEN` | **yes, to use `/admin`** | `POST /api/wall` returns `403 curation disabled` — you cannot feature pages, see the funnel, rebuild the index or take a page down from the UI. Set it to a long random string (`openssl rand -hex 24`) and paste the same string into the token box at `/admin`. |
| `AI_MODEL` | no (default `@cf/meta/llama-3.1-8b-instruct-fp8`) | Nothing immediately — but Cloudflare **retires model slugs without notice** (this is how `@cf/meta/llama-3.1-8b-instruct` vanished and `/api/ai` 502'd for every user). When the AI button starts failing, run `wrangler ai models`, pick a current one, and set this — no redeploy needed. |
| `AI_RL_PER_MIN` | no (default 8) | Public per-IP ceiling on the AI rewrite button = your real one. Override so it isn't. |
| `AI_RL_PER_DAY` | no (default 80) | Same, per day. |

`/admin` is unlisted, `noindex`, and gated only by this token — the token IS the admin
account. Without it set, curation is disabled rather than open, which is the safe default.
Fallback if you'd rather not set it: curate by hand with
`wrangler kv key put --binding=PAGES wall:featured '["slug-a","slug-b"]'`.

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

## Health check

```sh
node scripts/healthcheck.mjs                 # production
node scripts/healthcheck.mjs http://localhost:8766
```

Runs daily via `.github/workflows/health-check` and on demand (Actions → health check →
Run workflow). A failing scheduled run emails the repo owner — that's the whole alerting
setup, no extra service.

It asserts **meaning, not status codes**, because every failure this product has had was
silent: `/api/ai` 502'd for days while the editor served canned lines and looked fine; a
broken `/api/wall` makes the homepage wall `display:none` itself; a broken `/api/hit`
reads as "nobody shares", which is the exact conclusion the roadmap acts on. It is
read-only, so it can't skew `stat:creates` or the activity index.

**Known gap, stated rather than hidden:** a KV *write* outage (e.g. the free ~1000
writes/day budget exhausted) is not detected, because writes only happen on real user
actions. That surfaces as frozen numbers in `/admin`.

## Notes / next

- **Abuse / rate limits** (all per-IP, best-effort KV counters — eventual consistency lets a tight
  burst slip; they're abuse caps, not security boundaries). Raise the ceiling with Cloudflare WAF
  rate-limit rules or Turnstile if any of them start getting hit by real traffic:
  | Endpoint | Cap | Also |
  |---|---|---|
  | `POST /api/save` | 30 creates/IP/day | JSON ≤ 8 KB, PNG ≤ ~0.9 MB, avatar ≤ ~0.2 MB; edits are exempt (they need the token) |
  | `POST /api/msgs` | 40 posts/IP/day | duplicate text rejected (409); links in text rejected |
  | `POST /api/hit`  | 40 flushes/IP/day | slug must be an existing page; a session batches its events into 1–3 flushes |
  | `POST /api/ai`   | `AI_RL_PER_MIN`/`AI_RL_PER_DAY` (default 8/min, 80/day) | protects Workers AI spend |
- **Write budget:** free KV is ~1000 writes/day and an analytics *flush* costs 2 of them
  (counter + IP budget). A session flushes once or twice regardless of how many event types it
  reports, so adding signals is free — adding traffic is not. Past ~500 engaged visits/day, move
  `/api/hit` to Workers Analytics Engine.
- **Landing-page traffic is deliberately not instrumented.** Cloudflare's own request analytics
  already counts hits on `/` and `/create.html`; re-counting them would spend the write budget on
  something the dashboard shows for free. `/api/hit` only measures what the dashboard can't see
  (per-page share acts, make-mine clicks, tip-link clicks).
- **Reports:** public pages link to `hello@keki.ai` (`REPORT_EMAIL` in `src/p.js`).
- **Content rules** live in `functions/_moderation.js`, shared by the editor and `/api/save`
  (422 `{error:"blocked", reason}`) so a page can't be published past a rule the editor didn't
  show. They target *promotion*, never confession: "I lost my rent gambling" and "Bought high.
  Panicked. Sold low." are preset copy on this site and must always publish. Blocked instead:
  links to bookmakers/casinos, tipster idiom that sells picks, and promises of returns.
  Verified against all 125 live pages — 2 hits, both real tipster pages, zero false positives.
  Pages that predate the rules are left in place and flagged in `/admin` (🚫 badge + filter).
- **Individual pages are `noindex,follow`** (injected by `functions/[id].js`). Growth is sharing,
  not SEO — and no accounts means anyone can put their face on a permanent URL. Social previews are
  unaffected: `og:*`/`twitter:*` scrapers don't read the robots meta. `sitemap.xml` lists only `/`
  and `/create.html`, which stay indexable. Reverse by deleting one line if you ever want the pages
  in search.
- **Slugs are vanity**: `no.money/<handle>` from the user's handle; reserved names and collisions get a
  short random `-suffix` (account-less, so handles aren't owned/reserved — locking a handle is a future paid feature).
- KV is eventually consistent (writes propagate in seconds) — fine for create-then-share.
