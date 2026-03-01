import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "logging",
    include: ["src/**/*.test.ts"],
  },
});
