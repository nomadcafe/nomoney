# No Money 💸

**Funny support pages for broke creators.** Create a free, no-signup page when you're broke,
pick your "broke status," add your tip links, and share a meme-ready card with a **Broke Score**.

Tip links are external and go **straight to the creator** — No Money never touches the money.
It is **not** a charity or fundraising platform.

## Stack

- **Front end:** static HTML/CSS/JS, zero dependencies — `index.html`, `create.html`, `p.html`, `assets/`
- **Back end:** Cloudflare Pages Functions + one KV namespace for vanity short links
  (`no.money/<handle>`) and server-rendered social (OG) previews — `functions/`

## Run locally

```sh
# static only (no short links)
python3 -m http.server 8765

# with Functions + KV emulation
wrangler pages dev .

# quick mock backend, no wrangler (in-memory KV)
node devserver.mjs
```

## Deploy

Cloudflare Pages + KV — see [DEPLOY.md](DEPLOY.md).
