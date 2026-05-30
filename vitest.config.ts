import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      // `server-only` throws on import outside an RSC bundler; stub it for tests.
      "server-only": resolve(__dirname, "test/server-only-stub.ts"),
    },
  },
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "test/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      // Coverage gate targets the pure logic layer. Canvas compositing
      // (lib/export) and route handlers are DOM/runtime integration, verified
      // by the bounds unit test + the live proxy check rather than unit %.
      include: [
        "src/lib/transform/**",
        "src/lib/scene/**",
        "src/lib/giphy/**",
        "src/store/**",
        "src/hooks/**",
      ],
      exclude: ["src/**/*.test.{ts,tsx}", "src/**/*.d.ts"],
      thresholds: { lines: 80, functions: 80, branches: 75, statements: 80 },
    },
  },
});
