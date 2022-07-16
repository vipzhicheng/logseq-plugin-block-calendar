import { defineConfig } from "vite";

import logseqPlugin from "vite-plugin-logseq";

export default defineConfig({
  base: "./",
  build: {
    sourcemap: true,
    target: "esnext",
    minify: "esbuild",
  },
  plugins: [logseqPlugin()],
});
