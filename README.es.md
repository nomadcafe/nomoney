# No Money 💸

[English](README.md) · [中文](README.zh.md) · [日本語](README.ja.md) · **Español**

**Haz oficial tu pobreza.** No Money convierte «estoy sin dinero» en un meme para compartir: elige tu
*estado de pobreza*, pon tus enlaces de propina y publica una tarjeta lista para memes con un **Nivel de quiebra**
calculado. Sin registro, sin base de datos de usuarios, gratis.

> Estoy sin dinero, pero que sea gracioso.

🔗 **En vivo:** [no.money](https://no.money) · 🌐 **English / Español / 日本語 / 中文** · ⚡ funciona en el edge de Cloudflare

Los enlaces de propina (PayPal, Ko-fi, cripto, Stripe…) son externos y van **directos a ti** — No Money
nunca toca el dinero, no se queda con nada y no guarda datos de pago. Es una página de propinas tipo meme
para creadores y bromas de internet, **no** una plataforma de caridad ni de recaudación. Es de código abierto,
así que puedes verificar cada una de esas afirmaciones en el código.

---

## Qué lo hace interesante

La mayoría de las herramientas de «link in bio» / bote de propinas son SaaS cargados de cuentas. No Money es
lo contrario — un experimento deliberado de hasta dónde puedes llegar **sin cuentas, sin base de datos de
usuarios y sin servidores que mantener**:

- **Sin cuentas.** Una página es solo una URL para compartir: `no.money/<handle>`. Sin login, sin contraseña, sin tabla de perfiles.
- **Editar sin cuenta.** Las ediciones se autorizan con un *enlace de capacidad* (un token de edición imposible de adivinar), no con una sesión — quien tiene el enlace, manda en la página.
- **La imagen para compartir es el producto de verdad.** Un toque renderiza una tarjeta meme en un `<canvas>` y la sube como vista previa social de la página. Lo importante es lo que publicas, no la página en sí.
- **Multilingüe por diseño.** English / Español / 日本語 / 中文 con *humor localizado*, no traducción literal — cada personaje pobre tiene sus propios remates en su idioma nativo. Detecta el navegador; cámbialo cuando quieras desde el selector 🌐.
- **Barato y aburrido de operar.** Un front end estático + un puñado de edge functions + un almacén clave-valor. Sin VM, sin SQL, sin cron.

## Tecnología

- **Front end** — HTML/CSS/JS puro, empaquetado con **Vite** como app multipágina (`index.html`, `create.html`, `p.html`, `assets/`, `src/`)
- **Back end** — Cloudflare **Pages Functions** (enrutado por convención de archivos en `functions/`) + un espacio de nombres **KV** que guarda el JSON de la página y el PNG para compartir
- **IA** — Cloudflare **Workers AI** (`@cf/meta/llama-3.1-8b-instruct`) para la reescritura opcional de la historia lacrimógena

## Mapa del repositorio

```
index.html  create.html  p.html  404.html   páginas (entradas MPA de Vite)
src/                                         scripts de entrada por página (index/create/p)
assets/      core.js  i18n.js  style.css     estados de pobreza, nivel, render de imagen, i18n
functions/                                   Cloudflare Pages Functions
  [id].js                                    catch-all raíz: páginas personalizadas + inyección OG
  og/[id].js                                 sirve el PNG para compartir guardado
  api/  save.js  get.js  msgs.js  ai.js      publicar, leer, muro de mensajes, reescritura IA
  _reserved.js                               lista de handles reservados
devserver.mjs                                backend simulado local (KV en memoria + IA simulada)
```

## Ejecutar en local

```sh
npm install
npm run dev                              # solo front end (sin enlaces cortos)
node devserver.mjs                       # app completa con backend simulado (KV en memoria + IA)
npm run build && npx wrangler pages dev dist   # runtime real de Cloudflare (KV + Workers AI)
```

## Licencia

[MIT](LICENSE) — haz lo que quieras, sin garantía. Una ⭐ se agradece pero no es obligatoria.
