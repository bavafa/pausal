import { defineConfig } from "vite";

// One self-contained ES module for a Vercel Node function: every workspace import and config JSON is bundled in.
export default defineConfig({
  build: {
    ssr: "src/vercel.ts",
    outDir: "dist/api",
    emptyOutDir: true,
    target: "node22",
    rollupOptions: { output: { entryFileNames: "chunk.mjs" } },
  },
  ssr: { noExternal: true, target: "node" },
});
