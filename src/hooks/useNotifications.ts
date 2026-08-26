"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { io, Socket } from "socket.io-client";

import { API_BASE_URL } from "@/lib/api/client";
import {
  getNotifications,
  readNotification,
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

/*
 * accessToken은 zustand persist로 localStorage에서 비동기 복원(hydration)되므로,
 * 새로고침 직후 첫 렌더의 로그인 여부만 보고 소켓 연결을 시도하면 accessToken이
 * 아직 없어 인증에 실패함. hydration 완료 여부를 별도로 구독해서 대기함
 */
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

  /*
   * 로그아웃 상태에서 이전 로그인 세션의 알림이 잠깐이라도 보이면 안 되므로,
   * 실제 데이터는 내부 state에만 담아두고 훅이 반환하는 값은 아래에서
   * isLoggedIn 여부에 따라 파생시킴 (effect 안에서 로그아웃 시점에 별도로
   * setState를 호출해 초기화할 필요가 없어짐)
   */
  const [rawNotifications, setNotifications] = useState<AppNotification[]>([]);
  const [rawUnreadCount, setUnreadCount] = useState(0);
  const notifications = isLoggedIn ? rawNotifications : [];
  const unreadCount = isLoggedIn ? rawUnreadCount : 0;

  // 로그인 상태가 확정되면 최초 알림 목록/안 읽은 개수를 REST로 불러옴
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

  // 로그인 상태인 동안 `/notifications` 네임스페이스에 영구 연결해 실시간 알림을 수신함
  useEffect(() => {
    if (!isAuthHydrated || !isLoggedIn) return;

    // socket.io는 REST(fetch)와 달리 빈 문자열로는 연결할 수 없어, client.ts와
    // 같은 API_BASE_URL이 비어 있을 때만 로컬 개발 서버 주소로 대체함
    const apiBase = API_BASE_URL || "http://localhost:8000";

    const socket: Socket = io(`${apiBase}/notifications`, {
      transports: ["websocket"],
      auth: { token: accessToken },
    });

    socket.on("notification", (data: AppNotification) => {
      // 서버의 목록 조회도 최근 10개까지만 주므로, 실시간으로 쌓일 때도 같은
      // 개수를 넘지 않게 잘라서 REST로 새로고침했을 때와 동일한 상태를 유지함
      setNotifications((prev) =>
        [data, ...prev].slice(0, NOTIFICATION_LIST_LIMIT),
      );
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthHydrated, isLoggedIn, accessToken]);

  /*
   * 읽음 처리 요청이 서버에 반영되는 걸 호출부(알림 클릭 핸들러)가 기다릴 수 있도록
   * Promise를 반환함. 화면(안 읽은 개수/점 표시)은 요청 완료를 기다리지 않고 먼저
   * 갱신하되, 알림을 탭했을 때의 페이지 이동만큼은 이 Promise가 끝난 뒤 이뤄지게 해서
   * "이동으로 컴포넌트가 언마운트되며 PATCH 요청이 씹히는" 경쟁 상태를 막음
   */
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

  /*
   * 알림을 목록에서 삭제함. 안 읽은 알림이면 unreadCount도 함께 감소시킴.
   * Optimistic update 방식으로 화면을 먼저 갱신하고 서버 요청을 보냄
   */
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

  return { notifications, unreadCount, markAsRead, dismissNotification };
}
