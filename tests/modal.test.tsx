import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import { Modal } from "../src/components/ui/Modal/Modal";
import { Modal as AdminModal } from "../src/components/admin/Modal";
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

it.each(["public", "admin"])(
  "%s modal exposes unique heading and description references",
  async (kind) => {
    const Component = kind === "admin" ? AdminModal : Modal;
    const content = (
      <>
        <Component
          heading="First title"
          description="First description"
          primaryLabel="Save"
        />
        <Component
          heading="Second title"
          description="Second description"
          primaryLabel="Save"
        />
      </>
    );
    await act(async () =>
      root.render(
        kind === "admin" ? (
          content
        ) : (
          <NextIntlClientProvider
            locale="en"
            messages={messages}
            timeZone="Asia/Seoul"
          >
            {content}
          </NextIntlClientProvider>
        ),
      ),
    );
    const dialogs = [...container.querySelectorAll('[role="dialog"]')];
    expect(dialogs).toHaveLength(2);
    for (const [index, dialog] of dialogs.entries()) {
      const title = document.getElementById(
        dialog.getAttribute("aria-labelledby")!,
      );
      const description = document.getElementById(
        dialog.getAttribute("aria-describedby")!,
      );
      expect(title?.textContent).toBe(
        index === 0 ? "First title" : "Second title",
      );
      expect(description?.textContent).toBe(
        index === 0 ? "First description" : "Second description",
      );
      expect(dialog.contains(title)).toBe(true);
    }
  },
);

it("keeps caller-supplied accessible labels and close behavior", async () => {
  const onClose = vi.fn();
  await act(async () =>
    root.render(
      <AdminModal
        aria-label="Custom name"
        heading="Title"
        description="Description"
        primaryLabel="Save"
        onClose={onClose}
      />,
    ),
  );
  const dialog = container.querySelector('[role="dialog"]')!;
  expect(dialog.getAttribute("aria-label")).toBe("Custom name");
  expect(dialog.hasAttribute("aria-labelledby")).toBe(false);
  await act(async () =>
    container
      .querySelector<HTMLButtonElement>('button[aria-label="닫기"]')!
      .click(),
  );
  expect(onClose).toHaveBeenCalledOnce();
});
