import { apiFetch } from "./client";

export type NotificationType =
  "coupon_expiring" | "attendance_reminder" | "consultation_incomplete";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

// 백엔드 notification.service.ts의 NOTIFICATION_LIST_LIMIT과 동일한 값.
// 소켓으로 실시간 알림이 들어올 때 프론트 목록도 이 개수를 넘지 않게 자르는 데 씀
export const NOTIFICATION_LIST_LIMIT = 10;

/**
 * 로그인 사용자의 알림 목록(최신순 최대 10개)과 안 읽은 개수를 함께 조회합니다.
 */
export async function getNotifications(): Promise<NotificationListResponse> {
  return apiFetch<NotificationListResponse>("/api/notifications");
}

/**
 * 알림 하나를 읽음 처리합니다.
 */
export async function readNotification(notificationId: string): Promise<void> {
  await apiFetch<{ message: string }>(
    `/api/notifications/${notificationId}/read`,
    { method: "PATCH" },
  );
}
