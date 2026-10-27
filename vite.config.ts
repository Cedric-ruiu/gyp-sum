import { writeFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import { buildSitemap } from "./src/sitemap.ts";

// Routes actually pre-rendered by vite-ssg, captured for the sitemap.
let renderedPaths: string[] = [];

export default defineConfig(() => ({
  base: "/gyp-sum/",
  plugins: [vue(), tailwindcss()],
  // vite-ssg: pre-render each route to its own directory index
  // (`/en` -> `dist/en/index.html`, served at `/gyp-sum/en/`).
  ssgOptions: {
    dirStyle: "nested",
    includedRoutes: (paths: string[]) => {
      // Same filter as vite-ssg's default: static routes only.
      renderedPaths = paths.filter((p) => !p.includes(":") && !p.includes("*"));
      return renderedPaths;
    },
    onFinished: () => {
      writeFileSync(
        fileURLToPath(new URL("./dist/sitemap.xml", import.meta.url)),
        buildSitemap(renderedPaths),
      );
    },
  },
  // Vue feature flags — required so externalised deps (vue-i18n) resolve them
  // during the vite-ssg server render.
  define: {
    __VUE_OPTIONS_API__: "true",
    __VUE_PROD_DEVTOOLS__: "false",
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: "false",
  },
  ssr: {
    noExternal: ["vue-i18n"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules/three")) return "three";
        },
      },
    },
  },
}));
