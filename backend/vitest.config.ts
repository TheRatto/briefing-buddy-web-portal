import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/__tests__/**/*.ts"],
    testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  },
  resolve: {
    // Ensure proper handling of CommonJS and ESM modules
    conditions: ["node", "import", "require"],
  },
});

