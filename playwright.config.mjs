import path from "node:path";
import { defineConfig } from "playwright/test";

const backend =
  process.env.YOGODA_BE_DIR ?? path.resolve("../../Yogoda-BE/yogoda-backend");

export default defineConfig({
  testDir: "./e2e",
  timeout: 60000,
  expect: { timeout: 15000 },
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    viewport: { width: 390, height: 844 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "node node_modules/tsx/dist/cli.mjs tests/e2e-server.mjs",
      cwd: backend,
      url: "http://127.0.0.1:8100/__test/health",
      env: { NODE_ENV: "test", YOGODA_TEST_SERVER: "1", TEST_PORT: "8100" },
      reuseExistingServer: false,
      timeout: 120000,
    },
    {
      command:
        "node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3100",
      url: "http://127.0.0.1:3100/ko/login",
      env: {
        NODE_ENV: "development",
        YOGODA_E2E: "1",
        NEXT_PUBLIC_API_BASE_URL: "http://127.0.0.1:8100",
      },
      reuseExistingServer: false,
      timeout: 180000,
    },
  ],
});
