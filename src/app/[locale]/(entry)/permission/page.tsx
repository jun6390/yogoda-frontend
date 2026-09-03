"use client";

import { Bell, ChevronLeft, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/Button/Button";
import { useRouter } from "@/i18n/navigation";

export default function PermissionPage() {
  const t = useTranslations("Permission");
  const router = useRouter();

  const handlePermissionSetup = async () => {
    const permissionRequests: Promise<unknown>[] = [];

    /*
     * 위치와 알림은 모두 선택 권한임
     * 권한을 거부하더라도 다음 온보딩 단계로 진행할 수 있도록 함
     */
    if ("geolocation" in navigator) {
      permissionRequests.push(
        new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve(),
            () => resolve(),
            {
              timeout: 5000,
            },
          );
        }),
      );
    }

    if ("Notification" in window && Notification.permission === "default") {
      permissionRequests.push(Notification.requestPermission());
    }

    await Promise.allSettled(permissionRequests);

    router.push("/persona");
  };

  const handleSkip = () => {
    router.push("/persona");
  };

  return (
    <section className="flex min-h-full flex-col bg-background pt-[44px]">
      {/*
       * Figma의 모바일 상태바는 실제 웹 UI가 아니므로 제외함
       */}
      <div>
        <header className="flex items-center justify-between px-2xl py-md">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label={t("back")}
            className="-m-[10px] flex size-touch items-center justify-center text-icon-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
          >
            <ChevronLeft aria-hidden="true" size={24} strokeWidth={2} />
          </button>
        </header>

        <main className="flex flex-col gap-[36px] px-2xl py-xl">
          <div className="flex flex-col gap-md">
            <h1 className="whitespace-pre-line font-sans text-title-24-bold text-text-primary">
              {t("title")}
            </h1>

            <p className="whitespace-pre-line font-sans text-body-14-regular text-text-secondary">
              {t("description")}
            </p>
          </div>

          <div className="flex flex-col gap-2xl">
            <div className="flex items-center gap-lg">
              <span className="flex size-[48px] shrink-0 items-center justify-center rounded-full bg-border-default text-icon-secondary">
                <MapPin aria-hidden="true" size={24} strokeWidth={2} />
              </span>

              <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                <p className="font-sans text-label-14-bold text-text-primary">
                  {t("locationTitle")}
                </p>

                <p className="font-sans text-caption-12-regular text-text-tertiary">
                  {t("locationDescription")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-lg">
              <span className="flex size-[48px] shrink-0 items-center justify-center rounded-full bg-border-default text-icon-secondary">
                <Bell aria-hidden="true" size={24} strokeWidth={2} />
              </span>

              <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                <p className="font-sans text-label-14-bold text-text-primary">
                  {t("notificationTitle")}
                </p>

                <p className="font-sans text-caption-12-regular text-text-tertiary">
                  {t("notificationDescription")}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      <footer className="mt-auto flex flex-col items-center gap-lg px-2xl pb-3xl">
        <Button className="h-[54px] w-full" onClick={handlePermissionSetup}>
          {t("primaryAction")}
        </Button>

        <button
          type="button"
          onClick={handleSkip}
          className="min-h-touch px-md font-sans text-label-14-medium text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
        >
          {t("skipAction")}
        </button>
      </footer>
    </section>
  );
}
