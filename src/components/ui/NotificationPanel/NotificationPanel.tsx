"use client";

import type { ElementType } from "react";
import { useCallback, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Bell, Bot, Tag, Calendar, MessageCircle, Trash2 } from "lucide-react";

import type { AppNotification, NotificationType } from "@/lib/api/notification";
import { cn } from "@/lib/utils";

// 타입별로 성격에 맞는 색을 따로 둬서 목록에서 한눈에 구분되게 함
const NOTIFICATION_META: Record<
  NotificationType,
  { icon: ElementType; chipClassName: string }
> = {
  coupon_expiring: {
    icon: Tag,
    chipClassName: "bg-warning/15 text-warning",
  },
  attendance_reminder: {
    icon: Calendar,
    chipClassName: "bg-info/15 text-info",
  },
  consultation_incomplete: {
    icon: MessageCircle,
    chipClassName: "bg-brand-soft text-icon-brand",
  },
  usage_pattern_changed: {
    icon: Bot,
    chipClassName: "bg-brand-soft text-icon-brand",
  },
};

const DEFAULT_NOTIFICATION_META = {
  icon: Bell,
  chipClassName: "bg-surface-subtle text-icon-secondary",
};

function getNotificationMeta(type: string) {
  return (
    NOTIFICATION_META[type as NotificationType] ?? DEFAULT_NOTIFICATION_META
  );
}

const REVEAL_WIDTH = 76;

interface NotificationPanelProps {
  notifications: AppNotification[];
  onClose: () => void;
  /** 읽음 처리(서버 반영)까지 끝난 뒤 이동해야 해서 Promise를 반환받음 */
  onNotificationClick: (notification: AppNotification) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  /** 미전달 시 삭제 기능 비활성화 */
  onNotificationDelete?: (notification: AppNotification) => Promise<void>;
}

/**
 * 헤더의 벨 아이콘을 누르면 그 아래에 뜨는 알림 목록 패널.
 * - 알림 클릭: 읽음 처리 후 link 경로로 이동
 * - 좌로 스와이프: 삭제 버튼 노출 (iOS 스타일)
 */
