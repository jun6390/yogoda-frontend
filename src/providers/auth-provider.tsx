"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ApiError, refreshAccessToken } from "@/lib/api/client";
import { AUTH_COOKIE, useAuthStore } from "@/stores/useAuthStore";
import { PageSpinner } from "@/components/ui/Spinner/Spinner";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { useQueryClient } from "@tanstack/react-query";

let initialization: Promise<void> | null = null;
export function initializeAuth() {
  if (useAuthStore.getState().isReady) return Promise.resolve();
  if (!initialization) {
    initialization = (async () => {
      let legacySession = false;
      try {
        legacySession = Boolean(localStorage.getItem("auth"));
        localStorage.removeItem("auth");
        if (legacySession)
          document.cookie = `${AUTH_COOKIE}=true; path=/; max-age=31536000; samesite=lax`;
      } catch {
        /* Authentication does not depend on Web Storage. */
      }
      const hasSessionHint = document.cookie
        .split(";")
        .some((cookie) => cookie.trim() === `${AUTH_COOKIE}=true`);
      if (!hasSessionHint && !legacySession) {
        useAuthStore.setState({ isReady: true });
        return;
      }
      try {
        await refreshAccessToken();
      } catch (error) {
        if (
          error instanceof ApiError &&
          (error.status === 401 || error.status === 403)
        )
          return;
        if (useAuthStore.getState().isReady) return;
        throw error;
      }
    })().finally(() => {
      initialization = null;
    });
  }
  return initialization;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const ready = useAuthStore((state) => state.isReady);
  const [error, setError] = useState(false);
  const restore = () => {
    setError(false);
    void initializeAuth().catch(() => setError(true));
  };
  useEffect(() => {
    let active = true;
    void initializeAuth().catch(() => {
      if (active) setError(true);
    });
    return () => {
      active = false;
    };
  }, []);
  useEffect(
    () =>
      useAuthStore.subscribe((state, previous) => {
        if (state.user?.userId !== previous.user?.userId) queryClient.clear();
      }),
    [queryClient],
  );
  if (!ready)
    return error ? (
      <ErrorState
        title="로그인 상태를 확인하지 못했어요"
        onRetry={restore}
        retryLabel="다시 시도"
      />
    ) : (
      <PageSpinner />
    );
  return children;
}
