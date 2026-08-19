"use client";

import type { ReactNode } from "react";
import { useEffect, useState, useSyncExternalStore } from "react";

import { useMutation } from "@tanstack/react-query";
import { LogOut, Moon, Sun, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { AppLayout } from "./AppLayout";

import { BottomNavigation } from "@/components/ui/BottomNavigation/BottomNavigation";
import { Header } from "@/components/ui/Header/Header";
import { usePathname, useRouter } from "@/i18n/navigation";
import { logout } from "@/lib/api/auth";
import { cn } from "@/lib/utils";
import { useTheme } from "@/providers/theme-provider";
import { useAuthStore } from "@/stores/useAuthStore";

interface MainShellProps {
  children: ReactNode;
}

const languageOptions = [
  { locale: "ko", labelKey: "korean" },
  { locale: "en", labelKey: "english" },
] as const;

const keepMenuOpenKey = "yogoda:keep-menu-open-after-locale-change";

const subscribe = () => () => {};

function shouldKeepMenuOpenAfterLocaleChange() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.sessionStorage.getItem(keepMenuOpenKey) === "true";
}

function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export function MainShell({ children }: MainShellProps) {
  const mounted = useMounted();
  const [isMenuOpen, setIsMenuOpen] = useState(
    shouldKeepMenuOpenAfterLocaleChange,
  );

  const { resolvedTheme, setTheme } = useTheme();
  const menu = useTranslations("Menu");
  const navigation = useTranslations("Navigation");

  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const accessToken = useAuthStore((state) => state.accessToken);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const isDark = mounted && resolvedTheme === "dark";

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    // locale 전환 직후 첫 렌더에서만 메뉴 열림 상태 유지함
    window.sessionStorage.removeItem(keepMenuOpenKey);
  }, [isMenuOpen]);

  const closeMenu = () => {
    // 닫는 순간 내부 버튼이 focus를 잡고 있으면 inert 적용 시 브라우저 접근성 경고가 남
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    setIsMenuOpen(false);
  };

  const changeLocale = (nextLocale: "ko" | "en") => {
    if (nextLocale === locale) {
      return;
    }

    window.sessionStorage.setItem(keepMenuOpenKey, "true");

    router.replace(pathname, {
      locale: nextLocale,
    });
  };

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const { mutate: requestLogout } = useMutation({
    mutationFn: logout,
    onSettled: () => {
      // 서버 로그아웃 요청 성공/실패와 무관하게 로컬 로그인 상태는 정리함
      clearAuth();
      closeMenu();
      router.push("/");
    },
  });

  return (
    <>
      <AppLayout
        header={<Header onMenuClick={() => setIsMenuOpen(true)} />}
        bottomNavigation={<BottomNavigation />}
      >
        {children}
      </AppLayout>

      <div
        inert={!isMenuOpen}
        className={cn(
          // exit animation을 위해 DOM은 유지하고, 닫힌 상태의 focus/interaction은 inert로 차단함
          "fixed inset-0 z-50 transition-opacity duration-200 ease-out",
          isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <button
          type="button"
          aria-label={navigation("closeMenu")}
          disabled={!isMenuOpen}
          onClick={closeMenu}
          className="absolute inset-0 bg-black/40"
        />

        <aside
          role="dialog"
          aria-modal="true"
          aria-label={menu("title")}
          className={cn(
            "absolute right-0 top-0",
            "flex h-full w-[350px] max-w-[calc(100vw-40px)] flex-col",
            "border-l border-border-default bg-surface px-2xl pb-2xl pt-lg shadow-lg",
            "transition-transform duration-[250ms] ease-out",
            isMenuOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex h-[48px] items-center justify-between">
            <strong className="font-sans text-title-18-bold text-text-primary">
              {menu("title")}
            </strong>

            <button
              type="button"
              aria-label={navigation("closeMenu")}
              onClick={closeMenu}
              className="flex size-10 items-center justify-center text-text-primary"
            >
              <X size={24} />
            </button>
          </div>

          <div className="mt-2xl flex flex-1 flex-col gap-2xl">
            <section className="space-y-sm">
              <p className="font-sans text-caption-12-bold text-text-tertiary">
                {menu("language")}
              </p>

              <div className="grid grid-cols-2 gap-xs rounded-lg bg-surface-subtle p-xs">
                {languageOptions.map((option) => {
                  const isSelected = locale === option.locale;

                  return (
                    <button
                      key={option.locale}
                      type="button"
                      onClick={() => changeLocale(option.locale)}
                      className={cn(
                        "h-[40px] rounded-sm font-sans text-label-14-bold transition-colors",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary",
                        isSelected
                          ? "bg-surface text-text-brand shadow-sm"
                          : "text-text-secondary",
                      )}
                    >
                      {menu(option.labelKey)}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-sm">
              <p className="font-sans text-caption-12-bold text-text-tertiary">
                {menu("theme")}
              </p>

              <button
                type="button"
                onClick={toggleTheme}
                className={cn(
                  "flex h-[56px] w-full items-center justify-between rounded-lg bg-surface-subtle px-lg",
                  "font-sans text-label-14-bold text-text-primary transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary",
                )}
              >
                <span className="flex items-center gap-md">
                  <span className="flex size-[32px] items-center justify-center rounded-sm bg-brand-soft text-text-brand">
                    {isDark ? <Moon size={18} /> : <Sun size={18} />}
                  </span>
                  <span>{isDark ? menu("darkMode") : menu("lightMode")}</span>
                </span>

                <span
                  data-theme-transition
                  aria-hidden="true"
                  className={cn(
                    "flex h-[24px] w-[40px] items-center rounded-full p-[2px]",
                    "transition-colors duration-300 ease-out",
                    isDark ? "bg-action-primary" : "bg-border-strong",
                  )}
                >
                  <span
                    data-theme-transition
                    className={cn(
                      "size-[20px] rounded-full bg-surface shadow-sm",
                      "transition-transform duration-300 ease-out",
                      isDark ? "translate-x-[16px]" : "translate-x-0",
                    )}
                  />
                </span>
              </button>
            </section>

            {accessToken && (
              <button
                type="button"
                onClick={() => requestLogout()}
                className={cn(
                  "mt-auto flex h-[48px] w-full items-center justify-center gap-sm rounded-lg bg-error-soft",
                  "font-sans text-label-14-bold text-error transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary",
                )}
              >
                <LogOut size={18} />
                {menu("logout")}
              </button>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