export function NotificationPanel({
  notifications,
  onClose,
  onNotificationClick,
  onMarkAllAsRead,
  onNotificationDelete,
}: NotificationPanelProps) {
  const notificationT = useTranslations("Notifications");
  const locale = useLocale();
  const unreadCount = notifications.filter((n) => !n.readAt).length;
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      await onMarkAllAsRead();
    } finally {
      setIsMarkingAll(false);
    }
  };

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
          "flex max-h-[460px] w-[340px] flex-col overflow-hidden",
          "rounded-xl border border-border-default bg-surface shadow-lg",
        )}
      >
        <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-border-default px-lg">
          <div className="flex items-center gap-sm">
            <strong className="font-sans text-label-14-bold text-text-primary">
              {notificationT("title")}
            </strong>
            {unreadCount > 0 && (
              <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-action-primary px-[5px] font-sans text-micro-11-bold text-text-on-primary">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            type="button"
            disabled={isMarkingAll || unreadCount === 0}
            onClick={() => void handleMarkAllAsRead()}
            className="font-sans text-caption-12-bold text-text-brand disabled:cursor-default disabled:text-text-tertiary"
          >
            {isMarkingAll
              ? notificationT("markingAllAsRead")
              : notificationT("markAllAsRead")}
          </button>
        </div>

        {notifications.length === 0 ? (
          <NotificationEmptyState label={notificationT("empty")} />
        ) : (
          <ul className="flex-1 overflow-y-auto">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                locale={locale}
                onClick={() => void onNotificationClick(notification)}
                onDelete={
                  onNotificationDelete
                    ? () => onNotificationDelete(notification)
                    : undefined
                }
              />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

// ─── 서브 컴포넌트 ────────────────────────────────────────────────────────────

function NotificationItem({
  notification,
  locale,
  onClick,
  onDelete,
}: {
  notification: AppNotification;
  locale: string;
  onClick: () => void;
  onDelete?: () => Promise<void>;
}) {
  const meta = getNotificationMeta(notification.type);
  const Icon = meta.icon;
  const isUnread = !notification.readAt;

  const [offset, setOffset] = useState(0);
  const [isSnapping, setIsSnapping] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const offsetAtDragStartRef = useRef(0);
  const isDraggingRef = useRef(false);
  // true = 수평 스와이프, false = 수직 스크롤, null = 아직 판별 전
  const isHorizontalRef = useRef<boolean | null>(null);

  const snapTo = useCallback((target: number) => {
    setIsSnapping(true);
    setOffset(target);
    offsetAtDragStartRef.current = target;
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    offsetAtDragStartRef.current = offset;
    isDraggingRef.current = true;
    isHorizontalRef.current = null;
    setIsSnapping(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;

    const dx = e.touches[0].clientX - startXRef.current;
    const dy = e.touches[0].clientY - startYRef.current;

    // 첫 5px 이상 움직였을 때 방향 확정
    if (
      isHorizontalRef.current === null &&
      (Math.abs(dx) > 5 || Math.abs(dy) > 5)
    ) {
      isHorizontalRef.current = Math.abs(dx) > Math.abs(dy);
    }

    // 수직 스크롤로 판별되면 스와이프 처리 안 함
    if (!isHorizontalRef.current) return;

    const next = Math.min(
      0,
      Math.max(offsetAtDragStartRef.current + dx, -REVEAL_WIDTH),
    );
    setOffset(next);
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    if (!isHorizontalRef.current) return;

    if (offset < -(REVEAL_WIDTH / 2)) {
      snapTo(-REVEAL_WIDTH);
    } else {
      snapTo(0);
    }
  };

  const handleContentClick = () => {
    // 삭제 버튼이 열려 있으면 닫기만 함
    if (offset < 0) {
      snapTo(0);
      return;
    }
    onClick();
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete) return;
    // 아이템을 왼쪽으로 밀어내며 높이를 접는 exit 애니메이션
    setIsExiting(true);
    setTimeout(() => void onDelete(), 300);
  };

  return (
    <li
      className={cn(
        "relative overflow-hidden border-b border-border-default last:border-b-0",
        "transition-[max-height,opacity] duration-300 ease-out",
        isExiting ? "max-h-0 opacity-0" : "max-h-[120px] opacity-100",
      )}
    >
      {/* 뒤쪽 레이어: 삭제 버튼. 앞쪽 콘텐츠가 스와이프로 밀리면 드러남 */}
      {onDelete && (
        <button
          type="button"
          aria-label="알림 삭제"
          onClick={(e) => void handleDeleteClick(e)}
          className={cn(
            "absolute right-0 top-0 flex h-full w-[76px] flex-col items-center justify-center gap-[3px]",
            "bg-error text-text-on-primary transition-opacity",
            offset <= -(REVEAL_WIDTH / 2) ? "opacity-100" : "opacity-0",
          )}
        >
          <Trash2 size={20} strokeWidth={2} />
        </button>
      )}

      <button
        type="button"
        onClick={handleContentClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${offset}px)` }}
        className={cn(
          // 아이콘 앞 여백만 줄이기 위해 좌우 패딩을 분리함
          "relative flex w-full items-start gap-md py-md pl-md pr-lg text-left",
          "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-action-primary",
          isSnapping && !isExiting
            ? "transition-transform duration-200 ease-out"
            : isExiting
              ? "transition-transform duration-300 ease-in"
              : "transition-none",
          isUnread
            ? "bg-brand-soft hover:bg-brand-soft/70"
            : "bg-surface hover:bg-surface-subtle",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "mt-px flex size-9 shrink-0 items-center justify-center rounded-sm",
            meta.chipClassName,
          )}
        >
          <Icon size={20} strokeWidth={1.8} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-sm">
            <p
              className={cn(
                "font-sans text-label-14-bold",
                isUnread ? "text-text-primary" : "text-text-secondary",
              )}
            >
              {notification.title}
            </p>
            {/* 헤더 벨 아이콘 뱃지와 같은 의미라 크기/색을 맞춤 */}
            {isUnread && (
              <span
                aria-hidden="true"
                className="mt-[6px] size-[6px] shrink-0 rounded-full bg-action-primary"
              />
            )}
          </div>
          <p className="mt-xs font-sans text-caption-13-regular text-text-secondary">
            {notification.body}
          </p>
          <time
            dateTime={notification.createdAt}
            className="mt-xs block text-right font-sans text-micro-11-regular text-text-tertiary"
          >
            {formatNotificationDate(notification.createdAt, locale)}
          </time>
        </div>
      </button>
    </li>
  );
}

function formatNotificationDate(value: string, locale: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  const now = new Date();
  const includeYear = date.getFullYear() !== now.getFullYear();

  return new Intl.DateTimeFormat(locale, {
    ...(includeYear && { year: "numeric" }),
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function NotificationEmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-md py-3xl text-center">
      <span
        aria-hidden="true"
        className="flex size-[52px] items-center justify-center rounded-full bg-surface-subtle"
      >
        <Bell size={22} strokeWidth={1.5} className="text-icon-secondary" />
      </span>
      <p className="font-sans text-body-14-regular text-text-tertiary">
        {label}
      </p>
    </div>
  );
}
