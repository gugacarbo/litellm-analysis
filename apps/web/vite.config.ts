import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const assistantUiPackages = [
  "@assistant-ui/react",
  "@assistant-ui/react-ai-sdk",
  "@assistant-ui/react-markdown",
  "@assistant-ui/core",
  "@assistant-ui/store",
  "@assistant-ui/tap",
] as const;

export default defineConfig({
  envDir: "../../",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/features": path.resolve(__dirname, "./src/features"),
      "@/shared": path.resolve(__dirname, "./src/shared"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      ...assistantUiPackages,
      "ai",
      "@ai-sdk/react",
    ],
  },
  optimizeDeps: {
    include: [...assistantUiPackages, "ai", "@ai-sdk/react"],
  },
  server: {
    port: 5178,
    proxy: {
      "/api": {
        target: "http://localhost:3008",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
      "/ws": {
        target: "http://localhost:3008",
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
});
