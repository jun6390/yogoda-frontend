"use client";

import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/Badge/Badge";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { ApiError } from "@/lib/api/client";
import { getActivePrompt } from "@/lib/api/prompt";
import { formatDateTime } from "@/lib/admin/format";

export function PromptManagementContent() {
  const {
    data: prompt,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin", "prompts", "active"],
    queryFn: getActivePrompt,
  });

  return (
    <div className="p-2xl">
      <h1 className="font-sans text-title-24-bold text-text-primary">
        프롬프트 관리
      </h1>
      <p className="mt-sm font-sans text-body-14-regular text-text-secondary">
        AI 추천 상담의 시스템 프롬프트를 수정하고 버전별 성과를 확인하세요
      </p>

      <section className="mt-xl rounded-lg border border-border-default bg-surface p-lg">
        <div className="flex items-center justify-between gap-md">
          <div className="flex items-center gap-sm">
            <h2 className="font-sans text-title-18-bold text-text-primary">
              현재 적용 중인 프롬프트
            </h2>
            {prompt && <Badge variant="accent">{prompt.version} 운영중</Badge>}
          </div>

          {prompt && (
            <p className="shrink-0 font-sans text-caption-12-regular text-text-tertiary">
              최종 배포 {formatDateTime(prompt.deployedAt)} ·{" "}
              {prompt.deployedBy}
            </p>
          )}
        </div>

        <div className="mt-lg">
          {isPending && (
            <p className="font-sans text-body-14-regular text-text-secondary">
              불러오는 중이에요...
            </p>
          )}

          {isError && (
            <ErrorState
              title="프롬프트를 불러오지 못했어요"
              description={
                error instanceof ApiError ? error.message : undefined
              }
              retryLabel="다시 시도"
              onRetry={() => refetch()}
            />
          )}

          {prompt && (
            <>
              <textarea
                readOnly
                value={prompt.content}
                className="h-[280px] w-full resize-none rounded-md border border-border-default bg-background p-md font-sans text-body-14-regular text-text-primary"
              />

              <p className="mt-sm font-sans text-caption-12-regular text-text-tertiary">
                {prompt.charCount}자 · 전환율 {prompt.conversionRate}% ·{" "}
                {prompt.sessionCount.toLocaleString("ko-KR")}건 세션
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
