"use client";

import { useState } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useMutation } from "@tanstack/react-query";
import { Menu, X } from "lucide-react";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { FigmaImage } from "@/components/ui/FigmaImage/FigmaImage";
import { ADMIN_NAV_ITEMS } from "@/lib/admin/navigation";
import { logout } from "@/lib/api/auth";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";

interface SidebarBodyProps {
  onNavigate?: () => void;
}

function SidebarBody({ onNavigate }: SidebarBodyProps) {
  const pathname = usePathname();
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const { mutate: requestLogout, isPending: isPendingLogout } = useMutation({
    mutationFn: logout,
    onSettled: () => {
      clearAuth();
      router.replace("/ko/login");
    },
  });

  return (
    <>
      <Link
        href="/"
        aria-label="메인 화면으로 이동"
        onClick={onNavigate}
        className="flex items-center gap-sm px-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
      >
        <FigmaImage alt="" src="/yogoda-logo.svg" className="h-5 w-auto" />
        <span className="font-sans text-caption-12-bold tracking-wide text-text-tertiary">
          ADMIN
        </span>
      </Link>

      <nav className="mt-2xl flex flex-1 flex-col gap-xs">
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive = pathname?.startsWith(item.href) ?? false;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex h-11 items-center gap-sm rounded-lg px-md",
                "font-sans text-label-14-bold transition-colors",
                isActive
                  ? "bg-surface-subtle text-text-primary"
                  : "text-text-secondary hover:bg-surface-subtle hover:text-text-primary",
              )}
            >
              <Icon aria-hidden="true" size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-lg border-t border-border-default pt-lg">
        <div className="flex items-center gap-sm px-sm">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-action-primary font-sans text-label-14-bold text-text-on-primary">
            {user?.name?.slice(0, 1) ?? "?"}
          </span>

          <div className="min-w-0">
            <p className="truncate font-sans text-label-14-bold text-text-primary">
              {user?.name ?? "관리자"}
            </p>
            <p className="truncate font-sans text-caption-12-regular text-text-tertiary">
              운영 관리자
            </p>
          </div>
        </div>

        <LogoutButton
          label="로그아웃"
          loadingLabel="로그아웃 중..."
          loading={isPendingLogout}
          onClick={() => requestLogout()}
        />
      </div>
    </>
  );
}

export function AdminSidebar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      {/*
        md 미만에서는 고정폭 사이드바 대신 상단바 + 오프캔버스 메뉴로 전환함.
        패널이 왼쪽에서 나오므로(데스크톱 사이드바 자리를 그대로 씀), 여는 아이콘도
        왼쪽에 둬서 "누른 자리에서 패널이 나온다"는 방향이 어긋나지 않게 함.
        로고는 여기 안 두고 데스크톱 사이드바에만 둠 — 반응형 전환 때 로고 위치가
        왔다갔다 하는 걸 막기 위함. 로고/홈 이동은 패널을 열면(SidebarBody) 여전히 가능함
      */}
      <div className="flex h-14 shrink-0 items-center border-b border-border-default bg-surface px-lg md:hidden">
        <button
          type="button"
          aria-label="메뉴 열기"
          onClick={() => setIsMenuOpen(true)}
          className="flex size-touch shrink-0 items-center justify-center text-text-primary"
        >
          <Menu aria-hidden="true" size={22} />
        </button>
      </div>

      <div
        inert={!isMenuOpen}
        className={cn(
          "fixed inset-0 z-50 transition-opacity duration-200 ease-out md:hidden",
          isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <button
          type="button"
          aria-label="메뉴 닫기"
          disabled={!isMenuOpen}
          onClick={() => setIsMenuOpen(false)}
          className="absolute inset-0 bg-black/40"
        />

        <aside
          role="dialog"
          aria-modal="true"
          aria-label="관리자 메뉴"
          className={cn(
            "absolute left-0 top-0",
            "flex h-full w-65 max-w-[calc(100vw-40px)] flex-col",
            "border-r border-border-default bg-surface px-lg py-2xl",
            "transition-transform duration-250 ease-out",
            isMenuOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <button
            type="button"
            aria-label="메뉴 닫기"
            onClick={() => setIsMenuOpen(false)}
            className="ml-auto flex size-touch items-center justify-center text-text-primary"
          >
            <X aria-hidden="true" size={20} />
          </button>

          <SidebarBody onNavigate={() => setIsMenuOpen(false)} />
        </aside>
      </div>

      <aside className="hidden h-full w-65 shrink-0 flex-col border-r border-border-default bg-surface px-lg py-2xl md:flex">
        <SidebarBody />
      </aside>
    </>
  );
}
