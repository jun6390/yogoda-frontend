"use client";

import { Bot } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/Button/Button";
import { Link, useRouter } from "@/i18n/navigation";

export default function OnboardingPage() {
  const t = useTranslations("Onboarding");
  const router = useRouter();

  const handleRecommendPlan = () => {
    router.push("/permission");
  };

  return (
    <section className="flex min-h-full flex-col bg-background pt-[44px]">
      {/*
       * Figma의 모바일 상태바는 실제 웹 UI가 아니므로 제외함
       */}
      <div className="flex flex-col items-center pt-[160px]">
        <div className="flex size-[64px] items-center justify-center rounded-full border border-action-primary/10 bg-surface shadow-[0_8px_12px_rgb(0_0_0_/_4%)]">
          <Bot
            aria-hidden="true"
            size={28}
            strokeWidth={1.8}
            className="text-action-primary"
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-md px-2xl pt-3xl text-center">
        <h1 className="w-full font-sans text-title-20-bold text-text-primary">
          {t("title")}
        </h1>

        <p className="w-full whitespace-pre-line font-sans text-body-14-regular text-text-secondary">
          {t("description")}
        </p>
      </div>

      <div className="px-xl pt-[56px]">
        <Button className="h-[54px] w-full" onClick={handleRecommendPlan}>
          {t("primaryAction")}
        </Button>
      </div>

      <div className="flex flex-col items-center gap-sm px-2xl pt-3xl">
        <p className="font-sans text-caption-13-regular text-text-secondary">
          {t("loginPrompt")}
        </p>

        <Link
          href="/login"
          className="font-sans text-caption-13-bold text-text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
        >
          {t("loginAction")}
        </Link>
      </div>

      <div className="flex-1" />

      <p className="px-2xl pb-4xl text-center font-sans text-caption-12-regular text-text-tertiary">
        {t("guestCaption")}
      </p>
    </section>
  );
}
