import { spawn, execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { chromium } from "playwright";

const port = 3200;
const probe = createServer();
await new Promise((resolve, reject) => {
  probe.once("error", reject);
  probe.listen(port, "127.0.0.1", resolve);
});
await new Promise((resolve) => probe.close(resolve));
if (!process.env.npm_execpath)
  throw new Error("Run using npm run performance:measure");
await mkdir(".qa/performance", { recursive: true });
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NODE_ENV: "production" },
  },
);
let output = "";
server.stderr.on("data", (chunk) => {
  output += chunk;
});
try {
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Production server startup timed out: " + output)),
      60000,
    );
    server.once("exit", () => {
      clearTimeout(timeout);
      reject(new Error("Production server exited: " + output));
    });
    server.stdout.on("data", (chunk) => {
      output += chunk;
      if (/ready in/i.test(output)) {
        clearTimeout(timeout);
        resolve();
      }
    });
  });
  const results = [];
  // Public entry screens only: no OAuth, signup, AI calls or production data mutations.
  for (const route of ["login", "onboarding"]) {
    const file = `.qa/performance/${route}.json`;
    const args = [
      process.env.npm_execpath,
      "exec",
      "--yes",
      "--package=lighthouse@11.3.0",
      "--",
      "lighthouse",
      `http://127.0.0.1:${port}/ko/${route}`,
      "--quiet",
      "--chrome-flags=--headless=new",
      "--only-categories=performance,accessibility,best-practices",
      "--output=json",
      `--output-path=${file}`,
    ];
    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, args, {
        stdio: "inherit",
        env: { ...process.env, CHROME_PATH: chromium.executablePath() },
      });
      child.once("error", reject);
      child.once("exit", (code) =>
        code === 0 ? resolve() : reject(new Error(`Lighthouse exited ${code}`)),
      );
    });
    const report = JSON.parse(await readFile(file, "utf8"));
    if (report.runtimeError) throw new Error(report.runtimeError.message);
    const screenshot = report.audits["final-screenshot"]?.details?.data;
    if (screenshot?.startsWith("data:image/jpeg;base64,")) {
      await writeFile(
        `.qa/performance/${route}.jpg`,
        Buffer.from(screenshot.slice(screenshot.indexOf(",") + 1), "base64"),
      );
    }
    results.push({
      route: report.finalDisplayedUrl,
      version: report.lighthouseVersion,
      measuredAt: report.fetchTime,
      scores: Object.fromEntries(
        Object.entries(report.categories).map(([key, category]) => [
          key,
          Math.round(category.score * 100),
        ]),
      ),
      lcpMs: report.audits["largest-contentful-paint"].numericValue,
      cls: report.audits["cumulative-layout-shift"].numericValue,
      tbtMs: report.audits["total-blocking-time"].numericValue,
      transferBytes: report.audits["total-byte-weight"].numericValue,
      warnings: report.runWarnings,
    });
  }
  await writeFile(
    ".qa/performance/summary.json",
    JSON.stringify(results, null, 2),
  );
  console.log(JSON.stringify(results, null, 2));
} finally {
  if (server.exitCode === null && server.pid) {
    if (process.platform === "win32")
      execFileSync("taskkill", ["/PID", String(server.pid), "/T", "/F"]);
    else server.kill("SIGTERM");
  }
}
