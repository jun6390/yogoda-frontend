import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";

import { playwright } from "@vitest/browser-playwright";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  define: {
    "process.env.NEXT_PUBLIC_API_BASE_URL": JSON.stringify(
      "http://127.0.0.1:8100",
    ),
  },
  optimizeDeps: {
    include: [
      "@tanstack/react-query",
      "socket.io-client",
      "zustand",
      "zustand/middleware",
      "react-markdown",
      "remark-gfm",
    ],
  },
  resolve: { alias: { "@": path.join(dirname, "src") } },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "components",
          include: ["tests/**/*.test.tsx"],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }],
          },
        },
      },
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/**/*.test.ts"],
        },
      },
      {
        extends: true,
        plugins: [
          storybookTest({ configDir: path.join(dirname, ".storybook") }),
        ],
        test: {
          name: "storybook",
          fileParallelism: false,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
