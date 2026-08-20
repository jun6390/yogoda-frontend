"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/Button/Button";
import { useRouter } from "@/i18n/navigation";
import { completeOnboarding } from "@/lib/onboarding";
import { usePersonaStore } from "@/stores/personaStore";

export default function PersonaResultPage() {
  const t = useTranslations("PersonaResult");
  const router = useRouter();

  const answers = usePersonaStore((state) => state.answers);
  const analysisResult = usePersonaStore((state) => state.analysisResult);
  const isSkipped = usePersonaStore((state) => state.isSkipped);

  /*
   * Zustand persist가 localStorage의 설문 답변과 AI 분석 결과를 복원하기 전에
   * 결과 없음으로 판단하지 않도록 hydration 완료 여부를 확인함
   */
  const hasHydrated = useSyncExternalStore(
    (onStoreChange) => usePersonaStore.persist.onFinishHydration(onStoreChange),
    () => usePersonaStore.persist.hasHydrated(),
    () => false,
  );

  /*
   * 여섯 문항에 모두 답하고 AI 분석 결과까지 존재하는 경우에만 결과를 표시함
   * 설문을 건너뛰었거나 분석 결과가 없으면 AI 상담 화면으로 이동함
   */
  const isPersonaComplete = Object.values(answers).filter(Boolean).length === 6;

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (isSkipped || !isPersonaComplete || !analysisResult) {
      router.replace("/ai");
    }
  }, [analysisResult, hasHydrated, isPersonaComplete, isSkipped, router]);

  /*
   * AI가 반환한 사용 성향 점수를
   * 결과 화면의 공통 지표 UI에 표시함
   */
  const metrics = analysisResult
    ? [
        {
          key: "data",
          label: t("metrics.data"),
          value: analysisResult.scores.data,
        },
        {
          key: "content",
          label: t("metrics.content"),
          value: analysisResult.scores.content,
        },
        {
          key: "benefit",
          label: t("metrics.benefit"),
          value: analysisResult.scores.benefit,
        },
        {
          key: "price",
          label: t("metrics.price"),
          value: analysisResult.scores.price,
        },
      ]
    : [];

  /*
   * 결과 화면에서 사용자가 상담을 시작하면
   * Zustand에 저장된 페르소나 답변과 AI 분석 결과를 유지한 채 AI 화면으로 이동함
   */
  const handleStartChat = () => {
    /*
     * 페르소나 분석까지 완료했으므로 진입 과정을 완료 처리함
     * 이후 홈에 다시 접근해도 Splash로 돌아가지 않음
     */
    completeOnboarding();

    router.push("/ai");
  };

  if (!hasHydrated || !isPersonaComplete || isSkipped || !analysisResult) {
    return null;
  }

  return (
    <section className="flex min-h-full flex-col bg-background pt-[44px]">
      {/*
       * Figma의 모바일 상태바는 실제 웹 UI가 아니므로 제외함
       * 상태바 높이 44px만 레이아웃 여백으로 반영함
       */}
      <main className="flex flex-1 flex-col px-2xl pb-3xl">
        <p className="font-sans text-label-14-bold text-text-primary">
          {t("eyebrow")}
        </p>

        <div className="mt-3xl">
          <h1 className="font-sans text-title-24-bold text-text-primary">
            {analysisResult.title}
          </h1>

          <p className="mt-sm font-sans text-body-14-regular text-text-secondary">
            {analysisResult.description}
          </p>
        </div>

        <div className="mt-2xl">
          <p className="font-sans text-label-14-bold text-text-primary">
            {analysisResult.summary}
          </p>
        </div>

        <section className="mt-3xl">
          <div className="flex items-center justify-between">
            <h2 className="font-sans text-label-14-bold text-text-primary">
              {t("scoreTitle")}
            </h2>

            <span className="font-sans text-caption-12-regular text-text-tertiary">
              {t("scoreRange")}
            </span>
          </div>

          <div className="mt-lg flex flex-col gap-lg">
            {metrics.map((metric) => (
              <div key={metric.key}>
                <div className="flex items-center justify-between">
                  <span className="font-sans text-caption-12-regular text-text-secondary">
                    {metric.label}
                  </span>

                  <strong className="font-sans text-caption-12-bold text-text-brand">
                    {metric.value}
                  </strong>
                </div>

                <div className="mt-xs h-[4px] overflow-hidden rounded-full bg-border-default">
                  <div
                    className="h-full rounded-full bg-action-primary transition-[width]"
                    style={{ width: `${metric.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-3xl">
          <p className="font-sans text-caption-12-bold text-text-brand">
            {t("directionLabel")}
          </p>

          <h2 className="mt-xs font-sans text-title-16-bold text-text-primary">
            {analysisResult.direction}
          </h2>

          <p className="mt-sm font-sans text-body-14-regular text-text-secondary">
            {analysisResult.directionDescription}
          </p>
        </section>

        <div className="mt-auto pt-4xl">
          <Button className="h-[54px] w-full" onClick={handleStartChat}>
            {t("startChat")}
          </Button>
        </div>
      </main>
    </section>
  );
}
