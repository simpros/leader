import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    alias: {
      bun: path.resolve(__dirname, "src/__mocks__/bun.ts"),
    },
  },
  test: {
    name: "web",
    include: ["src/**/*.test.ts"],
    server: {
      deps: {
        // Inline @leader/db and drizzle-orm so the `bun` alias applies within them
        inline: ["@leader/db", "drizzle-orm"],
      },
    },
  },
});
