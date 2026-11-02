import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": src,
      // `server-only` throws outside React Server Components; tests run plain Node.
      "server-only": fileURLToPath(new URL("./tests/support/empty.ts", import.meta.url)),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    globalSetup: ["tests/support/globalSetup.ts"],
    setupFiles: ["tests/support/setup.ts"],
    // Integration tests share one database, so files run one at a time.
    fileParallelism: false,
  },
});
