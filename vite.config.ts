import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/vitest.setup.ts"],
  },
}));
