import {
  NOTIFICATION_LIST_LIMIT,
  type AppNotification,
} from "./api/notification";

export function mergeNotificationSnapshot(
  snapshot: { notifications: AppNotification[]; unreadCount: number },
  arrivals: AppNotification[],
) {
  const known = new Set(snapshot.notifications.map((item) => item.id));
  const missing = arrivals.filter((item) => {
    if (known.has(item.id)) return false;
    known.add(item.id);
    return true;
  });
  return {
    notifications: [...missing, ...snapshot.notifications].slice(
      0,
      NOTIFICATION_LIST_LIMIT,
    ),
    unreadCount:
      snapshot.unreadCount + missing.filter((item) => !item.readAt).length,
  };
}
