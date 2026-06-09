# No Money 💸

[English](README.md) · **中文** · [日本語](README.ja.md) · [Español](README.es.md)

**把破产，正式官宣。** No Money 把「我破产了」变成一张能转发的梗图：选一个*破产状态*、
放上你的收款链接，生成带自动计算 **破产分** 的梗图卡片。免注册、不存用户、完全免费。

> 我破产了，但要破产得好笑。

🔗 **线上：** [no.money](https://no.money) · 🌐 **English / Español / 日本語 / 中文** · ⚡ 跑在 Cloudflare 边缘网络

收款链接（PayPal、Ko-fi、加密钱包、Stripe…）都是外部链接，钱**直接进你口袋**——No Money
一分不碰、不抽成、也不保存任何支付信息。它是给创作者和网络玩笑用的梗图打赏页，**不是**慈善
或募捐平台。项目开源，以上每一条你都能在代码里亲自核实。

---

## 它有意思在哪

大多数「个人主页 / 打赏罐」工具都是重账号的 SaaS。No Money 反其道而行——它是一个刻意的实验：
看看**不要账号、不要用户数据库、也不用维护服务器**，到底能走多远：

- **没有账号。** 一个页面就是一条可分享的网址：`no.money/<handle>`。无需登录、没有密码、没有资料表。
- **不用账号也能编辑。** 编辑权限靠一条*能力链接*（一个无法猜测的编辑令牌）授权，而不是登录会话——谁拿着链接，谁就能编辑这个页面。
- **分享图才是真正的产品。** 一键在 `<canvas>` 上渲染一张梗图卡片，并作为页面的社交预览图上传。重点是你发出去的那张图，而不是页面本身。
- **多语言是设计的一部分。** English / Español / 日本語 / 中文，做的是*本地化的幽默*而非直译——每个破产人设都有自己母语里的段子。自动识别浏览器语言，随时用 🌐 选择器切换。
- **运营起来便宜又无聊。** 一个静态前端 + 几个边缘函数 + 一个键值存储。没有虚拟机、没有 SQL、没有定时任务。

## 技术栈

- **前端** —— 纯 HTML/CSS/JS，用 **Vite** 打包成多页应用（`index.html`、`create.html`、`p.html`、`assets/`、`src/`）
- **后端** —— Cloudflare **Pages Functions**（`functions/` 里按文件约定路由）+ 一个 **KV** 命名空间，存页面 JSON 和分享图 PNG
- **AI** —— Cloudflare **Workers AI**（`@cf/meta/llama-3.1-8b-instruct`），用于可选的卖惨故事改写

## 仓库结构

```
index.html  create.html  p.html  404.html   页面（Vite 多页入口）
src/                                         各页面入口脚本（index/create/p）
assets/      core.js  i18n.js  style.css     破产状态、破产分、分享图渲染、i18n
functions/                                   Cloudflare Pages Functions
  [id].js                                    根路由兜底：自定义页面 + OG 注入
  og/[id].js                                 提供存储的分享图 PNG
  api/  save.js  get.js  msgs.js  ai.js      发布、读取、留言墙、AI 改写
  _reserved.js                               保留 handle 列表
devserver.mjs                                本地模拟后端（内存 KV + 模拟 AI）
```

## 本地运行

```sh
npm install
npm run dev                              # 仅前端（没有短链接）
node devserver.mjs                       # 完整应用 + 模拟后端（内存 KV + AI）
npm run build && npx wrangler pages dev dist   # 真实 Cloudflare 运行时（KV + Workers AI）
```

## 许可证

[MIT](LICENSE) —— 随便用，不提供任何担保。给个 ⭐ 会很开心，但不强求。
