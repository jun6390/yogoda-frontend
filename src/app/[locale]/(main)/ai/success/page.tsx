"use client";

import { useTranslations } from "next-intl";

import { PageContainer } from "@/components/layout/PageContainer";
import { Link } from "@/i18n/navigation";
import { PlanSuccessContent } from "@/components/plan/PlanSuccessContent";

export default function PlanSuccessPage() {
  const t = useTranslations("PlanSuccess");

  return (
    <PageContainer className="flex min-h-full flex-col items-center justify-center">
      <div className="w-full max-w-[360px]">
        <PlanSuccessContent
          variant="page"
          actions={
            <div className="flex flex-col gap-sm">
              <Link
                href="/"
                className="flex h-[52px] w-full items-center justify-center rounded-lg bg-action-primary font-sans text-label-14-bold text-text-on-primary transition-colors hover:bg-action-primary-hover"
              >
                {t("goHome")}
              </Link>
              <Link
                href="/ai"
                className="flex h-[44px] w-full items-center justify-center rounded-lg font-sans text-label-14-bold text-text-secondary hover:text-text-primary"
              >
                {t("backToChat")}
              </Link>
            </div>
          }
        />
      </div>
    </PageContainer>
  );
}
