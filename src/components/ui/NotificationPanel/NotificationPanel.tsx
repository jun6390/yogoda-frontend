"use client";

import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";

import type { AppNotification } from "@/lib/api/notification";
import { cn } from "@/lib/utils";

interface NotificationPanelProps {
  notifications: AppNotification[];
  onClose: () => void;
  // 읽음 처리(서버 반영)까지 끝난 뒤에 페이지 이동을 해야 하므로 Promise를 반환받음
  onNotificationClick: (notification: AppNotification) => Promise<void>;
}

/**
 * 헤더의 벨 아이콘을 누르면 그 아래에 뜨는 알림 목록 패널.
 * 알림을 클릭하면 읽음 처리를 먼저 완료한 뒤, link가 있으면 해당 경로로 이동함
 * (Link의 클라이언트 네비게이션과 동시에 처리하면, 이동으로 컴포넌트가 언마운트되며
 * 읽음 처리 요청이 씹힐 수 있어 버튼 클릭 → await → 이동 순서로 명시적으로 처리함)
 */
export function NotificationPanel({
  notifications,
  onClose,
  onNotificationClick,
}: NotificationPanelProps) {
  const notificationT = useTranslations("Notifications");

  return (
    <>
      {/* 패널 바깥을 클릭하면 닫히도록 하는 투명 오버레이 */}
      <button
        type="button"
        aria-label={notificationT("close")}
        onClick={onClose}
        className="absolute inset-0 z-40"
      />

      <div
        role="dialog"
        aria-label={notificationT("title")}
        className={cn(
          "absolute right-4 top-[60px] z-50",
          "flex max-h-[420px] w-[320px] flex-col overflow-hidden rounded-lg",
          "border border-border-default bg-surface shadow-lg",
        )}
      >
        <div className="flex h-[48px] shrink-0 items-center px-lg">
          <strong className="font-sans text-label-14-bold text-text-primary">
            {notificationT("title")}
          </strong>
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-sm py-3xl text-center">
            <Bell
              aria-hidden="true"
              size={28}
              strokeWidth={1.5}
              className="text-icon-subtle"
            />
            <p className="font-sans text-body-14-regular text-text-tertiary">
              {notificationT("empty")}
            </p>
          </div>
        ) : (
          <ul className="flex-1 overflow-y-auto">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className="border-b border-border-subtle last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() => {
                    void onNotificationClick(notification);
                  }}
                  className={cn(
                    "flex w-full items-center gap-sm px-lg py-md text-left",
                    "hover:bg-surface-subtle",
                    "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-action-primary",
                  )}
                >
                  {/* 안 읽음 표시 점. 헤더 벨 아이콘의 뱃지와 같은 의미의 UI라 크기/색을 맞춤 */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-[7px] shrink-0 rounded-full",
                      !notification.readAt && "bg-action-primary",
                    )}
                  />
                  <div className="flex-1">
                    <p className="font-sans text-label-14-bold text-text-primary">
                      {notification.title}
                    </p>
                    <p className="mt-xs font-sans text-caption-13-regular text-text-secondary">
                      {notification.body}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
