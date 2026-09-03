"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { useAuthStore } from "@/stores/useAuthStore";
import { useHydrated } from "@/hooks/useHydrated";

interface AdminGuardProps {
  children: ReactNode;
}

const ADMIN_ROLE = "admin";
const LOGIN_PATH = "/ko/login";
const UNAUTHORIZED_PATH = "/ko";

/*
 * zustand persist는 localStorage 값을 클라이언트 마운트 이후에 채워서
 * 첫 렌더에는 항상 로그아웃 상태로 보임 (SSR과의 hydration mismatch 방지 목적)
 * mounted 이전에 role 검사를 하면 관리자도 순간적으로 튕겨나가므로 대기가 필요함
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const mounted = useHydrated();
  const router = useRouter();

  const accessToken = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.user?.role);

  const isAuthorized = mounted && Boolean(accessToken) && role === ADMIN_ROLE;

  useEffect(() => {
    if (!mounted) {
      return;
    }

    if (!accessToken) {
      router.replace(LOGIN_PATH);
      return;
    }

    if (role !== ADMIN_ROLE) {
      router.replace(UNAUTHORIZED_PATH);
    }
  }, [mounted, accessToken, role, router]);

  if (!isAuthorized) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-background">
        <p className="font-sans text-body-14-regular text-text-secondary">
          권한을 확인하는 중이에요...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
