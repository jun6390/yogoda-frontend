import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { NotificationPanel } from "../src/components/ui/NotificationPanel/NotificationPanel";
import messages from "../messages/en.json";
import type { AppNotification } from "../src/lib/api/notification";

let container: HTMLDivElement;
let root: Root;
const notification: AppNotification = {
  id: "one",
  title: "Test notification",
  body: "Body",
  type: "attendance_reminder",
  readAt: null,
  createdAt: "2026-09-03T00:00:00Z",
  link: "/missions",
};

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

async function render(
  overrides: Partial<React.ComponentProps<typeof NotificationPanel>> = {},
) {
  await act(async () =>
    root.render(
      <NextIntlClientProvider
        locale="en"
        messages={messages}
        timeZone="Asia/Seoul"
      >
        <NotificationPanel
          notifications={[notification]}
          onClose={() => {}}
          onNotificationClick={async () => {}}
          onMarkAllAsRead={async () => {}}
          {...overrides}
        />
      </NextIntlClientProvider>,
    ),
  );
}
const markAllButton = () =>
  [...container.querySelectorAll("button")].find(
    (button) => button.textContent === messages.Notifications.markAllAsRead,
  )!;

it("shows loading rather than an empty inbox while fetching", async () => {
  await render({ notifications: [], isLoading: true });
  expect(
    container.querySelector('[role="status"]')?.getAttribute("aria-label"),
  ).toBe(messages.Notifications.loading);
  expect(container.textContent).not.toContain(messages.Notifications.empty);
  expect(markAllButton().disabled).toBe(true);
});

it("shows a retry action instead of claiming the inbox is empty on failure", async () => {
  const onRetry = vi.fn();
  await render({ notifications: [], loadError: true, onRetry });
  expect(container.querySelector('[role="alert"]')?.textContent).toContain(
    messages.Notifications.loadError,
  );
  expect(container.textContent).not.toContain(messages.Notifications.empty);
  const retry = [...container.querySelectorAll("button")].find(
    (button) => button.textContent === messages.Notifications.retry,
  )!;
  await act(async () => retry.click());
  expect(onRetry).toHaveBeenCalledOnce();
});

it("disables read-all when there are no unread notifications", async () => {
  await render({
    notifications: [{ ...notification, readAt: "2026-09-03" }],
    totalUnreadCount: 0,
  });
  expect(markAllButton().disabled).toBe(true);
});
it("can read older notifications even when the visible page is already read", async () => {
  await render({
    notifications: [{ ...notification, readAt: "2026-09-03" }],
    totalUnreadCount: 2,
  });
  expect(markAllButton().disabled).toBe(false);
});
it("shows read-all failure and allows another attempt", async () => {
  await render({
    onMarkAllAsRead: async () => {
      throw new Error("offline");
    },
  });
  await act(async () => markAllButton().click());
  expect(container.querySelector('[role="alert"]')?.textContent).toBe(
    messages.Notifications.updateError,
  );
  expect(markAllButton().disabled).toBe(false);
});
it("restores a notification after deletion fails", async () => {
  await render({
    onNotificationDelete: async () => {
      throw new Error("offline");
    },
  });
  const deleteButton = container.querySelector<HTMLButtonElement>(
    `button[aria-label="${messages.Notifications.delete}"]`,
  )!;
  await act(async () => deleteButton.click());
  expect(container.querySelector("li")?.className).toContain("opacity-100");
  expect(container.querySelector('[role="alert"]')?.textContent).toBe(
    messages.Notifications.updateError,
  );
});
