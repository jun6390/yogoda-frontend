"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useMutation } from "@tanstack/react-query";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { FigmaImage } from "@/components/ui/FigmaImage/FigmaImage";
import { ADMIN_NAV_ITEMS } from "@/lib/admin/navigation";
import { logout } from "@/lib/api/auth";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";

export function AdminSidebar() {
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
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-border-default bg-surface px-lg py-2xl">
      <div className="flex items-center gap-sm px-sm">
        <FigmaImage
          alt="Yogoda"
          src="/yogoda-logo.svg"
          className="h-[20px] w-auto"
        />
        <span className="font-sans text-caption-12-bold tracking-wide text-text-tertiary">
          ADMIN
        </span>
      </div>

      <nav className="mt-2xl flex flex-1 flex-col gap-xs">
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive = pathname?.startsWith(item.href) ?? false;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-[44px] items-center gap-sm rounded-lg px-md",
                "font-sans text-label-14-bold transition-colors",
                isActive
                  ? "bg-brand-soft text-text-brand"
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
          <span className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-action-primary font-sans text-label-14-bold text-text-on-primary">
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
    </aside>
  );
}
