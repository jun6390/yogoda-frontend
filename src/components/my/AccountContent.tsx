"use client";

import { useMutation } from "@tanstack/react-query";
import { ShieldCheck, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { SocialProviderIcon } from "@/components/auth/SocialProviderIcon";
import { MySubpageHeader } from "@/components/my/MySubpageHeader";
import { useRouter } from "@/i18n/navigation";
import { logout } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/useAuthStore";

export function AccountContent() {
  const t = useTranslations("MyAccount");
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const provider = user?.provider;
  const providerName = provider
    ? t(`providers.${provider}`)
    : t("unknownProvider");

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: () => {
      // 서버 응답과 무관하게 현재 기기의 로그인 정보는 정리함
      clearAuth();
      router.replace("/login");
    },
  });

  return (
    <div className="min-h-full bg-background pb-3xl">
      <MySubpageHeader title={t("title")} backLabel={t("back")} />

      <div className="space-y-xl px-page py-xl">
        <section className="rounded-lg bg-surface p-xl shadow-sm">
          <div className="flex items-center gap-md">
            <span className="flex size-[44px] items-center justify-center rounded-full bg-brand-soft text-icon-brand">
              <UserRound aria-hidden="true" size={22} />
            </span>
            <div className="min-w-0">
              <p className="font-sans text-caption-12-regular text-text-secondary">
                {t("account")}
              </p>
              <strong className="mt-xs block truncate font-sans text-title-18-bold text-text-primary">
                {user?.name ?? t("unknownUser")}
              </strong>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-sans text-label-14-bold text-text-primary">
            {t("security")}
          </h2>
          <div className="mt-md rounded-lg bg-surface px-lg shadow-sm">
            <div className="flex min-h-[64px] items-center gap-md">
              {provider ? (
                <SocialProviderIcon provider={provider} framed />
              ) : (
                <span className="flex size-[32px] shrink-0 items-center justify-center rounded-full bg-surface-subtle">
                  <ShieldCheck
                    aria-hidden="true"
                    className="text-icon-brand"
                    size={18}
                  />
                </span>
              )}
              <div>
                <strong className="block font-sans text-label-14-medium text-text-primary">
                  {t("socialLogin", { provider: providerName })}
                </strong>
                <span className="mt-xs block font-sans text-caption-12-regular text-text-secondary">
                  {t("socialLoginDescription")}
                </span>
              </div>
            </div>
          </div>
        </section>

        <LogoutButton
          label={t("logout")}
          loadingLabel={t("loggingOut")}
          loading={logoutMutation.isPending}
          onClick={() => logoutMutation.mutate()}
        />
      </div>
    </div>
  );
}
