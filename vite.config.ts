import { defineConfig } from "vite";

import logseqPlugin from "vite-plugin-logseq";

export default defineConfig({
  base: "./",
  build: {
    target: "esnext",
    minify: "esbuild",
  },
  plugins: [logseqPlugin()],
});
