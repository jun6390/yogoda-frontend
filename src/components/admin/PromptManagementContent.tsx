"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/Badge/Badge";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { Button } from "@/components/admin/Button";
import { PromptCompareChat } from "@/components/admin/PromptCompareChat";
import { PromptTestChat } from "@/components/admin/PromptTestChat";
import { PromptVersionHistory } from "@/components/admin/PromptVersionHistory";
import { ApiError } from "@/lib/api/client";
import { createPrompt, getActivePrompt } from "@/lib/api/admin/prompt";
import { formatDateTime } from "@/lib/admin/format";
import { ADMIN_PROMPT_QUERY_KEYS } from "@/lib/admin/queryKeys";
import { cn } from "@/lib/utils";

type TestMode = "single" | "compare";
type PageView = "editor" | "history";

export function PromptManagementContent() {
  const queryClient = useQueryClient();
  const [testMode, setTestMode] = useState<TestMode>("single");
  const [pageView, setPageView] = useState<PageView>("editor");

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
        queryKey: ADMIN_PROMPT_QUERY_KEYS.history(),
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
    <div className="p-3xl">
      <h1 className="font-sans text-title-24-bold text-text-primary">
        프롬프트 관리
      </h1>
      <p className="mt-sm font-sans text-body-14-regular text-text-secondary">
        AI 추천 상담의 시스템 프롬프트를 수정하고 버전별 성과를 확인하세요
      </p>

      <div className="mt-lg flex w-fit gap-xs rounded-full bg-surface-subtle p-xs">
        <button
          type="button"
          onClick={() => setPageView("editor")}
          className={cn(
            "h-9 rounded-full px-lg font-sans text-label-14-bold transition-colors",
            pageView === "editor"
              ? "bg-surface text-text-primary shadow-sm"
              : "text-text-secondary",
          )}
        >
          프롬프트 편집
        </button>
        <button
          type="button"
          onClick={() => setPageView("history")}
          className={cn(
            "h-9 rounded-full px-lg font-sans text-label-14-bold transition-colors",
            pageView === "history"
              ? "bg-surface text-text-primary shadow-sm"
              : "text-text-secondary",
          )}
        >
          버전 히스토리
        </button>
      </div>

      {pageView === "editor" && (
        <section className="mt-2xl rounded-lg border border-border-default bg-surface p-2xl">
          <div className="flex items-center gap-sm">
            <h2 className="font-sans text-title-18-bold text-text-primary">
              현재 적용 중인 프롬프트
            </h2>
            {prompt && <Badge variant="accent">{prompt.version} 운영중</Badge>}
          </div>

          {prompt && (
            <p className="mt-sm font-sans text-caption-12-regular text-text-tertiary">
              최종 배포 {formatDateTime(prompt.deployedAt)} ·{" "}
              {prompt.deployedBy}
            </p>
          )}

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
              <div className="flex flex-col gap-2xl lg:flex-row">
                <div className="flex flex-1 flex-col gap-md">
                  <p className="flex h-11 shrink-0 items-center font-sans text-label-14-bold text-text-primary">
                    프롬프트 편집
                  </p>

                  <textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    className="min-h-45 w-full flex-1 resize-y rounded-md border border-border-default bg-background p-md font-sans text-body-14-regular text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
                  />

                  <input
                    type="text"
                    value={summary}
                    onChange={(event) => setSummary(event.target.value)}
                    placeholder="수정 내용 요약을 입력하세요 (버전 히스토리에 표시돼요)"
                    className="w-full rounded-md border border-border-default bg-background px-md py-sm font-sans text-body-14-regular text-text-primary placeholder:text-text-tertiary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-md">
                    <p className="font-sans text-caption-12-regular text-text-tertiary">
                      {content.length}자 · 전환율 {prompt.conversionRate}% ·{" "}
                      {prompt.sessionCount.toLocaleString("ko-KR")}건 세션 ·
                      저장 시 새 버전으로 즉시 배포돼요
                    </p>

                    <div className="flex shrink-0 items-center gap-sm">
                      <Button
                        variant="secondary"
                        className="h-[40px] rounded-md px-lg py-0 text-label-14-bold"
                        disabled={!hasChanges || deployMutation.isPending}
                        onClick={handleReset}
                      >
                        되돌리기
                      </Button>

                      <Button
                        variant="primary"
                        className="h-[40px] rounded-md px-lg py-0 text-label-14-bold"
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
                    <p className="font-sans text-caption-12-regular text-error">
                      {deployMutation.error instanceof ApiError
                        ? deployMutation.error.message
                        : "배포 중 오류가 발생했어요."}
                    </p>
                  )}

                  {deployedMessage && (
                    <p className="font-sans text-caption-12-regular text-success">
                      {deployedMessage}
                    </p>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-md">
                  <div className="flex gap-xs rounded-full bg-surface-subtle p-xs">
                    <button
                      type="button"
                      onClick={() => setTestMode("single")}
                      className={cn(
                        "h-9 flex-1 rounded-full font-sans text-label-14-bold transition-colors",
                        testMode === "single"
                          ? "bg-surface text-text-primary shadow-sm"
                          : "text-text-secondary",
                      )}
                    >
                      단일 테스트
                    </button>
                    <button
                      type="button"
                      onClick={() => setTestMode("compare")}
                      className={cn(
                        "h-9 flex-1 rounded-full font-sans text-label-14-bold transition-colors",
                        testMode === "compare"
                          ? "bg-surface text-text-primary shadow-sm"
                          : "text-text-secondary",
                      )}
                    >
                      버전 비교
                    </button>
                  </div>

                  <div className="sm:h-160">
                    {testMode === "single" ? (
                      <PromptTestChat />
                    ) : (
                      <PromptCompareChat
                        draftContent={content}
                        draftVersionLabel={prompt.version}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {pageView === "history" && <PromptVersionHistory />}
    </div>
  );
}
