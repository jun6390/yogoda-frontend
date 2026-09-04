import { afterEach, beforeEach, expect, it, vi } from "vitest";

class Script extends EventTarget {
  dataset: Record<string, string> = {};
  src = "";
  async = false;
  remove = vi.fn(() => {
    scripts = scripts.filter((item) => item !== this);
  });
}
let scripts: Script[] = [];

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.stubEnv("NEXT_PUBLIC_NAVER_MAP_KEY_ID", "test-key");
  scripts = [];
  vi.stubGlobal("window", {});
  vi.stubGlobal("document", {
    querySelector: () => scripts[0] ?? null,
    createElement: () => new Script(),
    head: { appendChild: (script: Script) => scripts.push(script) },
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it("shares an in-flight load and verifies SDK readiness", async () => {
  const { loadNaverMap } = await import("../src/lib/naver-map");
  const first = loadNaverMap();
  expect(loadNaverMap()).toBe(first);
  Object.assign(window, { naver: { maps: {} } });
  scripts[0].dispatchEvent(new Event("load"));
  await expect(first).resolves.toBeUndefined();
});

it("removes a failed script and creates a fresh script on retry", async () => {
  const { loadNaverMap } = await import("../src/lib/naver-map");
  const first = loadNaverMap();
  const rejected = expect(first).rejects.toThrow();
  const failed = scripts[0];
  failed.dispatchEvent(new Event("error"));
  await rejected;
  expect(failed.remove).toHaveBeenCalledOnce();
  const retry = loadNaverMap();
  expect(scripts[0]).not.toBe(failed);
  Object.assign(window, { naver: { maps: {} } });
  scripts[0].dispatchEvent(new Event("load"));
  await expect(retry).resolves.toBeUndefined();
});

it("times out stale scripts instead of hanging indefinitely", async () => {
  scripts.push(new Script());
  const { loadNaverMap } = await import("../src/lib/naver-map");
  const pending = expect(loadNaverMap()).rejects.toThrow();
  await vi.advanceTimersByTimeAsync(15000);
  await pending;
  expect(scripts).toHaveLength(0);
});

it("rejects a load event without a usable SDK", async () => {
  const { loadNaverMap } = await import("../src/lib/naver-map");
  const pending = expect(loadNaverMap()).rejects.toThrow();
  scripts[0].dispatchEvent(new Event("load"));
  await pending;
  expect(scripts).toHaveLength(0);
});
