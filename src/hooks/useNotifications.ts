"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { io, Socket } from "socket.io-client";

import { API_BASE_URL } from "@/lib/api/client";
import {
  getNotifications,
  readNotification,
  readAllNotifications,
  deleteNotification,
  NOTIFICATION_LIST_LIMIT,
  type AppNotification,
} from "@/lib/api/notification";
import { useAuthStore } from "@/stores/useAuthStore";

function subscribeToAuthHydration(onStoreChange: () => void) {
  const unsubscribeHydrate = useAuthStore.persist.onHydrate(onStoreChange);
  const unsubscribeFinishHydration =
    useAuthStore.persist.onFinishHydration(onStoreChange);

  return () => {
    unsubscribeHydrate();
    unsubscribeFinishHydration();
  };
}

// accessToken은 zustand persist로 비동기 복원되므로, 복원 전 첫 렌더 기준으로
// 소켓을 연결하면 인증에 실패함. hydration 완료 여부를 별도로 구독해서 대기함
function useAuthHydrated() {
  return useSyncExternalStore(
    subscribeToAuthHydration,
    () => useAuthStore.persist.hasHydrated(),
    () => false,
  );
}

/**
 * 로그인 유저의 알림 목록/안 읽은 개수를 관리하고, `/notifications` 소켓 네임스페이스에
 * 접속해 실시간으로 새 알림을 받는 훅.
 * - `/chat`과 달리 로그인 상태인 동안 계속 연결을 유지하는 영구 소켓임
 * - 헤더 등 여러 곳에서 동시에 쓰일 수 있으므로, 배지에 필요한 unreadCount와
 *   목록을 함께 반환함
 */
export function useNotifications() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isLoggedIn = !!accessToken;
  const isAuthHydrated = useAuthHydrated();

  // 로그아웃 순간 이전 세션의 알림이 잠깐이라도 보이면 안 되므로, 실제 데이터는
  // 내부 state에만 두고 반환값은 isLoggedIn에 따라 파생시킴
  const [rawNotifications, setNotifications] = useState<AppNotification[]>([]);
  const [rawUnreadCount, setUnreadCount] = useState(0);
  const notifications = useMemo(
    () => (isLoggedIn ? rawNotifications : []),
    [isLoggedIn, rawNotifications],
  );
  const unreadCount = isLoggedIn ? rawUnreadCount : 0;

  useEffect(() => {
    if (!isAuthHydrated || !isLoggedIn) return;

    let cancelled = false;

    getNotifications()
      .then((data) => {
        if (cancelled) return;
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      })
      .catch((err) => {
        console.error("알림 목록 조회 실패:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthHydrated, isLoggedIn]);

  useEffect(() => {
    if (!isAuthHydrated || !isLoggedIn) return;

    // socket.io는 빈 문자열로 연결할 수 없어, API_BASE_URL이 비어 있을 때만
    // 로컬 개발 서버 주소로 대체함
    const apiBase = API_BASE_URL || "http://localhost:8000";

    const socket: Socket = io(`${apiBase}/notifications`, {
      auth: { token: accessToken },
    });

    socket.on("notification", (data: AppNotification) => {
      // REST 목록 조회도 최근 10개까지만 주는 것과 동일하게 맞춤
      setNotifications((prev) =>
        [data, ...prev].slice(0, NOTIFICATION_LIST_LIMIT),
      );
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthHydrated, isLoggedIn, accessToken]);

  // Promise를 반환해서, 호출부가 페이지 이동을 이 요청이 끝난 뒤로 미룰 수 있게 함
  // (먼저 이동해버리면 언마운트로 PATCH 요청이 씹히는 경쟁 상태가 생김)
  const markAsRead = useCallback(
    async (notificationId: string) => {
      // 이미 읽은 알림이면 안 읽은 개수를 또 깎지 않도록, 현재 목록에서 먼저 확인함
      const target = notifications.find((n) => n.id === notificationId);
      if (!target || target.readAt) return;

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, readAt: new Date().toISOString() }
            : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await readNotification(notificationId);
      } catch (err) {
        console.error("알림 읽음 처리 실패:", err);
      }
    },
    [notifications],
  );

  // 화면에 보이는 최신 10개만 개별로 읽음 처리하면 그 뒤에 쌓인 알림은 서버에
  // 안 읽음으로 남아 배지가 재등장하므로, 목록을 순회하지 않고 서버에 전체
  // 읽음 처리를 한 번만 요청함
  const markAllAsRead = useCallback(async () => {
    const readAt = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.readAt ? notification : { ...notification, readAt },
      ),
    );
    setUnreadCount(0);

    try {
      await readAllNotifications();
    } catch (err) {
      console.error("알림 전체 읽음 처리 실패:", err);
    }
  }, []);

  const dismissNotification = useCallback(
    async (notificationId: string) => {
      const target = notifications.find((n) => n.id === notificationId);
      if (!target) return;

      if (!target.readAt) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

      try {
        await deleteNotification(notificationId);
      } catch (err) {
        console.error("알림 삭제 실패:", err);
      }
    },
    [notifications],
  );

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  };
}
