import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import { Button } from "../src/components/ui/Button/Button";
import { Button as AdminButton } from "../src/components/admin/Button";
import messages from "../messages/en.json";

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

it("admin button works without an internationalization provider and blocks loading clicks", async () => {
  const onClick = vi.fn();
  await act(async () =>
    root.render(
      <AdminButton loading loadingLabel="Pending" onClick={onClick}>
        Save
      </AdminButton>,
    ),
  );
  const button = container.querySelector("button")!;
  expect(button.disabled).toBe(true);
  expect(button.getAttribute("aria-busy")).toBe("true");
  expect(button.textContent).toBe("Pending");
  await act(async () => button.click());
  expect(onClick).not.toHaveBeenCalled();
});

it("public button localizes loading and preserves normal click behavior", async () => {
  const onClick = vi.fn();
  const render = (loading: boolean) =>
    act(async () =>
      root.render(
        <NextIntlClientProvider
          locale="en"
          messages={messages}
          timeZone="Asia/Seoul"
        >
          <Button loading={loading} onClick={onClick}>
            Save
          </Button>
        </NextIntlClientProvider>,
      ),
    );
  await render(true);
  expect(container.querySelector("button")!.textContent).toBe(
    messages.Common.loading,
  );
  await render(false);
  await act(async () => container.querySelector("button")!.click());
  expect(onClick).toHaveBeenCalledOnce();
});
