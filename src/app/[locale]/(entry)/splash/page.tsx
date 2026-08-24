"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { useRouter } from "@/i18n/navigation";
import { useAuthStore } from "@/stores/useAuthStore";

const SPLASH_DURATION = 1500;

export default function SplashPage() {
  const router = useRouter();
  const t = useTranslations("Splash");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      // 로그인 상태면 온보딩을 건너뛰고 바로 홈으로 이동함
      const { accessToken } = useAuthStore.getState();
      router.replace(accessToken ? "/" : "/onboarding");
    }, SPLASH_DURATION);

    return () => window.clearTimeout(timer);
  }, [router]);

  return (
    <section className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-background pb-[15%]">
      <div
        aria-hidden
        className="pointer-events-none absolute top-[6%] left-1/2 h-[340px] w-[340px] -translate-x-1/2 rounded-full bg-glow-accent opacity-80 blur-3xl"
      />

      <div className="relative flex flex-col items-center">
        <div className="h-[266px] w-[308px] motion-safe:animate-[splashPop_0.6s_cubic-bezier(0.34,1.56,0.64,1)_both]">
          <Image
            src="/yogoda-characters/splash-hello.png"
            alt=""
            width={308}
            height={266}
            className="h-[266px] w-[308px] object-contain drop-shadow-[0_10px_14px_rgba(224,20,133,0.16)]"
            priority
          />
        </div>

        <Image
          src="/yogoda-logo.svg"
          alt={t("logoAlt")}
          width={175}
          height={36}
          priority
          className="mt-xl motion-safe:animate-[splashFadeUp_0.5s_ease-out_0.2s_both]"
        />

        <p className="mt-md font-sans text-body-14-regular text-text-secondary motion-safe:animate-[splashFadeUp_0.5s_ease-out_0.35s_both]">
          {t("greeting")}
        </p>
      </div>
    </section>
  );
}
