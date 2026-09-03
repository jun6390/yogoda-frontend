import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ChatMarkdown } from "../src/components/ui/ChatMarkdown/ChatMarkdown";

const parsing = vi.hoisted(() => ({ count: 0 }));
vi.mock("react-markdown", async (importOriginal) => {
  const original = await importOriginal<typeof import("react-markdown")>();
  return {
    ...original,
    default: (props: Parameters<typeof original.default>[0]) => {
      parsing.count += 1;
      return original.default(props);
    },
  };
});
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  parsing.count = 0;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

it("measures parsing work for 20 existing messages and 10 streamed updates", async () => {
  const history = Array.from(
    { length: 20 },
    (_, index) =>
      `**Plan ${index}**\n\n| Fee | Data |\n| --- | --- |\n| 40000 | 10GB |`,
  );
  const start = performance.now();
  for (let chunk = 0; chunk <= 10; chunk++) {
    await act(async () =>
      root.render(
        <>
          {history.map((text, index) => (
            <ChatMarkdown key={index}>{text}</ChatMarkdown>
          ))}
          <ChatMarkdown>{`New response ${chunk}`}</ChatMarkdown>
        </>,
      ),
    );
  }
  console.log(
    JSON.stringify({
      markdownParses: parsing.count,
      elapsedMs: Math.round(performance.now() - start),
    }),
  );
  expect(parsing.count).toBe(31);
  expect(container.querySelectorAll("table")).toHaveLength(20);
  expect(container.textContent).toContain("New response 10");
});

it("does not execute raw HTML or javascript links from AI responses", async () => {
  await act(async () =>
    root.render(
      <ChatMarkdown>
        {"<script>alert(1)</script>\n\n[link](javascript:alert(1))"}
      </ChatMarkdown>,
    ),
  );
  expect(container.querySelector("script")).toBeNull();
  expect(container.querySelector('a[href^="javascript:"]')).toBeNull();
});
