import { defineConfig } from "vite";

// Multi-page static build. Cloudflare Pages Functions in /functions are deployed
// separately by Pages and are NOT touched by this build.
export default defineConfig({
  appType: "mpa",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: "index.html",
        create: "create.html",
        p: "p.html",
        notfound: "404.html",
      },
    },
  },
});
