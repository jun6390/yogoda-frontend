"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { useMutation } from "@tanstack/react-query";
import { Bell, MapPin, Moon, Sun, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { AppLayout } from "./AppLayout";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { BottomNavigation } from "@/components/ui/BottomNavigation/BottomNavigation";
import { Header } from "@/components/ui/Header/Header";
import { NotificationPanel } from "@/components/ui/NotificationPanel/NotificationPanel";
import { Switch } from "@/components/ui/Switch/Switch";
import { FloatingToast } from "@/components/ui/Toast/Toast";
import { useNotifications } from "@/hooks/useNotifications";
import { useHydrated } from "@/hooks/useHydrated";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppNotification } from "@/lib/api/notification";
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

function shouldKeepMenuOpenAfterLocaleChange() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.sessionStorage.getItem(keepMenuOpenKey) === "true";
}

export function MainShell({ children }: MainShellProps) {
  const mounted = useHydrated();
  const [isMenuOpen, setIsMenuOpen] = useState(
    shouldKeepMenuOpenAfterLocaleChange,
  );
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [locationPermission, setLocationPermission] =
    useState<PermissionState>("prompt");
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");
  const [permissionToast, setPermissionToast] = useState<string | null>(null);

  const {
    isLoading: notificationsLoading,
    loadError: notificationsLoadError,
    retryLoading: retryNotifications,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  } = useNotifications();

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

  useEffect(() => {
    if (!isMenuOpen) return;

    if ("Notification" in window) {
      queueMicrotask(() => setNotificationPermission(Notification.permission));
    }

    if (!("permissions" in navigator)) return;

    let permissionStatus: PermissionStatus | null = null;
    let cancelled = false;

    navigator.permissions
      .query({ name: "geolocation" })
      .then((status) => {
        if (cancelled) return;
        permissionStatus = status;
        setLocationPermission(status.state);
        status.onchange = () => setLocationPermission(status.state);
      })
      .catch(() => {
        // Some browsers expose Permissions but do not support this permission query.
      });

    return () => {
      cancelled = true;
      if (permissionStatus) permissionStatus.onchange = null;
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!permissionToast) return;
    const timer = window.setTimeout(() => setPermissionToast(null), 2500);
    return () => window.clearTimeout(timer);
  }, [permissionToast]);

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

  const toggleLocationPermission = () => {
    if (locationPermission !== "prompt") {
      setPermissionToast(menu("changePermissionInBrowser"));
      return;
    }

    if (!("geolocation" in navigator)) {
      setPermissionToast(menu("permissionUnsupported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => setLocationPermission("granted"),
      () => setLocationPermission("denied"),
      { timeout: 5000 },
    );
  };

  const toggleNotificationPermission = async () => {
    if (!("Notification" in window)) {
      setPermissionToast(menu("permissionUnsupported"));
      return;
    }

    if (notificationPermission !== "default") {
      setPermissionToast(menu("changePermissionInBrowser"));
      return;
    }

    try {
      setNotificationPermission(await Notification.requestPermission());
    } catch {
      setPermissionToast(menu("permissionUnsupported"));
    }
  };

  const { mutate: requestLogout, isPending: isPendingLogout } = useMutation({
    mutationFn: logout,
    onSettled: () => {
      // 서버 로그아웃 요청 성공/실패와 무관하게 로컬 로그인 상태는 정리함
      clearAuth();
      closeMenu();
      router.push("/");
    },
  });

  const handleNotificationClick = async (notification: AppNotification) => {
    /*
     * 읽음 처리가 서버에 반영되는 걸 먼저 기다린 뒤 이동해야, 페이지 전환으로
     * 컴포넌트가 언마운트되며 읽음 처리 요청이 씹히는 경쟁 상태를 막을 수 있음.
     * 이미 읽은 알림인지 여부는 markAsRead 내부에서 판단하므로 여기서 다시
     * 검사하지 않음
     */
    await markAsRead(notification.id);

    setIsNotificationPanelOpen(false);

    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleNotificationDelete = async (notification: AppNotification) => {
    await dismissNotification(notification.id);
  };

  return (
    <>
      <AppLayout
        header={
          <Header
            onMenuClick={() => setIsMenuOpen(true)}
            onNotificationsClick={() =>
              setIsNotificationPanelOpen((prev) => !prev)
            }
            hasUnreadNotifications={unreadCount > 0}
          />
        }
        bottomNavigation={<BottomNavigation />}
        overlay={
          isNotificationPanelOpen && (
            <NotificationPanel
              isLoading={notificationsLoading}
              loadError={notificationsLoadError}
              onRetry={retryNotifications}
              totalUnreadCount={unreadCount}
              notifications={notifications}
              onClose={() => setIsNotificationPanelOpen(false)}
              onNotificationClick={handleNotificationClick}
              onMarkAllAsRead={markAllAsRead}
              onNotificationDelete={handleNotificationDelete}
            />
          )
        }
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
            "flex h-full w-[312px] max-w-[calc(100vw-48px)] flex-col",
            "border-l border-border-default bg-surface px-xl pb-xl pt-lg shadow-lg",
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

          <div className="mt-xl flex flex-1 flex-col gap-xl">
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

            <section className="space-y-sm">
              <p className="font-sans text-caption-12-bold text-text-tertiary">
                {menu("permissions")}
              </p>
              <div className="divide-y divide-border-default overflow-hidden rounded-lg border border-border-default bg-surface">
                <PermissionSettingRow
                  icon={MapPin}
                  label={menu("locationPermission")}
                  description={menu(`permissionState.${locationPermission}`)}
                  checked={locationPermission === "granted"}
                  onChange={toggleLocationPermission}
                />
                <PermissionSettingRow
                  icon={Bell}
                  label={menu("notificationPermission")}
                  description={menu(
                    `permissionState.${notificationPermission === "default" ? "prompt" : notificationPermission}`,
                  )}
                  checked={notificationPermission === "granted"}
                  onChange={() => void toggleNotificationPermission()}
                />
              </div>
            </section>

            {/* 설정과 구분되는 계정 액션은 메뉴 하단에 배치함 */}
            <div className="mt-auto flex flex-col gap-md">
              {accessToken && (
                <LogoutButton
                  label={menu("logout")}
                  loadingLabel={menu("loggingOut")}
                  loading={isPendingLogout}
                  onClick={() => requestLogout()}
                />
              )}
            </div>
          </div>
        </aside>
      </div>
      {permissionToast && (
        <FloatingToast message={permissionToast} actionLabel={null} />
      )}
    </>
  );
}

function PermissionSettingRow({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: typeof MapPin;
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex min-h-[64px] items-center gap-md px-md py-sm">
      <span className="flex size-[32px] shrink-0 items-center justify-center rounded-sm bg-brand-soft text-icon-brand">
        <Icon aria-hidden="true" size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-sans text-label-14-bold text-text-primary">
          {label}
        </span>
        <span className="mt-2xs block font-sans text-micro-11-regular text-text-tertiary">
          {description}
        </span>
      </span>
      <Switch
        checked={checked}
        onChange={onChange}
        aria-label={label}
        className="shrink-0"
      />
    </div>
  );
}
