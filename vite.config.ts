import { defineConfig } from "vite";

import vue from "@vitejs/plugin-vue";
import logseqPlugin from "vite-plugin-logseq";

export default defineConfig({
  base: "./",
  build: {
    target: "esnext",
    minify: "esbuild",
  },
  plugins: [vue(), logseqPlugin()],
});
