import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  test: {
    environment: "node",
    globalSetup: ["./tests/global-setup.ts"],
    env: { DATABASE_URL: "file:./prisma/test.db", NODE_ENV: "test" },
    // One SQLite file, so files run one after another.
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
