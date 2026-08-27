"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/Badge/Badge";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { Button } from "@/components/admin/Button";
import { PromptVersionHistory } from "@/components/admin/PromptVersionHistory";
import { ApiError } from "@/lib/api/client";
import { createPrompt, getActivePrompt } from "@/lib/api/admin/prompt";
import { formatDateTime } from "@/lib/admin/format";
import { ADMIN_PROMPT_QUERY_KEYS } from "@/lib/admin/queryKeys";

export function PromptManagementContent() {
  const queryClient = useQueryClient();

  const {
    data: prompt,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ADMIN_PROMPT_QUERY_KEYS.active,
    queryFn: getActivePrompt,
  });

  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [deployedMessage, setDeployedMessage] = useState<string | null>(null);

  // prompt?.versionId로 초기화하면, 다른 탭 갔다 왔을 때 TanStack Query 캐시가
  // 첫 렌더부터 데이터를 즉시 채워줘서 아래 동기화 조건이 처음부터 거짓이 되어버림
  // (그러면 content가 절대 채워지지 않음). 항상 값이 달라지는 상태로 시작해야 함
  const [syncedVersionId, setSyncedVersionId] = useState<string | undefined>(
    undefined,
  );

  /*
   * conversionRate 같은 통계값은 배경에서 계속 refetch되며 바뀔 수 있어서
   * prompt 객체 전체가 아니라 versionId가 바뀔 때만 편집 중인 값을 리셋함
   * (그렇지 않으면 입력 중에 통계 갱신만으로 작성 중이던 내용이 날아감)
   * effect 대신 렌더링 중 상태 조정 패턴을 씀 (setState-in-effect 경고 회피)
   */
  if (prompt && prompt.versionId !== syncedVersionId) {
    setSyncedVersionId(prompt.versionId);
    setContent(prompt.content);
    setSummary("");
    setDeployedMessage(null);
  }

  const deployMutation = useMutation({
    mutationFn: createPrompt,
    onSuccess: (data) => {
      setDeployedMessage(`${data.version} 버전으로 배포됐어요.`);
      queryClient.invalidateQueries({
        queryKey: ADMIN_PROMPT_QUERY_KEYS.active,
      });
      queryClient.invalidateQueries({
        queryKey: ADMIN_PROMPT_QUERY_KEYS.history,
      });
    },
  });

  const hasChanges = Boolean(prompt) && content !== prompt?.content;
  const canDeploy =
    hasChanges && summary.trim().length > 0 && !deployMutation.isPending;

  const handleReset = () => {
    if (!prompt) {
      return;
    }

    setContent(prompt.content);
    setSummary("");
    deployMutation.reset();
    setDeployedMessage(null);
  };

  const handleDeploy = () => {
    if (!canDeploy) {
      return;
    }

    setDeployedMessage(null);
    deployMutation.mutate({ content, summary: summary.trim() });
  };

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
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className="h-[280px] w-full resize-y rounded-md border border-border-default bg-background p-md font-sans text-body-14-regular text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
              />

              <input
                type="text"
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="수정 내용 요약을 입력하세요 (버전 히스토리에 표시돼요)"
                className="mt-md w-full rounded-md border border-border-default bg-background px-md py-sm font-sans text-body-14-regular text-text-primary placeholder:text-text-tertiary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
              />

              <div className="mt-md flex items-center justify-between gap-md">
                <p className="font-sans text-caption-12-regular text-text-tertiary">
                  {content.length}자 · 전환율 {prompt.conversionRate}% ·{" "}
                  {prompt.sessionCount.toLocaleString("ko-KR")}건 세션 · 저장 시
                  새 버전으로 즉시 배포돼요
                </p>

                <div className="flex shrink-0 items-center gap-sm">
                  <Button
                    variant="secondary"
                    disabled={!hasChanges || deployMutation.isPending}
                    onClick={handleReset}
                  >
                    되돌리기
                  </Button>

                  <Button
                    variant="primary"
                    loading={deployMutation.isPending}
                    loadingLabel="배포하는 중..."
                    disabled={!canDeploy}
                    onClick={handleDeploy}
                  >
                    저장하고 새 버전 배포
                  </Button>
                </div>
              </div>

              {deployMutation.isError && (
                <p className="mt-sm font-sans text-caption-12-regular text-error">
                  {deployMutation.error instanceof ApiError
                    ? deployMutation.error.message
                    : "배포 중 오류가 발생했어요."}
                </p>
              )}

              {deployedMessage && (
                <p className="mt-sm font-sans text-caption-12-regular text-success">
                  {deployedMessage}
                </p>
              )}
            </>
          )}
        </div>
      </section>

      <PromptVersionHistory />
    </div>
  );
}
