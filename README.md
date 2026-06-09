# No Money 💸

**English** · [中文](README.zh.md) · [日本語](README.ja.md) · [Español](README.es.md)

**Make being broke official.** No Money turns "I'm broke" into a shareable meme: pick your
*broke status*, drop your tip links, and post a meme-ready card with a computed **Broke Score**.
No signup, no database of users, free.

> I'm broke, but make it funny.

🔗 **Live:** [no.money](https://no.money) · 🌐 **English / Español / 日本語 / 中文** · ⚡ runs on Cloudflare's edge

Tip links (PayPal, Ko-fi, crypto, Stripe…) are external and go **straight to you** — No Money
never touches the money, takes no cut, and stores no payment details. It's a meme tipping page
for creators and internet jokes, **not** a charity or fundraising platform. It's open source so
you can verify every one of those claims in the code.

---

## What makes it interesting

Most "link in bio" / tip-jar tools are account-heavy SaaS. No Money is the opposite — a deliberate
experiment in how far you can get with **no accounts, no user database, and no servers to run**:

- **No accounts.** A page is just a shareable URL: `no.money/<handle>`. No login, no password, no profile table.
- **Editing without an account.** Edits are authorized by a *capability link* (an unguessable edit token), not a session — own the link, own the page.
- **The share image is the actual product.** One tap renders a meme card on a `<canvas>` and uploads it as the page's social preview. The whole point is the thing you post, not the page itself.
- **Multilingual by design.** English / Español / 日本語 / 中文 with *localized humor*, not literal translation — each broke persona has its own native-language punchlines. Auto-detects the browser; switch anytime from the 🌐 picker.
- **Cheap and boring to operate.** A static front end + a handful of edge functions + one key-value store. No VM, no SQL, no cron.

## Stack

- **Front end** — vanilla HTML/CSS/JS, bundled with **Vite** as a multi-page app (`index.html`, `create.html`, `p.html`, `assets/`, `src/`)
- **Back end** — Cloudflare **Pages Functions** (file-convention routing in `functions/`) + one **KV** namespace storing page JSON and the share PNG
- **AI** — Cloudflare **Workers AI** (`@cf/meta/llama-3.1-8b-instruct`) for the optional sob-story rewrite

## Repo map

```
index.html  create.html  p.html  404.html   pages (Vite MPA entries)
src/                                         per-page entry scripts (index/create/p)
assets/      core.js  i18n.js  style.css     broke statuses, score, share-image renderer, i18n
functions/                                   Cloudflare Pages Functions
  [id].js                                    root catch-all: vanity pages + OG injection
  og/[id].js                                 serves the stored share PNG
  api/  save.js  get.js  msgs.js  ai.js      publish, read, message wall, AI rewrite
  _reserved.js                               reserved-handle list
devserver.mjs                                local mock backend (in-memory KV + mocked AI)
```

## Run locally

```sh
npm install
npm run dev                              # front end only (no short links)
node devserver.mjs                       # full app with a mock backend (in-memory KV + AI)
npm run build && npx wrangler pages dev dist   # real Cloudflare runtime (KV + Workers AI)
```

## License

[MIT](LICENSE) — do whatever you want, no warranty. A ⭐ is appreciated but not required.
