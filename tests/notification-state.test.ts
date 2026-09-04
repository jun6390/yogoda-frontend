import { expect, it, vi } from "vitest";
vi.mock("../src/lib/api/notification", () => ({ NOTIFICATION_LIST_LIMIT: 10 }));
import { mergeNotificationSnapshot } from "../src/lib/notification-state";
import type { AppNotification } from "../src/lib/api/notification";

const notification = (
  id: string,
  readAt: string | null = null,
): AppNotification => ({
  id,
  readAt,
  title: id,
  body: "",
  type: "attendance_reminder",
  createdAt: "2026-09-03T00:00:00Z",
  link: "/missions",
});

it("preserves a notification received during a read-all refresh", () => {
  const result = mergeNotificationSnapshot(
    { notifications: [notification("old", "2026-09-03")], unreadCount: 0 },
    [notification("new")],
  );
  expect(result.notifications.map((item) => item.id)).toEqual(["new", "old"]);
  expect(result.unreadCount).toBe(1);
});

it("does not double-count socket events included in the REST response", () => {
  const item = notification("same");
  const result = mergeNotificationSnapshot(
    { notifications: [item], unreadCount: 1 },
    [item, item],
  );
  expect(result.notifications).toHaveLength(1);
  expect(result.unreadCount).toBe(1);
});

it("keeps the list limit without truncating the total unread count", () => {
  const items = Array.from({ length: 10 }, (_, index) =>
    notification(String(index)),
  );
  const result = mergeNotificationSnapshot(
    { notifications: items, unreadCount: 30 },
    [notification("new")],
  );
  expect(result.notifications).toHaveLength(10);
  expect(result.unreadCount).toBe(31);
});
