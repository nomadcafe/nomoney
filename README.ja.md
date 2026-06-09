# No Money 💸

[English](README.md) · [中文](README.zh.md) · **日本語** · [Español](README.es.md)

**破産を公式に。** No Money は「金欠です」をシェアできるミームに変える――*破産ステータス*を選んで
投げ銭リンクを貼り、自動計算された **破産スコア** 付きのミーム画像を投稿。登録不要、ユーザーDBなし、無料。

> 金欠だけど、笑えるやつにする。

🔗 **公開中：** [no.money](https://no.money) · 🌐 **English / Español / 日本語 / 中文** · ⚡ Cloudflare のエッジで稼働

投げ銭リンク（PayPal、Ko-fi、暗号資産、Stripe…）はすべて外部リンクで、お金は**直接あなたへ**――
No Money はお金に一切触れず、手数料も取らず、決済情報も保存しません。クリエイターとネタのための
ミーム投げ銭ページであって、慈善や募金のプラットフォーム**ではありません**。オープンソースなので、
これらの主張はすべてコードで自分の目で確認できます。

---

## どこが面白いか

たいていの「リンク・イン・バイオ／投げ銭箱」ツールはアカウント前提の SaaS です。No Money はその逆――
**アカウントなし、ユーザーDBなし、運用するサーバーもなし**でどこまでやれるか、という意図的な実験です：

- **アカウントなし。** ページはただのシェア用URL：`no.money/<handle>`。ログインもパスワードもプロフィールテーブルもなし。
- **アカウントなしで編集。** 編集権限はログインセッションではなく*ケイパビリティリンク*（推測不能な編集トークン）で認可――リンクを持つ人がそのページの持ち主。
- **シェア画像こそが本当のプロダクト。** ワンタップで `<canvas>` にミームカードを描画し、ページのソーシャルプレビュー画像としてアップロード。主役はページではなく、あなたが投稿するその画像。
- **多言語は設計思想。** English / Español / 日本語 / 中文 を、直訳ではなく*ローカライズされたユーモア*で――どの破産キャラもそれぞれの母語のオチを持つ。ブラウザ言語を自動判定し、🌐 ピッカーでいつでも切替可能。
- **運用は安くて退屈。** 静的フロントエンド + 少数のエッジ関数 + キーバリューストア1つ。VMなし、SQLなし、cronなし。

## 技術スタック

- **フロントエンド** —— 素の HTML/CSS/JS を **Vite** でマルチページアプリとしてバンドル（`index.html`、`create.html`、`p.html`、`assets/`、`src/`）
- **バックエンド** —— Cloudflare **Pages Functions**（`functions/` のファイル規約ルーティング）+ ページJSONとシェアPNGを保存する **KV** 名前空間1つ
- **AI** —— Cloudflare **Workers AI**（`@cf/meta/llama-3.1-8b-instruct`）。任意の「泣ける話」リライト用

## リポジトリ構成

```
index.html  create.html  p.html  404.html   ページ（Vite マルチページのエントリ）
src/                                         各ページのエントリスクリプト（index/create/p）
assets/      core.js  i18n.js  style.css     破産ステータス、スコア、シェア画像描画、i18n
functions/                                   Cloudflare Pages Functions
  [id].js                                    ルートのキャッチオール：カスタムページ + OG注入
  og/[id].js                                 保存されたシェアPNGを配信
  api/  save.js  get.js  msgs.js  ai.js      公開、読込、メッセージウォール、AIリライト
  _reserved.js                               予約ハンドル一覧
devserver.mjs                                ローカルのモックバックエンド（インメモリKV + モックAI）
```

## ローカルで動かす

```sh
npm install
npm run dev                              # フロントエンドのみ（短縮リンクなし）
node devserver.mjs                       # モックバックエンド付きの完全版（インメモリKV + AI）
npm run build && npx wrangler pages dev dist   # 本物の Cloudflare ランタイム（KV + Workers AI）
```

## ライセンス

[MIT](LICENSE) —— 好きに使ってOK、無保証。⭐ をもらえると嬉しいですが必須ではありません。
