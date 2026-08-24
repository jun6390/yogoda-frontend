"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/Badge/Badge";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { Button } from "@/components/admin/Button";
import { ApiError } from "@/lib/api/client";
import { activatePromptVersion, getPromptHistory } from "@/lib/api/prompt";
import { formatDateTime } from "@/lib/admin/format";
import { ADMIN_PROMPT_QUERY_KEYS } from "@/lib/admin/queryKeys";
import { cn } from "@/lib/utils";

export function PromptVersionHistory() {
  const queryClient = useQueryClient();

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ADMIN_PROMPT_QUERY_KEYS.history,
    queryFn: getPromptHistory,
  });

  const rollbackMutation = useMutation({
    mutationFn: activatePromptVersion,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ADMIN_PROMPT_QUERY_KEYS.active,
      });
      queryClient.invalidateQueries({
        queryKey: ADMIN_PROMPT_QUERY_KEYS.history,
      });
    },
  });

  const rollingBackVersionId = rollbackMutation.isPending
    ? rollbackMutation.variables
    : undefined;

  const handleRollback = (version: string, versionId: string) => {
    const confirmed = window.confirm(
      `${version} 버전으로 되돌릴까요?\n지금 즉시 사용자 앱에 반영돼요.`,
    );

    if (!confirmed) {
      return;
    }

    rollbackMutation.mutate(versionId);
  };

  return (
    <section className="mt-xl rounded-lg border border-border-default bg-surface p-lg">
      <h2 className="font-sans text-title-18-bold text-text-primary">
        버전 히스토리
      </h2>

      <div className="mt-lg">
        {isPending && (
          <p className="font-sans text-body-14-regular text-text-secondary">
            불러오는 중이에요...
          </p>
        )}

        {isError && (
          <ErrorState
            title="버전 히스토리를 불러오지 못했어요"
            description={error instanceof ApiError ? error.message : undefined}
            retryLabel="다시 시도"
            onRetry={() => refetch()}
          />
        )}

        {data && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="whitespace-nowrap px-sm py-sm font-sans text-caption-12-bold text-text-tertiary">
                    버전
                  </th>
                  <th className="whitespace-nowrap px-sm py-sm font-sans text-caption-12-bold text-text-tertiary">
                    배포 일시
                  </th>
                  <th className="px-sm py-sm font-sans text-caption-12-bold text-text-tertiary">
                    수정 내용 요약
                  </th>
                  <th className="whitespace-nowrap px-sm py-sm text-right font-sans text-caption-12-bold text-text-tertiary">
                    기간 전환율
                  </th>
                  <th className="whitespace-nowrap px-sm py-sm text-right font-sans text-caption-12-bold text-text-tertiary">
                    액션
                  </th>
                </tr>
              </thead>

              <tbody>
                {data.versions.map((version) => (
                  <tr
                    key={version.versionId}
                    className={cn(
                      "border-b border-border-default last:border-b-0",
                      version.isActive && "bg-brand-soft",
                    )}
                  >
                    <td className="whitespace-nowrap px-sm py-md font-sans text-label-14-bold text-text-primary">
                      <span className="flex items-center gap-xs">
                        {version.version}
                        {version.isActive && (
                          <Badge variant="accent">운영중</Badge>
                        )}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-sm py-md font-sans text-caption-13-regular text-text-secondary">
                      {formatDateTime(version.deployedAt)} ·{" "}
                      {version.deployedBy}
                    </td>

                    <td className="px-sm py-md font-sans text-caption-13-regular text-text-secondary">
                      {version.summary}
                    </td>

                    <td className="whitespace-nowrap px-sm py-md text-right font-sans text-label-14-bold text-text-primary">
                      {version.conversionRate}%
                      {version.conversionRateChange !== null && (
                        <span
                          className={cn(
                            "ml-xs font-sans text-caption-12-regular",
                            version.conversionRateChange >= 0
                              ? "text-success"
                              : "text-error",
                          )}
                        >
                          {version.conversionRateChange >= 0 ? "▲" : "▼"}{" "}
                          {Math.abs(version.conversionRateChange).toFixed(1)}
                          %p
                        </span>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-sm py-md text-right">
                      {version.isActive ? (
                        <span className="font-sans text-caption-12-regular text-text-tertiary">
                          현재 버전
                        </span>
                      ) : (
                        <Button
                          variant="text"
                          className="px-sm py-xs text-caption-12-bold"
                          loading={rollingBackVersionId === version.versionId}
                          loadingLabel="되돌리는 중..."
                          disabled={rollbackMutation.isPending}
                          onClick={() =>
                            handleRollback(version.version, version.versionId)
                          }
                        >
                          이 버전으로 되돌리기
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rollbackMutation.isError && (
          <p className="mt-sm font-sans text-caption-12-regular text-error">
            {rollbackMutation.error instanceof ApiError
              ? rollbackMutation.error.message
              : "되돌리기 중 오류가 발생했어요."}
          </p>
        )}
      </div>
    </section>
  );
}
