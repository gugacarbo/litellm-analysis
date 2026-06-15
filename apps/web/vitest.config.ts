import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

const cssMockPlugin = (): Plugin => ({
  name: "vitest-css-mock",
  enforce: "pre",
  transform(_code, id) {
    if (id.endsWith(".css")) {
      return {
        code: "export default {};",
        map: null,
      };
    }
    return null;
  },
});

export default defineConfig({
  plugins: [cssMockPlugin(), react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["@testing-library/jest-dom/vitest"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
