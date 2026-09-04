"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

import {
  API_BASE_URL,
  isAccessTokenNearExpiry,
  refreshAccessToken,
} from "@/lib/api/client";
import {
  getNotifications,
  readNotification,
  readAllNotifications,
  deleteNotification,
  NOTIFICATION_LIST_LIMIT,
  type AppNotification,
} from "@/lib/api/notification";
import { useAuthStore } from "@/stores/useAuthStore";
import { mergeNotificationSnapshot } from "@/lib/notification-state";
import { useAuthHydrated } from "./useAuthHydrated";

/**
 * 로그인 유저의 알림 목록/안 읽은 개수를 관리하고, `/notifications` 소켓 네임스페이스에
 * 접속해 실시간으로 새 알림을 받는 훅.
 * - `/chat`과 달리 로그인 상태인 동안 계속 연결을 유지하는 영구 소켓임
 * - 헤더 등 여러 곳에서 동시에 쓰일 수 있으므로, 배지에 필요한 unreadCount와
 *   목록을 함께 반환함
 */
export function useNotifications() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const userId = useAuthStore((state) => state.user?.userId);
  const isLoggedIn = !!accessToken;
  const isAuthHydrated = useAuthHydrated();

  // 로그아웃 순간 이전 세션의 알림이 잠깐이라도 보이면 안 되므로, 실제 데이터는
  // 내부 state에만 두고 반환값은 isLoggedIn에 따라 파생시킴
  const [rawNotifications, setNotifications] = useState<AppNotification[]>([]);
  const [rawUnreadCount, setUnreadCount] = useState(0);
  const [ownerId, setOwnerId] = useState<string>();
  const pending = useRef(false);
  const arrivals = useRef<AppNotification[]>([]);
  const dataOwner = useRef<string | undefined>(undefined);
  const seenIds = useRef(new Set<string>());
  const mutationVersion = useRef(0);
  const [reloadAttempt, setReloadAttempt] = useState(0);
  const loadKey = `${userId}:${accessToken}:${reloadAttempt}`;
  const [loadResult, setLoadResult] = useState<{
    key: string;
    failed: boolean;
  } | null>(null);
  const isLoading = isLoggedIn && loadResult?.key !== loadKey;
  const loadError =
    isLoggedIn && loadResult?.key === loadKey && loadResult.failed;
  const retryLoading = useCallback(
    () => setReloadAttempt((attempt) => attempt + 1),
    [],
  );
  const notifications = useMemo(
    () => (isLoggedIn && ownerId === userId ? rawNotifications : []),
    [isLoggedIn, ownerId, userId, rawNotifications],
  );
  const unreadCount = isLoggedIn && ownerId === userId ? rawUnreadCount : 0;

  useEffect(() => {
    if (!isAuthHydrated || !isLoggedIn) return;

    let cancelled = false;
    const version = mutationVersion.current;
    const beforeRefresh = new Set(arrivals.current.map((item) => item.id));

    getNotifications()
      .then((data) => {
        if (!cancelled) setLoadResult({ key: loadKey, failed: false });
        if (cancelled || version !== mutationVersion.current) return;
        const merged = mergeNotificationSnapshot(
          data,
          arrivals.current.filter((item) => !beforeRefresh.has(item.id)),
        );
        setOwnerId(userId);
        dataOwner.current = userId;
        for (const item of merged.notifications) seenIds.current.add(item.id);
        setNotifications(merged.notifications);
        setUnreadCount(merged.unreadCount);
      })
      .catch((err) => {
        if (!cancelled) setLoadResult({ key: loadKey, failed: true });
        console.error("알림 목록 조회 실패:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthHydrated, isLoggedIn, accessToken, userId, loadKey]);

  useEffect(() => {
    if (!isAuthHydrated || !isLoggedIn) return;

    // socket.io는 빈 문자열로 연결할 수 없어, API_BASE_URL이 비어 있을 때만
    // 로컬 개발 서버 주소로 대체함
    const apiBase = API_BASE_URL || "http://localhost:8000";
    const dedupe = seenIds.current;

    const socket: Socket = io(`${apiBase}/notifications`, {
      auth: { token: accessToken },
    });

    socket.on("disconnect", (reason) => {
      if (
        reason !== "io server disconnect" ||
        !accessToken ||
        useAuthStore.getState().accessToken !== accessToken ||
        !isAccessTokenNearExpiry(accessToken, 0)
      )
        return;
      // Updating the store reconnects this effect with the renewed token.
      void refreshAccessToken().catch((error) => {
        console.error("알림 세션 갱신 실패:", error);
      });
    });

    socket.on("notification", (data: AppNotification) => {
      if (useAuthStore.getState().user?.userId !== userId) return;
      if (dedupe.has(data.id)) return;
      dedupe.add(data.id);
      const sameOwner = dataOwner.current === userId;
      dataOwner.current = userId;
      arrivals.current = [data, ...arrivals.current].slice(
        0,
        NOTIFICATION_LIST_LIMIT,
      );
      setOwnerId(userId);
      // REST 목록 조회도 최근 10개까지만 주는 것과 동일하게 맞춤
      setNotifications((prev) =>
        [
          data,
          ...(sameOwner ? prev : []).filter(
            (notification) => notification.id !== data.id,
          ),
        ].slice(0, NOTIFICATION_LIST_LIMIT),
      );
      setUnreadCount((prev) => (sameOwner ? prev : 0) + (data.readAt ? 0 : 1));
    });

    return () => {
      socket.disconnect();
      arrivals.current = [];
      dedupe.clear();
    };
  }, [isAuthHydrated, isLoggedIn, accessToken, userId]);

  // Promise를 반환해서, 호출부가 페이지 이동을 이 요청이 끝난 뒤로 미룰 수 있게 함
  // (먼저 이동해버리면 언마운트로 PATCH 요청이 씹히는 경쟁 상태가 생김)
  const markAsRead = useCallback(
    async (notificationId: string) => {
      // 이미 읽은 알림이면 안 읽은 개수를 또 깎지 않도록, 현재 목록에서 먼저 확인함
      const target = notifications.find((n) => n.id === notificationId);
      if (!target || target.readAt) return;
      if (pending.current) throw new Error("Notification update in progress");
      pending.current = true;
      mutationVersion.current += 1;
      try {
        await readNotification(notificationId);
        if (useAuthStore.getState().user?.userId !== userId) return;

        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? { ...n, readAt: new Date().toISOString() }
              : n,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } finally {
        pending.current = false;
      }
    },
    [notifications, userId],
  );

  // 화면에 보이는 최신 10개만 개별로 읽음 처리하면 그 뒤에 쌓인 알림은 서버에
  // 안 읽음으로 남아 배지가 재등장하므로, 목록을 순회하지 않고 서버에 전체
  // 읽음 처리를 한 번만 요청함
  const markAllAsRead = useCallback(async () => {
    if (pending.current) throw new Error("Notification update in progress");
    pending.current = true;
    mutationVersion.current += 1;
    try {
      await readAllNotifications();
      const beforeRefresh = new Set(arrivals.current.map((item) => item.id));
      const data = await getNotifications();
      if (useAuthStore.getState().user?.userId !== userId) return;
      const concurrentArrivals = arrivals.current.filter(
        (item) =>
          !beforeRefresh.has(item.id) &&
          !data.notifications.some(
            (notification) => notification.id === item.id,
          ),
      );
      const merged = mergeNotificationSnapshot(data, concurrentArrivals);
      setNotifications(merged.notifications);
      setUnreadCount(merged.unreadCount);
    } finally {
      pending.current = false;
    }
  }, [userId]);

  const dismissNotification = useCallback(
    async (notificationId: string) => {
      const target = notifications.find((n) => n.id === notificationId);
      if (!target) return;
      if (pending.current) throw new Error("Notification update in progress");
      pending.current = true;
      mutationVersion.current += 1;
      try {
        await deleteNotification(notificationId);
        if (useAuthStore.getState().user?.userId !== userId) return;

        if (!target.readAt) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      } finally {
        pending.current = false;
      }
    },
    [notifications, userId],
  );

  return {
    isLoading,
    loadError,
    retryLoading,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  };
}
